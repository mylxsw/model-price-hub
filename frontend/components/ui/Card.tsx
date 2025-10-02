import { ReactNode } from "react";
import classNames from "classnames";

interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function Card({ title, description, children, className, actions }: CardProps) {
  return (
    <div
      className={classNames(
        "rounded-xl border border-slate-200 bg-white/90 p-6 shadow-lg transition dark:border-slate-800 dark:bg-slate-900/70",
        className
      )}
    >
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100">{title}</h3>}
            {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
