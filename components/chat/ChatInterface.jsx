"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

import { PrimaryButton, AttachmentThumbnail } from "@/components";
import { useChat, useDatabase } from "@/context";

import { ArrowUp, Plus, Loader } from "react-feather";
import { generateTitleFromResponse, streamResponse } from "@/lib";

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
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Verwende attachments aus dem Context
  const {
    updateStreamResponse,
    attachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
  } = useChat();

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const hasInput = userInput.trim().length > 0 || attachments.length > 0;

  const maxTextareaHeight = textAreaGrowHeight - buttonContainerHeight - 16;

  const {
    createConversation,
    updateConversation,
    addMessage,
    addConversationToProject,
  } = useDatabase();

  const conversationId = params?.chatId || null;

  const handleUserInputOnChange = (e) => {
    setUserInput(e.target.value);
  };

  // Detect file type
  const detectAttachmentType = (text, fileName = "") => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    // Image files
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
      return "image";
    }

    // Document files
    if (
      ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension)
    ) {
      return "document";
    }

    // Code detection
    const hasMultipleLines = text.includes("\n");
    const looksLikeCode =
      /[{}\[\]();]/.test(text) ||
      /^\s*(function|const|let|var|class|import|export|def|public|private|package|interface)/m.test(
        text,
      );

    if (
      (hasMultipleLines && text.split("\n").length > 3 && looksLikeCode) ||
      [
        "js",
        "jsx",
        "ts",
        "tsx",
        "py",
        "java",
        "cpp",
        "c",
        "css",
        "html",
      ].includes(extension)
    ) {
      return "code";
    }

    // Text files
    if (["txt", "md", "json", "xml", "csv"].includes(extension)) {
      return "text";
    }

    return "file";
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;

    for (let item of items) {
      // Handle images
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        const reader = new FileReader();

        reader.onload = (event) => {
          const newAttachment = {
            id: Date.now(),
            type: "image",
            name: file.name || "Pasted Image",
            preview: event.target.result,
            file: file,
          };
          addAttachment(newAttachment);
        };

        reader.readAsDataURL(file);
        return;
      }

      // Handle text/code
      if (item.type === "text/plain") {
        e.preventDefault();
        item.getAsString((text) => {
          const type = detectAttachmentType(text);

          // Only create attachment for code, not regular text
          if (type === "code") {
            const newAttachment = {
              id: Date.now(),
              type: "code",
              name: "Pasted Code",
              content: text,
            };
            addAttachment(newAttachment);
          } else {
            // Regular text - paste normally into textarea
            const textarea = textareaRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            const newValue =
              userInput.substring(0, start) + text + userInput.substring(end);

            setUserInput(newValue);

            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd =
                start + text.length;
              textarea.focus();
            }, 0);
          }
        });
      }
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      const type = detectAttachmentType("", file.name);

      reader.onload = (event) => {
        const newAttachment = {
          id: Date.now() + Math.random(),
          type: type,
          name: file.name,
          content: type === "image" ? null : event.target.result,
          preview: type === "image" ? event.target.result : null,
          file: file,
        };
        addAttachment(newAttachment);
      };

      if (type === "image") {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });

    // Reset file input
    e.target.value = "";
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Collapse when empty
    if (userInput.trim() === "" && attachments.length === 0) {
      setIsExpanded(false);
      return;
    }

    // Always expand if there are attachments
    if (attachments.length > 0) {
      setIsExpanded(true);
      return;
    }

    // Check for explicit newlines
    if (userInput.includes("\n")) {
      setIsExpanded(true);
      return;
    }

    // Check if content wraps
    textarea.style.height = "auto";
    const singleLineHeight = 56; // Adjust based on your textarea styling
    setIsExpanded(textarea.scrollHeight > singleLineHeight);
  }, [userInput, attachments]);

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

  const handleSendMessage = async () => {
    if (!hasInput || isLoading) return;

    // Prepare message with attachments
    let messageText = userInput.trim();

    // Store attachments for display
    const messageAttachments = attachments.map((att) => ({
      id: att.id,
      type: att.type,
      name: att.name,
      content: att.content,
      preview: att.preview,
    }));

    // Append attachment content to message for AI processing
    if (attachments.length > 0) {
      attachments.forEach((att) => {
        if (att.type === "code") {
          messageText += `\n\n\`\`\`\n${att.content}\n\`\`\``;
        } else if (att.type === "text") {
          messageText += `\n\n${att.content}`;
        }
      });
    }

    setUserInput("");
    clearAttachments();
    setIsLoading(true);

    try {
      let chatId = conversationId;

      if (!chatId) {
        const newConv = await createConversation(
          "New Chat",
          "openai/gpt-oss-120b",
        );
        chatId = newConv.id;

        if (project_id) {
          await addConversationToProject(project_id, chatId);
        }

        router.push(`/chat/${chatId}`);
      }

      // Add user message with attachments
      await addMessage(chatId, {
        role: "user",
        content: messageText,
        model: "openai/gpt-oss-120b",
        attachments: messageAttachments,
      });

      let accumulatedResponse = "";

      await streamResponse(
        messageText,
        "openai/gpt-oss-120b",
        (chunk, accumulated) => {
          accumulatedResponse = accumulated;
          updateStreamResponse(accumulated);
        },
        false,
        50,
      );

      await addMessage(chatId, {
        role: "assistant",
        content: accumulatedResponse,
        model: "openai/gpt-oss-120b",
      });

      if (!conversationId) {
        const title = await generateTitleFromResponse(
          messageText,
          accumulatedResponse,
          streamResponse,
        );

        await updateConversation(chatId, { title });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setUserInput(messageText);
    } finally {
      setIsLoading(false);
      updateStreamResponse("");
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }

    if (e.key === "Escape") {
      setUserInput("");
      clearAttachments();
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newValue =
        userInput.substring(0, start) + "  " + userInput.substring(end);

      setUserInput(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div
      className={twMerge(
        "pb-12 pt-2 w-full relative max-w-4xl mx-auto",
        className,
      )}
    >
      {/* Attachments - Show above input */}
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
          {/* File Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.css,.html"
            onChange={handleFileSelect}
            className="hidden"
          />
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

          {/* Textarea */}
          <motion.textarea
            ref={textareaRef}
            name="user-input"
            id="user-input"
            placeholder={placeholder}
            className={twMerge(
              "resize-none w-full p-3 overflow-y-auto outline-none disabled:opacity-50 disabled:cursor-not-allowed",
              textareaClassName,
              isExpanded && textareaExpandedClassName,
            )}
            value={userInput}
            onChange={handleUserInputOnChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
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
              "h-15 w-15 border-none shadow-none rounded-none p-2 flex items-center justify-center hover:bg-transparent hover:border-transparent hover:text-neutral-950 group focus:border-transparent",
              buttonClassName,
              sendButtonClassName,
            )}
            onClick={handleSendMessage}
            disabled={!hasInput || isLoading}
            text={
              <div
                className={clsx(
                  "rounded-full border p-2 border-neutral-800 group-hover:border-neutral-200 group-hover:bg-neutral-200 group-focus-within:scale-95 transition-all duration-300",
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
      </motion.div>

      {/* Status Display */}
      {isLoading && (
        <div className="mt-2 text-center text-sm text-neutral-500 animate-pulse absolute w-full">
          Generating response...
        </div>
      )}
    </div>
  );
}
