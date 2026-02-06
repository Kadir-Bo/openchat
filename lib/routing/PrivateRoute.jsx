"use client";

import { useAuth } from "@/context";
import { redirect } from "next/navigation";
import React from "react";

export default function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    redirect("/sign-in");
  }
  return <React.Fragment>{children}</React.Fragment>;
}
