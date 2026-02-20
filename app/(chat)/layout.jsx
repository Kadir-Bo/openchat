import { Sidebar } from "@/components";
import { PrivateRoute } from "@/lib";
import React from "react";

export default function ChatLayout({ children }) {
  return (
    <PrivateRoute>
      <main className="h-dvh md:min-h-screen flex flex-row">
        <Sidebar />
        <div className="bg-neutral-900/40 flex-1 px-4 md:px-0">{children}</div>
      </main>
    </PrivateRoute>
  );
}
