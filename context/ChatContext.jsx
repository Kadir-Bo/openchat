"use client";

import { createContext, useContext, useRef, useState } from "react";
import {
  buildSystemPromptWithMemories,
  generateTitleFromResponse,
  streamResponse,
  extractAndSaveProjectMemory,
  extractAndSaveUserMemory,
  generateAndSaveConversationSummary,
  fetchSiblingConversationSummaries,
  buildApiMessages,
} from "@/lib";

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

export const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "openai/gpt-oss-120b";
const MIN_INDICATOR_MS = 1200;
const MAX_CONTEXT_MSGS = 10;
const MAX_TOKENS = 100000;

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatProvider({ children }) {
  const [currentStreamResponse, setCurrentStreamResponse] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const abortControllerRef = useRef(null);
  const indicatorShownAtRef = useRef(null);

  // ── Attachment helpers ───────────────────────────────────────────────────

  const addAttachment = (a) => setAttachments((prev) => [...prev, a]);
  const removeAttachment = (id) =>
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  const clearAttachments = () => setAttachments([]);

  // ── Indicator helpers ────────────────────────────────────────────────────

  const showIndicator = (text) => {
    indicatorShownAtRef.current = Date.now();
    setProcessingMessage(text);
  };

  const hideIndicator = () => {
    const elapsed = Date.now() - (indicatorShownAtRef.current ?? Date.now());
    const remaining = MIN_INDICATOR_MS - elapsed;

    const clear = () => {
      setProcessingMessage("");
      indicatorShownAtRef.current = null;
    };

    remaining > 0 ? setTimeout(clear, remaining) : clear();
  };

  // ── Stream helpers ───────────────────────────────────────────────────────

  const resetStreamState = () => {
    setCurrentStreamResponse("");
    setIsLoading(false);
    abortControllerRef.current = null;
  };

  const startStream = () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);
    return controller;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // sendMessage
  // ─────────────────────────────────────────────────────────────────────────

  const sendMessage = async ({
    message,
    conversationId,
    model = DEFAULT_MODEL,
    reasoning = false,
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
    onSuccess,
    onError,
  }) => {
    if ((!message?.trim() && attachments.length === 0) || isLoading) return;

    const controller = startStream();
    if (reasoning) showIndicator("Einen Moment – ich denke nach …");

    // ── Build message text (inline attachment content) ─────────────────────
    let messageText = message.trim();
    const messageAttachments = attachments.map(
      ({ id, type, name, content, preview }) => ({
        id,
        type,
        name,
        content,
        preview,
      }),
    );

    attachments.forEach((att) => {
      if (att.type === "code")
        messageText += `\n\n\`\`\`\n${att.content}\n\`\`\``;
      else if (att.type === "text") messageText += `\n\n${att.content}`;
    });

    clearAttachments();

    try {
      // ── Resolve / create conversation ────────────────────────────────────
      let chatId = conversationId;

      if (!chatId) {
        const newConv = await createConversation("New Chat", model);
        chatId = newConv.id;
        if (projectId && typeof projectId === "string") {
          await addConversationToProject(projectId, chatId);
        }
        router?.push(`/chat/${chatId}`);
      }

      // ── Inject sibling summaries into project context ────────────────────
      let projectContext = project;
      if (projectId && conversationId && project?.conversationIds?.length > 1) {
        const summaries = await fetchSiblingConversationSummaries(
          projectId,
          conversationId,
          getProjectConversations,
        );
        if (summaries.length > 0) {
          projectContext = { ...project, conversationSummaries: summaries };
        }
      }

      // ── Build API payload ────────────────────────────────────────────────
      const existingMessages = conversationId
        ? await getMessages(chatId, 20)
        : [];
      const systemPrompt = buildSystemPromptWithMemories(
        userProfile?.memories || [],
        userProfile?.preferences?.modelPreferences || "",
        projectContext,
      );
      const apiMessages = buildApiMessages(
        existingMessages,
        messageText,
        systemPrompt,
        MAX_CONTEXT_MSGS,
        MAX_TOKENS,
      );

      await addMessage(chatId, {
        role: "user",
        content: messageText,
        model,
        attachments: messageAttachments,
      });

      // ── Stream ───────────────────────────────────────────────────────────
      let accumulated = "";
      const finalResponse = await streamResponse(
        apiMessages,
        model,
        (chunk, full) => {
          accumulated = full;
          setCurrentStreamResponse(full);
          if (reasoning) hideIndicator();
        },
        reasoning,
        50,
        controller.signal,
      );

      if (controller.signal.aborted) return;

      const responseText = finalResponse || accumulated;
      if (!responseText?.trim()) throw new Error("Empty response from model");

      await addMessage(chatId, {
        role: "assistant",
        content: responseText,
        model,
      });

      // ── Title generation (new conversations only) ────────────────────────
      if (!conversationId) {
        const title = await generateTitleFromResponse(
          messageText,
          responseText,
          streamResponse,
        ).catch(() => messageText.substring(0, 30) + "...");
        await updateConversation(chatId, { title });
      }

      onSuccess?.(chatId, responseText);

      // ── Fire-and-forget background tasks ────────────────────────────────
      if (projectId) {
        setTimeout(
          () =>
            generateAndSaveConversationSummary(
              chatId,
              existingMessages,
              messageText,
              responseText,
              updateConversation,
            ),
          0,
        );
      }

      if (updateUserProfile && !projectId) {
        setTimeout(
          () =>
            extractAndSaveUserMemory(
              messageText,
              responseText,
              userProfile?.memories || [],
              updateUserProfile,
            ),
          0,
        );
      }

      if (projectId && updateProjectMemory && project) {
        setTimeout(
          () =>
            extractAndSaveProjectMemory(
              messageText,
              responseText,
              projectId,
              project?.memories || [],
              updateProjectMemory,
            ),
          0,
        );
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("sendMessage failed:", error);
        onError?.(error);
      }
    } finally {
      resetStreamState();
      hideIndicator();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // regenerateResponse
  // ─────────────────────────────────────────────────────────────────────────

  const regenerateResponse = async ({
    conversationId,
    messages,
    model = DEFAULT_MODEL,
    reasoning = false,
    deleteMessage,
    addMessage,
    userProfile,
    project = null,
    _keptMessages,
    _messagesToDelete,
    onSuccess,
    onError,
  }) => {
    const controller = startStream();
    showIndicator("Regenerating response…");

    try {
      const keptMessages = _keptMessages ?? messages;
      const messagesToDelete = _messagesToDelete ?? [];

      // Delete old messages in the background — UI is already updated optimistically
      Promise.all(
        messagesToDelete.map((m) => deleteMessage(conversationId, m.id)),
      ).catch((err) => console.warn("Background delete failed:", err));

      // The last user message in keptMessages is the prompt to reply to
      const lastUserIdx = [...keptMessages]
        .map((m) => m.role)
        .lastIndexOf("user");
      if (lastUserIdx === -1) throw new Error("No user message found");

      const userMessageContent = keptMessages[lastUserIdx].content;
      const history = keptMessages.slice(0, lastUserIdx);

      const systemPrompt = buildSystemPromptWithMemories(
        userProfile?.memories || [],
        userProfile?.preferences?.modelPreferences || "",
        project,
      );
      const apiMessages = buildApiMessages(
        history,
        userMessageContent,
        systemPrompt,
      );

      hideIndicator();

      let accumulated = "";
      const finalResponse = await streamResponse(
        apiMessages,
        model,
        (chunk, full) => {
          accumulated = full;
          setCurrentStreamResponse(full);
        },
        reasoning,
        50,
        controller.signal,
      );

      if (controller.signal.aborted) return;

      const responseText = finalResponse || accumulated;
      if (!responseText?.trim()) throw new Error("Empty response from model");

      await addMessage(conversationId, {
        role: "assistant",
        content: responseText,
        model,
      });
      onSuccess?.(conversationId, responseText);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("regenerateResponse failed:", error);
        onError?.(error);
      }
    } finally {
      resetStreamState();
      hideIndicator();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // editAndResend
  // ─────────────────────────────────────────────────────────────────────────

  const editAndResend = async ({
    newContent,
    conversationId,
    messages,
    model = DEFAULT_MODEL,
    reasoning = false,
    deleteMessage,
    addMessage,
    userProfile,
    project = null,
    _keptMessages,
    _messagesToDelete,
    onSuccess,
    onError,
  }) => {
    if (!newContent?.trim()) return;

    const controller = startStream();
    showIndicator("Regenerating response…");

    try {
      const keptMessages = _keptMessages ?? [];
      const messagesToDelete = _messagesToDelete ?? messages;

      Promise.all(
        messagesToDelete.map((m) => deleteMessage(conversationId, m.id)),
      ).catch((err) => console.warn("Background delete failed:", err));

      const systemPrompt = buildSystemPromptWithMemories(
        userProfile?.memories || [],
        userProfile?.preferences?.modelPreferences || "",
        project,
      );
      const apiMessages = buildApiMessages(
        keptMessages,
        newContent.trim(),
        systemPrompt,
      );

      await addMessage(conversationId, {
        role: "user",
        content: newContent.trim(),
        model,
      });

      hideIndicator();

      let accumulated = "";
      const finalResponse = await streamResponse(
        apiMessages,
        model,
        (chunk, full) => {
          accumulated = full;
          setCurrentStreamResponse(full);
        },
        reasoning,
        50,
        controller.signal,
      );

      if (controller.signal.aborted) return;

      const responseText = finalResponse || accumulated;
      if (!responseText?.trim()) throw new Error("Empty response from model");

      await addMessage(conversationId, {
        role: "assistant",
        content: responseText,
        model,
      });
      onSuccess?.(conversationId, responseText);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("editAndResend failed:", error);
        onError?.(error);
      }
    } finally {
      resetStreamState();
      hideIndicator();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // stopGeneration
  // ─────────────────────────────────────────────────────────────────────────

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
    resetStreamState();
    hideIndicator();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Context value
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <ChatContext.Provider
      value={{
        currentStreamResponse,
        setCurrentStreamResponse,
        attachments,
        addAttachment,
        removeAttachment,
        clearAttachments,
        isLoading,
        setLoadingState: setIsLoading,
        processingMessage,
        setProcessingMessage,
        sendMessage,
        regenerateResponse,
        editAndResend,
        stopGeneration,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
