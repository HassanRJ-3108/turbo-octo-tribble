---
id: 002
title: Create Foodar Backend API Specification
stage: spec
date: 2026-02-10
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-foodar-backend-api
branch: 001-foodar-backend-api
user: Hassan
command: /sp.specify
labels: ["specification", "backend", "api", "restaurant", "ar-menu", "fastapi", "supabase", "clerk", "lemon-squeezy"]
links:
  spec: specs/001-foodar-backend-api/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-foodar-backend-api/spec.md
  - specs/001-foodar-backend-api/checklists/requirements.md
tests:
  - Validated spec against quality checklist (PASS)
---

## Prompt

# Foodar Backend Full Specification - FastAPI + Supabase + Clerk + Lemon Squeezy

## Project Overview
Ye real world startup hai restaurant AR menu ke liye. Backend FastAPI me banao. Auth Clerk se, DB Supabase (PostgreSQL), Payments Lemon Squeezy, Storage: 3D models Supabase Storage, Images/Videos Cloudinary.

Flow:
1. Restaurant owner website pe aata hai → Clerk signup/signin.
2. Clerk webhook se user Supabase me sync.
3. Redirect to /onboarding → Details + documents submit.
4. Admin (tu manually FastAPI /docs se ya separate endpoint) approve karega.
5. Approve hone pe 7 days trial start + status active.
6. Trial me wo 3D models + products add kar sakta hai (limited?).
7. Trial end pe subscribe karna must (Lemon checkout).
8. First payment after trial: fixed 5k PKR.
9. Next months: usage-based – active products count * 300 PKR per product.
10. Agar payment fail ya cancel → access block, warning emails, grace 3 days.
11. Public menu: {slug}.foodar.pk pe anyone dekh sake (no auth).

Security:
- Clerk JWT verify on all protected routes.
- Supabase RLS + FastAPI middleware for subscription check.
- Webhooks verify with signing secrets.

## Database Schema (Supabase - Pura SQL Run Karna Pehle)

-- Enums
CREATE TYPE restaurant_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'cancelled', 'paused', 'unpaid');
CREATE TYPE asset_type AS ENUM ('image', 'video', 'document', '3d_model');

-- 1. Users (Clerk sync via webhook)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'restaurant_owner' CHECK (role IN ('restaurant_owner', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Restaurants
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    custom_domain TEXT UNIQUE,
    status restaurant_status DEFAULT 'pending',
    trial_starts_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Onboarding Applications
CREATE TABLE restaurant_onboardings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE,
    phone TEXT,
    address TEXT,
    description TEXT,
    documents JSONB,  -- Cloudinary URLs
    photos TEXT[],   -- Cloudinary URLs
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE,
    lemon_subscription_id TEXT UNIQUE,
    status subscription_status DEFAULT 'trialing',
    active_products_count INTEGER DEFAULT 0,  -- Billing ke time update
    last_billed_at TIMESTAMPTZ,
    next_bill_amount INTEGER,  -- Calculated (300 * products)
    grace_end_at TIMESTAMPTZ,
    warning_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Webhook Events (Generic for Lemon + Clerk)
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('lemon_squeezy', 'clerk')),
    event_name TEXT NOT NULL,
    lemon_event_id TEXT,  -- Only for Lemon
    raw_payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 3D Models (Supabase Storage)
CREATE TABLE models_3d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,  -- Supabase storage path
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,  -- Cloudinary
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    price_amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'PKR',
    nutrition JSONB,
    ingredients TEXT[],
    dietary JSONB,
    ar_model_id UUID REFERENCES models_3d(id),
    media JSONB,  -- Cloudinary URLs
    ui_behavior JSONB,
    active BOOLEAN DEFAULT TRUE,
    show_in_menu BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Assets (Cloudinary reusable)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    public_id TEXT,
    type asset_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes + RLS baad me add (Claude se karwao)

## Requirements for Backend
- FastAPI app with API routes for: onboarding submit, admin approve/reject, upload 3D (Supabase storage SDK), upload images (Cloudinary SDK), add/edit products, dashboard data.
- Middleware: Check Clerk JWT + subscription active.
- Webhooks endpoints: /api/webhooks/clerk (verify Svix/Clerk secret), /api/webhooks/lemon (verify signing secret).
- Lemon logic: On subscription_payment_success → update status, calculate next bill based on active products count.
- Trial: On approval set trial_ends_at = now + 7 days.
- Error handling: Agar no subscription/trial expired → 402 or custom error.

Ab pura backend code generate kar: main.py, routers, models (Pydantic + SQLAlchemy ya Supabase client), dependencies, webhook handlers with verification.

Use best practices: async, env vars, logging, error handling.

Supabase MCP tool use kar ke tables verify kar sakta hai. I've created a product on lemon squeezy and it has on variant id: 1295088 store name: foodar mene jo variant banaya he wo aise hi banaya he start me 7 days ka free trial hoga then 5000 rupees lagenge subscription start hone me pehle month chalega then agle month se jitne 3D models active honge utne charges hone or mene q product ke 300 rupee rakhe hue hen lemon squeezy me ok now make full comprehensive backend Fast API me and secured these are all specifications you next prompt will be sp.plan then after next sp.tasks then sp.implement for now work on only sp.specify ok and use MCP tools use context7 for latest docs lemon squeezy and supabase MCP i've provided to you.

## Response snapshot

Created comprehensive specification for Foodar Backend API with the following components:

**Feature Setup**:
- Branch: `001-foodar-backend-api`
- Spec file: `specs/001-foodar-backend-api/spec.md`
- Feature directory structure created

**Specification Structure** (358 lines):

1. **User Scenarios & Testing** (5 prioritized user stories):
   - P1: Restaurant Owner Onboarding and Approval (foundational revenue flow)
   - P2: Trial Period and Subscription Management (conversion to paying customers)
   - P2: 3D Model and Product Management (core value delivery)
   - P3: Public AR Menu Access (end-user consumption)
   - P3: Admin Dashboard and Restaurant Management (platform governance)

2. **Functional Requirements** (54 requirements across 9 categories):
   - Authentication & Authorization (FR-001 to FR-005)
   - Onboarding & Restaurant Management (FR-006 to FR-010)
   - Subscription & Billing Management (FR-011 to FR-018)
   - 3D Model Management (FR-019 to FR-023)
   - Product Management (FR-024 to FR-029)
   - Asset Management (FR-030 to FR-032)
   - Public Menu Access (FR-033 to FR-038)
   - Admin Dashboard (FR-039 to FR-043)
   - Data Management & Cleanup (FR-044 to FR-046)
   - Security & Compliance (FR-047 to FR-054)

3. **Key Entities** (8 data entities with relationships):
   - User, Restaurant, Restaurant Onboarding, Subscription, Webhook Event, 3D Model, Product, Asset

4. **Success Criteria** (20 measurable outcomes across 4 categories):
   - User Experience (5 criteria)
   - System Performance (4 criteria)
   - Business Operations (4 criteria)
   - Security & Reliability (4 criteria)
   - Data Integrity (3 criteria)

5. **Supporting Sections**:
   - 8 edge cases with resolution strategies
   - 11 assumptions documented
   - 13 out-of-scope features clearly defined
   - 18 dependencies across 3 categories (External Services, Technical, Infrastructure)
   - 7 implementation notes

**Key Architectural Decisions Documented**:
- Multi-tenant isolation via Supabase RLS policies
- Webhook signature verification for security (Clerk via Svix, Lemon Squeezy via HMAC-SHA256)
- Usage-based billing calculation: active_products_count * 300 PKR monthly
- Trial period: exactly 7 days (168 hours) from approval
- Wildcard domain pattern: {slug}.foodar.pk
- Storage strategy: 3D models in Supabase Storage, images/videos in Cloudinary
- Payment flow: 7-day trial → 5000 PKR first payment → usage-based monthly

**External Documentation Consulted**:
- Lemon Squeezy webhook verification and subscription events (via Context7 MCP)
- Supabase Python client, Storage, and RLS documentation (via Supabase MCP)
- Clerk authentication SDK for Python (via Context7 MCP)

**Quality Validation**:
- Created `specs/001-foodar-backend-api/checklists/requirements.md`
- All checklist items PASSED:
  - No implementation details in spec (technology-agnostic)
  - All requirements testable and unambiguous
  - Success criteria measurable and user-focused
  - Zero [NEEDS CLARIFICATION] markers (all defaults documented in Assumptions)
  - Edge cases identified with resolution strategies
  - Scope clearly bounded with Out of Scope section
  - Dependencies and assumptions documented

**Ready for Next Phase**: Specification is complete and validated. Ready for `/sp.plan` to create technical architecture and implementation strategy.

## Outcome

- ✅ Impact: Complete specification created for real-world startup backend with 5 user stories, 54 functional requirements, 20 success criteria, and full validation checklist
- 🧪 Tests: Quality validation checklist created and passed all criteria (content quality, requirement completeness, feature readiness)
- 📁 Files: Created spec.md (358 lines) and requirements.md checklist in specs/001-foodar-backend-api/
- 🔁 Next prompts: `/sp.plan` to create technical architecture, `/sp.tasks` to break down implementation, `/sp.implement` to execute
- 🧠 Reflection: Specification successfully avoids implementation details while providing comprehensive requirements. Used MCP tools to access latest Lemon Squeezy and Supabase documentation for accurate requirement definition. All requirements are testable and measurable, with clear success criteria.

## Evaluation notes (flywheel)

- Failure modes observed: None - specification completed successfully on first attempt
- Graders run and results (PASS/FAIL): Quality checklist validation PASSED (all 12 items)
- Prompt variant (if applicable): Standard /sp.specify workflow
- Next experiment (smallest change to try): Consider pre-validating Lemon Squeezy variant 1295088 configuration during planning phase to catch any billing setup issues early
