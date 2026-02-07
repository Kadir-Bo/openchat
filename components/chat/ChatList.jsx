"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "react-feather";
import { truncateText } from "@/lib";

export default function ChatList({
  label = "label",
  list = [],
  button = null,
  listIcon = null,
  defaultExpanded = true,
}) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const router = useRouter();

  const handleToggleChats = () => {
    setIsOpen((prev) => !prev);
  };

  const handleListItemOnClick = (type, id) => {
    router.push(`/${type}/${id}`);
  };

  return (
    <div className="py-2.5 w-full">
      <button
        className="group min-w-max w-full pl-2.5 text-sm text-gray-300/90 flex items-center gap-px ml-1 cursor-pointer hover:text-gray-200/80 transition-all duration-75"
        onClick={handleToggleChats}
      >
        {label}
        <ChevronDown
          size={16}
          className={`opacity-0 group-hover:opacity-100 ${isOpen ? "" : "-rotate-90"}`}
        />
      </button>
      {isOpen && (
        <ul className="mt-1 w-full py-2 px-1 flex flex-col gap-2">
          {button && <li>{button}</li>}
          {list.map((item) => (
            <li
              key={item.id}
              onClick={() => handleListItemOnClick(item.type, item.id)}
              className="hover:bg-neutral-900 w-full text-left rounded-lg cursor-pointer transition duration-75 truncate px-3 py-2 flex items-center gap-2"
            >
              {listIcon && listIcon}
              <span className="truncate">{item.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
