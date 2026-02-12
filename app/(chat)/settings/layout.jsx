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
    <div className="max-w-4xl mx-auto pt-20 pb-8">
      <h1 className="text-2xl mb-6">Settings</h1>

      <div className="flex gap-6 items-start">
        {/* Sidebar Navigation */}
        <aside className="w-48 shrink-0">
          <nav aria-label="Settings navigation">
            <ul className="space-y-1">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;

                return (
                  <li key={tab.href}>
                    <PrimaryButton
                      text={tab.name}
                      href={tab.href}
                      className="border-transparent hover:border-transparent hover:bg-neutral-800 shadow-none pl-3"
                      active={isActive}
                    />
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
