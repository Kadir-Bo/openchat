import React from "react";
import { Menu, MessageSquare } from "react-feather";
import { LogoButton } from "..";

export default function ChatHeader({ handleToggleSidebar }) {
  return (
    <div className="md:hidden w-full fixed top-0 left-0 z-99 flex justify-between items-center p-2 bg-neutral-900 min-h-20">
      <button
        className="outline-none p-3 h-full"
        onClick={handleToggleSidebar}
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>
      <div className="h-full flex items-center justify-center">
        <LogoButton />
      </div>
      <button className="outline-none p-3 h-full">
        <MessageSquare size={20} />
      </button>
    </div>
  );
}
