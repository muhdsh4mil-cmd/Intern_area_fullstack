const express = require("express");
const router = express.Router();
const { getMySubscription, getPaymentHistory } = require("../controllers/subscriptionController");
const { protect } = require("../middleware/auth");

router.get("/me", protect, getMySubscription);          // GET /api/subscriptions/me
router.get("/history", protect, getPaymentHistory);     // GET /api/subscriptions/history

module.exports = router;
