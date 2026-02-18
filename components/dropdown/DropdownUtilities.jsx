import { useDropdown } from "@/context";
import { redirect } from "next/navigation";
import { twMerge } from "tailwind-merge";

export function DropdownItem({
  children,
  className = "",
  href,
  onClick,
  ...props
}) {
  const { setIsOpen } = useDropdown();

  const handleClick = (e) => {
    onClick?.(e);
    setIsOpen(false);
    if (href) {
      return redirect(href);
    }
  };

  const itemClassName =
    "w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-neutral-800/50 transition-colors flex items-center gap-2 rounded-md";

  return (
    <button
      onClick={handleClick}
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
        "px-3 py-1.5 text-xs text-gray-500 font-medium truncate",
        className,
      )}
    >
      {children}
    </div>
  );
}
