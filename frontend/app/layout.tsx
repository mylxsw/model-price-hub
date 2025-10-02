import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Providers } from "../components/layout/Providers";

export const metadata: Metadata = {
  title: "Model Price Hub",
  description: "Compare large language model pricing across vendors"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <Providers>
          <Header />
          <main className="mx-auto flex-1 w-full max-w-7xl px-6 py-8 lg:px-10">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
