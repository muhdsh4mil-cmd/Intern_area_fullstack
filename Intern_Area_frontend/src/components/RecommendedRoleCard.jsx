import React from "react";

export default function RecommendedRoleCard({ job, onAssessDetails }) {
  const isInternship = job.type === "Internship";
  const badgeBg = isInternship
    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
    : "bg-blue-50 text-blue-700 border-blue-100";
  const stipendColor = isInternship ? "text-emerald-600 font-extrabold" : "text-blue-600 font-extrabold";
  const accentHover = isInternship
    ? "hover:bg-emerald-600 hover:border-emerald-600"
    : "hover:bg-blue-600 hover:border-blue-600";
  const btnBg = isInternship
    ? "bg-emerald-50/50 text-emerald-700 hover:text-white"
    : "bg-blue-50/50 text-blue-700 hover:text-white";

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1">
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className={`text-[10px] font-bold border rounded-lg px-2.5 py-1 uppercase tracking-wider ${badgeBg}`}>
            {job.type}
          </span>
          <span className={`text-xs ${stipendColor}`}>{job.stipend.split(" ")[0]}</span>
        </div>

        <h4 className="font-outfit font-extrabold text-slate-800 text-base line-clamp-1 mb-1">{job.title}</h4>
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold mb-4 flex-wrap gap-y-1">
          <span>{job.company}</span>
          <span className="text-slate-300">•</span>
          <span>{job.location}</span>
          {job.isRemote && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-primary font-bold">Remote</span>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 p-2.5 bg-slate-50 rounded-xl text-[11px] font-medium text-slate-500">
          <div className="flex items-center space-x-1.5">
            <span>📅</span>
            <span>{job.duration || "Full Time"}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span>⏳</span>
            <span>Starts {job.startDate || "Immediately"}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {job.skills.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg px-2.5 py-1">
              {skill}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="text-[10px] font-bold bg-slate-50 text-slate-400 rounded-lg px-2 py-1">
              +{job.skills.length - 3}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAssessDetails?.(job)}
        className={`w-full text-center mt-6 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer border border-transparent ${btnBg} ${accentHover}`}
      >
        Assess Details
      </button>
    </div>
  );
}
