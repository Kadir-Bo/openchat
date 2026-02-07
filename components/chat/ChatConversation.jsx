"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useDatabase } from "@/context";
import { Loader } from "react-feather";
import { MessageBubble } from "@/components";

export default function ChatConversation() {
  const params = useParams();
  const conversationId = params?.chatId;
  const { subscribeToMessages, getConversation } = useDatabase();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);

  const [loading, setLoading] = useState(!!conversationId);

  const messagesEndRef = useRef(null);

  // Scroll zu letzter Message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Lade Conversation-Details
  useEffect(() => {
    if (!conversationId) return;

    const loadConversation = async () => {
      setLoading(true); // Start loading
      try {
        const conv = await getConversation(conversationId);
        setConversation(conv);
      } catch (error) {
        console.error("Fehler beim Laden der Conversation:", error);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [conversationId, getConversation]);

  // Real-time Message Listener
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [conversationId, subscribeToMessages]);

  // Loading State
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader className="animate-spin text-neutral-400" size={32} />
      </div>
    );
  }

  // Empty State (keine Conversation ausgewählt)
  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-neutral-300 mb-2">
            Welcome to OpenChat
          </h2>
          <p className="text-neutral-500">
            Start a conversation by typing a message below
          </p>
        </div>
      </div>
    );
  }

  // No Messages Yet
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-medium text-neutral-400 mb-2">
            {conversation?.title || "New Chat"}
          </h3>
          <p className="text-neutral-600 text-sm">
            No messages yet. Start the conversation!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full overflow-y-auto py-8 px-4">
      {/* Messages */}
      <div className="space-y-3">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
