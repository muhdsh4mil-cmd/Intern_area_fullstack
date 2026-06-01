import React, { useState, useEffect, useRef } from "react";
import { mockJobs } from "../data/mockData";
import { SUPERHERO_AVATARS } from "../data/avatars";
import NotificationDropdown from "./NotificationDropdown";
import MessagesDropdown from "./MessagesDropdown";

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
  onOpenMessages,
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

              {user && (
                <>
                  {/* Community Link */}
                  <button
                    onClick={() => setView("community")}
                    className={`flex items-center text-sm font-semibold py-2 transition-all duration-150 border-b-2 cursor-pointer ${
                      currentView === "community"
                        ? "text-primary border-primary"
                        : "text-slate-600 border-transparent hover:text-primary"
                    }`}
                  >
                    Community
                  </button>

                  {/* Friends Link */}
                  <button
                    onClick={() => setView("friends")}
                    className={`flex items-center text-sm font-semibold py-2 transition-all duration-150 border-b-2 cursor-pointer ${
                      currentView === "friends"
                        ? "text-primary border-primary"
                        : "text-slate-600 border-transparent hover:text-primary"
                    }`}
                  >
                    Friends
                  </button>
                </>
              )}

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
                {/* Icons: Messages & Notifications */}
                <div className="flex items-center space-x-1 border-slate-200 pr-1 mr-1 md:border-r md:pr-3 md:mr-1">
                  {/* Messages — Real dropdown */}
                  <MessagesDropdown user={user} setView={setView} onOpenConversation={onOpenMessages} />

                  {/* Notifications — Real dropdown */}
                  <NotificationDropdown user={user} setView={setView} />
                </div>

                {/* Dashboard Shortcut */}
                <button
                  onClick={() => setView(user.role === "admin" ? "admin" : user.role === "employer" ? "employer" : "dashboard")}
                  className={`hidden sm:block text-sm font-semibold px-4 py-2 rounded-full border transition-all duration-200 ${
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
                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5 mb-1">{user.email || `${user.name.toLowerCase()}10@gmail.com`}</p>
                        {user.uniqueId && (
                          <div className="flex items-center justify-between mt-1 bg-slate-50 border border-slate-100 rounded-md p-1.5">
                            <div className="flex items-center space-x-1.5 overflow-hidden">
                              <span className="text-[10px] font-bold text-slate-500 tracking-wider shrink-0">ID:</span>
                              <span className="text-[11px] font-mono font-semibold text-slate-800 truncate select-all">{user.uniqueId}</span>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(user.uniqueId);
                              }}
                              className="ml-2 p-1 text-slate-400 hover:text-primary hover:bg-primary/10 rounded transition-colors shrink-0 group relative"
                              title="Copy User ID"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        )}
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
                            onClick={() => { setView("messages"); setProfileMenuOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-primary transition-all duration-150 flex items-center justify-between"
                          >
                            <span>Messages</span>
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
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
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 outline-none shrink-0"
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
        <div className="lg:hidden border-t border-slate-100 bg-white shadow-md animate-fade-in">

          {/* Mobile Search */}
          <div className="px-4 pt-3 pb-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search jobs, skills, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 rounded-full py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <button type="submit" className="absolute right-3 top-3 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-2 space-y-0.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 py-1.5">Browse</p>
            <button
              onClick={() => { setView("jobs"); setSearchQuery(""); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-50 flex items-center gap-3"
            >
              <span className="text-base">💼</span> Jobs
            </button>
            <button
              onClick={() => { setView("jobs"); setSearchQuery("Internship"); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-50 flex items-center gap-3"
            >
              <span className="text-base">🎓</span> Internships
            </button>

            {user && (
              <>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 py-1.5 mt-2">Community</p>
                <button
                  onClick={() => { setView("community"); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-3 transition-colors ${
                    currentView === "community"
                      ? "text-primary bg-primary/5"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-base">🌐</span> Community
                </button>
                <button
                  onClick={() => { setView("friends"); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-3 transition-colors ${
                    currentView === "friends"
                      ? "text-primary bg-primary/5"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-base">👥</span> Friends
                </button>
                <button
                  onClick={() => { setView("messages"); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-3 transition-colors ${
                    currentView === "messages"
                      ? "text-primary bg-primary/5"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-base">💬</span> Messages
                </button>
              </>
            )}
          </div>

          {/* User Section */}
          {user ? (
            <div className="px-4 py-3 border-t border-slate-100 space-y-2.5">
              {/* Profile info */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  {user.avatar && SUPERHERO_AVATARS[user.avatar] ? (
                    SUPERHERO_AVATARS[user.avatar].svg
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-400 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={() => { setView(user.role === "admin" ? "admin" : user.role === "employer" ? "employer" : "dashboard"); setMobileMenuOpen(false); }}
                className="w-full text-center px-4 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors"
              >
                {user.role === "admin" ? "Admin Portal" : user.role === "employer" ? "Recruit Portal" : "My Dashboard"}
              </button>
              {user.role !== "admin" && (
                <button
                  onClick={() => { if (onOpenAvatarModal) onOpenAvatarModal(); setMobileMenuOpen(false); }}
                  className="w-full text-center px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Choose Avatar 🦸‍♂️
                </button>
              )}
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="w-full text-center px-4 py-2.5 text-sm font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => { onOpenModal("login"); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-sm font-bold text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => { onOpenModal("register"); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors"
              >
                Register
              </button>
              <button
                onClick={() => { onOpenModal("admin-login"); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Admin Login
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
