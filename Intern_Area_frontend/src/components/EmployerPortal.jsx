import React, { useState } from "react";
import { mockJobs } from "../data/mockData";

export default function EmployerPortal({
  user,
  applications,
  onUpdateAppStatus,
  onPostJob,
}) {
  const [activeTab, setActiveTab] = useState("ats"); // 'ats' or 'post'
  const [selectedApp, setSelectedApp] = useState(null); // Active application to review details
  
  // Job Post Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Internship");
  const [location, setLocation] = useState("");
  const [stipend, setStipend] = useState("");
  const [duration, setDuration] = useState("3 Months");
  const [skillsStr, setSkillsStr] = useState("");
  const [openings, setOpenings] = useState(1);
  const [description, setDescription] = useState("");

  // Stats calculation
  const totalOpenings = mockJobs.filter((j) => j.company === user.company).length + 1; // including new ones
  const totalApplicants = applications.length;
  const totalShortlisted = applications.filter((a) => a.status === "Shortlisted").length;
  const totalHired = applications.filter((a) => a.status === "Hired").length;

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!title || !location || !stipend || !description) return;
    
    const newJob = {
      id: `job-custom-${Date.now()}`,
      title,
      company: user.company || "My Brand",
      logoColor: "from-indigo-600 to-violet-700",
      type,
      location,
      isRemote: location.toLowerCase().includes("remote") || location.toLowerCase().includes("home"),
      duration,
      stipend: stipend + (type === "Internship" ? " / month" : " / year"),
      startDate: "Immediately",
      postedDate: "Just now",
      skills: skillsStr.split(",").map((s) => s.trim()).filter(Boolean),
      openings: parseInt(openings, 10),
      description,
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

    onPostJob(newJob);
    
    // Reset Form
    setTitle("");
    setLocation("");
    setStipend("");
    setSkillsStr("");
    setOpenings(1);
    setDescription("");
    setActiveTab("ats");
  };

  const handleStatusChange = (appId, newStatus) => {
    onUpdateAppStatus(appId, newStatus);
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp({ ...selectedApp, status: newStatus });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Recruiter Header Banner */}
      <div className="bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
          <svg className="w-96 h-96" fill="currentColor" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" />
          </svg>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 relative z-10">
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-outfit font-extrabold text-3xl text-primary-light shadow-lg">
            {user.company ? user.company.charAt(0) : "E"}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="font-outfit font-extrabold text-2xl sm:text-3xl tracking-tight">Employer Dashboard</h2>
            <p className="text-xs text-slate-300 mt-1 font-semibold">Logged in as {user.name} • Recruiter at {user.company}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4 text-xs font-semibold text-slate-200">
              <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-primary-light mr-1.5"></span>{totalOpenings} Active Listings</span>
              <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5"></span>{totalApplicants} Submissions</span>
              <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1.5"></span>{totalHired} Hired Roles</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 mb-8">
        <button
          onClick={() => setActiveTab("ats")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all mr-6 ${
            activeTab === "ats"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Applicant Tracker (ATS)
        </button>
        <button
          onClick={() => setActiveTab("post")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "post"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Post a New Opening
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "ats" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* List of submissions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-outfit font-bold text-slate-800 text-base">Incoming Candidate Profiles</h3>
                <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2.5 py-0.5 rounded-full">
                  {applications.length} total
                </span>
              </div>

              {applications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {applications.map((app) => {
                    const job = mockJobs.find((j) => j.id === app.jobId) || {
                      title: "Custom Position",
                    };
                    
                    return (
                      <div
                        key={app.id}
                        onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                        className={`p-6 hover:bg-slate-50 cursor-pointer transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                          selectedApp?.id === app.id ? "bg-slate-50/50" : ""
                        }`}
                      >
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{app.candidateName}</h4>
                          <p className="text-xs text-slate-400 font-semibold mb-1">{app.email}</p>
                          <p className="text-xs text-slate-500 font-medium">Applied for: <span className="text-primary font-semibold">{job.title}</span></p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">{app.appliedDate}</span>
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full ${
                              app.status === "Hired"
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
                <div className="p-8 text-center">
                  <span className="text-4xl block mb-2">📥</span>
                  <p className="text-slate-400 text-sm">No applications submitted yet by candidates.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recruiter review sidebar details */}
          <div className="lg:col-span-1">
            {selectedApp ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm sticky top-24 animate-slide-left space-y-6">
                <h3 className="font-outfit font-bold text-slate-800 text-base pb-3 border-b border-slate-50">
                  Profile Assessment
                </h3>

                {/* Candidate details */}
                <div>
                  <h4 className="font-bold text-base text-slate-800">{selectedApp.candidateName}</h4>
                  <p className="text-xs text-slate-400 font-medium">{selectedApp.email}</p>
                  <div className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[11px] text-slate-500">
                    <span className="font-bold block text-slate-600 mb-0.5">Applied Position:</span>
                    {mockJobs.find((j) => j.id === selectedApp.jobId)?.title}
                  </div>
                </div>

                {/* Cover Letter */}
                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Cover Details</h5>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{selectedApp.coverLetter || "No specific cover statement provided by candidate."}"
                  </p>
                </div>

                {/* Resume download mock button */}
                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Documents</h5>
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="flex items-center space-x-2 border border-slate-200 hover:border-primary/30 p-2.5 rounded-xl text-slate-600 hover:text-primary transition-colors text-xs font-semibold"
                      >
                        <span>📄</span>
                        <span className="truncate flex-1">{selectedApp.resumeUrl || "resume.pdf"}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-bold">PDF</span>
                      </a>
                      {selectedApp.customResumeDataUrl && (
                        <a
                          href={selectedApp.customResumeDataUrl}
                          download={selectedApp.customResumeName || "custom-resume.pdf"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-sm transition-all"
                        >
                          Open custom upload
                          {selectedApp.customResumeName ? ` (${selectedApp.customResumeName})` : ""}
                        </a>
                      )}
                      {selectedApp.customResumeName && !selectedApp.customResumeDataUrl && (
                        <p className="text-[10px] text-amber-600 mt-2 font-medium">
                          Candidate attached {selectedApp.customResumeName} — file preview unavailable (too large or read error).
                        </p>
                      )}
                    </div>

                {/* Recruiter Action Buttons */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(selectedApp.id, "Shortlisted")}
                      disabled={selectedApp.status === "Shortlisted" || selectedApp.status === "Hired"}
                      className="flex-1 text-center py-2.5 text-xs font-semibold rounded-xl transition-all border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-100 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      Shortlist Profile
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedApp.id, "Rejected")}
                      disabled={selectedApp.status === "Rejected" || selectedApp.status === "Hired"}
                      className="flex-1 text-center py-2.5 text-xs font-semibold rounded-xl transition-all border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 disabled:opacity-50"
                    >
                      Reject Profile
                    </button>
                  </div>
                  
                  {selectedApp.status !== "Hired" && (
                    <button
                      onClick={() => handleStatusChange(selectedApp.id, "Hired")}
                      className="w-full text-center py-3 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-sm transition-all"
                    >
                      ✓ Select & Hire Candidate
                    </button>
                  )}
                  {selectedApp.status === "Hired" && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center text-xs text-emerald-700 font-bold">
                      🎉 Active Employment Confirmed!
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400">
                <span className="text-4xl block mb-2">💼</span>
                <p className="text-xs">Click on any candidate card to read their cover letter, inspect resumes, and issue hiring calls.</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Job Publisher Form */
        <div className="max-w-3xl bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h3 className="font-outfit font-bold text-slate-800 text-lg mb-6">Create New Opportunity Listing</h3>

          <form onSubmit={handlePostSubmit} className="space-y-6">
            
            {/* Title & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Position Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Architect, Backend Developer Intern"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Opportunity Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                >
                  <option value="Internship">Internship</option>
                  <option value="Job">Job</option>
                </select>
              </div>
            </div>

            {/* Location & Compensation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore, Virtual Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">
                  {type === "Internship" ? "Stipend (₹ per month)" : "Salary (₹ per year)"}
                </label>
                <input
                  type="text"
                  placeholder={type === "Internship" ? "e.g. ₹20,000" : "e.g. ₹8,00,000 - ₹10,00,000"}
                  value={stipend}
                  onChange={(e) => setStipend(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Duration & Openings count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Duration / Profile</label>
                <input
                  type="text"
                  placeholder="e.g. 6 Months, Full-Time"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Total Openings Count</label>
                <input
                  type="number"
                  min="1"
                  value={openings}
                  onChange={(e) => setOpenings(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Core Required Skills */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Required Skills (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. React, Python, Adobe Suite"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                required
              />
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit font-outfit">Role Description & Context</label>
              <textarea
                rows="5"
                placeholder="Elaborate on daily requirements, specific teams context, and growth aspects..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:border-primary focus:bg-white transition-all resize-none"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md transition-all"
            >
              Publish Opportunity Listing
            </button>

          </form>
        </div>
      )}

    </div>
  );
}
