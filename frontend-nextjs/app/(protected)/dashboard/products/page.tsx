"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import useSWR from "swr";
import axios from "axios";
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import type { Product } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://chorionic-officiously-theron.ngrok-free.dev/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default function ProductsPage() {
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getToken().then(setToken);
  }, [getToken]);

  const { data: products = [], mutate } = useSWR<Product[]>(
    token ? "/products" : null,
    async (url: any) => {
      const res = await apiClient.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      return res.data;
    }
  );

  const handleToggleActive = async (id: string, active: boolean) => {
    if (!token) return;
    try {
      await apiClient.patch(`/products/${id}`, { active: !active }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      mutate();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleToggleShowInMenu = async (id: string, show: boolean) => {
    if (!token) return;
    try {
      await apiClient.patch(`/products/${id}`, { show_in_menu: !show }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      mutate();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await apiClient.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      mutate();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Products</h1>
          <p className="text-slate-400">Manage your menu items</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 bg-amber-400 text-slate-950 px-6 py-2 rounded-lg font-semibold hover:bg-amber-300 transition"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        {products.length === 0 ? (
          <p className="text-slate-400">No products yet. Create your first product!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold">Product</th>
                  <th className="text-left py-3 px-4 font-semibold">Price</th>
                  <th className="text-left py-3 px-4 font-semibold">Items</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-right py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4">
                      <p className="font-semibold">{product.title}</p>
                      <p className="text-xs text-slate-400">{product.subtitle}</p>
                    </td>
                    <td className="py-3 px-4">₨{product.price_amount}</td>
                    <td className="py-3 px-4">{product.ingredients.length} items</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {product.active ? (
                          <span className="bg-green-900/30 border border-green-700 text-green-200 text-xs px-2 py-1 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="bg-gray-900/30 border border-gray-700 text-gray-200 text-xs px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                        {product.show_in_menu && (
                          <span className="bg-blue-900/30 border border-blue-700 text-blue-200 text-xs px-2 py-1 rounded">
                            In Menu
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right flex gap-2 justify-end">
                      <button
                        onClick={() => handleToggleShowInMenu(product.id, product.show_in_menu)}
                        className="p-2 hover:bg-slate-700 rounded transition"
                        title={product.show_in_menu ? "Hide from menu" : "Show in menu"}
                      >
                        {product.show_in_menu ? (
                          <Eye className="w-4 h-4 text-blue-400" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <Link href={`/dashboard/products/${product.id}/edit`}>
                        <button className="p-2 hover:bg-slate-700 rounded transition">
                          <Edit2 className="w-4 h-4 text-amber-400" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-slate-700 rounded transition"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
