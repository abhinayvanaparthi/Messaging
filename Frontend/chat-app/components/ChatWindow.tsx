"use client";

import { useEffect, useState, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { getMessages } from "../services/messageService";
import MessageInput from "./MessageInput";
import { jwtDecode } from "jwt-decode";

import { Stack, Typography, Paper, Box } from "@mui/material";
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
      <Box
        sx={{
          flex: 1,
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8f9fa",
        }}
      >
        <Paper elevation={0} sx={{ p: 4, textAlign: "center", backgroundColor: "transparent" }}>
          <Typography variant="h5" color="text.secondary">Welcome to Messaging</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Select a conversation from the sidebar or click &quot;New Chat&quot; to start.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <div style={{ flex: 1, height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8f9fa" }}>
      <Box
        key={activeConversation?._id}
        sx={{ flex: 1, overflowY: "auto", p: 2 }}
      >
        <Stack spacing={2}>
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
                    backgroundColor: isMe ? "#1976d2" : "#ffffff", 
                    color: isMe ? "white" : "black",
                    padding: "10px 14px",
                    borderRadius: "16px",
                    borderBottomRightRadius: isMe ? "4px" : "16px",
                    borderBottomLeftRadius: isMe ? "16px" : "4px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                  }}
                >
                  <Typography variant="body2">{msg.content}</Typography>
                  {msg.createdAt && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: "block",
                        textAlign: "right", 
                        mt: 0.5, 
                        color: isMe ? "#e0e0e0" : "text.secondary",
                        fontSize: "10px"
                      }}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </Stack>
      </Box>

      <MessageInput onMessageSent={(msg: Message) => setMessages((prev) => [...prev, msg])} />
    </div>
  );
}