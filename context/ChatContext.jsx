"use client";

import { createContext, useContext, useState, useRef } from "react";
import {
  generateTitleFromResponse,
  streamResponse,
  buildContextMessages,
  buildSystemPromptWithMemories,
  trimMessagesToTokenLimit,
  buildMemoryExtractionPrompt,
} from "@/lib";

export const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within an ChatProvider");
  }
  return context;
};

const extractMemoryFromConversation = async (
  userMessage,
  assistantResponse,
  existingMemories = [],
  streamResponseFn,
) => {
  try {
    const result = await streamResponseFn(
      [
        {
          role: "system",
          content: buildMemoryExtractionPrompt(existingMemories),
        },
        {
          role: "user",
          content: `User said: "${userMessage}"\n\nAssistant responded: "${assistantResponse.substring(0, 500)}"`,
        },
      ],
      "openai/gpt-oss-120b",
      null,
      false,
      50,
      null,
    );

    const cleaned = result.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { action: "none" };
  }
};

// ==================== CHAT PROVIDER ====================

export default function ChatProvider({ children }) {
  const [currentStreamResponse, setCurrentStreamResponse] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const abortControllerRef = useRef(null);

  // ==================== RESPONSE ====================

  const updateStreamResponse = (chunk) => setCurrentStreamResponse(chunk || "");
  const setLoadingState = (loading) => setIsLoading(loading);

  // ==================== ANHÄNGE ====================

  const addAttachment = (newAttachment) =>
    setAttachments((prev) => [...prev, newAttachment]);

  const removeAttachment = (id) =>
    setAttachments((prev) => prev.filter((att) => att.id !== id));

  const clearAttachments = () => setAttachments([]);

  // ==================== NACHRICHT SENDEN ====================

  const sendMessage = async ({
    message,
    conversationId,
    model = "openai/gpt-oss-120b",
    reasoning = false,
    onSuccess,
    onError,
    createConversation,
    updateConversation,
    addMessage,
    getMessages,
    addConversationToProject,
    updateUserProfile,
    userProfile,
    projectId,
    project = null, // Vollständiges Projekt-Objekt (instructions + documents)
    router,
  }) => {
    if (!message?.trim() && attachments.length === 0) return;
    if (isLoading) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let messageText = message.trim();

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

    if (reasoning) setProcessingMessage("Einen Moment – ich denke nach …");

    try {
      let chatId = conversationId;

      if (!chatId) {
        const newConv = await createConversation("New Chat", model);
        chatId = newConv.id;

        if (projectId && typeof projectId === "string") {
          await addConversationToProject(projectId, chatId);
        }

        router?.push(`/chat/${chatId}`);
      }

      let existingMessages = [];
      if (conversationId) {
        existingMessages = await getMessages(chatId, 20);
      }

      // System Prompt: Erinnerungen + Präferenzen + Projekt-Kontext
      const systemPrompt = buildSystemPromptWithMemories(
        userProfile?.memories || [],
        userProfile?.preferences?.modelPreferences || "",
        project,
      );

      const contextMessages = buildContextMessages(
        existingMessages,
        messageText,
        10,
        systemPrompt,
      );

      const trimmedMessages = trimMessagesToTokenLimit(contextMessages, 100000);

      await addMessage(chatId, {
        role: "user",
        content: messageText,
        model,
        attachments: messageAttachments,
      });

      let accumulatedResponse = "";

      const finalResponse = await streamResponse(
        trimmedMessages,
        model,
        (chunk, accumulated) => {
          accumulatedResponse = accumulated;
          updateStreamResponse(accumulated);
          if (reasoning) setProcessingMessage("");
        },
        reasoning,
        50,
        abortController.signal,
      );

      if (!abortController.signal.aborted) {
        const responseToSave = finalResponse || accumulatedResponse;

        if (!responseToSave?.trim()) {
          throw new Error("Leere Antwort vom Model erhalten");
        }

        await addMessage(chatId, {
          role: "assistant",
          content: responseToSave,
          model,
        });

        if (!conversationId) {
          try {
            const title = await generateTitleFromResponse(
              messageText,
              responseToSave,
              streamResponse,
            );
            await updateConversation(chatId, { title });
          } catch {
            await updateConversation(chatId, {
              title: messageText.substring(0, 30) + "...",
            });
          }
        }

        // Erinnerungs-Extraktion
        if (updateUserProfile) {
          try {
            const currentMemories = userProfile?.memories || [];
            const memoryResult = await extractMemoryFromConversation(
              messageText,
              responseToSave,
              currentMemories,
              streamResponse,
            );

            if (memoryResult.action === "add" && memoryResult.memory) {
              setProcessingMessage("Erinnerung wird gespeichert …");
              const newMemory = {
                id: crypto.randomUUID(),
                text: memoryResult.memory,
                createdAt: new Date().toISOString(),
                source: "auto",
              };
              await updateUserProfile({
                memories: [...currentMemories, newMemory],
              });
              setProcessingMessage("✓ Erinnerung gespeichert");
              await new Promise((r) => setTimeout(r, 1500));
            } else if (
              memoryResult.action === "update" &&
              memoryResult.id &&
              memoryResult.memory
            ) {
              setProcessingMessage("Erinnerung wird aktualisiert …");
              const updatedMemories = currentMemories.map((m) =>
                m.id === memoryResult.id
                  ? {
                      ...m,
                      text: memoryResult.memory,
                      updatedAt: new Date().toISOString(),
                    }
                  : m,
              );
              await updateUserProfile({ memories: updatedMemories });
              setProcessingMessage("✓ Erinnerung aktualisiert");
              await new Promise((r) => setTimeout(r, 1500));
            }
          } catch (memoryError) {
            console.warn(
              "Speichern der Erinnerung fehlgeschlagen:",
              memoryError,
            );
          }
        }

        onSuccess?.(chatId, responseToSave);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Fehler beim Senden der Nachricht:", error);
        onError?.(error);
      }
    } finally {
      setIsLoading(false);
      setProcessingMessage("");
      updateStreamResponse("");
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setProcessingMessage("");
      updateStreamResponse("");
      abortControllerRef.current = null;
    }
  };

  const values = {
    currentStreamResponse,
    updateStreamResponse,
    attachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
    isLoading,
    setLoadingState,
    processingMessage,
    setProcessingMessage,
    sendMessage,
    stopGeneration,
  };

  return <ChatContext.Provider value={values}>{children}</ChatContext.Provider>;
}
