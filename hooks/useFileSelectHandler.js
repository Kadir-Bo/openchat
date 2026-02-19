import { useCallback } from "react";
import { detectAttachmentType, createAttachment } from "@/lib";

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
