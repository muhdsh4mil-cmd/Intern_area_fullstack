/**
 * Run this script ONCE to create an admin user in MongoDB:
 * node scripts/createAdmin.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");

const createAdmin = async () => {
  await connectDB();

  // Access collection directly to avoid middleware issues
  const db = mongoose.connection.db;
  const usersCollection = db.collection("users");

  const email = process.argv[2] || "adminpopzz";
  const password = process.argv[3] || "adminsh4mil007";

  const existing = await usersCollection.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log("✅ Admin user already exists:", existing.email);
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await usersCollection.insertOne({
    name: "Administrator",
    email: email.toLowerCase(),
    password: hashedPassword,
    role: "admin",
    company: "Intern Area",
    avatar: "",
    bio: "",
    skills: [],
    location: "",
    phone: "",
    resumeUrl: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("🎉 Admin user created successfully!");
  console.log(`   Email   : ${email.toLowerCase()}`);
  console.log(`   Password: ${password}`);
  console.log("   Role    : admin");
  process.exit(0);
};

createAdmin().catch((err) => {
  console.error("❌ Error creating admin:", err.message);
  process.exit(1);
});
