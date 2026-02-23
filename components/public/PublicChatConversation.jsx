"use client";

import { useEffect } from "react";
import {
  EmptyStateConversation,
  MessageBubble,
  ProcessingIndicator,
} from "@/components";
import { useChat } from "@/context";
import { useScrollLock } from "@/hooks";

export default function PublicChatConversation({
  messages = [],
  onRegenerate,
  onEdit,
}) {
  const { currentStreamResponse, processingMessage } = useChat();

  const { containerRef, handleScroll, scrollToBottom, scrollToBottomIfLocked } =
    useScrollLock({ threshold: 80 });

  const lastMessage = messages.at(-1);
  const isStreaming =
    !!currentStreamResponse?.trim() && lastMessage?.role !== "assistant";
  const isEmpty = messages.length === 0 && !isStreaming && !processingMessage;

  // ── Scroll ───────────────────────────────────────────────────────────────

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  useEffect(() => {
    if (!currentStreamResponse) return;
    scrollToBottomIfLocked();
  }, [currentStreamResponse]);

  useEffect(() => {
    if (!processingMessage) return;
    scrollToBottom();
  }, [processingMessage]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (isEmpty) return <EmptyStateConversation />;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 min-h-0 w-full overflow-y-auto py-8 px-4 pt-24"
    >
      <div className="space-y-3 max-w-220 mx-auto">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onRegenerate={onRegenerate}
            onEdit={onEdit}
          />
        ))}

        {isStreaming && (
          <MessageBubble
            message={{
              id: "streaming",
              role: "assistant",
              content: currentStreamResponse,
            }}
            onRegenerate={onRegenerate}
            onEdit={onEdit}
          />
        )}

        {!!processingMessage && (
          <div className="flex justify-start px-1">
            <ProcessingIndicator message={processingMessage} />
          </div>
        )}
      </div>
    </div>
  );
}
