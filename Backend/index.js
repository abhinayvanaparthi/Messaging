require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const apiLimiter = require("./middleware/rateLimiter");
const userRoutes = require("./routes/userRoutes");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 5000;
const authRoutes = require("./routes/authRoutes");
const protect = require("./middleware/authMiddleware");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");

connectDB();
// app.use(cors({
//     origin: "http://localhost:3000"
//   }));
app.use(cors({
  origin: ["http://localhost:3000", process.env.FRONTEND_URL],
  credentials: true
}));
app.use(express.json());
app.use("/api", apiLimiter);
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("Messaging backend is running 🚀");
});
app.get("/api/test", protect, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user,
  });
});

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const typingUsers = new Map();

// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"]
//   }
// });
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", process.env.FRONTEND_URL],
    methods: ["GET", "POST"],
    credentials: true
  }
});
const onlineUsers = new Map();
app.set("io", io);           // allows controllers to access socket.io
app.set("onlineUsers", onlineUsers); // allows controllers to access online users

// Basic socket connection


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // When user sends their ID after connecting
  socket.on("join", async (userId) => {
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, {
      isOnline: true,
    });

    console.log("User joined:", userId);

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on("typing", ({ conversationId, userId }) => {
    socket.to(conversationId).emit("typing", { userId });

    // reset typing timer
    if (typingUsers.has(userId)) {
      clearTimeout(typingUsers.get(userId));
    }

    const timeout = setTimeout(() => {
      socket.to(conversationId).emit("stopTyping", { userId });
      typingUsers.delete(userId);
    }, 2000);

    typingUsers.set(userId, timeout);
  });

  socket.on("disconnect", async () => {
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {

        onlineUsers.delete(userId);

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        break;
      }
    }

    console.log("User disconnected:", socket.id);

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});