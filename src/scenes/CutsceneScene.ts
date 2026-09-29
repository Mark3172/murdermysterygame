import Phaser from 'phaser';
import { gameState } from '../logic/GameState';

export class CutsceneScene extends Phaser.Scene {
    private cutsceneId: string = '';
    private panels: any[] = [];
    private currentPanelIndex: number = 0;
    private isTransitioning: boolean = false;
    
    // UI elements
    private panelContainer!: Phaser.GameObjects.Container;
    private skipText!: Phaser.GameObjects.Text;

    constructor() {
        super('CutsceneScene');
    }

    init(data: any) {
        this.cutsceneId = data.cutsceneId || 'cold_open';
        this.currentPanelIndex = 0;
        this.isTransitioning = false;
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        
        // Mock data fetching since cutscene data module isn't defined explicitly
        this.panels = this.getMockCutsceneData(this.cutsceneId);

        this.panelContainer = this.add.container(0, 0);

        this.input.keyboard?.on('keydown-SPACE', this.advancePanel, this);
        this.input.on('pointerdown', this.advancePanel, this);
        this.input.keyboard?.on('keydown-ESC', this.skipCutscene, this);

        this.skipText = this.add.text(620, 20, 'Skip [ESC]', {
            fontFamily: 'sans-serif',
            fontSize: '12px',
            color: '#aaaaaa'
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
        this.skipText.on('pointerdown', this.skipCutscene, this);

        this.showCurrentPanel();
    }

    private getMockCutsceneData(id: string) {
        // Fallback for cutscenes
        return [
            { type: 'text', content: 'In the dead of night...', duration: 2000 },
            { type: 'image', shape: 'rect', color: 0x330000, duration: 1500 },
            { type: 'dialogue', speaker: '???', content: 'A terrible crime was committed.', duration: 2000 }
        ];
    }

    private advancePanel() {
        if (this.isTransitioning) return;
        this.currentPanelIndex++;
        
        if (this.currentPanelIndex >= this.panels.length) {
            this.finishCutscene();
        } else {
            this.showCurrentPanel();
        }
    }

    private skipCutscene() {
        if (this.isTransitioning) return;
        this.finishCutscene();
    }

    private showCurrentPanel() {
        this.isTransitioning = true;
        
        // Clear previous panel content
        this.panelContainer.removeAll(true);
        
        const panel = this.panels[this.currentPanelIndex];
        const type = panel.type || 'text';
        
        // Build new panel visuals
        if (type === 'image') {
            const graphics = this.add.graphics();
            graphics.fillStyle(panel.color || 0x222222, 1);
            graphics.fillRect(100, 40, 440, 280);
            this.panelContainer.add(graphics);
        } else if (type === 'text') {
            const txt = this.add.text(320, 180, panel.content || '', {
                fontFamily: 'serif',
                fontSize: '24px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: 500 }
            }).setOrigin(0.5);
            this.panelContainer.add(txt);
        } else if (type === 'dialogue') {
            const speakerTxt = this.add.text(120, 250, panel.speaker || 'Unknown', {
                fontFamily: 'sans-serif',
                fontSize: '16px',
                color: '#d4af37'
            });
            const contentTxt = this.add.text(120, 275, panel.content || '', {
                fontFamily: 'sans-serif',
                fontSize: '16px',
                color: '#ffffff',
                wordWrap: { width: 400 }
            });
            this.panelContainer.add([speakerTxt, contentTxt]);
        } else if (type === 'transition') {
            // Screen flash or something
            this.cameras.main.flash(500, 255, 255, 255);
        }

        // Fade in panel
        this.panelContainer.setAlpha(0);
        this.tweens.add({
            targets: this.panelContainer,
            alpha: 1,
            duration: 500,
            onComplete: () => {
                this.isTransitioning = false;
            }
        });

        // Autoadvance if no input is expected (or based on duration)
        if (panel.duration && panel.duration > 0) {
            this.time.delayedCall(panel.duration, () => {
                if (this.currentPanelIndex < this.panels.length && !this.isTransitioning) {
                    // Check if user already advanced
                }
            });
        }
    }

    private finishCutscene() {
        this.isTransitioning = true;

        // Determine next scene
        let nextScene = 'ExplorationScene';
        let sceneData = {};

        if (this.cutsceneId === 'cold_open') {
            nextScene = 'CutsceneScene';
            sceneData = { cutsceneId: 'opening_title' };
        } else if (this.cutsceneId === 'opening_title') {
            nextScene = 'ExplorationScene';
            sceneData = { phase: 'arrival' };
        } else if (this.cutsceneId === 'ending') {
            nextScene = 'CreditsScene';
        } else if (this.cutsceneId === 'credits_scene') {
            nextScene = 'CutsceneScene';
            sceneData = { cutsceneId: 'post_credits' };
        } else if (this.cutsceneId === 'post_credits') {
            nextScene = 'TitleScene';
        }

        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(nextScene, sceneData);
        });
    }
}
