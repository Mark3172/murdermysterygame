import Phaser from 'phaser';
import { PixelRenderer } from '../rendering/PixelRenderer';
import { PortraitRenderer } from '../rendering/PortraitRenderer';

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // Setup loading UI
        const loadingBar = document.getElementById('loading-bar');
        const loadingText = document.getElementById('loading-text');

        this.load.on('progress', (value: number) => {
            if (loadingBar) loadingBar.style.width = `${value * 100}%`;
            if (loadingText) loadingText.innerText = `Generating Assets... ${Math.round(value * 100)}%`;
        });
    }

    async create() {
        const loadingScreen = document.getElementById('loading-screen');
        const loadingContainer = document.getElementById('loading-container');
        const loadingBar = document.getElementById('loading-bar');
        const loadingText = document.getElementById('loading-text');

        const characters = ['ren', 'vale', 'nadia', 'hugo', 'petra', 'felix', 'iris'];
        const expressions = ['neutral', 'angry', 'sad', 'surprised', 'thinking', 'nervous', 'smiling'];

        const hideLoadingUI = () => {
            if (loadingScreen) loadingScreen.style.display = 'none';
            if (loadingContainer) loadingContainer.style.display = 'none';
        };

        // Safety fallback timer to ensure player is never stuck on loading screen
        const safetyTimer = setTimeout(() => {
            hideLoadingUI();
            if (!this.scene.isActive('TitleScene')) {
                this.scene.start('TitleScene');
            }
        }, 3000);

        const generateCharacterAssets = async () => {
            const totalSteps = characters.length * (1 + expressions.length);
            let currentStep = 0;

            for (let i = 0; i < characters.length; i++) {
                const char = characters[i];
                try {
                    if (PixelRenderer && PixelRenderer.generateCharacterSprite) {
                        PixelRenderer.generateCharacterSprite(this, char);
                    } else {
                        this.generateFallbackCharacterSprite(char);
                    }
                } catch (e) {
                    this.generateFallbackCharacterSprite(char);
                }
                currentStep++;
                const pct = Math.round((currentStep / totalSteps) * 90);
                if (loadingBar) loadingBar.style.width = `${pct}%`;
                if (loadingText) loadingText.innerText = `Preparing Observatory... ${pct}%`;

                for (let j = 0; j < expressions.length; j++) {
                    const expr = expressions[j];
                    try {
                        if (PortraitRenderer && PortraitRenderer.generatePortrait) {
                            PortraitRenderer.generatePortrait(this, char, expr);
                        } else {
                            this.generateFallbackPortrait(char, expr);
                        }
                    } catch (e) {
                        this.generateFallbackPortrait(char, expr);
                    }
                    currentStep++;
                    const subPct = Math.round((currentStep / totalSteps) * 90);
                    if (loadingBar) loadingBar.style.width = `${subPct}%`;
                }
                
                await new Promise(resolve => setTimeout(resolve, 8));
            }
        };

        const generateOtherAssets = async () => {
            try {
                if (PixelRenderer && PixelRenderer.generateInteractionMarker) {
                    PixelRenderer.generateInteractionMarker(this);
                } else {
                    this.generateFallbackMarker();
                }
            } catch (e) {
                this.generateFallbackMarker();
            }

            this.generateFallbackParticles();
            if (loadingBar) loadingBar.style.width = '100%';
            if (loadingText) loadingText.innerText = 'Ready!';
        };

        try {
            await generateCharacterAssets();
            await generateOtherAssets();
        } catch (e) {
            console.error('Error during preload asset generation:', e);
        }

        clearTimeout(safetyTimer);
        hideLoadingUI();

        this.scene.start('TitleScene');
    }

    private generateFallbackCharacterSprite(char: string) {
        // Create 16x24 character sprite, 16 frames total (4 directions x 4 frames)
        // A simple colored rectangle depending on char
        const canvas = this.textures.createCanvas(`char_${char}`, 16 * 4, 24 * 4);
        if (!canvas) return;
        const ctx = canvas.getContext();
        const colors: Record<string, string> = {
            ren: '#3498db', vale: '#e74c3c', nadia: '#2ecc71',
            hugo: '#f1c40f', petra: '#9b59b6', felix: '#e67e22', iris: '#1abc9c'
        };
        const color = colors[char] || '#ffffff';

        for (let dir = 0; dir < 4; dir++) {
            for (let frame = 0; frame < 4; frame++) {
                const x = frame * 16;
                const y = dir * 24;
                ctx.fillStyle = color;
                ctx.fillRect(x + 2, y + 2, 12, 20); // body
                ctx.fillStyle = '#f1c27d'; // skin
                ctx.fillRect(x + 4, y + 2, 8, 8); // head
            }
        }
        canvas.refresh();
    }

    private generateFallbackPortrait(char: string, expr: string) {
        const textureKey = `portrait_${char}_${expr}`;
        const canvas = this.textures.createCanvas(textureKey, 64, 64);
        if (!canvas) return;
        const ctx = canvas.getContext();
        const colors: Record<string, string> = {
            ren: '#3498db', vale: '#e74c3c', nadia: '#2ecc71',
            hugo: '#f1c40f', petra: '#9b59b6', felix: '#e67e22', iris: '#1abc9c'
        };
        ctx.fillStyle = colors[char] || '#ffffff';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.fillText(`${char.substring(0,3)}-${expr.substring(0,3)}`, 5, 32);
        canvas.refresh();
    }

    private generateFallbackMarker() {
        const canvas = this.textures.createCanvas('interaction_marker', 8, 8);
        if (!canvas) return;
        const ctx = canvas.getContext();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(8, 4);
        ctx.lineTo(4, 8);
        ctx.lineTo(0, 4);
        ctx.fill();
        canvas.refresh();
    }

    private generateFallbackParticles() {
        // Rain
        const p1 = this.textures.createCanvas('particle_rain', 2, 4);
        if (p1) {
            const ctx1 = p1.getContext();
            ctx1.fillStyle = '#4da6ff';
            ctx1.fillRect(0, 0, 2, 4);
            p1.refresh();
        }

        // Dust
        const p2 = this.textures.createCanvas('particle_dust', 2, 2);
        if (p2) {
            const ctx2 = p2.getContext();
            ctx2.fillStyle = '#dddddd';
            ctx2.fillRect(0, 0, 2, 2);
            p2.refresh();
        }

        // Sparks
        const p3 = this.textures.createCanvas('particle_spark', 4, 4);
        if (p3) {
            const ctx3 = p3.getContext();
            ctx3.fillStyle = '#ffaa00';
            ctx3.fillRect(0, 0, 4, 4);
            p3.refresh();
        }
    }
}
