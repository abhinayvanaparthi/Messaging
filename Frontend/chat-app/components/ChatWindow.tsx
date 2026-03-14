"use client";

import { useEffect, useState, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { getMessages } from "../services/messageService";
import MessageInput from "./MessageInput";
import { jwtDecode } from "jwt-decode";

import { ScrollArea, Stack, Card, Text, Center, Title, Paper } from "@mantine/core";
import { getSocket } from "../socket/socket";

type Message = {
  _id: string;
  content: string;
  sender: string;
  createdAt?: string;
};

export default function ChatWindow() {
  const { activeConversation } = useChat();
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Get current user ID from token
  const currentUserId = token ? (jwtDecode(token) as { id: string }).id : null;

  // Load messages + join socket room
  useEffect(() => {
    if (!activeConversation) return;

    const socket = getSocket();
    socket.emit("joinConversation", activeConversation._id);

    const fetchMessages = async () => {
        try {
        const data = await getMessages(activeConversation._id, 1);
        setMessages(data);
        } catch (error) {
        console.error("Error loading messages", error);
        }
    };

    fetchMessages();
    }, [activeConversation]);

    useEffect(() => {
     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

  // Listen for new messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("newMessage", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("newMessage");
    };
  }, []);

  if (!activeConversation) {
    return (
      <Center
        style={{
          flex: 1,
          height: "100vh",
          backgroundColor: "#f8f9fa"
        }}
      >
        <Paper p="xl" radius="md" ta="center" style={{ backgroundColor: "transparent" }}>
          <Title order={3} c="dimmed">Welcome to Messaging</Title>
          <Text c="dimmed" mt="sm">Select a conversation from the sidebar or click "New Chat" to start.</Text>
        </Paper>
      </Center>
    );
  }

  return (
    <div style={{ flex: 1, height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8f9fa" }}>
      <ScrollArea key={activeConversation?._id} style={{ flex: 1 }}>
        <Stack p="md" gap="md">
          {messages.map((msg) => {
            const isMe = msg.sender === currentUserId;
            
            return (
              <div 
                key={msg._id} 
                style={{ 
                  display: "flex", 
                  justifyContent: isMe ? "flex-end" : "flex-start",
                  width: "100%"
                }}
              >
                <div 
                  style={{ 
                    maxWidth: "70%", 
                    backgroundColor: isMe ? "#228be6" : "#ffffff", 
                    color: isMe ? "white" : "black",
                    padding: "10px 14px",
                    borderRadius: "16px",
                    borderBottomRightRadius: isMe ? "4px" : "16px",
                    borderBottomLeftRadius: isMe ? "16px" : "4px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                  }}
                >
                  <Text size="sm">{msg.content}</Text>
                  {msg.createdAt && (
                    <Text size="10px" c={isMe ? "#e0e0e0" : "dimmed"} ta="right" mt={4}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </Stack>
      </ScrollArea>

      <MessageInput onMessageSent={(msg: Message) => setMessages((prev) => [...prev, msg])} />
    </div>
  );
}