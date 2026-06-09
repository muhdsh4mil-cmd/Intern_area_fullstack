const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  sendResumeOTP,
  verifyResumeOTP,
  createResumeOrder,
  verifyResumePayment
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);

// Premium Resume Creation routes
router.post("/resume-otp", protect, sendResumeOTP);
router.post("/verify-resume-otp", protect, verifyResumeOTP);
router.post("/create-resume-order", protect, createResumeOrder);
router.post("/verify-resume-payment", protect, verifyResumePayment);

module.exports = router;
