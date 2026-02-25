import React from "react";
import { LogoButton, PrimaryButton } from "@/components";

export default function PublicHeader() {
  return (
    <header className="fixed top-0 left-0 w-full flex flex-col z-999 bg-neutral-950 border-b border-neutral-800">
      <nav className="flex items-center justify-between max-w-500 w-full mx-auto px-4 lg:px-12 h-20">
        <LogoButton />
        <div className="w-max flex  items-center justify-end gap-2">
          <PrimaryButton
            className="justify-center w-max text-neutral-300 hidden md:flex"
            href={"/sign-up"}
          >
            Sign Up
          </PrimaryButton>
          <PrimaryButton
            className="justify-center w-max"
            href={"/sign-in"}
            filled
          >
            Sign In
          </PrimaryButton>
        </div>
      </nav>
    </header>
  );
}
