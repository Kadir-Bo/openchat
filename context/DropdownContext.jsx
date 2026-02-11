"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

const DropdownContext = createContext(null);

export const useDropdown = () => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown components must be used within DropdownProvider");
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

  const handleOpenChange = useCallback(
    (open) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  return (
    <DropdownContext.Provider
      value={{
        isOpen,
        setIsOpen: handleOpenChange,
        modal,
      }}
    >
      {children}
    </DropdownContext.Provider>
  );
}
