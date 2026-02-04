"use client";

import Link from "next/link";
import React, { useState } from "react";

import { ChevronDown } from "react-feather";

function ChatList({
  label = "label",
  list = [],
  button = null,
  listIcon = null,
  defaultExpanded = true,
}) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  const handleToggleChats = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="group py-2.5 w-full">
      <button
        className="min-w-max w-full pl-1.5 text-sm text-gray-300/90 flex items-center gap-px ml-1 cursor-pointer hover:text-gray-200/80 transition-all duration-75"
        onClick={handleToggleChats}
      >
        {label}
        <ChevronDown
          size={16}
          className={`opacity-0 group-hover:opacity-100 ${isOpen ? "" : "-rotate-90"}`}
        />
      </button>
      {isOpen && (
        <ul className="mt-1 w-full p-2 flex flex-col gap-2">
          {button && <li>{button}</li>}
          {list.map((item) => (
            <li
              key={item.id}
              className="hover:bg-neutral-900 w-full text-left rounded-lg cursor-pointer transition duration-75 truncate"
            >
              <Link
                href={item.path}
                className="px-3 py-2 flex items-center gap-2"
              >
                {listIcon && listIcon}
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
export default ChatList;
