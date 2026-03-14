"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import ConversationSidebar from "../../components/ConversationSidebar";
import ChatWindow from "../../components/ChatWindow";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <div style={{ display: "flex" }}>
        <ConversationSidebar />
        <ChatWindow />
      </div>
    </ProtectedRoute>
  );
}