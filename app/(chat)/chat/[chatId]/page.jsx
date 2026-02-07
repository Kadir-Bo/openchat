"use client";

import { ChatConversation, ChatInterface } from "@/components";

export default function ChatIDPage() {
  return (
    <main className="bg-neutral-900/60 w-full min-h-screen">
      <div className="flex flex-col h-screen">
        <ChatConversation />
        <ChatInterface />
      </div>
    </main>
  );
}
