# Original User Request

## 2026-10-02T08:31:14Z

Overhaul the narrative hint system, room furniture and interactable object layouts, and description/dialogue text rendering clarity for the 2D detective mystery game "The Thirteenth Chime".

Working directory: C:\Users\Lenovo\.gemini\antigravity\scratch\murdermysterygame
Integrity mode: development

## Requirements

### R1. Story Flow Review & Dynamic 3-Tier Progressive Hint System
Review every chapter of the story (`investigation_1`, `midpoint_reversal`, `investigation_2`, `reconstruction`, `final_confrontation`). The in-game hint system (triggered by pressing `H` or clicking `Hint`) must dynamically evaluate the player's exact missing evidence and flags in the current phase. It must deliver a progressive 3-tier hint structure:
1. **Tier 1 (Atmospheric Nudge)**: A subtle thematic direction pointing toward the general anomaly or area.
2. **Tier 2 (Room & Focus Direction)**: Identifies the target chamber and what kind of clue or mechanism to search for.
3. **Tier 3 (Actionable Detective Direction)**: Explicitly names the required gadget (with hotkey) or specific suspect confrontation step to advance the narrative.

### R2. Spatial & Aesthetic Overhaul of Furniture and Clue Placements
Improve the architectural furniture, suspect NPC placement, and interactable investigation objects across all 6 observatory chambers (`main_hall`, `exhibition_chamber`, `clockwork_gallery`, `library`, `pendulum_room`, `observation_deck`). Ensure:
- No furniture or interactable objects obstruct door trigger areas or wall exit thresholds (especially the Exhibition Chamber deadbolt and Main Hall doorways).
- Natural spatial arrangement with realistic visual depth (Z-ordering) and comfortable walking lanes.
- Clear visual framing and gleaming markers for clues, ensuring each room feels distinct, atmospheric, and easy to navigate.

### R3. Crystal-Clear High-Definition Typography & UI Readability
Eliminate blurry, pixelated, or hard-to-read text in all object descriptions, evidence discovery notifications, floating prompts, and dialogue boxes:
- Implement clean, modern, high-contrast typography with sharp font rendering (e.g. system sans-serif / Georgia serif with crisp anti-aliasing) for reading content.
- Elevate low-resolution canvas-rendered toasts (such as `showDiscovery`, `showMsg`, and hint notifications) into sharp, high-DPI HTML/CSS overlay cards or crisp high-contrast modals.
- Ensure text is legible on all display resolutions without fractional scaling distortion or muddy backgrounds.

## Acceptance Criteria

### Narrative Hints (Tiered & Phase-Aware)
- [ ] During `investigation_1`, pressing `H` gives distinct Tier 1, Tier 2, and Tier 3 hints targeting whichever of the 3 key clues (`connecting_door`, `hugo_fingerprints`, `rain_sensor_data`) the player is currently missing, followed by the Hugo confrontation hint once collected.
- [ ] During `investigation_2`, hints direct the player to investigate the PA speaker splice, analyze Petra's audio recorder, and find the solvent vial.
- [ ] During `final_confrontation`, hints clearly guide the player to present the forged announcement proof and accuse the true killer.
- [ ] No hint returns outdated instructions (such as referring to Aldric alive in the Main Hall).

### Room Layout & Collision
- [ ] Player Ren can navigate through all doorways and room centers without colliding into misplaced furniture or getting blocked by collision bounds.
- [ ] Interacting with the Exhibition Chamber deadbolt does not trigger accidental doorway transitions to the Main Hall.
- [ ] All suspect NPCs and interactable items remain fully accessible, visibly framed, and properly layered.

### Typography & Readability
- [ ] All item examination descriptions and discovery notifications render in sharp, non-blurry, high-contrast text readable at a glance.
- [ ] Dialogue speaker badges, body text, and choice options are clearly legible with clean line spacing and no font blurring.
- [ ] TypeScript and Vite build passes cleanly via `npm run build` with 0 compiler errors.
