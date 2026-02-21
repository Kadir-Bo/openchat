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
  buttonIconSize = 21,
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
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, []);

  const checkExpanded = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const lineHeight = parseInt(getComputedStyle(el).lineHeight, 10);
    const paddingY = 24; // py-3 = 12px top + 12px bottom
    setIsExpanded(el.scrollHeight > lineHeight + paddingY);
  }, []);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setLocalUserInput(value);
    if (!value) setIsExpanded(false);
  }, []);

  const handleInput = useCallback(() => {
    checkExpanded();
  }, [checkExpanded]);

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

  return (
    <motion.div
      className={twMerge(
        "w-full relative max-w-220 mx-auto py-4 flex flex-col",
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
            className="flex flex-wrap gap-2 bottom-full h-30 overflow-y-auto"
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
          "bg-neutral-900 flex flex-col justify-end relative my-px",
          containerClassName,
        )}
        variants={containerVariant}
        initial="initial"
        animate={isExpanded ? "animate" : "initial"}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div
          className="flex justify-between items-center"
          style={{ height: `${buttonContainerHeight}px` }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Attach button */}
          <PrimaryButton
            className={twMerge(
              "w-max min-w-10 h-10 justify-center ml-2 rounded-full",
              buttonClassName,
              attachmentButtonClassName,
            )}
            disabled={isLoading}
            tooltip="Add files"
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
              "resize-none w-full p-3 overflow-y-auto no-scrollbar outline-none disabled:opacity-50 disabled:cursor-not-allowed",
              textareaClassName,
              isExpanded && `w-auto ${textareaExpandedClassName}`,
            )}
            value={localUserInput}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onInput={handleInput}
            variants={textAreaVariant}
            initial="initial"
            animate={isExpanded ? "animate" : "initial"}
            rows={1}
            disabled={isLoading}
            autoFocus={autofocus}
          />

          {/* Send / Stop button */}
          {isLoading ? (
            <PrimaryButton
              className={twMerge(
                "w-max min-w-10 h-10 justify-center mr-2 rounded-full bg-transparent border-neutral-600 hover:bg-transparent",
                buttonClassName,
                sendButtonClassName,
              )}
              tooltip="Stop"
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
                "w-max min-w-10 h-10 justify-center mr-2 rounded-full hover:bg-neutral-100 hover:text-neutral-950",
                buttonClassName,
                sendButtonClassName,
              )}
              tooltip="Send"
              onClick={handleSend}
            >
              <ArrowUp size={buttonIconSize} />
            </PrimaryButton>
          )}
        </div>
      </motion.div>
      {indicator && <ChatFooterMessage />}
    </motion.div>
  );
}
