"use client";

import { useEffect, useState, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { getMessages, deleteMessage, reactToMessage } from "../services/messageService";
import MessageInput from "./MessageInput";
import { jwtDecode } from "jwt-decode";
import { TextField, IconButton } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { Stack, Typography, Paper, Box } from "@mui/material";
import { getSocket } from "../socket/socket";
type Message = {
  _id: string;
  content: string;
  sender: string;
  conversation?: string;
  createdAt?: string;
};
type ContextMenu = {
  visible: boolean;
  x: number;
  y: number;
  messageId: string|null;
};

export default function ChatWindow() {
  const { activeConversation } = useChat();
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    messageId: null,
  });
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  // Get current user ID from token
  const currentUserId = token ? (jwtDecode(token) as { id: string }).id : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  },[]);

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
      setMessages((prev) => {
        if (prev.some((msg) => msg._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    socket.on("messageEdited", (updatedMessage: Message) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
      );
    });

    socket.on("messageDeleted", (messageId: string) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    return () => {
      socket.off("newMessage");
      socket.off("messageEdited");
      socket.off("messageDeleted");
    };
  }, []);

  const handleEditClick = () => {
    const msg = messages.find((m) => m._id === contextMenu.messageId);
    if (!msg) return;

    setEditingMessageId(msg._id);   // mark this message as being edited
    setEditContent(msg.content);    // pre-fill the input with existing text
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null }); // close the menu
  };

  const handleDelete = async () => {
    if (!contextMenu.messageId) return;
    if (!activeConversation) return;

    try {
      await deleteMessage(contextMenu.messageId); // calls your messageService function

      // remove the message from local state
      setMessages((prev) => prev.filter((msg) => msg._id !== contextMenu.messageId));
      const socket = getSocket();
      socket.emit("deleteMessage", {
        conversationId: activeConversation._id,
        messageId: contextMenu.messageId,
      });
    } catch (error) {
      console.error("Error deleting message", error);
    } finally {
      setContextMenu({ visible: false, x: 0, y: 0, messageId: null }); // close menu
    }
  };

  const handleRightClick = (e: React.MouseEvent, msg:Message) => {
    if(msg.sender !== currentUserId) return;
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      messageId: msg._id,
    });
  }

  const handleEditCancel =() => {
    setEditingMessageId(null);
    setEditContent("");
  }

  const handleEditSave = async (messageId: string) => {
    if(!editContent.trimEnd()) return;
    if (!activeConversation) return;

    try{
      const res= await fetch(`/api/messages/edit/${messageId}`,{
        method: "PUT",
        headers:{
          "Content-Type":"application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent }),
      });

      if (!res.ok) throw new Error("Failed to edit message");

      const updatedMessage: Message = await res.json();

      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? updatedMessage : msg))
      );
      const socket = getSocket();
      socket.emit("editMessage", {
        conversationId: activeConversation._id,
        updatedMessage,
      });
    } catch (error) {
      console.error("Error editing message", error);
    } finally {
      setEditingMessageId(null);
      setEditContent("");
    }
  };

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
                {/* 👇 THIS is the new condition */}
                {editingMessageId === msg._id ? (
                  // EDIT MODE — shown when this message is being edited
                  <Box
                    sx={{
                      maxWidth: "70%",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      backgroundColor: "#fff",
                      borderRadius: "16px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                      px: 1.5,
                      py: 0.5,
                    }}
                  >
                    <TextField
                      variant="standard"
                      value={editContent}
                      onChange={(changeEvent) => setEditContent(changeEvent.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) handleEditSave(msg._id);
                        if (e.key === "Escape") handleEditCancel();
                      }}
                      autoFocus
                      multiline
                      InputProps={{ disableUnderline: true }}
                    />
                    <IconButton onClick={() => handleEditSave(msg._id)}>
                      <CheckIcon />
                    </IconButton>
                    <IconButton onClick={handleEditCancel}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                ) : (
                <div 
                  onContextMenu={(e) => handleRightClick(e,msg)}
                  style={{ 
                    maxWidth: "70%", 
                    backgroundColor: isMe ? "#1976d2" : "#ffffff", 
                    color: isMe ? "white" : "black",
                    padding: "10px 14px",
                    borderRadius: "16px",
                    borderBottomRightRadius: isMe ? "4px" : "16px",
                    borderBottomLeftRadius: isMe ? "16px" : "4px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    cursor:isMe?"context-menu":"default",
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
              )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </Stack>
      </Box>

      {contextMenu.visible && (
        <Box
          ref={contextMenuRef}
          sx={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 9999,
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            minWidth: 140,
            overflow: "hidden", // keeps rounded corners clean
          }}
        >
          {/* Edit option */}
          <Box
            onClick={handleEditClick}
            sx={{
              px: 2, py: 1.2,
              cursor: "pointer",
              fontSize: 14,
              color: "#1976d2",
              fontWeight: 500,
              "&:hover": { backgroundColor: "#f0f7ff" },
            }}
          >
            ✏️ Edit Message
          </Box>

          {/* Divider between options */}
          <Box sx={{ height: "1px", backgroundColor: "#f0f0f0" }} />

          {/* Delete option */}
          <Box
            onClick={handleDelete}
            sx={{
              px: 2, py: 1.2,
              cursor: "pointer",
              fontSize: 14,
              color: "#d32f2f", // red to signal destructive action
              fontWeight: 500,
              "&:hover": { backgroundColor: "#fff5f5" },
            }}
          >
            🗑️ Delete Message
          </Box>
        </Box>
      )}

      <MessageInput
        onMessageSent={(msg: Message) =>
          setMessages((prev) => {
            if (prev.some((m) => m._id === msg._id)) {
              return prev;
            }
            return [...prev, msg];
          })
        }
      />
    </div>
  );
}