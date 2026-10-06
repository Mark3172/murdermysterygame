import { Scene } from 'phaser';
import { SaveManager } from '../engine/SaveManager';
import { gameState } from '../logic/GameState';
import { AudioManager } from '../engine/AudioManager';

export class SettingsScene extends Scene {
    constructor() {
        super('SettingsScene');
    }

    create() {
        if (this.scene.isActive('CutsceneScene')) {
            this.scene.stop();
            return;
        }

        const { width, height } = this.scale;

        // 1. Semi-translucent dark vignette backdrop
        const backdrop = this.add.graphics();
        backdrop.fillStyle(0x04060d, 0.88);
        backdrop.fillRect(0, 0, width, height);

        // 2. Gilded Victorian Plaque
        const pw = 340, ph = 304;
        const px = (width - pw) / 2;
        const py = (height - ph) / 2;

        const plaque = this.add.graphics();
        // Base dark mahogany panel
        plaque.fillStyle(0x0c111e, 0.98);
        plaque.fillRoundedRect(px, py, pw, ph, 8);

        // Double gold filigree border
        plaque.lineStyle(2, 0xd4af37, 1);
        plaque.strokeRoundedRect(px, py, pw, ph, 8);
        plaque.lineStyle(1, 0x6e5218, 0.8);
        plaque.strokeRoundedRect(px + 4, py + 4, pw - 8, ph - 8, 6);

        // Corner brass rivets
        plaque.fillStyle(0xffe066, 1);
        plaque.fillCircle(px + 10, py + 10, 3);
        plaque.fillCircle(px + pw - 10, py + 10, 3);
        plaque.fillCircle(px + 10, py + ph - 10, 3);
        plaque.fillCircle(px + pw - 10, py + ph - 10, 3);

        // Header Title
        this.add.text(width / 2, py + 26, '✦ CASE INVESTIGATION PAUSED ✦', {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: '#ffd700',
            fontStyle: 'bold',
            letterSpacing: 1.5
        }).setOrigin(0.5);

        this.add.text(width / 2, py + 44, 'STELLARA OBSERVATORY DOSSIER', {
            fontFamily: 'Courier New, monospace',
            fontSize: '9px',
            color: '#7ac4d4',
            fontStyle: 'bold',
            letterSpacing: 1
        }).setOrigin(0.5);

        // Divider
        const divider = this.add.graphics();
        divider.lineStyle(1, 0xd4af37, 0.5);
        divider.lineBetween(px + 30, py + 56, px + pw - 30, py + 56);

        // Button Factory
        const createGildedButton = (y: number, text: string, onClick: () => void, accent = '#ffd700') => {
            const bw = 260, bh = 34;
            const btnContainer = this.add.container(width / 2, y);

            const btnBg = this.add.graphics();
            btnBg.fillStyle(0x131a2a, 0.9);
            btnBg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 4);
            btnBg.lineStyle(1, 0x3d4e68, 0.9);
            btnBg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 4);

            const btnText = this.add.text(0, 0, text, {
                fontFamily: 'Courier New, monospace',
                fontSize: '11px',
                color: '#e4ecf4',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            btnContainer.add([btnBg, btnText]);

            const hitZone = this.add.zone(0, 0, bw, bh).setInteractive({ useHandCursor: true });
            btnContainer.add(hitZone);

            hitZone.on('pointerover', () => {
                btnBg.clear();
                btnBg.fillStyle(0x1d2a44, 0.98);
                btnBg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 4);
                btnBg.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(accent).color, 1);
                btnBg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 4);
                btnText.setColor(accent);
                try { AudioManager.getInstance().playSFX('type_blip'); } catch(e) {}
            });

            hitZone.on('pointerout', () => {
                btnBg.clear();
                btnBg.fillStyle(0x131a2a, 0.9);
                btnBg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 4);
                btnBg.lineStyle(1, 0x3d4e68, 0.9);
                btnBg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 4);
                btnText.setColor('#e4ecf4');
            });

            hitZone.on('pointerdown', () => {
                try { AudioManager.getInstance().playSFX('ui_click'); } catch(e) {}
                onClick();
            });

            return btnContainer;
        };

        let btnY = py + 72;
        const spacing = 37;

        // 1. Resume
        createGildedButton(btnY, '▶ RESUME INVESTIGATION [ESC]', () => {
            this.scene.stop();
            this.scene.resume('ExplorationScene');
        }, '#7ac4d4');

        // 2. Fullscreen Toggle
        btnY += spacing;
        const isFs = !!document.fullscreenElement;
        const fsBtnText = isFs ? '🗗 EXIT FULLSCREEN [F]' : '⛶ ENTER FULLSCREEN [F]';
        createGildedButton(btnY, fsBtnText, () => {
            if (!document.fullscreenElement) {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                }
            }
            this.time.delayedCall(100, () => this.scene.restart());
        }, '#ffd700');

        // 3. Audio & Display Settings
        btnY += spacing;
        createGildedButton(btnY, '⚙ AUDIO & DISPLAY SETTINGS', () => {
            const dom = document.getElementById('settings-overlay');
            if (dom) {
                dom.style.display = dom.style.display === 'block' ? 'none' : 'block';
            }
        });

        // 4. Save Game
        btnY += spacing;
        createGildedButton(btnY, '💾 SAVE CURRENT CASE PROGRESS', () => {
            SaveManager.save(gameState.serialize());
            try { AudioManager.getInstance().playSFX('success'); } catch(e) {}

            const savedBadge = this.add.text(width / 2, py + ph - 22, '✔ DOSSIER SAVED TO DISK', {
                fontFamily: 'Courier New, monospace',
                fontSize: '10px',
                color: '#4ac47a',
                fontStyle: 'bold',
                backgroundColor: '#0c1a14',
                padding: { x: 8, y: 3 }
            }).setOrigin(0.5);

            this.time.delayedCall(2200, () => {
                this.tweens.add({
                    targets: savedBadge,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => savedBadge.destroy()
                });
            });
        }, '#4ac47a');

        // 5. Return to Title
        btnY += spacing;
        createGildedButton(btnY, '🏠 RETURN TO MAIN MENU', () => {
            const dom = document.getElementById('settings-overlay');
            if (dom) dom.style.display = 'none';
            this.scene.stop('ExplorationScene');
            this.scene.start('TitleScene');
        }, '#ff7777');

        // ESC Key to resume
        this.input.keyboard?.on('keydown-ESC', () => {
            const dom = document.getElementById('settings-overlay');
            if (dom && dom.style.display === 'block') {
                dom.style.display = 'none';
                return;
            }
            this.scene.stop();
            this.scene.resume('ExplorationScene');
        });

        // F Key for Fullscreen toggle
        this.input.keyboard?.on('keydown-F', () => {
            if (!document.fullscreenElement) {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                }
            }
            this.time.delayedCall(100, () => this.scene.restart());
        });
    }
}
