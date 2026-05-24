const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");

// @desc    Get all users with details
// @route   GET /api/admin/users
// @access  Private (admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });

  const stats = {
    total: users.length,
    candidates: users.filter((u) => u.role === "candidate").length,
    employers: users.filter((u) => u.role === "employer").length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  res.json({ stats, users });
});

// @desc    Get single user detail
// @route   GET /api/admin/users/:id
// @access  Private (admin only)
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json(user);
});

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (user.role === "admin") {
    res.status(400);
    throw new Error("Cannot delete an admin user");
  }
  await user.deleteOne();
  res.json({ message: `User ${user.name} deleted successfully` });
});

// @desc    Get platform-wide dashboard stats
// @route   GET /api/admin/stats
// @access  Private (admin only)
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalJobs, totalApplications] = await Promise.all([
    User.countDocuments(),
    Job.countDocuments(),
    Application.countDocuments(),
  ]);

  const usersByRole = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } },
  ]);

  const appsByStatus = await Application.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const recentUsers = await User.find()
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(5);

  const recentJobs = await Job.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("postedBy", "name email");

  res.json({
    totalUsers,
    totalJobs,
    totalApplications,
    usersByRole,
    appsByStatus,
    recentUsers,
    recentJobs,
  });
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (admin only)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const validRoles = ["candidate", "employer", "admin"];

  if (!validRoles.includes(role)) {
    res.status(400);
    throw new Error("Invalid role");
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json(user);
});

module.exports = {
  getAllUsers,
  getUserById,
  deleteUser,
  getDashboardStats,
  updateUserRole,
};
