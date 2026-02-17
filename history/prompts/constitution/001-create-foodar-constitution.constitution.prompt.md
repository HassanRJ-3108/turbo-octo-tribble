---
id: 001
title: Create Foodar.pk Constitution
stage: constitution
date: 2026-01-31
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: master
user: foodar-team
command: /sp.constitution
labels: ["constitution", "foodar", "tech-stack", "schemas", "webhooks", "research-first"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - .specify/memory/constitution.md
tests:
 - none
---

## Prompt

Create or update the project constitution for Foodar.pk – Pakistan's first AR/3D interactive restaurant menu platform. Restaurants upload dishes with 3D models; customers scan QR code to open restaurant menu, view dishes in 3D viewer, or place in AR on real table (true-to-scale, browser-based, no manual zoom, size adjusts with device distance). No delivery or ordering initially – focus on visualization to build customer trust.

These principles are IMMUTABLE and MUST guide every single code generation, decision, query, webhook, and feature. No assumptions allowed.

1. Tech Stack & Architecture:
   - Frontend: Next.js 14+ (App Router), TypeScript strict mode, Tailwind CSS, mobile-first responsive.
   - Backend: Python 3.12+, uv for dependencies, FastAPI for API, SQLAlchemy ORM.
   - Database & Storage: Supabase (PostgreSQL + Storage for 3D models .glb/.gltf with signed URLs).
   - Images (if needed): Cloudinary for menu photos/thumbnails.
   - Auth: Clerk for restaurant owners and admin (use Clerk middleware correctly in Next.js).
   - 3D/AR: <model-viewer> web component (from Google) for 3D viewer + AR (ar attribute, auto-scale, camera-controls, ar-modes="webxr scene-viewer quick-look").
   - Monorepo: root /frontend (Next.js) + /backend (FastAPI).
   - Local Dev: No Docker. Use 'uvicorn main:app --reload' for backend, 'next dev' for frontend.
   - Deployment: Frontend on Vercel, Backend on Railway/Render/Fly.io, Supabase for DB/Storage/Auth.

2. Database Schemas & Consistency:
   - Central file: .specify/schemas/supabase_tables.md (markdown with exact DDL: tables like restaurants, products, 3d_models).
   - NEVER invent columns – ALWAYS copy/reference from this file.
   - Schema change? FIRST edit supabase_tables.md, commit git, THEN generate Supabase SQL migration.
   - Storage: Supabase Storage buckets for 3D models (public or signed URLs for frontend).

3. Webhooks & Payments:
   - Files: .specify/schemas/lemon_squeezy_webhook.md (payload schema from docs), clerk_webhook.md.
   - Lemon Squeezy: subscriptions for restaurants (monthly fee for dashboard access).
   - Flow: Signup → Lemon Squeezy checkout with custom_data {restaurant_id}, webhook on success → update subscription_status in Supabase.
   - Validate all webhooks with Pydantic against schema file.

4. MCP & Research Rules (Must Follow):
   - Use MCP mode: Research first using latest docs (Clerk, Supabase, model-viewer, Lemon Squeezy APIs).
   - Never write code without verifying current best practices.
   - Plan → Research → Code. If unsure, ask for clarification.
   - For every complex part (Clerk middleware, AR config, signed URLs): explicitly say "research latest" in prompts.

5. Code Quality & Security:
   - TypeScript/Python types strict.
   - Input validation (Zod/Pydantic).
   - RLS on Supabase tables (restaurant own data).
   - No secrets in code – .env only.

6. Workflow:
   - constitution → specify → clarify → plan → tasks → implement.
   - Always reference schemas/webhook files.

Confirm understanding before proceeding to any task or code.

## Response snapshot

Created Foodar.pk Constitution v1.0.0 at `.specify/memory/constitution.md` with 7 NON-NEGOTIABLE core principles:

1. **Tech Stack Mandate**: Next.js 16+ App Router, Python 3.12+, FastAPI, Supabase, Clerk auth, model-viewer for AR, no Docker locally
2. **Schema Authority & Consistency**: `.specify/schemas/supabase_tables.md` as single source of truth, schema-first change protocol
3. **Webhook & Payment Integration**: Pydantic validation against schema files (lemon_squeezy_webhook.md, clerk_webhook.md)
4. **MCP & Research-First Development**: MUST research latest docs before coding, never assume
5. **Code Quality & Security**: TypeScript strict, Zod validation, Pydantic models, RLS on all tables, environment variables only
6. **Development Workflow**: constitution → specify → clarify → plan → tasks → implement
7. **Phase 1 Scope**: AR/3D visualization only, no ordering/delivery

Key commitments:
- Never invent database columns - reference schema files
- Never assume webhook structures - reference schema files when provided
- Research latest documentation for Clerk, Supabase, model-viewer, Lemon Squeezy before implementation
- Ask for clarification when unsure (Human as Tool strategy)
- All secrets in .env files only

## Outcome

- ✅ Impact: Established immutable principles for entire Foodar.pk project. All future code generation, API decisions, and features must comply with these 7 principles.
- 🧪 Tests: No tests created (constitution phase)
- 📁 Files: 1 file created - .specify/memory/constitution.md (v1.0.0)
- 🔁 Next prompts: Schema files will be provided by user when ready. Next step: /sp.specify for first feature (likely restaurant dashboard or customer AR viewer)
- 🧠 Reflection: Constitution captures critical constraint of schema-first development and research-first coding. Webhook schema files deferred per user request to avoid token waste until actual schemas available.

## Evaluation notes (flywheel)

- Failure modes observed: None yet (initial constitution). Potential: schema files not being referenced, assumptions made without research, tech stack deviations
- Graders run and results (PASS/FAIL): N/A (constitution phase)
- Prompt variant (if applicable): Standard /sp.constitution command
- Next experiment (smallest change to try): Test compliance by creating first feature spec and ensuring schema references are enforced
