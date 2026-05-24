import React from "react";

export default function Partners() {
  return (
    <section className="bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-white relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
        
        {/* Count Stats Card */}
        <div className="flex items-center space-x-4 border-b lg:border-b-0 lg:border-r border-slate-700 pb-4 lg:pb-0 lg:pr-8 w-full lg:w-auto justify-center lg:justify-start">
          <div className="text-center lg:text-left">
            <span className="block text-3xl font-extrabold text-primary-light font-outfit tracking-tight">
              10K+
            </span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold font-outfit">
              Openings Daily
            </span>
          </div>
        </div>

        {/* Logos Container */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 flex-1 w-full">
          
          {/* Nestle */}
          <div className="group flex items-center justify-center h-8 transition-transform duration-300 hover:scale-105 cursor-pointer">
            <span className="font-outfit font-black tracking-tighter text-xl text-slate-500 group-hover:text-amber-200 transition-colors">
              Nestlé
            </span>
          </div>

          {/* HCL */}
          <div className="group flex items-center justify-center h-8 transition-transform duration-300 hover:scale-105 cursor-pointer">
            <span className="font-outfit font-extrabold tracking-tight text-2xl text-slate-500 group-hover:text-blue-400 transition-colors">
              HCL
            </span>
          </div>

          {/* BookMyShow */}
          <div className="group flex items-center justify-center h-8 transition-transform duration-300 hover:scale-105 cursor-pointer">
            <span className="font-outfit font-black italic text-lg text-slate-500 group-hover:text-rose-500 transition-colors">
              book<span className="bg-slate-500 group-hover:bg-rose-500 text-slate-900 group-hover:text-white px-1 py-0.5 rounded ml-0.5 not-italic text-sm">my</span>show
            </span>
          </div>

          {/* Nykaa */}
          <div className="group flex items-center justify-center h-8 transition-transform duration-300 hover:scale-105 cursor-pointer">
            <span className="font-outfit font-extrabold tracking-wide text-2xl text-slate-500 group-hover:text-pink-500 transition-colors">
              NYKAA
            </span>
          </div>

          {/* Decathlon */}
          <div className="group flex items-center justify-center h-8 transition-transform duration-300 hover:scale-105 cursor-pointer">
            <span className="font-outfit font-extrabold tracking-tight text-xl text-slate-500 group-hover:text-sky-400 transition-colors uppercase">
              Decathlon
            </span>
          </div>

          {/* Amazon */}
          <div className="group flex items-center justify-center h-8 transition-transform duration-300 hover:scale-105 cursor-pointer">
            <span className="font-outfit font-black text-xl text-slate-500 group-hover:text-amber-500 transition-colors flex items-center">
              amazon
              <span className="text-amber-500 text-xs ml-0.5 inline-block transform -rotate-12">▾</span>
            </span>
          </div>

        </div>

      </div>
    </section>
  );
}
