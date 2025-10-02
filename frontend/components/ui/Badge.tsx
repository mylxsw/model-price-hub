import { ReactNode } from "react";
import classNames from "classnames";

interface BadgeProps {
  children: ReactNode;
  color?: "primary" | "secondary" | "success" | "warning";
}

const colors = {
  primary: "bg-primary/20 text-primary",
  secondary: "bg-slate-800 text-slate-200",
  success: "bg-emerald-500/20 text-emerald-300",
  warning: "bg-amber-500/20 text-amber-300"
};

export function Badge({ children, color = "secondary" }: BadgeProps) {
  return <span className={classNames("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", colors[color])}>{children}</span>;
}
