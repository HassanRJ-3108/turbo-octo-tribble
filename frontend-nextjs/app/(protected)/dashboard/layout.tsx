"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  BarChart3,
  Package,
  Box,
  CreditCard,
  Settings,
  Menu,
  X,
  LogOut,
  Zap,
} from "lucide-react";
import useSWR from "swr";
import axios from "axios";
import type { Restaurant, Subscription } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://chorionic-officiously-theron.ngrok-free.dev/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, getToken, isLoaded } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/sign-in");
    }
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (isLoaded && userId) {
      getToken().then(setToken);
    }
  }, [isLoaded, userId, getToken]);

  const { data: restaurant, error: restaurantError } = useSWR<Restaurant | null>(
    token ? "/restaurants" : null,
    async (url) => {
      try {
        const res = await apiClient.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true", // Bypass ngrok warning page
          },
        });
        // Backend returns array of restaurants, get the first one
        const restaurants = res.data;
        console.log("🏪 Restaurants API Response:", restaurants); // Debug log
        const firstRestaurant = Array.isArray(restaurants) && restaurants.length > 0
          ? restaurants[0]
          : null;
        console.log("🏪 First Restaurant:", firstRestaurant); // Debug log
        return firstRestaurant;
      } catch (error) {
        console.error("❌ Error fetching restaurant:", error);
        return null;
      }
    },
    { revalidateOnFocus: false }
  );

  const { data: subscription } = useSWR<Subscription | null>(
    token && restaurant ? "/subscriptions" : null,
    async (url) => {
      try {
        const res = await apiClient.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true", // Bypass ngrok warning page
          },
        });
        return res.data;
      } catch {
        return null;
      }
    },
    { revalidateOnFocus: false }
  );

  // Access control
  useEffect(() => {
    if (!restaurant) return;

    console.log("🔐 Restaurant status:", restaurant.status); // Debug log

    if (restaurant.status === "pending") {
      router.push("/onboarding/pending");
    } else if (restaurant.status === "rejected") {
      router.push("/onboarding/rejected");
    } else if (restaurant.status === "suspended") {
      router.push("/suspended");
    } else if (restaurant.status === "approved") {
      // Check trial & subscription
      const trialExpired = new Date(restaurant.trial_ends_at || "") < new Date();
      const hasActiveSubscription = subscription?.status === "active";

      if (trialExpired && !hasActiveSubscription) {
        router.push("/subscribe");
      }
    }
  }, [restaurant, subscription, router]);

  // Loading state
  if (!isLoaded || !token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading authentication...</div>
      </div>
    );
  }

  // Error state
  if (restaurantError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load restaurant data</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-slate-800 px-4 py-2 rounded hover:bg-slate-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Still loading restaurant data
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading restaurant...</div>
      </div>
    );
  }

  const daysLeftInTrial = restaurant.trial_ends_at
    ? Math.ceil((new Date(restaurant.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const navItems = [
    { icon: BarChart3, label: "Overview", href: "/dashboard" },
    { icon: Box, label: "3D Models", href: "/dashboard/models" },
    { icon: Package, label: "Products", href: "/dashboard/products" },
    { icon: CreditCard, label: "Subscription", href: "/dashboard/subscription" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:static lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 border-b border-slate-800 flex items-center px-6">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-400" />
              <span className="font-bold text-lg">Foodar</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon as any;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="border-t border-slate-800 p-4 space-y-4">
            <div className="flex items-center gap-3">
              <UserButton />
              <div>
                <p className="text-sm font-medium">{restaurant.name}</p>
                <p className="text-xs text-slate-400">{restaurant.slug}.timeinx.store</p>
              </div>
            </div>
            {daysLeftInTrial > 0 && (
              <div className="bg-amber-400/20 border border-amber-400/50 rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-amber-300">{daysLeftInTrial} days trial left</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-0 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex items-center px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="ml-auto">
            <Link href="/" className="text-sm text-slate-300 hover:text-white transition">
              View Site
            </Link>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
