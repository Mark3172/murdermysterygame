// Dynamic Progressive 3-Tier Hint System for THE THIRTEENTH CHIME
import { gameState, GamePhase } from './GameState';
import { EventBus } from '../engine/EventBus';

export type HintTier = 1 | 2 | 3;

export interface ProgressiveHint {
  tier1: string; // Atmospheric Nudge
  tier2: string; // Room & Focus Direction
  tier3: string; // Actionable Detective Direction
}

export interface DynamicInquiry {
  id: string;
  phase: GamePhase;
  chamber: string;
  isSatisfied: (state: typeof gameState) => boolean;
  hints: ProgressiveHint;
}

export interface HintResponse {
  tier: HintTier;
  level: HintTier;
  text: string;
  chamber: string;
  inquiryId: string;
  objectiveId: string;
  phase: GamePhase;
  hasMore: boolean;
}

export interface HintSet {
  level1: string;
  level2: string;
  level3: string;
}

// Unified clue checker supporting both petra_hidden_recorder and petra_recorder
function hasClue(gs: typeof gameState, clueId: string): boolean {
  if (clueId === 'petra_hidden_recorder' || clueId === 'petra_recorder') {
    return gs.hasEvidence('petra_hidden_recorder') || gs.hasEvidence('petra_recorder');
  }
  return gs.hasEvidence(clueId);
}

// Compatibility shim: ensure gameState has addEvidence as an alias to collectEvidence
if (typeof (gameState as any).addEvidence !== 'function') {
  (gameState as any).addEvidence = function (evidenceId: string) {
    gameState.collectEvidence(evidenceId);
  };
}

export const DYNAMIC_INQUIRIES: DynamicInquiry[] = [
  // ==========================================
  // CHAPTER 1: investigation_1
  // ==========================================
  {
    id: 'inv1_connecting_door',
    phase: 'investigation_1',
    chamber: 'Clockwork Gallery',
    isSatisfied: (gs) => hasClue(gs, 'connecting_door'),
    hints: {
      tier1: 'The locked room was sealed from inside, but the clockwork gallery walls mask a secret door. Look for a gap where the machinery meets the wall.',
      tier2: 'Search the Clockwork Gallery. There is an unmapped opening tucked behind the churning brass gear assembly.',
      tier3: 'Equip the Micro Rover [4] in the Clockwork Gallery and inspect the Gap behind Gears to pilot the drone through the hidden passage.',
    },
  },
  {
    id: 'inv1_hugo_fingerprints',
    phase: 'investigation_1',
    chamber: 'Exhibition Chamber',
    isSatisfied: (gs) => hasClue(gs, 'hugo_fingerprints'),
    hints: {
      tier1: 'The heavy bolt on the chamber door was thrown from within. Physical contact always leaves invisible traces behind.',
      tier2: 'Examine the interior lock deadbolt on the Exhibition Chamber doorway for latent biological residue.',
      tier3: 'Equip the Trace Light [3] in the Exhibition Chamber and inspect the Heavy Bolt to reveal Hugo\'s smudged fingerprints.',
    },
  },
  {
    id: 'inv1_rain_sensor_data',
    phase: 'investigation_1',
    chamber: 'Observation Deck',
    isSatisfied: (gs) => hasClue(gs, 'rain_sensor_data'),
    hints: {
      tier1: 'Hugo swears he was standing outside in the gale during the blackout. Weather telemetry logs every footstep on the terrace.',
      tier2: 'Head up to the Observation Deck and inspect the automated meteorological sensor console.',
      tier3: 'Equip the Echo Lens [2] (or inspect directly) on the Weather Sensors at the Observation Deck to retrieve the logs proving Hugo lied about his alibi.',
    },
  },
  {
    id: 'inv1_hugo_confrontation',
    phase: 'investigation_1',
    chamber: 'Exhibition Chamber',
    isSatisfied: (gs) => gs.hasDialogueFlag('hugo_confessed'),
    hints: {
      tier1: 'With his alibi shattered, it is time to confront Hugo in the exhibition chamber and demand he confess to the locked room deception.',
      tier2: 'Find Hugo Wren standing in the Exhibition Chamber and confront him with the three contradicting proofs.',
      tier3: 'Talk to Hugo in the Exhibition Chamber and select: "(Confront) You bolted the room from inside and escaped!" to break his confession.',
    },
  },

  // ==========================================
  // CHAPTER 2: midpoint_reversal
  // ==========================================
  {
    id: 'midpoint_splice',
    phase: 'midpoint_reversal',
    chamber: 'Main Hall',
    isSatisfied: (gs) => hasClue(gs, 'spliced_recording'),
    hints: {
      tier1: 'Everyone based the time of death on Aldric\'s speech. But acoustics can be recorded, manipulated, and delayed.',
      tier2: 'Inspect the Public Address loudspeaker in the Main Hall to analyze the recording of the professor\'s voice.',
      tier3: 'Equip the Voice Prism [5] in the Main Hall and examine the PA Speaker to expose the frequency splices in the announcement.',
    },
  },

  // ==========================================
  // CHAPTER 3: investigation_2
  // ==========================================
  {
    id: 'inv2_spliced_recording',
    phase: 'investigation_2',
    chamber: 'Main Hall',
    isSatisfied: (gs) => hasClue(gs, 'spliced_recording'),
    hints: {
      tier1: 'The false timeline hinges on the broadcast. You need definitive proof that Aldric did not speak live at 7:45 PM.',
      tier2: 'Go to the Main Hall and analyze the central PA speaker mounted near the north doorway.',
      tier3: 'Equip the Voice Prism [5] and interact with the PA Speaker in the Main Hall to secure the Spliced Recording evidence.',
    },
  },
  {
    id: 'inv2_petra_recorder',
    phase: 'investigation_2',
    chamber: 'Clockwork Gallery',
    isSatisfied: (gs) => hasClue(gs, 'petra_hidden_recorder') || hasClue(gs, 'petra_recorder'),
    hints: {
      tier1: 'The journalist Petra was lurking near the machinery when the lights failed. She captured ambient sound in the dark.',
      tier2: 'Search the shadows near the entrance of the Clockwork Gallery for a concealed recording device.',
      tier3: 'Equip the Voice Prism [5] and inspect the Dark Corner in the Clockwork Gallery to recover Petra\'s hidden audio recording.',
    },
  },
  {
    id: 'inv2_solvent_vial',
    phase: 'investigation_2',
    chamber: 'Library & Archive',
    isSatisfied: (gs) => hasClue(gs, 'nadia_vial'),
    hints: {
      tier1: 'The toxic clockwork solvent used to poison the tea was discarded in haste somewhere quiet.',
      tier2: 'Search the Library & Archive among the potted flora for chemical glass residue.',
      tier3: 'Equip the Trace Light [3] and illuminate the Potted Plant in the Library to uncover Nadia\'s discarded solvent vial.',
    },
  },
  {
    id: 'inv2_poisoned_tea',
    phase: 'investigation_2',
    chamber: 'Exhibition Chamber',
    isSatisfied: (gs) => hasClue(gs, 'poisoned_tea'),
    hints: {
      tier1: 'Professor Sable collapsed while drinking at his workspace. The physical delivery mechanism remains at the scene.',
      tier2: 'Inspect the beverage container sitting on the Professor\'s Desk in the Exhibition Chamber.',
      tier3: 'Equip the Trace Light [3] and examine the Thermos in the Exhibition Chamber to identify the toxic industrial solvent.',
    },
  },
  {
    id: 'inv2_thirteenth_chime',
    phase: 'investigation_2',
    chamber: 'Pendulum Room',
    isSatisfied: (gs) => hasClue(gs, 'thirteenth_chime_resonance'),
    hints: {
      tier1: 'The eerie thirteenth chime that killed the power had an impossible frequency. Its acoustic signature matches an internal room.',
      tier2: 'Visit the Pendulum Room and analyze the atmospheric resonance around the great swinging weight.',
      tier3: 'Equip the Echo Lens [2] in the Pendulum Room and inspect Room Acoustics to record the matching Project Echo frequency.',
    },
  },
  {
    id: 'inv2_to_reconstruction',
    phase: 'investigation_2',
    chamber: 'Exhibition Chamber',
    isSatisfied: (gs) => gs.hasDialogueFlag('reconstruction_complete') || (gs as any).state?.reconstructionComplete === true,
    hints: {
      tier1: 'You have gathered the evidence breaking the alibis. It is time to reconstruct what actually happened when the lights died.',
      tier2: 'Return to the Exhibition Chamber to begin the timeline reconstruction.',
      tier3: 'Press [N] to review your findings, then interact with the Reconstruction board in the Exhibition Chamber to order the sequence of events.',
    },
  },

  // ==========================================
  // CHAPTER 4: reconstruction
  // ==========================================
  {
    id: 'recon_assembly',
    phase: 'reconstruction',
    chamber: 'Exhibition Chamber',
    isSatisfied: (gs) => gs.hasDialogueFlag('reconstruction_complete') || (gs as any).state?.reconstructionComplete === true,
    hints: {
      tier1: 'Contrast the assumed timeline with physical facts: Aldric was poisoned long before the blackout, during the broadcast.',
      tier2: 'Arrange the 5 timeline events in chronological order from the initial poisoning through the final discovery.',
      tier3: 'Place cards in exact order: 1. Nadia prepares poison -> 2. Spliced announcement plays -> 3. Aldric collapses -> 4. Hugo finds body -> 5. Hugo locks door.',
    },
  },

  // ==========================================
  // CHAPTER 5: final_confrontation
  // ==========================================
  {
    id: 'final_missing_splice',
    phase: 'final_confrontation',
    chamber: 'Main Hall',
    isSatisfied: (gs) => hasClue(gs, 'spliced_recording'),
    hints: {
      tier1: 'You need undeniable acoustic proof that the announcement was a recorded fabrication.',
      tier2: 'Examine the PA Speaker in the Main Hall to secure the Spliced Recording evidence.',
      tier3: 'Equip the Voice Prism [5] on the PA Speaker in the Main Hall to obtain the forged announcement proof.',
    },
  },
  {
    id: 'final_missing_vial',
    phase: 'final_confrontation',
    chamber: 'Library & Archive',
    isSatisfied: (gs) => hasClue(gs, 'nadia_vial'),
    hints: {
      tier1: 'You need physical proof connecting Nadia to the solvent used to poison the tea.',
      tier2: 'Search the potted plant in the Library & Archive for the discarded container.',
      tier3: 'Equip the Trace Light [3] on the Potted Plant in the Library to recover Nadia\'s chemical vial.',
    },
  },
  {
    id: 'final_missing_chime',
    phase: 'final_confrontation',
    chamber: 'Pendulum Room',
    isSatisfied: (gs) => hasClue(gs, 'thirteenth_chime_resonance'),
    hints: {
      tier1: 'You need the acoustic resonance that triggered the blackout and proves Project Echo\'s sabotaged frequency.',
      tier2: 'Analyze the room acoustics around the great pendulum in the Pendulum Room.',
      tier3: 'Equip the Echo Lens [2] on the Room Acoustics in the Pendulum Room to capture the Thirteenth Chime Resonance.',
    },
  },
  {
    id: 'final_accusation',
    phase: 'final_confrontation',
    chamber: 'Main Hall',
    isSatisfied: (gs) => gs.hasDialogueFlag('killer_identified') || (gs as any).state?.killerIdentified === true,
    hints: {
      tier1: 'All threads converge on the acoustician who altered Project Echo\'s calibrations and stole the library lantern.',
      tier2: 'Confront Nadia Thorn in the Main Hall, or initiate the Final Accusation board from your detective menu.',
      tier3: 'Accuse Nadia Thorn! Method: Poisoned Tea. False Alibi: Missing Lantern. Present: Spliced Recording, Solvent Vial, and Thirteenth Chime Resonance.',
    },
  },
];

const FALLBACK_INQUIRIES: Record<string, DynamicInquiry> = {
  investigation_1: {
    id: 'inv1_complete',
    phase: 'investigation_1',
    chamber: 'Main Hall',
    isSatisfied: () => false,
    hints: {
      tier1: 'Hugo has confessed to bolting the chamber door from inside. The locked room mystery has unraveled.',
      tier2: 'Assemble in the Main Hall to analyze how the true time of death was obscured.',
      tier3: 'Proceed to the Main Hall to trigger the midpoint revelation and break the timeline.',
    },
  },
  midpoint_reversal: {
    id: 'midpoint_complete',
    phase: 'midpoint_reversal',
    chamber: 'Main Hall',
    isSatisfied: () => false,
    hints: {
      tier1: 'The announcement was a forged playback! Aldric was dead before the power was cut.',
      tier2: 'The false timeline has collapsed. Begin re-investigating the observatory to uncover the real killer.',
      tier3: 'Move into Investigation Part II and uncover who possessed the means and motive during the broadcast.',
    },
  },
  investigation_2: {
    id: 'inv2_complete',
    phase: 'investigation_2',
    chamber: 'Exhibition Chamber',
    isSatisfied: () => false,
    hints: {
      tier1: 'All vital clues have been assembled. Head to the Exhibition Chamber to solve the timeline.',
      tier2: 'Interact with the Reconstruction board in the Exhibition Chamber to establish the true sequence of events.',
      tier3: 'Enter the Reconstruction phase to prove how the murder took place.',
    },
  },
  reconstruction: {
    id: 'recon_complete',
    phase: 'reconstruction',
    chamber: 'Main Hall',
    isSatisfied: () => false,
    hints: {
      tier1: 'The chronological sequence is verified! The truth of what occurred in the dark is established.',
      tier2: 'Head to the Main Hall to confront the true culprit with your reconstructed timeline.',
      tier3: 'Proceed to the Main Hall and confront Nadia Thorn with the physical evidence.',
    },
  },
  final_confrontation: {
    id: 'final_complete',
    phase: 'final_confrontation',
    chamber: 'Main Hall',
    isSatisfied: () => false,
    hints: {
      tier1: 'The case is concluded. Nadia Thorn has confessed to the murder of Professor Aldric Sable.',
      tier2: 'Watch the resolution unfold as the mystery of the Thirteenth Chime reaches its climax.',
      tier3: 'The true killer has been identified. Enjoy the ending.',
    },
  },
  // Pre-investigation phases: NO OUTDATED ALDRIC HINTS
  arrival: {
    id: 'prologue_arrival',
    phase: 'arrival',
    chamber: 'Exhibition Chamber',
    isSatisfied: () => false,
    hints: {
      tier1: 'A sudden tragedy has shaken Stellara Observatory. Enter the crime scene to begin your inquiry.',
      tier2: 'Head to the Exhibition Chamber where Professor Sable was discovered behind locked doors.',
      tier3: 'Proceed through the Main Hall into the Exhibition Chamber to initiate the murder investigation.',
    },
  },
  discovery: {
    id: 'prologue_discovery',
    phase: 'discovery',
    chamber: 'Exhibition Chamber',
    isSatisfied: () => false,
    hints: {
      tier1: 'A body has been discovered in the locked chamber. Secure the perimeter.',
      tier2: 'Examine the Exhibition Chamber where Aldric was found.',
      tier3: 'Enter the Exhibition Chamber to commence the formal investigation.',
    },
  },
  default: {
    id: 'general_investigation',
    phase: 'investigation_1',
    chamber: 'Exhibition Chamber',
    isSatisfied: () => false,
    hints: {
      tier1: 'Investigate the observatory, interview the suspects, and search for anomalies.',
      tier2: 'Search each chamber for physical residue, acoustic anomalies, or contradictory alibis.',
      tier3: 'Equip your detective gadgets [1-5] to scan points of interest and interrogate suspects.',
    },
  },
};

export class HintSystem {
  private currentInquiryId: string | null = null;
  private currentTier: HintTier = 1;

  constructor() {
    gameState.on('phaseChanged', (_data: { to: GamePhase }) => {
      this.resetLevel();
    });
    gameState.on('evidenceCollected', (evidenceId: string) => {
      this.onStateChanged('evidence', evidenceId);
    });
    gameState.on('flagSet', (flag: string) => {
      this.onStateChanged('flag', flag);
    });
    gameState.on('stateReset', () => {
      this.resetLevel();
    });
  }

  private onStateChanged(_type: string, _value: string): void {
    // If the currently tracked inquiry is now satisfied, reset so the next hint starts at Tier 1
    if (this.currentInquiryId) {
      const active = this.getActiveInquiry(gameState.getPhase());
      if (active.id !== this.currentInquiryId) {
        this.currentInquiryId = null;
        this.currentTier = 1;
      }
    }
  }

  public getInquiriesForPhase(phase: GamePhase): DynamicInquiry[] {
    return DYNAMIC_INQUIRIES.filter(inq => inq.phase === phase);
  }

  public getActiveInquiry(phase?: GamePhase): DynamicInquiry {
    const curPhase = phase || gameState.getPhase();
    const inquiries = this.getInquiriesForPhase(curPhase);
    const missing = inquiries.find(inq => !inq.isSatisfied(gameState));
    if (missing) return missing;

    return FALLBACK_INQUIRIES[curPhase] || FALLBACK_INQUIRIES['default'];
  }

  public getHint(advance: boolean = true): HintResponse {
    const currentPhase = gameState.getPhase();
    const activeInquiry = this.getActiveInquiry(currentPhase);

    if (this.currentInquiryId !== activeInquiry.id) {
      // Switched to a new objective: reset tier to 1
      this.currentInquiryId = activeInquiry.id;
      this.currentTier = 1;
    } else if (advance) {
      // Same objective and advancing: cycle 1 -> 2 -> 3 -> 1
      this.currentTier = ((this.currentTier % 3) + 1) as HintTier;
    }

    // Register hint usage in GameState
    gameState.useHint();

    const tierKey = `tier${this.currentTier}` as keyof ProgressiveHint;
    const hintText = activeInquiry.hints[tierKey];

    const response: HintResponse = {
      tier: this.currentTier,
      level: this.currentTier,
      text: hintText,
      chamber: activeInquiry.chamber,
      inquiryId: activeInquiry.id,
      objectiveId: activeInquiry.id,
      phase: currentPhase,
      hasMore: this.currentTier < 3,
    };

    // Emit EventBus event 'show-hint'
    EventBus.emit('show-hint', {
      level: response.level,
      tier: response.tier,
      text: response.text,
      objectiveId: response.objectiveId,
      chamber: response.chamber,
      category: response.chamber,
      phase: response.phase,
      hasMore: response.hasMore,
    });

    return response;
  }

  public cycleTier(): HintResponse {
    return this.getHint(true);
  }

  public getCurrentHint(): HintResponse {
    return this.getHint(false);
  }

  public resetLevel(): void {
    this.currentTier = 1;
    this.currentInquiryId = null;
    gameState.resetHintLevel();
  }

  public initialize(_phase?: GamePhase): void {
    this.resetLevel();
  }
}

export const hintSystem = new HintSystem();
