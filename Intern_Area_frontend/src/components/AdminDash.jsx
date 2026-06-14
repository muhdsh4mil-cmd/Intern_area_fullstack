import React, { useState, useMemo, useEffect } from "react";
import { mockJobs as seedJobs } from "../data/mockData";
import AdminResumeViewer from "./AdminResumeViewer";
import { SUPERHERO_AVATARS } from "../data/avatars";
import { fetchUsers, updateUserRole, deleteUser } from "../api/adminAPI";
import { getAllLoginHistory, deleteLoginEntry, clearAllLoginHistory } from "../api/authAPI";

const LOGO_GRADIENTS = [
  "from-blue-600 to-indigo-700",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-600 to-purple-700",
  "from-cyan-500 to-blue-600",
];

export default function AdminDash({
  currentUser,
  applications = [],
  jobs = [],
  onUpdateAppStatus,
  onDeleteApplication,
  onPostJob,
}) {
  const jobList = jobs.length ? jobs : seedJobs;
  const [selectedApp, setSelectedApp] = useState(null);
  const [activeTab, setActiveTab] = useState("applications"); // 'applications', 'users', 'post-job', 'post-internship'

  // Manage Users State
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({ total: 0, candidates: 0, employers: 0, admins: 0 });
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [feedback, setFeedback] = useState(null);

  // Login Audit State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditStatusFilter, setAuditStatusFilter] = useState("all");
  const [auditDeviceFilter, setAuditDeviceFilter] = useState("all");

  const triggerFeedback = (message, type = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const loadUsersData = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const data = await fetchUsers();
      setUsers(data.users || []);
      setUserStats(data.stats || { total: 0, candidates: 0, employers: 0, admins: 0 });
    } catch (err) {
      console.error("Error loading users:", err);
      setUsersError("Failed to fetch registered users. Please make sure the backend is active.");
    } finally {
      setUsersLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const data = await getAllLoginHistory();
      setAuditLogs(data);
    } catch (err) {
      console.error("Error loading audit logs:", err);
      setAuditError("Failed to fetch login audit logs. Please make sure the backend is active.");
    } finally {
      setAuditLoading(false);
    }
  };

  const handleDeleteAuditEntry = async (userId, entryId) => {
    if (!window.confirm("Delete this login record? This action cannot be undone.")) return;
    try {
      await deleteLoginEntry(userId, entryId);
      setAuditLogs((prev) => prev.filter((log) => log._id !== entryId));
      triggerFeedback("Login record deleted successfully.", "success");
    } catch (err) {
      console.error("Error deleting audit log entry:", err);
      triggerFeedback(err.response?.data?.message || "Failed to delete the log entry.", "error");
    }
  };

  const handleClearAllAuditLogs = async () => {
    if (!window.confirm("⚠️ This will permanently delete ALL login audit records for every user. This action cannot be undone. Continue?")) return;
    try {
      await clearAllLoginHistory();
      setAuditLogs([]);
      triggerFeedback("All login audit logs have been cleared.", "success");
    } catch (err) {
      console.error("Error clearing audit logs:", err);
      triggerFeedback(err.response?.data?.message || "Failed to clear audit logs.", "error");
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      loadUsersData();
    } else if (activeTab === "login-audit") {
      loadAuditLogs();
    }
  }, [activeTab]);

  const handleRoleChange = async (userId, newRole) => {
    if (currentUser && (currentUser._id === userId || currentUser.id === userId)) {
      triggerFeedback("Safety Warning: You cannot change your own admin role.", "error");
      return;
    }

    try {
      const updatedUser = await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: updatedUser.role } : u))
      );
      triggerFeedback(`Successfully updated role to ${newRole}!`, "success");
      
      // Update stats dynamically
      setUsers((allU) => {
        const candidates = allU.filter((u) => u.role === "candidate").length;
        const employers = allU.filter((u) => u.role === "employer").length;
        const admins = allU.filter((u) => u.role === "admin").length;
        setUserStats({
          total: allU.length,
          candidates,
          employers,
          admins,
        });
        return allU;
      });
    } catch (err) {
      console.error("Error updating role:", err);
      triggerFeedback(err.response?.data?.message || "Failed to update user role.", "error");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (currentUser && (currentUser._id === userId || currentUser.id === userId)) {
      triggerFeedback("Safety Warning: You cannot delete your own admin account.", "error");
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete the user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      triggerFeedback(`User "${userName}" has been deleted successfully.`, "success");
      
      // Update stats dynamically
      setUsers((allU) => {
        const candidates = allU.filter((u) => u.role === "candidate").length;
        const employers = allU.filter((u) => u.role === "employer").length;
        const admins = allU.filter((u) => u.role === "admin").length;
        setUserStats({
          total: allU.length,
          candidates,
          employers,
          admins,
        });
        return allU;
      });
    } catch (err) {
      console.error("Error deleting user:", err);
      triggerFeedback(err.response?.data?.message || "Failed to delete user.", "error");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.company && u.company.toLowerCase().includes(userSearch.toLowerCase()));
      
      const matchesRole =
        userRoleFilter === "all" || u.role === userRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

  const formatLastActive = (dateString, isOnline) => {
    if (isOnline) return "Active Now 🟢";
    if (!dateString) return "Never logged in";
    
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just active";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Job form state
  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobSalary, setJobSalary] = useState("");
  const [jobDuration, setJobDuration] = useState("Full-Time");
  const [jobOpenings, setJobOpenings] = useState(1);
  const [jobSkillsStr, setJobSkillsStr] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Internship form state
  const [internTitle, setInternTitle] = useState("");
  const [internCompany, setInternCompany] = useState("");
  const [internLocation, setInternLocation] = useState("");
  const [internStipend, setInternStipend] = useState("");
  const [internDuration, setInternDuration] = useState("6 Months");
  const [internOpenings, setInternOpenings] = useState(1);
  const [internSkillsStr, setInternSkillsStr] = useState("");
  const [internDescription, setInternDescription] = useState("");

  const resolveJob = (app) => {
    if (app && app.job && typeof app.job === "object") {
      return {
        title: app.job.title || "Listing removed or custom",
        company: app.job.company || "—",
        location: app.job.location || "—",
        stipend: app.job.salary || app.job.stipend || "—",
        type: app.job.type || "—",
      };
    }
    const jobId = app?.jobId || app?.job;
    return jobList.find((j) => j.id === jobId || j._id === jobId) || {
      title: "Listing removed or custom",
      company: "—",
      location: "—",
      stipend: "—",
      type: "—",
    };
  };

  const stats = useMemo(() => {
    const total = applications.length;
    const applied = applications.filter((a) => a.status === "Applied").length;
    const shortlisted = applications.filter((a) => a.status === "Shortlisted").length;
    const hired = applications.filter((a) => a.status === "Hired" || a.status === "Selected").length;
    return { total, applied, shortlisted, hired };
  }, [applications]);

  const handleStatusChange = (appId, newStatus) => {
    onUpdateAppStatus?.(appId, newStatus);
    if (selectedApp?.id === appId) {
      setSelectedApp((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleJobSubmit = (e) => {
    e.preventDefault();
    if (!jobTitle || !jobCompany || !jobLocation || !jobSalary || !jobDescription) return;

    const randomGradient = LOGO_GRADIENTS[Math.floor(Math.random() * LOGO_GRADIENTS.length)];
    const newJob = {
      id: `job-custom-${Date.now()}`,
      title: jobTitle,
      company: jobCompany,
      logoColor: randomGradient,
      type: "Job",
      location: jobLocation,
      isRemote: jobLocation.toLowerCase().includes("remote") || jobLocation.toLowerCase().includes("home"),
      duration: jobDuration,
      stipend: jobSalary.includes("year") ? jobSalary : `${jobSalary} / year`,
      startDate: "Immediately",
      postedDate: "Just now",
      skills: jobSkillsStr.split(",").map((s) => s.trim()).filter(Boolean),
      openings: parseInt(jobOpenings, 10) || 1,
      description: jobDescription,
      responsibilities: [
        "Take ownership of specific product modules and contribute to sprint goals.",
        "Ensure visual consistency and write performance-tuned, scalable code structures.",
        "Collaborate with multi-functional teams including design and testing."
      ],
      requirements: [
        "Sound understanding of core domain principles and relevant tech stacks.",
        "Strong analytical mind paired with clean problem-solving attitude.",
        "Effective communication skills."
      ]
    };

    onPostJob?.(newJob);

    // Reset Form
    setJobTitle("");
    setJobCompany("");
    setJobLocation("");
    setJobSalary("");
    setJobDuration("Full-Time");
    setJobOpenings(1);
    setJobSkillsStr("");
    setJobDescription("");
  };

  const handleInternshipSubmit = (e) => {
    e.preventDefault();
    if (!internTitle || !internCompany || !internLocation || !internStipend || !internDescription) return;

    const randomGradient = LOGO_GRADIENTS[Math.floor(Math.random() * LOGO_GRADIENTS.length)];
    const newInternship = {
      id: `job-custom-${Date.now()}`,
      title: internTitle,
      company: internCompany,
      logoColor: randomGradient,
      type: "Internship",
      location: internLocation,
      isRemote: internLocation.toLowerCase().includes("remote") || internLocation.toLowerCase().includes("home"),
      duration: internDuration,
      stipend: internStipend.includes("month") ? internStipend : `${internStipend} / month`,
      startDate: "Immediately",
      postedDate: "Just now",
      skills: internSkillsStr.split(",").map((s) => s.trim()).filter(Boolean),
      openings: parseInt(internOpenings, 10) || 1,
      description: internDescription,
      responsibilities: [
        "Collaborate with developers to build components and solve UI/UX bottlenecks.",
        "Assist in writing code coverage suites and document design decisions.",
        "Engage in periodic team reviews and iterate on code quality metrics."
      ],
      requirements: [
        "Familiarity with the specified technologies and frameworks.",
        "Highly eager to learn, implement feedback, and share progress updates.",
        "Good communication skills and availability for the internship term."
      ]
    };

    onPostJob?.(newInternship);

    // Reset Form
    setInternTitle("");
    setInternCompany("");
    setInternLocation("");
    setInternStipend("");
    setInternDuration("6 Months");
    setInternOpenings(1);
    setInternSkillsStr("");
    setInternDescription("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Header and Title */}
      <div className="mb-8">
        <h2 className="font-outfit font-extrabold text-3xl text-slate-800">Admin Control Center</h2>
        <p className="text-slate-500 text-sm mt-2">
          Manage system applications, post new job listings, active internships, or review registered platform users and activities.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 mb-8 gap-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("applications")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "applications"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          📂 View Applications
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          👥 Manage Users
        </button>
        <button
          onClick={() => setActiveTab("post-job")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "post-job"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          💼 Post Job
        </button>
        <button
          onClick={() => setActiveTab("post-internship")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "post-internship"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          🎓 Post Internship
        </button>
        <button
          onClick={() => setActiveTab("login-audit")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "login-audit"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          🔐 Login Audit
        </button>
      </div>

      {/* TAB CONTENT: Applications */}
      {activeTab === "applications" && (
        <div className="animate-fade-in space-y-8">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-2xl font-black text-slate-800 font-outfit">{stats.total}</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Total</p>
            </div>
            <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm">
              <span className="text-2xl font-black text-blue-600 font-outfit">{stats.applied}</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Applied</p>
            </div>
            <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-sm">
              <span className="text-2xl font-black text-amber-500 font-outfit">{stats.shortlisted}</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Shortlisted</p>
            </div>
            <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
              <span className="text-2xl font-black text-emerald-600 font-outfit">{stats.hired}</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Hired</p>
            </div>
          </div>

          {/* Applications list */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="font-outfit font-bold text-slate-800 text-base">All platform applications</h3>
                  <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2.5 py-0.5 rounded-full">
                    {applications.length} live
                  </span>
                </div>

                {applications.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {applications.map((app) => {
                      const job = resolveJob(app);
                      const active = selectedApp?.id === app.id;
                      return (
                        <div
                          key={app.id}
                          onClick={() => setSelectedApp(active ? null : app)}
                          className={`p-6 hover:bg-slate-50 cursor-pointer transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                            active ? "bg-slate-50/80" : ""
                          }`}
                        >
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{app.candidateName}</h4>
                            <p className="text-xs text-slate-400 font-semibold mb-1">{app.email}</p>
                            <p className="text-xs text-slate-500 font-medium">
                              Applied for:{" "}
                              <span className="text-primary font-semibold">{job.title}</span>
                              <span className="text-slate-400"> · {job.company}</span>
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">{app.appliedDate}</span>
                            <span
                              className={`text-xs font-bold px-3 py-1 rounded-full ${
                                app.status === "Hired" || app.status === "Selected"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : app.status === "Shortlisted"
                                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                                    : app.status === "Rejected"
                                      ? "bg-rose-50 text-rose-600 border border-rose-100"
                                      : "bg-blue-50 text-blue-600 border border-blue-100"
                              }`}
                            >
                              {app.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-10 text-center text-slate-400 text-sm">No applications yet.</div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              {selectedApp ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm sticky top-24 space-y-6">
                  <h3 className="font-outfit font-bold text-slate-800 text-base pb-3 border-b border-slate-50">
                    Application details
                  </h3>

                  {(() => {
                    const job = resolveJob(selectedApp);
                    return (
                      <>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role</p>
                          <p className="font-bold text-slate-800">{job.title}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {job.company} · {job.location}
                            {job.isRemote ? " · Remote" : ""}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">💰 {job.stipend}</p>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-700 font-outfit uppercase tracking-wider mb-2">
                            Candidate
                          </h4>
                          <p className="font-bold text-slate-800">{selectedApp.candidateName}</p>
                          <p className="text-xs text-slate-400">{selectedApp.email}</p>
                        </div>

                        <div>
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">
                            Cover letter & notes
                          </h5>
                          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                            {selectedApp.coverLetter || "No cover text submitted."}
                          </p>
                        </div>

                        <div>
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">
                            Resume
                          </h5>
                          <AdminResumeViewer application={selectedApp} />
                          {selectedApp.customResumeName && !selectedApp.customResumeDataUrl && (
                            <p className="text-[10px] text-amber-600 mt-2 font-medium">
                              Custom file {selectedApp.customResumeName} was too large for inline storage — ask the
                              candidate to re-upload under 2MB.
                            </p>
                          )}
                        </div>

                        <div>
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 font-outfit">
                            Timeline
                          </h5>
                          <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-1 before:bottom-1 before:w-0.5 before:bg-slate-200">
                            {(selectedApp.timeline || []).map((step, idx) => (
                              <div key={idx} className="relative text-xs">
                                <span className="absolute -left-[15px] top-1 w-2 h-2 rounded-full border-2 border-white bg-primary" />
                                <div className="flex justify-between gap-2">
                                  <span className="font-bold text-slate-800">{step.status}</span>
                                  <span className="text-[10px] text-slate-400 shrink-0">{step.date}</span>
                                </div>
                                <p className="text-slate-500 mt-0.5">{step.note}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 space-y-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(selectedApp.id, "Shortlisted")}
                              disabled={
                                selectedApp.status === "Shortlisted" ||
                                selectedApp.status === "Hired" ||
                                selectedApp.status === "Selected"
                              }
                              className="flex-1 text-center py-2.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-45 cursor-pointer"
                            >
                              Shortlist
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(selectedApp.id, "Rejected")}
                              disabled={selectedApp.status === "Rejected" || selectedApp.status === "Hired"}
                              className="flex-1 text-center py-2.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-45 cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                          {selectedApp.status !== "Hired" && selectedApp.status !== "Selected" && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(selectedApp.id, "Hired")}
                              className="w-full py-3 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl cursor-pointer"
                            >
                              Mark hired
                            </button>
                          )}
                          <div className="pt-2 border-t border-slate-100/60">
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this application? This action cannot be undone.")) {
                                  onDeleteApplication?.(selectedApp.id);
                                  setSelectedApp(null);
                                }
                              }}
                              className="w-full py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              🗑️ Delete Application
                            </button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-sm">
                  Select an application to read the full cover letter, timeline, and update status.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Manage Users */}
      {activeTab === "users" && (
        <div className="animate-fade-in space-y-8">
          
          {/* Feedback banner */}
          {feedback && (
            <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between shadow-sm animate-slide-left ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                : "bg-rose-50 border-rose-100 text-rose-800"
            }`}>
              <div className="flex items-center gap-2">
                <span>{feedback.type === "success" ? "🎉" : "⚠️"}</span>
                <p>{feedback.message}</p>
              </div>
              <button 
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
              <span className="text-3xl font-black text-slate-800 font-outfit block">{userStats.total}</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Total Registered
              </p>
            </div>
            <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
              <span className="text-3xl font-black text-blue-600 font-outfit block">{userStats.candidates}</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Candidates
              </p>
            </div>
            <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
              <span className="text-3xl font-black text-emerald-600 font-outfit block">{userStats.employers}</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Recruiters
              </p>
            </div>
            <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
              <span className="text-3xl font-black text-purple-600 font-outfit block">{userStats.admins}</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> System Admins
              </p>
            </div>
          </div>

          {/* Search, Filter and Table Container */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            
            {/* Table Header / Filters bar */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/40">
              <div>
                <h3 className="font-outfit font-extrabold text-slate-800 text-base">Users accounts directory</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Filter, search, adjust role authorizations, or purge authenticated profiles.</p>
              </div>

              {/* Refresh button */}
              <button
                onClick={loadUsersData}
                disabled={usersLoading}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                🔄 {usersLoading ? "Refreshing..." : "Refresh directory"}
              </button>
            </div>

            {/* Inputs & Pills */}
            <div className="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Search Bar */}
              <div className="relative md:col-span-2">
                <input
                  type="text"
                  placeholder="Search users by name, email, or company..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-2xl py-2.5 pl-4 pr-10 outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 text-xs font-medium transition-all"
                />
                <span className="absolute right-3.5 top-3.5 text-slate-400">
                  🔍
                </span>
              </div>

              {/* Role filter pills */}
              <div className="flex flex-wrap gap-2 md:col-span-1 justify-start md:justify-end">
                {[
                  { key: "all", label: "All" },
                  { key: "candidate", label: "Candidates" },
                  { key: "employer", label: "Recruiters" },
                  { key: "admin", label: "Admins" }
                ].map((pill) => (
                  <button
                    key={pill.key}
                    onClick={() => setUserRoleFilter(pill.key)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-xl transition-all cursor-pointer ${
                      userRoleFilter === pill.key
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* User Directory Content */}
            {usersLoading ? (
              <div className="p-16 text-center space-y-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Synchronizing platform database...</p>
              </div>
            ) : usersError ? (
              <div className="p-16 text-center max-w-md mx-auto space-y-4">
                <span className="text-3xl block">⚠️</span>
                <p className="text-sm font-semibold text-slate-700">{usersError}</p>
                <button
                  onClick={loadUsersData}
                  className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  Retry loading directory
                </button>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="space-y-4">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">
                        <th className="py-4 px-6">User profile</th>
                        <th className="py-4 px-6">Joined Date</th>
                        <th className="py-4 px-6">Session activity</th>
                        <th className="py-4 px-6">Platform role authorization</th>
                        <th className="py-4 px-6 text-right">Administrative Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {filteredUsers.map((item) => {
                        const isSelf = currentUser && (currentUser._id === item._id || currentUser.id === item._id);
                        const isAdminProtected = item.role === "admin";
                        
                        return (
                          <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                            
                            {/* Profile */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                {/* Avatar container with online dot */}
                                <div className="relative w-10 h-10 shrink-0 rounded-full bg-slate-100 border border-slate-200 overflow-visible flex items-center justify-center">
                                  {item.avatar && SUPERHERO_AVATARS[item.avatar] ? (
                                    <div className="w-full h-full p-0.5 rounded-full overflow-hidden">
                                      {SUPERHERO_AVATARS[item.avatar].svg}
                                    </div>
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-slate-300 rounded-full flex items-center justify-center font-bold text-slate-600 text-sm">
                                      {item.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  
                                  {/* Glowing status dot */}
                                  <span className={`absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                                    item.isOnline ? "bg-emerald-500" : "bg-slate-300"
                                  }`}>
                                    {item.isOnline && (
                                      <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
                                    )}
                                  </span>
                                </div>

                                <div>
                                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                    {item.name} {isSelf && <span className="bg-slate-100 text-slate-500 font-bold text-[8px] px-1.5 py-0.5 rounded-md uppercase">You</span>}
                                  </h4>
                                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{item.email}</p>
                                  {item.company && (
                                    <p className="text-[9px] text-emerald-600 font-bold uppercase mt-0.5">🏢 {item.company}</p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Joined date */}
                            <td className="py-4 px-6 text-slate-500 font-medium">
                              {new Date(item.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>

                            {/* Session activity */}
                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  item.isOnline 
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                    : "bg-slate-100 text-slate-400"
                                }`}>
                                  {formatLastActive(item.lastLogin, item.isOnline)}
                                </span>
                                <p className="text-[10px] text-slate-400 font-medium pl-1.5 mt-1">
                                  🔢 Logins: <span className="text-slate-700 font-bold">{item.loginCount || 1}</span>
                                </p>
                              </div>
                            </td>

                            {/* Role badges & selection */}
                            <td className="py-4 px-6">
                              {isSelf ? (
                                <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                                  🔑 System Owner (Admin)
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                    item.role === "admin"
                                      ? "bg-purple-50 text-purple-600 border border-purple-100"
                                      : item.role === "employer"
                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                        : "bg-blue-50 text-blue-600 border border-blue-100"
                                  }`}>
                                    {item.role === "employer" ? "Recruiter" : item.role}
                                  </span>
                                  
                                  <select
                                    value={item.role}
                                    onChange={(e) => handleRoleChange(item._id, e.target.value)}
                                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl px-2 py-1 text-[10px] font-bold text-slate-600 outline-none cursor-pointer transition-all shrink-0"
                                  >
                                    <option value="candidate">Candidate</option>
                                    <option value="employer">Recruiter</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                </div>
                              )}
                            </td>

                            {/* Delete */}
                            <td className="py-4 px-6 text-right">
                              {isSelf ? (
                                <span className="text-[9px] text-slate-400 font-bold uppercase select-none tracking-wide italic pr-2">
                                  Secured Account 🔒
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(item._id, item.name)}
                                  className={`p-2.5 rounded-xl border border-rose-100 hover:border-rose-300 bg-rose-50/40 hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-all cursor-pointer ${
                                    isAdminProtected ? "opacity-30 cursor-not-allowed" : ""
                                  }`}
                                  disabled={isAdminProtected}
                                  title={isAdminProtected ? "Administrator profiles are protected" : "Permanently delete user profile"}
                                >
                                  🗑️
                                </button>
                              )}
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile/Tablet Card List View */}
                <div className="block md:hidden space-y-4">
                  {filteredUsers.map((item) => {
                    const isSelf = currentUser && (currentUser._id === item._id || currentUser.id === item._id);
                    const isAdminProtected = item.role === "admin";
                    
                    return (
                      <div
                        key={item._id}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50 transition-all space-y-4 text-xs shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            {/* Avatar container with online dot */}
                            <div className="relative w-11 h-11 shrink-0 rounded-full bg-slate-100 border border-slate-200 overflow-visible flex items-center justify-center">
                              {item.avatar && SUPERHERO_AVATARS[item.avatar] ? (
                                <div className="w-full h-full p-0.5 rounded-full overflow-hidden">
                                  {SUPERHERO_AVATARS[item.avatar].svg}
                                </div>
                              ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-slate-300 rounded-full flex items-center justify-center font-bold text-slate-600 text-sm">
                                  {item.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              
                              {/* Glowing status dot */}
                              <span className={`absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                                item.isOnline ? "bg-emerald-500" : "bg-slate-300"
                              }`}>
                                {item.isOnline && (
                                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
                                )}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                {item.name} {isSelf && <span className="bg-slate-100 text-slate-500 font-bold text-[8px] px-1.5 py-0.5 rounded-md uppercase">You</span>}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{item.email}</p>
                              {item.company && (
                                <p className="text-[9px] text-emerald-600 font-bold uppercase mt-0.5">🏢 {item.company}</p>
                              )}
                            </div>
                          </div>

                          {/* Delete Button */}
                          <div>
                            {isSelf ? (
                              <span className="text-[9px] text-slate-400 font-bold uppercase select-none tracking-wide italic">
                                Secured 🔒
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(item._id, item.name)}
                                className={`p-2.5 rounded-xl border border-rose-100 hover:border-rose-300 bg-rose-50/40 hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-all cursor-pointer ${
                                  isAdminProtected ? "opacity-30 cursor-not-allowed" : ""
                                }`}
                                disabled={isAdminProtected}
                                title={isAdminProtected ? "Administrator profiles are protected" : "Permanently delete user profile"}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Middle Info Row */}
                        <div className="grid grid-cols-2 gap-4 pt-1.5 text-slate-600">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Joined Date</span>
                            <span className="font-semibold text-slate-700">
                              {new Date(item.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Session Activity</span>
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                item.isOnline 
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                  : "bg-slate-100 text-slate-400"
                              }`}>
                                {formatLastActive(item.lastLogin, item.isOnline)}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">Logins: <strong className="text-slate-700 font-bold">{item.loginCount || 1}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Role Selector Row */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Platform Role Authorization</span>
                          {isSelf ? (
                            <span className="text-[10px] font-extrabold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg border border-purple-100 w-fit">
                              🔑 Owner (Admin)
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                item.role === "admin"
                                  ? "bg-purple-50 text-purple-600 border border-purple-100"
                                  : item.role === "employer"
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    : "bg-blue-50 text-blue-600 border border-blue-100"
                              }`}>
                                {item.role === "employer" ? "Recruiter" : item.role}
                              </span>
                              
                              <select
                                value={item.role}
                                onChange={(e) => handleRoleChange(item._id, e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-[10px] font-bold text-slate-600 outline-none cursor-pointer transition-all shrink-0"
                              >
                                <option value="candidate">Candidate</option>
                                <option value="employer">Recruiter</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-16 text-center text-slate-400 font-medium">
                No users found matching search and filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Post Job */}
      {activeTab === "post-job" && (
        <div className="max-w-3xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm animate-fade-in mx-auto">
          <div className="mb-6">
            <h3 className="font-outfit font-bold text-slate-800 text-lg">Post a New Job Opening</h3>
            <p className="text-slate-400 text-xs mt-1">Fill out the form below to list a full-time or part-time job position on the board.</p>
          </div>

          <form onSubmit={handleJobSubmit} className="space-y-6">
            
            {/* Title & Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Position Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Full Stack React Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Google, Amazon, Nestle"
                  value={jobCompany}
                  onChange={(e) => setJobCompany(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Location & Compensation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore, Remote (Work from Home)"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit font-outfit">Salary / Compensation (₹ per year)</label>
                <input
                  type="text"
                  placeholder="e.g. ₹12,00,000 - ₹15,00,000"
                  value={jobSalary}
                  onChange={(e) => setJobSalary(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Duration / Type & Openings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Job Duration / Type</label>
                <input
                  type="text"
                  placeholder="e.g. Full-Time, Part-Time"
                  value={jobDuration}
                  onChange={(e) => setJobDuration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Total Openings Count</label>
                <input
                  type="number"
                  min="1"
                  value={jobOpenings}
                  onChange={(e) => setJobOpenings(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Core Required Skills */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Required Skills (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. React, Node.js, AWS, JavaScript"
                value={jobSkillsStr}
                onChange={(e) => setJobSkillsStr(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                required
              />
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Job Description & Requirements</label>
              <textarea
                rows="5"
                placeholder="Detail key daily tasks, responsibilities, technology stacks, and qualifications needed..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:border-primary focus:bg-white transition-all resize-none text-slate-800"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md transition-all cursor-pointer"
            >
              Publish Job Listing
            </button>

          </form>
        </div>
      )}

      {/* TAB CONTENT: Post Internship */}
      {activeTab === "post-internship" && (
        <div className="max-w-3xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm animate-fade-in mx-auto">
          <div className="mb-6">
            <h3 className="font-outfit font-bold text-slate-800 text-lg">Post a New Internship</h3>
            <p className="text-slate-400 text-xs mt-1">Fill out the form below to list a temporary or student internship opening on the board.</p>
          </div>

          <form onSubmit={handleInternshipSubmit} className="space-y-6">
            
            {/* Title & Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Internship Title</label>
                <input
                  type="text"
                  placeholder="e.g. Backend Development Intern"
                  value={internTitle}
                  onChange={(e) => setInternTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon, Stripe, Microsoft"
                  value={internCompany}
                  onChange={(e) => setInternCompany(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Location & Compensation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai, Remote (Work from Home)"
                  value={internLocation}
                  onChange={(e) => setInternLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit font-outfit">Stipend (₹ per month)</label>
                <input
                  type="text"
                  placeholder="e.g. ₹25,000"
                  value={internStipend}
                  onChange={(e) => setInternStipend(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Duration & Openings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Internship Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 3 Months, 6 Months"
                  value={internDuration}
                  onChange={(e) => setInternDuration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit font-outfit">Total Openings Count</label>
                <input
                  type="number"
                  min="1"
                  value={internOpenings}
                  onChange={(e) => setInternOpenings(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Core Required Skills */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Required Skills (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. Node.js, Express, SQL, Git"
                value={internSkillsStr}
                onChange={(e) => setInternSkillsStr(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                required
              />
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit font-outfit font-outfit font-outfit">Internship Description & Details</label>
              <textarea
                rows="5"
                placeholder="Elaborate on learning outcomes, daily assistance requirements, specific teams context..."
                value={internDescription}
                onChange={(e) => setInternDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:border-primary focus:bg-white transition-all resize-none text-slate-800"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md transition-all cursor-pointer"
            >
              Publish Internship Listing
            </button>

          </form>
        </div>
      )}

      {/* TAB CONTENT: Login Audit */}
      {activeTab === "login-audit" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm animate-fade-in space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-outfit font-bold text-slate-800 text-lg flex items-center">
                <span className="mr-2 text-xl">🔐</span> System Login Audit Log
              </h3>
              <p className="text-slate-400 text-xs mt-1 font-sans">
                Review platform authentication attempts across all accounts and environments.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {auditLogs.length > 0 && (
                <button
                  onClick={handleClearAllAuditLogs}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer transition-all"
                  title="Clear all login history records"
                >
                  🗑️ Clear All Logs
                </button>
              )}
              <button
                onClick={loadAuditLogs}
                disabled={auditLoading}
                className="p-2 text-slate-500 hover:text-primary rounded-xl hover:bg-slate-50 border border-slate-200 shadow-sm transition-all"
                title="Refresh audit logs"
              >
                <svg className={`w-4 h-4 ${auditLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-outfit">Search User / IP</label>
              <input
                type="text"
                placeholder="Search by name, email, IP..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary focus:bg-white transition-all text-slate-800 font-sans"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-outfit">Filter by Status</label>
              <select
                value={auditStatusFilter}
                onChange={(e) => setAuditStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary focus:bg-white transition-all text-slate-800 font-sans font-semibold cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Successful">Successful</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-outfit">Filter by Device</label>
              <select
                value={auditDeviceFilter}
                onChange={(e) => setAuditDeviceFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary focus:bg-white transition-all text-slate-800 font-sans font-semibold cursor-pointer"
              >
                <option value="all">All Devices</option>
                <option value="Desktop">Desktop</option>
                <option value="Laptop">Laptop</option>
                <option value="Tablet">Tablet</option>
                <option value="Mobile">Mobile</option>
              </select>
            </div>
          </div>

          {/* Table / List */}
          {auditLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              Retrieving system audit logs...
            </div>
          ) : auditError ? (
            <div className="py-8 text-center text-rose-500 text-xs font-semibold bg-rose-50 rounded-xl border border-rose-100 font-sans">
              ⚠️ {auditError}
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-sans italic">
              No login logs recorded yet in the database.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Device</th>
                      <th className="py-3 px-4">Browser & OS</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                    {auditLogs
                      .filter((log) => {
                        const user = log.user || {};
                        const searchStr = `${user.name || ""} ${user.email || ""} ${user.uniqueId || ""} ${log.ipAddress || ""}`.toLowerCase();
                        const matchesSearch = searchStr.includes(auditSearch.toLowerCase());
                        const matchesStatus = auditStatusFilter === "all" || log.status === auditStatusFilter;
                        const matchesDevice = auditDeviceFilter === "all" || log.device === auditDeviceFilter;
                        return matchesSearch && matchesStatus && matchesDevice;
                      })
                      .map((item, idx) => (
                        <tr key={item._id || idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-sans">
                            {item.user ? (
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-[13px]">{item.user.name}</span>
                                <span className="text-[10px] text-slate-400 font-normal">{item.user.email}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Unknown User</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                            {new Date(item.timestamp).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="py-3.5 px-4">
                            {item.status === "Successful" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                Successful
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-sans text-slate-600">
                            {item.device === "Mobile" ? "📱 Phone" : item.device === "Tablet" ? "📟 Tablet" : item.device === "Laptop" ? "💻 Laptop" : "🖥️ Desktop"}
                          </td>
                          <td className="py-3.5 px-4 font-sans text-slate-500 font-normal">
                            {item.browser} <span className="text-slate-400">on</span> {item.os}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 font-normal">
                            {item.ipAddress}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteAuditEntry(item.user?._id, item._id)}
                              className="p-1.5 rounded-lg border border-rose-100 hover:border-rose-300 bg-rose-50/40 hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-all cursor-pointer"
                              title="Delete this log entry"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet Card List View */}
              <div className="block md:hidden space-y-3.5">
                {auditLogs
                  .filter((log) => {
                    const user = log.user || {};
                    const searchStr = `${user.name || ""} ${user.email || ""} ${user.uniqueId || ""} ${log.ipAddress || ""}`.toLowerCase();
                    const matchesSearch = searchStr.includes(auditSearch.toLowerCase());
                    const matchesStatus = auditStatusFilter === "all" || log.status === auditStatusFilter;
                    const matchesDevice = auditDeviceFilter === "all" || log.device === auditDeviceFilter;
                    return matchesSearch && matchesStatus && matchesDevice;
                  })
                  .map((item, idx) => (
                    <div key={item._id || idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-all space-y-3.5 text-xs shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-[13px]">{item.user?.name || "Unknown User"}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{item.user?.email || ""}</span>
                        </div>
                        {item.status === "Successful" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Successful
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                            Failed
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1.5 text-slate-600">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Device</span>
                          <span className="font-semibold">{item.device === "Mobile" ? "📱 Phone" : item.device === "Tablet" ? "📟 Tablet" : item.device === "Laptop" ? "💻 Laptop" : "🖥️ Desktop"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">IP Address</span>
                          <span className="font-mono text-[11px] text-slate-500 font-bold">{item.ipAddress || "Unknown"}</span>
                        </div>
                      </div>
                      <div className="pt-2.5 border-t border-slate-100/60 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                        <span className="font-mono">
                          {new Date(item.timestamp).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                        <span>
                          {item.browser} on {item.os}
                        </span>
                      </div>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteAuditEntry(item.user?._id, item._id)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl cursor-pointer transition-all"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Record
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
