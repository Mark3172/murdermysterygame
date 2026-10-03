import { Scene } from 'phaser';
import { cutscenes, CutsceneData, CutscenePanel } from '../data/cutscenes';
import { gameState } from '../logic/GameState';
import { AudioManager } from '../engine/AudioManager';
import { storyManager } from '../logic/StoryPhaseManager';
import { PortraitRenderer } from '../rendering/PortraitRenderer';

export class CutsceneScene extends Scene {
  private cutsceneId: string = '';
  private currentPanelIndex: number = 0;
  private cutsceneData: CutsceneData | null = null;
  private panelContainer!: Phaser.GameObjects.Container;
  private isTransitioning: boolean = false;
  private typeWriterTimer?: Phaser.Time.TimerEvent;
  private autoAdvanceTimer?: Phaser.Time.TimerEvent;
  private uiContainer!: Phaser.GameObjects.Container;
  private panelCounterText!: Phaser.GameObjects.Text;
  
  constructor() {
    super('CutsceneScene');
  }

  init(data: any) {
    this.cutsceneId = data.cutsceneId || 'cold_open';
    this.currentPanelIndex = 0;
    this.isTransitioning = false;
  }

  create() {
    this.cutsceneData = cutscenes[this.cutsceneId];
    if (!this.cutsceneData) {
        console.warn(`Cutscene ${this.cutsceneId} not found, falling back.`);
        this.finishCutscene();
        return;
    }

    this.cameras.main.fadeIn(500, 0, 0, 0);

    this.panelContainer = this.add.container(0, 0);
    this.uiContainer = this.add.container(0, 0);
    this.uiContainer.setDepth(100);

    const { width, height } = this.scale;

    // Skip button
    const skipButton = this.add.text(width - 15, 12, '✕ Skip [ESC]', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#aaaaaa',
        backgroundColor: '#111524',
        padding: { x: 8, y: 4 }
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    
    skipButton.on('pointerdown', () => {
        this.finishCutscene();
    });
    skipButton.on('pointerover', () => skipButton.setColor('#d4af37'));
    skipButton.on('pointerout', () => skipButton.setColor('#aaaaaa'));
    
    this.uiContainer.add(skipButton);

    // Panel counter
    this.panelCounterText = this.add.text(width - 15, height - 12, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#667788'
    }).setOrigin(1, 1);
    this.uiContainer.add(this.panelCounterText);

    // Inputs
    this.input.on('pointerdown', this.handleAdvance, this);
    this.input.keyboard?.on('keydown-SPACE', this.handleAdvance, this);
    this.input.keyboard?.on('keydown-ESC', () => this.finishCutscene());

    this.showPanel();
  }
  
  private showPanel() {
    if (!this.cutsceneData) return;
    
    if (this.currentPanelIndex >= this.cutsceneData.panels.length) {
        this.finishCutscene();
        return;
    }

    this.isTransitioning = true;
    const panel = this.cutsceneData.panels[this.currentPanelIndex];
    
    this.panelCounterText.setText(`${this.currentPanelIndex + 1}/${this.cutsceneData.panels.length}`);
    
    // Clear previous panel
    this.panelContainer.removeAll(true);
    
    if (this.typeWriterTimer) {
        this.typeWriterTimer.destroy();
        this.typeWriterTimer = undefined;
    }
    if (this.autoAdvanceTimer) {
        this.autoAdvanceTimer.destroy();
        this.autoAdvanceTimer = undefined;
    }
    
    // Process flags and evidence
    if (panel.setFlag) {
        gameState.setDialogueFlag(panel.setFlag);
    }
    if (panel.giveEvidence) {
        gameState.collectEvidence(panel.giveEvidence);
    }
    
    // Process sound
    if (panel.sound) {
        AudioManager.getInstance().playSFX(panel.sound);
    }

    const { width, height } = this.scale;
    const panelBgColor = panel.backgroundColor ? Phaser.Display.Color.HexStringToColor(panel.backgroundColor).color : 0x0a0c16;
    
    // Render based on type
    if (panel.type === 'image') {
        const bg = this.add.rectangle(0, 0, width, height, panelBgColor).setOrigin(0, 0);
        this.panelContainer.add(bg);
        
        if (panel.elements) {
            panel.elements.forEach(el => {
                const color = el.color ? Phaser.Display.Color.HexStringToColor(el.color).color : 0xffffff;
                if (el.type === 'rect') {
                    const rect = this.add.rectangle(el.x, el.y, el.width || 80, el.height || 60, color).setOrigin(0.5);
                    this.panelContainer.add(rect);
                } else if (el.type === 'circle') {
                    const circle = this.add.circle(el.x, el.y, el.width ? el.width / 2 : 30, color).setOrigin(0.5);
                    this.panelContainer.add(circle);
                } else if (el.type === 'text') {
                    const txt = this.add.text(el.x, el.y, el.text || '', {
                        fontFamily: 'serif',
                        fontSize: `${Math.min(el.fontSize || 18, 22)}px`,
                        color: el.color || '#ffffff'
                    }).setOrigin(0.5);
                    this.panelContainer.add(txt);
                } else if (el.type === 'line') {
                    const line = this.add.line(0, 0, el.x, el.y, el.x + (el.width || 0), el.y + (el.height || 0), color).setOrigin(0);
                    this.panelContainer.add(line);
                }
            });
        }
    } else if (panel.type === 'text') {
        const bg = this.add.rectangle(0, 0, width, height, panelBgColor).setOrigin(0, 0);
        this.panelContainer.add(bg);
        
        const txt = this.add.text(width / 2, height / 2, '', {
            fontFamily: 'Georgia, serif',
            fontSize: `${Math.min(panel.textSize || 16, 20)}px`,
            color: panel.textColor || '#f0e6d2',
            align: 'center',
            lineSpacing: 8,
            wordWrap: { width: width * 0.75 }
        }).setOrigin(0.5);
        this.panelContainer.add(txt);
        this.typewriterEffect(txt, panel.text || '');
    } else if (panel.type === 'dialogue') {
        const bg = this.add.rectangle(0, 0, width, height, panelBgColor).setOrigin(0, 0);
        this.panelContainer.add(bg);

        // Letterbox dialogue panel at bottom with cinematic Victorian gold border
        const boxH = 96;
        const boxY = height - boxH - 12;
        const boxBg = this.add.rectangle(18, boxY, width - 36, boxH, 0x090c18, 0.96).setOrigin(0, 0);
        const boxBorder = this.add.graphics();
        boxBorder.lineStyle(2, 0xd4af37, 0.85);
        boxBorder.strokeRect(18, boxY, width - 36, boxH);
        // Corner decorative accents
        boxBorder.fillStyle(0xd4af37, 1);
        boxBorder.fillRect(18, boxY, 6, 2); boxBorder.fillRect(18, boxY, 2, 6);
        boxBorder.fillRect(width - 24, boxY, 6, 2); boxBorder.fillRect(width - 20, boxY, 2, 6);
        boxBorder.fillRect(18, boxY + boxH - 2, 6, 2); boxBorder.fillRect(18, boxY + boxH - 6, 2, 6);
        boxBorder.fillRect(width - 24, boxY + boxH - 2, 6, 2); boxBorder.fillRect(width - 20, boxY + boxH - 6, 2, 6);
        this.panelContainer.add([boxBg, boxBorder]);

        // Real 64x64 Pixel Art Bust Portrait from PortraitRenderer
        const speakerIdMap: Record<string, string> = {
            'Ren': 'ren',
            'Dr. Vale': 'vale',
            'Nadia': 'nadia',
            'Nadia Thorn': 'nadia',
            'Hugo': 'hugo',
            'Dr. Hugo': 'hugo',
            'Petra': 'petra',
            'Petra Solano': 'petra',
            'Felix': 'felix',
            'Felix Ashworth': 'felix',
            'Iris': 'iris',
            'Iris Blackwell': 'iris',
            'Prof. Sable': 'aldric',
            'Professor Sable': 'aldric',
            'Aldric': 'aldric'
        };
        const charId = speakerIdMap[panel.speaker || ''] || 'ren';
        const portraitKey = PortraitRenderer.generatePortrait(this, charId, 'neutral');
        const portraitSprite = this.add.image(58, boxY + boxH/2, portraitKey).setDisplaySize(58, 58);
        this.panelContainer.add(portraitSprite);

        // Speaker name with gold badge
        const speakerTxt = this.add.text(98, boxY + 10, (panel.speaker || '???').toUpperCase(), {
            fontFamily: 'Courier New, monospace',
            fontSize: '11px',
            color: '#ffd700',
            fontStyle: 'bold',
            backgroundColor: '#162238',
            padding: { x: 8, y: 3 }
        }).setOrigin(0, 0);
        this.panelContainer.add(speakerTxt);

        // Dialogue text
        const dialogTxt = this.add.text(98, boxY + 34, '', {
            fontFamily: 'Georgia, serif',
            fontSize: '13px',
            color: panel.textColor || '#edf2f8',
            lineSpacing: 5,
            wordWrap: { width: width - 145 }
        }).setOrigin(0, 0);
        this.panelContainer.add(dialogTxt);
        this.typewriterEffect(dialogTxt, panel.dialogue || '');

        // Prompt
        const prompt = this.add.text(width - 32, boxY + boxH - 14, '▼ [SPACE] / Click', {
            fontFamily: 'Courier New, monospace',
            fontSize: '9px',
            color: '#7ac4d4',
            fontStyle: 'bold'
        }).setOrigin(1, 0.5);
        this.panelContainer.add(prompt);
    } else if (panel.type === 'transition') {
        const bg = this.add.rectangle(0, 0, width, height, panelBgColor).setOrigin(0, 0);
        this.panelContainer.add(bg);
    }
    
    // Apply animations
    this.panelContainer.setAlpha(1);
    this.panelContainer.setPosition(0, 0);
    this.panelContainer.setScale(1);
    
    const anim = panel.animation || 'none';
    
    if (anim === 'fade_in') {
        this.panelContainer.setAlpha(0);
        this.tweens.add({
            targets: this.panelContainer,
            alpha: 1,
            duration: panel.duration || 1000,
            onComplete: () => { this.isTransitioning = false; }
        });
    } else if (anim === 'slide_left') {
        this.panelContainer.setX(width);
        this.tweens.add({
            targets: this.panelContainer,
            x: 0,
            duration: panel.duration || 800,
            ease: 'Power2',
            onComplete: () => { this.isTransitioning = false; }
        });
    } else if (anim === 'slide_right') {
        this.panelContainer.setX(-width);
        this.tweens.add({
            targets: this.panelContainer,
            x: 0,
            duration: panel.duration || 800,
            ease: 'Power2',
            onComplete: () => { this.isTransitioning = false; }
        });
    } else if (anim === 'slide_up') {
        this.panelContainer.setY(height);
        this.tweens.add({
            targets: this.panelContainer,
            y: 0,
            duration: panel.duration || 800,
            ease: 'Power2',
            onComplete: () => { this.isTransitioning = false; }
        });
    } else if (anim === 'zoom_in') {
        this.panelContainer.setScale(0.5);
        this.panelContainer.setAlpha(0);
        this.tweens.add({
            targets: this.panelContainer,
            scale: 1,
            alpha: 1,
            duration: panel.duration || 1000,
            ease: 'Back.easeOut',
            onComplete: () => { this.isTransitioning = false; }
        });
    } else if (anim === 'shake') {
        this.cameras.main.shake(panel.duration || 500, 0.05);
        this.isTransitioning = false;
    } else if (anim === 'flash') {
        this.cameras.main.flash(panel.duration || 500);
        this.isTransitioning = false;
    } else {
        this.isTransitioning = false;
    }
    
    // Auto advance
    if (panel.autoAdvance) {
        const delay = panel.autoAdvanceDelay || 2000;
        this.autoAdvanceTimer = this.time.delayedCall(delay, () => {
            this.handleAdvance();
        });
    }
  }
  
  private typewriterEffect(textObj: Phaser.GameObjects.Text, fullText: string) {
    let charIndex = 0;
    this.typeWriterTimer = this.time.addEvent({
        delay: 30,
        callback: () => {
            charIndex++;
            textObj.setText(fullText.substring(0, charIndex));
            if (charIndex >= fullText.length) {
                if (this.typeWriterTimer) {
                    this.typeWriterTimer.destroy();
                    this.typeWriterTimer = undefined;
                }
            }
        },
        repeat: fullText.length - 1
    });
  }

  private handleAdvance() {
    if (this.autoAdvanceTimer) {
        this.autoAdvanceTimer.destroy();
        this.autoAdvanceTimer = undefined;
    }
    
    if (this.typeWriterTimer) {
        const panel = this.cutsceneData?.panels[this.currentPanelIndex];
        if (panel) {
            this.panelContainer.list.forEach((child: any) => {
                if (child.type === 'Text' && child.text !== panel.speaker) {
                    if (panel.type === 'text') child.setText(panel.text || '');
                    if (panel.type === 'dialogue') child.setText(panel.dialogue || '');
                }
            });
        }
        this.typeWriterTimer.destroy();
        this.typeWriterTimer = undefined;
        return;
    }

    if (!this.isTransitioning) {
        this.currentPanelIndex++;
        this.showPanel();
    }
  }

  private finishCutscene() {
    gameState.markCutsceneSeen(this.cutsceneId);

    // Advance story phase
    if (['cold_open', 'opening_title', 'discovery_scene', 'midpoint_reversal', 'final_reveal'].includes(this.cutsceneId)) {
        storyManager.advancePhase();
    }

    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
        switch(this.cutsceneId) {
            case 'cold_open':
                this.scene.start('CutsceneScene', { cutsceneId: 'opening_title' });
                break;
            case 'opening_title':
                this.scene.start('CutsceneScene', { cutsceneId: 'discovery_scene' });
                break;
            case 'discovery_scene':
            case 'midpoint_reversal':
                this.scene.start('ExplorationScene', { roomId: 'main_hall' });
                break;
            case 'final_reveal':
                this.scene.start('CutsceneScene', { cutsceneId: 'ending' });
                break;
            case 'ending':
                this.scene.start('CreditsScene');
                break;
            case 'credits_scene':
                this.scene.start('CutsceneScene', { cutsceneId: 'post_credits' });
                break;
            case 'post_credits':
                this.scene.start('TitleScene');
                break;
            default:
                this.scene.start('ExplorationScene');
                break;
        }
    });
  }
}
