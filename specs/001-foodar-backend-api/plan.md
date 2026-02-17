# Implementation Plan: Foodar Backend API

**Branch**: `001-foodar-backend-api` | **Date**: 2026-02-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-foodar-backend-api/spec.md`

## Summary

Build a production-ready FastAPI backend for the Foodar restaurant AR menu platform. The system manages restaurant onboarding with admin approval, implements trial-to-subscription conversion via Lemon Squeezy (7-day trial → 5000 PKR → usage-based 300 PKR/product), handles 3D model storage in Supabase, serves public AR menus at `{slug}.foodar.pk`, and enforces multi-tenant isolation via RLS policies. Core integrations: Clerk (auth), Supabase (database + storage), Lemon Squeezy (payments), Cloudinary (media), Resend (email).

## Technical Context

**Language/Version**: Python 3.12+
**Primary Dependencies**: FastAPI 0.115+, SQLAlchemy 2.0+ (async), Pydantic 2.0+, Supabase Python client
**Storage**: Supabase PostgreSQL with RLS policies + Supabase Storage for 3D models + Cloudinary for images/videos
**Testing**: pytest with async support, httpx for API testing
**Target Platform**: Linux server (Railway/Render/Fly.io), ASGI server (Uvicorn)
**Project Type**: Web (backend only - frontend is separate Next.js project)
**Dependency Management**: uv (NOT pip, NOT poetry) per constitution
**Performance Goals**: <200ms p95 API latency, 1000+ concurrent public menu requests, webhook processing <2s
**Constraints**: Multi-tenant with strict data isolation, webhook idempotency required, zero duplicate charges
**Scale/Scope**: 100 restaurants, 10,000 products, 54 API endpoints across 9 categories

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Tech Stack Compliance

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Python 3.12+ | ✅ PASS | Using Python 3.12 |
| `uv` for dependency management | ✅ PASS | Will use `uv` (NOT pip/poetry) |
| FastAPI for API endpoints | ✅ PASS | All endpoints in FastAPI |
| SQLAlchemy ORM | ✅ PASS | Using SQLAlchemy 2.0 async with Supabase |
| Pydantic for validation | ✅ PASS | All request/response models use Pydantic 2.0+ |
| Supabase PostgreSQL | ✅ PASS | Primary database |
| Supabase Storage for 3D models | ✅ PASS | .glb/.gltf/.usdz files with signed URLs |
| Cloudinary for images | ✅ PASS | Product photos and thumbnails |
| RLS enabled on all tables | ✅ PASS | Will implement RLS policies for multi-tenant isolation |

### ✅ Schema Authority

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Central schema file as source of truth | ⚠️ PENDING | Will create `.specify/schemas/supabase_tables.md` in Phase 1 |
| Schema change protocol | ✅ PASS | Will follow: schema file → commit → migration → apply → code |
| Webhook schema files | ⚠️ PENDING | Will create `.specify/schemas/lemon_squeezy_webhook.md` and `.specify/schemas/clerk_webhook.md` in Phase 1 |

### ✅ Webhook & Payment Integration

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Lemon Squeezy integration | ✅ PASS | Variant 1295088, webhook validation with Pydantic |
| Clerk webhook integration | ✅ PASS | Svix signature verification, user sync |
| Webhook validation flow | ✅ PASS | Verify signature → Parse → Validate Pydantic → Process → 200 OK |
| Pydantic validation against schema | ✅ PASS | Models from schema files |

### ✅ MCP & Research-First Development

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Research before implementation | ✅ PASS | Phase 0 will research all integrations |
| MCP tools for verification | ✅ PASS | Context7 for docs, Supabase MCP for DB operations |
| No assumptions without verification | ✅ PASS | All patterns verified via research |

### ✅ Security Standards

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Type hints on all functions | ✅ PASS | Python type hints throughout |
| Pydantic models for API inputs | ✅ PASS | All endpoints use Pydantic request models |
| RLS on all tables | ✅ PASS | Multi-tenant isolation via RLS |
| No secrets in code | ✅ PASS | Environment variables only |
| Webhook signature verification | ✅ PASS | MANDATORY for Clerk (Svix) and Lemon Squeezy (HMAC-SHA256) |

### ✅ Development Workflow

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Schema reference during planning | ✅ PASS | This plan references schema structure |
| Schema files before implementation | ⚠️ PENDING | Will create in Phase 1 |

### Constitution Compliance Summary

**Overall Status**: ✅ COMPLIANT (with 3 pending items to be completed in Phase 1)

**Pending Items**:
1. Create `.specify/schemas/supabase_tables.md` - Phase 1
2. Create `.specify/schemas/lemon_squeezy_webhook.md` - Phase 1
3. Create `.specify/schemas/clerk_webhook.md` - Phase 1

**No Constitution Violations**: All tech stack choices align with project constitution.

## Project Structure

### Documentation (this feature)

```text
specs/001-foodar-backend-api/
├── plan.md              # This file
├── research.md          # Phase 0 output (integration patterns, best practices)
├── data-model.md        # Phase 1 output (entities, relationships, migrations)
├── quickstart.md        # Phase 1 output (local setup, environment variables)
├── contracts/           # Phase 1 output (OpenAPI specs for each domain)
│   ├── auth.yaml
│   ├── onboarding.yaml
│   ├── subscriptions.yaml
│   ├── models-3d.yaml
│   ├── products.yaml
│   ├── public-menu.yaml
│   ├── admin.yaml
│   └── webhooks.yaml
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

**Structure Decision**: Web application (backend only) per constitution. Backend is separate from frontend Next.js project.

```text
backend-python/                    # Backend root per constitution
├── .env.example                    # Template for environment variables
├── pyproject.toml                  # uv project configuration
├── uv.lock                        # uv lock file
├── main.py                        # FastAPI application entry point
│
├── app/
│   ├── __init__.py
│   ├── config.py                  # Environment variable loading, settings
│   │
│   ├── api/                       # API routes organized by domain
│   │   ├── __init__.py
│   │   ├── deps.py                # Shared dependencies (get_db, get_current_user, etc.)
│   │   ├── v1/                    # API version 1
│   │   │   ├── __init__.py
│   │   │   ├── router.py          # Main v1 router
│   │   │   ├── auth.py            # Health check, auth test endpoints
│   │   │   ├── onboarding.py      # POST /onboarding (submit application)
│   │   │   ├── restaurants.py     # GET /restaurants (owner data), PATCH /restaurants/{id}
│   │   │   ├── subscriptions.py   # GET /subscriptions, POST /subscriptions/checkout
│   │   │   ├── models_3d.py       # CRUD for 3D models, upload to Supabase Storage
│   │   │   ├── products.py        # CRUD for products
│   │   │   ├── assets.py          # Upload/list assets (Cloudinary)
│   │   │   ├── public_menu.py     # GET /menu/{slug} (public, no auth)
│   │   │   ├── admin.py           # Admin endpoints (approve/reject, analytics)
│   │   │   └── webhooks.py        # POST /webhooks/clerk, POST /webhooks/lemon
│   │
│   ├── core/                      # Core business logic
│   │   ├── __init__.py
│   │   ├── auth.py                # Clerk JWT verification, get_current_user
│   │   ├── subscriptions.py       # Subscription status checks, trial logic
│   │   ├── billing.py             # Calculate active_products_count, next_bill_amount
│   │   └── emails.py              # Email sending via Resend
│   │
│   ├── db/                        # Database layer
│   │   ├── __init__.py
│   │   ├── session.py             # SQLAlchemy async engine, session factory
│   │   └── base.py                # SQLAlchemy declarative base
│   │
│   ├── models/                    # SQLAlchemy ORM models (database tables)
│   │   ├── __init__.py
│   │   ├── user.py                # User table (synced from Clerk)
│   │   ├── restaurant.py          # Restaurant table with status enum
│   │   ├── onboarding.py          # RestaurantOnboarding table
│   │   ├── subscription.py        # Subscription table with Lemon Squeezy ID
│   │   ├── webhook_event.py       # WebhookEvent table for idempotency
│   │   ├── model_3d.py            # Models3D table with Supabase Storage paths
│   │   ├── product.py             # Product table with JSONB fields
│   │   └── asset.py               # Asset table with Cloudinary URLs
│   │
│   ├── schemas/                   # Pydantic models (request/response validation)
│   │   ├── __init__.py
│   │   ├── user.py                # UserBase, UserCreate, UserRead
│   │   ├── restaurant.py          # RestaurantCreate, RestaurantRead, RestaurantUpdate
│   │   ├── onboarding.py          # OnboardingSubmit, OnboardingRead
│   │   ├── subscription.py        # SubscriptionRead, CheckoutCreate
│   │   ├── webhook.py             # ClerkWebhook, LemonSqueezyWebhook Pydantic models
│   │   ├── model_3d.py            # Model3DCreate, Model3DRead, Model3DUpload
│   │   ├── product.py             # ProductCreate, ProductRead, ProductUpdate
│   │   ├── asset.py               # AssetCreate, AssetRead
│   │   └── public_menu.py         # PublicMenuResponse, ProductPublic
│   │
│   ├── services/                  # External service integrations
│   │   ├── __init__.py
│   │   ├── clerk.py               # Clerk API client, JWT verification utilities
│   │   ├── lemon_squeezy.py       # Lemon Squeezy API client, webhook verification
│   │   ├── supabase_storage.py    # Supabase Storage upload/download/delete
│   │   ├── cloudinary_service.py  # Cloudinary upload/delete
│   │   └── resend_service.py      # Resend email sending
│   │
│   ├── middleware/                # FastAPI middleware
│   │   ├── __init__.py
│   │   ├── auth.py                # JWT verification middleware
│   │   ├── subscription.py        # Check subscription status for protected routes
│   │   └── rate_limit.py          # Rate limiting middleware
│   │
│   └── utils/                     # Utility functions
│       ├── __init__.py
│       ├── slug.py                # Slug generation and validation
│       ├── validators.py          # Custom validators (file types, sizes)
│       └── enums.py               # Python enums (RestaurantStatus, SubscriptionStatus)
│
├── alembic/                       # Database migrations
│   ├── versions/                  # Migration files
│   ├── env.py                     # Alembic environment config
│   └── script.py.mako             # Migration template
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py                # Pytest fixtures (test DB, test client)
│   ├── api/                       # API endpoint tests
│   │   ├── test_auth.py
│   │   ├── test_onboarding.py
│   │   ├── test_restaurants.py
│   │   ├── test_subscriptions.py
│   │   ├── test_models_3d.py
│   │   ├── test_products.py
│   │   ├── test_public_menu.py
│   │   ├── test_admin.py
│   │   └── test_webhooks.py
│   ├── core/                      # Core logic unit tests
│   │   ├── test_auth.py
│   │   ├── test_subscriptions.py
│   │   └── test_billing.py
│   └── services/                  # Service integration tests
│       ├── test_clerk.py
│       ├── test_lemon_squeezy.py
│       └── test_supabase_storage.py
│
└── scripts/
    ├── create_admin.py            # Create admin user in Supabase
    ├── setup_rls.sql              # RLS policy setup script
    └── seed_test_data.py          # Seed test restaurants/products
```

## Complexity Tracking

**No Constitution Violations**: All architecture decisions comply with constitution requirements.

| Decision | Justification |
|----------|---------------|
| SQLAlchemy with Supabase | Constitution requires SQLAlchemy ORM; Supabase provides PostgreSQL-compatible connection string |
| Separate models/ and schemas/ | SQLAlchemy models (DB layer) vs Pydantic schemas (API layer) separation is FastAPI best practice |
| Service layer for integrations | Clerk, Lemon Squeezy, Cloudinary, Resend integrations encapsulated for testability and maintainability |
| Middleware for auth + subscription | Reusable middleware prevents duplicate auth/subscription checks across endpoints |

## Phase 0: Research Tasks

The following research must be completed before Phase 1 design begins. Each research task will use MCP tools to access latest documentation.

### Research Task 1: Clerk JWT Verification in FastAPI

**Objective**: Determine the correct pattern for verifying Clerk JWT tokens in FastAPI middleware and dependency injection.

**Questions to Answer**:
1. How to verify Clerk JWT signatures using Clerk's public JWKS endpoint?
2. What is the correct flow for extracting user claims from validated tokens?
3. How to implement as FastAPI dependency for route-level auth?
4. How to handle token expiration and refresh?
5. What are the recommended error responses for invalid/expired tokens?

**Tools**: Context7 MCP with library ID `/clerk/clerk-sdk-python` or `/clerk/clerk-docs`

**Output**: Document in `research.md` with code examples for:
- JWT verification function
- FastAPI dependency for `get_current_user`
- Error handling patterns

### Research Task 2: Supabase Python Client with SQLAlchemy

**Objective**: Understand how to use Supabase Python client alongside SQLAlchemy ORM for async database operations.

**Questions to Answer**:
1. Can SQLAlchemy async engine connect to Supabase PostgreSQL using connection string?
2. How to configure RLS policies and ensure they work with SQLAlchemy queries?
3. What is the pattern for setting RLS session variables (e.g., `auth.user_id`) in SQLAlchemy?
4. How to use Supabase Storage SDK from Python for 3D model uploads?
5. How to generate signed URLs for private storage buckets?
6. What is the max file size for Supabase Storage uploads?

**Tools**: Supabase MCP search_docs + Context7 for Python client library

**Output**: Document in `research.md` with:
- SQLAlchemy async engine configuration
- RLS policy examples for multi-tenant isolation
- Supabase Storage upload/download code examples
- Signed URL generation

### Research Task 3: Lemon Squeezy Webhook Verification

**Objective**: Verify the correct method for validating Lemon Squeezy webhook signatures and processing subscription events.

**Questions to Answer**:
1. How to verify Lemon Squeezy webhook signatures using HMAC-SHA256?
2. What is the exact webhook payload structure for `subscription_payment_success` and `subscription_payment_failed`?
3. How to extract `custom_data` from webhook payload (contains `restaurant_id`)?
4. How to handle webhook idempotency using `lemon_event_id`?
5. What is the correct API endpoint for creating checkout sessions with variant 1295088?
6. How to configure usage-based pricing in Lemon Squeezy for monthly billing?

**Tools**: Context7 MCP with library ID `/mthli/lemonsqueepy` (Python SDK)

**Output**: Document in `research.md` with:
- Webhook signature verification code
- Pydantic models for webhook payloads
- Checkout session creation example
- Idempotency handling pattern

### Research Task 4: Cloudinary Python SDK Usage

**Objective**: Determine the correct pattern for uploading images/videos to Cloudinary and storing URLs.

**Questions to Answer**:
1. How to configure Cloudinary Python SDK with API credentials?
2. What is the upload API for images and videos?
3. How to generate optimized thumbnail URLs?
4. How to delete assets from Cloudinary using `public_id`?
5. What are the recommended image transformations for product photos?

**Tools**: Context7 MCP or web search for Cloudinary Python SDK

**Output**: Document in `research.md` with:
- Cloudinary SDK initialization
- Upload code examples
- URL transformation patterns

### Research Task 5: Resend Email API Integration

**Objective**: Understand how to send transactional emails via Resend API.

**Questions to Answer**:
1. How to configure Resend API client in Python?
2. What is the API endpoint for sending emails?
3. How to send emails with dynamic templates?
4. What are the rate limits for Resend API?
5. How to handle email delivery failures?

**Tools**: Web search or Context7 for Resend documentation

**Output**: Document in `research.md` with:
- Resend API client setup
- Email sending code examples
- Error handling patterns

### Research Task 6: FastAPI Async Best Practices

**Objective**: Verify FastAPI patterns for async database operations, background tasks, and webhook processing.

**Questions to Answer**:
1. How to configure async SQLAlchemy sessions with FastAPI?
2. What is the pattern for background tasks (e.g., trial expiration checks)?
3. How to implement rate limiting middleware in FastAPI?
4. What are the recommended error response formats?
5. How to structure large FastAPI applications with multiple routers?

**Tools**: Context7 MCP or web search for FastAPI documentation

**Output**: Document in `research.md` with:
- Async session management pattern
- Background task examples
- Rate limiting middleware
- Application structure best practices

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete with all research tasks documented

### Phase 1.1: Schema Files (Constitution Requirement)

Create the following schema files as central source of truth:

#### `.specify/schemas/supabase_tables.md`

Document exact DDL for all 8 tables:
1. users
2. restaurants
3. restaurant_onboardings
4. subscriptions
5. webhook_events
6. models_3d
7. products
8. assets

Include:
- Column names, types, constraints
- Enums (restaurant_status, subscription_status, asset_type)
- Foreign keys with ON DELETE CASCADE
- Indexes for performance
- RLS policy definitions

#### `.specify/schemas/lemon_squeezy_webhook.md`

Document exact payload structure for:
1. `subscription_payment_success`
2. `subscription_payment_failed`
3. `subscription_cancelled`
4. `subscription_updated`

Include:
- Full JSON schema
- Field descriptions
- `custom_data` structure
- `lemon_event_id` for idempotency

#### `.specify/schemas/clerk_webhook.md`

Document exact payload structure for:
1. `user.created`
2. `user.updated`
3. `user.deleted`

Include:
- Full JSON schema
- Svix signature headers
- Field mappings to Supabase users table

### Phase 1.2: Data Model Design

Create `data-model.md` with:

1. **Entity Relationship Diagram** (ASCII or Mermaid):
   - Users → Restaurants (1:many)
   - Restaurants → Onboardings (1:1)
   - Restaurants → Subscriptions (1:1)
   - Restaurants → Models3D (1:many)
   - Restaurants → Products (1:many)
   - Restaurants → Assets (1:many)
   - Models3D ← Products (many:1, optional)

2. **SQLAlchemy Model Definitions**:
   - Exact Python class definitions for all 8 tables
   - Include type hints, relationships, back_populates
   - Validation rules from spec (e.g., slug format)

3. **Alembic Migration Strategy**:
   - Initial migration creates all tables + enums
   - RLS policy setup migration
   - Index creation migration

4. **RLS Policy Specifications**:
   - Policy for each table
   - Example: `restaurants` table - users can only SELECT/UPDATE their own restaurants where `owner_id` matches JWT `user_id` claim

### Phase 1.3: API Contracts (OpenAPI)

Generate OpenAPI 3.0 specifications for each domain in `contracts/` directory:

#### `contracts/auth.yaml`
- GET /health
- GET /auth/me (test auth)

#### `contracts/onboarding.yaml`
- POST /api/v1/onboarding (submit application)
- GET /api/v1/onboarding/{restaurant_id} (view application)

#### `contracts/subscriptions.yaml`
- GET /api/v1/subscriptions (get current subscription)
- POST /api/v1/subscriptions/checkout (create Lemon Squeezy checkout session)

#### `contracts/models-3d.yaml`
- POST /api/v1/models (upload 3D model to Supabase Storage)
- GET /api/v1/models (list restaurant's models)
- GET /api/v1/models/{model_id} (get model details)
- DELETE /api/v1/models/{model_id} (delete model)

#### `contracts/products.yaml`
- POST /api/v1/products (create product)
- GET /api/v1/products (list restaurant's products)
- GET /api/v1/products/{product_id} (get product)
- PATCH /api/v1/products/{product_id} (update product)
- DELETE /api/v1/products/{product_id} (delete product)

#### `contracts/public-menu.yaml`
- GET /api/v1/menu/{slug} (public menu, no auth)

#### `contracts/admin.yaml`
- GET /api/v1/admin/restaurants (list pending applications)
- GET /api/v1/admin/restaurants/{restaurant_id} (view application details)
- POST /api/v1/admin/restaurants/{restaurant_id}/approve (approve)
- POST /api/v1/admin/restaurants/{restaurant_id}/reject (reject)
- GET /api/v1/admin/analytics (subscription metrics)

#### `contracts/webhooks.yaml`
- POST /api/webhooks/clerk (Clerk user sync)
- POST /api/webhooks/lemon (Lemon Squeezy subscription events)

Each contract includes:
- Endpoint path and method
- Request/response Pydantic schemas
- HTTP status codes
- Authentication requirements
- Example requests/responses

### Phase 1.4: Quickstart Guide

Create `quickstart.md` with:

1. **Prerequisites**:
   - Python 3.12+ installed
   - uv installed (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
   - Supabase project created
   - Clerk application created
   - Lemon Squeezy store configured
   - Cloudinary account created
   - Resend account created

2. **Environment Variables**:
   - List all required variables
   - `.env.example` template

3. **Local Setup Steps**:
   ```bash
   # Clone and navigate
   cd backend-python

   # Install dependencies with uv
   uv sync

   # Setup database (run Alembic migrations)
   uv run alembic upgrade head

   # Create admin user
   uv run python scripts/create_admin.py

   # Start development server
   uv run uvicorn main:app --reload
   ```

4. **Testing**:
   - Run tests: `uv run pytest`
   - Test coverage: `uv run pytest --cov=app`

5. **API Documentation**:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

### Phase 1.5: Update Agent Context

Run the agent context update script:

```bash
.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude
```

Add technology context for:
- FastAPI + SQLAlchemy async patterns
- Clerk JWT verification
- Lemon Squeezy webhook handling
- Supabase Storage integration
- Multi-tenant RLS policies

## Post-Design Constitution Re-Check

After Phase 1 design completion, verify:

- [x] Schema files created (`.specify/schemas/*.md`)
- [x] SQLAlchemy models reference schema files
- [x] Pydantic webhook models reference schema files
- [x] RLS policies documented
- [x] All endpoints follow FastAPI best practices from research
- [x] No hardcoded secrets (all in environment variables)

## Next Steps

After `/sp.plan` completes Phase 0 and Phase 1:

1. Review `research.md` for integration patterns
2. Review `data-model.md` for database schema
3. Review `contracts/` for API specifications
4. Run `/sp.tasks` to generate implementation tasks from this plan
5. Run `/sp.implement` to execute tasks

## Architecture Decision Records (ADRs)

No ADRs required at this stage. If significant architectural decisions emerge during implementation (e.g., choosing between direct Supabase client vs SQLAlchemy for specific operations), document with `/sp.adr`.

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Lemon Squeezy webhook signature verification complexity | High - payment failures if incorrect | Phase 0 research with code examples, test webhook replay in development |
| RLS policy misconfiguration leading to data leaks | Critical - multi-tenant isolation breach | Comprehensive RLS testing in Phase 2, manual policy review |
| SQLAlchemy + Supabase async session management issues | Medium - performance degradation | Research Phase 0, follow best practices from FastAPI async guides |
| 3D model file size causing upload timeouts | Medium - poor UX for restaurant owners | Implement file size validation (50MB limit), consider chunked uploads |
| Wildcard DNS `*.foodar.pk` configuration complexity | Medium - public menu inaccessible | Document DNS requirements in quickstart, test with ngrok locally |
| Trial expiration background job not running | High - revenue loss from expired trials | Implement scheduled task + monitoring, manual admin check as backup |

## Performance Optimization Notes

- Use database connection pooling (SQLAlchemy async pool)
- Implement Redis caching for public menu endpoints (future enhancement)
- Optimize Supabase Storage signed URL generation (cache for 15 minutes)
- Use Cloudinary transformations for responsive images
- Add database indexes on frequently queried columns (slug, clerk_user_id, lemon_subscription_id)
- Monitor p95 latency with APM tool (e.g., Sentry)

## Security Checklist

Before production deployment:

- [ ] RLS policies tested for all tables
- [ ] Webhook signature verification tested with invalid signatures
- [ ] Rate limiting enabled on all public endpoints
- [ ] CORS configured to allow only frontend domain
- [ ] HTTPS enforced on all routes
- [ ] Environment variables never committed to git
- [ ] Secrets rotation documented
- [ ] SQL injection testing on all inputs
- [ ] XSS prevention via Pydantic sanitization
- [ ] JWT expiration enforced (no long-lived tokens)
