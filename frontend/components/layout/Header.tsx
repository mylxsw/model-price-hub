"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuthStore } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import { ThemeToggle } from "./ThemeToggle";

const navItems: Array<{ href: string; label: string }> = [];

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuthStore();

  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold text-primary">
          Model Price Hub
        </Link>
        {navItems.length > 0 && (
          <nav className="flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${
                  pathname.startsWith(item.href)
                    ? "text-primary"
                    : "text-slate-600 hover:text-primary dark:text-slate-300"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated && isAdminRoute && (
            <Button variant="secondary" size="sm" onClick={logout}>
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
