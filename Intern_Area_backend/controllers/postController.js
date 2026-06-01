const Post = require("../models/Post");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");

// @desc    Get all community posts
// @route   GET /api/posts
// @access  Private
const getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .populate("user", "name avatar uniqueId role")
    .populate("comments.user", "name avatar uniqueId role")
    .sort({ createdAt: -1 });

  res.json(posts);
});

// @desc    Get user's daily post quota status
// @route   GET /api/posts/quota
// @access  Private
const getPostQuota = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("friends");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const friendCount = user.friends ? user.friends.length : 0;

  // Determine starting point of today (00:00:00 server local time)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Count user's posts created today
  const todayPostsCount = await Post.countDocuments({
    user: req.user._id,
    createdAt: { $gte: startOfDay },
  });

  // Calculate quota limit
  let quotaLimit = 0;
  if (friendCount === 0) {
    quotaLimit = 0;
  } else if (friendCount <= 10) {
    quotaLimit = friendCount;
  } else {
    quotaLimit = Infinity; // Unlimited
  }

  const remaining = quotaLimit === Infinity ? "Unlimited" : Math.max(0, quotaLimit - todayPostsCount);

  const now = new Date();
  const nextDay = new Date();
  nextDay.setDate(now.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);
  const resetTimeMs = nextDay.getTime() - now.getTime();

  res.json({
    friendCount,
    todayPostsCount,
    quotaLimit: quotaLimit === Infinity ? "Unlimited" : quotaLimit,
    remaining,
    resetTimeAt: nextDay.toISOString(),
    resetTimeMs,
  });
});

// @desc    Create a community post
// @route   POST /api/posts
// @access  Private
const createPost = asyncHandler(async (req, res) => {
  const { content, mediaUrl, mediaType } = req.body;
  if (!content || content.trim() === "") {
    res.status(400);
    throw new Error("Post content cannot be empty");
  }

  const user = await User.findById(req.user._id).select("friends");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const friendCount = user.friends ? user.friends.length : 0;

  // Enforce quota restrictions
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayPostsCount = await Post.countDocuments({
    user: req.user._id,
    createdAt: { $gte: startOfDay },
  });

  let quotaLimit = 0;
  if (friendCount === 0) {
    quotaLimit = 0;
  } else if (friendCount <= 10) {
    quotaLimit = friendCount;
  } else {
    quotaLimit = Infinity;
  }

  if (quotaLimit === 0) {
    res.status(400);
    throw new Error("Post Creation Locked - Add Friends to Unlock Posting");
  }

  if (quotaLimit !== Infinity && todayPostsCount >= quotaLimit) {
    res.status(400);
    throw new Error(`Daily post limit reached (${todayPostsCount}/${quotaLimit}). Add more friends to increase your limit.`);
  }

  const newPost = await Post.create({
    user: req.user._id,
    content: content.trim(),
    mediaUrl: mediaUrl || "",
    mediaType: mediaType || "",
  });

  const populatedPost = await Post.findById(newPost._id)
    .populate("user", "name avatar uniqueId role")
    .populate("comments.user", "name avatar uniqueId role");

  res.status(201).json(populatedPost);
});

// @desc    Toggle like on a post
// @route   POST /api/posts/:id/like
// @access  Private
const toggleLikePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const alreadyLiked = post.likes.includes(req.user._id);

  if (alreadyLiked) {
    post.likes = post.likes.filter((userId) => userId.toString() !== req.user._id.toString());
  } else {
    post.likes.push(req.user._id);
  }

  await post.save();

  const updatedPost = await Post.findById(post._id)
    .populate("user", "name avatar uniqueId role")
    .populate("comments.user", "name avatar uniqueId role");

  res.json(updatedPost);
});

// @desc    Comment on a post
// @route   POST /api/posts/:id/comment
// @access  Private
const commentPost = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === "") {
    res.status(400);
    throw new Error("Comment content cannot be empty");
  }

  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  post.comments.push({
    user: req.user._id,
    content: content.trim(),
    createdAt: new Date(),
  });

  await post.save();

  const updatedPost = await Post.findById(post._id)
    .populate("user", "name avatar uniqueId role")
    .populate("comments.user", "name avatar uniqueId role");

  res.json(updatedPost);
});

// @desc    Share a post (increment sharesCount)
// @route   POST /api/posts/:id/share
// @access  Private
const sharePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  post.sharesCount = (post.sharesCount || 0) + 1;
  await post.save();

  res.json({ message: "Post shared successfully", sharesCount: post.sharesCount });
});

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  // Only the creator or admin can delete the post
  if (post.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to delete this post");
  }

  await Post.findByIdAndDelete(post._id);

  res.json({ message: "Post deleted successfully" });
});

module.exports = {
  getPosts,
  getPostQuota,
  createPost,
  toggleLikePost,
  commentPost,
  sharePost,
  deletePost,
};
