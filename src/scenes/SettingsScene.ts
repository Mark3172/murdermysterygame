import { Scene } from 'phaser';
import { SaveManager } from '../engine/SaveManager';
import { gameState } from '../logic/GameState';

export class SettingsScene extends Scene {
    
    constructor() {
        super('SettingsScene');
    }

    create() {
        // Overlay
        this.add.graphics().fillStyle(0x000000, 0.8).fillRect(0, 0, 640, 360);
        
        // Panel
        const panel = this.add.graphics().fillStyle(0x222233, 1).lineStyle(2, 0x444455).fillRect(220, 50, 200, 260).strokeRect(220, 50, 200, 260);

        this.add.text(320, 70, 'PAUSED', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);

        const createBtn = (y: number, text: string, onClick: () => void) => {
            const btn = this.add.text(320, y, text, { fontSize: '16px', color: '#cccccc' })
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerover', () => btn.setColor('#ffffff'))
                .on('pointerout', () => btn.setColor('#cccccc'))
                .on('pointerdown', onClick);
        };

        createBtn(120, 'Resume', () => {
            this.scene.stop();
            this.scene.resume('ExplorationScene'); // Resume underlying scene
        });

        createBtn(160, 'Settings', () => {
            // Toggle DOM settings overlay
            const dom = document.getElementById('settings-overlay');
            if(dom) dom.style.display = dom.style.display === 'block' ? 'none' : 'block';
        });

        createBtn(200, 'Save Game', () => {
            SaveManager.save(gameState.serialize());
            const savedTxt = this.add.text(320, 220, 'Saved!', { color: '#00ff00', fontSize: '10px' }).setOrigin(0.5);
            this.time.delayedCall(1000, () => savedTxt.destroy());
        });

        createBtn(240, 'Main Menu', () => {
            this.scene.stop('ExplorationScene');
            this.scene.start('TitleScene');
        });

        createBtn(280, 'Quit', () => {
            this.scene.stop('ExplorationScene');
            this.scene.start('TitleScene');
        });

        this.input.keyboard?.on('keydown-ESC', () => {
            this.scene.stop();
            this.scene.resume('ExplorationScene');
        });
    }
}
