import { ReactNode } from "react";

interface TableColumn<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  emptyMessage?: string;
}

export function Table<T>({ data, columns, emptyMessage = "No results" }: TableProps<T>) {
  if (!data.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white/80 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-800">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
        <thead className="bg-slate-100/80 dark:bg-slate-900/80">
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white/70 dark:divide-slate-800 dark:bg-slate-900/60">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-100/70 dark:hover:bg-slate-800/50">
              {columns.map((column) => (
                <td key={column.header} className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                  {column.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
