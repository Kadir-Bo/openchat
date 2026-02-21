import React from "react";
import { LogoButton, PrimaryButton } from "@/components";

export default function PublicHeader() {
  return (
    <header className="fixed top-0 left-0 w-full flex flex-col z-999 ">
      <nav className="flex items-center justify-between mt-4 max-w-500 w-full mx-auto bg-neutral-950 px-4 lg:px-12">
        <LogoButton />
        <div className="w-max flex  items-center justify-end gap-2">
          <PrimaryButton
            className="justify-center w-maxa text-neutral-300"
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
