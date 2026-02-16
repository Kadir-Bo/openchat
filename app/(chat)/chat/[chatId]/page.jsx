"use client";

import { ChatConversation, ChatHeader, ChatInterface } from "@/components";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";

export default function ChatIDPage() {
  const [conversation, setConversation] = useState(null);

  const handleConversationLoad = useCallback(({ conversation, project }) => {
    setConversation(conversation);
  }, []);

  return (
    <motion.div
      className="flex flex-col h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <ChatHeader conversation={conversation} />
      <ChatConversation onConversationLoad={handleConversationLoad} />
      <ChatInterface />
    </motion.div>
  );
}
