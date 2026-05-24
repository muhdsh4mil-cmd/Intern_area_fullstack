import React, { useState } from "react";

const popularInterests = [
  "Sales",
  "Data Entry",
  "Digital Marketing",
  "Marketing",
  "Human Resources (HR)",
  "General Management",
  "Social Media Marketing",
  "Finance",
  "Telecalling",
  "Market/Business Research",
  "Content Writing",
  "Accounts",
  "Project Management",
  "Operations",
  "Client Servicing",
  "Teaching",
  "Interior Design",
  "Software Testing"
];

const opportunitiesList = [
  "UI/UX Design",
  "Film Making",
  "Videography"
];

export default function Preferences({ user, setView, onSave }) {
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem(`preferences_${user.id}`);
    if (saved) return JSON.parse(saved);
    
    // Default preferences matching the screenshot
    return {
      interests: [
        "Web Development",
        "Graphic Design",
        "Software Development",
        "Programming",
        "Data Science",
        "Video Making/Editing",
        "Python/Django Development"
      ],
      lookingFor: ["Internships"], // Matches screenshot (Internships selected with 'x')
      workModes: ["Work from home"] // Matches screenshot (Work from home selected with 'x')
    };
  });

  const [searchVal, setSearchVal] = useState("");

  const handleAddInterest = (interest) => {
    const trimmed = interest.trim();
    if (!trimmed) return;
    if (preferences.interests.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      setSearchVal("");
      return;
    }
    setPreferences(prev => ({
      ...prev,
      interests: [...prev.interests, trimmed]
    }));
    setSearchVal("");
  };

  const handleRemoveInterest = (interest) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.filter(item => item !== interest)
    }));
  };

  const toggleLookingFor = (type) => {
    setPreferences(prev => {
      const active = prev.lookingFor.includes(type);
      return {
        ...prev,
        lookingFor: active 
          ? prev.lookingFor.filter(t => t !== type) 
          : [...prev.lookingFor, type]
      };
    });
  };

  const toggleWorkMode = (mode) => {
    setPreferences(prev => {
      const active = prev.workModes.includes(mode);
      return {
        ...prev,
        workModes: active 
          ? prev.workModes.filter(m => m !== mode) 
          : [...prev.workModes, mode]
      };
    });
  };

  const handleSave = () => {
    localStorage.setItem(`preferences_${user.id}`, JSON.stringify(preferences));
    if (onSave) onSave(preferences);
    setView("dashboard");
  };

  // Filter suggested popular interests based on search
  const filteredSuggestions = searchVal
    ? popularInterests.filter(item => item.toLowerCase().includes(searchVal.toLowerCase()))
    : [];

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Back navigation link */}
        <button
          onClick={() => setView("dashboard")}
          className="group flex items-center space-x-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors mb-6"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Dashboard</span>
        </button>

        {/* Form Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-10 space-y-8">
          <div>
            <h1 className="font-outfit font-black text-2xl text-slate-800 tracking-tight mb-2">Edit Preferences</h1>
            <p className="text-xs text-slate-400 font-medium">
              We will customize the job and internship recommendations on your home screen based on these details.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Section 1: Areas of Interest */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700 font-outfit uppercase tracking-wider">
              Area(s) of interest
            </label>
            
            {/* Search Input Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="h-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddInterest(searchVal);
                  }
                }}
                placeholder="Areas you want to work in or learn about"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none focus:bg-white focus:border-primary transition-all shadow-sm"
              />
              
              {/* Autocomplete Suggestion Dropdown */}
              {searchVal && filteredSuggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-50">
                  {filteredSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddInterest(item)}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary transition-all"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              {preferences.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm"
                >
                  <span>{interest}</span>
                  <button
                    onClick={() => handleRemoveInterest(interest)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors focus:outline-none"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              {preferences.interests.length === 0 && (
                <span className="text-xs text-slate-400 font-medium italic">No interests selected. Add some below!</span>
              )}
            </div>

            {/* Also select helper opportunities */}
            <div className="pt-4 space-y-3">
              <span className="block text-xs font-bold text-slate-500">Also select the following to get more opportunities</span>
              <div className="flex flex-wrap gap-2">
                {opportunitiesList.map((opp, idx) => {
                  const isSelected = preferences.interests.includes(opp);
                  if (isSelected) return null;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAddInterest(opp)}
                      className="inline-flex items-center space-x-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all select-none"
                    >
                      <span>{opp}</span>
                      <span className="text-slate-400 font-normal">+</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Popular Interests Lists */}
            <div className="pt-4 space-y-3">
              <span className="block text-xs font-bold text-slate-500">Popular career interests</span>
              <div className="flex flex-wrap gap-2">
                {popularInterests.map((interest, idx) => {
                  const isSelected = preferences.interests.includes(interest);
                  if (isSelected) return null;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAddInterest(interest)}
                      className="inline-flex items-center space-x-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all select-none"
                    >
                      <span>{interest}</span>
                      <span className="text-slate-400 font-normal">+</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Currently Looking For */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700 font-outfit uppercase tracking-wider">
              Currently looking for
            </label>
            <div className="flex gap-3">
              {["Jobs", "Internships"].map((type) => {
                const isActive = preferences.lookingFor.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleLookingFor(type)}
                    className={`inline-flex items-center space-x-1.5 border rounded-full px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                      isActive
                        ? "bg-primary border-primary text-white"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span>{type}</span>
                    {isActive ? (
                      <span className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">+</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 3: Work Mode */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700 font-outfit uppercase tracking-wider">
              Work mode
            </label>
            <div className="flex gap-3">
              {[
                { label: "In-office", value: "In-office" },
                { label: "Work from home", value: "Work from home" }
              ].map((mode) => {
                const isActive = preferences.workModes.includes(mode.value);
                return (
                  <button
                    key={mode.value}
                    onClick={() => toggleWorkMode(mode.value)}
                    className={`inline-flex items-center space-x-1.5 border rounded-full px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                      isActive
                        ? "bg-primary border-primary text-white"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span>{mode.label}</span>
                    {isActive ? (
                      <span className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">+</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Save Action */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setView("dashboard")}
              className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Save Preferences
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
