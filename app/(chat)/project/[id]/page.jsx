"use client";

import { ChatConversation, ChatInterface } from "@/components";

export default function ChatPage() {
  return (
    <main className="bg-neutral-900/60 w-full">
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-start">
        <ChatConversation />
        <ChatInterface />
      </div>
    </main>
  );
}
