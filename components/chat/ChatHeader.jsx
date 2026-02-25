import React from "react";
import { Menu, MessageSquare } from "react-feather";
import { LogoButton, PrimaryButton } from "@/components";

export default function ChatHeader({ handleToggleSidebar }) {
  return (
    <div className="w-full bg-neutral-900">
      <div className="max-w-550 mx-auto flex justify-between items-center px-2 py-2 h-max">
        <div className="flex-1">
          <button
            className="outline-none p-3 h-full md:hidden"
            onClick={handleToggleSidebar}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
        </div>
        <div className="flex items-center justify-center flex-1">
          <LogoButton />
        </div>
        <div className="flex flex-1 justify-end">
          <PrimaryButton
            className="p-3 m-0 border-none w-max"
            tooltip={"New Chat"}
            tooltipPosition="left"
            href={"/chat"}
          >
            <MessageSquare size={20} />
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
