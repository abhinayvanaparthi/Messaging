const Conversation = require("../models/Conversation");

// Create or get conversation
exports.createOrGetConversation = async (req, res) => {
  try {
    const { userId } = req.body; // the person you want to chat with

    const currentUser = req.user.id;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUser, userId] },
    });

    // If not, create new
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUser, userId],
      });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "name email")
      .sort({ updatedAt: -1 });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          readBy: { $ne: userId },
        });

        return {
          ...conversation.toObject(),
          unreadCount,
        };
      })
    );

    res.json(conversationsWithUnread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};