"use client";

import { useState } from "react";
import { searchUsers } from "../../services/userService";
import { createConversation } from "../../services/conversationService";
import { useChat } from "../../context/ChatContext";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";

import {
  TextField,
  Button,
  Paper,
  Typography,
  Stack,
  Alert,
  Box,
  Avatar,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";

// Define the User type based on backend User.js
type User = {
  _id: string;
  name: string;
  email: string;
  profilePic?: string;
  isOnline?: boolean;
};

export default function SearchUsersPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setActiveConversation } = useChat();
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const data = await searchUsers(query);
      setResults(data);
      if (data.length === 0) {
        setError("No users found matching your search.");
      }
    } catch (err: any) {
      console.error("Search failed", err);
      setError("Failed to search for users. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (userId: string) => {
    try {
      setLoading(true);
      const conversation = await createConversation(userId);
      setActiveConversation(conversation);
      router.push("/chat");
    } catch (err: any) {
      console.error("Failed to start conversation", err);
      setError("Failed to start a conversation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", height: "100vh" }}>
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Typography variant="h5">Find Users</Typography>
            <Typography variant="body2" color="text.secondary">
              Search for users by name or email to start a conversation.
            </Typography>

            <form onSubmit={handleSearch}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                <TextField
                  placeholder="Enter name or email..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  sx={{ flex: 1 }}
                  size="medium"
                  disabled={loading}
                  fullWidth
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading && results.length === 0}
                  sx={{ height: 56 }}
                >
                  {loading && results.length === 0 ? <CircularProgress size={24} color="inherit" /> : "Search"}
                </Button>
              </Box>
            </form>

            {error && (
              <Alert severity="info">
                {error}
              </Alert>
            )}

            <Stack spacing={1} sx={{ mt: 2 }}>
              {loading && results.length > 0 && (
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              
              {results.map((user) => (
                <Card key={user._id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "nowrap" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "nowrap" }}>
                        <Avatar src={user.profilePic || undefined} sx={{ bgcolor: "#1976d2" }}>
                          {user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                          <Typography fontWeight={500}>{user.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                        </div>
                      </Box>
                      <Button 
                        variant="outlined" 
                        onClick={() => handleStartChat(user._id)}
                        disabled={loading}
                      >
                        Message
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Paper>
      </div>
    </ProtectedRoute>
  );
}