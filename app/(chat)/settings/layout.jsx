"use client";

import { PrimaryButton } from "@/components";
import { usePathname } from "next/navigation";

export default function SettingsLayout({ children }) {
  const pathname = usePathname();

  const tabs = [
    { name: "General", href: "/settings/general" },
    { name: "Account", href: "/settings/account" },
    { name: "Privacy", href: "/settings/privacy" },
  ];
  return (
    <div className={`h-[calc(100dvh-48px)] overflow-y-scroll px-4 py-8`}>
      <div className="pt-12 max-w-220 mx-auto flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-48 fixed md:relative left-0 top-12 md:top-0 z-99 shrink-0 px-5 py-2 md:py-0 md:px-0 bg-neutral-900 border-t md:border-none border-neutral-800 md:bg-transparent">
          <nav aria-label="Settings navigation">
            <ul className="space-y-1 flex flex-row md:flex-col justify-center">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;

                return (
                  <li key={tab.href}>
                    <PrimaryButton
                      href={tab.href}
                      className="border-transparent hover:border-transparent hover:bg-neutral-800  py-2"
                      active={isActive}
                    >
                      {tab.name}
                    </PrimaryButton>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="pt-8">{children}</main>
      </div>
    </div>
  );
}
