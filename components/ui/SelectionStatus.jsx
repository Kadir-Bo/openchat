import { useIsMobile } from "@/hooks";
import { Icon } from "@/components";
import { X } from "react-feather";

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
          className="text-xs text-neutral-600 flex items-center gap-1.5"
          onClick={onCancel}
        >
          <Icon name={X} size="xs" />
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
        <p className="text-xs text-neutral-700 flex items-center gap-1.5">
          <kbd className="border border-neutral-800 px-1.5 py-0.5 rounded text-[11px]">
            Hold
          </kbd>
          to select
        </p>
      );
    }
    return (
      <p className="text-xs text-neutral-700 flex items-center gap-1.5">
        <kbd className="border border-neutral-800 px-1.5 py-0.5 rounded text-[11px]">
          ⌘
        </kbd>
        <span>click to select</span>
      </p>
    );
  }

  return null;
}
