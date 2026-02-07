"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import clsx from "clsx";

import { PrimaryButton } from "@/components";
import { useDatabase } from "@/context";

import { ArrowUp, Plus, Loader } from "react-feather";
import { generateConversationTitle, streamResponse } from "@/lib";

export default function ChatInterface() {
  const router = useRouter();
  const params = useParams();
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef(null);
  const { createConversation, addMessage } = useDatabase();

  // Hole conversationId aus URL-Parametern
  const conversationId = params?.chatId || null;

  const handleUserInputOnChange = (e) => {
    setUserInput(e.target.value);
  };

  const isExpanded = userInput.includes("\n");
  const hasInput = userInput.trim().length > 0;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
    }
  }, [userInput]);

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
    "h-15 w-15 border-none shadow-none rounded-none p-2 flex items-center justify-center hover:bg-transparent hover:border-transparent hover:text-neutral-950 group focus:border-transparent";

  const buttonContainerClass = `rounded-full border p-2 border-neutral-800 group-hover:border-neutral-200 group-hover:bg-neutral-200 group-focus-within:scale-95 transition-all duration-300`;

  const handleSendMessage = async () => {
    // Validierung
    if (!hasInput || isLoading) return;

    const messageText = userInput.trim();
    setUserInput(""); // Leere Input sofort
    setIsLoading(true);

    try {
      let chatId = conversationId;

      // Erstelle neue Conversation beim ersten Message
      if (!chatId) {
        // Generiere Titel (mit Fallback auf erste 3 Wörter)
        const title = await generateConversationTitle(
          messageText,
          streamResponse,
        );

        const newConv = await createConversation(title, "openai/gpt-oss-120b");
        chatId = newConv.id;

        // Redirect zu neuer Chat-Seite
        router.push(`/chat/${chatId}`);
      }

      // Speichere User-Message
      await addMessage(chatId, {
        role: "user",
        content: messageText,
        model: "openai/gpt-oss-120b",
      });

      // Streame AI-Antwort
      const aiResponse = await streamResponse(
        messageText,
        "openai/gpt-oss-120b",
        (chunk, accumulated) => {
          // Optional: Live-Updates während Streaming
          console.log("Streaming:", accumulated.substring(0, 50) + "...");
        },
      );

      // Speichere AI-Antwort
      await addMessage(chatId, {
        role: "assistant",
        content: aiResponse,
        model: "openai/gpt-oss-120b",
      });

      console.log("Message erfolgreich gesendet und gespeichert");
    } catch (error) {
      console.error("Fehler beim Senden der Nachricht:", error);
      alert(`Fehler: ${error.message}`);

      // Bei Fehler: Stelle User-Input wieder her
      setUserInput(messageText);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleNewChat = () => {
    // Redirect zur Home-Seite für neuen Chat
    router.push("/");
    console.log("Neuer Chat gestartet");
  };

  const handleKeyDown = (e) => {
    // Enter ohne Shift = Senden
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }

    // Escape = Clear input
    if (e.key === "Escape") {
      setUserInput("");
    }
  };

  return (
    <div className="pb-12 pt-2 w-full relative max-w-4xl mx-auto">
      <motion.div
        className={`bg-neutral-900 flex flex-col justify-end relative`}
        variants={containerVariant}
        initial="initial"
        animate={isExpanded ? "animate" : "initial"}
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
      >
        <div className="flex justify-between items-center">
          {/* New Chat Button */}
          <PrimaryButton
            className={buttonClass}
            onClick={handleNewChat}
            disabled={isLoading}
            text={
              <div className={buttonContainerClass}>
                <Plus size={21} />
              </div>
            }
          />

          {/* Textarea */}
          <motion.textarea
            ref={textareaRef}
            name="user-input"
            id="user-input"
            placeholder="ask anything"
            className="resize-none w-[calc(100%-16px)] p-3 overflow-y-auto max-h-82 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
            className={buttonClass}
            onClick={handleSendMessage}
            disabled={!hasInput || isLoading}
            text={
              <div
                className={clsx(
                  buttonContainerClass,
                  hasInput && !isLoading
                    ? "bg-neutral-200 border-neutral-200 text-neutral-950"
                    : "",
                  isLoading && "animate-pulse",
                )}
              >
                {isLoading ? (
                  <Loader size={21} className="animate-spin" />
                ) : (
                  <ArrowUp size={21} />
                )}
              </div>
            }
          />
        </div>

        {/* Character Counter */}
        {userInput.length > 3500 && (
          <div className="absolute bottom-2 right-2 text-xs text-neutral-500">
            {userInput.length}/4000
          </div>
        )}
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
