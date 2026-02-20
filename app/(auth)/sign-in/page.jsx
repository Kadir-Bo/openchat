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
    <div className="w-full md:max-w-sm px-4 md:px-0">
      <PrimaryButton
        href={"/"}
        text={<ArrowLeft size={16} />}
        className="absolute top-0 left-0 w-max aspect-square p-6 min-w-0 border-none shadow-none justify-center hover:bg-transparent "
        tooltip={"return home"}
        tooltipPosition="right"
      />
      <div className="p-6 md:border border-neutral-900 rounded-lg md:bg-neutral-800/5">
        <h2 className="text-3xl md:text-2xl font-semibold mb-6 text-center">
          Sign In
        </h2>

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
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <PrimaryButton
            text={loading ? "Signing in..." : "Sign In"}
            className="justify-center hover:ring-2 hover:ring-blue-600/20"
            cta
            type="submit"
            disabled={loading}
          />
        </form>

        <div className="mt-4 text-center text-sm">
          <Link
            href="/reset-password"
            className="text-neutral-400 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <div className="mt-4 text-center text-sm text-neutral-200">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-blue-400 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
