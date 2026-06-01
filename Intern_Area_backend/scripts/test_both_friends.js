const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

async function testBoth() {
  const shamilId = "6a12cd0d1cd2e9edc58dcb6b";
  const abcdId = "6a12deecec1fbf7fab8c8269";

  const shamilToken = jwt.sign({ id: shamilId }, process.env.JWT_SECRET);
  const abcdToken = jwt.sign({ id: abcdId }, process.env.JWT_SECRET);

  console.log("Fetching friends for sh4mil...");
  const shamilRes = await fetch("http://localhost:5000/api/friends", {
    headers: { Authorization: `Bearer ${shamilToken}` }
  });
  console.log("sh4mil API Response:", await shamilRes.json());

  console.log("\nFetching friends for abcd...");
  const abcdRes = await fetch("http://localhost:5000/api/friends", {
    headers: { Authorization: `Bearer ${abcdToken}` }
  });
  console.log("abcd API Response:", await abcdRes.json());

  process.exit(0);
}

testBoth();
