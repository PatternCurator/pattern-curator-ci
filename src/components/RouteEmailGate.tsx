"use client";

import { usePathname } from "next/navigation";
import EmailGate from "@/components/EmailGate";

export default function RouteEmailGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isPublicRoute =
    pathname === "/" ||
    pathname === "/ci" ||
    pathname === "/about" ||
    pathname === "/moodboards" ||
    pathname.startsWith("/moodboard/") ||
    pathname === "/reports" ||
    pathname.startsWith("/reports/") ||
    pathname === "/library" ||
    pathname.startsWith("/library/") ||
    pathname === "/pricing" ||
    pathname === "/account" ||
    pathname.startsWith("/legal");

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <EmailGate>{children}</EmailGate>;
}