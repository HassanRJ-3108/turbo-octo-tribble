"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Product } from "@/lib/types";

/**
 * FullScreen3DViewer — fallback for devices without AR support
 *
 * Shows the product model in a full-screen 3D scene with:
 * - Touch rotation (OrbitControls)
 * - Auto-rotate for showcase effect
 * - Product switching via external index
 * - Lightweight for mobile
 */

interface FullScreen3DViewerProps {
    products: Product[];
    currentIndex: number;
    onClose: () => void;
}

export default function FullScreen3DViewer({
    products,
    currentIndex,
    onClose,
}: FullScreen3DViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const currentModelRef = useRef<THREE.Group | null>(null);
    const loaderRef = useRef<GLTFLoader>(new GLTFLoader());
    const modelCacheRef = useRef<Map<string, THREE.Group>>(new Map());
    const cleanedUpRef = useRef(false);
    const animFrameRef = useRef<number>(0);

    const [isLoading, setIsLoading] = useState(true);

    const loadAndShowModel = useCallback(
        async (productIndex: number) => {
            const scene = sceneRef.current;
            if (!scene) return;

            const product = products[productIndex];
            if (!product?.ar_model?.file_url) return;

            const arModel = product.ar_model;
            const cacheKey = arModel.id || arModel.file_url;

            setIsLoading(true);

            // Remove old model
            if (currentModelRef.current) {
                scene.remove(currentModelRef.current);
                currentModelRef.current = null;
            }

            let model: THREE.Group;

            if (modelCacheRef.current.has(cacheKey)) {
                model = modelCacheRef.current.get(cacheKey)!.clone();
            } else {
                try {
                    const gltf = await loaderRef.current.loadAsync(arModel.file_url);
                    model = gltf.scene;
                    modelCacheRef.current.set(cacheKey, model.clone());
                } catch (err) {
                    console.error("Failed to load model:", err);
                    setIsLoading(false);
                    return;
                }
            }

            if (cleanedUpRef.current) return;

            // Normalize: fit model into a ~1.5 unit box
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = maxDim > 0 ? 1.5 / maxDim : 1;
            model.scale.setScalar(scale);

            // Center at origin, sit on ground
            const scaledBox = new THREE.Box3().setFromObject(model);
            const center = new THREE.Vector3();
            scaledBox.getCenter(center);
            model.position.sub(center);
            model.position.y -= scaledBox.min.y;

            scene.add(model);
            currentModelRef.current = model;

            // Adjust camera to frame model
            if (cameraRef.current && controlsRef.current) {
                cameraRef.current.position.set(0, 1.2, 2.5);
                controlsRef.current.target.set(0, 0.5, 0);
                controlsRef.current.update();
            }

            setIsLoading(false);
        },
        [products]
    );

    // Switch product
    useEffect(() => {
        loadAndShowModel(currentIndex);
    }, [currentIndex, loadAndShowModel]);

    // Initialize scene
    useEffect(() => {
        if (!containerRef.current) return;
        cleanedUpRef.current = false;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111118);
        sceneRef.current = scene;

        // Grid/ground for context
        const gridHelper = new THREE.GridHelper(4, 20, 0x333344, 0x222233);
        scene.add(gridHelper);

        // Camera
        const camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            50
        );
        camera.position.set(0, 1.2, 2.5);
        cameraRef.current = camera;

        // Lighting (lightweight)
        const ambientLight = new THREE.AmbientLight(0xffffff, 2);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(3, 5, 4);
        scene.add(dirLight);

        const backLight = new THREE.DirectionalLight(0x8888ff, 0.5);
        backLight.position.set(-3, 2, -4);
        scene.add(backLight);

        // Renderer (mobile optimized)
        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: false,
            powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // OrbitControls (touch rotation)
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0.5, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 2;
        controls.maxPolarAngle = Math.PI / 1.8;
        controls.minDistance = 1;
        controls.maxDistance = 6;
        controls.enablePan = false;
        controlsRef.current = controls;

        // Animation loop
        const animate = () => {
            if (cleanedUpRef.current) return;
            animFrameRef.current = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", handleResize);

        // Load initial model
        loadAndShowModel(currentIndex);

        // Cleanup
        return () => {
            cleanedUpRef.current = true;
            cancelAnimationFrame(animFrameRef.current);
            window.removeEventListener("resize", handleResize);
            controls.dispose();

            scene.traverse((object) => {
                if ((object as THREE.Mesh).isMesh) {
                    const mesh = object as THREE.Mesh;
                    mesh.geometry?.dispose();
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach((m: THREE.Material) => m.dispose());
                    } else {
                        (mesh.material as THREE.Material)?.dispose();
                    }
                }
            });

            renderer.dispose();
            if (containerRef.current?.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }
            modelCacheRef.current.clear();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div ref={containerRef} className="fixed inset-0 z-40 bg-[#111118]">
            {/* Loading spinner */}
            {isLoading && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
                    <div className="bg-black/70 backdrop-blur-sm text-white px-6 py-4 rounded-2xl text-center">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm">Loading 3D model...</p>
                    </div>
                </div>
            )}

            {/* Touch hint */}
            {!isLoading && (
                <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <p className="text-white/50 text-xs">Drag to rotate • Pinch to zoom</p>
                </div>
            )}
        </div>
    );
}
