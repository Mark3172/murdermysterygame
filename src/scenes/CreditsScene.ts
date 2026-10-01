import { Scene } from 'phaser';
import { AudioManager } from '../engine/AudioManager';

export class CreditsScene extends Scene {
    private scrollText!: Phaser.GameObjects.Text;
    private scenesGroup!: Phaser.GameObjects.Group;
    
    constructor() {
        super('CreditsScene');
    }

    create() {
        this.add.graphics().fillStyle(0x000000, 1).fillRect(0, 0, 640, 360);
        
        this.scenesGroup = this.add.group();
        this.createPixelScenes();

        const credits = `
THE THIRTEENTH CHIME
Episode 1: The Clockwork Observatory

Created with Phaser 3

Story & Design
[Procedurally Generated]

Art Direction
Procedural Pixel Art Engine

Sound Design
Web Audio API Synthesis

Characters
Ren Kasuga - Detective
Dr. Mira Vale - Inventor
Professor Aldric Sable - Victim
Nadia Thorn - Acoustician
Hugo Wren - Doctor
Petra Solano - Journalist
Felix Ashworth - Patron
Iris Blackwell - Engineer

Built with
TypeScript • Phaser 3 • Vite
Web Audio API

All assets procedurally generated
No external art or audio files used

Thank you for playing

Ren will return in:
THE SILENT FREQUENCY
        `;

        this.scrollText = this.add.text(320, 400, credits, {
            fontSize: '16px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5, 0);

        // Music
        AudioManager.getInstance().startMusic('resolution');

        this.input.keyboard?.on('keydown', () => this.skipCredits());
        this.input.on('pointerdown', () => this.skipCredits());
    }

    update(time: number, delta: number) {
        if (this.scrollText) {
            this.scrollText.y -= delta * 0.03;
            if (this.scrollText.y < -1200) {
                this.skipCredits();
            }
        }
    }

    private createPixelScenes() {
        // Vignette 1: Observatory silhouette with rain and siren flashes
        const vignette1 = this.add.container(0, 0);
        const sky = this.add.graphics();
        sky.fillStyle(0x0a0c18, 1).fillRect(0, 0, 640, 360);
        // Distant mountains
        sky.fillStyle(0x121526, 1);
        sky.beginPath(); sky.moveTo(0, 360); sky.lineTo(120, 240); sky.lineTo(260, 310); sky.lineTo(400, 210); sky.lineTo(640, 360); sky.closePath(); sky.fillPath();
        // Observatory dome silhouette
        sky.fillStyle(0x060810, 1);
        sky.fillCircle(320, 260, 70);
        sky.fillRect(250, 260, 140, 100);
        // Slit in dome
        sky.fillStyle(0xd4af37, 0.4);
        sky.fillRect(316, 200, 8, 80);
        vignette1.add(sky);

        // Flashing police lights reflection
        const siren = this.add.rectangle(320, 340, 640, 40, 0x1133bb, 0.25);
        this.tweens.add({
            targets: siren,
            fillColor: { from: 0x1133bb, to: 0xbb2222 },
            alpha: { from: 0.1, to: 0.35 },
            yoyo: true,
            repeat: -1,
            duration: 900
        });
        vignette1.add(siren);

        // Rain particles in vignette
        for (let i = 0; i < 40; i++) {
            const drop = this.add.rectangle(Math.random() * 640, Math.random() * 360, 1, 8, 0x4a6a9a, 0.4);
            vignette1.add(drop);
            this.tweens.add({
                targets: drop,
                y: drop.y + 360,
                repeat: -1,
                duration: 600 + Math.random() * 300,
                onRepeat: () => {
                    drop.y = -10;
                    drop.x = Math.random() * 640;
                }
            });
        }

        // Vignette 2: Ren holding the mysterious photograph of his mother
        const vignette2 = this.add.container(0, 0);
        vignette2.setAlpha(0);
        const deskBg = this.add.graphics();
        deskBg.fillStyle(0x16101c, 1).fillRect(0, 0, 640, 360);
        deskBg.fillStyle(0x2a1a14, 1).fillRect(100, 180, 440, 180);
        // Photo frame
        deskBg.fillStyle(0xd4af37, 0.9).fillRect(260, 120, 120, 140);
        deskBg.fillStyle(0x3a4a5a, 1).fillRect(268, 128, 104, 124);
        // Figures in photo
        deskBg.fillStyle(0xe8c8a8, 1).fillCircle(300, 170, 12); // Ren's mother
        deskBg.fillStyle(0x2a2a3a, 1).fillCircle(340, 165, 14); // Prof. Sable
        vignette2.add(deskBg);
        const caption = this.add.text(320, 280, 'Project Echo • Twelve Years Ago', {
            fontFamily: 'serif',
            fontSize: '12px',
            color: '#b0a080',
            fontStyle: 'italic'
        }).setOrigin(0.5);
        vignette2.add(caption);

        this.scenesGroup.add(vignette1);
        this.scenesGroup.add(vignette2);

        // Crossfade between vignettes after 10 seconds
        this.time.delayedCall(10000, () => {
            this.tweens.add({ targets: vignette1, alpha: 0, duration: 2500 });
            this.tweens.add({ targets: vignette2, alpha: 0.85, duration: 2500 });
        });
    }

    private skipCredits() {
        AudioManager.getInstance().stopMusic();
        this.scene.start('TitleScene');
    }
}
