# UI & UX Rules

Follow `CLAUDE.md Section 24` and `HLD Section 4`.

## Tech Stack
- **Framework:** React + TypeScript (Vite for Web, Expo for Mobile).
- **Styling:** Tailwind CSS + NativeWind for mobile.
- **Components:** shadcn/ui.

## Design Principles
- **Minimalist Operational UI:** Prioritize information density and hierarchy. Avoid decorative clutter.
- **Consistent States:** Every UI component must handle:
  - Loading (Skeletons/Spinners)
  - Error (Actionable messages)
  - Empty (Meaningful placeholders)
- **Accessibility:** Ensure high contrast and readable typography for sunlight/outdoor use (especially on mobile).
- **Responsive:** Admin dashboards must be fully responsive for desktop and tablet views.
