"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";
import {
  PrimaryButton,
  AttachmentThumbnail,
  Backdrop,
  MobileContextMenu,
} from "@/components";
import { getBubbleRadius, getCodeText, copyToClipboard } from "@/lib";
import { AnimatePresence } from "framer-motion";
import { Copy, RefreshCcw, RotateCcw, Check, Edit2, X } from "react-feather";
import { useIsMobile, useLongPress } from "@/hooks";

// ─── MessageBubble ────────────────────────────────────────────────────────────

export default function MessageBubble({ message, onRegenerate, onEdit }) {
  const isUser = message.role === "user";
  const isStreaming = message.id === "streaming";

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [menuOpen, setMenuOpen] = useState(false);

  const textareaRef = useRef(null);
  const bubbleRef = useRef(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isEditing || !textareaRef.current) return;
    const el = textareaRef.current;
    el.focus();
    el.selectionStart = el.value.length;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [isEditing]);

  // Used for desktop buttons — direct click gesture, safe for clipboard
  const handleCopy = (text) => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleEditSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== message.content) onEdit?.(message.id, trimmed);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(message.content);
    setIsEditing(false);
  };

  const handleTextareaChange = (e) => {
    setEditValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleEditSubmit();
    }
    if (e.key === "Escape") handleEditCancel();
  };

  const CopyIcon = copied ? Check : Copy;

  const userActions = [
    {
      id: "edit",
      Icon: Edit2,
      title: "Edit",
      onClick: () => {
        closeMenu();
        setIsEditing(true);
      },
    },
    {
      id: "copy",
      Icon: CopyIcon,
      title: "Copy",
      // copyText is consumed by MobileContextMenu and called synchronously
      // inside onPointerDown — the only way iOS will allow clipboard access
      copyText: message.content,
      onClick: () => {
        closeMenu();
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      },
    },
    {
      id: "resend",
      Icon: RotateCcw,
      title: "Resend",
      onClick: () => {
        closeMenu();
        onRegenerate?.(message.id);
      },
    },
  ];

  const assistantActions = [
    {
      id: "copy",
      Icon: CopyIcon,
      title: "Copy",
      copyText: message.content,
      onClick: () => {
        closeMenu();
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      },
    },
    {
      id: "regen",
      Icon: RefreshCcw,
      title: "Regenerate",
      onClick: () => {
        closeMenu();
        onRegenerate?.(message.id);
      },
    },
  ];

  const actions = isUser ? userActions : assistantActions;

  // ── Long-press → open menu ────────────────────────────────────────────────

  const handleLongPress = useCallback(() => {
    if (isStreaming || isEditing) return;
    navigator.vibrate?.(8);
    setMenuOpen(true);
  }, [isStreaming, isEditing]);

  const lp = useLongPress(handleLongPress);

  const bubbleHandlers = {
    onMouseLeave: (e) => {
      if (menuOpen) return;
      lp.onMouseLeave(e);
    },
    onTouchStart: (e) => {
      if (menuOpen) return;
      lp.onTouchStart(e);
    },
    onTouchEnd: (e) => {
      if (menuOpen) return;
      lp.onTouchEnd(e);
    },
    onTouchMove: (e) => {
      if (menuOpen) return;
      lp.onTouchMove(e);
    },
    onContextMenu: (e) => {
      if (menuOpen) return;
      lp.onContextMenu(e);
    },
  };

  const canAnimate = !isStreaming && !isEditing && !menuOpen;

  return (
    <>
      <AnimatePresence>
        {menuOpen && isMobile && (
          <>
            <Backdrop onClose={closeMenu} />
            <MobileContextMenu
              actions={actions}
              bubbleRef={bubbleRef}
              isUser={isUser}
              onClose={closeMenu}
            />
          </>
        )}
      </AnimatePresence>

      <div
        ref={bubbleRef}
        className={`flex select-none md:select-auto ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`flex flex-col w-full ${isUser ? "items-end" : "items-start"}`}
        >
          <div
            className={`group flex flex-col relative w-full ${isUser ? "items-end" : "items-start"}`}
          >
            {/* Attachments */}
            {isUser && message.attachments?.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2 max-w-[80%]">
                {message.attachments.map((attachment) => (
                  <AttachmentThumbnail
                    key={attachment.id}
                    attachment={attachment}
                    className="max-w-xs"
                    readOnly
                  />
                ))}
              </div>
            )}

            {/* Bubble */}
            <motion.div
              className={clsx(
                "w-full p-2",
                menuOpen && "relative z-9999",
                isUser
                  ? clsx(
                      "text-neutral-950 w-max max-w-[90%] lg:max-w-[80%] border",
                      isEditing
                        ? "text-neutral-950 bg-neutral-500/5 border-neutral-500"
                        : "bg-neutral-200",
                    )
                  : "text-neutral-100",
              )}
              style={{
                transformOrigin: isUser ? "bottom right" : "bottom left",
                ...(isUser
                  ? { borderRadius: getBubbleRadius(message.content) }
                  : {}),
              }}
              whileHover={canAnimate ? { scale: 0.98 } : {}}
              whileTap={canAnimate ? { scale: 0.95 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              {...bubbleHandlers}
            >
              {isUser ? (
                isEditing ? (
                  <div className="flex flex-col gap-2 min-w-60">
                    <textarea
                      ref={textareaRef}
                      value={editValue}
                      onChange={handleTextareaChange}
                      onKeyDown={handleEditKeyDown}
                      rows={1}
                      className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-neutral-400 overflow-hidden"
                    />
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap px-1">
                    {message.content}
                  </p>
                )
              ) : (
                <div className="markdown prose prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                    components={{
                      p: ({ children }) => <div>{children}</div>,
                      pre: ({ children }) => (
                        <div className="relative group/code">
                          <button
                            onClick={() => handleCopy(getCodeText(children))}
                            className="absolute right-2 top-2 md:opacity-0 group-hover/code:opacity-100 transition-opacity p-1.5 rounded bg-neutral-900 hover:bg-neutral-700 z-10 cursor-pointer"
                          >
                            <CopyIcon size={14} />
                          </button>
                          <pre className="overflow-x-auto mt-2 p-1 rounded-xl [&>code]:rounded-md">
                            {children}
                          </pre>
                        </div>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-neutral-400 ml-1 animate-pulse" />
                  )}
                </div>
              )}
            </motion.div>

            {/* Desktop hover actions */}
            {!isStreaming && !isEditing && (
              <div
                className={`hidden md:flex text-xs mt-2 gap-1 transition-all duration-150 ${
                  isUser
                    ? "justify-end opacity-0 group-hover:opacity-100 mr-2"
                    : "justify-start ml-2"
                }`}
              >
                {actions.map(({ id, Icon, onClick, title }) => (
                  <PrimaryButton
                    key={id}
                    className="outline-none border-none min-w-0 cursor-pointer p-2 text-neutral-400 hover:bg-neutral-700/20 hover:text-neutral-100 rounded-md"
                    onClick={onClick}
                    tooltip={title}
                  >
                    <Icon size={14} />
                  </PrimaryButton>
                ))}
              </div>
            )}

            {/* Edit action buttons */}
            {isEditing && (
              <div className="flex items-center gap-1 justify-end mt-1">
                <PrimaryButton
                  onClick={handleEditCancel}
                  className="outline-none border-none min-w-0 cursor-pointer p-2 text-neutral-400 hover:bg-neutral-700/20 hover:text-neutral-100 rounded-md"
                >
                  <X size={14} />
                </PrimaryButton>
                <PrimaryButton
                  onClick={handleEditSubmit}
                  className="outline-none border-none min-w-0 cursor-pointer p-2 text-neutral-400 hover:bg-neutral-700/20 hover:text-neutral-100 rounded-md"
                >
                  <Check size={14} />
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
