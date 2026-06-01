const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

async function testApi() {
  try {
    const shamilId = "6a12cd0d1cd2e9edc58dcb6b";
    const token = jwt.sign({ id: shamilId }, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    console.log("Generated Token:", token);
    
    const response = await fetch("http://localhost:5000/api/friends", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();
    console.log("\nAPI Response from /api/friends:");
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error("API Call failed:", err.message);
  }
  process.exit(0);
}

testApi();
