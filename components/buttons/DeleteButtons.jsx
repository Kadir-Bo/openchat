import { Trash2 } from "react-feather";
import { PrimaryButton } from "@/components";

const redClass =
  "w-max text-sm px-4 text-red-400 border-red-400/30 hover:bg-red-400/10 hover:border-red-400/60";

export default function DeleteButtons({
  selectedCount,
  itemType,
  hasItems,
  onDeleteSelected,
  onDeleteAll,
  extraActions,
}) {
  const label = selectedCount === 1 ? itemType : `${itemType}s`;

  return (
    <>
      {extraActions}
      {selectedCount > 0 ? (
        <PrimaryButton className={redClass} onClick={onDeleteSelected}>
          {`Delete ${selectedCount} ${label}`}
          <Trash2 size={14} />
        </PrimaryButton>
      ) : (
        hasItems && (
          <PrimaryButton className={redClass} onClick={onDeleteAll}>
            {`Delete all ${label}s`}
            <Trash2 size={14} />
          </PrimaryButton>
        )
      )}
    </>
  );
}
