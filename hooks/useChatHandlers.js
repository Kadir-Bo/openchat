import { useCallback } from "react";
import {
  detectAttachmentType,
  createAttachment,
  createPastedAttachment,
  insertTextAtCursor,
} from "@/lib";

export const usePasteHandler = (
  textareaRef,
  localUserInput,
  setLocalUserInput,
  addAttachment,
) => {
  return useCallback(
    (e) => {
      const items = e.clipboardData.items;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => {
            const attachment = createPastedAttachment(
              "image",
              file.name || "Pasted Image",
              null,
              event.target.result,
            );
            attachment.file = file;
            addAttachment(attachment);
          };
          reader.readAsDataURL(file);
          return;
        }

        if (item.type === "text/plain") {
          e.preventDefault();
          item.getAsString((text) => {
            if (detectAttachmentType(text) === "code") {
              addAttachment(
                createPastedAttachment("code", "Pasted Code", text),
              );
            } else {
              insertTextAtCursor(
                localUserInput,
                text,
                textareaRef.current,
                setLocalUserInput,
              );
            }
          });
          // Only handle the first text/plain item.
          return;
        }
      }
    },
    [localUserInput, addAttachment, textareaRef, setLocalUserInput],
  );
};

export const useFileSelectHandler = (addAttachment) => {
  return useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      files.forEach((file) => {
        const reader = new FileReader();
        const type = detectAttachmentType("", file.name);
        reader.onload = (event) => {
          addAttachment(
            createAttachment(
              file,
              type,
              type === "image" ? null : event.target.result,
              type === "image" ? event.target.result : null,
            ),
          );
        };
        if (type === "image") {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      });
      // Reset so the same file can be re-selected.
      e.target.value = "";
    },
    [addAttachment],
  );
};

export const useKeyboardHandler = (handleSendMessage, setLocalUserInput) => {
  return useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        // Read directly from the DOM element to avoid a stale closure on localUserInput.
        insertTextAtCursor(e.target.value, "  ", e.target, setLocalUserInput);
      }
    },
    [handleSendMessage, setLocalUserInput],
  );
};

/**
 * Returns a stable `send(message)` function.
 *
 * The message is passed as an explicit argument at call-time rather than
 * closed over or stored in a ref. This keeps the dependency array honest,
 * lets the React Compiler reason about the callback correctly, and avoids
 * the stale-closure / ref-reading anti-patterns that triggered the
 * `react-hooks/preserve-manual-memoization` compiler warning.
 *
 * Call-site pattern (in ChatInterface):
 *   const send = useSendMessageHandler(...);
 *   // in handleSend:
 *   const message = localUserInput;   // capture before reset
 *   resetInput();                     // optimistic UI update
 *   send(message);                    // always receives the correct value
 */
export const useSendMessageHandler = (
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
) => {
  return useCallback(
    async (message) => {
      if (!message?.trim() && attachments.length === 0) return;

      await sendMessage({
        message,
        conversationId,
        model: "openai/gpt-oss-120b",
        createConversation,
        updateConversation,
        addMessage,
        addConversationToProject,
        getMessages,
        getProjectConversations,
        updateUserProfile,
        updateProjectMemory,
        userProfile,
        projectId: typeof project_id === "string" ? project_id : project_id?.id,
        project,
        router,
        onSuccess: () => {
          // Refocus so the user can type immediately after a response.
          textareaRef.current?.focus();
        },
      });
    },
    [
      sendMessage,
      attachments.length,
      conversationId,
      createConversation,
      updateConversation,
      addMessage,
      addConversationToProject,
      getMessages,
      getProjectConversations,
      updateUserProfile,
      updateProjectMemory,
      userProfile,
      project_id,
      project,
      router,
      textareaRef,
    ],
  );
};
