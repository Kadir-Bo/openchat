"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "react-feather";
import { Input, PrimaryButton } from "@/components";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, error, user } = useAuth();
  const router = useRouter();

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

  useEffect(() => {
    if (user) router.push("/chat");
  }, [user]);

  return (
    <div className="w-full max-w-sm">
      <div className="p-6 border border-neutral-900 rounded-lg bg-neutral-800/5">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Create Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <PrimaryButton
            text={loading ? "Creating account..." : "Sign Up"}
            className="justify-center hover:ring-1 hover:ring-blue-500 "
            type="submit"
            disabled={loading}
          />
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-blue-400/50 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
      <PrimaryButton
        text="return home"
        href={"/"}
        icon={<ArrowLeft size={16} />}
        className="border-none shadow-none justify-center text-neutral-500/80 hover:text-neutral-500 hover:bg-transparent "
      />
    </div>
  );
}
