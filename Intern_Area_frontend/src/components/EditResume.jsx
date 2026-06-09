import React, { useState, useEffect } from "react";
import { getMe } from "../api/authAPI";
import {
  sendResumeOTP,
  verifyResumeOTP,
  createResumeOrder,
  verifyResumePayment
} from "../api/resumePaymentsAPI";

// Dynamic script loader for Razorpay checkout
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const initialResumeData = {
  name: "",
  email: "",
  phone: "",
  place: "",
  careerObjective: "",
  photoUrl: "",
  education: [],
  experience: [],
  projects: [],
  skills: [],
  achievements: [],
  certifications: [],
  extraCurriculars: [],
  portfolio: {
    github: "",
    linkedin: "",
    website: ""
  }
};

const fallbackDetails = {
  name: "Abcd",
  email: "abcd@gmail.com",
  phone: "+91 98765 43210",
  place: "Bangalore, India",
  careerObjective: "Passionate and detail-oriented software developer seeking to leverage strong react and frontend engineering skills in a dynamic internship or entry-level developer role.",
  photoUrl: "",
  education: [
    {
      id: "edu-1",
      degree: "Bachelor of Technology in Computer Science",
      school: "Apex Institute of Technology",
      year: "2022 - 2026",
      score: "8.9 CGPA"
    }
  ],
  experience: [
    {
      id: "exp-1",
      type: "Internship",
      role: "Frontend Developer Intern",
      company: "WebCraft Studio",
      duration: "Jun 2025 - Aug 2025",
      description: "Developed and maintained interactive web components using React and Tailwind. Designed responsive dashboard pages and optimized component loading times."
    }
  ],
  projects: [
    {
      id: "proj-1",
      title: "TaskFlow Manager App",
      tech: "React, LocalStorage, CSS3",
      description: "A drag-and-drop productivity dashboard featuring Kanban columns, automated deadline notifications, and custom tags."
    }
  ],
  skills: ["React.js", "JavaScript (ES6)", "Tailwind CSS", "HTML5 & CSS3", "Git & GitHub", "REST APIs"],
  certifications: [
    "AWS Certified Cloud Practitioner — Amazon Web Services",
    "Certified Kubernetes Application Developer (CKAD) — CNCF"
  ],
  achievements: [
    "Secured 1st rank in National Web Development Hackathon out of 500+ participants.",
    "Certified React Native Developer by Meta Specialization Program.",
    "Successfully resolved 50+ bugs in Open Source repositories."
  ],
  extraCurriculars: [
    "Organizer of College Tech Fest 'ByteCraft 2025', leading a web team of 15 members.",
    "Volunteered at local NGO teaching basic computer literacy to children."
  ],
  portfolio: {
    github: "github.com/abcd-dev",
    linkedin: "linkedin.com/in/abcd",
    website: "abcd.dev"
  }
};

export default function EditResume({ user, setView, onSave, returnToApplyAfterResume, onReturnToApply, addToast }) {
  const [profileLoading, setProfileLoading] = useState(true);
  const [freshUser, setFreshUser] = useState(null);

  // Resume Form State
  const [resume, setResume] = useState(initialResumeData);
  const [skillInput, setSkillInput] = useState("");
  const [activeMobileTab, setActiveMobileTab] = useState("edit"); // "edit" or "preview"

  // Verification & Payment Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("otp-send"); // "otp-send", "otp-verify", "payment", "success"
  const [otpInput, setOtpInput] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);
  const [generatedResumeUrl, setGeneratedResumeUrl] = useState("");

  // Mount logic: fetch fresh candidate profile, assert premium subscription
  useEffect(() => {
    getMe()
      .then((data) => {
        setFreshUser(data);

        // If the user has verified data from database, load it. Otherwise, load from local storage
        if (data.profileResumeData) {
          setResume(data.profileResumeData);
        } else {
          const resumeKey = `resume_${data.email || data.id || "guest"}`;
          const saved = localStorage.getItem(resumeKey);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setResume({
                ...initialResumeData,
                ...parsed,
                education: parsed.education || [],
                experience: parsed.experience || [],
                projects: parsed.projects || [],
                skills: parsed.skills || [],
                achievements: parsed.achievements || [],
                certifications: parsed.certifications || [],
                extraCurriculars: parsed.extraCurriculars || [],
                portfolio: { ...initialResumeData.portfolio, ...parsed.portfolio }
              });
            } catch (e) {
              console.error("Error parsing local resume details:", e);
            }
          } else {
            // Start with completely blank fields
            setResume(initialResumeData);
          }
        }
        setProfileLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch fresh user profile on mount:", err);
        setProfileLoading(false);
      });
  }, []);

  const isCleanSlate = !resume.name && !resume.email && !resume.phone && !resume.place && !resume.careerObjective && resume.education.length === 0 && resume.experience.length === 0 && resume.projects.length === 0 && resume.skills.length === 0 && (!resume.achievements || resume.achievements.length === 0) && !resume.portfolio.github && !resume.portfolio.linkedin && !resume.portfolio.website;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setResume((prev) => ({ ...prev, [name]: value }));
  };

  const handlePortfolioChange = (e) => {
    const { name, value } = e.target;
    setResume((prev) => ({
      ...prev,
      portfolio: { ...prev.portfolio, [name]: value }
    }));
  };

  // Photo Upload Handler (under 1MB base64 conversion)
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      if (addToast) addToast("Profile photo must be smaller than 1MB.", "error");
      else alert("Profile photo must be smaller than 1MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setResume((prev) => ({ ...prev, photoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setResume((prev) => ({ ...prev, photoUrl: "" }));
  };

  // Education Helpers
  const handleEduChange = (id, field, value) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu))
    }));
  };

  const addEducation = () => {
    setResume((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: `edu-${Date.now()}`,
          degree: "",
          school: "",
          year: "",
          score: ""
        }
      ]
    }));
  };

  const removeEducation = (id) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id)
    }));
  };

  // Experience Helpers
  const handleExpChange = (id, field, value) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    }));
  };

  const addExperience = () => {
    setResume((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: `exp-${Date.now()}`,
          type: "Internship",
          role: "",
          company: "",
          duration: "",
          description: ""
        }
      ]
    }));
  };

  const removeExperience = (id) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id)
    }));
  };

  // Projects Helpers
  const handleProjChange = (id, field, value) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) => (proj.id === id ? { ...proj, [field]: value } : proj))
    }));
  };

  const addProject = () => {
    setResume((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: `proj-${Date.now()}`,
          title: "",
          tech: "",
          description: ""
        }
      ]
    }));
  };

  const removeProject = (id) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.filter((proj) => proj.id !== id)
    }));
  };

  // Skills Helpers
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    if (!resume.skills.includes(skillInput.trim())) {
      setResume((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
    }
    setSkillInput("");
  };

  const removeSkill = (indexToRemove) => {
    setResume((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Achievements Helpers
  const addAchievement = () => {
    setResume((prev) => ({
      ...prev,
      achievements: [...(prev.achievements || []), ""]
    }));
  };

  const handleAchievementChange = (index, value) => {
    setResume((prev) => ({
      ...prev,
      achievements: prev.achievements.map((ach, idx) => (idx === index ? value : ach))
    }));
  };

  const removeAchievement = (index) => {
    setResume((prev) => ({
      ...prev,
      achievements: (prev.achievements || []).filter((_, idx) => idx !== index)
    }));
  };

  // Certifications Helpers
  const addCertification = () => {
    setResume((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), ""]
    }));
  };

  const handleCertificationChange = (index, value) => {
    setResume((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).map((cert, idx) => (idx === index ? value : cert))
    }));
  };

  const removeCertification = (index) => {
    setResume((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).filter((_, idx) => idx !== index)
    }));
  };

  // Extra-Curriculars Helpers
  const addExtraCurricular = () => {
    setResume((prev) => ({
      ...prev,
      extraCurriculars: [...(prev.extraCurriculars || []), ""]
    }));
  };

  const handleExtraCurricularChange = (index, value) => {
    setResume((prev) => ({
      ...prev,
      extraCurriculars: (prev.extraCurriculars || []).map((ec, idx) => (idx === index ? value : ec))
    }));
  };

  const removeExtraCurricular = (index) => {
    setResume((prev) => ({
      ...prev,
      extraCurriculars: (prev.extraCurriculars || []).filter((_, idx) => idx !== index)
    }));
  };

  // Print function — opens a dedicated clean print window with just the resume content
  const handlePrint = () => {
    const printArea = document.getElementById("resume-print-area");
    if (!printArea) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      alert("Pop-up blocked. Please allow pop-ups for this page and try again.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Resume — Print</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');

          /* ── Reset ── */
          *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

          @page { size: A4 portrait; margin: 0; }

          html, body {
            width: 210mm;
            height: 297mm;
            background: #fff;
            font-family: 'Inter', Arial, sans-serif;
            color: #1e293b;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* ── Page wrapper: sections flow naturally top-to-bottom ── */
          #resume-print-area {
            width: 210mm;
            height: 297mm;
            padding: 10mm 15mm 10mm; /* Clean professional A4 margins */
            box-sizing: border-box;
            overflow: hidden;
            background: #fff;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            gap: 12px; /* Consistent spacing between sections */
          }

          /* ── Hide the "Interactive Real-Time Preview" footer ── */
          #resume-print-area > div:last-child { display: none !important; }

          /* ═══════════════════════════════════════════
             HEADER  (name + contact)
          ═══════════════════════════════════════════ */
          /* Name */
          h2 {
            font-family: 'Outfit', Arial, sans-serif;
            font-size: 20pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -0.5px;
            color: #0f172a;
            line-height: 1.1;
          }

          /* Header divider line */
          .border-b-2 {
            border-bottom: 2px solid #0f172a !important;
            padding-bottom: 6px !important;
            margin-bottom: 2px !important;
          }

          /* Compact contact list layout */
          .contact-header {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            align-items: center !important;
            column-gap: 10px !important;
            row-gap: 3px !important;
            margin-top: 6px !important;
            font-size: 8.5pt !important;
            font-weight: 700 !important;
            color: #0052CC !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .contact-header > span {
            display: inline-flex !important;
            align-items: center;
            white-space: nowrap;
            color: #0052CC;
          }

          /* ═══════════════════════════════════════════
             SECTION HEADINGS  (h4)
          ═══════════════════════════════════════════ */
          h4 {
            font-family: 'Outfit', Arial, sans-serif;
            font-size: 8.5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #0052CC;
            border-bottom: 1.5px solid #0052CC;
            padding-bottom: 2px;
            margin-bottom: 6px;
            display: block;
            width: 100%;
          }

          /* ── Section container ── */
          .space-y-1.5, .space-y-2 {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          /* ═══════════════════════════════════════════
             BODY TEXT
          ═══════════════════════════════════════════ */
          p, span, li, div { font-size: 9.5pt; line-height: 1.45; }
          li { margin-bottom: 2px; }
          .text-justify { text-align: justify; }
          .leading-relaxed { line-height: 1.45; }
          .leading-normal { line-height: 1.4; }

          /* ═══════════════════════════════════════════
             FLEX / LAYOUT UTILITIES
          ═══════════════════════════════════════════ */
          .flex { display: flex !important; }
          .flex-col { flex-direction: column !important; }
          .flex-1 { flex: 1 !important; }
          .flex-wrap { flex-wrap: wrap !important; }
          .items-start { align-items: flex-start !important; }
          .items-center { align-items: center !important; }
          .justify-between { justify-content: space-between !important; }
          .gap-1 { gap: 4px !important; }
          .gap-2 { gap: 8px !important; }
          .gap-x-4 { column-gap: 14px !important; }
          .gap-y-0\.5 { row-gap: 2px !important; }
          .shrink-0 { flex-shrink: 0 !important; }
          .min-w-0 { min-width: 0 !important; }
          .pr-4 { padding-right: 12px !important; }
          .pl-1 { padding-left: 4px !important; }
          .pl-4 { padding-left: 12px !important; }
          .pb-4 { padding-bottom: 8px !important; }
          .pb-0\.5 { padding-bottom: 2px !important; }
          .mt-2\.5 { margin-top: 6px !important; }
          .text-right { text-align: right !important; }
          .break-words { word-break: break-word !important; }
          .whitespace-nowrap { white-space: nowrap !important; }
          .uppercase { text-transform: uppercase !important; }
          .font-bold { font-weight: 700 !important; }
          .font-extrabold { font-weight: 800 !important; }
          .font-medium { font-weight: 500 !important; }
          .tracking-wider { letter-spacing: 0.04em !important; }
          .tracking-widest { letter-spacing: 0.1em !important; }
          .list-disc { list-style-type: disc !important; }

          /* ═══════════════════════════════════════════
             COLOURS
          ═══════════════════════════════════════════ */
          .text-slate-900 { color: #0f172a !important; }
          .text-slate-800 { color: #1e293b !important; }
          .text-slate-600 { color: #475569 !important; }
          .text-slate-500 { color: #64748b !important; }
          .text-primary   { color: #0052CC !important; }
          .border-b { border-bottom: 1px solid !important; }
          .border-l-2 { border-left: 2px solid !important; }
          .border-slate-800 { border-color: #1e293b !important; }
          .border-slate-300 { border-color: #cbd5e1 !important; }
          .border-slate-200 { border-color: #e2e8f0 !important; }
          .bg-slate-50  { background: #f8fafc !important; }
          .bg-slate-100 { background: #f1f5f9 !important; }
          .rounded { border-radius: 4px !important; }
          .px-2   { padding-left: 6px !important; padding-right: 6px !important; }
          .px-1\.5 { padding-left: 4px !important; padding-right: 4px !important; }
          .py-0\.2 { padding-top: 1px !important; padding-bottom: 1px !important; }
          .text-emerald-700  { color: #047857 !important; }
          .bg-emerald-50     { background: #ecfdf5 !important; }
          .border-emerald-200 { border-color: #a7f3d0 !important; }
          .text-blue-700     { color: #1d4ed8 !important; }
          .bg-blue-50        { background: #eff6ff !important; }
          .border-blue-200   { border-color: #bfdbfe !important; }

          /* ═══════════════════════════════════════════
             PROFILE PHOTO
          ═══════════════════════════════════════════ */
          .w-12 { width: 44px !important; }
          .h-12 { height: 44px !important; }
          .rounded-full { border-radius: 50% !important; }
          .overflow-hidden { overflow: hidden !important; }
          .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important; }
          .object-cover { object-fit: cover !important; }
          .w-full { width: 100% !important; }
          .h-full { height: 100% !important; }

          /* ═══════════════════════════════════════════
             EXPERIENCE / EDUCATION ROW REFINEMENTS
          ═══════════════════════════════════════════ */
          .bg-emerald-50.border.border-emerald-200 {
            display: inline-block;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 7pt;
            font-weight: 700;
          }
          .bg-blue-50.border.border-blue-200 {
            display: inline-block;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 7pt;
            font-weight: 700;
          }
          .text-primary.font-extrabold { color: #0052CC !important; font-weight: 800 !important; }
          
          /* Custom tags in print */
          .skill-tag {
            background: #f8fafc !important;
            border: 1px solid rgba(226, 232, 240, 0.8) !important;
            border-radius: 4px !important;
            padding: 2px 6px !important;
            font-size: 7.5pt !important;
            font-weight: 700 !important;
            color: #475569 !important;
            display: inline-block !important;
            margin: 2px !important;
            white-space: nowrap !important;
          }

          .tech-tag {
            background: #f1f5f9 !important;
            border-radius: 4px !important;
            padding: 2px 6px !important;
            font-size: 7.5pt !important;
            font-weight: 700 !important;
            color: #475569 !important;
            display: inline-block !important;
          }
        </style>
      </head>
      <body>
        ${printArea.outerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    // Give fonts a moment to load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 600);
  };

  // Local Save
  const handleLocalSave = () => {
    const resumeKey = `resume_${freshUser?.email || user.email || "guest"}`;
    localStorage.setItem(resumeKey, JSON.stringify(resume));
    if (addToast) addToast("Unverified draft saved locally!", "info");
  };

  // ─── VERIFICATION & PAYMENT FLOW HANDLERS ───────────────────────────────────

  // Initiate OTP sending
  const handleInitiateVerification = async () => {
    setCheckoutError("");
    setIsSendingOtp(true);
    setShowCheckoutModal(true);
    setCheckoutStep("otp-send");

    try {
      await sendResumeOTP();
      setCheckoutStep("otp-verify");
      if (addToast) addToast("Verification OTP sent to your registered email address.", "success");
    } catch (err) {
      console.error(err);
      setCheckoutError(err.response?.data?.message || "Failed to deliver verification code. Try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!otpInput.trim()) {
      setCheckoutError("Please enter the 6-digit verification code.");
      return;
    }
    setCheckoutError("");
    setIsVerifyingOtp(true);

    try {
      await verifyResumeOTP({ otp: otpInput });
      setCheckoutStep("payment");
      if (addToast) addToast("Email address verified successfully!", "success");
    } catch (err) {
      console.error(err);
      setCheckoutError(err.response?.data?.message || "Invalid or expired OTP. Verify and try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Redirection to Razorpay checkout for ₹50
  const handlePayAndGenerate = async () => {
    setCheckoutError("");
    setIsInitiatingPayment(true);

    try {
      // 1. Load Razorpay library
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to contact payment script gateway.");
      }

      // 2. Create Order on backend
      const order = await createResumeOrder({ resumeData: resume });

      // 3. Configure Checkout Options
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "InternArea",
        description: "Professional PDF Resume Generation Fee",
        order_id: order.orderId,
        prefill: {
          name: freshUser?.name || user.name,
          email: freshUser?.email || user.email,
        },
        theme: { color: "#0052CC" },
        handler: async (response) => {
          setIsInitiatingPayment(true);
          try {
            const verificationResult = await verifyResumePayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Refresh fresh candidate user details
            const freshProfile = await getMe();
            setFreshUser(freshProfile);
            setGeneratedResumeUrl(verificationResult.resumeUrl);
            setCheckoutStep("success");
            
            if (addToast) addToast("Resume generated successfully and linked to profile!", "success");
          } catch (err) {
            console.error("Signature verification error:", err);
            setCheckoutError(err.response?.data?.message || "Payment confirmation failed. Contact support.");
          } finally {
            setIsInitiatingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsInitiatingPayment(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      setCheckoutError(err.response?.data?.message || err.message || "Failed to initialize payment gateway.");
      setIsInitiatingPayment(false);
    }
  };

  // Loading Screen
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-semibold text-sm">Loading resume profile settings...</p>
        </div>
      </div>
    );
  }


  // Resolve backend resume path
  const backendBaseUrl = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://intern-area-fullstack.onrender.com";

  const resumeDownloadUrl = freshUser?.resumeUrl 
    ? (freshUser.resumeUrl.startsWith("http") ? freshUser.resumeUrl : `${backendBaseUrl}${freshUser.resumeUrl}`)
    : null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      
      {/* Header Sticky Banner */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 lg:px-8 mb-8 lg:sticky lg:top-16 z-30 shadow-sm backdrop-blur-md bg-white/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button 
            onClick={() => {
              if (returnToApplyAfterResume && onReturnToApply) {
                onReturnToApply();
              } else {
                setView("dashboard");
              }
            }}
            className="text-xs text-slate-500 hover:text-primary font-bold flex items-center gap-1.5 transition-colors mb-1 cursor-pointer"
          >
            {returnToApplyAfterResume ? "← Back to application" : "← Back to Dashboard"}
          </button>
          <h1 className="font-outfit font-black text-2xl text-slate-800 tracking-tight">Interactive Resume Builder</h1>
        </div>
        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleLocalSave}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Save Draft
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            🖨️ Local Print
          </button>
          <button
            onClick={handleInitiateVerification}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-extrabold rounded-xl text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            Generate Premium Resume (₹50)
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dynamic PDF Resume Notification Banner */}
        {resumeDownloadUrl && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-5 py-4 text-xs font-semibold shadow-sm mb-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-xl">🏆</span>
              <div>
                <p className="font-bold">Premium Resume Generated & Linked!</p>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Your generated resume is saved. Recruiters will automatically view this PDF when you apply.</p>
              </div>
            </div>
            <a 
              href={resumeDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shrink-0 cursor-pointer text-center inline-block"
            >
              📥 Download / View PDF Resume
            </a>
          </div>
        )}

        {/* Mobile View Navigation Tabs */}
        <div className="lg:hidden flex border border-slate-200 rounded-xl mb-6 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setActiveMobileTab("edit")}
            className={`flex-1 py-2.5 text-center text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMobileTab === "edit"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            📝 Edit Details
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab("preview")}
            className={`flex-1 py-2.5 text-center text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMobileTab === "preview"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            👁️ Live Preview
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Input Form */}
          <div className={`lg:col-span-7 space-y-6 lg:max-h-[80vh] lg:overflow-y-auto lg:pr-3 scrollbar-thin print:hidden ${
            activeMobileTab === "edit" ? "block" : "hidden lg:block"
          }`}>
          
            {/* 1. Personal Information */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="font-outfit font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <span>👤</span> Personal Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 pb-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {resume.photoUrl ? (
                      <div className="relative w-16 h-16 rounded-full border border-slate-200 overflow-hidden shadow-inner group">
                        <img src={resume.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={removePhoto}
                          className="absolute inset-0 bg-black/60 text-white font-bold text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold border border-slate-200">
                        No Photo
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-extrabold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-400">Accepts PNG, JPG, or JPEG. Max size 1MB.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={resume.name}
                    onChange={handleChange}
                    placeholder="e.g. Abcd"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={resume.email}
                    onChange={handleChange}
                    placeholder="e.g. abcd@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={resume.phone}
                    onChange={handleChange}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Place</label>
                  <input
                    type="text"
                    name="place"
                    value={resume.place}
                    onChange={handleChange}
                    placeholder="e.g. Bangalore, India"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 2. Career Objective */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="font-outfit font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <span>🎯</span> Career Objective
              </h3>
              <div>
                <textarea
                  name="careerObjective"
                  rows="3"
                  value={resume.careerObjective}
                  onChange={handleChange}
                  placeholder="Brief summary of your professional goals..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-primary transition-all resize-none"
                />
              </div>
            </div>

            {/* 3. Education Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-outfit font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <span>🎓</span> Education History
                </h3>
                <button
                  type="button"
                  onClick={addEducation}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  + Add Degree
                </button>
              </div>
              
              <div className="space-y-4">
                {resume.education.map((edu) => (
                  <div key={edu.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl relative space-y-3">
                    <button
                      type="button"
                      onClick={() => removeEducation(edu.id)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-rose-500 text-xs transition-colors cursor-pointer"
                    >
                      🗑️
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Degree / Course</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => handleEduChange(edu.id, "degree", e.target.value)}
                          placeholder="e.g. B.Tech in CSE"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">School / University</label>
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => handleEduChange(edu.id, "school", e.target.value)}
                          placeholder="e.g. IIT Delhi"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Duration / Years</label>
                        <input
                          type="text"
                          value={edu.year}
                          onChange={(e) => handleEduChange(edu.id, "year", e.target.value)}
                          placeholder="e.g. 2022 - 2026"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Score / GPA</label>
                        <input
                          type="text"
                          value={edu.score}
                          onChange={(e) => handleEduChange(edu.id, "score", e.target.value)}
                          placeholder="e.g. 9.1 CGPA"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {resume.education.length === 0 && (
                  <p className="text-xs text-slate-400 font-medium text-center py-4">No education entries added yet.</p>
                )}
              </div>
            </div>

            {/* 4. Work Experience */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-outfit font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <span>💼</span> Work Experience (Job/Internship)
                </h3>
                <button
                  type="button"
                  onClick={addExperience}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  + Add Experience
                </button>
              </div>
              
              <div className="space-y-4">
                {resume.experience.map((exp) => (
                  <div key={exp.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl relative space-y-3">
                    <button
                      type="button"
                      onClick={() => removeExperience(exp.id)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-rose-500 text-xs transition-colors cursor-pointer"
                    >
                      🗑️
                    </button>
                    <div className="flex items-center space-x-2 pb-1 pr-6">
                      <button
                        type="button"
                        onClick={() => handleExpChange(exp.id, "type", "Internship")}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full border cursor-pointer transition-all ${
                          exp.type === "Internship"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-white text-slate-500 border-slate-200"
                        }`}
                      >
                        Internship
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExpChange(exp.id, "type", "Job")}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full border cursor-pointer transition-all ${
                          exp.type === "Job"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-white text-slate-500 border-slate-200"
                        }`}
                      >
                        Job
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Role Name</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => handleExpChange(exp.id, "role", e.target.value)}
                          placeholder="e.g. Web Developer"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Company Name</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleExpChange(exp.id, "company", e.target.value)}
                          placeholder="e.g. Google"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Duration</label>
                        <input
                          type="text"
                          value={exp.duration}
                          onChange={(e) => handleExpChange(exp.id, "duration", e.target.value)}
                          placeholder="e.g. Jan 2024 - Present"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Description / Achievements</label>
                        <textarea
                          rows="2"
                          value={exp.description}
                          onChange={(e) => handleExpChange(exp.id, "description", e.target.value)}
                          placeholder="Detail your responsibilities and achievements..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {resume.experience.length === 0 && (
                  <p className="text-xs text-slate-400 font-medium text-center py-4">No work experience entries added yet.</p>
                )}
              </div>
            </div>

            {/* 5. Academics / Personal Projects */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-outfit font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <span>🧪</span> Academics / Personal Projects
                </h3>
                <button
                  type="button"
                  onClick={addProject}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  + Add Project
                </button>
              </div>
              
              <div className="space-y-4">
                {resume.projects.map((proj) => (
                  <div key={proj.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl relative space-y-3">
                    <button
                      type="button"
                      onClick={() => removeProject(proj.id)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-rose-500 text-xs transition-colors cursor-pointer"
                    >
                      🗑️
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Project Title</label>
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => handleProjChange(proj.id, "title", e.target.value)}
                          placeholder="e.g. Chat App"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Technologies Used</label>
                        <input
                          type="text"
                          value={proj.tech}
                          onChange={(e) => handleProjChange(proj.id, "tech", e.target.value)}
                          placeholder="e.g. HTML, Node.js"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Description</label>
                        <textarea
                          rows="2"
                          value={proj.description}
                          onChange={(e) => handleProjChange(proj.id, "description", e.target.value)}
                          placeholder="Describe the application features and scope..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {resume.projects.length === 0 && (
                  <p className="text-xs text-slate-400 font-medium text-center py-4">No projects added yet.</p>
                )}
              </div>
            </div>

            {/* 6. Core Skills */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="font-outfit font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <span>🚀</span> Core Skills
              </h3>
              
              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="e.g. React Native (Press Enter)"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-primary transition-all"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Add
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-2">
                {resume.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-100 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    onClick={() => removeSkill(idx)}
                    title="Click to remove"
                  >
                    {skill}
                    <span className="text-[9px] opacity-60">✕</span>
                  </span>
                ))}
                {resume.skills.length === 0 && (
                  <p className="text-xs text-slate-400 font-medium py-1">No skills added yet.</p>
                )}
              </div>
            </div>

            {/* 7. Certifications Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-outfit font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <span>📜</span> Certifications
                </h3>
                <button
                  type="button"
                  onClick={addCertification}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  + Add Certification
                </button>
              </div>
              <div className="space-y-3">
                {(resume.certifications || []).map((cert, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={cert}
                      onChange={(e) => handleCertificationChange(idx, e.target.value)}
                      placeholder="e.g. AWS Certified Solutions Architect..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => removeCertification(idx)}
                      className="text-slate-400 hover:text-rose-500 text-xs transition-colors cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                {(!resume.certifications || resume.certifications.length === 0) && (
                  <p className="text-xs text-slate-400 font-medium text-center py-2">No certifications added yet.</p>
                )}
              </div>
            </div>

            {/* 8. Achievements Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-outfit font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <span>🏆</span> Professional Achievements
                </h3>
                <button
                  type="button"
                  onClick={addAchievement}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  + Add Achievement
                </button>
              </div>
              <div className="space-y-3">
                {(resume.achievements || []).map((ach, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={ach}
                      onChange={(e) => handleAchievementChange(idx, e.target.value)}
                      placeholder="e.g. Secured 1st rank in National Web Dev Hackathon..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => removeAchievement(idx)}
                      className="text-slate-400 hover:text-rose-500 text-xs transition-colors cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                {(!resume.achievements || resume.achievements.length === 0) && (
                  <p className="text-xs text-slate-400 font-medium text-center py-2">No achievements added yet.</p>
                )}
              </div>
            </div>

            {/* 9. Extra-Curricular Activities Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-outfit font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <span>🏃‍♂️</span> Extra-Curricular Activities
                </h3>
                <button
                  type="button"
                  onClick={addExtraCurricular}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  + Add Activity
                </button>
              </div>
              <div className="space-y-3">
                {(resume.extraCurriculars || []).map((ec, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={ec}
                      onChange={(e) => handleExtraCurricularChange(idx, e.target.value)}
                      placeholder="e.g. Led college hackathon team as project lead..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => removeExtraCurricular(idx)}
                      className="text-slate-400 hover:text-rose-500 text-xs transition-colors cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                {(!resume.extraCurriculars || resume.extraCurriculars.length === 0) && (
                  <p className="text-xs text-slate-400 font-medium text-center py-2">No activities added yet.</p>
                )}
              </div>
            </div>

            {/* 10. Portfolio */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="font-outfit font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <span>🔗</span> Portfolio & Social Links
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">GitHub URL</label>
                  <input
                    type="text"
                    name="github"
                    value={resume.portfolio?.github || ""}
                    onChange={handlePortfolioChange}
                    placeholder="github.com/profile"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    name="linkedin"
                    value={resume.portfolio?.linkedin || ""}
                    onChange={handlePortfolioChange}
                    placeholder="linkedin.com/in/profile"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Personal Website</label>
                  <input
                    type="text"
                    name="website"
                    value={resume.portfolio?.website || ""}
                    onChange={handlePortfolioChange}
                    placeholder="website.dev"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Real-Time Preview (A4 Simulation) */}
          <div className={`lg:col-span-5 lg:sticky lg:top-[148px] bg-white border border-slate-200 rounded-2xl shadow-md p-4 sm:p-8 min-h-[75vh] flex flex-col overflow-y-auto scrollbar-thin ${
            activeMobileTab === "preview" ? "flex" : "hidden lg:flex"
          }`}>
            
            <div className="flex-1 space-y-3.5 print:space-y-2.5" id="resume-print-area">
              
              {/* Profile Photo & Info Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
                <div className="flex-1 min-w-0 pr-4">
                  <h2 className="font-outfit font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight leading-none uppercase break-words">
                    {isCleanSlate ? fallbackDetails.name : (resume.name || "YOUR NAME")}
                  </h2>
                  <div className="contact-header text-[9px] font-bold text-primary tracking-wider uppercase mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
                    <span>📍 {isCleanSlate ? fallbackDetails.place : (resume.place || "City, Country")}</span>
                    <span>•</span>
                    <span>✉️ {isCleanSlate ? fallbackDetails.email : (resume.email || "email@address.com")}</span>
                    <span>•</span>
                    <span>📞 {isCleanSlate ? fallbackDetails.phone : (resume.phone || "Phone Number")}</span>
                    {(isCleanSlate ? fallbackDetails.portfolio?.linkedin : resume.portfolio?.linkedin) && (
                      <>
                        <span>•</span>
                        <span>🔗 {isCleanSlate ? fallbackDetails.portfolio.linkedin : resume.portfolio.linkedin}</span>
                      </>
                    )}
                    {(isCleanSlate ? fallbackDetails.portfolio?.github : resume.portfolio?.github) && (
                      <>
                        <span>•</span>
                        <span>🐙 {isCleanSlate ? fallbackDetails.portfolio.github : resume.portfolio.github}</span>
                      </>
                    )}
                    {(isCleanSlate ? fallbackDetails.portfolio?.website : resume.portfolio?.website) && (
                      <>
                        <span>•</span>
                        <span>🌐 {isCleanSlate ? fallbackDetails.portfolio.website : resume.portfolio.website}</span>
                      </>
                    )}
                  </div>
                </div>
                {/* Photo in Preview (optional/compact if exists) */}
                {resume.photoUrl && (
                  <div className="w-12 h-12 rounded-full border border-slate-200 overflow-hidden shrink-0 shadow-sm ml-2">
                    <img 
                      src={resume.photoUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              {/* Career Objective */}
              {(isCleanSlate || resume.careerObjective) && (
                <div className="space-y-1">
                  <h4 className="font-outfit font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-0.5">Career Objective</h4>
                  <p className="text-[10px] text-slate-600 leading-relaxed text-justify">
                    {isCleanSlate ? fallbackDetails.careerObjective : resume.careerObjective}
                  </p>
                </div>
              )}

              {/* Education */}
              {(isCleanSlate || resume.education.length > 0) && (
                <div className="space-y-1.5">
                  <h4 className="font-outfit font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-0.5">Education</h4>
                  <div className="space-y-2">
                    {(isCleanSlate ? fallbackDetails.education : resume.education).map((edu) => (
                      <div key={edu.id} className="flex justify-between items-start text-[10px] gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 break-words">{edu.degree || "Degree/Course Name"}</p>
                          <p className="text-slate-500 font-medium break-words">{edu.school || "School/University Name"}</p>
                        </div>
                        <div className="text-right text-[9px] text-slate-500 font-bold whitespace-nowrap shrink-0">
                          <p>{edu.year || "Year"}</p>
                          <p className="text-primary font-extrabold">{edu.score || "Grade Score"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {(isCleanSlate || resume.experience.length > 0) && (
                <div className="space-y-1.5">
                  <h4 className="font-outfit font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-0.5">Work Experience</h4>
                  <div className="space-y-2.5">
                    {(isCleanSlate ? fallbackDetails.experience : resume.experience).map((exp) => (
                      <div key={exp.id} className="space-y-0.5">
                        <div className="flex justify-between items-start text-[10px] gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800 flex items-center flex-wrap gap-1">
                              <span>{exp.role || "Job Role"}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full inline-block shrink-0 ${
                                exp.type === "Internship" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-blue-50 border border-blue-200 text-blue-700"
                              }`}>
                                {exp.type}
                              </span>
                            </p>
                            <p className="text-slate-500 font-medium break-words">{exp.company || "Company Name"}</p>
                          </div>
                          <div className="text-right text-[9px] text-slate-500 font-bold whitespace-nowrap shrink-0">
                            <p>{exp.duration || "Duration"}</p>
                          </div>
                        </div>
                        {exp.description && (
                          <p className="text-[9px] text-slate-600 leading-normal text-justify pl-1 border-l-2 border-slate-200">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {(isCleanSlate || resume.projects.length > 0) && (
                <div className="space-y-1.5">
                  <h4 className="font-outfit font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-0.5">Academics & Personal Projects</h4>
                  <div className="space-y-2.5">
                    {(isCleanSlate ? fallbackDetails.projects : resume.projects).map((proj) => (
                      <div key={proj.id} className="space-y-0.5 text-[10px]">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-slate-800 min-w-0 flex-1 break-words">{proj.title || "Project Title"}</p>
                          <span className="text-[8px] font-bold text-slate-500 bg-slate-100 rounded px-1.5 py-0.2 shrink-0 tech-tag">{proj.tech || "Tech Stack"}</span>
                        </div>
                        {proj.description && (
                          <p className="text-[9px] text-slate-600 leading-normal text-justify">
                            {proj.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {(isCleanSlate || resume.skills.length > 0) && (
                <div className="space-y-1.5">
                  <h4 className="font-outfit font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-0.5">Key Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {(isCleanSlate ? fallbackDetails.skills : resume.skills).map((skill, idx) => (
                      <span key={idx} className="bg-slate-50 border border-slate-200/80 rounded px-2 py-0.2 text-[8px] font-bold text-slate-600 whitespace-nowrap skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {(isCleanSlate || (resume.certifications && resume.certifications.length > 0)) && (
                <div className="space-y-1.5">
                  <h4 className="font-outfit font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-0.5">Certifications</h4>
                  <ul className="list-disc pl-4 text-[9px] text-slate-600 space-y-0.5">
                    {(isCleanSlate ? fallbackDetails.certifications : (resume.certifications || [])).map((cert, idx) => cert && (
                      <li key={idx} className="leading-normal">{cert}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Achievements */}
              {(isCleanSlate || (resume.achievements && resume.achievements.length > 0)) && (
                <div className="space-y-1.5">
                  <h4 className="font-outfit font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-0.5">Key Achievements</h4>
                  <ul className="list-disc pl-4 text-[9px] text-slate-600 space-y-0.5">
                    {(isCleanSlate ? fallbackDetails.achievements : (resume.achievements || [])).map((ach, idx) => ach && (
                      <li key={idx} className="leading-normal">{ach}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extra-Curricular Activities */}
              {(isCleanSlate || (resume.extraCurriculars && resume.extraCurriculars.length > 0)) && (
                <div className="space-y-1.5">
                  <h4 className="font-outfit font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-0.5">Extra-Curricular Activities</h4>
                  <ul className="list-disc pl-4 text-[9px] text-slate-600 space-y-0.5">
                    {(isCleanSlate ? fallbackDetails.extraCurriculars : (resume.extraCurriculars || [])).map((ec, idx) => ec && (
                      <li key={idx} className="leading-normal">{ec}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

            <div className="text-center pt-6 border-t border-slate-100 text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-auto print:hidden select-none">
              📄 Interactive Real-Time Preview
            </div>
          </div>

        </div>
      </div>

      {/* Checkout Verification & Payment Overlay Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            onClick={() => checkoutStep !== "success" && setShowCheckoutModal(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full relative z-10 p-6 sm:p-8 transform scale-100 transition-all duration-300 animate-scale-up text-center">
            {checkoutStep !== "success" && (
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            )}

            {/* Error Notification */}
            {checkoutError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs text-left font-semibold">
                ⚠️ {checkoutError}
              </div>
            )}

            {checkoutStep === "otp-send" && (
              <div className="space-y-4 py-4">
                <div className="w-16 h-16 bg-blue-50 text-primary text-3xl rounded-full flex items-center justify-center mx-auto animate-pulse">
                  📧
                </div>
                <h3 className="font-outfit font-black text-xl text-slate-800">Initiating Verification</h3>
                <p className="text-slate-500 text-xs">
                  We are sending a One-Time Verification Password (OTP) to your registered email address <strong>{freshUser?.email || user.email}</strong> to secure your transaction.
                </p>
                <div className="flex items-center justify-center py-2">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            )}

            {checkoutStep === "otp-verify" && (
              <div className="space-y-4 py-2">
                <div className="w-16 h-16 bg-amber-50 text-amber-500 text-3xl rounded-full flex items-center justify-center mx-auto">
                  🔑
                </div>
                <h3 className="font-outfit font-black text-xl text-slate-800 font-bold">Email Verification</h3>
                <p className="text-slate-500 text-xs">
                  Enter the 6-digit verification code sent to your email <strong>{freshUser?.email || user.email}</strong>.
                </p>
                <div className="pt-2">
                  <input
                    type="text"
                    maxLength="6"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit code"
                    className="w-full text-center tracking-widest font-mono font-black text-2xl border-2 border-slate-200 rounded-2xl py-3 px-4 outline-none focus:border-primary bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => setShowCheckoutModal(false)}
                    className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyOTP}
                    disabled={isVerifyingOtp || otpInput.length !== 6}
                    className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs rounded-xl disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>
                </div>
              </div>
            )}

            {checkoutStep === "payment" && (
              <div className="space-y-4 py-2">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 text-3xl rounded-full flex items-center justify-center mx-auto">
                  💳
                </div>
                <h3 className="font-outfit font-black text-xl text-slate-800">Secure Order Payment</h3>
                <p className="text-slate-500 text-xs">
                  Your email is successfully verified. Proceed to pay the <strong>₹50</strong> resume generation fee to compile and link your professional PDF resume.
                </p>

                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-left">
                  <div className="flex justify-between text-xs text-slate-500 font-semibold mb-1.5">
                    <span>Resume Service Fee</span>
                    <span>₹50.00</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 font-semibold pb-1.5 border-b border-slate-200">
                    <span>GST (Included)</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-800 pt-2">
                    <span>Amount Payable</span>
                    <span className="text-primary text-base font-black">₹50.00</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => setShowCheckoutModal(false)}
                    className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayAndGenerate}
                    disabled={isInitiatingPayment}
                    className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-light text-white font-extrabold text-xs rounded-xl disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20"
                  >
                    {isInitiatingPayment ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      "Pay ₹50 with Razorpay"
                    )}
                  </button>
                </div>
              </div>
            )}

            {checkoutStep === "success" && (
              <div className="space-y-4 py-4 animate-scale-up">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 text-5xl rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                  ✓
                </div>
                <h3 className="font-outfit font-black text-2xl text-slate-800">Resume Generated!</h3>
                <p className="text-slate-500 text-xs">
                  Your payment was successfully confirmed. Your professional PDF resume has been compiled and linked to your candidate profile.
                </p>

                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-800 font-semibold flex items-center justify-between text-left gap-2 mb-2">
                  <span className="truncate">📄 resume_{freshUser?._id || user._id}.pdf</span>
                  <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  {generatedResumeUrl && (
                    <a
                      href={generatedResumeUrl.startsWith("http") ? generatedResumeUrl : `${backendBaseUrl}${generatedResumeUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-extrabold text-xs shadow-lg hover:shadow-xl transition-all cursor-pointer text-center block"
                    >
                      📥 Download PDF Resume
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setShowCheckoutModal(false);
                      if (onSave) {
                        onSave(freshUser);
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Done — Return to Portal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global CSS for Print Mode — handled by handlePrint's dedicated window */}

    </div>
  );
}
