"use client";

import { ChatConversation, ChatInterface } from "@/components";

export default function ChatPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <ChatConversation />
      <div className="w-full px-4">
        <ChatInterface />
      </div>
    </div>
  );
}
