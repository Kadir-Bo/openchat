"use client";

import { useEffect, useRef } from "react";
import { MessageBubble, ProcessingIndicator } from "@/components";
import { useChat } from "@/context";
import useTypewriter from "@/hooks/useTypewriter";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
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

export default function PublicChatConversation({
  messages = [],
  onRegenerate,
  onEdit,
}) {
  const { currentStreamResponse, processingMessage } = useChat();
  const messagesEndRef = useRef(null);
  const text = useTypewriter(EXAMPLE_TASKS);

  // ── Auto-scroll ──────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages, currentStreamResponse, processingMessage]);

  // ── Derived display state ─────────────────────────────────────────────────

  const lastMessage = messages.at(-1);
  const isStreamingComplete = lastMessage?.role === "assistant";
  const shouldShowStream =
    !!currentStreamResponse?.trim() && !isStreamingComplete;
  const showIndicator = !!processingMessage;

  // ── Empty state ───────────────────────────────────────────────────────────

  if (messages.length === 0 && !shouldShowStream && !showIndicator) {
    return (
      <div className="flex items-center justify-center w-full mb-12">
        <div className="text-center px-4 max-w-xl">
          <h2 className="text-2xl font-semibold text-neutral-300">
            {text}
            <span
              aria-hidden="true"
              className="inline-block ml-0.5 w-0.5 h-6 bg-neutral-400 align-middle animate-[blink_1s_step-end_infinite]"
            />
          </h2>
          <p className="mt-2 text-neutral-500">
            Start a conversation by typing a message below
          </p>
        </div>
      </div>
    );
  }

  // ── Conversation ──────────────────────────────────────────────────────────

  return (
    <div className="flex-1 w-full overflow-y-auto py-8 px-4 pt-24 relative">
      <div className="space-y-3 max-w-220 mx-auto">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onRegenerate={onRegenerate}
            onEdit={onEdit}
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
