"use client";

import { useRef, useState, useCallback } from "react";
import type { Product } from "@/lib/types";
import { ChevronLeft, ChevronRight, X, Move3D } from "lucide-react";

/**
 * ARProductCarousel
 *
 * React UI overlay rendered above the AR camera feed.
 * Uses WebXR dom-overlay feature so the HTML is visible in AR.
 *
 * Features:
 * - Product thumbnail strip at the bottom
 * - Left/Right navigation buttons
 * - Swipe gesture support (touchstart/touchmove/touchend)
 * - Active product highlight
 * - Close AR button
 */

interface ARProductCarouselProps {
    products: Product[];
    currentIndex: number;
    onProductChange: (index: number) => void;
    onClose: () => void;
    isPlaced?: boolean;
}

export default function ARProductCarousel({
    products,
    currentIndex,
    onProductChange,
    onClose,
    isPlaced = false,
}: ARProductCarouselProps) {
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const SWIPE_THRESHOLD = 50;

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    }, []);

    const handleTouchEnd = useCallback(() => {
        const diff = touchStartX.current - touchEndX.current;

        if (Math.abs(diff) > SWIPE_THRESHOLD) {
            if (diff > 0 && currentIndex < products.length - 1) {
                // Swipe left → next
                onProductChange(currentIndex + 1);
            } else if (diff < 0 && currentIndex > 0) {
                // Swipe right → previous
                onProductChange(currentIndex - 1);
            }
        }
    }, [currentIndex, products.length, onProductChange]);

    const goNext = useCallback(() => {
        if (currentIndex < products.length - 1) {
            onProductChange(currentIndex + 1);
        }
    }, [currentIndex, products.length, onProductChange]);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            onProductChange(currentIndex - 1);
        }
    }, [currentIndex, onProductChange]);

    const currentProduct = products[currentIndex];

    return (
        <div
            className="fixed inset-x-0 bottom-0 z-50 pointer-events-auto"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Close Button (top-right) */}
            <div className="fixed top-4 right-4 z-50">
                <button
                    onClick={onClose}
                    className="bg-black/60 backdrop-blur-md text-white p-3 rounded-full hover:bg-black/80 transition-all shadow-lg"
                    aria-label="Close AR"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Tap instruction */}
            {!isPlaced && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-sm text-white px-6 py-3 rounded-2xl text-center">
                        <Move3D className="w-8 h-8 mx-auto mb-2 animate-bounce" />
                        <p className="text-sm font-medium">
                            Tap on a surface to place the model
                        </p>
                    </div>
                </div>
            )}

            {/* Bottom Sheet: Product Info + Carousel */}
            <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent pb-8 pt-16 px-4">
                {/* Current Product Info */}
                <div className="mb-4 text-center">
                    <h3 className="text-white text-lg font-bold">
                        {currentProduct?.title}
                    </h3>
                    <p className="text-amber-400 text-xl font-bold mt-1">
                        ₨{currentProduct?.price_amount}
                    </p>
                </div>

                {/* Navigation + Thumbnails */}
                <div className="flex items-center gap-2">
                    {/* Prev Button */}
                    <button
                        onClick={goPrev}
                        disabled={currentIndex === 0}
                        className="shrink-0 bg-white/10 backdrop-blur-sm text-white p-2 rounded-full disabled:opacity-30 hover:bg-white/20 transition"
                        aria-label="Previous product"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Thumbnails */}
                    <div
                        ref={scrollRef}
                        data-carousel
                        className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide py-1"
                        style={{ scrollbarWidth: "none" }}
                    >
                        {products.map((product, idx) => {
                            const hasAR = !!product.ar_model?.file_url;
                            // Prefer AR model thumbnail, then product images
                            const thumb = product.ar_model?.thumbnail_url || product.media?.images?.[0];
                            return (
                                <button
                                    key={product.id}
                                    onClick={() => hasAR && onProductChange(idx)}
                                    disabled={!hasAR}
                                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${idx === currentIndex
                                        ? "border-amber-400 scale-110 shadow-lg shadow-amber-400/30"
                                        : hasAR
                                            ? "border-white/20 hover:border-white/50"
                                            : "border-white/10 opacity-40"
                                        }`}
                                >
                                    {thumb ? (
                                        <img
                                            src={thumb}
                                            alt={product.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                                            <Move3D className="w-4 h-4 text-slate-400" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={goNext}
                        disabled={currentIndex === products.length - 1}
                        className="shrink-0 bg-white/10 backdrop-blur-sm text-white p-2 rounded-full disabled:opacity-30 hover:bg-white/20 transition"
                        aria-label="Next product"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Product counter */}
                <p className="text-white/50 text-xs text-center mt-3">
                    {currentIndex + 1} / {products.length}
                </p>
            </div>
        </div>
    );
}
