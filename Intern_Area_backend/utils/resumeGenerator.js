const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Generates a professional PDF resume for a candidate
 * @param {string} userId - ID of the user
 * @param {object} resumeData - Candidate's resume details
 * @returns {Promise<string>} - Resolves to the public URL path /uploads/resume_*.pdf
 */
function generateResumePDF(userId, resumeData) {
  return new Promise((resolve, reject) => {
    try {
      const uploadsDir = path.join(__dirname, "..", "uploads");
      
      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `resume_${userId}.pdf`;
      const filePath = path.join(uploadsDir, filename);
      const publicUrl = `/uploads/${filename}`;

      // Create PDF document (A4 size, margin 35)
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 35, bottom: 35, left: 35, right: 35 },
        bufferPages: true
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Color scheme
      const colors = {
        primary: "#0052CC",     // Deep Blue
        textDark: "#1E293B",    // Charcoal
        textMuted: "#64748B",   // Slate Grey
        divider: "#CBD5E1"      // Slate Light
      };

      // ─── Header Section ──────────────────────────────────────────────────────────
      let headerTextWidth = 525; // default full width minus margins (595 - 70)
      
      // Draw Profile Photo if provided
      if (resumeData.photoUrl) {
        try {
          const base64Data = resumeData.photoUrl.replace(/^data:image\/\w+;base64,/, "");
          const imgBuffer = Buffer.from(base64Data, "base64");
          // Draw image on the right
          doc.image(imgBuffer, 490, 35, { width: 70, height: 70 });
          headerTextWidth = 445; // restrict text width to avoid overlap
        } catch (err) {
          console.error("PDF generator: Failed to draw profile photo:", err.message);
        }
      }

      // Name
      doc.font("Helvetica-Bold")
         .fontSize(20)
         .fillColor(colors.textDark)
         .text(resumeData.name.toUpperCase(), 35, 35, { width: headerTextWidth });
      
      doc.moveDown(0.15);

      // Contact Information horizontally separated by bullets
      const contactInfoList = [];
      if (resumeData.place) contactInfoList.push(`📍 ${resumeData.place}`);
      if (resumeData.email) contactInfoList.push(`✉️ ${resumeData.email}`);
      if (resumeData.phone) contactInfoList.push(`📞 ${resumeData.phone}`);
      if (resumeData.portfolio?.linkedin) contactInfoList.push(`🔗 ${resumeData.portfolio.linkedin}`);
      if (resumeData.portfolio?.github) contactInfoList.push(`🐙 ${resumeData.portfolio.github}`);
      if (resumeData.portfolio?.website) contactInfoList.push(`🌐 ${resumeData.portfolio.website}`);
      
      const contactString = contactInfoList.join("   •   ");
      
      doc.font("Helvetica-Bold")
         .fontSize(8.5)
         .fillColor(colors.primary)
         .text(contactString.toUpperCase(), 35, doc.y, { width: headerTextWidth, lineGap: 3 });

      // Draw primary colored divider line below header
      doc.moveDown(0.5);
      const headerEndY = Math.max(doc.y, 115);
      
      doc.strokeColor(colors.textDark)
         .lineWidth(2)
         .moveTo(35, headerEndY)
         .lineTo(560, headerEndY)
         .stroke();

      // Reset cursor position to start after divider line
      doc.y = headerEndY + 10;

      // ─── Helper function to draw section headers ───────────────────────────
      const drawSectionHeader = (title) => {
        // Enforce page breaks if heading is too low
        if (doc.y > 750) {
          doc.addPage();
        }
        doc.moveDown(0.5);
        const startY = doc.y;
        
        doc.font("Helvetica-Bold")
           .fontSize(10)
           .fillColor(colors.primary)
           .text(title.toUpperCase(), 35, startY);
        
        doc.moveDown(0.15);
         
        doc.strokeColor(colors.primary)
           .lineWidth(1.2)
           .moveTo(35, doc.y)
           .lineTo(560, doc.y)
           .stroke();
        
        doc.moveDown(0.35);
      };

      // ─── Career Objective ───────────────────────────────────────────────────────
      if (resumeData.careerObjective) {
        drawSectionHeader("Career Objective");
        doc.font("Helvetica")
           .fontSize(9.5)
           .fillColor(colors.textDark)
           .text(resumeData.careerObjective, { align: "justify", lineGap: 1.5 });
      }

      // ─── Education ─────────────────────────────────────────────────────────────
      if (resumeData.education && resumeData.education.length > 0) {
        drawSectionHeader("Education");
        
        resumeData.education.forEach((edu) => {
          if (doc.y > 760) doc.addPage();
          
          const eduStartY = doc.y;
          
          // Degree (Left)
          doc.font("Helvetica-Bold")
             .fontSize(10)
             .fillColor(colors.textDark)
             .text(edu.degree || "Degree", 35, eduStartY, { width: 390 });
          
          // School (Left, below degree)
          doc.font("Helvetica")
             .fontSize(9)
             .fillColor(colors.textMuted)
             .text(edu.school || "School / University", 35, doc.y + 1, { width: 390 });
          
          // Year (Right)
          doc.font("Helvetica-Bold")
             .fontSize(9.5)
             .fillColor(colors.textMuted)
             .text(edu.year || "", 435, eduStartY, { width: 125, align: "right" });
          
          // Score (Right, below year)
          if (edu.score) {
            doc.font("Helvetica-Bold")
               .fontSize(9.5)
               .fillColor(colors.primary)
               .text(edu.score, 435, doc.y + 1, { width: 125, align: "right" });
          }

          doc.moveDown(0.4);
        });
      }

      // ─── Work Experience ───────────────────────────────────────────────────────
      if (resumeData.experience && resumeData.experience.length > 0) {
        drawSectionHeader("Work Experience");
        
        resumeData.experience.forEach((exp) => {
          if (doc.y > 750) doc.addPage();
          
          const expStartY = doc.y;
          const roleText = exp.role || "Role";
          const typeTag = exp.type ? ` (${exp.type})` : "";
          
          // Role Name (Left)
          doc.font("Helvetica-Bold")
             .fontSize(10)
             .fillColor(colors.textDark)
             .text(`${roleText}${typeTag}`, 35, expStartY, { width: 390 });
          
          // Company (Left)
          doc.font("Helvetica")
             .fontSize(9)
             .fillColor(colors.textMuted)
             .text(exp.company || "Company", 35, doc.y + 1, { width: 390 });
          
          // Duration (Right)
          doc.font("Helvetica-Bold")
             .fontSize(9.5)
             .fillColor(colors.textMuted)
             .text(exp.duration || "", 435, expStartY, { width: 125, align: "right" });
          
          // Description (Below)
          if (exp.description) {
            doc.moveDown(0.25);
            const descStartY = doc.y;
            doc.font("Helvetica")
               .fontSize(9)
               .fillColor(colors.textDark)
               .text(exp.description, 42, doc.y, { width: 518, align: "justify", lineGap: 1.5 });
            
            const descEndY = doc.y;
            doc.strokeColor(colors.divider)
               .lineWidth(1.5)
               .moveTo(37, descStartY + 1)
               .lineTo(37, descEndY - 1)
               .stroke();
          }
          
          doc.moveDown(0.4);
        });
      }

      // ─── Projects ──────────────────────────────────────────────────────────────
      if (resumeData.projects && resumeData.projects.length > 0) {
        drawSectionHeader("Academics & Personal Projects");
        
        resumeData.projects.forEach((proj) => {
          if (doc.y > 750) doc.addPage();
          
          const projStartY = doc.y;
          
          // Project Title (Left)
          doc.font("Helvetica-Bold")
             .fontSize(10)
             .fillColor(colors.textDark)
             .text(proj.title || "Project Title", 35, projStartY, { width: 380 });
          
          // Tech Stack (Right)
          if (proj.tech) {
            doc.font("Helvetica-Bold")
               .fontSize(8.5)
               .fillColor(colors.textMuted)
               .text(proj.tech, 420, projStartY, { width: 140, align: "right" });
          }
          
          // Description
          if (proj.description) {
            doc.moveDown(0.25);
            doc.font("Helvetica")
               .fontSize(9)
               .fillColor(colors.textDark)
               .text(proj.description, 35, doc.y, { width: 525, align: "justify", lineGap: 1.5 });
          }
          
          doc.moveDown(0.4);
        });
      }

      // ─── Key Skills ────────────────────────────────────────────────────────────
      if (resumeData.skills && resumeData.skills.length > 0) {
        drawSectionHeader("Key Skills");
        
        if (doc.y > 770) doc.addPage();
        
        let currentX = 35;
        let currentY = doc.y;
        
        resumeData.skills.forEach((skill) => {
          doc.font("Helvetica-Bold").fontSize(8);
          const textWidth = doc.widthOfString(skill);
          const boxWidth = textWidth + 12;
          const boxHeight = 16;
          
          if (currentX + boxWidth > 560) {
            currentX = 35;
            currentY += boxHeight + 5;
          }
          
          if (currentY > 770) {
            doc.addPage();
            currentY = doc.y;
            currentX = 35;
          }
          
          // Background box
          doc.fillColor("#f8fafc")
             .roundedRect(currentX, currentY, boxWidth, boxHeight, 3)
             .fill();
             
          // Border
          doc.strokeColor("#cbd5e1")
             .lineWidth(0.5)
             .roundedRect(currentX, currentY, boxWidth, boxHeight, 3)
             .stroke();
             
          // Text
          doc.fillColor("#475569")
             .text(skill, currentX + 6, currentY + 4, { width: textWidth, align: "center" });
             
          currentX += boxWidth + 5;
        });
        
        doc.y = currentY + 20;
      }

      // ─── Certifications ────────────────────────────────────────────────────────
      if (resumeData.certifications && resumeData.certifications.length > 0) {
        drawSectionHeader("Certifications");
        
        resumeData.certifications.forEach((cert) => {
          if (!cert) return;
          if (doc.y > 770) doc.addPage();
          
          doc.font("Helvetica")
             .fontSize(9)
             .fillColor(colors.textDark)
             .text(`•  ${cert}`, 40, doc.y, { width: 520, lineGap: 1.5 });
          
          doc.moveDown(0.2);
        });
      }

      // ─── Key Achievements ───────────────────────────────────────────────────────
      if (resumeData.achievements && resumeData.achievements.length > 0) {
        drawSectionHeader("Key Achievements");
        
        resumeData.achievements.forEach((ach) => {
          if (!ach) return;
          if (doc.y > 770) doc.addPage();
          
          doc.font("Helvetica")
             .fontSize(9)
             .fillColor(colors.textDark)
             .text(`•  ${ach}`, 40, doc.y, { width: 520, lineGap: 1.5 });
          
          doc.moveDown(0.2);
        });
      }

      // ─── Extra-Curricular Activities ───────────────────────────────────────────
      if (resumeData.extraCurriculars && resumeData.extraCurriculars.length > 0) {
        drawSectionHeader("Extra-Curricular Activities");
        
        resumeData.extraCurriculars.forEach((ec) => {
          if (!ec) return;
          if (doc.y > 770) doc.addPage();
          
          doc.font("Helvetica")
             .fontSize(9)
             .fillColor(colors.textDark)
             .text(`•  ${ec}`, 40, doc.y, { width: 520, lineGap: 1.5 });
          
          doc.moveDown(0.2);
        });
      }

      // Finalize document
      doc.end();

      // Resolve URL path on successful stream write
      writeStream.on("finish", () => {
        resolve(publicUrl);
      });

      writeStream.on("error", (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateResumePDF };
