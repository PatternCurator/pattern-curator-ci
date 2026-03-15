import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedRoutes = [
  "/",
  "/about",
  "/moodboards",
  "/moodboard"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isAllowed = allowedRoutes.some(
    route => pathname === route || pathname.startsWith(route + "/")
  );

  if (!isAllowed) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  return NextResponse.next();
}