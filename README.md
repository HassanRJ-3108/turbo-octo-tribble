# Foodar - Complete Project

This repository contains both the backend (FastAPI) and frontend (Next.js) for Foodar, an augmented reality restaurant menu platform.

## 📁 Project Structure

```
.
├── backend-fastapi/           # FastAPI backend (Python)
│   ├── app/
│   ├── requirements.txt
│   ├── main.py
│   └── ... (full backend implementation)
│
├── frontend-nextjs/           # Next.js frontend (TypeScript)
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── middleware.ts
│   ├── package.json
│   └── ... (full frontend implementation)
│
├── QUICK_START.md            # 5-minute quick start
├── FRONTEND_SETUP.md         # Detailed frontend setup
├── FRONTEND_SUMMARY.md       # Frontend architecture
└── README.md                 # This file
```

## 🚀 Quick Start

### Option 1: Start Frontend Only (Recommended)

```bash
cd frontend-nextjs
npm install
cp .env.example .env.local
# Edit .env.local with your Clerk keys
npm run dev
```

Visit `http://localhost:3000`

### Option 2: Start Both Backend & Frontend

```bash
# Terminal 1: Backend
cd backend-fastapi
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python main.py

# Terminal 2: Frontend (in new terminal)
cd frontend-nextjs
npm install
cp .env.example .env.local
npm run dev

# Terminal 3: Expose backend via ngrok
ngrok http 8000
# Copy ngrok URL → Update NEXT_PUBLIC_API_URL in frontend .env.local
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **QUICK_START.md** | 5-minute setup guide |
| **FRONTEND_SETUP.md** | Detailed frontend configuration |
| **FRONTEND_SUMMARY.md** | Architecture & features overview |
| **frontend-nextjs/README.md** | Frontend development guide |

## 🏗️ Architecture Overview

### Frontend (Next.js)

- **Auth**: Clerk for user management
- **API**: SWR for data fetching + Axios for requests
- **Styling**: Tailwind CSS 4 with dark theme
- **3D/AR**: Google Model Viewer
- **Routing**: App Router with wildcard subdomains

**Key Routes:**
- `/` - Landing page
- `/sign-in`, `/sign-up` - Authentication
- `/onboarding` - 3-step restaurant setup
- `/dashboard/*` - Restaurant management
- `/menu/[slug]` - Public AR menu (wildcard subdomains)

### Backend (FastAPI)

- **Framework**: FastAPI with async/await
- **Database**: PostgreSQL with SQLAlchemy
- **Auth**: Clerk JWT validation
- **Storage**: Supabase for documents & images
- **Payments**: Lemon Squeezy integration
- **Admin**: Approval workflow for restaurants

**Key Endpoints:**
- `/api/v1/auth/*` - User management
- `/api/v1/restaurants` - Restaurant CRUD
- `/api/v1/onboarding` - Approval workflow
- `/api/v1/products` - Menu management
- `/api/v1/subscriptions` - Billing
- `/api/v1/menu/[slug]` - Public API

## 🔐 Authentication Flow

```
1. User visits landing page
   ↓
2. Click "Get Started" → Clerk sign-up
   ↓
3. Create account → Auto-redirect to onboarding
   ↓
4. Fill 3-step form → Submit documents
   ↓
5. Waiting page → Backend admin approves
   ↓
6. Auto-redirect to dashboard
   ↓
7. Upload models → Create products → Subscribe
   ↓
8. Public menu goes live at {slug}.timeinx.store
```

## 💰 Pricing Model

- **Trial**: 7 days free
- **Subscription**: ₨300 per product per month
- **Setup Fee**: ₨5,000 one-time
- **Payment**: Lemon Squeezy checkout

## 🌐 Wildcard Subdomain Support

### Development
Add to `/etc/hosts`:
```
127.0.0.1 restaurant-name.localhost
```

### Production
Configure DNS:
```
*.timeinx.store → your-server-ip
```

Public menus auto-route via middleware:
- `https://naseer-kitchen.timeinx.store` → `/menu/naseer-kitchen`

## 📦 Tech Stack

### Frontend
- Next.js 16 (App Router)
- React 19.2
- TypeScript 5
- Tailwind CSS 4
- Clerk Auth
- SWR + Axios
- Google Model Viewer
- Lucide React Icons

### Backend
- FastAPI
- PostgreSQL + SQLAlchemy
- Supabase Storage
- Clerk Integration
- Lemon Squeezy
- Pydantic validation

## 🎨 Design System

- **Primary Color**: Amber-400 (#fbbf24)
- **Accent Color**: Orange-500 (#f97316)
- **Background**: Slate-950 (#030712)
- **Text**: Slate-100 (#f1f5f9)
- **Font**: System fonts (no external loads)

## 📋 Checklist

### Frontend Setup
- [x] Landing page with features & pricing
- [x] Clerk authentication (sign-in/sign-up)
- [x] 3-step onboarding form
- [x] Document uploads
- [x] Dashboard with sidebar
- [x] 3D model management
- [x] Product management (full CRUD)
- [x] Subscription & billing page
- [x] Settings & domain info
- [x] Public menu with wildcard routing
- [x] Product detail modal with 3D viewer
- [x] Mobile responsive design
- [x] TypeScript types
- [x] Environment configuration
- [x] API client setup
- [x] Documentation

### Backend Setup
- [x] FastAPI server structure
- [x] Clerk JWT auth middleware
- [x] Restaurant CRUD endpoints
- [x] Onboarding workflow
- [x] Product management endpoints
- [x] 3D model upload handling
- [x] Public menu API
- [x] Subscription integration
- [x] Database schema
- [x] Error handling
- [x] Documentation

## 🔗 Integration Points

### Frontend → Backend

| Frontend Route | Backend Endpoint | Purpose |
|---|---|---|
| Onboarding form | `POST /restaurants` | Create restaurant |
| Document upload | `POST /onboarding/upload` | Store documents |
| Dashboard | `GET /restaurants` | Get restaurant data |
| Models page | `GET/POST /models` | Manage 3D models |
| Products page | `GET/POST/PATCH /products` | Manage menu items |
| Subscription | `POST /subscriptions/checkout` | Create payment |
| Public menu | `GET /menu/{slug}` | Fetch public menu |

### External Services

| Service | Purpose | Integration |
|---|---|---|
| Clerk | Authentication | JWT tokens |
| Supabase | File storage | REST API |
| Lemon Squeezy | Payments | Redirect checkout |
| Google Model Viewer | 3D/AR | Web component |

## 🚀 Deployment

### Frontend (Vercel)
```bash
git push origin main
# Vercel auto-deploys on push
```

### Backend (Railway/Render/etc)
```bash
# Push to your deployment platform
git push {remote} main
```

### Configuration
- Set environment variables in production dashboards
- Configure wildcard DNS for subdomains
- Setup CI/CD pipelines
- Monitor error logs & metrics

## 📞 Support & Debugging

### Check Frontend Status
```bash
# Terminal 1: Running dev server
npm run dev
# Should see "ready - started server on ..."
```

### Check Backend Status
```bash
# Terminal 1: Running FastAPI
python main.py
# Should see "Application startup complete"
```

### Test API Connection
```bash
# In browser console at http://localhost:3000/dashboard
fetch("http://localhost:8000/api/v1/restaurants", {
  headers: { Authorization: "Bearer {your_clerk_token}" }
}).then(r => r.json()).then(console.log)
```

### View Logs
- **Frontend**: Browser DevTools → Console
- **Backend**: Terminal where you ran `python main.py`
- **Network**: Browser DevTools → Network tab

## 🐛 Troubleshooting

### Frontend Won't Start
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### API Requests Failing
1. Check `NEXT_PUBLIC_API_URL` in `.env.local`
2. Verify backend is running
3. Check CORS headers in backend
4. Look at Network tab for actual URL being called

### Wildcard Subdomains Not Working
1. Verify `/etc/hosts` entry exists
2. Clear browser cache
3. Check middleware.ts is configured
4. Test with `localhost` first, then subdomain

### Clerk Authentication Issues
1. Verify keys in `.env.local` match Clerk dashboard
2. Check sign-in/sign-up URLs in Clerk settings
3. Clear cookies: DevTools → Application → Storage → Clear All
4. Check Clerk logs in Clerk dashboard

## 📈 Next Steps

1. **Test Complete Flow**
   - Sign up → Onboarding → Dashboard → Public menu

2. **Customize Branding**
   - Update logo/colors in globals.css
   - Change restaurant name & description

3. **Production Deployment**
   - Deploy frontend to Vercel
   - Deploy backend to Railway/Render
   - Configure DNS for production domain

4. **Monitor & Optimize**
   - Setup error tracking (Sentry)
   - Monitor API performance
   - Optimize images & bundle size

5. **Add Features**
   - Custom domains
   - Analytics dashboard
   - Email notifications
   - Mobile app (React Native)

## 📄 License

To be determined

## 🙋 Questions?

See the detailed documentation:
- **Quick Start**: `QUICK_START.md`
- **Frontend Setup**: `FRONTEND_SETUP.md`
- **Architecture**: `FRONTEND_SUMMARY.md`

---

**Status**: ✅ Complete and ready for backend integration

**Last Updated**: 2026-02-15

**Maintained By**: v0 AI Assistant
