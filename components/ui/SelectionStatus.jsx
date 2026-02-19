export default function SelectionStatus({ selectedCount, itemType, hasItems }) {
  const label = selectedCount === 1 ? itemType : `${itemType}s`;

  if (selectedCount > 0) {
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
