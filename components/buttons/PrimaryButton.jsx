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
    gap-2
    border
    border-neutral-500/30
    hover:border-neutral-500/50
    focus:border-neutral-500/60
    hover:bg-neutral-800/10
    focus:bg-neutral-800/10
    py-2
    px-1.5
    rounded-lg
    cursor-pointer
    shadow
    outline-none
    transition-all
    duration-150
  `;

  return href ? (
    <Link
      href={href}
      className={twMerge(defaultClasses, className)}
      onClick={onClick}
      {...props}
    >
      {icon && icon}
      {text}
    </Link>
  ) : (
    <button
      className={twMerge(defaultClasses, className)}
      onClick={onClick}
      {...props}
    >
      {icon && icon}
      {text}
    </button>
  );
}
