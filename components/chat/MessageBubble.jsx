"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";
import { PrimaryButton, AttachmentThumbnail } from "@/components";
import {
  Copy,
  RefreshCcw,
  RotateCcw,
  Check,
  Edit2,
  X,
  Send,
} from "react-feather";

export default function MessageBubble({
  message,
  isStreaming = false,
  onRegenerate,
  onEdit,
}) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
      // Auto-resize
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [isEditing]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleRegenerate = () => {
    if (onRegenerate) onRegenerate(message.id);
  };

  const handleEditStart = () => {
    setEditValue(message.content);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setEditValue(message.content);
    setIsEditing(false);
  };

  const handleEditSubmit = () => {
    if (!editValue.trim() || editValue.trim() === message.content) {
      setIsEditing(false);
      return;
    }
    if (onEdit) onEdit(message.id, editValue.trim());
    setIsEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleEditSubmit();
    }
    if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  const handleTextareaChange = (e) => {
    setEditValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  // Helper function to extract text from React children
  const getCodeText = (children) => {
    if (typeof children === "string") return children;
    if (Array.isArray(children)) return children.map(getCodeText).join("");
    if (children?.props?.children) return getCodeText(children.props.children);
    return String(children || "");
  };

  const userBubbleActions = [
    {
      id: "edit",
      icon: Edit2,
      onClick: handleEditStart,
      title: "Edit message",
    },
    {
      id: "copy",
      icon: copied ? Check : Copy,
      onClick: handleCopyMessage,
      title: "Copy message",
    },
    {
      id: "redo",
      icon: RotateCcw,
      onClick: handleRegenerate,
      title: "Resend message",
    },
  ];

  const assistantBubbleActions = [
    {
      id: "copy",
      icon: copied ? Check : Copy,
      onClick: handleCopyMessage,
      title: "Copy message",
    },
    {
      id: "redo",
      icon: RefreshCcw,
      onClick: handleRegenerate,
      title: "Regenerate response",
    },
  ];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start mb-8"}`}>
      <div
        className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full`}
      >
        <div
          className={`group flex flex-col relative w-full ${isUser ? "items-end" : "items-start"}`}
        >
          {/* Attachments - Show above user message */}
          {isUser && message.attachments && message.attachments.length > 0 && (
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

          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-neutral-200 text-neutral-950 max-w-[80%] border"
                : "text-neutral-100"
            }`}
          >
            {/* Message Content */}
            <div
              className={
                isAssistant ? "markdown prose prose-invert max-w-none" : ""
              }
            >
              {isAssistant ? (
                <>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                    components={{
                      p: ({ children }) => <div>{children}</div>,
                      pre: ({ children }) => (
                        <div className="relative group/code">
                          <button
                            onClick={() => {
                              const codeText = getCodeText(children);
                              navigator.clipboard.writeText(codeText);
                            }}
                            className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity p-1.5 rounded bg-neutral-900 hover:bg-neutral-700 z-10 cursor-pointer"
                          >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
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
                  {message.id === "streaming" && (
                    <span className="inline-block w-2 h-4 bg-neutral-400 ml-1 animate-pulse" />
                  )}
                </>
              ) : isEditing ? (
                <div className="flex flex-col gap-2 min-w-[240px]">
                  <textarea
                    ref={textareaRef}
                    value={editValue}
                    onChange={handleTextareaChange}
                    onKeyDown={handleEditKeyDown}
                    rows={1}
                    className="w-full resize-none bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400 overflow-hidden"
                    style={{ minHeight: "1.5rem" }}
                  />
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={handleEditCancel}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-neutral-500 hover:bg-neutral-300/50 hover:text-neutral-700 transition-colors"
                    >
                      <X size={12} />
                      Cancel
                    </button>
                    <button
                      onClick={handleEditSubmit}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                    >
                      <Send size={12} />
                      Send
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>

          {/* Controls */}
          {message.id !== "streaming" && !isEditing && (
            <div
              className={`flex text-xs mt-2 gap-1 transition-all duration-150 ${
                isUser
                  ? "justify-end opacity-0 group-hover:opacity-100 mr-2"
                  : "justify-start ml-2"
              }`}
            >
              {isUser
                ? userBubbleActions.map((action) => (
                    <PrimaryButton
                      key={action.id}
                      title={action.title}
                      className="outline-none border-none shadow-none cursor-pointer p-2 text-gray-400 hover:bg-neutral-700/20 hover:text-gray-100 rounded-md"
                      onClick={action.onClick}
                      text={<action.icon size={14} />}
                    />
                  ))
                : assistantBubbleActions.map((action) => (
                    <PrimaryButton
                      key={action.id}
                      title={action.title}
                      className="outline-none border-none shadow-none cursor-pointer p-2 text-gray-400 hover:bg-neutral-700/20 hover:text-gray-100 rounded-md"
                      onClick={action.onClick}
                      text={<action.icon size={14} />}
                    />
                  ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
