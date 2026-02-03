"use client";

import { createContext, useContext, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export const DatabaseContext = createContext(null);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
};

export default function DatabaseProvider({ children }) {
  const { user } = useAuth(); // Get current user from AuthContext
  const [currentChat, setCurrentChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Collection references
  const CHATS_COLLECTION = "chats";
  const MESSAGES_COLLECTION = "messages";

  // ==================== CHAT OPERATIONS ====================

  const values = {};

  return (
    <DatabaseContext.Provider value={values}>
      {children}
    </DatabaseContext.Provider>
  );
}
