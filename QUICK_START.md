# Foodar Frontend - Quick Start (5 minutes)

## 1️⃣ Setup (2 minutes)

```bash
cd frontend-nextjs
npm install
cp .env.example .env.local
```

## 2️⃣ Configure (2 minutes)

Edit `.env.local`:

```env
# Get from https://clerk.com dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Your ngrok tunnel URL
NEXT_PUBLIC_API_URL=https://your-tunnel.ngrok-free.dev/api/v1
```

## 3️⃣ Run (1 minute)

```bash
npm run dev
```

Visit `http://localhost:3000` ✅

---

## Test Flows

### 1. Sign Up
1. Click "Get Started"
2. Create account with any email
3. Auto-redirects to onboarding

### 2. Onboarding
1. Fill Step 1: Restaurant details
2. Fill Step 2: Upload any 3 images
3. Fill Step 3: Upload 1-3 images
4. Submit → "Pending" page

### 3. Dashboard (After Backend Approval)
1. Backend admin approves restaurant
2. Refresh page → Auto-redirects to dashboard
3. See overview, quick actions

### 4. Upload Model
1. Go to `/dashboard/models`
2. Upload any `.glb` file
3. Fill name & dimensions
4. Click "Upload Model"

### 5. Create Product
1. Go to `/dashboard/products` → "Add Product"
2. Fill title, price, description
3. Check "Vegetarian" (optional)
4. Click "Create Product"

### 6. View Public Menu
1. Go to `/dashboard/settings`
2. Copy public URL: `{slug}.localhost:3000`
3. Add to `/etc/hosts`:
   ```
   127.0.0.1 {slug}.localhost
   ```
4. Visit in new tab ✅

---

## File Organization

```
Key Files to Know:

Landing:
  app/page.tsx

Auth:
  app/(auth)/sign-in/page.tsx
  app/(auth)/sign-up/page.tsx

Onboarding:
  app/(protected)/onboarding/page.tsx

Dashboard:
  app/(protected)/dashboard/layout.tsx      ← Sidebar
  app/(protected)/dashboard/page.tsx         ← Overview
  app/(protected)/dashboard/models/page.tsx
  app/(protected)/dashboard/products/page.tsx
  app/(protected)/dashboard/subscription/page.tsx
  app/(protected)/dashboard/settings/page.tsx

Public Menu:
  app/menu/[slug]/page.tsx

Config:
  .env.local                   ← Your secrets
  lib/api.ts                   ← API client
  lib/types.ts                 ← TypeScript types
  hooks/useAuth.ts             ← Auth hook
  middleware.ts                ← Subdomain routing
```

---

## Common Commands

```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# Lint
npm run lint

# Clear cache
npm run clean
rm -rf .next node_modules
npm install
```

---

## Environment Variables Explained

| Variable | Where to Get | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | clerk.com dashboard | `pk_test_abc123...` |
| `CLERK_SECRET_KEY` | clerk.com dashboard | `sk_test_xyz789...` |
| `NEXT_PUBLIC_API_URL` | Your ngrok tunnel | `https://abc123.ngrok-free.dev/api/v1` |

**Important**: 
- Variables starting with `NEXT_PUBLIC_` are sent to browser (use for public keys)
- Other variables stay server-side only (use for secrets)

---

## API Integration

All requests go to `NEXT_PUBLIC_API_URL/endpoint`:

```javascript
// Example from hooks/useAuth.ts
const { data: restaurant } = useSWR(
  userId ? "/restaurants" : null,
  async (url) => {
    const res = await apiClient.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  }
);

// Translates to:
// GET https://your-api-url/api/v1/restaurants
```

---

## Troubleshooting

### ❌ "API connection failed"
**Fix**: Update `NEXT_PUBLIC_API_URL` in `.env.local` to your ngrok tunnel

### ❌ "Can't sign up"
**Fix**: Check Clerk keys in `.env.local` are correct

### ❌ "404 after onboarding"
**Fix**: Backend needs to approve restaurant in admin panel

### ❌ "Wildcard subdomain not working"
**Fix**: Add entry to `/etc/hosts`:
```
127.0.0.1 restaurant-name.localhost
```

### ❌ "3D models don't load"
**Fix**: Check model URL is accessible in browser DevTools → Network

---

## Key Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Dev Tools | F12 |
| Clear Cache | Ctrl+Shift+Delete |
| Hard Refresh | Ctrl+Shift+R |
| Network Tab | Ctrl+Shift+E |
| Console Tab | Ctrl+Shift+K |

---

## Terminal Tips

### Run Dev Server in Background
```bash
npm run dev &
```

### View All Running Ports
```bash
# macOS/Linux
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

### Kill Process on Port 3000
```bash
# macOS/Linux
kill -9 $(lsof -t -i :3000)

# Windows
taskkill /PID {process_id} /F
```

---

## Next: Backend Integration

Once frontend is running, connect to your FastAPI backend:

1. **Get ngrok URL**: `ngrok http 8000` (if running locally)
2. **Update env**: Set `NEXT_PUBLIC_API_URL` to ngrok URL
3. **Test connection**: Visit dashboard, check Network tab for API calls
4. **Verify CORS**: Backend should allow requests from frontend origin
5. **Check tokens**: Clerk tokens should be sent in Authorization header

---

## One-Liner Quick Check

```bash
# Check everything is installed
node --version && npm --version && next --version
```

Should show Node, npm, and Next version numbers.

---

## Need Help?

1. Check browser console (F12) for errors
2. Check Network tab for API failures
3. Check `.env.local` for typos
4. Check ngrok tunnel is running: `ngrok http 8000`
5. Restart dev server: `npm run dev`

---

## Success! ✅

If you see the landing page at `http://localhost:3000`, the frontend is working!

Next: Connect to backend and test auth flows.
