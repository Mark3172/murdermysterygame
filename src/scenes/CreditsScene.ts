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
        // Just abstract placeholders for the aftermath scenes
        const scene1 = this.add.graphics().fillStyle(0x111122, 1).fillRect(0, 0, 640, 360);
        this.scenesGroup.add(scene1);
        
        // crossfade logic omitted for brevity, but would use tweens
    }

    private skipCredits() {
        AudioManager.getInstance().stopMusic();
        this.scene.start('TitleScene');
    }
}
