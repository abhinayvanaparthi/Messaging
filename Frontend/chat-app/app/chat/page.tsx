"use client";

import ProtectedRoute from "../../components/ProtectedRoute";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <div>Chat Page</div>
    </ProtectedRoute>
  );
}