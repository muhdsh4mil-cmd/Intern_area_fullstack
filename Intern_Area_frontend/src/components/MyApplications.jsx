import React, { useState } from "react";
import { mockJobs } from "../data/mockData";

export default function MyApplications({ user, applications, setView }) {
  // Filter only applications belonging to the active logged-in candidate
  const myApps = applications.filter(
    (app) => app.candidateName === user.name || app.email === user.email
  );

  const [expandedAppId, setExpandedAppId] = useState(null);

  const toggleExpand = (appId) => {
    setExpandedAppId(prev => (prev === appId ? null : appId));
  };

  // Helper to find job details
  const getJobDetails = (jobId) => {
    const job = mockJobs.find((j) => j.id === jobId);
    if (job) return job;
    
    // Check if the user added it dynamically
    return {
      title: "Custom Applied Role",
      company: "Company Listed",
      type: "Job/Internship",
      stipend: "Not Specified",
      location: "Remote/In-office"
    };
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Applied":
        return "bg-slate-100 text-slate-700 border-slate-200/80";
      case "Shortlisted":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Selected":
      case "Hired":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Button */}
        <button
          onClick={() => setView("dashboard")}
          className="group flex items-center space-x-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors mb-6"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Dashboard</span>
        </button>

        {/* Dashboard Header Summary */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="font-outfit font-black text-2xl text-slate-800 tracking-tight mb-2">Track Applications</h1>
            <p className="text-xs text-slate-400 font-medium">
              Monitor candidate selection pipeline, cover letters, and recruiter reviews.
            </p>
          </div>
          
          {/* Stats Bar */}
          <div className="flex gap-4 sm:gap-6 bg-slate-50 border border-slate-100 rounded-2xl p-4 self-start md:self-auto">
            <div className="text-center px-2">
              <span className="block text-2xl font-black text-slate-800 font-outfit">{myApps.length}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Sent</span>
            </div>
            <div className="w-px bg-slate-200 my-1"></div>
            <div className="text-center px-2">
              <span className="block text-2xl font-black text-amber-500 font-outfit">
                {myApps.filter(a => a.status === "Shortlisted").length}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Shortlisted</span>
            </div>
            <div className="w-px bg-slate-200 my-1"></div>
            <div className="text-center px-2">
              <span className="block text-2xl font-black text-emerald-500 font-outfit">
                {myApps.filter(a => a.status === "Selected" || a.status === "Hired").length}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hired</span>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {myApps.map((app) => {
            const job = getJobDetails(app.jobId);
            const isExpanded = expandedAppId === app.id;
            
            return (
              <div 
                key={app.id} 
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Collapsed view Header */}
                <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-outfit font-extrabold text-slate-800 text-base">
                        {job.title}
                      </h3>
                      <span className={`text-[10px] font-bold border rounded px-2 py-0.5 uppercase tracking-wide ${getStatusBadgeClass(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                      <span>🏢 {job.company}</span>
                      <span>•</span>
                      <span>📍 {job.location} {job.isRemote && "(Remote)"}</span>
                      <span>•</span>
                      <span>💰 {job.stipend}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4 self-end sm:self-auto">
                    <span className="text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap">
                      Applied: {app.appliedDate}
                    </span>
                    <button
                      onClick={() => toggleExpand(app.id)}
                      className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500"
                    >
                      <svg 
                        className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded view */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-4 border-t border-slate-100 bg-slate-50/30 space-y-6">
                    {/* Cover Letter */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 font-outfit uppercase tracking-wider">Your Cover Letter</h4>
                      <div className="bg-white border border-slate-100 rounded-xl p-4 text-xs text-slate-600 leading-relaxed shadow-sm text-justify whitespace-pre-line">
                        {app.coverLetter || "No custom cover letter was submitted with this application."}
                      </div>
                    </div>

                    {(app.customResumeDataUrl || app.customResumeName) && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-700 font-outfit uppercase tracking-wider">Custom resume</h4>
                        {app.customResumeDataUrl ? (
                          <a
                            href={app.customResumeDataUrl}
                            download={app.customResumeName || "resume.pdf"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
                          >
                            Open uploaded file{app.customResumeName ? ` (${app.customResumeName})` : ""}
                          </a>
                        ) : (
                          <p className="text-[11px] text-amber-600">{app.customResumeName} — stored by name only (file was too large for preview).</p>
                        )}
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-700 font-outfit uppercase tracking-wider">Application Tracking Timeline</h4>
                      
                      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                        {app.timeline.map((step, idx) => (
                          <div key={idx} className="relative flex flex-col gap-1 text-xs">
                            {/* Dot indicator */}
                            <span className="absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white bg-primary shadow-sm"></span>
                            
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-800">{step.status}</span>
                              <span className="text-[10px] text-slate-400 font-bold">{step.date}</span>
                            </div>
                            <p className="text-slate-500 font-medium pl-1.5 border-l border-slate-200/80 mt-0.5">
                              {step.note || "Application state updated successfully."}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty State */}
          {myApps.length === 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-sm space-y-6">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto text-2xl">
                ✉️
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="font-outfit font-extrabold text-slate-800 text-lg">No Active Applications</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You haven't applied to any internships or jobs yet. Build your resume, find matching positions, and submit applications to track them here!
                </p>
              </div>
              <button
                onClick={() => setView("jobs")}
                className="inline-flex items-center space-x-2 px-6 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <span>Browse Opportunities</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
