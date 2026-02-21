"use client";

import { ChatHeader, Sidebar } from "@/components";
import { PrivateRoute } from "@/lib";
import React, { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks";

export default function ChatLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const handleToggleSidebar = useCallback(() => setIsOpen((prev) => !prev), []);
  const handleCloseSidebar = useCallback(() => setIsOpen(false), []);
  const pathname = usePathname();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) handleCloseSidebar();
  }, [pathname]);
  return (
    <PrivateRoute>
      <main className="h-dvh flex flex-row">
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
          <div className="px-4 md:px-0 flex-1 overflow-hidden">{children}</div>
        </div>
      </main>
    </PrivateRoute>
  );
}
