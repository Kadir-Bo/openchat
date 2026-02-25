"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { ArrowUp, Plus, Square } from "react-feather";

import {
  PrimaryButton,
  AttachmentThumbnail,
  ChatFooterMessage,
} from "@/components";
import { useChat, useDatabase } from "@/context";
import {
  usePasteHandler,
  useFileSelectHandler,
  useKeyboardHandler,
  useSendMessageHandler,
  useIsMobile,
} from "@/hooks";
import {
  getContainerVariant,
  getTextAreaVariant,
  ACCEPTED_FILE_TYPES,
} from "@/lib";

export default function ChatInterface({
  project_id,
  project = null,
  className = "",
  containerClassName = "",
  textareaClassName = "",
  textareaExpandedClassName = "",
  buttonClassName = "",
  attachmentButtonClassName = "",
  sendButtonClassName = "",
  buttonIconSize = 20,
  textAreaGrowHeight = 180,
  buttonContainerHeight = 50,
  placeholder = "ask anything",
  autofocus = true,
  indicator = true,
}) {
  const router = useRouter();
  const { chatId: conversationId = null } = useParams() ?? {};

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const [localUserInput, setLocalUserInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const isMobile = useIsMobile();

  const {
    attachments,
    addAttachment,
    removeAttachment,
    isLoading,
    sendMessage,
    stopGeneration,
  } = useChat();

  const {
    createConversation,
    updateConversation,
    addMessage,
    addConversationToProject,
    getMessages,
    getProjectConversations,
    updateUserProfile,
    updateProjectMemory,
    userProfile,
  } = useDatabase();

  const resetInput = useCallback(() => {
    setLocalUserInput("");
    setIsExpanded(false);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      if (!isMobile) el.focus();
    }
  }, [isMobile]);

  const checkExpanded = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const lineHeight = parseInt(getComputedStyle(el).lineHeight, 10);
    setIsExpanded(el.scrollHeight > lineHeight + 24); // 24 = paddingY
  }, []);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setLocalUserInput(value);
    if (!value) setIsExpanded(false);
  }, []);

  const handlePaste = usePasteHandler(
    textareaRef,
    localUserInput,
    setLocalUserInput,
    addAttachment,
  );

  const handleFileSelect = useFileSelectHandler(addAttachment);

  const send = useSendMessageHandler(
    sendMessage,
    attachments,
    conversationId,
    createConversation,
    updateConversation,
    addMessage,
    getMessages,
    addConversationToProject,
    getProjectConversations,
    updateUserProfile,
    updateProjectMemory,
    userProfile,
    project_id,
    project,
    router,
    textareaRef,
  );

  const handleSend = useCallback(() => {
    if (!localUserInput.trim() && attachments.length === 0) return;
    const message = localUserInput;
    resetInput();
    send(message);
  }, [localUserInput, attachments.length, resetInput, send]);

  const handleKeyDown = useKeyboardHandler(handleSend, setLocalUserInput);

  const containerVariant = useMemo(
    () => getContainerVariant(textAreaGrowHeight),
    [textAreaGrowHeight],
  );
  const textAreaVariant = useMemo(
    () => getTextAreaVariant(buttonContainerHeight),
    [buttonContainerHeight],
  );

  // Shared base button classes matching PublicChatInterface
  const baseButtonCls = twMerge(
    "w-max p-2.5 sm:p-3 aspect-square justify-center rounded-full",
    "min-w-[44px] min-h-[44px]",
    buttonClassName,
  );

  return (
    <motion.div
      className={twMerge(
        "w-full relative max-w-3xl mx-auto py-3 sm:py-4 flex flex-col overflow-hidden",
        "pb-[calc(env(safe-area-inset-bottom)+1rem)]",
        className,
      )}
    >
      {/* Attachment previews */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            key="attachments"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="flex flex-wrap gap-2 mb-2 max-h-28 overflow-y-auto"
          >
            {attachments.map((attachment) => (
              <AttachmentThumbnail
                key={attachment.id}
                attachment={attachment}
                onRemove={() => removeAttachment(attachment.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input container */}
      <motion.div
        className={twMerge(
          "bg-neutral-900 flex flex-col justify-end relative mb-6 sm:mb-8",
          "rounded-2xl",
          containerClassName,
        )}
        variants={containerVariant}
        initial="initial"
        animate={isExpanded ? "animate" : "initial"}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between gap-1 p-1.5">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileSelect}
            className="hidden"
            aria-hidden="true"
          />

          {/* Attach button */}
          <PrimaryButton
            className={twMerge(
              baseButtonCls,
              "border-transparent hover:border-neutral-900/50 hover:bg-neutral-800",
              attachmentButtonClassName,
            )}
            disabled={isLoading}
            tooltip="Add files"
            aria-label="Add files"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus size={buttonIconSize} />
          </PrimaryButton>

          {/* Textarea */}
          <motion.textarea
            ref={textareaRef}
            name="user-input"
            id="user-input"
            placeholder={placeholder}
            className={twMerge(
              "resize-none flex-1 min-w-0 p-2",
              "text-sm sm:text-base leading-relaxed",
              "overflow-y-auto no-scrollbar outline-none",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "touch-manipulation",
              textareaClassName,
              isExpanded && textareaExpandedClassName,
            )}
            value={localUserInput}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onInput={checkExpanded}
            variants={textAreaVariant}
            initial="initial"
            animate={isExpanded ? "animate" : "initial"}
            rows={1}
            disabled={isLoading}
            autoFocus={autofocus && !isMobile}
            aria-label="Message input"
          />

          {/* Send / Stop button */}
          {isLoading ? (
            <PrimaryButton
              className={twMerge(
                baseButtonCls,
                "bg-transparent border-neutral-600 hover:bg-transparent",
                sendButtonClassName,
              )}
              tooltip="Stop generation"
              aria-label="Stop generation"
              filled
              onClick={stopGeneration}
            >
              <Square
                size={buttonIconSize}
                className="fill-white stroke-transparent scale-95"
              />
            </PrimaryButton>
          ) : (
            <PrimaryButton
              className={twMerge(
                baseButtonCls,
                "hover:bg-neutral-100 hover:text-neutral-950",
                sendButtonClassName,
              )}
              tooltip="Send message"
              aria-label="Send message"
              onClick={handleSend}
            >
              <ArrowUp size={buttonIconSize} />
            </PrimaryButton>
          )}
        </div>
      </motion.div>

      {/* Footer indicator */}
      {indicator && <ChatFooterMessage />}
    </motion.div>
  );
}
