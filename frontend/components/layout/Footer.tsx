export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/70">
      <div className="container mx-auto px-6 py-6 text-sm text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© {new Date().getFullYear()} Model Price Hub.</span>
        <span>Built for comparing LLM pricing.</span>
      </div>
    </footer>
  );
}
