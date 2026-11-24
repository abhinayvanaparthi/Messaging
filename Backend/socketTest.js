const { io } = require("socket.io-client");

const backendUrl =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

const token = process.argv[2] || process.env.TEST_JWT_TOKEN;

if (!token) {
  console.log("Usage: node socketTest.js <jwt_token>");
  process.exit(1);
}

const socket = io(backendUrl, {
  transports: ["websocket"],
  auth: {
    token,
  },
});

socket.on("connect", () => {
  console.log("Connected to socket server:", socket.id);
  socket.emit("join");
});

socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err.message);
});

// listen for real-time messages
socket.on("newMessage", (message) => {
  console.log("New real-time message received:");
  console.log(message);
});