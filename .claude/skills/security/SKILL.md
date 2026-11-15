# Skill: Security & Privacy Engineering

## Purpose
Ensure multi-tenant isolation, role-based access control, secret security, and privacy compliance.

## When to use this skill
- When defining RLS policies.
- When creating new API endpoints or authentication hooks.
- When handling student data or location logs.

## Required project context to read
- `.claude/rules/security.md`
- `CLAUDE.md` (Sections 10, 11, 13, 14)
- `docs/architecture-decisions.md` (Section 1)

## Step-by-step workflow
1. **Threat Model:** Identify affected resources and data flows.
2. **Assign Permissions:** Verify user role against approved roles (`SUPER_ADMIN`, `SCHOOL_ADMIN`, etc.).
3. **Write RLS:** Build policies based on `auth.jwt() -> school_id`.
4. **Data Minimization:** Ensure PII is protected and omitted from client-side logs.
5. **Secure Configuration:** Ensure service role keys are strictly handled inside Edge Functions.

## Implementation constraints
- RLS is mandatory for all multi-tenant tables.
- Never place secrets in public mobile/frontend builds.
- Do not store biometrics or assign personal data directly to RFID cards.
- Multi-tenancy must be enforced at both the API and database levels.

## Validation checklist
- [ ] Are RLS policies defined and verified?
- [ ] Are roles checked using backend RBAC?
- [ ] Are secrets strictly server-side?
- [ ] Is student PII protected from logging?

## Common mistakes to avoid
- Relying on UI hiding for authorization.
- Exposing Supabase service role keys to the frontend.
- Sending cleartext student data to third-party services.

## Expected output from Claude
- Threat analysis report.
- RLS policy SQL code.
- Secure environment configuration sample.
