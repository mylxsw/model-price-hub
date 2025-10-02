import { ReactNode } from "react";
import classNames from "classnames";

interface BadgeProps {
  children: ReactNode;
  color?: "primary" | "secondary" | "success" | "warning";
}

const colors = {
  primary: "bg-primary/15 text-primary dark:bg-primary/20",
  secondary: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300"
};

export function Badge({ children, color = "secondary" }: BadgeProps) {
  return <span className={classNames("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", colors[color])}>{children}</span>;
}
