const { io } = require("socket.io-client");

// connect to backend socket server
// const socket = io("http://localhost:5000");
const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL);

socket.on("connect", () => {
  console.log("Connected to socket server:", socket.id);

  // simulate logged-in user
  const userId = process.argv[2]; // pass userId from terminal
  socket.emit("join", userId);
});

// listen for real-time messages
socket.on("newMessage", (message) => {
  console.log("New real-time message received:");
  console.log(message);
});