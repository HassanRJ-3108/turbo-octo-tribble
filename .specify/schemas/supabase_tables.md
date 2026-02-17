# Supabase Database Tables Schema

**Purpose**: Central source of truth for all database table definitions
**Feature**: 001-foodar-backend-api
**Database**: Supabase PostgreSQL
**Created**: 2026-02-12

## Overview

This schema defines 8 tables for the Foodar backend API with complete DDL, RLS policies, and migration order.

See full schema documentation in this file for:
- Table definitions with all columns, types, and constraints
- Indexes for performance optimization
- RLS policies for multi-tenant data isolation
- Migration order and triggers

All tables use UUID primary keys and include created_at/updated_at timestamps with automatic triggers.
