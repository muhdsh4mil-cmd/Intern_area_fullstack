import React, { useState, useEffect } from "react";
import JobCard from "./JobCard";
import { mockJobs } from "../data/mockData";

export default function JobSearch({
  searchQuery,
  setSearchQuery,
  onApply,
  jobs = [],
}) {
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stipendLimit, setStipendLimit] = useState(0); // 0 means any
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [jobType, setJobType] = useState("all"); // 'all', 'internship', 'job'
  const [activeJob, setActiveJob] = useState(null); // Selected job for details drawer

  // Available filters options collected dynamically
  const locations = Array.from(new Set(jobs.map((j) => j.location)));
  
  // Extract major skills or categories
  const categories = [
    "Developer",
    "Design",
    "Marketing",
    "Analyst",
    "Sales",
    "HR",
  ];

  // Filtering Logic
  useEffect(() => {
    let result = jobs;

    // Search query match (title, company, skills, description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.skills.some((s) => s.toLowerCase().includes(q)) ||
          job.location.toLowerCase().includes(q)
      );
    }

    // Location filter
    if (selectedLocation) {
      result = result.filter((job) => job.location === selectedLocation);
    }

    // Category filter
    if (selectedCategory) {
      const cat = selectedCategory.toLowerCase();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(cat) ||
          job.skills.some((s) => s.toLowerCase().includes(cat))
      );
    }

    // Remote filter
    if (onlyRemote) {
      result = result.filter((job) => job.isRemote || job.location.toLowerCase().includes("remote"));
    }

    // Job Type filter
    if (jobType === "internship") {
      result = result.filter((job) => job.type === "Internship");
    } else if (jobType === "job") {
      result = result.filter((job) => job.type === "Job");
    }

    // Stipend filter
    if (stipendLimit > 0) {
      result = result.filter((job) => {
        // Strip non-numbers from stipend string
        const match = job.stipend.replace(/[^0-9]/g, "");
        const value = parseInt(match, 10);
        if (isNaN(value)) return true; // Keep jobs that don't have standard stipend
        // If it's a job salary range, e.g. "800000 - 1200000 / year", convert to equivalent monthly for filter
        const monthlyEquivalent = job.stipend.includes("year") ? value / 12 : value;
        return monthlyEquivalent >= stipendLimit;
      });
    }

    setFilteredJobs(result);
  }, [searchQuery, selectedLocation, selectedCategory, onlyRemote, jobType, stipendLimit, jobs]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedLocation("");
    setSelectedCategory("");
    setStipendLimit(0);
    setOnlyRemote(false);
    setJobType("all");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm h-fit">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-outfit font-bold text-slate-800 text-lg">Filters</h3>
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-6">
            {/* Work from Home Toggles */}
            <div>
              <label className="flex items-center space-x-2.5 cursor-pointer text-slate-600 hover:text-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={onlyRemote}
                  onChange={(e) => setOnlyRemote(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4.5 h-4.5 border-slate-300"
                />
                <span className="text-sm font-medium">Work from home / Remote</span>
              </label>
            </div>

            {/* Profile Category Select */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">
                Profile Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary transition-colors"
              >
                <option value="">Choose category...</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Location Select */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">
                Preferred Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary transition-colors"
              >
                <option value="">Choose location...</option>
                {locations.map((loc, idx) => (
                  <option key={idx} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Job Type Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">
                Position Type
              </label>
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                <button
                  onClick={() => setJobType("all")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    jobType === "all" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setJobType("internship")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    jobType === "internship" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Internships
                </button>
                <button
                  onClick={() => setJobType("job")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    jobType === "job" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Jobs
                </button>
              </div>
            </div>

            {/* Stipend Range Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-outfit">
                  Min Monthly Stipend / Salary
                </label>
                <span className="text-xs font-bold text-primary">
                  {stipendLimit === 0 ? "Any" : `₹${stipendLimit.toLocaleString()}`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50000"
                step="5000"
                value={stipendLimit}
                onChange={(e) => setStipendLimit(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                <span>Any</span>
                <span>₹25K</span>
                <span>₹50K+</span>
              </div>
            </div>

          </div>
        </div>

        {/* Listings Panel */}
        <div className="lg:col-span-3">
          
          {/* Header metadata */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h2 className="font-outfit font-extrabold text-2xl text-slate-800">
                {searchQuery ? `Search results for "${searchQuery}"` : "Matching Opportunities"}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                {filteredJobs.length} opportunities matching your preferences
              </p>
            </div>

            {/* Quick Keywords Filter Tags */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSearchQuery("React")}
                className="text-xs bg-primary/5 text-primary hover:bg-primary/10 rounded-full px-3 py-1 font-semibold border border-primary/10 transition-colors"
              >
                React
              </button>
              <button
                onClick={() => setSearchQuery("Figma")}
                className="text-xs bg-pink-50 text-pink-500 hover:bg-pink-100 rounded-full px-3 py-1 font-semibold border border-pink-100 transition-colors"
              >
                Figma
              </button>
              <button
                onClick={() => setSearchQuery("Python")}
                className="text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-full px-3 py-1 font-semibold border border-amber-100 transition-colors"
              >
                Python
              </button>
            </div>
          </div>

          {/* Cards List Grid */}
          {filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onViewDetails={(j) => setActiveJob(j)}
                  onApply={onApply}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
              <span className="text-5xl block mb-4">🔍</span>
              <h3 className="font-outfit font-bold text-lg text-slate-800 mb-2">No matching opportunities found</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                Try loosening your filters, resetting the search bar query, or exploring different remote positions.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-sm transition-all"
              >
                Reset Search Filters
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Center Details Modal */}
      {activeJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Overlay mask */}
          <div
            onClick={() => setActiveJob(null)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          ></div>

          {/* Modal Panel */}
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col justify-between transform transition-all duration-300 animate-scale-up z-10 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${activeJob.logoColor} text-white flex items-center justify-center font-outfit font-bold text-lg`}>
                  {activeJob.company.charAt(0)}
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-slate-800 text-lg leading-tight">
                    {activeJob.title}
                  </h3>
                  <p className="text-sm font-semibold text-slate-400">
                    {activeJob.company} • {activeJob.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveJob(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
              
              {/* Highlight statistics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider font-outfit">Location</span>
                  <span className="text-sm font-bold text-slate-700">{activeJob.location}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider font-outfit">Stipend / Salary</span>
                  <span className="text-sm font-bold text-primary">{activeJob.stipend.split(" / ")[0]}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider font-outfit">Duration</span>
                  <span className="text-sm font-bold text-slate-700">{activeJob.duration}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider font-outfit">Openings</span>
                  <span className="text-sm font-bold text-slate-700">{activeJob.openings} positions</span>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <h4 className="font-outfit font-bold text-slate-800 text-sm tracking-wider uppercase mb-3">About the Position</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{activeJob.description}</p>
              </div>

              {/* Responsibilities list */}
              {activeJob.responsibilities && (
                <div>
                  <h4 className="font-outfit font-bold text-slate-800 text-sm tracking-wider uppercase mb-3">Key Responsibilities</h4>
                  <ul className="space-y-2 text-slate-600 text-sm">
                    {activeJob.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-primary mr-2.5 mt-1 text-xs">⚡</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements list */}
              {activeJob.requirements && (
                <div>
                  <h4 className="font-outfit font-bold text-slate-800 text-sm tracking-wider uppercase mb-3">Candidate Requirements</h4>
                  <ul className="space-y-2 text-slate-600 text-sm">
                    {activeJob.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-emerald-500 mr-2.5 mt-1 text-xs">✓</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full skills list */}
              <div>
                <h4 className="font-outfit font-bold text-slate-800 text-sm tracking-wider uppercase mb-3">Required Technical Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {activeJob.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 rounded-lg px-3 py-1 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all cursor-pointer"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Sticky Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0 z-10 flex gap-4">
              <button
                onClick={() => { setActiveJob(null); onApply(activeJob); }}
                className="w-full text-center py-3.5 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md hover:shadow-lg transform active:scale-98 transition-all"
              >
                Apply to {activeJob.company} Now
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
