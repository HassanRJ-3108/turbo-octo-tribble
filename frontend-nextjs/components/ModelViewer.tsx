"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import axios from "axios";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Model3D, ARModel } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://chorionic-officiously-theron.ngrok-free.dev/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * ModelViewer Component (Inline 3D Preview)
 *
 * Renders a 3D model in-page using Three.js with orbit controls.
 * This is NOT the AR viewer — it's a non-immersive 3D preview
 * for viewing models on desktop and in product modals.
 *
 * Uses OrbitControls for rotation/zoom (standard 3D preview behavior).
 * Loads GLB models via GLTFLoader.
 */

interface ModelViewerProps {
  modelId?: string;
  modelData?: ARModel | Model3D | null;
}

export default function ModelViewer({ modelId, modelData }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const frameIdRef = useRef<number | null>(null);

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

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 400;

    // --- Scene ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);
    sceneRef.current = scene;

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 100);
    camera.position.set(0, 0.5, 1.5);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // --- Ground Plane ---
    const groundGeometry = new THREE.PlaneGeometry(5, 5);
    const groundMaterial = new THREE.ShadowMaterial({
      opacity: 0.3,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Orbit Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controls.minDistance = 0.3;
    controls.maxDistance = 5;
    controls.target.set(0, 0.3, 0);

    // --- Load Model ---
    const loader = new GLTFLoader();

    // Attach Draco decoder for compressed models
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      model.file_url,
      (gltf) => {
        const modelGroup = gltf.scene;

        // Calculate bounding box
        const box = new THREE.Box3().setFromObject(modelGroup);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        // Normalize scale to fit in a ~1m box for preview
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 0.8 / maxDim : 1;
        modelGroup.scale.multiplyScalar(scale);

        // Re-center after scaling
        const newBox = new THREE.Box3().setFromObject(modelGroup);
        const newCenter = new THREE.Vector3();
        newBox.getCenter(newCenter);
        modelGroup.position.sub(newCenter);
        modelGroup.position.y -= newBox.min.y; // Sit on ground

        // Shadows
        modelGroup.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(modelGroup);

        // Position camera based on model size
        const scaledBox = new THREE.Box3().setFromObject(modelGroup);
        const scaledSize = new THREE.Vector3();
        scaledBox.getSize(scaledSize);
        camera.position.set(
          scaledSize.x,
          scaledSize.y * 1.5,
          scaledSize.z * 2
        );
        controls.target.set(0, scaledSize.y * 0.4, 0);
        controls.update();
      },
      undefined,
      (err) => {
        console.error("Failed to load 3D model:", err);
      }
    );

    // --- Animation Loop ---
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- Cleanup ---
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }

      controls.dispose();

      scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });

      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [model]);

  if (!model) {
    return (
      <div className="w-full h-96 bg-slate-800 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading 3D model...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden"
      style={{ height: "400px" }}
    />
  );
}
