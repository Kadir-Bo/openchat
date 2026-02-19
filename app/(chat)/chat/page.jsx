"use client";

import { ChatConversation, ChatInterface } from "@/components";

export default function ChatPage() {
  return (
    <div className="max-w-220 mx-auto flex flex-col items-center justify-center h-full">
      <ChatConversation />
      <ChatInterface />
    </div>
  );
}
