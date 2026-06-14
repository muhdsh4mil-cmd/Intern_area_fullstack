import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HomeRecommendations from "./components/HomeRecommendations";
import Partners from "./components/Partners";
import JobSearch from "./components/JobSearch";
import CandidateDash from "./components/CandidateDash";
import EmployerPortal from "./components/EmployerPortal";
import Modals from "./components/Modals";
import AdminDash from "./components/AdminDash";
import EditResume from "./components/EditResume";
import Preferences from "./components/Preferences";
import MyApplications from "./components/MyApplications";
import Friends from "./components/Friends";
import Community from "./components/Community";
import Messages from "./components/Messages";
import ForgotPassword from "./components/ForgotPassword";
import PricingPlans from "./components/PricingPlans";
import { SUPERHERO_AVATARS } from "./data/avatars";
import { submitApplication, fetchMyApplications, fetchAllApplications, updateApplicationStatus as updateAppStatusAPI, deleteApplication as deleteAppAPI } from "./api/applicationsAPI";
import { createJob } from "./api/jobsAPI";
import { logoutUser, googleLogin as apiGoogleLogin, getMe, getBrowserInfo } from "./api/authAPI";
import { auth, googleProvider } from "./config/firebase";
import { signInWithPopup } from "firebase/auth";
import { useLanguage } from "./i18n/LanguageContext";
import { requestFrenchOTP, verifyFrenchOTP, updateLanguagePreference } from "./api/languageAPI";

import { mockJobs, mockCategories, initialApplications } from "./data/mockData";

const AUTH_MODAL_TYPES = new Set(["login", "register", "register-employer"]);

/** Logged-in users use workspace views; guests use the marketing landing page. */
function workspaceViewForUser(user) {
  if (!user) return "landing";
  if (user.role === "admin") return "admin";
  if (user.role === "employer") return "employer";
  return "dashboard";
}

export default function App() {
  const { language, setLanguage, t, syncLanguageFromUser } = useLanguage();
  const [currentView, setView] = useState("landing");
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allJobs, setAllJobs] = useState(mockJobs);
  const [applications, setApplications] = useState(initialApplications);
  const [toasts, setToasts] = useState([]);
  const [confettiActive, setConfettiActive] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedApplyJob, setSelectedApplyJob] = useState(null);
  const [resumeApplyReturnPending, setResumeApplyReturnPending] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  // Active chat friend ID — set when clicking Message from Friends page or navbar dropdown
  const [activeChatFriendId, setActiveChatFriendId] = useState(null);

  // ─── French OTP Modal State ────────────────────────────────────────────────────
  const [frenchOTPModalOpen, setFrenchOTPModalOpen] = useState(false);
  const [frenchOTPStep, setFrenchOTPStep] = useState("idle"); // 'idle' | 'sending' | 'enter' | 'verifying' | 'success' | 'error'
  const [frenchOTPValue, setFrenchOTPValue] = useState("");
  const [frenchOTPMaskedEmail, setFrenchOTPMaskedEmail] = useState("");
  const [frenchOTPError, setFrenchOTPError] = useState("");

  // Restore session from localStorage on app load
  useEffect(() => {
    const savedUser = localStorage.getItem("internarea_user");
    const savedToken = localStorage.getItem("internarea_token");
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Fetch fresh user data from backend to ensure we have latest fields (like uniqueId)
        getMe()
          .then((freshUser) => {
            // preserve the token
            const updatedUser = { ...freshUser, token: savedToken };
            setUser(updatedUser);
            localStorage.setItem("internarea_user", JSON.stringify(updatedUser));
            // Sync language from backend user profile
            syncLanguageFromUser(freshUser);
          })
          .catch((err) => {
            console.error("Failed to refresh user data", err);
          });
      } catch (e) {
        localStorage.removeItem("internarea_user");
        localStorage.removeItem("internarea_token");
      }
    }
  }, []);

  // Synchronize authentication state across multiple tabs dynamically
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "internarea_token" || e.key === "internarea_user") {
        window.location.reload();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  /** Keeps signed-in users off login/register modals until they log out */
  const openModal = (type) => {
    if (user && AUTH_MODAL_TYPES.has(type)) {
      return;
    }
    setActiveModal(type);
  };

  useEffect(() => {
    if (user && activeModal && AUTH_MODAL_TYPES.has(activeModal)) {
      setActiveModal(null);
    }
  }, [user, activeModal]);

  // Signed-in users stay on workspace (dashboard etc.), not the public landing hero
  useEffect(() => {
    if (user && currentView === "landing") {
      setView(workspaceViewForUser(user));
    }
  }, [user, currentView]);

  // Auto scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  // Normalize a single backend application object to the flat shape used by all frontend components
  const normalizeApp = (app) => {
    const candidate = app.candidate || {};
    return {
      ...app,
      id: app.id || app._id,
      // Flatten candidate fields so AdminDash / MyApplications can render them
      candidateName: app.candidateName || candidate.name || "Unknown",
      email: app.email || candidate.email || "",
      // Carry profileResumeData from candidate if present
      profileResumeData: app.profileResumeData || candidate.profileResumeData || null,
    };
  };

  // Fetch applications from the database when user is logged in
  useEffect(() => {
    if (!user) {
      setApplications([]);
      return;
    }
    const loadApplications = async () => {
      try {
        if (user.role === "admin" || user.role === "employer") {
          const data = await fetchAllApplications();
          setApplications((data || []).map(normalizeApp));
        } else if (user.role === "candidate") {
          const data = await fetchMyApplications();
          setApplications((data || []).map(normalizeApp));
        }
      } catch (err) {
        console.error("Failed to load applications from API:", err);
      }
    };
    loadApplications();
  }, [user]);

  // Toast Helper
  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };


  // Firebase Google Login Hook
  const handleFirebaseGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Sync with our backend
      const backendUser = await apiGoogleLogin({
        email: firebaseUser.email,
        name: firebaseUser.displayName || "Google User",
        avatar: firebaseUser.photoURL || "",
        browserInfo: getBrowserInfo()
      });

      localStorage.setItem("internarea_token", backendUser.token);
      localStorage.setItem("internarea_user", JSON.stringify(backendUser));
      setUser(backendUser);
      addToast(`Successfully authenticated as ${backendUser.name}!`, "success");
      setView("dashboard");
    } catch (error) {
      console.error("Firebase Login Error:", error);
      addToast("Failed to authenticate with Google. Please configure Firebase.", "error");
    }
  };

  // Credentials Auth Hook
  const handleAuthSubmit = (profile) => {
    const savedAvatar = localStorage.getItem(`avatar_${profile.email}`);
    const updatedProfile = savedAvatar ? { ...profile, avatar: savedAvatar } : profile;
    setUser(updatedProfile);
    addToast(`Successfully authenticated as ${updatedProfile.name}!`, "success");
    setView(updatedProfile.role === "admin" ? "admin" : updatedProfile.role === "employer" ? "employer" : "dashboard");
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      // Fail silently if not logged in on backend or token missing
    }
    setUser(null);
    localStorage.removeItem("internarea_token");
    localStorage.removeItem("internarea_user");
    addToast("Signed out successfully. Come back soon!", "info");
    setView("landing");
  };

  // ─── Language Change Handler ────────────────────────────────────────────────
  const handleLanguageChange = async (lang) => {
    if (lang === "fr") {
      // French requires OTP verification
      if (!user) {
        addToast("Please log in to enable French language verification.", "info");
        openModal("login");
        return;
      }
      setFrenchOTPModalOpen(true);
      setFrenchOTPStep("idle");
      setFrenchOTPValue("");
      setFrenchOTPError("");
      return;
    }
    // For all other languages — apply immediately
    setLanguage(lang);
    if (user) {
      try {
        await updateLanguagePreference({ language: lang });
      } catch (e) {
        // Non-critical — local preference still applied
      }
    }
  };

  const handleFrenchOTPSend = async () => {
    setFrenchOTPStep("sending");
    setFrenchOTPError("");
    try {
      const res = await requestFrenchOTP();
      setFrenchOTPMaskedEmail(res.email || "");
      setFrenchOTPStep("enter");
    } catch (err) {
      setFrenchOTPError(err.response?.data?.message || "Failed to send code. Please try again.");
      setFrenchOTPStep("error");
    }
  };

  const handleFrenchOTPVerify = async () => {
    if (frenchOTPValue.trim().length !== 6) {
      setFrenchOTPError("Please enter the complete 6-digit code.");
      return;
    }
    setFrenchOTPStep("verifying");
    setFrenchOTPError("");
    try {
      await verifyFrenchOTP({ otp: frenchOTPValue.trim() });
      setLanguage("fr");
      setFrenchOTPStep("success");
      addToast("🇫🇷 French language activated successfully!", "success");
      // Auto-close after 2 seconds
      setTimeout(() => {
        setFrenchOTPModalOpen(false);
        setFrenchOTPStep("idle");
      }, 2000);
    } catch (err) {
      setFrenchOTPError(err.response?.data?.message || "Invalid code. Please try again.");
      setFrenchOTPStep("enter");
    }
  };

  const returnToApplyModal = () => {
    setResumeApplyReturnPending(false);
    setView("jobs");
    setActiveModal("apply");
  };

  const handleEditResumeFromApply = () => {
    setResumeApplyReturnPending(true);
    setView("edit-resume");
    setActiveModal(null);
  };

  // Apply Action Initiator
  const handleApplyInitiate = (job) => {
    if (!user) {
      addToast("Please login or create an account to apply for openings.", "info");
      openModal("login");
      return;
    }
    if (user.role === "employer") {
      addToast("Recruiters cannot apply for listings.", "info");
      return;
    }
    // Check if already applied (handles populated backend job objects and local state job IDs)
    const alreadyApplied = applications.some((a) => {
      const targetJobId = a.jobId || (a.job && typeof a.job === "object" ? a.job._id : a.job);
      return targetJobId === job.id;
    });
    if (alreadyApplied) {
      addToast("You have already submitted an application for this position.", "info");
      return;
    }

    // Client-side plan limit check
    const PLAN_LIMITS = {
      free: 1,
      bronze: 3,
      silver: 5,
      gold: Infinity,
    };
    const plan = user.subscriptionPlan || "free";
    const limit = PLAN_LIMITS[plan] || 1;
    if (applications.length >= limit) {
      addToast(`You have reached your ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan limit of ${limit} application(s) this month. Go to Plans to upgrade! 🚀`, "info");
      setView("pricing");
      return;
    }

    setResumeApplyReturnPending(false);
    setSelectedApplyJob(job);
    setActiveModal("apply");
  };

  // Apply Form Submission
  const handleApplySubmit = async (coverLetterText, customResumeMeta = null) => {
    if (!selectedApplyJob || !user) return;

    if (customResumeMeta?.skippedLarge) {
      addToast(
        "Custom resume is over 2MB, so only the file name was stored. Use a smaller file for admin preview.",
        "info"
      );
    }

    try {
      // Try real API first
      const savedApp = await submitApplication({
        jobId: selectedApplyJob._id || selectedApplyJob.id,
        coverLetter: coverLetterText,
        resumeUrl: user.resumeUrl || "resume_profile.pdf",
        customResumeName: customResumeMeta?.name ?? "",
      });

      // Use normalized backend response to update local state
      const newApp = normalizeApp({
        ...savedApp,
        // Attach customResumeDataUrl (client-only field, not stored in DB)
        customResumeDataUrl: customResumeMeta?.dataUrl ?? null,
      });
      setApplications((prev) => [newApp, ...prev]);
    } catch (err) {
      // If already applied or plan limit reached
      const errMsg = err.response?.data?.message || "";
      if (errMsg.includes("already applied")) {
        addToast("You have already applied for this position.", "info");
        setActiveModal(null);
        throw err;
      }
      if (err.response?.status === 403 && (errMsg.includes("limit") || errMsg.includes("Plan"))) {
        addToast(`${errMsg} Go to Plans to upgrade! 🚀`, "info");
        setView("pricing");
        setActiveModal(null);
        throw err;
      }
      // Offline fallback — still add to local state with flat fields
      const newApp = {
        id: `app-custom-${Date.now()}`,
        jobId: selectedApplyJob._id || selectedApplyJob.id,
        candidateName: user.name,
        email: user.email,
        resumeUrl: user.resumeUrl || "resume_profile.pdf",
        coverLetter: coverLetterText,
        customResumeName: customResumeMeta?.name ?? null,
        customResumeDataUrl: customResumeMeta?.dataUrl ?? null,
        status: "Applied",
        appliedDate: new Date().toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        }),
        timeline: [{ status: "Applied", date: "Just now", note: "Application submitted." }],
      };
      setApplications((prev) => [newApp, ...prev]);
    }

    setConfettiActive(true);
    addToast(`Successfully applied to ${selectedApplyJob.company}!`, "success");
    setTimeout(() => { setConfettiActive(false); }, 4000);
  };

  // ATS Review Application Updates
  const handleUpdateAppStatus = async (appId, newStatus) => {
    // Update locally
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId || app._id === appId) {
          const updatedTimeline = [
            ...app.timeline,
            { status: newStatus, date: "Just now", note: `Recruiter updated review status to ${newStatus}.` },
          ];
          return { ...app, status: newStatus, timeline: updatedTimeline };
        }
        return app;
      })
    );
    // Try to update in backend
    try {
      await updateAppStatusAPI(appId, newStatus);
    } catch (e) {
      // Not critical — local state already updated
    }
    addToast(`Applicant profile status marked as: ${newStatus}`, "success");
    if (newStatus === "Hired") {
      setConfettiActive(true);
      setTimeout(() => { setConfettiActive(false); }, 5000);
    }
  };

  // Delete Application
  const handleDeleteApplication = async (appId) => {
    setApplications((prev) => prev.filter((app) => (app.id || app._id) !== appId));
    try {
      await deleteAppAPI(appId);
    } catch (e) {
      // Not critical
    }
    addToast("Application deleted successfully.", "info");
  };

  // Recruiter Job Publisher
  const handlePostJob = async (newJob) => {
    try {
      const saved = await createJob(newJob);
      setAllJobs((prev) => [saved, ...prev]);
    } catch (e) {
      // Fallback: add to local state only
      setAllJobs((prev) => [newJob, ...prev]);
    }
    addToast(`Congratulations! Position listed successfully for ${newJob.company}.`, "success");
    setView("jobs");
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-inter relative select-none">
      
      {/* Dynamic Confetti Overlay (Custom DOM execution, no heavy npm libs) */}
      {confettiActive && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {Array.from({ length: 120 }).map((_, i) => {
            const randomX = Math.random() * 100; // in %
            const randomSize = Math.random() * 8 + 6; // in px
            const randomDelay = Math.random() * 3; // in s
            const randomColor = ["bg-red-400", "bg-yellow-400", "bg-emerald-400", "bg-blue-400", "bg-pink-400", "bg-purple-400"][
              Math.floor(Math.random() * 6)
            ];
            return (
              <div
                key={i}
                className={`absolute rounded-full opacity-95 ${randomColor} animate-bounce`}
                style={{
                  left: `${randomX}%`,
                  top: `-20px`,
                  width: `${randomSize}px`,
                  height: `${randomSize}px`,
                  animation: `float ${Math.random() * 4 + 3}s ease-in infinite`,
                  animationDelay: `${randomDelay}s`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Toast Alert stack notifications */}
      <div className="fixed top-20 right-4 z-50 flex flex-col space-y-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center space-x-3 p-4 rounded-xl shadow-lg border text-xs font-semibold max-w-sm pointer-events-auto bg-white/95 backdrop-blur-md transform transition-all duration-300 animate-slide-left ${
              toast.type === "success"
                ? "border-emerald-100 text-emerald-800"
                : "border-blue-100 text-blue-800"
            }`}
          >
            <span className="text-base">{toast.type === "success" ? "🎉" : "💡"}</span>
            <p className="flex-1">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* Main Header navigation */}
      <Navbar
        currentView={currentView}
        setView={setView}
        user={user}
        onLogout={handleLogout}
        onOpenModal={openModal}
        onOpenEditResume={() => {
          setResumeApplyReturnPending(false);
          setView("edit-resume");
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onUpdateAvatar={(avatarKey) => {
          const updatedUser = { ...user, avatar: avatarKey };
          if (user) {
            localStorage.setItem(`avatar_${user.email}`, avatarKey || "");
          }
          setUser(updatedUser);
          addToast("Profile avatar updated successfully!", "success");
        }}
        onOpenAvatarModal={() => setAvatarModalOpen(true)}
        onOpenMessages={(conv) => {
          // conv may be a conversation object from the dropdown — extract the other participant id
          if (conv && conv.participants) {
            const other = conv.participants.find((p) => p._id !== user?._id);
            if (other) setActiveChatFriendId(other._id);
          }
          setView("messages");
        }}
        onLanguageChange={handleLanguageChange}
        currentLanguage={language}
      />

      {/* CORE VIEW ROUTER */}
      <main className="flex-1">
        {currentView === "landing" && (
          <div className="animate-fade-in">
            {/* High fidelity hero replicating landing screenshot */}
            <Hero
              user={user}
              setView={setView}
              onGoogleLogin={handleFirebaseGoogleLogin}
            />
            <HomeRecommendations jobs={allJobs} setView={setView} setSearchQuery={setSearchQuery} />

            {/* Glowing Partner Brands Bar */}
            <Partners />

            {/* Categories Showcase (Below folds) */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-outfit font-extrabold text-3xl text-slate-800 tracking-tight">
                  {t("hero_categories_title")}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {t("hero_categories_sub")}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                {mockCategories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSearchQuery(cat.name.split(" ")[0]);
                      setView("jobs");
                    }}
                    className="bg-white border border-slate-100 hover:border-primary/20 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group transform hover:-translate-y-1"
                  >
                    <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform duration-200">{cat.icon}</span>
                    <h4 className="font-outfit font-bold text-slate-800 text-sm mb-1">{cat.name}</h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{cat.count}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Premium CTA banner */}
            <section className="bg-slate-900 mx-4 sm:mx-8 lg:mx-12 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden mb-16 shadow-xl">
              
              <div className="max-w-3xl relative z-10 space-y-6">
                <span className="bg-primary/20 text-primary-light text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20 font-outfit">
                  {t("hero_cta_program")}
                </span>
                <h2 className="font-outfit font-extrabold text-3xl sm:text-4xl lg:text-5xl leading-tight">
                  {t("hero_cta_headline")}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {t("hero_cta_subtext")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    onClick={() => setView("jobs")}
                    className="px-6 py-3 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md hover:shadow-lg transition-all text-center"
                  >
                    {t("hero_explore_jobs")}
                  </button>
                  <button
                    onClick={() => {
                      if (user) {
                        setView(
                          user.role === "admin"
                            ? "admin"
                            : user.role === "employer"
                              ? "employer"
                              : "dashboard"
                        );
                      } else {
                        openModal("register");
                      }
                    }}
                    className="px-6 py-3 text-sm font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-all text-center"
                  >
                    {user ? t("hero_cta_dashboard") : t("hero_cta_register")}
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="relative z-10 border-t border-white/10 mt-8 pt-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0">
                {[
                  { value: "300K+", label: t("hero_stat_companies") },
                  { value: "10K+", label: t("hero_stat_openings") },
                  { value: "21Mn+", label: t("hero_stat_students") },
                  { value: "600K+", label: t("hero_stat_learners") },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className={`text-center sm:text-left ${idx > 0 ? "sm:border-l sm:border-white/10 sm:pl-8" : ""}`}
                  >
                    <p className="font-outfit font-extrabold text-2xl sm:text-3xl text-primary-light tracking-tight">
                      {stat.value}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {currentView === "jobs" && (
          <div className="animate-fade-in bg-slate-50/50">
            <JobSearch
              jobs={allJobs}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onApply={handleApplyInitiate}
            />
          </div>
        )}
        {currentView === "dashboard" && user && (
          <div className="animate-fade-in">
            <CandidateDash
              user={user}
              applications={applications}
              onSaveProfile={(updates) => {
                setUser((prev) => ({ ...prev, name: updates.name }));
                addToast("Profile details updated successfully!", "success");
              }}
              setView={setView}
              setSearchQuery={setSearchQuery}
            />
          </div>
        )}

        {currentView === "employer" && user && (
          <div className="animate-fade-in">
            <EmployerPortal
              user={user}
              applications={applications}
              onUpdateAppStatus={handleUpdateAppStatus}
              onPostJob={handlePostJob}
            />
          </div>
        )}

        {currentView === "admin" && user && (
          <div className="animate-fade-in">
            <AdminDash
              currentUser={user}
              applications={applications}
              jobs={allJobs}
              onUpdateAppStatus={handleUpdateAppStatus}
              onDeleteApplication={handleDeleteApplication}
              onPostJob={handlePostJob}
            />
          </div>
        )}

        {currentView === "edit-resume" && user && (
          <div className="animate-fade-in">
            <EditResume
              user={user}
              setView={setView}
              returnToApplyAfterResume={resumeApplyReturnPending}
              onReturnToApply={returnToApplyModal}
              addToast={addToast}
              onSave={(updatedUser) => {
                if (updatedUser) {
                  setUser(updatedUser);
                  localStorage.setItem("internarea_user", JSON.stringify(updatedUser));
                }
                if (resumeApplyReturnPending && selectedApplyJob) {
                  returnToApplyModal();
                } else {
                  setView("dashboard");
                }
              }}
            />
          </div>
        )}

        {currentView === "preferences" && user && (
          <div className="animate-fade-in">
            <Preferences
              user={user}
              setView={setView}
              onSave={(prefData) => {
                addToast("Preferences saved! Your recommendations have been updated.", "success");
              }}
              onLanguageChange={handleLanguageChange}
            />
          </div>
        )}

        {currentView === "applications" && user && (
          <div className="animate-fade-in">
            <MyApplications
              user={user}
              applications={applications}
              setView={setView}
            />
          </div>
        )}

        {currentView === "friends" && user && (
          <div className="animate-fade-in">
            <Friends
              user={user}
              setView={setView}
              onMessageFriend={(friendId) => {
                setActiveChatFriendId(friendId);
                setView("messages");
              }}
            />
          </div>
        )}

        {currentView === "community" && user && (
          <div className="animate-fade-in">
            <Community
              user={user}
              setView={setView}
              addToast={addToast}
            />
          </div>
        )}

        {currentView === "messages" && user && (
          <div className="animate-fade-in">
            <Messages
              user={user}
              initialFriendId={activeChatFriendId}
            />
          </div>
        )}

        {currentView === "forgot-password" && (
          <div className="animate-fade-in">
            <ForgotPassword
              setView={setView}
              onOpenModal={openModal}
            />
          </div>
        )}

        {currentView === "pricing" && user && (
          <div className="animate-fade-in">
            <PricingPlans
              user={user}
              setView={setView}
              addToast={addToast}
            />
          </div>
        )}
      </main>

      <footer className="bg-slate-950 text-slate-500 py-12 border-t border-slate-900 mt-auto text-xs px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-8 mb-12">
          <div>
            <h5 className="font-outfit font-bold text-slate-300 uppercase tracking-wider mb-4">{t("footer_opportunities")}</h5>
            <ul className="space-y-2.5">
              <li><a href="#" className="hover:text-primary transition-colors">IT internships</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Marketing jobs</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Graphic design listings</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Remote jobs</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-outfit font-bold text-slate-300 uppercase tracking-wider mb-4">{t("footer_about")}</h5>
            <ul className="space-y-2.5">
              <li><a href="#" className="hover:text-primary transition-colors">Our Story</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers at Intern Area</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Team Blog</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Press & Media</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-outfit font-bold text-slate-300 uppercase tracking-wider mb-4">{t("footer_legal")}</h5>
            <ul className="space-y-2.5">
              <li><a href="#" className="hover:text-primary transition-colors">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Refund Guidelines</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px]">
          <p>© 2026 Intern Area. {t("footer_rights")}</p>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-primary transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">Instagram</a>
          </div>
        </div>
      </footer>

      <Modals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onSubmitAuth={handleAuthSubmit}
        activeJob={selectedApplyJob}
        onSubmitApply={handleApplySubmit}
        setView={setView}
        onEditResumeFromApply={handleEditResumeFromApply}
      />

      {/* Superhero Avatar Modal Overlay at root view level */}
      {avatarModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          {/* Dark backdrop blur */}
          <div 
            onClick={() => setAvatarModalOpen(false)} 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          ></div>
          
          {/* Modal Content */}
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full relative z-10 p-6 sm:p-8 transform scale-100 transition-all duration-300 animate-scale-up">
            {/* Close Button */}
            <button
              onClick={() => setAvatarModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <h3 className="font-outfit font-extrabold text-2xl text-slate-800 flex items-center justify-center gap-2">
                Choose Your Hero Avatar 🦸‍♂️
              </h3>
              <p className="text-slate-400 text-xs mt-1.5">
                Select your favorite superhero avatar to customize your profile picture across Intern Area
              </p>
            </div>

            {/* Grid of 10 Superhero faces */}
            <div className="grid grid-cols-5 gap-4 justify-center py-4">
              {Object.entries(SUPERHERO_AVATARS).map(([key, avatar]) => {
                const isSelected = user?.avatar === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      const updatedUser = { ...user, avatar: key };
                      if (user) {
                        localStorage.setItem(`avatar_${user.email}`, key);
                      }
                      setUser(updatedUser);
                      addToast("Profile avatar updated successfully!", "success");
                      setAvatarModalOpen(false);
                    }}
                    className="relative flex flex-col items-center group focus:outline-none cursor-pointer"
                  >
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden transition-all duration-300 transform group-hover:scale-110 shadow-md relative ${
                      isSelected 
                        ? "ring-4 ring-primary ring-offset-2 scale-105" 
                        : "ring-2 ring-slate-100 group-hover:ring-slate-300"
                    }`}>
                      {avatar.svg}
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-white shadow-md border border-white">
                            ✓
                          </div>
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-bold mt-2 truncate max-w-full text-center ${
                      isSelected ? "text-primary" : "text-slate-500 group-hover:text-slate-800"
                    }`}>
                      {avatar.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Reset to Default initials at the bottom */}
            {user?.avatar && (
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center">
                <button
                  onClick={() => {
                    const updatedUser = { ...user, avatar: null };
                    if (user) {
                      localStorage.removeItem(`avatar_${user.email}`);
                    }
                    setUser(updatedUser);
                    addToast("Profile avatar reset to default!", "success");
                    setAvatarModalOpen(false);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl"
                >
                  Reset to Default Profile Picture
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── French Language OTP Verification Modal ─────────────────────────────── */}
      {frenchOTPModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            onClick={() => { if (frenchOTPStep !== "verifying" && frenchOTPStep !== "sending") { setFrenchOTPModalOpen(false); setFrenchOTPStep("idle"); } }}
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
          />
          {/* Modal */}
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full relative z-10 p-8 animate-scale-up">
            {/* Close button */}
            {frenchOTPStep !== "verifying" && frenchOTPStep !== "sending" && frenchOTPStep !== "success" && (
              <button
                onClick={() => { setFrenchOTPModalOpen(false); setFrenchOTPStep("idle"); }}
                className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-red-500 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
                🇫🇷
              </div>
              <h3 className="font-outfit font-extrabold text-2xl text-slate-800">
                {t("otp_modal_title")}
              </h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                {t("otp_modal_sub")}
              </p>
            </div>

            {/* Step: idle — show Send button */}
            {frenchOTPStep === "idle" && (
              <div className="space-y-4">
                <button
                  onClick={handleFrenchOTPSend}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-xl hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  {t("otp_send_code")}
                </button>
                <button
                  onClick={() => { setFrenchOTPModalOpen(false); }}
                  className="w-full py-3 text-sm text-slate-500 hover:text-slate-700 font-semibold transition-colors"
                >
                  {t("otp_cancel")}
                </button>
              </div>
            )}

            {/* Step: sending */}
            {frenchOTPStep === "sending" && (
              <div className="text-center py-6">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600 font-semibold text-sm">{t("otp_sending")}</p>
              </div>
            )}

            {/* Step: enter OTP */}
            {frenchOTPStep === "enter" && (
              <div className="space-y-4">
                {frenchOTPMaskedEmail && (
                  <p className="text-center text-xs text-slate-500">
                    {t("otp_sent_to")} <span className="font-bold text-slate-700">{frenchOTPMaskedEmail}</span>
                  </p>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={frenchOTPValue}
                  onChange={(e) => setFrenchOTPValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full text-center text-3xl font-mono font-black tracking-[0.5em] border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl py-4 outline-none transition-all"
                />
                {frenchOTPError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                    <span className="text-red-500 text-sm">⚠️</span>
                    <p className="text-red-600 text-xs font-semibold">{frenchOTPError}</p>
                  </div>
                )}
                <button
                  onClick={handleFrenchOTPVerify}
                  disabled={frenchOTPValue.length !== 6}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-xl hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("otp_verify")}
                </button>
                <div className="text-center">
                  <button onClick={handleFrenchOTPSend} className="text-xs text-blue-600 hover:underline font-semibold">
                    {t("otp_resend")}
                  </button>
                </div>
              </div>
            )}

            {/* Step: verifying */}
            {frenchOTPStep === "verifying" && (
              <div className="text-center py-6">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600 font-semibold text-sm">{t("otp_verifying")}</p>
              </div>
            )}

            {/* Step: success */}
            {frenchOTPStep === "success" && (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-2xl mx-auto mb-4">
                  ✅
                </div>
                <p className="text-emerald-700 font-extrabold text-base">{t("otp_success")}</p>
                <p className="text-slate-400 text-xs mt-2">Fermeture automatique...</p>
              </div>
            )}

            {/* Step: error */}
            {frenchOTPStep === "error" && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-red-600 font-semibold text-sm">⚠️ {frenchOTPError}</p>
                </div>
                <button
                  onClick={() => setFrenchOTPStep("idle")}
                  className="w-full py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
