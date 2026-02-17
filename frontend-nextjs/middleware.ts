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

  // Custom domains handled by the app
  const ROOT_DOMAINS = ["foodar.pk", "timelinx.store", "localhost:3000", "localhost"];

  // Check if it's a subdomain request
  let subdomain: string | null = null;

  // Helper to extract subdomain
  // Case 1: Localhost (e.g. restaurant.localhost:3000)
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    const parts = hostname.split(".");
    if (parts.length > 1 && parts[0] !== "localhost" && parts[0] !== "127") {
      subdomain = parts[0];
    }
  }
  // Case 2: Production Domains (e.g. restaurant.timelinx.store)
  else {
    // Check if the hostname ENDS with any of our root domains
    for (const root of ROOT_DOMAINS) {
      if (hostname.endsWith(root) && hostname !== root) {
        // It's a subdomain. Extract the part before the root.
        // e.g. "gaming.timelinx.store" -> "gaming"
        subdomain = hostname.replace(`.${root}`, "");
        break;
      }
    }
  }

  // Skip special subdomains
  const specialSubdomains = ["www", "app", "admin", "api", "mail", "blog"];
  if (subdomain && specialSubdomains.includes(subdomain)) {
    subdomain = null;
  }

  // If we have a subdomain, rewrite to /menu/[slug]
  if (subdomain && !pathname.startsWith("/menu/")) {
    // Rewrite internal URL to handle the request as a menu page
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
