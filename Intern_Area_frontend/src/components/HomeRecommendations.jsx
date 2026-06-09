import React from "react";
import { mockJobs } from "../data/mockData";
import RecommendedRoleCard from "./RecommendedRoleCard";
import { useLanguage } from "../i18n/LanguageContext";

export default function HomeRecommendations({ setView, setSearchQuery, jobs: rawJobs = [] }) {
  const { t } = useLanguage();
  const jobsList = rawJobs.length ? rawJobs : mockJobs;
  const jobs = jobsList.filter((j) => j.type === "Job").slice(0, 3);
  const internships = jobsList.filter((j) => j.type === "Internship").slice(0, 3);

  const goToListing = (job) => {
    setSearchQuery(job.title);
    setView("jobs");
  };

  const goToInternships = () => {
    setSearchQuery("Internship");
    setView("jobs");
  };

  const goToJobs = () => {
    setSearchQuery("");
    setView("jobs");
  };

  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Recommended Jobs — matches dashboard / marketing layout */}
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div>
            <h2 className="font-outfit font-extrabold text-slate-800 text-2xl sm:text-3xl tracking-tight flex flex-wrap items-center gap-2">
              {t("dash_rec_jobs")}
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {t("dash_full_time")}
              </span>
            </h2>
            <p className="text-slate-400 text-sm mt-1">{t("dash_rec_jobs_sub")}</p>
          </div>
          <button
            type="button"
            onClick={goToJobs}
            className="text-sm text-primary font-bold hover:underline whitespace-nowrap self-start sm:self-auto"
          >
            {t("dash_view_all_jobs")}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <RecommendedRoleCard key={job.id} job={job} onAssessDetails={goToListing} />
          ))}
        </div>
      </div>

      {/* Recommended Internships */}
      <div className="mt-16 pt-14 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div>
            <h2 className="font-outfit font-extrabold text-slate-800 text-2xl sm:text-3xl tracking-tight flex flex-wrap items-center gap-2">
              {t("dash_rec_internships")}
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {t("dash_paid_stipends")}
              </span>
            </h2>
            <p className="text-slate-400 text-sm mt-1">{t("dash_internships_sub")}</p>
          </div>
          <button
            type="button"
            onClick={goToInternships}
            className="text-sm text-primary font-bold hover:underline whitespace-nowrap self-start sm:self-auto"
          >
            {t("dash_view_all_internships")}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {internships.map((job) => (
            <RecommendedRoleCard key={job.id} job={job} onAssessDetails={goToListing} />
          ))}
        </div>
      </div>
    </section>
  );
}
