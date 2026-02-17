import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/subscribe(.*)",
  "/suspended(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Handle wildcard subdomains for public menus
  const { hostname, pathname, search } = req.nextUrl;
  
  // Get the full subdomain
  const parts = hostname.split(".");
  
  // Check if it's a subdomain request (not localhost:port)
  let subdomain: string | null = null;
  
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    // Local development: restaurant-slug.localhost:3000
    if (parts.length >= 2 && parts[0] !== "localhost" && parts[0] !== "127") {
      subdomain = parts[0];
    }
  } else if (!hostname.includes(":")) {
    // Production: restaurant-slug.timeinx.store or restaurant-slug.foodar.pk
    // Skip if it's main domain (www, app, admin, api)
    const mainDomains = ["www", "app", "admin", "api", "mail", "blog"];
    if (parts.length >= 2 && !mainDomains.includes(parts[0])) {
      subdomain = parts[0];
    }
  }
  
  // If we have a subdomain, redirect to /menu/[slug]
  if (subdomain && subdomain !== "www" && !pathname.startsWith("/menu/")) {
    return NextResponse.rewrite(
      new URL(`/menu/${subdomain}${pathname}${search}`, req.url)
    );
  }
  
  // Protect dashboard and onboarding routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
