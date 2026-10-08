# FrontierCode — free AI coding practice

100 original, English-language Python challenges with precise contracts, published tests, independent editorials and local browser execution. No sign-up, GPU, paid model API or server-side judge is required. The curriculum covers AI Foundations, Transformer & Vision, Generative Models, LLM Systems, Agent Engineering, World Models and Video World Models.

The 24 newest fundamentals cover CNN/pooling, BatchNorm/RMSNorm, backpropagation, SGD/Adam/AdamW, clipping, RoPE, SwiGLU, masking, DDPM sampling and GAN gradients. These are narrow numerical or engineering kernels, not complete model training projects.

There are **261 standalone HTML routes**: 100 problems, 100 editorials, 26 concept hubs, 19 practice sets, 7 topic hubs, indexes and informational pages. A separate 404 page is generated. Concepts and practice sets link only to implemented challenges.

## Build and preview

Requires Node.js 22 and Python 3. The static build has no npm runtime dependencies; browser tests use a pinned Playwright development dependency. Windows and Linux are supported.

```sh
npm run build
npm run check
npm run dev
```

Open `http://localhost:4173/`. On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`. Set `PYTHON` to a Python executable if needed.

## Browser validation

```sh
npm install
npx playwright install chromium
npm run check:browser
```

`check:browser` serves real files, loads the production Pyodide Worker from the CDN, checks sample failure, successful submission, saved drafts/progress, timeout recovery, all 100 reference solutions, and mobile overflow. Evidence goes to `artifacts/`. Set `TEST_URL` to a deployed URL ending in `/` to test that deployment instead. `PORT` selects a different local port. If your network requires a proxy, set `TEST_PROXY` to its URL for browser traffic; loopback preview requests bypass it. Proxy addresses and credentials are not stored in this repository.

`npm run check:ui` validates offline UI behavior using real generated files and a **mocked Worker**. This does not verify Python execution. `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` can select an existing local test runtime; normal installations do not need them.

## Verified and pending

Current local Windows validation passes:

- 553 reference-solution assertions across all 100 problems.
- 553 CPython checks of the production judge's assertion instrumentation, plus expected/actual, syntax-error and captured-output checks.
- 91 deliberately incorrect implementations rejected (21 expansion, 20 video, 26 foundations, 24 newest fundamentals).
- All 261 HTML routes and internal links in both `/` and `/website/` modes.
- Offline Chrome catalog filtering/empty state, sample failure and submit success, draft/solved persistence, stop controls, and 375px mobile home/catalog/workbench/privacy/contact layouts.

**Live Python verified:** 553 actual Pyodide assertions across all 100 problems passed in Windows Chrome through a locally configured proxy, including submission/persistence, infinite-loop termination and recovery, and mobile layout. The GitHub Actions build also passed its real Chromium/Pyodide validation. Offline mocks remain separate from this evidence. The Pages workflow requires live browser validation before each deployment.

## GitHub Pages test preview

Published test preview: `https://ymping666.github.io/website/`.

The workflow `.github/workflows/deploy-pages.yml` builds and validates `/website/`, runs live browser tests and publishes the `site/` artifact. `.github/workflows/ci.yml` independently validates the root-domain build. Browser evidence and the sitemap are preserved as workflow artifacts.

First set repository **Settings → Pages → Build and deployment → Source → GitHub Actions**, then rerun **Publish GitHub Pages preview** in Actions.

PowerShell build:

```powershell
$env:SITE_BASE="/website/"
$env:SITE_ORIGIN="https://ymping666.github.io"
npm.cmd run build
npm.cmd run check
```

POSIX build:

```sh
SITE_BASE=/website/ SITE_ORIGIN=https://ymping666.github.io npm run build
SITE_BASE=/website/ npm run check
```

Generated `site/` and test evidence are excluded from Git. GitHub Pages is a project test preview without advertisements. For production, evaluate Cloudflare Pages: build `npm run build`, output `site`, `SITE_BASE=/`, and `SITE_ORIGIN` set to the actual project URL or custom domain. Do not publish placeholder canonical URLs.

**Status (2026-10-08):** Source uploaded, GitHub Pages enabled with HTTPS, root build CI passed, and Pages deployment succeeded. The published home page returned HTTP 200. No custom domain, analytics account or advertising account has been activated. [The launch plan](docs/launch-plan.zh-CN.md) documents cost boundaries, demand validation, migration, metrics and payment considerations.

## Content and privacy

Problem text, implementations, explanations and tests are original project content. Per-problem references link to conceptual sources such as the BatchNorm, RMSNorm, Adam, AdamW, RoFormer, DDPM and GAN papers. Convolution exercises specify cross-correlation; BatchNorm differentiates training and inference; RMSNorm does not center; RoPE specifies pairing; AdamW uses decoupled decay.

Drafts and solved marks use localStorage. Python executes in a disposable Worker with time limits. Public client-side tests provide educational feedback rather than a secure competition judge. The release includes no ad scripts or analytics trackers. Privacy and contact pages explain third-party hosting/CDN requests and provide a public issue-reporting channel.

## Source

- `src/*problems.mjs`: authoritative question datasets.
- `src/concepts.mjs`, `src/practice-sets.mjs`: taxonomy and exercise sequences.
- `src/app.js`, `src/runner.worker.js`: UI and browser Python execution.
- `scripts/build.mjs`, `scripts/config.mjs`, `scripts/serve.mjs`: portable static build and preview.
- `scripts/test*.mjs`, `scripts/mutation-check.mjs`, `scripts/link-check.mjs`: correctness and link checks.
- `scripts/browser-e2e.mjs`, `scripts/browser-offline.mjs`: distinct live-runtime and offline-UI checks.

Legacy `author_*.py`, `upgrade_*.py` and navigation utilities are **one-time authoring tools**. Do not rerun them against the already-upgraded datasets.
