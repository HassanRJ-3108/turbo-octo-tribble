# Tasks: Foodar Backend API

**Input**: Design documents from `/specs/001-foodar-backend-api/`
**Prerequisites**: plan.md (✓), spec.md (✓), research.md (✓)

**Tests**: Tests are NOT explicitly requested in the specification, therefore test tasks are OMITTED from this task list. Focus is on implementation only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Backend project location: `backend-python/` (per plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure. Important: User has already initialized uv project in backend-python/ directory.

- [x] T001 make backend-python directory project structure per plan.md
- [x] T002 Initialize uv project with pyproject.toml in backend-python/
- [x] T003 [P] Add core dependencies to pyproject.toml: fastapi, uvicorn, sqlalchemy[asyncio], asyncpg, pydantic, pydantic-settings
- [x] T004 [P] Add integration dependencies: clerk-backend-api, supabase, cloudinary, resend, httpx
- [x] T005 [P] Add development dependencies: pytest, pytest-asyncio, pytest-cov, httpx (for testing), alembic
- [x] T006 Create .env.example with all required environment variables in backend-python/
- [x] T007 Create main.py FastAPI application entry point in backend-python/
- [x] T008 Create app/__init__.py and basic package structure in backend-python/app/
- [x] T009 [P] Create app/config.py for environment variable loading using pydantic-settings
- [x] T010 [P] Create app/utils/enums.py for RestaurantStatus and SubscriptionStatus enums

**Checkpoint**: Project structure initialized, dependencies ready to install with `uv sync`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Schema Files (Constitution Requirement)

- [x] T011 Create .specify/schemas/supabase_tables.md with DDL for all 8 tables (users, restaurants, restaurant_onboardings, subscriptions, webhook_events, models_3d, products, assets) including RLS policies
- [x] T012 [P] Create .specify/schemas/clerk_webhook.md with payload structure for user.created, user.updated, user.deleted events
- [x] T013 [P] Create .specify/schemas/lemon_squeezy_webhook.md with payload structure for subscription webhooks

### Database Foundation

- [x] T014 Create app/db/__init__.py and app/db/base.py with SQLAlchemy declarative base in backend-python/app/db/
- [x] T015 Create app/db/session.py with async engine and session factory (postgresql+asyncpg connection) in backend-python/app/db/
- [x] T016 Initialize Alembic in backend-python/alembic/ with alembic init command
- [x] T017 Configure alembic/env.py to use async engine and import SQLAlchemy models
- [x] T018 Create app/models/__init__.py in backend-python/app/models/

### Authentication Foundation

- [x] T019 Create app/core/__init__.py in backend-python/app/core/
- [x] T020 Implement Clerk JWT verification in app/core/auth.py using clerk-backend-api SDK (authenticate_request pattern from research.md)
- [x] T021 Create app/api/deps.py with get_db and get_current_user dependencies in backend-python/app/api/
- [x] T022 Create app/middleware/__init__.py in backend-python/app/middleware/
- [x] T023 Implement rate limiting middleware in app/middleware/rate_limit.py (100 req/min protected, 1000 req/min public)

### API Structure

- [x] T024 Create app/api/__init__.py and app/api/v1/__init__.py in backend-python/app/api/v1/
- [x] T025 Create app/api/v1/router.py as main v1 router with health check endpoint
- [x] T026 Register v1 router in main.py with /api/v1 prefix and add CORS middleware
- [x] T027 Create app/schemas/__init__.py in backend-python/app/schemas/

### External Services Foundation

- [x] T028 Create app/services/__init__.py in backend-python/app/services/
- [x] T029 [P] Create app/services/clerk.py with Clerk SDK initialization and utilities
- [x] T030 [P] Create app/services/supabase_storage.py with Supabase client initialization for Storage operations
- [x] T031 [P] Create app/services/cloudinary_service.py with Cloudinary configuration
- [x] T032 [P] Create app/services/resend_service.py with Resend API client setup
- [x] T033 Create app/services/lemon_squeezy.py with webhook verification function (HMAC-SHA256 from research.md)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Restaurant Owner Onboarding and Approval (Priority: P1) 🎯 MVP

**Goal**: Enable restaurant owners to sign up via Clerk, submit onboarding applications with documents/photos, and allow admins to approve/reject applications to start 7-day trials

**Independent Test**: Create user account via Clerk, submit onboarding application with restaurant details and documents, admin reviews and approves application, verify trial period starts and subscription record created with status "trialing"

### Data Models for User Story 1

- [x] T034 [P] [US1] Create app/models/user.py with User model (id, clerk_user_id, email, full_name, role, created_at, updated_at)
- [x] T035 [P] [US1] Create app/models/restaurant.py with Restaurant model (id, owner_id FK, name, slug, custom_domain, status enum, trial_starts_at, trial_ends_at, approved_at, created_at, updated_at)
- [x] T036 [P] [US1] Create app/models/onboarding.py with RestaurantOnboarding model (id, restaurant_id FK, phone, address, description, documents JSONB, photos array, submitted_at, created_at, updated_at)

### Pydantic Schemas for User Story 1

- [x] T037 [P] [US1] Create app/schemas/user.py with UserBase, UserCreate, UserRead Pydantic models
- [x] T038 [P] [US1] Create app/schemas/restaurant.py with RestaurantCreate, RestaurantRead, RestaurantUpdate Pydantic models
- [x] T039 [P] [US1] Create app/schemas/onboarding.py with OnboardingSubmit, OnboardingRead Pydantic models

### Database Migrations for User Story 1

- [x] T040 [US1] Create Alembic migration for users table with indexes on clerk_user_id
- [x] T041 [US1] Create Alembic migration for restaurants table with unique constraint on slug and indexes
- [x] T042 [US1] Create Alembic migration for restaurant_onboardings table with FK to restaurants
- [x] T043 [US1] Run migrations with alembic upgrade head to create tables in Supabase

### RLS Policies for User Story 1

- [x] T044 [US1] Create scripts/setup_rls.sql with RLS policies for users, restaurants, and restaurant_onboardings tables
- [x] T045 [US1] Apply RLS policies to Supabase: users can view own restaurants, admins can view all

### API Endpoints for User Story 1

- [x] T046 [US1] Create app/api/v1/onboarding.py with POST /api/v1/onboarding endpoint (submit application)
- [x] T047 [US1] Add GET /api/v1/onboarding/{restaurant_id} endpoint to view application status
- [x] T048 [US1] Create app/api/v1/restaurants.py with GET /api/v1/restaurants endpoint (owner's restaurants)
- [x] T049 [US1] Add PATCH /api/v1/restaurants/{id} endpoint for updating restaurant details
- [x] T050 [US1] Create app/api/v1/admin.py with GET /api/v1/admin/restaurants endpoint (list pending applications)
- [x] T051 [US1] Add GET /api/v1/admin/restaurants/{restaurant_id} endpoint (view application details)
- [x] T052 [US1] Add POST /api/v1/admin/restaurants/{restaurant_id}/approve endpoint (approve application, start trial, create subscription)
- [x] T053 [US1] Add POST /api/v1/admin/restaurants/{restaurant_id}/reject endpoint (reject with reason)

### Utilities for User Story 1

- [x] T054 [P] [US1] Create app/utils/slug.py with slug generation and validation functions
- [x] T055 [P] [US1] Create app/utils/validators.py with custom validators for file types and sizes

### Business Logic for User Story 1

- [x] T056 [US1] Create app/core/emails.py with email sending functions using Resend (approval notification, rejection notification)
- [x] T057 [US1] Integrate email notifications into approval/rejection endpoints in app/api/v1/admin.py

**Checkpoint**: User Story 1 complete - Restaurant owners can onboard, admins can approve/reject, trials start

---

## Phase 4: User Story 2 - Trial Period and Subscription Management (Priority: P2)

**Goal**: Enable approved restaurants to use platform during 7-day trial, then convert to paid subscription via Lemon Squeezy with usage-based billing (5000 PKR first payment, then 300 PKR per active product)

**Independent Test**: Create approved restaurant with active trial, add products during trial, trigger trial expiration, complete subscription checkout via Lemon Squeezy, process webhook to activate subscription, verify billing amount calculated correctly

### Data Models for User Story 2

- [x] T058 [P] [US2] Create app/models/subscription.py with Subscription model (id, restaurant_id FK, lemon_subscription_id, status enum, active_products_count, last_billed_at, next_bill_amount, grace_end_at, warning_count, created_at, updated_at)
- [x] T059 [P] [US2] Create app/models/webhook_event.py with WebhookEvent model (id, provider enum, event_name, lemon_event_id, raw_payload JSONB, processed boolean, processed_at, created_at)

### Pydantic Schemas for User Story 2

- [x] T060 [P] [US2] Create app/schemas/subscription.py with SubscriptionRead, CheckoutCreate Pydantic models
- [x] T061 [P] [US2] Create app/schemas/webhook.py with ClerkWebhook and LemonSqueezyWebhook Pydantic models (based on schema files)

### Database Migrations for User Story 2

- [x] T062 [US2] Create Alembic migration for subscriptions table with FK to restaurants and indexes
- [x] T063 [US2] Create Alembic migration for webhook_events table with unique constraint on lemon_event_id
- [x] T064 [US2] Run migrations with alembic upgrade head

### RLS Policies for User Story 2

- [x] T065 [US2] Add RLS policies for subscriptions table to scripts/setup_rls.sql (users can view own subscription, admins can view all)
- [x] T066 [US2] Apply subscription RLS policies to Supabase

### Webhook Processing for User Story 2

- [x] T067 [US2] Create app/api/v1/webhooks.py with POST /api/webhooks/clerk endpoint (user sync from Clerk)
- [x] T068 [US2] Implement Clerk webhook handler to process user.created, user.updated, user.deleted events
- [x] T069 [US2] Add POST /api/webhooks/lemon endpoint (Lemon Squeezy subscription events)
- [x] T070 [US2] Implement Lemon Squeezy webhook handler for subscription_payment_success (activate subscription, update status)
- [x] T071 [US2] Implement handler for subscription_payment_failed (set past_due, send warning email, set grace period)
- [x] T072 [US2] Implement handler for subscription_cancelled (deactivate subscription)

### Subscription Management Endpoints for User Story 2

- [x] T073 [US2] Create app/api/v1/subscriptions.py with GET /api/v1/subscriptions endpoint (get current subscription)
- [x] T074 [US2] Add POST /api/v1/subscriptions/checkout endpoint (create Lemon Squeezy checkout session with variant 1295088)
- [x] T075 [US2] Implement Lemon Squeezy checkout session creation in app/services/lemon_squeezy.py

### Business Logic for User Story 2

- [x] T076 [US2] Create app/core/subscriptions.py with trial status check functions (is_trial_active, is_subscription_active)
- [x] T077 [US2] Create app/core/billing.py with billing calculation functions (calculate_active_products_count, calculate_next_bill_amount)
- [x] T078 [US2] Create app/middleware/subscription.py with subscription status middleware (block access if not active/trialing)
- [x] T079 [US2] Add trial expiration email templates to app/core/emails.py (24-hour reminder, payment failed warning)

### Background Tasks for User Story 2

- [x] T080 [US2] Create scripts/check_trial_expirations.py for scheduled trial expiration checks (identify trials expiring in 24 hours)
- [x] T081 [US2] Integrate trial expiration check with email sending (send reminder emails)
- [x] T082 [US2] Add APScheduler setup to main.py for daily trial expiration checks

**Checkpoint**: User Story 2 complete - Trials work, subscription checkout functional, webhooks process payments, billing calculates correctly

---

## Phase 5: User Story 3 - 3D Model and Product Management (Priority: P2)

**Goal**: Enable restaurant owners with active subscription/trial to upload 3D models to Supabase Storage, create products with AR models, manage product details, and track active products for billing

**Independent Test**: Authenticate as restaurant owner, upload 3D model file (.glb) to Supabase Storage, create product with nutritional info and pricing, link 3D model to product, verify active_products_count updates for billing

### Data Models for User Story 3

- [x] T083 [P] [US3] Create app/models/model_3d.py with Models3D model (id, restaurant_id FK, name, storage_path, file_url, thumbnail_url, description, created_at, updated_at)
- [x] T084 [P] [US3] Create app/models/product.py with Product model (id, restaurant_id FK, title, subtitle, description, price_amount, currency, nutrition JSONB, ingredients array, dietary JSONB, ar_model_id FK, media JSONB, ui_behavior JSONB, active boolean, show_in_menu boolean, order_index integer, created_at, updated_at)
- [x] T085 [P] [US3] Create app/models/asset.py with Asset model (id, restaurant_id FK, url, public_id, type enum, created_at, updated_at)

### Pydantic Schemas for User Story 3

- [x] T086 [P] [US3] Create app/schemas/model_3d.py with Model3DCreate, Model3DRead, Model3DUpload Pydantic models
- [x] T087 [P] [US3] Create app/schemas/product.py with ProductCreate, ProductRead, ProductUpdate Pydantic models
- [x] T088 [P] [US3] Create app/schemas/asset.py with AssetCreate, AssetRead Pydantic models

### Database Migrations for User Story 3

- [x] T089 [US3] Create Alembic migration for models_3d table with FK to restaurants
- [x] T090 [US3] Create Alembic migration for products table with FK to restaurants and models_3d
- [x] T091 [US3] Create Alembic migration for assets table with FK to restaurants
- [x] T092 [US3] Run migrations with alembic upgrade head

### RLS Policies for User Story 3

- [x] T093 [US3] Add RLS policies for models_3d, products, and assets tables to scripts/setup_rls.sql (users can manage own resources)
- [x] T094 [US3] Apply RLS policies for User Story 3 tables to Supabase

### Storage Integration for User Story 3

- [x] T095 [US3] Implement upload_3d_model function in app/services/supabase_storage.py (upload to bucket with path restaurant_id/models/filename)
- [x] T096 [US3] Implement delete_3d_model function in app/services/supabase_storage.py
- [x] T097 [US3] Implement generate_signed_url function in app/services/supabase_storage.py (7-day expiry)
- [x] T098 [US3] Configure Supabase Storage bucket "3d-models" with RLS policies for authenticated uploads and public reads

### Cloudinary Integration for User Story 3

- [x] T099 [US3] Implement upload_image_to_cloudinary function in app/services/cloudinary_service.py (with transformations from research.md)
- [x] T100 [US3] Implement upload_video_to_cloudinary function in app/services/cloudinary_service.py
- [x] T101 [US3] Implement delete_from_cloudinary function using public_id in app/services/cloudinary_service.py
- [x] T102 [US3] Implement get_thumbnail_url function for dynamic thumbnail generation in app/services/cloudinary_service.py

### API Endpoints for User Story 3 - 3D Models

- [x] T103 [US3] Create app/api/v1/models_3d.py with POST /api/v1/models endpoint (upload 3D model with file validation)
- [x] T104 [US3] Add GET /api/v1/models endpoint (list restaurant's 3D models)
- [x] T105 [US3] Add GET /api/v1/models/{model_id} endpoint (get model details with signed URL)
- [x] T106 [US3] Add DELETE /api/v1/models/{model_id} endpoint (delete from Storage and DB)

### API Endpoints for User Story 3 - Products

- [x] T107 [US3] Create app/api/v1/products.py with POST /api/v1/products endpoint (create product with validation)
- [x] [T108] [P] [Story 4] `GET /restaurants/:id/products` - List products for public menu
- [x] [T109] [P] [Story 4] `GET /restaurants/:id/products/:id` - Get single product details)
- [x] T110 [US3] Add PATCH /api/v1/products/{product_id} endpoint (update product fields)
- [x] T111 [US3] Add DELETE /api/v1/products/{product_id} endpoint (soft delete, set active=false)

### API Endpoints for User Story 3 - Assets

- [x] T112 [US3] Create app/api/v1/assets.py with POST /api/v1/assets endpoint (upload image/video to Cloudinary)
- [x] T113 [US3] Add GET /api/v1/assets endpoint (list restaurant's assets)
- [x] T114 [US3] Add DELETE /api/v1/assets/{asset_id} endpoint (delete from Cloudinary and DB)

### Business Logic for User Story 3

- [x] T115 [US3] Add active_products_count calculation trigger to product create/update/delete operations
- [x] T116 [US3] Integrate active_products_count updates with subscription billing in app/core/billing.py
- [x] T117 [US3] Add file validation in app/utils/validators.py (3D model formats: .glb, .gltf, .usdz; max size 50MB)

**Checkpoint**: User Story 3 complete - 3D models upload to Supabase, products created with AR models, billing counts active products

---

## Phase 6: User Story 4 - Public AR Menu Access (Priority: P3)

**Goal**: Enable any visitor to access a restaurant's public AR menu via unique slug (slug.foodar.pk) without authentication, view products with 3D models, and interact with AR experience

**Independent Test**: Visit URL like restaurant-name.foodar.pk, verify products display without login, confirm 3D models load for AR viewing, measure page load time under 2 seconds

### Data Models for User Story 4

No new models required - uses existing Product, Models3D, Restaurant models

### Pydantic Schemas for User Story 4

- [x] T118 [P] [US4] Create app/schemas/public_menu.py with PublicMenuResponse, ProductPublic Pydantic models

### API Endpoints for User Story 4

- [x] T119 [US4] Create app/api/v1/public_menu.py with GET /api/v1/menu/{slug} endpoint (public, no auth required)
- [x] T120 [US4] Implement public menu handler: lookup restaurant by slug, verify subscription active, return products where show_in_menu=true ordered by order_index
- [x] T121 [US4] Add subscription status check in public menu endpoint (return "temporarily unavailable" if inactive)
- [x] T122 [US4] Configure CORS headers in main.py to allow wildcard subdomain access (*.foodar.pk)

### Business Logic for User Story 4

- [x] T123 [US4] Add caching layer consideration to public menu endpoint for performance (document for future Redis implementation)
- [x] T124 [US4] Ensure 3D model signed URLs are fresh (regenerate if expired) in public menu response

**Checkpoint**: User Story 4 complete - Public menus accessible via slug, no auth required, 3D models load correctly

---

## Phase 7: User Story 5 - Admin Dashboard and Restaurant Management (Priority: P3)

**Goal**: Enable platform administrators to monitor subscription health, view analytics (total restaurants, active subscriptions, MRR), and suspend restaurant accounts for policy violations

**Independent Test**: Login as admin user (role='admin'), view subscription analytics dashboard, suspend a restaurant account, verify public menu shows suspension notice

### API Endpoints for User Story 5

- [x] T125 [US5] Add GET /api/v1/admin/analytics endpoint to app/api/v1/admin.py (total restaurants, active subscriptions, MRR calculation, payment failure rates)
- [x] T126 [US5] Add POST /api/v1/admin/restaurants/{restaurant_id}/suspend endpoint (change status to suspended, block access)
- [x] T127 [US5] Add GET /api/v1/admin/restaurants grouped by status query parameter (pending, approved, rejected, suspended)

### Business Logic for User Story 5

- [x] T128 [US5] Implement MRR calculation logic in app/core/billing.py (sum of next_bill_amount for all active subscriptions)
- [x] T129 [US5] Implement payment failure rate calculation (failed webhooks / total webhooks)
- [x] T130 [US5] Add suspension notice handling to public menu endpoint in app/api/v1/public_menu.py

### Admin User Setup

- [x] T131 [US5] Create scripts/create_admin.py script to create admin user with role='admin' in Supabase

**Checkpoint**: User Story 5 complete - Admin dashboard functional, analytics accurate, suspension workflow works

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

### Documentation

- [x] T132 [P] Create backend-python/README.md with quickstart instructions (installation, setup, running locally)
- [x] T133 [P] Update specs/001-foodar-backend-api/quickstart.md with complete local setup guide (uv sync, migrations, environment variables)
- [x] T134 [P] Add API documentation comments to all endpoint functions for Swagger UI

### Security Hardening

- [x] T135 Verify all webhook signature verification is implemented (Clerk Svix, Lemon Squeezy HMAC-SHA256)
- [x] T136 Review all RLS policies in Supabase (run scripts/setup_rls.sql and verify policies active)
- [x] T137 Add input sanitization checks to all Pydantic schemas to prevent SQL injection and XSS
- [x] T138 Verify HTTPS enforcement in production (document in deployment guide)
- [x] T139 Review CORS configuration (ensure only authorized frontend domains allowed)

### Performance Optimization

- [x] T140 Add database indexes to frequently queried columns (slug, clerk_user_id, lemon_subscription_id, restaurant_id)
- [x] T141 Configure SQLAlchemy connection pool settings for production load (pool_size, max_overflow)
- [x] T142 Add monitoring setup documentation (Sentry integration for error tracking, APM for latency)
- [x] T143 Review and optimize N+1 query patterns (use eager loading where appropriate)

### Error Handling & Logging

- [x] T144 Add comprehensive error handling to all API endpoints (consistent error response format)
- [x] T145 Add structured logging throughout application (use loguru or structlog)
- [x] T146 Log all authentication attempts and admin actions for audit trail

### Deployment Preparation

- [x] T147 Create Dockerfile for backend-python with uvicorn production settings
- [x] T148 Document production environment variables in .env.example
- [x] T149 Create deployment guide for Railway/Render/Fly.io in docs/
- [x] T150 Add healthcheck endpoint validation (ensure /health returns 200)

### Data Integrity & Cleanup

- [x] T151 Verify CASCADE DELETE behavior for all foreign keys (test user deletion cascades)
- [x] T152 Implement cleanup job for failed Storage uploads (files older than 24 hours)
- [x] T153 Add data validation script to verify billing calculations match active product counts

### Code Quality

- [x] T154 [P] Run code formatting with black and isort across all Python files
- [x] T155 [P] Run linting with ruff or flake8 and fix all issues
- [x] T156 Add type checking with mypy and resolve type errors
- [x] T157 Review and refactor any duplicated code into shared utilities

**Checkpoint**: Production-ready backend - secure, performant, documented, deployable

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
  - **User Story 2 (P2)**: Can start after Foundational - Depends on Subscription model being created (T052 creates subscription on approval)
  - **User Story 3 (P2)**: Can start after Foundational - Independent but billing integration touches subscriptions
  - **User Story 4 (P3)**: Can start after Foundational - Depends on Product and Models3D models existing
  - **User Story 5 (P3)**: Can start after Foundational - Uses existing Restaurant model
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅ Fully independent
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Task T052 in US1 creates initial subscription record, but US2 can implement subscription logic independently ✅ Mostly independent
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Active products count affects billing (US2), but product CRUD is independent ✅ Independent with integration point
- **User Story 4 (P3)**: Requires US1 (Restaurant model), US3 (Product model, Models3D model) to be complete ⚠️ Has dependencies
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Uses Restaurant model from US1 ✅ Independent

### Recommended Implementation Order

1. **Phase 1: Setup** → **Phase 2: Foundational** (sequential, blocking)
2. **Phase 3: User Story 1** (MVP - implement first to establish core flow)
3. **Phase 4: User Story 2** (monetization - critical for business)
4. **Phase 5: User Story 3** (value delivery - core product feature)
5. **Phase 6: User Story 4** (public-facing - can be developed in parallel with US5)
6. **Phase 7: User Story 5** (admin tools - can be developed in parallel with US4)
7. **Phase 8: Polish** (after all stories complete)

### Parallel Opportunities

#### Within Setup (Phase 1)
Tasks T003, T004, T005 (dependencies), T009, T010 can run in parallel

#### Within Foundational (Phase 2)
- Schema files: T012, T013 in parallel
- Services: T029, T030, T031, T032 in parallel
- Models for each story can be created in parallel once base is ready

#### Within User Story 1
- Models: T034, T035, T036 in parallel
- Schemas: T037, T038, T039 in parallel
- Utilities: T054, T055 in parallel

#### Within User Story 2
- Models: T058, T059 in parallel
- Schemas: T060, T061 in parallel

#### Within User Story 3
- Models: T083, T084, T085 in parallel
- Schemas: T086, T087, T088 in parallel

#### Across User Stories (after Foundational complete)
- US1, US2, US3 can be developed in parallel by different developers (with coordination on subscription integration)
- US4 and US5 can be developed in parallel after US1 and US3 models exist

#### Within Polish (Phase 8)
- Documentation tasks: T132, T133, T134 in parallel
- Code quality: T154, T155 in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task T034: "Create app/models/user.py with User model"
Task T035: "Create app/models/restaurant.py with Restaurant model"
Task T036: "Create app/models/onboarding.py with RestaurantOnboarding model"

# Launch all schemas for User Story 1 together:
Task T037: "Create app/schemas/user.py with Pydantic models"
Task T038: "Create app/schemas/restaurant.py with Pydantic models"
Task T039: "Create app/schemas/onboarding.py with Pydantic models"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup → Foundation infrastructure ready
2. Complete Phase 2: Foundational → Core auth, DB, services ready (CRITICAL checkpoint)
3. Complete Phase 3: User Story 1 → Onboarding and approval flow working
4. **STOP and VALIDATE**: Test onboarding independently (signup → submit → approve → trial starts)
5. Deploy MVP if validation successful

**MVP Delivers**: Restaurant owners can sign up, submit applications, admins can approve, trials start automatically

### Incremental Delivery (Recommended)

1. **Foundation** (Phase 1 + 2) → 2-3 days → Core infrastructure ready
2. **MVP** (Phase 3: US1) → 2-3 days → Onboarding works → **DEPLOY**
3. **Monetization** (Phase 4: US2) → 3-4 days → Subscriptions and billing work → **DEPLOY**
4. **Value Delivery** (Phase 5: US3) → 3-4 days → 3D models and products work → **DEPLOY**
5. **Public Launch** (Phase 6: US4 + Phase 7: US5) → 2-3 days → Public menus and admin tools → **DEPLOY**
6. **Production Ready** (Phase 8: Polish) → 2-3 days → Security, performance, docs → **LAUNCH**

**Total Estimated Time**: 14-19 days for full implementation

### Parallel Team Strategy

With 2 developers after Foundational phase:

- **Developer A**: User Story 1 → User Story 2 → User Story 4
- **Developer B**: User Story 3 → User Story 5 → Polish
- **Both**: Foundational phase together, then split

With 3 developers after Foundational phase:

- **Developer A**: User Story 1 → User Story 5
- **Developer B**: User Story 2 → Polish (security)
- **Developer C**: User Story 3 → User Story 4 → Polish (docs)

---

## Notes

- **[P]** tasks run in parallel (different files, no dependencies)
- **[Story]** label maps task to user story for traceability
- Each user story should be independently testable
- Tests are NOT included per specification (no TDD requirement stated)
- Commit after each logical task group
- Stop at checkpoints to validate story independently
- **Constitution Compliance**: Schema files (T011-T013) created before implementation per constitution
- **Backend location**: All code goes in `backend-python/` per plan.md
- **Dependencies**: Use `uv` NOT pip/poetry per constitution
- **Clerk MCP**: New Clerk MCP server available for auth integration patterns if needed

---

## Task Count Summary

- **Phase 1 (Setup)**: 10 tasks
- **Phase 2 (Foundational)**: 23 tasks (BLOCKING)
- **Phase 3 (US1)**: 24 tasks (MVP)
- **Phase 4 (US2)**: 25 tasks
- **Phase 5 (US3)**: 35 tasks
- **Phase 6 (US4)**: 7 tasks
- **Phase 7 (US5)**: 7 tasks
- **Phase 8 (Polish)**: 26 tasks

**Total Tasks**: 157 tasks

**Parallel Opportunities**: 45+ tasks marked [P] can run in parallel

**MVP Scope (Recommended First Delivery)**: Phase 1 + Phase 2 + Phase 3 = 57 tasks
