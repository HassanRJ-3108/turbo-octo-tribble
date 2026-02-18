export interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string;
  role: "restaurant_owner" | "admin";
}

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  approved_at: string | null;
}

export interface Subscription {
  id: string;
  restaurant_id: string;
  lemon_subscription_id: string;
  status: "inactive" | "active" | "trialing" | "paused" | "past_due" | "cancelled" | "expired";
  active_products_count: number;
  last_billed_at: string | null;
  next_bill_amount: number;
  grace_end_at: string | null;
  warning_count: number;
}

export interface Model3D {
  id: string;
  restaurant_id: string;
  name: string;
  storage_path: string;
  file_url: string;
  thumbnail_url: string | null;
  storage_provider: "supabase" | "cloudinary";
  description: string;
  height: number;
  width: number;
  depth: number;
  dimension_unit: string;
  created_at: string;
}

export interface ARModel {
  id: string;
  name: string;
  file_url: string;
  thumbnail_url: string | null;
  height: number;
  width: number;
  depth: number;
  dimension_unit: string;
}

export interface Product {
  id: string;
  restaurant_id: string;
  ar_model_id: string | null;
  ar_model?: ARModel | null;
  title: string;
  subtitle: string;
  description: string;
  price_amount: number;
  currency: string;
  nutrition: Record<string, any>;
  ingredients: string[];
  dietary: Record<string, boolean>;
  media: { images: string[]; videos: string[] };
  ui_behavior: Record<string, any>;
  active: boolean;
  show_in_menu: boolean;
  order_index: number;
  created_at: string;
}

export interface PublicMenu {
  restaurant_id: string;
  restaurant_name: string;
  slug: string;
  products: Product[];
  total_products: number;
}

export interface OnboardingPayload {
  restaurant_name: string;
  restaurant_slug: string;
  phone: string;
  address: string;
  description: string;
  documents: {
    cnic_front: string;
    cnic_back: string;
    food_license: string;
  };
  photos: string[];
}

export interface Asset {
  id: string;
  restaurant_id: string;
  url: string;
  public_id: string;
  type: "image" | "video";
}
