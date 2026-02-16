"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";
import { PrimaryButton, AttachmentThumbnail } from "@/components";
import { Copy, RefreshCcw, RotateCcw, Loader, Check } from "react-feather";

export default function MessageBubble({ message, isStreaming = false }) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const [copied, setCopied] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const regenerateResponse = () => {};

  // Helper function to extract text from React children
  const getCodeText = (children) => {
    if (typeof children === "string") {
      return children;
    }

    if (Array.isArray(children)) {
      return children.map(getCodeText).join("");
    }

    if (children?.props?.children) {
      return getCodeText(children.props.children);
    }

    return String(children || "");
  };

  const userBubbleActions = [
    {
      id: "copy",
      icon: copied ? Check : Copy,
      onClick: handleCopyMessage,
    },
    {
      id: "redo",
      icon: RotateCcw,
      onClick: regenerateResponse,
    },
  ];

  const assistantBubbleActions = [
    {
      id: "copy",
      icon: copied ? Check : Copy,
      onClick: handleCopyMessage,
    },
    {
      id: "redo",
      icon: RefreshCcw,
      onClick: regenerateResponse,
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
                      // Override paragraph to use div instead
                      p: ({ children }) => <div>{children}</div>,

                      // Override pre to add copy button wrapper
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
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>

          {/* Controls  */}
          {message.id !== "streaming" && (
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
                      className="outline-none border-none shadow-none cursor-pointer p-2 text-gray-400 hover:bg-neutral-700/20 hover:text-gray-100 rounded-md"
                      onClick={action.onClick}
                      text={<action.icon size={14} />}
                    />
                  ))
                : assistantBubbleActions.map((action) => (
                    <PrimaryButton
                      key={action.id}
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
