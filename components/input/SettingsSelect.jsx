import { Lock } from "react-feather";
import { twMerge } from "tailwind-merge";
import {
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  PrimaryButton,
} from "@/components";
import { Dropdown } from "@/context";

export default function SettingsSelect({
  id = "",
  label = "label",
  ContainerClassName = "",
  labelClassName = "",
  disabled = false,
  list = [],
  value = "",
  onChange = () => null,
}) {
  const disabledContainerClasses = disabled && "opacity-50 border-neutral-8003";
  return (
    <div
      className={twMerge(
        "w-full min-w-40 relative",
        ContainerClassName,
        disabledContainerClasses,
      )}
    >
      <label
        htmlFor={id}
        className={twMerge(
          "mb-1.5 text-neutral-300/80 text-sm ml-px flex gap-1 items-center justify-start",
          labelClassName,
        )}
      >
        {label}
        {disabled && <Lock className="text-neutral-500" size={13} />}
      </label>
      {list && (
        <Dropdown>
          <DropdownTrigger className="w-max min-w-40">
            <PrimaryButton
              text={value}
              className="border w-full px-3 py-2 rounded-lg border-neutral-600 outline-none focus:ring-1 focus:ring-blue-500/30"
              aria-label="Chat Optionen"
            />
          </DropdownTrigger>

          <DropdownContent side="bottom">
            {list.map((menuItem) => (
              <DropdownItem
                key={menuItem.id}
                onClick={() => onChange(menuItem.select)}
              >
                {menuItem.model}
              </DropdownItem>
            ))}
          </DropdownContent>
        </Dropdown>
      )}
    </div>
  );
}
