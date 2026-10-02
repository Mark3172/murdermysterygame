// Story phase manager - controls game flow and phase transitions
import { gameState, GamePhase } from './GameState';
import { EventBus } from '../engine/EventBus';

export interface PhaseConfig {
  id: GamePhase;
  name: string;
  objective: string;
  musicTrack: string;
  availableRooms: string[];
  cutsceneOnEnter?: string;
  gadgetsToUnlock?: string[];
  onEnter?: () => void;
  canExit: () => boolean;
}

const PHASE_CONFIGS: PhaseConfig[] = [
  {
    id: 'cold_open',
    name: 'Prologue',
    objective: '',
    musicTrack: 'menu',
    availableRooms: [],
    cutsceneOnEnter: 'cold_open',
    canExit: () => true,
  },
  {
    id: 'opening_title',
    name: 'Title',
    objective: '',
    musicTrack: 'menu',
    availableRooms: [],
    cutsceneOnEnter: 'opening_title',
    canExit: () => true,
  },
  {
    id: 'arrival',
    name: 'Arrival',
    objective: 'Investigate the observatory and gather clues.',
    musicTrack: 'exploration',
    availableRooms: ['main_hall', 'exhibition_chamber', 'clockwork_gallery', 'library_archive', 'pendulum_room', 'observation_deck'],
    gadgetsToUnlock: ['tranquility_focus', 'echo_lens', 'trace_light', 'micro_rover', 'voice_prism'],
    canExit: () => true,
  },
  {
    id: 'announcement',
    name: 'The Announcement',
    objective: 'Investigate the locked exhibition chamber.',
    musicTrack: 'suspense',
    availableRooms: ['main_hall', 'exhibition_chamber'],
    canExit: () => true,
  },
  {
    id: 'blackout',
    name: 'Blackout',
    objective: '',
    musicTrack: 'suspense',
    availableRooms: [],
    canExit: () => true,
  },
  {
    id: 'discovery',
    name: 'Discovery',
    objective: 'Investigate the locked exhibition chamber.',
    musicTrack: 'suspense',
    availableRooms: ['main_hall', 'exhibition_chamber'],
    cutsceneOnEnter: 'discovery_scene',
    gadgetsToUnlock: ['tranquility_focus', 'echo_lens', 'trace_light', 'micro_rover', 'voice_prism'],
    canExit: () => true,
  },
  {
    id: 'investigation_1',
    name: 'Investigation - Part I',
    objective: 'Examine the crime scene and question the suspects. How was the room locked?',
    musicTrack: 'exploration',
    availableRooms: ['main_hall', 'exhibition_chamber', 'clockwork_gallery', 'library_archive', 'pendulum_room', 'observation_deck'],
    gadgetsToUnlock: ['tranquility_focus', 'echo_lens', 'trace_light', 'micro_rover', 'voice_prism'],
    canExit: () => gameState.hasDialogueFlag('hugo_confessed') || (gameState.hasEvidence('connecting_door') && gameState.hasEvidence('hugo_fingerprints') && gameState.hasEvidence('rain_sensor_data')),
  },
  {
    id: 'midpoint_reversal',
    name: 'The Truth About Time',
    objective: '',
    musicTrack: 'suspense',
    availableRooms: [],
    cutsceneOnEnter: 'midpoint_reversal',
    onEnter: () => gameState.breakTimeline(),
    canExit: () => true,
  },
  {
    id: 'investigation_2',
    name: 'Investigation - Part II',
    objective: 'The timeline was wrong. Find the real killer. Who had access during the announcement?',
    musicTrack: 'deduction',
    availableRooms: ['main_hall', 'exhibition_chamber', 'clockwork_gallery', 'library_archive', 'pendulum_room', 'observation_deck'],
    canExit: () => gameState.getEvidenceCount() >= 6,
  },
  {
    id: 'reconstruction',
    name: 'Echo Reconstruction',
    objective: 'Use the Echo Reconstruction to piece together what really happened.',
    musicTrack: 'deduction',
    availableRooms: ['exhibition_chamber'],
    canExit: () => gameState.hasDialogueFlag('reconstruction_complete'),
  },
  {
    id: 'final_confrontation',
    name: 'Confrontation',
    objective: 'Prove who the killer is. Present your evidence.',
    musicTrack: 'suspense',
    availableRooms: ['main_hall'],
    canExit: () => gameState.hasDialogueFlag('killer_identified'),
  },
  {
    id: 'ending',
    name: 'Resolution',
    objective: '',
    musicTrack: 'resolution',
    availableRooms: [],
    cutsceneOnEnter: 'ending',
    canExit: () => true,
  },
  {
    id: 'credits',
    name: 'Credits',
    objective: '',
    musicTrack: 'credits',
    availableRooms: [],
    cutsceneOnEnter: 'credits_scene',
    canExit: () => true,
  },
  {
    id: 'post_credits',
    name: 'Epilogue',
    objective: '',
    musicTrack: 'menu',
    availableRooms: [],
    cutsceneOnEnter: 'post_credits',
    canExit: () => true,
  },
];

export class StoryPhaseManager {
  private currentConfig: PhaseConfig | null = null;

  constructor() {
    gameState.on('phaseChanged', (data: { from: GamePhase; to: GamePhase }) => {
      this.onPhaseEnter(data.to);
    });
  }

  getCurrentPhase(): PhaseConfig | null {
    return this.currentConfig;
  }

  getPhaseConfig(phase: GamePhase): PhaseConfig | undefined {
    return PHASE_CONFIGS.find(p => p.id === phase);
  }

  start(): void {
    this.onPhaseEnter(gameState.getPhase());
  }

  private onPhaseEnter(phase: GamePhase): void {
    const config = PHASE_CONFIGS.find(p => p.id === phase);
    if (!config) return;

    this.currentConfig = config;

    // Unlock gadgets
    if (config.gadgetsToUnlock) {
      config.gadgetsToUnlock.forEach(g => gameState.unlockGadget(g));
    }

    // Run custom enter logic
    if (config.onEnter) {
      config.onEnter();
    }

    // Reset hint level for new phase
    gameState.resetHintLevel();

    // Notify the game
    EventBus.emit('phase-entered', config);
  }

  advancePhase(): boolean {
    const current = this.currentConfig;
    if (!current) return false;

    if (!current.canExit()) return false;

    const currentIndex = PHASE_CONFIGS.findIndex(p => p.id === current.id);
    if (currentIndex < 0 || currentIndex >= PHASE_CONFIGS.length - 1) return false;

    const nextPhase = PHASE_CONFIGS[currentIndex + 1];
    gameState.setPhase(nextPhase.id);
    return true;
  }

  isRoomAvailable(roomId: string): boolean {
    if (!this.currentConfig) return false;
    return this.currentConfig.availableRooms.includes(roomId);
  }

  getObjective(): string {
    return this.currentConfig?.objective || '';
  }

  getMusicTrack(): string {
    return this.currentConfig?.musicTrack || 'exploration';
  }

  getCutsceneOnEnter(): string | undefined {
    return this.currentConfig?.cutsceneOnEnter;
  }

  // Check if the player should be auto-advanced based on evidence/flags
  checkAutoAdvance(): boolean {
    if (!this.currentConfig) return false;

    const phase = this.currentConfig.id;

    // Auto-advance when locked room is solved during investigation_1
    if (phase === 'investigation_1' && this.currentConfig.canExit()) {
      if (gameState.hasDialogueFlag('hugo_confessed')) {
        return true;
      }
    }

    // Auto-advance when enough evidence for investigation_2
    if (phase === 'investigation_2' && this.currentConfig.canExit()) {
      return true;
    }

    return false;
  }
}

export const storyManager = new StoryPhaseManager();
