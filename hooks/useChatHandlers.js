import { useCallback } from "react";
import {
  detectAttachmentType,
  createAttachment,
  createPastedAttachment,
  insertTextAtCursor,
} from "@/lib";

/**
 * Hook for handling paste events in the chat interface
 */
export const usePasteHandler = (
  textareaRef,
  localUserInput,
  setLocalUserInput,
  addAttachment,
) => {
  return useCallback(
    (e) => {
      const items = e.clipboardData.items;

      for (let item of items) {
        // Handle pasted images
        if (item.type.indexOf("image") !== -1) {
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

        // Handle pasted text
        if (item.type === "text/plain") {
          e.preventDefault();
          item.getAsString((text) => {
            const type = detectAttachmentType(text);

            if (type === "code") {
              const attachment = createPastedAttachment(
                "code",
                "Pasted Code",
                text,
              );
              addAttachment(attachment);
            } else {
              insertTextAtCursor(
                localUserInput,
                text,
                textareaRef.current,
                setLocalUserInput,
              );
            }
          });
        }
      }
    },
    [localUserInput, addAttachment, textareaRef, setLocalUserInput],
  );
};

/**
 * Hook for handling file selection
 */
export const useFileSelectHandler = (addAttachment) => {
  return useCallback(
    (e) => {
      const files = Array.from(e.target.files);

      files.forEach((file) => {
        const reader = new FileReader();
        const type = detectAttachmentType("", file.name);

        reader.onload = (event) => {
          const attachment = createAttachment(
            file,
            type,
            type === "image" ? null : event.target.result,
            type === "image" ? event.target.result : null,
          );
          addAttachment(attachment);
        };

        if (type === "image") {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      });

      e.target.value = "";
    },
    [addAttachment],
  );
};

/**
 * Hook for handling keyboard shortcuts
 */
export const useKeyboardHandler = (
  handleSendMessage,
  localUserInput,
  setLocalUserInput,
) => {
  return useCallback(
    (e) => {
      // Enter to send (Shift+Enter for new line)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
        return;
      }
      // Tab for indentation
      if (e.key === "Tab") {
        e.preventDefault();
        const textarea = e.target;
        insertTextAtCursor(localUserInput, "  ", textarea, setLocalUserInput);
      }
    },
    [handleSendMessage, localUserInput, setLocalUserInput],
  );
};

/**
 * Hook for handling message sending
 */
export const useSendMessageHandler = (
  sendMessage,
  localUserInput,
  attachments,
  conversationId,
  createConversation,
  updateConversation,
  addMessage,
  getMessages,
  addConversationToProject,
  updateUserProfile,
  userProfile,
  project_id,
  router,
  textareaRef,
  setLocalUserInput,
) => {
  return useCallback(async () => {
    if (!localUserInput.trim() && attachments.length === 0) return;

    await sendMessage({
      message: localUserInput,
      conversationId,
      model: "openai/gpt-oss-120b",
      createConversation,
      updateConversation,
      addMessage,
      addConversationToProject,
      getMessages,
      // Pass through profile so ChatContext can inject memories into system
      // prompt and run memory extraction after each response
      updateUserProfile,
      userProfile,
      projectId: typeof project_id === "string" ? project_id : project_id?.id,
      router,
      onSuccess: () => {
        setLocalUserInput("");
        textareaRef.current?.focus();
      },
    });
  }, [
    sendMessage,
    localUserInput,
    attachments.length,
    conversationId,
    createConversation,
    updateConversation,
    addMessage,
    addConversationToProject,
    updateUserProfile,
    userProfile,
    project_id,
    router,
    textareaRef,
    getMessages,
    setLocalUserInput,
  ]);
};
