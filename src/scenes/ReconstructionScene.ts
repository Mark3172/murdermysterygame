import { Scene } from 'phaser';
import { EventBus } from '../engine/EventBus';
import { gameState } from '../logic/GameState';
import { storyManager } from '../logic/StoryPhaseManager';
import { deductionEngine } from '../logic/DeductionEngine';
import { AudioManager } from '../engine/AudioManager';
import { SceneTransition } from '../engine/SceneTransition';
import { timeline } from '../data/timeline';
import { evidence as evidenceData } from '../data/evidence';

export class ReconstructionScene extends Scene {
    private hypothesis: 'A' | 'B' = 'B';
    private timelineContainer!: Phaser.GameObjects.Container;
    private eventCards: Phaser.GameObjects.Container[] = [];
    private placedEvents: (string | null)[] = [null, null, null, null, null];
    private ghostSprites: Phaser.GameObjects.Graphics[] = [];
    private selectedEventId: string | null = null;
    
    constructor() {
        super('ReconstructionScene');
    }

    create() {
        this.add.graphics().fillStyle(0x0a0a1a, 1).fillRect(0, 0, 640, 360);
        
        // Blueprint grid
        const grid = this.add.graphics();
        grid.lineStyle(1, 0x1a2a4a, 0.5);
        for(let i=0; i<640; i+=20) {
            grid.moveTo(i, 0).lineTo(i, 360);
        }
        for(let i=0; i<360; i+=20) {
            grid.moveTo(0, i).lineTo(640, i);
        }
        grid.strokePath();

        // Chamber layout
        const chamber = this.add.graphics();
        chamber.lineStyle(2, 0x2a4a7a, 0.8);
        chamber.strokeRect(100, 50, 440, 180);
        
        // Tabs
        const tabA = this.add.text(20, 20, 'Hypothesis A (False)', { color: '#666', fontSize: '14px' })
            .setInteractive()
            .on('pointerdown', () => this.switchHypothesis('A'));
        const tabB = this.add.text(200, 20, 'Hypothesis B (True)', { color: '#fff', fontSize: '14px' })
            .setInteractive()
            .on('pointerdown', () => this.switchHypothesis('B'));

        // Timeline bar
        this.timelineContainer = this.add.container(0, 280);
        const bar = this.add.graphics().fillStyle(0x222233).fillRect(20, 0, 600, 60);
        this.timelineContainer.add(bar);

        // Slots
        for(let i=0; i<5; i++) {
            const slot = this.add.graphics().lineStyle(1, 0x555577).strokeRect(30 + i*115, 5, 110, 50);
            this.timelineContainer.add(slot);
            
            const slotZone = this.add.zone(30 + i*115 + 55, 30, 110, 50).setInteractive();
            slotZone.on('pointerdown', () => this.placeEventInSlot(i));
            this.timelineContainer.add(slotZone);
        }

        this.createEventCards();
        
        const clearBtn = this.add.text(560, 20, 'CLEAR', { color: '#ff5555', fontSize: '12px' })
            .setInteractive()
            .on('pointerdown', () => this.clearTimeline());
            
        const backBtn = this.add.text(560, 40, 'BACK', { color: '#aaa', fontSize: '12px' })
            .setInteractive()
            .on('pointerdown', () => this.exitScene());
    }

    private switchHypothesis(type: 'A' | 'B') {
        this.hypothesis = type;
        this.clearTimeline();
        // Visual updates could be added here
    }

    private createEventCards() {
        let x = 30;
        let y = 240;
        Object.values(timeline).forEach(evt => {
            const card = this.add.container(x, y);
            const bg = this.add.graphics().fillStyle(0x334466).fillRect(0, 0, 100, 30);
            const txt = this.add.text(5, 5, evt.description.substring(0, 15) + '...', { fontSize: '10px' });
            card.add([bg, txt]);
            
            const zone = this.add.zone(50, 15, 100, 30).setInteractive();
            zone.on('pointerdown', () => {
                this.selectedEventId = evt.id;
                // Highlight logic
                this.eventCards.forEach(c => (c.list[0] as Phaser.GameObjects.Graphics).clear().fillStyle(0x334466).fillRect(0, 0, 100, 30));
                bg.clear().fillStyle(0x5577aa).fillRect(0, 0, 100, 30);
            });
            card.add(zone);
            
            this.eventCards.push(card);
            
            x += 110;
            if (x > 500) {
                x = 30;
                y += 35;
            }
        });
    }

    private placeEventInSlot(slotIndex: number) {
        if (!this.selectedEventId) return;
        
        this.placedEvents[slotIndex] = this.selectedEventId;
        const evt = Object.values(timeline).find(e => e.id === this.selectedEventId);
        
        // Render placed event
        const cardX = 30 + slotIndex * 115 + 5;
        const cardY = 10;
        const display = this.add.text(cardX, cardY, evt?.description.substring(0, 15) || '', { fontSize: '10px' });
        this.timelineContainer.add(display);
        
        this.selectedEventId = null;
        
        this.validateTimeline();
    }
    
    private clearTimeline() {
        this.placedEvents = [null, null, null, null, null];
        this.scene.restart();
    }

    private validateTimeline() {
        if (this.placedEvents.every(e => e !== null)) {
            // validate
            const correct = this.placedEvents.every((e, i) => {
                const evt = Object.values(timeline).find(x => x.id === e);
                // simplified logic for now
                return evt?.isCorrectPosition; 
            });
            
            if (correct && this.hypothesis === 'B') {
                AudioManager.getInstance().playSFX('success');
                gameState.setDialogueFlag('reconstruction_complete');
                setTimeout(() => this.exitScene(), 2000);
            } else {
                AudioManager.getInstance().playSFX('error');
            }
        }
    }

    private exitScene() {
        SceneTransition.fadeToBlack(this, 500, () => {
            this.scene.start(gameState.hasDialogueFlag('reconstruction_complete') ? 'DeductionScene' : 'ExplorationScene');
        });
    }
}
