"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import axios from "axios";
import type { Model3D, ARModel } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://chorionic-officiously-theron.ngrok-free.dev/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

interface ModelViewerProps {
  modelId?: string;
  modelData?: ARModel | Model3D | null;
}

export default function ModelViewer({ modelId, modelData }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const shouldFetch = !modelData && !!modelId;

  const { data: fetchedModel } = useSWR<Model3D>(
    shouldFetch ? `/models/${modelId}` : null,
    async (url: any) => {
      const res = await apiClient.get(url, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      return res.data;
    }
  );

  const model = modelData || fetchedModel;

  useEffect(() => {
    if (!containerRef.current || !model) return;

    const loadModelViewer = async () => {
      // Load script if not already defined
      if (!customElements.get("model-viewer")) {
        try {
          await import("@google/model-viewer");
        } catch (e) {
          console.error("Failed to load model-viewer:", e);
          return;
        }
      }

      // Clear previous content
      if (containerRef.current) {
        containerRef.current.innerHTML = "";

        // Create the model-viewer element
        const viewer = document.createElement("model-viewer");
        viewer.setAttribute("src", model.file_url);
        viewer.setAttribute("alt", model.name);
        viewer.setAttribute("ar", "");
        viewer.setAttribute("ar-modes", "webxr scene-viewer quick-look");
        viewer.setAttribute("camera-controls", "");
        viewer.setAttribute("shadow-intensity", "1");
        viewer.setAttribute("touch-action", "pan-y");
        viewer.style.width = "100%";
        viewer.style.height = "400px";
        viewer.style.backgroundColor = "#1e293b";

        // Calculate scale based on real-world dimensions (assuming cm)
        // If dimensions are missing, default to 1
        const height = model.height || 10;
        const width = model.width || 10;
        const depth = model.depth || 10;

        const maxDimension = Math.max(height, width, depth);
        // Target size in model-viewer units (meters) logic can be tricky, 
        // but 'scale' attribute expects x y z string. 
        // We usually don't need to touch scale if the model is built in meters or properly exported.
        // However, if we want to normalize viewing size:

        // Note: model-viewer handles glb scaling automatically to fit the camera usually.
        // We only set scale if we want to override logical size. 
        // For now, let's trust auto-scaling or use the explicit dimensions if needed.
        // If users provided dimensions in CM, but model is in Meters, we might need adjustment.
        // But removing manual scale calculation for now as it often causes tiny/huge models
        // unless we know the models intrinsic units.
        // Instead, let's rely on camera-orbit to ensure it fits.
        // viewer.setAttribute("camera-orbit", "45deg 55deg 2.5m"); 

        containerRef.current.appendChild(viewer);
      }
    };

    loadModelViewer();

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [model]);

  if (!model) {
    return <div className="w-full h-96 bg-slate-800 animate-pulse rounded-lg" />;
  }

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />;
}
