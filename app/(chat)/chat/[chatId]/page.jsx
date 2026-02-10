"use client";

import { ChatConversation, ChatInterface } from "@/components";
import { motion } from "framer-motion";
export default function ChatIDPage() {
  return (
    <main className="bg-neutral-900/60 w-full min-h-screen">
      <motion.div
        className="flex flex-col h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <ChatConversation />
        <ChatInterface />
      </motion.div>
    </main>
  );
}
