"use client";

import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import axios from "axios";
import { useState, useEffect } from "react";
import type { Restaurant, Subscription } from "@/lib/types";
import { TrendingUp, Package, Zap, Calendar } from "lucide-react";
import Link from "next/link";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://chorionic-officiously-theron.ngrok-free.dev/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default function DashboardOverviewPage() {
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getToken().then(setToken);
  }, [getToken]);

  const { data: restaurant } = useSWR<Restaurant>(
    token ? "/restaurants" : null,
    async (url: any) => {
      const res = await apiClient.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      // Backend returns array, get first restaurant
      const restaurants = res.data;
      return Array.isArray(restaurants) && restaurants.length > 0 ? restaurants[0] : null;
    }
  );

  const { data: subscription } = useSWR<Subscription | null>(
    token && restaurant ? "/subscriptions" : null,
    async (url: any) => {
      try {
        const res = await apiClient.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        });
        return res.data;
      } catch {
        return null;
      }
    }
  );

  const daysLeftInTrial = restaurant?.trial_ends_at
    ? Math.ceil((new Date(restaurant.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const trialExpired = daysLeftInTrial <= 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-slate-400">Manage your AR restaurant menu</p>
      </div>

      {/* Trial Warning */}
      {!trialExpired && daysLeftInTrial <= 3 && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">Trial expiring soon</p>
            <p className="text-sm text-slate-300">{daysLeftInTrial} days left. Subscribe to keep your menu active.</p>
          </div>
          <Link
            href="/dashboard/subscription"
            className="bg-amber-400 text-slate-950 px-4 py-2 rounded-lg font-semibold hover:bg-amber-300 transition"
          >
            Subscribe Now
          </Link>
        </div>
      )}

      {/* Trial Expired */}
      {trialExpired && subscription?.status !== "active" && subscription?.status !== "trialing" && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">Trial Expired</p>
            <p className="text-sm text-slate-300">Subscribe to keep your menu live</p>
          </div>
          <Link
            href="/dashboard/subscription"
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
          >
            Subscribe Now
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Active Products</p>
              <p className="text-3xl font-bold mt-2">{subscription?.active_products_count || 0}</p>
            </div>
            <Package className="w-8 h-8 text-amber-400 opacity-50" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Monthly Bill</p>
              <p className="text-3xl font-bold mt-2">₨{subscription?.next_bill_amount || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Status</p>
              <p className="text-2xl font-bold mt-2">
                {subscription?.status === "active" ? "Active" : daysLeftInTrial > 0 ? "Trial" : "Inactive"}
              </p>
            </div>
            <Zap className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Trial Ends</p>
              <p className="text-2xl font-bold mt-2">{daysLeftInTrial > 0 ? daysLeftInTrial + " days" : "Expired"}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/models"
            className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-amber-400/50 transition text-center"
          >
            <p className="font-semibold">Upload 3D Model</p>
            <p className="text-sm text-slate-400 mt-1">Add a new 3D model</p>
          </Link>
          <Link
            href="/dashboard/products"
            className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-amber-400/50 transition text-center"
          >
            <p className="font-semibold">Add Product</p>
            <p className="text-sm text-slate-400 mt-1">Create a menu item</p>
          </Link>
          <Link
            href={`/menu/${restaurant?.slug}`}
            target="_blank"
            className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-amber-400/50 transition text-center"
          >
            <p className="font-semibold">View Public Menu</p>
            <p className="text-sm text-slate-400 mt-1">See your live menu</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
