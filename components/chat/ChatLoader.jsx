import React from "react";

export default function ChatLoader() {
  return (
    <div className="max-w-220 mx-auto w-full h-full px-4 py-8">
      <div className="space-y-6 h-full overflow-y-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="w-full h-52 rounded-2xl odd:max-w-[80%] flex odd:justify-self-end odd:h-16 bg-neutral-900/50 odd:bg-neutral-900 animate-pulse duration-300"
          ></div>
        ))}
      </div>
    </div>
  );
}
