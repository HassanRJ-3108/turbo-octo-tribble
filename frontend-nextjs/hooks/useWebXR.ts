"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { WebGLRenderer } from "three";

/**
 * useWebXR Hook
 *
 * Encapsulates WebXR session lifecycle management:
 * - Checks AR support
 * - Starts/ends immersive-ar sessions with hit-test
 * - Provides hit-test results for surface placement
 * - Manages reference spaces
 */

export interface WebXRState {
    isARSupported: boolean;
    isSessionActive: boolean;
    hitTestMatrix: Float32Array | null;
    startSession: (
        renderer: WebGLRenderer,
        overlayElement?: HTMLElement
    ) => Promise<XRSession | null>;
    endSession: () => void;
    sessionRef: React.MutableRefObject<XRSession | null>;
    hitTestSourceRef: React.MutableRefObject<XRHitTestSource | null>;
    referenceSpaceRef: React.MutableRefObject<XRReferenceSpace | null>;
}

export function useWebXR(): WebXRState {
    const [isARSupported, setIsARSupported] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [hitTestMatrix, setHitTestMatrix] = useState<Float32Array | null>(null);

    const sessionRef = useRef<XRSession | null>(null);
    const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
    const referenceSpaceRef = useRef<XRReferenceSpace | null>(null);

    // Check AR support on mount
    useEffect(() => {
        const checkSupport = async () => {
            if ("xr" in navigator) {
                try {
                    const supported = await navigator.xr!.isSessionSupported(
                        "immersive-ar"
                    );
                    setIsARSupported(supported);
                } catch {
                    setIsARSupported(false);
                }
            }
        };
        checkSupport();
    }, []);

    /**
     * Start an immersive-ar WebXR session
     * @param renderer - Three.js WebGLRenderer with xr.enabled = true
     * @param overlayElement - Optional DOM element for dom-overlay (React UI)
     */
    const startSession = useCallback(
        async (
            renderer: WebGLRenderer,
            overlayElement?: HTMLElement
        ): Promise<XRSession | null> => {
            if (!navigator.xr) return null;

            try {
                const sessionInit: XRSessionInit = {
                    requiredFeatures: ["hit-test"],
                    optionalFeatures: overlayElement
                        ? ["dom-overlay"]
                        : [],
                };

                if (overlayElement) {
                    (sessionInit as any).domOverlay = { root: overlayElement };
                }

                const session = await navigator.xr!.requestSession(
                    "immersive-ar",
                    sessionInit
                );

                sessionRef.current = session;

                // Set up the renderer's XR session
                await renderer.xr.setSession(session);

                // Get reference space for hit-testing
                const viewerSpace = await session.requestReferenceSpace("viewer");
                referenceSpaceRef.current =
                    await session.requestReferenceSpace("local");

                // Request hit-test source from viewer space
                const hitTestSource = await session.requestHitTestSource!({
                    space: viewerSpace,
                });
                hitTestSourceRef.current = hitTestSource ?? null;

                // Handle session end
                session.addEventListener("end", () => {
                    setIsSessionActive(false);
                    sessionRef.current = null;
                    hitTestSourceRef.current = null;
                    referenceSpaceRef.current = null;
                    setHitTestMatrix(null);
                });

                setIsSessionActive(true);
                return session;
            } catch (err) {
                console.error("Failed to start AR session:", err);
                return null;
            }
        },
        []
    );

    /**
     * End the active AR session
     */
    const endSession = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.end().catch(console.error);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (sessionRef.current) {
                sessionRef.current.end().catch(() => { });
            }
        };
    }, []);

    return {
        isARSupported,
        isSessionActive,
        hitTestMatrix,
        startSession,
        endSession,
        sessionRef,
        hitTestSourceRef,
        referenceSpaceRef,
    };
}
