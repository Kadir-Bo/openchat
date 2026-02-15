"use client";

import { createContext, useContext, useState, useRef } from "react";
import {
  generateTitleFromResponse,
  streamResponse,
  buildContextMessages,
  trimMessagesToTokenLimit,
} from "@/lib";
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

  // ==================== MESSAGE OPERATIONS ====================
  const sendMessage = async ({
    message,
    conversationId,
    model = "openai/gpt-oss-120b",
    onSuccess,
    onError,
    createConversation,
    updateConversation,
    addMessage,
    getMessages,
    addConversationToProject,
    projectId,
    router,
  }) => {
    if (!message?.trim() && attachments.length === 0) return;
    if (isLoading) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let messageText = message.trim();

    // Store attachments for display
    const messageAttachments = attachments.map((att) => ({
      id: att.id,
      type: att.type,
      name: att.name,
      content: att.content,
      preview: att.preview,
    }));

    if (attachments.length > 0) {
      attachments.forEach((att) => {
        if (att.type === "code") {
          messageText += `\n\n\`\`\`\n${att.content}\n\`\`\``;
        } else if (att.type === "text") {
          messageText += `\n\n${att.content}`;
        }
      });
    }

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

      // Hole Messages
      let existingMessages = [];

      if (conversationId) {
        existingMessages = await getMessages(chatId, 20);
        console.log("📚 Existing messages:", existingMessages.length);
      }

      const contextMessages = buildContextMessages(
        existingMessages,
        messageText,
        10,
      );

      console.log("📨 Context messages built:", contextMessages); // ← DEBUG

      const trimmedMessages = trimMessagesToTokenLimit(contextMessages, 100000);

      console.log("✂️ Trimmed messages:", trimmedMessages); // ← DEBUG

      // Speichere User-Message BEVOR wir die API aufrufen
      await addMessage(chatId, {
        role: "user",
        content: messageText,
        model: model,
        attachments: messageAttachments,
      });

      let accumulatedResponse = "";

      const finalResponse = await streamResponse(
        trimmedMessages,
        model,
        (chunk, accumulated) => {
          accumulatedResponse = accumulated;
          updateStreamResponse(accumulated);
        },
        false,
        50,
        abortController.signal,
      );

      console.log("✅ Final response:", finalResponse?.substring(0, 100)); // ← DEBUG
      console.log(
        "📊 Accumulated from callback:",
        accumulatedResponse?.substring(0, 100),
      ); // ← DEBUG

      // Only save if not aborted
      if (!abortController.signal.aborted) {
        const responseToSave = finalResponse || accumulatedResponse;

        if (!responseToSave || !responseToSave.trim()) {
          console.error("❌ Empty response! Not saving.");
          throw new Error("Leere Antwort vom Model erhalten");
        }

        console.log(
          "💾 Saving assistant message:",
          responseToSave.length,
          "chars",
        );

        await addMessage(chatId, {
          role: "assistant",
          content: responseToSave,
          model: model,
        });

        if (!conversationId) {
          try {
            console.log("🏷️ Generating title...");
            const title = await generateTitleFromResponse(
              messageText,
              responseToSave,
              streamResponse,
            );
            console.log("✅ Title generated:", title);
            await updateConversation(chatId, { title });
          } catch (titleError) {
            console.warn(
              "⚠️ Title generation failed, using fallback:",
              titleError.message,
            );
            const fallbackTitle = messageText.substring(0, 30) + "...";
            await updateConversation(chatId, { title: fallbackTitle });
          }
        }

        onSuccess?.(chatId, responseToSave);
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
