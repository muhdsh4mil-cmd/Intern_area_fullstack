const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");

// Plan config
const PLAN_LIMITS = {
  free: 1,
  bronze: 3,
  silver: 5,
  gold: Infinity,
};

const PLAN_PRICES = {
  bronze: 100,
  silver: 300,
  gold: 1000,
};

// @desc    Get current user's subscription details
// @route   GET /api/subscriptions/me
// @access  Private
const getMySubscription = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "subscriptionPlan subscriptionStatus planExpiresAt monthlyApplicationsUsed applicationsResetMonth"
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Auto-expire plan if endDate passed
  if (
    user.subscriptionPlan !== "free" &&
    user.planExpiresAt &&
    new Date() > user.planExpiresAt
  ) {
    user.subscriptionPlan = "free";
    user.subscriptionStatus = "expired";
    user.planExpiresAt = null;
    await user.save({ validateBeforeSave: false });
  }

  // Reset monthly counter if month changed
  const currentMonth = new Date().getMonth() + 1;
  if (user.applicationsResetMonth !== currentMonth) {
    user.monthlyApplicationsUsed = 0;
    user.applicationsResetMonth = currentMonth;
    await user.save({ validateBeforeSave: false });
  }

  const plan = user.subscriptionPlan;
  const limit = PLAN_LIMITS[plan];

  res.json({
    plan,
    status: user.subscriptionStatus,
    planExpiresAt: user.planExpiresAt,
    monthlyApplicationsUsed: user.monthlyApplicationsUsed,
    monthlyLimit: limit === Infinity ? null : limit,
    isUnlimited: limit === Infinity,
    prices: PLAN_PRICES,
  });
});

// @desc    Get user's payment / subscription history
// @route   GET /api/subscriptions/history
// @access  Private
const getPaymentHistory = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);

  const payments = await Payment.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ subscriptions, payments });
});

module.exports = { getMySubscription, getPaymentHistory };
