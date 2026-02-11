"use client";

import React, { useState, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { twMerge } from "tailwind-merge";

import { PrimaryButton, AttachmentThumbnail } from "@/components";
import { useChat, useDatabase } from "@/context";
import { ArrowUp, Plus, Square } from "react-feather";

import {
  usePasteHandler,
  useFileSelectHandler,
  useKeyboardHandler,
  useSendMessageHandler,
} from "@/hooks";
import {
  getContainerVariant,
  getTextAreaVariant,
  ACCEPTED_FILE_TYPES,
} from "@/lib";

export default function ChatInterface({
  project_id,
  className = "",
  containerClassName = "",
  textareaClassName = "",
  textareaExpandedClassName = "",
  buttonClassName = "",
  extrasButtonClassName = "",
  sendButtonClassName = "",
  buttonIconSize = 21,
  textAreaGrowHeight = 180,
  buttonContainerHeight = 50,
  placeholder = "ask anything",
}) {
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.chatId || null;

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const [localUserInput, setLocalUserInput] = useState("");

  const {
    attachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
    isLoading,
    sendMessage,
    stopGeneration,
  } = useChat();

  const {
    createConversation,
    updateConversation,
    addMessage,
    addConversationToProject,
  } = useDatabase();

  // Calculate expansion state
  const hasContent = localUserInput.trim() !== "" || attachments.length > 0;
  const hasNewlines = localUserInput.includes("\n");
  const hasAttachments = attachments.length > 0;
  const estimatedWrap = localUserInput.length > 75;
  const isExpanded =
    hasContent && (hasAttachments || hasNewlines || estimatedWrap);

  // Event handlers
  const handlePaste = usePasteHandler(
    textareaRef,
    localUserInput,
    setLocalUserInput,
    addAttachment,
  );

  const handleFileSelect = useFileSelectHandler(addAttachment);

  const handleSendMessage = useSendMessageHandler(
    sendMessage,
    localUserInput,
    attachments,
    conversationId,
    createConversation,
    updateConversation,
    addMessage,
    addConversationToProject,
    project_id,
    router,
    textareaRef,
    setLocalUserInput,
  );

  const handleKeyDown = useKeyboardHandler(
    handleSendMessage,
    setLocalUserInput,
  );

  // Animation variants
  const containerVariant = useMemo(
    () => getContainerVariant(textAreaGrowHeight),
    [textAreaGrowHeight],
  );

  const textAreaVariant = useMemo(
    () => getTextAreaVariant(buttonContainerHeight),
    [buttonContainerHeight],
  );

  return (
    <div
      className={twMerge(
        "pb-8 pt-2 w-full relative max-w-4xl mx-auto",
        className,
      )}
    >
      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 absolute bottom-full h-max max-h-68 overflow-y-auto">
            {attachments.map((attachment) => (
              <AttachmentThumbnail
                key={attachment.id}
                attachment={attachment}
                onRemove={() => removeAttachment(attachment.id)}
                className="max-w-xs"
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Input Container */}
      <motion.div
        className={twMerge(
          "bg-neutral-900 flex flex-col justify-end relative",
          containerClassName,
        )}
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
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Attachment Button */}
          <PrimaryButton
            className={twMerge(
              "h-15 w-15 border-none shadow-none rounded-none p-2 flex items-center justify-center hover:bg-transparent hover:border-transparent hover:text-neutral-950 group focus:border-transparent",
              buttonClassName,
              extrasButtonClassName,
            )}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            text={
              <div className="rounded-full border p-2 border-neutral-800 group-hover:border-neutral-200 group-hover:bg-neutral-200 group-focus-within:scale-95 transition-all duration-300">
                <Plus size={buttonIconSize} />
              </div>
            }
          />

          {/* Text Input */}
          <motion.textarea
            ref={textareaRef}
            name="user-input"
            id="user-input"
            placeholder={placeholder}
            className={twMerge(
              "resize-none w-full p-3 overflow-y-auto no-scrollbar outline-none disabled:opacity-50 disabled:cursor-not-allowed",
              textareaClassName,
              isExpanded && `w-auto ${textareaExpandedClassName}`,
            )}
            value={localUserInput}
            onChange={(e) => setLocalUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            variants={textAreaVariant}
            initial="initial"
            animate={isExpanded ? "animate" : "initial"}
            rows={1}
            disabled={isLoading}
            maxLength={4000}
          />

          {/* Send/Stop Button */}
          {isLoading ? (
            <PrimaryButton
              className={twMerge(
                "h-12 w-12 mr-1.5 shadow-none rounded-full p-2 justify-center hover:bg-transparent hover:text-neutral-950 bg-transparent border-neutral-100 text-neutral-100 hover:border-white/50",
                buttonClassName,
                sendButtonClassName,
              )}
              text={
                <Square size={buttonIconSize - 3} fill="white" stroke="none" />
              }
              tooltip="Stop"
              filled
              onClick={stopGeneration}
            />
          ) : (
            <PrimaryButton
              className={twMerge(
                "h-12 w-12 mr-1.5 shadow-none rounded-full p-2 justify-center hover:text-neutral-950 hover:bg-white",
                buttonClassName,
                sendButtonClassName,
              )}
              text={<ArrowUp size={buttonIconSize} />}
              tooltip="Send"
              onClick={handleSendMessage}
            />
          )}
        </div>
      </motion.div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mt-2 text-center text-sm text-neutral-500 animate-pulse absolute w-full">
          Generating response...
        </div>
      )}
    </div>
  );
}
