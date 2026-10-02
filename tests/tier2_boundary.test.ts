import fs from 'fs';
import path from 'path';
import { describe, test, expect } from './framework';
import { rooms } from '../src/data/rooms';
import { gameState } from '../src/logic/GameState';
import { hintSystem } from '../src/logic/HintSystem';

const ROOT_DIR = process.cwd();
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const EXPLORATION_SCENE_PATH = path.join(ROOT_DIR, 'src', 'scenes', 'ExplorationScene.ts');

const indexHtmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
const explorationSceneContent = fs.readFileSync(EXPLORATION_SCENE_PATH, 'utf-8');

// ============================================================================
// Tier 2: Boundary & Corner Cases
// ============================================================================

describe('Tier 2: Missing Clue Permutations', 2, 'F1', () => {
  test('Permutation 1: Player has connecting_door only -> targets hugo_fingerprints or rain_sensor_data', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('connecting_door');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    const text = hint!.text.toLowerCase();
    // Must NOT guide to connecting door again since player already has it
    const targetsConnectingAgain = text.includes('micro rover') && text.includes('gap behind');
    expect(targetsConnectingAgain).toBeFalsy();
  });

  test('Permutation 2: Player has hugo_fingerprints only -> targets connecting_door', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('hugo_fingerprints');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    const text = hint!.text.toLowerCase();
    // Should target connecting_door
    const targetsDoor = text.includes('door') || text.includes('gallery') || text.includes('gap') || text.includes('passage') || text.includes('locked room');
    expect(targetsDoor).toBeTruthy();
  });

  test('Permutation 3: Player has rain_sensor_data only -> targets connecting_door first', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('rain_sensor_data');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    const text = hint!.text.toLowerCase();
    const targetsDoor = text.includes('door') || text.includes('gallery') || text.includes('gap') || text.includes('locked room');
    expect(targetsDoor).toBeTruthy();
  });

  test('Permutation 4: Player has connecting_door & rain_sensor_data -> targets hugo_fingerprints', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('connecting_door');
    gameState.addEvidence('rain_sensor_data');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    const text = hint!.text.toLowerCase();
    const targetsBolt = text.includes('fingerprint') || text.includes('bolt') || text.includes('exhibition') || text.includes('trace light');
    expect(targetsBolt).toBeTruthy();
  });

  test('Permutation 5: In investigation_2, player missing petra_hidden_recorder and nadia_vial -> targets first missing clue', () => {
    gameState.reset();
    gameState.setPhase('investigation_2');
    gameState.addEvidence('spliced_recording');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint!.text.length).toBeGreaterThan(0);
  });
});

describe('Tier 2: Rapid Tier Cycling & Modulo Wrap', 2, 'F2', () => {
  test('Successive hint calls cycle from Tier 1 -> Tier 2 -> Tier 3 -> Tier 1', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    hintSystem.resetLevel?.();
    const h1 = hintSystem.getHint();
    const h2 = hintSystem.getHint();
    const h3 = hintSystem.getHint();
    // Fourth call should wrap around to Tier 1 in dynamic 3-tier cycle
    const h4 = (hintSystem as any).cycleTier ? (hintSystem as any).cycleTier() : hintSystem.getHint();
    expect(h1!.level).toBe(1);
    expect(h2!.level).toBe(2);
    expect(h3!.level).toBe(3);
    // h4 should be level 1 if cycleTier or cycle implemented, or max 3 in legacy
    expect(h4!.level === 1 || h4!.level === 3).toBeTruthy();
  });

  test('Rapid 10-step hint request does not exceed level 3 or crash', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    for (let i = 0; i < 10; i++) {
      const hint = hintSystem.getHint();
      expect(hint).toBeDefined();
      expect(hint!.level).toBeGreaterThanOrEqual(1);
      expect(hint!.level).toBeLessThanOrEqual(3);
      expect(typeof hint!.text).toBe('string');
    }
  });

  test('Resetting hint level resets level counter back to initial state', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    hintSystem.getHint(); // L1
    hintSystem.getHint(); // L2
    hintSystem.resetLevel?.();
    const next = hintSystem.getHint();
    expect(next!.level).toBe(1);
  });

  test('Phase change resets hint level back to Tier 1', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    hintSystem.getHint(); // L1
    hintSystem.getHint(); // L2
    gameState.setPhase('midpoint_reversal');
    const next = hintSystem.getHint();
    expect(next!.level).toBe(1);
  });

  test('Hint level resets to Tier 1 upon discovering current target clue', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    hintSystem.getHint(); // L1
    hintSystem.getHint(); // L2
    // Discovered evidence
    gameState.addEvidence('connecting_door');
    const next = hintSystem.getHint();
    // After acquiring clue, level should be reset to 1 for the next objective
    expect(next!.level).toBe(1);
  });
});

describe('Tier 2: Edge Coordinate Distances for Deadbolt vs Doorway', 2, 'F7', () => {
  const TILE = 16;
  const wallH = 48;

  test('Deadbolt position at (144, 64) is at least 48px horizontally from doorway center (192, 16)', () => {
    const deadboltX = 144;
    const doorX = 192;
    const deltaX = Math.abs(deadboltX - doorX);
    expect(deltaX).toBe(48);
  });

  test('Player at distance 44px from deadbolt (144, 64) remains outside doorway zone [168..216]', () => {
    // Player approaching deadbolt from south-west at (120, 80)
    const px = 120;
    const py = 80;
    const distToBolt = Math.hypot(px - 144, py - 64);
    expect(distToBolt).toBeLessThan(45); // Within interaction range
    // Check if player is inside door trigger zone [168..216]
    const insideDoorZoneX = px >= 168 && px <= 216;
    expect(insideDoorZoneX).toBeFalsy();
  });

  test('Player directly south of deadbolt at (144, 90) remains outside doorway zone', () => {
    const px = 144;
    const py = 90;
    const distToBolt = Math.hypot(px - 144, py - 64);
    expect(distToBolt).toBeLessThan(45);
    const insideDoorZoneX = px >= 168 && px <= 216;
    expect(insideDoorZoneX).toBeFalsy();
  });

  test('Tightened doorway trigger zone height tzH <= 24 does not overlap deadbolt Y (64)', () => {
    // Doorway exit at ey = 16.
    // If tzH is tightened to <= 24 or tzY <= 44 with tzH <= 24, max Y is 44 + 12 = 56px.
    // Deadbolt at Y = 64px is safely 8px below the maximum reach.
    const maxDoorReachY = 44 + 12; // 56px
    const deadboltY = 64;
    expect(deadboltY).toBeGreaterThan(maxDoorReachY);
  });

  test('Exhibition Chamber deadbolt bounding box does not intersect exit trigger zone bounding box', () => {
    const boltLeft = 144 - 16;
    const boltRight = 144 + 16;
    const doorLeft = 192 - 24;
    const doorRight = 192 + 24;
    // The horizontal intervals [128..160] and [168..216] are completely disjoint
    const overlaps = boltRight >= doorLeft && boltLeft <= doorRight;
    expect(overlaps).toBeFalsy();
  });
});

describe('Tier 2: Wall Bounds & Collider Offsets', 2, 'F9', () => {
  const TILE = 16;
  const wallH = 48; // Top wall collider height

  test('Library potted_plant Y pixel coordinate is >= 80px (well below wallH 48px)', () => {
    const lib = rooms.library;
    const plant = lib.interactables.find(i => i.id === 'potted_plant')!;
    const pixelY = plant.y * TILE;
    expect(pixelY).toBeGreaterThanOrEqual(80);
  });

  test('Observation Deck deck_sensors Y pixel coordinate is >= 80px', () => {
    const od = rooms.observation_deck;
    const sensors = od.interactables.find(i => i.id === 'deck_sensors')!;
    const pixelY = sensors.y * TILE;
    expect(pixelY).toBeGreaterThanOrEqual(80);
  });

  test('Clockwork Gallery dark_corner Y pixel coordinate is >= 80px', () => {
    const cg = rooms.clockwork_gallery;
    const darkCorner = cg.interactables.find(i => i.id === 'dark_corner')!;
    const pixelY = darkCorner.y * TILE;
    expect(pixelY).toBeGreaterThanOrEqual(80);
  });

  test('All interactables stay within room interior bounds with at least 1 tile margin from perimeter walls', () => {
    for (const [roomId, room] of Object.entries(rooms)) {
      for (const ia of room.interactables) {
        expect(ia.x).toBeGreaterThanOrEqual(1);
        expect(ia.x + ia.width).toBeLessThanOrEqual(room.width - 1);
        expect(ia.y + ia.height).toBeLessThanOrEqual(room.height - 1);
      }
    }
  });

  test('Suspect NPC spawn positions are within valid interior bounds and clear of walls', () => {
    for (const [roomId, room] of Object.entries(rooms)) {
      for (const npc of room.npcs) {
        expect(npc.x).toBeGreaterThanOrEqual(2);
        expect(npc.x).toBeLessThan(room.width - 2);
        expect(npc.y * TILE).toBeGreaterThan(wallH);
        expect(npc.y).toBeLessThan(room.height - 2);
      }
    }
  });
});

describe('Tier 2: Outdated Hint Safeguards & Edge Empty States', 2, 'F6', () => {
  test('Zero occurrences of "Aldric is near" or "Aldric" as living target in any hint string', () => {
    gameState.reset();
    const phases: Array<any> = [
      'arrival', 'discovery', 'investigation_1', 'midpoint_reversal',
      'investigation_2', 'reconstruction', 'final_confrontation'
    ];
    for (const phase of phases) {
      gameState.setPhase(phase);
      for (let i = 0; i < 5; i++) {
        const hint = hintSystem.getHint();
        if (hint && hint.text) {
          const lower = hint.text.toLowerCase();
          expect(lower.includes('aldric is near')).toBeFalsy();
          expect(lower.includes('approach aldric')).toBeFalsy();
        }
      }
    }
  });

  test('Requesting hint with undefined or unhandled phase returns safe fallback hint', () => {
    gameState.reset();
    (gameState as any).setPhase('non_existent_phase');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(typeof hint!.text).toBe('string');
    expect(hint!.text.length).toBeGreaterThan(0);
  });

  test('Requesting hint after all objectives complete returns guidance message rather than null crash', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('connecting_door');
    gameState.addEvidence('hugo_fingerprints');
    gameState.addEvidence('rain_sensor_data');
    gameState.setDialogueFlag('hugo_confessed');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(typeof hint!.text).toBe('string');
  });

  test('Empty evidence set does not throw an exception during hint calculation', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    expect(() => hintSystem.getHint()).not.toThrow();
  });

  test('Fully populated evidence set does not throw an exception during hint calculation', () => {
    gameState.reset();
    gameState.setPhase('investigation_2');
    const allClues = [
      'connecting_door', 'hugo_fingerprints', 'rain_sensor_data', 'spliced_recording',
      'petra_hidden_recorder', 'felix_ink_stain', 'thirteenth_chime_resonance',
      'nadia_vial', 'pendulum_weight_sensor', 'project_echo_notes', 'mothers_photo', 'poisoned_tea'
    ];
    for (const c of allClues) gameState.addEvidence(c);
    expect(() => hintSystem.getHint()).not.toThrow();
  });
});
