"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuthStore } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";

const navItems = [
  { href: "/catalog", label: "Catalog" },
  { href: "/admin/dashboard/models", label: "Admin" }
];

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuthStore();

  return (
    <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold text-primary">
          Model Price Hub
        </Link>
        <nav className="flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition ${
                pathname.startsWith(item.href)
                  ? "text-primary"
                  : "text-slate-300 hover:text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {isAuthenticated ? (
          <Button variant="secondary" size="sm" onClick={logout}>
            Logout
          </Button>
        ) : (
          <Link href="/admin/login" className="text-sm text-slate-300 hover:text-primary">
            Admin Login
          </Link>
        )}
      </div>
    </header>
  );
}
