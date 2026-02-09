"use client";

import { ChatConversation, ChatInterface } from "@/components";

export default function ChatIDPage() {
  return (
    <div className="flex flex-col h-dvh">
      <ChatConversation />
      <ChatInterface />
    </div>
  );
}
