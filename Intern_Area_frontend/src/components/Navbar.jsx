import React, { useState, useEffect, useRef } from "react";
import { mockJobs } from "../data/mockData";
import { SUPERHERO_AVATARS } from "../data/avatars";

export default function Navbar({
  currentView,
  setView,
  user,
  onLogout,
  onOpenModal,
  onOpenEditResume,
  searchQuery,
  setSearchQuery,
  onUpdateAvatar,
  onOpenAvatarModal,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null); // 'jobs', 'internships', 'courses', or null
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [manageAccountOpen, setManageAccountOpen] = useState(false);
  const searchRef = useRef(null);
  const megaMenuRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target)) {
        setActiveMegaMenu(null);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update suggestions on query change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }
    const filtered = mockJobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.skills.some((skill) =>
          skill.toLowerCase().includes(searchQuery.toLowerCase())
        )
    ).slice(0, 5);
    setSearchSuggestions(filtered);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchFocused(false);
    setView("jobs");
  };

  const handleSuggestionClick = (item) => {
    setSearchQuery(item.title);
    setSearchFocused(false);
    setView("jobs");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div
              onClick={() => {
                if (user) {
                  if (user.role === "admin") setView("admin");
                  else if (user.role === "employer") setView("employer");
                  else setView("dashboard");
                } else {
                  setView("landing");
                }
              }}
              className="flex items-center space-x-2 cursor-pointer group"
            >
              <svg
                className="w-8 h-8 text-primary transition-transform duration-300 group-hover:rotate-12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22 2L2 8.66667L11.5 12.5L22 2Z"
                  fill="currentColor"
                />
                <path
                  d="M22 2L11.5 12.5L14.5 22L22 2Z"
                  fill="currentColor"
                  opacity="0.85"
                />
                <path
                  d="M11.5 12.5L2 8.66667L6.5 15.5L11.5 12.5Z"
                  fill="currentColor"
                  opacity="0.7"
                />
              </svg>
              <span className="font-outfit font-extrabold text-xl tracking-tight text-slate-800 group-hover:text-primary transition-colors duration-200">
                INTERN<span className="text-primary"> AREA</span>
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-6" ref={megaMenuRef}>
              
              {/* Jobs Link & Mega Dropdown */}
              <div className="relative group">
                <button
                  onMouseEnter={() => setActiveMegaMenu("jobs")}
                  className={`flex items-center text-sm font-medium text-slate-600 hover:text-primary py-2 transition-colors duration-150 ${
                    activeMegaMenu === "jobs" ? "text-primary" : ""
                  }`}
                >
                  Jobs
                  <svg
                    className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                      activeMegaMenu === "jobs" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeMegaMenu === "jobs" && (
                  <div
                    onMouseLeave={() => setActiveMegaMenu(null)}
                    className="absolute left-0 mt-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-5 transform origin-top transition-all duration-200 grid grid-cols-2 gap-4"
                  >
                    <div>
                      <h4 className="font-outfit font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">Popular Sectors</h4>
                      <ul className="space-y-1 text-xs">
                        <li><button onClick={() => { setSearchQuery("Developer"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">IT & Developer</button></li>
                        <li><button onClick={() => { setSearchQuery("Designer"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Design & UX</button></li>
                        <li><button onClick={() => { setSearchQuery("Marketing"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Digital Marketing</button></li>
                        <li><button onClick={() => { setSearchQuery("Sales"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Sales & Retail</button></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-outfit font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">Locations</h4>
                      <ul className="space-y-1 text-xs">
                        <li><button onClick={() => { setSearchQuery("Bangalore"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Bangalore</button></li>
                        <li><button onClick={() => { setSearchQuery("Mumbai"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Mumbai</button></li>
                        <li><button onClick={() => { setSearchQuery("Delhi"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Delhi NCR</button></li>
                        <li><button onClick={() => { setSearchQuery("Remote"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Work From Home</button></li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Internships Link & Mega Dropdown */}
              <div className="relative group">
                <button
                  onMouseEnter={() => setActiveMegaMenu("internships")}
                  className={`flex items-center text-sm font-medium text-slate-600 hover:text-primary py-2 transition-colors duration-150 ${
                    activeMegaMenu === "internships" ? "text-primary" : ""
                  }`}
                >
                  Internships
                  <svg
                    className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                      activeMegaMenu === "internships" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeMegaMenu === "internships" && (
                  <div
                    onMouseLeave={() => setActiveMegaMenu(null)}
                    className="absolute left-0 mt-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-5 transform origin-top transition-all duration-200 grid grid-cols-2 gap-4"
                  >
                    <div>
                      <h4 className="font-outfit font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">Profiles</h4>
                      <ul className="space-y-1 text-xs">
                        <li><button onClick={() => { setSearchQuery("Web Development Intern"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Web Development</button></li>
                        <li><button onClick={() => { setSearchQuery("Graphic Design & UI"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Graphic Design</button></li>
                        <li><button onClick={() => { setSearchQuery("Product Management"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Product Management</button></li>
                        <li><button onClick={() => { setSearchQuery("HR Talent"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Human Resources</button></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-outfit font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">Duration</h4>
                      <ul className="space-y-1 text-xs">
                        <li><button onClick={() => { setSearchQuery("3 Months"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">3 Months</button></li>
                        <li><button onClick={() => { setSearchQuery("6 Months"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">6 Months</button></li>
                        <li><button onClick={() => { setSearchQuery("Remote"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Virtual / Virtual Remote</button></li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>


            </nav>
          </div>

          {/* Search bar & User Profile / Register Buttons */}
          <div className="flex items-center space-x-4">
            
            {/* Search Input Box */}
            <div ref={searchRef} className="hidden md:block relative w-64">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search jobs, skills, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 rounded-full py-2 pl-4 pr-10 outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                  <button type="submit" className="absolute right-3 top-2.5 text-slate-400 hover:text-primary transition-colors">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </form>

              {/* Autocomplete suggestions */}
              {searchFocused && searchSuggestions.length > 0 && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-100 p-2 z-50 transform origin-top animate-fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Suggested Results</div>
                  {searchSuggestions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSuggestionClick(item)}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-50 flex flex-col space-y-0.5 transition-colors duration-150"
                    >
                      <span className="font-semibold text-slate-700">{item.title}</span>
                      <span className="text-[10px] text-slate-400">{item.company} • {item.location}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth / Dynamic Dashboard Buttons */}
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Dashboard Shortcut */}
                <button
                  onClick={() => setView(user.role === "admin" ? "admin" : user.role === "employer" ? "employer" : "dashboard")}
                  className={`text-sm font-semibold px-4 py-2 rounded-full border transition-all duration-200 ${
                    currentView === "dashboard" || currentView === "employer" || currentView === "admin"
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {user.role === "admin" ? "Admin Portal" : user.role === "employer" ? "Recruit Portal" : "My Dashboard"}
                </button>

                {/* Profile Circle Avatar */}
                <div className="relative" ref={profileMenuRef}>
                  <button 
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-full p-1 pr-3 hover:bg-slate-100 transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
                      {user.avatar && SUPERHERO_AVATARS[user.avatar] ? (
                        SUPERHERO_AVATARS[user.avatar].svg
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                          {user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 hidden sm:inline-block max-w-[90px] truncate">
                      {user.name}
                    </span>
                  </button>

                  {/* Profile Dropdown (Exact Intern Area multi-option accordion!) */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 transform origin-top-right transition-all animate-fade-in">
                      
                      {/* Name and email */}
                      <div className="pb-3 border-b border-slate-100 mb-2.5">
                        <p className="text-sm font-bold text-slate-800 font-outfit truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{user.email || `${user.name.toLowerCase()}10@gmail.com`}</p>
                      </div>



                      {/* Main Navigation Links (Hidden for Admin) */}
                      {user.role !== "admin" && (
                        <div className="space-y-0.5 max-h-[300px] overflow-y-auto scrollbar-thin">
                          <button
                            onClick={() => { setView("dashboard"); setProfileMenuOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-primary transition-all duration-150"
                          >
                            Home
                          </button>
                           <button
                             onClick={() => { setView("applications"); setProfileMenuOpen(false); }}
                             className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-primary transition-all duration-150"
                           >
                             My Applications
                           </button>
                          <button
                            onClick={() => {
                              if (onOpenEditResume) onOpenEditResume();
                              else setView("edit-resume");
                              setProfileMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-primary transition-all duration-150"
                          >
                            Edit Resume
                          </button>
                            <button
                              onClick={() => { setView("preferences"); setProfileMenuOpen(false); }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-primary transition-all duration-150"
                            >
                              Edit Preferences
                            </button>
                            <button
                              onClick={() => { if (onOpenAvatarModal) onOpenAvatarModal(); setProfileMenuOpen(false); }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-primary transition-all duration-150 flex items-center justify-between"
                            >
                              <span>Choose Avatar</span>
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">🦸‍♂️ Custom</span>
                            </button>
                        </div>
                      )}

                      {/* Logout option at the very bottom */}
                      <div className="pt-2 mt-2 border-t border-slate-100">
                        <button
                          onClick={() => { onLogout(); setProfileMenuOpen(false); }}
                          className="w-full text-left px-3 py-2 text-xs font-extrabold text-rose-500 rounded-xl hover:bg-rose-50 transition-colors duration-150"
                        >
                          Logout
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Login */}
                <button
                  onClick={() => onOpenModal("login")}
                  className="text-sm font-semibold text-primary hover:text-primary-dark hover:bg-primary/5 px-4 py-2 rounded-full border border-primary/20 hover:border-primary/40 transition-all duration-200"
                >
                  Login
                </button>
                {/* Register */}
                <button
                  onClick={() => onOpenModal("register")}
                  className="text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-full shadow-md hover:shadow-lg transform active:scale-95 transition-all duration-200"
                >
                  Register
                </button>
                {/* Admin Option */}
                <button
                  onClick={() => onOpenModal("admin-login")}
                  className="text-sm font-semibold text-slate-700 hover:text-white bg-slate-200 hover:bg-slate-800 px-4 py-2 rounded-full shadow-sm hover:shadow-md transform active:scale-95 transition-all duration-200"
                >
                  Admin
                </button>

              </div>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 outline-none"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-3 shadow-md animate-fade-in">
          
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search jobs, skills, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 rounded-full py-2 pl-4 pr-10 outline-none"
            />
            <button type="submit" className="absolute right-3 top-2.5 text-slate-400">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Navigation Links */}
          <div className="space-y-1">
            <button
              onClick={() => { setView("jobs"); setSearchQuery(""); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-600 rounded-lg hover:bg-slate-50"
            >
              Browse Jobs
            </button>
            <button
              onClick={() => { setView("jobs"); setSearchQuery("Internship"); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-600 rounded-lg hover:bg-slate-50"
            >
              Browse Internships
            </button>

          </div>

          {/* User Profile / Auth buttons */}
          {user ? (
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <div className="flex items-center space-x-2 px-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {user.avatar && SUPERHERO_AVATARS[user.avatar] ? (
                    SUPERHERO_AVATARS[user.avatar].svg
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-700">{user.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={() => { setView(user.role === "admin" ? "admin" : user.role === "employer" ? "employer" : "dashboard"); setMobileMenuOpen(false); }}
                className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-primary rounded-full"
              >
                Go to Management Board
              </button>
              {user.role !== "admin" && (
                <button
                  onClick={() => { if (onOpenAvatarModal) onOpenAvatarModal(); setMobileMenuOpen(false); }}
                  className="w-full text-center px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full"
                >
                  Choose Avatar 🦸‍♂️
                </button>
              )}
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="w-full text-center px-4 py-2 text-sm font-semibold text-rose-500 bg-rose-50 rounded-full"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="border-t border-slate-100 pt-3 flex flex-col space-y-2">
              <button
                onClick={() => { onOpenModal("login"); setMobileMenuOpen(false); }}
                className="w-full py-2 text-center text-sm font-semibold text-primary border border-primary/20 rounded-full"
              >
                Login
              </button>
              <button
                onClick={() => { onOpenModal("register"); setMobileMenuOpen(false); }}
                className="w-full py-2 text-center text-sm font-semibold text-white bg-primary rounded-full"
              >
                Register
              </button>
              <button
                onClick={() => { onOpenModal("admin-login"); setMobileMenuOpen(false); }}
                className="w-full py-2 text-center text-sm font-semibold text-slate-700 bg-slate-200 rounded-full"
              >
                Admin
              </button>

            </div>
          )}
        </div>
      )}
    </header>
  );
}
