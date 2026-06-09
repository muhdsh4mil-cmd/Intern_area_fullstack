const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const ResumePayment = require("../models/ResumePayment");
const sendEmail = require("../config/email");
const { generateResumePDF } = require("../utils/resumeGenerator");

// ─── Plan config ──────────────────────────────────────────────────────────────
const PLAN_PRICES = {
  bronze: 100,
  silver: 300,
  gold: 1000,
};

const PLAN_NAMES = {
  bronze: "Bronze Plan 🥉",
  silver: "Silver Plan 🥈",
  gold: "Gold Plan 🥇",
};

const PLAN_LIMITS = {
  bronze: "3 applications / month",
  silver: "5 applications / month",
  gold: "Unlimited applications",
};

// ─── Razorpay instance (lazy — only initialised when needed) ──────────────────
function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes("your_razorpay")) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// ─── IST time-window helper (10:00 AM – 11:00 AM IST) ────────────────────────
function isPaymentWindowOpen() {
  const now = new Date();
  // IST = UTC + 5:30
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffsetMs);
  const hours = istNow.getUTCHours();
  const minutes = istNow.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;
  // 10:00 AM = 600 min, 11:00 AM = 660 min
  return totalMinutes >= 600 && totalMinutes < 660;
}

// ─── Invoice number generator ─────────────────────────────────────────────────
async function generateInvoiceNumber() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // "20260602"
  const count = await Subscription.countDocuments({
    createdAt: {
      $gte: new Date(today.setHours(0, 0, 0, 0)),
      $lt: new Date(today.setHours(23, 59, 59, 999)),
    },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `INV-${dateStr}-${seq}`;
}

// ─── Invoice email HTML ───────────────────────────────────────────────────────
function buildInvoiceHtml({ user, plan, price, invoiceNumber, startDate, endDate, paymentId }) {
  return `
  <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:linear-gradient(135deg,#0052CC,#008BDC);padding:32px 40px;text-align:center">
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px">InternArea</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:13px">Payment Confirmation & Invoice</p>
    </div>
    <div style="padding:40px">
      <p style="color:#334155;font-size:15px;margin:0 0 24px">Hi <strong>${user.name}</strong>,</p>
      <p style="color:#64748b;font-size:14px;margin:0 0 32px">Your subscription has been activated successfully. Here are your payment details:</p>

      <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:28px;border:1px solid #e2e8f0">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#64748b;width:50%">Invoice Number</td><td style="padding:8px 0;color:#1e293b;font-weight:700;text-align:right">${invoiceNumber}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Transaction ID</td><td style="padding:8px 0;color:#1e293b;font-weight:600;text-align:right;font-size:12px">${paymentId}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Plan</td><td style="padding:8px 0;text-align:right"><span style="background:#008BDC;color:#fff;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700">${PLAN_NAMES[plan]}</span></td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Applications Allowed</td><td style="padding:8px 0;color:#1e293b;font-weight:600;text-align:right">${PLAN_LIMITS[plan]}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Valid From</td><td style="padding:8px 0;color:#1e293b;font-weight:600;text-align:right">${new Date(startDate).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Valid Until</td><td style="padding:8px 0;color:#1e293b;font-weight:600;text-align:right">${new Date(endDate).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}</td></tr>
          <tr style="border-top:2px solid #e2e8f0"><td style="padding:16px 0 8px;color:#1e293b;font-weight:800;font-size:16px">Amount Paid</td><td style="padding:16px 0 8px;color:#008BDC;font-weight:900;font-size:20px;text-align:right">₹${price}</td></tr>
        </table>
      </div>

      <p style="color:#64748b;font-size:13px;margin:0 0 8px">You can now apply to more internships based on your plan. Log in to InternArea to get started!</p>
      <p style="color:#94a3b8;font-size:12px;margin:32px 0 0">If you have any questions, reply to this email. Thank you for choosing InternArea! 🚀</p>
    </div>
    <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
      <p style="color:#94a3b8;font-size:11px;margin:0">© 2026 InternArea. All rights reserved.</p>
    </div>
  </div>`;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

// @desc    Create Razorpay order (enforces payment time window)
// @route   POST /api/payments/create-order
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  // 1. Enforce IST time window
  if (!isPaymentWindowOpen() && process.env.BYPASS_PAYMENT_WINDOW !== "true") {
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffsetMs);
    const hours = istNow.getUTCHours();
    const minutes = istNow.getUTCMinutes();
    const totalMinutes = hours * 60 + minutes;

    let waitMsg;
    if (totalMinutes < 600) {
      const minsLeft = 600 - totalMinutes;
      const h = Math.floor(minsLeft / 60);
      const m = minsLeft % 60;
      waitMsg = h > 0 ? `${h}h ${m}m` : `${m} minutes`;
    } else {
      // After 11 AM — next day
      const minsLeft = 1440 - totalMinutes + 600;
      const h = Math.floor(minsLeft / 60);
      const m = minsLeft % 60;
      waitMsg = `${h}h ${m}m`;
    }

    res.status(403);
    throw new Error(
      `Payments are only available between 10:00 AM and 11:00 AM IST. Payment window opens in ${waitMsg}.`
    );
  }

  const { plan } = req.body;

  if (!["bronze", "silver", "gold"].includes(plan)) {
    res.status(400);
    throw new Error("Invalid plan selected. Choose bronze, silver, or gold.");
  }

  const razorpay = getRazorpay();
  if (!razorpay) {
    res.status(503);
    throw new Error(
      "Payment gateway not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend .env file."
    );
  }

  const amountInPaise = PLAN_PRICES[plan] * 100;

  // Create Razorpay order
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `rcpt_${req.user._id.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
    notes: {
      userId: req.user._id.toString(),
      plan,
    },
  });

  // Log payment in DB
  await Payment.create({
    user: req.user._id,
    razorpayOrderId: order.id,
    amount: amountInPaise,
    currency: "INR",
    plan,
    status: "created",
  });

  res.json({
    orderId: order.id,
    amount: amountInPaise,
    currency: "INR",
    plan,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// @desc    Verify payment signature & activate subscription
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
    res.status(400);
    throw new Error("Missing payment verification fields.");
  }

  // Verify HMAC-SHA256 signature
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    res.status(400);
    throw new Error("Payment verification failed. Invalid signature.");
  }

  // Activate subscription
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const invoiceNumber = await generateInvoiceNumber();

  const subscription = await Subscription.create({
    user: req.user._id,
    plan,
    price: PLAN_PRICES[plan],
    status: "active",
    startDate,
    endDate,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    invoiceNumber,
  });

  // Update User's plan fields
  const user = await User.findById(req.user._id);
  user.subscriptionPlan = plan;
  user.subscriptionStatus = "active";
  user.planExpiresAt = endDate;
  // Reset monthly usage counter on upgrade
  user.monthlyApplicationsUsed = 0;
  user.applicationsResetMonth = startDate.getMonth() + 1;
  await user.save({ validateBeforeSave: false });

  // Update Payment ledger
  await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    { razorpayPaymentId: razorpay_payment_id, status: "paid", paidAt: new Date(), subscription: subscription._id }
  );

  // Send invoice email
  try {
    await sendEmail({
      to: user.email,
      subject: `✅ InternArea — Payment Confirmed | ${invoiceNumber}`,
      html: buildInvoiceHtml({
        user,
        plan,
        price: PLAN_PRICES[plan],
        invoiceNumber,
        startDate,
        endDate,
        paymentId: razorpay_payment_id,
      }),
      text: `Hi ${user.name}, your ${PLAN_NAMES[plan]} subscription (Invoice: ${invoiceNumber}) has been activated. Amount: ₹${PLAN_PRICES[plan]}. Valid until: ${endDate.toDateString()}.`,
    });
  } catch (emailErr) {
    console.error("Invoice email failed:", emailErr.message);
    // Non-fatal — payment is already verified
  }

  res.json({
    success: true,
    message: "Payment verified and subscription activated!",
    invoiceNumber,
    plan,
    planExpiresAt: endDate,
    subscription: subscription._id,
  });
});

// ─── Premium Resume Feature Endpoints ─────────────────────────────────────────

// @desc    Send OTP to candidate's email for resume payment verification
// @route   POST /api/payments/resume-otp
// @access  Private
const sendResumeOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  // Ensure user is on a premium plan
  if (!user.subscriptionPlan || user.subscriptionPlan === "free") {
    res.status(403);
    throw new Error("Resume creation is a premium feature. Please upgrade your subscription plan first.");
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.resumeOTP = otp;
  user.resumeOTPExpires = otpExpires;
  user.isResumeOTPVerified = false;
  await user.save({ validateBeforeSave: false });

  // Send Email
  const subject = "🔐 InternArea — Verification Code for Resume Generation";
  const text = `Hi ${user.name},\n\nYour verification code to proceed with premium resume generation (₹50 fee) is: ${otp}\n\nThis code is valid for 10 minutes. Do not share it with anyone.\n\n— The InternArea Team`;
  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#0052CC,#008BDC);padding:32px 32px 24px;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px">InternArea</h1>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">Premium Resume Creation Verification</p>
      </div>
      <div style="padding:32px">
        <p style="color:#334155;font-size:15px;margin:0 0 8px">Hi <strong>${user.name}</strong>,</p>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 28px;">You are initiating the premium Resume Creation process. To ensure secure verification, please use the following One-Time Password (OTP) to proceed to the payment of ₹50. This code is valid for 10 minutes only.</p>
        <div style="background:#1e293b;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
          <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;font-weight:700">Your Resume Verification Code</p>
          <span style="color:#38bdf8;font-size:40px;font-weight:900;letter-spacing:10px;font-family:monospace">${otp}</span>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">If you did not request this, you can safely ignore this email.</p>
      </div>
      <div style="background:#f1f5f9;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0">
        <p style="color:#94a3b8;font-size:11px;margin:0">© 2026 InternArea. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({ to: user.email, subject, html, text });
  } catch (emailErr) {
    user.resumeOTP = null;
    user.resumeOTPExpires = null;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error("Failed to send verification email. Please try again later.");
  }

  res.json({ message: "Verification OTP sent to your registered email." });
});

// @desc    Verify the resume OTP entered by user
// @route   POST /api/payments/verify-resume-otp
// @access  Private
const verifyResumeOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    res.status(400);
    throw new Error("Please enter the verification code.");
  }

  const user = await User.findById(req.user._id);

  if (!user || !user.resumeOTP || !user.resumeOTPExpires) {
    res.status(400);
    throw new Error("No active verification request found. Please request a new code.");
  }

  // Check expiry
  if (new Date() > new Date(user.resumeOTPExpires)) {
    user.resumeOTP = null;
    user.resumeOTPExpires = null;
    await user.save({ validateBeforeSave: false });
    res.status(400);
    throw new Error("Verification code has expired. Please request a new one.");
  }

  // Check correctness
  if (user.resumeOTP !== otp.trim()) {
    res.status(400);
    throw new Error("Invalid verification code. Please check and try again.");
  }

  // Validated!
  user.resumeOTP = null;
  user.resumeOTPExpires = null;
  user.isResumeOTPVerified = true;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: "Email successfully verified. Redirecting to payment checkout..." });
});

// @desc    Create Razorpay order for ₹50 resume generation fee
// @route   POST /api/payments/create-resume-order
// @access  Private
const createResumeOrder = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  // Ensure user is on a premium plan
  if (!user.subscriptionPlan || user.subscriptionPlan === "free") {
    res.status(403);
    throw new Error("Resume creation is a premium feature. Please upgrade your subscription plan first.");
  }

  // Ensure OTP was verified first
  if (!user.isResumeOTPVerified) {
    res.status(400);
    throw new Error("OTP verification is required before initiating payment.");
  }

  const { resumeData } = req.body;
  if (!resumeData) {
    res.status(400);
    throw new Error("No resume details provided.");
  }

  const razorpay = getRazorpay();
  if (!razorpay) {
    res.status(503);
    throw new Error(
      "Payment gateway not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend .env file."
    );
  }

  const amountInPaise = 50 * 100; // ₹50

  // Create Razorpay order
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `res_${user._id.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
    notes: {
      userId: user._id.toString(),
      type: "resume_generation",
    },
  });

  // Store the resume data in user.pendingResumeData temporarily
  user.pendingResumeData = resumeData;
  await user.save({ validateBeforeSave: false });

  // Log in Payments ledger
  await ResumePayment.create({
    user: user._id,
    razorpayOrderId: order.id,
    amount: amountInPaise,
    currency: "INR",
    status: "created",
  });

  res.json({
    orderId: order.id,
    amount: amountInPaise,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// @desc    Verify signature and generate PDF resume on successful payment
// @route   POST /api/payments/verify-resume-payment
// @access  Private
const verifyResumePayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error("Missing verification parameters.");
  }

  // Verify HMAC-SHA256 signature
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    res.status(400);
    throw new Error("Payment signature verification failed.");
  }

  const user = await User.findById(req.user._id);

  if (!user || !user.pendingResumeData) {
    res.status(400);
    throw new Error("Resume details not found. Generation failed.");
  }

  // Update Payment ledger
  await ResumePayment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    { razorpayPaymentId: razorpay_payment_id, status: "paid", paidAt: new Date() }
  );

  // Transfer pending resume details to active profile
  user.profileResumeData = user.pendingResumeData;
  user.pendingResumeData = null;
  user.isResumeOTPVerified = false; // reset for future generations

  // Automatically generate professional PDF resume
  try {
    const resumeUrl = await generateResumePDF(user._id, user.profileResumeData);
    user.resumeUrl = resumeUrl;
  } catch (pdfErr) {
    console.error("PDF generation failed:", pdfErr.message);
    // Non-fatal for payment, but user will need to regenerate
  }

  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: "Payment confirmed. Professional resume generated and linked to your profile!",
    resumeUrl: user.resumeUrl,
    profileResumeData: user.profileResumeData,
  });
});

module.exports = {
  createOrder,
  verifyPayment,
  sendResumeOTP,
  verifyResumeOTP,
  createResumeOrder,
  verifyResumePayment,
};
