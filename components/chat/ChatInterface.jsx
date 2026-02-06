"use client";

import React, { useState, useRef, useEffect } from "react";
import { PrimaryButton } from "@/components";
import { ArrowUp, Plus } from "react-feather";
import { motion } from "framer-motion";
import clsx from "clsx";

export default function ChatInterface() {
  const [userInput, setUserInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef(null);

  const handleUserInputOnChange = (e) => {
    setUserInput(e.target.value);
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;

      // Check if textarea has multiple lines
      const hasLineBreak = userInput.includes("\n");
      setIsExpanded(hasLineBreak);
    }
  }, [userInput]);

  const containerVariant = {
    initial: {
      borderRadius: 30,
      height: "auto",
    },
    animate: {
      borderRadius: 32,
      height: 180,
    },
  };
  const textAreaVariant = {
    initial: {
      position: "relative",
    },
    animate: {
      position: "absolute",
      left: 8,
      top: 8,
      maxHeight: 220,
    },
  };

  const buttonClass =
    "h-15 w-15 border-none rounded-none p-2 flex items-center justify-center hover:bg-transparent hover:border-transparent hover:text-neutral-950 group focus:border-transparent";
  const buttonContainerClass = `rounded-full border p-2 border-neutral-800 group-hover:border-neutral-200 group-hover:bg-neutral-200 group-focus-within:scale-95 transition-all duration-300`;
  return (
    <div className="pb-20 pt-8 w-full">
      <motion.div
        className={`bg-neutral-900 flex flex-col justify-end relative `}
        variants={containerVariant}
        initial="initial"
        animate={isExpanded ? "animate" : "initial"}
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
      >
        <div className="flex justify-between items-center">
          <PrimaryButton
            className={buttonClass}
            text={
              <div className={buttonContainerClass}>
                <Plus size={21} />
              </div>
            }
          />
          <motion.textarea
            ref={textareaRef}
            name="user-input"
            id="user-input"
            placeholder="ask anything"
            className="resize-none w-[calc(100%-16px)] p-3 overflow-y-auto max-h-82 outline-none"
            value={userInput}
            onChange={handleUserInputOnChange}
            variants={textAreaVariant}
            initial="initial"
            animate={isExpanded ? "animate" : "initial"}
            rows={1}
          ></motion.textarea>
          <PrimaryButton
            className={buttonClass}
            text={
              <div
                className={clsx(
                  buttonContainerClass,
                  userInput
                    ? "bg-neutral-200 border-neutral-200 text-neutral-950"
                    : " ",
                )}
              >
                <ArrowUp size={21} />
              </div>
            }
          />
        </div>
      </motion.div>
    </div>
  );
}
