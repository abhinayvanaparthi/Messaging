const express = require("express");
const { sendMessage, getMessages, markMessagesAsRead, editMessage, deleteMessage, reactToMessage, sendFileMessage } = require("../controllers/messageController");
const protect = require("../middleware/authMiddleware");
const upload = require("../config/multer");

const router = express.Router();

// Send message (protected)
router.post("/", protect, sendMessage);

// Get messages of a conversation
router.get("/:conversationId", protect, getMessages);
router.put("/read/:conversationId", protect, markMessagesAsRead);
router.put("/edit/:messageId", protect, editMessage);
router.delete("/delete/:messageId", protect, deleteMessage);
router.post("/react/:messageId", protect, reactToMessage);
router.post("/file", protect, upload.single("file"), sendFileMessage);

module.exports = router;