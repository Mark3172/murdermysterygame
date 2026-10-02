# Comprehensive Survey Report: Story Progression & Dynamic 3-Tier Hint System

**Author**: Explorer 1 (Story & Hint Explorer)  
**Target Workspace**: `C:\Users\Lenovo\.gemini\antigravity\scratch\murdermysterygame`  
**Date**: 2026-10-02  
**Milestone**: Narrative Progression, Clue State Tracing, & 3-Tier Hint System Overhaul  

---

## 1. Executive Summary

This investigation explores the narrative flow, state management, clue tracking, and hint mechanics of **"The Thirteenth Chime"**. The game is an atmospheric 2D pixel-art mystery built with Phaser 3 and TypeScript, structured around the murder of Professor Aldric Sable at Stellara Mountain Observatory.

Key findings include:
1. **Narrative State Machine**: Game progression is partitioned into 15 phases (from `cold_open` to `complete`), with core investigation across 5 chapters: `investigation_1`, `midpoint_reversal`, `investigation_2`, `reconstruction`, and `final_confrontation`.
2. **Current Hint Implementation Flaws**: The existing `HintSystem` (`src/logic/HintSystem.ts`) relies on a static array with a blind integer counter (`currentHintIndex`) that advances every time *any* evidence or *any* flag is triggered. It contains zero dynamic evaluation of the player's actual missing clues.
3. **The "Aldric Alive" Bug Root Cause**: `PHASE_HINTS` contains an obsolete `arrival` phase directing the player to *"Approach Aldric near the podium"*. When transitioning out of the prologue sequence, phase state mismanagement and fallback behavior cause the hint system to serve this legacy instruction—even though Aldric is already dead before free exploration begins.
4. **Evidence ID Discrepancy**: A critical naming mismatch exists between `petra_hidden_recorder` (used in `data/evidence.ts`, `data/gadgets.ts`, `data/rooms.ts`, `data/dialogue.ts`, `data/timeline.ts`) and `petra_recorder` (awarded in `ExplorationScene.ts:605` and validated in `DeductionEngine.ts:60-62`).
5. **Dynamic 3-Tier Hint Architecture**: A complete architectural overhaul is designed herein, replacing the static index with a state-aware query engine that evaluates exact missing clues, maps them to chambers and gadget hotkeys (1–5), tracks per-inquiry tier progression (Tier 1 Atmospheric Nudge → Tier 2 Room & Focus Direction → Tier 3 Actionable Detective Direction), and presents them via sharp high-DPI HTML cards.

---

## 2. Narrative Progression & State Machine Architecture

### 2.1 Phase Lifecycle and Management

The game's narrative phases are governed primarily by three modules:
- `src/logic/GameState.ts`: Holds the central `GameStateData`, including `phase: GamePhase`, `evidenceCollected: Set<string>`, `dialogueFlags: Set<string>`, `cutscenesSeen: Set<string>`, `gadgetsUnlocked: Set<string>`, and investigation milestone booleans (`lockedRoomSolved`, `timelineBroken`, `reconstructionComplete`, `killerIdentified`).
- `src/logic/StoryPhaseManager.ts`: Defines `PHASE_CONFIGS: PhaseConfig[]` with metadata per phase (`name`, `objective`, `musicTrack`, `availableRooms`, `cutsceneOnEnter`, `gadgetsToUnlock`, `canExit()`).
- `src/scenes/ExplorationScene.ts`: The primary gameplay scene. It enforces a safety floor on lines 57–60:
  ```ts
  const curP = gameState.getPhase();
  if (!curP || ['cold_open', 'opening_title', 'arrival', 'announcement', 'blackout', 'discovery'].includes(curP)) {
    gameState.setPhase('investigation_1');
  }
  ```

### 2.2 Phase Transition Call-Graph

```
TitleScene (New Game)
  └─► CutsceneScene ('cold_open')
        └─► CutsceneScene ('opening_title')
              └─► CutsceneScene ('discovery_scene')
                    └─► ExplorationScene ('main_hall') [phase forced to 'investigation_1']
```

During gameplay:
1. `investigation_1`:
   - Trigger: Complete Hugo confrontation after collecting `connecting_door`, `hugo_fingerprints`, and `rain_sensor_data`.
   - Action: `hugo_interview` dialogue node sets flag `'hugo_confessed'`.
   - Progression: `ExplorationScene.checkAdvance()` evaluates `storyManager.checkAutoAdvance()`, which returns true because `gameState.hasDialogueFlag('hugo_confessed')`.
   - `storyManager.advancePhase()` transitions to `midpoint_reversal`.
2. `midpoint_reversal`:
   - Trigger: `StoryPhaseManager.onEnter` calls `gameState.breakTimeline()` (`timelineBroken = true`).
   - Cutscene: `CutsceneScene` runs `'midpoint_reversal'` revealing the spliced recording.
   - Progression: Upon cutscene end (`CutsceneScene.ts:345`), `storyManager.advancePhase()` advances phase to `investigation_2`.
3. `investigation_2`:
   - Trigger: Player investigates the second phase of the murder, focusing on the PA speaker splice, Petra's recorder, and the solvent vial.
   - Exit Condition (`StoryPhaseManager.ts:96`): `gameState.getEvidenceCount() >= 6`.
   - Progression: Reaching the threshold opens access to `ReconstructionScene` (or triggers EventBus `'start-reconstruction'`).
4. `reconstruction`:
   - Scene: `ReconstructionScene.ts` in the Exhibition Chamber.
   - Gameplay: Player arranges 5 timeline cards into correct chronological order:
     `event_poison` ➔ `event_recording` ➔ `event_death` ➔ `event_hugo_discovery` ➔ `event_locked_room`.
   - Completion: Sets flag `'reconstruction_complete'` and calls `gameState.completeReconstruction()`.
   - Progression: `storyManager.advancePhase()` advances to `final_confrontation`.
5. `final_confrontation`:
   - Scene: Main Hall confrontation with Nadia Thorn or via `DeductionScene.ts` (Final Accusation board).
   - Validation: `deductionEngine.validateAccusation()` verifies Culprit (`nadia`), Method (`poisoned_tea`), False Alibi (`missing_lantern`), and Supporting Evidence (`spliced_recording`, `nadia_vial`, `thirteenth_chime_resonance`).
   - Completion: Calls `gameState.identifyKiller()`, triggers `'final_reveal'` cutscene, and transitions to `'ending'` / `'credits'`.

---

## 3. Clues, Inventory, Flags, and Deduction Systems

### 3.1 Clue Tracking (`evidenceCollected`)

- Stored in `gameState.state.evidenceCollected` as a `Set<string>`.
- Master dictionary located in `src/data/evidence.ts` (`Record<string, EvidenceData>`).
- Collected via `gameState.collectEvidence(evidenceId)`:
  - Adds ID to set.
  - Appends `Found: ${evidenceId}` to `notebookEntries`.
  - Emits EventBus/listener event `'evidenceCollected'`.
  - If `evidenceId === 'project_echo_notes_yuki'`, sets `optionalClueFound = true`.

#### Critical Discrepancy Found: `petra_recorder` vs `petra_hidden_recorder`
Across the repository, the audio recorder clue has split identifiers:
- `petra_hidden_recorder`: Defined in `src/data/evidence.ts:84`, referenced in `src/data/rooms.ts:82`, `src/data/gadgets.ts:38`, `src/data/dialogue.ts:140`, and `src/data/timeline.ts:72`.
- `petra_recorder`: Awarded in `src/scenes/ExplorationScene.ts:605` (`gameState.collectEvidence('petra_recorder')`), and validated in `src/logic/DeductionEngine.ts:60-62`.
*Architectural Recommendation*: Any clue check or hint evaluator must check `gameState.hasEvidence('petra_hidden_recorder') || gameState.hasEvidence('petra_recorder')` until the codebase is unified.

### 3.2 Inventory and Gadgets System

The game equips Ren with 5 primary detective gadgets unlocked at the start of exploration (`ExplorationScene.ts:52` and `GameState.ts:59`):
1. **Slot 1 (`tranquility_focus`)**: Tranquility Focus [Key: `1`]. Surveys environment and points of interest.
2. **Slot 2 (`echo_lens`)**: Echo Lens [Key: `2`]. Visualizes sound waves and environmental telemetry (weather sensors, pendulum resonance).
3. **Slot 3 (`trace_light`)**: Trace Light [Key: `3`]. UV spectrum emitter illuminating fingerprints, chemical residues, and dust voids.
4. **Slot 4 (`micro_rover`)**: Micro Rover [Key: `4`]. Remote mini-drone deployed into narrow gaps and maintenance passages.
5. **Slot 5 (`voice_prism`)**: Voice Prism [Key: `5`]. Sound frequency analyzer detecting splices, voice matches, and bugged recordings.

### 3.3 Flags and Milestones

- Dialogue flags stored in `gameState.state.dialogueFlags` (`Set<string>`).
- Key flags driving progression:
  - `'hugo_confessed'`: Set in `src/data/dialogue.ts:122` when Hugo breaks down during confrontation. Satisfies exit condition for `investigation_1`.
  - `'reconstruction_complete'`: Set in `src/scenes/ReconstructionScene.ts:325` when timeline slots match the 5 correct event IDs. Satisfies exit condition for `reconstruction`.
  - `'killer_identified'`: Set in `src/data/dialogue.ts:92` during Nadia's dialogue confession, or in `src/scenes/DeductionScene.ts:289` via `gameState.identifyKiller()`.

---

## 4. Exact State Checks for Key Clues

| Chapter | Target Clue / Goal | Exact State Check | Chamber / Location | Required Gadget & Hotkey | Resolution Action |
|---|---|---|---|---|---|
| **investigation_1** | Hidden passage | `gameState.hasEvidence('connecting_door')` | Clockwork Gallery (x: 14, y: 19) | Micro Rover [4] | Deploy Micro Rover into wall gap behind gears or solve Rover minigame. |
| **investigation_1** | Hugo's prints | `gameState.hasEvidence('hugo_fingerprints')` | Exhibition Chamber (x: 12, y: 1) | Trace Light [3] | Shine Trace Light on the heavy interior door deadbolt. |
| **investigation_1** | Empty deck proof | `gameState.hasEvidence('rain_sensor_data')` | Observation Deck (x: 2, y: 2) | Echo Lens [2] | Connect to automated Weather Sensors to pull telemetry logs. |
| **investigation_1** | Hugo Confrontation | `gameState.hasDialogueFlag('hugo_confessed')` | Exhibition Chamber (NPC Hugo) | None (Evidence required) | Speak with Hugo; select `(Confront) You bolted the room from inside and escaped!`. |
| **investigation_2** | Spliced broadcast | `gameState.hasEvidence('spliced_recording')` | Main Hall (x: 16, y: 5) | Voice Prism [5] | Inspect PA Speaker in Main Hall or complete Voice Prism minigame in Exhibition Chamber. |
| **investigation_2** | Hidden recorder | `gameState.hasEvidence('petra_hidden_recorder')` or `'petra_recorder'` | Clockwork Gallery (x: 3, y: 3) | Voice Prism [5] | Inspect Dark Corner alcove near gallery entrance. |
| **investigation_2** | Solvent vial | `gameState.hasEvidence('nadia_vial')` | Library & Archive (x: 20, y: 2) | Trace Light [3] | Inspect Potted Plant fern in library with UV light. |
| **final_confrontation** | Forged announcement proof | `gameState.hasEvidence('spliced_recording')` | Main Hall / Deduction Board | Voice Prism [5] | Presented as acoustic evidence exposing the falsified time of death. |
| **final_confrontation** | Killer accusation | `gameState.hasDialogueFlag('killer_identified')` or `gameState.state.killerIdentified === true` | Main Hall (NPC Nadia) or DeductionScene | None (Deduction logic) | Accuse Nadia Thorn: Method: Poisoned Tea; False Alibi: Missing Lantern; Proof: Spliced Recording, Solvent Vial, 13th Chime Resonance. |

---

## 5. Current Hint System Investigation & Outdated Text Bug Analysis

### 5.1 Where and How the Hint System is Implemented

1. **Backend (`src/logic/HintSystem.ts`)**:
   - Manages `currentHints: HintSet[]`, `currentHintIndex: number = 0`, and `currentLevel: number = 0`.
   - Listens to three `gameState` events:
     ```ts
     gameState.on('phaseChanged', (data: { to: GamePhase }) => { this.updateHints(data.to); });
     gameState.on('evidenceCollected', () => { this.advanceHintIndex(); });
     gameState.on('flagSet', () => { this.advanceHintIndex(); });
     ```
2. **Frontend UI (`src/scenes/UIScene.ts`)**:
   - Button `#btn-hint` and `keydown-H` trigger `this.showHint()`.
   - Calls `hintSystem.getHint()`.
   - Displays toast via Phaser canvas `this.add.text(320, 50, hintText, ...)`.
3. **State Tracking (`src/logic/GameState.ts`)**:
   - Tracks `currentHintLevel` and `hintsUsed`.

### 5.2 Root Cause of the "Aldric Alive in Main Hall" Bug

The presence of outdated instructions referencing Professor Aldric alive near the podium originates from three intersecting causes:

1. **Obsolete Phase Template**:
   `PHASE_HINTS` in `HintSystem.ts:11-17` contains:
   ```ts
   arrival: [
     {
       level1: 'Take a moment to look around the main hall. Talk to everyone you can.',
       level2: 'Professor Aldric is near the podium. He seems eager to speak with you.',
       level3: 'Approach Aldric and initiate conversation to learn about tonight\'s event.',
     },
   ],
   ```
2. **Cutscene Transition Phase Mismatch**:
   In `CutsceneScene.ts:344-360`:
   - When `opening_title` completes, `storyManager.advancePhase()` advances the game from `opening_title` to `arrival`.
   - `HintSystem` receives `'phaseChanged'` with `'arrival'`, immediately loading the Aldric hint set into `currentHints`.
   - `CutsceneScene` immediately launches `discovery_scene` without changing `gameState.phase` back to exploration.
   - When `discovery_scene` finishes, `storyManager.advancePhase()` increments `arrival` (phase 2) to `announcement` (phase 3).
   - In `PHASE_HINTS`, there is NO entry for `announcement`! Thus, `HintSystem` either keeps `currentHints` empty or falls back to previous/default state.
3. **Gameplay Reality vs Hint Narrative**:
   In the actual game design, Professor Aldric is murdered during the prologue/blackout and found dead during `discovery_scene`. There is *no* playable gameplay state where Aldric is alive at a podium in the Main Hall (`rooms.main_hall.npcs` only contains `npc_nadia`).
   If the hint system is queried while phase state is `arrival`, or before `ExplorationScene` sets `investigation_1`, or if a save file retains `arrival`, the player receives instructions to speak with a deceased character at a non-existent location.

### 5.3 Additional Flaws in Current System

- **Blind Index Advancement**: `advanceHintIndex()` triggers on *every single* evidence collection or flag set. If the player picks up an unrelated item (e.g. `poisoned_tea` or `mothers_photo`), `currentHintIndex` increments. The hint system will advance to "Confront Hugo" before the player has even found the connecting door!
- **Zero Missing Clue Awareness**: The current system never inspects `gameState.hasEvidence()` or `gameState.hasDialogueFlag()`.
- **Low-DPI Toast Rendering**: Hints are drawn on a low-resolution 640x360 canvas with Courier New, resulting in pixelation on high-resolution monitors.

---

## 6. Architecture for the Dynamic 3-Tier Progressive Hint System

### 6.1 Core Architectural Principles

1. **Dynamic Clue Evaluation**: Hints must never advance based on blind event counts. Instead, the hint system must actively query `gameState` on demand to identify the exact unsatisfied goal in the player's current story phase.
2. **Progressive 3-Tier Granularity**:
   - **Tier 1 (Atmospheric Nudge)**: Subtle thematic direction pointing toward the general anomaly, mechanical mystery, or area.
   - **Tier 2 (Room & Focus Direction)**: Identifies the target chamber and what clue, furniture, or mechanism to search for.
   - **Tier 3 (Actionable Detective Direction)**: Explicitly names the required gadget (with slot hotkey `[1]–[5]`) or exact dialogue choice to advance.
3. **Per-Inquiry Tier Progression & Cycling**:
   - The system tracks which specific inquiry is active (`activeInquiryId`).
   - If the player queries a hint for the *same* inquiry, tier advances: 1 ➔ 2 ➔ 3 ➔ (cycles to 1).
   - Once the player discovers the clue or fulfills the flag, the active inquiry automatically switches to the next missing objective, and the tier counter resets to Tier 1.
4. **Never Return Outdated Text**: Eliminate the legacy `arrival` hint set. All prologue/pre-investigation states route to an immediate, lore-accurate directive guiding Ren into the Exhibition Chamber.

### 6.2 Data Structures & TypeScript Specification

```ts
export type HintTier = 1 | 2 | 3;

export interface ProgressiveHint {
  tier1: string; // Atmospheric Nudge
  tier2: string; // Room & Focus Direction
  tier3: string; // Actionable Detective Direction
}

export interface DynamicInquiry {
  id: string;
  phase: GamePhase;
  chamber: string;
  isSatisfied: (state: typeof gameState) => boolean;
  hints: ProgressiveHint;
}

export interface HintResponse {
  tier: HintTier;
  text: string;
  chamber: string;
  inquiryId: string;
  phase: GamePhase;
  hasMore: boolean;
}
```

### 6.3 Complete Dynamic Inquiry Catalog

#### Chapter 1: `investigation_1`
```ts
// 1. Missing Connecting Door
{
  id: 'inv1_connecting_door',
  phase: 'investigation_1',
  chamber: 'Clockwork Gallery',
  isSatisfied: (gs) => gs.hasEvidence('connecting_door'),
  hints: {
    tier1: 'The Exhibition Chamber was locked from inside, but heavy masonry often masks older architectural passages. Look for where the machinery meets the walls.',
    tier2: 'Search the Clockwork Gallery. There is an unmapped opening tucked behind the churning brass gear assembly.',
    tier3: 'Equip the Micro Rover [4] in the Clockwork Gallery and inspect the Gap behind Gears to pilot the drone through the hidden passage.'
  }
},
// 2. Missing Hugo's Fingerprints
{
  id: 'inv1_hugo_fingerprints',
  phase: 'investigation_1',
  chamber: 'Exhibition Chamber',
  isSatisfied: (gs) => gs.hasEvidence('hugo_fingerprints'),
  hints: {
    tier1: 'The heavy bolt on the chamber door was thrown from within. Physical contact always leaves invisible traces behind.',
    tier2: 'Examine the interior lock deadbolt on the Exhibition Chamber doorway for latent biological residue.',
    tier3: 'Equip the Trace Light [3] in the Exhibition Chamber and inspect the Heavy Bolt to reveal Hugo\'s smudged fingerprints.'
  }
},
// 3. Missing Rain Sensor Data
{
  id: 'inv1_rain_sensor_data',
  phase: 'investigation_1',
  chamber: 'Observation Deck',
  isSatisfied: (gs) => gs.hasEvidence('rain_sensor_data'),
  hints: {
    tier1: 'Hugo swears he was standing outside in the gale during the blackout. Weather telemetry logs every footstep on the terrace.',
    tier2: 'Head up to the Observation Deck and inspect the automated meteorological sensor console.',
    tier3: 'Equip the Echo Lens [2] (or interact directly) on the Weather Sensors at the Observation Deck to retrieve the logs proving Hugo lied about his alibi.'
  }
},
// 4. Hugo Confrontation (Triggered after all 3 clues found)
{
  id: 'inv1_hugo_confrontation',
  phase: 'investigation_1',
  chamber: 'Exhibition Chamber',
  isSatisfied: (gs) => gs.hasDialogueFlag('hugo_confessed'),
  hints: {
    tier1: 'With his alibi shattered, the secret door mapped, and his prints on the bolt, the victim\'s son has nowhere left to hide.',
    tier2: 'Find Hugo Wren standing in the Exhibition Chamber and confront him with the three contradicting proofs.',
    tier3: 'Talk to Hugo in the Exhibition Chamber and select: "(Confront) You bolted the room from inside and escaped!" to break his confession.'
  }
}
```

#### Chapter 2: `midpoint_reversal`
```ts
{
  id: 'midpoint_splice',
  phase: 'midpoint_reversal',
  chamber: 'Main Hall',
  isSatisfied: (gs) => gs.hasEvidence('spliced_recording'),
  hints: {
    tier1: 'Everyone based the time of death on Aldric\'s speech. But acoustics can be recorded, manipulated, and delayed.',
    tier2: 'Inspect the Public Address loudspeaker in the Main Hall to analyze the recording of the professor\'s voice.',
    tier3: 'Equip the Voice Prism [5] in the Main Hall and examine the PA Speaker to expose the frequency splices in the announcement.'
  }
}
```

#### Chapter 3: `investigation_2`
```ts
// 1. PA Speaker Splice (if not collected earlier)
{
  id: 'inv2_spliced_recording',
  phase: 'investigation_2',
  chamber: 'Main Hall',
  isSatisfied: (gs) => gs.hasEvidence('spliced_recording'),
  hints: {
    tier1: 'The false timeline hinges on the broadcast. You need definitive proof that Aldric did not speak live at 7:45 PM.',
    tier2: 'Go to the Main Hall and analyze the central PA speaker mounted near the north doorway.',
    tier3: 'Equip the Voice Prism [5] and interact with the PA Speaker in the Main Hall to secure the Spliced Recording evidence.'
  }
},
// 2. Petra's Hidden Audio Recorder
{
  id: 'inv2_petra_recorder',
  phase: 'investigation_2',
  chamber: 'Clockwork Gallery',
  isSatisfied: (gs) => gs.hasEvidence('petra_hidden_recorder') || gs.hasEvidence('petra_recorder'),
  hints: {
    tier1: 'The journalist Petra was lurking near the machinery when the lights failed. She captured ambient sound in the dark.',
    tier2: 'Search the shadows near the entrance of the Clockwork Gallery for a concealed recording device.',
    tier3: 'Equip the Voice Prism [5] and inspect the Dark Corner in the Clockwork Gallery to recover Petra\'s hidden audio recording.'
  }
},
// 3. Solvent Poison Vial
{
  id: 'inv2_solvent_vial',
  phase: 'investigation_2',
  chamber: 'Library & Archive',
  isSatisfied: (gs) => gs.hasEvidence('nadia_vial'),
  hints: {
    tier1: 'The toxic clockwork solvent used to poison the tea was discarded in haste somewhere quiet.',
    tier2: 'Search the Library & Archive among the potted flora for chemical glass residue.',
    tier3: 'Equip the Trace Light [3] and illuminate the Potted Plant in the Library to uncover Nadia\'s discarded solvent vial.'
  }
},
// 4. Supplementary Evidence: Poisoned Tea
{
  id: 'inv2_poisoned_tea',
  phase: 'investigation_2',
  chamber: 'Exhibition Chamber',
  isSatisfied: (gs) => gs.hasEvidence('poisoned_tea'),
  hints: {
    tier1: 'Professor Sable collapsed while drinking at his workspace. The physical delivery mechanism remains at the scene.',
    tier2: 'Inspect the beverage container sitting on the Professor\'s Desk in the Exhibition Chamber.',
    tier3: 'Equip the Trace Light [3] and examine the Thermos in the Exhibition Chamber to identify the toxic industrial solvent.'
  }
},
// 5. Supplementary Evidence: 13th Chime Resonance
{
  id: 'inv2_thirteenth_chime',
  phase: 'investigation_2',
  chamber: 'Pendulum Room',
  isSatisfied: (gs) => gs.hasEvidence('thirteenth_chime_resonance'),
  hints: {
    tier1: 'The eerie thirteenth chime that killed the power had an impossible frequency. Its acoustic signature matches an internal room.',
    tier2: 'Visit the Pendulum Room and analyze the atmospheric resonance around the great swinging weight.',
    tier3: 'Equip the Echo Lens [2] in the Pendulum Room and inspect Room Acoustics to record the matching Project Echo frequency.'
  }
},
// 6. Transition to Reconstruction
{
  id: 'inv2_to_reconstruction',
  phase: 'investigation_2',
  chamber: 'Exhibition Chamber',
  isSatisfied: (gs) => gs.hasDialogueFlag('reconstruction_complete') || gs.state.reconstructionComplete,
  hints: {
    tier1: 'You have gathered the evidence breaking the alibis. It is time to reconstruct what actually happened when the lights died.',
    tier2: 'Return to the Exhibition Chamber to begin the timeline reconstruction.',
    tier3: 'Press [N] to review your findings, then interact with the Reconstruction board in the Exhibition Chamber to order the sequence of events.'
  }
}
```

#### Chapter 4: `reconstruction`
```ts
{
  id: 'recon_assembly',
  phase: 'reconstruction',
  chamber: 'Reconstruction Board',
  isSatisfied: (gs) => gs.hasDialogueFlag('reconstruction_complete') || gs.state.reconstructionComplete,
  hints: {
    tier1: 'Contrast the assumed timeline with physical facts: Aldric was poisoned long before the blackout, during the broadcast.',
    tier2: 'Arrange the 5 timeline events in chronological order from the initial poisoning through the final discovery.',
    tier3: 'Place cards in exact order: 1. Nadia prepares poison -> 2. Spliced announcement plays -> 3. Aldric collapses -> 4. Hugo finds body -> 5. Hugo locks door.'
  }
}
```

#### Chapter 5: `final_confrontation`
```ts
{
  id: 'final_accusation',
  phase: 'final_confrontation',
  chamber: 'Main Hall',
  isSatisfied: (gs) => gs.hasDialogueFlag('killer_identified') || gs.state.killerIdentified,
  hints: {
    tier1: 'All threads converge on the acoustician who altered Project Echo\'s calibrations and stole the library lantern.',
    tier2: 'Confront Nadia Thorn in the Main Hall, or initiate the Final Accusation board from your detective menu.',
    tier3: 'Accuse Nadia Thorn! Method: Poisoned Tea. False Alibi: Missing Lantern. Present: Spliced Recording, Solvent Vial, and Thirteenth Chime Resonance.'
  }
}
```

### 6.4 Progression Tracking & Inquiry Cycling Logic

In `HintSystem`:
```ts
export class HintSystem {
  private currentInquiryId: string | null = null;
  private currentTier: HintTier = 1;

  public getHint(): HintResponse {
    const currentPhase = gameState.getPhase();
    const inquiries = this.getInquiriesForPhase(currentPhase);
    const activeInquiry = inquiries.find(inq => !inq.isSatisfied(gameState)) 
      || this.getFallbackInquiry(currentPhase);

    if (this.currentInquiryId !== activeInquiry.id) {
      // New objective: reset to Tier 1
      this.currentInquiryId = activeInquiry.id;
      this.currentTier = 1;
    } else {
      // Same objective: cycle tier 1 -> 2 -> 3 -> 1
      this.currentTier = ((this.currentTier % 3) + 1) as HintTier;
    }

    const tierKey = `tier${this.currentTier}` as keyof ProgressiveHint;
    const hintText = activeInquiry.hints[tierKey];

    return {
      tier: this.currentTier,
      text: hintText,
      chamber: activeInquiry.chamber,
      inquiryId: activeInquiry.id,
      phase: currentPhase,
      hasMore: this.currentTier < 3
    };
  }
}
```

### 6.5 UI/UX & High-DPI HTML Overlay Integration

To satisfy Requirement R3 ("Elevate low-resolution canvas-rendered toasts into sharp, high-DPI HTML/CSS overlay cards"), `UIScene.showHint()` should render a DOM card into `document.body` instead of canvas text:

```ts
// High-DPI HTML Hint Toast in UIScene.ts
showHint() {
  AudioManager.getInstance().playSFX('bellChime');
  const hint = hintSystem.getHint();
  
  let toastEl = document.getElementById('hint-toast-overlay');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'hint-toast-overlay';
    toastEl.style.cssText = `
      position: fixed;
      top: 48px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 540px;
      width: 90%;
      background: rgba(10, 14, 26, 0.96);
      border: 1px solid #d4af37;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8), 0 0 10px rgba(212, 175, 55, 0.2);
      border-radius: 4px;
      padding: 12px 16px;
      z-index: 2000;
      color: #e6ecf2;
      font-family: Georgia, serif;
      pointer-events: auto;
      transition: opacity 0.3s ease, transform 0.3s ease;
    `;
    document.body.appendChild(toastEl);
  }

  const tierColors: Record<number, string> = {
    1: '#4a90e2', // Atmospheric Blue
    2: '#e6c229', // Room Direction Amber
    3: '#e74c3c'  // Actionable Directive Red
  };
  const tierTitles: Record<number, string> = {
    1: 'Tier 1 • Atmospheric Nudge',
    2: 'Tier 2 • Room & Focus Direction',
    3: 'Tier 3 • Actionable Detective Direction'
  };

  const pips = [1, 2, 3].map(t => 
    `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; margin:0 3px; background:${t <= hint.tier ? tierColors[hint.tier] : '#333a4d'};"></span>`
  ).join('');

  toastEl.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #232b3e; padding-bottom:6px; margin-bottom:8px;">
      <span style="font-size:12px; font-weight:bold; color:${tierColors[hint.tier]}; font-family:'Courier New', monospace; letter-spacing:1px;">
        💡 ${tierTitles[hint.tier].toUpperCase()}
      </span>
      <div style="display:flex; align-items:center;">
        <span style="font-size:11px; color:#88a0b8; margin-right:8px; font-family:'Courier New', monospace;">[${hint.chamber}]</span>
        ${pips}
      </div>
    </div>
    <div style="font-size:14px; line-height:1.5; color:#ffffff;">
      ${hint.text}
    </div>
    <div style="margin-top:8px; font-size:10px; color:#8899aa; font-family:'Courier New', monospace; text-align:right;">
      Press [H] again for next tier • Auto-closes in 6s
    </div>
  `;

  toastEl.style.opacity = '1';
  toastEl.style.display = 'block';

  if ((this as any)._hintTimeout) clearTimeout((this as any)._hintTimeout);
  (this as any)._hintTimeout = setTimeout(() => {
    if (toastEl) toastEl.style.opacity = '0';
  }, 6000);
}
```

---

## 7. Implementation Roadmap & Affected Files

The implementation will require modifications across the following files:
1. `src/logic/HintSystem.ts`: Replace static `PHASE_HINTS` with the dynamic inquiry evaluator, inquiry registry, and per-inquiry tier tracking.
2. `src/scenes/UIScene.ts`: Replace canvas toast rendering in `showHint()` with the high-DPI DOM overlay card.
3. `src/data/hints.ts`: Either deprecate or populate with the new `DynamicInquiry` catalog as a clean data separation.
4. `src/scenes/ExplorationScene.ts`: Standardize clue acquisition (ensuring both `petra_hidden_recorder` and `petra_recorder` are satisfied).
5. `src/scenes/DialogueScene.ts` & `src/scenes/CutsceneScene.ts`: Verify phase transition handshakes prevent orphaned states.

---
*Report compiled by Explorer 1 (Story & Hint Explorer). Complete evidence and findings captured.*
