"use client";

import { useEffect, useRef } from "react";
import { EmptyStateConversation, MessageList } from "@/components";
import { useChat } from "@/context";

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
      onRegenerate={onRegenerate}
      onEdit={onEdit}
    />
  );
}
