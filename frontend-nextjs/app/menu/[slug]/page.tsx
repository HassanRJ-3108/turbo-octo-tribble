"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import axios from "axios";
import Link from "next/link";
import { X, Zap } from "lucide-react";
import type { PublicMenu, Product } from "@/lib/types";
import dynamic from "next/dynamic";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-slate-800 animate-pulse rounded-lg" />,
});

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://chorionic-officiously-theron.ngrok-free.dev/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default function PublicMenuPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: menu, error } = useSWR<PublicMenu>(
    slug ? `/menu/${slug}` : null,
    async (url: any) => {
      const res = await apiClient.get(url, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      return res.data;
    }
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Restaurant Not Found</h1>
          <p className="text-slate-400">This restaurant doesn't exist or is temporarily unavailable.</p>
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl md:text-3xl font-bold">{menu.restaurant_name}</h1>
            </div>
            <Link href="/" className="text-sm text-slate-400 hover:text-white transition">
              Powered by Foodar
            </Link>
          </div>
          <p className="text-slate-300">Discover our menu in beautiful 3D with AR preview</p>
        </div>
      </header>

      {/* Menu Grid */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menu.products.map((product) => (
            <div
              key={product.id}
              className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden hover:border-amber-400/50 transition group cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              {/* Product Image */}
              <div className="h-48 bg-slate-800 relative overflow-hidden">
                {product.media.images[0] ? (
                  <img
                    src={product.media.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Zap className="w-12 h-12 text-amber-400/50" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="text-lg font-bold">{product.title}</h3>
                {product.subtitle && <p className="text-sm text-slate-400">{product.subtitle}</p>}

                <p className="text-2xl font-bold text-amber-400 mt-3">₨{product.price_amount}</p>

                {/* Dietary Tags */}
                {(product.dietary.vegetarian || product.dietary.halal || product.dietary.gluten_free) && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {product.dietary.vegetarian && (
                      <span className="text-xs bg-green-900/30 border border-green-700 text-green-200 px-2 py-1 rounded">
                        Vegetarian
                      </span>
                    )}
                    {product.dietary.halal && (
                      <span className="text-xs bg-blue-900/30 border border-blue-700 text-blue-200 px-2 py-1 rounded">
                        Halal
                      </span>
                    )}
                    {product.dietary.gluten_free && (
                      <span className="text-xs bg-purple-900/30 border border-purple-700 text-purple-200 px-2 py-1 rounded">
                        Gluten Free
                      </span>
                    )}
                  </div>
                )}

                {/* View Details Button */}
                <button className="w-full mt-4 bg-amber-400 text-slate-950 py-2 rounded-lg font-semibold hover:bg-amber-300 transition">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <div className="flex justify-between items-center p-6 border-b border-slate-800 sticky top-0 bg-slate-900">
              <h2 className="text-2xl font-bold">{selectedProduct.title}</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-slate-800 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* AR Viewer */}
              {(selectedProduct.ar_model || selectedProduct.ar_model_id) && (
                <div>
                  <h3 className="font-semibold mb-3">3D Preview</h3>
                  <ModelViewer
                    modelId={selectedProduct.ar_model_id || undefined}
                    modelData={selectedProduct.ar_model}
                  />
                </div>
              )}

              {/* Product Image */}
              {selectedProduct.media.images[0] && (
                <img
                  src={selectedProduct.media.images[0]}
                  alt={selectedProduct.title}
                  className="w-full rounded-lg"
                />
              )}

              {/* Details */}
              <div>
                <p className="text-slate-300">{selectedProduct.description}</p>
              </div>

              {/* Nutrition */}
              {Object.keys(selectedProduct.nutrition).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Nutrition</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(selectedProduct.nutrition).map(([key, value]) => (
                      <div key={key} className="bg-slate-800 rounded p-3 text-center">
                        <p className="text-xs text-slate-400 capitalize">{key}</p>
                        <p className="font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingredients */}
              {selectedProduct.ingredients.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Ingredients</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.ingredients.map((ingredient) => (
                      <span
                        key={ingredient}
                        className="bg-slate-800 text-slate-200 px-3 py-1 rounded-full text-sm"
                      >
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price & Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <p className="text-3xl font-bold text-amber-400">₨{selectedProduct.price_amount}</p>
                <button className="bg-amber-400 text-slate-950 px-8 py-3 rounded-lg font-bold hover:bg-amber-300 transition">
                  Order Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
