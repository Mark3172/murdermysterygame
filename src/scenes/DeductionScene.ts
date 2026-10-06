import Phaser from 'phaser';
import { gameState } from '../logic/GameState';
import { deductionEngine, Accusation } from '../logic/DeductionEngine';
import { AudioManager } from '../engine/AudioManager';
import { suspects } from '../data/suspects';
import { evidence as evidenceData } from '../data/evidence';
import { storyManager } from '../logic/StoryPhaseManager';
import { PortraitRenderer } from '../rendering/PortraitRenderer';

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
        const hud = document.getElementById('hud-bar');
        if (hud) hud.style.display = 'none';

        if (this.scene.isActive('UIScene')) {
            this.scene.sleep('UIScene');
        }

        this.events.once('shutdown', () => {
            if (this.scene.isSleeping('UIScene')) {
                this.scene.wake('UIScene');
            }
        });

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
        
        // CULPRIT PANEL (with suspect portraits)
        this.createPanelBackground(10, pY, pW, pH, 'I. ACCUSED CULPRIT');
        const suspectKeys = Object.keys(suspects);
        suspectKeys.forEach((key, i) => {
            const btn = this.createSuspectButton(20, pY + 25 + i * 29, pW - 20, 25, key, () => this.selectField('culprit', key));
            btn.setData('key', key);
            this.suspectButtons.push(btn);
        });

        // METHOD PANEL
        this.createPanelBackground(220, pY, pW, pH, 'II. MURDER METHOD');
        const collectedIds = gameState.getCollectedEvidence();
        const collectedEvidence = collectedIds.map(id => evidenceData[id]).filter(e => e);
        
        const methodOptions = collectedEvidence.filter(e => e.category === 'physical' || e.category === 'acoustic');
        if (methodOptions.length === 0) {
            this.add.text(320, pY + 80, 'No weapons or methods discovered.\nInspect the Exhibition Chamber.', {
                fontSize: '10px',
                fontFamily: 'Georgia, serif',
                color: '#8a96a4',
                align: 'center',
                wordWrap: { width: 180 }
            }).setOrigin(0.5);
        } else {
            methodOptions.forEach((e, i) => {
                if (i > 4) return;
                const btn = this.createButton(230, pY + 25 + i * 29, pW - 20, 25, e.name, () => this.selectField('method', e.id));
                btn.setData('key', e.id);
                this.methodButtons.push(btn);
            });
        }

        // FALSE ALIBI PANEL
        this.createPanelBackground(430, pY, pW, pH, 'III. FALSE ALIBI CONTRADICTION');
        collectedEvidence.forEach((e, i) => {
            if (i > 4) return;
            const btn = this.createButton(440, pY + 25 + i * 29, pW - 20, 25, e.name, () => this.selectField('falseAlibi', e.id));
            btn.setData('key', e.id);
            this.alibiButtons.push(btn);
        });
    }

    private createSupportingEvidence() {
        const { width } = this.scale;
        
        this.add.text(width / 2, 245, 'IV. SUPPORTING EVIDENCE PIECES (3 REQUIRED)', {
            fontSize: '11px',
            fontFamily: 'Courier New, monospace',
            color: '#ffd700',
            fontStyle: 'bold',
            letterSpacing: 1
        }).setOrigin(0.5);

        for (let i = 0; i < 3; i++) {
            const slotX = width / 2 - 160 + i * 160;
            const slotY = 275;
            const slot = this.add.container(slotX, slotY);
            
            const bg = this.add.rectangle(0, 0, 150, 28, 0x141a28).setInteractive({ useHandCursor: true });
            bg.setStrokeStyle(1, 0x3a4b66);
            
            const txt = this.add.text(0, 0, `Evidence ${i + 1}`, {
                fontSize: '11px',
                fontFamily: 'Georgia, serif',
                color: '#8a9cae'
            }).setOrigin(0.5);

            bg.on('pointerover', () => {
                bg.setFillStyle(0x243248);
                bg.setStrokeStyle(1, 0xd4af37);
            });
            bg.on('pointerout', () => {
                bg.setFillStyle(0x141a28);
                bg.setStrokeStyle(1, 0x3a4b66);
            });
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

        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x060914, 0.9).setInteractive();
        this.evidencePickerContainer.add(overlay);

        const collectedIds = gameState.getCollectedEvidence();
        
        const pickerTitle = this.add.text(width/2, 45, 'SELECT SUPPORTING CLUE', {
            fontSize: '16px',
            fontFamily: 'Courier New, monospace',
            color: '#d4af37',
            fontStyle: 'bold',
            letterSpacing: 1.5
        }).setOrigin(0.5);
        this.evidencePickerContainer.add(pickerTitle);
        
        collectedIds.forEach((id, i) => {
            const e = evidenceData[id];
            if (!e) return;
            const row = Math.floor(i / 3);
            const col = i % 3;
            const btn = this.createButton(width/2 - 180 + col * 180, 90 + row * 38, 170, 30, e.name, () => {
                const key = 'evidence' + (slotIndex + 1) as keyof Accusation;
                (this.currentAccusation as any)[key] = id;
                textObj.setText(e.name.length > 20 ? e.name.substring(0, 18) + '...' : e.name);
                textObj.setColor('#ffffff');
                this.evidencePickerContainer?.destroy();
                this.evidencePickerContainer = undefined;
            });
            this.evidencePickerContainer?.add(btn);
        });

        const closeBtn = this.createButton(width/2, height - 40, 120, 28, 'CANCEL', () => {
            this.evidencePickerContainer?.destroy();
            this.evidencePickerContainer = undefined;
        });
        this.evidencePickerContainer.add(closeBtn);
    }

    private createPanelBackground(x: number, y: number, w: number, h: number, title: string) {
        const bg = this.add.rectangle(x + w/2, y + h/2, w, h, 0x090c18, 0.94);
        bg.setStrokeStyle(1.5, 0xd4af37, 0.85);

        // Corner decorative studs
        const studs = this.add.graphics();
        studs.fillStyle(0xd4af37, 1);
        studs.fillRect(x + 2, y + 2, 3, 3);
        studs.fillRect(x + w - 5, y + 2, 3, 3);
        studs.fillRect(x + 2, y + h - 5, 3, 3);
        studs.fillRect(x + w - 5, y + h - 5, 3, 3);

        this.add.text(x + w/2, y + 13, title, {
            fontSize: '10px',
            fontFamily: 'Courier New, monospace',
            color: '#ffd700',
            fontStyle: 'bold',
            letterSpacing: 1
        }).setOrigin(0.5);
    }

    private createSuspectButton(x: number, y: number, w: number, h: number, key: string, onClick: () => void) {
        const s = suspects[key];
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(w/2, h/2, w, h, 0x141a28).setInteractive({ useHandCursor: true });
        bg.setStrokeStyle(1, 0x3a4b66);

        // Portrait thumbnail
        const portraitKey = PortraitRenderer.generatePortrait(this, key, 'neutral');
        const portrait = this.add.image(14, h/2, portraitKey).setDisplaySize(20, 20);

        // Name
        const txt = this.add.text(28, h/2, s.name, { 
            fontSize: '11px', 
            fontFamily: 'Georgia, serif', 
            color: '#e6edf4',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        bg.on('pointerover', () => {
            if (bg.getData('selected')) return;
            bg.setFillStyle(0x243248);
            bg.setStrokeStyle(1, 0xd4af37);
        });
        bg.on('pointerout', () => {
            if (bg.getData('selected')) return;
            bg.setFillStyle(0x141a28);
            bg.setStrokeStyle(1, 0x3a4b66);
        });
        bg.on('pointerdown', () => {
            AudioManager.getInstance().playSFX('click');
            onClick();
        });

        container.add([bg, portrait, txt]);
        return container;
    }

    private createButton(x: number, y: number, w: number, h: number, text: string, onClick: () => void) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(w/2, h/2, w, h, 0x141a28).setInteractive({ useHandCursor: true });
        bg.setStrokeStyle(1, 0x3a4b66);
        
        let displayText = text;
        if (text.length > 22) {
            displayText = text.substring(0, 20) + '...';
        }

        const txt = this.add.text(w/2, h/2, displayText, { 
            fontSize: '11px', 
            fontFamily: 'Georgia, serif', 
            color: '#d0dce8' 
        }).setOrigin(0.5);
        
        bg.on('pointerover', () => {
            if (bg.getData('selected')) return;
            bg.setFillStyle(0x243248);
            bg.setStrokeStyle(1, 0xd4af37);
        });
        bg.on('pointerout', () => {
            if (bg.getData('selected')) return;
            bg.setFillStyle(0x141a28);
            bg.setStrokeStyle(1, 0x3a4b66);
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
                const txt = btn.list[btn.list.length - 1] as Phaser.GameObjects.Text;
                const key = btn.getData('key');
                if ((this.currentAccusation as any)[field] === key) {
                    bg.setFillStyle(0x886622);
                    bg.setStrokeStyle(2, 0xffd700);
                    bg.setData('selected', true);
                    txt.setColor('#ffffff');
                } else {
                    bg.setFillStyle(0x141a28);
                    bg.setStrokeStyle(1, 0x3a4b66);
                    bg.setData('selected', false);
                    txt.setColor('#d0dce8');
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
