"use client";

import {
  AuthProvider,
  ChatProvider,
  DatabaseProvider,
  DropdownProvider,
} from "@/context";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <DatabaseProvider>
        <ChatProvider>{children}</ChatProvider>
      </DatabaseProvider>
    </AuthProvider>
  );
}
