Run a comprehensive UI/UX audit on this project. Follow these steps exactly:

## Phase 1: Baseline Screenshots
1. Start the dev server using preview_start
2. Capture baseline screenshots at desktop, tablet, and mobile breakpoints using preview_screenshot + preview_resize
3. Note the current visual state before making any changes

## Phase 2: Parallel Audit (4 agents)
Launch 4 agents in parallel, each returning a structured list of findings:

**Agent 1 — Accessibility:**
- Keyboard navigation (missing tabIndex, role, onKeyDown)
- ARIA labels on interactive elements (inputs, buttons, toggles)
- aria-live regions for dynamic content
- Color-only indicators (WCAG 1.4.1)
- Screen reader compatibility

**Agent 2 — Performance:**
- CSS performance (large blur surfaces, will-change, transition: all)
- Font loading strategy (CSS @import vs link preload)
- React render performance (unnecessary re-renders, missing memo)
- Bundle size and code splitting
- h-screen vs h-dvh

**Agent 3 — Code Cleanup:**
- Dead code and unused imports
- Duplicate logic
- React best practices violations
- TypeScript type issues
- Do NOT add comments, docs, error handling, or new abstractions

**Agent 4 — Front-end UI/UX (baseline-ui + web-animation-design):**
- h-dvh not h-screen
- text-balance for headings, text-pretty for body
- No gradients unless requested
- No layout property animations
- Animation duration under 300ms for UI, under 200ms for feedback
- Explicit transition properties (not transition: all)
- safe-area-inset for fixed/absolute elements
- size-* for square elements

## Phase 3: Apply Fixes
- Apply all findings that are UI/UX polish only
- Do NOT change any functionality
- Run `npm run build` to verify no TypeScript errors

## Phase 4: Comparison Screenshots
- Capture screenshots at desktop, tablet, and mobile breakpoints
- Compare with baseline to verify no layout regressions

## Phase 5: Documentation
- Update CLAUDE.md with a summary of all changes made
- Categorize by: Accessibility, Performance, Baseline UI Compliance, Code Cleanup

$ARGUMENTS
