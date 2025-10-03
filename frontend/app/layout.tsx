import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Providers } from "../components/layout/Providers";
import { MainContent } from "../components/layout/MainContent";

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
          <MainContent>{children}</MainContent>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
