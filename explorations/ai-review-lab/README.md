# AI-assisted coding interview lab

Released source lives in src/labs/. scripts/build-labs.mjs publishes the bilingual
hub and four workbenches through the normal static build. The homepage keeps the
compact purple experimental entry below its three learning paths.

Build: node scripts/build.mjs
Tests: node scripts/test-labs.mjs (also included in npm run check)
Exact release preview: node scripts/serve.mjs
Prototype server: node explorations/ai-review-lab/serve.mjs

Chinese directory: /zh/labs/; English directory: /labs/.
Categories: comprehension/debugging (maze), AI code review (load balancer and
agent adapter), feature iteration (canvas undo/redo). Catalog grouping and counts
come from src/labs/practice-catalog.mjs, so future exercises join their type.

Company tags refer to unverified public interview accounts. These are original
teaching adaptations, not official questions or company endorsements. Source
links and adaptation limits appear on the hub and each workbench. Canva undo/redo
is our own extension. The agent adapter is an original JSON-RPC-based exercise.

Verification includes 60 fixed cases, 600 deterministic random comparisons to
independent oracles, eight targeted mutations, nine agent counterexample checks,
input validation and immutability. Release tests cover ten bilingual lab pages,
category grouping, portable runtime URLs, metadata, policy links and styling.

Python runs in the existing browser Worker. AI suggestions are prepared teaching
examples and use no live model API. Existing versioned local draft keys are
preserved. Languages share an exercise record; exercises remain independent.
Tests and reference implementations are inspectable. Completion is a personal
learning record, not a certified score or hiring assessment.

The prototype server binds only to loopback, adds noindex headers and serves
allowlisted assets plus contained static build output. Repository files are not
served. Production pages use translated metadata, canonical/hreflang and policy
links. The existing production AdSense integration is reused unchanged.
