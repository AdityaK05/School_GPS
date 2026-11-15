# Skill: Quality Assurance & Testing Engineering

## Purpose
Build robust unit, integration, and E2E test suites with a focus on safety paths and deterministic logic.

## When to use this skill
- When adding unit tests for state machine logic.
- When creating integration tests for API endpoints or event processing.
- When building Playwright E2E tests for admin/parent/attendant workflows.

## Required project context to read
- `.claude/rules/testing.md`
- `LLD.md` (Sections 66-68)

## Step-by-step workflow
1. **Target Identification:** Determine if the code requires Unit (Vitest), Integration, or E2E (Playwright) testing.
2. **State Machine Verification:** Test all valid state transitions and verify invalid ones are blocked.
3. **Idempotency Testing:** Send identical events multiple times to ensure single execution.
4. **Offline Queue Testing:** Test SQLite event queuing, sync retries, and timestamp preservation.
5. **Security/RLS Testing:** Test cross-tenant access to verify data separation.

## Implementation constraints
- Critical safety paths MUST have tests.
- Mock external GPS services for predictable test runs.
- Use synthetic data for testing. Never use production PII.

## Validation checklist
- [ ] Are state transitions covered?
- [ ] Is idempotency verified?
- [ ] Are cross-tenant security checks included?
- [ ] Do E2E scripts cover end-to-end user paths?

## Common mistakes to avoid
- Relying purely on UI tests for core business safety rules.
- Skipping RLS boundary tests.
- Non-deterministic tests using live dates instead of fixtures.

## Expected output from Claude
- Vitest test suites.
- Playwright E2E scripts.
- Test coverage mapping for safety components.
