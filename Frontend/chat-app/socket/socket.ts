import { io, Socket } from "socket.io-client";

let socket: Socket;

export const connectSocket = (userId: string) => {
  socket = io(process.env.NEXT_PUBLIC_BACKEND_URL as string, {
    transports: ["websocket"],
  });

  socket.emit("join", userId);

  return socket;
};

export const getSocket = () => socket;