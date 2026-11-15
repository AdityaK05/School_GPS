# Skill: Mobile Engineering

## Purpose
Build a high-reliability Parent/Attendant mobile application using React Native and Expo with an offline-first strategy.

## When to use this skill
- When implementing mobile UI or offline synchronization logic.
- When working with SQLite or the synchronization queue.

## Required project context to read
- `.claude/rules/mobile.md`
- `LLD.md` (Sections 2, 60-61)

## Step-by-step workflow
1. **Identify User Context:** Use the routing structure `(parent)` or `(attendant)`.
2. **Handle Offline State:** Check SQLite local storage first. Use `sync_status = PENDING` for queue management.
3. **Trigger Sync:** When connectivity returns, batch upload events using the `batch` API.
4. **Enforce UX:** Keep interfaces minimal and focused on operational workflows (scanning, location status).
5. **Add Feedback:** Provide immediate color-coded visual feedback (Green/Amber/Red) for RFID scans.

## Implementation constraints
- One Expo codebase for both apps.
- All offline events must include original `device_timestamp`.
- Use the batch API for event synchronization.
- Never discard RFID scans.

## Validation checklist
- [ ] Is SQLite utilized for offline operations?
- [ ] Are sync retries implemented with exponential backoff?
- [ ] Does the UI handle connectivity status clearly?
- [ ] Are idempotency keys preserved?

## Common mistakes to avoid
- Over-relying on network-dependent requests for critical operations.
- Forgetting to handle reordering of offline events.
- Creating overly complex navigation paths for critical tasks (e.g., scanning).

## Expected output from Claude
- Component code for Attendant/Parent UI.
- Service logic for SQLite interaction and sync queue management.
