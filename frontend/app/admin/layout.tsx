"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "../../lib/hooks/useAuth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Check for token in localStorage on client side
    const token = localStorage.getItem("mph_token");
    if (token) {
      useAuthStore.getState().login(token);
    }
    setAuthChecked(true);
  }, []);

  const isOnLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!authChecked) {
      return;
    }
    if (!isAuthenticated && !isOnLoginPage) {
      router.replace("/admin/login");
      return;
    }
    if (isAuthenticated && isOnLoginPage) {
      router.replace("/admin/dashboard/models");
    }
  }, [authChecked, isAuthenticated, isOnLoginPage, router]);

  if (!authChecked) {
    return <div className="text-sm text-slate-400">Checking session...</div>;
  }

  if (!isAuthenticated && !isOnLoginPage) {
    return <div className="text-sm text-slate-400">Redirecting to login...</div>;
  }

  return <div className="space-y-8">{children}</div>;
}
