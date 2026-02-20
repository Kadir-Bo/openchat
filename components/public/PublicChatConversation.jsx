"use client";

import { useEffect, useRef } from "react";
import {
  EmptyStateConversation,
  MessageBubble,
  ProcessingIndicator,
} from "@/components";
import { useChat } from "@/context";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: message list
// ─────────────────────────────────────────────────────────────────────────────

function MessageList({
  messages,
  currentStreamResponse,
  processingMessage,
  endRef,
}) {
  return (
    <div className="flex-1 w-full overflow-y-auto py-8 px-4 pt-24 relative">
      <div className="space-y-3 max-w-220 mx-auto">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {!!currentStreamResponse?.trim() && (
          <MessageBubble
            message={{
              id: "streaming",
              role: "assistant",
              content: currentStreamResponse,
            }}
          />
        )}

        {!!processingMessage && (
          <div className="flex justify-start px-1">
            <ProcessingIndicator message={processingMessage} />
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function PublicChatConversation({
  messages = [],
  onRegenerate,
  onEdit,
}) {
  const { currentStreamResponse, processingMessage } = useChat();
  const messagesEndRef = useRef(null);

  const lastMessage = messages.at(-1);
  const isStreaming =
    !!currentStreamResponse?.trim() && lastMessage?.role !== "assistant";
  const isEmpty = messages.length === 0 && !isStreaming && !processingMessage;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages, currentStreamResponse, processingMessage]);

  if (isEmpty) return <EmptyStateConversation />;

  return (
    <MessageList
      messages={messages}
      currentStreamResponse={isStreaming ? currentStreamResponse : null}
      processingMessage={processingMessage}
      endRef={messagesEndRef}
    />
  );
}
