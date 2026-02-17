"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import Link from "next/link";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://chorionic-officiously-theron.ngrok-free.dev/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default function NewProductPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    price_amount: "",
    ar_model_id: "",
    ingredients: "" as string,
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    vegetarian: false,
    halal: false,
    gluten_free: false,
    active: true,
    show_in_menu: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

      const payload = {
        title: formData.title,
        subtitle: formData.subtitle,
        description: formData.description,
        price_amount: parseInt(formData.price_amount),
        currency: "PKR",
        ar_model_id: formData.ar_model_id || null,
        ingredients: formData.ingredients
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        nutrition: {
          calories: formData.calories || "N/A",
          protein: formData.protein || "N/A",
          carbs: formData.carbs || "N/A",
          fat: formData.fat || "N/A",
        },
        dietary: {
          vegetarian: formData.vegetarian,
          halal: formData.halal,
          gluten_free: formData.gluten_free,
        },
        media: { images: [], videos: [] },
        ui_behavior: {},
        active: formData.active,
        show_in_menu: formData.show_in_menu,
      };

      await apiClient.post("/products", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      router.push("/dashboard/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/products" className="text-amber-400 hover:text-amber-300 text-sm">
          ← Back to Products
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">Add New Product</h1>
        <p className="text-slate-400">Create a new menu item</p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-bold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Product Name</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., Margherita Pizza"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., Classic Italian"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  rows={4}
                  placeholder="Describe the product..."
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price (PKR)</label>
                  <input
                    type="number"
                    value={formData.price_amount}
                    onChange={(e) => setFormData({ ...formData, price_amount: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    placeholder="e.g., 850"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">3D Model ID (Optional)</label>
                  <input
                    type="text"
                    value={formData.ar_model_id}
                    onChange={(e) => setFormData({ ...formData, ar_model_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    placeholder="Paste model ID"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h2 className="text-lg font-bold mb-4">Ingredients</h2>
            <label className="block text-sm font-medium mb-2">Ingredients (comma-separated)</label>
            <textarea
              value={formData.ingredients}
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
              rows={3}
              placeholder="e.g., Tomato Sauce, Mozzarella, Fresh Basil"
            />
          </div>

          {/* Nutrition */}
          <div>
            <h2 className="text-lg font-bold mb-4">Nutrition (Per Serving)</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Calories</label>
                <input
                  type="text"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., 250 kcal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Protein</label>
                <input
                  type="text"
                  value={formData.protein}
                  onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., 12g"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Carbs</label>
                <input
                  type="text"
                  value={formData.carbs}
                  onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., 30g"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fat</label>
                <input
                  type="text"
                  value={formData.fat}
                  onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., 10g"
                />
              </div>
            </div>
          </div>

          {/* Dietary */}
          <div>
            <h2 className="text-lg font-bold mb-4">Dietary Info</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.vegetarian}
                  onChange={(e) => setFormData({ ...formData, vegetarian: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Vegetarian</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.halal}
                  onChange={(e) => setFormData({ ...formData, halal: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Halal</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.gluten_free}
                  onChange={(e) => setFormData({ ...formData, gluten_free: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Gluten Free</span>
              </label>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <h2 className="text-lg font-bold mb-4">Visibility</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Active (counts toward billing)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.show_in_menu}
                  onChange={(e) => setFormData({ ...formData, show_in_menu: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Show in Public Menu</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-700">
            <Link
              href="/dashboard/products"
              className="flex-1 bg-slate-800 border border-slate-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-700 transition text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-400 text-slate-950 px-6 py-2 rounded-lg font-bold hover:bg-amber-300 transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
