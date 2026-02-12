import { Lock } from "react-feather";
import { twMerge } from "tailwind-merge";

export default function SettingsInput({
  id = "",
  label = "label",
  value = "",
  placeholder = "",
  ContainerClassName = "",
  InputClassName = "",
  labelClassName = "",
  disabled = false,
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
      <input
        type="text"
        name={id}
        id={id}
        disabled={disabled}
        className={twMerge(
          "border w-full px-3 py-2 rounded-lg border-neutral-600 outline-none focus:ring-1 focus:ring-blue-500/30",
          InputClassName,
        )}
        autoComplete="username"
        onChange={onChange}
        value={value}
        placeholder={placeholder}
      />
    </div>
  );
}
