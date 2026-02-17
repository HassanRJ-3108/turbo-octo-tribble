"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import useSWR from "swr";
import axios from "axios";
import { Upload, Trash2, Eye } from "lucide-react";
import type { Model3D } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://chorionic-officiously-theron.ngrok-free.dev/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default function ModelsPage() {
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    height: "",
    width: "",
    depth: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    getToken().then(setToken);
  }, [getToken]);

  const { data: models = [], mutate } = useSWR<Model3D[]>(
    token ? "/models" : null,
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !token) return;

    setUploading(true);
    try {
      const formDataFile = new FormData();
      formDataFile.append("file", file);
      formDataFile.append("name", formData.name);
      formDataFile.append("description", formData.description);
      formDataFile.append("height", formData.height);
      formDataFile.append("width", formData.width);
      formDataFile.append("depth", formData.depth);
      formDataFile.append("dimension_unit", "cm");

      await apiClient.post("/models", formDataFile, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      mutate();
      setFormData({ name: "", description: "", height: "", width: "", depth: "" });
      setFile(null);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await apiClient.delete(`/models/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      mutate();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">3D Models</h1>
        <p className="text-slate-400">Upload and manage your 3D product models</p>
      </div>

      {/* Upload Form */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Upload 3D Model</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Model Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                placeholder="e.g., Pizza Margherita"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">File (.glb, .gltf, .usdz)</label>
              <input
                type="file"
                accept=".glb,.gltf,.usdz"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
              rows={2}
              placeholder="Describe the model..."
              required
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Height (cm)</label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Width (cm)</label>
              <input
                type="number"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Depth (cm)</label>
              <input
                type="number"
                value={formData.depth}
                onChange={(e) => setFormData({ ...formData, depth: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-2 bg-amber-400 text-slate-950 px-6 py-2 rounded-lg font-semibold hover:bg-amber-300 transition disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload Model"}
          </button>
        </form>
      </div>

      {/* Models List */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Your Models ({models.length})</h2>
        {models.length === 0 ? (
          <p className="text-slate-400">No models uploaded yet</p>
        ) : (
          <div className="space-y-3">
            {models.map((model) => (
              <div
                key={model.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">{model.name}</p>
                  <p className="text-sm text-slate-400">{model.description}</p>
                  <button
                    onClick={() => handleDelete(model.id)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
