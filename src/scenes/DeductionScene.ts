import Phaser from 'phaser';
import { gameState } from '../logic/GameState';
import { deductionEngine, Accusation } from '../logic/DeductionEngine';
import { AudioManager } from '../engine/AudioManager';
import { suspects } from '../data/suspects';
import { evidence as evidenceData } from '../data/evidence';
import { PortraitRenderer } from '../rendering/PortraitRenderer';

export class DeductionScene extends Phaser.Scene {
    private currentAccusation: Partial<Accusation> = {};
    private uiContainer!: Phaser.GameObjects.Container;
    private feedbackText!: Phaser.GameObjects.Text;
    private feedbackBg!: Phaser.GameObjects.Rectangle;
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

        // Ensure key evidence is collected if player completed reconstruction
        if (gameState.hasDialogueFlag('reconstruction_complete')) {
            gameState.collectEvidence('spliced_recording');
            gameState.collectEvidence('poisoned_tea');
            gameState.collectEvidence('missing_lantern');
            gameState.collectEvidence('nadia_vial');
            gameState.collectEvidence('thirteenth_chime_resonance');
            gameState.collectEvidence('hugo_fingerprints');
            gameState.collectEvidence('connecting_door');
        }

        const { width, height } = this.scale;
        
        // 1. Dark atmospheric background with clean subtle grid
        this.cameras.main.setBackgroundColor('#060914');
        this.add.grid(width/2, height/2, width, height, 32, 32, 0x060914, 1, 0x162238, 0.45);
        
        // Top banner header
        this.add.rectangle(width / 2, 22, width, 44, 0x0b1324, 0.95)
            .setStrokeStyle(1, 0x243f68);

        // 2. High-legibility Title
        this.add.text(width / 2, 14, '⚖ FINAL ACCUSATION & CONFRONTATION', {
            fontSize: '15px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#ffd700',
            fontStyle: 'bold',
            letterSpacing: 1
        }).setOrigin(0.5);

        this.add.text(width / 2, 30, 'Identify the true culprit, the murder weapon, the broken alibi, and 3 key proofs.', {
            fontSize: '10px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#9cb5d0'
        }).setOrigin(0.5);

        this.uiContainer = this.add.container(0, 0);

        this.createPanels();
        this.createSupportingEvidence();
        this.createControls();

        // High contrast feedback pill at bottom
        this.feedbackBg = this.add.rectangle(width / 2, height - 20, 580, 26, 0x0c1626, 0.95)
            .setStrokeStyle(1.5, 0x224870)
            .setVisible(false);

        this.feedbackText = this.add.text(width / 2, height - 20, '', {
            fontSize: '11px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 560 }
        }).setOrigin(0.5);

        this.events.on('wake', this.onWake, this);
        this.onWake();
    }

    private onWake() {
        this.currentAccusation = {};
        this.attempts = 0;
        this.feedbackText.setText('');
        this.feedbackBg.setVisible(false);
        this.refreshPanels();
        this.evidenceSlots.forEach((slot, i) => {
            const txt = slot.list[1] as Phaser.GameObjects.Text;
            txt.setText(`[ Slot ${i + 1}: Select Proof ]`);
            txt.setColor('#8aa0b8');
        });
    }

    private createPanels() {
        const pY = 48;
        const pW = 198;
        const pH = 186;
        
        // I. CULPRIT PANEL (Suspect Portraits)
        this.createPanelBackground(12, pY, pW, pH, 'I. ACCUSED CULPRIT');
        const suspectKeys = Object.keys(suspects);
        suspectKeys.forEach((key, i) => {
            const btn = this.createSuspectButton(20, pY + 24 + i * 31, pW - 16, 27, key, () => this.selectField('culprit', key));
            btn.setData('key', key);
            this.suspectButtons.push(btn);
        });

        // II. METHOD PANEL
        this.createPanelBackground(221, pY, pW, pH, 'II. MURDER METHOD');
        const methodOptions = [
            { id: 'poisoned_tea', name: 'Poisoned Tea (Solvent)' },
            { id: 'clockwork_trauma', name: 'Clockwork Blunt Trauma' },
            { id: 'suffocation', name: 'Atmospheric Suffocation' },
            { id: 'spliced_shock', name: 'Acoustic Shock Resonance' },
            { id: 'electric_surge', name: '13th Chime Power Surge' }
        ];

        methodOptions.forEach((opt, i) => {
            const btn = this.createButton(229, pY + 24 + i * 31, pW - 16, 27, opt.name, () => this.selectField('method', opt.id));
            btn.setData('key', opt.id);
            this.methodButtons.push(btn);
        });

        // III. FALSE ALIBI CONTRADICTION PANEL
        this.createPanelBackground(430, pY, pW, pH, 'III. FALSE ALIBI CONTRADICTION');
        const alibiOptions = [
            { id: 'missing_lantern', name: 'Library Lantern Pre-stolen' },
            { id: 'rain_sensor_data', name: 'Deck Rain Sensor Logs' },
            { id: 'spliced_recording', name: 'Pre-recorded PA Speech' },
            { id: 'petra_recorder', name: 'Gallery Whispered Tape' },
            { id: 'hugo_fingerprints', name: 'Deadbolt Hugo Prints' }
        ];

        alibiOptions.forEach((opt, i) => {
            const btn = this.createButton(438, pY + 24 + i * 31, pW - 16, 27, opt.name, () => this.selectField('falseAlibi', opt.id));
            btn.setData('key', opt.id);
            this.alibiButtons.push(btn);
        });
    }

    private createSupportingEvidence() {
        const { width } = this.scale;
        
        this.add.text(width / 2, 246, 'IV. THREE SUPPORTING PHYSICAL & ACOUSTIC PROOFS:', {
            fontSize: '11px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#ffd700',
            fontStyle: 'bold',
            letterSpacing: 0.5
        }).setOrigin(0.5);

        for (let i = 0; i < 3; i++) {
            const slotX = width / 2 - 165 + i * 165;
            const slotY = 274;
            const slot = this.add.container(slotX, slotY);
            
            const bg = this.add.rectangle(0, 0, 155, 30, 0x0c1626)
                .setStrokeStyle(1.5, 0x25476d)
                .setInteractive({ useHandCursor: true });
            
            const txt = this.add.text(0, 0, `[ Slot ${i + 1}: Select Proof ]`, {
                fontSize: '11px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                color: '#8aa0b8',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            bg.on('pointerover', () => {
                bg.setFillStyle(0x192b45);
                bg.setStrokeStyle(1.5, 0xd4af37);
            });
            bg.on('pointerout', () => {
                bg.setFillStyle(0x0c1626);
                bg.setStrokeStyle(1.5, 0x25476d);
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
        this.evidencePickerContainer.setDepth(200);

        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x040812, 0.94)
            .setInteractive();
        this.evidencePickerContainer.add(overlay);

        const pickerBox = this.add.rectangle(width/2, height/2, 540, 280, 0x0a1424)
            .setStrokeStyle(1.5, 0xd4af37);
        this.evidencePickerContainer.add(pickerBox);

        const pickerTitle = this.add.text(width/2, 58, 'SELECT SUPPORTING EVIDENCE FOR CASE', {
            fontSize: '13px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#ffd700',
            fontStyle: 'bold',
            letterSpacing: 1
        }).setOrigin(0.5);
        this.evidencePickerContainer.add(pickerTitle);
        
        const collectedIds = gameState.getCollectedEvidence();
        // Ensure core clues are selectable
        const allSelectable = Array.from(new Set([
            'spliced_recording',
            'nadia_vial',
            'thirteenth_chime_resonance',
            'poisoned_tea',
            'missing_lantern',
            'hugo_fingerprints',
            'connecting_door',
            ...collectedIds
        ])).filter(id => evidenceData[id]);

        allSelectable.forEach((id, i) => {
            const e = evidenceData[id];
            if (!e || i >= 9) return;
            const row = Math.floor(i / 3);
            const col = i % 3;
            const btnX = width/2 - 170 + col * 170;
            const btnY = 96 + row * 46;

            const btn = this.createButton(btnX - 78, btnY - 17, 156, 36, e.name, () => {
                const key = 'evidence' + (slotIndex + 1) as keyof Accusation;
                (this.currentAccusation as any)[key] = id;
                textObj.setText(`✔ ${e.name}`);
                textObj.setColor('#ffffff');
                this.evidencePickerContainer?.destroy();
                this.evidencePickerContainer = undefined;
            });
            this.evidencePickerContainer?.add(btn);
        });

        const closeBtn = this.createButton(width/2 - 60, height - 60, 120, 30, 'CANCEL', () => {
            this.evidencePickerContainer?.destroy();
            this.evidencePickerContainer = undefined;
        });
        this.evidencePickerContainer.add(closeBtn);
    }

    private createPanelBackground(x: number, y: number, w: number, h: number, title: string) {
        const bg = this.add.rectangle(x + w/2, y + h/2, w, h, 0x08101e, 0.95);
        bg.setStrokeStyle(1.5, 0x244268, 0.9);

        // Header strip
        const hdr = this.add.rectangle(x + w/2, y + 11, w, 22, 0x0f1d32);
        hdr.setStrokeStyle(1, 0x2a5078);

        this.add.text(x + w/2, y + 11, title, {
            fontSize: '10.5px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#ffd700',
            fontStyle: 'bold',
            letterSpacing: 0.5
        }).setOrigin(0.5);
    }

    private createSuspectButton(x: number, y: number, w: number, h: number, key: string, onClick: () => void) {
        const s = suspects[key];
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(w/2, h/2, w, h, 0x0d182a)
            .setStrokeStyle(1.5, 0x223d60)
            .setInteractive({ useHandCursor: true });

        // Portrait thumbnail
        const portraitKey = PortraitRenderer.generatePortrait(this, key, 'neutral');
        const portrait = this.add.image(14, h/2, portraitKey).setDisplaySize(20, 20);

        // Name
        const txt = this.add.text(28, h/2, s.name, { 
            fontSize: '11.5px', 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        bg.on('pointerover', () => {
            if (bg.getData('selected')) return;
            bg.setFillStyle(0x192b45);
            bg.setStrokeStyle(1.5, 0xd4af37);
        });
        bg.on('pointerout', () => {
            if (bg.getData('selected')) return;
            bg.setFillStyle(0x0d182a);
            bg.setStrokeStyle(1.5, 0x223d60);
        });
        bg.on('pointerdown', () => {
            AudioManager.getInstance().playSFX('ui_click');
            onClick();
        });

        container.add([bg, portrait, txt]);
        return container;
    }

    private createButton(x: number, y: number, w: number, h: number, text: string, onClick: () => void) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(w/2, h/2, w, h, 0x0d182a)
            .setStrokeStyle(1.5, 0x223d60)
            .setInteractive({ useHandCursor: true });

        const txt = this.add.text(w/2, h/2, text, { 
            fontSize: '11px', 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
            color: '#e4edf6',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: w - 8 }
        }).setOrigin(0.5);
        
        bg.on('pointerover', () => {
            if (bg.getData('selected')) return;
            bg.setFillStyle(0x192b45);
            bg.setStrokeStyle(1.5, 0xd4af37);
            txt.setColor('#ffffff');
        });
        bg.on('pointerout', () => {
            if (bg.getData('selected')) return;
            bg.setFillStyle(0x0d182a);
            bg.setStrokeStyle(1.5, 0x223d60);
            txt.setColor('#e4edf6');
        });
        bg.on('pointerdown', () => {
            AudioManager.getInstance().playSFX('ui_click');
            onClick();
        });

        container.add([bg, txt]);
        return container;
    }

    private selectField(field: keyof Accusation, value: string) {
        this.currentAccusation[field] = value;
        this.refreshPanels();
    }

    private refreshPanels() {
        const updateButtons = (buttons: Phaser.GameObjects.Container[], field: keyof Accusation) => {
            buttons.forEach(btn => {
                const bg = btn.list[0] as Phaser.GameObjects.Rectangle;
                const txt = btn.list[btn.list.length - 1] as Phaser.GameObjects.Text;
                const key = btn.getData('key');
                if (key === this.currentAccusation[field]) {
                    bg.setFillStyle(0x1e4a28);
                    bg.setStrokeStyle(2, 0x00ff88);
                    bg.setData('selected', true);
                    txt.setColor('#ffffff');
                } else {
                    bg.setFillStyle(0x0d182a);
                    bg.setStrokeStyle(1.5, 0x223d60);
                    bg.setData('selected', false);
                    txt.setColor('#e4edf6');
                }
            });
        };

        updateButtons(this.suspectButtons, 'culprit');
        updateButtons(this.methodButtons, 'method');
        updateButtons(this.alibiButtons, 'falseAlibi');
    }

    private createControls() {
        const { width, height } = this.scale;

        // BACK button
        this.createButton(16, height - 38, 88, 30, '⬅ BACK', () => {
            this.scene.switch('ExplorationScene');
        });

        // AUTO-FILL PROVEN FACTS (One-click solver if player wants to immediately proceed to ending)
        const autoFillBtn = this.add.container(width / 2 - 80, height - 38);
        const autoBg = this.add.rectangle(80, 15, 160, 30, 0x2a2012)
            .setStrokeStyle(1.5, 0xd4af37)
            .setInteractive({ useHandCursor: true });
        const autoTxt = this.add.text(80, 15, '💡 AUTO-FILL PROVEN FACTS', {
            fontSize: '10.5px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        autoFillBtn.add([autoBg, autoTxt]);

        autoBg.on('pointerover', () => {
            autoBg.setFillStyle(0x40321a);
            autoBg.setStrokeStyle(2, 0xffea70);
        });
        autoBg.on('pointerout', () => {
            autoBg.setFillStyle(0x2a2012);
            autoBg.setStrokeStyle(1.5, 0xd4af37);
        });
        autoBg.on('pointerdown', () => this.autoFillCase());

        // PRESENT CASE (Main Confrontation Button)
        const presBtn = this.add.container(width - 156, height - 38);
        const presBg = this.add.rectangle(70, 15, 140, 30, 0x165b26)
            .setStrokeStyle(1.5, 0x4ac47a)
            .setInteractive({ useHandCursor: true });
        const presTxt = this.add.text(70, 15, '✔ PRESENT CASE', {
            fontSize: '12px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold',
            letterSpacing: 1
        }).setOrigin(0.5);
        presBtn.add([presBg, presTxt]);

        presBg.on('pointerover', () => {
            presBg.setFillStyle(0x228038);
            presBg.setStrokeStyle(2, 0x76ff9c);
        });
        presBg.on('pointerout', () => {
            presBg.setFillStyle(0x165b26);
            presBg.setStrokeStyle(1.5, 0x4ac47a);
        });
        presBg.on('pointerdown', () => this.presentCase());
    }

    private autoFillCase() {
        AudioManager.getInstance().playSFX('discoveryString');
        
        // Ensure evidence inventory has all key pieces
        gameState.collectEvidence('spliced_recording');
        gameState.collectEvidence('poisoned_tea');
        gameState.collectEvidence('missing_lantern');
        gameState.collectEvidence('nadia_vial');
        gameState.collectEvidence('thirteenth_chime_resonance');

        this.currentAccusation = {
            culprit: 'nadia',
            method: 'poisoned_tea',
            falseAlibi: 'missing_lantern',
            evidence1: 'spliced_recording',
            evidence2: 'nadia_vial',
            evidence3: 'thirteenth_chime_resonance'
        };

        this.refreshPanels();

        const slotTexts = [
            '✔ Spliced Recording',
            '✔ Nadia\'s Solvent Vial',
            '✔ 13th Chime Resonance'
        ];
        this.evidenceSlots.forEach((slot, i) => {
            const txt = slot.list[1] as Phaser.GameObjects.Text;
            txt.setText(slotTexts[i]);
            txt.setColor('#ffffff');
        });

        this.showFeedback('✦ Proven facts assembled against Nadia Thorn! Click [PRESENT CASE] to trigger the ending.', '#76ff9c', 0x144222);
    }

    private showFeedback(msg: string, textColor: string, bgColor: number) {
        this.feedbackBg.setVisible(true);
        this.feedbackBg.setFillStyle(bgColor, 0.95);
        this.feedbackBg.setStrokeStyle(1.5, Phaser.Display.Color.HexStringToColor(textColor).color);
        this.feedbackText.setText(msg);
        this.feedbackText.setColor(textColor);
    }

    private presentCase() {
        const { culprit, method, falseAlibi, evidence1, evidence2, evidence3 } = this.currentAccusation as Accusation;
        
        if (!culprit || !method || !falseAlibi || !evidence1 || !evidence2 || !evidence3) {
            this.showFeedback('⚠ Your case is incomplete! Select the Culprit, Method, False Alibi, and 3 Proofs.', '#ffaa00', 0x3d2810);
            this.cameras.main.shake(200, 0.005);
            AudioManager.getInstance().playSFX('error_buzz');
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
        AudioManager.getInstance().playSFX('success_jingle');
        this.cameras.main.flash(600, 255, 255, 255);
        gameState.identifyKiller();
        
        this.showFeedback('✦ ACCUSATION PROVEN! THE KILLER CONFESSES... ✦', '#76ff9c', 0x144222);

        this.time.delayedCall(1200, () => {
            this.scene.start('CutsceneScene', { cutsceneId: 'final_reveal' });
        });
    }

    private handleFailure(feedback: string) {
        this.attempts++;
        AudioManager.getInstance().playSFX('error_buzz');
        this.cameras.main.shake(300, 0.008);
        
        let msg = feedback;
        if (this.attempts >= 2) {
            msg += ' (Tip: You can click [AUTO-FILL PROVEN FACTS] to assemble the verified case!)';
        }
        
        this.showFeedback(`⚠ ${msg}`, '#ff6666', 0x3d1414);
    }
}
