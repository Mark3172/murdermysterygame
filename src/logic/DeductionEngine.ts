// Deduction engine - validates player logic against the true solution
import { gameState } from './GameState';

export interface DeductionResult {
  correct: boolean;
  feedback: string;
  contradictionAt?: string; // which event has the contradiction
}

export interface ReconstructionEvent {
  id: string;
  time: string;
  description: string;
  assignedEvidence: string[];
}

export interface Accusation {
  culprit: string;
  method: string;
  falseAlibi: string;
  evidence1: string;
  evidence2: string;
  evidence3: string;
}

// True solution constants
const TRUE_CULPRIT = 'nadia';
const TRUE_METHOD = 'poisoned_tea';
const TRUE_FALSE_ALIBI = 'missing_lantern';
const REQUIRED_EVIDENCE = ['spliced_recording', 'nadia_vial', 'thirteenth_chime_resonance'];

// Correct timeline order
const TRUE_TIMELINE_ORDER = [
  'aldric_records_announcement',
  'nadia_overhears_rehearsal',
  'nadia_splices_recording',
  'nadia_prepares_poison',
  'spliced_announcement_plays',
  'nadia_enters_chamber',
  'nadia_gives_poisoned_tea',
  'aldric_collapses',
  'nadia_exits_via_gallery',
  'nadia_triggers_blackout',
  'hugo_enters_via_gallery',
  'hugo_finds_body',
  'hugo_locks_door',
  'hugo_exits_via_gallery',
  'power_returns',
  'thirteenth_chime_rings',
  'body_discovered',
];

// Evidence that supports specific timeline events
const EVENT_EVIDENCE_MAP: Record<string, string[]> = {
  aldric_records_announcement: ['spliced_recording'],
  nadia_overhears_rehearsal: ['project_echo_notes'],
  nadia_splices_recording: ['spliced_recording'],
  nadia_prepares_poison: ['nadia_vial', 'poisoned_tea'],
  spliced_announcement_plays: ['spliced_recording'],
  nadia_enters_chamber: ['petra_recorder'],
  nadia_gives_poisoned_tea: ['poisoned_tea', 'petra_recorder'],
  aldric_collapses: ['poisoned_tea', 'petra_recorder'],
  nadia_exits_via_gallery: ['connecting_door'],
  nadia_triggers_blackout: ['missing_lantern'],
  hugo_enters_via_gallery: ['connecting_door', 'hugo_fingerprints'],
  hugo_finds_body: ['hugo_fingerprints'],
  hugo_locks_door: ['hugo_fingerprints'],
  hugo_exits_via_gallery: ['connecting_door'],
  power_returns: [],
  thirteenth_chime_rings: ['thirteenth_chime_resonance'],
  body_discovered: [],
};

export class DeductionEngine {
  // Validate a timeline reconstruction
  validateTimeline(proposedOrder: string[]): DeductionResult {
    if (proposedOrder.length !== TRUE_TIMELINE_ORDER.length) {
      return {
        correct: false,
        feedback: 'The timeline is incomplete. Some events are missing.',
      };
    }

    for (let i = 0; i < proposedOrder.length; i++) {
      if (proposedOrder[i] !== TRUE_TIMELINE_ORDER[i]) {
        const eventDesc = this.getEventDescription(proposedOrder[i]);
        const correctPosition = TRUE_TIMELINE_ORDER.indexOf(proposedOrder[i]);
        const direction = correctPosition > i ? 'later' : 'earlier';
        return {
          correct: false,
          feedback: `Something doesn't fit. "${eventDesc}" seems like it should have happened ${direction} than you've placed it.`,
          contradictionAt: proposedOrder[i],
        };
      }
    }

    return {
      correct: true,
      feedback: 'The timeline is correct! Every event falls into place.',
    };
  }

  // Validate evidence assignment to a reconstruction event
  validateEventEvidence(eventId: string, assignedEvidence: string[]): DeductionResult {
    const requiredEvidence = EVENT_EVIDENCE_MAP[eventId] || [];

    if (requiredEvidence.length === 0) {
      return {
        correct: true,
        feedback: 'This event doesn\'t require specific evidence to support it.',
      };
    }

    const hasRequired = requiredEvidence.some(e => assignedEvidence.includes(e));
    if (!hasRequired) {
      return {
        correct: false,
        feedback: `This event needs supporting evidence. Think about what physical proof connects to "${this.getEventDescription(eventId)}".`,
        contradictionAt: eventId,
      };
    }

    return {
      correct: true,
      feedback: 'The evidence supports this event.',
    };
  }

  // Compare two hypotheses - find where they diverge
  compareHypotheses(
    hypothesis1: ReconstructionEvent[],
    hypothesis2: ReconstructionEvent[]
  ): { divergencePoint: string; explanation: string } | null {
    for (let i = 0; i < Math.min(hypothesis1.length, hypothesis2.length); i++) {
      if (hypothesis1[i].id !== hypothesis2[i].id) {
        return {
          divergencePoint: hypothesis1[i].id,
          explanation: `The two versions diverge here. In one version, "${this.getEventDescription(hypothesis1[i].id)}" happens, but in the other, "${this.getEventDescription(hypothesis2[i].id)}" happens instead. Which is supported by the evidence?`,
        };
      }
    }
    return null;
  }

  // Validate the final accusation
  validateAccusation(accusation: Accusation): DeductionResult {
    const errors: string[] = [];

    if (accusation.culprit !== TRUE_CULPRIT) {
      const suspectName = this.getSuspectName(accusation.culprit);
      errors.push(
        `${suspectName} has a secret, but are they really the killer? Consider who had the means, motive, and opportunity during the critical window.`
      );
    }

    if (accusation.method !== TRUE_METHOD) {
      errors.push(
        'The method doesn\'t match the physical evidence. Re-examine what was found in the exhibition chamber.'
      );
    }

    if (accusation.falseAlibi !== TRUE_FALSE_ALIBI) {
      errors.push(
        'The alibi contradiction you selected doesn\'t directly expose the killer. Which alibi claim is physically impossible?'
      );
    }

    const presentedRequired = REQUIRED_EVIDENCE.filter(
      e => [accusation.evidence1, accusation.evidence2, accusation.evidence3].includes(e)
    );
    if (presentedRequired.length < 3) {
      const missing = REQUIRED_EVIDENCE.filter(
        e => ![accusation.evidence1, accusation.evidence2, accusation.evidence3].includes(e)
      );
      errors.push(
        `Your evidence is incomplete. You need proof that connects the suspect to: the recording manipulation, the poison, and the acoustic signature. You're missing: ${missing.map(e => this.getEvidenceName(e)).join(', ')}.`
      );
    }

    if (errors.length > 0) {
      return {
        correct: false,
        feedback: errors[0], // Show one error at a time for better pacing
      };
    }

    gameState.identifyKiller();
    return {
      correct: true,
      feedback: 'Everything fits. The truth is clear now.',
    };
  }

  // Check if player has enough evidence to attempt accusation
  canAttemptAccusation(): boolean {
    const collected = gameState.getCollectedEvidence();
    return (
      collected.length >= 10 &&
      gameState.hasEvidence('spliced_recording') &&
      gameState.hasEvidence('nadia_vial') &&
      gameState.hasEvidence('thirteenth_chime_resonance') &&
      gameState.hasEvidence('poisoned_tea') &&
      gameState.hasEvidence('connecting_door')
    );
  }

  // Check if locked room can be solved
  canSolveLockedRoom(): boolean {
    return (
      gameState.hasEvidence('connecting_door') &&
      gameState.hasEvidence('hugo_fingerprints') &&
      gameState.hasEvidence('rain_sensor_data')
    );
  }

  // Check if timeline can be broken
  canBreakTimeline(): boolean {
    return (
      gameState.hasEvidence('spliced_recording') &&
      gameState.hasEvidence('poisoned_tea')
    );
  }

  private getEventDescription(eventId: string): string {
    const descriptions: Record<string, string> = {
      aldric_records_announcement: 'Aldric records his announcement in the exhibition chamber',
      nadia_overhears_rehearsal: 'Nadia overhears Aldric rehearsing his confession',
      nadia_splices_recording: 'Nadia splices the recording to sound live',
      nadia_prepares_poison: 'Nadia prepares the poisoned tea',
      spliced_announcement_plays: 'The spliced announcement plays over the PA',
      nadia_enters_chamber: 'Someone enters the exhibition chamber',
      nadia_gives_poisoned_tea: 'The tea is offered to Aldric',
      aldric_collapses: 'Aldric collapses',
      nadia_exits_via_gallery: 'The killer exits through the connecting door',
      nadia_triggers_blackout: 'The blackout is triggered',
      hugo_enters_via_gallery: 'Hugo enters the chamber through the gallery',
      hugo_finds_body: 'Hugo discovers Aldric\'s body',
      hugo_locks_door: 'The exhibition chamber is locked from inside',
      hugo_exits_via_gallery: 'Hugo leaves through the connecting door',
      power_returns: 'Power is restored',
      thirteenth_chime_rings: 'The bell rings thirteen times',
      body_discovered: 'The group forces open the door and finds the body',
    };
    return descriptions[eventId] || eventId;
  }

  private getSuspectName(id: string): string {
    const names: Record<string, string> = {
      nadia: 'Nadia Thorn',
      hugo: 'Hugo Wren',
      petra: 'Petra Solano',
      felix: 'Felix Ashworth',
      iris: 'Iris Blackwell',
    };
    return names[id] || id;
  }

  private getEvidenceName(id: string): string {
    const names: Record<string, string> = {
      spliced_recording: 'the spliced recording analysis',
      nadia_vial: 'the vial residue from Nadia\'s coat',
      thirteenth_chime_resonance: 'the thirteenth chime acoustic analysis',
      poisoned_tea: 'the poisoned tea residue',
      connecting_door: 'the hidden connecting door',
    };
    return names[id] || id;
  }
}

export const deductionEngine = new DeductionEngine();
