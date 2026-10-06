import { setupBrowserShim } from './framework';
setupBrowserShim();

import { gameState } from '../src/logic/GameState';
import { storyManager } from '../src/logic/StoryPhaseManager';
import { deductionEngine } from '../src/logic/DeductionEngine';
import { cutscenes } from '../src/data/cutscenes';
import { dialogue } from '../src/data/dialogue';
import { rooms } from '../src/data/rooms';

console.log('--- STARTING TEST PLAYER FULL PLAYTHROUGH SIMULATION ---');

// 1. New Game Initialization
gameState.reset();
console.log('Step 1: Game Reset. Phase:', gameState.getPhase());
if (gameState.getPhase() !== 'cold_open') {
  console.error('FAIL: Expected initial phase to be cold_open, got:', gameState.getPhase());
  process.exit(1);
}

// Complete cold_open cutscene
storyManager.start();
console.log('Current Phase in StoryManager:', storyManager.getCurrentPhase()?.id);
gameState.markCutsceneSeen('cold_open');
storyManager.advancePhase();
console.log('Step 2: After cold_open advance. Phase:', gameState.getPhase());

// Complete opening_title cutscene
gameState.markCutsceneSeen('opening_title');
storyManager.advancePhase();
console.log('Step 3: After opening_title advance. Phase:', gameState.getPhase());

// Complete gadget_tutorial & discovery_scene
gameState.markCutsceneSeen('gadget_tutorial');
gameState.markCutsceneSeen('discovery_scene');

// Check what phase ExplorationScene ensures
const curP = gameState.getPhase();
if (!curP || ['cold_open', 'opening_title', 'arrival', 'announcement', 'blackout', 'discovery'].includes(curP)) {
  gameState.setPhase('investigation_1');
}
console.log('Step 4: Arrived in ExplorationScene. Phase:', gameState.getPhase());
if (gameState.getPhase() !== 'investigation_1') {
  console.error('FAIL: Expected phase to be investigation_1, got:', gameState.getPhase());
  process.exit(1);
}

// Step 5: Investigation 1 - Collect Clues
// Clue 1: connecting_door via Micro Rover in Clockwork Gallery
gameState.collectEvidence('connecting_door');
console.log('Collected connecting_door. Has it?', gameState.hasEvidence('connecting_door'));

// Clue 2: hugo_fingerprints via Trace Light on deadbolt in Exhibition Chamber
gameState.collectEvidence('hugo_fingerprints');
console.log('Collected hugo_fingerprints. Has it?', gameState.hasEvidence('hugo_fingerprints'));

// Clue 3: rain_sensor_data via Echo Lens on Observation Deck
gameState.collectEvidence('rain_sensor_data');
console.log('Collected rain_sensor_data. Has it?', gameState.hasEvidence('rain_sensor_data'));

// Step 6: Question Hugo
console.log('Questioning Hugo...');
const hugoTree = dialogue.hugo_interview;
if (!hugoTree) {
  console.error('FAIL: hugo_interview dialogue tree missing!');
  process.exit(1);
}
// Choice: (Confront) You bolted the room from inside and escaped!
const confrontChoice = hugoTree.nodes.greet.choices?.find(c => c.nextId === 'confront_hugo');
if (!confrontChoice) {
  console.error('FAIL: confront_hugo choice not found in hugo_interview!');
  process.exit(1);
}
// Follow dialogue nodes
const breakdownNode = hugoTree.nodes.hugo_breakdown;
if (!breakdownNode || breakdownNode.setFlag !== 'hugo_confessed') {
  console.error('FAIL: hugo_breakdown does not set hugo_confessed flag!');
  process.exit(1);
}
gameState.setDialogueFlag('hugo_confessed');
console.log('Hugo confessed! Flag set:', gameState.hasDialogueFlag('hugo_confessed'));

// Check if Investigation 1 can exit
console.log('Can exit Investigation 1?', storyManager.canAdvancePhase());
if (!storyManager.canAdvancePhase()) {
  console.error('FAIL: Cannot advance from investigation_1 despite hugo_confessed!');
  process.exit(1);
}

// Advance to midpoint_reversal
storyManager.advancePhase();
console.log('Step 7: Advanced to midpoint reversal. Phase:', gameState.getPhase());
if (gameState.getPhase() !== 'midpoint_reversal') {
  console.error('FAIL: Expected midpoint_reversal, got:', gameState.getPhase());
  process.exit(1);
}

// Complete midpoint_reversal cutscene
gameState.markCutsceneSeen('midpoint_reversal');
console.log('Timeline broken flag?', gameState.hasDialogueFlag('timeline_broken'));
storyManager.advancePhase();
console.log('Step 8: Advanced to investigation_2. Phase:', gameState.getPhase());
if (gameState.getPhase() !== 'investigation_2') {
  console.error('FAIL: Expected investigation_2, got:', gameState.getPhase());
  process.exit(1);
}

// Step 9: Investigation 2 - Evidence Search
console.log('Searching for clues in Investigation 2...');
gameState.collectEvidence('spliced_recording');
gameState.collectEvidence('petra_hidden_recorder');
gameState.collectEvidence('nadia_vial');
gameState.collectEvidence('missing_lantern');
gameState.collectEvidence('poisoned_tea');
gameState.collectEvidence('thirteenth_chime_resonance');

console.log('Total evidence count:', gameState.getEvidenceCount());
console.log('Can exit investigation_2?', storyManager.canAdvancePhase());
if (!storyManager.canAdvancePhase()) {
  console.error('FAIL: Cannot exit investigation_2 despite having 6+ evidence!');
  process.exit(1);
}

// Advance to reconstruction
storyManager.advancePhase();
console.log('Step 10: Advanced to reconstruction. Phase:', gameState.getPhase());
if (gameState.getPhase() !== 'reconstruction') {
  console.error('FAIL: Expected reconstruction, got:', gameState.getPhase());
  process.exit(1);
}

// Step 11: Solve Reconstruction
console.log('Solving timeline reconstruction...');
const correctIds = [
  'event_poison',
  'event_recording',
  'event_death',
  'event_hugo_discovery',
  'event_locked_room'
];
gameState.setDialogueFlag('reconstruction_complete');
gameState.completeReconstruction();
console.log('Reconstruction complete. Flag set:', gameState.hasDialogueFlag('reconstruction_complete'));
console.log('Can exit reconstruction phase?', storyManager.canAdvancePhase());
if (!storyManager.canAdvancePhase()) {
  console.error('FAIL: Cannot exit reconstruction phase!');
  process.exit(1);
}

// Advance to final_confrontation
storyManager.advancePhase();
console.log('Step 12: Advanced to final_confrontation. Phase:', gameState.getPhase());
if (gameState.getPhase() !== 'final_confrontation') {
  console.error('FAIL: Expected final_confrontation, got:', gameState.getPhase());
  process.exit(1);
}

// Step 13: Final Accusation in DeductionScene
console.log('Presenting final accusation...');
const accusation = {
  culprit: 'nadia',
  method: 'poisoned_tea',
  falseAlibi: 'missing_lantern',
  evidence1: 'spliced_recording',
  evidence2: 'nadia_vial',
  evidence3: 'thirteenth_chime_resonance'
};
const result = deductionEngine.validateAccusation(accusation);
console.log('Accusation validation result:', result);
if (!result.correct) {
  console.error('FAIL: Accusation was not accepted!', result.feedback);
  process.exit(1);
}
gameState.identifyKiller();
console.log('Killer identified flag?', gameState.hasDialogueFlag('killer_identified'));

console.log('Can exit final_confrontation?', storyManager.canAdvancePhase());
if (!storyManager.canAdvancePhase()) {
  console.error('FAIL: Cannot exit final_confrontation phase!');
  process.exit(1);
}

// Advance to ending
storyManager.advancePhase();
console.log('Step 14: Advanced to ending. Phase:', gameState.getPhase());

// Complete ending cutscene
gameState.markCutsceneSeen('ending');
storyManager.advancePhase();
console.log('Step 15: Advanced to credits. Phase:', gameState.getPhase());

// Complete credits & post_credits
gameState.markCutsceneSeen('credits_scene');
storyManager.advancePhase();
console.log('Step 16: Advanced to post_credits. Phase:', gameState.getPhase());

gameState.markCutsceneSeen('post_credits');
storyManager.advancePhase();
console.log('Step 17: Game Complete! Final Phase:', gameState.getPhase());

console.log('--- ALL SIMULATION STEPS PASSED SUCCESSFULLY! ---');
