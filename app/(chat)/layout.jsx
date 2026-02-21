"use client";

import { ChatHeader, Sidebar } from "@/components";
import { PrivateRoute } from "@/lib";
import React, { useCallback, useState } from "react";

export default function ChatLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const handleToggleSidebar = useCallback(() => setIsOpen((prev) => !prev), []);
  const handleCloseSidebar = useCallback(() => setIsOpen(false), []);

  return (
    <PrivateRoute>
      <main className="h-dvh flex flex-row">
        <Sidebar
          isOpen={isOpen}
          handleCloseSidebar={handleCloseSidebar}
          handleToggleSidebar={handleToggleSidebar}
        />
        <div className="bg-neutral-900/40 flex flex-col w-full">
          <ChatHeader
            handleToggleSidebar={handleToggleSidebar}
            handleCloseSidebar={handleCloseSidebar}
          />
          <div className="px-4 md:px-0 flex-1">{children}</div>
        </div>
      </main>
    </PrivateRoute>
  );
}
