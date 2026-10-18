# TensorDrill content workflow

## New problems and visual editorials

- Every newly published problem must include a substantive visual editorial in both English and Chinese in the same change. Do not publish a text-only problem and defer its visual explanation.
- Use the existing visual-lesson architecture. Include a complete static worked example, accessible labels, responsive layout and, when it helps understanding, meaningful interactive controls.
- Preserve the complete Python solution and representative tests. Put external reference links below them. Prefer original diagrams and verified primary sources; clearly distinguish the exercise component from a complete model or training system.
- Verify formulas, indexing, signs, shapes and edge cases. Compare numerical demonstrations with the existing Python reference and an independent oracle. Add regression checks for both locales, reset/empty/error states and translation collisions.
- Review each updated editorial against three separate gates: the visualization clearly explains the calculation, the logic and formulas are correct, and the formula/text typography is comfortable to read. Numerical test counts alone do not satisfy the visual gates. Inspect desktop and mobile examples, put legends beside the figures, and keep meaningful differences visible when rounding displayed numbers.
- `scripts/legacy-text-editorials.json` records only the text-only backlog that existed on 2026-10-17. Do not add new problem IDs to that list. Remove an old ID when upgrading its visual editorial so it becomes protected against regression.
- `npm run build` enforces visual-editorial coverage. Do not bypass or weaken this gate to publish a new problem. Existing legacy problems may be upgraded in batches.

## Validation and release

- Run the production build and `npm run check` before release. Check relevant controls and mobile layout; CI runs the browser regression suite as well.
- Keep canonical, robots, sitemap and advertising configuration unchanged unless the task requires changes there.
- Preserve unrelated local changes. When publishing, stage only the files belonging to the requested update and verify deployment plus the live pages.
