# Foodar Frontend - Complete Setup Guide

## Overview

The Next.js frontend is now complete with all pages, components, and authentication flows. This guide walks you through getting it running locally with your ngrok API tunnel.

## Prerequisites

- Node.js 18+
- npm or pnpm
- Clerk account (free tier works)
- Backend running on ngrok tunnel
- .env variables from Clerk

## Step 1: Clone & Install

```bash
cd frontend-nextjs
npm install
# or
pnpm install
```

## Step 2: Setup Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create a free account
2. Create a new application
3. Choose "Email & Social logins"
4. Copy your keys from the Clerk Dashboard:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (public)
   - `CLERK_SECRET_KEY` (secret)

## Step 3: Configure Environment Variables

Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:

```env
# From Clerk Dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXXX...
CLERK_SECRET_KEY=sk_test_XXXXX...

# Your ngrok tunnel URL (update with your actual tunnel)
NEXT_PUBLIC_API_URL=https://chorionic-officiously-theron.ngrok-free.dev/api/v1

# These can stay as-is
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

## Step 4: Update ngrok URL

If your ngrok tunnel URL changes, update it in `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-new-tunnel.ngrok-free.dev/api/v1
```

## Step 5: Start Development Server

```bash
npm run dev
```

The app runs on `http://localhost:3000`

## Step 6: Test the Complete Flow

### 1. Landing Page (Public)
- Visit `http://localhost:3000`
- See features & pricing
- Click "Get Started" (redirects to sign-up)

### 2. Sign Up
- Click "Sign Up" or "Get Started"
- Create test account (e.g., `test@example.com`)
- Clerk redirects to `/onboarding`

### 3. Onboarding (3-Step Form)
- **Step 1**: Enter restaurant details
  - Name: "Test Restaurant"
  - Slug: "test-restaurant"
  - Phone: "+92-300-1234567"
  - Address: "Test Address"
  - Description: "Test description"
  
- **Step 2**: Upload documents
  - CNIC Front (any image)
  - CNIC Back (any image)
  - Food License (any image)
  
- **Step 3**: Upload photos
  - Add 1-3 restaurant photos
  
- Click "Submit"
- **Expected**: Redirects to `/onboarding/pending`

### 4. Approve in Backend (Admin)

You need to manually approve via backend. Call this endpoint:

```bash
curl -X POST \
  https://chorionic-officiously-theron.ngrok-free.dev/api/v1/admin/restaurants/{restaurant_id}/approve \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"
```

Or ask backend team to approve via their admin dashboard.

### 5. Dashboard Access (After Approval)
- After approval, login again
- Should redirect to `/dashboard`
- See:
  - Overview with trial countdown
  - Quick action buttons
  - Navigation sidebar

### 6. Upload 3D Model
- Go to `/dashboard/models`
- Upload a `.glb` file (test file: search "free glb model")
- Fill in name, description, dimensions
- Click "Upload Model"
- Model appears in list

### 7. Create Product
- Go to `/dashboard/products`
- Click "Add Product"
- Fill in:
  - Title: "Test Pizza"
  - Description: "Delicious"
  - Price: "850"
  - Ingredients: "Tomato, Cheese"
  - Check "Vegetarian" if desired
  - Click "Create Product"

### 8. View Public Menu
- Go to `/dashboard/settings`
- Copy public menu URL: `http://test-restaurant.timeinx.store`
- For local testing, add to `/etc/hosts`:
  ```
  127.0.0.1 test-restaurant.localhost
  ```
  Then visit `http://test-restaurant.localhost:3000`

### 9. Trial Expiration
- Edit restaurant in DB: set `trial_ends_at` to past date
- Visit `/dashboard`
- Should redirect to `/subscribe` page
- Click "Subscribe & Continue"
- Redirects to Lemon Squeezy checkout

## Architecture Overview

### Route Structure

```
Landing Page (/):
  → Sign Up (/sign-up) → Clerk Auth
    → Onboarding (/onboarding) → Multi-step form
      → Pending (/onboarding/pending) → Waiting
        → [Admin Approves]
          → Dashboard (/dashboard) → Overview + Sidebar
            → Models (/dashboard/models) → 3D management
            → Products (/dashboard/products) → Menu management
            → Subscription (/dashboard/subscription) → Billing
            → Settings (/dashboard/settings) → Domain info

Public Menu (/menu/[slug]):
  → Product cards
  → Product modal with 3D viewer
```

### Key Components

| File | Purpose |
|------|---------|
| `app/page.tsx` | Landing page |
| `app/(auth)/sign-in/page.tsx` | Clerk sign-in |
| `app/(auth)/sign-up/page.tsx` | Clerk sign-up |
| `app/(protected)/onboarding/page.tsx` | 3-step onboarding |
| `app/(protected)/dashboard/layout.tsx` | Dashboard shell + sidebar |
| `app/(protected)/dashboard/page.tsx` | Overview |
| `app/menu/[slug]/page.tsx` | Public menu page |
| `middleware.ts` | Wildcard subdomain routing |
| `hooks/useAuth.ts` | Auth state + restaurant data |
| `components/ModelViewer.tsx` | 3D/AR viewer |
| `lib/api.ts` | API client |
| `lib/types.ts` | TypeScript types |

## Wildcard Subdomain Setup

### For Local Development

Edit `/etc/hosts` (Mac/Linux: `/etc/hosts`, Windows: `C:\Windows\System32\drivers\etc\hosts`):

```
127.0.0.1 localhost
127.0.0.1 test-restaurant.localhost
127.0.0.1 another-restaurant.localhost
```

Then:
- `http://test-restaurant.localhost:3000/menu/test-restaurant` loads automatically
- No need to type full URL

### For Production

Configure DNS to wildcard:
```
*.foodar.pk → your-server-ip
```

Then the middleware automatically routes:
- `https://test-restaurant.foodar.pk` → `/menu/test-restaurant`

## Testing Flows

### Flow 1: Sign Up → Approval → Access

```
1. Click "Get Started"
2. Create account
3. Fill onboarding form
4. Submit → pending page
5. [Backend approval needed]
6. Auto-redirect to dashboard
```

### Flow 2: Trial → Subscribe

```
1. Dashboard shows trial countdown
2. When trial expires:
   - Redirect to /subscribe
3. Click "Subscribe Now"
4. Redirects to Lemon Squeezy checkout
5. After payment: subscription active
6. Can access dashboard again
```

### Flow 3: View Public Menu

```
1. Visit {slug}.timeinx.store
2. See all products with "Show in Menu" = true
3. Click product → modal opens
4. If AR model linked → 3D viewer loads
5. Click "View in AR" → AR mode on mobile
```

## Common Issues & Solutions

### "API connection failed"
**Problem**: Can't reach backend
**Solution**: 
- Check ngrok tunnel is running: `ngrok http 8000`
- Update `NEXT_PUBLIC_API_URL` in `.env.local`
- Test: `curl {NEXT_PUBLIC_API_URL}/health`

### "Restaurant not found" after onboarding
**Problem**: Status still pending
**Solution**:
- Need admin approval via backend
- Check restaurant status in DB
- Make approve API call from backend admin endpoint

### "Can't login" / "CORS error"
**Problem**: Auth or CORS issue
**Solution**:
- Check Clerk keys in `.env.local`
- Check backend CORS allows ngrok URL
- Look at browser console for specific error

### "Wildcard subdomain not working"
**Problem**: Accessing `slug.localhost:3000` doesn't load
**Solution**:
- Verify `/etc/hosts` entry exists
- Clear browser cache
- Restart dev server
- Check middleware.ts is enabled

### "3D models don't load"
**Problem**: Model viewer shows blank
**Solution**:
- Check model file URL is accessible
- Verify Supabase storage CORS
- Check browser allows WebXR (HTTPS needed for AR)
- Try different 3D format (.glb, .gltf, .usdz)

## Production Deployment

### Deploy to Vercel

1. Push to GitHub
2. Connect repo to [vercel.com](https://vercel.com)
3. Add environment variables:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
   CLERK_SECRET_KEY=...
   NEXT_PUBLIC_API_URL=https://api.foodar.pk/api/v1
   ```
4. Deploy
5. Configure DNS for wildcard domains

### Build & Run Locally

```bash
npm run build
npm run start
```

Then visit `http://localhost:3000`

## Useful Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Run production build
npm run start

# Lint code
npm run lint

# Clear node_modules & reinstall
rm -rf node_modules package-lock.json
npm install
```

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/restaurants` | Get user's restaurant |
| POST | `/onboarding` | Submit onboarding |
| POST | `/onboarding/upload` | Upload documents |
| GET | `/subscriptions` | Get subscription status |
| POST | `/subscriptions/checkout` | Create checkout |
| POST | `/models` | Upload 3D model |
| GET | `/models` | List 3D models |
| DELETE | `/models/{id}` | Delete model |
| POST | `/products` | Create product |
| GET | `/products` | List products |
| PATCH | `/products/{id}` | Update product |
| DELETE | `/products/{id}` | Delete product |
| GET | `/menu/{slug}` | Public menu (no auth) |

## Next Steps

1. ✅ Frontend is complete and running
2. 🔄 Connect to your backend (update API URLs)
3. 📝 Test all flows end-to-end
4. 🎨 Customize branding/colors in `globals.css`
5. 📱 Test on mobile for responsive design
6. 🚀 Deploy to Vercel for production

## Support

**For frontend issues**: Check console logs + network tab
**For backend issues**: Check FastAPI logs
**For Clerk issues**: Check Clerk Dashboard → Logs

Need help? Check:
- `README.md` for architecture
- `/FRONTEND_PROMPT.md` for requirements
- Backend API docs
