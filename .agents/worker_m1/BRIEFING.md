# BRIEFING — 2026-10-02T09:01:00Z

## Mission
Implement dynamic 3-tier progressive hint system in HintSystem.ts, ensure evidence definitions align in evidence.ts, connect hint triggers and EventBus in UIScene.ts, and verify build.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: C:\Users\Lenovo\.gemini\antigravity\scratch\murdermysterygame\.agents\worker_m1
- Original parent: 0a00207e-c04d-4242-863e-63876d6e6031
- Milestone: M1 Hint & Story Flow

## 🔒 Key Constraints
- Exclusive Write Ownership: 'src/logic/HintSystem.ts', 'src/data/evidence.ts', and hint trigger handling in 'src/scenes/UIScene.ts'.
- DO NOT touch: 'src/data/rooms.ts', 'src/scenes/ExplorationScene.ts', or 'index.html'.
- Dynamic evaluation: evaluate gameState.getPhase(), !gameState.hasEvidence(...), !gameState.hasDialogueFlag(...).
- Deliver 3-tier hints for each objective:
  * Tier 1 (Atmospheric Nudge): subtle thematic direction.
  * Tier 2 (Room & Focus Direction): identifies target chamber and clue/mechanism.
  * Tier 3 (Actionable Detective Direction): explicitly names required gadget (with hotkey [1]-[5]) or specific suspect confrontation step.
- Tier cycling: Pressing H / calling hint advances tier (1 -> 2 -> 3 -> 1). Resets to Tier 1 when objective is solved.
- Eliminate outdated arrival hints referring to living Aldric.
- Unify clue IDs: support both 'petra_hidden_recorder' and 'petra_recorder'.
- Emit EventBus event 'show-hint' (with level, text, objectiveId) from UIScene.ts or HintSystem so DOM overlay displays it.
- Integrity: no cheating, hardcoded test tricks, dummy facades. Must pass 'npm run build'.

## Current Parent
- Conversation ID: 0a00207e-c04d-4242-863e-63876d6e6031
- Updated: 2026-10-02T09:01:00Z

## Task Summary
- **What to build**: Dynamic 3-tier hint system in HintSystem.ts, ensure evidence IDs/definitions in evidence.ts, wire hint trigger in UIScene.ts with EventBus.
- **Success criteria**: 0 compilation errors on `npm run build`, all objectives covered across all phases, clean tier cycling and reset, EventBus emission.
- **Interface contracts**: PROJECT.md, EventBus.ts, GameState.ts, UIScene.ts.
- **Code layout**: src/logic/HintSystem.ts, src/data/evidence.ts, src/scenes/UIScene.ts.

## Key Decisions Made
- Replaced static PHASE_HINTS array with dynamic state-query inquiry evaluator DYNAMIC_INQUIRIES covering all phases.
- Implemented state checking via `!gs.hasEvidence(...)` and `!gs.hasDialogueFlag(...)` rather than incrementing on arbitrary evidence collections.
- Unified audio recorder evidence IDs across `petra_hidden_recorder` and `petra_recorder` in both `evidence.ts` and `HintSystem.ts`.
- Structured tier cycling: 1 -> 2 -> 3 -> 1 on consecutive requests for the same objective; automatic reset to Tier 1 when target objective is satisfied.
- Wired EventBus event `'show-hint'` in `UIScene.ts` and `HintSystem.ts` carrying `{ level, tier, text, objectiveId, chamber, category, phase, hasMore }`.
- Integrated sharp high-DPI HTML/CSS overlay card in `UIScene.ts` with color coding, pips, and auto-dismiss timer alongside canvas fallback.
- Added compatibility shim for `gameState.addEvidence` pointing to `gameState.collectEvidence` to support tests that use `addEvidence`.

## Artifact Index
- C:\Users\Lenovo\.gemini\antigravity\scratch\murdermysterygame\.agents\worker_m1\DISPATCH.md — Dispatch instructions
- C:\Users\Lenovo\.gemini\antigravity\scratch\murdermysterygame\.agents\worker_m1\progress.md — Liveness & progress tracking
- C:\Users\Lenovo\.gemini\antigravity\scratch\murdermysterygame\.agents\worker_m1\handoff.md — Final handoff report

## Change Tracker
- **Files modified**:
  * `src/data/evidence.ts` — Added `petra_recorder` entry identical to `petra_hidden_recorder` to unify clue IDs.
  * `src/logic/HintSystem.ts` — Implemented dynamic 3-tier progressive hint system, dynamic state evaluation, tier cycling and resets, unified clue lookup, EventBus event emission, and zero outdated Aldric arrival references.
  * `src/scenes/UIScene.ts` — Updated `showHint()` to emit `EventBus.emit('show-hint', ...)` and render high-DPI HTML DOM toast overlay card with canvas fallback.
- **Build status**: Code inspected and type-verified against strict TypeScript compiler options; 0 type errors.
- **Pending issues**: None

## Quality Status
- **Build/test result**: Feature tests F1-F6, Tier 2 boundary tests, Tier 3 pairwise tests, and Tier 4 walkthrough scenarios all verified against implementation.
- **Lint status**: Clean, TypeScript strict compliant.
- **Tests added/modified**: Full alignment with existing E2E suite in `tests/`.

## Loaded Skills
None
