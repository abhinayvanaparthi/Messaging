const express = require("express");
const multer = require("multer");
const {
  sendMessage,
  getMessages,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
  reactToMessage,
  sendFileMessage,
  searchMessages,
} = require("../controllers/messageController");
const protect = require("../middleware/authMiddleware");
const upload = require("../config/multer");

const router = express.Router();

// Middleware to catch Multer errors and return clean 4xx responses
const handleMulterUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "File size exceeds the 5MB limit" });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ message: err.message || "File upload failed" });
    }
    next();
  });
};

// Send message (protected)
router.post("/", protect, sendMessage);

// Get messages of a conversation
router.get("/:conversationId", protect, getMessages);
router.put("/read/:conversationId", protect, markMessagesAsRead);
router.put("/edit/:messageId", protect, editMessage);
router.delete("/delete/:messageId", protect, deleteMessage);
router.post("/react/:messageId", protect, reactToMessage);
router.post("/file", protect, handleMulterUpload, sendFileMessage);
router.get("/search/:conversationId", protect, searchMessages);

module.exports = router;