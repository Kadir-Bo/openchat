"use client";

import { ChatConversation, ChatInterface } from "@/components";

export default function ChatPage() {
  return (
    <main className="bg-neutral-900/40 flex-1">
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-start h-full">
        <ChatConversation />
        <ChatInterface />
      </div>
    </main>
  );
}
