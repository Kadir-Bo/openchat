"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { ArrowUp, Plus, Square } from "react-feather";

import {
  PrimaryButton,
  AttachmentThumbnail,
  ChatFooterMessage,
} from "@/components";
import { useChat } from "@/context";
import {
  usePasteHandler,
  useFileSelectHandler,
  useKeyboardHandler,
} from "@/hooks";
import {
  getContainerVariant,
  getTextAreaVariant,
  ACCEPTED_FILE_TYPES,
  buildContextMessages,
  buildSystemPromptWithMemories,
  trimMessagesToTokenLimit,
  generateId,
} from "@/lib";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_CONTEXT_MSGS = 10;
const MAX_TOKENS = 100000;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function PublicChatInterface({
  messages = [],
  onMessages,
  onBeforeSend, // () => boolean — false cancels send
  onAfterSend, // async (history, userContent) => void
  model = "openai/gpt-oss-120b",
  systemPrompt = "",
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
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const [localUserInput, setLocalUserInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    attachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
    isLoading,
    stopGeneration,
  } = useChat();

  // ── Input helpers ─────────────────────────────────────────────────────────

  const resetInput = useCallback(() => {
    setLocalUserInput("");
    setIsExpanded(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }, []);

  const checkExpanded = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const lineHeight = parseInt(getComputedStyle(el).lineHeight, 10);
    const paddingY = 24;
    setIsExpanded(el.scrollHeight > lineHeight + paddingY);
  }, []);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setLocalUserInput(value);
    if (!value) setIsExpanded(false);
  }, []);

  const handleInput = useCallback(() => checkExpanded(), [checkExpanded]);

  const handlePaste = usePasteHandler(
    textareaRef,
    localUserInput,
    setLocalUserInput,
    addAttachment,
  );
  const handleFileSelect = useFileSelectHandler(addAttachment);

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = localUserInput.trim();
    if (!text && attachments.length === 0) return;
    if (isLoading) return;

    // Allow parent to cancel (e.g. limit reached)
    if (onBeforeSend && onBeforeSend() === false) return;

    // Build message text (inline attachment content)
    let messageText = text;
    attachments.forEach((att) => {
      if (att.type === "code")
        messageText += `\n\n\`\`\`\n${att.content}\n\`\`\``;
      else if (att.type === "text") messageText += `\n\n${att.content}`;
    });

    clearAttachments();
    resetInput();

    // Optimistically append user message
    const userMsg = {
      id: generateId(),
      role: "user",
      content: messageText,
    };
    onMessages?.((prev) => [...prev, userMsg]);

    if (onAfterSend) {
      // Delegate streaming to parent (PublicChatPage)
      const builtSystemPrompt =
        systemPrompt || buildSystemPromptWithMemories([], "", null);
      const history = trimMessagesToTokenLimit(
        buildContextMessages(
          messages,
          messageText,
          MAX_CONTEXT_MSGS,
          builtSystemPrompt,
        ),
        MAX_TOKENS,
      );
      // Pass the raw history + content so the parent can build its own payload
      await onAfterSend(messages, messageText);
    }

    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [
    localUserInput,
    attachments,
    isLoading,
    messages,
    systemPrompt,
    clearAttachments,
    resetInput,
    onMessages,
    onBeforeSend,
    onAfterSend,
  ]);

  const handleKeyDown = useKeyboardHandler(handleSend, setLocalUserInput);

  // ── Framer Motion variants ────────────────────────────────────────────────

  const containerVariant = useMemo(
    () => getContainerVariant(textAreaGrowHeight),
    [textAreaGrowHeight],
  );
  const textAreaVariant = useMemo(
    () => getTextAreaVariant(buttonContainerHeight),
    [buttonContainerHeight],
  );

  // ── Render ────────────────────────────────────────────────────────────────

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
              "min-w-12 w-max h-12 justify-center ml-2 rounded-full scale-95 md:scale-100 border-transparent hover:border-neutral-900/50  hover:bg-neutral-800",
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
                "min-w-12 w-max h-12 justify-center mr-2 rounded-full bg-transparent border-neutral-600 hover:bg-transparent scale-95 md:scale-100",
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
                "min-w-12 w-max h-12 justify-center mr-2 rounded-full hover:bg-neutral-100 hover:text-neutral-950 scale-95 md:scale-100",
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
