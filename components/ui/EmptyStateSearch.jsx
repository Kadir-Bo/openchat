import { Plus } from "react-feather";
import { Icon, PrimaryButton } from "@/components";

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
            className="w-max justify-center text-sm px-4"
            href={href}
            filled={!icon}
          >
            {hrefLabel}
            {icon ?? <Icon name={Plus} size="sm" />}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
