import React, { useState, useEffect, useRef } from "react";
import { mockJobs } from "../data/mockData";
import { SUPERHERO_AVATARS } from "../data/avatars";
import NotificationDropdown from "./NotificationDropdown";
import MessagesDropdown from "./MessagesDropdown";
import { useLanguage } from "../i18n/LanguageContext";

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
  onLanguageChange,
  currentLanguage,
}) {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [manageAccountOpen, setManageAccountOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const searchRef = useRef(null);
  const megaMenuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const langDropdownRef = useRef(null);

  // Language options definition
  const LANGUAGES = [
    { code: "en", flag: "🇪🇬", name: "English",    native: "English" },
    { code: "es", flag: "🇪🇸", name: "Spanish",    native: "Español" },
    { code: "hi", flag: "🇮🇳", name: "Hindi",      native: "हिन्दी" },
    { code: "pt", flag: "🇧🇷", name: "Portuguese", native: "Português" },
    { code: "zh", flag: "🇨🇳", name: "Chinese",    native: "中文" },
    { code: "fr", flag: "🇫🇷", name: "French",     native: "Français", requiresOTP: true },
  ];

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
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

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
    <>
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
                  className={`flex items-center text-sm font-semibold text-slate-600 hover:text-primary py-2 border-b-2 border-transparent transition-all duration-150 cursor-pointer ${
                    activeMegaMenu === "jobs" ? "text-primary border-primary" : ""
                  }`}
                >
                  {t("nav_jobs")}
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
                      <h4 className="font-outfit font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">{t("nav_popular_sectors")}</h4>
                      <ul className="space-y-1 text-xs">
                        <li><button onClick={() => { setSearchQuery("Developer"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">IT & Developer</button></li>
                        <li><button onClick={() => { setSearchQuery("Designer"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Design & UX</button></li>
                        <li><button onClick={() => { setSearchQuery("Marketing"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Digital Marketing</button></li>
                        <li><button onClick={() => { setSearchQuery("Sales"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Sales & Retail</button></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-outfit font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">{t("nav_locations")}</h4>
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
                  className={`flex items-center text-sm font-semibold text-slate-600 hover:text-primary py-2 border-b-2 border-transparent transition-all duration-150 cursor-pointer ${
                    activeMegaMenu === "internships" ? "text-primary border-primary" : ""
                  }`}
                >
                  {t("nav_internships")}
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
                      <h4 className="font-outfit font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">{t("nav_profiles")}</h4>
                      <ul className="space-y-1 text-xs">
                        <li><button onClick={() => { setSearchQuery("Web Development Intern"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Web Development</button></li>
                        <li><button onClick={() => { setSearchQuery("Graphic Design & UI"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Graphic Design</button></li>
                        <li><button onClick={() => { setSearchQuery("Product Management"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Product Management</button></li>
                        <li><button onClick={() => { setSearchQuery("HR Talent"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Human Resources</button></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-outfit font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">{t("nav_duration")}</h4>
                      <ul className="space-y-1 text-xs">
                        <li><button onClick={() => { setSearchQuery("3 Months"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">3 Months</button></li>
                        <li><button onClick={() => { setSearchQuery("6 Months"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">6 Months</button></li>
                        <li><button onClick={() => { setSearchQuery("Remote"); setView("jobs"); setActiveMegaMenu(null); }} className="text-slate-600 hover:text-primary block py-1">Virtual / Virtual Remote</button></li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

                {user && user.role === "candidate" && (
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
                      {t("nav_community")}
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
                      {t("nav_friends")}
                    </button>

                    {/* Plans Link */}
                    <button
                      onClick={() => setView("pricing")}
                      className={`flex items-center gap-1 text-sm font-semibold py-2 transition-all duration-150 border-b-2 cursor-pointer ${
                        currentView === "pricing"
                          ? "text-primary border-primary"
                          : "text-slate-600 border-transparent hover:text-primary"
                      }`}
                    >
                      <span>{t("nav_plans")}</span>
                      <span className="text-[9px] font-extrabold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">NEW</span>
                    </button>
                  </>
                )}

                {user && user.role !== "candidate" && (
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
                      {t("nav_community")}
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
                      {t("nav_friends")}
                    </button>
                  </>
                )}

            </nav>
          </div>

          {/* Search bar & User Profile / Register Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
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
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t("nav_suggested_results")}</div>
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

            {/* 🌐 Language Switcher (Always Available for guests and logged-in users) */}
            <div className="relative shrink-0" ref={langDropdownRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="p-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-full transition-colors relative flex items-center justify-center cursor-pointer"
                title={t("nav_language")}
              >
                <span className="text-base leading-none">{LANGUAGES.find(l => l.code === currentLanguage)?.flag || "🇪🇬"}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-fade-in">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 py-1.5">{t("lang_select_title")}</p>
                  {LANGUAGES.map((lang) => {
                    const isActive = currentLanguage === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLangDropdownOpen(false);
                          onLanguageChange && onLanguageChange(lang.code);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-all duration-150 cursor-pointer ${
                          isActive
                            ? "bg-primary/8 text-primary"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-lg shrink-0">{lang.flag}</span>
                        <span className="flex-1">
                          <span className="block text-xs font-bold">{lang.native}</span>
                          <span className="block text-[10px] text-slate-400">{lang.name}</span>
                        </span>
                        {lang.requiresOTP && !isActive && (
                          <span className="text-amber-500 text-xs" title={t("lang_french_locked")}>🔒</span>
                        )}
                        {isActive && (
                          <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Auth / Dynamic Dashboard Buttons */}
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Icons: Messages & Notifications */}
                <div className="flex items-center space-x-0.5 sm:space-x-1 border-slate-200 pr-1 mr-1 md:border-r md:pr-3 md:mr-1">
                  {/* Messages — Real dropdown */}
                  <MessagesDropdown user={user} setView={setView} onOpenConversation={onOpenMessages} />

                  {/* Notifications — Real dropdown */}
                  <NotificationDropdown user={user} setView={setView} />
                </div>

                {/* Dashboard Shortcut */}
                <button
                  onClick={() => setView(user.role === "admin" ? "admin" : user.role === "employer" ? "employer" : "dashboard")}
                  className={`hidden sm:block text-sm font-semibold px-4 py-2 rounded-full border transition-all duration-200 cursor-pointer ${
                    currentView === "dashboard" || currentView === "employer" || currentView === "admin"
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {user.role === "admin" ? t("nav_admin_portal") : user.role === "employer" ? t("nav_recruit_portal") : t("nav_dashboard")}
                </button>

                {/* Profile Circle Avatar */}
                <div className="relative" ref={profileMenuRef}>
                  <button 
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center sm:space-x-2 bg-slate-50 border border-slate-200 rounded-full p-1 sm:pr-3 hover:bg-slate-100 transition-all duration-200"
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-white font-bold text-xs shadow-inner shrink-0">
                      {user.avatar && SUPERHERO_AVATARS[user.avatar] ? (
                        SUPERHERO_AVATARS[user.avatar].svg
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
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
                            {t("nav_home")}
                          </button>
                           <button
                             onClick={() => { setView("applications"); setProfileMenuOpen(false); }}
                             className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-primary transition-all duration-150"
                           >
                             {t("nav_applications")}
                           </button>
                          <button
                            onClick={() => { setView("messages"); setProfileMenuOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-primary transition-all duration-150 flex items-center justify-between"
                          >
                            <span>{t("nav_messages")}</span>
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
                            {t("nav_resume")}
                          </button>
                            <button
                              onClick={() => { setView("preferences"); setProfileMenuOpen(false); }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-primary transition-all duration-150"
                            >
                              {t("nav_preferences")}
                            </button>
                            {user.role === "candidate" && (
                              <button
                                onClick={() => { setView("pricing"); setProfileMenuOpen(false); }}
                                className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-primary transition-all duration-150 flex items-center justify-between"
                              >
                                <span>{t("nav_subscription_plans")}</span>
                                <span className="text-[9px] font-extrabold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">NEW</span>
                              </button>
                            )}
                            <button
                              onClick={() => { if (onOpenAvatarModal) onOpenAvatarModal(); setProfileMenuOpen(false); }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-primary transition-all duration-150 flex items-center justify-between"
                            >
                              <span>{t("nav_choose_avatar")}</span>
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
                          {t("nav_logout_btn")}
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex items-center space-x-2">
                {/* Login */}
                <button
                  onClick={() => onOpenModal("login")}
                  className="text-sm font-semibold text-primary hover:text-primary-dark hover:bg-primary/5 px-4 py-2 rounded-full border border-primary/20 hover:border-primary/40 transition-all duration-200 cursor-pointer"
                >
                  {t("nav_login")}
                </button>
                {/* Register */}
                <button
                  onClick={() => onOpenModal("register")}
                  className="text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-full shadow-md hover:shadow-lg transform active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  {t("nav_register")}
                </button>
                {/* Admin Option */}
                <button
                  onClick={() => onOpenModal("admin-login")}
                  className="text-sm font-semibold text-slate-700 hover:text-white bg-slate-200 hover:bg-slate-800 px-4 py-2 rounded-full shadow-sm hover:shadow-md transform active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  {t("nav_admin")}
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
    </header>

      {/* Mobile Menu Drawer Overlay & Panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
          ></div>

          {/* Drawer Slide-out Panel */}
          <div className="relative w-[85%] max-w-[320px] bg-white border-r border-slate-100 text-slate-800 h-full flex flex-col shadow-2xl z-10 animate-slide-right overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              {/* Logo */}
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
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
                  className="w-7 h-7 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M22 2L2 8.66667L11.5 12.5L22 2Z" fill="currentColor" />
                  <path d="M22 2L11.5 12.5L14.5 22L22 2Z" fill="currentColor" opacity="0.85" />
                  <path d="M11.5 12.5L2 8.66667L6.5 15.5L11.5 12.5Z" fill="currentColor" opacity="0.7" />
                </svg>
                <span className="font-outfit font-extrabold text-lg tracking-tight text-slate-800">
                  INTERN<span className="text-primary"> AREA</span>
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Search */}
            <div className="px-5 pt-4 pb-2">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search jobs, skills, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-full py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all font-sans"
                />
                <button type="submit" className="absolute right-3.5 top-3 text-slate-400 hover:text-primary cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Navigation Lists */}
            <div className="flex-1 py-4 px-5 space-y-6 overflow-y-auto">
              
              {/* Category 1: BROWSE */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest font-outfit">
                  {t("nav_browse")}
                </h4>
                
                {/* Jobs */}
                <button
                  onClick={() => { setView("jobs"); setSearchQuery(""); setMobileMenuOpen(false); }}
                  className="w-full flex items-start gap-3.5 p-2 -mx-2 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                >
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block font-bold text-sm text-slate-800 group-hover:text-primary transition-colors">{t("nav_jobs")}</span>
                    <span className="block text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">Find matching full-time positions and career growth opportunities.</span>
                  </div>
                </button>

                {/* Internships */}
                <button
                  onClick={() => { setView("jobs"); setSearchQuery("Internship"); setMobileMenuOpen(false); }}
                  className="w-full flex items-start gap-3.5 p-2 -mx-2 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                >
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" />
                    </svg>
                  </div>
                  <div>
                    <span className="block font-bold text-sm text-slate-800 group-hover:text-primary transition-colors">{t("nav_internships")}</span>
                    <span className="block text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">Explore student placements, virtual internships, and entry roles.</span>
                  </div>
                </button>
              </div>

              {/* Category 2: COMMUNITY */}
              {user && (
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest font-outfit">
                    Community
                  </h4>

                  {/* Community */}
                  <button
                    onClick={() => { setView("community"); setMobileMenuOpen(false); }}
                    className="w-full flex items-start gap-3.5 p-2 -mx-2 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                  >
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-slate-800 group-hover:text-primary transition-colors">{t("nav_community")}</span>
                      <span className="block text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">Join discussion boards, share experiences, and learn from peers.</span>
                    </div>
                  </button>

                  {/* Friends */}
                  <button
                    onClick={() => { setView("friends"); setMobileMenuOpen(false); }}
                    className="w-full flex items-start gap-3.5 p-2 -mx-2 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                  >
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-slate-800 group-hover:text-primary transition-colors">{t("nav_friends")}</span>
                      <span className="block text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">Connect with classmates, network with peers, and see recommendations.</span>
                    </div>
                  </button>

                  {/* Messages */}
                  <button
                    onClick={() => { setView("messages"); setMobileMenuOpen(false); }}
                    className="w-full flex items-start gap-3.5 p-2 -mx-2 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                  >
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-slate-800 group-hover:text-primary transition-colors">{t("nav_messages")}</span>
                      <span className="block text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">Chat in real-time with connected friends and recruiter channels.</span>
                    </div>
                  </button>

                  {/* Subscription Plans */}
                  {user.role === "candidate" && (
                    <button
                      onClick={() => { setView("pricing"); setMobileMenuOpen(false); }}
                      className="w-full flex items-start gap-3.5 p-2 -mx-2 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                    >
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <span className="block font-bold text-sm text-slate-800 group-hover:text-primary transition-colors">{t("nav_subscription_plans")}</span>
                        <span className="block text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">Unlock premium resume features, direct applications, and priorities.</span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer / User Account Actions */}
            <div className="mt-auto p-5 border-t border-slate-100 bg-slate-50/80 space-y-4">
              {user ? (
                <>
                  {/* User Profile */}
                  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      {user.avatar && SUPERHERO_AVATARS[user.avatar] ? (
                        SUPERHERO_AVATARS[user.avatar].svg
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-[#008BDC] to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                          {user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider capitalize">{user.role}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => { setView(user.role === "admin" ? "admin" : user.role === "employer" ? "employer" : "dashboard"); setMobileMenuOpen(false); }}
                      className="w-full text-center py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      {user.role === "admin" ? t("nav_admin_portal") : user.role === "employer" ? t("nav_recruit_portal") : t("nav_my_dashboard")}
                    </button>
                    {user.role !== "admin" && (
                      <button
                        onClick={() => { if (onOpenAvatarModal) onOpenAvatarModal(); setMobileMenuOpen(false); }}
                        className="w-full text-center py-2.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 rounded-xl transition-all border border-slate-200 cursor-pointer shadow-sm"
                      >
                        Avatar 🦸‍♂️
                      </button>
                    )}
                  </div>
                  
                  <button
                    onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                    className="w-full text-center py-2.5 text-xs font-bold text-rose-500 bg-rose-50/50 hover:bg-rose-100 rounded-xl transition-all border border-rose-100 cursor-pointer"
                  >
                    {t("nav_sign_out")}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => { onOpenModal("login"); setMobileMenuOpen(false); }}
                      className="w-full py-2.5 text-center text-xs font-bold text-primary border border-primary/20 rounded-xl hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      {t("nav_login_btn")}
                    </button>
                    <button
                      onClick={() => { onOpenModal("register"); setMobileMenuOpen(false); }}
                      className="w-full py-2.5 text-center text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      {t("nav_register_btn")}
                    </button>
                  </div>
                  <button
                    onClick={() => { onOpenModal("admin-login"); setMobileMenuOpen(false); }}
                    className="w-full py-2.5 text-center text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 rounded-xl transition-all border border-slate-200 cursor-pointer shadow-sm"
                  >
                    {t("nav_admin_login")}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
