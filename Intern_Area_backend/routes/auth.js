const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  logoutUser,
  googleLogin,
  requestPasswordReset,
  verifyOTPAndReset,
  verifyLoginOTP,
  getLoginHistory,
  getAllLoginHistory,
  deleteLoginEntry,
  clearAllLoginHistory,
} = require("../controllers/authController");
const { protect, authorizeRoles } = require("../middleware/auth");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/forgot-password", requestPasswordReset);
router.post("/verify-reset-otp", verifyOTPAndReset);
router.post("/verify-login-otp", verifyLoginOTP);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/logout", protect, logoutUser);
router.get("/login-history", protect, getLoginHistory);
router.get("/all-login-history", protect, authorizeRoles("admin"), getAllLoginHistory);
router.delete("/all-login-history", protect, authorizeRoles("admin"), clearAllLoginHistory);
router.delete("/login-history/:userId/:entryId", protect, authorizeRoles("admin"), deleteLoginEntry);

module.exports = router;
