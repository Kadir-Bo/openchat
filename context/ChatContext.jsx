import { createContext, useContext } from "react";

export const ChatContext = createContext(null);
export const useChat = () => useContext(ChatContext);
export default function ChatProvider({ children }) {
  const values = {};
  return <ChatContext.Provider value={values}>{children}</ChatContext.Provider>;
}
