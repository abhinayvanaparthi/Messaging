const express = require("express");
const { createOrGetConversation } = require("../controllers/conversationController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create or get chat (protected)
router.post("/", protect, createOrGetConversation);

module.exports = router;