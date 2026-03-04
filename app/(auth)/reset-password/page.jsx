"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "react-feather";
import { useAuth } from "@/context";
import { useAuthGuard } from "@/hooks";
import { Input, PrimaryButton, AuthFormShell } from "@/components";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword, error } = useAuth();
  const { user, loading: authLoading } = useAuthGuard();

  if (authLoading || user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      console.error("Reset password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PrimaryButton
        href="/"
        className="fixed top-0 left-0 w-max min-w-0 p-4 border-none  justify-center hover:bg-transparent text-white"
      >
        <ArrowLeft size={16} />
      </PrimaryButton>

      {success ? (
        <AuthFormShell
          animKey="success"
          title="Check your email"
          footer={
            <PrimaryButton
              href="/sign-in"
              className="justify-center w-full"
              cta
            >
              Back to Sign In
            </PrimaryButton>
          }
        >
          <p className="text-sm text-center text-neutral-400 -mt-4 mb-2">
            We&apos;ve sent instructions to reset your password.
          </p>
        </AuthFormShell>
      ) : (
        // ── Form state ───────────────────────────────────
        <AuthFormShell
          animKey="form"
          title="Reset Password"
          error={error}
          footer={
            <>
              Remember your password?{" "}
              <Link href="/sign-in" className="text-blue-400 hover:underline">
                Sign in
              </Link>
            </>
          }
        >
          <form
            onSubmit={handleSubmit}
            className="space-y-6 md:space-y-8 px-3 md:px-6"
          >
            <Input
              label="Email"
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="Example@mail.com"
            />

            <PrimaryButton
              className="justify-center hover:ring-2 hover:ring-blue-600/20"
              cta
              type="submit"
              disabled={loading}
            >
              {loading ? "Sending..." : "Reset Password"}
            </PrimaryButton>
          </form>
        </AuthFormShell>
      )}
    </>
  );
}
