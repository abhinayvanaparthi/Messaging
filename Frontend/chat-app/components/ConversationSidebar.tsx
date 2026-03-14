"use client";

import { useEffect, useState } from "react";
import { getConversations } from "../services/conversationService";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import {
  Box,
  Stack,
  Card,
  CardActionArea,
  Typography,
  Button,
  Avatar,
} from "@mui/material";
import CommonLink from "./CommonLink";

type User = {
  _id: string;
  name: string;
  email: string;
};

type Conversation = {
  _id: string;
  participants: User[];
};

export default function ConversationSidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { setActiveConversation } = useChat();
  const { token } = useAuth();

  const currentUserId = token ? (jwtDecode(token) as { id: string }).id : null;

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations();
        setConversations(data);
      } catch (error) {
        console.error("Error loading conversations", error);
      }
    };

    fetchConversations();
  }, []);

  return (
    <div style={{ width: 320, borderRight: "1px solid #eee", height: "100vh", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, borderBottom: "1px solid #eee" }}>
        <Typography variant="h6">Chats</Typography>
        <CommonLink href="/search" style={{ textDecoration: "none" }}>
          <Button variant="outlined" size="small" sx={{ borderRadius: 4 }}>
            New Chat
          </Button>
        </CommonLink>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <Stack spacing={1} sx={{ p: 1 }}>
          {conversations.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
              No conversations yet.
            </Typography>
          ) : (
            conversations.map((conv) => {
              // Filter out the current user and show the other participant
              const otherParticipant = conv.participants.find(
                (p) => p._id !== currentUserId
              ) || conv.participants[0] || { name: "Unknown" };

              return (
                <Card
                  key={conv._id}
                  variant="outlined"
                  sx={{ borderRadius: 2, transition: "background-color 0.2s" }}
                >
                  <CardActionArea
                    onClick={() => setActiveConversation(conv)}
                    sx={{ p: 1.5 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: "#1976d2" }}>
                        {otherParticipant.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {otherParticipant.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          Click to view chat
                        </Typography>
                      </div>
                    </Box>
                  </CardActionArea>
                </Card>
              );
            })
          )}
        </Stack>
      </Box>
    </div>
  );
}