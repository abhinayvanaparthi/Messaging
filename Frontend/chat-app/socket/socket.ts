import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
type OnlineUsersListener = (users: string[]) => void;
const onlineUsersListeners = new Set<OnlineUsersListener>();

export const connectSocket = (userId: string, token?: string) => {
  const authToken =
    token ||
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  if (socket && socket.connected) {
    socket.emit("join", userId);
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(process.env.NEXT_PUBLIC_BACKEND_URL as string, {
    transports: ["websocket"],
    auth: {
      token: authToken,
    },
  });

  socket.emit("join", userId);

  // Attach all active onlineUsers listeners to the socket instance
  onlineUsersListeners.forEach((listener) => {
    socket?.on("onlineUsers", listener);
  });

  return socket;
};

export const getSocket = () => socket as Socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const subscribeToOnlineUsers = (listener: OnlineUsersListener) => {
  onlineUsersListeners.add(listener);
  if (socket) {
    socket.on("onlineUsers", listener);
  }

  return () => {
    onlineUsersListeners.delete(listener);
    if (socket) {
      socket.off("onlineUsers", listener);
    }
  };
};