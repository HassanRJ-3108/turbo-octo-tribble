"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import type { OnboardingPayload } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://chorionic-officiously-theron.ngrok-free.dev/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default function OnboardingPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    restaurant_name: "",
    restaurant_slug: "",
    phone: "",
    address: "",
    description: "",
  });

  const [uploadedDocs, setUploadedDocs] = useState({
    cnic_front: "",
    cnic_back: "",
    food_license: "",
  });

  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  const handleUploadFile = useCallback(
    async (file: File, docType: "cnic_front" | "cnic_back" | "food_license" | "photo") => {
      try {
        const token = await getToken();
        const formDataFile = new FormData();
        formDataFile.append("file", file);

        const res = await apiClient.post("/onboarding/upload", formDataFile, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        if (docType === "photo") {
          setUploadedPhotos((prev) => [...prev, res.data.url]);
        } else {
          setUploadedDocs((prev) => ({
            ...prev,
            [docType]: res.data.url,
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [getToken]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

      const payload: OnboardingPayload = {
        restaurant_name: formData.restaurant_name,
        restaurant_slug: formData.restaurant_slug,
        phone: formData.phone,
        address: formData.address,
        description: formData.description,
        documents: uploadedDocs,
        photos: uploadedPhotos,
      };

      await apiClient.post("/onboarding", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      router.push("/onboarding/pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Restaurant Onboarding</h1>
          <p className="text-slate-300 mb-8">Step {step} of 3 - {step === 1 ? "Basic Info" : step === 2 ? "Documents" : "Photos"}</p>

          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-200 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Restaurant Name</label>
                  <input
                    type="text"
                    value={formData.restaurant_name}
                    onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400"
                    placeholder="e.g., Naseer's Kitchen"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Restaurant Slug</label>
                  <input
                    type="text"
                    value={formData.restaurant_slug}
                    onChange={(e) => setFormData({ ...formData, restaurant_slug: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400"
                    placeholder="e.g., naseers-kitchen"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">This will be your unique URL: {formData.restaurant_slug}.timeinx.store</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400"
                    placeholder="+92-300-1234567"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400"
                    placeholder="e.g., F-7 Markaz, Islamabad"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400"
                    rows={4}
                    placeholder="Describe your restaurant and cuisine..."
                    required
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">CNIC Front</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0], "cnic_front")}
                    className="w-full"
                  />
                  {uploadedDocs.cnic_front && <p className="text-xs text-green-400 mt-1">✓ Uploaded</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">CNIC Back</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0], "cnic_back")}
                    className="w-full"
                  />
                  {uploadedDocs.cnic_back && <p className="text-xs text-green-400 mt-1">✓ Uploaded</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Food License</label>
                  <input
                    type="file"
                    onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0], "food_license")}
                    className="w-full"
                  />
                  {uploadedDocs.food_license && <p className="text-xs text-green-400 mt-1">✓ Uploaded</p>}
                </div>
              </>
            )}

            {step === 3 && (
              <div>
                <label className="block text-sm font-medium mb-2">Restaurant Photos (1-5)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0], "photo")}
                  className="w-full"
                />
                <div className="mt-4 space-y-2">
                  {uploadedPhotos.map((photo, idx) => (
                    <p key={idx} className="text-xs text-green-400">
                      ✓ Photo {idx + 1} uploaded
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 bg-slate-800 border border-slate-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-700 transition"
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="flex-1 bg-amber-400 text-slate-950 px-6 py-2 rounded-lg font-semibold hover:bg-amber-300 transition"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
