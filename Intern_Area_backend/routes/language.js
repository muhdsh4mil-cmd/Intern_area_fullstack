const express = require("express");
const router = express.Router();
const {
  requestFrenchOTP,
  verifyFrenchOTP,
  updateLanguagePreference,
} = require("../controllers/languageController");
const { protect } = require("../middleware/auth");

// French OTP verification (requires authentication)
router.post("/request-french-otp", protect, requestFrenchOTP);
router.post("/verify-french-otp", protect, verifyFrenchOTP);

// Direct language update for non-French languages
router.put("/preference", protect, updateLanguagePreference);

module.exports = router;
