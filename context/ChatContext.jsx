"use client";

import { createContext, useContext, useState, useRef } from "react";
import { generateTitleFromResponse, streamResponse } from "@/lib";

export const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within an ChatProvider");
  }
  return context;
};

export default function ChatProvider({ children }) {
  const [currentStreamResponse, setCurrentStreamResponse] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // AbortController für alle Komponenten verfügbar
  const abortControllerRef = useRef(null);

  // ==================== RESPONSE OPERATIONS ====================
  const updateStreamResponse = (chunk) => {
    setCurrentStreamResponse(chunk || "");
  };

  // ==================== LOADING STATE ====================
  const setLoadingState = (loading) => {
    setIsLoading(loading);
  };

  // ==================== ATTACHMENT OPERATIONS ====================
  const addAttachment = (newAttachment) => {
    setAttachments((prev) => [...prev, newAttachment]);
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const clearAttachments = () => {
    setAttachments([]);
  };

  // ==================== MESSAGE SENDING ====================
  const sendMessage = async ({
    message,
    conversationId,
    model = "openai/gpt-oss-120b",
    onSuccess,
    onError,
    createConversation,
    updateConversation,
    addMessage,
    addConversationToProject,
    projectId,
    router,
  }) => {
    if (!message?.trim() && attachments.length === 0) return;
    if (isLoading) return;

    // Create new AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Prepare message with attachments
    let messageText = message.trim();

    // Store attachments for display
    const messageAttachments = attachments.map((att) => ({
      id: att.id,
      type: att.type,
      name: att.name,
      content: att.content,
      preview: att.preview,
    }));

    // Append attachment content to message for AI processing
    if (attachments.length > 0) {
      attachments.forEach((att) => {
        if (att.type === "code") {
          messageText += `\n\n\`\`\`\n${att.content}\n\`\`\``;
        } else if (att.type === "text") {
          messageText += `\n\n${att.content}`;
        }
      });
    }

    // Clear attachments
    clearAttachments();
    setIsLoading(true);

    try {
      let chatId = conversationId;

      if (!chatId) {
        const newConv = await createConversation("New Chat", model);
        chatId = newConv.id;

        if (projectId) {
          await addConversationToProject(projectId, chatId);
        }

        router?.push(`/chat/${chatId}`);
      }

      // Add user message with attachments
      await addMessage(chatId, {
        role: "user",
        content: messageText,
        model: model,
        attachments: messageAttachments,
      });

      let accumulatedResponse = "";

      await streamResponse(
        messageText,
        model,
        (chunk, accumulated) => {
          accumulatedResponse = accumulated;
          updateStreamResponse(accumulated);
        },
        false,
        50,
        abortController.signal,
      );

      // Only save if not aborted
      if (!abortController.signal.aborted) {
        await addMessage(chatId, {
          role: "assistant",
          content: accumulatedResponse,
          model: model,
        });

        if (!conversationId) {
          const title = await generateTitleFromResponse(
            messageText,
            accumulatedResponse,
            streamResponse,
          );

          await updateConversation(chatId, { title });
        }

        onSuccess?.(chatId, accumulatedResponse);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error sending message:", error);
        onError?.(error);
      }
    } finally {
      setIsLoading(false);
      updateStreamResponse("");
      abortControllerRef.current = null;
    }
  };

  // ==================== STOP GENERATION ====================
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      updateStreamResponse("");
      abortControllerRef.current = null;
    }
  };

  const values = {
    // RESPONSE
    currentStreamResponse,
    updateStreamResponse,
    // ATTACHMENTS
    attachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
    // LOADING
    isLoading,
    setLoadingState,
    // MESSAGE OPERATIONS
    sendMessage,
    stopGeneration,
  };

  return <ChatContext.Provider value={values}>{children}</ChatContext.Provider>;
}
