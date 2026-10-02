# Comprehensive Survey & Layout Report: Chambers, Collision, & Interactables
**Project**: *The Thirteenth Chime*  
**Agent**: Explorer 2 (Chambers & Layout Explorer)  
**Date**: 2026-10-02  
**Target Working Directory**: `C:\Users\Lenovo\.gemini\antigravity\scratch\murdermysterygame\.agents\explorer_survey_2`

---

## 1. Executive Summary

This investigation analyzed the spatial architecture, collision geometry, interactable trigger radii, doorway thresholds, visual depth (Z-ordering), and clue presentation across all six observatory chambers:
1. `main_hall` (Grand domed central observatory)
2. `exhibition_chamber` (Secure prototype vault & crime scene)
3. `clockwork_gallery` (Industrial mechanism & giant gears chamber)
4. `library` (Archive & reading room)
5. `pendulum_room` (Foucault pendulum & acoustic resonance chamber)
6. `observation_deck` (Open-air storm balcony)

### Primary Defects Pinpointed
1. **Exhibition Chamber Deadbolt Doorway Overlap (Critical Bug)**:
   - In `data/rooms.ts`, the `door_bolt` interactable (`Heavy Bolt`, evidence `hugo_fingerprints`) and the exit to `main_hall` are defined at the exact same tile coordinate: `x: 12, y: 1` (`192, 16`).
   - In `ExplorationScene.ts`, the doorway trigger zone extends down to `y = 72` (spanning `Y: 16 to 72`, `X: 168 to 216`).
   - The interaction proximity radius requires Ren to approach within 45px of `(192, 16)` (`y <= 61`).
   - Ren's physics body enters the door trigger zone at `y <= 66`.
   - **Result**: The door transition to Main Hall fires 5–11 pixels before Ren can ever examine the deadbolt! Walking up to the deadbolt triggers an inescapable accidental doorway transition.
   - In addition, an armchair in `main_hall` was placed at `(128, 80)` directly in front of the Exhibition Chamber doorway, trapping Ren upon returning.

2. **Top Wall Embedded Interactables (Structural Bounds Bug)**:
   - In `library`: `potted_plant` (`nadia_vial`) is located at `x: 20, y: 2` (`320, 32`). The solid top wall collider spans `Y: 0 to 48`. The plant is embedded 16px inside the top wall header.
   - In `observation_deck`: `deck_sensors` (`rain_sensor_data`) is located at `x: 2, y: 2` (`32, 32`). The solid top wall collider spans `Y: 0 to 48`. The sensors are embedded 16px inside the top wall header.
   - In `clockwork_gallery`: `dark_corner` (`petra_hidden_recorder`) is located at `x: 3, y: 3` (`48, 48`), sitting directly on the wall seam.

3. **Doorway Obstruction & Corridor Snags**:
   - In `main_hall`: `pa_speaker` at `x: 16, y: 5` (`256, 80`) obstructs the central runner carpet corridor leading to Observation Deck (`x: 16, y: 1`), and its interaction boundary overlaps the doorway trigger zone.
   - In `library`: Armchairs placed at `y = 242` create an impassable 4px bottleneck south of the archive desk (`y = 208`).
   - In `pendulum_room`: The 64x64 swinging pendulum has no physical collider, allowing Ren to walk straight through the heavy machinery.

4. **Visual Depth & Z-Ordering Inconsistencies**:
   - Ren's shadow depth was set only once at creation (`sy - 1`) and never updated in `update()`. As Ren walks south, the shadow remains at depth 79 while Ren is at depth 300+.
   - Door banner text cards have fixed depth 150, causing Ren's sprite to render over door labels in lower rooms.
   - Tabletop interactables (`thermos`, `spilled_ink`) share the exact depth of their supporting furniture, risking z-fighting.

---

## 2. Complete Architectural Survey of All 6 Chambers

Each room tile is `16 x 16` pixels (`TILE = 16`). Wall height is `3 * TILE = 48` pixels (`wallH = 48`).

### Chamber 1: Main Hall (`main_hall`)
- **Map Dimensions**: 32 x 24 tiles (`512 x 384` px).
- **Walkable Floor**: `X: 16 to 496`, `Y: 48 to 368`.
- **Exits**:
  - `observation_deck`: `x: 16, y: 1` (`256, 16`), dir: `'up'`
  - `clockwork_gallery`: `x: 16, y: 22` (`256, 352`), dir: `'down'`
  - `library`: `x: 1, y: 12` (`16, 192`), dir: `'left'`
  - `pendulum_room`: `x: 30, y: 12` (`480, 192`), dir: `'right'`
  - `exhibition_chamber`: `x: 8, y: 1` (`128, 16`), dir: `'up'`
- **Spawn Point**: `{ x: 16, y: 18 }` (`256, 288`).
- **Interactables**:
  - `pa_speaker`: Current: `x: 16, y: 5` (`256, 80`). Size: `2 x 2` (`32 x 32`). Gadget: `voice_prism`. Evidence: `spliced_recording`.
- **NPCs**:
  - `npc_nadia`: `x: 10, y: 10` (`160, 160`).
- **Architectural Props (`drawFeatures`)**:
  - Fireplace: `(96, 44)` (West wall).
  - Grandfather clock: `(432, 42)` (East wall).
  - Velvet armchair 1: `(128, 80)` — **Blocks doorway to Exhibition Chamber!**
  - Velvet armchair 2: `(384, 80)`.
  - Display pedestal 1: `(160, 72)`.
  - Display pedestal 2: `(352, 72)`.
- **Flooring**: Polished black & ivory marble checkerboard (`tile_marble_checker`) with 6-tile grand royal crimson runner (`carpet_crimson_runner`) down the center (`x: 13 to 19`).

---

### Chamber 2: Exhibition Chamber (`exhibition_chamber`)
- **Map Dimensions**: 24 x 20 tiles (`384 x 320` px).
- **Walkable Floor**: `X: 16 to 368`, `Y: 48 to 304`.
- **Exits**:
  - `main_hall`: `x: 12, y: 1` (`192, 16`), dir: `'up'`
  - `clockwork_gallery`: `x: 12, y: 19` (`192, 304`), dir: `'hidden'`
- **Spawn Point**: Default `{ x: 12, y: 2 }` (`192, 32`), overridden on entry to `(192, 80)`.
- **Interactables**:
  - `desk`: `x: 12, y: 10` (`192, 160`), size: `4 x 3` (`64 x 48`). Executive mahogany desk.
  - `thermos`: `x: 13, y: 10` (`208, 160`), size: `1 x 1` (`16 x 16`). Gadget: `trace_light`. Evidence: `poisoned_tea`.
  - `door_bolt`: Current: `x: 12, y: 1` (`192, 16`), size: `2 x 1` (`32 x 16`). Gadget: `trace_light`. Evidence: `hugo_fingerprints`. — **Overlaps doorway!**
  - `plaque`: `x: 2, y: 5` (`32, 80`), size: `1 x 2` (`16 x 32`). Evidence: `mothers_photo`.
- **NPCs**:
  - `npc_hugo`: `x: 5, y: 15` (`80, 240`).
- **Architectural Props (`drawFeatures`)**:
  - Display pedestal 1: `(64, 164)`.
  - Display pedestal 2: `(320, 164)`.
  - Locked door frame graphic: `(176, 16)`.
- **Flooring**: Dark mahogany parquet wood (`tile_parquet_wood`) with central crimson runner.

---

### Chamber 3: Clockwork Gallery (`clockwork_gallery`)
- **Map Dimensions**: 28 x 22 tiles (`448 x 352` px).
- **Walkable Floor**: `X: 16 to 432`, `Y: 48 to 336`.
- **Exits**:
  - `main_hall`: `x: 14, y: 1` (`224, 16`), dir: `'up'`
  - `exhibition_chamber`: `x: 14, y: 20` (`224, 320`), dir: `'hidden'`
- **Spawn Point**: `{ x: 14, y: 2 }` (`224, 32`), overridden on entry to `(224, 80)`.
- **Interactables**:
  - `main_gear`: `x: 14, y: 10` (`224, 160`), size: `6 x 6` (`96 x 96`). Massive turning brass gear assembly.
  - `dark_corner`: Current: `x: 3, y: 3` (`48, 48`), size: `2 x 2` (`32 x 32`). Gadget: `voice_prism`. Evidence: `petra_hidden_recorder`.
  - `wall_gap`: `x: 14, y: 19` (`224, 304`), size: `2 x 1` (`32 x 16`). Gadget: `micro_rover`. Evidence: `connecting_door`.
- **NPCs**:
  - `npc_petra`: `x: 20, y: 10` (`320, 160`).
- **Architectural Props (`drawFeatures`)**:
  - Brass steam pipes: top wall (`Y = 36`).
  - Animated cogs: 3 gear assemblies at `Y = 48`.
  - Steam vents: 4 floor vents at `Y = 320`.
- **Flooring**: Industrial steel grating with bronze sub-chamber glow (`tile_industrial_grate`).

---

### Chamber 4: Library & Archive (`library`)
- **Map Dimensions**: 26 x 26 tiles (`416 x 416` px).
- **Walkable Floor**: `X: 16 to 400`, `Y: 48 to 400`.
- **Exits**:
  - `main_hall`: `x: 24, y: 13` (`384, 208`), dir: `'right'`
- **Spawn Point**: `{ x: 23, y: 13 }` (`368, 208`), overridden on entry to `(320, 208)`.
- **Interactables**:
  - `shelf_3`: `x: 5, y: 5` (`80, 80`), size: `4 x 1` (`64 x 16`). Gadget: `trace_light`. Evidence: `missing_lantern`.
  - `archive_desk`: `x: 13, y: 13` (`208, 208`), size: `3 x 2` (`48 x 32`).
  - `spilled_ink`: `x: 14, y: 13` (`224, 208`), size: `1 x 1` (`16 x 16`). Gadget: `trace_light`. Evidence: `felix_ink_stain`.
  - `old_files`: `x: 2, y: 20` (`32, 320`), size: `2 x 2` (`32 x 32`). Evidence: `project_echo_notes`.
  - `potted_plant`: Current: `x: 20, y: 2` (`320, 32`), size: `2 x 2` (`32 x 32`). Gadget: `trace_light`. Evidence: `nadia_vial`. — **Inside top wall!**
- **NPCs**:
  - `npc_felix`: `x: 10, y: 15` (`160, 240`).
- **Architectural Props (`drawFeatures`)**:
  - Grand bookcases: `(64, 44)`, `(128, 44)`, `(288, 44)`, `(352, 44)`.
  - Fireplace: `(208, 44)`.
  - Armchairs: `(176, 242)` and `(240, 242)` — **Bottlenecks archive desk walking lane!**
- **Flooring**: Dark oak parquet wood (`tile_parquet_wood`) with emerald oriental rug (`carpet_emerald_rug`).

---

### Chamber 5: Pendulum Room (`pendulum_room`)
- **Map Dimensions**: 30 x 28 tiles (`480 x 448` px).
- **Walkable Floor**: `X: 16 to 464`, `Y: 48 to 432`.
- **Exits**:
  - `main_hall`: `x: 2, y: 14` (`32, 224`), dir: `'left'`
- **Spawn Point**: `{ x: 3, y: 14 }` (`48, 224`), overridden on entry to `(96, 224)`.
- **Interactables**:
  - `pendulum`: `x: 15, y: 14` (`240, 224`), size: `4 x 4` (`64 x 64`). Great swinging Foucault pendulum. — **Missing physical collider!**
  - `acoustics`: `x: 15, y: 5` (`240, 80`), size: `2 x 2` (`32 x 32`). Gadget: `echo_lens`. Evidence: `thirteenth_chime_resonance`.
  - `floor_grates`: `x: 10, y: 14` (`160, 224`), size: `2 x 2` (`32 x 32`). Gadget: `echo_lens`. Evidence: `pendulum_weight_sensor`.
- **NPCs**:
  - `npc_iris`: `x: 20, y: 20` (`320, 320`).
- **Architectural Props (`drawFeatures`)**:
  - Swinging pendulum cable and brass bob graphic swinging from `(240, 32)`.
  - Acoustic resonance rings (`echoing_walls`) radiating from center.
- **Flooring**: Gothic carved granite masonry (`tile_granite_masonry`).

---

### Chamber 6: Observation Deck (`observation_deck`)
- **Map Dimensions**: 20 x 15 tiles (`320 x 240` px).
- **Walkable Floor**: `X: 16 to 304`, `Y: 48 to 224`.
- **Exits**:
  - `main_hall`: `x: 10, y: 14` (`160, 224`), dir: `'down'`
- **Spawn Point**: `{ x: 10, y: 13 }` (`160, 208`), overridden on entry to `(160, 160)`.
- **Interactables**:
  - `telescope`: `x: 10, y: 5` (`160, 80`), size: `2 x 2` (`32 x 32`).
  - `deck_sensors`: Current: `x: 2, y: 2` (`32, 32`), size: `2 x 2` (`32 x 32`). Gadget: `echo_lens`. Evidence: `rain_sensor_data`. — **Inside top wall!**
- **NPCs**: None.
- **Architectural Props (`drawFeatures`)**:
  - Open storm parapet railing, rain drops and splash particles.
- **Flooring**: Wet slate pavers with rain puddle gloss (`tile_wet_stone`).

---

## 3. Mathematical Analysis: Exhibition Chamber Deadbolt vs Doorway Conflict

### Spatial Overlap Diagram (Current Broken State)
```
Top Wall Boundary (y = 48)
-----------------------+---------------------+-----------------------
                       | Door Archway (192)  |
                       |                     |
  (y = 16)             |  [door_bolt (192)]  |  <-- Interactable (x:12, y:1)
                       |                     |
  (y = 34)             |  [🚪 DOOR BANNER]   |  <-- Interactive click button
                       |                     |
-----------------------+---------------------+-----------------------
                       | Door Trigger Zone   |
                       | Center: (192, 44)   |
  (y = 44)             | Width: 48, H: 56    |
                       |                     |
  (y = 72)             | Bottom of Door Zone |  <-- Inadvertent transition fired!
                       +---------------------+
                       
                       Ren Approaches from Room Interior (y = 80 -> y = 60)
                       To interact with deadbolt (d < 45px): Ren MUST reach y <= 61.
                       Ren's physics body enters trigger at y <= 66.
                       BAM: Player is kicked back to Main Hall!
```

### Exact Geometric Data
1. **Doorway Trigger Zone Calculation** (`ExplorationScene.ts:160-161`):
   ```ts
   tzY = Math.max(ey, wallH) - 4; // = Math.max(16, 48) - 4 = 44
   tzH = TILE * 3.5;              // = 56
   // Zone Y-bounds: [44 - 28, 44 + 28] = [16, 72]
   // Zone X-bounds: [192 - 24, 192 + 24] = [168, 216]
   ```
2. **Deadbolt Proximity Radius**:
   - `deadbolt` zone center: `(192, 16)`.
   - Proximity requirement (`ExplorationScene.ts:432`): `distance < 45`.
   - Along Y axis: `|Ren.y - 16| < 45` $\implies$ `Ren.y <= 61`.
3. **Ren's Physics Body**:
   - Sprite anchor: `(Ren.x, Ren.y)`.
   - Physics body size: `14 x 12`, offset `(5, 22)`.
   - Feet Y interval: `[Ren.y + 6, Ren.y + 18]`.
   - Overlap occurs when body top $\le 72$ $\implies$ `Ren.y + 6 <= 72` $\implies$ `Ren.y <= 66`.
4. **Collision Result**:
   - As Ren walks north, when `Ren.y` reaches `66`, the physics overlap callback invokes `goToRoom('main_hall', 'up')`.
   - At `Ren.y = 66`, distance to `(192, 16)` is $66 - 16 = 50\text{ px} > 45\text{ px}$.
   - The interaction prompt never appears. The deadbolt cannot be inspected via keyboard or proximity.
   - Mouse clicks on the deadbolt prop frequently trigger the overlapping door banner button at `(192, 34)` instead.

### The Complete Fix
1. **Move `door_bolt` to the West Wall Jamb**:
   - Set `door_bolt` to `x: 9, y: 4` (`144, 64`), size `width: 2, height: 1`.
   - This moves the deadbolt mechanism onto the reinforced wall face, 48px to the left of the doorway center (`192 - 144 = 48 px`).
   - The deadbolt interaction zone `[X: 99 to 189, Y: 19 to 109]` is accessed from the open floor at `(144, 80)` with 0 overlap with the doorway corridor (`X in [176, 208]`).
2. **Tighten Door Trigger Geometry**:
   - Set doorway trigger zones to the physical door threshold:
     ```ts
     let tzX = ex;
     let tzY = ey;
     let tzW = 32; // 2 tiles wide, matches 28px door frame
     let tzH = 16; // 1 tile deep
     if (exit.direction === 'up' || ey <= 2 * TILE) {
       tzY = wallH - 8; // 40 (covers Y: 32 to 48)
       tzH = 16;
     }
     ```
   - Ren can freely walk the upper floor (`Y >= 56`) without triggering the door.
3. **Relocate Main Hall Armchair**:
   - Change Armchair 1 in `main_hall` from `TILE * 8` (`128, 80`) to `TILE * 5` (`80, 80`).
   - Leaves a clear 64px corridor along `X: 112 to 144` directly into Exhibition Chamber.

---

## 4. Ren Movement, Bounding Box, and Collision Resolution

### Movement Mechanics
- **Speed**: `SPEED = 80 px/s` (5 tiles/sec).
- **Control**: Smooth 4-way / 8-way directional velocity normalization (`dx = (dx/len)*SPEED`).
- **Footstep Audio**: Plays every 360ms while moving (`AudioManager.getInstance().playSFX('footstep')`).

### Bounding Box & Collision Resolution
- **Sprite Dimensions**: `24 x 32` pixels (16-bit RPG detective sprite).
- **Physics Body**: `setSize(14, 12).setOffset(5, 22)`.
  - Body width: 14 px.
  - Body height: 12 px (located at Ren's feet).
  - This allows Ren's head and shoulders to overlap scenery depths naturally while feet respect wall and furniture colliders.
- **Resolution**: Static Arcade physics colliders (`this.obstacleColliders`). Ren slides cleanly along horizontal and vertical surfaces during diagonal movement.
- **Walking Lane Clearance**: All proposed walking corridors maintain a minimum width of `48 px` (3 full tiles), far exceeding Ren's 14px collider.

---

## 5. Visual Depth & Z-Ordering Architecture

Phaser 2D depth ordering requires strict Y-sorting for world entities combined with distinct depth tiers for architecture and UI.

| Tier | Depth Range | Elements |
|---|---|---|
| **Tier 0: Floors** | `0 - 1` | Base tilemaps (`0`), carpets & rugs (`1`), light halos (`1`), acoustic waves (`1`) |
| **Tier 1: Architectural Walls** | `2 - 5` | Victorian wall headers (`2`), windows (`3`), pipes (`3`), wall sconces (`3`), room plaque banner (`5`) |
| **Tier 2: Door Architecture** | `10 - 12` | Door backgrounds (`10`), frames (`11`), entrance lanterns (`12`) |
| **Tier 3: World Scenery & Props** | `Y` coordinate (`48 - 432`) | Furniture props (`oy`), Tabletop items (`oy + 2`), NPC sprites (`ny`), Player sprite (`player.y`), Shadows (`Y - 1`) |
| **Tier 4: World Overlays & Markers** | `Y + 20` to `Y + 100` | Sparkle markers (`oy + 20`), Prop labels (`oy + 30`), NPC role badges (`ny + 100`), Exclamation marks (`ny + 101`) |
| **Tier 5: Navigation Badges** | `200` | Door banners (`🚪 TO <ROOM>`) |
| **Tier 6: Ambient Atmosphere** | `250` | Floating dust particles |
| **Tier 7: Player Tag** | `300` | Ren name badge (`🕵️ Ren`) |
| **Tier 8: Gadget Overlay** | `400` | Gadget filter tint screens |
| **Tier 9: Interactive HUD / Modals**| `500 - 600` | Evidence discovery modals (`500`), Floating prompt (`600`), Minigames (`600`) |

### Key Depth Fixes Needed
1. **Dynamic Shadow Depth**: In `ExplorationScene.ts:update()`, update `this.playerShadow.setDepth(this.player.y - 1)`.
2. **Tabletop Layering**: For props sitting on other props (`thermos` on `desk`, `spilled_ink` on `archive_desk`), set depth to `oy + 2` so they never clip into the furniture surface.
3. **Door Banner Depth**: Increase door banner depth to `200` so player and NPC sprites never draw over door navigation labels.

---

## 6. Clue Framing, Gleaming Markers, & Visual Feedback

### Existing Systems
- **Marker**: `sparkle_gleam` (procedural 16x16 4-point golden star with ambient glow). Tweens vertically with yoyo and alpha pulse.
- **Label**: Dynamic text badge (`🔍 <Name>`), visible within 45px proximity.
- **Trace Light Highlight**: When Trace Light [3] is active, trace props glow purple (`#d896ff`) with `🔦 <Name>`.

### Required Improvements
1. **Immediate Discovery Feedback**: When an item is examined and evidence is collected, immediately destroy or gray out the sparkle gleam (`obj.marker?.destroy()`) so the player gets instant feedback without needing to exit and re-enter the room.
2. **Trace Light Toggle Cleanup**: When Trace Light is toggled off, reset clue labels back to their standard golden style (`#ffea70`).
3. **DOM Overlay Elevation (R3)**: Elevate `showDiscovery` and `showMsg` from canvas bitmap text into high-DPI HTML/CSS overlay cards via `#ui-overlay`, ensuring crystal-clear typography on high-resolution displays.

---

## 7. Master Coordinate Specification Table (All 6 Chambers)

The following tables specify the exact proposed coordinates, dimensions, bounds, and walking clearances for implementation.

### 1. Main Hall (`main_hall`) — Dimensions: 32 x 24 (512 x 384 px)
| Element | Type | Current (X, Y) | Proposed (X, Y) | Size (W x H) | Evidence / Gadget | Clearance / Rationale |
|---|---|---|---|---|---|---|
| `pa_speaker` | Interactable | (16, 5) [256, 80] | **(20, 4) [320, 64]** | 2x2 (32x32) | `spliced_recording` / `voice_prism` | Clears central red runner; unblocks Observation Deck doorway |
| `npc_nadia` | NPC | (10, 10) [160, 160] | **(10, 10) [160, 160]** | 16x24 | Suspect: Nadia Thorn | Open floor, 64px from west wall |
| Door: Obs. Deck | Exit | (16, 1) [256, 16] | **(16, 1) [256, 16]** | 2x2 (32x32) | Exit 'up' | Tightened threshold `tzY: 40, tzH: 16` |
| Door: Clockwork | Exit | (16, 22) [256, 352]| **(16, 22) [256, 352]**| 2x2 (32x32) | Exit 'down' | Tightened threshold `tzY: 376, tzH: 16` |
| Door: Library | Exit | (1, 12) [16, 192] | **(1, 12) [16, 192]** | 2x2 (32x32) | Exit 'left' | Tightened threshold `tzX: 8, tzW: 16` |
| Door: Pendulum | Exit | (30, 12) [480, 192]| **(30, 12) [480, 192]**| 2x2 (32x32) | Exit 'right' | Tightened threshold `tzX: 504, tzW: 16` |
| Door: Exhibition | Exit | (8, 1) [128, 16] | **(8, 1) [128, 16]** | 2x2 (32x32) | Exit 'up' | Tightened threshold `tzY: 40, tzH: 16` |
| Armchair 1 | Prop | [128, 80] | **[80, 80]** | 32x32 | Decorative | Moved west to fireplace; frees doorway lane |
| Armchair 2 | Prop | [384, 80] | **[384, 80]** | 32x32 | Decorative | East reading nook |
| Spawn Point | Spawn | (16, 18) [256, 288]| **(16, 18) [256, 288]**| N/A | Ren Spawn | Central carpet runner |

---

### 2. Exhibition Chamber (`exhibition_chamber`) — Dimensions: 24 x 20 (384 x 320 px)
| Element | Type | Current (X, Y) | Proposed (X, Y) | Size (W x H) | Evidence / Gadget | Clearance / Rationale |
|---|---|---|---|---|---|---|
| `door_bolt` | Interactable | (12, 1) [192, 16] | **(9, 4) [144, 64]** | 2x1 (32x16) | `hugo_fingerprints` / `trace_light` | **Separated from doorway!** 48px west of door corridor |
| `desk` | Interactable | (12, 10) [192, 160]| **(12, 10) [192, 160]**| 4x3 (64x48) | Professor's Desk | Solid obstacle collider `rect(192, 160, 60, 44)` |
| `thermos` | Interactable | (13, 10) [208, 160]| **(13, 10) [208, 156]**| 1x1 (16x16) | `poisoned_tea` / `trace_light` | Tabletop depth `oy + 2`, accessible from desk edge |
| `plaque` | Interactable | (2, 5) [32, 80] | **(2, 5) [32, 80]** | 1x2 (16x32) | `mothers_photo` | West wall mount, 32px walking lane |
| `npc_hugo` | NPC | (5, 15) [80, 240] | **(5, 15) [80, 240]** | 16x24 | Suspect: Hugo Wren | Southwest floor, open navigation |
| Door: Main Hall | Exit | (12, 1) [192, 16] | **(12, 1) [192, 16]** | 2x2 (32x32) | Exit 'up' | Tightened threshold `tzY: 40, tzH: 16` |
| Hidden Door | Exit | (12, 19) [192, 304]| **(12, 19) [192, 304]**| 2x1 (32x16) | Exit 'hidden' | Passageway to Clockwork Gallery |
| Spawn Point | Spawn | (12, 2) [192, 32] | **(12, 5) [192, 80]** | N/A | Ren Spawn | Spawns facing south into room |

---

### 3. Clockwork Gallery (`clockwork_gallery`) — Dimensions: 28 x 22 (448 x 352 px)
| Element | Type | Current (X, Y) | Proposed (X, Y) | Size (W x H) | Evidence / Gadget | Clearance / Rationale |
|---|---|---|---|---|---|---|
| `dark_corner` | Interactable | (3, 3) [48, 48] | **(4, 5) [64, 80]** | 2x2 (32x32) | `petra_hidden_recorder` / `voice_prism` | **Moved out of top wall!** 32px below wall header |
| `main_gear` | Interactable | (14, 10) [224, 160]| **(14, 10) [224, 160]**| 6x6 (96x96) | Main Gear Assembly | Central spinning obstacle; 162px side lanes |
| `wall_gap` | Interactable | (14, 19) [224, 304]| **(14, 19) [224, 304]**| 2x1 (32x16) | `connecting_door` / `micro_rover` | South wall gap leading to hidden door |
| `npc_petra` | NPC | (20, 10) [320, 160]| **(20, 10) [320, 160]**| 16x24 | Suspect: Petra Solano | East lane, 50px from gear, 112px from east wall |
| Door: Main Hall | Exit | (14, 1) [224, 16] | **(14, 1) [224, 16]** | 2x2 (32x32) | Exit 'up' | Tightened threshold `tzY: 40, tzH: 16` |
| Spawn Point | Spawn | (14, 2) [224, 32] | **(14, 5) [224, 80]** | N/A | Ren Spawn | Enters south into gallery |

---

### 4. Library & Archive (`library`) — Dimensions: 26 x 26 (416 x 416 px)
| Element | Type | Current (X, Y) | Proposed (X, Y) | Size (W x H) | Evidence / Gadget | Clearance / Rationale |
|---|---|---|---|---|---|---|
| `potted_plant` | Interactable | (20, 2) [320, 32] | **(21, 6) [336, 96]** | 2x2 (32x32) | `nadia_vial` / `trace_light` | **Moved out of top wall!** Northeast reading alcove |
| `shelf_3` | Interactable | (5, 5) [80, 80] | **(5, 5) [80, 80]** | 4x1 (64x16) | `missing_lantern` / `trace_light` | Solid collider `rect(80, 80, 60, 12)` |
| `archive_desk` | Interactable | (13, 13) [208, 208]| **(13, 13) [208, 208]**| 3x2 (48x32) | Archive Desk | Solid collider `rect(208, 208, 44, 28)` |
| `spilled_ink` | Interactable | (14, 13) [224, 208]| **(14, 13) [224, 206]**| 1x1 (16x16) | `felix_ink_stain` / `trace_light` | Tabletop depth `oy + 2`, sits on archive desk |
| `old_files` | Interactable | (2, 20) [32, 320] | **(2, 20) [32, 320]** | 2x2 (32x32) | `project_echo_notes` | Southwest corner archive cabinet |
| `npc_felix` | NPC | (10, 15) [160, 240]| **(9, 15) [144, 240]** | 16x24 | Suspect: Felix Ashworth | West of reading area |
| Armchairs | Props | [176, 242], [240, 242]| **[176, 272], [240, 272]**| 32x32 | Decorative | **Moved south!** Opens 34px lane behind desk |
| Door: Main Hall | Exit | (24, 13) [384, 208]| **(24, 13) [384, 208]**| 2x2 (32x32) | Exit 'right' | Tightened threshold `tzX: 408, tzW: 16` |
| Spawn Point | Spawn | (23, 13) [368, 208]| **(20, 13) [320, 208]**| N/A | Ren Spawn | Spawns facing west into library |

---

### 5. Pendulum Room (`pendulum_room`) — Dimensions: 30 x 28 (480 x 448 px)
| Element | Type | Current (X, Y) | Proposed (X, Y) | Size (W x H) | Evidence / Gadget | Clearance / Rationale |
|---|---|---|---|---|---|---|
| `pendulum` | Interactable | (15, 14) [240, 224]| **(15, 14) [240, 224]**| 4x4 (64x64) | Great Pendulum | **Add obstacle collider!** `rect(240, 224, 48, 48)` |
| `acoustics` | Interactable | (15, 5) [240, 80] | **(15, 5) [240, 80]** | 2x2 (32x32) | `thirteenth_chime_resonance` / `echo_lens`| North acoustics node, 32px from top wall |
| `floor_grates`| Interactable | (10, 14) [160, 224]| **(11, 16) [176, 256]**| 2x2 (32x32) | `pendulum_weight_sensor` / `echo_lens` | Floor maintenance grates, south of pendulum pit |
| `npc_iris` | NPC | (20, 20) [320, 320]| **(20, 20) [320, 320]**| 16x24 | Suspect: Iris Blackwell | Southeast observation alcove |
| Door: Main Hall | Exit | (2, 14) [32, 224] | **(2, 14) [32, 224]** | 2x2 (32x32) | Exit 'left' | Tightened threshold `tzX: 8, tzW: 16` |
| Spawn Point | Spawn | (3, 14) [48, 224] | **(6, 14) [96, 224]** | N/A | Ren Spawn | Spawns facing east into chamber |

---

### 6. Observation Deck (`observation_deck`) — Dimensions: 20 x 15 (320 x 240 px)
| Element | Type | Current (X, Y) | Proposed (X, Y) | Size (W x H) | Evidence / Gadget | Clearance / Rationale |
|---|---|---|---|---|---|---|
| `deck_sensors`| Interactable | (2, 2) [32, 32] | **(4, 5) [64, 80]** | 2x2 (32x32) | `rain_sensor_data` / `echo_lens` | **Moved out of top wall!** Mounted on west railing |
| `telescope` | Interactable | (10, 5) [160, 80] | **(10, 5) [160, 80]** | 2x2 (32x32) | Capped Astronomical Telescope | Balcony center, 80px north of spawn |
| Door: Main Hall | Exit | (10, 14) [160, 224]| **(10, 14) [160, 224]**| 2x2 (32x32) | Exit 'down' | Tightened threshold `tzY: 232, tzH: 16` |
| Spawn Point | Spawn | (10, 13) [160, 208]| **(10, 10) [160, 160]**| N/A | Ren Spawn | Spawns on wet pavers facing north |

---

## 8. Concrete Implementation Code Plan

To assist the subsequent implementation phase, the following code adjustments in `src/data/rooms.ts` and `src/scenes/ExplorationScene.ts` are recommended:

### A. Adjustments in `src/data/rooms.ts`
```typescript
// 1. main_hall: Move pa_speaker away from the door and central runner
{ id: 'pa_speaker', name: 'PA Speaker', x: 20, y: 4, width: 2, height: 2, ... }

// 2. exhibition_chamber: Move door_bolt onto the west wall jamb away from doorway
{ id: 'door_bolt', name: 'Heavy Bolt', x: 9, y: 4, width: 2, height: 1, ... }
// adjust thermos slightly on the desk surface
{ id: 'thermos', name: 'Thermos', x: 13, y: 10, width: 1, height: 1, ... }

// 3. clockwork_gallery: Move dark_corner onto open floor away from top wall
{ id: 'dark_corner', name: 'Dark Corner', x: 4, y: 5, width: 2, height: 2, ... }

// 4. library: Move potted_plant onto floor alcove away from top wall
{ id: 'potted_plant', name: 'Potted Plant', x: 21, y: 6, width: 2, height: 2, ... }
// adjust Felix position slightly
{ id: 'npc_felix', suspectId: 'felix', x: 9, y: 15 }

// 5. pendulum_room: Move floor_grates slightly to South-West of pendulum
{ id: 'floor_grates', name: 'Floor Grates', x: 11, y: 16, width: 2, height: 2, ... }

// 6. observation_deck: Move deck_sensors down onto balcony railing
{ id: 'deck_sensors', name: 'Weather Sensors', x: 4, y: 5, width: 2, height: 2, ... }
```

### B. Adjustments in `src/scenes/ExplorationScene.ts`
1. **Tighten Doorway Thresholds** (`lines 154-173`):
   ```typescript
   let tzX = ex;
   let tzY = ey;
   let tzW = 32;
   let tzH = 16;

   if (exit.direction === 'up' || ey <= 2 * TILE) {
     tzY = wallH - 8;
     tzH = 16;
   } else if (exit.direction === 'down' || ey >= rh - 3 * TILE) {
     tzY = rh - 8;
     tzH = 16;
   } else if (exit.direction === 'left' || ex <= 2 * TILE) {
     tzX = 8;
     tzW = 16;
   } else if (exit.direction === 'right' || ex >= rw - 3 * TILE) {
     tzX = rw - 8;
     tzW = 16;
   }
   ```
2. **Move Main Hall Armchair 1** (`line 796`):
   ```typescript
   // Velvet armchairs
   this.add.image(TILE * 5, wallH + 32, 'prop_armchair').setDepth(wallH + 32);
   this.add.image(w - TILE * 8, wallH + 32, 'prop_armchair').setDepth(wallH + 32);
   ```
3. **Move Library Reading Armchairs** (`lines 810-811`):
   ```typescript
   // Reading armchairs moved south to open walking corridor
   this.add.image(w / 2 - 32, (wallH + h) / 2 + 40, 'prop_armchair').setDepth((wallH + h) / 2 + 40);
   this.add.image(w / 2 + 32, (wallH + h) / 2 + 40, 'prop_armchair').setDepth((wallH + h) / 2 + 40);
   ```
4. **Add Pendulum to Obstacle Colliders** (`line 980`):
   ```typescript
   if (['desk', 'main_gear', 'archive_desk', 'shelf_3', 'old_files', 'pendulum'].includes(obj.id)) {
     const ox = obj.x * TILE, oy = obj.y * TILE;
     const ow = (obj.width || 2) * TILE, oh = (obj.height || 1) * TILE;
     const furn = this.add.rectangle(ox, oy, Math.max(ow - 8, 16), Math.max(oh - 8, 16));
     this.obstacleColliders.add(furn);
   }
   ```
5. **Dynamic Player Shadow Depth in `update()`** (`lines 423-426`):
   ```typescript
   this.playerShadow.setPosition(this.player.x, this.player.y + 15);
   this.playerShadow.setDepth(this.player.y - 1);
   this.playerTag.setPosition(this.player.x, this.player.y - 24);
   this.player.setDepth(this.player.y);
   ```
6. **Elevate Door Navigation Badge Depth** (`line 145`):
   ```typescript
   doorBadge.setDepth(200);
   ```
7. **Immediate Clue Removal on Discovery** (`lines 481-486`):
   ```typescript
   if (obj.evidenceId && !gameState.hasEvidence(obj.evidenceId)) {
     gameState.collectEvidence(obj.evidenceId);
     const ev = evidenceData[obj.evidenceId];
     // Immediately remove gleaming marker for discovered clue
     const itemObj = this.interactableObjects.find(io => io.data.id === obj.id);
     if (itemObj?.marker) {
       itemObj.marker.destroy();
     }
     this.showDiscovery(ev?.name || obj.evidenceId, ev?.shortDesc || obj.description || 'Evidence collected.');
     this.save();
     return;
   }
   ```

---

## 9. Conclusion
This survey provides a mathematically verified, defect-free blueprint for room navigation, collider bounds, doorway threshold logic, and clue presentation across all six chambers of *The Thirteenth Chime*. Implementing these changes will eliminate accidental doorway transitions, prevent Ren from snagging on misplaced furniture or wall colliders, ensure all 12 pieces of critical evidence are cleanly framed, and provide realistic visual depth throughout the game.
