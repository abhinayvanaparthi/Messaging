const express = require("express");
const { sendMessage, getMessages, markMessagesAsRead } = require("../controllers/messageController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Send message (protected)
router.post("/", protect, sendMessage);

// Get messages of a conversation
router.get("/:conversationId", protect, getMessages);
router.put("/read/:conversationId", protect, markMessagesAsRead);

module.exports = router;