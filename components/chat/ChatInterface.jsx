"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

import { PrimaryButton } from "@/components";
import { useDatabase } from "@/context";

import { ArrowUp, Plus, Loader } from "react-feather";
import { generateConversationTitle, streamResponse } from "@/lib";

export default function ChatInterface({
  className = "",
  containerClassName = "",
  textareaClassName = "",
  buttonClassName = "",
  newChatButtonClassName = "",
  sendButtonClassName = "",
  statusClassName = "",
  counterClassName = "",
  buttonIconSize = 21,
  textAreaGrowHeight = 180,
  buttonContainerHeight = 50,
}) {
  const router = useRouter();
  const params = useParams();
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef(null);
  const { createConversation, addMessage } = useDatabase();

  const conversationId = params?.chatId || null;

  const handleUserInputOnChange = (e) => {
    setUserInput(e.target.value);
  };

  const isExpanded = userInput.includes("\n");
  const hasInput = userInput.trim().length > 0;

  const maxTextareaHeight = textAreaGrowHeight - buttonContainerHeight - 16;

  // Auto-resize textarea - runs on every userInput change AND isExpanded change
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";

      // If not expanded, reset to single line height
      if (!isExpanded) {
        textarea.style.height = "auto";
      } else {
        textarea.style.height = `${Math.min(textarea.scrollHeight, maxTextareaHeight)}px`;
      }
    }
  }, [userInput, isExpanded, maxTextareaHeight]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const containerVariant = {
    initial: {
      borderRadius: 30,
      height: "auto",
    },
    animate: {
      borderRadius: 32,
      height: textAreaGrowHeight,
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
      right: 8,
      bottom: buttonContainerHeight + 8,
    },
  };

  const defaultButtonClass = `
    h-15
    w-15
    border-none
    shadow-none
    rounded-none
    p-2
    flex
    items-center
    justify-center
    hover:bg-transparent
    hover:border-transparent
    hover:text-neutral-950
    group
    focus:border-transparent
  `;

  const defaultButtonContainerClass = `
    rounded-full
    border
    p-2
    border-neutral-800
    group-hover:border-neutral-200
    group-hover:bg-neutral-200
    group-focus-within:scale-95
    transition-all
    duration-300
  `;

  const defaultWrapperClasses = `
    pb-12
    pt-2
    w-full
    relative
    max-w-4xl
    mx-auto
  `;

  const defaultContainerClasses = `
    bg-neutral-900
    flex
    flex-col
    justify-end
    relative
  `;

  const defaultTextareaClasses = `
    resize-none
    w-full
    p-3
    overflow-y-auto
    outline-none
    disabled:opacity-50
    disabled:cursor-not-allowed
  `;

  const defaultCounterClasses = `
    absolute
    bottom-2
    right-2
    text-xs
    text-neutral-500
  `;

  const defaultStatusClasses = `
    mt-2
    text-center
    text-sm
    text-neutral-500
    animate-pulse
    absolute
    w-full
  `;

  const handleSendMessage = async () => {
    if (!hasInput || isLoading) return;

    const messageText = userInput.trim();
    setUserInput("");
    setIsLoading(true);

    try {
      let chatId = conversationId;

      if (!chatId) {
        const title = await generateConversationTitle(
          messageText,
          streamResponse,
        );

        const newConv = await createConversation(title, "openai/gpt-oss-120b");
        chatId = newConv.id;

        router.push(`/chat/${chatId}`);
      }

      await addMessage(chatId, {
        role: "user",
        content: messageText,
        model: "openai/gpt-oss-120b",
      });

      const aiResponse = await streamResponse(
        messageText,
        "openai/gpt-oss-120b",
        (chunk, accumulated) => {
          console.log("Streaming:", accumulated.substring(0, 50) + "...");
        },
      );

      await addMessage(chatId, {
        role: "assistant",
        content: aiResponse,
        model: "openai/gpt-oss-120b",
      });

      console.log("Message erfolgreich gesendet und gespeichert");
    } catch (error) {
      console.error("Fehler beim Senden der Nachricht:", error);
      alert(`Fehler: ${error.message}`);
      setUserInput(messageText);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleNewChat = () => {
    router.push("/");
    console.log("Neuer Chat gestartet");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }

    if (e.key === "Escape") {
      setUserInput("");
    }
  };

  return (
    <div className={twMerge(defaultWrapperClasses, className)}>
      <motion.div
        className={twMerge(defaultContainerClasses, containerClassName)}
        variants={containerVariant}
        initial="initial"
        animate={isExpanded ? "animate" : "initial"}
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
      >
        <div
          className="flex justify-between items-center"
          style={{ height: `${buttonContainerHeight}px` }}
        >
          {/* New Chat Button */}
          <PrimaryButton
            className={twMerge(
              defaultButtonClass,
              buttonClassName,
              newChatButtonClassName,
            )}
            onClick={handleNewChat}
            disabled={isLoading}
            text={
              <div className={defaultButtonContainerClass}>
                <Plus size={buttonIconSize} />
              </div>
            }
          />

          {/* Textarea */}
          <motion.textarea
            ref={textareaRef}
            name="user-input"
            id="user-input"
            placeholder="ask anything"
            className={twMerge(defaultTextareaClasses, textareaClassName)}
            value={userInput}
            onChange={handleUserInputOnChange}
            onKeyDown={handleKeyDown}
            variants={textAreaVariant}
            initial="initial"
            animate={isExpanded ? "animate" : "initial"}
            rows={1}
            disabled={isLoading}
            maxLength={4000}
          />

          {/* Send Button */}
          <PrimaryButton
            className={twMerge(
              defaultButtonClass,
              buttonClassName,
              sendButtonClassName,
            )}
            onClick={handleSendMessage}
            disabled={!hasInput || isLoading}
            text={
              <div
                className={clsx(
                  defaultButtonContainerClass,
                  hasInput && !isLoading
                    ? "bg-neutral-200 border-neutral-200 text-neutral-950"
                    : "",
                  isLoading && "animate-pulse",
                )}
              >
                {isLoading ? (
                  <Loader size={buttonIconSize} className="animate-spin" />
                ) : (
                  <ArrowUp size={buttonIconSize} />
                )}
              </div>
            }
          />
        </div>

        {/* Character Counter */}
        {userInput.length > 3500 && (
          <div className={twMerge(defaultCounterClasses, counterClassName)}>
            {userInput.length}/4000
          </div>
        )}
      </motion.div>

      {/* Status Display */}
      {isLoading && (
        <div className={twMerge(defaultStatusClasses, statusClassName)}>
          Generating response...
        </div>
      )}
    </div>
  );
}
