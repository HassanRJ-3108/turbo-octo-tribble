"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import type { Product } from "@/lib/types";
import { loadModel as loadModelFromCache } from "@/lib/modelCache";

/**
 * ARViewer Component
 *
 * Full-screen WebXR AR experience using Three.js.
 * - Opens camera via immersive-ar session
 * - Renders reticle on detected surfaces (hit-test)
 * - Places GLB 3D models at real-world scale
 * - Supports product switching without restarting session
 * - No pinch-to-zoom (models are real-world size only)
 */

interface ARViewerProps {
    products: Product[];
    currentIndex: number;
    onClose: () => void;
    overlayRef: React.RefObject<HTMLDivElement | null>;
    onPlaced?: () => void;
    onError?: (message: string) => void;
}

export default function ARViewer({
    products,
    currentIndex,
    onClose,
    overlayRef,
    onPlaced,
    onError,
}: ARViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const sessionRef = useRef<XRSession | null>(null);
    const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
    const reticleRef = useRef<THREE.Mesh | null>(null);
    const currentModelRef = useRef<THREE.Group | null>(null);
    const placementPoseRef = useRef<THREE.Matrix4 | null>(null);
    const cleanedUpRef = useRef(false);
    const sessionStartedRef = useRef(false);
    const isPlacedRef = useRef(false);

    const [isPlaced, setIsPlaced] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState("Initializing AR...");

    /**
     * Place or replace the current model in the scene
     */
    const placeModel = useCallback(
        async (productIndex: number, pose: THREE.Matrix4) => {
            const scene = sceneRef.current;
            if (!scene) return;

            // Remove existing model
            if (currentModelRef.current) {
                scene.remove(currentModelRef.current);
                currentModelRef.current = null;
            }

            const product = products[productIndex];
            if (!product) return;

            setIsLoading(true);
            setStatusMessage("Loading model...");

            const model = await loadModelFromCache(product);
            if (!model || !scene || cleanedUpRef.current) return;

            // Apply placement pose
            const position = new THREE.Vector3();
            const quaternion = new THREE.Quaternion();
            const scale = new THREE.Vector3();
            pose.decompose(position, quaternion, scale);

            model.position.copy(position);
            model.quaternion.copy(quaternion);

            scene.add(model);
            currentModelRef.current = model;
            placementPoseRef.current = pose.clone();

            setIsLoading(false);
            setIsPlaced(true);
            isPlacedRef.current = true;
            setStatusMessage("");
            onPlaced?.();
        },
        [products, onPlaced]
    );

    /**
     * Switch product without restarting AR session
     * Reuses the same placement position
     */
    useEffect(() => {
        if (!isPlaced || !placementPoseRef.current) return;
        placeModel(currentIndex, placementPoseRef.current);
    }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

    /**
     * Initialize Three.js scene and WebXR session
     */
    useEffect(() => {
        if (!containerRef.current) return;

        // Guard against React StrictMode double-mount
        if (sessionStartedRef.current) return;
        sessionStartedRef.current = true;
        cleanedUpRef.current = false;

        // --- Check AR Support First ---
        const checkAndStart = async () => {
            // Check if WebXR is available
            if (!navigator.xr) {
                setStatusMessage("WebXR not supported on this device");
                setIsLoading(false);
                onError?.("WebXR is not supported on this browser. Please try on an AR-capable mobile device (Android Chrome).");
                // Auto-close after showing message
                setTimeout(() => { if (!cleanedUpRef.current) onClose(); }, 3000);
                return;
            }

            // Check if immersive-ar is supported
            try {
                const supported = await navigator.xr.isSessionSupported("immersive-ar");
                if (!supported) {
                    setStatusMessage("AR not supported — use a mobile device");
                    setIsLoading(false);
                    onError?.("Immersive AR is not supported on this device. Please try on an AR-capable Android phone with Chrome.");
                    setTimeout(() => { if (!cleanedUpRef.current) onClose(); }, 3000);
                    return;
                }
            } catch {
                setStatusMessage("AR check failed");
                setIsLoading(false);
                onError?.("Could not check AR support.");
                setTimeout(() => { if (!cleanedUpRef.current) onClose(); }, 3000);
                return;
            }

            // --- AR is supported, proceed with setup ---

            // --- Scene Setup ---
            const scene = new THREE.Scene();
            sceneRef.current = scene;

            const camera = new THREE.PerspectiveCamera(
                70,
                window.innerWidth / window.innerHeight,
                0.01,
                20
            );
            cameraRef.current = camera;

            // --- Lighting (lightweight for mobile) ---
            const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
            directionalLight.position.set(2, 5, 3);
            // No shadows in AR — camera feed is the background, shadows aren't visible
            scene.add(directionalLight);

            // --- Renderer (optimized for mobile AR) ---
            const renderer = new THREE.WebGLRenderer({
                antialias: false,      // MSAA is very expensive on mobile
                alpha: true,
                powerPreference: "high-performance",
            });
            // Cap pixel ratio — phones report 3-4x which renders millions of extra pixels
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.xr.enabled = true;
            // No shadow maps — saves significant GPU per frame

            if (containerRef.current && !cleanedUpRef.current) {
                containerRef.current.appendChild(renderer.domElement);
            }
            rendererRef.current = renderer;

            // --- Reticle ---
            const reticleGeometry = new THREE.RingGeometry(0.05, 0.07, 32).rotateX(
                -Math.PI / 2
            );
            const reticleMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                transparent: true,
                opacity: 0.8,
            });
            const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
            reticle.matrixAutoUpdate = false;
            reticle.visible = false;
            scene.add(reticle);
            reticleRef.current = reticle;

            // --- Tap to Place ---
            const controller = renderer.xr.getController(0);
            controller.addEventListener("select", () => {
                if (reticle.visible) {
                    const pose = new THREE.Matrix4().fromArray(reticle.matrix.elements);
                    placeModel(currentIndex, pose);
                }
            });
            scene.add(controller);

            // --- Start AR Session ---
            try {
                const sessionInit: XRSessionInit = {
                    requiredFeatures: ["hit-test"],
                    optionalFeatures: ["dom-overlay", "local-floor", "local"],
                };

                if (overlayRef.current) {
                    (sessionInit as any).domOverlay = {
                        root: overlayRef.current,
                    };
                }

                const session = await navigator.xr!.requestSession(
                    "immersive-ar",
                    sessionInit
                );

                if (cleanedUpRef.current) {
                    session.end();
                    return;
                }

                sessionRef.current = session;

                // Set the XR session on the renderer (Three.js handles reference space internally)
                try {
                    await renderer.xr.setSession(session);
                } catch (refErr: any) {
                    console.error("Failed to set XR session on renderer:", refErr);
                    setStatusMessage("AR setup failed — try updating Chrome");
                    setIsLoading(false);
                    onError?.("Failed to initialize AR renderer: " + (refErr?.message || "Unknown"));
                    session.end().catch(() => { });
                    setTimeout(() => { if (!cleanedUpRef.current) onClose(); }, 3000);
                    return;
                }

                session.addEventListener("end", () => {
                    sessionRef.current = null;
                    hitTestSourceRef.current = null;
                    if (!cleanedUpRef.current) {
                        onClose();
                    }
                });

                // --- Set up hit-test source ONCE here (not in animation loop) ---
                try {
                    const viewerSpace = await session.requestReferenceSpace("viewer");
                    if (session.requestHitTestSource) {
                        const source = await session.requestHitTestSource({ space: viewerSpace });
                        if (source) {
                            hitTestSourceRef.current = source;
                        }
                    }
                } catch (hitErr) {
                    console.warn("Hit-test source setup failed:", hitErr);
                    // Non-fatal: AR will work but surface detection won't
                }

                setIsLoading(false);
                setStatusMessage("Point your camera at a flat surface");
            } catch (err: any) {
                console.error("AR Session failed:", err);
                const message = err?.message || "Unknown error";
                setStatusMessage("AR failed: " + message);
                setIsLoading(false);
                onError?.("Failed to start AR: " + message);
                setTimeout(() => { if (!cleanedUpRef.current) onClose(); }, 3000);
                return;
            }

            // --- Animation Loop ---
            renderer.setAnimationLoop((_timestamp, frame) => {
                if (cleanedUpRef.current) return;

                if (frame) {
                    const refSpace = renderer.xr.getReferenceSpace();

                    if (refSpace) {
                        // Update reticle from hit-test (only before first placement)
                        if (hitTestSourceRef.current && !isPlacedRef.current) {
                            try {
                                const hitTestResults = frame.getHitTestResults(
                                    hitTestSourceRef.current
                                );
                                if (hitTestResults.length > 0) {
                                    const hit = hitTestResults[0];
                                    const pose = hit.getPose(refSpace);
                                    if (pose) {
                                        reticle.visible = true;
                                        reticle.matrix.fromArray(pose.transform.matrix);
                                    }
                                } else {
                                    reticle.visible = false;
                                }
                            } catch {
                                reticle.visible = false;
                            }
                        } else {
                            reticle.visible = false;
                        }
                    }
                }

                renderer.render(scene, camera);
            });

            // --- Resize ---
            const handleResize = () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener("resize", handleResize);
        };

        checkAndStart();

        // --- Cleanup ---
        return () => {
            cleanedUpRef.current = true;
            sessionStartedRef.current = false;

            if (sessionRef.current) {
                sessionRef.current.end().catch(() => { });
                sessionRef.current = null;
            }

            const renderer = rendererRef.current;
            if (renderer) {
                renderer.setAnimationLoop(null);

                sceneRef.current?.traverse((object) => {
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

                if (containerRef.current?.contains(renderer.domElement)) {
                    containerRef.current.removeChild(renderer.domElement);
                }
            }

            // NOTE: Do NOT clear global cache here — it persists for instant re-loads
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-40"
            style={{ background: "transparent" }}
        >
            {/* Status overlay */}
            {statusMessage && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
                    <div className="bg-black/70 backdrop-blur-sm text-white px-6 py-4 rounded-2xl text-center max-w-xs">
                        {isLoading && (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                        )}
                        <p className="text-sm font-medium">{statusMessage}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
