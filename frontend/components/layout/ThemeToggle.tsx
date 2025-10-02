"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { Button } from "../ui/Button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" aria-label="Toggle theme" disabled>
        …
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Switch to light" : "Switch to dark";

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="min-w-[2.5rem]"
    >
      {isDark ? "🌙" : "☀️"}
    </Button>
  );
}
