"use client";

import {
  AuthProvider,
  ChatProvider,
  DatabaseProvider,
  ModalProvider,
} from "@/context";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <DatabaseProvider>
        <ChatProvider>
          <ModalProvider>{children}</ModalProvider>
        </ChatProvider>
      </DatabaseProvider>
    </AuthProvider>
  );
}
