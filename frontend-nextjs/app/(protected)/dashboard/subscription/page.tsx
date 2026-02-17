"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import useSWR from "swr";
import axios from "axios";
import { CreditCard, AlertCircle } from "lucide-react";
import type { Subscription, Restaurant } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://chorionic-officiously-theron.ngrok-free.dev/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default function SubscriptionPage() {
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

  const handleCheckout = async () => {
    if (!token) return;
    setCheckoutLoading(true);
    try {
      const res = await apiClient.post("/subscriptions/checkout", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.href = res.data.checkout_url;
    } catch (error) {
      console.error("Checkout failed:", error);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const daysLeftInTrial = restaurant?.trial_ends_at
    ? Math.ceil((new Date(restaurant.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Subscription & Billing</h1>
        <p className="text-slate-400">Manage your subscription and payment method</p>
      </div>

      {/* Current Status */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Current Status</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-slate-400 text-sm">Subscription Status</p>
            <p className="text-2xl font-bold mt-2">
              {subscription?.status === "active" ? "Active" : daysLeftInTrial > 0 ? "Trial" : "Inactive"}
            </p>
            {subscription?.status === "past_due" && (
              <div className="flex items-center gap-2 mt-3 text-red-300">
                <AlertCircle className="w-4 h-4" />
                <span>Payment failed. Please retry.</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-slate-400 text-sm">Active Products</p>
            <p className="text-2xl font-bold mt-2">{subscription?.active_products_count || 0}</p>
            <p className="text-xs text-slate-400 mt-2">@ ₨300/product/month</p>
          </div>
        </div>
      </div>

      {/* Trial Info */}
      {daysLeftInTrial > 0 && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-6">
          <h2 className="text-lg font-bold mb-2">7-Day Trial</h2>
          <p className="text-amber-100 mb-4">{daysLeftInTrial} days remaining</p>
          {daysLeftInTrial <= 1 && (
            <div className="bg-amber-900/50 p-3 rounded mb-4 text-sm">
              Your trial is expiring soon. Subscribe now to keep your menu active.
            </div>
          )}
        </div>
      )}

      {/* Billing Details */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Billing Details</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-slate-700">
            <span className="text-slate-300">Setup Fee (First Payment)</span>
            <span className="font-semibold">₨5,000</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-slate-700">
            <span className="text-slate-300">Monthly Cost</span>
            <span className="font-semibold">₨{(subscription?.active_products_count || 0) * 300}</span>
          </div>
          {subscription?.last_billed_at && (
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-300">Last Billed</span>
              <span className="font-semibold">
                {new Date(subscription.last_billed_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Button */}
      {(!subscription || subscription.status !== "active") && daysLeftInTrial <= 0 && (
        <button
          onClick={handleCheckout}
          disabled={checkoutLoading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-amber-400/50 transition disabled:opacity-50"
        >
          <CreditCard className="w-5 h-5" />
          {checkoutLoading ? "Redirecting..." : "Subscribe Now"}
        </button>
      )}

      {subscription?.status === "active" && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-6 text-center">
          <p className="text-green-100 font-semibold">Your subscription is active!</p>
          <p className="text-green-200 text-sm mt-2">Next billing: {new Date(subscription.last_billed_at || new Date()).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}
