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

      for (let item of items) {
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

        if (item.type === "text/plain") {
          e.preventDefault();
          item.getAsString((text) => {
            const type = detectAttachmentType(text);
            if (type === "code") {
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
        type === "image" ? reader.readAsDataURL(file) : reader.readAsText(file);
      });
      e.target.value = "";
    },
    [addAttachment],
  );
};

export const useKeyboardHandler = (
  handleSendMessage,
  localUserInput,
  setLocalUserInput,
) => {
  return useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        insertTextAtCursor(localUserInput, "  ", e.target, setLocalUserInput);
      }
    },
    [handleSendMessage, localUserInput, setLocalUserInput],
  );
};

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
  getProjectConversations, // ← new
  updateUserProfile,
  userProfile,
  project_id,
  project,
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
      getProjectConversations, // ← forwarded to ChatContext
      updateUserProfile,
      userProfile,
      projectId: typeof project_id === "string" ? project_id : project_id?.id,
      project,
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
    getProjectConversations,
    updateUserProfile,
    userProfile,
    project_id,
    project,
    router,
    textareaRef,
    getMessages,
    setLocalUserInput,
  ]);
};
