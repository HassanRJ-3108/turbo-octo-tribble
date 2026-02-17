# Foodar Frontend - Project Complete ✅

## Overview

A complete Next.js 16 frontend for Foodar, an AR restaurant menu platform. Users can create accounts, onboard their restaurants, upload 3D models, manage products, subscribe to billing, and customers can view augmented reality menus.

**Status**: Fully functional and ready to connect to backend

## What Was Built

### 1. Public Pages ✅
- **Landing Page** (`/`) - Features, pricing, CTAs
- **Sign In** (`/sign-in`) - Clerk authentication
- **Sign Up** (`/sign-up`) - Registration with Clerk
- **404 Page** - 404 error page

### 2. Onboarding Flow ✅
- **Step 1 Form** - Restaurant details (name, slug, contact, address)
- **Step 2 Form** - Document uploads (CNIC, food license)
- **Step 3 Form** - Restaurant photos
- **Pending Status** - Waiting for admin approval
- **Rejected Status** - Rejection handling + resubmit option

### 3. Dashboard System ✅
- **Overview** - Stats cards, trial countdown, quick actions
- **3D Models** - Upload, manage, delete 3D models
- **Products** - Full CRUD for menu items with pricing, nutrition, dietary info
- **Subscription** - Billing, trial info, checkout integration
- **Settings** - Restaurant info, domain display, custom domain (coming soon)
- **Sidebar Navigation** - With user profile + trial countdown

### 4. Public Menu System ✅
- **Menu Page** (`/menu/[slug]`) - Product grid with AR previews
- **Product Modal** - Detailed view with 3D viewer, nutrition, ingredients
- **Wildcard Subdomains** - `slug.timeinx.store` routes to public menu
- **3D/AR Viewer** - Google Model Viewer integration

### 5. Access Control ✅
- Protected routes via Clerk middleware
- Status-based redirects (pending, rejected, approved, suspended)
- Trial expiration checks
- Subscription validation
- Role-based features (coming soon)

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **React 19.2** | UI components |
| **TypeScript** | Type safety |
| **Clerk** | Authentication & user management |
| **Tailwind CSS 4** | Styling |
| **SWR** | Data fetching & caching |
| **Axios** | HTTP client |
| **Lucide React** | Icons |
| **Google Model Viewer** | 3D/AR rendering |

## File Structure

```
frontend-nextjs/
├── app/
│   ├── (auth)/                    # Public auth routes
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   │
│   ├── (protected)/               # Clerk-protected routes
│   │   ├── onboarding/
│   │   │   ├── page.tsx           # 3-step form
│   │   │   ├── pending/page.tsx   # Waiting for approval
│   │   │   └── rejected/page.tsx  # Rejection handling
│   │   │
│   │   ├── dashboard/
│   │   │   ├── layout.tsx         # Dashboard shell + sidebar
│   │   │   ├── page.tsx           # Overview
│   │   │   ├── models/page.tsx    # 3D model management
│   │   │   ├── products/
│   │   │   │   ├── page.tsx       # Product list
│   │   │   │   └── new/page.tsx   # Create product
│   │   │   ├── subscription/page.tsx   # Billing
│   │   │   └── settings/page.tsx      # Restaurant settings
│   │   │
│   │   ├── subscribe/page.tsx     # Trial expired
│   │   └── suspended/page.tsx     # Account suspended
│   │
│   ├── menu/
│   │   └── [slug]/page.tsx        # Public menu (wildcard)
│   │
│   ├── layout.tsx                 # Root layout (ClerkProvider)
│   ├── page.tsx                   # Landing page
│   ├── not-found.tsx              # 404 page
│   └── globals.css                # Tailwind styles
│
├── components/
│   └── ModelViewer.tsx            # 3D/AR viewer component
│
├── hooks/
│   └── useAuth.ts                 # Custom auth hook
│
├── lib/
│   ├── api.ts                     # API client setup
│   └── types.ts                   # TypeScript interfaces
│
├── middleware.ts                  # Wildcard subdomain routing
├── .env.example                   # Environment template
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── next.config.mjs                # Next.js config
├── tailwind.config.ts             # Tailwind config
└── README.md                      # Setup instructions
```

## Key Features

### Authentication
- Clerk integration for sign-in/sign-up
- Automatic JWT tokens in API calls
- Protected routes with `clerkMiddleware`
- User profile dropdown with sign-out

### Onboarding
- 3-step multi-page form
- File uploads for documents + photos
- Slug generation for unique URLs
- Pending/rejected/approved status handling

### Dashboard
- Responsive sidebar navigation
- Mobile-friendly menu toggle
- Real-time stats (active products, monthly bill, trial days)
- Quick action buttons

### 3D Model Management
- Upload `.glb`, `.gltf`, `.usdz` files
- Dimension input (height, width, depth)
- Model preview with delete option
- Models linked to products

### Product Management
- Complete CRUD operations
- Pricing in PKR currency
- Nutrition information
- Dietary tags (vegetarian, halal, gluten-free)
- Ingredient lists
- Visibility toggles (active, show in menu)

### Subscription System
- Trial countdown display
- Usage-based billing (₨300/product/month)
- Setup fee (₨5,000 one-time)
- Lemon Squeezy checkout integration
- Subscription status tracking

### Public Menu
- Wildcard subdomain routing
- Product grid with images
- Dietary/nutrition tags
- Product detail modal
- AR/3D viewer integration
- Mobile-responsive design

## API Integration Points

All API calls go to backend via `NEXT_PUBLIC_API_URL`:

```
GET /restaurants              # Get user's restaurant
POST /onboarding              # Submit onboarding
POST /onboarding/upload       # Upload documents
GET /subscriptions            # Get billing status
POST /subscriptions/checkout  # Create Lemon Squeezy checkout
GET /models                   # List 3D models
POST /models                  # Upload 3D model
DELETE /models/{id}           # Delete model
GET /products                 # List products
POST /products                # Create product
PATCH /products/{id}          # Update product
DELETE /products/{id}         # Delete product
GET /menu/{slug}              # Get public menu (no auth)
```

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=https://api-url/api/v1
```

See `.env.example` for full list.

## Styling

- **Color Scheme**: Dark theme (slate-950, slate-900, slate-800)
- **Primary Color**: Amber-400 (buttons, highlights)
- **Accent**: Orange-500 (gradients, secondary elements)
- **Font**: System fonts (no custom fonts loaded)
- **Responsive**: Mobile-first design with tailwind breakpoints

## Access Control Rules

| Route | Auth | Requirement |
|-------|------|-------------|
| `/` | ❌ | Public |
| `/sign-in`, `/sign-up` | ❌ | Public |
| `/menu/[slug]` | ❌ | Public |
| `/onboarding` | ✅ | New user (no restaurant) |
| `/onboarding/pending` | ✅ | Status = pending |
| `/onboarding/rejected` | ✅ | Status = rejected |
| `/dashboard/*` | ✅ | Status = approved + active |
| `/subscribe` | ✅ | Trial expired, no subscription |
| `/suspended` | ✅ | Status = suspended |

## User Flow Diagram

```
Landing Page
    ↓
Sign Up (Clerk)
    ↓
Onboarding Form (3 steps)
    ↓
Submit → Pending Status
    ↓
[Admin Approves in Backend]
    ↓
Auto-redirect to Dashboard
    ↓
Upload Models → Create Products → Subscribe
    ↓
Public Menu Live: slug.timeinx.store
```

## Wildcard Subdomain Support

### Development (localhost)
Add to `/etc/hosts`:
```
127.0.0.1 restaurant-name.localhost
```

Then: `http://restaurant-name.localhost:3000` → `/menu/restaurant-name`

### Production
Configure DNS wildcard:
```
*.timeinx.store → your-server-ip
```

Then: `https://restaurant-name.timeinx.store` → `/menu/restaurant-name`

Middleware automatically routes all subdomain requests to the public menu.

## Testing Checklist

- [ ] Landing page loads with features & pricing
- [ ] Sign up creates account via Clerk
- [ ] Onboarding form submits all 3 steps
- [ ] Documents upload successfully
- [ ] Pending page shows after onboarding
- [ ] Admin approval redirects to dashboard
- [ ] Dashboard shows trial countdown
- [ ] Can upload 3D models
- [ ] Can create products with nutrition
- [ ] Products appear in public menu
- [ ] Public menu loads via wildcard subdomain
- [ ] Product modal displays 3D viewer
- [ ] Subscription page shows pricing
- [ ] Trial expiration redirects to subscribe
- [ ] Mobile responsive design works
- [ ] Sidebar collapses on mobile

## Performance Optimizations

- ✅ Image optimization with Next.js `<Image/>`
- ✅ Component code splitting
- ✅ SWR data fetching with caching
- ✅ Lazy loading for 3D viewer
- ✅ No hydration mismatches with `suppressHydrationWarning`
- ✅ Tailwind CSS purging

## Known Limitations

1. **Custom Domains** - Feature marked as "coming soon"
2. **Image Uploads** - Uses backend `/onboarding/upload` endpoint
3. **3D Model Formats** - Supports `.glb`, `.gltf`, `.usdz` only
4. **AR Support** - Requires HTTPS + modern browser + WebXR support
5. **Analytics** - Not yet integrated

## Production Deployment

### Vercel (Recommended)

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy
4. Configure DNS for wildcard domains

### Self-Hosted

```bash
npm run build
npm run start
```

Then use nginx/Apache to:
- Serve static files
- Proxy API requests to backend
- Handle wildcard subdomains

## Next Steps for Integration

1. **Update API URL** - Point `NEXT_PUBLIC_API_URL` to your backend
2. **Test Auth Flow** - Verify Clerk tokens reach your API
3. **Admin Approval** - Setup backend admin endpoint to approve restaurants
4. **Customize Branding** - Update colors in `globals.css` and `tailwind.config.ts`
5. **Add Logo** - Replace Zap icon with your logo
6. **Configure DNS** - Set up wildcard domain routing
7. **Test E2E** - Run complete user flow from signup to public menu
8. **Deploy** - Push to production

## Debugging

### Check Clerk Auth
```javascript
// In any client component
const { userId, isLoaded } = useAuth();
console.log("[v0] User:", userId, "Loaded:", isLoaded);
```

### Check API Requests
```javascript
// In browser DevTools → Network tab
// Look for requests to NEXT_PUBLIC_API_URL
```

### Check Wildcard Routing
```javascript
// In browser console
console.log("[v0] Hostname:", window.location.hostname);
console.log("[v0] Path:", window.location.pathname);
```

## Support

- **Frontend Docs**: See `README.md` in `frontend-nextjs/`
- **Setup Guide**: See `FRONTEND_SETUP.md`
- **Type Definitions**: See `lib/types.ts`
- **API Integration**: See `lib/api.ts` and `hooks/useAuth.ts`

## Summary

✅ **Complete Next.js frontend with:**
- Full authentication via Clerk
- Multi-step onboarding
- Dashboard with sidebar navigation
- 3D model + product management
- Subscription/billing integration
- Public AR menu with wildcard subdomains
- Responsive mobile design
- TypeScript type safety
- Tailwind CSS styling

Ready to integrate with your FastAPI backend! 🚀
