const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getPosts,
  getPostQuota,
  createPost,
  toggleLikePost,
  commentPost,
  sharePost,
  deletePost,
} = require("../controllers/postController");

// All post routes are protected by auth middleware
router.use(protect);

router.get("/", getPosts);
router.get("/quota", getPostQuota);
router.post("/", createPost);
router.post("/:id/like", toggleLikePost);
router.post("/:id/comment", commentPost);
router.post("/:id/share", sharePost);
router.delete("/:id", deletePost);

module.exports = router;
