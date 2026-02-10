"use client";

import { AuthProvider, ChatProvider, DatabaseProvider } from "@/context";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <DatabaseProvider>
        <ChatProvider>{children}</ChatProvider>
      </DatabaseProvider>
    </AuthProvider>
  );
}
