const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");

async function checkFriends() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.\n");

    const users = await User.find({});
    console.log(`Found ${users.length} total users in database:\n`);

    for (const u of users) {
      console.log(`User: "${u.name}" (ID: ${u._id})`);
      console.log(`  uniqueId: ${u.uniqueId}`);
      console.log(`  email: ${u.email}`);
      console.log(`  friends: [${u.friends.map(id => id.toString()).join(", ")}]`);
      console.log(`  friendRequests: [${u.friendRequests.map(id => id.toString()).join(", ")}]`);
      console.log(`  sentRequests: [${u.sentRequests.map(id => id.toString()).join(", ")}]`);
      console.log("-----------------------------------------");
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkFriends();
