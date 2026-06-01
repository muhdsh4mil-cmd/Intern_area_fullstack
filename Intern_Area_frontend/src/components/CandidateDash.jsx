import React, { useState, useEffect } from "react";
import { mockJobs } from "../data/mockData";
import RecommendedRoleCard from "./RecommendedRoleCard";
import { SUPERHERO_AVATARS } from "../data/avatars";

const trendingCards = [
  {
    id: "trending-1",
    badge: "Certification courses",
    badgeBg: "bg-white/20 text-white border border-white/20",
    title: "Master the ",
    titleAccent: "in-demand skills!",
    subtitle: "Get govt.-accredited certification and level-up your resume.",
    bgClass: "bg-gradient-to-br from-blue-600 to-indigo-800 text-white",
    btnText: "Know more",
    btnClass: "bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold",
    hasCertGraphic: true,
    url: "https://trainings.internshala.com/?utm_source=internarea",
  },
  {
    id: "trending-2",
    badge: "Certification courses",
    badgeBg: "bg-cyan-100 text-cyan-800 border border-cyan-200/50",
    title: "Special offer for students pursuing your degree!",
    subtitle: "Get 55% + 10% OFF on online trainings",
    bgClass: "bg-gradient-to-br from-cyan-50 to-sky-100 text-slate-800 border border-cyan-100",
    btnText: "Know more",
    btnClass: "bg-cyan-600 hover:bg-cyan-700 text-white font-semibold",
    hasPromoGraphic: true,
    url: "https://trainings.internshala.com/?utm_source=internarea",
  },
  {
    id: "trending-3",
    badge: "Campaign Program",
    badgeBg: "bg-red-500 text-white border border-red-400/50",
    partnerLogo: "Air India",
    title: "BECOME AN AIR INDIA CAMPUS AMBASSADOR",
    subtitle: "An exciting opportunity for students in college",
    highlights: "UNLOCK A CERTIFICATE + EXCLUSIVE REWARDS WORTH UPTO ₹10,000",
    subtext: "Refer. Earn. Repeat.",
    bgClass: "bg-gradient-to-br from-slate-950 to-slate-900 text-white border border-slate-800",
    btnText: "Register now",
    btnClass: "bg-white hover:bg-slate-100 text-slate-900 font-bold",
    imageUrl: "/campus_ambassador.png",
    url: "https://internshala.com/isp?utm_source=internarea",
  },
  {
    id: "trending-4",
    badge: "Career Opportunity",
    badgeBg: "bg-blue-50 text-blue-800 border border-blue-100",
    partnerLogo: "IA INDIA ACCELERATOR",
    title: "Break Into The World of Venture Capital",
    subtitle: "with India Accelerator Campus Analyst Network (ICAN)",
    bgClass: "bg-white text-slate-800 border border-slate-200/80 shadow-sm",
    btnText: "Apply Now",
    btnClass: "bg-slate-950 hover:bg-slate-900 text-white font-bold",
    imageUrl: "/venture_capital.png",
    url: "https://www.indiaaccelerator.co/?utm_source=internarea",
  },
  {
    id: "trending-5",
    badge: "Tata Crucible",
    badgeBg: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    title: "11 CURIOUS MINDS TO WIN* TATA IPL TICKETS AND EXCLUSIVE GOODIES",
    subtitle: "Follow @tata_crucible on Instagram to participate.",
    bgClass: "bg-gradient-to-br from-emerald-600 to-teal-800 text-white",
    btnText: "Register now",
    btnClass: "bg-white hover:bg-slate-100 text-slate-900 font-bold",
    imageUrl: "/cheering_students.png",
    url: "https://www.instagram.com/tata_crucible/",
  }
];

export default function CandidateDash({ user, setView, setSearchQuery }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(3);

  // Load preferences from localStorage
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem(`preferences_${user.id}`);
    return saved ? JSON.parse(saved) : null;
  });

  // Helper to match interests
  const matchesInterests = (job, interests) => {
    if (!interests || interests.length === 0) return true;
    return interests.some(interest => {
      const interestLower = interest.toLowerCase();
      if (job.title.toLowerCase().includes(interestLower)) return true;
      if (job.skills.some(skill => skill.toLowerCase().includes(interestLower))) return true;
      if (job.description.toLowerCase().includes(interestLower)) return true;
      
      // Synonyms
      if (interestLower.includes("web") && (
        job.title.toLowerCase().includes("frontend") || 
        job.title.toLowerCase().includes("backend") || 
        job.title.toLowerCase().includes("full stack") || 
        job.title.toLowerCase().includes("web")
      )) return true;
      if (interestLower.includes("software") && (
        job.title.toLowerCase().includes("software") || 
        job.title.toLowerCase().includes("developer") || 
        job.title.toLowerCase().includes("engineer") || 
        job.title.toLowerCase().includes("programming")
      )) return true;
      if (interestLower.includes("design") && (
        job.title.toLowerCase().includes("design") || 
        job.title.toLowerCase().includes("ui") || 
        job.title.toLowerCase().includes("ux") || 
        job.title.toLowerCase().includes("graphic")
      )) return true;
      return false;
    });
  };

  // Helper to match work mode
  const matchesWorkMode = (job, workModes) => {
    if (!workModes || workModes.length === 0) return true;
    const wantRemote = workModes.includes("Work from home");
    const wantInOffice = workModes.includes("In-office");
    if (wantRemote && !wantInOffice) return job.isRemote === true;
    if (wantInOffice && !wantRemote) return job.isRemote === false;
    return true;
  };

  const filteredJobs = mockJobs.filter(job => {
    if (preferences) {
      if (!matchesInterests(job, preferences.interests)) return false;
      if (!matchesWorkMode(job, preferences.workModes)) return false;
    }
    return true;
  });

  // Filter internships and jobs
  let internships = filteredJobs.filter((job) => job.type === "Internship");
  let jobs = filteredJobs.filter((job) => job.type === "Job");

  // Fallback to default mockJobs slice if filters return no matches
  if (internships.length === 0) {
    internships = mockJobs.filter((job) => job.type === "Internship").slice(0, 3);
  } else {
    internships = internships.slice(0, 3);
  }
  
  if (jobs.length === 0) {
    jobs = mockJobs.filter((job) => job.type === "Job").slice(0, 3);
  } else {
    jobs = jobs.slice(0, 3);
  }

  // Dynamically configure slider cards depending on device width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setCardsPerPage(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerPage(2);
      } else {
        setCardsPerPage(3);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Clamp current index on resizing
  const maxIndex = Math.max(0, trendingCards.length - cardsPerPage);
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [cardsPerPage, currentIndex, maxIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
  };

  const handleAssessDetails = (job) => {
    if (setSearchQuery && setView) {
      setSearchQuery(job.title);
      setView("jobs");
    }
  };

  return (
    <div className="animate-fade-in select-none">
      
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Greeting Header */}
        <div className="mb-10 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-center gap-6 animate-fade-in">
          <div className="relative z-10">
            <h1 className="font-outfit font-extrabold text-3xl sm:text-4xl tracking-tight flex items-center">
              Hi, {user.name}! <span className="animate-bounce ml-2.5">👋</span>
            </h1>
            <p className="text-slate-300 font-medium text-sm sm:text-base mt-2">
              Complete your profile to start applying for internships and jobs
            </p>
          </div>
          {/* Active profile avatar illustration in header */}
          <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-slate-700/50 bg-slate-800/80 flex items-center justify-center shadow-2xl overflow-hidden shrink-0 transform hover:scale-105 transition-transform duration-300">
            {user.avatar && SUPERHERO_AVATARS[user.avatar] ? (
              SUPERHERO_AVATARS[user.avatar].svg
            ) : (
              <span className="font-outfit font-black text-3xl sm:text-4xl text-slate-400">{user.name.charAt(0)}</span>
            )}
          </div>
        </div>


        {/* Trending Banners Section */}
        <div className="mb-12 mt-4">
          <div className="text-center mb-8">
            <h2 className="font-outfit font-extrabold text-2xl text-slate-800 tracking-tight flex items-center justify-center gap-2">
              Trending on Intern Area <span className="animate-bounce">🔥</span>
            </h2>
          </div>
          
          <div className="overflow-hidden relative w-full px-1">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / cardsPerPage)}%)` }}
            >
              {trendingCards.map((card) => (
                <div 
                  key={card.id}
                  style={{ width: `${100 / cardsPerPage}%` }}
                  className="flex-shrink-0 px-3"
                >
                  <div className={`relative overflow-hidden rounded-2xl p-6 flex flex-col justify-between h-[220px] select-none shadow-sm hover:shadow-md transition-shadow ${card.bgClass}`}>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[9px] font-bold border rounded px-2 py-0.5 uppercase tracking-wide ${card.badgeBg}`}>
                          {card.badge}
                        </span>
                        {card.partnerLogo && (
                          <span className="text-[9px] font-extrabold text-slate-900 tracking-wider flex items-center gap-1 font-outfit uppercase">
                            ⚡ {card.partnerLogo}
                          </span>
                        )}
                      </div>

                      {card.titleAccent ? (
                        <h4 className="font-outfit font-black text-lg sm:text-xl leading-tight max-w-[65%] text-slate-900">
                          {card.title}
                          <span className="text-amber-500 font-black block sm:inline">{card.titleAccent}</span>
                        </h4>
                      ) : (
                        <h4 className="font-outfit font-extrabold text-sm sm:text-base leading-snug max-w-[62%]">
                          {card.title}
                        </h4>
                      )}

                      {card.highlights ? (
                        <div className="mt-2 max-w-[58%] space-y-1">
                          <div className="border border-white/20 bg-white/5 rounded px-2 py-1 text-[8px] font-bold text-red-400 tracking-wide uppercase leading-normal">
                            {card.highlights}
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold">{card.subtext}</p>
                        </div>
                      ) : (
                        <p className={`text-xs mt-1.5 leading-normal max-w-[62%] ${card.id === "trending-2" ? "text-cyan-800 font-medium" : "text-slate-200/90 font-light"}`}>
                          {card.subtitle}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center">
                        <button 
                          onClick={() => window.open(card.url, "_blank", "noopener,noreferrer")}
                          className={`text-[10px] font-extrabold px-5 py-2.5 rounded-xl transition-all duration-300 transform active:scale-95 shadow-sm cursor-pointer ${card.btnClass}`}
                        >
                          {card.btnText}
                        </button>
                      </div>
                    </div>

                    {card.hasCertGraphic && (
                      <div className="absolute right-4 bottom-4 w-28 h-20 bg-white/95 rounded-xl shadow-lg border border-slate-100 p-2.5 flex flex-col justify-between transform rotate-6 overflow-hidden hidden sm:flex">
                        <div className="w-8 h-1.5 bg-blue-500 rounded"></div>
                        <div className="space-y-1">
                          <div className="w-16 h-1 bg-slate-200 rounded"></div>
                          <div className="w-12 h-1 bg-slate-200 rounded"></div>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="w-10 h-1 bg-slate-300 rounded"></div>
                          <div className="w-5 h-5 rounded-full bg-amber-400 border border-amber-300 flex items-center justify-center relative shadow-sm">
                            <div className="absolute top-2.5 w-1 h-3 bg-blue-500 transform rotate-12 origin-top"></div>
                            <div className="absolute top-2.5 w-1 h-3 bg-blue-500 transform -rotate-12 origin-top"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {card.hasPromoGraphic && (
                      <div className="absolute right-4 bottom-2 w-28 h-28 hidden sm:flex items-end justify-center">
                        <div className="flex items-end space-x-1 w-full h-full pb-3">
                          <div className="bg-cyan-200/50 w-5 h-1/3 rounded-t"></div>
                          <div className="bg-cyan-300/60 w-5 h-1/2 rounded-t flex items-center justify-center text-xs">✨</div>
                          <div className="bg-cyan-400/80 w-5 h-3/4 rounded-t relative flex justify-center">
                            <div className="absolute -top-5 w-3.5 h-3.5 rounded-full bg-slate-800 border-2 border-white"></div>
                            <div className="absolute -top-2 w-4 h-3 bg-slate-800 rounded-t-lg"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {card.imageUrl && (
                      <img 
                        src={card.imageUrl} 
                        alt={card.title} 
                        className="absolute right-0 bottom-0 h-full w-2/5 object-cover object-center rounded-r-2xl pointer-events-none"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-center items-center space-x-4 mt-6">
            <button 
              onClick={handlePrev}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="w-24 h-1 bg-slate-100 rounded-full relative overflow-hidden">
              <div 
                className="absolute h-full bg-primary rounded-full transition-all duration-300"
                style={{ 
                  width: `${(cardsPerPage / trendingCards.length) * 100}%`,
                  left: `${maxIndex > 0 ? (currentIndex / maxIndex) * (100 - (cardsPerPage / trendingCards.length) * 100) : 0}%`
                }}
              />
            </div>
            
            <button 
              onClick={handleNext}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Recommended Jobs — full-time roles */}
        <div className="border-t border-slate-100 pt-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-outfit font-extrabold text-slate-800 text-lg sm:text-xl flex items-center gap-2">
                Recommended Jobs
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Full-Time Roles
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Kickstart your career with long-term opportunities</p>
            </div>
            <span
              onClick={() => {
                setSearchQuery("");
                setView("jobs");
              }}
              className="text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              View all jobs →
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <RecommendedRoleCard key={job.id} job={job} onAssessDetails={handleAssessDetails} />
            ))}
          </div>
        </div>

        {/* Recommended Internships — paid stipends */}
        <div className="border-t border-slate-100 mt-12 pt-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-outfit font-extrabold text-slate-800 text-lg sm:text-xl flex items-center gap-2">
                Recommended Internships
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Paid Stipends
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Gain industry experience with high-growth companies</p>
            </div>
            <span
              onClick={() => {
                setSearchQuery("Internship");
                setView("jobs");
              }}
              className="text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              View all internships →
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {internships.map((job) => (
              <RecommendedRoleCard key={job.id} job={job} onAssessDetails={handleAssessDetails} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
