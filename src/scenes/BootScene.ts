import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        // Generate a 1x1 white pixel texture named 'pixel'
        const canvas = this.textures.createCanvas('pixel', 1, 1);
        if (canvas) {
            const ctx = canvas.getContext();
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, 1, 1);
            }
            canvas.refresh();
        }

        // Start PreloadScene immediately
        this.scene.start('PreloadScene');
    }
}
