import { Sidebar } from "@/components";
import { PrivateRoute } from "@/lib";
import React from "react";
export default function ChatLayout({ children }) {
  return (
    <PrivateRoute>
      <main className="min-h-screen flex flex-row">
        <Sidebar />
        <div className="bg-neutral-900/40 flex-1">{children}</div>
      </main>
    </PrivateRoute>
  );
}
