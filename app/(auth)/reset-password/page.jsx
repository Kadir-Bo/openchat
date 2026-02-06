"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { ArrowLeft } from "react-feather";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucess, setSuccess] = useState(false);
  const { resetPassword, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(
        "We've sent you an email with instructions to reset your password.",
      );
    } catch (err) {
      console.error("Reset password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div
        className={clsx(
          "p-6 shadow-lg shadow-neutral-800/5 border rounded-lg bg-neutral-800/5 min-h-80 flex flex-col",
          {
            "border-red-500/10": error,
            "border-green-500/10": sucess,
            "border-neutral-900": !error && !sucess,
          },
        )}
      >
        <AnimatePresence mode="wait">
          {sucess ? (
            <motion.div
              key="success"
              className="flex flex-col flex-1 justify-center gap-6"
            >
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <h2 className="text-2xl font-semibold text-center mb-2">
                  Confirm Reset
                </h2>

                <p className="text-sm text-center px-6 text-gray-400">
                  We&apos;ve sent you an email with instructions to reset your
                  password.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <Link
                  href="/sign-in"
                  className="block w-full bg-blue-600 text-white rounded-lg py-2.5 hover:bg-blue-700 text-center transition-colors"
                >
                  Sign In
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col flex-1 justify-center"
            >
              <h2 className="text-2xl font-semibold mb-6 text-center">
                Reset Password
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 px-6">
                <div>
                  <label className="block text-gray-400 text-xs font-medium tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-800 rounded-lg outline-none focus:ring focus:ring-blue-500/20"
                    autoComplete="email"
                    required
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-red-500 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white rounded-lg py-2.5 hover:bg-blue-700 disabled:opacity-50 mt-4 transition-colors"
                >
                  {loading ? "Resetting password..." : "Reset Password"}
                </button>
              </form>

              <div className="mt-4 text-center text-sm text-gray-600">
                Back to{" "}
                <Link href="/sign-in" className="text-blue-600 hover:underline">
                  sign in
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Link
        href="/"
        className="flex justify-center items-center gap-px mt-3 text-sm text-gray-500 hover:text-gray-200 transition-all duration-75"
      >
        <ArrowLeft size={16} />
        return home
      </Link>
    </div>
  );
}
