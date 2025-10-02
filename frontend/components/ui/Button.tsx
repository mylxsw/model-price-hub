"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import classNames from "classnames";

type ButtonVariant = "primary" | "secondary" | "ghost" | "success" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const baseStyles =
  "inline-flex items-center justify-center rounded-md font-medium transition focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-950";
const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark focus:ring-primary",
  secondary:
    "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-200 focus:ring-slate-300 dark:text-slate-300 dark:hover:bg-slate-800",
  success: "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400",
  danger: "bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-400"
};
const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-lg"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button ref={ref} className={classNames(baseStyles, variantStyles[variant], sizeStyles[size], className)} {...props} />
  )
);

Button.displayName = "Button";
