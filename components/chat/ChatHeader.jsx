import React from "react";
import { Menu, MessageSquare } from "react-feather";
import { Icon, PrimaryButton } from "@/components";

export default function ChatHeader({ handleToggleSidebar }) {
  return (
    <div className="w-full bg-neutral-900">
      <div className="max-w-550 mx-auto flex justify-between items-center px-2 py-2 md:py-1 h-max">
        <div className="flex-1">
          <button
            className="outline-none p-3 h-full md:hidden"
            onClick={handleToggleSidebar}
            aria-label="Open sidebar"
          >
            <Icon name={Menu} size="md" />
          </button>
        </div>
        <div className="flex items-center justify-center flex-1"></div>
        <div className="flex flex-1 justify-end">
          <PrimaryButton
            className="p-2 m-0 border-none w-max"
            tooltip={"New Chat"}
            tooltipPosition="left"
            href={"/chat"}
          >
            <Icon name={MessageSquare} size="md" />
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
