require("dotenv").config();
const path = require("path");
const fs = require("fs");
const http = require("http");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

// Strict startup validation for required secrets
const requiredEnv = ["JWT_SECRET", "MONGO_URI", "MESSAGE_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(
    `FATAL: Missing required environment variable(s): ${missingEnv.join(
      ", "
    )}. Server cannot start.`
  );
  process.exit(1);
}

const connectDB = require("./config/db");
const { apiLimiter } = require("./middleware/rateLimiter");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const protect = require("./middleware/authMiddleware");
const User = require("./models/User");
const Conversation = require("./models/Conversation");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Configured CORS origins
const rawOrigins =
  process.env.ALLOWED_ORIGINS ||
  process.env.FRONTEND_URL ||
  "http://localhost:3000";

const allowedOrigins = rawOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// Global API Rate Limiter
app.use("/api", apiLimiter);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Protected media serving: requires JWT authentication (header or query token)
app.use(
  "/uploads",
  protect,
  (req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  },
  express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);
      if (!isImage) {
        res.setHeader("Content-Disposition", "attachment");
      } else {
        res.setHeader("Content-Disposition", "inline");
      }
    },
  })
);

// REST Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("Messaging backend is running 🚀");
});

// HTTP server and Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const onlineUsers = new Map();
const typingUsers = new Map();

app.set("io", io);
app.set("onlineUsers", onlineUsers);

// Socket.io JWT authentication handshake middleware
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    (socket.handshake.headers?.authorization &&
    socket.handshake.headers.authorization.startsWith("Bearer ")
      ? socket.handshake.headers.authorization.split(" ")[1]
      : null);

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    socket.userId = decoded.id;
    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.userId;
  onlineUsers.set(userId, socket.id);

  User.findByIdAndUpdate(userId, { isOnline: true }).catch((err) => {
    console.error("Error setting user online status:", err.message);
  });

  io.emit("onlineUsers", Array.from(onlineUsers.keys()));

  // Handshake registration compatibility
  socket.on("join", async () => {
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  // Join conversation room with participant verification
  socket.on("joinConversation", async (conversationId) => {
    if (!conversationId) return;
    try {
      const conversation = await Conversation.findById(conversationId);
      if (
        conversation &&
        conversation.participants.some((p) => p.toString() === userId)
      ) {
        socket.join(conversationId);
      } else {
        socket.emit("error", { message: "Access denied to conversation" });
      }
    } catch (err) {
      socket.emit("error", { message: "Error joining conversation" });
    }
  });

  // Edit message event with participant verification
  socket.on("editMessage", async ({ conversationId, updatedMessage }) => {
    if (!conversationId || !updatedMessage) return;
    try {
      const conversation = await Conversation.findById(conversationId);
      if (
        conversation &&
        conversation.participants.some((p) => p.toString() === userId)
      ) {
        socket.to(conversationId).emit("messageEdited", updatedMessage);
      }
    } catch (err) {
      console.error("Socket editMessage error:", err.message);
    }
  });

  // Delete message event with participant verification
  socket.on("deleteMessage", async ({ conversationId, messageId }) => {
    if (!conversationId || !messageId) return;
    try {
      const conversation = await Conversation.findById(conversationId);
      if (
        conversation &&
        conversation.participants.some((p) => p.toString() === userId)
      ) {
        socket.to(conversationId).emit("messageDeleted", messageId);
      }
    } catch (err) {
      console.error("Socket deleteMessage error:", err.message);
    }
  });

  // Typing event with participant verification
  socket.on("typing", async ({ conversationId }) => {
    if (!conversationId) return;
    try {
      const conversation = await Conversation.findById(conversationId);
      if (
        conversation &&
        conversation.participants.some((p) => p.toString() === userId)
      ) {
        socket.to(conversationId).emit("typing", { userId });

        if (typingUsers.has(userId)) {
          clearTimeout(typingUsers.get(userId));
        }

        const timeout = setTimeout(() => {
          socket.to(conversationId).emit("stopTyping", { userId });
          typingUsers.delete(userId);
        }, 2000);

        typingUsers.set(userId, timeout);
      }
    } catch (err) {
      console.error("Socket typing error:", err.message);
    }
  });

  socket.on("disconnect", async () => {
    if (onlineUsers.get(userId) === socket.id) {
      onlineUsers.delete(userId);

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      }).catch((err) => {
        console.error("Error setting user offline status:", err.message);
      });
    }

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});