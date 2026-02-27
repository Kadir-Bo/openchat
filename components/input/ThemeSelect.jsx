import Image from "next/image";
import React from "react";
import { twMerge } from "tailwind-merge";

export default function ThemeSelect({ themes, activeTheme, onClick }) {
  return (
    <div>
      <span className="mb-1.5 text-neutral-300/80 text-sm ml-px flex gap-1 items-center justify-start">
        Appearance
      </span>
      <div className="flex gap-4 max-w-full">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className="flex flex-col gap-2 group"
            onClick={() => onClick(theme.id)}
          >
            <div
              className={twMerge(
                "w-full min-w-0 md:w-32 h-24 border rounded-xl cursor-pointer border-neutral-500  overflow-hidden transition-all duration-100 max-w-full",
                theme.id === activeTheme
                  ? "ring-2 ring-blue-500/50"
                  : "hover:border-neutral-400",
              )}
            >
              <Image
                width={160}
                height={140}
                src={theme.imageURL}
                alt={`${theme.id}_theme thumbnail`}
                className="w-full min-w-max h-full object-cover group-hover:opacity-100 opacity-80 transition-opacity duration-200"
              />
            </div>
            <span
              className={twMerge(
                "flex justify-center text-sm capitalize group-hover:text-neutral-200  transition-colors duration-200",
                theme.id === activeTheme
                  ? "text-neutral-200"
                  : "text-neutral-400",
              )}
            >
              {theme.theme}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
