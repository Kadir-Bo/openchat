import { Plus } from "react-feather";
import { PrimaryButton } from "@/components";

export default function EmptyStateSearch({
  searchQuery,
  itemType,
  href,
  hrefLabel,
  icon,
}) {
  return (
    <div className="text-center py-12 text-neutral-400">
      {searchQuery ? (
        <p>
          No {itemType}s found matching &quot;{searchQuery}&quot;
        </p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p>No {itemType}s yet</p>
          <PrimaryButton
            text={hrefLabel}
            icon={icon ?? <Plus size={17} />}
            className="w-max justify-center text-sm px-4"
            href={href}
            filled={!icon}
          />
        </div>
      )}
    </div>
  );
}
