import { Lock } from "react-feather";
import { twMerge } from "tailwind-merge";
import { PrimaryButton, DropdownMenu, Icon } from "@/components";

export default function Select({
  id = "",
  name = "",
  label = "label",
  value = "",
  list = [],
  disabled = false,
  locked = false,
  containerClassName = "",
  labelClassName = "",
  buttonClassName = "",
  onChange = () => null,
  onBlur = () => null,
  onFocus = () => null,
}) {
  const lockedClasses = locked && "opacity-50 cursor-not-allowed";

  const handleSelect = (e, menuItem) => {
    // Create synthetic event to match input onChange signature
    const syntheticEvent = {
      target: {
        name: name || id,
        value: menuItem.value || menuItem.id,
      },
    };
    onChange(syntheticEvent);
  };

  return (
    <div
      className={twMerge(
        "w-full min-w-40 relative",
        containerClassName,
        lockedClasses,
      )}
    >
      <label
        htmlFor={id}
        className={twMerge(
          "mb-1.5 text-neutral-400 text-sm ml-px flex gap-1 items-center justify-start pl-px",
          labelClassName,
          lockedClasses,
        )}
      >
        {label}
        {locked && <Icon name={Lock} className="text-neutral-500" size="xs" />}
      </label>
      {list && list.length > 0 && (
        <DropdownMenu
          dropdownList={list}
          onClick={handleSelect}
          triggerClassName="w-full"
          contentSide="bottom"
        >
          <PrimaryButton
            className={twMerge(
              "border w-full px-3 py-2 rounded-lg border-neutral-700 outline-none focus:ring-1 focus:ring-blue-500/30 justify-between text-left bg-transparent",
              !value && "text-neutral-500",
              buttonClassName,
              lockedClasses,
            )}
            disabled={locked || disabled}
            aria-label={label}
            onBlur={onBlur}
            onFocus={onFocus}
          >
            {value || "Select an option"}
          </PrimaryButton>
        </DropdownMenu>
      )}
    </div>
  );
}
