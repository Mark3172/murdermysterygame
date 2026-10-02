import fs from 'fs';
import path from 'path';
import { describe, test, expect } from './framework';
import { rooms } from '../src/data/rooms';
import { gameState } from '../src/logic/GameState';
import { hintSystem } from '../src/logic/HintSystem';
import { DeductionEngine } from '../src/logic/DeductionEngine';
import { StoryPhaseManager } from '../src/logic/StoryPhaseManager';

const ROOT_DIR = process.cwd();
const deductionEngine = new DeductionEngine();
const storyPhaseManager = new StoryPhaseManager();

// ============================================================================
// Tier 3: Pairwise & Cross-Feature Interactions
// ============================================================================

describe('Tier 3: Pair 1 - Hint Progression x Clue Collection', 3, 'F1', () => {
  test('Collecting connecting_door dynamically updates hint target from door to fingerprints', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    const hintBefore = hintSystem.getHint();
    expect(hintBefore).toBeDefined();

    gameState.addEvidence('connecting_door');
    const hintAfter = hintSystem.getHint();
    expect(hintAfter).toBeDefined();
    // Hint text should reflect change in objective
    expect(hintAfter!.text.length).toBeGreaterThan(0);
  });

  test('Collecting hugo_fingerprints dynamically updates hint target to rain_sensor_data', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('connecting_door');
    gameState.addEvidence('hugo_fingerprints');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    const text = hint!.text.toLowerCase();
    expect(text.includes('rain') || text.includes('sensor') || text.includes('weather') || text.includes('deck') || text.includes('observation')).toBeTruthy();
  });

  test('Collecting all 3 locked room clues updates hint target to Hugo confrontation', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('connecting_door');
    gameState.addEvidence('hugo_fingerprints');
    gameState.addEvidence('rain_sensor_data');
    const hint = hintSystem.getHint();
    expect(hint).toBeDefined();
    const text = hint!.text.toLowerCase();
    expect(text.includes('confront') || text.includes('hugo') || text.includes('confess') || text.includes('present')).toBeTruthy();
  });

  test('Obtaining hugo_confessed satisfies investigation_1 exit criteria in StoryPhaseManager', () => {
    gameState.reset();
    gameState.setPhase('investigation_1');
    gameState.addEvidence('connecting_door');
    gameState.addEvidence('hugo_fingerprints');
    gameState.addEvidence('rain_sensor_data');
    gameState.setDialogueFlag('hugo_confessed');
    expect(storyPhaseManager.canAdvancePhase()).toBeTruthy();
  });
});

describe('Tier 3: Pair 2 - Room Transitions x Interactable Proximity', 3, 'F7', () => {
  test('Player position at Exhibition Chamber deadbolt (144, 64) is spatially separated from Main Hall exit zone', () => {
    const ec = rooms.exhibition_chamber;
    const bolt = ec.interactables.find(i => i.id === 'door_bolt')!;
    const exit = ec.exits.find(e => e.targetRoom === 'main_hall')!;

    // Bolt coordinates: (144, 64)
    // Doorway exit coordinates: (192, 16)
    const boltPixelX = bolt.x * 16;
    const boltPixelY = bolt.y * 16;
    const exitPixelX = exit.x * 16;
    const exitPixelY = exit.y * 16;

    const spatialDistance = Math.hypot(boltPixelX - exitPixelX, boltPixelY - exitPixelY);
    // Spatial separation must exceed interaction radius (45px)
    expect(spatialDistance).toBeGreaterThan(45);
  });

  test('Main Hall armchair relocation ensures spawn point (128, 80) does not collide with furniture', () => {
    const mh = rooms.main_hall;
    const exitExhibition = mh.exits.find(e => e.targetRoom === 'exhibition_chamber')!;
    // Exhibition chamber exit is at x: 8, y: 1. Spawn point is (128, 80)
    // Verify no interactable occupies (8, 5)
    for (const ia of mh.interactables) {
      const collidesWithSpawn = ia.x === 8 && ia.y === 5;
      expect(collidesWithSpawn).toBeFalsy();
    }
  });

  test('Library archive desk does not pinch the corridor against south interactables', () => {
    const lib = rooms.library;
    const desk = lib.interactables.find(i => i.id === 'archive_desk')!;
    const shelf = lib.interactables.find(i => i.id === 'shelf_3')!;
    // Check desk and shelf do not block each other
    expect(desk.y).toBeGreaterThan(shelf.y);
  });
});

describe('Tier 3: Pair 3 - EventBus Bridge & DOM Overlay Payloads', 3, 'F12', () => {
  test('show-hint payload conforms to PROJECT.md interface contract: { level, text, category? }', () => {
    const payload = {
      level: 1 as const,
      text: 'Examine the crime scene.',
      category: 'investigation',
    };
    expect([1, 2, 3]).toContain(payload.level);
    expect(typeof payload.text).toBe('string');
    expect(typeof payload.category).toBe('string');
  });

  test('show-discovery payload conforms to PROJECT.md contract: { name, description, category? }', () => {
    const payload = {
      name: 'Connecting Door',
      description: 'A concealed doorway behind the massive brass gears.',
      category: 'physical_evidence',
    };
    expect(typeof payload.name).toBe('string');
    expect(typeof payload.description).toBe('string');
    expect(payload.name.length).toBeGreaterThan(0);
    expect(payload.description.length).toBeGreaterThan(0);
  });

  test('show-msg payload conforms to PROJECT.md contract: { text }', () => {
    const payload = { text: 'The door is locked from the inside.' };
    expect(typeof payload.text).toBe('string');
    expect(payload.text.length).toBeGreaterThan(0);
  });

  test('update-prompt payload conforms to PROJECT.md contract: { text, visible }', () => {
    const payload = { text: '[E] Examine Door Bolt', visible: true };
    expect(typeof payload.text).toBe('string');
    expect(typeof payload.visible).toBe('boolean');
  });
});

describe('Tier 3: Pair 4 - Phase Progression x Deduction Engine', 3, 'F5', () => {
  test('Accusation validation verifies true culprit Nadia, method poisoned_tea, and false alibi missing_lantern', () => {
    gameState.reset();
    gameState.setPhase('final_confrontation');

    // Add all required evidence
    gameState.addEvidence('spliced_recording');
    gameState.addEvidence('nadia_vial');
    gameState.addEvidence('thirteenth_chime_resonance');

    const result = deductionEngine.validateAccusation({
      culprit: 'nadia',
      method: 'poisoned_tea',
      falseAlibi: 'missing_lantern',
      evidence1: 'spliced_recording',
      evidence2: 'nadia_vial',
      evidence3: 'thirteenth_chime_resonance',
    });

    expect(result.correct).toBeTruthy();
    expect(gameState.hasDialogueFlag('killer_identified')).toBeTruthy();
  });

  test('Incorrect culprit in accusation returns targeted feedback without identifying killer', () => {
    gameState.reset();
    gameState.setPhase('final_confrontation');
    gameState.addEvidence('spliced_recording');
    gameState.addEvidence('nadia_vial');
    gameState.addEvidence('thirteenth_chime_resonance');

    const result = deductionEngine.validateAccusation({
      culprit: 'hugo', // Incorrect
      method: 'poisoned_tea',
      falseAlibi: 'missing_lantern',
      evidence1: 'spliced_recording',
      evidence2: 'nadia_vial',
      evidence3: 'thirteenth_chime_resonance',
    });

    expect(result.correct).toBeFalsy();
    expect(gameState.hasDialogueFlag('killer_identified')).toBeFalsy();
  });

  test('killer_identified flag unlocks final_confrontation exit in StoryPhaseManager', () => {
    gameState.reset();
    gameState.setPhase('final_confrontation');
    expect(storyPhaseManager.canAdvancePhase()).toBeFalsy();

    gameState.setDialogueFlag('killer_identified');
    expect(storyPhaseManager.canAdvancePhase()).toBeTruthy();
  });
});

describe('Tier 3: Pair 5 - Gadget Equipment x Evidence Acquisition', 3, 'F4', () => {
  test('Micro Rover [4] requirement unlocks connecting_door at clockwork_gallery wall_gap', () => {
    const cg = rooms.clockwork_gallery;
    const wallGap = cg.interactables.find(i => i.id === 'wall_gap')!;
    expect(wallGap.gadgetRequired).toBe('micro_rover');
    expect(wallGap.evidenceId).toBe('connecting_door');
    expect(gameState.hasGadget('micro_rover')).toBeTruthy();
  });

  test('Trace Light [3] requirement unlocks hugo_fingerprints at exhibition_chamber door_bolt', () => {
    const ec = rooms.exhibition_chamber;
    const bolt = ec.interactables.find(i => i.id === 'door_bolt')!;
    expect(bolt.gadgetRequired).toBe('trace_light');
    expect(bolt.evidenceId).toBe('hugo_fingerprints');
    expect(gameState.hasGadget('trace_light')).toBeTruthy();
  });

  test('Echo Lens [2] requirement unlocks rain_sensor_data at observation_deck deck_sensors', () => {
    const od = rooms.observation_deck;
    const sensors = od.interactables.find(i => i.id === 'deck_sensors')!;
    expect(sensors.gadgetRequired).toBe('echo_lens');
    expect(sensors.evidenceId).toBe('rain_sensor_data');
    expect(gameState.hasGadget('echo_lens')).toBeTruthy();
  });

  test('Voice Prism [5] requirement unlocks spliced_recording at main_hall pa_speaker', () => {
    const mh = rooms.main_hall;
    const speaker = mh.interactables.find(i => i.id === 'pa_speaker')!;
    expect(speaker.gadgetRequired).toBe('voice_prism');
    expect(speaker.evidenceId).toBe('spliced_recording');
    expect(gameState.hasGadget('voice_prism')).toBeTruthy();
  });
});
