"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "react-feather";
import { useAuth } from "@/context/AuthContext";
import { useAuthGuard } from "@/hooks";
import { Input, PrimaryButton, AuthFormShell } from "@/components";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, error } = useAuth();
  const { user, loading: authLoading } = useAuthGuard();

  if (authLoading || user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password);
    } catch (err) {
      console.error("Registration error:", err);
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

      <AuthFormShell
        title="Create Account"
        error={error}
        footer={
          <>
            Already have an account?{" "}
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
          <div className="space-y-3 md:space-y-4">
            <Input
              label="Email"
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Example@mail.com"
            />
            <Input
              label="Password"
              value={password}
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
            />
            <Input
              label="Confirm Password"
              value={confirmPassword}
              type="password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
              minLength={6}
            />
          </div>

          <PrimaryButton
            className="justify-center hover:ring-1 hover:ring-blue-500"
            type="submit"
            cta
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </PrimaryButton>
        </form>
      </AuthFormShell>
    </>
  );
}
