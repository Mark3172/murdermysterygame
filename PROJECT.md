# Project: The Thirteenth Chime Overhaul

## Architecture
- **Engine**: Phaser 3 (Canvas 640x360, pixelArt: true) + HTML5/CSS DOM Overlay Layer (`#ui-overlay`).
- **Data Flow**:
  - `src/logic/GameState.ts`: Single source of truth for phases, inventory/evidence, flags, and deductions.
  - `src/logic/HintSystem.ts`: Dynamic 3-Tier evaluation engine querying `GameState` for missing objectives in current phase.
  - `src/data/rooms.ts`: Definitions of rooms, exits, furniture, and interactable positions.
  - `src/scenes/ExplorationScene.ts`: World exploration, player movement, collision resolution, door triggers, and interaction zones.
  - `src/scenes/UIScene.ts`: Heads-up display, inventory bar, gadget selector, and hint trigger key handling.
  - `EventBus.ts`: Decoupled bridge between Phaser scenes and `#ui-overlay` in DOM.
  - `index.html`: Native-resolution vector typography and high-DPI HTML/CSS overlay cards.

## Code Layout & Ownership
- `src/logic/HintSystem.ts`: Owned by M1 (Hint System)
- `src/data/rooms.ts`: Owned by M2 (Room Layouts & Collision)
- `src/scenes/ExplorationScene.ts`:
  - Room layout, collision bounds, door zones, interactable positioning: M2
  - EventBus bridge for DOM overlays (`showDiscovery`, `showMsg`, prompts): M3
- `src/scenes/UIScene.ts`: Hint trigger & DOM event emission: M1 & M3
- `index.html`: DOM overlay elements & high-contrast CSS typography: M3
- `tests/`: Owned by E2E Testing Track

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Dynamic Missing Clue Evaluation | Dynamically detects exact missing clues and flags in the active phase | M1 | ORIGINAL_REQUEST §R1 |
| F2 | Tier 1 Atmospheric Nudge | Subtle thematic direction pointing toward the general anomaly or area | M1 | ORIGINAL_REQUEST §R1 |
| F3 | Tier 2 Room & Focus Direction | Identifies the target chamber and what kind of clue or mechanism to search for | M1 | ORIGINAL_REQUEST §R1 |
| F4 | Tier 3 Actionable Detective Direction | Explicitly names the required gadget (with hotkey) or specific confrontation step | M1 | ORIGINAL_REQUEST §R1 |
| F5 | Phase-Aware Hint Progression | Full coverage across investigation_1, midpoint_reversal, investigation_2, reconstruction, final_confrontation | M1 | ORIGINAL_REQUEST §R1 |
| F6 | Elimination of Outdated Hints | Remove/prevent outdated instructions (e.g., Aldric alive in Main Hall) | M1 | ORIGINAL_REQUEST §R1 |
| F7 | Exhibition Chamber Deadbolt Isolation | Relocate deadbolt to (144, 64) and tighten doorway triggers to prevent accidental room transitions | M2 | ORIGINAL_REQUEST §R2 |
| F8 | Unblocked Doorways & Walking Lanes | Relocate armchairs and obstacles away from doorway spawn points and corridors | M2 | ORIGINAL_REQUEST §R2 |
| F9 | Top-Wall Clue Clearance | Move potted_plant (Library), deck_sensors (Observation Deck), dark_corner (Clockwork Gallery) out of wall colliders | M2 | ORIGINAL_REQUEST §R2 |
| F10 | Visual Depth & Z-Ordering Polish | Dynamic player shadow depth, tabletop prop layering, and pendulum base collision box | M2 | ORIGINAL_REQUEST §R2 |
| F11 | Clue Gleam & Feedback Polish | Distinct gleaming markers for interactables, cleanly disposed upon discovery | M2 | ORIGINAL_REQUEST §R2 |
| F12 | High-DPI HTML/CSS Overlay Toasts & Cards | Elevate showDiscovery, showMsg, and showHint to crisp DOM cards in #ui-overlay | M3 | ORIGINAL_REQUEST §R3 |
| F13 | High-Definition Typography System | Clean modern sans-serif for UI/badges/choices, elegant Georgia serif for narrative/clues, high contrast | M3 | ORIGINAL_REQUEST §R3 |
| F14 | Dialogue & Choice Typography Polish | Sharp font rendering, clean line spacing, and crisp contrast without blurriness | M3 | ORIGINAL_REQUEST §R3 |
| F15 | Comprehensive E2E Verification & Typecheck | Zero build/test errors, complete acceptance criteria verification | M4 | ORIGINAL_REQUEST Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Suite | Comprehensive test suite covering Tiers 1-4 for all F1-F15 | Survey Complete | DONE |
| M1 | Dynamic 3-Tier Hint System | F1-F6: HintSystem.ts overhaul, tier cycling, phase checks, clue unifications | Survey Complete | DONE |
| M2 | Room Layouts & Collision Polish | F7-F11: rooms.ts & ExplorationScene.ts layout, deadbolt isolation, unblocked lanes | Survey Complete | DONE |
| M3 | HD Typography & UI Overlays | F12-F14: index.html DOM cards, EventBus bridges, crisp font styling | M1, M2 | DONE |
| M4 | Final Integration & Gate | F15: 100% E2E test pass, review, challenge, and forensic audit | E2E, M1, M2, M3 | DONE |

## Interface Contracts
### HintSystem ↔ Scenes / UI
- `hintSystem.getHint(): { level: 1 | 2 | 3, text: string, objectiveId: string } | null`
- `hintSystem.cycleTier(): { level: 1 | 2 | 3, text: string, objectiveId: string } | null`
- EventBus event `'show-hint'`: payload `{ level: 1 | 2 | 3, text: string, category?: string }`

### ExplorationScene ↔ UI Overlay (DOM Bridge)
- EventBus event `'show-discovery'`: payload `{ name: string, description: string, category?: string }`
- EventBus event `'show-msg'`: payload `{ text: string }`
- EventBus event `'update-prompt'`: payload `{ text: string, visible: boolean }`
