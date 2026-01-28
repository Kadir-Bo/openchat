"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "react-feather";

function ChatList() {
  const [expandMenu, setExpandMenu] = useState(true);

  const handleExpandMenu = () => {
    setExpandMenu((prev) => !prev);
  };

  const menuItems = [
    { id: "item-1", label: "item 1", path: "#" },
    { id: "item-2", label: "item 2", path: "#" },
    { id: "item-3", label: "item 3", path: "#" },
  ];

  // Parent menu animation
  const menuVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
    },
    exit: {
      opacity: 0,
    },
  };

  return (
    <div className="flex flex-col gap-4">
      <motion.button
        className="text-gray-300 flex justify-start items-center px-1 text-sm min-w-max cursor-pointer"
        onClick={handleExpandMenu}
        layout
      >
        your chats
        {expandMenu ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
      </motion.button>

      <AnimatePresence>
        {expandMenu && (
          <motion.ul
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col gap-2"
          >
            {menuItems.map(({ id, label, path }) => (
              <li
                key={id}
                className="flex border border-neutral-600 rounded-lg min-w-max"
              >
                <Link href={path} className="w-full py-2 px-3 text-white">
                  {label}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatList;
