"use client";

import { ChatConversation, ChatInterface } from "@/components";

export default function ChatPage() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-start h-full">
      <ChatConversation />
      <ChatInterface />
    </div>
  );
}
