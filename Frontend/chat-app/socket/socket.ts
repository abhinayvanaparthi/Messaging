import { io, Socket } from "socket.io-client";

let socket: Socket;

export const connectSocket = (userId: string) => {
  socket = io("http://localhost:5000");

  socket.emit("join", userId);

  return socket;
};

export const getSocket = () => socket;