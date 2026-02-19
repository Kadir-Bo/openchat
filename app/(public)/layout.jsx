"use client";

import { PublicHeader } from "@/components";
import { useAuth } from "@/context";
import { redirect } from "next/navigation";
import React from "react";

export default function PublicLayout({ children }) {
  const { user } = useAuth();
  if (user) {
    redirect("/chat");
  }
  return (
    <React.Fragment>
      <PublicHeader />
      <main className="h-screen">{children}</main>
    </React.Fragment>
  );
}
