const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

const {
  getFriendsData,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getSuggestedFriends,
  searchUsers,
} = require("../controllers/friendController");

// All friend routes are protected
router.use(protect);

router.get("/", getFriendsData);
router.get("/suggested", getSuggestedFriends);
router.get("/search", searchUsers);
router.post("/request/:id", sendFriendRequest);
router.post("/accept/:id", acceptFriendRequest);
router.post("/reject/:id", rejectFriendRequest);

module.exports = router;
