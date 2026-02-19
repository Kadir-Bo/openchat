"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "react-feather";
import { Input, PrimaryButton } from "@/components";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, error, user } = useAuth();
  const router = useRouter();

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

  useEffect(() => {
    if (user) router.push("/chat");
  }, [user]);

  return (
    <div className="w-full max-w-sm">
      <div className="p-6 border border-neutral-900 rounded-lg bg-neutral-800/5">
        <h2 className="text-2xl font-semibold mb-6 text-center">Sign In</h2>

        <form onSubmit={handleSubmit} className="space-y-4 px-6">
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
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <PrimaryButton
            text={loading ? "Signing in..." : "Sign In"}
            className="justify-center hover:ring-2 hover:ring-blue-600/20 "
            type="submit"
            disabled={loading}
          />
        </form>

        <div className="mt-4 text-center text-sm">
          <Link
            href="/reset-password"
            className="text-blue-400/50 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-blue-400/50 hover:underline">
            Sign up
          </Link>
        </div>
      </div>

      <PrimaryButton
        text="return home"
        href={"/"}
        icon={<ArrowLeft size={16} />}
        className="border-none shadow-none justify-center text-neutral-500/80 hover:text-neutral-500 hover:bg-transparent"
      />
    </div>
  );
}
