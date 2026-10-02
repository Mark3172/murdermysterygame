# Hard Handoff Report: Story & Hint Explorer Survey

**Agent**: Explorer 1 (`explorer_survey_1`)  
**Mission**: Narrative Progression, Clue State Tracing, & 3-Tier Dynamic Hint System Architecture  
**Working Directory**: `C:\Users\Lenovo\.gemini\antigravity\scratch\murdermysterygame\.agents\explorer_survey_1`  
**Date**: 2026-10-02  
**Handoff Type**: Hard (Task Complete)  

---

## 1. Observation

### A. Narrative Phases & State Machine
- `src/logic/GameState.ts:3-18`: Defines 15 game phases:
  ```ts
  export type GamePhase =
    | 'cold_open' | 'opening_title' | 'arrival' | 'announcement' | 'blackout' | 'discovery'
    | 'investigation_1' | 'midpoint_reversal' | 'investigation_2' | 'reconstruction'
    | 'final_confrontation' | 'ending' | 'credits' | 'post_credits' | 'complete';
  ```
- `src/logic/StoryPhaseManager.ts:17-141`: Registers `PHASE_CONFIGS: PhaseConfig[]`.
  - Phase `investigation_1` exit condition (line 78):
    ```ts
    canExit: () => gameState.hasDialogueFlag('hugo_confessed') || 
      (gameState.hasEvidence('connecting_door') && gameState.hasEvidence('hugo_fingerprints') && gameState.hasEvidence('rain_sensor_data')),
    ```
  - Phase `investigation_2` exit condition (line 96):
    ```ts
    canExit: () => gameState.getEvidenceCount() >= 6,
    ```
  - Phase `reconstruction` exit condition (line 104):
    ```ts
    canExit: () => gameState.hasDialogueFlag('reconstruction_complete'),
    ```
  - Phase `final_confrontation` exit condition (line 112):
    ```ts
    canExit: () => gameState.hasDialogueFlag('killer_identified'),
    ```
- `src/scenes/ExplorationScene.ts:57-60`: Automatically forces pre-investigation phases forward to `investigation_1`:
  ```ts
  const curP = gameState.getPhase();
  if (!curP || ['cold_open', 'opening_title', 'arrival', 'announcement', 'blackout', 'discovery'].includes(curP)) {
    gameState.setPhase('investigation_1');
  }
  ```

### B. Clues & State Checks
- `src/data/rooms.ts`:
  - `wall_gap` in `clockwork_gallery` (line 83): evidence `'connecting_door'`, gadget `'micro_rover'`.
  - `door_bolt` in `exhibition_chamber` (line 58): evidence `'hugo_fingerprints'`, gadget `'trace_light'`.
  - `deck_sensors` in `observation_deck` (line 153): evidence `'rain_sensor_data'`, gadget `'echo_lens'`.
  - `pa_speaker` in `main_hall` (line 34): evidence `'spliced_recording'`, gadget `'voice_prism'`.
  - `dark_corner` in `clockwork_gallery` (line 82): evidence `'petra_hidden_recorder'`, gadget `'voice_prism'`.
  - `potted_plant` in `library` (line 108): evidence `'nadia_vial'`, gadget `'trace_light'`.
- `src/scenes/ExplorationScene.ts`:
  - Line 569-572: Micro Rover minigame awards `'connecting_door'`.
  - Line 601: Voice Prism minigame awards `'spliced_recording'`.
  - Line 605: Voice Prism minigame awards `'petra_recorder'` (ID discrepancy against `petra_hidden_recorder`).
- `src/data/dialogue.ts`:
  - Line 122: Hugo confrontation breakdown sets dialogue flag `'hugo_confessed'`.
  - Line 92: Nadia accusation breakdown sets dialogue flag `'killer_identified'`.
- `src/scenes/ReconstructionScene.ts:325-326`: Timeline completion sets `'reconstruction_complete'` and calls `gameState.completeReconstruction()`.
- `src/logic/DeductionEngine.ts:27-30`: True accusation constants:
  ```ts
  const TRUE_CULPRIT = 'nadia';
  const TRUE_METHOD = 'poisoned_tea';
  const TRUE_FALSE_ALIBI = 'missing_lantern';
  const REQUIRED_EVIDENCE = ['spliced_recording', 'nadia_vial', 'thirteenth_chime_resonance'];
  ```

### C. Current Hint System & The "Aldric Alive" Outdated Hint Bug
- `src/logic/HintSystem.ts:10-17`: Contains obsolete arrival phase hints:
  ```ts
  arrival: [
    {
      level1: 'Take a moment to look around the main hall. Talk to everyone you can.',
      level2: 'Professor Aldric is near the podium. He seems eager to speak with you.',
      level3: 'Approach Aldric and initiate conversation to learn about tonight\'s event.',
    },
  ],
  ```
- `src/logic/HintSystem.ts:94-99`: Advances index blindly on *any* event:
  ```ts
  gameState.on('evidenceCollected', () => { this.advanceHintIndex(); });
  gameState.on('flagSet', () => { this.advanceHintIndex(); });
  ```
- `src/scenes/UIScene.ts:166-179`: Renders hints via 11px low-resolution canvas text `this.add.text(320, 50, ...)` with Courier New font on a 640x360 canvas.

---

## 2. Logic Chain

1. **Phase & Investigation Desynchronization**:
   - `TitleScene` transitions to `CutsceneScene` (`cold_open` ➔ `opening_title` ➔ `discovery_scene`).
   - `CutsceneScene` completes `opening_title`, calling `storyManager.advancePhase()`, transitioning the game phase to `'arrival'`.
   - `HintSystem` receives the `'phaseChanged'` event and sets its internal `currentHints` to `PHASE_HINTS['arrival']`.
   - In `arrival`, the hint text instructs Ren to talk to "Professor Aldric near the podium".
   - However, in gameplay reality, Professor Aldric is murdered during the prologue, and `discovery_scene` displays his dead body in the Exhibition Chamber. Aldric never exists as an interactable living NPC in `main_hall`.
   - When `discovery_scene` completes, phase is advanced to `announcement`. There are zero entries for `announcement` in `PHASE_HINTS`.
   - If `HintSystem.getHint()` is called while phase is `'arrival'`, or falls back to previous/default state, it displays the obsolete text referring to living Aldric.

2. **Blind Progression vs Missing Clue Logic**:
   - The current `HintSystem` advances `currentHintIndex` sequentially on ANY `evidenceCollected` or `flagSet` event without verifying which evidence was collected.
   - For example, if a player collects `poisoned_tea` (in Exhibition Chamber) or `mothers_photo`, `currentHintIndex` increments past `connecting_door` to `rain_sensor_data`, and then past `rain_sensor_data` to "Confront Hugo", even if the player has none of the 3 required locked-room clues.
   - It is impossible for the current system to dynamically target the player's specific missing clue.

3. **Dynamic Architecture Solution**:
   - By creating a dynamic query engine in `HintSystem.ts` that evaluates `!gameState.hasEvidence(...)` and `!gameState.hasDialogueFlag(...)`, the system will deterministically target the exact missing objective in the current phase.
   - For each target objective, a 3-tier progressive hint structure (Tier 1 Atmospheric Nudge ➔ Tier 2 Room & Focus Direction ➔ Tier 3 Actionable Detective Direction naming the gadget hotkey [1]–[5]) provides tailored guidance.
   - Resetting the tier to Tier 1 when an objective is solved, and cycling 1 ➔ 2 ➔ 3 ➔ 1 on repeated presses for the same objective, ensures a smooth, self-healing detective experience.

---

## 3. Caveats

1. **Read-Only Scope**: This agent was dispatched as a read-only survey explorer. No game source code files were edited or overwritten. The findings and architectural designs are written strictly to `.agents/explorer_survey_1/report.md` and `.agents/explorer_survey_1/handoff.md`.
2. **Clue ID Discrepancy**: Future implementers must ensure both `'petra_hidden_recorder'` and `'petra_recorder'` are supported or unified across `ExplorationScene.ts:605` and `DeductionEngine.ts:60`.
3. **No Terminal Build Access Needed**: Code inspection and verification were performed via direct file examination (`view_file`, `grep_search`).

---

## 4. Conclusion

The story flow and clue state machines across all 5 chapters are fully mapped:
- `investigation_1`: Evaluates `connecting_door`, `hugo_fingerprints`, `rain_sensor_data`, followed by `hugo_confessed`.
- `midpoint_reversal`: Evaluates `spliced_recording` and `timelineBroken`.
- `investigation_2`: Evaluates `spliced_recording`, `petra_hidden_recorder`/`petra_recorder`, and `nadia_vial`.
- `reconstruction`: Evaluates the 5-event chronological sequence and `reconstruction_complete`.
- `final_confrontation`: Evaluates presenting `spliced_recording` proof, `nadia_vial`, `thirteenth_chime_resonance`, and identifying killer `nadia`.

The root cause of the outdated "Aldric alive" hint was isolated to legacy `arrival` phase templates and desynchronized phase triggers. The proposed dynamic 3-tier progressive hint architecture in `report.md` provides an exact, drop-in design ready for implementation by the coding agent.

---

## 5. Verification Method

To independently verify the observations and logic:
1. **Inspect Phase Exits**: Run `grep_search` on `src/logic/StoryPhaseManager.ts` for `canExit` to verify chapter conditions on lines 78, 88, 96, 104, 112.
2. **Inspect Aldric Hint Bug**: View `src/logic/HintSystem.ts:11-17` to verify the verbatim text *"Professor Aldric is near the podium"*.
3. **Inspect Blind Index Increment**: View `src/logic/HintSystem.ts:94-99` to verify that `evidenceCollected` and `flagSet` unconditionally call `advanceHintIndex()`.
4. **Inspect Clue Key Discrepancy**: Compare `src/data/evidence.ts:83` (`petra_hidden_recorder`) with `src/scenes/ExplorationScene.ts:605` (`petra_recorder`).
5. **Inspect Detailed Report**: Read `C:\Users\Lenovo\.gemini\antigravity\scratch\murdermysterygame\.agents\explorer_survey_1\report.md` for the complete dynamic inquiry catalog, TypeScript specifications, and UI overlay code.
