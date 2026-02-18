import axios, { AxiosInstance } from "axios";
import { auth } from "@clerk/nextjs/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://chorionic-officiously-theron.ngrok-free.dev/api/v1";

export const createApiClient = async (): Promise<AxiosInstance> => {
  const { getToken } = await auth();
  const token = await getToken();

  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      "Content-Type": "application/json",
    },
  });
};

// Client-side API calls (use in client components)
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add interceptor to include auth token on client side
if (typeof window !== "undefined") {
  apiClient.interceptors.request.use(async (config) => {
    // Token will be set from client-side Clerk context
    return config;
  });
}
