import Link from "next/link";
import React from "react";

export default function LogoButton() {
  return (
    <Link
      href={"/"}
      className="text-2xl font-serif font-light tracking-[-1.5px] py-3 px-2"
    >
      openchat
    </Link>
  );
}
