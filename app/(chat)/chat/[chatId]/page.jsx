"use client";

import { ChatConversation, ChatInterface } from "@/components";
import { motion } from "framer-motion";
export default function ChatIDPage() {
  return (
    <motion.div
      className="flex flex-col h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <ChatConversation />
      <ChatInterface />
    </motion.div>
  );
}
