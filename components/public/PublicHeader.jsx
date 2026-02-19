import React from "react";
import { PrimaryButton } from "@/components";
import Link from "next/link";
import Image from "next/image";

export default function PublicHeader() {
  return (
    <header className="fixed top-0 left-0 w-full flex flex-col z-999 ">
      <div className="">
        <nav className="flex items-center justify-between mt-4 max-w-500 w-full mx-auto bg-neutral-950 px-12">
          <Link href={"/"}>
            <Image
              width={100}
              height={40}
              src={"/assets/images/openchat_logo.webp"}
              alt="openchat logo"
              className="max-h-max w-max"
            />
          </Link>
          <div className="w-max flex  items-center justify-end gap-2">
            <PrimaryButton
              className="justify-center w-max border-none text-neutral-300"
              text="Sign Up"
              href={"/sign-up"}
            />
            <PrimaryButton
              className="justify-center w-max"
              text="Sign In"
              href={"/sign-in"}
              filled
            />
          </div>
        </nav>
        <div className="w-full h-8 bg-linear-to-b from-neutral-950 to-transparent" />
      </div>
    </header>
  );
}
