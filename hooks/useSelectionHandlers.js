import { useCallback, useEffect, useRef, useState } from "react";

const LONG_PRESS_MS = 420;

export function useSelectionHandlers({ listRef, onNavigate, deleteOne }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const selectedIdsRef = useRef(selectedIds);
  const lastClickedIndexRef = useRef(null);
  const longPressTimer = useRef(null);
  const longPressFired = useRef(false);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastClickedIndexRef.current = null;
  }, []);

  const handleCardClick = useCallback(
    (e, id) => {
      // Block the click that fires after a long-press
      if (longPressFired.current) {
        longPressFired.current = false;
        return;
      }

      const currentList = listRef.current;
      const index = currentList.findIndex((item) => item.id === id);
      const selected = selectedIdsRef.current;

      if (
        e.shiftKey &&
        lastClickedIndexRef.current !== null &&
        selected.size > 0
      ) {
        const start = Math.min(lastClickedIndexRef.current, index);
        const end = Math.max(lastClickedIndexRef.current, index);
        const range = currentList.slice(start, end + 1).map((item) => item.id);
        setSelectedIds((prev) => new Set([...prev, ...range]));
        lastClickedIndexRef.current = index;
        return;
      }

      if (e.metaKey || e.ctrlKey || selected.size > 0) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        });
        lastClickedIndexRef.current = index;
        return;
      }

      onNavigate(id);
    },
    [listRef, onNavigate],
  );

  const handleLongPressStart = useCallback(
    (e, id) => {
      if (e.button !== undefined && e.button !== 0) return;
      longPressFired.current = false;
      longPressTimer.current = setTimeout(() => {
        longPressFired.current = true;
        const currentList = listRef.current;
        const index = currentList.findIndex((item) => item.id === id);
        setSelectedIds(new Set([id]));
        lastClickedIndexRef.current = index;
      }, LONG_PRESS_MS);
    },
    [listRef],
  );

  const handleLongPressCancel = useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    await Promise.all([...selectedIdsRef.current].map((id) => deleteOne(id)));
    clearSelection();
  }, [deleteOne, clearSelection]);

  const handleDeleteAll = useCallback(
    async (items) => {
      await Promise.all(items.map((item) => deleteOne(item.id)));
      clearSelection();
    },
    [deleteOne, clearSelection],
  );

  const selectIds = useCallback((ids) => {
    setSelectedIds(new Set(ids));
  }, []);
  return {
    selectedIds,
    handleCardClick,
    handleLongPressStart,
    handleLongPressCancel,
    handleDeleteSelected,
    handleDeleteAll,
    clearSelection,
    selectIds,
  };
}
