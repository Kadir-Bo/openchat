import { useCallback } from "react";
import { createPastedAttachment } from "@/lib";
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
