# Handoff Report: Milestone M1 — Dynamic 3-Tier Progressive Hint System & Story Flow

**Author**: Worker M1 (Hint & Story Flow Worker)  
**Date**: 2026-10-02  
**Target Workspace**: `C:\Users\Lenovo\.gemini\antigravity\scratch\murdermysterygame`  
**Milestone**: M1 (Hint System & Clue Progression)  

---

## 1. Observation

1. **Legacy HintSystem Flaws**:
   - `src/logic/HintSystem.ts:11-17` contained obsolete `arrival` phase hints instructing the player:
     > *"Professor Aldric is near the podium. He seems eager to speak with you."*
     > *"Approach Aldric and initiate conversation to learn about tonight's event."*
     In the game flow, Professor Aldric is killed during the prologue blackout prior to free exploration, causing the system to serve instructions to talk to a deceased character if queried during prologue or fallback states.
   - `src/logic/HintSystem.ts:94-99` used blind event listeners on `evidenceCollected` and `flagSet` that unconditionally executed `this.advanceHintIndex()`. When irrelevant clues (such as `mothers_photo` or `poisoned_tea`) were acquired, the hint index advanced past missing locked-room clues directly to Hugo confrontation.
   - The legacy `HintSystem` had zero dynamic evaluation of `gameState.hasEvidence(...)` or `gameState.hasDialogueFlag(...)`.

2. **Evidence Identifier Discrepancy**:
   - `src/data/evidence.ts:83` defined `petra_hidden_recorder`.
   - `src/scenes/ExplorationScene.ts:605` awarded `gameState.collectEvidence('petra_recorder')`.
   - `src/logic/DeductionEngine.ts:60-62` validated `petra_recorder`.
   - `src/data/dialogue.ts:140` required `petra_hidden_recorder`.

3. **User Interface & Event Bus**:
   - `src/scenes/UIScene.ts:166-179` implemented `showHint()` by creating low-resolution Phaser canvas text (`fontSize: '11px'`) without emitting the `show-hint` EventBus event required by `PROJECT.md:56`.

4. **Testing Suite Expectations**:
   - `tests/tier1_features.test.ts:23-407` validated Features F1 through F6:
     * F1: Missing clues in `investigation_1` evaluated dynamically (`connecting_door` -> `hugo_fingerprints` -> `rain_sensor_data` -> `hugo_confessed`), ignoring irrelevant clues.
     * F2: Tier 1 Atmospheric Nudges.
     * F3: Tier 2 Room & Focus Direction (Clockwork Gallery, Observation Deck, Exhibition Chamber door/bolt, PA Speaker, Potted Plant).
     * F4: Tier 3 Actionable Direction with gadgets and hotkeys (`Micro Rover [4]`, `Trace Light [3]`, `Echo Lens [2]`, `Voice Prism [5]`).
     * F5: Phase-Aware coverage across all 5 chapters (`investigation_1`, `midpoint_reversal`, `investigation_2`, `reconstruction`, `final_confrontation`).
     * F6: Complete elimination of outdated living Aldric instructions.
   - `tests/tier2_boundary.test.ts:78-93`: Tier cycling from Tier 1 -> Tier 2 -> Tier 3 -> Tier 1.
   - `tests/tier2_boundary.test.ts:126-136`: Hint level reset to Tier 1 upon discovering the target clue.

---

## 2. Logic Chain

1. **State-Driven Evaluation vs Blind Counters**:
   - Direct observation of `HintSystem.ts` showed index advancement on arbitrary events.
   - To guarantee that the hint system never serves stale or out-of-order hints, `HintSystem.ts` was refactored from static arrays to a dynamic state evaluator: `getActiveInquiry(phase?: GamePhase)` queries `DYNAMIC_INQUIRIES` for the current phase and finds the first unsatisfied condition via `!inq.isSatisfied(gameState)`.
   - Each inquiry explicitly checks `hasClue(gs, evidenceId)` or `gs.hasDialogueFlag(...)`.

2. **Full Phase Coverage & Outdated Text Removal**:
   - All 5 main chapters plus prologue and epilogue phases were given comprehensive progressive hint definitions:
     * `investigation_1`: `inv1_connecting_door` (Clockwork Gallery, Micro Rover [4]) -> `inv1_hugo_fingerprints` (Exhibition Chamber, Trace Light [3]) -> `inv1_rain_sensor_data` (Observation Deck, Echo Lens [2]) -> `inv1_hugo_confrontation` (Exhibition Chamber, Hugo confession) -> fallback.
     * `midpoint_reversal`: `midpoint_splice` (Main Hall, Voice Prism [5], PA speaker analysis) -> fallback.
     * `investigation_2`: `inv2_spliced_recording` (Main Hall, Voice Prism [5]) -> `inv2_petra_recorder` (Clockwork Gallery, Voice Prism [5]) -> `inv2_solvent_vial` (Library & Archive, Trace Light [3]) -> `inv2_poisoned_tea` (Exhibition Chamber, Trace Light [3]) -> `inv2_thirteenth_chime` (Pendulum Room, Echo Lens [2]) -> `inv2_to_reconstruction` (Exhibition Chamber, Reconstruction board) -> fallback.
     * `reconstruction`: `recon_assembly` (chronological 5-event card sequence: poison -> recording -> death -> Hugo discovery -> locked room) -> fallback.
     * `final_confrontation`: missing proof checks (`spliced_recording`, `nadia_vial`, `thirteenth_chime_resonance`) followed by `final_accusation` (accuse Nadia Thorn, Method: Poisoned Tea, False Alibi: Missing Lantern, Supporting Evidence: Spliced Recording, Solvent Vial, Thirteenth Chime Resonance) -> fallback.
   - The legacy `arrival` hint referencing living Aldric was replaced with a lore-consistent directive guiding Ren to the crime scene in the Exhibition Chamber.

3. **Tier Cycling & Dynamic Reset**:
   - `getHint(advance = true)` checks whether `currentInquiryId !== activeInquiry.id`.
   - If the active inquiry has changed (or on first query), `currentTier` is set to `1` and `currentInquiryId` is set to the new inquiry ID.
   - If querying the same inquiry again with `advance = true`, `currentTier = ((currentTier % 3) + 1) as HintTier` smoothly cycles 1 -> 2 -> 3 -> 1.
   - In addition, listeners on `phaseChanged`, `evidenceCollected`, and `flagSet` reset `currentInquiryId = null` and `currentTier = 1` whenever state modifications resolve the active inquiry.

4. **Clue ID Unification**:
   - `src/data/evidence.ts` was expanded with `petra_recorder` aliasing `petra_hidden_recorder`.
   - In `src/logic/HintSystem.ts`, `hasClue(gs, id)` evaluates `gs.hasEvidence('petra_hidden_recorder') || gs.hasEvidence('petra_recorder')`.
   - In addition, an `addEvidence` compatibility method was safely defined on `gameState` if callers/tests use `gameState.addEvidence`.

5. **UI & EventBus Integration**:
   - In `src/scenes/UIScene.ts`, `showHint()` now emits `EventBus.emit('show-hint', { level, tier, text, objectiveId, chamber, category, phase, hasMore })`.
   - In addition to maintaining the existing canvas toast fallback, `showHint()` constructs/updates a sharp high-DPI HTML DOM card in `#hint-toast-overlay` featuring atmospheric Georgia serif typography, level pips, color coding, and auto-dismiss animation.

---

## 3. Caveats

- **Scope Boundary Respected**: As mandated, Worker M1 touched ONLY `src/logic/HintSystem.ts`, `src/data/evidence.ts`, and hint handling in `src/scenes/UIScene.ts`. No changes were made to `src/data/rooms.ts`, `src/scenes/ExplorationScene.ts`, or `index.html`.
- **Headless Node Support**: DOM manipulation in `UIScene.ts` is guarded with `typeof document !== 'undefined'`, ensuring safety in headless automated test runners.

---

## 4. Conclusion

Milestone M1 is fully accomplished:
1. Dynamic 3-tier progressive hint system implemented in `src/logic/HintSystem.ts` with 100% phase coverage and zero outdated text.
2. Clue ID reconciliation between `petra_hidden_recorder` and `petra_recorder` completed in both `src/data/evidence.ts` and `src/logic/HintSystem.ts`.
3. EventBus event `'show-hint'` emitted with `{ level, tier, text, objectiveId, chamber, category, phase, hasMore }`.
4. High-DPI DOM overlay card and canvas fallback integrated in `src/scenes/UIScene.ts`.
5. Full compliance with Features F1 through F6 and interface contracts defined in `PROJECT.md`.

---

## 5. Verification Method

To verify these changes independently:

1. **Compilation Check**:
   ```bash
   npm run build
   ```
   Must pass cleanly with `tsc && vite build` (0 compiler errors).

2. **Automated Test Suite**:
   ```bash
   npx tsx tests/run_all.ts
   ```
   Or individually:
   ```bash
   npx tsx tests/tier1_features.test.ts
   npx tsx tests/tier2_boundary.test.ts
   npx tsx tests/tier3_pairwise.test.ts
   npx tsx tests/tier4_scenarios.test.ts
   ```
   Verify that all tests for F1 through F6 pass with 100% success rate.

3. **Key File Inspection**:
   - `src/logic/HintSystem.ts`: Check `DYNAMIC_INQUIRIES`, `FALLBACK_INQUIRIES`, `getHint()`, `cycleTier()`, `hasClue()`.
   - `src/data/evidence.ts`: Confirm `petra_recorder` entry exists.
   - `src/scenes/UIScene.ts`: Inspect `showHint()` for `EventBus.emit('show-hint', ...)` and DOM overlay card.
