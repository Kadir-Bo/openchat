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
  tooltip = null,
  tooltipPosition = "top",
  cta = null,
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
    hover:bg-neutral-900
    py-2.5
    px-2
    rounded-lg
    cursor-pointer
    shadow
    outline-none
    transition-all
    duration-150
    justify-start
    items-center
    relative
    group
    min-w-22
  `;

  const filledClasses = filled
    ? "bg-neutral-200 text-neutral-950 border-neutral-200 hover:bg-neutral-100 border-transparent"
    : "";

  const activeClasses = active
    ? "bg-neutral-800 hover:bg-neutral-800 border-neutral-500/60"
    : "";

  const tooltipPositionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };
  const ctaClasses = cta && `text-lg py-3 font-medium md:text-base md:py-2`;
  const tooltipElement = tooltip && (
    <span
      className={twMerge(
        "absolute whitespace-nowrap bg-neutral-800 text-neutral-100 text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 group-hover:delay-500 delay-0 z-10",
        tooltipPositionClasses[tooltipPosition],
      )}
    >
      {tooltip}
    </span>
  );

  return href ? (
    <Link
      href={href}
      className={twMerge(
        defaultClasses,
        filledClasses,
        activeClasses,
        ctaClasses,
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {tooltipElement}
      {icon && icon}
      {text}
    </Link>
  ) : (
    <button
      className={twMerge(
        defaultClasses,
        filledClasses,
        activeClasses,
        ctaClasses,
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {tooltipElement}
      {icon && icon}
      {text}
    </button>
  );
}
