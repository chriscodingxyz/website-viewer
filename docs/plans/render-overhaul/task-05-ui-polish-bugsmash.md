# Task 5: UI/UX polish toward BugSmash reference

Reference: BugSmash workspace screenshot (2026-06-12). Layout: single top bar; canvas left; comments rail right. Clean, low-chrome, keyboard-first.

**Files (likely):**
- Modify: `components/bugsmash/ProjectWorkspace.tsx`
- Modify: `components/bugsmash/ProjectCanvas.tsx`
- Modify: `components/bugsmash/ProjectCommentPanel.tsx`

## Reference layout breakdown

Top bar, left to right:
1. Back arrow + product name
2. `WEBSITE` badge + project hostname
3. Center: device selector (dropdown, not 4-wide toggle), then **Browse / Comment** segmented control with keyboard hints (`V` / `C`)
4. Right: open-in-new-tab icon, Share button, status dropdown (e.g. "Pending"), comments-panel toggle with unread count badge

Comments rail:
- Header: "Comments" + **Active N / Resolved N** tab pills
- Search input + filter + sort icons in one row
- Comment card: avatar, name, "New" chip, relative time, reply count, body, assignee dropdown, priority dropdown, resolve check button, kebab menu, pin number badge on the right

## Improvement checklist (current app vs reference)

- [ ] Keyboard shortcuts: `V` = browse, `C` = comment/annotate (ignore when typing in inputs). Show hints in the segmented control.
- [ ] Collapse the 4-item viewport ToggleGroup into a compact device dropdown to reduce toolbar noise (keep fullscreen as an item).
- [ ] Add "Open site in new tab" icon button to the canvas toolbar (exists only in error states today).
- [ ] Loading state: replace spinner overlay with a light skeleton (header bar + content blocks) for perceived speed.
- [ ] Comments rail: Active/Resolved counts as pills in the header (verify current implementation matches).
- [ ] Pin number badges visually consistent between canvas pins and comment cards.
- [ ] Reduce toolbar item count: group annotation visibility + preview + proxy toggles under one "view options" dropdown if the bar overflows on tablet width.
- [ ] Status dropdown (Pending/Approved) in the top bar - already exists for admins via owner actions; align placement with reference.

## Verify

- `npm run lint` and `npm run build` pass.
- Browser: shortcuts work, no layout overflow at 1024px, comments rail matches reference hierarchy.

## Commit

`feat(workspace): BugSmash-style toolbar, shortcuts, skeleton loading`
