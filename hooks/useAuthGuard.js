import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context";

export function useAuthGuard(redirectTo = "/chat") {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push(redirectTo);
  }, [user]);

  return { user, loading };
}
