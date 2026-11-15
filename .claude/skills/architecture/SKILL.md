# Skill: Architecture Review & Evolution

## Purpose
Ensure the platform adheres to the modular monolith and event-driven architecture, preventing architectural drift.

## When to use this skill
- Before any major feature implementation.
- When proposing changes to the folder structure or module boundaries.
- When introducing new cross-module dependencies.

## Required project context to read
- `CLAUDE.md` (Sections 2, 3, 16)
- `docs/architecture-decisions.md` (Section 5)
- `.claude/rules/architecture.md`
- `HLD.md` (Sections 2, 3)

## Step-by-step workflow
1. **Analyze Requirements:** Map the requested feature to existing modules (Identity, School, Fleet, Trip, Journey, etc.).
2. **Review Boundaries:** Identify which modules will be modified. Ensure logic doesn't leak between boundaries.
3. **Check Dependencies:** Verify that dependency directions flow from core to operational (e.g., Journey depends on Trip, not vice versa).
4. **Identify Events:** Determine if the change generates or consumes `journey_events`.
5. **ADR Alignment:** Check `docs/architecture-decisions.md` for existing rules. Propose a new ADR if a fundamental change is needed.
6. **Propose Structure:** Define file placements according to the `LLD Section 2` repository layout.

## Implementation constraints
- Do not introduce microservices.
- No circular dependencies between modules.
- Business logic must remain in domain services, not controllers.
- Use shared packages for cross-cutting types and validation.

## Validation checklist
- [ ] Does this maintain the modular monolith pattern?
- [ ] Are module boundaries strictly respected?
- [ ] Is the event-driven core used for journey state changes?
- [ ] Is the dependency direction correct?

## Common mistakes to avoid
- Mixing concerns (e.g., putting notification logic directly inside the trip service).
- Bypassing the service layer for database access.
- Introducing new infrastructure without an ADR.

## Expected output from Claude
- A module-based impact analysis.
- Proposed file structure changes.
- Identification of affected events and state transitions.
