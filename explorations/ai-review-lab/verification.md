# Local verification — 2026-10-12

## Automated checks

Command: `node explorations/ai-review-lab/test.mjs`

- 18 independently specified input/output cases: original proposal 12/18,
  incomplete follow-up 17/18, reference repair 18/18.
- Both ordinary samples pass the original proposal.
- Nine counterexample comparisons exercise positive, falsey, nested, Unicode,
  quote and newline values; every comparison also checks the repaired code.
- JSON-based output comparison rejects boolean-to-number coercion, which plain
  Python equality would miss. Inputs to reference and proposal are independent.
- A repair that drops validation fails. Syntax errors produce a failure.
- Invalid input shape, malformed JSON, oversized UTF-8 input, unsafe numbers
  and excessive nesting are rejected before Python execution.
- EN/ZH page structure and explicit local-server asset allowlist pass.

## Browser checks (actual Pyodide, not a mocked runner)

- Two existing tests pass. Malformed JSON is rejected. Positive result produces
  matching outputs and is not counted as a counterexample.
- Zero produces `invalid` in the proposal and `ok` in the reference, and is saved
  as evidence for the repair's regression.
- Incomplete follow-up: 18/19 with the user's counterexample; explicit null
  fails. Correct repair: 19/19.
- Infinite loop is stopped by the 15-second execution timeout. Manual Stop also
  stops execution. A fresh Worker subsequently passes 19/19 again.
- Wrong transfer answer does not complete the exercise; correct answer plus
  evidence and passing repair does. Editing invalidates the repair pass.
- Refresh and switching EN/ZH preserve the draft and personal completion state.
- Narrow 320px/375px and desktop layouts inspected; no document-wide horizontal
  overflow observed. Step navigation uses immediate scrolling.
- Restart confirmation clears this prototype's test record and returns to the
  brief. Test-generated records were reset before handing the preview over.

Production source, build, navigation, advertising, SEO, and deployment were not
changed. Background preview binds only to 127.0.0.1:4191.
# Three-case expansion — 2026-10-12

- Initially the practice hub used `/` and `/zh/`; after homepage integration it uses `/labs/` and `/zh/labs/`. Original agent-adapter exercise remains at `/review/` and `/zh/review/` with its storage key preserved.
- 42 fixed golden cases, 600 seeded random independent-oracle comparisons, 8 targeted mutations, input immutability and experiment comparison checks all passed.
- Browser: real Pyodide execution. Maze starter 6/16, partial 13/16, reference 16/16; load balancer 4/13, partial 9/13, reference 13/13; canvas 10/16, partial 11/16, reference 16/16. Each total includes the saved browser-created counterexample.
- Inspected maze coordinates/walls/portal labels, scheduling intervals and assigned IDs, canvas actual/expected positions and undo/redo depths.
- Verified original input failing vs contract output, adding custom input to regression, code edits invalidating results, bilingual draft/completion persistence, independent exercise storage and confirmed restart.
- Verified automatic 15-second timeout, manual stop, and successful execution after worker replacement.
- At 320 px viewport: measured document width 305 px including the scrollbar and scroll width 305 px for the code workbench and brief; no page-level horizontal overflow. Restored desktop viewport after testing.
- Browser error/warning logs empty at inspection. Cleared only agent-created records for the three new exercises through their restart UI; original exercise progress untouched.
- Remains local only; production source/build/SEO/ads/deployment unchanged.

## Homepage integration — 2026-10-12

- Normal build succeeds: 532 bilingual routes. Homepage entry is composed only
  by the local preview server; static output is unchanged.
- Integration test verifies both homepage entries, introduction before exercises,
  official source links, navigation back to hub/home, ordinary site assets and
  inaccessible source files. Homepage title, meta tags and canonical/alternate
  links exactly match the built page.
- Both original exercise and three-scenario checks passed again: 18 + 42 fixed
  cases, 600 independent-oracle comparisons and 8 targeted mutations.
- Browser verified Chinese homepage → module, English language switch,
  load-balancer exercise → directory, and directory → real homepage.
- Inspected module and homepage entry at 375 px using the visible preview;
  entry stacks neatly and source links wrap. Desktop viewport restored.


## Release verification — 2026-10-13

- Migrated the reviewed prototype to src/labs and integrated ten EN/ZH routes
  into the static build. Kept the small purple homepage entry and grouped catalog.
- Numeric checks: 60 goldens, 600 independent-oracle random cases, eight targeted
  mutations, nine agent counterexample comparisons; input validation and immutability.
- npm run check passed for the root-domain build: 542 index routes, 544 descriptions,
  existing 100-exercise judge, visual lessons, links, SEO, policies and ad placement.
- Both root-domain and /website/ builds pass lab release tests; runtime imports
  resolve relative to the shipped asset directory. Local integration routes pass.
- Browser release build: maze counterexample -1 vs 2, saved as regression input;
  reference passes 16/16 including that input; EN switch retains code and pass state.
  Load balancer reference passes 12/12; canvas reference passes 15/15.
- Source claims remain explicitly unverified network accounts and original adaptations.
  Removed preview-only labels from release output; added localized descriptions,
  canonical/hreflang and policy links. Reused the existing AdSense code unchanged.
- Agent workbench browser check: reference patch passes all 18/18 regression cases.
