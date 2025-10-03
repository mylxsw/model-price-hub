"use client";

import { Button } from "../ui/Button";
import { useLayoutModeStore } from "../../lib/hooks/useLayoutMode";
import { ThemeToggle } from "./ThemeToggle";

function LayoutToggleIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-4 w-4 text-slate-500 transition dark:text-slate-400"
    >
      {active ? (
        <path
          d="M4 6h16M6 12h12M4 18h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ) : (
        <>
          <path
            d="M4 6h16M10 12h4M4 18h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="7" y="10" width="10" height="4" rx="1" fill="currentColor" opacity="0.25" />
        </>
      )}
    </svg>
  );
}

export function Footer() {
  const { mode, toggle: toggleLayoutMode } = useLayoutModeStore((state) => ({
    mode: state.mode,
    toggle: state.toggle
  }));
  const containerWidth = mode === "centered" ? "max-w-7xl" : "";
  const containerClasses = [
    "mx-auto flex w-full",
    containerWidth,
    "flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-slate-500 transition dark:text-slate-400 sm:flex-row"
  ]
    .filter(Boolean)
    .join(" ");
  const isFullWidth = mode === "full";
  const layoutLabel = isFullWidth ? "Switch to centered layout" : "Switch to full-width layout";

  return (
    <footer className="border-t border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/70">
      <div className={containerClasses}>
        <div className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-left">
          <span>© {new Date().getFullYear()} Model Price Hub.</span>
          <span>Built for comparing LLM pricing.</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={isFullWidth}
            aria-label={layoutLabel}
            onClick={toggleLayoutMode}
            className="px-2"
          >
            <LayoutToggleIcon active={isFullWidth} />
          </Button>
        </div>
      </div>
    </footer>
  );
}
