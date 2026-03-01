const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    const sender = req.user.id;

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender,
      content,
    });

    // Update last message in conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: content,
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all messages of a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({
      conversation: conversationId,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};