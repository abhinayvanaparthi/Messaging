"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Conversation = {
  _id: string;
};

type ChatContextType = {
  activeConversation: Conversation | null;
  setActiveConversation: (conversation: Conversation) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);

  return (
    <ChatContext.Provider
      value={{ activeConversation, setActiveConversation }}
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