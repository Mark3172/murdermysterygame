import { Scene } from 'phaser';
import { EventBus } from '../engine/EventBus';
import { gameState } from '../logic/GameState';
import { deductionEngine, Accusation } from '../logic/DeductionEngine';
import { AudioManager } from '../engine/AudioManager';
import { SceneTransition } from '../engine/SceneTransition';
import { suspects } from '../data/suspects';
import { evidence as evidenceData } from '../data/evidence';

export class DeductionScene extends Scene {
    private selectedCulprit: string | null = null;
    private selectedMethod: string | null = null;
    private selectedAlibi: string | null = null;
    
    constructor() {
        super('DeductionScene');
    }

    create() {
        this.add.graphics().fillStyle(0x110c08, 1).fillRect(0, 0, 640, 360);
        
        this.add.text(320, 30, 'FINAL ACCUSATION', { fontSize: '20px', color: '#ffaa00' }).setOrigin(0.5);

        // Panels
        this.createCulpritPanel();
        this.createMethodPanel();
        this.createAlibiPanel();

        const presentBtn = this.add.text(320, 320, 'PRESENT CASE', { fontSize: '18px', color: '#fff', backgroundColor: '#552200' })
            .setOrigin(0.5)
            .setPadding(10)
            .setInteractive()
            .on('pointerdown', () => this.presentCase());
    }

    private createCulpritPanel() {
        this.add.text(50, 70, 'CULPRIT', { color: '#aaa', fontSize: '14px' });
        Object.values(suspects).forEach((s, i) => {
            const btn = this.add.text(50, 100 + i*25, s.name, { color: '#fff', fontSize: '12px' })
                .setInteractive()
                .on('pointerdown', () => {
                    this.selectedCulprit = s.id;
                    // highlight logic
                });
        });
    }

    private createMethodPanel() {
        this.add.text(250, 70, 'METHOD', { color: '#aaa', fontSize: '14px' });
        const methods = Object.values(evidenceData).filter(e => (e.category as string) === 'method' || e.id === 'poisoned_tea' || e.id === 'spliced_recording');
        methods.forEach((m, i) => {
            const btn = this.add.text(250, 100 + i*25, m.name, { color: '#fff', fontSize: '12px' })
                .setInteractive()
                .on('pointerdown', () => {
                    this.selectedMethod = m.id;
                });
        });
    }

    private createAlibiPanel() {
        this.add.text(450, 70, 'FALSE ALIBI', { color: '#aaa', fontSize: '14px' });
        const alibis = Object.values(evidenceData).filter(e => (e.category as string) === 'alibi' || e.id === 'missing_lantern' || e.id === 'rain_sensor_data');
        alibis.forEach((a, i) => {
            const btn = this.add.text(450, 100 + i*25, a.name, { color: '#fff', fontSize: '12px' })
                .setInteractive()
                .on('pointerdown', () => {
                    this.selectedAlibi = a.id;
                });
        });
    }

    private presentCase() {
        if (!this.selectedCulprit || !this.selectedMethod || !this.selectedAlibi) {
            // highlight missing
            return;
        }
        
        const accusation: any = {
            culprit: this.selectedCulprit,
            method: this.selectedMethod,
            falseAlibi: this.selectedAlibi,
            evidence1: 'motive_unknown', // simplify for now
            evidence2: this.selectedMethod,
            evidence3: this.selectedAlibi
        };
        
        const result = deductionEngine.validateAccusation(accusation);
        
        if (result.correct) {
            AudioManager.getInstance().playSFX('success');
            // Camera flash
            this.cameras.main.flash(500, 255, 255, 255);
            setTimeout(() => {
                SceneTransition.fadeToBlack(this, 500, () => this.scene.start('CreditsScene'));
            }, 2000);
        } else {
            AudioManager.getInstance().playSFX('error');
            this.cameras.main.shake(200, 0.01);
            this.add.text(320, 345, result.feedback, { color: '#ff0000', fontSize: '12px' }).setOrigin(0.5);
        }
    }
}
