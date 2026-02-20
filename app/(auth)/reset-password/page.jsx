"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Input, PrimaryButton } from "@/components";
import { ArrowLeft } from "react-feather";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword, error } = useAuth();

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
    <div className="w-full md:max-w-sm px-4 md:px-0">
      <PrimaryButton
        text={<ArrowLeft size={16} />}
        href={"/"}
        className="absolute top-0 left-0 w-max min-w-0 p-4 border-none shadow-none justify-center hover:bg-transparent text-white"
      />
      <div className="p-6 md:border border-neutral-900 rounded-lg md:bg-neutral-800/5">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col gap-6 py-4"
            >
              <div>
                <h2 className="text-3xl md:text-2xl font-semibold text-center mb-2">
                  Check your email
                </h2>
                <p className="text-sm text-center text-neutral-400 mt-2">
                  We&apos;ve sent instructions to reset your password.
                </p>
              </div>

              <PrimaryButton
                text="Back to Sign In"
                href="/sign-in"
                className="justify-center"
                cta
              />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <h2 className="text-3xl md:text-2xl font-semibold mb-6 text-center">
                Reset Password
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
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-red-500 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <PrimaryButton
                  text={loading ? "Sending..." : "Reset Password"}
                  className="justify-center hover:ring-2 hover:ring-blue-600/20"
                  cta
                  type="submit"
                  disabled={loading}
                />
              </form>

              <div className="mt-4 text-center text-sm text-neutral-200">
                Remember your password?{" "}
                <Link href="/sign-in" className="text-blue-400 hover:underline">
                  Sign in
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
