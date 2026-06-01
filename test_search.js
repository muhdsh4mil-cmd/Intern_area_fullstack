require('dotenv').config({ path: './Intern_Area_backend/.env' });
const mongoose = require('mongoose');
const User = require('./Intern_Area_backend/models/User');

async function testSearch() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://user:pass@cluster.mongodb.net/test");
  
  const query = "abcd_dhv2KHtA";
  const users = await User.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { uniqueId: { $regex: query, $options: "i" } },
    ],
  });
  
  console.log("Users found:", users);
  
  process.exit(0);
}

testSearch();
