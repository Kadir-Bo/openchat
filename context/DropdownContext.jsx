"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

const DropdownContext = createContext(null);

export const useDropdown = () => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown components must be used within a Dropdown");
  }
  return context;
};

export default function Dropdown({
  children,
  onOpenChange,
  defaultOpen = false,
  modal = true,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  // Shared ref so DropdownContent can exclude the trigger from outside-click
  const triggerRef = useRef(null);

  const handleOpenChange = useCallback(
    (open) => {
      const next = typeof open === "function" ? open(isOpen) : open;
      setIsOpen(next);
      onOpenChange?.(next);
    },
    [isOpen, onOpenChange],
  );

  return (
    <DropdownContext.Provider
      value={{ isOpen, setIsOpen: handleOpenChange, triggerRef, modal }}
    >
      {children}
    </DropdownContext.Provider>
  );
}
