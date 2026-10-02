# Orchestration Plan: The Thirteenth Chime Overhaul

## Objectives
Overhaul 'The Thirteenth Chime' to satisfy all requirements and acceptance criteria in `ORIGINAL_REQUEST.md`:
1. R1: Dynamic 3-Tier Progressive Hint System across all 5 narrative phases
2. R2: Spatial, Aesthetic, and Collision Overhaul across all 6 chambers
3. R3: High-Definition Typography & Modern High-DPI UI Overlay

## Phased Execution Plan

### Phase 0: Codebase Survey (3 Explorers in Parallel)
- **Explorer 1 (R1 - Narrative & Hint Architecture)**:
  - Investigate `investigation_1`, `midpoint_reversal`, `investigation_2`, `reconstruction`, `final_confrontation` state machines and flags.
  - Map missing clue tracking (`connecting_door`, `hugo_fingerprints`, `rain_sensor_data`, PA speaker splice, audio recorder, solvent vial, forged announcement).
  - Identify current hint trigger (`H` key / Hint button) and how 3 tiers (Atmospheric Nudge, Room & Focus, Actionable Direction) should be integrated.
- **Explorer 2 (R2 - Chambers, Furniture & Collision)**:
  - Investigate 6 chambers: `main_hall`, `exhibition_chamber`, `clockwork_gallery`, `library`, `pendulum_room`, `observation_deck`.
  - Check doorway trigger bounds, exhibition chamber deadbolt trigger vs doorway collision, walking lanes, Z-ordering, clue gleam/markers.
- **Explorer 3 (R3 - UI, Typography & Build/Test Tooling)**:
  - Investigate current text rendering (canvas vs DOM), dialogue boxes, item examination popups, `showDiscovery`, `showMsg`.
  - Analyze font configuration, CSS/HTML overlay capabilities, Vite/TypeScript build config and existing test suite.

### Phase 1: Global Architecture & Test Infrastructure
- Synthesize survey findings into `PROJECT.md` with Feature Inventory and Interface Contracts.
- Define `TEST_INFRA.md` for requirement-driven E2E verification.

### Phase 2: Dual Track Implementation & E2E Testing
- **Track 1 (E2E Testing Track)**:
  - Test Writer builds test suite covering Tier 1 (Feature Coverage), Tier 2 (Boundary/Edge Cases), Tier 3 (Cross-feature), Tier 4 (Real-world game flow).
  - Publishes `TEST_READY.md`.
- **Track 2 (Implementation Track)**:
  - Milestone 1: Story Flow & 3-Tier Dynamic Progressive Hint System (R1).
  - Milestone 2: Spatial, Aesthetic Room Overhaul & Collision Polish (R2).
  - Milestone 3: High-DPI Typography & Sharp UI Overlay Migration (R3).
  - Milestone 4: E2E Integration, Bug Fixing & Adversarial Hardening.

### Phase 3: Forensic Integrity Audit & Multi-Agent Gate
- Reviewers verify code quality, acceptance criteria, layout conformance.
- Challengers empirically stress-test hint progression, collision walkability, UI clarity.
- Forensic Auditor performs non-negotiable integrity check.

### Phase 4: Final Sign-off & Report
- Update progress and handoff, report results to Sentinel parent.
