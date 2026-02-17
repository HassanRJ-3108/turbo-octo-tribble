"use client";

import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import axios from "axios";

import { Copy, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import type { Restaurant } from "@/lib/types";
import Link from "next/link";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://chorionic-officiously-theron.ngrok-free.dev/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default function SettingsPage() {
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const menuUrl = `https://${restaurant?.slug}.timeinx.store`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-slate-400">Manage your restaurant account</p>
      </div>

      {/* Restaurant Info */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Restaurant Information</h2>
        <div className="space-y-4">
          <div>
            <p className="text-slate-400 text-sm">Restaurant Name</p>
            <p className="text-lg font-semibold mt-1">{restaurant?.name}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Status</p>
            <p className="text-lg font-semibold mt-1 capitalize">{restaurant?.status}</p>
          </div>
        </div>
      </div>

      {/* Menu Domain */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Your Menu Domain</h2>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-2">Public Menu URL</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={menuUrl}
              readOnly
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono text-sm"
            />
            <button
              onClick={handleCopyUrl}
              className="p-2 hover:bg-slate-700 rounded transition"
            >
              {copied ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-slate-300" />
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Share this link with your customers to view your AR menu.
          </p>
        </div>
        <div className="mt-4">
          <Link
            href={menuUrl}
            target="_blank"
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-medium"
          >
            Preview Menu →
          </Link>
        </div>
      </div>

      {/* Custom Domain (Coming Soon) */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 opacity-60">
        <h2 className="text-xl font-bold mb-4">Custom Domain</h2>
        <p className="text-slate-300 mb-4">Connect your own domain for your restaurant menu.</p>
        <button className="bg-slate-700 text-slate-400 px-6 py-2 rounded-lg font-semibold cursor-not-allowed">
          Coming Soon
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900/10 border border-red-700/50 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-red-400">Danger Zone</h2>
        <p className="text-slate-300 mb-4">Irreversible actions</p>
        <button className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition">
          Delete Restaurant
        </button>
      </div>
    </div>
  );
}
