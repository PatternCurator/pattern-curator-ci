import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedRoutes = [
  "/",
  "/about",
  "/moodboards",
  "/moodboard"
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isAllowed = allowedRoutes.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  );

  if (!isAllowed) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  return NextResponse.next();
}