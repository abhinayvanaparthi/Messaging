import { io, Socket } from "socket.io-client";

let socket: Socket;

export const connectSocket = (userId: string, token?: string) => {
  const authToken =
    token ||
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  socket = io(process.env.NEXT_PUBLIC_BACKEND_URL as string, {
    transports: ["websocket"],
    auth: {
      token: authToken,
    },
  });

  socket.emit("join", userId);

  return socket;
};

export const getSocket = () => socket;