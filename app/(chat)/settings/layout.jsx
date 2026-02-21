// app/settings/layout.jsx
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
    <div className="max-w-220 mx-auto">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-48 fixed md:relative left-0 top-20 z-99 shrink-0 px-5 py-2 md:py-0 md:px-0 bg-neutral-900 md:bg-transparent">
          <nav aria-label="Settings navigation">
            <ul className="space-y-1 flex flex-row md:flex-col justify-center">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;

                return (
                  <li key={tab.href}>
                    <PrimaryButton
                      href={tab.href}
                      className="border-transparent hover:border-transparent hover:bg-neutral-800 shadow-none py-2"
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
        <main className="flex-1 w-full pt-40 py-8 md:pt-22">{children}</main>
      </div>
    </div>
  );
}
