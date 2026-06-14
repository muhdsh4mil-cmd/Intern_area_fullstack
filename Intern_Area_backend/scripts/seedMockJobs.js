const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Job = require("../models/Job");
const User = require("../models/User");

// ESM to CommonJS loader
function loadMockJobs() {
  const filePath = path.join(__dirname, "../../Intern_Area_frontend/src/data/mockData.js");
  if (!fs.existsSync(filePath)) {
    throw new Error(`mockData.js not found at ${filePath}`);
  }
  let content = fs.readFileSync(filePath, "utf8");

  // Remove ESM exports and convert to module.exports
  content = content.replace(/export const /g, "");
  content += "\nmodule.exports = { mockJobs, mockCategories, initialApplications };";

  const tempFilePath = path.join(__dirname, "tempMockData.js");
  fs.writeFileSync(tempFilePath, content, "utf8");

  try {
    const mockData = require(tempFilePath);
    // clean up require cache so future reads are fresh if modified
    delete require.cache[require.resolve(tempFilePath)];
    fs.unlinkSync(tempFilePath);
    return mockData.mockJobs;
  } catch (error) {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    throw error;
  }
}

// Map frontend categories to database categories
const CATEGORY_MAPPINGS = {
  "React Frontend Developer Intern": "Developer",
  "Web Development Intern": "Developer",
  "Graphic Design & UI Intern": "Design",
  "Full Stack Software Engineer": "Developer",
  "Digital Marketing Specialist": "Marketing",
  "Operations & Sales Associate": "Sales",
  "Data Science & Analyst Intern": "Analyst",
  "Product Management Intern": "Marketing",
  "Brand Executive (Beauty)": "Marketing",
  "QA Automation Engineer": "Developer",
  "HR Talent Acquisition Intern": "HR",
  "Web Graphics & Media Intern": "Design",
  "Django Backend Engineer": "Developer",
  "Remote Data Scientist": "Analyst",
  "Lead Video Producer & Editor": "Design",
  "Python & Django Developer Intern": "Developer",
  "Machine Learning & Data Science Intern": "Analyst",
  "Senior Full Stack Web Developer": "Developer",
  "UI/UX Product Designer Intern": "Design",
  "DevOps Cloud Engineer": "Developer",
  "Content Creator & Copywriter Intern": "Marketing",
  "Data Engineer": "Developer",
  "Cyber Security Intern": "Developer",
  "HR Operations Manager": "HR"
};

const seedMockJobs = async () => {
  try {
    console.log("🌱 Starting mock jobs seeding...");
    const mockJobs = loadMockJobs();
    
    // Find or create an Admin user to associate with postedBy
    let adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.log("⚠️ No admin user found for seeding. Creating default admin...");
      const bcrypt = require("bcryptjs");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("adminsh4mil007", salt);
      adminUser = await User.create({
        name: "Administrator",
        email: "adminpopzz",
        password: hashedPassword,
        role: "admin",
        company: "Intern Area",
      });
    }

    const postedById = adminUser._id;

    for (const mockJob of mockJobs) {
      const category = CATEGORY_MAPPINGS[mockJob.title] || "Developer";
      
      // Map frontend fields to DB Schema fields
      const jobData = {
        title: mockJob.title,
        company: mockJob.company,
        location: mockJob.location || "Remote",
        type: mockJob.type, // "Internship" or "Job" (which we just added to the enum)
        category: category,
        salary: mockJob.stipend || "Not disclosed",
        description: mockJob.description,
        requirements: mockJob.requirements || [],
        skills: mockJob.skills || [],
        openings: mockJob.openings || 1,
        postedBy: postedById,
        isActive: true,
      };

      // Upsert by ObjectId (mockJob.id)
      await Job.findByIdAndUpdate(
        mockJob.id,
        { $set: jobData },
        { upsert: true, new: true, runValidators: true }
      );
    }

    console.log(`✅ Successfully seeded/updated ${mockJobs.length} mock jobs in MongoDB.`);
  } catch (error) {
    console.error("❌ Error seeding mock jobs:", error);
  }
};

module.exports = seedMockJobs;
