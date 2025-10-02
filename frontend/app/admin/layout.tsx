"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

import { initializeAuthFromStorage, useAuthStore } from "../../lib/hooks/useAuth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    initializeAuthFromStorage();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <div className="text-sm text-slate-400">Redirecting to login...</div>;
  }

  return <div className="space-y-8">{children}</div>;
}
