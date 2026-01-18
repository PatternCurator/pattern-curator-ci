import "./globals.css";
import type { Metadata } from "next";
import { Libre_Baskerville } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={libre.variable}>
      {/* Arial base */}
      <body style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
