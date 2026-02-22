"use client";

import { useCallback, useRef } from "react";

const LONG_PRESS_MS = 420;

export function useLongPress(onLongPress) {
  const timer = useRef(null);
  const fired = useRef(false);

  const start = useCallback(
    (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      fired.current = false;
      timer.current = setTimeout(() => {
        fired.current = true;
        onLongPress(e);
      }, LONG_PRESS_MS);
    },
    [onLongPress],
  );

  const cancel = useCallback(() => clearTimeout(timer.current), []);
  const onClick = useCallback((e) => {
    if (fired.current) e.stopPropagation();
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
    onContextMenu: (e) => e.preventDefault(),
    onClick,
  };
}
