import { ThemeToggle } from "./ThemeToggle";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-slate-500 transition dark:text-slate-400 sm:flex-row">
        <div className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-left">
          <span>© {new Date().getFullYear()} Model Price Hub.</span>
          <span>Built for comparing LLM pricing.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
