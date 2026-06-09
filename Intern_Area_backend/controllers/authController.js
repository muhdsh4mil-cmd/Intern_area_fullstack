const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Notification = require("../models/Notification");
const sendEmail = require("../config/email");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Generate Unique ID
const generateUniqueId = async (name) => {
  let isUnique = false;
  let uniqueId = "";
  
  let baseName = name.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  if (!baseName) baseName = "user";

  while (!isUnique) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomCombination = "";
    for (let i = 0; i < 8; i++) {
      randomCombination += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    uniqueId = `${baseName}_${randomCombination}`;
    
    const existingUser = await User.findOne({ uniqueId });
    if (!existingUser) {
      isUnique = true;
    }
  }
  return uniqueId;
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, company } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide name, email and password");
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User with this email already exists");
  }

  // Generate unique ID
  const uniqueId = await generateUniqueId(name);

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || "candidate",
    company: company || "",
    isOnline: true,
    lastLogin: new Date(),
    loginCount: 1,
    uniqueId,
  });

  if (user) {
    // Notify existing users about the new member (up to 100 existing users)
    const existingUsers = await User.find(
      { _id: { $ne: user._id }, role: { $ne: "admin" } },
      "_id"
    ).limit(100);

    if (existingUsers.length > 0 && user.role !== "admin") {
      const notifications = existingUsers.map((u) => ({
        recipient: u._id,
        sender: user._id,
        type: "new_suggestion",
        message: `${user.name} just joined InternArea — People You May Know`,
        meta: { newUserId: user._id.toString() },
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      avatar: user.avatar,
      uniqueId: user.uniqueId,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// Helper to check if current time is within 10:00 AM - 1:00 PM IST
const isMobileAllowedTime = () => {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);
  const hour = istDate.getHours();
  const minutes = istDate.getMinutes();
  const totalMinutes = hour * 60 + minutes;
  return totalMinutes >= 600 && totalMinutes <= 780; // 10:00 AM to 1:00 PM IST
};

// Helper to record login history
const recordLogin = async (user, status, req, browserInfo) => {
  if (!user) return;
  const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip || "";
  const ip = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress.split(",")[0].trim();
  
  const info = browserInfo || {};
  user.loginHistory.push({
    timestamp: new Date(),
    ipAddress: ip,
    browser: info.browser || "Unknown",
    os: info.os || "Unknown",
    device: info.device || "Desktop",
    status: status,
  });
  
  if (user.loginHistory.length > 50) {
    user.loginHistory = user.loginHistory.slice(-50);
  }
  
  await user.save({ validateBeforeSave: false });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password, browserInfo } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  // Find user by email or uniqueId (since admin login uses username)
  const user = await User.findOne({
    $or: [{ email: email }, { uniqueId: email }, { name: email }]
  });

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    await recordLogin(user, "Failed", req, browserInfo);
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Credentials are correct. Check environment-based access controls.

  // 1. Mobile restriction: 10:00 AM - 1:00 PM IST
  const dev = browserInfo?.device || "Desktop";
  const isMobile = dev === "Mobile" || dev === "Tablet";
  if (isMobile && !isMobileAllowedTime() && user.role !== "admin") {
    await recordLogin(user, "Failed", req, browserInfo);
    res.status(403);
    throw new Error("Access Denied: Mobile logins are only permitted between 10:00 AM and 1:00 PM.");
  }

  // Lazily generate uniqueId for older accounts that don't have one
  if (!user.uniqueId) {
    user.uniqueId = await generateUniqueId(user.name);
  }

  // 2. Google Chrome Browser check
  const browserName = browserInfo?.browser || "";
  const isChrome = browserName.toLowerCase().includes("chrome");
  const chromeSessionVerified = browserInfo?.chromeSessionVerified === true;
  if (isChrome && user.role !== "admin" && !chromeSessionVerified) {
    // Generate 6-digit OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.loginOTP = otp;
    user.loginOTPExpires = otpExpires;
    await user.save({ validateBeforeSave: false });

    // Send OTP Email
    const subject = "Your InternArea Login Verification Code";
    const text = `Hi ${user.name},\n\nYou are attempting to log in from Google Chrome.\n\nYour verification code is: ${otp}\n\nThis code is valid for 10 minutes only.\n\nIf you did not request this, please change your password immediately.\n\n— The InternArea Team`;
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #008BDC, #0052CC); padding: 32px 32px 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">InternArea</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">Chrome Authentication Required</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #334155; font-size: 15px; margin: 0 0 8px;">Hi <strong>${user.name}</strong>,</p>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 28px;">A login attempt was made using Google Chrome. Please use the verification code below to complete your login. This code expires in <strong>10 minutes</strong>.</p>
          <div style="background: #1e293b; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
            <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px; font-weight: 700;">Your Verification Code</p>
            <span style="color: #38bdf8; font-size: 40px; font-weight: 900; letter-spacing: 10px; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">If you didn't request this, please secure your account immediately.</p>
        </div>
        <div style="background: #f1f5f9; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">© 2026 InternArea. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({ to: user.email, subject, html, text });
    } catch (err) {
      user.loginOTP = null;
      user.loginOTPExpires = null;
      await user.save({ validateBeforeSave: false });
      res.status(500);
      throw new Error("Failed to send Chrome OTP verification email.");
    }

    return res.json({
      requiresOTP: true,
      userId: user._id,
      email: user.email,
    });
  }

  // Not Chrome, not blocked mobile
  await recordLogin(user, "Successful", req, browserInfo);

  user.isOnline = true;
  user.lastLogin = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save({ validateBeforeSave: false });

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company,
    avatar: user.avatar,
    uniqueId: user.uniqueId,
    token: generateToken(user._id),
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  
  // Lazily generate uniqueId if missing
  if (user && !user.uniqueId) {
    user.uniqueId = await generateUniqueId(user.name);
    await user.save();
  }
  
  res.json(user);
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.name = req.body.name || user.name;
  user.bio = req.body.bio || user.bio;
  user.location = req.body.location || user.location;
  user.phone = req.body.phone || user.phone;
  user.skills = req.body.skills || user.skills;
  user.avatar = req.body.avatar || user.avatar;
  user.company = req.body.company || user.company;

  if (req.body.password) {
    user.password = req.body.password;
  }

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    company: updatedUser.company,
    avatar: updatedUser.avatar,
    bio: updatedUser.bio,
    location: updatedUser.location,
    phone: updatedUser.phone,
    skills: updatedUser.skills,
    uniqueId: updatedUser.uniqueId,
    token: generateToken(updatedUser._id),
  });
});

// @desc    Logout user / mark offline
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.isOnline = false;
    await user.save();
  }
  res.json({ message: "Logged out successfully" });
});

// @desc    Google Login / Registration
// @route   POST /api/auth/google
// @access  Public
const googleLogin = asyncHandler(async (req, res) => {
  const { email, name, avatar, browserInfo } = req.body;

  if (!email || !name) {
    res.status(400);
    throw new Error("Please provide email and name from Google authentication");
  }

  // Find user by email
  let user = await User.findOne({ email });

  if (user) {
    // Check mobile restriction: 10:00 AM - 1:00 PM IST
    const dev = browserInfo?.device || "Desktop";
    const isMobile = dev === "Mobile" || dev === "Tablet";
    if (isMobile && !isMobileAllowedTime()) {
      await recordLogin(user, "Failed", req, browserInfo);
      res.status(403);
      throw new Error("Access Denied: Mobile logins are only permitted between 10:00 AM and 1:00 PM.");
    }

    // Login existing user
    user.isOnline = true;
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    if (avatar && !user.avatar) {
        user.avatar = avatar;
    }
    await recordLogin(user, "Successful", req, browserInfo);
    await user.save({ validateBeforeSave: false });
  } else {
    // Register new user as candidate via Google
    // Check mobile restriction: 10:00 AM - 1:00 PM IST
    const dev = browserInfo?.device || "Desktop";
    const isMobile = dev === "Mobile" || dev === "Tablet";
    if (isMobile && !isMobileAllowedTime()) {
      res.status(403);
      throw new Error("Access Denied: Mobile logins are only permitted between 10:00 AM and 1:00 PM.");
    }

    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const uniqueId = await generateUniqueId(name);
    
    user = await User.create({
      name,
      email,
      password: randomPassword,
      role: "candidate",
      company: "",
      avatar: avatar || "",
      isOnline: true,
      lastLogin: new Date(),
      loginCount: 1,
      uniqueId,
    });

    // Record login
    await recordLogin(user, "Successful", req, browserInfo);

    // Notify existing users about the new Google-authenticated member
    const existingUsers = await User.find(
      { _id: { $ne: user._id }, role: { $ne: "admin" } },
      "_id"
    ).limit(100);

    if (existingUsers.length > 0 && user.role !== "admin") {
      const notifications = existingUsers.map((u) => ({
        recipient: u._id,
        sender: user._id,
        type: "new_suggestion",
        message: `${user.name} just joined InternArea — People You May Know`,
        meta: { newUserId: user._id.toString() },
      }));
      await Notification.insertMany(notifications);
    }
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company,
    avatar: user.avatar,
    uniqueId: user.uniqueId,
    token: generateToken(user._id),
  });
});

// ─── Helper: Generate 6-digit numeric OTP ─────────────────────────────────────
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── Helper: Generate random alpha-only password (A-Z + a-z) ─────────────────
const generateAlphaPassword = (length = 10) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// @desc    Step 1 — Request password reset: validate account & send OTP email
// @route   POST /api/auth/forgot-password
// @access  Public
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Please provide your registered email address.");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    res.status(404);
    throw new Error("No account found with that email address.");
  }

  // Enforce once-per-day OTP request limit
  if (user.passwordResetDate) {
    const lastReset = new Date(user.passwordResetDate);
    const now = new Date();
    const isSameDay =
      lastReset.getFullYear() === now.getFullYear() &&
      lastReset.getMonth() === now.getMonth() &&
      lastReset.getDate() === now.getDate();
    if (isSameDay) {
      res.status(429);
      throw new Error("You can use this option only once per day.");
    }
  }

  // Generate OTP and set 10-minute expiry
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Store OTP (plain — compared directly; not hashed since it's short-lived)
  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpires = otpExpires;
  await user.save({ validateBeforeSave: false });

  // Send OTP email
  const subject = "Your InternArea Password Reset Code";
  const text = `Hi ${user.name},\n\nYou requested a password reset for your InternArea account.\n\nYour verification code is: ${otp}\n\nThis code is valid for 10 minutes only. Do not share it with anyone.\n\nIf you did not request this, please ignore this email.\n\n— The InternArea Team`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #008BDC, #0052CC); padding: 32px 32px 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">InternArea</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">Password Reset Request</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #334155; font-size: 15px; margin: 0 0 8px;">Hi <strong>${user.name}</strong>,</p>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 28px;">We received a request to reset your password. Use the verification code below to proceed. This code expires in <strong>10 minutes</strong>.</p>
        <div style="background: #1e293b; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
          <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px; font-weight: 700;">Your Verification Code</p>
          <span style="color: #38bdf8; font-size: 40px; font-weight: 900; letter-spacing: 10px; font-family: monospace;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
      </div>
      <div style="background: #f1f5f9; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">© 2026 InternArea. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({ to: user.email, subject, html, text });
  } catch (err) {
    // Roll back OTP if email fails
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpires = null;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error("Failed to send verification email. Please try again later.");
  }

  res.json({
    message: `Verification code sent to ${user.email.replace(/(.)(.*)(@.*)/, (_, a, b, c) => a + b.replace(/./g, "*") + c)}. Valid for 10 minutes.`,
    email: user.email,
  });
});

// @desc    Step 2 — Verify OTP & reset password
// @route   POST /api/auth/verify-reset-otp
// @access  Public
const verifyOTPAndReset = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error("Email and verification code are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user || !user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
    res.status(400);
    throw new Error("No active reset request found. Please request a new code.");
  }

  // Check expiry (10-minute window)
  if (new Date() > new Date(user.resetPasswordOTPExpires)) {
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpires = null;
    await user.save({ validateBeforeSave: false });
    res.status(400);
    throw new Error("Verification code has expired. Please request a new one.");
  }

  // Verify OTP
  if (user.resetPasswordOTP !== otp.trim()) {
    res.status(400);
    throw new Error("Invalid verification code. Please check and try again.");
  }

  // OTP valid — generate new alpha password and apply it
  const newPassword = generateAlphaPassword(10);
  user.password = newPassword;
  user.passwordResetDate = new Date();
  user.resetPasswordOTP = null;
  user.resetPasswordOTPExpires = null;
  await user.save();

  // Send confirmation email with the new password
  const subject = "Your InternArea Password Has Been Reset";
  const text = `Hi ${user.name},\n\nYour password has been successfully reset.\n\nYour new temporary password: ${newPassword}\n\nPlease sign in and change this password from your Profile Settings immediately.\n\n— The InternArea Team`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #008BDC, #0052CC); padding: 32px 32px 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">InternArea</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">Password Reset Successful</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #334155; font-size: 15px; margin: 0 0 8px;">Hi <strong>${user.name}</strong>,</p>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">Your password has been successfully reset. Here is your new temporary password:</p>
        <div style="background: #1e293b; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px; font-weight: 700;">New Temporary Password</p>
          <span style="color: #4ade80; font-size: 28px; font-weight: 900; letter-spacing: 6px; font-family: monospace;">${newPassword}</span>
        </div>
        <p style="color: #f59e0b; font-size: 12px; background: #fef3c7; padding: 12px 16px; border-radius: 8px; margin: 0;">⚠️ For your security, please sign in and immediately change this password from <strong>Profile Settings</strong>.</p>
      </div>
      <div style="background: #f1f5f9; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">© 2026 InternArea. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({ to: user.email, subject, html, text });
  } catch (e) {
    // Non-critical: password already reset, just log the email failure
    console.error("Confirmation email failed:", e.message);
  }

  res.json({
    message: "Password reset successful! Your new password has been emailed to you.",
    newPassword, // returned so frontend can display it directly
    deliveredTo: user.email,
  });
});

// @desc    Verify login OTP (Chrome browser flow)
// @route   POST /api/auth/verify-login-otp
// @access  Public
const verifyLoginOTP = asyncHandler(async (req, res) => {
  const { userId, otp, browserInfo } = req.body;

  if (!userId || !otp) {
    res.status(400);
    throw new Error("User ID and OTP are required");
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!user.loginOTP || !user.loginOTPExpires) {
    await recordLogin(user, "Failed", req, browserInfo);
    res.status(400);
    throw new Error("No active verification code found. Please request a new code.");
  }

  // Check expiry
  if (new Date() > new Date(user.loginOTPExpires)) {
    user.loginOTP = null;
    user.loginOTPExpires = null;
    await user.save({ validateBeforeSave: false });
    await recordLogin(user, "Failed", req, browserInfo);
    res.status(400);
    throw new Error("Verification code has expired. Please try again.");
  }

  // Verify OTP
  if (user.loginOTP !== otp.trim()) {
    await recordLogin(user, "Failed", req, browserInfo);
    res.status(400);
    throw new Error("Invalid verification code. Please try again.");
  }

  // Clear OTP fields
  user.loginOTP = null;
  user.loginOTPExpires = null;

  // Record successful login
  await recordLogin(user, "Successful", req, browserInfo);

  user.isOnline = true;
  user.lastLogin = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save({ validateBeforeSave: false });

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company,
    avatar: user.avatar,
    uniqueId: user.uniqueId,
    token: generateToken(user._id),
  });
});

// @desc    Get logged in user's login history
// @route   GET /api/auth/login-history
// @access  Private
const getLoginHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("loginHistory");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  // Return descending order of login attempts
  const sortedHistory = [...user.loginHistory].reverse();
  res.json(sortedHistory);
});

// @desc    Get all users' login history (Admin only)
// @route   GET /api/auth/all-login-history
// @access  Private/Admin
const getAllLoginHistory = asyncHandler(async (req, res) => {
  const users = await User.find({ "loginHistory.0": { $exists: true } }).select("name email uniqueId loginHistory");
  
  let allHistories = [];
  users.forEach((u) => {
    u.loginHistory.forEach((hist) => {
      allHistories.push({
        _id: hist._id,
        user: {
          _id: u._id,
          name: u.name,
          email: u.email,
          uniqueId: u.uniqueId
        },
        timestamp: hist.timestamp,
        ipAddress: hist.ipAddress,
        browser: hist.browser,
        os: hist.os,
        device: hist.device,
        status: hist.status
      });
    });
  });

  allHistories.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json(allHistories);
});

module.exports = {
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
  getAllLoginHistory
};
