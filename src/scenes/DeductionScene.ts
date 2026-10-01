import Phaser from 'phaser';
import { gameState } from '../logic/GameState';
import { deductionEngine, Accusation } from '../logic/DeductionEngine';
import { AudioManager } from '../engine/AudioManager';
import { suspects } from '../data/suspects';
import { evidence as evidenceData } from '../data/evidence';
import { storyManager } from '../logic/StoryPhaseManager';

export class DeductionScene extends Phaser.Scene {
    private currentAccusation: Partial<Accusation> = {};
    private uiContainer!: Phaser.GameObjects.Container;
    private feedbackText!: Phaser.GameObjects.Text;
    private attempts: number = 0;
    
    // UI elements to update selection state
    private suspectButtons: Phaser.GameObjects.Container[] = [];
    private methodButtons: Phaser.GameObjects.Container[] = [];
    private alibiButtons: Phaser.GameObjects.Container[] = [];
    private evidenceSlots: Phaser.GameObjects.Container[] = [];
    private evidencePickerContainer?: Phaser.GameObjects.Container;
    
    constructor() {
        super({ key: 'DeductionScene' });
    }

    create() {
        const { width, height } = this.scale;
        
        // 1. Dark atmospheric background with grid pattern
        this.cameras.main.setBackgroundColor('#050510');
        const grid = this.add.grid(width/2, height/2, width, height, 32, 32, 0x050510, 1, 0x222233, 0.5);
        
        // 2. Title 'FINAL ACCUSATION'
        this.add.text(width / 2, 20, 'FINAL ACCUSATION', {
            fontSize: '24px',
            fontFamily: 'Courier',
            color: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.uiContainer = this.add.container(0, 0);

        this.createPanels();
        this.createSupportingEvidence();
        this.createPresentButton();
        this.createBackButton();

        this.feedbackText = this.add.text(width / 2, height - 20, '', {
            fontSize: '14px',
            fontFamily: 'Courier',
            color: '#ff0000',
            align: 'center',
            wordWrap: { width: 600 }
        }).setOrigin(0.5);

        this.events.on('wake', this.onWake, this);
        this.onWake();
    }

    private onWake() {
        this.currentAccusation = {};
        this.attempts = 0;
        this.feedbackText.setText('');
        this.refreshPanels();
        this.evidenceSlots.forEach((slot, i) => {
            const txt = slot.list[1] as Phaser.GameObjects.Text;
            txt.setText('Select Evidence');
            txt.setColor('#888888');
        });
    }

    private createPanels() {
        const pY = 50;
        const pW = 200;
        const pH = 180;
        
        // CULPRIT PANEL
        this.createPanelBackground(10, pY, pW, pH, 'CULPRIT');
        const suspectKeys = Object.keys(suspects);
        suspectKeys.forEach((key, i) => {
            const s = suspects[key];
            const btn = this.createButton(20, pY + 25 + i * 28, pW - 20, 24, s.name, () => this.selectField('culprit', key));
            btn.setData('key', key);
            this.suspectButtons.push(btn);
        });

        // METHOD PANEL
        this.createPanelBackground(220, pY, pW, pH, 'METHOD');
        const collectedIds = gameState.getCollectedEvidence();
        const collectedEvidence = collectedIds.map(id => evidenceData[id]).filter(e => e);
        
        const methodOptions = collectedEvidence.filter(e => e.category === 'physical' || e.category === 'acoustic');
        methodOptions.forEach((e, i) => {
            const btn = this.createButton(230, pY + 25 + i * 28, pW - 20, 24, e.name, () => this.selectField('method', e.id));
            btn.setData('key', e.id);
            this.methodButtons.push(btn);
        });

        // FALSE ALIBI PANEL
        this.createPanelBackground(430, pY, pW, pH, 'FALSE ALIBI');
        collectedEvidence.forEach((e, i) => {
            if (i > 5) return; // Limit to fit panel roughly, though a real scrollable list would be better
            const btn = this.createButton(440, pY + 25 + i * 28, pW - 20, 24, e.name, () => this.selectField('falseAlibi', e.id));
            btn.setData('key', e.id);
            this.alibiButtons.push(btn);
        });
    }

    private createSupportingEvidence() {
        const { width } = this.scale;
        
        this.add.text(width/2, 245, 'SUPPORTING EVIDENCE', {
            fontSize: '16px',
            fontFamily: 'Courier',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        for (let i = 0; i < 3; i++) {
            const slotX = width/2 - 150 + i * 150;
            const slotY = 275;
            const slot = this.add.container(slotX, slotY);
            
            const bg = this.add.rectangle(0, 0, 140, 30, 0x222233).setInteractive();
            bg.setStrokeStyle(1, 0x444455);
            
            const txt = this.add.text(0, 0, 'Select Evidence', {
                fontSize: '12px',
                fontFamily: 'Courier',
                color: '#888888'
            }).setOrigin(0.5);

            bg.on('pointerover', () => bg.setFillStyle(0x333344));
            bg.on('pointerout', () => bg.setFillStyle(0x222233));
            bg.on('pointerdown', () => this.openEvidencePicker(i, txt));

            slot.add([bg, txt]);
            this.evidenceSlots.push(slot);
        }
    }

    private openEvidencePicker(slotIndex: number, textObj: Phaser.GameObjects.Text) {
        if (this.evidencePickerContainer) {
            this.evidencePickerContainer.destroy();
        }

        const { width, height } = this.scale;
        this.evidencePickerContainer = this.add.container(0, 0);
        this.evidencePickerContainer.setDepth(100);

        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.85).setInteractive();
        this.evidencePickerContainer.add(overlay);

        const collectedIds = gameState.getCollectedEvidence();
        
        this.add.text(width/2, 50, 'SELECT EVIDENCE', { fontSize: '20px', fontFamily: 'Courier', color: '#fff' }).setOrigin(0.5);
        
        collectedIds.forEach((id, i) => {
            const e = evidenceData[id];
            if (!e) return;
            const row = Math.floor(i / 3);
            const col = i % 3;
            const btn = this.createButton(width/2 - 180 + col * 180, 100 + row * 40, 170, 30, e.name, () => {
                const key = 'evidence' + (slotIndex + 1) as keyof Accusation;
                (this.currentAccusation as any)[key] = id;
                textObj.setText(e.name);
                textObj.setColor('#ffffff');
                this.evidencePickerContainer?.destroy();
                this.evidencePickerContainer = undefined;
            });
            this.evidencePickerContainer?.add(btn);
        });

        const closeBtn = this.createButton(width/2, height - 50, 100, 30, 'CANCEL', () => {
            this.evidencePickerContainer?.destroy();
            this.evidencePickerContainer = undefined;
        });
        this.evidencePickerContainer.add(closeBtn);
    }

    private createPanelBackground(x: number, y: number, w: number, h: number, title: string) {
        const bg = this.add.rectangle(x + w/2, y + h/2, w, h, 0x111118);
        bg.setStrokeStyle(1, 0x444455);
        this.add.text(x + w/2, y + 15, title, {
            fontSize: '14px',
            fontFamily: 'Courier',
            color: '#aaaaaa'
        }).setOrigin(0.5);
    }

    private createButton(x: number, y: number, w: number, h: number, text: string, onClick: () => void) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(w/2, h/2, w, h, 0x222233).setInteractive();
        
        // Truncate text if needed
        let displayText = text;
        if (text.length > 22) {
            displayText = text.substring(0, 20) + '...';
        }

        const txt = this.add.text(w/2, h/2, displayText, { 
            fontSize: '12px', 
            fontFamily: 'Courier', 
            color: '#dddddd' 
        }).setOrigin(0.5);
        
        bg.on('pointerover', () => {
            if (bg.getData('selected')) return;
            bg.setFillStyle(0x444466);
        });
        bg.on('pointerout', () => {
            if (bg.getData('selected')) return;
            bg.setFillStyle(0x222233);
        });
        bg.on('pointerdown', () => {
            AudioManager.getInstance().playSFX('click');
            onClick();
        });

        container.add([bg, txt]);
        return container;
    }

    private selectField(field: keyof Accusation, value: string) {
        (this.currentAccusation as any)[field] = value;
        this.refreshPanels();
    }

    private refreshPanels() {
        const updateButtons = (buttons: Phaser.GameObjects.Container[], field: keyof Accusation) => {
            buttons.forEach(btn => {
                const bg = btn.list[0] as Phaser.GameObjects.Rectangle;
                const txt = btn.list[1] as Phaser.GameObjects.Text;
                const key = btn.getData('key');
                if ((this.currentAccusation as any)[field] === key) {
                    bg.setFillStyle(0x886622);
                    bg.setStrokeStyle(2, 0xffcc00);
                    bg.setData('selected', true);
                    txt.setColor('#ffffff');
                } else {
                    bg.setFillStyle(0x222233);
                    bg.setStrokeStyle(0);
                    bg.setData('selected', false);
                    txt.setColor('#dddddd');
                }
            });
        };

        updateButtons(this.suspectButtons, 'culprit');
        updateButtons(this.methodButtons, 'method');
        updateButtons(this.alibiButtons, 'falseAlibi');
    }

    private createPresentButton() {
        const { width, height } = this.scale;
        this.createButton(width - 90, height - 35, 140, 30, 'PRESENT CASE', () => this.presentCase());
    }

    private createBackButton() {
        const { height } = this.scale;
        this.createButton(50, height - 35, 80, 30, 'BACK', () => {
            this.scene.switch('ExplorationScene');
        });
    }

    private presentCase() {
        const { culprit, method, falseAlibi, evidence1, evidence2, evidence3 } = this.currentAccusation as Accusation;
        
        if (!culprit || !method || !falseAlibi || !evidence1 || !evidence2 || !evidence3) {
            this.feedbackText.setText('Your theory is incomplete. Fill all fields.');
            this.feedbackText.setColor('#ff8800');
            this.cameras.main.shake(200, 0.005);
            AudioManager.getInstance().playSFX('error');
            return;
        }

        const result = deductionEngine.validateAccusation(this.currentAccusation as Accusation);
        
        if (result.correct) {
            this.handleSuccess();
        } else {
            this.handleFailure(result.feedback);
        }
    }

    private handleSuccess() {
        AudioManager.getInstance().playSFX('success');
        this.cameras.main.flash(500, 255, 255, 255);
        gameState.identifyKiller();
        
        this.time.delayedCall(1000, () => {
            this.scene.start('CutsceneScene', { cutsceneId: 'final_reveal' });
        });
    }

    private handleFailure(feedback: string) {
        this.attempts++;
        AudioManager.getInstance().playSFX('error');
        this.cameras.main.shake(300, 0.01);
        
        let msg = feedback;
        msg += ` (Attempt ${this.attempts}/3)`;
        if (this.attempts >= 3) {
            msg += '\nHint: Re-examine the testimonies regarding the lantern and what people drank.';
        }
        
        this.feedbackText.setText(msg);
        this.feedbackText.setColor('#ff0000');
    }
}
