const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env
dotenv.config({ path: path.join(__dirname, "../.env") });

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

async function cleanDuplicates() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully.");

    // Fetch all conversations
    const conversations = await Conversation.find({});
    console.log(`Found ${conversations.length} total conversations in database.`);

    // Group conversations by sorted participant IDs
    const groups = {};
    for (const conv of conversations) {
      if (!conv.participants || conv.participants.length !== 2) {
        // Skip or clean malformed conversations
        continue;
      }
      const sortedIds = conv.participants.map(id => id.toString()).sort().join("_");
      if (!groups[sortedIds]) {
        groups[sortedIds] = [];
      }
      groups[sortedIds].push(conv);
    }

    let mergedCount = 0;
    let deletedCount = 0;

    for (const [key, convList] of Object.entries(groups)) {
      if (convList.length > 1) {
        console.log(`\nFound duplicate conversations for participants key: ${key}`);
        
        // Keep the conversation with messages, or the first one
        // Let's count messages for each duplicate
        const counts = await Promise.all(
          convList.map(async (c) => {
            const count = await Message.countDocuments({ conversation: c._id });
            return { conv: c, count };
          })
        );

        // Sort by message count descending, so we keep the one with most messages
        counts.sort((a, b) => b.count - a.count);

        const primary = counts[0].conv;
        console.log(`Keeping primary conversation: ${primary._id} (${counts[0].count} messages)`);

        for (let i = 1; i < counts.length; i++) {
          const duplicate = counts[i].conv;
          const duplicateMsgCount = counts[i].count;

          console.log(`Merging duplicate conversation: ${duplicate._id} (${duplicateMsgCount} messages) into primary`);
          
          if (duplicateMsgCount > 0) {
            // Move messages to primary conversation
            const updateResult = await Message.updateMany(
              { conversation: duplicate._id },
              { $set: { conversation: primary._id } }
            );
            mergedCount += updateResult.modifiedCount;
            console.log(`Moved ${updateResult.modifiedCount} messages.`);
          }

          // Delete the duplicate conversation document
          await Conversation.findByIdAndDelete(duplicate._id);
          deletedCount++;
          console.log(`Deleted duplicate conversation document: ${duplicate._id}`);
        }

        // Recalculate lastMessage for primary conversation
        const latestMsg = await Message.findOne({ conversation: primary._id })
          .sort({ createdAt: -1 })
          .limit(1);

        if (latestMsg) {
          await Conversation.findByIdAndUpdate(primary._id, {
            $set: {
              lastMessage: latestMsg.content.substring(0, 100),
              lastMessageAt: latestMsg.createdAt,
              lastMessageSender: latestMsg.sender
            }
          });
        }
      }
    }

    console.log(`\nCleanup complete.`);
    console.log(`Total duplicate conversations deleted: ${deletedCount}`);
    console.log(`Total messages moved: ${mergedCount}`);

  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    process.exit(0);
  }
}

cleanDuplicates();
