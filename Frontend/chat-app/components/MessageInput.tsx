"use client";

import { useState } from "react";
import { useChat } from "../context/ChatContext";
import { sendMessage } from "../services/messageService";
import { TextInput, ActionIcon, Group } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";

type MessageInputProps = {
  onMessageSent?: (message: any) => void;
};

export default function MessageInput({ onMessageSent }: MessageInputProps) {
  const { activeConversation } = useChat();
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!message || !activeConversation) {
      console.error("Cannot send: missing message or conversation", { 
        hasMessage: !!message, 
        activeConversation 
      });
      return;
    }

    console.log("Sending message to conversation:", activeConversation._id);

    try {
      const sentMessage = await sendMessage(activeConversation._id, message);
      setMessage("");
      if (onMessageSent) {
        onMessageSent(sentMessage);
      }
    } catch (error: any) {
      console.error("Error sending message:", error.response?.data || error.message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Group p="md" style={{ borderTop: "1px solid #eee", backgroundColor: "white" }}>
      <TextInput
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        style={{ flex: 1 }}
        size="md"
        radius="xl"
        rightSection={
          <ActionIcon 
            size={32} 
            radius="xl" 
            color="blue" 
            variant="filled" 
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <IconSend size="1.1rem" stroke={1.5} />
          </ActionIcon>
        }
        rightSectionWidth={42}
      />
    </Group>
  );
}