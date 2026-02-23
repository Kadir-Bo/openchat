"use client";

import { ChatConversation, ChatInterface } from "@/components";
import { useDatabase } from "@/context";
import { motion } from "framer-motion";
import { useState, useCallback, useEffect, useRef } from "react";

export default function ChatIDPage() {
  const { subscribeToConversation } = useDatabase();

  const [conversationId, setConversationId] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [project, setProject] = useState(null);
  const [interfaceHeight, setInterfaceHeight] = useState(240);

  const interfaceRef = useRef(null);

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

  useEffect(() => {
    const el = interfaceRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setInterfaceHeight(entry.contentRect.height);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 relative flex flex-col"
    >
      <ChatConversation
        onConversationLoad={handleConversationLoad}
        bottomPadding={interfaceHeight}
      />
      <div
        ref={interfaceRef}
        className="absolute bottom-10 left-0 right-0 z-998 bg-[rgb(15,15,15)] flex justify-center items-start"
      >
        <ChatInterface project_id={project?.id ?? null} project={project} />
      </div>
    </motion.div>
  );
}
