"use client";

import { createContext, useContext, useState, useRef } from "react";
import {
  generateTitleFromResponse,
  streamResponse,
  buildContextMessages,
  buildSystemPromptWithMemories,
  trimMessagesToTokenLimit,
  buildMemoryExtractionPrompt,
  buildSummaryPrompt,
  extractProjectMemoryFromConversation,
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

const generateAndSaveConversationSummary = async (
  chatId,
  messages,
  userMessage,
  assistantResponse,
  updateConversation,
  streamResponseFn,
) => {
  try {
    const transcript = [
      ...messages.map(
        (m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
      ),
      `User: ${userMessage}`,
      `Assistant: ${assistantResponse}`,
    ]
      .join("\n\n")
      .substring(0, 8000);

    const summary = await streamResponseFn(
      [
        { role: "system", content: buildSummaryPrompt() },
        { role: "user", content: transcript },
      ],
      "openai/gpt-oss-120b",
      null,
      false,
      50,
      null,
    );

    await updateConversation(chatId, {
      summary: summary.trim(),
      summaryUpdatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Summary generation failed:", err);
  }
};

const fetchSiblingConversationSummaries = async (
  projectId,
  currentChatId,
  getProjectConversations,
) => {
  try {
    const siblings = await getProjectConversations(projectId);
    return siblings
      .filter((c) => c.id !== currentChatId && c.summary?.trim())
      .map((c) => ({ title: c.title || "Untitled Chat", summary: c.summary }));
  } catch {
    return [];
  }
};

// Minimum time in ms the processing indicator stays visible
const MIN_INDICATOR_MS = 1200;

// ==================== CHAT PROVIDER ====================

export default function ChatProvider({ children }) {
  const [currentStreamResponse, setCurrentStreamResponse] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const abortControllerRef = useRef(null);
  // Tracks when the current indicator was shown so we can enforce a minimum duration
  const indicatorShownAtRef = useRef(null);

  const updateStreamResponse = (chunk) => setCurrentStreamResponse(chunk || "");
  const setLoadingState = (loading) => setIsLoading(loading);

  const addAttachment = (newAttachment) =>
    setAttachments((prev) => [...prev, newAttachment]);
  const removeAttachment = (id) =>
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  const clearAttachments = () => setAttachments([]);

  /** Show the processing indicator. Records the timestamp so we can enforce
   *  a minimum display duration when hiding it. */
  const showIndicator = (text) => {
    indicatorShownAtRef.current = Date.now();
    setProcessingMessage(text);
  };

  /** Hide the indicator, but wait until at least MIN_INDICATOR_MS has passed
   *  since it was shown. This prevents a jarring flash. */
  const hideIndicator = () => {
    const shownAt = indicatorShownAtRef.current;
    if (!shownAt) {
      setProcessingMessage("");
      return;
    }
    const elapsed = Date.now() - shownAt;
    const remaining = MIN_INDICATOR_MS - elapsed;
    if (remaining <= 0) {
      setProcessingMessage("");
      indicatorShownAtRef.current = null;
    } else {
      setTimeout(() => {
        setProcessingMessage("");
        indicatorShownAtRef.current = null;
      }, remaining);
    }
  };

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
    getProjectConversations,
    updateUserProfile,
    updateProjectMemory,
    userProfile,
    projectId,
    project = null,
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
        if (att.type === "code")
          messageText += `\n\n\`\`\`\n${att.content}\n\`\`\``;
        else if (att.type === "text") messageText += `\n\n${att.content}`;
      });
    }

    let projectWithSummaries = project;
    if (
      projectId &&
      getProjectConversations &&
      conversationId &&
      project?.conversationIds?.length > 1
    ) {
      const conversationSummaries = await fetchSiblingConversationSummaries(
        projectId,
        conversationId,
        getProjectConversations,
      );
      if (conversationSummaries.length > 0) {
        projectWithSummaries = { ...project, conversationSummaries };
      }
    }

    clearAttachments();
    setIsLoading(true);
    if (reasoning) showIndicator("Einen Moment – ich denke nach …");

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

      const systemPrompt = buildSystemPromptWithMemories(
        userProfile?.memories || [],
        userProfile?.preferences?.modelPreferences || "",
        projectWithSummaries,
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
          if (reasoning) hideIndicator();
        },
        reasoning,
        50,
        abortController.signal,
      );

      if (!abortController.signal.aborted) {
        const responseToSave = finalResponse || accumulatedResponse;

        if (!responseToSave?.trim())
          throw new Error("Leere Antwort vom Model erhalten");

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

        onSuccess?.(chatId, responseToSave);

        if (projectId) {
          setTimeout(() => {
            generateAndSaveConversationSummary(
              chatId,
              existingMessages,
              messageText,
              responseToSave,
              updateConversation,
              streamResponse,
            );
          }, 0);
        }

        if (updateUserProfile && !projectId) {
          const currentMemories = userProfile?.memories || [];
          setTimeout(() => {
            extractMemoryFromConversation(
              messageText,
              responseToSave,
              currentMemories,
              streamResponse,
            )
              .then(async (result) => {
                if (result.action === "add" && result.memory) {
                  await updateUserProfile({
                    memories: [
                      ...currentMemories,
                      {
                        id: crypto.randomUUID(),
                        text: result.memory,
                        createdAt: new Date().toISOString(),
                        source: "auto",
                      },
                    ],
                  });
                } else if (
                  result.action === "update" &&
                  result.id &&
                  result.memory
                ) {
                  await updateUserProfile({
                    memories: currentMemories.map((m) =>
                      m.id === result.id
                        ? {
                            ...m,
                            text: result.memory,
                            updatedAt: new Date().toISOString(),
                          }
                        : m,
                    ),
                  });
                }
              })
              .catch((err) =>
                console.warn("User memory extraction failed:", err),
              );
          }, 0);
        }

        if (projectId && updateProjectMemory && project) {
          const currentProjectMemories = project?.memories || [];
          setTimeout(() => {
            extractProjectMemoryFromConversation(
              messageText,
              responseToSave,
              currentProjectMemories,
              streamResponse,
            )
              .then(async (result) => {
                if (result.action === "add" && result.memory) {
                  await updateProjectMemory(projectId, [
                    ...currentProjectMemories,
                    {
                      id: crypto.randomUUID(),
                      text: result.memory,
                      createdAt: new Date().toISOString(),
                      source: "auto",
                    },
                  ]);
                } else if (
                  result.action === "update" &&
                  result.id &&
                  result.memory
                ) {
                  await updateProjectMemory(
                    projectId,
                    currentProjectMemories.map((m) =>
                      m.id === result.id
                        ? {
                            ...m,
                            text: result.memory,
                            updatedAt: new Date().toISOString(),
                          }
                        : m,
                    ),
                  );
                }
              })
              .catch((err) =>
                console.warn("Project memory extraction failed:", err),
              );
          }, 0);
        }
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Fehler beim Senden der Nachricht:", error);
        onError?.(error);
      }
    } finally {
      setIsLoading(false);
      hideIndicator();
      updateStreamResponse("");
      abortControllerRef.current = null;
    }
  };

  // ==================== REGENERATE RESPONSE ====================

  const regenerateResponse = async ({
    messageId,
    conversationId,
    messages,
    model = "openai/gpt-oss-120b",
    reasoning = false,
    onSuccess,
    onError,
    deleteMessage,
    addMessage,
    getMessages,
    updateConversation,
    updateUserProfile,
    updateProjectMemory,
    userProfile,
    projectId,
    project = null,
    _keptMessages,
    _messagesToDelete,
  }) => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    showIndicator("Regenerating Response…");

    try {
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) throw new Error("Message not found");

      const targetMessage = messages[messageIndex];
      const keptMessages = _keptMessages ?? messages.slice(0, messageIndex);
      const messagesToDelete =
        _messagesToDelete ?? messages.slice(messageIndex);

      // For BOTH assistant and user regen, keptMessages always ends with the
      // user message that should be replied to (see ChatConversation slice logic).
      // We split out the last user message as the "new turn" for buildContextMessages.
      const lastUserIdx = [...keptMessages]
        .map((m) => m.role)
        .lastIndexOf("user");
      if (lastUserIdx === -1)
        throw new Error("No user message found in kept messages");

      const userMessageContent = keptMessages[lastUserIdx].content;
      const historyMessages = keptMessages.slice(0, lastUserIdx);

      // Fire-and-forget deletes — UI is already updated optimistically
      Promise.all(
        messagesToDelete.map((msg) => deleteMessage(conversationId, msg.id)),
      ).catch((err) => console.warn("Background delete failed:", err));

      const systemPrompt = buildSystemPromptWithMemories(
        userProfile?.memories || [],
        userProfile?.preferences?.modelPreferences || "",
        project,
      );

      const contextMessages = buildContextMessages(
        historyMessages,
        userMessageContent,
        10,
        systemPrompt,
      );
      const trimmedMessages = trimMessagesToTokenLimit(contextMessages, 100000);

      // The user message is already in Firestore (kept). Never re-add it.

      let accumulatedResponse = "";
      hideIndicator();

      const finalResponse = await streamResponse(
        trimmedMessages,
        model,
        (chunk, accumulated) => {
          accumulatedResponse = accumulated;
          updateStreamResponse(accumulated);
        },
        reasoning,
        50,
        abortController.signal,
      );

      if (!abortController.signal.aborted) {
        const responseToSave = finalResponse || accumulatedResponse;
        if (!responseToSave?.trim())
          throw new Error("Empty response from model");

        await addMessage(conversationId, {
          role: "assistant",
          content: responseToSave,
          model,
        });
        onSuccess?.(conversationId, responseToSave);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Fehler beim Regenerieren:", error);
        onError?.(error);
      }
    } finally {
      setIsLoading(false);
      hideIndicator();
      updateStreamResponse("");
      abortControllerRef.current = null;
    }
  };

  // ==================== EDIT USER MESSAGE ====================

  const editAndResend = async ({
    messageId,
    newContent,
    conversationId,
    messages,
    model = "openai/gpt-oss-120b",
    reasoning = false,
    onSuccess,
    onError,
    deleteMessage,
    addMessage,
    getMessages,
    updateConversation,
    updateUserProfile,
    updateProjectMemory,
    userProfile,
    projectId,
    project = null,
    _keptMessages,
    _messagesToDelete,
  }) => {
    if (!newContent?.trim()) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    showIndicator("Regenerating Response…");

    try {
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) throw new Error("Message not found");

      const keptMessages = _keptMessages ?? messages.slice(0, messageIndex);
      const messagesToDelete =
        _messagesToDelete ?? messages.slice(messageIndex);

      // Fire-and-forget deletes
      Promise.all(
        messagesToDelete.map((msg) => deleteMessage(conversationId, msg.id)),
      ).catch((err) => console.warn("Background delete failed:", err));

      const systemPrompt = buildSystemPromptWithMemories(
        userProfile?.memories || [],
        userProfile?.preferences?.modelPreferences || "",
        project,
      );
      const contextMessages = buildContextMessages(
        keptMessages,
        newContent.trim(),
        10,
        systemPrompt,
      );
      const trimmedMessages = trimMessagesToTokenLimit(contextMessages, 100000);

      // Save the edited user message
      await addMessage(conversationId, {
        role: "user",
        content: newContent.trim(),
        model,
      });

      let accumulatedResponse = "";
      hideIndicator();

      const finalResponse = await streamResponse(
        trimmedMessages,
        model,
        (chunk, accumulated) => {
          accumulatedResponse = accumulated;
          updateStreamResponse(accumulated);
        },
        reasoning,
        50,
        abortController.signal,
      );

      if (!abortController.signal.aborted) {
        const responseToSave = finalResponse || accumulatedResponse;
        if (!responseToSave?.trim())
          throw new Error("Empty response from model");

        await addMessage(conversationId, {
          role: "assistant",
          content: responseToSave,
          model,
        });
        onSuccess?.(conversationId, responseToSave);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Fehler beim Bearbeiten:", error);
        onError?.(error);
      }
    } finally {
      setIsLoading(false);
      hideIndicator();
      updateStreamResponse("");
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      hideIndicator();
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
    regenerateResponse,
    editAndResend,
    stopGeneration,
  };

  return <ChatContext.Provider value={values}>{children}</ChatContext.Provider>;
}
