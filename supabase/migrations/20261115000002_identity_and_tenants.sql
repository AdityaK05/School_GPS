-- Migration: 20261115000002_identity_and_tenants.sql
-- Description: Phase 2 Stage 2 - School/Tenant Foundation & User Identity / RBAC
-- Authoritative Sources: CLAUDE.md, HLD.md (§6, §23), LLD.md (§4, §16, §45), docs/architecture-decisions.md (ADR-1)
-- Depends on: 20261115000001_extensions_and_enums.sql (user_role_type)
-- Constraints: No seed data, no application secrets, no push to remote database.

-- ============================================================================
-- 1. HELPER FUNCTIONS
-- ============================================================================

-- Generic trigger function to automatically maintain updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. SCHOOL / TENANT FOUNDATION
-- ============================================================================

-- The root tenant boundary. Every tenant-owned record throughout the system
-- references schools(id) directly or indirectly.
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    address TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for schools updated_at
DROP TRIGGER IF EXISTS trg_schools_updated_at ON schools;
CREATE TRIGGER trg_schools_updated_at
    BEFORE UPDATE ON schools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. USER / IDENTITY FOUNDATION
-- ============================================================================

-- Application user profiles extending auth.users.
-- Supabase Auth remains the sole authority for credentials, passwords, and sessions.
-- school_id is nullable solely to support cross-tenant SUPER_ADMIN users (ADR-1).
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for users updated_at
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ROLE-BASED ACCESS CONTROL (RBAC)
-- ============================================================================

-- Explicit user roles mapping users to roles within a tenant boundary.
-- Uses the canonical user_role_type ENUM created in Migration 001.
-- Enforces:
-- 1. SUPER_ADMIN is cross-tenant (school_id MUST be NULL).
-- 2. Tenant roles (SCHOOL_ADMIN, TRANSPORT_MANAGER, DRIVER, ATTENDANT, PARENT)
--    MUST be bound to a valid school (school_id MUST NOT be NULL).
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    role user_role_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_user_roles_tenant_boundary CHECK (
        (role = 'SUPER_ADMIN' AND school_id IS NULL) OR
        (role != 'SUPER_ADMIN' AND school_id IS NOT NULL)
    )
);

-- ============================================================================
-- 5. INDEXES (Stage 2 Identity & Tenant Relationships Only)
-- ============================================================================

-- Tenant lookup indexes
CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status);

-- User tenant lookup index (critical for tenant-scoped operations and RLS lookups)
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);

-- User role lookup indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_school_id ON user_roles(school_id);

-- Enforce uniqueness of role assignments per tenant and for cross-tenant super admins
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique_tenant
    ON user_roles(user_id, school_id, role)
    WHERE school_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique_super_admin
    ON user_roles(user_id, role)
    WHERE school_id IS NULL;

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) PREPARATION
-- ============================================================================

-- Enable RLS on all identity/tenant tables. Detailed policies matching user
-- JWT claims will be established in the dedicated RLS migration stage.
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
