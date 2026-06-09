const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["candidate", "employer", "admin"],
      default: "candidate",
    },
    company: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    skills: [String],
    location: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    resumeUrl: {
      type: String,
      default: "",
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    sentRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    uniqueId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // ─── Subscription Fields ────────────────────────────────────────────────────
    subscriptionPlan: {
      type: String,
      enum: ["free", "bronze", "silver", "gold"],
      default: "free",
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
    monthlyApplicationsUsed: {
      type: Number,
      default: 0,
    },
    applicationsResetMonth: {
      type: Number, // 1–12
      default: () => new Date().getMonth() + 1,
    },
    razorpayCustomerId: {
      type: String,
      default: null,
    },
    // ─── Premium Resume Fields ───────────────────────────────────────────────────
    profileResumeData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    pendingResumeData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    resumeOTP: {
      type: String,
      default: null,
    },
    resumeOTPExpires: {
      type: Date,
      default: null,
    },
    isResumeOTPVerified: {
      type: Boolean,
      default: false,
    },
    // ─── Language Preference Fields ──────────────────────────────────────────────
    preferredLanguage: {
      type: String,
      enum: ["en", "es", "hi", "pt", "zh", "fr"],
      default: "en",
    },
    langOTP: {
      type: String,
      default: null,
    },
    langOTPExpires: {
      type: Date,
      default: null,
    },
    // ─── Password Reset Fields ───────────────────────────────────────────────────
    passwordResetDate: {
      type: Date,
      default: null,
    },
    resetPasswordOTP: {
      type: String,
      default: null,
    },
    resetPasswordOTPExpires: {
      type: Date,
      default: null,
    },
    // ─── Login Tracking Fields ───────────────────────────────────────────────────
    loginHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        ipAddress: { type: String, default: "" },
        browser: { type: String, default: "" },
        os: { type: String, default: "" },
        device: { type: String, enum: ["Desktop", "Laptop", "Tablet", "Mobile"], default: "Desktop" },
        status: { type: String, enum: ["Successful", "Failed"], default: "Successful" },
      }
    ],
    loginOTP: {
      type: String,
      default: null,
    },
    loginOTPExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
