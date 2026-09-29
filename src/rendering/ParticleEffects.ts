import Phaser from 'phaser';

export class ParticleEffects {
    private static ensureTexture(scene: Phaser.Scene, key: string, size: number, color: string, alpha: number = 1) {
        if (!scene.textures.exists(key)) {
            const canvas = scene.textures.createCanvas(key, size, size);
            if (canvas) {
                const ctx = canvas.getContext();
                ctx.fillStyle = color;
                ctx.globalAlpha = alpha;
                ctx.fillRect(0, 0, size, size);
                canvas.refresh();
            }
        }
    }

    static createRainEffect(scene: Phaser.Scene): Phaser.GameObjects.Particles.ParticleEmitter {
        this.ensureTexture(scene, 'particle_rain', 2, '#ffffff', 0.5);
        return scene.add.particles(0, 0, 'particle_rain', {
            x: { min: 0, max: scene.scale.width },
            y: -10,
            lifespan: 1500,
            speedY: { min: 300, max: 500 },
            speedX: { min: 50, max: 100 },
            angle: 90,
            gravityY: 200,
            quantity: 2,
            frequency: 10,
            scaleY: 4
        });
    }

    static createDustEffect(scene: Phaser.Scene): Phaser.GameObjects.Particles.ParticleEmitter {
        this.ensureTexture(scene, 'particle_dust', 2, '#c4a44a', 0.6);
        return scene.add.particles(0, 0, 'particle_dust', {
            x: { min: 0, max: scene.scale.width },
            y: { min: 0, max: scene.scale.height },
            lifespan: { min: 3000, max: 8000 },
            speedX: { min: -10, max: 10 },
            speedY: { min: -5, max: 5 },
            alpha: { start: 0, end: 0, ease: (t: number) => t < 0.5 ? t * 2 : 2 - t * 2 },
            quantity: 1,
            frequency: 200
        });
    }

    static createLightningFlash(scene: Phaser.Scene): void {
        const flash = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0xffffff);
        flash.setOrigin(0, 0);
        flash.setDepth(1000);
        
        scene.cameras.main.shake(200, 0.01);
        
        scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                flash.destroy();
            }
        });
    }

    static createClockworkSparks(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Particles.ParticleEmitter {
        this.ensureTexture(scene, 'particle_spark', 2, '#c4a44a', 1);
        return scene.add.particles(x, y, 'particle_spark', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            gravityY: 300,
            lifespan: { min: 200, max: 500 },
            quantity: 5,
            frequency: 500,
            alpha: { start: 1, end: 0 }
        });
    }

    static createGhostOverlay(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
        const graphics = scene.add.graphics();
        graphics.fillStyle(0x2a5a5a, 0.3);
        graphics.fillRect(0, 0, scene.scale.width, scene.scale.height);
        graphics.setDepth(999);
        return graphics;
    }
}
