const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
  deleteConversation,
  deleteMessage,
} = require("../controllers/messageController");

router.use(protect);

router.get("/unread-count", getUnreadCount);
router.get("/conversations", getConversations);
router.post("/conversation/:userId", getOrCreateConversation);
router.get("/conversation/:conversationId/messages", getMessages);
router.post("/conversation/:conversationId/send", sendMessage);
router.delete("/conversation/:conversationId", deleteConversation);
router.delete("/:messageId", deleteMessage);

module.exports = router;

