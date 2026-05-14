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
    pathname === "/reports" ||
    pathname.startsWith("/reports/");

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <EmailGate>{children}</EmailGate>;
}