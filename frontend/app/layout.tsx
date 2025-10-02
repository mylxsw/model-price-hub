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
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Providers>
          <Header />
          <main className="flex-1 container mx-auto px-6 py-8">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
