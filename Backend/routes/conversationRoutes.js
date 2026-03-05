const express = require("express");
const { createOrGetConversation, getUserConversations } = require("../controllers/conversationController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create or get chat (protected)
router.post("/", protect, createOrGetConversation);
router.get("/", protect, getUserConversations);

module.exports = router;