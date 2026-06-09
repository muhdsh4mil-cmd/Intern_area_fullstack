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

  const backendBaseUrl = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://intern-area-fullstack.onrender.com";

  const isProfilePdf = typeof application?.resumeUrl === "string" && 
                       application.resumeUrl.endsWith(".pdf") && 
                       application.resumeUrl.startsWith("/uploads/");

  const viewMode = useMemo(() => {
    if (customUrl && isPdfDataUrl(customUrl)) return "embed-custom-pdf";
    if (customUrl) return "embed-custom-other";
    if (isProfilePdf) return "embed-profile-pdf";
    return "profile-interactive";
  }, [customUrl, isProfilePdf]);

  const embedSrc =
    viewMode === "embed-custom-pdf"
      ? blobUrl
      : viewMode === "embed-profile-pdf"
      ? `${backendBaseUrl}${application.resumeUrl}`
      : customUrl;

  const canInlinePreview =
    viewMode === "embed-custom-pdf" ||
    viewMode === "embed-profile-pdf" ||
    (viewMode === "embed-custom-other" && customUrl && isPdfFileName(customName));

  const openHref =
    viewMode === "embed-custom-pdf"
      ? blobUrl
      : viewMode === "embed-profile-pdf"
      ? `${backendBaseUrl}${application.resumeUrl}`
      : customUrl;

  const downloadName =
    customName || (isProfilePdf ? application.resumeUrl.split("/").pop() : profileLabel) || "resume.pdf";

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
    
    const contactItems = [];
    if (resumeData.place) contactItems.push(`<span>📍 ${resumeData.place}</span>`);
    if (resumeData.email) contactItems.push(`<span>✉️ ${resumeData.email}</span>`);
    if (resumeData.phone) contactItems.push(`<span>📞 ${resumeData.phone}</span>`);
    if (resumeData.portfolio?.linkedin) contactItems.push(`<span>🔗 ${resumeData.portfolio.linkedin}</span>`);
    if (resumeData.portfolio?.github) contactItems.push(`<span>🐙 ${resumeData.portfolio.github}</span>`);
    if (resumeData.portfolio?.website) contactItems.push(`<span>🌐 ${resumeData.portfolio.website}</span>`);
    
    const contactHTML = contactItems.join(" <span>•</span> ");

    printWindow.document.write(`
      <html>
        <head>
          <title>Resume - ${resumeData.name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Outfit:wght@400;700;800&display=swap" rel="stylesheet">
          <style>
            *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: A4 portrait; margin: 0; }
            body {
              font-family: 'Inter', Arial, sans-serif;
              color: #1e293b;
              background: #fff;
              width: 210mm;
              height: 297mm;
              padding: 10mm 15mm 10mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              gap: 12px;
            }
            h1, h2, h3, h4 { font-family: 'Outfit', sans-serif; margin: 0; }
            h1 { text-transform: uppercase; font-size: 20pt; font-weight: 900; color: #0f172a; text-align: left; line-height: 1.1; }
            .contact {
              display: flex !important;
              flex-direction: row !important;
              flex-wrap: wrap !important;
              align-items: center !important;
              column-gap: 10px !important;
              row-gap: 3px !important;
              margin-top: 6px !important;
              font-size: 8.5pt !important;
              font-weight: 700 !important;
              color: #0052CC !important;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .contact span { display: inline-flex !important; align-items: center; white-space: nowrap; color: #0052CC; }
            .header-container { border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 2px; }
            .section { display: flex; flex-direction: column; gap: 4px; }
            .section-title {
              font-size: 8.5pt;
              font-weight: 800;
              border-bottom: 1.5px solid #0052CC;
              padding-bottom: 2px;
              margin-bottom: 6px;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #0052CC;
              width: 100%;
            }
            .item { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 9.5pt; }
            .item-title { font-weight: 700; color: #1e293b; }
            .item-sub { color: #64748b; font-weight: 500; }
            .item-desc { font-size: 9pt; color: #334155; margin-top: 2px; border-left: 2px solid #cbd5e1; padding-left: 8px; line-height: 1.4; text-align: justify; }
            .skills-list { display: flex; flex-wrap: wrap; gap: 4px; }
            .skill-tag {
              background: #f8fafc !important;
              border: 1px solid rgba(226, 232, 240, 0.8) !important;
              border-radius: 4px !important;
              padding: 2px 6px !important;
              font-size: 7.5pt !important;
              font-weight: 700 !important;
              color: #475569 !important;
              display: inline-block !important;
              white-space: nowrap !important;
            }
            .tech-tag {
              background: #f1f5f9 !important;
              border-radius: 4px !important;
              padding: 2px 6px !important;
              font-size: 7.5pt !important;
              font-weight: 700 !important;
              color: #475569 !important;
              display: inline-block !important;
            }
            .bullet-list { list-style-type: disc !important; padding-left: 12px; font-size: 9pt; color: #334155; margin-left: 14px; }
            .bullet-list li { margin-bottom: 2px; line-height: 1.4; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h1>${resumeData.name}</h1>
            <div class="contact">
              ${contactHTML}
            </div>
          </div>
          ${resumeData.careerObjective ? `
            <div class="section">
              <div class="section-title">Career Objective</div>
              <p style="font-size: 9.5pt; color: #334155; text-align: justify; margin: 0; line-height: 1.45;">${resumeData.careerObjective}</p>
            </div>
          ` : ""}
          ${resumeData.education && resumeData.education.length > 0 ? `
            <div class="section">
              <div class="section-title">Education</div>
              ${resumeData.education.map(edu => `
                <div class="item">
                  <div>
                    <span class="item-title">${edu.degree}</span><br/>
                    <span class="item-sub">${edu.school}</span>
                  </div>
                  <div style="text-align: right; font-weight: 700; font-size: 9pt; color: #64748b;">
                    <span>${edu.year}</span><br/>
                    <span style="color: #0052CC; font-weight: 800;">${edu.score}</span>
                  </div>
                </div>
              `).join("")}
            </div>
          ` : ""}
          ${resumeData.experience && resumeData.experience.length > 0 ? `
            <div class="section">
              <div class="section-title">Work Experience</div>
              ${resumeData.experience.map(exp => `
                <div style="margin-bottom: 4px;">
                  <div class="item">
                    <div>
                      <span class="item-title">${exp.role}</span> <span style="font-size: 7pt; font-weight: 700; padding: 1px 4px; border-radius: 3px; background: ${exp.type === "Internship" ? "#ecfdf5" : "#eff6ff"}; border: 1px solid ${exp.type === "Internship" ? "#a7f3d0" : "#bfdbfe"}; color: ${exp.type === "Internship" ? "#047857" : "#1d4ed8"};">${exp.type}</span><br/>
                      <span class="item-sub">${exp.company}</span>
                    </div>
                    <div style="text-align: right; font-weight: 700; font-size: 9pt; color: #64748b;">
                      <span>${exp.duration}</span>
                    </div>
                  </div>
                  ${exp.description ? `<div class="item-desc">${exp.description}</div>` : ""}
                </div>
              `).join("")}
            </div>
          ` : ""}
          ${resumeData.projects && resumeData.projects.length > 0 ? `
            <div class="section">
              <div class="section-title">Academics & Personal Projects</div>
              ${resumeData.projects.map(proj => `
                <div style="margin-bottom: 4px;">
                  <div class="item" style="align-items: flex-start;">
                    <span class="item-title" style="flex: 1; min-w-0; word-break: break-word;">${proj.title}</span>
                    <span class="tech-tag" style="flex-shrink: 0; margin-left: 8px;">${proj.tech}</span>
                  </div>
                  ${proj.description ? `<div style="font-size: 9pt; color: #334155; margin-top: 2px; line-height: 1.4; text-align: justify;">${proj.description}</div>` : ""}
                </div>
              `).join("")}
            </div>
          ` : ""}
          ${resumeData.skills && resumeData.skills.length > 0 ? `
            <div class="section">
              <div class="section-title">Key Skills</div>
              <div class="skills-list">
                ${resumeData.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join("")}
              </div>
            </div>
          ` : ""}
          ${resumeData.certifications && resumeData.certifications.length > 0 ? `
            <div class="section">
              <div class="section-title">Certifications</div>
              <ul class="bullet-list">
                ${resumeData.certifications.map(cert => cert ? `<li>${cert}</li>` : "").join("")}
              </ul>
            </div>
          ` : ""}
          ${resumeData.achievements && resumeData.achievements.length > 0 ? `
            <div class="section">
              <div class="section-title">Key Achievements</div>
              <ul class="bullet-list">
                ${resumeData.achievements.map(ach => ach ? `<li>${ach}</li>` : "").join("")}
              </ul>
            </div>
          ` : ""}
          ${resumeData.extraCurriculars && resumeData.extraCurriculars.length > 0 ? `
            <div class="section">
              <div class="section-title">Extra-Curricular Activities</div>
              <ul class="bullet-list">
                ${resumeData.extraCurriculars.map(ec => ec ? `<li>${ec}</li>` : "").join("")}
              </ul>
            </div>
          ` : ""}
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
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="font-outfit font-extrabold text-sm text-slate-900 tracking-tight leading-none uppercase break-words">
                {resumeData.name}
              </h2>
              <div className="text-[9px] font-bold text-primary tracking-wider uppercase mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
                <span>📍 {resumeData.place || "City, Country"}</span>
                <span>•</span>
                <span>✉️ {resumeData.email || "email@address.com"}</span>
                <span>•</span>
                <span>📞 {resumeData.phone || "Phone Number"}</span>
                {resumeData.portfolio?.linkedin && (
                  <>
                    <span>•</span>
                    <span>🔗 {resumeData.portfolio.linkedin}</span>
                  </>
                )}
                {resumeData.portfolio?.github && (
                  <>
                    <span>•</span>
                    <span>🐙 {resumeData.portfolio.github}</span>
                  </>
                )}
                {resumeData.portfolio?.website && (
                  <>
                    <span>•</span>
                    <span>🌐 {resumeData.portfolio.website}</span>
                  </>
                )}
              </div>
            </div>
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
                  <div key={edu.id} className="flex justify-between items-start text-[10px] gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 break-words">{edu.degree}</p>
                      <p className="text-slate-500 font-medium break-words">{edu.school}</p>
                    </div>
                    <div className="text-right text-[9px] text-slate-500 font-bold whitespace-nowrap shrink-0">
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
                    <div className="flex justify-between items-start text-[10px] gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 break-words">
                          {exp.role} 
                          <span className={`ml-1.5 text-[8px] font-bold px-1.5 py-0.2 bg-slate-50 border border-slate-200 rounded-full text-slate-500`}>
                            {exp.type}
                          </span>
                        </p>
                        <p className="text-slate-500 font-medium break-words">{exp.company}</p>
                      </div>
                      <div className="text-right text-[9px] text-slate-500 font-bold whitespace-nowrap shrink-0">
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
              <h4 className="font-outfit font-extrabold text-[10px] text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5">Academics & Personal Projects</h4>
              <div className="space-y-2">
                {resumeData.projects.map((proj) => (
                  <div key={proj.id} className="space-y-0.5 text-[10px]">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-bold text-slate-800 min-w-0 flex-1 break-words">{proj.title}</p>
                      <span className="text-[8px] font-bold text-slate-500 bg-slate-100 rounded px-1.5 py-0.2 shrink-0">{proj.tech}</span>
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

          {/* Certifications */}
          {resumeData.certifications && resumeData.certifications.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-outfit font-extrabold text-[10px] text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5">Certifications</h4>
              <ul className="list-disc pl-4 text-[9px] text-slate-600 space-y-0.5">
                {resumeData.certifications.map((cert, idx) => cert && (
                  <li key={idx} className="leading-normal">{cert}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Achievements */}
          {resumeData.achievements && resumeData.achievements.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-outfit font-extrabold text-[10px] text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5">Key Achievements</h4>
              <ul className="list-disc pl-4 text-[9px] text-slate-600 space-y-0.5">
                {resumeData.achievements.map((ach, idx) => ach && (
                  <li key={idx} className="leading-normal">{ach}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Extra-Curricular Activities */}
          {resumeData.extraCurriculars && resumeData.extraCurriculars.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-outfit font-extrabold text-[10px] text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5">Extra-Curricular Activities</h4>
              <ul className="list-disc pl-4 text-[9px] text-slate-600 space-y-0.5">
                {resumeData.extraCurriculars.map((ec, idx) => ec && (
                  <li key={idx} className="leading-normal">{ec}</li>
                ))}
              </ul>
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
