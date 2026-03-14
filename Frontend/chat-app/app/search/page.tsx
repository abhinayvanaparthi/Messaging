"use client";

import { useState } from "react";
import { searchUsers } from "../../services/userService";
import { createConversation } from "../../services/conversationService";
import { useChat } from "../../context/ChatContext";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";

import { 
  TextInput, 
  Button, 
  Paper, 
  Title, 
  Stack, 
  Text, 
  Alert, 
  Group, 
  Avatar, 
  Card,
  Loader,
  Center
} from "@mantine/core";

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
      // Create new conversation (or fetch existing one) with the backend
      const conversation = await createConversation(userId);
      
      // Set the active conversation in global context
      setActiveConversation(conversation);
      
      // Navigate to the chat window
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
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={2}>Find Users</Title>
            <Text c="dimmed" size="sm">Search for users by name or email to start a conversation.</Text>

            <form onSubmit={handleSearch}>
              <Group align="flex-end">
                <TextInput
                  placeholder="Enter name or email..."
                  value={query}
                  onChange={(e) => setQuery(e.currentTarget.value)}
                  style={{ flex: 1 }}
                  size="md"
                  disabled={loading}
                />
                <Button type="submit" size="md" loading={loading && results.length === 0}>
                  Search
                </Button>
              </Group>
            </form>

            {error && (
              <Alert color="blue" title="Search">
                {error}
              </Alert>
            )}

            <Stack gap="sm" mt="md">
              {loading && results.length > 0 && <Center><Loader size="sm" /></Center>}
              
              {results.map((user) => (
                <Card key={user._id} shadow="xs" padding="sm" radius="md" withBorder>
                  <Group justify="space-between" wrap="nowrap">
                    <Group wrap="nowrap">
                      <Avatar src={user.profilePic || null} radius="xl" color="blue">
                        {user.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <div>
                        <Text fw={500}>{user.name}</Text>
                        <Text size="xs" c="dimmed">{user.email}</Text>
                      </div>
                    </Group>
                    <Button 
                      variant="light" 
                      onClick={() => handleStartChat(user._id)}
                      disabled={loading}
                    >
                      Message
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Paper>
      </div>
    </ProtectedRoute>
  );
}