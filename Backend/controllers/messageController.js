const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { encryptMessage, decryptMessage } = require("../utils/encryption");

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    const sender = req.user.id;

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender,
      content: encryptMessage(content),
      readBy: [sender],
    });

    // find conversation
    const conversation = await Conversation.findById(conversationId);

    // Update last message in conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: content,
    });

    // --- Real-time emit ---
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    // find receiver (other participant)
    const receiverId = conversation.participants.find(
      (p) => p.toString() !== sender
    );

    const receiverSocketId = onlineUsers.get(receiverId?.toString());

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
      message.status = "delivered";
      await message.save();
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      { conversation: conversationId, status: { $ne: "read" } },
      { status: "read" }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all messages of a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const page = parseInt(req.query.page) || 1;

    console.log('==================', page);
    
    
    const limit = 20;

    const messages = await Message.find({
      conversation: conversationId,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // decrypt messages
    const decryptedMessages = messages.map((msg) => ({
      ...msg.toObject(),
      content: decryptMessage(msg.content),
    }));

    res.json(decryptedMessages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // only sender can edit
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to edit this message" });
    }

    message.content = content;
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // only sender can delete
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await message.deleteOne();

    res.json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // find if emoji reaction already exists
    const reaction = message.reactions.find((r) => r.emoji === emoji);

    if (reaction) {
      const userIndex = reaction.users.indexOf(userId);

      if (userIndex > -1) {
        // user already reacted → remove reaction
        reaction.users.splice(userIndex, 1);
      } else {
        // add user reaction
        reaction.users.push(userId);
      }

      // remove reaction object if no users left
      if (reaction.users.length === 0) {
        message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
      }

    } else {
      // create new emoji reaction
      message.reactions.push({
        emoji,
        users: [userId],
      });
    }

    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendFileMessage = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const sender = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender,
      fileUrl: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      readBy: [sender],
    });

    const conversation = await Conversation.findById(conversationId);

    const io = req.app.get("io");

    io.to(conversationId).emit("newMessage", message);

    res.status(201).json(message);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { query } = req.query;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // security check: user must be participant
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({
      conversation: conversationId,
      content: { $regex: query, $options: "i" }
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const decryptedMessages = messages.map((msg) => ({
      ...msg.toObject(),
      content: decryptMessage(decryptedMessages)
    }));

    res.json(messages);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

