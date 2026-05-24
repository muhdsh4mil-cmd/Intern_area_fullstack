import React, { useState } from "react";

const initialResumeData = {
  name: "",
  email: "",
  phone: "",
  place: "",
  careerObjective: "",
  education: [],
  experience: [],
  projects: [],
  skills: [],
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
  portfolio: {
    github: "github.com/abcd-dev",
    linkedin: "linkedin.com/in/abcd",
    website: "abcd.dev"
  }
};

export default function EditResume({ user, setView, onSave, returnToApplyAfterResume, onReturnToApply }) {
  const [resume, setResume] = useState(() => {
    const resumeKey = `resume_${user.email || user.id || "guest"}`;
    const saved = localStorage.getItem(resumeKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      const cleanEdu = parsed.education ? parsed.education.filter(e => e.degree || e.school || e.year || e.score) : [];
      const cleanExp = parsed.experience ? parsed.experience.filter(e => e.role || e.company || e.duration || e.description) : [];
      const cleanProj = parsed.projects ? parsed.projects.filter(p => p.title || p.tech || p.description) : [];
      return {
        ...parsed,
        education: cleanEdu,
        experience: cleanExp,
        projects: cleanProj
      };
    }
    return initialResumeData;
  });

  const [skillInput, setSkillInput] = useState("");

  const isCleanSlate = !resume.name && !resume.email && !resume.phone && !resume.place && !resume.careerObjective && resume.education.length === 0 && resume.experience.length === 0 && resume.projects.length === 0 && resume.skills.length === 0 && !resume.portfolio.github && !resume.portfolio.linkedin && !resume.portfolio.website;

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

  // Save Resume
  const handleSave = () => {
    const resumeKey = `resume_${user.email || user.id || "guest"}`;
    localStorage.setItem(resumeKey, JSON.stringify(resume));
    if (onSave) {
      onSave(resume);
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 lg:px-8 mb-8 sticky top-16 z-30 shadow-sm backdrop-blur-md bg-white/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            🖨️ Print / Download PDF
          </button>
          <button
            onClick={handleSave}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Input Form */}
        <div className="lg:col-span-7 space-y-6 max-h-[80vh] lg:overflow-y-auto lg:pr-3 scrollbar-thin print:hidden">
          
          {/* 1. Personal Information */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="font-outfit font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
              <span>👤</span> Personal Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* 6. Skills */}
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

          {/* 7. Portfolio */}
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
                  value={resume.portfolio.github || ""}
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
                  value={resume.portfolio.linkedin || ""}
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
                  value={resume.portfolio.website || ""}
                  onChange={handlePortfolioChange}
                  placeholder="website.dev"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Real-Time Preview (Prints in standard A4 sheet!) */}
        <div className="lg:col-span-5 sticky top-[148px] bg-white border border-slate-200 rounded-2xl shadow-md p-8 min-h-[75vh] flex flex-col print:border-none print:shadow-none print:p-0 print:m-0 print:absolute print:inset-0 print:w-full print:h-full print:bg-white print:z-50 overflow-y-auto scrollbar-thin">
          
          <div className="flex-1 space-y-6 print:space-y-4" id="resume-print-area">
            
            {/* Header: Name, location, info */}
            <div className="text-center pb-5 border-b-2 border-slate-800 space-y-1.5">
              <h2 className="font-outfit font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight leading-none uppercase">
                {isCleanSlate ? fallbackDetails.name : (resume.name || "YOUR NAME")}
              </h2>
              <p className="text-[11px] font-bold text-primary tracking-wider uppercase flex justify-center gap-1.5 flex-wrap">
                <span>📍 {isCleanSlate ? fallbackDetails.place : (resume.place || "City, Country")}</span>
                <span>•</span>
                <span>📧 {isCleanSlate ? fallbackDetails.email : (resume.email || "email@address.com")}</span>
                <span>•</span>
                <span>📞 {isCleanSlate ? fallbackDetails.phone : (resume.phone || "Phone Number")}</span>
              </p>
            </div>

            {/* Career Objective */}
            {(isCleanSlate || resume.careerObjective) && (
              <div className="space-y-1.5">
                <h4 className="font-outfit font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-0.5">Career Objective</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed text-justify">
                  {isCleanSlate ? fallbackDetails.careerObjective : resume.careerObjective}
                </p>
              </div>
            )}

            {/* Education */}
            {(isCleanSlate || resume.education.length > 0) && (
              <div className="space-y-2">
                <h4 className="font-outfit font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-0.5">Education</h4>
                <div className="space-y-2">
                  {(isCleanSlate ? fallbackDetails.education : resume.education).map((edu) => (
                    <div key={edu.id} className="flex justify-between items-start text-[11px]">
                      <div>
                        <p className="font-bold text-slate-800">{edu.degree || "Degree/Course Name"}</p>
                        <p className="text-slate-500 font-medium">{edu.school || "School/University Name"}</p>
                      </div>
                      <div className="text-right text-[10px] text-slate-500 font-bold whitespace-nowrap">
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
              <div className="space-y-2">
                <h4 className="font-outfit font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-0.5">Work Experience</h4>
                <div className="space-y-3">
                  {(isCleanSlate ? fallbackDetails.experience : resume.experience).map((exp) => (
                    <div key={exp.id} className="space-y-1">
                      <div className="flex justify-between items-start text-[11px]">
                        <div>
                          <p className="font-bold text-slate-800">
                            {exp.role || "Job Role"} 
                            <span className={`ml-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              exp.type === "Internship" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-blue-50 border border-blue-200 text-blue-700"
                            }`}>
                              {exp.type}
                            </span>
                          </p>
                          <p className="text-slate-500 font-medium">{exp.company || "Company Name"}</p>
                        </div>
                        <div className="text-right text-[10px] text-slate-500 font-bold whitespace-nowrap">
                          <p>{exp.duration || "Duration"}</p>
                        </div>
                      </div>
                      {exp.description && (
                        <p className="text-[10px] text-slate-600 leading-normal text-justify pl-1 border-l-2 border-slate-200">
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
              <div className="space-y-2">
                <h4 className="font-outfit font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-0.5">Academics & Personal Projects</h4>
                <div className="space-y-3">
                  {(isCleanSlate ? fallbackDetails.projects : resume.projects).map((proj) => (
                    <div key={proj.id} className="space-y-1 text-[11px]">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-slate-800">{proj.title || "Project Title"}</p>
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">{proj.tech || "Tech Stack"}</span>
                      </div>
                      {proj.description && (
                        <p className="text-[10px] text-slate-600 leading-normal text-justify">
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
              <div className="space-y-2">
                <h4 className="font-outfit font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-0.5">Key Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {(isCleanSlate ? fallbackDetails.skills : resume.skills).map((skill, idx) => (
                    <span key={idx} className="bg-slate-50 border border-slate-200/80 rounded px-2 py-0.5 text-[9px] font-bold text-slate-600 whitespace-nowrap">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Links */}
            {(isCleanSlate || resume.portfolio.github || resume.portfolio.linkedin || resume.portfolio.website) && (
              <div className="space-y-2">
                <h4 className="font-outfit font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-0.5">Links / Portfolios</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-500">
                  {(isCleanSlate ? fallbackDetails.portfolio.github : resume.portfolio.github) && (
                    <span className="flex items-center gap-1">
                      🐙 <span className="hover:text-primary transition-colors">{isCleanSlate ? fallbackDetails.portfolio.github : resume.portfolio.github}</span>
                    </span>
                  )}
                  {(isCleanSlate ? fallbackDetails.portfolio.linkedin : resume.portfolio.linkedin) && (
                    <span className="flex items-center gap-1">
                      🔗 <span className="hover:text-primary transition-colors">{isCleanSlate ? fallbackDetails.portfolio.linkedin : resume.portfolio.linkedin}</span>
                    </span>
                  )}
                  {(isCleanSlate ? fallbackDetails.portfolio.website : resume.portfolio.website) && (
                    <span className="flex items-center gap-1">
                      🌐 <span className="hover:text-primary transition-colors">{isCleanSlate ? fallbackDetails.portfolio.website : resume.portfolio.website}</span>
                    </span>
                  )}
                </div>
              </div>
            )}

          </div>

          <div className="text-center pt-6 border-t border-slate-100 text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-auto print:hidden select-none">
            📄 Interactive Real-Time Preview
          </div>
        </div>

      </div>

      {/* Global CSS for Print Mode */}
      <style>{`
        @page {
          size: A4;
          margin: 0 !important; /* Disables default browser header & footer completely */
        }
        @media print {
          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #fff !important;
          }
          body * {
            visibility: hidden;
          }
          #resume-print-area, #resume-print-area * {
            visibility: visible;
          }
          #resume-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm; /* A4 Width */
            height: 297mm; /* A4 Height */
            padding: 16mm 20mm;
            box-sizing: border-box;
            background: #ffffff !important;
            overflow: hidden !important; /* Forces layout onto exactly one page */
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }
          
          /* Compact spacings to ensure all sections fit neatly */
          #resume-print-area .space-y-6 > * + * {
            margin-top: 12px !important;
          }
          #resume-print-area .space-y-3 > * + * {
            margin-top: 6px !important;
          }
          #resume-print-area .space-y-2 > * + * {
            margin-top: 4px !important;
          }
          
          /* Auto adjust font-sizes to fit */
          #resume-print-area h2 {
            font-size: 18pt !important;
            margin-bottom: 2px !important;
          }
          #resume-print-area h4 {
            font-size: 10pt !important;
            margin-top: 6px !important;
            margin-bottom: 2px !important;
          }
          #resume-print-area p, 
          #resume-print-area span, 
          #resume-print-area div {
            font-size: 9pt !important;
            line-height: 1.35 !important;
          }
        }
      `}</style>

    </div>
  );
}
