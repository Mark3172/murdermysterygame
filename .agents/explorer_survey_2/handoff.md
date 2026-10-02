# Handoff Report: Chambers, Layout, Collision, & Interactables Survey

**Reporter**: Explorer 2 (Chambers & Layout Explorer)  
**Parent Agent ID**: `0a00207e-c04d-4242-863e-63876d6e6031`  
**Working Directory**: `C:\Users\Lenovo\.gemini\antigravity\scratch\murdermysterygame\.agents\explorer_survey_2`  
**Handoff Type**: Hard (Investigation complete, fully populated)  
**Date**: 2026-10-02

---

## 1. Observation

### Observation 1: Exhibition Chamber Deadbolt Coincides with Main Hall Doorway
- **File**: `src/data/rooms.ts:52, 58`
- **Quote**:
  ```typescript
  // Line 52
  exits: [
    { direction: 'up', targetRoom: 'main_hall', x: 12, y: 1 },
    ...
  // Line 58
  { id: 'door_bolt', name: 'Heavy Bolt', x: 12, y: 1, width: 2, height: 1, description: 'The heavy deadbolt used to lock the door from the inside.', evidenceId: 'hugo_fingerprints', gadgetRequired: 'trace_light', dialogueOnInteract: 'There are smudged fingerprints on this bolt. The Trace Light makes them clear.' },
  ```
- **File**: `src/scenes/ExplorationScene.ts:154-179`
- **Quote**:
  ```typescript
  let tzX = ex;
  let tzY = ey;
  let tzW = TILE * 3;
  let tzH = TILE * 3;

  if (exit.direction === 'up' || ey <= 2 * TILE) {
    tzY = Math.max(ey, wallH) - 4;
    tzH = TILE * 3.5;
  }
  ...
  const z = this.add.zone(tzX, tzY, tzW, tzH);
  this.physics.add.existing(z, true);
  this.physics.add.overlap(this.player, z, () => {
    if (!this.doorCooldown && !this.inDialogue) {
      this.goToRoom(exit.targetRoom, exit.direction);
    }
  });
  ```
- **File**: `src/scenes/ExplorationScene.ts:428-435`
- **Quote**:
  ```typescript
  let nearDist = 45;
  for (const ia of this.interactableObjects) {
    const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, ia.zone.x, ia.zone.y);
    ia.label.setVisible(d < 45);
    if (d < nearDist) { nearObj = ia; nearDist = d; }
  }
  ```

### Observation 2: Main Hall Armchair Blocks Exhibition Chamber Entrance
- **File**: `src/scenes/ExplorationScene.ts:796`
- **Quote**:
  ```typescript
  // Velvet armchairs
  this.add.image(TILE * 8, wallH + 32, 'prop_armchair').setDepth(wallH + 32);
  this.add.image(w - TILE * 8, wallH + 32, 'prop_armchair').setDepth(wallH + 32);
  ```
- In `src/data/rooms.ts:31`:
  ```typescript
  { direction: 'up', targetRoom: 'exhibition_chamber', x: 8, y: 1 }
  ```
  `TILE * 8` is exactly `128 px`, matching exit `x: 8 * 16 = 128 px`, and `wallH + 32` is `80 px`, matching Ren's spawn coordinate when entering from Exhibition Chamber (`sy = 80 px`).

### Observation 3: Main Hall PA Speaker Obstructs Central Hall & Observation Deck
- **File**: `src/data/rooms.ts:34`
- **Quote**:
  ```typescript
  { id: 'pa_speaker', name: 'PA Speaker', x: 16, y: 5, width: 2, height: 2, description: 'The main speaker system. It crackles with static.', evidenceId: 'spliced_recording', gadgetRequired: 'voice_prism', ... }
  ```
  `x: 16, y: 5` is `(256, 80)`. Observation Deck door is at `x: 16, y: 1` (`256, 16`). Its trigger zone reaches down to `y = 72`. Ren standing north of the speaker enters `y <= 72`, inadvertently triggering the door to Observation Deck.

### Observation 4: Interactables Placed Inside Top Wall Colliders
- **Library (`src/data/rooms.ts:108`)**:
  ```typescript
  { id: 'potted_plant', name: 'Potted Plant', x: 20, y: 2, width: 2, height: 2, description: 'A large fern.', evidenceId: 'nadia_vial', gadgetRequired: 'trace_light', ... }
  ```
  `y: 2` is `Y = 32`. Wall collider spans `Y: 0 to 48`.
- **Observation Deck (`src/data/rooms.ts:153`)**:
  ```typescript
  { id: 'deck_sensors', name: 'Weather Sensors', x: 2, y: 2, width: 2, height: 2, description: 'Environmental monitoring equipment.', evidenceId: 'rain_sensor_data', gadgetRequired: 'echo_lens', ... }
  ```
  `y: 2` is `Y = 32`. Wall collider spans `Y: 0 to 48`.
- **Clockwork Gallery (`src/data/rooms.ts:82`)**:
  ```typescript
  { id: 'dark_corner', name: 'Dark Corner', x: 3, y: 3, width: 2, height: 2, description: 'A shadowed alcove near the entrance.', evidenceId: 'petra_hidden_recorder', gadgetRequired: 'voice_prism', ... }
  ```
  `y: 3` is `Y = 48`, directly intersecting the wall boundary.

### Observation 5: Ren Physics Bounding Box and Shadow Depth
- **File**: `src/scenes/ExplorationScene.ts:87-91, 423-426`
- **Quote**:
  ```typescript
  // Line 87: Shadow set once at creation
  this.playerShadow = this.add.ellipse(sx, sy + 15, 18, 7, 0x000000, 0.45).setDepth(sy - 1);
  this.player = this.physics.add.sprite(sx, sy, 'char_ren', 'down_0').setDepth(sy);
  (this.player.body as Phaser.Physics.Arcade.Body).setSize(14, 12).setOffset(5, 22);

  // Line 423-426: In update(), shadow depth is never updated
  this.playerShadow.setPosition(this.player.x, this.player.y + 15);
  this.playerTag.setPosition(this.player.x, this.player.y - 24);
  this.player.setDepth(this.player.y);
  ```

### Observation 6: Missing Pendulum Collider & Library Bottleneck
- **File**: `src/scenes/ExplorationScene.ts:980`
- **Quote**:
  ```typescript
  if (['desk', 'main_gear', 'archive_desk', 'shelf_3', 'old_files'].includes(obj.id)) {
  ```
  `pendulum` (`240, 224`, 64x64) is omitted from obstacle colliders.
- **File**: `src/scenes/ExplorationScene.ts:810-811`
  Armchairs at `(176, 242)` and `(240, 242)` are separated from the archive desk (`Y = 208`, bottom `222`) by only 4px.

---

## 2. Logic Chain

1. **Premise 1 (From Observation 1)**: In `exhibition_chamber`, the doorway trigger zone for `main_hall` is centered at `(192, 44)` with height `56 px`, spanning `Y: 16 to 72`. Ren's physics body triggers this zone as soon as `Ren.y <= 66`.
2. **Premise 2 (From Observation 1)**: The interactable `door_bolt` is located at `(192, 16)`. To interact with it, Ren's distance must be `< 45 px`, requiring `Ren.y <= 61`.
3. **Deduction 1**: Because `66 > 61`, any approach towards `door_bolt` causes Ren to hit the door trigger zone before entering the interaction proximity threshold. The scene immediately calls `goToRoom('main_hall')`. This mathematically guarantees an accidental room transition whenever the player tries to inspect the deadbolt.
4. **Premise 3 (From Observation 2)**: The exit from Exhibition Chamber into Main Hall places Ren at `(128, 80)`. In `main_hall`, an armchair image is placed at `(128, 80)`.
5. **Deduction 2**: Ren spawns directly inside this armchair upon returning from Exhibition Chamber, and the walkway to Exhibition Chamber is visually and spatially blocked.
6. **Premise 4 (From Observation 4)**: In `library` and `observation_deck`, the top wall colliders cover `Y: 0 to 48`. `potted_plant` and `deck_sensors` are located at `y: 2` (`Y = 32`).
7. **Deduction 3**: Both clues and their gleaming markers are embedded inside the solid wall header, violating visual framing and spatial realism.
8. **Premise 5 (From Observation 5 & 6)**: `this.playerShadow` depth remains fixed at spawn depth `sy - 1`, `pendulum` lacks a collider allowing Ren to walk through giant machinery, and library armchairs at `y = 242` pinch the walkway south of the archive desk down to 4px.
9. **Deduction 4**: Moving `door_bolt` to `x: 9, y: 4` (`144, 64`), tightening door trigger zones to `tzH: 16` (`y: 32 to 48`), moving wall-embedded clues down to `y: 5-6` (`Y: 80-96`), moving the Main Hall armchair to `TILE * 5` (`80, 80`), adding `pendulum` to obstacle colliders, and updating shadow depth dynamically in `update()` comprehensively resolves all layout, collision, and interaction issues across all six chambers.

---

## 3. Caveats

- **Audio/SFX & Visual Themes**: The sound generation logic (`SFXGenerator.ts`, `AudioManager.ts`) and pixel texture generation (`PixelRenderer.ts`) are intact and function as expected; no modifications to audio frequencies or texture colors are required.
- **Narrative Hint Integration**: Hint content and logic (investigated by peer explorers) will refer to these rooms and gadgets. The room IDs (`main_hall`, `exhibition_chamber`, `clockwork_gallery`, `library`, `pendulum_room`, `observation_deck`) and evidence IDs (`spliced_recording`, `poisoned_tea`, `hugo_fingerprints`, `connecting_door`, `rain_sensor_data`, `petra_hidden_recorder`, `felix_ink_stain`, `thirteenth_chime_resonance`, `nadia_vial`, `pendulum_weight_sensor`, `project_echo_notes`, `mothers_photo`) remain 100% stable and unchanged.
- **Read-Only Investigation**: As an explorer, this agent has made 0 modifications to source files in `src/`. All proposals are documented in `report.md` and this handoff for the implementation phase.

---

## 4. Conclusion

All six observatory chambers have been mapped and analyzed down to pixel-level coordinates. We have pinpointed the exact spatial conflicts causing accidental doorway transitions, misplaced wall clues, and furniture obstructions. A complete, unblocked layout specification is established with exact grid and pixel coordinates in `report.md`.

### Core Action Items for Implementation Agent:
1. Update `src/data/rooms.ts`:
   - `exhibition_chamber.interactables`: Move `door_bolt` to `{ x: 9, y: 4, width: 2, height: 1 }`.
   - `main_hall.interactables`: Move `pa_speaker` to `{ x: 20, y: 4, width: 2, height: 2 }`.
   - `clockwork_gallery.interactables`: Move `dark_corner` to `{ x: 4, y: 5, width: 2, height: 2 }`.
   - `library.interactables`: Move `potted_plant` to `{ x: 21, y: 6, width: 2, height: 2 }`, adjust Felix to `x: 9, y: 15`.
   - `pendulum_room.interactables`: Move `floor_grates` to `{ x: 11, y: 16, width: 2, height: 2 }`.
   - `observation_deck.interactables`: Move `deck_sensors` to `{ x: 4, y: 5, width: 2, height: 2 }`.
2. Update `src/scenes/ExplorationScene.ts`:
   - Tighten doorway trigger zones to `tzH: 16, tzW: 32` located strictly on the doorway threshold (`wallH - 8`).
   - Move armchair 1 in `main_hall` to `TILE * 5` (`80, 80`).
   - Move armchairs in `library` to `(wallH + h) / 2 + 40` (`Y = 272`).
   - Add `'pendulum'` to obstacle colliders with `rect(240, 224, 48, 48)`.
   - Update `playerShadow` depth dynamically in `update()`: `this.playerShadow.setDepth(this.player.y - 1)`.
   - Elevate `doorBadge` depth to `200`.
   - When evidence is discovered in `interact(obj)`, immediately destroy its gleaming marker.

---

## 5. Verification Method

To verify these findings and confirm the fix once implemented:

1. **Doorway & Deadbolt Non-Interference Verification**:
   - Start game or load `exhibition_chamber`.
   - Walk Ren directly from the south toward the heavy deadbolt at `(144, 64)`.
   - Confirm Ren approaches within 45px, the prompt `🔍 [E] Examine Heavy Bolt` appears, and pressing `E` (or equipping Trace Light [3]) triggers dialogue/evidence discovery for `hugo_fingerprints` without initiating a room transition to `main_hall`.
   - Walk Ren into the doorway archway at `x: 12, y: 1` (`192, 32-40`). Confirm the room transition fires smoothly only when crossing the actual threshold.
2. **Main Hall Doorway Entry Verification**:
   - Walk from `exhibition_chamber` into `main_hall`.
   - Confirm Ren spawns at `(128, 80)` in an open, unblocked corridor with no armchair overlap.
3. **Top Wall Clue Clearance Verification**:
   - In `library`, navigate to `(336, 96)` and verify `potted_plant` sits cleanly on the parquet floor and can be inspected from all 4 cardinal directions.
   - In `observation_deck`, navigate to `(64, 80)` and verify `deck_sensors` is accessible on the balcony deck.
   - In `clockwork_gallery`, navigate to `(64, 80)` and verify `dark_corner` is cleanly on the grate floor.
4. **Collision & Navigation Verification**:
   - Walk completely around the central desk in `library` to verify >= 32px clearance between the desk and armchairs.
   - Walk toward the swinging pendulum in `pendulum_room` and verify Ren collides with the pendulum base rather than ghosting through it.
   - Check player shadow rendering when moving north and south across the room.
5. **Project Build**:
   - Run `npm run build` to confirm 0 TypeScript / Vite compiler errors.
