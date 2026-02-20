"use client";

import { useState, useCallback, useRef } from "react";
import {
  MessageLimitAlert,
  PublicChatConversation,
  PublicChatInterface,
} from "@/components";
import { useChat } from "@/context";
import {
  buildContextMessages,
  buildSystemPromptWithMemories,
  streamResponse,
  trimMessagesToTokenLimit,
  generateId,
} from "@/lib";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "openai/gpt-oss-120b";
const MAX_CONTEXT_MSGS = 10;
const MAX_TOKENS = 100000;
const MAX_USER_MESSAGES = 3;

// ─────────────────────────────────────────────────────────────────────────────
// Limit reached alert
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [userMessageCount, setUserMessageCount] = useState(0);

  const { isLoading, setLoadingState, setCurrentStreamResponse } = useChat();

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const limitReached = userMessageCount >= MAX_USER_MESSAGES;

  // ── Shared streaming helper ───────────────────────────────────────────────

  const streamAndAppend = useCallback(
    async (history, userMessageContent, incrementCount = false) => {
      if (isLoading) return;

      const systemPrompt = buildSystemPromptWithMemories([], "", null);
      const apiMessages = trimMessagesToTokenLimit(
        buildContextMessages(
          history,
          userMessageContent,
          MAX_CONTEXT_MSGS,
          systemPrompt,
        ),
        MAX_TOKENS,
      );

      if (incrementCount) {
        setUserMessageCount((c) => c + 1);
      }

      setLoadingState?.(true);
      setCurrentStreamResponse?.("");

      try {
        let accumulated = "";
        const finalResponse = await streamResponse(
          apiMessages,
          DEFAULT_MODEL,
          (_chunk, full) => {
            accumulated = full;
            setCurrentStreamResponse?.(full);
          },
          false,
          50,
        );

        const responseText = finalResponse || accumulated;
        if (!responseText?.trim()) throw new Error("Empty response from model");

        setMessages((prev) => [
          ...prev,
          { id: generateId(), role: "assistant", content: responseText },
        ]);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("PublicChat stream failed:", err);
        }
      } finally {
        setLoadingState?.(false);
        setCurrentStreamResponse?.("");
      }
    },
    [isLoading, setLoadingState, setCurrentStreamResponse],
  );

  // ── Intercept sends from PublicChatInterface ──────────────────────────────

  // Returning false cancels the send inside PublicChatInterface
  const handleBeforeSend = useCallback(() => {
    if (limitReached) return false;
    return true;
  }, [limitReached]);

  // Called by PublicChatInterface with (history, userContent) after it has
  // optimistically appended the user message — we stream the reply here.
  const handleAfterSend = useCallback(
    async (history, userMessageContent) => {
      await streamAndAppend(history, userMessageContent, true);
    },
    [streamAndAppend],
  );

  // ── Regenerate ────────────────────────────────────────────────────────────

  const handleRegenerate = useCallback(
    async (messageId) => {
      if (isLoading) return;

      const current = messagesRef.current;
      const index = current.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const isAssistant = current[index].role === "assistant";
      const keepUpTo = isAssistant ? index : index + 1;
      const kept = current.slice(0, keepUpTo);

      const lastUserIdx = [...kept].map((m) => m.role).lastIndexOf("user");
      if (lastUserIdx === -1) return;

      const userContent = kept[lastUserIdx].content;
      const history = kept.slice(0, lastUserIdx);

      setMessages(kept);
      // Regenerate does NOT cost an extra message
      await streamAndAppend(history, userContent, false);
    },
    [isLoading, streamAndAppend],
  );

  // ── Edit ──────────────────────────────────────────────────────────────────

  const handleEdit = useCallback(
    async (messageId, newContent) => {
      if (isLoading || !newContent?.trim()) return;

      const current = messagesRef.current;
      const index = current.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const history = current.slice(0, index);
      const editedMsg = {
        id: generateId(),
        role: "user",
        content: newContent.trim(),
      };

      setMessages([...history, editedMsg]);
      // Edit replaces an existing message — does NOT cost an extra message
      await streamAndAppend(history, newContent.trim(), false);
    },
    [isLoading, streamAndAppend],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <PublicChatConversation
        messages={messages}
        onRegenerate={handleRegenerate}
        onEdit={handleEdit}
      />

      <div className="w-full max-w-220 mx-auto px-4">
        {limitReached ? (
          <MessageLimitAlert max={MAX_USER_MESSAGES} />
        ) : (
          <PublicChatInterface
            messages={messages}
            onMessages={setMessages}
            onBeforeSend={handleBeforeSend}
            onAfterSend={handleAfterSend}
          />
        )}
      </div>
    </div>
  );
}
