"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classNames from "classnames";

import { useLayoutModeStore } from "../../../lib/hooks/useLayoutMode";

const links = [
  { href: "/admin/dashboard/models", label: "Models" },
  { href: "/admin/dashboard/vendors", label: "Vendors" }
];

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mode = useLayoutModeStore((state) => state.mode);

  const containerClasses = classNames(
    "w-full space-y-8 px-4 pb-12 sm:px-6",
    mode === "centered" ? "mx-auto max-w-6xl" : "mx-auto"
  );

  return (
    <div className={containerClasses}>
      <nav className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white/90 p-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        {links.map((link) => {
          const isActive = pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={classNames(
                "rounded-md px-3 py-2 font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-6">{children}</div>
    </div>
  );
}
