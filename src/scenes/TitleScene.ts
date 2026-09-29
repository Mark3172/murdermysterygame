import Phaser from 'phaser';
import { EventBus } from '../engine/EventBus';
import { SaveManager } from '../engine/SaveManager';
import { AudioManager } from '../engine/AudioManager';
import { gameState } from '../logic/GameState';

export class TitleScene extends Phaser.Scene {
    private clockTimer?: Phaser.Time.TimerEvent;

    constructor() {
        super('TitleScene');
    }

    create() {
        // Dark background
        this.cameras.main.setBackgroundColor('#0a0a12');

        // Rain particles
        if (this.textures.exists('particle_rain')) {
            const rain = this.add.particles(0, 0, 'particle_rain', {
                x: { min: 0, max: 640 },
                y: -10,
                lifespan: 2000,
                speedY: { min: 200, max: 400 },
                speedX: { min: -20, max: 20 },
                scale: { start: 1, end: 0.5 },
                quantity: 2,
                blendMode: 'ADD'
            });
        }

        // Pendulum animation
        const pendulumGraphics = this.add.graphics();
        pendulumGraphics.lineStyle(2, 0x888888, 1);
        pendulumGraphics.fillStyle(0xccaa00, 1);
        pendulumGraphics.beginPath();
        pendulumGraphics.moveTo(320, -50);
        pendulumGraphics.lineTo(320, 200);
        pendulumGraphics.strokePath();
        pendulumGraphics.fillCircle(320, 200, 15);
        
        this.tweens.add({
            targets: pendulumGraphics,
            angle: 15,
            duration: 1600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onStart: () => {
                pendulumGraphics.setAngle(-15);
            }
        });

        // Title text
        this.add.text(320, 100, 'THE THIRTEENTH CHIME', {
            fontFamily: 'serif',
            fontSize: '32px',
            color: '#d4af37',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(320, 140, 'A Murder Mystery', {
            fontFamily: 'serif',
            fontSize: '18px',
            color: '#aaaaaa',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Menu buttons
        let menuY = 220;

        this.createMenuButton(320, menuY, 'New Game', () => {
            this.startGame();
        });

        if (SaveManager.hasSave()) {
            menuY += 30;
            this.createMenuButton(320, menuY, 'Continue', () => {
                this.continueGame();
            });
        }

        menuY += 30;
        this.createMenuButton(320, menuY, 'Settings', () => {
            EventBus.emit('open-settings');
        });

        menuY += 30;
        this.createMenuButton(320, menuY, 'Credits', () => {
            this.scene.start('CreditsScene');
        });

        // Clock ticking sound
        this.clockTimer = this.time.addEvent({
            delay: 800,
            loop: true,
            callback: () => {
                try {
                    AudioManager.getInstance().playSFX('clockTick');
                } catch (e) {
                    // Ignore if audio not ready
                }
            }
        });

        // Start Audio Context on first click
        this.input.once('pointerdown', () => {
            const soundManager = this.sound as Phaser.Sound.WebAudioSoundManager;
            if (soundManager.context && soundManager.context.state === 'suspended') {
                soundManager.context.resume();
            }
        });
    }

    private createMenuButton(x: number, y: number, text: string, callback: () => void) {
        const btn = this.add.text(x, y, text, {
            fontFamily: 'sans-serif',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => {
            btn.setColor('#d4af37');
            btn.setScale(1.1);
        });
        btn.on('pointerout', () => {
            btn.setColor('#ffffff');
            btn.setScale(1);
        });
        btn.on('pointerdown', callback);
    }

    private startGame() {
        if (this.clockTimer) this.clockTimer.remove();
        this.scene.start('CutsceneScene', { cutsceneId: 'cold_open' });
    }

    private continueGame() {
        if (this.clockTimer) this.clockTimer.remove();
        const saveData = SaveManager.load();
        if (saveData) {
            // Load game state from save
            gameState.deserialize(saveData);
        }
        this.scene.start('ExplorationScene');
    }
}
