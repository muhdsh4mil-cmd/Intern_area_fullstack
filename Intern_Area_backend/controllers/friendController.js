const User = require("../models/User");
const Notification = require("../models/Notification");
const asyncHandler = require("express-async-handler");

// @desc    Get user's friends, friend requests, and sent requests
// @route   GET /api/friends
// @access  Private
const getFriendsData = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("friends", "name email role avatar skills company uniqueId")
    .populate("friendRequests", "name email role avatar skills company uniqueId")
    .populate("sentRequests", "name email role avatar skills company uniqueId");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  console.log(`[getFriendsData] req.user._id: ${req.user._id} (${req.user.name}), friends count: ${user.friends.length}`);
  console.log(`[getFriendsData] friends list:`, user.friends.map(f => ({ id: f._id, name: f.name })));

  res.json({
    friends: user.friends,
    friendRequests: user.friendRequests,
    sentRequests: user.sentRequests,
  });
});

// @desc    Send a friend request
// @route   POST /api/friends/request/:id
// @access  Private
const sendFriendRequest = asyncHandler(async (req, res) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user._id;

  if (targetUserId === currentUserId.toString()) {
    res.status(400);
    throw new Error("You cannot send a friend request to yourself");
  }

  const targetUser = await User.findById(targetUserId);
  const currentUser = await User.findById(currentUserId);

  if (!targetUser || !currentUser) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if already friends or request already sent/received
  if (currentUser.friends.includes(targetUserId)) {
    res.status(400);
    throw new Error("You are already friends");
  }

  if (currentUser.sentRequests.includes(targetUserId)) {
    res.status(400);
    throw new Error("Friend request already sent");
  }

  if (currentUser.friendRequests.includes(targetUserId)) {
    res.status(400);
    throw new Error("User already sent you a request. Accept it instead.");
  }

  // Add to target's friendRequests and current's sentRequests
  targetUser.friendRequests.push(currentUserId);
  currentUser.sentRequests.push(targetUserId);

  await targetUser.save();
  await currentUser.save();

  // Create notification for the target user
  await Notification.create({
    recipient: targetUserId,
    sender: currentUserId,
    type: "friend_request",
    message: `${currentUser.name} sent you a friend request`,
    meta: { senderId: currentUserId.toString() },
  });

  res.status(200).json({ message: "Friend request sent successfully" });
});

// @desc    Accept a friend request
// @route   POST /api/friends/accept/:id
// @access  Private
const acceptFriendRequest = asyncHandler(async (req, res) => {
  const requesterId = req.params.id;
  const currentUserId = req.user._id;

  const currentUser = await User.findById(currentUserId);
  const requesterUser = await User.findById(requesterId);

  if (!currentUser || !requesterUser) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if request exists
  if (!currentUser.friendRequests.includes(requesterId)) {
    res.status(400);
    throw new Error("No pending friend request from this user");
  }

  // Remove from requests and add to friends
  currentUser.friendRequests = currentUser.friendRequests.filter(
    (id) => id.toString() !== requesterId
  );
  requesterUser.sentRequests = requesterUser.sentRequests.filter(
    (id) => id.toString() !== currentUserId.toString()
  );

  currentUser.friends.push(requesterId);
  requesterUser.friends.push(currentUserId);

  await currentUser.save();
  await requesterUser.save();

  // Create notification for the original requester that their request was accepted
  await Notification.create({
    recipient: requesterId,
    sender: currentUserId,
    type: "friend_accepted",
    message: `${currentUser.name} accepted your friend request`,
    meta: { acceptedBy: currentUserId.toString() },
  });

  res.status(200).json({ message: "Friend request accepted" });
});

// @desc    Reject a friend request
// @route   POST /api/friends/reject/:id
// @access  Private
const rejectFriendRequest = asyncHandler(async (req, res) => {
  const requesterId = req.params.id;
  const currentUserId = req.user._id;

  const currentUser = await User.findById(currentUserId);
  const requesterUser = await User.findById(requesterId);

  if (!currentUser || !requesterUser) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if request exists
  if (!currentUser.friendRequests.includes(requesterId)) {
    res.status(400);
    throw new Error("No pending friend request from this user");
  }

  // Remove from requests without adding to friends
  currentUser.friendRequests = currentUser.friendRequests.filter(
    (id) => id.toString() !== requesterId
  );
  requesterUser.sentRequests = requesterUser.sentRequests.filter(
    (id) => id.toString() !== currentUserId.toString()
  );

  await currentUser.save();
  await requesterUser.save();

  res.status(200).json({ message: "Friend request rejected" });
});

// @desc    Get suggested friends (People You May Know)
// @route   GET /api/friends/suggested
// @access  Private
const getSuggestedFriends = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id);

  if (!currentUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const excludedIds = [
    req.user._id,
    ...currentUser.friends,
    ...currentUser.friendRequests,
    ...currentUser.sentRequests,
  ];

  // Define "new user" threshold: registered within the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Fetch suggested friends prioritizing new users
  const suggestedUsers = await User.aggregate([
    { $match: { _id: { $nin: excludedIds }, role: { $ne: "admin" } } },
    {
      $project: {
        name: 1,
        email: 1,
        role: 1,
        avatar: 1,
        skills: 1,
        company: 1,
        uniqueId: 1,
        createdAt: 1,
        loginCount: 1,
        // Mark as new if registered in the last 7 days OR first login
        isNewUser: {
          $or: [
            { $lte: [sevenDaysAgo, "$createdAt"] },
            { $eq: ["$loginCount", 1] },
          ],
        },
      },
    },
    // Sort: new users first (isNewUser: true), then others by registration date
    { $sort: { isNewUser: -1, createdAt: -1 } },
    { $limit: 15 },
  ]);

  res.json(suggestedUsers);
});

// @desc    Search for users to add as friends
// @route   GET /api/friends/search
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.json([]);
  }

  // Search by name (case insensitive) or uniqueId, exclude admins
  const users = await User.find({
    _id: { $ne: req.user._id },
    role: { $ne: "admin" },
    $or: [
      { name: { $regex: query, $options: "i" } },
      { uniqueId: { $regex: query, $options: "i" } },
    ],
  })
    .select("name email role avatar skills company uniqueId")
    .limit(20);

  console.log(`[searchUsers] query: "${query}", req.user._id: ${req.user._id}, found: ${users.length}`);

  res.json(users);
});

module.exports = {
  getFriendsData,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getSuggestedFriends,
  searchUsers,
};
