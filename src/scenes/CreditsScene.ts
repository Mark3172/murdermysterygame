import { Scene } from 'phaser';
import { AudioManager } from '../engine/AudioManager';
import { gameState } from '../logic/GameState';

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

        // Vignette 2: Ren holding the mysterious photograph of his mother and Professor Sable
        const vignette2 = this.add.container(0, 0);
        vignette2.setAlpha(0);
        const deskBg = this.add.graphics();
        // Moody dark oak desk surface
        deskBg.fillStyle(0x0c0910, 1).fillRect(0, 0, 640, 360);
        deskBg.fillStyle(0x1a1216, 1).fillRect(80, 160, 480, 200);

        // Weathered vintage photograph backing & gold frame
        const px = 250;
        const py = 100;
        const pw = 140;
        const ph = 170;

        deskBg.fillStyle(0xd4af37, 0.95).fillRect(px - 4, py - 4, pw + 8, ph + 8); // Gold trim
        deskBg.fillStyle(0x2e2016, 1).fillRect(px, py, pw, ph); // Sepia photographic paper
        deskBg.fillStyle(0x423020, 1).fillRect(px + 6, py + 6, pw - 12, ph - 38); // Photo print area

        // Studio backdrop inside photograph (sepia arch)
        deskBg.fillStyle(0x56402c, 0.8).fillRect(px + 10, py + 10, pw - 20, ph - 46);

        // Figure 1: Young Professor Sable (right)
        // Tweed jacket
        deskBg.fillStyle(0x322216, 1).fillRect(px + 78, py + 52, 38, 48);
        // Head & neck
        deskBg.fillStyle(0xd2b49c, 1).fillRect(px + 88, py + 28, 18, 22);
        // Young dark hair & sideburns
        deskBg.fillStyle(0x1a120c, 1).fillRect(px + 86, py + 22, 22, 10);
        deskBg.fillRect(px + 85, py + 26, 4, 12);
        // Round spectacles
        deskBg.lineStyle(1, 0xdfb038, 1);
        deskBg.strokeRect(px + 90, py + 32, 6, 6);
        deskBg.strokeRect(px + 98, py + 32, 6, 6);

        // Figure 2: Elena (Ren's Mother, left)
        // Victorian burgundy/sepia lace dress
        deskBg.fillStyle(0x3c2024, 1).fillRect(px + 24, py + 56, 36, 44);
        // Head & neck
        deskBg.fillStyle(0xdec0a8, 1).fillRect(px + 32, py + 32, 18, 20);
        // Elegant wavy dark hair with silver rogue streak
        deskBg.fillStyle(0x1a161c, 1).fillRect(px + 28, py + 24, 26, 14);
        deskBg.fillRect(px + 26, py + 32, 6, 24); // hair falling past shoulder
        deskBg.fillStyle(0xa0b0c8, 1).fillRect(px + 34, py + 26, 4, 8); // rogue silver streak
        // Silver pendant necklace
        deskBg.fillStyle(0xc0c8d8, 1).fillCircle(px + 41, py + 56, 3);

        // Handwritten vintage fountain pen inscription at bottom of photo
        const caption = this.add.text(px + pw / 2, py + ph - 20, 'Elena & Aldric • 1916', {
            fontFamily: 'Georgia, serif',
            fontSize: '11px',
            color: '#bfa882',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Ren's detective leather-gloved hand holding the photograph corner
        deskBg.fillStyle(0x281a14, 1); // Dark leather glove
        deskBg.fillRect(px - 14, py + ph - 50, 24, 34); // Wrist
        deskBg.fillCircle(px + 8, py + ph - 26, 10); // Thumb resting on frame
        deskBg.lineStyle(1.5, 0x140c08, 0.9);
        deskBg.strokeCircle(px + 8, py + ph - 26, 10);

        vignette2.add(deskBg);
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
        if (!gameState.hasCutsceneSeen('post_credits')) {
            this.scene.start('CutsceneScene', { cutsceneId: 'post_credits' });
        } else {
            this.scene.start('TitleScene');
        }
    }
}
