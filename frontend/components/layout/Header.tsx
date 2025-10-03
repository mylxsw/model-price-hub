"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuthStore } from "../../lib/hooks/useAuth";
import { useFilterPanelStore } from "../../lib/hooks/useFilterPanel";
import { useLayoutModeStore } from "../../lib/hooks/useLayoutMode";
import { Button } from "../ui/Button";
import { CurrencySelector } from "../currency/CurrencySelector";

const navItems: Array<{ href: string; label: string }> = [];

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuthStore();
  const { toggle, isOpen } = useFilterPanelStore();
  const layoutMode = useLayoutModeStore((state) => state.mode);
  const containerClasses = [
    "mx-auto flex w-full",
    layoutMode === "centered" ? "max-w-7xl" : "",
    "items-center justify-between px-6 py-4"
  ]
    .filter(Boolean)
    .join(" ");

  const isAdminRoute = pathname?.startsWith("/admin");
  const showFilterButton = pathname === "/catalog";

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
      <div className={containerClasses}>
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
        <div className="flex items-center gap-3">
          <CurrencySelector />
          {showFilterButton && (
            <Button
              variant={isOpen ? "primary" : "ghost"}
              size="sm"
              onClick={toggle}
              aria-label="Search and filter models"
              aria-pressed={isOpen}
              className="px-2"
            >
              <SearchIcon className="h-4 w-4" />
            </Button>
          )}
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
