import { useIsMobile } from "@/hooks";

export default function SelectionStatus({
  selectedCount,
  itemType,
  hasItems,
  onCancel,
}) {
  const label = selectedCount === 1 ? itemType : `${itemType}s`;
  const isMobile = useIsMobile();

  if (selectedCount > 0) {
    if (isMobile) {
      return (
        <button
          className="text-xs text-neutral-500 underline underline-offset-2"
          onClick={onCancel}
        >
          clear selection
        </button>
      );
    }
    return (
      <p className="text-xs text-neutral-500 flex items-center gap-2">
        <span className="text-neutral-300">
          {selectedCount} {label} selected
        </span>
        <span className="inline-flex items-center gap-1 text-neutral-600">
          <kbd className="border border-neutral-800 px-1.5 py-0.5 rounded text-[11px]">
            Esc
          </kbd>
          to cancel
        </span>
      </p>
    );
  }

  if (hasItems) {
    if (isMobile) {
      return (
        <p className="text-xs text-neutral-600 flex items-center gap-1.5">
          <kbd className="border border-neutral-800 p-1.5 rounded text-[10px]">
            hold
          </kbd>
          <span>to select</span>
        </p>
      );
    }
    return (
      <p className="text-xs text-neutral-600 flex items-center gap-1.5">
        <kbd className="border border-neutral-800 p-1.5 rounded text-[10px]">
          ⌘ / Ctrl
        </kbd>
        <span>click to select</span>
      </p>
    );
  }

  return null;
}
