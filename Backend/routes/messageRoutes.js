const express = require("express");
const { sendMessage, getMessages, markMessagesAsRead, editMessage, deleteMessage, reactToMessage } = require("../controllers/messageController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Send message (protected)
router.post("/", protect, sendMessage);

// Get messages of a conversation
router.get("/:conversationId", protect, getMessages);
router.put("/read/:conversationId", protect, markMessagesAsRead);
router.put("/edit/:messageId", protect, editMessage);
router.delete("/delete/:messageId", protect, deleteMessage);
router.post("/react/:messageId", protect, reactToMessage);

module.exports = router;