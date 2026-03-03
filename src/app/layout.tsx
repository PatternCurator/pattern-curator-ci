import "./globals.css";
import type { Metadata } from "next";
import { Libre_Baskerville } from "next/font/google";
import { Suspense } from "react";
import SiteHeader from "@/components/SiteHeader";
import EmailGate from "@/components/EmailGate";
import SiteFooter from "@/components/SiteFooter";

const libre = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["italic", "normal"],
  variable: "--font-libre",
});

export const metadata: Metadata = {
  title: "Pattern Curator CI",
  description: "Pattern Curator Curatorial Intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${libre.variable} bg-white`}>
      <body className="min-h-dvh flex flex-col bg-white text-black"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        <SiteHeader />

        {/* Reserve the vertical space so footer doesn't jump */}
        <main className="flex-1">
          <Suspense fallback={null}>
            <EmailGate>{children}</EmailGate>
          </Suspense>
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}