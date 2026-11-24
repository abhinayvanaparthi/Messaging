"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Dialog,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

type FileAttachmentProps = {
  fileUrl: string;
  fileType?: string;
  isMe?: boolean;
};

export default function FileAttachment({
  fileUrl,
  fileType,
  isMe = false,
}: FileAttachmentProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    const baseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
    const cleanPath = fileUrl.replace(/^\/+/, "");
    const fullUrl = fileUrl.startsWith("http")
      ? fileUrl
      : `${baseUrl}/${cleanPath}`;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    fetch(fullUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load file (${res.status})`);
        }
        return res.blob();
      })
      .then((blob) => {
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load attachment");
        setLoading(false);
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
      setBlobUrl(null);
      setLoading(true);
      setError(null);
    };
  }, [fileUrl]);

  const isImage =
    Boolean(fileType?.startsWith("image/")) ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
  const isPdf =
    fileType === "application/pdf" || /\.pdf$/i.test(fileUrl);
  const rawFileName = fileUrl.split("/").pop() || "file";
  const displayName = isPdf ? (rawFileName.endsWith(".pdf") ? rawFileName : `${rawFileName}.pdf`) : rawFileName;

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          p: 2,
          minWidth: 180,
          minHeight: 70,
          bgcolor: isMe ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.04)",
          borderRadius: 2,
        }}
      >
        <CircularProgress size={18} color={isMe ? "inherit" : "primary"} />
        <Typography
          variant="caption"
          sx={{ color: isMe ? "#fff" : "text.secondary", fontWeight: 500 }}
        >
          Loading attachment...
        </Typography>
      </Box>
    );
  }

  if (error || !blobUrl) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1.5,
          bgcolor: isMe ? "rgba(255, 255, 255, 0.2)" : "#ffebee",
          color: isMe ? "#fff" : "#c62828",
          borderRadius: 2,
        }}
      >
        <ErrorOutlineIcon fontSize="small" />
        <Typography variant="caption" fontWeight={500}>
          {error || "Attachment unavailable"}
        </Typography>
      </Box>
    );
  }

  if (isImage) {
    return (
      <>
        <Box
          component="img"
          src={blobUrl}
          alt={displayName}
          onClick={() => setPreviewOpen(true)}
          sx={{
            maxWidth: "100%",
            width: "auto",
            maxHeight: 280,
            borderRadius: 2,
            display: "block",
            cursor: "pointer",
            objectFit: "cover",
            transition: "transform 0.15s ease-in-out, opacity 0.15s",
            "&:hover": {
              opacity: 0.92,
              transform: "scale(1.01)",
            },
          }}
        />

        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          maxWidth="lg"
          PaperProps={{
            sx: {
              bgcolor: "rgba(0, 0, 0, 0.92)",
              boxShadow: "none",
              overflow: "hidden",
              position: "relative",
              p: 1.5,
              borderRadius: 2,
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
              px: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: "#fff", fontWeight: 500 }} noWrap>
              {displayName}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton
                component="a"
                href={blobUrl}
                download={displayName}
                sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}
                title="Download image"
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={() => setPreviewOpen(false)}
                sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}
                title="Close"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Box
            component="img"
            src={blobUrl}
            alt={displayName}
            sx={{
              maxWidth: "88vw",
              maxHeight: "82vh",
              objectFit: "contain",
              borderRadius: 1,
              display: "block",
              margin: "0 auto",
            }}
          />
        </Dialog>
      </>
    );
  }

  // PDF and Document download link
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        p: 1.5,
        bgcolor: isMe ? "rgba(255, 255, 255, 0.2)" : "#f5f5f5",
        borderRadius: 2,
        minWidth: 220,
        maxWidth: 320,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, overflow: "hidden" }}>
        <PictureAsPdfIcon
          sx={{
            color: isMe ? "#fff" : "#e53935",
            fontSize: 32,
            flexShrink: 0,
          }}
        />
        <Box sx={{ overflow: "hidden" }}>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            sx={{ color: isMe ? "#fff" : "text.primary" }}
            title={displayName}
          >
            {displayName}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: isMe ? "rgba(255, 255, 255, 0.8)" : "text.secondary", display: "block" }}
          >
            PDF Document
          </Typography>
        </Box>
      </Box>

      <IconButton
        component="a"
        href={blobUrl}
        download={displayName}
        target="_blank"
        rel="noopener noreferrer"
        size="small"
        sx={{
          color: isMe ? "#fff" : "#1976d2",
          bgcolor: isMe ? "rgba(255, 255, 255, 0.25)" : "rgba(25, 118, 210, 0.08)",
          flexShrink: 0,
          "&:hover": {
            bgcolor: isMe ? "rgba(255, 255, 255, 0.35)" : "rgba(25, 118, 210, 0.16)",
          },
        }}
        title="Download PDF"
      >
        <DownloadIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
