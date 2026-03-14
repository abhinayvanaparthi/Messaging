"use client";

import { useEffect, useState } from "react";
import { getConversations } from "../services/conversationService";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import { ScrollArea, Stack, Card, Text, Title, Group, Button, Avatar } from "@mantine/core";
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
      <Group justify="space-between" p="md" align="center" style={{ borderBottom: "1px solid #eee" }}>
        <Title order={4}>Chats</Title>
        <CommonLink href="/search" style={{ textDecoration: "none" }}>
          <Button variant="light" size="xs" radius="xl">
            New Chat
          </Button>
        </CommonLink>
      </Group>

      <ScrollArea style={{ flex: 1 }}>
        <Stack p="sm" gap="xs">
          {conversations.length === 0 ? (
            <Text c="dimmed" ta="center" mt="xl" size="sm">No conversations yet.</Text>
          ) : (
            conversations.map((conv) => {
              // Filter out the current user and show the other participant
              const otherParticipant = conv.participants.find(
                (p) => p._id !== currentUserId
              ) || conv.participants[0] || { name: "Unknown" };

              return (
                <Card
                  key={conv._id}
                  shadow="none"
                  padding="sm"
                  withBorder
                  radius="md"
                  style={{ cursor: "pointer", transition: "background-color 0.2s" }}
                  onClick={() => setActiveConversation(conv)}
                  className="hover:bg-gray-50"
                >
                  <Group wrap="nowrap">
                    <Avatar radius="xl" color="blue">
                      {otherParticipant.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <Text size="sm" fw={500} truncate>{otherParticipant.name}</Text>
                      <Text size="xs" c="dimmed" truncate>Click to view chat</Text>
                    </div>
                  </Group>
                </Card>
              );
            })
          )}
        </Stack>
      </ScrollArea>
    </div>
  );
}