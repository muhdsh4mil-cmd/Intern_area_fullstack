import React, { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

export default function Hero({ user, setView, onGoogleLogin }) {
  const { t } = useLanguage();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleClick = async () => {
    setGoogleLoading(true);
    if (onGoogleLogin) {
      await onGoogleLogin();
    }
    setGoogleLoading(false);
  };
  const goToPrimaryApp = () => {
    if (!setView || !user) return;
    if (user.role === "admin") setView("admin");
    else if (user.role === "employer") setView("employer");
    else setView("dashboard");
  };

  return (
    <section className="relative hero-gradient text-white overflow-hidden py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Column: Headline and Sign-up Card */}
        <div className="lg:col-span-6 flex flex-col space-y-8 animate-fade-in">
          <div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none mb-3 font-outfit">
              {t("hero_badge")}
            </h1>
          </div>

          {user ? (
            <div className="glass-panel text-slate-800 rounded-2xl p-6 sm:p-8 max-w-md shadow-2xl border border-white/20 transform hover:scale-[1.01] transition-transform duration-300">
              <h3 className="font-outfit font-bold text-slate-500 text-sm tracking-wider uppercase mb-2">
                {t("dash_welcome")}
              </h3>
              <p className="font-outfit font-extrabold text-slate-900 text-lg mb-1">Hi, {user.name}</p>
              <p className="text-sm text-slate-600 mb-6">
                {t("hero_already_logged_in")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={goToPrimaryApp}
                  className="flex-1 text-center py-3 px-4 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md transition-all"
                >
                  {user.role === "employer"
                    ? "Recruit portal"
                    : user.role === "admin"
                      ? "Admin portal"
                      : t("hero_cta_dashboard")}
                </button>
                <button
                  type="button"
                  onClick={() => setView?.("jobs")}
                  className="flex-1 text-center py-3 px-4 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                >
                  {t("hero_explore_jobs")}
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel text-slate-800 rounded-2xl p-6 sm:p-8 max-w-md shadow-2xl border border-white/20 transform hover:scale-[1.01] transition-transform duration-300">
              <h3 className="font-outfit font-bold text-slate-500 text-sm tracking-wider uppercase mb-5">
                {t("nav_register")}
              </h3>

              <button
                onClick={handleGoogleClick}
                disabled={googleLoading}
                className="w-full flex items-center justify-center space-x-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl shadow-sm hover:shadow-md transform active:scale-98 transition-all duration-200 disabled:opacity-80"
              >
                {googleLoading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-medium">Connecting Google Account...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                     <span>{t("auth_google")}</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                {t("hero_terms")}{" "}
                <a href="#" className="text-primary hover:underline font-semibold">
                  {t("hero_terms_link")}
                </a>
              </p>
            </div>
          )}


        </div>

        {/* Right Column: Hero Graphic Image */}
        <div className="lg:col-span-6 flex justify-center items-end h-full relative min-h-[350px] sm:min-h-[420px] lg:min-h-[500px]">
          {/* Circular backdrop glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none"></div>
          
          <img
            src="/hero_professionals.png"
            alt="Young professionals smiling with a laptop"
            className="max-h-[350px] sm:max-h-[420px] lg:max-h-[480px] w-auto object-contain relative z-10 animate-float drop-shadow-[0_20px_50px_rgba(0,139,220,0.3)]"
          />
        </div>

      </div>

      {/* Wave bottom decoration for transitions */}
      <div className="wave-bg">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" className="shape-fill"></path>
        </svg>
      </div>
    </section>
  );
}
