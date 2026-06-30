# Dependency Maintenance Report — bg-remove

**Date:** 2026-06-30
**Repo:** michielvha/bg-remove (single-repo topology)
**Open bot PRs:** 10 (all `app/renovate`)
**Scope this run:** `bg-remove` (pre-authorized target; no merge/branch action pre-authorized — analyze-first-then-ask holds)

## Constitution status

No `vega.yaml` present. All context below is **discovered read-only**; inferences are flagged as assumptions.

| Aspect | Source | Value |
|---|---|---|
| Language / type-check | package.json | TypeScript, `tsc && vite build` |
| Lint | package.json | `eslint . --max-warnings 0` |
| Build | package.json | `vite build` |
| Test | — | *(none defined — assumption: no unit/E2E suite)* |
| Source roots | discovered | `src/` (5 files) |
| Topology | discovered | single repo, no synced/mirror paths |
| CI | .github/workflows/ci.yml | runs on `push: main` + `workflow_dispatch` — **NOT on `pull_request`** |
| Branch protection | discovered | none evident (solo repo); **assumption: not review-gated, but validate locally before merge** |
| AI-trailer policy | global memory | **No Co-Authored-By / AI attribution** in commits or PRs |
| Report location | inferred | `docs/maintenance/` (assumption) |

> ⚠️ **Validation caveat:** CI does not trigger on PRs. Green-CI-on-PR does not exist here. Every bump must be validated locally with `npm ci && npm run lint && npm run build` before merge.

## All 10 PRs at a glance

| PR | Package | Current → Target | Class | Lane |
|---|---|---|---|---|
| #1 | @eslint/js | 9.39.2 → 9.39.4 | patch | routine |
| #2 | eslint | 9.39.2 → 9.39.4 | patch | routine |
| #3 | vite | 7.3.0 → 7.3.6 | patch | routine |
| #5 | typescript-eslint | 8.51.0 → 8.62.0 | minor | routine **(linchpin)** |
| #4 | lucide | 0.460.0 → 0.577.0 | minor (0.x) | routine *(subset of #9)* |
| #6 | @eslint/js | 9.39.2 → 10.0.1 | **major** | backlog (with #7) |
| #7 | eslint | 9.39.2 → 10.6.0 | **major** | backlog (with #6) |
| #8 | vite | 7.3.0 → 8.1.0 | **major** | backlog |
| #9 | lucide | 0.460.0 → 1.21.0 | **major** | backlog *(supersets #4)* |
| #10 | typescript | 5.9.3 → 6.0.3 | **major** | backlog |

## Changelog-grounded analysis

### Routine batch — patch/minor, in-range, low risk

- **#1 + #2 (@eslint/js + eslint → 9.39.4):** patch, version-lockstep pair, no rule/API changes. Move together.
- **#3 (vite → 7.3.6):** patch, no behavioral change.
- **#5 (typescript-eslint → 8.62.0):** minor. **Linchpin.** Installed 8.51.0 peers cap at `typescript <6.0.0` and `eslint ^8||^9` (no v10). 8.62.0 widens to `typescript <6.1.0` and `eslint ^10.0.0`. Merging this first unblocks both majors below.
- **#4 (lucide → 0.577.0):** minor within 0.x. **Subset of #9 (lucide v1).** If you intend to take lucide v1 this cycle, **skip/close #4** — v1 supersets it. If deferring v1, take #4 in the batch.

**Consumer-code impact of routine batch: none.** No removed/renamed/deprecated symbol in use.

### Major backlog — one branch each, one at a time

**#9 — lucide 0.460.0 → 1.21.0** · *consumer impact: NONE (verified)*
Consumer uses `createIcons({ icons: {...} })`, the named exports `Image/Moon/Sun/Download/Upload/X`, and `data-lucide="…"`. All unchanged in v1. v1's breaking changes (brand icons removed, UMD build dropped, some unrelated icon renames like `XCircle`→`CircleX`) do not touch any symbol this app imports. Cleanest major. Supersets #4.
Source: lucide v1 release notes & migration guide.

**#8 — vite 7.3.0 → 8.1.0** · *consumer impact: NONE*
Node 24 satisfies v8's `>=20.19 || >=22.12`. `defineConfig`, `server.port`, and `vite/client` types unchanged. Rolldown+Oxc build swap is transparent for a no-plugin static SPA. Build-target baseline rises (Chrome 111+); acceptable for this app. `verbatimModuleSyntax: true` already supersedes the new `isolatedModules` guidance — no tsconfig change needed.
Source: Vite 8 migration guide.

**#10 — typescript 5.9.3 → 6.0.3** · *consumer impact: NONE expected; coupling with #5*
TS 6.0's notable default flip is `types: []` (was auto-enumerate) — but this tsconfig **already pins `"types": ["vite/client"]`**, so unaffected. `noUncheckedSideEffectImports` (new default) is **already set true** here. None of the removed flags (`es5`, `outFile`, `node10`, classic resolution, etc.) are in use. Node engine unchanged.
**Coupling:** requires typescript-eslint that supports TS 6.0 → bundle **#5** into (or merge before) this branch, else `tseslint` emits an out-of-range warning.

**#6 + #7 — eslint + @eslint/js → 10.x** · *consumer impact: LOW, must lint-verify; lockstep + coupling*
- **Lockstep:** eslint and @eslint/js ship as one unit; #6 and #7 must land **together on one branch**.
- **Coupling:** eslint 10 peer needs typescript-eslint `^10`-aware → requires **#5** (8.62.0). Installed 8.51.0 does **not** peer-allow eslint 10.
- Flat config already in use (no eslintrc migration). Node 24 ok.
- **New `eslint:recommended` rules** in v10: `no-unassigned-vars`, `no-useless-assignment`, `preserve-caught-error` — these run under `--max-warnings 0`. Static pre-scan of `src/` shows **no triggers** (the single `catch` only logs; guard `throw`s aren't re-throws; `let styleAdded` is assigned+read). **Verdict: expected clean, but confirm with an actual `npm run lint` on the branch before merge.**
Source: ESLint v10 migration guide & release notes; typescript-eslint dependency-versions.

## Recommended sequencing

1. **Routine batch** (one branch): #1, #2, #3, #5 — and **#4 only if deferring lucide v1**.
2. **Majors, one branch each, in this order** (least → most consumer risk):
   1. #9 lucide v1 (supersedes #4)
   2. #8 vite 8
   3. #10 typescript 6 *(include #5 if not already merged)*
   4. #6+#7 eslint 10 *(combined; requires #5)*

Each major branch validated with `npm ci && npm run lint && npm run build` before hand-off/merge.

## Notes / assumptions to confirm

- No test suite defined; "validate" = lint + type-check + build only.
- Report location `docs/maintenance/` assumed (constitution silent).
- Not review-gated assumed; if you want PR hand-off instead of direct merge, say so.
