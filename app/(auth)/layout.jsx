export default function AuthLayout({ children }) {
  return (
    <main className="h-dvh md:min-h-screen flex items-center justify-center">
      {children}
    </main>
  );
}
