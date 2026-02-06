"use client";
import React from "react";
import { ChevronsLeft, Play } from "react-feather";

export default function AnimationController({ state, setState }) {
  const handlePlayAnimation = () => {
    setState((state) => !state);
  };
  return (
    <div className="absolute bottom-0 left-0 flex">
      <button
        type="button"
        onClick={handlePlayAnimation}
        className={`p-5 border aspect-square bg-neutral-950 transition-all duration-100 cursor-pointer ${!state ? "border-white bg-white text-black " : "border-white text-neutral-500"}`}
      >
        {state ? <ChevronsLeft /> : <Play />}
      </button>
    </div>
  );
}
