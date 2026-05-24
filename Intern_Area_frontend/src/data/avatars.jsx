import React from "react";

export const SUPERHERO_AVATARS = {
  ironman: {
    name: "Iron Man",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="iron-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
          <linearGradient id="iron-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#iron-bg)" />
        <path d="M28,25 C28,15 72,15 72,25 L72,55 C72,70 65,80 50,85 C35,80 28,70 28,55 Z" fill="#b91c1c" />
        <path d="M34,35 L40,32 L60,32 L66,35 L68,52 C68,64 62,72 50,77 C38,72 32,64 32,52 Z" fill="url(#iron-gold)" />
        <rect x="38" y="44" width="8" height="3" rx="1.5" fill="#a5f3fc" stroke="#0891b2" strokeWidth="0.5" />
        <rect x="54" y="44" width="8" height="3" rx="1.5" fill="#a5f3fc" stroke="#0891b2" strokeWidth="0.5" />
        <path d="M44,60 L56,60 L50,66 Z" fill="#b91c1c" />
      </svg>
    )
  },
  spiderman: {
    name: "Spider-Man",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="spidey-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#spidey-bg)" />
        <circle cx="50" cy="50" r="35" fill="none" stroke="#1e293b" strokeWidth="1" opacity="0.4" />
        <circle cx="50" cy="50" r="20" fill="none" stroke="#1e293b" strokeWidth="1" opacity="0.4" />
        <path d="M50,0 L50,100 M0,50 L100,50 M15,15 L85,85 M15,85 L85,15" stroke="#1e293b" strokeWidth="1.5" opacity="0.4" />
        <path d="M25,48 C25,38 42,32 45,45 C45,55 35,62 25,48 Z" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
        <path d="M75,48 C75,38 58,32 55,45 C55,55 65,62 75,48 Z" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
      </svg>
    )
  },
  batman: {
    name: "Batman",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="bat-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bat-bg)" />
        <path d="M25,50 L32,22 L40,32 L60,32 L68,22 L75,50 C76,68 68,78 50,82 C32,78 24,68 25,50 Z" fill="#0f172a" />
        <path d="M38,62 L62,62 L58,74 C54,77 46,77 42,74 Z" fill="#fed7aa" />
        <path d="M45,67 Q50,70 55,67" stroke="#9d174d" strokeWidth="1" fill="none" />
        <polygon points="34,44 44,46 41,50 33,47" fill="#ffffff" />
        <polygon points="66,44 56,46 59,50 67,47" fill="#ffffff" />
      </svg>
    )
  },
  superman: {
    name: "Superman",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="sup-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#sup-bg)" />
        <path d="M30,35 C30,22 70,22 70,35 L70,55 C70,68 62,75 50,75 C38,75 30,68 30,55 Z" fill="#fed7aa" />
        <path d="M30,35 C32,18 68,18 70,35 C70,22 30,22 30,35 Z" fill="#0f172a" />
        <path d="M27,36 C25,25 45,15 65,22 C75,25 73,38 70,40 C65,30 55,25 48,32 C45,35 48,38 46,38 C42,32 35,32 32,40 Z" fill="#0f172a" />
        <path d="M48,27 Q52,38 48,42" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M34,45 Q40,43 44,46" stroke="#0f172a" strokeWidth="1.5" fill="none" />
        <path d="M66,45 Q60,43 56,46" stroke="#0f172a" strokeWidth="1.5" fill="none" />
        <circle cx="39" cy="50" r="2.5" fill="#1e3a8a" />
        <circle cx="61" cy="50" r="2.5" fill="#1e3a8a" />
        <path d="M44,60 Q50,64 56,60" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  captainamerica: {
    name: "Captain America",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="cap-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#cap-bg)" />
        <path d="M32,30 C32,20 68,20 68,30 L68,55 C68,68 60,75 50,75 C40,75 32,68 32,55 Z" fill="#fed7aa" />
        <path d="M32,30 C32,18 68,18 68,30 L68,48 C68,48 60,52 50,52 C40,52 32,48 32,48 Z" fill="#1d4ed8" />
        <ellipse cx="40" cy="40" rx="6" ry="4" fill="#fed7aa" />
        <ellipse cx="60" cy="40" rx="6" ry="4" fill="#fed7aa" />
        <circle cx="40" cy="40" r="1.5" fill="#1e3a8a" />
        <circle cx="60" cy="40" r="1.5" fill="#1e3a8a" />
        <text x="50" y="32" fontSize="12" fontWeight="bold" fontFamily="'Courier New', Courier, monospace" fill="#ffffff" textAnchor="middle">A</text>
        <path d="M45,63 Q50,66 55,63" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  thor: {
    name: "Thor",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="thor-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#thor-bg)" />
        <path d="M30,35 C30,22 70,22 70,35 L70,62 C70,72 60,78 50,78 C40,78 30,72 30,62 Z" fill="#fde047" />
        <path d="M34,35 C34,25 66,25 66,35 L66,56 C66,66 58,72 50,72 C42,72 34,66 34,56 Z" fill="#fed7aa" />
        <path d="M34,55 C34,68 40,74 50,74 C60,74 66,68 66,55 L62,55 C62,64 56,68 50,68 C44,68 38,64 38,55 Z" fill="#facc15" />
        <path d="M32,32 C35,22 65,22 68,32 L66,38 C66,38 58,35 50,35 C42,35 34,38 34,38 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
        <path d="M66,30 L78,20 L73,32 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
        <path d="M32,30 L20,20 L25,32 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
        <circle cx="42" cy="46" r="2" fill="#0284c7" />
        <circle cx="58" cy="46" r="2" fill="#0284c7" />
        <path d="M46,60 Q50,63 54,60" stroke="#b45309" strokeWidth="1.5" fill="none" />
      </svg>
    )
  },
  hulk: {
    name: "Hulk",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="hulk-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#hulk-bg)" />
        <path d="M26,35 C26,20 74,20 74,35 L74,65 C74,78 65,85 50,85 C35,85 26,78 26,65 Z" fill="#16a34a" />
        <path d="M26,35 C28,18 72,18 74,35 C68,26 62,28 50,26 C38,28 32,26 26,35 Z" fill="#0f172a" />
        <path d="M24,35 L30,28 L36,32 L44,25 L50,30 L58,25 L66,32 L72,28 L76,35 Z" fill="#0f172a" />
        <polygon points="34,48 42,50 38,53 32,50" fill="#ffffff" />
        <polygon points="66,48 58,50 62,53 68,50" fill="#ffffff" />
        <circle cx="37" cy="50.5" r="1" fill="#000000" />
        <circle cx="63" cy="50.5" r="1" fill="#000000" />
        <path d="M38,68 Q50,60 62,68" stroke="#0f172a" strokeWidth="3" fill="none" />
      </svg>
    )
  },
  blackwidow: {
    name: "Black Widow",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="widow-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#widow-bg)" />
        <path d="M25,40 C20,20 80,20 75,40 L78,65 C78,75 70,82 50,82 C30,82 22,75 22,65 Z" fill="#b91c1c" />
        <path d="M32,38 C32,26 68,26 68,38 L68,58 C68,68 60,74 50,74 C40,74 32,68 32,58 Z" fill="#fed7aa" />
        <path d="M27,38 C30,22 70,22 73,38 C68,28 58,26 50,34 C42,26 32,28 27,38 Z" fill="#ef4444" />
        <path d="M35,46 Q40,43 43,47" stroke="#0f172a" strokeWidth="2" fill="none" />
        <path d="M65,46 Q60,43 57,47" stroke="#0f172a" strokeWidth="2" fill="none" />
        <circle cx="39" cy="50" r="1.5" fill="#15803d" />
        <circle cx="61" cy="50" r="1.5" fill="#15803d" />
        <path d="M44,62 Q50,65 56,62" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  wonderwoman: {
    name: "Wonder Woman",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="ww-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#ww-bg)" />
        <path d="M26,38 C20,20 80,20 74,38 L76,68 C76,78 70,82 50,82 C30,82 24,78 24,68 Z" fill="#1e293b" />
        <path d="M32,36 C32,25 68,25 68,36 L68,58 C68,68 60,74 50,74 C40,74 32,68 32,58 Z" fill="#fed7aa" />
        <path d="M32,32 L50,22 L68,32 L65,36 L50,28 L35,36 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
        <polygon points="50,23 51,26 54,26 52,28 53,31 50,29 47,31 48,28 46,26 49,26" fill="#ef4444" />
        <circle cx="41" cy="46" r="2" fill="#78350f" />
        <circle cx="59" cy="46" r="2" fill="#78350f" />
        <path d="M44,60 Q50,63 56,60" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  blackpanther: {
    name: "Black Panther",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="panther-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#panther-bg)" />
        <path d="M26,45 L30,22 L38,32 L62,32 L70,22 L74,45 C75,64 68,76 50,82 C32,76 25,64 26,45 Z" fill="#0f172a" />
        <path d="M50,32 L50,55" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        <path d="M44,48 L56,48" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <polygon points="34,44 44,47 42,50 33,46" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <polygon points="66,44 56,47 58,50 67,46" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M30,22 L35,29" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.6" />
        <path d="M70,22 L65,29" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.6" />
      </svg>
    )
  }
};
