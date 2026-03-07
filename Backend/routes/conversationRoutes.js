const express = require("express");
const { createOrGetConversation, getUserConversations, createGroupConversation, addGroupMember, removeGroupMember, leaveGroup, renameGroup, changeGroupAdmin } = require("../controllers/conversationController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create or get chat (protected)
router.post("/", protect, createOrGetConversation);
router.get("/", protect, getUserConversations);
router.post("/group", protect, createGroupConversation);
router.put("/group/add/:conversationId", protect, addGroupMember);
router.put("/group/remove/:conversationId", protect, removeGroupMember);
router.put("/group/leave/:conversationId", protect, leaveGroup);
router.put("/group/rename/:conversationId", protect, renameGroup);
router.put("/group/admin/:conversationId", protect, changeGroupAdmin);

module.exports = router;