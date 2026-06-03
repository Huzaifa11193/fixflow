import { NextRequest, NextResponse } from "next/server";

const authRoutes = ["/", "/auth/sign-in", "/auth/sign-up"];

const protectedPrefixes = [
  "/app",
  "/history",
  "/patterns",
  "/learning",
  "/integrations",
  "/settings",
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Get all cookies to check for auth session
  const cookies = request.cookies;
  let hasSession = false;

  // Check for Supabase auth session in cookies
  for (const [key, value] of cookies) {
    if (
      (key.includes("auth-token") || key.includes("session")) &&
      value
    ) {
      hasSession = true;
      break;
    }
  }

  // If authenticated and on auth routes, redirect to /app
  if (hasSession && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  // If not authenticated and on protected routes, redirect to sign-in
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
