import { useCallback } from "react";
import { insertTextAtCursor } from "@/lib";

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
