import { useCallback } from "react";
import { insertTextAtCursor } from "@/lib";
import { useIsMobile } from "@/hooks";

export const useKeyboardHandler = (handleSendMessage, setLocalUserInput) => {
  const isMobile = useIsMobile();

  return useCallback(
    (e) => {
      if (e.key === "Enter") {
        // On mobile, Enter always inserts a newline (user taps Send button instead)
        if (isMobile) return;
        // On desktop, Enter sends; Shift+Enter inserts newline
        if (!e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
          return;
        }
      }
      if (e.key === "Tab") {
        e.preventDefault();
        insertTextAtCursor(e.target.value, "  ", e.target, setLocalUserInput);
      }
    },
    [isMobile, handleSendMessage, setLocalUserInput],
  );
};
