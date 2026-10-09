import Phaser from 'phaser';
import { EventBus } from '../engine/EventBus';
import { SaveManager } from '../engine/SaveManager';
import { AudioManager } from '../engine/AudioManager';
import { gameState } from '../logic/GameState';
import { storyManager } from '../logic/StoryPhaseManager';

export class TitleScene extends Phaser.Scene {
    private clockTimer?: Phaser.Time.TimerEvent;
    private lightningTimer?: Phaser.Time.TimerEvent;
    private pendulumContainer!: Phaser.GameObjects.Container;
    private backgroundGears: Phaser.GameObjects.Graphics[] = [];

    constructor() {
        super('TitleScene');
    }

    create() {
        const hud = document.getElementById('hud-bar');
        if (hud) hud.style.display = 'none';
        if (this.scene.isActive('UIScene')) {
            this.scene.stop('UIScene');
        }

        const { width, height } = this.scale;

        // 1. Dark Atmospheric Gothic Sky & Observatory Backdrop
        const bg = this.add.graphics();
        // Deep midnight gradient
        bg.fillGradientStyle(0x060812, 0x060812, 0x10162a, 0x141a30, 1);
        bg.fillRect(0, 0, width, height);

        // Distant craggy mountain peaks (Stellara Range)
        const mountains = this.add.graphics();
        mountains.fillStyle(0x0a0f1e, 0.9);
        mountains.beginPath();
        mountains.moveTo(0, height);
        mountains.lineTo(0, 230);
        mountains.lineTo(90, 180);
        mountains.lineTo(190, 220);
        mountains.lineTo(320, 140); // Observatory mountain
        mountains.lineTo(440, 210);
        mountains.lineTo(550, 175);
        mountains.lineTo(width, 240);
        mountains.lineTo(width, height);
        mountains.closePath();
        mountains.fillPath();

        // Stellara Mountain Observatory Silhouette
        const observatory = this.add.graphics();
        observatory.fillStyle(0x04060c, 1);
        // Dome base
        observatory.fillRect(280, 140, 80, 60);
        // Rounded dome
        observatory.beginPath();
        observatory.arc(320, 140, 40, Math.PI, 0);
        observatory.fill();
        // Dome telescope slit
        observatory.fillStyle(0xd4af37, 0.6);
        observatory.fillRect(318, 105, 5, 45);
        // Glowing observation slit light
        observatory.fillStyle(0xfff0aa, 0.85);
        observatory.fillCircle(320, 115, 3);
        // Wall windows
        observatory.fillStyle(0xffea70, 0.4);
        observatory.fillRect(292, 155, 8, 12);
        observatory.fillRect(340, 155, 8, 12);

        // 2. Slow-Rotating Background Clockwork Gears (Subtle Noir Machinery)
        this.createBackgroundGears();

        // 3. Falling Storm Rain Particles
        if (this.textures.exists('particle_rain')) {
            this.add.particles(0, 0, 'particle_rain', {
                x: { min: -50, max: width + 50 },
                y: -10,
                lifespan: 1400,
                speedY: { min: 280, max: 450 },
                speedX: { min: -40, max: -15 }, // driving slant
                scale: { start: 0.9, end: 0.4 },
                quantity: 3,
                alpha: { start: 0.35, end: 0.05 },
                blendMode: 'ADD'
            });
        }

        // 4. Authentic Clockwork Brass Pendulum (Fixed Pivot at Top-Center)
        this.createVictorianPendulum(width / 2, 0);

        // 5. Title Header & Subtitle
        const titleContainer = this.add.container(width / 2, 85);

        // Gold ornamental wing divider above title
        const topDivider = this.add.graphics();
        topDivider.lineStyle(1.5, 0xd4af37, 0.85);
        topDivider.beginPath();
        topDivider.moveTo(-160, 0); topDivider.lineTo(-40, 0);
        topDivider.moveTo(40, 0); topDivider.lineTo(160, 0);
        topDivider.stroke();
        topDivider.fillStyle(0xd4af37, 1);
        topDivider.fillCircle(0, 0, 3);
        topDivider.fillCircle(-40, 0, 2);
        topDivider.fillCircle(40, 0, 2);
        titleContainer.add(topDivider);

        // Main Title
        const titleText = this.add.text(0, 22, 'THE THIRTEENTH CHIME', {
            fontFamily: 'Georgia, serif',
            fontSize: '28px',
            color: '#f6d888',
            fontStyle: 'bold',
            stroke: '#080a14',
            strokeThickness: 5,
            letterSpacing: 2
        }).setOrigin(0.5);
        titleContainer.add(titleText);

        // Gold shimmer pulse on title
        this.tweens.add({
            targets: titleText,
            alpha: { from: 0.88, to: 1 },
            scale: { from: 0.99, to: 1.01 },
            duration: 2200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Subtitle
        const subtitle = this.add.text(0, 48, '— A DETECTIVE CONAN MYSTERY • EPISODE I —', {
            fontFamily: 'Courier New, monospace',
            fontSize: '10px',
            color: '#7ac4d4',
            letterSpacing: 1.5,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        titleContainer.add(subtitle);

        // 6. Victorian Gilded Menu Buttons
        let menuY = 195;
        const menuSpacing = 36;

        this.createGildedMenuButton(width / 2, menuY, 'I. NEW INVESTIGATION', () => {
            this.startGame();
        });

        if (SaveManager.hasSave()) {
            menuY += menuSpacing;
            this.createGildedMenuButton(width / 2, menuY, 'II. RESUME DOSSIER', () => {
                this.continueGame();
            }, '#4ac47a');
        }

        menuY += menuSpacing;
        this.createGildedMenuButton(width / 2, menuY, 'III. SETTINGS', () => {
            this.scene.launch('SettingsScene');
        });

        menuY += menuSpacing;
        this.createGildedMenuButton(width / 2, menuY, 'IV. CASE ARCHIVE & CREDITS', () => {
            if (this.clockTimer) this.clockTimer.remove();
            if (this.lightningTimer) this.lightningTimer.remove();
            this.scene.start('CreditsScene');
        });

        // Version & Developer credit footer
        this.add.text(12, height - 12, 'v1.2.0 • 16-BIT RETRO EDITION', {
            fontFamily: 'Courier New, monospace',
            fontSize: '9px',
            color: '#4a5a6e'
        }).setOrigin(0, 1);

        this.add.text(width - 12, height - 12, 'STELLARA OBSERVATORY • 1928', {
            fontFamily: 'Courier New, monospace',
            fontSize: '9px',
            color: '#4a5a6e'
        }).setOrigin(1, 1);

        // 7. Background Audio & Thunder Storm Atmosphere
        try {
            AudioManager.getInstance().init();
            AudioManager.getInstance().startMusic('menu');
        } catch(e) {}

        // Periodic clock tick synced with pendulum swing
        this.clockTimer = this.time.addEvent({
            delay: 1600,
            loop: true,
            callback: () => {
                try {
                    AudioManager.getInstance().playSFX('clockTick');
                } catch (e) {}
            }
        });

        // Atmospheric storm lightning flash
        this.lightningTimer = this.time.addEvent({
            delay: 18000,
            loop: true,
            callback: () => {
                if (!this.cameras?.main) return;
                this.cameras.main.flash(200, 210, 225, 255);
                this.time.delayedCall(350, () => {
                    try { AudioManager.getInstance().playSFX('thunder'); } catch(e) {}
                });
            }
        });

        // Audio context unlock on first user interaction
        const unlockAudio = () => {
            AudioManager.getInstance().resumeContext().then(() => {
                AudioManager.getInstance().startMusic('menu');
            }).catch(() => {
                try { AudioManager.getInstance().startMusic('menu'); } catch(e) {}
            });
        };
        this.input.once('pointerdown', unlockAudio);
        this.input.keyboard?.once('keydown', unlockAudio);

        // Fullscreen toggle shortcut
        this.input.keyboard?.on('keydown-F', () => {
            try { AudioManager.getInstance().playSFX('ui_click'); } catch(e) {}
            if (!document.fullscreenElement) {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                }
            }
        });
    }

    private createBackgroundGears() {
        const { width, height } = this.scale;

        // Big gear behind left
        const gear1 = this.add.graphics({ x: 80, y: height - 40 });
        this.drawGearShape(gear1, 70, 14, 0xd4af37, 0.08);
        this.backgroundGears.push(gear1);
        this.tweens.add({ targets: gear1, angle: 360, duration: 45000, repeat: -1 });

        // Medium gear behind right
        const gear2 = this.add.graphics({ x: width - 70, y: height - 60 });
        this.drawGearShape(gear2, 55, 12, 0xd4af37, 0.08);
        this.backgroundGears.push(gear2);
        this.tweens.add({ targets: gear2, angle: -360, duration: 35000, repeat: -1 });
    }

    private drawGearShape(g: Phaser.GameObjects.Graphics, radius: number, teeth: number, color: number, alpha: number) {
        g.fillStyle(color, alpha);
        g.beginPath();
        g.arc(0, 0, radius, 0, Math.PI * 2);
        g.fill();

        // Cut teeth
        for (let i = 0; i < teeth; i++) {
            const angle = (i / teeth) * Math.PI * 2;
            const tx = Math.cos(angle) * radius;
            const ty = Math.sin(angle) * radius;
            g.fillRect(tx - 4, ty - 4, 8, 8);
        }

        // Center cutout hole
        g.fillStyle(0x060812, 1);
        g.beginPath();
        g.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
        g.fill();

        // Spokes
        g.lineStyle(3, color, alpha);
        for (let s = 0; s < 4; s++) {
            const a = (s / 4) * Math.PI * 2;
            g.beginPath();
            g.moveTo(0, 0);
            g.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
            g.stroke();
        }
    }

    private createVictorianPendulum(pivotX: number, pivotY: number) {
        // Container positioned at the top pivot point (rotation anchor: 0,0 of container)
        this.pendulumContainer = this.add.container(pivotX, pivotY);
        this.pendulumContainer.setDepth(20);

        const arm = this.add.graphics();

        // Top Escapement bracket
        arm.fillStyle(0xd4af37, 0.9);
        arm.fillRect(-8, 0, 16, 8);
        arm.fillStyle(0xffea70, 1);
        arm.fillCircle(0, 4, 3); // pivot jewel

        // Dual brass suspension rod
        arm.lineStyle(2, 0xc49a34, 0.9);
        arm.beginPath();
        arm.moveTo(-3, 8); arm.lineTo(-3, 220);
        arm.moveTo(3, 8); arm.lineTo(3, 220);
        arm.stroke();

        // Counterweight sleeve
        arm.fillStyle(0x8a6818, 0.95);
        arm.fillRect(-6, 90, 12, 16);
        arm.fillStyle(0xd4af37, 1);
        arm.strokeRect(-6, 90, 12, 16);

        // Ornate Pendulum Bob
        const bobY = 220;
        // Outer gear ring
        arm.fillStyle(0x8a6418, 0.95);
        arm.beginPath();
        arm.arc(0, bobY, 24, 0, Math.PI * 2);
        arm.fill();

        // Polished brass face
        arm.fillStyle(0xd4af37, 1);
        arm.beginPath();
        arm.arc(0, bobY, 20, 0, Math.PI * 2);
        arm.fill();

        // Engraved Roman numerals dial (XII at top, III, VI, IX)
        arm.fillStyle(0x1a1208, 0.85);
        arm.beginPath();
        arm.arc(0, bobY, 15, 0, Math.PI * 2);
        arm.stroke();

        // Tapered bottom pointer stylus
        arm.fillStyle(0xb8860b, 1);
        arm.beginPath();
        arm.moveTo(-4, bobY + 22);
        arm.lineTo(4, bobY + 22);
        arm.lineTo(0, bobY + 34);
        arm.closePath();
        arm.fill();

        // Specular reflection highlight
        arm.fillStyle(0xfff0aa, 0.5);
        arm.beginPath();
        arm.arc(-6, bobY - 6, 6, 0, Math.PI * 2);
        arm.fill();

        this.pendulumContainer.add(arm);

        // Realistic swinging harmonic motion
        this.pendulumContainer.setAngle(-14);
        this.tweens.add({
            targets: this.pendulumContainer,
            angle: 14,
            duration: 1600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createGildedMenuButton(x: number, y: number, text: string, callback: () => void, accentColor: string = '#d4af37') {
        const btnW = 240;
        const btnH = 28;

        const container = this.add.container(x, y);
        container.setDepth(50);

        // Card backing
        const bg = this.add.graphics();
        bg.fillStyle(0x0c101c, 0.85);
        bg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
        bg.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(accentColor).color, 0.6);
        bg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);

        // Label
        const label = this.add.text(0, 0, text, {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            color: '#e6edf4',
            fontStyle: 'bold',
            letterSpacing: 1
        }).setOrigin(0.5);

        // Arrow indicator (visible on hover)
        const arrow = this.add.text(-btnW / 2 + 12, 0, '▶', {
            fontSize: '10px',
            color: accentColor
        }).setOrigin(0.5).setAlpha(0);

        container.add([bg, label, arrow]);

        // Interactive zone
        const hitZone = this.add.zone(0, 0, btnW, btnH)
            .setInteractive({ useHandCursor: true });
        container.add(hitZone);

        hitZone.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x182438, 0.95);
            bg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
            bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(accentColor).color, 1);
            bg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);

            label.setColor('#ffffff');
            label.setX(6); // slight slide right
            arrow.setAlpha(1);

            try { AudioManager.getInstance().playSFX('type_blip'); } catch(e) {}
        });

        hitZone.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x0c101c, 0.85);
            bg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
            bg.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(accentColor).color, 0.6);
            bg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);

            label.setColor('#e6edf4');
            label.setX(0);
            arrow.setAlpha(0);
        });

        hitZone.on('pointerdown', () => {
            try { AudioManager.getInstance().playSFX('ui_click'); } catch(e) {}
            callback();
        });
    }

    private startGame() {
        if (this.clockTimer) this.clockTimer.remove();
        if (this.lightningTimer) this.lightningTimer.remove();
        gameState.reset();
        storyManager.start();

        let started = false;
        const doStart = () => {
            if (started) return;
            started = true;
            this.scene.start('CutsceneScene', { cutsceneId: 'cold_open' });
        };

        try {
            this.cameras.main.resetFX();
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', doStart);
        } catch(e) {}
        this.time.delayedCall(450, doStart);
    }

    private continueGame() {
        if (this.clockTimer) this.clockTimer.remove();
        if (this.lightningTimer) this.lightningTimer.remove();
        const saveData = SaveManager.load();
        if (saveData) {
            gameState.deserialize(saveData);
            storyManager.start();
        }

        let started = false;
        const doStart = () => {
            if (started) return;
            started = true;
            this.scene.start('ExplorationScene', { roomId: gameState.getCurrentRoom() || 'main_hall' });
        };

        try {
            this.cameras.main.resetFX();
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', doStart);
        } catch(e) {}
        this.time.delayedCall(450, doStart);
    }
}
