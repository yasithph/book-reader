import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/library",
  "/read",
  "/purchase",
  "/settings",
  "/welcome",
];

// Routes that require admin role
const adminRoutes = ["/admin"];

// Routes that should redirect to library if already authenticated
const authRoutes = ["/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionUserId = request.cookies.get("session_user_id")?.value;
  const isAuthenticated = !!sessionUserId;

  // Check if it's an auth route and user is already authenticated
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/library", request.url));
    }
    return NextResponse.next();
  }

  // Check if it's a protected route
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/auth", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Check if it's an admin route
  // Note: Full admin check happens in the layout/page since middleware
  // can't access the database to verify role
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/auth", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Admin role check happens in the admin layout
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (icons, images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icons|images|manifest.json).*)",
  ],
};
