"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import classNames from "classnames";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition focus:ring-2 focus:ring-offset-2";
const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark focus:ring-primary",
  secondary: "bg-slate-800 text-slate-200 hover:bg-slate-700 focus:ring-slate-500",
  ghost: "bg-transparent text-slate-300 hover:bg-slate-800 focus:ring-slate-500"
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
