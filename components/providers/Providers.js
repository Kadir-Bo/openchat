"use client";
import { AuthProvider, ChatProvider } from "@/context";
export default function Providers({ children }) {
  return (
    <AuthProvider>
      <ChatProvider>{children}</ChatProvider>
    </AuthProvider>
  );
}
