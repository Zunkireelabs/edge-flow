import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/Dashboard", "/SupervisorDashboard"];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/loginandsignup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookies
  const token = request.cookies.get("token")?.value;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if the current path is an auth route (login/signup)
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // If trying to access protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/loginandsignup", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access auth routes while logged in, redirect to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/Dashboard", request.url));
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    "/Dashboard",
    "/Dashboard/:path*",
    "/SupervisorDashboard",
    "/SupervisorDashboard/:path*",
    "/loginandsignup",
    "/loginandsignup/:path*",
  ],
};
