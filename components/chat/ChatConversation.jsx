"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAuth, useChat, useDatabase } from "@/context";
import { MessageBubble, ProcessingIndicator } from "@/components";
import { formatUsername } from "@/lib";
import useTypewriter from "@/hooks/useTypewriter";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "openai/gpt-oss-120b";

// ─────────────────────────────────────────────────────────────────────────────
// Typewriter animation — public / logged-out empty state
// ─────────────────────────────────────────────────────────────────────────────

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
  const text = useTypewriter(EXAMPLE_TASKS);

  const messagesEndRef = useRef(null);
  // When true, incoming Firestore snapshots are ignored so we control the
  // messages state ourselves during optimistic updates.
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

  // ── Shared context args (passed to both regen + edit) ────────────────────

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

      // Assistant message → keep everything before it (user message stays).
      // User message      → keep itself + everything before it.
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

      // Keep everything strictly before the edited message.
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

  if (loading) {
    return;
  }

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center w-full mb-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-neutral-300 mb-2">
            Welcome back, {user.displayName || formatUsername(user.email)}
          </h2>
          <p className="text-neutral-500">
            Start a conversation by typing a message below
          </p>
        </div>
      </div>
    );
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
