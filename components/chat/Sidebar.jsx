import React from "react";
import { ArrowLeft, Menu } from "react-feather";
import { AnimatePresence, motion } from "framer-motion";
import { ChatList } from "@/components";

function Sidebar({ state = true, onClick }) {
  // Sidebar width animation
  const sidebarVariants = {
    hidden: { width: 52, transition: { duration: 0.3 } }, // collapsed width
    visible: {
      width: 248,
      transition: { duration: 0.3, when: "beforeChildren" },
    },
  };

  // Menu items animation
  const ButtonVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <div
      className={`border-r border-neutral-700 flex flex-col gap-3 items-end`}
    >
      <button
        type="button"
        className="relative p-7 flex justify-center items-center cursor-pointer"
        onClick={onClick}
      >
        <motion.div
          className="absolute "
          variants={ButtonVariants}
          initial="hidden"
          animate={state ? "hidden" : "visible"}
        >
          <Menu />
        </motion.div>
        <motion.div
          type="button"
          className="absolute "
          variants={ButtonVariants}
          initial="hidden"
          animate={state ? "visible" : "hidden"}
        >
          <ArrowLeft />
        </motion.div>
      </button>

      <motion.div
        className="flex flex-col flex-1 justify-between px-2.5 pb-3 overflow-hidden"
        variants={sidebarVariants}
        initial="hidden"
        animate={state ? "visible" : "hidden"}
      >
        <AnimatePresence>
          {state && (
            <motion.nav
              className="flex-1 flex flex-col justify-between"
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <ChatList />
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default Sidebar;
