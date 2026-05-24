import React, { useState } from "react";
import { loginUser, registerUser } from "../api/authAPI";

function readCustomResumeFile(file) {
  const MAX_BYTES = 2 * 1024 * 1024;
  return new Promise((resolve) => {
    if (file.size > MAX_BYTES) {
      resolve({ name: file.name, dataUrl: null, skippedLarge: true });
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, dataUrl: reader.result, skippedLarge: false });
    reader.onerror = () =>
      resolve({ name: file.name, dataUrl: null, skippedLarge: false });
    reader.readAsDataURL(file);
  });
}

export default function Modals({
  activeModal, // 'login', 'register', 'register-employer', 'apply', or null
  onClose,
  onSubmitAuth, // (userData)
  activeJob, // For apply modal context
  onSubmitApply, // (coverLetter, customResumeFileMeta | null) -> triggers success timeline
  setView,
  onEditResumeFromApply, // () => void — leave apply flow context in parent, then open editor
}) {
  if (!activeModal) return null;

  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginRole, setLoginRole] = useState("candidate"); // 'candidate' or 'employer'

  // Register Form States
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regCompany, setRegCompany] = useState("");
  const [regRole, setRegRole] = useState("candidate");

  // Admin Login States
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

  // API loading & error states
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Apply Modal States
  const [applyStep, setApplyStep] = useState(1); // 1: Form, 2: Success
  const [availability, setAvailability] = useState("yes"); // 'yes' or 'no'
  const [availabilityText, setAvailabilityText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [applySubmitting, setApplySubmitting] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPass) return;
    setAuthError("");
    setAuthLoading(true);
    try {
      const userData = await loginUser({ email: loginEmail, password: loginPass });
      // Save token and user to localStorage
      localStorage.setItem("internarea_token", userData.token);
      localStorage.setItem("internarea_user", JSON.stringify(userData));
      onSubmitAuth(userData);
      setLoginEmail("");
      setLoginPass("");
      onClose();
    } catch (err) {
      setAuthError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPass) return;
    setAuthError("");
    setAuthLoading(true);
    try {
      const userData = await registerUser({
        name: regName,
        email: regEmail,
        password: regPass,
        role: regRole,
        company: regRole === "employer" ? (regCompany || "Independent Brand") : "",
      });
      localStorage.setItem("internarea_token", userData.token);
      localStorage.setItem("internarea_user", JSON.stringify(userData));
      onSubmitAuth(userData);
      setRegName("");
      setRegEmail("");
      setRegPass("");
      setRegCompany("");
      onClose();
    } catch (err) {
      setAuthError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    if (!adminUser || !adminPass) return;
    setAuthError("");
    setAuthLoading(true);
    try {
      const userData = await loginUser({ email: adminUser, password: adminPass });
      // Save token and user to localStorage
      localStorage.setItem("internarea_token", userData.token);
      localStorage.setItem("internarea_user", JSON.stringify(userData));
      onSubmitAuth(userData);
      setAdminUser("");
      setAdminPass("");
      onClose();
    } catch (err) {
      setAuthError(err.response?.data?.message || "Admin login failed. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEditResume = () => {
    if (onEditResumeFromApply) {
      onEditResumeFromApply();
    } else {
      setView("edit-resume");
      onClose();
    }
  };

  const handleFormSubmit = async () => {
    if (applySubmitting) return;
    setApplySubmitting(true);
    try {
      const textDetails =
        availability === "yes"
          ? "Immediate Availability confirmed."
          : `Availability details: ${availabilityText || "Not specified"}.`;

      const fileDetails = uploadedFileName
        ? `Attached custom resume file: ${uploadedFileName}.`
        : "Attached active profile resume.";

      let customMeta = null;
      if (uploadedFile) {
        customMeta = await readCustomResumeFile(uploadedFile);
      }

      onSubmitApply(`${textDetails}\n${fileDetails}`, customMeta);
      setApplyStep(2);
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleApplyClose = () => {
    setApplyStep(1);
    setAvailability("yes");
    setAvailabilityText("");
    setUploadedFileName("");
    setUploadedFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Dark overlay backdrop blur */}
      <div onClick={handleApplyClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"></div>

      {/* Modal Wrapper Card */}
      <div className={`bg-white rounded-2xl shadow-2xl border border-slate-100 w-full relative z-10 overflow-hidden transform scale-100 transition-all duration-300 animate-scale-up ${
        activeModal === "apply" ? "max-w-2xl" : "max-w-md"
      }`}>
        
        {/* Close Button */}
        {activeModal !== "apply" && (
          <button
            onClick={handleApplyClose}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* 1. Login Modal Content */}
        {activeModal === "login" && (
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <h3 className="font-outfit font-extrabold text-2xl text-slate-800">Welcome Back</h3>
              <p className="text-slate-400 text-xs mt-1">Sign in to search and apply for openings</p>
            </div>



            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-outfit">Email Address</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-outfit">Password</label>
                <input
                  type="password"
                  placeholder="Enter password..."
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                  required
                />
              </div>

              {authError && (
                <p className="text-xs text-red-500 font-semibold bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {authError}
                </p>
              )}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md transform active:scale-98 transition-all mt-4 disabled:opacity-60"
              >
                {authLoading ? "Signing in..." : "Sign In with Credentials"}
              </button>
            </form>
          </div>
        )}

        {/* Admin Login Modal Content */}
        {activeModal === "admin-login" && (
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <h3 className="font-outfit font-extrabold text-2xl text-slate-800">Admin Access</h3>
              <p className="text-slate-400 text-xs mt-1">Sign in to manage the platform</p>
            </div>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-outfit">Username</label>
                <input
                  type="text"
                  placeholder="Enter admin username..."
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-slate-800 focus:bg-white transition-all"
                  required
                  disabled={authLoading}
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-outfit">Password</label>
                <input
                  type="password"
                  placeholder="Enter admin password..."
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-slate-800 focus:bg-white transition-all"
                  required
                  disabled={authLoading}
                />
              </div>

              {authError && (
                <p className="text-xs text-red-500 font-semibold bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transform active:scale-98 transition-all mt-4 disabled:opacity-60"
              >
                {authLoading ? "Accessing Admin Portal..." : "Enter Admin Dashboard"}
              </button>
            </form>
          </div>
        )}

        {/* 2. Register Modal Content */}
        {(activeModal === "register" || activeModal === "register-employer") && (
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <h3 className="font-outfit font-extrabold text-2xl text-slate-800">Create Account</h3>
              <p className="text-slate-400 text-xs mt-1">Join India's leading job and internship platform</p>
            </div>



            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-outfit">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rohan Sen"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-outfit">Email Address</label>
                <input
                  type="email"
                  placeholder="rohan@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                  required
                />
              </div>

              {regRole === "employer" && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-outfit">Company Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Decathlon, Nestlé, Google"
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-outfit">Password</label>
                <input
                  type="password"
                  placeholder="Create secure password..."
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                  required
                />
              </div>

              {authError && (
                <p className="text-xs text-red-500 font-semibold bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {authError}
                </p>
              )}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md transform active:scale-98 transition-all mt-4 disabled:opacity-60"
              >
                {authLoading ? "Creating account..." : "Sign Up & Launch"}
              </button>
            </form>
          </div>
        )}

        {/* 3. High-Fidelity Apply now Modal */}
        {activeModal === "apply" && activeJob && (
          <div className="flex flex-col">
            {/* Header */}
            <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-white">
              <h3 className="font-outfit font-extrabold text-lg text-slate-800">Apply now</h3>
              <button
                onClick={handleApplyClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {applyStep === 1 ? (
              <div className="p-6 sm:p-8 space-y-6">
                {/* 1. Resume status row */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Your resume</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Updated recently</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 leading-relaxed">
                      Your current resume will be submitted along with this application.
                    </span>
                    <button
                      type="button"
                      onClick={handleEditResume}
                      className="text-primary font-bold hover:underline whitespace-nowrap ml-2"
                    >
                      Edit resume
                    </button>
                  </div>
                </div>

                {/* 2. Availability row */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 block">Confirm your availability</span>
                  <div className="space-y-2.5">
                    <label className="flex items-start space-x-3 cursor-pointer text-xs text-slate-600 font-semibold">
                      <input
                        type="radio"
                        name="availability"
                        value="yes"
                        checked={availability === "yes"}
                        onChange={() => setAvailability("yes")}
                        className="mt-0.5 w-4 h-4 text-primary focus:ring-primary border-slate-300"
                      />
                      <span>Yes, I am available to join immediately</span>
                    </label>
                    <label className="flex items-start space-x-3 cursor-pointer text-xs text-slate-600 font-semibold">
                      <input
                        type="radio"
                        name="availability"
                        value="no"
                        checked={availability === "no"}
                        onChange={() => setAvailability("no")}
                        className="mt-0.5 w-4 h-4 text-primary focus:ring-primary border-slate-300"
                      />
                      <span>No (Please specify your availability)</span>
                    </label>
                  </div>

                  {availability === "no" && (
                    <div className="mt-2.5 animate-fade-in">
                      <textarea
                        rows="2"
                        placeholder="e.g. Available after next month, need 2 weeks notice period..."
                        value={availabilityText}
                        onChange={(e) => setAvailabilityText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-primary focus:bg-white transition-all resize-none text-slate-700"
                      ></textarea>
                    </div>
                  )}
                </div>

                {/* 3. Custom resume file uploader */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    Custom resume <span className="text-slate-400 font-normal font-sans">(Optional)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 block mb-2">
                    Employer can download and view this resume
                  </span>

                  <div className="border-2 border-dashed border-slate-200 hover:border-primary/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50 relative group">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setUploadedFile(f);
                          setUploadedFileName(f.name);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2">
                      {uploadedFileName ? (
                        <>
                          <span className="text-2xl">📄</span>
                          <span className="text-xs font-bold text-slate-700">{uploadedFileName}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedFileName("");
                              setUploadedFile(null);
                            }}
                            className="text-[10px] text-rose-500 font-bold hover:underline z-10"
                          >
                            Remove file
                          </button>
                        </>
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                          </svg>
                          <span className="text-xs font-bold text-primary">Upload file</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">Max file size: 10Mb. File type - PDF, DOC, DOCX</p>
                </div>

                {/* Form Footer Action */}
                <div className="flex justify-end pt-4 border-t border-slate-100 bg-white">
                  <button
                    type="button"
                    onClick={handleFormSubmit}
                    disabled={applySubmitting}
                    className="px-10 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {applySubmitting ? "Submitting…" : "Submit"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-3xl mx-auto shadow-inner border border-emerald-100 animate-bounce">
                  ✓
                </div>
                <div>
                  <h3 className="font-outfit font-extrabold text-xl text-slate-800">Application Submitted!</h3>
                  <p className="text-slate-400 text-xs mt-1">Hooray! The employer at {activeJob.company} was notified.</p>
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                  You can track this submission in your Dashboard's "My Applications" board.
                </p>
                <button
                  onClick={handleApplyClose}
                  className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all mt-4"
                >
                  Close & Continue Browsing
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
