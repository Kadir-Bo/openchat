import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";

function OutlinedButton({
  onClick,
  icon = null,
  text = "",
  href = "#",
  variants = null,
  className = " ",
}) {
  return (
    <motion.button
      className={`border border-neutral-800 hover:border-neutral-600 text-gray-50 hover:text-white rounded-lg transition-all duration-200 bg-neutral-950 max-w-xs ${className}`}
      type="button"
      onClick={onClick}
      variants={variants}
    >
      <Link
        href={href}
        className="w-full py-2 px-3 text-sm text-left flex items-center gap-2"
      >
        <span className="truncate flex-1 min-w-0">{text}</span>
        {icon}
      </Link>
    </motion.button>
  );
}

export default OutlinedButton;
