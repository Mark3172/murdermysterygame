export interface SaveData {
    version: number;
    timestamp: number;
    gamePhase: string; // story phase ID
    currentRoom: string;
    playerPosition: { x: number; y: number };
    evidenceCollected: string[]; // evidence IDs
    dialogueFlags: Record<string, boolean>;
    cutscenesSeen: string[];
    suspectInterviewed: Record<string, boolean>;
    gadgetsUnlocked: string[];
    hintsUsed: number;
    notebookEntries: string[];
    reconstructionComplete: boolean;
}

export class SaveManager {
    private static readonly SAVE_KEY = 'THIRTEENTH_CHIME_SAVE_V1';
    private static readonly CURRENT_VERSION = 1;

    public static save(data: Partial<SaveData>): void {
        try {
            const currentSave = this.load() || this.getDefault();
            const newSave = { ...currentSave, ...data, timestamp: Date.now(), version: this.CURRENT_VERSION };
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(newSave));
        } catch (e) {
            console.error("Failed to save game data", e);
        }
    }

    public static load(): SaveData | null {
        try {
            const item = localStorage.getItem(this.SAVE_KEY);
            if (!item) return null;
            
            const data = JSON.parse(item);
            
            // Migration logic could go here
            if (data.version && data.version < this.CURRENT_VERSION) {
                // migrate data
            }
            
            return data as SaveData;
        } catch (e) {
            console.error("Failed to load game data or data corrupt", e);
            return null; // auto-recovery by returning null
        }
    }

    public static hasSave(): boolean {
        return this.load() !== null;
    }

    public static deleteSave(): void {
        try {
            localStorage.removeItem(this.SAVE_KEY);
        } catch (e) {
            console.error("Failed to delete save", e);
        }
    }

    public static getDefault(): SaveData {
        return {
            version: this.CURRENT_VERSION,
            timestamp: Date.now(),
            gamePhase: 'intro',
            currentRoom: 'foyer',
            playerPosition: { x: 320, y: 180 },
            evidenceCollected: [],
            dialogueFlags: {},
            cutscenesSeen: [],
            suspectInterviewed: {},
            gadgetsUnlocked: [],
            hintsUsed: 0,
            notebookEntries: [],
            reconstructionComplete: false
        };
    }
}
