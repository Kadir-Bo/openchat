"use client";

import { createContext, useContext, useState } from "react";

export const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within an ChatProvider");
  }
  return context;
};

export default function ChatProvider({ children }) {
  const [streamResponse, setStreamResponse] = useState("");
  const [attachments, setAttachments] = useState([]);

  const updateStreamResponse = (chunk) => {
    setStreamResponse(chunk || "");
  };

  const addAttachment = (newAttachment) => {
    setAttachments((prev) => [...prev, newAttachment]);
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const clearAttachments = () => {
    setAttachments([]);
  };

  const values = {
    // Stream Response
    streamResponse,
    updateStreamResponse,
    // Attachments
    attachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
  };

  return <ChatContext.Provider value={values}>{children}</ChatContext.Provider>;
}
