"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useChat, useDatabase } from "@/context";
import { Loader } from "react-feather";
import { MessageBubble, ProcessingIndicator } from "@/components";
import { formatUsername } from "@/lib";

export default function ChatConversation({ onConversationLoad = null }) {
  const params = useParams();
  const conversationId = params?.chatId;
  const router = useRouter();
  const { subscribeToMessages, getConversation, getProject } = useDatabase();
  const { username } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(!!conversationId);
  const messagesEndRef = useRef(null);

  const { currentStreamResponse, processingMessage } = useChat();

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
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [conversationId, subscribeToMessages]);

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
          <MessageBubble key={message.id} message={message} />
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

        {/* Processing indicator — thinking / memory update */}
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
