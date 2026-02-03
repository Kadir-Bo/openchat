"use client";

import { AuthProvider, DatabaseProvider } from "@/context";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <DatabaseProvider>{children}</DatabaseProvider>
    </AuthProvider>
  );
}
