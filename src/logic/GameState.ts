// Central game state manager for THE THIRTEENTH CHIME

export type GamePhase =
  | 'cold_open'
  | 'opening_title'
  | 'arrival'
  | 'announcement'
  | 'blackout'
  | 'discovery'
  | 'investigation_1'
  | 'midpoint_reversal'
  | 'investigation_2'
  | 'reconstruction'
  | 'final_confrontation'
  | 'ending'
  | 'credits'
  | 'post_credits'
  | 'complete';

export interface GameStateData {
  phase: GamePhase;
  currentRoom: string;
  playerX: number;
  playerY: number;
  evidenceCollected: Set<string>;
  dialogueFlags: Set<string>;
  cutscenesSeen: Set<string>;
  suspectInterviewed: Set<string>;
  gadgetsUnlocked: Set<string>;
  hintsUsed: number;
  currentHintLevel: number;
  notebookEntries: string[];
  reconstructionComplete: boolean;
  lockedRoomSolved: boolean;
  timelineBroken: boolean;
  killerIdentified: boolean;
  optionalClueFound: boolean;
  sceneGalleryUnlocked: string[];
}

class GameStateManager {
  private state: GameStateData;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  constructor() {
    this.state = this.getDefaultState();
  }

  getDefaultState(): GameStateData {
    return {
      phase: 'cold_open',
      currentRoom: 'main_hall',
      playerX: 320,
      playerY: 200,
      evidenceCollected: new Set(),
      dialogueFlags: new Set(),
      cutscenesSeen: new Set(),
      suspectInterviewed: new Set(),
      gadgetsUnlocked: new Set(['tranquility_focus', 'echo_lens', 'trace_light', 'micro_rover', 'voice_prism']),
      hintsUsed: 0,
      currentHintLevel: 0,
      notebookEntries: [],
      reconstructionComplete: false,
      lockedRoomSolved: false,
      timelineBroken: false,
      killerIdentified: false,
      optionalClueFound: false,
      sceneGalleryUnlocked: [],
    };
  }

  reset(): void {
    this.state = this.getDefaultState();
    this.emit('stateReset', null);
  }

  // Phase management
  getPhase(): GamePhase {
    return this.state.phase;
  }

  setPhase(phase: GamePhase): void {
    const oldPhase = this.state.phase;
    this.state.phase = phase;
    this.emit('phaseChanged', { from: oldPhase, to: phase });
  }

  canAdvancePhase(): boolean {
    switch (this.state.phase) {
      case 'cold_open': return true;
      case 'opening_title': return true;
      case 'arrival': return this.state.dialogueFlags.has('aldric_greeted');
      case 'announcement': return true;
      case 'blackout': return true;
      case 'discovery': return this.state.cutscenesSeen.has('discovery_scene');
      case 'investigation_1':
        return this.state.evidenceCollected.size >= 6 && this.state.lockedRoomSolved;
      case 'midpoint_reversal': return this.state.timelineBroken;
      case 'investigation_2':
        return this.state.evidenceCollected.size >= 10;
      case 'reconstruction': return this.state.reconstructionComplete;
      case 'final_confrontation': return this.state.killerIdentified;
      case 'ending': return true;
      case 'credits': return true;
      case 'post_credits': return true;
      default: return false;
    }
  }

  // Room management
  getCurrentRoom(): string {
    return this.state.currentRoom;
  }

  setCurrentRoom(roomId: string): void {
    this.state.currentRoom = roomId;
    this.emit('roomChanged', roomId);
  }

  getPlayerPosition(): { x: number; y: number } {
    return { x: this.state.playerX, y: this.state.playerY };
  }

  setPlayerPosition(x: number, y: number): void {
    this.state.playerX = x;
    this.state.playerY = y;
  }

  // Evidence
  collectEvidence(evidenceId: string): void {
    if (!this.state.evidenceCollected.has(evidenceId)) {
      this.state.evidenceCollected.add(evidenceId);
      this.state.notebookEntries.push(`Found: ${evidenceId}`);
      this.emit('evidenceCollected', evidenceId);

      if (evidenceId === 'project_echo_notes_yuki') {
        this.state.optionalClueFound = true;
        this.emit('optionalClueFound', null);
      }
    }
  }

  hasEvidence(evidenceId: string): boolean {
    return this.state.evidenceCollected.has(evidenceId);
  }

  getCollectedEvidence(): string[] {
    return Array.from(this.state.evidenceCollected);
  }

  getEvidenceCount(): number {
    return this.state.evidenceCollected.size;
  }

  // Dialogue flags
  setDialogueFlag(flag: string): void {
    this.state.dialogueFlags.add(flag);
    this.emit('flagSet', flag);
  }

  hasDialogueFlag(flag: string): boolean {
    return this.state.dialogueFlags.has(flag);
  }

  // Cutscenes
  markCutsceneSeen(cutsceneId: string): void {
    this.state.cutscenesSeen.add(cutsceneId);
    if (!this.state.sceneGalleryUnlocked.includes(cutsceneId)) {
      this.state.sceneGalleryUnlocked.push(cutsceneId);
    }
    this.emit('cutsceneSeen', cutsceneId);
  }

  hasCutsceneSeen(cutsceneId: string): boolean {
    return this.state.cutscenesSeen.has(cutsceneId);
  }

  // Suspects
  markSuspectInterviewed(suspectId: string): void {
    this.state.suspectInterviewed.add(suspectId);
    this.emit('suspectInterviewed', suspectId);
  }

  isSuspectInterviewed(suspectId: string): boolean {
    return this.state.suspectInterviewed.has(suspectId);
  }

  // Gadgets
  unlockGadget(gadgetId: string): void {
    this.state.gadgetsUnlocked.add(gadgetId);
    this.emit('gadgetUnlocked', gadgetId);
  }

  hasGadget(gadgetId: string): boolean {
    return this.state.gadgetsUnlocked.has(gadgetId);
  }

  getUnlockedGadgets(): string[] {
    return Array.from(this.state.gadgetsUnlocked);
  }

  // Hints
  useHint(): { level: number; available: boolean } {
    if (this.state.currentHintLevel >= 3) {
      return { level: 3, available: false };
    }
    this.state.currentHintLevel++;
    this.state.hintsUsed++;
    return { level: this.state.currentHintLevel, available: this.state.currentHintLevel < 3 };
  }

  resetHintLevel(): void {
    this.state.currentHintLevel = 0;
  }

  // Investigation milestones
  solveLockedRoom(): void {
    this.state.lockedRoomSolved = true;
    this.emit('lockedRoomSolved', null);
  }

  breakTimeline(): void {
    this.state.timelineBroken = true;
    this.emit('timelineBroken', null);
  }

  completeReconstruction(): void {
    this.state.reconstructionComplete = true;
    this.emit('reconstructionComplete', null);
  }

  identifyKiller(): void {
    this.state.killerIdentified = true;
    this.emit('killerIdentified', null);
  }

  // Serialization for save/load
  serialize(): any {
    return {
      phase: this.state.phase,
      currentRoom: this.state.currentRoom,
      playerX: this.state.playerX,
      playerY: this.state.playerY,
      evidenceCollected: Array.from(this.state.evidenceCollected),
      dialogueFlags: Array.from(this.state.dialogueFlags),
      cutscenesSeen: Array.from(this.state.cutscenesSeen),
      suspectInterviewed: Array.from(this.state.suspectInterviewed),
      gadgetsUnlocked: Array.from(this.state.gadgetsUnlocked),
      hintsUsed: this.state.hintsUsed,
      currentHintLevel: this.state.currentHintLevel,
      notebookEntries: [...this.state.notebookEntries],
      reconstructionComplete: this.state.reconstructionComplete,
      lockedRoomSolved: this.state.lockedRoomSolved,
      timelineBroken: this.state.timelineBroken,
      killerIdentified: this.state.killerIdentified,
      optionalClueFound: this.state.optionalClueFound,
      sceneGalleryUnlocked: [...this.state.sceneGalleryUnlocked],
    };
  }

  deserialize(data: any): void {
    const savedPhase = data.phase || 'investigation_1';
    const effectivePhase = ['cold_open', 'opening_title', 'arrival', 'announcement', 'blackout', 'discovery'].includes(savedPhase) ? 'investigation_1' : savedPhase;
    const existingGadgets = Array.isArray(data.gadgetsUnlocked) ? data.gadgetsUnlocked : [];
    const allGadgets = Array.from(new Set([...existingGadgets, 'tranquility_focus', 'echo_lens', 'trace_light', 'micro_rover', 'voice_prism']));

    this.state = {
      phase: effectivePhase,
      currentRoom: data.currentRoom || 'main_hall',
      playerX: data.playerX || 320,
      playerY: data.playerY || 200,
      evidenceCollected: new Set(data.evidenceCollected || []),
      dialogueFlags: new Set(data.dialogueFlags || []),
      cutscenesSeen: new Set(data.cutscenesSeen || []),
      suspectInterviewed: new Set(data.suspectInterviewed || []),
      gadgetsUnlocked: new Set(allGadgets),
      hintsUsed: data.hintsUsed || 0,
      currentHintLevel: data.currentHintLevel || 0,
      notebookEntries: data.notebookEntries || [],
      reconstructionComplete: data.reconstructionComplete || false,
      lockedRoomSolved: data.lockedRoomSolved || false,
      timelineBroken: data.timelineBroken || false,
      killerIdentified: data.killerIdentified || false,
      optionalClueFound: data.optionalClueFound || false,
      sceneGalleryUnlocked: data.sceneGalleryUnlocked || [],
    };
    this.emit('stateLoaded', null);
  }

  // Event system
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const cbs = this.listeners.get(event);
    if (cbs) {
      const idx = cbs.indexOf(callback);
      if (idx >= 0) cbs.splice(idx, 1);
    }
  }

  private emit(event: string, data: any): void {
    const cbs = this.listeners.get(event);
    if (cbs) {
      cbs.forEach(cb => cb(data));
    }
  }
}

export const gameState = new GameStateManager();
