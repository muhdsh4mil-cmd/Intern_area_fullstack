const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
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
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  // Find user
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    user.isOnline = true;
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
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
  const { email, name, avatar } = req.body;

  if (!email || !name) {
    res.status(400);
    throw new Error("Please provide email and name from Google authentication");
  }

  // Find user by email
  let user = await User.findOne({ email });

  if (user) {
    // Login existing user
    user.isOnline = true;
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    if (avatar && !user.avatar) {
        user.avatar = avatar;
    }
    await user.save();
  } else {
    // Register new user as candidate via Google
    // Generate a random password since they use Google to log in
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
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
    });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company,
    avatar: user.avatar,
    token: generateToken(user._id),
  });
});

module.exports = { registerUser, loginUser, getMe, updateProfile, logoutUser, googleLogin };
