import { Sidebar } from "@/components";
import React from "react";

export default function ChatLayout({ children }) {
  return (
    <main className="min-h-screen flex flex-row">
      <Sidebar />
      {children}
    </main>
  );
}
