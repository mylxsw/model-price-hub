"use client";

import { ReactNode } from "react";

import { useLayoutModeStore } from "../../lib/hooks/useLayoutMode";

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const mode = useLayoutModeStore((state) => state.mode);
  const baseClasses = "flex-1 w-full px-6 py-8 lg:px-10";
  const widthClasses = mode === "centered" ? "mx-auto max-w-7xl" : "";
  const className = [baseClasses, widthClasses].filter(Boolean).join(" ");

  return <main className={className}>{children}</main>;
}
