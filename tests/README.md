# The Thirteenth Chime — Automated E2E Test Suite

## Overview
This automated end-to-end testing track validates all narrative, room spatial, collision, UI, typography, and state progression systems across all four test tiers defined in `TEST_INFRA.md` and `PROJECT.md`.

## Execution Commands

### Primary Test Runner:
```bash
npx tsx tests/run_all.ts
```
or
```bash
npm test
```

### Strict CI / Gate Mode (exits 1 on any failure):
```bash
npx tsx tests/run_all.ts --strict
```

## Structure
- `tests/framework.ts`: Zero-dependency test engine with browser shims, rich assertions (`expect`), lifecycle runners, and tier/feature reporting.
- `tests/tier1_features.test.ts`: Tier 1 Feature Coverage (>=5 test cases per feature for F1 through F15, total 75 tests).
- `tests/tier2_boundary.test.ts`: Tier 2 Boundary & Corner Cases (missing clue permutations, rapid tier cycling, reset on discovery, edge coordinate distances, wall bounds, zero outdated Aldric hints).
- `tests/tier3_pairwise.test.ts`: Tier 3 Pairwise & Cross-Feature Interactions (hint progression x clue collection, room transitions x interactables, UI EventBus payloads, phase progression x deduction engine, gadget equipment x evidence acquisition).
- `tests/tier4_scenarios.test.ts`: Tier 4 Real-World Application Scenarios (5 realistic workloads: Investigation 1 locked room progression, Exhibition deadbolt approach without door trigger, Investigation 2 clue search, Final confrontation accusation, Typography/DOM overlay verification).
- `tests/run_all.ts`: Master test runner executing all suites and outputting comprehensive diagnostics.

## Features Covered (F1 - F15)
- **F1**: Dynamic Missing Clue Evaluation
- **F2**: Tier 1 Atmospheric Nudge
- **F3**: Tier 2 Room & Focus Direction
- **F4**: Tier 3 Actionable Detective Direction
- **F5**: Phase-Aware Hint Progression
- **F6**: Elimination of Outdated Hints
- **F7**: Exhibition Chamber Deadbolt Isolation
- **F8**: Unblocked Doorways & Walking Lanes
- **F9**: Top-Wall Clue Clearance
- **F10**: Visual Depth & Z-Ordering Polish
- **F11**: Clue Gleam & Feedback Polish
- **F12**: High-DPI HTML/CSS Overlay Toasts & Cards
- **F13**: High-Definition Typography System
- **F14**: Dialogue & Choice Typography Polish
- **F15**: Comprehensive E2E Verification & Typecheck
