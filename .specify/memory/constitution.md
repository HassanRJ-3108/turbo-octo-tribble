# Foodar.pk Constitution

<!--
Sync Impact Report:
- Version change: 1.0.0 (initial)
- New constitution created for Foodar.pk AR/3D restaurant menu platform
- All principles derived from user requirements
- Templates alignment: ✅ plan-template.md, spec-template.md, tasks-template.md reviewed
-->

## Core Principles

### I. Tech Stack Mandate (NON-NEGOTIABLE)

**Frontend**:
- Next.js 16+ with App Router ONLY
- TypeScript strict mode MUST be enabled
- Tailwind CSS for styling
- Mobile-first responsive design REQUIRED
- Clerk middleware MUST be used correctly for authentication

**Backend**:
- Python 3.12+ ONLY
- `uv` for dependency management (NOT pip, NOT poetry)
- FastAPI for all API endpoints
- SQLAlchemy ORM for database operations
- Pydantic for ALL input validation

**Database & Storage**:
- Supabase for PostgreSQL database
- Supabase Storage for 3D model files (.glb/.gltf) with signed URLs
- Cloudinary for menu photos/thumbnails (if needed)
- Row Level Security (RLS) MUST be enabled on all tables

**3D/AR Technology**:
- `<model-viewer>` web component from Google (NOT custom Three.js, NOT React Three Fiber)
- MUST include: `ar`, `auto-scale`, `camera-controls` attributes
- MUST set: `ar-modes="webxr scene-viewer quick-look"`
- True-to-scale rendering with device distance adjustment
- No manual zoom controls for AR mode

**Architecture**:
- Monorepo structure: `/frontend-nextjs` (Next.js) + `/backend-python` (FastAPI)
- NO Docker for local development
- Local backend: `uvicorn main:app --reload`
- Local frontend: `next dev`

**Deployment**:
- Frontend: Vercel ONLY
- Backend: Railway, Render, or Fly.io
- Database/Storage: Supabase hosted

**Rationale**: These technologies are chosen for browser-based AR capabilities, rapid development, and Pakistan market compatibility. Deviations require explicit user approval and ADR documentation.

---

### II. Schema Authority & Consistency (NON-NEGOTIABLE)

**Central Schema File**:
- `.specify/schemas/supabase_tables.md` is the SINGLE SOURCE OF TRUTH
- Contains exact DDL for tables: `restaurants`, `products`, `3d_models`
- NEVER invent columns or tables
- ALWAYS copy/reference from this file

**Schema Change Protocol** (MUST follow in order):
1. Edit `.specify/schemas/supabase_tables.md` FIRST
2. Commit changes to git
3. Generate Supabase SQL migration
4. Apply migration to database
5. Update application code

**Storage Buckets**:
- Supabase Storage buckets for 3D models
- Use public or signed URLs for frontend access
- 3D models: signed URLs with expiry
- Images: public URLs via Cloudinary or Supabase

**Rationale**: Single source of truth prevents column mismatches, runtime errors, and data inconsistencies. Schema-first approach ensures database integrity before code changes.

---

### III. Webhook & Payment Integration Protocol

**Schema Files Required**:
- `.specify/schemas/lemon_squeezy_webhook.md` - Lemon Squeezy payload structure
- `.specify/schemas/clerk_webhook.md` - Clerk webhook payload structure

**Lemon Squeezy Integration**:
- Monthly subscription fee for restaurant dashboard access
- Flow: Signup → Lemon Squeezy checkout with `custom_data: {restaurant_id}`
- Webhook on success → update `subscription_status` in Supabase `restaurants` table
- MUST validate ALL webhooks with Pydantic against schema file
- NEVER assume webhook structure - ALWAYS reference schema file

**Webhook Validation** (MUST follow):
1. Verify signature (HMAC for Lemon Squeezy, Svix for Clerk)
2. Parse JSON body
3. Validate with Pydantic model from schema file
4. Process event
5. Return 200 OK

**Rationale**: Webhooks are critical for subscription management. Schema files prevent payload parsing errors and ensure correct business logic execution.

---

### IV. MCP & Research-First Development (NON-NEGOTIABLE)

**Research Requirements**:
- MUST research latest documentation before writing code:
  - Clerk authentication & middleware
  - Supabase RLS policies & Storage
  - `<model-viewer>` AR configuration
  - Lemon Squeezy API & webhooks
- NEVER write code from internal knowledge without verification
- Explicitly state "research latest" for complex components

**Development Flow** (MUST follow):
1. **Plan** - Understand requirements
2. **Research** - Verify current best practices with MCP tools
3. **Code** - Implement with verified patterns
4. **Validate** - Test against requirements

**MCP Mode Priority**:
- Treat MCP servers as first-class tools
- Use CLI interactions over manual file creation
- Capture all outputs and state changes
- Prefer external verification over assumptions

**When Unsure**:
- ASK for clarification (use Human as Tool strategy)
- DO NOT assume or invent solutions
- DO NOT proceed with guesswork

**Rationale**: APIs and best practices change frequently. Research-first prevents deprecated patterns, security vulnerabilities, and integration failures.

---

### V. Code Quality & Security Standards

**Type Safety**:
- TypeScript: strict mode enabled, no `any` types without justification
- Python: type hints on all functions, Pydantic models for data validation

**Input Validation**:
- Frontend: Zod schemas for all forms
- Backend: Pydantic models for all API inputs
- NEVER trust client input

**Security Requirements**:
- RLS enabled on ALL Supabase tables
- Restaurant data: owners can only access their own data
- NO secrets in code - environment variables ONLY (`.env`, `.env.local`)
- Signed URLs for sensitive storage buckets
- Webhook signature verification MANDATORY

**Authentication Flow**:
- Clerk handles all user authentication
- Store `clerk_user_id` in `restaurants` table
- RLS policies check `clerk_user_id` against JWT claims
- Backend verifies Clerk session tokens

**Rationale**: Security breaches destroy trust. Type safety catches errors at development time. RLS prevents unauthorized data access.

---

### VI. Development Workflow (SDD Process)

**Mandatory Sequence**:
1. `constitution` - Establish project principles (this file)
2. `specify` - Create feature specification
3. `clarify` - Resolve ambiguities
4. `plan` - Design architecture & research
5. `tasks` - Generate implementation tasks
6. `implement` - Execute tasks

**Schema Reference Requirement**:
- ALWAYS reference `.specify/schemas/` files during planning and implementation
- Webhook handlers MUST reference webhook schema files
- Database operations MUST reference `supabase_tables.md`

**Rationale**: Structured workflow prevents rework, ensures completeness, and maintains consistency across features.

---

### VII. No Delivery or Ordering (Phase 1 Scope)

**In Scope**:
- Restaurant menu visualization with 3D models
- QR code scanning to open restaurant menu
- 3D viewer for dishes
- AR placement on real tables (browser-based)
- Restaurant dashboard for uploading dishes & 3D models

**Out of Scope (explicitly excluded)**:
- Food ordering system
- Payment processing for orders
- Delivery logistics
- Shopping cart functionality
- Customer accounts (beyond restaurant owners)

**Rationale**: Focus on core visualization feature to build customer trust before adding transactional complexity. MVP should validate AR/3D value proposition.

---

## Development Guidelines

### Code Standards

**Clarity Over Cleverness**:
- Explicit code > implicit magic
- Descriptive names > abbreviations
- Comments explain "why", code shows "how"

**Testing**:
- Unit tests for business logic
- Integration tests for API endpoints
- Manual AR testing on real devices (iOS Safari, Android Chrome)

**Error Handling**:
- Descriptive error messages
- Proper HTTP status codes
- Log errors with context

**Performance**:
- 3D model file size < 10MB recommended
- Optimize .glb files before upload
- Lazy load 3D models
- Use CDN for static assets

---

## Governance

**Constitution Authority**:
- This constitution supersedes all conflicting practices
- All PRs and code reviews MUST verify compliance
- Principle violations require explicit justification

**Amendment Process**:
1. Propose amendment with rationale
2. Document in git commit
3. Update version number (semantic versioning)
4. Update dependent templates and documentation
5. Create ADR if architecturally significant

**Version Semantics**:
- **MAJOR**: Backward incompatible principle changes (e.g., removing tech stack requirement)
- **MINOR**: New principles added or expanded guidance
- **PATCH**: Clarifications, wording improvements, typo fixes

**Compliance Review**:
- All pull requests must reference this constitution
- Complexity must be justified against principles
- Schema changes must follow protocol in Principle II

**Version**: 1.0.0 | **Ratified**: 2026-01-31 | **Last Amended**: 2026-01-31
