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
        <div className="text-xs text-neutral-600 flex items-center gap-1">
          <span className="text-xs text-neutral-300 mr-2">
            {selectedCount} {label} selected
          </span>
          <button
            className="border py-1.5 rounded-md border-none text-neutral-400 min-w-8 text-center"
            onClick={onCancel}
          >
            clear selection
          </button>
        </div>
      );
    }
    return (
      <p className="text-xs text-neutral-600 flex items-center gap-1">
        <span className="text-xs text-neutral-300 mr-2">
          {selectedCount} {label} selected
        </span>
        <span className="border p-1 rounded-md border-neutral-800 text-neutral-600 min-w-8 text-center">
          Esc
        </span>
        to cancel
      </p>
    );
  }

  if (hasItems) {
    if (isMobile) {
      return (
        <p className="text-xs text-neutral-600 flex items-center gap-1">
          <span className="border p-1 rounded-md border-neutral-800 text-neutral-600 min-w-8 text-center">
            Press Hold
          </span>
          to select Chats
        </p>
      );
    }
    return (
      <p className="text-xs text-neutral-600 flex items-center gap-1">
        <span className="border p-1 rounded-md border-neutral-800 text-neutral-600 min-w-8 text-center">
          ⌘ / Ctrl
        </span>
        +
        <span className="border p-1 rounded-md border-neutral-800 text-neutral-600 min-w-8 text-center">
          Click
        </span>
        to select
      </p>
    );
  }

  return null;
}
