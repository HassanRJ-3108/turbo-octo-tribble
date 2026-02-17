"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import axios from "axios";
import { AlertTriangle, CreditCard } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://chorionic-officiously-theron.ngrok-free.dev/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default function SubscribePage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await apiClient.post("/subscriptions/checkout", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.href = res.data.checkout_url;
    } catch (error) {
      console.error("Checkout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 rounded-lg p-8 text-center space-y-6">
        <div className="bg-red-900/30 border border-red-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">Trial Expired</h1>
          <p className="text-slate-300">
            Your free trial has ended. Subscribe now to keep your AR menu live and continue serving your customers.
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-left">
          <h3 className="font-semibold mb-3">Pricing Breakdown:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-300">Setup Fee (One-time)</span>
              <span className="font-semibold">₨5,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Monthly (per product)</span>
              <span className="font-semibold">₨300</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-amber-400/50 transition disabled:opacity-50"
        >
          <CreditCard className="w-5 h-5" />
          {loading ? "Redirecting..." : "Subscribe & Continue"}
        </button>

        <p className="text-xs text-slate-400">
          You will be redirected to our secure payment processor.
        </p>
      </div>
    </div>
  );
}
