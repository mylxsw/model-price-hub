export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-slate-500 transition dark:text-slate-400 sm:flex-row">
        <span>© {new Date().getFullYear()} Model Price Hub.</span>
        <span>Built for comparing LLM pricing.</span>
      </div>
    </footer>
  );
}
