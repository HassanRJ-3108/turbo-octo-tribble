"use client";

import { useAuth as useClerkAuth } from "@clerk/nextjs";
import useSWR from "swr";
import axios from "axios";
import type { Restaurant, Subscription } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://chorionic-officiously-theron.ngrok-free.dev/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export function useAuth() {
  const { userId, getToken, isLoaded } = useClerkAuth();

  const { data: restaurant, error: restaurantError, isLoading: restaurantLoading } = useSWR<Restaurant>(
    userId ? ["/restaurants", getToken] : null,
    async ([url, getTokenFn]: [string, typeof getToken]) => {
      const token = await getTokenFn();
      const res = await apiClient.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    { revalidateOnFocus: false }
  );

  const { data: subscription, error: subscriptionError } = useSWR<Subscription | null>(
    restaurant ? ["/subscriptions", getToken] : null,
    async ([url, getTokenFn]: [string, typeof getToken]) => {
      const token = await getTokenFn();
      try {
        const res = await apiClient.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
      } catch {
        return null;
      }
    },
    { revalidateOnFocus: false }
  );

  const hasAccess =
    restaurant?.status === "approved" &&
    (subscription?.status === "active" || new Date(restaurant.trial_ends_at || "") > new Date());

  const daysLeftInTrial = restaurant?.trial_ends_at
    ? Math.ceil((new Date(restaurant.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    userId,
    isLoaded,
    restaurant,
    subscription,
    restaurantError,
    restaurantLoading,
    subscriptionError,
    hasAccess,
    daysLeftInTrial,
  };
}
