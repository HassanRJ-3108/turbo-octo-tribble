"use client";

import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Zap, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import type { Restaurant } from "@/lib/types";
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://chorionic-officiously-theron.ngrok-free.dev/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getToken, isLoaded } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!isLoaded) return;

      try {
        const token = await getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await apiClient.get("/restaurants", {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true", // Bypass ngrok warning page
          },
        });

        const restaurants = res.data;
        if (Array.isArray(restaurants) && restaurants.length > 0) {
          setRestaurant(restaurants[0]);
        }
      } catch {
        // User not authenticated or no restaurant
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [isLoaded, getToken]);

  // Determine where to link based on restaurant status
  const getDashboardLink = () => {
    if (!restaurant) return "/dashboard";

    switch (restaurant.status) {
      case "pending":
        return "/onboarding/pending";
      case "rejected":
        return "/onboarding/rejected";
      case "suspended":
        return "/suspended";
      case "approved":
        return "/dashboard";
      default:
        return "/dashboard";
    }
  };

  const getDashboardLabel = () => {
    if (loading) return "Loading...";
    if (!restaurant) return "Dashboard";

    switch (restaurant.status) {
      case "pending":
        return "Pending Approval";
      case "rejected":
        return "Application Rejected";
      case "suspended":
        return "Account Suspended";
      case "approved":
        return "Dashboard";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Navbar */}
      <nav className="fixed w-full top-0 z-50 border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Foodar
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="hover:text-amber-400 transition">
              Features
            </Link>
            <Link href="#pricing" className="hover:text-amber-400 transition">
              Pricing
            </Link>
            <SignedOut>
              <Link href="/sign-in" className="text-slate-300 hover:text-amber-400">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-amber-400/50 transition"
              >
                Get Started
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href={getDashboardLink()} className="bg-amber-400 text-slate-950 px-4 py-2 rounded-lg font-semibold hover:bg-amber-300 transition">
                {getDashboardLabel()}
              </Link>
              <UserButton />
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <SignedIn>
              <UserButton />
            </SignedIn>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800 p-4 flex flex-col gap-4">
            <Link href="#features" className="hover:text-amber-400">
              Features
            </Link>
            <SignedOut>
              <Link href="/sign-in" className="hover:text-amber-400">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-4 py-2 rounded-lg font-semibold"
              >
                Get Started
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href={getDashboardLink()} className="bg-amber-400 text-slate-950 px-4 py-2 rounded-lg font-semibold">
                {getDashboardLabel()}
              </Link>
            </SignedIn>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight">
              AR Menus for{" "}
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Modern Restaurants
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
              Let your customers see 3D previews of dishes in augmented reality. Transform how people discover your menu.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
              <Link
                href="/sign-up"
                className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-amber-400/50 transition"
              >
                Start Your Free Trial
              </Link>
              <Link
                href="#features"
                className="border border-slate-700 text-slate-100 px-8 py-4 rounded-lg font-semibold hover:border-slate-500 transition"
              >
                Learn More
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href={getDashboardLink()}
                className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-amber-400/50 transition"
              >
                {getDashboardLabel()}
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Why Choose Foodar?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "3D Menu Preview", desc: "Let customers see dishes in 3D before ordering" },
              { title: "AR Experience", desc: "View products in their real-world size using AR" },
              { title: "Easy Management", desc: "Upload 3D models and manage your menu in minutes" },
              { title: "Usage-Based Pricing", desc: "Pay only for active products in your menu" },
              { title: "No Setup Required", desc: "Start with a 7-day free trial, no credit card needed" },
              { title: "Full Analytics", desc: "Track customer engagement with your AR menu" },
            ].map((feature) => (
              <div key={feature.title} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-amber-400/50 transition">
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Simple Pricing</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Trial</h3>
              <p className="text-4xl font-bold mb-2">Free</p>
              <p className="text-slate-300 mb-8">for 7 days</p>
              <ul className="space-y-4 text-slate-300">
                <li>✓ Upload up to 10 3D models</li>
                <li>✓ Create unlimited products</li>
                <li>✓ Full AR experience</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-400/50 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Paid Plan</h3>
              <p className="text-4xl font-bold mb-2">
                <span className="text-amber-400">₨300</span>
                <span className="text-lg text-slate-300">/product/month</span>
              </p>
              <p className="text-slate-300 mb-8">+ 5,000 PKR setup fee</p>
              <ul className="space-y-4 text-slate-300">
                <li>✓ Unlimited 3D models</li>
                <li>✓ Unlimited products</li>
                <li>✓ Priority support</li>
                <li>✓ Custom domain (coming soon)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4 text-center text-slate-400">
        <p>&copy; 2026 Foodar. Transforming restaurant experiences with AR.</p>
      </footer>
    </div>
  );
}
