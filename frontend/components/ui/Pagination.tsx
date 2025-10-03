"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const createPageRange = (current: number, total: number, delta = 2): number[] => {
  const range: number[] = [];
  const start = Math.max(1, current - delta);
  const end = Math.min(total, current + delta);
  for (let page = start; page <= end; page += 1) {
    range.push(page);
  }
  if (!range.includes(1)) {
    range.unshift(1);
  }
  if (!range.includes(total)) {
    range.push(total);
  }
  return Array.from(new Set(range)).sort((a, b) => a - b);
};

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = createPageRange(currentPage, totalPages);

  const handleChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    onPageChange(page);
  };

  return (
    <nav className="flex items-center gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => handleChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
        aria-label="Previous page"
      >
        ‹
      </button>
      {pages.map((page, index) => {
        const isActive = page === currentPage;
        const showEllipsis = index > 0 && page - pages[index - 1] > 1;
        return (
          <div key={page} className="flex items-center">
            {showEllipsis && <span className="px-2 text-sm text-slate-400">…</span>}
            <button
              type="button"
              onClick={() => handleChange(page)}
              className={[
                "rounded-full px-3 py-1 text-sm transition",
                isActive
                  ? "bg-primary text-white shadow"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              {page}
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => handleChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}
