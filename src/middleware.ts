import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // If accessing dashboard without authentication, redirect to login
  if (!req.auth && req.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match dashboard routes and all sub-routes
     * Excludes:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/dashboard/:path*",
  ],
  runtime: "nodejs",
};
