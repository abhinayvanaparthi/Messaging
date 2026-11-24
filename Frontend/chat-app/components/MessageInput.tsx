"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { useChat } from "../context/ChatContext";
import { sendMessage, sendFileMessage } from "../services/messageService";
import {
  TextField,
  IconButton,
  Box,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";

export type SentMessage = {
  _id: string;
  content: string;
  sender: string;
  conversation?: string;
  fileUrl?: string;
  fileType?: string;
  createdAt?: string;
};

type MessageInputProps = {
  onMessageSent?: (message: SentMessage) => void;
};

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function MessageInput({ onMessageSent }: MessageInputProps) {
  const { activeConversation } = useChat();
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());
    const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);

    if (!isMimeAllowed || !isExtAllowed) {
      setErrorMessage(
        "Invalid file type. Only JPEG, PNG, GIF, WebP images and PDF documents are allowed."
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(
        `File "${file.name}" exceeds the 5MB limit (${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)} MB). Please select a smaller file.`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    const trimmed = message.trim();
    if ((!trimmed && !selectedFile) || !activeConversation || uploading) {
      return;
    }

    try {
      setUploading(true);
      setErrorMessage(null);

      // Upload file attachment first if selected
      if (selectedFile) {
        const fileMsg: SentMessage = await sendFileMessage(
          activeConversation._id,
          selectedFile
        );
        if (onMessageSent) {
          onMessageSent(fileMsg);
        }
        handleRemoveFile();
      }

      // Send text message if text content exists
      if (trimmed) {
        const textMsg: SentMessage = await sendMessage(activeConversation._id, trimmed);
        setMessage("");
        if (onMessageSent) {
          onMessageSent(textMsg);
        }
      }
    } catch (error: unknown) {
      let msg = "Failed to send message.";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        msg = String(error.response.data.message);
      } else if (axios.isAxiosError(error) && error.response?.status === 401) {
        msg = "Your session has expired. Please log in again.";
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        msg = "Access denied: you are not a participant in this conversation.";
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setErrorMessage(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isPdf = selectedFile?.type === "application/pdf" || selectedFile?.name.toLowerCase().endsWith(".pdf");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        borderTop: "1px solid #eee",
        backgroundColor: "white",
      }}
    >
      {/* Error alert */}
      {errorMessage && (
        <Box sx={{ px: 2, pt: 1.5 }}>
          <Alert
            severity="error"
            onClose={() => setErrorMessage(null)}
            sx={{ py: 0.25, fontSize: "0.85rem", alignItems: "center" }}
          >
            {errorMessage}
          </Alert>
        </Box>
      )}

      {/* Selected file preview chip */}
      {selectedFile && (
        <Box sx={{ px: 2, pt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            icon={
              isPdf ? (
                <PictureAsPdfIcon fontSize="small" sx={{ color: "#d32f2f !important" }} />
              ) : (
                <ImageIcon fontSize="small" sx={{ color: "#1976d2 !important" }} />
              )
            }
            label={`${selectedFile.name} (${(
              selectedFile.size /
              (1024 * 1024)
            ).toFixed(2)} MB)`}
            onDelete={uploading ? undefined : handleRemoveFile}
            disabled={uploading}
            color="primary"
            variant="outlined"
            sx={{
              maxWidth: "100%",
              fontWeight: 500,
              bgcolor: "#f0f7ff",
              borderColor: "#90caf9",
            }}
          />
        </Box>
      )}

      {/* Input controls */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2 }}>
        {/* Hidden native file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.jpg,.jpeg,.png,.gif,.webp,.pdf"
          style={{ display: "none" }}
          onChange={handleFileSelect}
          disabled={uploading}
        />

        {/* Paperclip attachment button */}
        <IconButton
          color="primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Attach image or PDF (max 5MB)"
          sx={{
            color: "#616161",
            "&:hover": { bgcolor: "rgba(0,0,0,0.04)", color: "#1976d2" },
          }}
        >
          <AttachFileIcon />
        </IconButton>

        <TextField
          placeholder={selectedFile ? "Add a message or press send..." : "Type a message..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ flex: 1 }}
          size="small"
          fullWidth
          disabled={uploading}
          InputProps={{
            sx: { borderRadius: 6 },
          }}
        />

        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || uploading}
          sx={{
            bgcolor: "#1976d2",
            color: "white",
            "&:hover": { bgcolor: "#1565c0" },
            "&.Mui-disabled": { bgcolor: "#e0e0e0", color: "#9e9e9e" },
          }}
        >
          {uploading ? (
            <CircularProgress size={20} sx={{ color: "white" }} />
          ) : (
            <SendIcon fontSize="small" />
          )}
        </IconButton>
      </Box>
    </Box>
  );
}
