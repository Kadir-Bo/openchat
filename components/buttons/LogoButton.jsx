import Link from "next/link";
import React from "react";
import { twMerge } from "tailwind-merge";

export default function LogoButton({ className = "", href = "/" }) {
  return (
    <Link
      href={href}
      className={twMerge(
        "text-2xl font-serif font-light tracking-[-1.5px] py-3 px-2",
        className,
      )}
    >
      openchat
    </Link>
  );
}
