"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { subscribeToOnlineUsers } from "../socket/socket";
import { useAuth } from "./AuthContext";

export type User = {
  _id: string;
  name: string;
  email: string;
  profilePic?: string;
};

export type Conversation = {
  _id: string;
  participants?: User[];
  isGroup?: boolean;
  groupName?: string;
  lastMessage?: string;
  updatedAt?: string;
};

type ChatContextType = {
  activeConversation: Conversation | null;
  setActiveConversation: (conversation: Conversation) => void;
  onlineUsers: string[];
  isUserOnline: (userId?: string | null) => boolean;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      return;
    }

    const unsubscribe = subscribeToOnlineUsers((users: string[]) => {
      setOnlineUsers(Array.isArray(users) ? users : []);
    });

    return () => {
      unsubscribe();
      setOnlineUsers([]);
    };
  }, [token]);

  const isUserOnline = useCallback(
    (userId?: string | null) => {
      if (!userId) return false;
      return onlineUsers.includes(userId.toString());
    },
    [onlineUsers]
  );

  return (
    <ChatContext.Provider
      value={{
        activeConversation,
        setActiveConversation,
        onlineUsers,
        isUserOnline,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used inside ChatProvider");
  }

  return context;
}