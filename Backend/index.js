require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const authRoutes = require("./routes/authRoutes");
const protect = require("./middleware/authMiddleware");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");

connectDB();

app.use(express.json());
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

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const onlineUsers = new Map();
app.set("io", io);           // allows controllers to access socket.io
app.set("onlineUsers", onlineUsers); // allows controllers to access online users

// Basic socket connection


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // When user sends their ID after connecting
  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log("User joined:", userId);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on("typing", ({ conversationId, userId }) => {
    socket.to(conversationId).emit("typing", { userId });
  });

  socket.on("stopTyping", ({ conversationId, userId }) => {
    socket.to(conversationId).emit("stopTyping", { userId });
  });

  socket.on("disconnect", () => {
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
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