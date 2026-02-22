import "./globals.css";
import type { Metadata } from "next";
import { Libre_Baskerville } from "next/font/google";
import { Suspense } from "react";
import SiteHeader from "@/components/SiteHeader";
import EmailGate from "@/components/EmailGate";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={libre.variable}>
      <body style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
        <SiteHeader />

        <Suspense fallback={null}>
          <EmailGate>
            {children}
          </EmailGate>
        </Suspense>

      </body>
    </html>
  );
}