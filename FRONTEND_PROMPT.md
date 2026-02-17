# Foodar.pk — Next.js Frontend Build Prompt

## Project Overview

**Foodar.pk** is a SaaS platform where Pakistani restaurant owners create AR (Augmented Reality) menus. Customers scan a QR code → visit `restaurant-slug.foodar.pk` → see the menu with 3D/AR product previews directly in the browser. Restaurant owners sign up, get admin approval, enjoy a 7-day free trial, then pay monthly based on usage.

**Backend is already built** (FastAPI + Python). You are building the **Next.js frontend only** that connects to this backend API.

---

## Tech Stack (MANDATORY)

- **Next.js 16+** with App Router
- **TypeScript** strict mode
- **Tailwind CSS** for styling
- **Clerk** for authentication (signup/signin/user management)
- **`<model-viewer>`** web component by Google for 3D/AR rendering
- Mobile-first responsive design

---

## Backend API

**Base URL**: `https://api.foodar.pk/api/v1` (production) or `http://localhost:8000/api/v1` (development)

**Authentication**: All protected endpoints require a Clerk JWT Bearer token in the `Authorization` header. The backend verifies the token against Clerk's JWKS.

### API Endpoints

#### 🔓 Public (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/menu/{slug}` | Public restaurant menu (for `slug.foodar.pk`) — returns products, AR models |

#### 🔒 Auth Required (Restaurant Owner)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/onboarding` | Submit restaurant onboarding application |
| POST | `/onboarding/upload` | Upload file during onboarding (CNIC, license, photos) → returns `{ url, public_id }` |
| GET | `/restaurants` | Get current user's restaurant info |
| PATCH | `/restaurants/{id}` | Update restaurant (name, custom_domain) |
| GET | `/subscriptions` | Get subscription status & trial info |
| POST | `/subscriptions/checkout` | Create Lemon Squeezy checkout session → returns checkout URL |
| POST | `/models` | Upload 3D model file (multipart form: `file`, `name`, `description`, `height`, `width`, `depth`, `dimension_unit`) |
| GET | `/models` | List all 3D models |
| GET | `/models/{id}` | Get single 3D model with signed URL |
| DELETE | `/models/{id}` | Delete 3D model |
| POST | `/products` | Create product (JSON body) |
| GET | `/products` | List all products |
| GET | `/products/{id}` | Get single product |
| PATCH | `/products/{id}` | Update product |
| DELETE | `/products/{id}` | Delete product |
| POST | `/assets` | Upload image/video via Cloudinary |
| GET | `/assets` | List assets |

#### 🔒 Admin Only
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/restaurants` | List all restaurants (filter by status) |
| GET | `/admin/restaurants/{id}` | Restaurant detail with onboarding docs |
| POST | `/admin/restaurants/{id}/approve` | Approve restaurant (starts 7-day trial) |
| POST | `/admin/restaurants/{id}/reject` | Reject restaurant |
| GET | `/admin/analytics` | Platform analytics (MRR, active subs) |

---

## Database Schema (What the Backend Returns)

### User
```json
{
  "id": "uuid",
  "clerk_user_id": "user_xxx",
  "email": "owner@restaurant.com",
  "full_name": "Ali Khan",
  "role": "restaurant_owner | admin"
}
```

### Restaurant
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "name": "Naseer's Kitchen",
  "slug": "naseers-kitchen",
  "custom_domain": null,
  "status": "pending | approved | rejected | suspended",
  "trial_starts_at": "2026-02-14T16:00:00Z",
  "trial_ends_at": "2026-02-21T16:00:00Z",
  "approved_at": "2026-02-14T16:00:00Z"
}
```

### Subscription
```json
{
  "id": "uuid",
  "restaurant_id": "uuid",
  "lemon_subscription_id": "ls_xxx",
  "status": "inactive | active | past_due | cancelled",
  "active_products_count": 5,
  "last_billed_at": "2026-03-14T00:00:00Z",
  "next_bill_amount": 5000,
  "grace_end_at": null,
  "warning_count": 0
}
```

### 3D Model
```json
{
  "id": "uuid",
  "restaurant_id": "uuid",
  "name": "Pizza Margherita",
  "storage_path": "restaurant-id/models/model-id/pizza.glb",
  "file_url": "https://supabase-signed-url...",
  "thumbnail_url": "https://cloudinary-url...",
  "description": "3D model of our signature pizza",
  "height": 5.0,
  "width": 30.0,
  "depth": 30.0,
  "dimension_unit": "cm"
}
```

### Product
```json
{
  "id": "uuid",
  "restaurant_id": "uuid",
  "ar_model_id": "uuid | null",
  "title": "Margherita Pizza",
  "subtitle": "Classic Italian",
  "description": "Wood-fired...",
  "price_amount": 850,
  "currency": "PKR",
  "nutrition": { "calories": 250, "protein": "12g", "carbs": "30g", "fat": "10g" },
  "ingredients": ["Mozzarella", "Tomato Sauce", "Fresh Basil"],
  "dietary": { "vegetarian": true, "gluten_free": false, "halal": true },
  "media": { "images": ["https://cloudinary..."], "videos": [] },
  "ui_behavior": {},
  "active": true,
  "show_in_menu": true,
  "order_index": 0
}
```

### Onboarding Submit Payload
```json
{
  "restaurant_name": "Naseer's Kitchen",
  "restaurant_slug": "naseers-kitchen",
  "phone": "+92-300-1234567",
  "address": "F-7 Markaz, Islamabad",
  "description": "Authentic Pakistani cuisine...",
  "documents": { "cnic_front": "https://cloudinary-url...", "cnic_back": "https://cloudinary-url...", "food_license": "https://cloudinary-url..." },
  "photos": ["https://cloudinary-url/photo1.jpg", "https://cloudinary-url/photo2.jpg"]
}
```

### Asset (Cloudinary Upload Response)
```json
{
  "id": "uuid",
  "restaurant_id": "uuid",
  "url": "https://res.cloudinary.com/foodar/image/upload/v123/restaurants/uuid/image.jpg",
  "public_id": "restaurants/uuid/image",
  "type": "image | video"
}
```

---

## Complete User Flow (CRITICAL — Follow Exactly)

### Flow 1: New User Signup → Onboarding

```
Landing Page → Click "Sign Up" → Clerk SignUp page → User created in Clerk
    ↓
Backend creates user record via Clerk webhook (automatic)
    ↓
User has NO restaurant → Redirect to /onboarding
    ↓
Onboarding Form: restaurant name, phone, address, description, documents upload, photos
    ↓
POST /api/v1/onboarding → status becomes "pending"
    ↓
Redirect to /onboarding/pending (waiting screen)
```

### Flow 2: Access Control Logic (CRITICAL)

After sign-in, the frontend MUST check the user's restaurant status and redirect accordingly:

```
User signs in → GET /api/v1/restaurants
    ↓
┌─ No restaurant found → /onboarding (show onboarding form)
│
├─ status == "pending" → /onboarding/pending (waiting screen, "Your application is under review")
│
├─ status == "rejected" → /onboarding/rejected
│     ↓
│     If backend allows resubmission → Show "Resubmit" button → goes to /onboarding
│     If permanent rejection → Show final rejection message
│
├─ status == "approved" → /dashboard (full access)
│     ↓
│     Check trial: if trial_ends_at > now → Show "X days left in trial" badge in navbar
│     Check subscription: GET /api/v1/subscriptions
│         - status == "active" → Full access
│         - status == "inactive" && trial active → Full access (trial)
│         - status == "inactive" && trial expired → Block dashboard, show subscribe CTA
│         - status == "past_due" → Show warning, limited access
│
├─ status == "suspended" → /suspended (account suspended page)
```

**Route Protection Rules:**
| Route | Auth Required? | Access |
|-------|--------------|--------|
| `/` | ❌ No | Landing page (public) |
| `/sign-in`, `/sign-up` | ❌ No | Clerk auth pages |
| `slug.foodar.pk` | ❌ No | Public menu (no auth) |
| `/onboarding` | ✅ Yes | Only users with NO restaurant OR status == "rejected" |
| `/onboarding/pending` | ✅ Yes | Only status == "pending" |
| `/onboarding/rejected` | ✅ Yes | Only status == "rejected" |
| `/dashboard/*` | ✅ Yes | Only status == "approved" AND (trial active OR subscription active) |
| `/subscribe` | ✅ Yes | Only status == "approved" AND trial expired AND no active subscription |
| `/suspended` | ✅ Yes | Only status == "suspended" |

**If user tries to access a route they shouldn't:**
- Not logged in + tries `/dashboard/*` or `/subscribe` → redirect to `/sign-in`
- No restaurant → redirect to `/onboarding`
- Pending → redirect to `/onboarding/pending`
- Rejected → redirect to `/onboarding/rejected`
- Trial expired + no subscription → redirect to `/subscribe`
- Has active access + tries `/subscribe` → redirect to `/dashboard`
- Any dashboard route while not approved → redirect to correct status page

### Flow 3: Dashboard (After Approval)

```
/dashboard
├── Overview (welcome, trial days remaining or subscription status)
├── /dashboard/models → 3D Models management
│   ├── Upload 3D model (.glb, .gltf, .usdz)
│   │   - File picker
│   │   - Name field
│   │   - Description field
│   │   - Height, Width, Depth fields (in cm) for real-world AR sizing
│   ├── List all models with thumbnails
│   └── Delete models
│
├── /dashboard/products → Product management
│   ├── Add product
│   │   - Title, subtitle, description
│   │   - Price (PKR)
│   │   - Select AR model (dropdown of uploaded 3D models)
│   │   - Upload images/videos
│   │   - Nutrition info (calories, protein, carbs, fat)
│   │   - Ingredients (tags/chips input)
│   │   - Dietary flags (halal, vegetarian, vegan, gluten-free)
│   │   - Active toggle, Show in menu toggle
│   │   - Order index (drag to reorder)
│   ├── Edit product
│   ├── Delete product
│   └── Toggle active/show_in_menu
│
├── /dashboard/settings → Store settings
│   ├── Restaurant name
│   ├── Store domain: shows "{slug}.foodar.pk"
│   ├── Custom domain (future planning coming soon)
│   └── Preview link to public menu
│
├── /dashboard/subscription → Subscription management
│   ├── Current status (trial / active / inactive)
│   ├── Trial days remaining (if in trial)
│   ├── Active products count
│   ├── Next bill amount: (active_products × 300 PKR)
│   ├── Subscribe button → POST /subscriptions/checkout → redirect to Lemon Squeezy
│   └── Billing history
```

### Flow 4: Trial Expiration Warning

```
If trial ends in < 24 hours:
    - Backend sends email with subscribe CTA
    - Dashboard shows WARNING alert card: "Your trial expires in X hours. Subscribe to keep access."
    - Alert links to /dashboard/subscription

If trial has expired and no subscription:
    - Dashboard is BLOCKED
    - Show full-page "Trial Expired" screen with Subscribe button
    - POST /subscriptions/checkout → redirect to Lemon Squeezy checkout
```

### Flow 5: Subscription & Billing

```
First payment: 5,000 PKR (setup fee)
Monthly after: active_products_count × 300 PKR

Checkout flow:
    POST /api/v1/subscriptions/checkout
    → Response: { "checkout_url": "https://lemonsqueezy.com/checkout/..." }
    → Redirect user to checkout_url
    → After payment, Lemon Squeezy webhook updates subscription status to "active"
    → User returns to /dashboard with active subscription
```

### Flow 6: Public Menu (slug.foodar.pk)

```
Visitor goes to naseers-kitchen.foodar.pk
    ↓
Frontend calls GET /api/v1/menu/naseers-kitchen
    ↓
Response includes: restaurant_name, products (with AR model IDs), total_products
    ↓
Display products in a beautiful menu layout:
    - Product card: image, title, subtitle, price, description
    - "View in AR" button for products with AR models
    - Clicking opens <model-viewer> with the 3D model
    - AR button for mobile: launches camera-based AR with real-world scaling
```

---

## 3D/AR Viewer Requirements (CRITICAL)

Use Google's `<model-viewer>` web component. Install: `npm install @google/model-viewer`

```html
<model-viewer
  src="{file_url}"
  alt="{name}"
  ar
  ar-modes="webxr scene-viewer quick-look"
  camera-controls
  shadow-intensity="1"
  style="width: 100%; height: 400px;"
>
  <button slot="ar-button" class="ar-button">
    View in AR
  </button>
</model-viewer>
```

**AR Scaling Rules:**
- 3D models MUST render at their REAL-WORLD SIZE using the `height`, `width`, `depth` fields from the API
- When placing in AR, the object should appear at its actual physical size
- NO zoom/resize in AR mode — fixed real-world scale only
- On desktop: 3D viewer with orbit controls (can zoom in 3D viewer only)
- On mobile: AR button launches camera for placement in real environment

---

## Navbar Design

| State | Navbar Items |
|-------|-------------|
| Not signed in | Logo, Features, Pricing, Sign In, Sign Up |
| Signed in + No restaurant | Logo, Profile dropdown (with sign out) |
| Signed in + Pending | Logo, "Application Pending" badge, Profile |
| Signed in + Approved (trial) | Logo, **Dashboard**, "X days trial left" badge, Profile |
| Signed in + Approved (subscribed) | Logo, **Dashboard**, "Active" badge, Profile |
| Signed in + Trial expired | Logo, "Subscribe Now" CTA button, Profile |

And luckuly you can use clerk avatar component 😊

---

## Sidebar (Dashboard Only)

```
📊 Overview
📦 3D Models
🍕 Products
💳 Subscription
⚙️ Settings
```

---

## Email Notifications (Backend Handles, Frontend Shows Results)

The backend sends these emails via Resend. The frontend just needs to display the correct states:

1. **Onboarding Approved** — Email sent with dashboard link. Frontend: show approved state
2. **Onboarding Rejected** — Email sent with reason. Frontend: show rejected state with optional resubmit
3. **Trial Expiring (24h before)** — Email with subscribe CTA. Frontend: show warning banner
4. **Trial Expired** — Email with subscribe link. Frontend: block dashboard access
5. **Payment Failed** — Email with retry info. Frontend: show past_due state with warning

---

## Wildcard Domain Setup

The public menu uses subdomains: `{slug}.foodar.pk`

**Next.js Configuration Required:**
- Configure `next.config.js` to handle wildcard subdomains
- Use middleware to detect subdomain and extract the slug
- For `slug.foodar.pk`, render the public menu page
- For `foodar.pk` and `www.foodar.pk`, render the main SaaS app

```typescript
// middleware.ts
export function middleware(request) {
  const hostname = request.headers.get("host");
  const slug = hostname?.split(".foodar.pk")[0];
  
  if (slug && slug !== "www" && slug !== "foodar") {
    // This is a restaurant subdomain — rewrite to /menu/[slug]
    return NextResponse.rewrite(new URL(`/menu/${slug}`, request.url));
  }
}
```

---

## Design Aesthetic Requirements

1. **Dark mode by default** with light mode toggle
2. **Premium SaaS feel** — think Linear, Vercel, Stripe dashboard
3. **Glassmorphism** effects on cards and modals
4. **Smooth micro-animations** on interactions (hover, click, transitions)
5. **Pakistani-friendly**: RTL support optional but prices in PKR, localized UX
6. **Mobile-first**: Everything must work beautifully on mobile since restaurant customers will browse menus on phones
7. **AR-focused landing page**: Hero section showcasing the AR menu experience with a demo video/animation
8. **Color palette**: Dark backgrounds with vibrant accent colors (e.g., amber/gold for food, teal for AR/tech)

---

## Environment Variables (Frontend)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_API_URL=https://api.foodar.pk/api/v1
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

---

## File Upload Flow (CRITICAL — 3 Different Scenarios)

**Cloudinary API keys live ONLY on the backend. The frontend NEVER touches Cloudinary directly.**

### Scenario 1: Onboarding Uploads (CNIC, Food License, Restaurant Photos)

During onboarding, the user has NO restaurant yet and NO subscription. But they need to upload documents.

```
Flow:
1. User picks a file (CNIC photo, food license PDF, restaurant photo)
2. Frontend calls POST /api/v1/onboarding/upload (multipart form)
   → Backend uploads to Cloudinary → returns { "url": "https://cloudinary..." }
3. Frontend stores the returned URL in local state
4. When user submits the onboarding form:
   POST /api/v1/onboarding with body:
   {
     "documents": {
       "cnic_front": "https://cloudinary-url...",
       "cnic_back": "https://cloudinary-url...",
       "food_license": "https://cloudinary-url..."
     },
     "photos": ["https://cloudinary-url/photo1.jpg", ...],
     ...other fields
   }
```

**What are "documents"?**
- `cnic_front` — Front side of CNIC (Pakistani national ID card) — image
- `cnic_back` — Back side of CNIC — image
- `food_license` — Food license/permit from local authority — image or PDF
- These are required for admin verification before approving the restaurant

**What are "photos"?**
- Restaurant exterior/interior photos (1-5 images)
- Used by admin to verify the restaurant is legitimate
- Also displayed on the public menu page later

### Scenario 2: Product/Asset Uploads (During Dashboard — After Approval)

```
Flow:
1. User picks image/video for a product
2. Frontend calls POST /api/v1/assets (multipart: file + asset_type="image")
   → Backend uploads to Cloudinary → returns AssetRead with URL
3. Frontend uses the returned URL in the product's media field:
   POST /api/v1/products with body:
   { "media": { "images": ["https://cloudinary-url..."], "videos": [] }, ... }
```

### Scenario 3: 3D Model Uploads (During Dashboard — After Approval)

```
Flow:
1. User picks .glb/.gltf/.usdz file
2. Frontend calls POST /api/v1/models (multipart form):
   - file: the 3D model file
   - name: "Pizza Margherita"
   - description: "3D model of pizza"
   - height: 5.0
   - width: 30.0
   - depth: 30.0
   - dimension_unit: "cm"
3. Backend uploads to Supabase Storage → creates DB record → returns Model3DRead
```

---

## Full Project Structure (Next.js Best Practices)

```
src/
├── app/                                # Next.js App Router pages
│   ├── layout.tsx                      # Root layout (ClerkProvider, ThemeProvider, fonts)
│   ├── page.tsx                        # Landing page (public)
│   ├── globals.css                     # Tailwind + global styles
│   ├── not-found.tsx                   # 404 page
│   │
│   ├── (auth)/                         # Auth route group (no layout nesting)
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   │
│   ├── (protected)/                    # Route group — Clerk middleware protects all children
│   │   ├── onboarding/
│   │   │   ├── page.tsx                # Onboarding multi-step form
│   │   │   ├── pending/page.tsx        # "Under review" waiting screen
│   │   │   └── rejected/page.tsx       # Rejection + optional resubmit
│   │   │
│   │   ├── dashboard/
│   │   │   ├── layout.tsx              # Dashboard shell (sidebar + topbar)
│   │   │   ├── page.tsx                # Overview/home
│   │   │   ├── models/
│   │   │   │   └── page.tsx            # 3D model management (list + upload)
│   │   │   ├── products/
│   │   │   │   ├── page.tsx            # Product list (with drag reorder)
│   │   │   │   ├── new/page.tsx        # Add product form
│   │   │   │   └── [id]/edit/page.tsx  # Edit product form
│   │   │   ├── subscription/
│   │   │   │   └── page.tsx            # Subscription status + checkout
│   │   │   └── settings/
│   │   │       └── page.tsx            # Store settings
│   │   │
│   │   ├── subscribe/page.tsx          # Trial expired — subscribe CTA
│   │   └── suspended/page.tsx          # Account suspended
│   │
│   └── menu/
│       └── [slug]/page.tsx             # Public restaurant menu (SSR, no auth)
│
├── components/                         # Reusable UI components
│   ├── ui/                             # Base design system (Button, Card, Badge, Modal, Input...)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── modal.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── file-upload.tsx             # Drag & drop file upload component
│   │   ├── skeleton.tsx                # Loading skeleton
│   │   ├── toast.tsx                   # Toast notifications
│   │   ├── spinner.tsx                 # Loading spinner
│   │   └── etc                         # etc
│   │
│   ├── layout/                         # Layout-level components
│   │   ├── navbar.tsx                  # Top navbar (state-aware: trial badge, etc.)
│   │   ├── sidebar.tsx                 # Dashboard sidebar navigation
│   │   ├── footer.tsx                  # Landing page footer
│   │   ├── mobile-nav.tsx              # Mobile hamburger menu
│   │   └── etc                         # etc
│   │
│   ├── landing/                        # Landing page sections
│   │   ├── hero.tsx                    # Hero with AR demo animation
│   │   ├── features.tsx                # Feature cards
│   │   ├── pricing.tsx                 # Pricing table
│   │   ├── how-it-works.tsx            # Step-by-step flow
│   │   ├── cta.tsx                     # Call-to-action section
│   │   └── etc                         # etc
│   │
│   ├── onboarding/                     # Onboarding form components
│   │   ├── onboarding-form.tsx         # Multi-step form container
│   │   ├── restaurant-info-step.tsx    # Step 1: name, slug, phone, address
│   │   ├── documents-step.tsx          # Step 2: CNIC + food license upload
│   │   ├── photos-step.tsx             # Step 3: restaurant photos
│   │   ├── review-step.tsx             # Step 4: review & submit
│   │   └── etc                         # etc
│   │
│   ├── dashboard/                      # Dashboard-specific components
│   │   ├── overview-stats.tsx          # Stats cards (products, trial days, etc.)
│   │   ├── trial-warning-banner.tsx    # "Trial expires in X days" alert
│   │   ├── subscription-status.tsx     # Subscription status card
│   │   ├── model-upload-form.tsx       # 3D model upload with sizing fields
│   │   ├── model-card.tsx              # 3D model thumbnail card
│   │   ├── product-form.tsx            # Product create/edit form
│   │   ├── product-card.tsx            # Product list card
│   │   ├── product-list.tsx            # Draggable product list
│   │   ├── image-upload.tsx            # Cloudinary image upload for products
│   │   └── etc                         # etc
│   │
│   ├── menu/                           # Public menu components
│   │   ├── menu-header.tsx             # Restaurant name + branding
│   │   ├── product-menu-card.tsx       # Product card with "View in AR" button
│   │   ├── ar-viewer-modal.tsx         # Full-screen AR/3D viewer overlay
│   │   ├── product-detail-sheet.tsx    # Bottom sheet with product details
│   │   └── etc                         # etc
│   │
│   └── shared/                         # Shared/common components
│       ├── status-redirect.tsx         # Auth + status check + redirect logic
│       ├── page-loading.tsx            # Full-page loading state
│       ├── error-boundary.tsx          # Error fallback UI
│       ├── empty-state.tsx             # "No items yet" placeholder
│       └── etc                         # etc
│
├── hooks/                              # Custom React hooks
│   ├── use-restaurant.ts              # Fetch & cache restaurant data
│   ├── use-subscription.ts            # Fetch subscription status + trial check
│   ├── use-products.ts                # CRUD hooks for products
│   ├── use-models.ts                  # CRUD hooks for 3D models
│   ├── use-assets.ts                  # Upload/list assets
│   ├── use-access-control.ts          # Check access level → returns redirect path if needed
│   ├── use-file-upload.ts             # Generic file upload with progress
│   └── etc ...                        # etc
│
├── lib/                                # Utility functions & API client
│   ├── api.ts                          # Typed API client (wraps fetch with auth token)
│   ├── utils.ts                        # Format price (PKR), date helpers, slug validation
│   ├── constants.ts                    # API routes, status enums, pricing config
│   └── validators.ts                   # Client-side form validation (zod schemas)
│   └── etc                             # etc
│
├── types/                              # TypeScript type definitions
│   ├── restaurant.ts                   # Restaurant, Onboarding types
│   ├── product.ts                      # Product, ProductCreate, ProductUpdate
│   ├── model.ts                        # Model3D, Model3DCreate
│   ├── subscription.ts                 # Subscription, CheckoutResponse
│   ├── asset.ts                        # Asset upload types
│   └── api.ts                          # API response wrappers, error types
│   └── etc                             # etc
│
├── providers/                          # React context providers
│   ├── restaurant-provider.tsx         # Restaurant context (caches GET /restaurants)
│   ├── subscription-provider.tsx       # Subscription context
│   └── theme-provider.tsx              # Dark/light mode toggle
│   └── etc                             # etc
│
├── middleware.ts                       # Clerk auth + subdomain detection + route protection
│
└── public/
    ├── logo.svg
    ├── og-image.png
    └── fonts/
    └── etc
```

---

## `lib/api.ts` Pattern (IMPORTANT)

Create a typed API client that wraps `fetch` and automatically injects the Clerk token:

```typescript
// lib/api.ts
import { auth } from '@clerk/nextjs/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const { getToken } = await auth();
  const token = await getToken();

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

// For file uploads (don't set Content-Type — let browser set multipart boundary)
export async function apiUpload<T>(endpoint: string, formData: FormData): Promise<T> {
  const { getToken } = await auth();
  const token = await getToken();

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail);
  }

  return res.json();
}
```

For client components, use `useAuth()` hook instead of `auth()`:
```typescript
const { getToken } = useAuth();
const token = await getToken();
```

---

## Critical Implementation Notes

1. **Clerk Middleware**: Use `clerkMiddleware()` to protect all routes under `(protected)/`. Redirect unauthenticated users to `/sign-in`
2. **After Clerk SignUp**: Always redirect to `/onboarding` (set `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`)
3. **API calls**: Use the `apiClient()` or `apiUpload()` helper from `lib/api.ts` — NEVER call the backend without attaching the Clerk JWT
4. **model-viewer SSR**: `<model-viewer>` is a web component — wrap it with `"use client"` and dynamic import with `ssr: false`
5. **Status-based redirect**: Use the `use-access-control` hook in a `StatusRedirect` component placed in every protected page. On every page load, it fetches restaurant status and redirects if needed
6. **File uploads**: Use `FormData` — do NOT set `Content-Type` header manually. Let the browser set the multipart boundary
7. **Pricing display**: All amounts are in paisa (integer). Display as "Rs. X" by showing the raw integer (e.g., `price_amount: 850` → "Rs. 850")
8. **Trial countdown**: Calculate remaining trial time from `trial_ends_at` and show days/hours in the navbar badge. Use `useSubscription()` hook
9. **Product ordering**: Implement drag-and-drop reordering using `@dnd-kit/core`. PATCH each product with new `order_index` values
10. **3D model dimensions**: Upload form must include height/width/depth fields (in cm). The AR viewer uses these for real-world scale. AR mode should NOT allow resizing — fixed scale only
11. **Onboarding is multi-step**: Break the form into 4 steps (info → documents → photos → review). Upload files at each step, store URLs in state, submit all at once
12. **Use Clerk `<UserButton>` component**: For the avatar/profile dropdown in the navbar. It handles sign out, profile management, etc.
13. **Dark mode**: Use `next-themes` package with Tailwind's `darkMode: 'class'` strategy. Default to dark mode
14. **Form validation**: Use `zod` schemas in `lib/validators.ts` and `react-hook-form` for form state management

---

## NPM Packages to Install

```bash
# Core
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# Auth
npm install @clerk/nextjs

# 3D/AR
npm install @google/model-viewer

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Drag & Drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# UI Utilities
npm install next-themes lucide-react class-variance-authority clsx tailwind-merge
npm install framer-motion  # for animations
npm install sonner  # for toast notifications

# Optional but recommended
npm install date-fns  # for date formatting / trial countdown
```

---

## Pricing Structure (Display on Landing Page)

| Plan | Price | Details |
|------|-------|---------|
| Free Trial | 7 days | Full access after admin approval |
| Setup Fee | Rs. 5,000 | One-time first payment |
| Monthly | Rs. 300/product | Per active product per month |

Example: 10 active products = Rs. 3,000/month
