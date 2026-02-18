"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useChat, useDatabase } from "@/context";
import { Loader } from "react-feather";
import { MessageBubble, ProcessingIndicator } from "@/components";
import { formatUsername } from "@/lib";

export default function ChatConversation({ onConversationLoad = null }) {
  const params = useParams();
  const conversationId = params?.chatId;
  const router = useRouter();
  const {
    subscribeToMessages,
    getConversation,
    getProject,
    deleteMessage,
    addMessage,
    getMessages,
    updateConversation,
    updateUserProfile,
    updateProjectMemory,
    userProfile,
  } = useDatabase();
  const { username } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(!!conversationId);
  const messagesEndRef = useRef(null);

  // When true, incoming Firestore snapshots are ignored so we control the
  // messages state ourselves during optimistic updates.
  const suppressListenerRef = useRef(false);

  const {
    currentStreamResponse,
    processingMessage,
    regenerateResponse,
    editAndResend,
    isLoading,
  } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamResponse, processingMessage]);

  useEffect(() => {
    if (!conversationId) return;

    const loadConversation = async () => {
      setLoading(true);
      try {
        const conv = await getConversation(conversationId);
        setConversation(conv);

        if (!conv) {
          router.push("/chat");
          return;
        }

        if (conv.projectId) {
          const proj = await getProject(conv.projectId);
          setProject(proj);
          if (onConversationLoad) {
            onConversationLoad({ conversation: conv, project: proj });
          }
        } else {
          setProject(null);
          if (onConversationLoad) {
            onConversationLoad({ conversation: conv, project: null });
          }
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [conversationId, getConversation, getProject, router]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
      // While we're doing an optimistic update, ignore Firestore snapshots.
      if (suppressListenerRef.current) return;
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [conversationId, subscribeToMessages]);

  const handleRegenerate = useCallback(
    async (messageId) => {
      if (isLoading) return;

      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      const targetMessage = messages[messageIndex];

      // ASSISTANT message: keep everything before the assistant bubble.
      //   The user message before it stays visible and in Firestore.
      //   Only the assistant reply gets removed.
      // USER message: keep the user message itself + everything before it.
      //   Only messages AFTER the user message are removed.
      //   The user message stays visible — no re-save needed.
      const keepUpTo =
        targetMessage.role === "user" ? messageIndex + 1 : messageIndex;
      const keptMessages = messages.slice(0, keepUpTo);
      const messagesToDelete = messages.slice(keepUpTo);

      // Optimistic update — instant, no flicker
      suppressListenerRef.current = true;
      setMessages(keptMessages);

      try {
        await regenerateResponse({
          messageId,
          conversationId,
          messages,
          model: conversation?.model || "openai/gpt-oss-120b",
          deleteMessage,
          addMessage,
          getMessages,
          updateConversation,
          updateUserProfile,
          updateProjectMemory,
          userProfile,
          projectId: conversation?.projectId || null,
          project,
          _keptMessages: keptMessages,
          _messagesToDelete: messagesToDelete,
        });
      } finally {
        suppressListenerRef.current = false;
      }
    },
    [
      isLoading,
      messages,
      conversationId,
      conversation,
      project,
      userProfile,
      regenerateResponse,
      deleteMessage,
      addMessage,
      getMessages,
      updateConversation,
      updateUserProfile,
      updateProjectMemory,
    ],
  );

  const handleEdit = useCallback(
    async (messageId, newContent) => {
      if (isLoading) return;

      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      // Keep everything strictly before the edited message.
      const keptMessages = messages.slice(0, messageIndex);
      const messagesToDelete = messages.slice(messageIndex);

      suppressListenerRef.current = true;
      setMessages(keptMessages);

      try {
        await editAndResend({
          messageId,
          newContent,
          conversationId,
          messages,
          model: conversation?.model || "openai/gpt-oss-120b",
          deleteMessage,
          addMessage,
          getMessages,
          updateConversation,
          updateUserProfile,
          updateProjectMemory,
          userProfile,
          projectId: conversation?.projectId || null,
          project,
          _keptMessages: keptMessages,
          _messagesToDelete: messagesToDelete,
        });
      } finally {
        suppressListenerRef.current = false;
      }
    },
    [
      isLoading,
      messages,
      conversationId,
      conversation,
      project,
      userProfile,
      editAndResend,
      deleteMessage,
      addMessage,
      getMessages,
      updateConversation,
      updateUserProfile,
      updateProjectMemory,
    ],
  );

  const lastMessage = messages[messages.length - 1];
  const isStreamingComplete = lastMessage?.role === "assistant";
  const shouldShowStream =
    currentStreamResponse &&
    currentStreamResponse.trim().length > 0 &&
    !isStreamingComplete;

  const showIndicator = !!processingMessage;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader className="animate-spin text-neutral-400" size={32} />
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-neutral-300 mb-2">
            Welcome back {formatUsername(username)}
          </h2>
          <p className="text-neutral-500">
            Start a conversation by typing a message below
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full overflow-y-auto py-8 px-4">
      <div className="space-y-3 max-w-5xl mx-auto">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onRegenerate={handleRegenerate}
            onEdit={handleEdit}
          />
        ))}

        {/* Streaming response bubble */}
        {shouldShowStream && (
          <MessageBubble
            message={{
              id: "streaming",
              role: "assistant",
              content: currentStreamResponse,
            }}
          />
        )}

        {/* Processing indicator */}
        {showIndicator && (
          <div className="flex justify-start px-1">
            <ProcessingIndicator message={processingMessage} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
