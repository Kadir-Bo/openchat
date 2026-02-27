"use client";

import { ChatConversation, ChatInterface } from "@/components";
import { usePathname } from "next/navigation";

export default function ChatPage() {
  const pathname = usePathname();
  pathname === "/chat";
  return (
    <div className="flex flex-col items-center justify-center h-full -translate-y-24">
      <ChatConversation />
      <div className="w-full px-4">
        <ChatInterface />
      </div>
    </div>
  );
}
