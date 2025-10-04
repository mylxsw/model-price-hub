"use client";

import { useAuthStore } from "../../lib/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { ThemeProvider, useTheme } from "next-themes";

import { ToastProvider } from "../ui/ToastProvider";

function HydrationBodyClassSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const { body } = document;
    body.removeAttribute("data-cici-translated");
    body.classList.remove("__Cici_translated_text_show_underline__");

    if (resolvedTheme) {
      body.dataset.theme = resolvedTheme;
    } else {
      delete body.dataset.theme;
    }
  }, [resolvedTheme]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: any) => {
          if (error?.message?.includes('401')) {
            useAuthStore.getState().logout();
            return false;
          }
          return failureCount < 3;
        }
      },
      mutations: {
        retry: (failureCount, error: any) => {
          if (error?.message?.includes('401')) {
            useAuthStore.getState().logout();
            return false;
          }
          return failureCount < 3;
        }
      }
    }
  }));

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <HydrationBodyClassSync />
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
