// Adversarial Test Harness: Requirement R1 (Story Flow & Dynamic 3-Tier Progressive Hint System)
// Challenger 1 (Adversarial Verifier: Hints & Narrative)

// --- Headless Browser / Node Shims ---
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = globalThis;
}
if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    documentElement: {},
    compatMode: 'CSS1Compat',
    createElement: (tag: string) => ({
      tagName: tag.toUpperCase(),
      getContext: () => null,
      appendChild: () => {},
      setAttribute: () => {},
      style: {},
    }),
    getElementsByTagName: () => [],
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
  };
}
if (typeof (globalThis as any).Image === 'undefined') {
  (globalThis as any).Image = class Image {
    src: string = '';
    width: number = 0;
    height: number = 0;
    onload: (() => void) | null = null;
  };
}
if (typeof (globalThis as any).HTMLCanvasElement === 'undefined') {
  (globalThis as any).HTMLCanvasElement = class HTMLCanvasElement {};
}

import { gameState, GamePhase } from '../src/logic/GameState';
import { hintSystem, DYNAMIC_INQUIRIES, HintResponse } from '../src/logic/HintSystem';
import { EventBus } from '../engine/EventBus';

let passedChecks = 0;
let failedChecks = 0;
const failureDetails: string[] = [];

function assert(condition: boolean, message: string) {
  if (condition) {
    passedChecks++;
  } else {
    failedChecks++;
    failureDetails.push(message);
    console.error(`  FAIL: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, context: string) {
  if (actual === expected) {
    passedChecks++;
  } else {
    failedChecks++;
    const msg = `${context} -> Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
    failureDetails.push(msg);
    console.error(`  FAIL: ${msg}`);
  }
}

console.log('======================================================================');
console.log('   CHALLENGER 1: ADVERSARIAL STRESS TEST HARNESS — REQUIREMENT R1     ');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// TEST SUITE 1: Obsolete Living Aldric Narrative Scan
// -----------------------------------------------------------------------------
console.log('[Suite 1] Scanning all dynamic inquiries, fallbacks, and phases for living Aldric references...');
{
  const forbiddenPatterns = [
    /aldric is near the podium/i,
    /aldric is at the podium/i,
    /near the podium/i,
    /approach aldric/i,
    /greet aldric/i,
    /talk to aldric/i,
    /speak with aldric/i,
    /aldric is waiting/i,
    /aldric is alive/i,
    /aldric is standing/i,
    /find aldric in the main hall/i,
  ];

  // 1.1 Check all DYNAMIC_INQUIRIES
  for (const inq of DYNAMIC_INQUIRIES) {
    for (const [tierKey, text] of Object.entries(inq.hints)) {
      for (const pattern of forbiddenPatterns) {
        assert(!pattern.test(text), `DYNAMIC_INQUIRIES ${inq.id} ${tierKey} contains obsolete text matching ${pattern}: "${text}"`);
      }
    }
  }

  // 1.2 Check all phases and fallbacks
  const allPhases: GamePhase[] = [
    'cold_open', 'opening_title', 'arrival', 'announcement', 'blackout',
    'discovery', 'investigation_1', 'midpoint_reversal', 'investigation_2',
    'reconstruction', 'final_confrontation', 'ending', 'credits', 'post_credits', 'complete'
  ];

  for (const phase of allPhases) {
    gameState.reset();
    gameState.setPhase(phase);
    const activeInq = hintSystem.getActiveInquiry(phase);
    for (const [tierKey, text] of Object.entries(activeInq.hints)) {
      for (const pattern of forbiddenPatterns) {
        assert(!pattern.test(text), `Phase ${phase} active inquiry ${activeInq.id} ${tierKey} contains obsolete text matching ${pattern}: "${text}"`);
      }
    }

    // Call getHint 3 times per phase and check returned text
    for (let t = 1; t <= 3; t++) {
      const hint = hintSystem.getHint(true);
      for (const pattern of forbiddenPatterns) {
        assert(!pattern.test(hint.text), `Phase ${phase} tier ${hint.tier} hint text matches forbidden pattern ${pattern}: "${hint.text}"`);
      }
    }
  }
}
console.log(`  -> Suite 1 completed: Checked all inquiries, fallbacks, and phases.\n`);

// -----------------------------------------------------------------------------
// TEST SUITE 2: Rapid Tier Cycling & Modulo Wrap (1 -> 2 -> 3 -> 1)
// -----------------------------------------------------------------------------
console.log('[Suite 2] Stress-testing Rapid Tier Cycling (1 -> 2 -> 3 -> 1)...');
{
  gameState.reset();
  gameState.setPhase('investigation_1');
  hintSystem.resetLevel();

  // 100 consecutive cycleTier calls on the same objective
  for (let cycle = 1; cycle <= 100; cycle++) {
    const hint = hintSystem.cycleTier();
    const expectedTier = (((cycle - 1) % 3) + 1) as 1 | 2 | 3;
    assertEqual(hint.tier, expectedTier, `Cycle ${cycle} hint.tier`);
    assertEqual(hint.level, expectedTier, `Cycle ${cycle} hint.level`);
    assertEqual(hint.hasMore, expectedTier < 3, `Cycle ${cycle} hint.hasMore`);
    assert(hint.text.length > 10, `Cycle ${cycle} hint.text non-empty`);
    assertEqual(hint.inquiryId, 'inv1_connecting_door', `Cycle ${cycle} inquiryId`);
  }

  // getCurrentHint without advancing
  const current = hintSystem.getCurrentHint();
  assertEqual(current.tier, 1, 'getCurrentHint after 100 cycles wraps to 1 and does not advance');
  const current2 = hintSystem.getCurrentHint();
  assertEqual(current2.tier, 1, 'Second getCurrentHint remains at 1');
}
console.log(`  -> Suite 2 completed: 100+ rapid cycles verified.\n`);

// -----------------------------------------------------------------------------
// TEST SUITE 3: Investigation 1 — All 6 Clue Permutations & Out-of-Order Tests
// -----------------------------------------------------------------------------
console.log('[Suite 3] Adversarially stress-testing Investigation 1 Clue Permutations (3! = 6 orders)...');
{
  const clues = ['connecting_door', 'hugo_fingerprints', 'rain_sensor_data'];

  // Permutation generator
  function permute(arr: string[]): string[][] {
    if (arr.length <= 1) return [arr];
    const res: string[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      for (const p of permute(rest)) {
        res.push([arr[i], ...p]);
      }
    }
    return res;
  }

  const permutations = permute(clues);
  assertEqual(permutations.length, 6, 'Generated 6 permutations for 3 clues');

  for (let pIdx = 0; pIdx < permutations.length; pIdx++) {
    const order = permutations[pIdx];
    gameState.reset();
    gameState.setPhase('investigation_1');
    hintSystem.resetLevel();

    let collectedSoFar = new Set<string>();

    for (let step = 0; step < order.length; step++) {
      const clueToCollect = order[step];

      // Before collecting, request hint at Tier 1, then advance to Tier 2 and Tier 3
      const h1 = hintSystem.getHint(true);
      assertEqual(h1.tier, 1, `Permutation [${order.join(' -> ')}] step ${step} tier 1`);
      const h2 = hintSystem.getHint(true);
      assertEqual(h2.tier, 2, `Permutation [${order.join(' -> ')}] step ${step} tier 2`);
      const h3 = hintSystem.getHint(true);
      assertEqual(h3.tier, 3, `Permutation [${order.join(' -> ')}] step ${step} tier 3`);

      // Verify that the active inquiry is indeed MISSING
      const active = hintSystem.getActiveInquiry();
      assert(
        (active.id === 'inv1_connecting_door' && !collectedSoFar.has('connecting_door')) ||
        (active.id === 'inv1_hugo_fingerprints' && !collectedSoFar.has('hugo_fingerprints')) ||
        (active.id === 'inv1_rain_sensor_data' && !collectedSoFar.has('rain_sensor_data')),
        `Permutation [${order.join(' -> ')}] step ${step}: Active inquiry ${active.id} is uncollected`
      );

      // Now collect the clue
      gameState.collectEvidence(clueToCollect);
      collectedSoFar.add(clueToCollect);

      // CRITICAL CHECK: Tier must reset to Tier 1 immediately on next hint call!
      const postCollectHint = hintSystem.getHint(true);
      assertEqual(
        postCollectHint.tier,
        1,
        `Permutation [${order.join(' -> ')}] step ${step}: Post-collection hint MUST reset to Tier 1`
      );
    }

    // Now all 3 clues collected: active inquiry should be Hugo confrontation
    const confrontationHint = hintSystem.getCurrentHint();
    assertEqual(confrontationHint.inquiryId, 'inv1_hugo_confrontation', `Permutation [${order.join(' -> ')}]: All clues collected -> Hugo confrontation`);
    assert(confrontationHint.text.includes('Hugo'), 'Hugo confrontation hint mentions Hugo');

    // Cycle through confrontation hint tiers
    const confT2 = hintSystem.cycleTier();
    assertEqual(confT2.tier, 2, `Confrontation Tier 2`);
    const confT3 = hintSystem.cycleTier();
    assertEqual(confT3.tier, 3, `Confrontation Tier 3`);

    // Hugo confesses
    gameState.setDialogueFlag('hugo_confessed');

    // Post-confession fallback hint
    const fallbackHint = hintSystem.getHint(true);
    assertEqual(fallbackHint.tier, 1, `Post-confession fallback hint resets to Tier 1`);
    assertEqual(fallbackHint.inquiryId, 'inv1_complete', `Post-confession fallback inquiry is inv1_complete`);
    assert(fallbackHint.text.includes('Hugo has confessed'), 'Fallback mentions Hugo confessed');
  }
}
console.log(`  -> Suite 3 completed: All 6 clue permutations passed with flawless tier resets.\n`);

// -----------------------------------------------------------------------------
// TEST SUITE 4: Investigation 2 — Clue Permutations & Out-of-Order Discoveries
// -----------------------------------------------------------------------------
console.log('[Suite 4] Adversarially stress-testing Investigation 2 Clues (including dual Petra ID & 120 permutations)...');
{
  const inv2Clues = [
    'spliced_recording',
    'petra_hidden_recorder', // or petra_recorder
    'nadia_vial',
    'poisoned_tea',
    'thirteenth_chime_resonance'
  ];

  // Test dual petra recorder IDs
  for (const petraId of ['petra_hidden_recorder', 'petra_recorder']) {
    gameState.reset();
    gameState.setPhase('investigation_2');
    hintSystem.resetLevel();

    // Spliced recording collected
    gameState.collectEvidence('spliced_recording');
    let active = hintSystem.getActiveInquiry();
    assertEqual(active.id, 'inv2_petra_recorder', `After spliced_recording, active is petra_recorder`);

    // Collect petra ID
    gameState.collectEvidence(petraId);
    active = hintSystem.getActiveInquiry();
    assertEqual(active.id, 'inv2_solvent_vial', `After collecting ${petraId}, active is inv2_solvent_vial`);
  }

  // Permutation generator for inv2 clues
  function permuteSmall(arr: string[]): string[][] {
    if (arr.length <= 1) return [arr];
    const res: string[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      for (const p of permuteSmall(rest)) {
        res.push([arr[i], ...p]);
      }
    }
    return res;
  }

  const allInv2Permutations = permuteSmall(inv2Clues);
  assertEqual(allInv2Permutations.length, 120, '120 permutations for Investigation 2 clues');

  // Test every single permutation of the 120!
  for (let i = 0; i < allInv2Permutations.length; i++) {
    const order = allInv2Permutations[i];
    gameState.reset();
    gameState.setPhase('investigation_2');
    hintSystem.resetLevel();

    for (let step = 0; step < order.length; step++) {
      const clue = order[step];
      const hBefore = hintSystem.getHint(true);
      assert(hBefore.tier >= 1 && hBefore.tier <= 3, `Inv2 perm ${i} step ${step} tier valid`);
      
      gameState.collectEvidence(clue);

      // If active inquiry was satisfied, tier must reset to 1
      const hAfter = hintSystem.getHint(true);
      assert(hAfter.tier >= 1 && hAfter.tier <= 3, `Inv2 perm ${i} post-step tier valid`);
    }

    // All 5 clues collected: inquiry should be inv2_to_reconstruction
    const finalInq = hintSystem.getActiveInquiry();
    assertEqual(finalInq.id, 'inv2_to_reconstruction', `Inv2 perm ${i}: All 5 clues found -> inv2_to_reconstruction`);

    // Complete reconstruction flag
    gameState.setDialogueFlag('reconstruction_complete');
    const fallbackInq = hintSystem.getActiveInquiry();
    assertEqual(fallbackInq.id, 'inv2_complete', `Inv2 perm ${i}: reconstruction complete -> inv2_complete`);
  }
}
console.log(`  -> Suite 4 completed: 120 Investigation 2 permutations fully verified.\n`);

// -----------------------------------------------------------------------------
// TEST SUITE 5: Midpoint Reversal, Reconstruction & Final Confrontation
// -----------------------------------------------------------------------------
console.log('[Suite 5] Testing Midpoint Reversal, Reconstruction, and Final Confrontation phases...');
{
  // 5.1 Midpoint Reversal
  gameState.reset();
  gameState.setPhase('midpoint_reversal');
  hintSystem.resetLevel();

  let h = hintSystem.getHint(true);
  assertEqual(h.inquiryId, 'midpoint_splice', 'Midpoint initial inquiry is midpoint_splice');
  assertEqual(h.chamber, 'Main Hall', 'Midpoint chamber is Main Hall');
  assertEqual(h.tier, 1, 'Midpoint tier 1');

  h = hintSystem.cycleTier();
  assertEqual(h.tier, 2, 'Midpoint tier 2');
  h = hintSystem.cycleTier();
  assertEqual(h.tier, 3, 'Midpoint tier 3');
  assert(h.text.includes('Voice Prism [5]'), 'Tier 3 names Voice Prism [5]');

  // Collect spliced_recording
  gameState.collectEvidence('spliced_recording');
  h = hintSystem.getHint(true);
  assertEqual(h.inquiryId, 'midpoint_complete', 'Midpoint after clue is midpoint_complete');
  assertEqual(h.tier, 1, 'Midpoint fallback resets to tier 1');

  // 5.2 Reconstruction
  gameState.reset();
  gameState.setPhase('reconstruction');
  hintSystem.resetLevel();

  h = hintSystem.getHint(true);
  assertEqual(h.inquiryId, 'recon_assembly', 'Reconstruction initial inquiry is recon_assembly');
  assertEqual(h.chamber, 'Exhibition Chamber', 'Reconstruction chamber is Exhibition Chamber');
  assertEqual(h.tier, 1, 'Reconstruction tier 1');

  h = hintSystem.cycleTier();
  assertEqual(h.tier, 2, 'Reconstruction tier 2');
  h = hintSystem.cycleTier();
  assertEqual(h.tier, 3, 'Reconstruction tier 3');
  assert(h.text.includes('1. Nadia prepares poison'), 'Tier 3 provides exact reconstruction sequence');

  // Complete reconstruction
  gameState.setDialogueFlag('reconstruction_complete');
  h = hintSystem.getHint(true);
  assertEqual(h.inquiryId, 'recon_complete', 'Reconstruction complete inquiry is recon_complete');
  assertEqual(h.tier, 1, 'Reconstruction fallback resets to tier 1');

  // 5.3 Final Confrontation
  // Scenario A: Player enters final_confrontation missing clues
  gameState.reset();
  gameState.setPhase('final_confrontation');
  hintSystem.resetLevel();

  h = hintSystem.getHint(true);
  assertEqual(h.inquiryId, 'final_missing_splice', 'Missing spliced recording in final confrontation');

  gameState.collectEvidence('spliced_recording');
  h = hintSystem.getHint(true);
  assertEqual(h.inquiryId, 'final_missing_vial', 'Missing vial in final confrontation');

  gameState.collectEvidence('nadia_vial');
  h = hintSystem.getHint(true);
  assertEqual(h.inquiryId, 'final_missing_chime', 'Missing chime in final confrontation');

  gameState.collectEvidence('thirteenth_chime_resonance');
  h = hintSystem.getHint(true);
  assertEqual(h.inquiryId, 'final_accusation', 'All 3 proofs present -> final_accusation');
  assertEqual(h.tier, 1, 'Final accusation resets to tier 1');

  h = hintSystem.cycleTier();
  assertEqual(h.tier, 2, 'Final accusation tier 2 points to Nadia in Main Hall');
  h = hintSystem.cycleTier();
  assertEqual(h.tier, 3, 'Final accusation tier 3 specifies full accusation formula');
  assert(h.text.includes('Accuse Nadia Thorn!'), 'Final accusation tier 3 specifies Accuse Nadia Thorn');
  assert(h.text.includes('Poisoned Tea'), 'Final accusation specifies Poisoned Tea');
  assert(h.text.includes('Missing Lantern'), 'Final accusation specifies Missing Lantern');

  // Complete murder accusation
  gameState.setDialogueFlag('killer_identified');
  h = hintSystem.getHint(true);
  assertEqual(h.inquiryId, 'final_complete', 'After accusation -> final_complete');
  assertEqual(h.tier, 1, 'Final complete resets to tier 1');
  assert(h.text.includes('Nadia Thorn has confessed'), 'Final complete mentions Nadia confession');
}
console.log(`  -> Suite 5 completed: Midpoint, Reconstruction, and Final Confrontation phases verified.\n`);

// -----------------------------------------------------------------------------
// TEST SUITE 6: EventBus Decoupled Emission Verification
// -----------------------------------------------------------------------------
console.log('[Suite 6] Testing EventBus decoupled emission on hint retrieval...');
{
  let receivedPayload: any = null;
  EventBus.on('show-hint', (payload: any) => {
    receivedPayload = payload;
  });

  gameState.reset();
  gameState.setPhase('investigation_1');
  hintSystem.resetLevel();

  const hint = hintSystem.getHint(true);
  assert(receivedPayload !== null, 'EventBus emitted show-hint');
  assertEqual(receivedPayload.level, 1, 'Payload level is 1');
  assertEqual(receivedPayload.tier, 1, 'Payload tier is 1');
  assertEqual(receivedPayload.text, hint.text, 'Payload text matches hint text');
  assertEqual(receivedPayload.objectiveId, 'inv1_connecting_door', 'Payload objectiveId');
  assertEqual(receivedPayload.chamber, 'Clockwork Gallery', 'Payload chamber');
  assertEqual(receivedPayload.phase, 'investigation_1', 'Payload phase');
  assertEqual(receivedPayload.hasMore, true, 'Payload hasMore is true for tier 1');

  const hint2 = hintSystem.cycleTier();
  assertEqual(receivedPayload.level, 2, 'Payload level updated to 2');
  assertEqual(receivedPayload.tier, 2, 'Payload tier updated to 2');

  const hint3 = hintSystem.cycleTier();
  assertEqual(receivedPayload.level, 3, 'Payload level updated to 3');
  assertEqual(receivedPayload.hasMore, false, 'Payload hasMore is false for tier 3');
}
console.log(`  -> Suite 6 completed: EventBus payloads verified.\n`);

// -----------------------------------------------------------------------------
// SUMMARY REPORT
// -----------------------------------------------------------------------------
console.log('======================================================================');
console.log('                    ADVERSARIAL SUITE EXECUTION SUMMARY               ');
console.log('======================================================================');
console.log(`Total Checks Run: ${passedChecks + failedChecks}`);
console.log(`Passed Checks:    ${passedChecks}`);
console.log(`Failed Checks:    ${failedChecks}`);
console.log('----------------------------------------------------------------------');

if (failedChecks === 0) {
  console.log('VERDICT: ALL ADVERSARIAL STRESS TESTS PASSED! REQUIREMENT R1 APPROVED.');
} else {
  console.log(`VERDICT: REJECT! ${failedChecks} ADVERSARIAL CHECKS FAILED:`);
  for (const detail of failureDetails) {
    console.log(`  - ${detail}`);
  }
}
console.log('======================================================================\n');

process.exit(failedChecks === 0 ? 0 : 1);
