const asyncHandler = require("express-async-handler");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const Notification = require("../models/Notification");


// @desc    Get or create a conversation between current user and another user
// @route   POST /api/messages/conversation/:userId
// @access  Private
const getOrCreateConversation = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const otherUserId = req.params.userId;

  if (currentUserId.toString() === otherUserId) {
    res.status(400);
    throw new Error("Cannot message yourself");
  }

  const sortedParticipants = [currentUserId.toString(), otherUserId.toString()].sort();

  // Verify the other user exists first
  const otherUser = await User.findById(otherUserId);
  if (!otherUser) {
    res.status(404);
    throw new Error("User not found");
  }

  // Atomic find or create to prevent race conditions
  let conversation = await Conversation.findOneAndUpdate(
    { participants: sortedParticipants },
    {
      $setOnInsert: {
        participants: sortedParticipants,
        unreadCounts: { [otherUserId.toString()]: 0, [currentUserId.toString()]: 0 },
      },
    },
    { new: true, upsert: true }
  ).populate("participants", "name avatar uniqueId role isOnline lastLogin");

  res.json(conversation);
});

// @desc    Get all conversations for the current user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const conversations = await Conversation.find({
    participants: currentUserId,
  })
    .populate("participants", "name avatar uniqueId role isOnline lastLogin")
    .sort({ lastMessageAt: -1, updatedAt: -1 });

  // Attach unread count for current user to each conversation
  const result = conversations.map((conv) => {
    const unread = conv.unreadCounts?.get(currentUserId.toString()) || 0;
    return { ...conv.toObject(), myUnreadCount: unread };
  });

  const totalUnread = result.reduce((sum, c) => sum + (c.myUnreadCount || 0), 0);

  res.json({ conversations: result, totalUnread });
});

// @desc    Get messages in a conversation (paginated, newest last)
// @route   GET /api/messages/conversation/:conversationId/messages
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const currentUserId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  // Verify user is part of conversation
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: currentUserId,
  });

  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }

  const messages = await Message.find({ conversation: conversationId })
    .populate("sender", "name avatar uniqueId")
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Mark all unread messages from other participant as read
  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: currentUserId }, isRead: false },
    { $set: { isRead: true } }
  );

  // Reset unread count for current user
  await Conversation.findByIdAndUpdate(conversationId, {
    $set: { [`unreadCounts.${currentUserId.toString()}`]: 0 },
  });

  res.json(messages);
});

// @desc    Send a message in a conversation
// @route   POST /api/messages/conversation/:conversationId/send
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { content } = req.body;
  const currentUserId = req.user._id;

  if (!content || !content.trim()) {
    res.status(400);
    throw new Error("Message content cannot be empty");
  }

  // Verify user is part of conversation
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: currentUserId,
  });

  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }

  // Create the message
  let message = await Message.create({
    conversation: conversationId,
    sender: currentUserId,
    content: content.trim(),
  });

  message = await Message.findById(message._id).populate("sender", "name avatar uniqueId");

  // Update conversation lastMessage + increment unread for other participants
  const updates = {
    lastMessage: content.trim().substring(0, 100),
    lastMessageAt: new Date(),
    lastMessageSender: currentUserId,
  };

  // Increment unread count for all other participants
  for (const participantId of conversation.participants) {
    if (participantId.toString() !== currentUserId.toString()) {
      const key = `unreadCounts.${participantId.toString()}`;
      const currentCount = conversation.unreadCounts?.get(participantId.toString()) || 0;
      updates[key] = currentCount + 1;
    }
  }

  await Conversation.findByIdAndUpdate(conversationId, { $set: updates });

  // Create notification for other participants
  for (const participantId of conversation.participants) {
    if (participantId.toString() !== currentUserId.toString()) {
      await Notification.create({
        recipient: participantId,
        sender: currentUserId,
        type: "new_message",
        message: `${req.user.name} sent you a message: "${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}"`,
        meta: { conversationId },
      });
    }
  }

  res.status(201).json(message);
});

// @desc    Get total unread message count for current user
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const conversations = await Conversation.find({ participants: currentUserId });

  const totalUnread = conversations.reduce((sum, conv) => {
    return sum + (conv.unreadCounts?.get(currentUserId.toString()) || 0);
  }, 0);

  res.json({ unreadCount: totalUnread });
});

// @desc    Delete a conversation and all its messages
// @route   DELETE /api/messages/conversation/:conversationId
// @access  Private
const deleteConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const currentUserId = req.user._id;

  // Verify user is a participant of the conversation
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: currentUserId,
  });

  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }

  // Delete all messages in this conversation
  await Message.deleteMany({ conversation: conversationId });

  // Delete the conversation document
  await Conversation.findByIdAndDelete(conversationId);

  res.json({ message: "Conversation and messages deleted successfully" });
});

// @desc    Delete a message
// @route   DELETE /api/messages/:messageId
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const currentUserId = req.user._id;

  // Find message and make sure current user is the sender
  const message = await Message.findOne({
    _id: messageId,
    sender: currentUserId,
  });

  if (!message) {
    res.status(404);
    throw new Error("Message not found or not authorized to delete");
  }

  const conversationId = message.conversation;

  // Delete the message
  await Message.findByIdAndDelete(messageId);

  // If this was the last message, update the conversation lastMessage preview
  const remainingMessages = await Message.find({ conversation: conversationId })
    .sort({ createdAt: -1 })
    .limit(1);

  if (remainingMessages.length > 0) {
    const lastMsg = remainingMessages[0];
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: {
        lastMessage: lastMsg.content.substring(0, 100),
        lastMessageAt: lastMsg.createdAt,
        lastMessageSender: lastMsg.sender,
      },
    });
  } else {
    // No messages left, clear the preview
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: {
        lastMessage: "",
        lastMessageAt: null,
        lastMessageSender: null,
      },
    });
  }

  res.json({ message: "Message deleted successfully", conversationId });
});

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
  deleteConversation,
  deleteMessage,
};

