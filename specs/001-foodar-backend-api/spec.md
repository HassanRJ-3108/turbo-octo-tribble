# Feature Specification: Foodar Backend API

**Feature Branch**: `001-foodar-backend-api`
**Created**: 2026-02-10
**Status**: Draft
**Input**: User description: "FastAPI backend for restaurant AR menu platform with Clerk auth, Supabase DB, Lemon Squeezy payments, Cloudinary storage, and 3D model management"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Restaurant Owner Onboarding and Approval (Priority: P1)

A restaurant owner discovers the Foodar platform, signs up, and submits their restaurant details and documentation for admin approval to start using the AR menu service.

**Why this priority**: This is the entry point for all revenue generation. Without approved restaurant owners, there are no subscriptions or 3D models to manage. This is the foundational user journey that enables all other features.

**Independent Test**: Can be fully tested by creating a user account via Clerk, submitting onboarding information with documents and photos, and verifying that an admin can review and approve/reject the application. Success is measured by the user receiving approval notification and gaining access to the dashboard.

**Acceptance Scenarios**:

1. **Given** a new user visits the platform, **When** they sign up using Clerk (email/social), **Then** a user record is created in Supabase and they are redirected to the onboarding form
2. **Given** a user is on the onboarding page, **When** they fill in restaurant name, slug, phone, address, description and upload documents/photos, **Then** the onboarding application is submitted with status "pending" and the restaurant record is created
3. **Given** an admin reviews a pending application, **When** they approve it, **Then** the restaurant status changes to "approved", a 7-day trial period starts (trial_starts_at and trial_ends_at are set), and a subscription record is created with status "trialing"
4. **Given** an admin reviews a pending application, **When** they reject it, **Then** the restaurant status changes to "rejected" and the owner receives notification
5. **Given** a submitted application with invalid documents, **When** validation runs, **Then** appropriate error messages are returned before submission

---

### User Story 2 - Trial Period and Subscription Management (Priority: P2)

An approved restaurant owner explores the platform during their 7-day free trial, adds 3D models and products, and then subscribes to continue using the service with usage-based billing.

**Why this priority**: This converts approved users into paying customers. The trial period allows users to experience the value proposition before committing financially. This is critical for revenue generation but depends on Story 1 being completed first.

**Independent Test**: Can be tested by creating an approved restaurant with an active trial, allowing them to add 3D models and products, then triggering trial expiration and verifying subscription checkout flow through Lemon Squeezy. Success is measured by first payment processing and subscription status changing to "active".

**Acceptance Scenarios**:

1. **Given** a restaurant is approved, **When** the approval occurs, **Then** trial_starts_at is set to now and trial_ends_at is set to now + 7 days
2. **Given** a restaurant is in trial period, **When** they attempt to add 3D models and products, **Then** they can successfully upload and manage content
3. **Given** a restaurant's trial period is about to expire (24 hours before), **When** the system runs scheduled checks, **Then** a reminder email is sent with subscription call-to-action
4. **Given** a restaurant's trial has expired, **When** they attempt to access protected features, **Then** they are redirected to subscription checkout page (Lemon Squeezy variant 1295088)
5. **Given** a user completes subscription checkout, **When** Lemon Squeezy webhook "subscription_payment_success" is received, **Then** subscription status changes to "active" and first payment of 5000 PKR is recorded
6. **Given** a user has an active subscription, **When** monthly billing cycle arrives, **Then** next_bill_amount is calculated as (active_products_count * 300 PKR) and charged via Lemon Squeezy
7. **Given** a subscription payment fails, **When** Lemon Squeezy webhook "subscription_payment_failed" is received, **Then** subscription status changes to "past_due", access is blocked, warning email is sent, and grace_end_at is set to now + 3 days
8. **Given** a subscription is in grace period, **When** payment succeeds before grace_end_at, **Then** subscription status returns to "active" and access is restored

---

### User Story 3 - 3D Model and Product Management (Priority: P2)

A restaurant owner with an active subscription or trial uploads 3D models to Supabase Storage, creates product listings with AR models, and organizes their digital menu.

**Why this priority**: This is the core value delivery of the platform - enabling restaurants to create AR menu experiences. It must work during both trial and paid periods. This is equally critical as Story 2 since it delivers the promised value.

**Independent Test**: Can be tested by authenticating as a restaurant owner, uploading a 3D model file (.glb/.gltf) to Supabase Storage, creating a product with nutritional info and pricing, linking the 3D model, and verifying that active_products_count updates correctly for billing purposes.

**Acceptance Scenarios**:

1. **Given** an authenticated restaurant owner, **When** they upload a 3D model file, **Then** the file is stored in Supabase Storage bucket with path `{restaurant_id}/{model_id}/{filename}`, a public URL is generated, and a record is created in models_3d table
2. **Given** an uploaded 3D model, **When** a thumbnail is provided or generated, **Then** the thumbnail is uploaded to Cloudinary and thumbnail_url is saved
3. **Given** a restaurant owner wants to create a product, **When** they submit product details (title, subtitle, description, price, nutrition, ingredients, dietary info), **Then** a product record is created with active=true by default
4. **Given** a product is being created, **When** they select an AR model and upload media (images/videos), **Then** the AR model is linked via ar_model_id and media URLs are stored in Cloudinary
5. **Given** multiple products exist, **When** the owner reorders them via order_index, **Then** the menu displays products in the specified order
6. **Given** a product is marked as active=true and show_in_menu=true, **When** billing calculation runs, **Then** it is included in active_products_count for usage-based billing
7. **Given** a product is deactivated (active=false), **When** billing calculation runs, **Then** it is excluded from active_products_count

---

### User Story 4 - Public AR Menu Access (Priority: P3)

Any visitor accesses a restaurant's public AR menu via their unique slug (e.g., {slug}.foodar.pk) without authentication, views products with 3D models, and interacts with the AR experience.

**Why this priority**: This is the end-user experience that justifies the restaurant's investment. While critical for product value, it depends on Stories 1-3 being completed and can be developed last as it's the consumption layer rather than creation layer.

**Independent Test**: Can be tested by visiting a URL like `restaurant-name.foodar.pk`, verifying that products are displayed without requiring login, and confirming that 3D models load correctly for AR viewing. Success is measured by page load time under 2 seconds and successful AR model rendering.

**Acceptance Scenarios**:

1. **Given** a visitor accesses `{slug}.foodar.pk`, **When** the page loads, **Then** all products with show_in_menu=true from that restaurant are displayed in order_index order
2. **Given** a public menu page, **When** a visitor views a product, **Then** product details (title, subtitle, description, price, nutrition, ingredients, dietary) are visible
3. **Given** a product has an AR model, **When** a visitor clicks "View in AR", **Then** the 3D model loads from Supabase Storage and renders in AR viewer
4. **Given** a product has media (images/videos), **When** the product card is displayed, **Then** media is loaded from Cloudinary
5. **Given** a restaurant's subscription is inactive, **When** a visitor accesses their public menu, **Then** a "temporarily unavailable" message is displayed
6. **Given** a visitor is on mobile device, **When** they access the AR menu, **Then** device camera is requested for AR experience (with appropriate permissions)

---

### User Story 5 - Admin Dashboard and Restaurant Management (Priority: P3)

Platform administrators review pending restaurant applications, approve or reject them, monitor subscription health, and manage restaurant accounts.

**Why this priority**: This enables platform governance and quality control. While important for business operations, it's lower priority than the core user flows since manual admin approval is a one-time gate that doesn't block development of other features.

**Independent Test**: Can be tested by logging in as an admin user (role='admin'), viewing list of pending applications with documents, approving/rejecting them, and viewing subscription analytics. Success is measured by admin being able to process applications within 5 minutes.

**Acceptance Scenarios**:

1. **Given** an admin is authenticated, **When** they access the admin dashboard, **Then** they see lists of restaurants grouped by status (pending, approved, rejected, suspended)
2. **Given** an admin views a pending application, **When** they click to review details, **Then** they see all onboarding information including uploaded documents and photos
3. **Given** an admin is reviewing an application, **When** they click "Approve", **Then** the approval workflow from Story 1 executes
4. **Given** an admin is reviewing an application, **When** they click "Reject" with reason, **Then** status changes to rejected and owner receives notification with reason
5. **Given** an admin views subscription analytics, **When** the dashboard loads, **Then** they see total active subscriptions, total MRR (Monthly Recurring Revenue), and payment failure rates
6. **Given** a restaurant violates terms, **When** admin suspends the account, **Then** restaurant status changes to "suspended", access is blocked, and public menu displays suspension notice

---

### Edge Cases

- What happens when a restaurant slug conflicts with an existing slug?
  - System validates slug uniqueness during onboarding and returns error if duplicate
  - Suggests alternative slugs by appending numbers (e.g., restaurant-name-2)

- How does the system handle Lemon Squeezy webhook failures or duplicate events?
  - Each webhook event is logged in webhook_events table with lemon_event_id
  - System checks for existing lemon_event_id before processing to prevent duplicates
  - Failed webhooks are marked processed=false and can be retried manually via admin endpoint

- What happens when a file upload (3D model or image) fails mid-upload?
  - Supabase Storage supports resumable uploads for files > 6MB
  - Failed uploads are cleaned up automatically after 24 hours
  - User receives error message with option to retry

- How does the system handle timezone differences for trial expiration?
  - All timestamps stored in UTC (TIMESTAMPTZ)
  - Trial expiration checks run on server time (UTC)
  - Email notifications include user's local timezone (detected from Clerk user data)

- What happens when active_products_count changes mid-billing cycle?
  - Billing amount is calculated at the start of each cycle based on current active_products_count
  - Changes during the cycle apply to next billing period (no pro-rating)
  - Detailed billing history stored in webhook_events for transparency

- How does the system handle Clerk webhook failures or user deletions?
  - Clerk webhooks verified using Svix signature validation
  - User deletions cascade to restaurants, products, and models via ON DELETE CASCADE
  - Subscription in Lemon Squeezy is cancelled via API when user deleted

- What happens when Cloudinary quota is exceeded?
  - Upload errors return 402 Payment Required with clear message
  - Admin receives alert to upgrade Cloudinary plan
  - Existing assets remain accessible

- How does the system handle invalid 3D model files (.glb/.gltf)?
  - File extension and MIME type validated before upload
  - File size limited to 50MB per model
  - Malformed files rejected with error message specifying format requirements

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication & Authorization
- **FR-001**: System MUST sync user accounts from Clerk webhooks (`user.created`, `user.updated`, `user.deleted`) to Supabase `users` table
- **FR-002**: System MUST verify Clerk JWT tokens on all protected API endpoints using Clerk's public keys
- **FR-003**: System MUST enforce role-based access control with roles: `restaurant_owner` and `admin`
- **FR-004**: Admin users MUST be able to access admin-only endpoints (approve/reject restaurants, view analytics)
- **FR-005**: Restaurant owners MUST only access their own restaurant data (enforced via middleware)

#### Onboarding & Restaurant Management
- **FR-006**: System MUST allow authenticated users to submit onboarding applications with fields: name, slug, phone, address, description, documents (JSONB), photos (array of URLs)
- **FR-007**: System MUST validate slug uniqueness and format (lowercase, alphanumeric, hyphens only, 3-50 characters)
- **FR-008**: System MUST store restaurant onboarding data in `restaurant_onboardings` table with status "pending"
- **FR-009**: System MUST allow admins to approve applications, which triggers: status → "approved", trial_starts_at → now, trial_ends_at → now + 7 days, subscription creation with status "trialing"
- **FR-010**: System MUST allow admins to reject applications with optional reason

#### Subscription & Billing Management
- **FR-011**: System MUST create checkout sessions with Lemon Squeezy using variant ID 1295088 (7-day trial, then 5000 PKR first payment)
- **FR-012**: System MUST process Lemon Squeezy webhooks with signature verification using signing secret
- **FR-013**: System MUST handle `subscription_payment_success` event: update subscription status to "active", record payment, set last_billed_at
- **FR-014**: System MUST handle `subscription_payment_failed` event: update status to "past_due", set grace_end_at to now + 3 days, send warning email
- **FR-015**: System MUST calculate next_bill_amount as: active_products_count * 300 PKR (monthly)
- **FR-016**: System MUST block access to protected features when subscription status is not "trialing" or "active"
- **FR-017**: System MUST send reminder emails 24 hours before trial expiration
- **FR-018**: System MUST log all webhook events in `webhook_events` table with raw payload and processed status

#### 3D Model Management
- **FR-019**: System MUST upload 3D model files (.glb, .gltf, .usdz formats) to Supabase Storage in bucket structure: `{restaurant_id}/{model_id}/{filename}`
- **FR-020**: System MUST validate 3D model files: max size 50MB, allowed MIME types: model/gltf-binary, model/gltf+json
- **FR-021**: System MUST generate or accept thumbnail images for 3D models, stored in Cloudinary
- **FR-022**: System MUST create records in `models_3d` table with: name, storage_path, file_url (Supabase public URL), thumbnail_url (Cloudinary)
- **FR-023**: System MUST allow restaurant owners to list, view, and delete their 3D models

#### Product Management
- **FR-024**: System MUST allow creation of products with fields: title, subtitle, description, price_amount, currency (default PKR), nutrition (JSONB), ingredients (array), dietary (JSONB), ar_model_id (FK), media (JSONB), ui_behavior (JSONB), active (boolean), show_in_menu (boolean), order_index (integer)
- **FR-025**: System MUST upload product media (images, videos) to Cloudinary and store URLs in media JSONB field
- **FR-026**: System MUST link products to 3D models via ar_model_id foreign key
- **FR-027**: System MUST calculate active_products_count by counting products where active=true for billing purposes
- **FR-028**: System MUST allow restaurant owners to update product order_index for menu ordering
- **FR-029**: System MUST allow restaurant owners to toggle active and show_in_menu flags

#### Asset Management
- **FR-030**: System MUST store reusable assets (images, videos, documents, 3D models) in `assets` table with Cloudinary public_id
- **FR-031**: System MUST upload images and videos to Cloudinary and store URLs with public_id for management
- **FR-032**: System MUST associate assets with restaurant_id for ownership tracking

#### Public Menu Access
- **FR-033**: System MUST serve public menu pages at `{slug}.foodar.pk` without authentication
- **FR-034**: System MUST return all products where show_in_menu=true, ordered by order_index
- **FR-035**: System MUST return 404 if slug does not exist
- **FR-036**: System MUST return "temporarily unavailable" message if restaurant subscription is not active
- **FR-037**: System MUST serve 3D model files from Supabase Storage with appropriate CORS headers for AR viewers
- **FR-038**: System MUST serve product media from Cloudinary CDN for optimal performance

#### Admin Dashboard
- **FR-039**: System MUST provide admin endpoints to list restaurants grouped by status
- **FR-040**: System MUST provide admin endpoint to view detailed onboarding application with documents
- **FR-041**: System MUST provide admin endpoint to approve/reject applications
- **FR-042**: System MUST provide admin analytics: total restaurants, active subscriptions, MRR, payment failure rate
- **FR-043**: System MUST allow admins to suspend restaurant accounts (status → "suspended")

#### Data Management & Cleanup
- **FR-044**: System MUST cascade delete all related data when a restaurant is deleted (onboardings, subscriptions, products, models, assets)
- **FR-045**: System MUST implement soft delete for subscriptions (mark cancelled but retain for billing history)
- **FR-046**: System MUST cleanup failed uploads from Supabase Storage after 24 hours

#### Security & Compliance
- **FR-047**: System MUST verify all webhook signatures (Clerk via Svix, Lemon Squeezy via HMAC-SHA256)
- **FR-048**: System MUST implement Supabase RLS policies on all tables to enforce row-level access control
- **FR-049**: System MUST rate limit API endpoints: 100 requests/minute per user for protected endpoints, 1000 requests/minute for public menu endpoints
- **FR-050**: System MUST sanitize all user inputs to prevent SQL injection and XSS attacks
- **FR-051**: System MUST store all sensitive configuration (API keys, secrets) in environment variables
- **FR-052**: System MUST log all authentication attempts and admin actions for audit trail
- **FR-053**: System MUST implement HTTPS for all API endpoints
- **FR-054**: System MUST set appropriate CORS headers to allow frontend domains

### Key Entities *(data model)*

- **User**: Represents platform users synced from Clerk
  - Attributes: clerk_user_id, email, full_name, role
  - Relationships: One user owns many restaurants

- **Restaurant**: Represents a restaurant account on the platform
  - Attributes: owner_id (FK to users), name, slug, custom_domain, status (enum), trial dates, approval date
  - Relationships: One restaurant has one onboarding application, one subscription, many products, many 3D models, many assets

- **Restaurant Onboarding**: Stores onboarding application data
  - Attributes: restaurant_id (FK), phone, address, description, documents (JSONB), photos (array), submitted_at
  - Relationships: One-to-one with restaurant

- **Subscription**: Tracks subscription and billing status
  - Attributes: restaurant_id (FK), lemon_subscription_id, status (enum), active_products_count, last_billed_at, next_bill_amount, grace_end_at, warning_count
  - Relationships: One-to-one with restaurant

- **Webhook Event**: Logs all incoming webhook events for idempotency and debugging
  - Attributes: provider (clerk/lemon_squeezy), event_name, lemon_event_id, raw_payload (JSONB), processed (boolean), processed_at
  - Relationships: None (log table)

- **3D Model**: Represents 3D model files for AR experiences
  - Attributes: restaurant_id (FK), name, storage_path, file_url, thumbnail_url, description
  - Relationships: Belongs to one restaurant, linked by many products

- **Product**: Represents menu items with AR capabilities
  - Attributes: restaurant_id (FK), title, subtitle, description, price_amount, currency, nutrition (JSONB), ingredients (array), dietary (JSONB), ar_model_id (FK), media (JSONB), ui_behavior (JSONB), active, show_in_menu, order_index
  - Relationships: Belongs to one restaurant, links to one 3D model (optional)

- **Asset**: Stores reusable media assets
  - Attributes: restaurant_id (FK), url, public_id, type (enum: image/video/document/3d_model)
  - Relationships: Belongs to one restaurant

## Success Criteria *(mandatory)*

### Measurable Outcomes

#### User Experience
- **SC-001**: Restaurant owners can complete onboarding and submit application in under 10 minutes with all required documents
- **SC-002**: Admin can review and approve/reject an onboarding application in under 5 minutes
- **SC-003**: Restaurant owners can upload a 3D model and create a product in under 3 minutes during trial period
- **SC-004**: Public menu pages load completely in under 2 seconds on 3G networks
- **SC-005**: 3D models render and display in AR viewers within 5 seconds of user interaction

#### System Performance
- **SC-006**: API endpoints respond within 200ms for 95% of requests under normal load (100 concurrent users)
- **SC-007**: System handles 1000 concurrent public menu page views without degradation
- **SC-008**: File uploads complete successfully for 99% of valid 3D model files under 50MB
- **SC-009**: Webhook processing completes within 2 seconds of receipt for 99% of events

#### Business Operations
- **SC-010**: Zero duplicate subscription charges due to webhook event idempotency checks
- **SC-011**: 95% of trial users receive reminder email exactly 24 hours before trial expiration
- **SC-012**: Subscription status accuracy maintains 99.9% (status correctly reflects payment state)
- **SC-013**: Active products count for billing is calculated with 100% accuracy each billing cycle

#### Security & Reliability
- **SC-014**: Zero unauthorized access to restaurant data (enforced by RLS and middleware)
- **SC-015**: 100% of webhooks are verified with valid signatures before processing
- **SC-016**: System maintains 99.5% uptime excluding planned maintenance
- **SC-017**: All sensitive operations (approval, payment, deletion) are logged with complete audit trail

#### Data Integrity
- **SC-018**: Zero orphaned records after user or restaurant deletion (cascade deletes work correctly)
- **SC-019**: Billing calculations match actual product counts with 100% accuracy
- **SC-020**: All timestamps are stored and compared in UTC with zero timezone-related bugs

## Assumptions

1. **Lemon Squeezy Configuration**: Variant ID 1295088 is pre-configured with 7-day trial + 5000 PKR initial payment in Lemon Squeezy dashboard
2. **Cloudinary Account**: A Cloudinary account with sufficient quota is provisioned and API credentials are available
3. **Supabase Storage**: Storage bucket policies allow authenticated uploads and public reads for 3D models
4. **Clerk Configuration**: Clerk webhooks are configured to send events to the backend webhook endpoint with proper signing secrets
5. **Domain Configuration**: DNS is configured to route `*.foodar.pk` wildcard domains to the backend for public menu access
6. **Email Service**: An email service (e.g., Resend) is configured for sending trial reminders and notifications
7. **Admin User Creation**: Initial admin user(s) are created manually via Supabase SQL or admin script with role='admin'
8. **Lemon Squeezy Store**: The "foodar" store is active in Lemon Squeezy with webhook endpoint configured
9. **Payment Processing**: Lemon Squeezy handles all payment processing, PCI compliance, and customer billing UIs
10. **3D Model Formats**: Restaurants will upload models in standard AR formats (.glb, .gltf, .usdz) compatible with common AR viewers
11. **Infrastructure**: Backend is deployed with sufficient resources to handle expected load (estimated 100 restaurants, 10,000 products initially)

## Out of Scope

- Custom domain management (e.g., restaurant.com instead of restaurant.foodar.pk) - reserved for future iteration
- Multi-language support for public menus - initial version is English/Urdu only
- Advanced analytics dashboard for restaurant owners (views, interactions) - basic subscription metrics only
- QR code generation for table-side menu access - restaurants use their own QR solutions initially
- Restaurant staff management (multiple users per restaurant) - single owner model only
- Product categories and filtering on public menu - simple ordered list only
- Discount codes and promotional pricing - future feature
- Customer accounts and order history on public menu - view-only experience
- Integration with POS systems - manual product entry only
- Automated 3D model generation from photos - manual upload only
- Email customization and branding - standard transactional emails only
- Webhook retry logic with exponential backoff - manual retry via admin panel only
- Real-time subscription status updates via WebSockets - polling-based checks only

## Dependencies

### External Services
1. **Clerk** - User authentication, JWT issuance, user management webhooks
2. **Supabase** - PostgreSQL database, Storage for 3D models, RLS policies
3. **Lemon Squeezy** - Subscription management, payment processing, billing webhooks
4. **Cloudinary** - Image and video hosting, thumbnail generation, CDN delivery
5. **Email Service** - Transactional emails for trial reminders, approval notifications (e.g., Resend)

### Technical Dependencies
1. Python 3.11+ runtime environment
2. FastAPI framework with async support
3. Supabase Python client library (`supabase-py`)
4. Clerk Python SDK for JWT verification
5. HTTP client library for Lemon Squeezy API calls (`httpx`)
6. Cloudinary Python SDK
7. PostgreSQL database provided by Supabase

### Infrastructure Dependencies
1. DNS configuration for `*.foodar.pk` wildcard routing
2. SSL certificates for API domain and wildcard public menu domains
3. Environment variable management for secrets (API keys, webhook secrets)
4. Deployment platform supporting Python async workers (e.g., Railway, Render, Fly.io)

## Notes

- The specification intentionally avoids implementation details (FastAPI, SQLAlchemy, specific libraries) as those will be determined during the planning phase
- All monetary amounts are in Pakistani Rupees (PKR) as specified, stored as integers (e.g., 5000 = 5000 PKR)
- Lemon Squeezy variant 1295088 must have usage-based pricing enabled to charge 300 PKR per active product monthly
- The public menu domain pattern `{slug}.foodar.pk` requires wildcard DNS and SSL certificate configuration
- RLS policies will be critical for multi-tenant data isolation - each restaurant owner can only access their own data
- Webhook signature verification is non-negotiable for security - all webhooks must be validated before processing
- Trial period is exactly 7 days (168 hours) from approval timestamp, not calendar days
- Active products count includes products where `active=true` regardless of `show_in_menu` value - this is for billing accuracy
