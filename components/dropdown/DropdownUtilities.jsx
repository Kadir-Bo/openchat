import { useDropdown } from "@/context";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

const itemClassName =
  "w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800/50 transition-colors flex items-center gap-2 rounded-md";

export function DropdownItem({
  children,
  className = "",
  href,
  onClick,
  ...props
}) {
  const { setIsOpen } = useDropdown();

  // Shared: always close the dropdown, then run any extra onClick
  const handleClose = (e) => {
    setIsOpen(false);
    onClick?.(e);
  };

  if (href) {
    return (
      <Link
        href={href}
        onClick={handleClose}
        className={twMerge(itemClassName, className)}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={handleClose}
      className={twMerge(itemClassName, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator({ className = "" }) {
  return <div className={twMerge("h-px bg-neutral-700/50 my-1", className)} />;
}

export function DropdownLabel({ children, className = "" }) {
  return (
    <div
      className={twMerge(
        "px-3 py-1.5 text-xs text-neutral-500 font-medium truncate",
        className,
      )}
    >
      {children}
    </div>
  );
}
