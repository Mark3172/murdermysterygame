// Progressive hint system for THE THIRTEENTH CHIME
import { gameState, GamePhase } from './GameState';

interface HintSet {
  level1: string; // gentle nudge
  level2: string; // relevant clue
  level3: string; // reasoning help
}

const PHASE_HINTS: Record<string, HintSet[]> = {
  arrival: [
    {
      level1: 'Take a moment to look around the main hall. Talk to everyone you can.',
      level2: 'Professor Aldric is near the podium. He seems eager to speak with you.',
      level3: 'Approach Aldric and initiate conversation to learn about tonight\'s event.',
    },
  ],
  investigation_1: [
    {
      level1: 'The locked room is the central mystery right now. How could someone lock a room from inside and leave?',
      level2: 'The clockwork gallery is full of large mechanical displays. Some of them might be hiding something behind them.',
      level3: 'Use the Micro Rover in the clockwork gallery to explore the narrow gap behind the large gear display. There might be a hidden passage.',
    },
    {
      level1: 'Hugo claims he was on the observation deck during the blackout. Can you verify that?',
      level2: 'The observation deck has weather monitoring instruments. One of them tracks if anyone was present.',
      level3: 'Check the rain sensor data on the observation deck. It records weight/pressure changes, which means it can confirm or deny Hugo\'s presence.',
    },
    {
      level1: 'Examine the exhibition chamber door carefully. Who touched it last?',
      level2: 'The Trace Light can reveal fingerprints that aren\'t visible to the naked eye.',
      level3: 'Use the Trace Light on the inside bolt of the exhibition chamber door. The fingerprints there will tell you who locked it.',
    },
    {
      level1: 'Once you\'ve found the hidden door, broken Hugo\'s alibi, and found his fingerprints, confront him.',
      level2: 'Hugo locked the room, but that doesn\'t mean he\'s the killer. Ask him why he would lock it.',
      level3: 'Present all three pieces of evidence to Hugo: the connecting door, his fingerprints, and the rain sensor data. He\'ll confess to staging the locked room.',
    },
  ],
  midpoint_reversal: [
    {
      level1: 'The announcement everyone heard — was it really live?',
      level2: 'Use the Voice Prism on the PA system recording in the exhibition chamber.',
      level3: 'The Voice Prism will reveal editing artifacts in the recording. The announcement was pre-recorded and spliced to sound live.',
    },
  ],
  investigation_2: [
    {
      level1: 'If the announcement was pre-recorded, Aldric could have been killed while everyone thought he was speaking. Who was unaccounted for during that time?',
      level2: 'Petra\'s hidden recorder in the exhibition chamber captured sounds during the announcement. Listen carefully to what it recorded.',
      level3: 'Use the Voice Prism to analyze the whispered voice on Petra\'s recording. Compare it with each suspect\'s voice patterns.',
    },
    {
      level1: 'What killed Aldric? Look more carefully at the tea setup in the exhibition chamber.',
      level2: 'The Trace Light reveals unusual residue in the thermos. It\'s not ordinary tea.',
      level3: 'The residue matches clockwork lubricant solvent — toxic when ingested. Check if anyone else has traces of this substance.',
    },
    {
      level1: 'Why did the bell ring thirteen times instead of twelve?',
      level2: 'Use the Echo Lens in the pendulum room to analyze the sound of each chime.',
      level3: 'The thirteenth chime has a different resonance — it matches the pendulum room mechanism, not the bell tower. The frequency is Nadia\'s calibration tone from Project Echo.',
    },
    {
      level1: 'Check each suspect\'s belongings for traces of the poison.',
      level2: 'Use the Trace Light on Nadia\'s coat, particularly the pockets.',
      level3: 'Nadia\'s coat pocket has vial residue matching the clockwork solvent. This places the poison directly on the acoustician.',
    },
  ],
  reconstruction: [
    {
      level1: 'Build two timelines: what everyone assumed happened, and what actually happened.',
      level2: 'The key difference is when Aldric died. In the false timeline, he dies after the blackout. In the true timeline, he dies during the announcement.',
      level3: 'Place events in this order: Aldric records → Nadia splices → Poison prepared → Announcement plays → Nadia enters → Tea given → Aldric dies → Nadia exits → Blackout triggered → Hugo enters → Hugo locks → Hugo exits → Power returns → 13th chime → Body found.',
    },
  ],
  final_confrontation: [
    {
      level1: 'You need three things: who did it, how, and proof that their alibi is false.',
      level2: 'The killer is an expert in sound. The method involves what was found in the thermos. The alibi involves an object that was already moved.',
      level3: 'Accuse Nadia Thorn. Method: poisoned tea. False alibi: the missing lantern (she claimed to be looking for it, but it was already taken by Felix). Present: spliced recording analysis, vial residue from her coat, and the thirteenth chime resonance matching her Project Echo frequency.',
    },
  ],
};

export class HintSystem {
  private currentHints: HintSet[] = [];
  private currentHintIndex: number = 0;
  private currentLevel: number = 0;

  constructor() {
    gameState.on('phaseChanged', (data: { to: GamePhase }) => {
      this.updateHints(data.to);
    });
    gameState.on('evidenceCollected', () => {
      this.advanceHintIndex();
    });
    gameState.on('flagSet', () => {
      this.advanceHintIndex();
    });
  }

  private updateHints(phase: GamePhase): void {
    this.currentHints = PHASE_HINTS[phase] || [];
    this.currentHintIndex = 0;
    this.currentLevel = 0;
  }

  private advanceHintIndex(): void {
    // Move to next hint set if current objective seems met
    if (this.currentHintIndex < this.currentHints.length - 1) {
      this.currentHintIndex++;
      this.currentLevel = 0;
    }
  }

  getHint(): { text: string; level: number; hasMore: boolean } | null {
    if (this.currentHints.length === 0) {
      return { text: 'Explore the area and talk to everyone you can.', level: 1, hasMore: false };
    }

    const hintSet = this.currentHints[this.currentHintIndex];
    if (!hintSet) {
      return { text: 'You\'re on the right track. Keep investigating.', level: 1, hasMore: false };
    }

    this.currentLevel++;
    if (this.currentLevel > 3) this.currentLevel = 3;

    const levelKey = `level${this.currentLevel}` as keyof HintSet;
    return {
      text: hintSet[levelKey],
      level: this.currentLevel,
      hasMore: this.currentLevel < 3,
    };
  }

  resetLevel(): void {
    this.currentLevel = 0;
  }

  initialize(phase: GamePhase): void {
    this.updateHints(phase);
  }
}

export const hintSystem = new HintSystem();
