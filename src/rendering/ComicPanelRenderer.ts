import Phaser from 'phaser';

export interface CutscenePanel {
    type: 'image' | 'text' | 'dialogue' | 'transition';
    content?: string;
    speaker?: string;
    animation?: string;
}

export class ComicPanelRenderer {
    private scene: Phaser.Scene;
    private panelContainers: Phaser.GameObjects.Container[] = [];
    private currentTweens: Phaser.Tweens.Tween[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    renderPanel(panel: CutscenePanel, onComplete: () => void, reducedMotion: boolean = false): void {
        const container = this.scene.add.container(0, 0);
        this.panelContainers.push(container);
        const { width, height } = this.scene.scale;

        const duration = reducedMotion ? 0 : 500;

        switch (panel.type) {
            case 'image':
                const bg = this.scene.add.rectangle(width/2, height/2, width * 0.8, height * 0.6, 0x0a1628);
                const border = this.createPanelBorder(width/2 - width*0.4, height/2 - height*0.3, width * 0.8, height * 0.6, 0xffffff);
                container.add([bg, border]);
                this.animateIn(container, panel.animation || 'fade_in', duration);
                setTimeout(onComplete, duration + 500);
                break;
            case 'text':
                const txt = this.scene.add.text(width/2, height/2, panel.content || '', {
                    fontFamily: 'monospace',
                    fontSize: '24px',
                    color: '#ffffff',
                    align: 'center',
                    wordWrap: { width: width * 0.8 }
                }).setOrigin(0.5);
                container.add(txt);
                this.animateIn(container, panel.animation || 'fade_in', duration);
                setTimeout(onComplete, duration + 1000);
                break;
            case 'dialogue':
                const bubble = this.createSpeechBubble(this.scene, width/2, height - 100, panel.content || '', panel.speaker || 'Unknown');
                container.add(bubble);
                this.animateIn(container, 'slide_up', duration);
                
                const textObj = bubble.getByName('text') as Phaser.GameObjects.Text;
                if (!reducedMotion && panel.content) {
                    textObj.setText('');
                    this.typewriterText(textObj, panel.content, 30, onComplete);
                } else {
                    setTimeout(onComplete, 1000);
                }
                break;
            case 'transition':
                const transBg = this.scene.add.rectangle(width/2, height/2, width, height, panel.animation === 'flash' ? 0xffffff : 0x000000);
                container.add(transBg);
                
                if (!reducedMotion) {
                    transBg.alpha = 0;
                    this.scene.tweens.add({
                        targets: transBg,
                        alpha: 1,
                        duration: duration,
                        yoyo: panel.animation === 'flash',
                        onComplete: () => {
                            if (panel.animation !== 'flash') {
                                setTimeout(onComplete, 500);
                            } else {
                                onComplete();
                            }
                        }
                    });
                } else {
                    setTimeout(onComplete, 100);
                }
                break;
        }
    }

    private animateIn(container: Phaser.GameObjects.Container, animation: string, duration: number): void {
        if (duration <= 0) return;

        const startY = container.y;
        const startX = container.x;

        if (animation === 'fade_in') {
            container.alpha = 0;
            this.scene.tweens.add({ targets: container, alpha: 1, duration });
        } else if (animation === 'slide_up') {
            container.y = startY + 50;
            container.alpha = 0;
            this.scene.tweens.add({ targets: container, y: startY, alpha: 1, duration, ease: 'Back.out' });
        }
        // Simplified for other animations...
    }

    private createSpeechBubble(scene: Phaser.Scene, x: number, y: number, text: string, speaker: string): Phaser.GameObjects.Container {
        const bubble = scene.add.container(x, y);
        const w = scene.scale.width * 0.9;
        const h = 120;
        
        const bg = scene.add.graphics();
        bg.fillStyle(0x0a1628, 0.9);
        bg.lineStyle(2, 0xffffff);
        bg.fillRoundedRect(-w/2, -h/2, w, h, 8);
        bg.strokeRoundedRect(-w/2, -h/2, w, h, 8);

        const speakerTxt = scene.add.text(-w/2 + 20, -h/2 + 10, speaker.toUpperCase(), {
            fontFamily: 'monospace', fontSize: '16px', color: '#c4a44a'
        });
        
        const contentTxt = scene.add.text(-w/2 + 20, -h/2 + 35, text, {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
            wordWrap: { width: w - 40 }
        }).setName('text');

        bubble.add([bg, speakerTxt, contentTxt]);
        return bubble;
    }

    private typewriterText(textObj: Phaser.GameObjects.Text, fullText: string, speed: number, onComplete: () => void): void {
        let i = 0;
        const timer = this.scene.time.addEvent({
            delay: speed,
            repeat: fullText.length - 1,
            callback: () => {
                i++;
                textObj.setText(fullText.substring(0, i));
                if (i === fullText.length) {
                    setTimeout(onComplete, 500);
                }
            }
        });
    }

    private createPanelBorder(x: number, y: number, width: number, height: number, color: number): Phaser.GameObjects.Graphics {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(4, color);
        graphics.strokeRect(x, y, width, height);
        graphics.lineStyle(2, 0x000000); // shadow
        graphics.strokeRect(x+2, y+2, width, height);
        return graphics;
    }

    clear(): void {
        this.panelContainers.forEach(c => c.destroy());
        this.panelContainers = [];
        this.currentTweens.forEach(t => t.stop());
        this.currentTweens = [];
    }
}
