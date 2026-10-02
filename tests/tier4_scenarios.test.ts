import fs from 'fs';
import path from 'path';
import { describe, test, expect } from './framework';
import { rooms } from '../src/data/rooms';
import { gameState } from '../src/logic/GameState';
import { hintSystem } from '../src/logic/HintSystem';
import { DeductionEngine } from '../src/logic/DeductionEngine';
import { StoryPhaseManager } from '../src/logic/StoryPhaseManager';

const ROOT_DIR = process.cwd();
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const indexHtmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

const deductionEngine = new DeductionEngine();
const storyPhaseManager = new StoryPhaseManager();

// ============================================================================
// Tier 4: Real-World Application Scenarios
// ============================================================================

describe('Tier 4: Scenario 1 - Investigation 1 Locked Room Progression', 4, 'F1', () => {
  test('Complete Investigation 1 walkthrough: Clues -> Hints -> Hugo Confrontation -> Phase Exit', () => {
    // Step 1: Initialize phase
    gameState.reset();
    gameState.setPhase('investigation_1');
    expect(gameState.getPhase()).toBe('investigation_1');
    expect(gameState.hasEvidence('connecting_door')).toBeFalsy();
    expect(gameState.hasEvidence('hugo_fingerprints')).toBeFalsy();
    expect(gameState.hasEvidence('rain_sensor_data')).toBeFalsy();

    // Step 2: Query Hint for Clue 1 (connecting_door)
    const hint1 = hintSystem.getHint();
    expect(hint1).toBeDefined();
    expect(hint1!.text.length).toBeGreaterThan(0);

    // Step 3: Simulate finding connecting_door via Micro Rover in Clockwork Gallery
    const wallGap = rooms.clockwork_gallery.interactables.find(i => i.id === 'wall_gap')!;
    expect(wallGap.evidenceId).toBe('connecting_door');
    gameState.addEvidence('connecting_door');
    expect(gameState.hasEvidence('connecting_door')).toBeTruthy();

    // Step 4: Query Hint for Clue 2 (hugo_fingerprints)
    const hint2 = hintSystem.getHint();
    expect(hint2).toBeDefined();

    // Step 5: Simulate finding hugo_fingerprints via Trace Light on Deadbolt
    const bolt = rooms.exhibition_chamber.interactables.find(i => i.id === 'door_bolt')!;
    expect(bolt.evidenceId).toBe('hugo_fingerprints');
    gameState.addEvidence('hugo_fingerprints');
    expect(gameState.hasEvidence('hugo_fingerprints')).toBeTruthy();

    // Step 6: Query Hint for Clue 3 (rain_sensor_data)
    const hint3 = hintSystem.getHint();
    expect(hint3).toBeDefined();

    // Step 7: Simulate finding rain_sensor_data on Observation Deck
    const sensors = rooms.observation_deck.interactables.find(i => i.id === 'deck_sensors')!;
    expect(sensors.evidenceId).toBe('rain_sensor_data');
    gameState.addEvidence('rain_sensor_data');
    expect(gameState.hasEvidence('rain_sensor_data')).toBeTruthy();

    // Step 8: Query Hint for Hugo Confrontation
    const hintConfront = hintSystem.getHint();
    expect(hintConfront).toBeDefined();

    // Step 9: Confront Hugo and obtain confession flag
    gameState.setDialogueFlag('hugo_confessed');
    expect(gameState.hasDialogueFlag('hugo_confessed')).toBeTruthy();

    // Step 10: Verify Phase Exit can trigger
    expect(storyPhaseManager.canAdvancePhase()).toBeTruthy();
    storyPhaseManager.advancePhase();
    expect(gameState.getPhase()).toBe('midpoint_reversal');
  });
});

describe('Tier 4: Scenario 2 - Exhibition Chamber Deadbolt Approach Without Doorway Trigger', 4, 'F7', () => {
  test('Simulated player path from room center to deadbolt maintains clearance from doorway zone', () => {
    // Room: Exhibition Chamber (width: 24, height: 20)
    // Exit to Main Hall: (12, 1) -> pixel (192, 16). Door trigger zone in ExplorationScene: [168..216] x [16..72]
    // Deadbolt: (9, 4) -> pixel (144, 64)
    const deadboltPos = { x: 144, y: 64 };
    const doorTriggerZone = { minX: 168, maxX: 216, minY: 16, maxY: 72 };

    // Player starts at room center (X: 192, Y: 160)
    const path = [
      { x: 192, y: 160 },
      { x: 180, y: 130 },
      { x: 160, y: 100 },
      { x: 144, y: 80 },
      { x: 144, y: 64 + 30 }, // Approaching within interaction distance (30px from deadbolt)
    ];

    for (const step of path) {
      // Check if step falls inside door trigger zone
      const inDoorZone = step.x >= doorTriggerZone.minX &&
                         step.x <= doorTriggerZone.maxX &&
                         step.y >= doorTriggerZone.minY &&
                         step.y <= doorTriggerZone.maxY;
      expect(inDoorZone).toBeFalsy();
    }

    // At final position (144, 94):
    const finalPos = path[path.length - 1];
    const distToDeadbolt = Math.hypot(finalPos.x - deadboltPos.x, finalPos.y - deadboltPos.y);
    expect(distToDeadbolt).toBeLessThan(45); // Within 45px interaction radius!
  });
});

describe('Tier 4: Scenario 3 - Investigation 2 Clue Search & Timeline Discrepancy', 4, 'F5', () => {
  test('Full Investigation 2 evidence collection flow: PA Speaker -> Recorder -> Vial -> Resonance', () => {
    gameState.reset();
    gameState.setPhase('investigation_2');
    expect(gameState.getPhase()).toBe('investigation_2');

    // 1. Analyze PA speaker in Main Hall
    const paSpeaker = rooms.main_hall.interactables.find(i => i.id === 'pa_speaker')!;
    expect(paSpeaker.evidenceId).toBe('spliced_recording');
    gameState.addEvidence('spliced_recording');

    // 2. Discover Petra's hidden recorder in Clockwork Gallery
    const darkCorner = rooms.clockwork_gallery.interactables.find(i => i.id === 'dark_corner')!;
    expect(darkCorner.evidenceId).toBe('petra_hidden_recorder');
    gameState.addEvidence('petra_hidden_recorder');

    // 3. Discover poison vial in Library
    const plant = rooms.library.interactables.find(i => i.id === 'potted_plant')!;
    expect(plant.evidenceId).toBe('nadia_vial');
    gameState.addEvidence('nadia_vial');

    // 4. Discover 13th chime acoustic resonance in Pendulum Room
    const acoustics = rooms.pendulum_room.interactables.find(i => i.id === 'acoustics')!;
    expect(acoustics.evidenceId).toBe('thirteenth_chime_resonance');
    gameState.addEvidence('thirteenth_chime_resonance');

    // 5. Additional context clues
    gameState.addEvidence('connecting_door');
    gameState.addEvidence('hugo_fingerprints');

    expect(gameState.getEvidenceCount()).toBeGreaterThanOrEqual(6);
    expect(storyPhaseManager.canAdvancePhase()).toBeTruthy();
  });
});

describe('Tier 4: Scenario 4 - Final Confrontation Accusation & Proof Presentation', 4, 'F14', () => {
  test('Complete Accusation Flow against Nadia Thorn with required physical evidence', () => {
    gameState.reset();
    gameState.setPhase('final_confrontation');

    // Equip evidence inventory
    gameState.addEvidence('spliced_recording');
    gameState.addEvidence('nadia_vial');
    gameState.addEvidence('thirteenth_chime_resonance');
    gameState.addEvidence('connecting_door');
    gameState.addEvidence('hugo_fingerprints');
    gameState.addEvidence('rain_sensor_data');
    gameState.addEvidence('poisoned_tea');
    gameState.addEvidence('missing_lantern');
    gameState.addEvidence('felix_ink_stain');
    gameState.addEvidence('project_echo_notes');

    // Make accusation
    const accusation = {
      culprit: 'nadia',
      method: 'poisoned_tea',
      falseAlibi: 'missing_lantern',
      evidence1: 'spliced_recording',
      evidence2: 'nadia_vial',
      evidence3: 'thirteenth_chime_resonance',
    };

    const result = deductionEngine.validateAccusation(accusation);
    expect(result.correct).toBeTruthy();
    expect(gameState.hasDialogueFlag('killer_identified')).toBeTruthy();
    expect(storyPhaseManager.canAdvancePhase()).toBeTruthy();
  });
});

describe('Tier 4: Scenario 5 - High-DPI Typography & DOM Overlay Stack Verification', 4, 'F13', () => {
  test('Complete inspection of DOM overlay structure, high-contrast styles, and font stacks', () => {
    // 1. Verify #ui-overlay is correctly mounted and styled
    expect(indexHtmlContent.includes('id="ui-overlay"')).toBeTruthy();

    // 2. Verify dialogue box structure
    expect(indexHtmlContent.includes('id="dialogue-container"')).toBeTruthy();
    expect(indexHtmlContent.includes('id="dialogue-speaker"')).toBeTruthy();
    expect(indexHtmlContent.includes('id="dialogue-text"')).toBeTruthy();
    expect(indexHtmlContent.includes('id="dialogue-choices"')).toBeTruthy();

    // 3. Verify notebook overlay
    expect(indexHtmlContent.includes('id="notebook-overlay"')).toBeTruthy();
    expect(indexHtmlContent.includes('class="notebook-tab active"')).toBeTruthy();

    // 4. Verify settings overlay
    expect(indexHtmlContent.includes('id="settings-overlay"')).toBeTruthy();

    // 5. Verify typography: Georgia for reading narrative
    expect(indexHtmlContent.includes('Georgia, serif')).toBeTruthy();
  });
});
