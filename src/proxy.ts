import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Runs before requests complete.
 * Use for rewrites, redirects, or header changes.
 * Protects dashboard routes by redirecting unauthenticated users to login.
 */
export async function proxy(req: NextRequest) {
  // If accessing dashboard without authentication, redirect to login
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    const session = await auth();
    if (!session) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

/**
 * Matcher runs for dashboard routes.
 * Excludes:
 * - api/auth (NextAuth.js routes)
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico (favicon file)
 */
export const config = {
  matcher: ["/dashboard/:path*"],
};
