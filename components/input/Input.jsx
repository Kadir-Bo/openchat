import { Lock } from "react-feather";
import { twMerge } from "tailwind-merge";

export default function Input({
  id = "",
  name = "",
  type = "text",
  label = "label",
  value = "",
  placeholder = "",
  autoComplete = "off",
  autoFocus = false,
  disabled = false,
  locked = false,
  containerClassName = "",
  inputClassName = "",
  labelClassName = "",
  required = false,
  onChange = () => null,
  onKeyDown = () => null,
  onBlur = () => null,
  onFocus = () => null,
  ...props
}) {
  const lockedClasses = locked && "opacity-50 cursor-not-allowed";

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
        {locked && <Lock className="text-neutral-500" size={13} />}
      </label>
      <input
        type={type}
        name={name || id}
        id={id}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        onFocus={onFocus}
        required={required}
        className={twMerge(
          "border w-full px-3 py-2 rounded-lg border-neutral-700 bg-transparent outline-none focus:ring-1 focus:ring-blue-500/30 placeholder:text-neutral-500 disabled:cursor-not-allowed",
          " placeholder:text-sm md:placeholder:text-base",
          inputClassName,
          lockedClasses,
        )}
        {...props}
      />
    </div>
  );
}
