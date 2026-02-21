"use client";

import { ChatConversation, ChatInterface } from "@/components";
import { useDatabase } from "@/context";
import { motion } from "framer-motion";
import { useState, useCallback, useEffect } from "react";

export default function ChatIDPage() {
  const { subscribeToConversation } = useDatabase();

  const [conversationId, setConversationId] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [project, setProject] = useState(null);

  const handleConversationLoad = useCallback(({ conversation, project }) => {
    setConversationId(conversation.id);
    setProject(project ?? null);
    setConversation(conversation);
  }, []);

  useEffect(() => {
    if (!conversationId || !subscribeToConversation) return;

    const unsubscribe = subscribeToConversation(conversationId, (updated) => {
      setConversation(updated);
    });

    return () => unsubscribe?.();
  }, [conversationId, subscribeToConversation]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 relative"
    >
      <ChatConversation onConversationLoad={handleConversationLoad} />
      <ChatInterface project_id={project?.id ?? null} project={project} />
    </motion.div>
  );
}
