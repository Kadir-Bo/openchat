import Link from "next/link";
import React from "react";
import { twMerge } from "tailwind-merge";

export default function PrimaryButton({
  text = "button",
  icon = null,
  iconSize = 19,
  className = "",
  onClick,
  href = null,
  active = false,
  filled = false,
  ...props
}) {
  const defaultClasses = `
    min-w-max
    w-full
    font-normal
    text-base
    flex
    justify-start
    items-center
    gap-1
    border
    border-neutral-500/30
    hover:border-neutral-500/50
    hover:bg-neutral-800/10
    py-2
    px-1.5
    rounded-lg
    cursor-pointer
    shadow
    outline-none
    transition-all
    duration-150
    justify-start
    items-center
  `;

  const filledClasses = filled
    ? "bg-neutral-200 text-neutral-950 border-neutral-200 hover:bg-neutral-100 border-transparent"
    : "";

  const activeClasses = active ? "bg-neutral-800 border-neutral-500/60" : "";

  return href ? (
    <Link
      href={href}
      className={twMerge(defaultClasses, activeClasses, className)}
      onClick={onClick}
      {...props}
    >
      {icon && icon}
      {text}
    </Link>
  ) : (
    <button
      className={twMerge(
        defaultClasses,
        filledClasses,
        activeClasses,
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {icon && icon}
      {text}
    </button>
  );
}
