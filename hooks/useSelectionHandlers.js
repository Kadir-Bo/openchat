import { useCallback, useEffect, useRef, useState } from "react";

export function useSelectionHandlers({ listRef, onNavigate, deleteOne }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const selectedIdsRef = useRef(selectedIds);
  const lastClickedIndexRef = useRef(null);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastClickedIndexRef.current = null;
  }, []);

  const handleCardClick = useCallback(
    (e, id) => {
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

  return {
    selectedIds,
    handleCardClick,
    handleDeleteSelected,
    handleDeleteAll,
    clearSelection,
  };
}
