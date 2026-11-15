# Skill: UI & UX Engineering

## Purpose
Design high-efficiency, clean, and accessible UI interfaces for Web and Mobile using modern components.

## When to use this skill
- When creating dashboard layouts, forms, tables, or real-time fleet views.
- When creating Attendant or Parent mobile screens.

## Required project context to read
- `.claude/rules/ui.md`
- `HLD.md` (Section 4)
- `LLD.md` (Sections 42, 60)

## Step-by-step workflow
1. **Layout Setup:** Use responsive CSS (Tailwind) and appropriate grid/flex structures.
2. **State Design:** Define visual presentations for:
   - Initial Loading (Skeletons)
   - Empty Data State
   - Operational Error State
3. **Data Fetching:** Integrate TanStack Query for caching and Zustand for local state.
4. **Use Design System:** Build using `shadcn/ui` components for consistency.
5. **Realtime Map:** Implement MapLibre for fleet visualization (do not refresh the whole UI on updates).

## Implementation constraints
- Avoid excessive gradients, animations, or cluttered dashboards.
- Interfaces must be accessible in outdoor sunlight conditions (Mobile).
- Server state MUST NOT be copied into Zustand without a documented reason.

## Validation checklist
- [ ] Are all three states (Loading, Error, Empty) handled?
- [ ] Is `shadcn/ui` used consistently?
- [ ] Is it responsive for various screen sizes?
- [ ] Is server state managed via TanStack Query?

## Common mistakes to avoid
- Re-rendering entire maps on single vehicle updates.
- Using low-contrast fonts.
- Copying TanStack Query cache directly into Zustand.

## Expected output from Claude
- React component file.
- TanStack Query hooks setup.
- UI state handling block.
