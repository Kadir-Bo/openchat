"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useAuth, useChat, useDatabase } from "@/context";
import {
  EmptyStateConversation,
  MessageBubble,
  ProcessingIndicator,
} from "@/components";
import { PhraseCarousel } from "@/components";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "openai/gpt-oss-120b";

const EXAMPLE_TASKS = [
  "Write a cover letter",
  "Explain quantum entanglement",
  "Brainstorm startup ideas",
  "Refactor this Python script",
  "Draft a cold outreach email",
  "Summarize this research paper",
  "Generate a logo concept brief",
  "Plan a 7-day trip to Japan",
  "Come up with a product tagline",
];

const HIGHLIGHT_WORDS = new Set([
  "cover letter",
  "quantum entanglement",
  "startup ideas",
  "Python",
  "cold outreach",
  "research paper",
  "logo",
  "Japan",
  "tagline",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatConversation({ onConversationLoad = null }) {
  const { chatId: conversationId } = useParams() ?? {};
  const router = useRouter();

  const { user } = useAuth();

  const {
    subscribeToMessages,
    getConversation,
    getProject,
    deleteMessage,
    addMessage,
    getMessages,
    updateConversation,
    updateUserProfile,
    updateProjectMemory,
    userProfile,
  } = useDatabase();

  const {
    currentStreamResponse,
    processingMessage,
    regenerateResponse,
    editAndResend,
    isLoading,
  } = useChat();

  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(!!conversationId);

  const messagesEndRef = useRef(null);
  const suppressListenerRef = useRef(false);

  // ── Scroll ───────────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages, currentStreamResponse, processingMessage]);

  // ── Load conversation + project ──────────────────────────────────────────

  useEffect(() => {
    if (!conversationId) return;

    const load = async () => {
      setLoading(true);
      try {
        const conv = await getConversation(conversationId);
        if (!conv) {
          router.push("/chat");
          return;
        }

        setConversation(conv);

        const proj = conv.projectId ? await getProject(conv.projectId) : null;
        setProject(proj);
        onConversationLoad?.({ conversation: conv, project: proj });
      } catch (err) {
        console.error("Failed to load conversation:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [conversationId, getConversation, getProject, router]);

  // ── Realtime message listener ────────────────────────────────────────────

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToMessages(conversationId, (incoming) => {
      if (suppressListenerRef.current) return;
      setMessages(incoming);
    });

    return () => unsubscribe();
  }, [conversationId, subscribeToMessages]);

  // ── Shared context args ───────────────────────────────────────────────────

  const sharedArgs = {
    conversationId,
    model: conversation?.model || DEFAULT_MODEL,
    deleteMessage,
    addMessage,
    getMessages,
    updateConversation,
    updateUserProfile,
    updateProjectMemory,
    userProfile,
    projectId: conversation?.projectId || null,
    project,
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleRegenerate = useCallback(
    async (messageId) => {
      if (isLoading) return;

      const index = messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const keepUpTo = messages[index].role === "user" ? index + 1 : index;
      const keptMessages = messages.slice(0, keepUpTo);
      const messagesToDelete = messages.slice(keepUpTo);

      suppressListenerRef.current = true;
      setMessages(keptMessages);

      try {
        await regenerateResponse({
          ...sharedArgs,
          messageId,
          messages,
          _keptMessages: keptMessages,
          _messagesToDelete: messagesToDelete,
        });
      } finally {
        suppressListenerRef.current = false;
      }
    },
    [isLoading, messages, sharedArgs, regenerateResponse],
  );

  const handleEdit = useCallback(
    async (messageId, newContent) => {
      if (isLoading) return;

      const index = messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const keptMessages = messages.slice(0, index);
      const messagesToDelete = messages.slice(index);

      suppressListenerRef.current = true;
      setMessages(keptMessages);

      try {
        await editAndResend({
          ...sharedArgs,
          messageId,
          newContent,
          messages,
          _keptMessages: keptMessages,
          _messagesToDelete: messagesToDelete,
        });
      } finally {
        suppressListenerRef.current = false;
      }
    },
    [isLoading, messages, sharedArgs, editAndResend],
  );

  // ── Derived display state ─────────────────────────────────────────────────

  const lastMessage = messages.at(-1);
  const isStreamingComplete = lastMessage?.role === "assistant";
  const shouldShowStream =
    !!currentStreamResponse?.trim() && !isStreamingComplete;
  const showIndicator = !!processingMessage;

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return null;

  if (!conversationId) {
    return <EmptyStateConversation />;
  }

  return (
    <div className="flex-1 w-full overflow-y-auto py-8 px-4">
      <div className="space-y-3 max-w-220 mx-auto">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onRegenerate={handleRegenerate}
            onEdit={handleEdit}
          />
        ))}

        {shouldShowStream && (
          <MessageBubble
            message={{
              id: "streaming",
              role: "assistant",
              content: currentStreamResponse,
            }}
          />
        )}

        {showIndicator && (
          <div className="flex justify-start px-1">
            <ProcessingIndicator message={processingMessage} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
