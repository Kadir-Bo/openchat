"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "react-feather";
import { useAuth } from "@/context/AuthContext";
import { useAuthGuard } from "@/hooks";
import { Input, PrimaryButton, AuthFormShell } from "@/components";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, error } = useAuth();
  const { user, loading: authLoading } = useAuthGuard();

  if (authLoading || user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PrimaryButton
        href="/"
        text={<ArrowLeft size={16} />}
        className="fixed top-0 left-0 w-max min-w-0 p-4 border-none shadow-none justify-center hover:bg-transparent text-white"
      />

      <AuthFormShell
        title="Sign In"
        error={error}
        footer={
          <>
            <Link
              href="/reset-password"
              className="block mb-2 text-neutral-400 hover:underline"
            >
              Forgot password?
            </Link>
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-blue-400 hover:underline">
              Sign up
            </Link>
          </>
        }
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-12 md:space-y-8 px-3 md:px-6"
        >
          <div className="space-y-3 md:space-y-4">
            <Input
              label="Email"
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="Example@mail.com"
            />
            <Input
              label="Password"
              value={password}
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Password"
              required
            />
          </div>

          <PrimaryButton
            text={loading ? "Signing in..." : "Sign In"}
            className="justify-center hover:ring-2 hover:ring-blue-600/20"
            cta
            type="submit"
            disabled={loading}
          />
        </form>
      </AuthFormShell>
    </>
  );
}
