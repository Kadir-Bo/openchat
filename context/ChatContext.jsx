"use client";

import { createContext, useContext, useState, useEffect } from "react";

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
  const updateStreamResponse = (chunk) => {
    setStreamResponse(chunk || "");
  };
  const values = {
    streamResponse,
    updateStreamResponse,
  };

  return <ChatContext.Provider value={values}>{children}</ChatContext.Provider>;
}
