require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB database.");

    const users = await User.find().select("name email role friends");
    console.log("\n--- Users in DB ---");
    for (const u of users) {
      console.log(`- ID: ${u._id} | Name: ${u.name} | Role: ${u.role} | Friends count: ${u.friends ? u.friends.length : 0}`);
    }

    const postsCount = await Post.countDocuments();
    console.log(`\nTotal posts in community: ${postsCount}`);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

checkUsers();
