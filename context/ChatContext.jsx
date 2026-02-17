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

// ==================== CHAT PROVIDER ====================

export default function ChatProvider({ children }) {
  const [currentStreamResponse, setCurrentStreamResponse] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const abortControllerRef = useRef(null);

  const updateStreamResponse = (chunk) => setCurrentStreamResponse(chunk || "");
  const setLoadingState = (loading) => setIsLoading(loading);

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

    // Fetch sibling summaries BEFORE setIsLoading to avoid mid-send re-renders
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
          if (reasoning) setProcessingMessage("");
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

        // ── User sees the response — nothing below blocks them ──
        onSuccess?.(chatId, responseToSave);

        // ── Background: conversation summary (project chats only) ──
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

        // ── Background: user memory (non-project chats only) ──
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

        // ── Background: project memory (project chats only) ──
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
