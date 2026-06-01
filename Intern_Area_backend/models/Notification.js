const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    type: {
      type: String,
      enum: [
        "friend_request",      // Someone sent you a friend request
        "friend_accepted",     // Someone accepted your friend request
        "new_suggestion",      // New person you may know joined
        "new_message",         // Someone sent you a chat message
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // Optional metadata for navigation
    meta: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for fast lookup of user's notifications, newest first
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
