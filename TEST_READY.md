# TEST_READY: The Thirteenth Chime Automated E2E Test Suite

**Published By**: E2E Test Track (`test_writer_1`)  
**Timestamp**: 2026-10-02T15:28:00+06:30  
**Status**: TEST SUITE COMPLETE & READY FOR INTEGRATION GATING  
**Integrity Mode**: Development / Pre-Overhaul Baseline Established  

---

## 1. Test Runner Command

The test suite is fully automated and can be executed with a single command from the project root:

```bash
npx tsx tests/run_all.ts
```

Alternatively via npm script:
```bash
npm test
```

For strict CI/CD gate mode (exits with code `1` if any test fails):
```bash
npx tsx tests/run_all.ts --strict
```

---

## 2. Test Architecture & Files Created

| File | Tier Scope | Features Covered | Test Count | Description |
|------|------------|------------------|:----------:|-------------|
| `tests/framework.ts` | Infra | All | N/A | Lightweight, zero-dependency test engine with browser shims, rich assertions (`expect`), lifecycle hooks, and Tier/Feature reporting. |
| `tests/tier1_features.test.ts` | Tier 1 | F1 – F15 | 75 | Primary feature coverage (≥5 test cases per feature for hint system tiers, phase tracking, room coordinates, deadbolt isolation, unblocked lanes, DOM overlay structure, build checks). |
| `tests/tier2_boundary.test.ts` | Tier 2 | F1, F2, F6, F7, F9 | 25 | Boundary & corner cases: missing clue permutations, rapid tier cycling (1->2->3->1), reset on clue discovery, edge coordinate distances for deadbolt vs doorway trigger zones, wall bounds, zero outdated Aldric hints. |
| `tests/tier3_pairwise.test.ts` | Tier 3 | F1, F4, F5, F7, F12 | 19 | Pairwise & cross-feature interactions: hint progression x clue collection, room transitions x interactables, UI EventBus payloads, phase progression x deduction engine, gadget equipment x evidence acquisition. |
| `tests/tier4_scenarios.test.ts` | Tier 4 | F1, F5, F7, F13, F14 | 5 | 5 realistic end-to-end application workloads: full Investigation 1 locked room sequence, Exhibition deadbolt approach without door trigger, Investigation 2 clue search, Final confrontation accusation, Typography/DOM overlay verification. |
| `tests/run_all.ts` | Runner | All (T1–T4) | 124 Total | Master test runner orchestrating all test suites with structured breakdown and defect diagnostic logging. |
| `tests/tsconfig.json` | Config | All | N/A | TypeScript configuration for test files. |
| `tests/README.md` | Docs | All | N/A | Documentation on test layout, philosophy, and commands. |

**Total Automated Test Cases**: **124**

---

## 3. Coverage Summary Per Tier

| Tier | Name | Target Threshold | Actual Tests | Baseline Status | Milestone Dependency |
|:----:|------|:----------------:|:------------:|:---------------:|:--------------------|
| **Tier 1** | Feature Coverage | ≥5 per feature (≥75) | **75** | 56 Passed / 19 Known Defects | M1 (Hints), M2 (Layout), M3 (UI) |
| **Tier 2** | Boundary & Corner Cases | ≥5 per category (≥25) | **25** | 19 Passed / 6 Known Defects | M1, M2 |
| **Tier 3** | Pairwise & Cross-Feature | Pairwise coverage (≥15) | **19** | 16 Passed / 3 Known Defects | M1, M2, M3 |
| **Tier 4** | Real-World Scenarios | ≥5 Scenarios | **5** | 4 Passed / 1 Known Defect | M2, M3 |
| **Total** | **Full Suite** | **Comprehensive** | **124** | **95 Passed / 29 Known Defects** | **M4 Integration Gate** |

---

## 4. Feature Checklist (F1 to F15)

| Feature | Description | Milestone Owner | Tests | Baseline Status | Implementation Defects to Resolve |
|:-------:|-------------|:---------------:|:-----:|:---------------:|-----------------------------------|
| **F1** | Dynamic Missing Clue Evaluation | M1 | 14 | **DEFECTS FOUND** | Blind index increment on irrelevant evidence; lacks missing clue evaluation for `connecting_door` / `hugo_fingerprints` / `rain_sensor_data`. |
| **F2** | Tier 1 Atmospheric Nudge | M1 | 6 | **PASS / AUDITED** | Baseline strings present; needs dynamic coupling with F1. |
| **F3** | Tier 2 Room & Focus Direction | M1 | 5 | **PASS / AUDITED** | Level 2 direction strings present. |
| **F4** | Tier 3 Actionable Detective Direction | M1 | 8 | **PASS / AUDITED** | Explicit gadget hotkeys [1]-[5] present. |
| **F5** | Phase-Aware Hint Progression | M1 | 10 | **PASS / AUDITED** | Phase registry covers all 5 story phases. |
| **F6** | Elimination of Outdated Hints | M1 | 10 | **DEFECTS FOUND** | `HintSystem.ts:14` contains obsolete `Professor Aldric is near the podium` hint in `arrival` phase. |
| **F7** | Exhibition Chamber Deadbolt Isolation | M2 | 13 | **DEFECTS FOUND** | `door_bolt` placed at `(12, 1)` / `(192, 16)` coinciding with Main Hall exit trigger; must be moved to `(9, 4)` / `(144, 64)` with tightened door triggers. |
| **F8** | Unblocked Doorways & Walking Lanes | M2 | 7 | **DEFECTS FOUND** | Armchair in Main Hall at `(128, 80)` blocks spawn point; Library 4px pinch between desk and armchairs at `(176, 242)`. |
| **F9** | Top-Wall Clue Clearance | M2 | 9 | **DEFECTS FOUND** | `potted_plant` (y:2), `deck_sensors` (y:2), `dark_corner` (y:3) placed inside/touching top wall collider (Y < 48). Must move to y >= 5. |
| **F10** | Visual Depth & Z-Ordering Polish | M2 | 6 | **DEFECTS FOUND** | `playerShadow` depth not updated dynamically in `update()`; `pendulum` missing from obstacle colliders in `ExplorationScene.ts`. |
| **F11** | Clue Gleam & Feedback Polish | M2 | 5 | **PASS / AUDITED** | Gleam triggers and discovery audio present. |
| **F12** | High-DPI HTML/CSS Overlay Toasts & Cards | M3 | 7 | **DEFECTS FOUND** | `#discovery-modal`, `#hint-overlay`, `#game-toast`, `#interaction-prompt-container` missing from DOM `#ui-overlay` in `index.html`. |
| **F13** | High-Definition Typography System | M3 | 7 | **DEFECTS FOUND** | `index.html` body uses monospaced `'Courier New'` rather than crisp vector sans-serif. |
| **F14** | Dialogue & Choice Typography Polish | M3 | 8 | **DEFECTS FOUND** | `.dialogue-choice` styles hardcode `'Courier New'` font; choices lack modern sans-serif typography. |
| **F15** | Comprehensive E2E Verification & Typecheck | M4 | 9 | **PASS / AUDITED** | `package.json`, `tsconfig.json`, phases, rooms, and evidence catalogs pass full schema verification. |

---

## 5. Baseline Defect Escalation Report

The automated test run against the current baseline codebase identifies **29 specific defects** that must be resolved by the upcoming milestones:

### For Milestone M1 (Hint System Worker):
1. **Outdated Aldric Hint (F6)**: In `src/logic/HintSystem.ts:14`, delete the legacy `arrival` phase hint referring to living Aldric.
2. **Dynamic Missing Clue Engine (F1)**: Overhaul `HintSystem.ts` to inspect `!gameState.hasEvidence(...)` and `!gameState.hasDialogueFlag(...)` in `investigation_1`, `midpoint_reversal`, `investigation_2`, `reconstruction`, and `final_confrontation`.
3. **Eliminate Blind Index Progression (F1)**: Remove unconditional `advanceHintIndex()` triggers on `evidenceCollected` and `flagSet`.
4. **Tier Cycling & Reset (F2–F4, Tier 2)**: Implement `cycleTier()` cycling 1 ➔ 2 ➔ 3 ➔ 1 and reset hint level to 1 whenever an objective is satisfied.

### For Milestone M2 (Room Layouts & Collision Worker):
1. **Exhibition Chamber Deadbolt (F7)**: In `src/data/rooms.ts:58`, move `door_bolt` from `(12, 1)` to `{ x: 9, y: 4, width: 2, height: 1 }`.
2. **Doorway Trigger Zones (F7)**: In `src/scenes/ExplorationScene.ts:159`, tighten doorway trigger zones so door threshold does not reach into deadbolt interaction radius.
3. **Main Hall Armchair (F8)**: In `src/scenes/ExplorationScene.ts:796`, move armchair away from `TILE * 8` (`128, 80`) to unblock Exhibition Chamber exit spawn.
4. **Library Walkway Clearance (F8)**: In `src/scenes/ExplorationScene.ts:810-811`, adjust armchair placement to eliminate 4px bottleneck south of archive desk.
5. **Top-Wall Clue Clearance (F9)**: In `src/data/rooms.ts`:
   - `potted_plant` (Library): move from `y: 2` to `y: 6` (`Y = 96`).
   - `deck_sensors` (Observation Deck): move from `y: 2` to `y: 6` (`Y = 96`).
   - `dark_corner` (Clockwork Gallery): move from `y: 3` to `y: 5` (`Y = 80`).
6. **Dynamic Shadow Depth & Pendulum Collider (F10)**:
   - In `ExplorationScene.ts:423`, add `this.playerShadow.setDepth(this.player.y - 1);` in `update()`.
   - In `ExplorationScene.ts:980`, add `'pendulum'` to obstacle colliders list.

### For Milestone M3 (HD Typography & UI Overlays Worker):
1. **DOM Overlay Cards (F12)**: In `index.html`, add `#discovery-modal`, `#hint-overlay`, `#game-toast`, and `#interaction-prompt-container` inside `#ui-overlay`.
2. **EventBus Decoupling (F12)**: Connect `ExplorationScene` and `UIScene` to emit `'show-discovery'`, `'show-msg'`, `'show-hint'`, and `'update-prompt'` to the DOM overlay.
3. **Vector Typography System (F13, F14)**:
   - Change `body, html` font stack in `index.html` from `'Courier New', monospace` to modern system sans-serif (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
   - Upgrade `.dialogue-choice` font stack to clean sans-serif.
   - Preserve Georgia serif for `#dialogue-text` and narrative lore.

---

## 6. How Downstream Milestone Workers Verify Their Code

When M1, M2, or M3 workers complete their changes, they can run:
```bash
npx tsx tests/run_all.ts
```
Their respective feature tests will turn from `[DEFECTS FOUND]` to `[PASS]`.
When M4 runs the suite, all 124 tests will pass with 100% success rate, clearing the gate for final release.
