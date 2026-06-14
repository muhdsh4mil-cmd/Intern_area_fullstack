require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { applyForJob } = require('../controllers/applicationController');

async function testApplicationQuota() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Find candidate abcd
    const user = await User.findOne({ name: "abcd" });
    if (!user) {
      throw new Error("Could not find candidate user 'abcd' in DB.");
    }
    console.log(`Found test candidate user: ${user.name} (ID: ${user._id}), Plan: ${user.subscriptionPlan}`);

    // Clean up existing applications for this user
    const deletedCount = await Application.deleteMany({ candidate: user._id });
    console.log(`Cleaned up ${deletedCount.deletedCount} existing applications for user 'abcd'.`);

    // Reset user's applications used
    user.monthlyApplicationsUsed = 0;
    user.subscriptionPlan = "free";
    await user.save();
    console.log("Reset monthlyApplicationsUsed to 0 and plan to free.");

    // Helper to simulate request/response
    const simulateApply = async (jobId) => {
      const req = {
        user: { _id: user._id.toString() },
        body: {
          jobId: jobId,
          coverLetter: "Test cover letter",
          resumeUrl: "resume.pdf",
          customResumeName: ""
        }
      };

      let statusCode = 200;
      let responseData = null;
      let thrownError = null;

      const res = {
        status: (code) => {
          statusCode = code;
          return res;
        },
        json: (data) => {
          responseData = data;
        }
      };

      try {
        await new Promise((resolve, reject) => {
          applyForJob(req, res, (err) => {
            if (err) {
              thrownError = err;
              reject(err);
            } else {
              resolve();
            }
          }).then(resolve).catch(reject);
        });
      } catch (err) {
        thrownError = err;
      }

      return { statusCode, responseData, thrownError };
    };

    // 1st Application - Job 1
    const job1Id = "65f1a2c3d4e5f60011223301";
    console.log(`\n--- Attempting 1st application to Job 1 (ID: ${job1Id}) ---`);
    const result1 = await simulateApply(job1Id);
    if (result1.thrownError) {
      console.log(`❌ 1st application failed: ${result1.thrownError.message}`);
      throw result1.thrownError;
    }
    console.log(`✅ 1st application succeeded! Status: ${result1.statusCode}`);
    
    // Check DB counter
    const userAfter1 = await User.findById(user._id);
    console.log(`User used applications: ${userAfter1.monthlyApplicationsUsed}`);
    if (userAfter1.monthlyApplicationsUsed !== 1) {
      throw new Error(`Expected applications used count to be 1, but got ${userAfter1.monthlyApplicationsUsed}`);
    }

    // 2nd Application - Job 2
    const job2Id = "65f1a2c3d4e5f60011223302";
    console.log(`\n--- Attempting 2nd application to Job 2 (ID: ${job2Id}) ---`);
    const result2 = await simulateApply(job2Id);
    
    if (result2.thrownError) {
      console.log(`✅ 2nd application rejected as expected! Error: ${result2.thrownError.message}`);
      if (!result2.thrownError.message.includes("reached your Free Plan limit")) {
        throw new Error(`Unexpected error message: ${result2.thrownError.message}`);
      }
    } else {
      console.log(`❌ 2nd application succeeded (status ${result2.statusCode}), but it was expected to fail under Free Plan!`);
      throw new Error("Free plan limit was not enforced!");
    }

    // Check DB count for applications
    const appCount = await Application.countDocuments({ candidate: user._id });
    console.log(`\nTotal applications in DB for abcd: ${appCount}`);
    if (appCount !== 1) {
      throw new Error(`Expected exactly 1 application in DB, but found ${appCount}`);
    }

    // Clean up
    await Application.deleteMany({ candidate: user._id });
    user.monthlyApplicationsUsed = 0;
    await user.save();
    console.log("\nTest databases cleaned up successfully.");

    console.log("\n🎉 ALL QUOTA ENFORCEMENT AND DB SAVE TESTS PASSED SUCCESSFULLY! 🚀");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
    process.exit(1);
  }
}

testApplicationQuota();
