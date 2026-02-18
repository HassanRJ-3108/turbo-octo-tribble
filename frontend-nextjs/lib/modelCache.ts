/**
 * Global 3D Model Cache Service
 *
 * Singleton cache that persists across component mounts/unmounts.
 * Features:
 * - Pre-fetches models in background when menu loads (just HTTP cache)
 * - Stores parsed Three.js scenes for instant reload
 * - Shared between ARViewer and FullScreen3DViewer
 * - Uses DRACOLoader for compressed models
 * - Memory-safe: limits total cached models
 */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import type { Product } from "@/lib/types";

const MAX_CACHED_MODELS = 10;

// Singleton loader with Draco support
let gltfLoader: GLTFLoader | null = null;
let dracoLoader: DRACOLoader | null = null;

function getLoader(): GLTFLoader {
    if (!gltfLoader) {
        gltfLoader = new GLTFLoader();

        // Set up Draco decoder (uses Google's CDN for decoder files)
        dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath(
            "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
        );
        dracoLoader.preload();
        gltfLoader.setDRACOLoader(dracoLoader);
    }
    return gltfLoader;
}

// ====== Parsed Model Cache ======
// Stores fully parsed + scaled Three.js scenes
interface CachedModel {
    group: THREE.Group;
    timestamp: number;
}

const parsedCache = new Map<string, CachedModel>();

// ====== Pre-fetch Queue ======
// URLs currently being pre-fetched (HTTP level, puts files in browser cache)
const prefetchingUrls = new Set<string>();

// ====== Loading promises ======
// Track in-progress loads so duplicates don't re-request
const loadingPromises = new Map<string, Promise<THREE.Group | null>>();

/**
 * Get a cache key for a product's AR model
 */
export function getCacheKey(product: Product): string {
    return product.ar_model?.id || product.ar_model?.file_url || product.id;
}

/**
 * Check if a model is already cached (parsed + ready)
 */
export function isModelCached(product: Product): boolean {
    return parsedCache.has(getCacheKey(product));
}

/**
 * Get a cached model clone (instant, no loading)
 */
export function getCachedModel(product: Product): THREE.Group | null {
    const key = getCacheKey(product);
    const cached = parsedCache.get(key);
    if (cached) {
        cached.timestamp = Date.now(); // Mark as recently used
        return cached.group.clone();
    }
    return null;
}

/**
 * Evict oldest entries if over limit
 */
function evictIfNeeded() {
    if (parsedCache.size <= MAX_CACHED_MODELS) return;

    // Sort by timestamp, oldest first
    const entries = [...parsedCache.entries()].sort(
        (a, b) => a[1].timestamp - b[1].timestamp
    );

    while (parsedCache.size > MAX_CACHED_MODELS && entries.length > 0) {
        const [key, entry] = entries.shift()!;
        // Dispose resources
        entry.group.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
                const mesh = obj as THREE.Mesh;
                mesh.geometry?.dispose();
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach((m) => m.dispose());
                } else {
                    (mesh.material as THREE.Material)?.dispose();
                }
            }
        });
        parsedCache.delete(key);
    }
}

/**
 * Load and parse a model, applying real-world scale.
 * Returns a clone — the original stays in cache.
 *
 * If the same model is being loaded by another call, de-duplicates.
 */
export async function loadModel(
    product: Product
): Promise<THREE.Group | null> {
    const arModel = product.ar_model;
    if (!arModel?.file_url) return null;

    const cacheKey = getCacheKey(product);

    // Already cached? Return clone instantly
    const cached = getCachedModel(product);
    if (cached) return cached;

    // Already loading? Await the same promise
    if (loadingPromises.has(cacheKey)) {
        const result = await loadingPromises.get(cacheKey)!;
        return result ? result.clone() : null;
    }

    // Start new load
    const loadPromise = (async (): Promise<THREE.Group | null> => {
        try {
            const loader = getLoader();
            const gltf = await loader.loadAsync(arModel.file_url);
            const model = gltf.scene;

            // Scale: backend stores cm, Three.js uses meters
            const box = new THREE.Box3().setFromObject(model);
            const modelSize = new THREE.Vector3();
            box.getSize(modelSize);

            const targetHeight = (arModel.height || 10) / 100;
            const targetWidth = (arModel.width || 10) / 100;
            const targetDepth = (arModel.depth || 10) / 100;

            const scaleX = modelSize.x > 0 ? targetWidth / modelSize.x : 1;
            const scaleY = modelSize.y > 0 ? targetHeight / modelSize.y : 1;
            const scaleZ = modelSize.z > 0 ? targetDepth / modelSize.z : 1;
            model.scale.set(scaleX, scaleY, scaleZ);

            // Center + sit on surface
            const scaledBox = new THREE.Box3().setFromObject(model);
            const center = new THREE.Vector3();
            scaledBox.getCenter(center);
            model.position.sub(center);
            model.position.y -= scaledBox.min.y;

            // Store in cache
            evictIfNeeded();
            parsedCache.set(cacheKey, {
                group: model.clone(),
                timestamp: Date.now(),
            });

            return model;
        } catch (err) {
            console.error(`Failed to load model for ${product.title}:`, err);
            return null;
        } finally {
            loadingPromises.delete(cacheKey);
        }
    })();

    loadingPromises.set(cacheKey, loadPromise);
    return loadPromise;
}

/**
 * Pre-fetch model files at HTTP level (puts them in browser's disk cache).
 * Does NOT parse — just downloads the bytes.
 *
 * Call this on the menu page so models are in browser cache
 * before user opens AR. Makes actual loadAsync() much faster.
 */
export function prefetchModels(products: Product[]) {
    for (const product of products) {
        const url = product.ar_model?.file_url;
        if (!url || prefetchingUrls.has(url) || isModelCached(product)) continue;

        prefetchingUrls.add(url);

        // Use low priority fetch to not block other resources
        fetch(url, {
            priority: "low" as any,
            cache: "force-cache",
        })
            .then(() => {
                // File is now in browser HTTP cache
                console.log(`[ModelCache] Pre-fetched: ${product.title}`);
            })
            .catch(() => {
                // Non-critical, ignore
            })
            .finally(() => {
                prefetchingUrls.delete(url);
            });
    }
}

/**
 * Fully pre-load (download + parse) a specific product's model.
 * Use for the currently selected product before opening AR.
 */
export async function preloadModel(product: Product): Promise<boolean> {
    const model = await loadModel(product);
    return model !== null;
}

/**
 * Clear all cached models (e.g., on logout)
 */
export function clearCache() {
    for (const [, entry] of parsedCache) {
        entry.group.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
                const mesh = obj as THREE.Mesh;
                mesh.geometry?.dispose();
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach((m) => m.dispose());
                } else {
                    (mesh.material as THREE.Material)?.dispose();
                }
            }
        });
    }
    parsedCache.clear();
    loadingPromises.clear();
}
