import { useCallback, useRef } from "react";

export function useScrollLock({ threshold = 80 } = {}) {
  const containerRef = useRef(null);
  const isAtBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, [threshold]);

  const scrollToBottom = useCallback((behavior = "instant") => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const scrollToBottomIfLocked = useCallback(
    (behavior = "instant") => {
      if (isAtBottomRef.current) scrollToBottom(behavior);
    },
    [scrollToBottom],
  );

  return {
    containerRef,
    isAtBottomRef,
    handleScroll,
    scrollToBottom,
    scrollToBottomIfLocked,
  };
}
