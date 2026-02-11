"use client";

import { useDropdown } from "@/context";
import { useRef } from "react";

export default function DropdownTrigger({
  children,
  asChild = false,
  className = "",
}) {
  const { isOpen, setIsOpen } = useDropdown();
  const triggerRef = useRef(null);

  const handleClick = (e) => {
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
      className={className}
    >
      {children}
    </div>
  );
}
