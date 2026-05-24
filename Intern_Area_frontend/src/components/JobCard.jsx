import React, { useState } from "react";

export default function JobCard({ job, onViewDetails, onApply }) {
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <div className="bg-white border border-slate-100 hover:border-primary/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative group flex flex-col justify-between">
      
      {/* Top Section: Header & Bookmark */}
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            {/* Mock Company Logo Avatar */}
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${job.logoColor} text-white flex items-center justify-center font-outfit font-bold text-lg shadow-sm`}>
              {job.company.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors flex items-center">
                {job.company}
                <span className="ml-1 text-sky-400 bg-sky-50 rounded-full p-0.5" title="Verified Employer">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{job.type}</span>
            </div>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className="p-2 rounded-full hover:bg-slate-50 transition-colors text-slate-300 hover:text-rose-500"
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 active:scale-75 ${
                bookmarked ? "fill-rose-500 text-rose-500 scale-110" : "currentColor"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>

        {/* Job Title */}
        <h3 className="font-outfit font-bold text-slate-800 text-base sm:text-lg mb-4 line-clamp-1">
          {job.title}
        </h3>

        {/* Details Row */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-slate-500 mb-5">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">📍</span>
            <span className="truncate">{job.location}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">💰</span>
            <span className="truncate font-semibold text-slate-700">{job.stipend.split(" / ")[0]}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">⏱️</span>
            <span>{job.duration}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">🚀</span>
            <span>{job.startDate}</span>
          </div>
        </div>

        {/* Skills Required Tags */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {job.skills.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-100 rounded-full px-2 py-0.5"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="text-[10px] font-bold text-primary bg-primary/5 rounded-full px-2 py-0.5">
              +{job.skills.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center space-x-2 pt-4 border-t border-slate-50 mt-auto">
        <button
          onClick={() => onViewDetails(job)}
          className="flex-1 text-center py-2 text-xs font-semibold text-slate-600 hover:text-primary hover:bg-slate-50 rounded-xl transition-all duration-200"
        >
          View Details
        </button>
        <button
          onClick={() => onApply(job)}
          className="flex-1 text-center py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-sm hover:shadow active:scale-95 transition-all duration-200"
        >
          Apply Now
        </button>
      </div>

    </div>
  );
}
