"use client";

import { useState } from "react";
import { useChat } from "../context/ChatContext";
import { sendMessage } from "../services/messageService";
import { TextField, IconButton, Box } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

type MessageInputProps = {
  onMessageSent?: (message: any) => void;
};

export default function MessageInput({ onMessageSent }: MessageInputProps) {
  const { activeConversation } = useChat();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || !activeConversation || sending) {
      return;
    }

    try {
      setSending(true);
      const sentMessage = await sendMessage(activeConversation._id, trimmed);
      setMessage("");
      if (onMessageSent) {
        onMessageSent(sentMessage);
      }
    } catch (error: any) {
      console.error("Error sending message:", error.response?.data || error.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2, borderTop: "1px solid #eee", backgroundColor: "white" }}>
      <TextField
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        sx={{ flex: 1 }}
        size="small"
        fullWidth
        disabled={sending}
        InputProps={{
          sx: { borderRadius: 6 }
        }}
      />
      <IconButton 
        color="primary"
        onClick={handleSend}
        disabled={!message.trim() || sending}
        sx={{ 
          bgcolor: "#1976d2", 
          color: "white",
          "&:hover": { bgcolor: "#1565c0" },
          "&.Mui-disabled": { bgcolor: "#e0e0e0", color: "#9e9e9e" }
        }}
      >
        <SendIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}