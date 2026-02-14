"use client";

import { useDropdown } from "@/context";
import { useRef } from "react";
import { twMerge } from "tailwind-merge";

export default function DropdownTrigger({
  children,
  asChild = false,
  className = "",
}) {
  const { isOpen, setIsOpen } = useDropdown();
  const triggerRef = useRef(null);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Falls asChild=true, clone das Kind und füge Props hinzu
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: triggerRef,
      onClick: handleClick,
      "aria-expanded": isOpen,
      "aria-haspopup": "true",
    });
  }

  return (
    <div
      ref={triggerRef}
      onClick={handleClick}
      aria-expanded={isOpen}
      aria-haspopup="true"
      className={twMerge("cursor-pointer", className)}
    >
      {children}
    </div>
  );
}
