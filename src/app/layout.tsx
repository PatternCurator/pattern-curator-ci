import "./globals.css";
import type { Metadata } from "next";
import { Libre_Baskerville } from "next/font/google";
import { Suspense } from "react";
import SiteHeader from "@/components/SiteHeader";
import RouteEmailGate from "@/components/RouteEmailGate";
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
        <div className="w-full bg-neutral-900 px-4 py-2 text-center text-[11px] uppercase tracking-[0.14em] text-white sm:text-[12px]">
          CI is moving home to{" "}
          <a
            href="https://www.patterncurator.com"
            className="underline underline-offset-4 hover:opacity-80"
          >
            PatternCurator.com
          </a>
          . Current subscribers: please check your email for transition updates.
        </div>

        <SiteHeader />

        {/* Reserve the vertical space so footer doesn't jump */}
        <main className="flex-1">
          <Suspense fallback={null}>
            <RouteEmailGate>{children}</RouteEmailGate>
          </Suspense>
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}