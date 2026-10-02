# E2E Test Infra: The Thirteenth Chime Overhaul

## Test Philosophy
- Opaque-box, requirement-driven. Derived from `ORIGINAL_REQUEST.md` and user-facing acceptance criteria.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Dynamic Missing Clue Evaluation | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | Tier 1 Atmospheric Nudge | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | Tier 2 Room & Focus Direction | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 4 | Tier 3 Actionable Detective Direction | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 5 | Phase-Aware Hint Progression | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 6 | Elimination of Outdated Hints | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 7 | Exhibition Chamber Deadbolt Isolation | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 8 | Unblocked Doorways & Walking Lanes | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 9 | Top-Wall Clue Clearance | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 10 | Visual Depth & Z-Ordering Polish | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 11 | Clue Gleam & Feedback Polish | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 12 | High-DPI HTML/CSS Overlay Toasts & Cards | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 13 | High-Definition Typography System | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 14 | Dialogue & Choice Typography Polish | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 15 | Build & TypeScript Typecheck Verification | ORIGINAL_REQUEST Acceptance Criteria | 5 | 5 | ✓ |

## Test Architecture
- Test runner: Automated Node/TypeScript test runner executing end-to-end integration test suites.
- Location: `tests/` directory at project root.
- Pass/Fail semantics: Exit code 0 on all tests passing, non-zero on assertion failure.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Complete Investigation 1 Playthrough: Missing Clues -> Tier 1-3 Hints -> Hugo Confrontation | F1-F6, F7, F8 | High |
| 2 | Deadbolt Examination without Accidental Room Transition | F7, F8, F10 | Medium |
| 3 | Complete Investigation 2 Playthrough: PA Speaker -> Recorder -> Solvent Vial | F1-F6, F9, F11 | High |
| 4 | Final Confrontation Accusation & Proof Presentation Flow | F1-F6, F12-F14 | High |
| 5 | High-DPI Typography & Overlay Verification Across Elements | F12-F14 | Medium |

## Coverage Thresholds
- Tier 1: ≥5 per feature
- Tier 2: ≥5 per feature (where boundaries exist)
- Tier 3: pairwise coverage of major feature interactions
- Tier 4: ≥5 realistic application scenarios
- Total threshold: Comprehensive automated coverage verifying all acceptance criteria.
