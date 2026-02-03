import Link from "next/link";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
      <div className="w-full max-w-md px-4">
        <div className="bg-white dark:bg-neutral-900/20 border border-neutral-900 rounded-lg shadow-lg p-8">
          {children}
        </div>
        <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
