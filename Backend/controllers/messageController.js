const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { decryptMessage } = require("../utils/encryption");

// Helper to check if a user is a participant in a conversation
const isParticipant = (conversation, userId) => {
  if (!conversation || !conversation.participants) return false;
  return conversation.participants.some((p) => p.toString() === userId.toString());
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const sender = req.user.id;

    if (!conversationId || typeof conversationId !== "string") {
      return res.status(400).json({ message: "conversationId is required" });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Message content cannot be empty" });
    }

    // Validate conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Participant authorization check
    if (!isParticipant(conversation, sender)) {
      return res.status(403).json({ message: "Access denied: you are not a participant in this conversation" });
    }

    const trimmedContent = content.trim();

    // Create message (triggers AES encryption in pre-save hook)
    const message = await Message.create({
      conversation: conversationId,
      sender,
      content: trimmedContent,
      readBy: [sender],
    });

    // Update last message in conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: trimmedContent,
    });

    // Decrypt content for client delivery
    const responseMessage = {
      ...message.toObject(),
      content: decryptMessage(message.content),
    };

    // Real-time emit to conversation room and online participants
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    if (io) {
      io.to(conversationId).emit("newMessage", responseMessage);

      // Also deliver to individual participant sockets if connected
      let delivered = false;
      conversation.participants.forEach((p) => {
        const pId = p.toString();
        if (pId !== sender) {
          const socketId = onlineUsers ? onlineUsers.get(pId) : null;
          if (socketId) {
            io.to(socketId).emit("newMessage", responseMessage);
            delivered = true;
          }
        }
      });

      if (delivered) {
        message.status = "delivered";
        await message.save();
      }
    }

    res.status(201).json(responseMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!isParticipant(conversation, userId)) {
      return res.status(403).json({ message: "Access denied: you are not a participant in this conversation" });
    }

    await Message.updateMany(
      { conversation: conversationId, status: { $ne: "read" } },
      { status: "read", $addToSet: { readBy: userId } }
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
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!isParticipant(conversation, userId)) {
      return res.status(403).json({ message: "Access denied: you are not a participant in this conversation" });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 20;

    const messages = await Message.find({
      conversation: conversationId,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Decrypt messages
    const decryptedMessages = messages.map((msg) => ({
      ...msg.toObject(),
      content: decryptMessage(msg.content),
    }));

    res.json(decryptedMessages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Edit message
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Content cannot be empty" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only sender can edit
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to edit this message" });
    }

    message.content = content.trim();
    await message.save();

    res.json({
      ...message.toObject(),
      content: decryptMessage(message.content),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only sender can delete
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await message.deleteOne();

    res.json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// React to message
exports.reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    if (!emoji || typeof emoji !== "string") {
      return res.status(400).json({ message: "Valid emoji string is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check that user is a participant of the conversation
    const conversation = await Conversation.findById(message.conversation);
    if (!conversation || !isParticipant(conversation, userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find if emoji reaction already exists
    const reaction = message.reactions.find((r) => r.emoji === emoji);

    if (reaction) {
      const userIndex = reaction.users.indexOf(userId);

      if (userIndex > -1) {
        // User already reacted -> remove reaction
        reaction.users.splice(userIndex, 1);
      } else {
        // Add user reaction
        reaction.users.push(userId);
      }

      // Remove reaction object if no users left
      if (reaction.users.length === 0) {
        message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
      }
    } else {
      // Create new emoji reaction
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

// Send file message
exports.sendFileMessage = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const sender = req.user.id;

    if (!conversationId || typeof conversationId !== "string") {
      return res.status(400).json({ message: "conversationId is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!isParticipant(conversation, sender)) {
      return res.status(403).json({ message: "Access denied: you are not a participant in this conversation" });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender,
      content: "[File Attachment]",
      fileUrl: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      readBy: [sender],
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: "[File Attachment]",
    });

    const io = req.app.get("io");
    if (io) {
      io.to(conversationId).emit("newMessage", message);
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search messages
exports.searchMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { query } = req.query;
    const userId = req.user.id;

    if (!query || typeof query !== "string" || !query.trim()) {
      return res.json([]);
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!isParticipant(conversation, userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Since content in DB is AES-encrypted, fetch messages, decrypt, and filter
    const messages = await Message.find({
      conversation: conversationId,
    })
      .sort({ createdAt: -1 })
      .limit(100);

    const lowerQuery = query.trim().toLowerCase();
    const matchingMessages = [];

    for (const msg of messages) {
      const decrypted = decryptMessage(msg.content);
      if (decrypted && decrypted.toLowerCase().includes(lowerQuery)) {
        matchingMessages.push({
          ...msg.toObject(),
          content: decrypted,
        });
      }
      if (matchingMessages.length >= 50) break;
    }

    res.json(matchingMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

