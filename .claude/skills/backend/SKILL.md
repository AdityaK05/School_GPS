# Skill: Backend Engineering

## Purpose
Develop modular backend services using Supabase Edge Functions with proper API boundaries and domain logic.

## When to use this skill
- When creating new Edge Functions or API endpoints.
- When implementing business logic for trips, routes, or journey state.
- When managing events and exceptions.

## Required project context to read
- `.claude/rules/architecture.md`
- `LLD.md` (Sections 19, 51-53)

## Step-by-step workflow
1. **Define API Interface:** Use `v1` pathing and Zod for request validation.
2. **Apply Domain Pattern:** Create a `service.ts` for logic, `repository.ts` for DB access, and `handler.ts` for HTTP interaction.
3. **Enforce Auth:** Use Supabase Auth tokens to derive `school_id` and user role.
4. **Validate Business Rules:** Run domain-specific validations (e.g., student assignment).
5. **Execute Logic:** Handle event processing or state transitions.
6. **Trigger Side Effects:** Handle notifications or exception creation if applicable.

## Implementation constraints
- Business logic MUST NOT be in the HTTP handler.
- Always validate request input with Zod.
- APIs must be machine-readable (Error codes in response).
- Use idempotency keys for any state-changing operations.

## Validation checklist
- [ ] Is input validated with Zod?
- [ ] Is business logic in a service layer?
- [ ] Are permissions checked for the tenant?
- [ ] Is idempotency respected?

## Common mistakes to avoid
- Leaking DB internal IDs to the client.
- Ignoring error handling for partial sync/failure.
- Bypassing the service layer for database queries.

## Expected output from Claude
- API handler implementation.
- Service and Repository class stubs.
- Zod schema definition.
