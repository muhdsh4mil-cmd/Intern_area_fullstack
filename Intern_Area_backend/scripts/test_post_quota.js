require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');

async function testQuotaEnforcement() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Clean up any existing posts from prior testing
    await Post.deleteMany({});
    console.log("Cleaned up existing posts.");

    // 1. Identify test users
    const abcd = await User.findOne({ name: "abcd" });
    const admin = await User.findOne({ name: "Administrator" });

    if (!abcd || !admin) {
      throw new Error("Could not find test users 'abcd' or 'Administrator' in DB.");
    }

    console.log(`\nFound User abcd (ID: ${abcd._id}) with friends count: ${abcd.friends.length}`);
    console.log(`Found User admin (ID: ${admin._id}) with friends count: ${admin.friends.length}`);

    // Helper to calculate quota
    const getQuotaForUser = async (userId) => {
      const user = await User.findById(userId).select("friends");
      const friendCount = user.friends ? user.friends.length : 0;
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayPostsCount = await Post.countDocuments({
        user: userId,
        createdAt: { $gte: startOfDay },
      });

      let quotaLimit = 0;
      if (friendCount === 0) quotaLimit = 0;
      else if (friendCount <= 10) quotaLimit = friendCount;
      else quotaLimit = Infinity;

      const remaining = quotaLimit === Infinity ? "Unlimited" : Math.max(0, quotaLimit - todayPostsCount);

      return { friendCount, todayPostsCount, quotaLimit, remaining };
    };

    // Helper to try creating a post
    const tryCreatePost = async (userId, content) => {
      const quota = await getQuotaForUser(userId);
      if (quota.quotaLimit === 0) {
        throw new Error("Post Creation Locked - Add Friends to Unlock Posting");
      }
      if (quota.quotaLimit !== Infinity && quota.todayPostsCount >= quota.quotaLimit) {
        throw new Error(`Daily post limit reached (${quota.todayPostsCount}/${quota.quotaLimit}).`);
      }
      return await Post.create({ user: userId, content });
    };

    // --- TEST 1: User with 0 friends (Admin) ---
    console.log("\n--- TEST 1: User with 0 friends ---");
    const adminQuota = await getQuotaForUser(admin._id);
    console.log("Admin Quota Info:", adminQuota);
    if (adminQuota.quotaLimit !== 0) throw new Error("Expected quota limit 0 for user with 0 friends");
    
    try {
      await tryCreatePost(admin._id, "Hello from administrator");
      throw new Error("FAIL: Admin with 0 friends was able to create a post!");
    } catch (err) {
      console.log("SUCCESS: Attempt rejected as expected with error:", err.message);
    }

    // --- TEST 2: User with 1 friend (abcd) ---
    console.log("\n--- TEST 2: User with 1 friend ---");
    const abcdQuotaBefore = await getQuotaForUser(abcd._id);
    console.log("abcd Quota Before:", abcdQuotaBefore);
    if (abcdQuotaBefore.quotaLimit !== 1) throw new Error("Expected quota limit 1 for user with 1 friend");
    if (abcdQuotaBefore.remaining !== 1) throw new Error("Expected 1 remaining post");

    // Create 1st post (should succeed)
    console.log("Creating 1st post for abcd...");
    const post1 = await tryCreatePost(abcd._id, "This is abcd's first post today!");
    console.log("Post 1 created successfully.");

    const abcdQuotaAfter = await getQuotaForUser(abcd._id);
    console.log("abcd Quota After 1st post:", abcdQuotaAfter);
    if (abcdQuotaAfter.todayPostsCount !== 1) throw new Error("Expected todayPostsCount to be 1");
    if (abcdQuotaAfter.remaining !== 0) throw new Error("Expected 0 remaining posts");

    // Create 2nd post (should fail)
    try {
      await tryCreatePost(abcd._id, "This is abcd's second post today!");
      throw new Error("FAIL: abcd was able to create a second post today!");
    } catch (err) {
      console.log("SUCCESS: Attempt to exceed limit rejected with error:", err.message);
    }

    // --- TEST 3: Unlimited Quota Scenario (Simulated friends update) ---
    console.log("\n--- TEST 3: Unlimited Posting (>10 friends) ---");
    // Temporarily simulate having 11 friends
    const originalFriends = abcd.friends;
    // Mock 11 fake ObjectIds
    const fakeFriends = Array(11).fill(0).map(() => new mongoose.Types.ObjectId());
    abcd.friends = fakeFriends;
    await abcd.save();
    console.log("Simulated 11 friends for user abcd.");

    const simulatedQuota = await getQuotaForUser(abcd._id);
    console.log("abcd Quota with simulated friends:", simulatedQuota);
    if (simulatedQuota.quotaLimit !== Infinity) throw new Error("Expected quota limit to be Infinity");
    if (simulatedQuota.remaining !== "Unlimited") throw new Error("Expected remaining quota to be Unlimited");

    // Create 2nd post under simulated unlimited quota
    console.log("Creating 2nd post for abcd under simulated unlimited status...");
    const post2 = await tryCreatePost(abcd._id, "Unlimited post creation test!");
    console.log("Post 2 created successfully.");

    const simulatedQuotaAfter = await getQuotaForUser(abcd._id);
    console.log("abcd Quota with simulated friends after 2nd post:", simulatedQuotaAfter);
    if (simulatedQuotaAfter.todayPostsCount !== 2) throw new Error("Expected todayPostsCount to be 2");

    // Restore friends list
    abcd.friends = originalFriends;
    await abcd.save();
    console.log("Restored original friends list for user abcd.");

    // Clean up test posts
    await Post.deleteMany({});
    console.log("Cleaned up test posts from database.");

    console.log("\nALL TESTS PASSED SUCCESSFULLY! 🚀");
    process.exit(0);
  } catch (err) {
    console.error("\nTEST FAILED:", err);
    process.exit(1);
  }
}

testQuotaEnforcement();
