"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ChevronDown } from "react-feather";

function ChatList({ title = "your chats", items = [], className = "" }) {
  const [expandMenu, setExpandMenu] = useState(true);

  const handleExpandMenu = () => {
    setExpandMenu((prev) => !prev);
  };

  const menuVariants = {
    hidden: {
      y: -10,
      transition: {
        duration: 0.3,
        when: "afterChildren",
      },
    },
    visible: {
      y: 0,
      transition: {
        duration: 0.2,
        when: "beforeChildren",
        staggerChildren: 0.05,
      },
    },
    exit: {
      y: -10,
      transition: {
        duration: 0.25,
        when: "afterChildren",
      },
    },
  };

  const menuItemVariants = {
    hidden: {
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.15,
      },
    },
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <motion.button
        className="text-gray-400 flex justify-start items-center gap-1 px-1 text-sm min-w-max cursor-pointer"
        onClick={handleExpandMenu}
      >
        {title}
        <motion.span
          animate={{ rotate: expandMenu ? 0 : -90 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <ChevronDown size={17} />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {expandMenu && (
          <motion.ul
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col gap-2 overflow-hidden"
          >
            {items.map(({ id, label, path }) => (
              <motion.li
                key={id}
                variants={menuItemVariants}
                className="flex border border-neutral-800 hover:border-neutral-600 text-gray-50 hover:text-white transition-all duration-200 rounded-lg min-w-max"
              >
                <Link href={path} className="w-full py-2 px-3 truncate">
                  {label}
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatList;
