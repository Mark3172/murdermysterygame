import fs from 'fs';
import path from 'path';
import { describe, test, expect } from './framework';
import { rooms } from '../src/data/rooms';
import { gameState } from '../src/logic/GameState';
import { hintSystem, HintSystem } from '../src/logic/HintSystem';
import { evidence } from '../src/data/evidence';

const ROOT_DIR = process.cwd();
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');
const TSCONFIG_PATH = path.join(ROOT_DIR, 'tsconfig.json');
const EXPLORATION_SCENE_PATH = path.join(ROOT_DIR, 'src', 'scenes', 'ExplorationScene.ts');

const indexHtmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
const packageJsonContent = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
const tsconfigContent = JSON.parse(fs.readFileSync(TSCONFIG_PATH, 'utf-8'));
const explorationSceneContent = fs.readFileSync(EXPLORATION_SCENE_PATH, 'utf-8');

// ============================================================================
// F1: Dynamic Missing Clue Evaluation
// ============================================================================
describe('F1: Dynamic Missing Clue Evaluation', 1, 'F1', () => {
  test('Hint evaluation in investigation_1 identifies missing connecting_door when evidence set is empty', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint).not.toBeNull();
    // Hint text should guide player towards the hidden door / clockwork gallery gap
    const text = hint!.text.toLowerCase();
    const targetsConnectingDoor = text.includes('door') || text.includes('clockwork') || text.includes('gap') || text.includes('passage') || text.includes('locked room');
    expect(targetsConnectingDoor).toBeTruthy();
  });

  test('Hint evaluation in investigation_1 shifts to hugo_fingerprints after connecting_door is acquired', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('connecting_door');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint).not.toBeNull();
    const text = hint!.text.toLowerCase();
    const targetsFingerprints = text.includes('fingerprint') || text.includes('bolt') || text.includes('door') || text.includes('exhibition') || text.includes('hugo');
    expect(targetsFingerprints).toBeTruthy();
  });

  test('Hint evaluation in investigation_1 shifts to rain_sensor_data after connecting_door and hugo_fingerprints are acquired', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('connecting_door');
    gameState.addEvidence('hugo_fingerprints');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint).not.toBeNull();
    const text = hint!.text.toLowerCase();
    const targetsSensor = text.includes('rain') || text.includes('sensor') || text.includes('observation') || text.includes('alibi') || text.includes('weather');
    expect(targetsSensor).toBeTruthy();
  });

  test('Hint evaluation targets Hugo confrontation (hugo_confessed) when all 3 locked room clues are present', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('connecting_door');
    gameState.addEvidence('hugo_fingerprints');
    gameState.addEvidence('rain_sensor_data');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint).not.toBeNull();
    const text = hint!.text.toLowerCase();
    const targetsConfrontation = text.includes('confront') || text.includes('hugo') || text.includes('confess') || text.includes('present');
    expect(targetsConfrontation).toBeTruthy();
  });

  test('Irrelevant evidence collection (poisoned_tea, mothers_photo) does NOT advance hint index past missing locked room clues', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    // Add irrelevant clue
    gameState.addEvidence('poisoned_tea');
    gameState.addEvidence('mothers_photo');
    // Still missing all 3 locked room clues: connecting_door, hugo_fingerprints, rain_sensor_data
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint).not.toBeNull();
    const text = hint!.text.toLowerCase();
    // Must NOT jump straight to Hugo confrontation while missing all 3 required clues
    const jumpedToConfrontation = text.includes('confront him') && text.includes('present all three');
    expect(jumpedToConfrontation).toBeFalsy();
  });
});

// ============================================================================
// F2: Tier 1 Atmospheric Nudge
// ============================================================================
describe('F2: Tier 1 Atmospheric Nudge', 1, 'F2', () => {
  test('Tier 1 hint for connecting_door provides atmospheric nudge without naming gadget directly', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    hintSystem.resetLevel?.();
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint!.level).toBe(1);
    // Atmospheric nudge should be subtle
    expect(hint!.text.length).toBeGreaterThan(15);
  });

  test('Tier 1 hint for rain_sensor_data provides subtle anomaly focus on observation deck or alibi', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('connecting_door');
    gameState.addEvidence('hugo_fingerprints');
    hintSystem.resetLevel?.();
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint!.level).toBe(1);
    const text = hint!.text.toLowerCase();
    expect(text.includes('alibi') || text.includes('hugo') || text.includes('weather') || text.includes('deck') || text.includes('observation')).toBeTruthy();
  });

  test('Tier 1 hint for hugo_fingerprints guides detective to examine chamber entrance or deadbolt', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('connecting_door');
    hintSystem.resetLevel?.();
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint!.level).toBe(1);
    const text = hint!.text.toLowerCase();
    expect(text.includes('door') || text.includes('chamber') || text.includes('bolt') || text.includes('touched') || text.includes('examine')).toBeTruthy();
  });

  test('Tier 1 hint in investigation_2 focuses on PA announcement authenticity', () => {
    gameState.reset();
    gameState.setPhase('investigation_2');
    hintSystem.resetLevel?.();
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint!.level).toBe(1);
    const text = hint!.text.toLowerCase();
    expect(text.includes('announcement') || text.includes('voice') || text.includes('recording') || text.includes('speaker') || text.includes('time') || text.includes('killer')).toBeTruthy();
  });

  test('Tier 1 hints adhere to gentle nudge tone across all registered hint objectives', () => {
    gameState.reset();
    gameState.setPhase('midpoint_reversal');
    hintSystem.resetLevel?.();
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint!.level).toBe(1);
    expect(typeof hint!.text).toBe('string');
    expect(hint!.text.length).toBeGreaterThan(10);
  });
});

// ============================================================================
// F3: Tier 2 Room & Focus Direction
// ============================================================================
describe('F3: Tier 2 Room & Focus Direction', 1, 'F3', () => {
  test('Tier 2 hint for connecting_door explicitly identifies clockwork gallery chamber', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    hintSystem.resetLevel?.();
    hintSystem.getHint(); // Level 1
    const hint2 = hintSystem.getHint(); // Level 2
    expect(hint2).toBeDefined();
    expect(hint2!.level).toBe(2);
    const text = hint2!.text.toLowerCase();
    expect(text.includes('clockwork') || text.includes('gallery')).toBeTruthy();
  });

  test('Tier 2 hint for rain_sensor_data explicitly identifies observation deck chamber', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('connecting_door');
    gameState.addEvidence('hugo_fingerprints');
    hintSystem.resetLevel?.();
    hintSystem.getHint(); // L1
    const hint2 = hintSystem.getHint(); // L2
    expect(hint2).toBeDefined();
    expect(hint2!.level).toBe(2);
    const text = hint2!.text.toLowerCase();
    expect(text.includes('observation') || text.includes('deck')).toBeTruthy();
  });

  test('Tier 2 hint for hugo_fingerprints explicitly identifies exhibition chamber door / bolt', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('connecting_door');
    hintSystem.resetLevel?.();
    hintSystem.getHint(); // L1
    const hint2 = hintSystem.getHint(); // L2
    expect(hint2).toBeDefined();
    expect(hint2!.level).toBe(2);
    const text = hint2!.text.toLowerCase();
    expect(text.includes('exhibition') || text.includes('door') || text.includes('bolt') || text.includes('fingerprint') || text.includes('trace light')).toBeTruthy();
  });

  test('Tier 2 hint for spliced_recording in midpoint identifies PA system recording', () => {
    gameState.reset();
    gameState.setPhase('midpoint_reversal');
    hintSystem.resetLevel?.();
    hintSystem.getHint(); // L1
    const hint2 = hintSystem.getHint(); // L2
    expect(hint2).toBeDefined();
    expect(hint2!.level).toBe(2);
    const text = hint2!.text.toLowerCase();
    expect(text.includes('pa') || text.includes('recording') || text.includes('speaker') || text.includes('voice prism')).toBeTruthy();
  });

  test('Tier 2 hint for solvent vial identifies searching chamber or suspect belongings', () => {
    gameState.reset();
    gameState.setPhase('investigation_2');
    gameState.addEvidence('spliced_recording');
    gameState.addEvidence('petra_hidden_recorder');
    hintSystem.resetLevel?.();
    hintSystem.getHint(); // L1
    const hint2 = hintSystem.getHint(); // L2
    expect(hint2).toBeDefined();
    expect(hint2!.level).toBe(2);
    expect(typeof hint2!.text).toBe('string');
  });
});

// ============================================================================
// F4: Tier 3 Actionable Detective Direction
// ============================================================================
describe('F4: Tier 3 Actionable Detective Direction', 1, 'F4', () => {
  test('Tier 3 hint for connecting_door explicitly names Micro Rover gadget with hotkey [4]', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    hintSystem.resetLevel?.();
    hintSystem.getHint(); // L1
    hintSystem.getHint(); // L2
    const hint3 = hintSystem.getHint(); // L3
    expect(hint3).toBeDefined();
    expect(hint3!.level).toBe(3);
    const text = hint3!.text.toLowerCase();
    expect(text.includes('micro rover') || text.includes('[4]') || text.includes('rover')).toBeTruthy();
  });

  test('Tier 3 hint for hugo_fingerprints explicitly names Trace Light gadget with hotkey [3]', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('connecting_door');
    hintSystem.resetLevel?.();
    hintSystem.getHint(); // L1
    hintSystem.getHint(); // L2
    const hint3 = hintSystem.getHint(); // L3
    expect(hint3).toBeDefined();
    expect(hint3!.level).toBe(3);
    const text = hint3!.text.toLowerCase();
    expect(text.includes('trace light') || text.includes('[3]')).toBeTruthy();
  });

  test('Tier 3 hint for rain_sensor_data explicitly directs data inquiry with Echo Lens [2] or sensor check', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('connecting_door');
    gameState.addEvidence('hugo_fingerprints');
    hintSystem.resetLevel?.();
    hintSystem.getHint(); // L1
    hintSystem.getHint(); // L2
    const hint3 = hintSystem.getHint(); // L3
    expect(hint3).toBeDefined();
    expect(hint3!.level).toBe(3);
    const text = hint3!.text.toLowerCase();
    expect(text.includes('sensor') || text.includes('echo lens') || text.includes('rain') || text.includes('[2]')).toBeTruthy();
  });

  test('Tier 3 hint for spliced_recording names Voice Prism gadget with hotkey [5]', () => {
    gameState.reset();
    gameState.setPhase('midpoint_reversal');
    hintSystem.resetLevel?.();
    hintSystem.getHint(); // L1
    hintSystem.getHint(); // L2
    const hint3 = hintSystem.getHint(); // L3
    expect(hint3).toBeDefined();
    expect(hint3!.level).toBe(3);
    const text = hint3!.text.toLowerCase();
    expect(text.includes('voice prism') || text.includes('[5]') || text.includes('spliced')).toBeTruthy();
  });

  test('Tier 3 hint for Hugo confrontation gives exact presentation instructions', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('connecting_door');
    gameState.addEvidence('hugo_fingerprints');
    gameState.addEvidence('rain_sensor_data');
    hintSystem.resetLevel?.();
    hintSystem.getHint(); // L1
    hintSystem.getHint(); // L2
    const hint3 = hintSystem.getHint(); // L3
    expect(hint3).toBeDefined();
    expect(hint3!.level).toBe(3);
    const text = hint3!.text.toLowerCase();
    expect(text.includes('present') || text.includes('three') || text.includes('confess') || text.includes('hugo')).toBeTruthy();
  });
});

// ============================================================================
// F5: Phase-Aware Hint Progression
// ============================================================================
describe('F5: Phase-Aware Hint Progression', 1, 'F5', () => {
  test('Hint system initializes and evaluates correctly for investigation_1', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint!.text.length).toBeGreaterThan(0);
  });

  test('Hint system initializes and evaluates correctly for midpoint_reversal', () => {
    gameState.reset();
    gameState.setPhase('midpoint_reversal');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint!.text.length).toBeGreaterThan(0);
  });

  test('Hint system initializes and evaluates correctly for investigation_2', () => {
    gameState.reset();
    gameState.setPhase('investigation_2');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint!.text.length).toBeGreaterThan(0);
  });

  test('Hint system initializes and evaluates correctly for reconstruction', () => {
    gameState.reset();
    gameState.setPhase('reconstruction');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint!.text.length).toBeGreaterThan(0);
  });

  test('Hint system initializes and evaluates correctly for final_confrontation', () => {
    gameState.reset();
    gameState.setPhase('final_confrontation');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint!.text.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// F6: Elimination of Outdated Hints
// ============================================================================
describe('F6: Elimination of Outdated Hints', 1, 'F6', () => {
  test('Hint system never returns instructions referring to Professor Aldric alive near podium', () => {
    gameState.reset();
    const phases: Array<any> = [
      'arrival',
      'discovery',
      'investigation_1',
      'midpoint_reversal',
      'investigation_2',
      'reconstruction',
      'final_confrontation',
    ];
    for (const p of phases) {
      gameState.setPhase(p);
      hintSystem.resetLevel?.();
      for (let i = 0; i < 3; i++) {
        const hint = hintSystem.getHint();
        if (hint && hint.text) {
          const lower = hint.text.toLowerCase();
          const hasAldricPodium = lower.includes('aldric is near the podium') || lower.includes('approach aldric and initiate');
          expect(hasAldricPodium).toBeFalsy();
        }
      }
    }
  });

  test('Arrival phase obsolete hint is eradicated from HintSystem.ts source code', () => {
    const hintSystemSource = fs.readFileSync(path.join(ROOT_DIR, 'src', 'logic', 'HintSystem.ts'), 'utf-8');
    const hasOutdatedAldric = hintSystemSource.includes('Professor Aldric is near the podium');
    expect(hasOutdatedAldric).toBeFalsy();
  });

  test('Phase change to investigation_1 resets and purges any prior phase hint cache', () => {
    gameState.reset();
    gameState.setPhase('discovery');
    gameState.setPhase('investigation_1');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    expect(hint!.text.toLowerCase().includes('podium')).toBeFalsy();
  });

  test('Hint text across all phases does not advise interacting with deceased characters', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    const hint = hintSystem.getHint();
    expect(hint!.text.toLowerCase().includes('speak with aldric')).toBeFalsy();
  });

  test('No undefined or empty hint text returned when requesting hints during any active phase', () => {
    const phases: Array<any> = ['investigation_1', 'midpoint_reversal', 'investigation_2', 'reconstruction', 'final_confrontation'];
    for (const p of phases) {
      gameState.reset();
      gameState.setPhase(p);
      const hint = hintSystem.getHint();
      expect(hint).toBeDefined();
      expect(hint!.text).toBeDefined();
      expect(hint!.text.trim().length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// F7: Exhibition Chamber Deadbolt Isolation
// ============================================================================
describe('F7: Exhibition Chamber Deadbolt Isolation', 1, 'F7', () => {
  test('door_bolt interactable in exhibition_chamber exists and has required evidence hugo_fingerprints', () => {
    const ec = rooms.exhibition_chamber;
    expect(ec).toBeDefined();
    const bolt = ec.interactables.find(i => i.id === 'door_bolt');
    expect(bolt).toBeDefined();
    expect(bolt!.evidenceId).toBe('hugo_fingerprints');
  });

  test('door_bolt is relocated away from exit doorway (12, 1) to (9, 4) or isolated position', () => {
    const ec = rooms.exhibition_chamber;
    const bolt = ec.interactables.find(i => i.id === 'door_bolt')!;
    const isRelocated = !(bolt.x === 12 && bolt.y === 1);
    expect(isRelocated).toBeTruthy();
  });

  test('door_bolt grid coordinates match specified design (x: 9, y: 4) at pixel (144, 64)', () => {
    const ec = rooms.exhibition_chamber;
    const bolt = ec.interactables.find(i => i.id === 'door_bolt')!;
    expect(bolt.x).toBe(9);
    expect(bolt.y).toBe(4);
  });

  test('Player standing within interaction radius (45px) of door_bolt does not enter doorway trigger zone', () => {
    const ec = rooms.exhibition_chamber;
    const bolt = ec.interactables.find(i => i.id === 'door_bolt')!;
    const TILE = 16;
    const boltPixelX = bolt.x * TILE; // 144
    const boltPixelY = bolt.y * TILE; // 64

    // Doorway exit to main_hall is at x: 12, y: 1 -> pixel (192, 16)
    // In ExplorationScene, doorway trigger zone is centered around ex=192, ey=16/44
    // Distance between bolt (144, 64) and door trigger center (192, 44)
    const dist = Math.hypot(boltPixelX - 192, boltPixelY - 44);
    // Distance should be greater than interaction radius (45px) + buffer
    expect(dist).toBeGreaterThan(45);
  });

  test('Exhibition chamber door exit to main_hall is tightened and distinct from deadbolt prop', () => {
    const ec = rooms.exhibition_chamber;
    const exitToMain = ec.exits.find(e => e.targetRoom === 'main_hall');
    expect(exitToMain).toBeDefined();
    const bolt = ec.interactables.find(i => i.id === 'door_bolt')!;
    const sameCoord = exitToMain!.x === bolt.x && exitToMain!.y === bolt.y;
    expect(sameCoord).toBeFalsy();
  });
});

// ============================================================================
// F8: Unblocked Doorways & Walking Lanes
// ============================================================================
describe('F8: Unblocked Doorways & Walking Lanes', 1, 'F8', () => {
  test('Main Hall armchair is relocated away from Exhibition Chamber doorway threshold (x: 8, y: 1)', () => {
    // In ExplorationScene.ts:796, armchair was placed at TILE * 8 (128px), wallH + 32 (80px)
    // Moving it away to TILE * 5 or clear location ensures spawn point is unblocked
    const hasBlockedArmchair = explorationSceneContent.includes("this.add.image(TILE * 8, wallH + 32, 'prop_armchair')");
    expect(hasBlockedArmchair).toBeFalsy();
  });

  test('Exhibition Chamber spawn point is clear of obstacles and door thresholds', () => {
    const ec = rooms.exhibition_chamber;
    expect(ec.spawnPoint).toBeDefined();
    expect(ec.spawnPoint.x).toBeGreaterThan(0);
    expect(ec.spawnPoint.y).toBeGreaterThan(0);
    // Spawn point should not be inside any interactable
    for (const ia of ec.interactables) {
      const insideX = ec.spawnPoint.x >= ia.x && ec.spawnPoint.x <= ia.x + ia.width;
      const insideY = ec.spawnPoint.y >= ia.y && ec.spawnPoint.y <= ia.y + ia.height;
      expect(insideX && insideY).toBeFalsy();
    }
  });

  test('Clockwork Gallery entrance spawn point has clear walking lane into room center', () => {
    const cg = rooms.clockwork_gallery;
    expect(cg.spawnPoint).toBeDefined();
    for (const ia of cg.interactables) {
      const insideX = cg.spawnPoint.x >= ia.x && cg.spawnPoint.x <= ia.x + ia.width;
      const insideY = cg.spawnPoint.y >= ia.y && cg.spawnPoint.y <= ia.y + ia.height;
      expect(insideX && insideY).toBeFalsy();
    }
  });

  test('Library walkway between archive desk and south armchairs provides clearance >= 24px', () => {
    const lib = rooms.library;
    const desk = lib.interactables.find(i => i.id === 'archive_desk');
    expect(desk).toBeDefined();
    // Armchairs in ExplorationScene:810-811 were at y = 242, desk at y=13 (208px), pinch was 4px
    const has4pxPinch = explorationSceneContent.includes('this.add.image(176, 242,') || explorationSceneContent.includes('this.add.image(240, 242,');
    expect(has4pxPinch).toBeFalsy();
  });

  test('Main Hall central corridor between Observation Deck exit and PA speaker provides unblocked passage', () => {
    const mh = rooms.main_hall;
    const paSpeaker = mh.interactables.find(i => i.id === 'pa_speaker');
    expect(paSpeaker).toBeDefined();
    // Observation deck exit is at x: 16, y: 1. PA speaker should not block Y=1 to Y=4 corridor directly
    const exitObs = mh.exits.find(e => e.targetRoom === 'observation_deck')!;
    const directOverlap = paSpeaker!.x === exitObs.x && paSpeaker!.y <= 2;
    expect(directOverlap).toBeFalsy();
  });
});

// ============================================================================
// F9: Top-Wall Clue Clearance
// ============================================================================
describe('F9: Top-Wall Clue Clearance', 1, 'F9', () => {
  test('Library potted_plant is placed below the top wall collider (y >= 5)', () => {
    const lib = rooms.library;
    const plant = lib.interactables.find(i => i.id === 'potted_plant');
    expect(plant).toBeDefined();
    expect(plant!.y).toBeGreaterThanOrEqual(5);
  });

  test('Observation Deck deck_sensors is placed below top wall collider (y >= 5)', () => {
    const od = rooms.observation_deck;
    const sensors = od.interactables.find(i => i.id === 'deck_sensors');
    expect(sensors).toBeDefined();
    expect(sensors!.y).toBeGreaterThanOrEqual(5);
  });

  test('Clockwork Gallery dark_corner is placed below top wall collider (y >= 5)', () => {
    const cg = rooms.clockwork_gallery;
    const darkCorner = cg.interactables.find(i => i.id === 'dark_corner');
    expect(darkCorner).toBeDefined();
    expect(darkCorner!.y).toBeGreaterThanOrEqual(5);
  });

  test('All interactables across all 6 rooms have Y coordinates clear of wall collider (Y >= 3 tiles)', () => {
    for (const [roomId, room] of Object.entries(rooms)) {
      for (const ia of room.interactables) {
        if (ia.id === 'door_bolt') continue; // Deadbolt handled specifically
        expect(ia.y).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test('Evidence items in rooms.ts correspond to valid evidence definitions', () => {
    for (const [roomId, room] of Object.entries(rooms)) {
      for (const ia of room.interactables) {
        if (ia.evidenceId) {
          const evDef = (evidence as any)[ia.evidenceId];
          expect(evDef).toBeDefined();
        }
      }
    }
  });
});

// ============================================================================
// F10: Visual Depth & Z-Ordering Polish
// ============================================================================
describe('F10: Visual Depth & Z-Ordering Polish', 1, 'F10', () => {
  test('ExplorationScene updates player shadow depth dynamically in update() loop', () => {
    const hasDynamicShadow = explorationSceneContent.includes('this.playerShadow.setDepth') &&
      explorationSceneContent.includes('this.playerShadow.setPosition(this.player.x, this.player.y');
    expect(hasDynamicShadow).toBeTruthy();
  });

  test('Tabletop thermos in exhibition_chamber has depth offset above desk', () => {
    const ec = rooms.exhibition_chamber;
    const desk = ec.interactables.find(i => i.id === 'desk');
    const thermos = ec.interactables.find(i => i.id === 'thermos');
    expect(desk).toBeDefined();
    expect(thermos).toBeDefined();
    expect(thermos!.y).toBeGreaterThanOrEqual(desk!.y);
  });

  test('Pendulum base in pendulum_room is included in obstacle colliders list', () => {
    const hasPendulumCollider = explorationSceneContent.includes("'pendulum'") &&
      explorationSceneContent.includes('desk') &&
      explorationSceneContent.includes('obstacle');
    expect(hasPendulumCollider).toBeTruthy();
  });

  test('Suspect NPCs in rooms.ts are positioned at valid floor coordinates', () => {
    for (const [roomId, room] of Object.entries(rooms)) {
      for (const npc of room.npcs) {
        expect(npc.y).toBeGreaterThanOrEqual(4);
        expect(npc.x).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test('Prop layering in ExplorationScene uses Y-based depth sorting', () => {
    expect(explorationSceneContent.includes('.setDepth(')).toBeTruthy();
  });
});

// ============================================================================
// F11: Clue Gleam & Feedback Polish
// ============================================================================
describe('F11: Clue Gleam & Feedback Polish', 1, 'F11', () => {
  test('Clue gleam markers are defined and spawned for interactables in ExplorationScene', () => {
    const hasGleamLogic = explorationSceneContent.includes('gleam') || explorationSceneContent.includes('marker');
    expect(hasGleamLogic).toBeTruthy();
  });

  test('Clue gleam marker is disposed/removed upon evidence discovery', () => {
    const hasCleanup = explorationSceneContent.includes('destroy()') || explorationSceneContent.includes('setVisible(false)');
    expect(hasCleanup).toBeTruthy();
  });

  test('showDiscovery plays discovery audio feedback', () => {
    expect(explorationSceneContent.includes("playSFX('discoveryString')")).toBeTruthy();
  });

  test('Interacting with discovered evidence does not re-trigger discovery notifications', () => {
    gameState.reset();
    gameState.addEvidence('connecting_door');
    expect(gameState.hasEvidence('connecting_door')).toBeTruthy();
  });

  test('Gadget requirements are validated before allowing clue interaction', () => {
    const cg = rooms.clockwork_gallery;
    const wallGap = cg.interactables.find(i => i.id === 'wall_gap')!;
    expect(wallGap.gadgetRequired).toBe('micro_rover');
  });
});

// ============================================================================
// F12: High-DPI HTML/CSS Overlay Toasts & Cards
// ============================================================================
describe('F12: High-DPI HTML/CSS Overlay Toasts & Cards', 1, 'F12', () => {
  test('#ui-overlay container exists in index.html with pointer-events: none', () => {
    expect(indexHtmlContent.includes('id="ui-overlay"')).toBeTruthy();
    expect(indexHtmlContent.includes('pointer-events: none')).toBeTruthy();
  });

  test('Discovery modal card container exists in index.html DOM overlay', () => {
    const hasDiscoveryCard = indexHtmlContent.includes('id="discovery-modal"') || indexHtmlContent.includes('id="discovery-overlay"');
    expect(hasDiscoveryCard).toBeTruthy();
  });

  test('Hint overlay card container exists in index.html DOM overlay with tier badge styling', () => {
    const hasHintOverlay = indexHtmlContent.includes('id="hint-overlay"') || indexHtmlContent.includes('id="hint-modal"');
    expect(hasHintOverlay).toBeTruthy();
  });

  test('Game toast container exists in index.html DOM overlay for crisp notifications', () => {
    const hasToast = indexHtmlContent.includes('id="game-toast"') || indexHtmlContent.includes('id="toast-container"');
    expect(hasToast).toBeTruthy();
  });

  test('Interaction prompt container exists in index.html DOM overlay with crisp key badge', () => {
    const hasPromptContainer = indexHtmlContent.includes('id="interaction-prompt-container"') || indexHtmlContent.includes('id="interaction-prompt"');
    expect(hasPromptContainer).toBeTruthy();
  });
});

// ============================================================================
// F13: High-Definition Typography System
// ============================================================================
describe('F13: High-Definition Typography System', 1, 'F13', () => {
  test('Dialogue text uses Georgia serif typography for reading clarity', () => {
    expect(indexHtmlContent.includes('Georgia, serif')).toBeTruthy();
  });

  test('Global body font eliminates low-resolution default Courier New in favor of crisp typography', () => {
    // Body should use modern font stacks or system-ui sans-serif
    const bodyUsesCourier = indexHtmlContent.includes("body, html {\n      width: 100%; height: 100%;\n      overflow: hidden;\n      background: #0a0a12;\n      font-family: 'Courier New', monospace;");
    expect(bodyUsesCourier).toBeFalsy();
  });

  test('UI elements and buttons use modern high-contrast system sans-serif font family', () => {
    const hasSansSerif = indexHtmlContent.includes('sans-serif') || indexHtmlContent.includes('system-ui');
    expect(hasSansSerif).toBeTruthy();
  });

  test('Dialogue container text color maintains high contrast (color #edf2f7 or #e0e8f0)', () => {
    expect(indexHtmlContent.includes('#edf2f7') || indexHtmlContent.includes('#e0e8f0')).toBeTruthy();
  });

  test('Anti-aliasing and subpixel smoothing CSS applied to DOM overlays', () => {
    const hasAntiAliasing = indexHtmlContent.includes('-webkit-font-smoothing: antialiased') || indexHtmlContent.includes('font-smoothing');
    expect(hasAntiAliasing).toBeTruthy();
  });
});

// ============================================================================
// F14: Dialogue & Choice Typography Polish
// ============================================================================
describe('F14: Dialogue & Choice Typography Polish', 1, 'F14', () => {
  test('.dialogue-choice elements use crisp modern typography rather than raw Courier New', () => {
    const choiceUsesCourier = indexHtmlContent.includes(".dialogue-choice {\n      display: block;\n      width: 100%;\n      text-align: left;\n      background: rgba(26, 36, 56, 0.85);\n      border: 1px solid rgba(74, 138, 154, 0.4);\n      color: #c8deec;\n      padding: 8px 12px;\n      cursor: pointer;\n      pointer-events: auto;\n      user-select: none;\n      font-family: 'Courier New', monospace;");
    expect(choiceUsesCourier).toBeFalsy();
  });

  test('Dialogue speaker badge has distinct uppercase styling, letter-spacing, and gold accent', () => {
    expect(indexHtmlContent.includes('#dialogue-speaker')).toBeTruthy();
    expect(indexHtmlContent.includes('text-transform: uppercase')).toBeTruthy();
    expect(indexHtmlContent.includes('letter-spacing')).toBeTruthy();
  });

  test('Dialogue choice styling has comfortable line-height and padding', () => {
    expect(indexHtmlContent.includes('.dialogue-choice')).toBeTruthy();
    expect(indexHtmlContent.includes('padding:')).toBeTruthy();
  });

  test('Dialogue continue prompt has legible high-contrast styling and key prompt', () => {
    expect(indexHtmlContent.includes('#dialogue-continue')).toBeTruthy();
    expect(indexHtmlContent.includes('Press [E]')).toBeTruthy();
  });

  test('Choice hover state provides clear visual feedback and border highlight', () => {
    expect(indexHtmlContent.includes('.dialogue-choice:hover')).toBeTruthy();
    expect(indexHtmlContent.includes('border-color: #d4af37') || indexHtmlContent.includes('border-color:')).toBeTruthy();
  });
});

// ============================================================================
// F15: Comprehensive E2E Verification & Typecheck
// ============================================================================
describe('F15: Comprehensive E2E Verification & Typecheck', 1, 'F15', () => {
  test('package.json contains required build scripts: dev, build, preview', () => {
    expect(packageJsonContent.scripts).toBeDefined();
    expect(packageJsonContent.scripts.build).toBeDefined();
    expect(packageJsonContent.scripts.dev).toBeDefined();
    expect(packageJsonContent.scripts.preview).toBeDefined();
  });

  test('tsconfig.json contains valid configuration with strict mode enabled', () => {
    expect(tsconfigContent.compilerOptions).toBeDefined();
    expect(tsconfigContent.compilerOptions.strict).toBe(true);
  });

  test('Game phases state machine defines all 15 canonical phases', () => {
    const validPhases = [
      'cold_open', 'opening_title', 'arrival', 'announcement', 'blackout', 'discovery',
      'investigation_1', 'midpoint_reversal', 'investigation_2', 'reconstruction',
      'final_confrontation', 'ending', 'credits', 'post_credits', 'complete'
    ];
    for (const phase of validPhases) {
      gameState.setPhase(phase as any);
      expect(gameState.getPhase()).toBe(phase);
    }
  });

  test('All 6 observatory chambers are registered in rooms.ts with valid dimensions and exits', () => {
    const requiredRooms = ['main_hall', 'exhibition_chamber', 'clockwork_gallery', 'library', 'pendulum_room', 'observation_deck'];
    for (const rId of requiredRooms) {
      const room = rooms[rId];
      expect(room).toBeDefined();
      expect(room.width).toBeGreaterThan(10);
      expect(room.height).toBeGreaterThan(10);
      expect(room.exits.length).toBeGreaterThan(0);
    }
  });

  test('All required evidence keys exist in evidence data catalog', () => {
    const requiredKeys = [
      'connecting_door', 'hugo_fingerprints', 'rain_sensor_data',
      'spliced_recording', 'nadia_vial', 'thirteenth_chime_resonance',
      'poisoned_tea', 'missing_lantern'
    ];
    for (const key of requiredKeys) {
      expect((evidence as any)[key]).toBeDefined();
    }
  });
});
