import { Dropdown } from "@/context";
import React from "react";
import {
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
  Icon,
} from "@/components";
import { MoreHorizontal } from "react-feather";

export default function DropdownMenu({
  dropdownList = [],
  children,
  onClick = () => null,
  triggerClassName = "",
  contentClassName = "",
  itemClassName = "",
  contentSide = "bottom",
  onOpenChange,
  contentSideOffset,
}) {
  return (
    <Dropdown onOpenChange={onOpenChange}>
      <DropdownTrigger className={triggerClassName}>
        {children ? children : <MoreHorizontal size={17} />}
      </DropdownTrigger>

      <DropdownContent
        side={contentSide}
        className={contentClassName}
        sideOffset={contentSideOffset}
      >
        {dropdownList.map((menuItem) => (
          <React.Fragment key={menuItem.id}>
            {menuItem.separator && <DropdownSeparator />}
            <DropdownItem
              href={menuItem.href}
              className={itemClassName}
              onClick={menuItem.href ? undefined : (e) => onClick(e, menuItem)}
            >
              {menuItem.icon && (
                <Icon
                  name={menuItem.icon}
                  size="sm"
                  strokeWidth={1.5}
                  className="shrink-0"
                />
              )}
              <span className="truncate min-w-0">{menuItem.label}</span>
            </DropdownItem>
          </React.Fragment>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
