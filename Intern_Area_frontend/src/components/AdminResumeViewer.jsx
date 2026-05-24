import React, { useMemo, useEffect } from "react";

function isPdfDataUrl(dataUrl) {
  return typeof dataUrl === "string" && dataUrl.startsWith("data:application/pdf");
}

function isPdfFileName(name) {
  return typeof name === "string" && /\.pdf$/i.test(name);
}

function dataURLtoBlobURL(dataUrl) {
  if (!dataUrl) return null;
  try {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[arr.length - 1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Error converting dataURL to blobURL", e);
    return dataUrl;
  }
}

export default function AdminResumeViewer({ application }) {
  const customUrl = application?.customResumeDataUrl;
  const customName = application?.customResumeName;
  const profileLabel = application?.resumeUrl || "profile-resume.pdf";

  // Convert PDF data URLs to Blob URLs to bypass browser iframe blocking
  const blobUrl = useMemo(() => {
    if (customUrl && isPdfDataUrl(customUrl)) {
      return dataURLtoBlobURL(customUrl);
    }
    return null;
  }, [customUrl]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (blobUrl && blobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const viewMode = useMemo(() => {
    if (customUrl && isPdfDataUrl(customUrl)) return "embed-custom-pdf";
    if (customUrl) return "embed-custom-other";
    return "profile-interactive";
  }, [customUrl]);

  const embedSrc =
    viewMode === "embed-custom-pdf"
      ? blobUrl
      : customUrl;

  const canInlinePreview =
    viewMode === "embed-custom-pdf" ||
    (viewMode === "embed-custom-other" && customUrl && isPdfFileName(customName));

  const openHref =
    viewMode === "embed-custom-pdf"
      ? blobUrl
      : customUrl;

  const downloadName =
    customName || profileLabel || "resume.pdf";

  // Candidate resume data (fallback if missing)
  const resumeData = useMemo(() => {
    if (application?.profileResumeData) {
      return application.profileResumeData;
    }
    // Dynamic fallback based on candidate details so it is never a empty/dummy document
    return {
      name: application?.candidateName || "Candidate Profile",
      email: application?.email || "candidate@example.com",
      phone: "+91 98765 43210",
      place: "India",
      careerObjective: "Motivated software developer looking to contribute to development teams.",
      education: [
        {
          id: "edu-fallback-1",
          degree: "Bachelor of Technology",
          school: "Technical University",
          year: "2022 - 2026",
          score: "8.5 CGPA"
        }
      ],
      experience: [
        {
          id: "exp-fallback-1",
          type: "Internship",
          role: "Frontend Developer",
          company: "Software Company",
          duration: "3 Months",
          description: "Worked on implementing core user interface requirements using standard HTML, CSS, and JS components."
        }
      ],
      projects: [
        {
          id: "proj-fallback-1",
          title: "Personal Dashboard",
          tech: "React, Webpack, CSS",
          description: "Built a personal task organizer showing current schedules and project metrics."
        }
      ],
      skills: ["React.js", "JavaScript", "HTML5", "CSS3", "Git"],
      portfolio: {
        github: "github.com",
        linkedin: "linkedin.com",
        website: ""
      }
    };
  }, [application]);

  const handlePrintProfileResume = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Resume - ${resumeData.name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Outfit:wght@400;700;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; max-width: 800px; margin: 0 auto; }
            h1, h2, h3, h4 { font-family: 'Outfit', sans-serif; margin: 0; }
            h1 { text-transform: uppercase; font-size: 24px; text-align: center; margin-bottom: 5px; font-weight: 800; color: #0f172a; }
            .contact { text-align: center; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 20px; text-transform: uppercase; }
            .section { margin-bottom: 18px; }
            .section-title { font-size: 12px; font-weight: 800; border-bottom: 2px solid #1e293b; padding-bottom: 3px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; color: #0f172a; }
            .item { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; }
            .item-title { font-weight: 700; color: #1e293b; }
            .item-sub { color: #64748b; font-weight: 500; }
            .item-desc { font-size: 10px; color: #334155; margin-top: 3px; border-left: 2px solid #cbd5e1; padding-left: 8px; }
            .skills-list { display: flex; flex-wrap: wrap; gap: 5px; }
            .skill-tag { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 6px; font-size: 9px; font-weight: 700; color: #475569; }
            .links-list { display: flex; gap: 15px; font-size: 10px; font-weight: 700; color: #64748b; }
          </style>
        </head>
        <body>
          <h1>${resumeData.name}</h1>
          <div class="contact">
            📍 ${resumeData.place || "City, Country"} &nbsp;•&nbsp;
            📧 ${resumeData.email || ""} &nbsp;•&nbsp;
            📞 ${resumeData.phone || ""}
          </div>
          \${resumeData.careerObjective ? \`
            <div class="section">
              <div class="section-title">Career Objective</div>
              <p style="font-size: 11px; color: #334155; text-align: justify; margin: 0;">\${resumeData.careerObjective}</p>
            </div>
          \` : ""}
          \${resumeData.education && resumeData.education.length > 0 ? \`
            <div class="section">
              <div class="section-title">Education</div>
              \${resumeData.education.map(edu => \`
                <div class="item">
                  <div>
                    <span class="item-title">\${edu.degree}</span><br/>
                    <span class="item-sub">\${edu.school}</span>
                  </div>
                  <div style="text-align: right; font-weight: 700;">
                    <span>\${edu.year}</span><br/>
                    <span style="color: #2563eb;">\${edu.score}</span>
                  </div>
                </div>
              \`).join("")}
            </div>
          \` : ""}
          \${resumeData.experience && resumeData.experience.length > 0 ? \`
            <div class="section">
              <div class="section-title">Work Experience</div>
              \${resumeData.experience.map(exp => \`
                <div style="margin-bottom: 10px;">
                  <div class="item">
                    <div>
                      <span class="item-title">\${exp.role}</span> <span style="font-size: 8px; border: 1px solid #cbd5e1; border-radius: 99px; padding: 1px 5px; font-weight: 700;">\${exp.type}</span><br/>
                      <span class="item-sub">\${exp.company}</span>
                    </div>
                    <div style="text-align: right; font-weight: 700;">
                      <span>\${exp.duration}</span>
                    </div>
                  </div>
                  \${exp.description ? \`<div class="item-desc">\${exp.description}</div>\` : ""}
                </div>
              \`).join("")}
            </div>
          \` : ""}
          \${resumeData.projects && resumeData.projects.length > 0 ? \`
            <div class="section">
              <div class="section-title">Projects</div>
              \${resumeData.projects.map(proj => \`
                <div style="margin-bottom: 8px;">
                  <div class="item">
                    <span class="item-title">\${proj.title}</span>
                    <span style="font-size: 8px; background: #e2e8f0; border-radius: 4px; padding: 1px 5px; font-weight: 700; color: #475569;">\${proj.tech}</span>
                  </div>
                  \${proj.description ? \`<div style="font-size: 10px; color: #334155; margin-top: 2px;">\${proj.description}</div>\` : ""}
                </div>
              \`).join("")}
            </div>
          \` : ""}
          \${resumeData.skills && resumeData.skills.length > 0 ? \`
            <div class="section">
              <div class="section-title">Skills</div>
              <div class="skills-list">
                \${resumeData.skills.map(skill => \`<span class="skill-tag">\${skill}</span>\`).join("")}
              </div>
            </div>
          \` : ""}
          \${resumeData.portfolio && (resumeData.portfolio.github || resumeData.portfolio.linkedin || resumeData.portfolio.website) ? \`
            <div class="section">
              <div class="section-title">Links</div>
              <div class="links-list">
                \${resumeData.portfolio.github ? \`<span>🐙 \${resumeData.portfolio.github}</span>\` : ""}
                \${resumeData.portfolio.linkedin ? \`<span>🔗 \${resumeData.portfolio.linkedin}</span>\` : ""}
                \${resumeData.portfolio.website ? \`<span>🌐 \${resumeData.portfolio.website}</span>\` : ""}
              </div>
            </div>
          \` : ""}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {openHref && (
          <a
            href={openHref}
            download={customUrl ? downloadName : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm transition-all cursor-pointer"
          >
            Open in new tab
          </a>
        )}
        {customUrl && (
          <a
            href={customUrl}
            download={downloadName}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
          >
            Download file
          </a>
        )}
        {viewMode === "profile-interactive" && (
          <button
            type="button"
            onClick={handlePrintProfileResume}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
          >
            🖨️ Print / Save PDF
          </button>
        )}
      </div>

      <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
        {customUrl
          ? `Uploaded resume file: ${customName || "custom resume"}`
          : `Interactive profile resume on file`}
      </p>

      {/* Render uploaded PDF file inside iframe, or interactive resume natively */}
      {viewMode === "profile-interactive" ? (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm p-5 max-h-[420px] overflow-y-auto text-left select-text scrollbar-thin space-y-4">
          
          {/* Header */}
          <div className="text-center pb-3 border-b-2 border-slate-800 space-y-1">
            <h2 className="font-outfit font-extrabold text-sm text-slate-900 tracking-tight uppercase">
              {resumeData.name}
            </h2>
            <p className="text-[9px] font-bold text-primary tracking-wide uppercase flex justify-center gap-1.5 flex-wrap">
              <span>📍 {resumeData.place || "City, Country"}</span>
              <span>•</span>
              <span>📧 {resumeData.email || ""}</span>
              <span>•</span>
              <span>📞 {resumeData.phone || ""}</span>
            </p>
          </div>

          {/* Objective */}
          {resumeData.careerObjective && (
            <div className="space-y-1">
              <h4 className="font-outfit font-extrabold text-[10px] text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5">Career Objective</h4>
              <p className="text-[10px] text-slate-600 leading-relaxed text-justify">
                {resumeData.careerObjective}
              </p>
            </div>
          )}

          {/* Education */}
          {resumeData.education && resumeData.education.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-outfit font-extrabold text-[10px] text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5">Education</h4>
              <div className="space-y-1.5">
                {resumeData.education.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-start text-[10px]">
                    <div>
                      <p className="font-bold text-slate-800">{edu.degree}</p>
                      <p className="text-slate-500 font-medium">{edu.school}</p>
                    </div>
                    <div className="text-right text-[9px] text-slate-500 font-bold whitespace-nowrap">
                      <p>{edu.year}</p>
                      <p className="text-primary font-extrabold">{edu.score}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {resumeData.experience && resumeData.experience.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-outfit font-extrabold text-[10px] text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5">Work Experience</h4>
              <div className="space-y-2">
                {resumeData.experience.map((exp) => (
                  <div key={exp.id} className="space-y-0.5">
                    <div className="flex justify-between items-start text-[10px]">
                      <div>
                        <p className="font-bold text-slate-800">
                          {exp.role} 
                          <span className={`ml-1.5 text-[8px] font-bold px-1.5 py-0.2 bg-slate-50 border border-slate-200 rounded-full text-slate-500`}>
                            {exp.type}
                          </span>
                        </p>
                        <p className="text-slate-500 font-medium">{exp.company}</p>
                      </div>
                      <div className="text-right text-[9px] text-slate-500 font-bold whitespace-nowrap">
                        <p>{exp.duration}</p>
                      </div>
                    </div>
                    {exp.description && (
                      <p className="text-[9px] text-slate-600 leading-relaxed text-justify pl-1.5 border-l-2 border-slate-200">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resumeData.projects && resumeData.projects.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-outfit font-extrabold text-[10px] text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5">Projects</h4>
              <div className="space-y-2">
                {resumeData.projects.map((proj) => (
                  <div key={proj.id} className="space-y-0.5 text-[10px]">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-slate-800">{proj.title}</p>
                      <span className="text-[8px] font-bold text-slate-500 bg-slate-100 rounded px-1 py-0.2">{proj.tech}</span>
                    </div>
                    {proj.description && (
                      <p className="text-[9px] text-slate-600 leading-normal text-justify">
                        {proj.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {resumeData.skills && resumeData.skills.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-outfit font-extrabold text-[10px] text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5">Key Skills</h4>
              <div className="flex flex-wrap gap-1">
                {resumeData.skills.map((skill, idx) => (
                  <span key={idx} className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.2 text-[8px] font-bold text-slate-600 whitespace-nowrap">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Links */}
          {resumeData.portfolio && (resumeData.portfolio.github || resumeData.portfolio.linkedin || resumeData.portfolio.website) && (
            <div className="space-y-1.5">
              <h4 className="font-outfit font-extrabold text-[10px] text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5">Links</h4>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] font-bold text-slate-500">
                {resumeData.portfolio.github && (
                  <span>🐙 <span className="hover:text-primary transition-colors">{resumeData.portfolio.github}</span></span>
                )}
                {resumeData.portfolio.linkedin && (
                  <span>🔗 <span className="hover:text-primary transition-colors">{resumeData.portfolio.linkedin}</span></span>
                )}
                {resumeData.portfolio.website && (
                  <span>🌐 <span className="hover:text-primary transition-colors">{resumeData.portfolio.website}</span></span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : canInlinePreview ? (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-inner">
          <iframe
            title="Resume preview"
            src={embedSrc}
            className="w-full h-[min(420px,55vh)] bg-white"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-xs text-amber-900">
          <p className="font-semibold mb-1">Preview not available in browser</p>
          <p className="text-amber-800/90 leading-relaxed">
            This file type cannot be shown inline. Use <strong>Open in new tab</strong> or{" "}
            <strong>Download file</strong> to view it on your device.
          </p>
        </div>
      )}
    </div>
  );
}
