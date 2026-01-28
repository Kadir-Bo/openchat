"use client";
import { Header, Sidebar } from "@/components";
import React, { useState } from "react";

function ChatLayout({ children }) {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const handleSidebarOnClick = () => {
    setSidebarVisible((prev) => !prev);
  };
  return (
    <div className="h-screen w-full">
      <Header />
      <div className="flex h-full">
        <Sidebar onClick={handleSidebarOnClick} state={sidebarVisible} />
        <div className="flex-1 h-full">{children}</div>
      </div>
    </div>
  );
}

export default ChatLayout;
