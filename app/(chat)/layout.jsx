"use client";

import { ChatHeader, Sidebar } from "@/components";
import { PrivateRoute } from "@/lib";
import React, { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks";
import { useDatabase } from "@/context";

function ThemeBridge() {
  const { userProfile } = useDatabase();

  useEffect(() => {
    const theme = userProfile?.preferences?.theme ?? "dark";
    const chatContainer = document.getElementById("chat-container");

    document.body.setAttribute("data-theme", theme);
    chatContainer?.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [userProfile]);

  return null;
}

export default function ChatLayout({ children }) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (isMobile) setIsOpen(false);
  }

  const handleToggleSidebar = useCallback(() => setIsOpen((prev) => !prev), []);
  const handleCloseSidebar = useCallback(() => setIsOpen(false), []);

  return (
    <PrivateRoute>
      <ThemeBridge />

      <main
        className="h-dvh flex flex-row -neutral-950 text-white data-[theme=light]:bg-white data-[theme=light]:text-neutral-950"
        id="chat-container"
      >
        <Sidebar
          isOpen={isOpen}
          isMobile={isMobile}
          handleCloseSidebar={handleCloseSidebar}
          handleToggleSidebar={handleToggleSidebar}
        />
        <div className="bg-neutral-900/40 flex flex-col w-full relative">
          <ChatHeader
            handleToggleSidebar={handleToggleSidebar}
            handleCloseSidebar={handleCloseSidebar}
          />
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      </main>
    </PrivateRoute>
  );
}
