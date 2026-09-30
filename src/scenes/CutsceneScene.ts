import { Scene } from 'phaser';
import { cutscenes, CutsceneData, CutscenePanel } from '../data/cutscenes';
import { gameState } from '../logic/GameState';
import { AudioManager } from '../engine/AudioManager';
import { storyManager } from '../logic/StoryPhaseManager';

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
    const skipButton = this.add.text(width - 20, 20, 'Skip', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#aaaaaa'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    
    skipButton.on('pointerdown', () => {
        this.finishCutscene();
    });
    skipButton.on('pointerover', () => skipButton.setColor('#ffffff'));
    skipButton.on('pointerout', () => skipButton.setColor('#aaaaaa'));
    
    this.uiContainer.add(skipButton);

    // Panel counter
    this.panelCounterText = this.add.text(width - 20, height - 20, '', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#888888'
    }).setOrigin(1, 1);
    this.uiContainer.add(this.panelCounterText);

    // Inputs
    this.input.on('pointerdown', this.handleAdvance, this);
    this.input.keyboard?.on('keydown-SPACE', this.handleAdvance, this);

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
    const panelBgColor = panel.backgroundColor ? Phaser.Display.Color.HexStringToColor(panel.backgroundColor).color : 0x000000;
    
    // Render based on type
    if (panel.type === 'image') {
        const bg = this.add.rectangle(0, 0, width, height, panelBgColor).setOrigin(0, 0);
        this.panelContainer.add(bg);
        
        if (panel.elements) {
            panel.elements.forEach(el => {
                const color = el.color ? Phaser.Display.Color.HexStringToColor(el.color).color : 0xffffff;
                if (el.type === 'rect') {
                    const rect = this.add.rectangle(el.x, el.y, el.width || 100, el.height || 100, color).setOrigin(0.5);
                    this.panelContainer.add(rect);
                } else if (el.type === 'circle') {
                    const circle = this.add.circle(el.x, el.y, el.width ? el.width / 2 : 50, color).setOrigin(0.5);
                    this.panelContainer.add(circle);
                } else if (el.type === 'text') {
                    const txt = this.add.text(el.x, el.y, el.text || '', {
                        fontFamily: 'Arial',
                        fontSize: `${el.fontSize || 24}px`,
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
            fontFamily: 'Arial',
            fontSize: `${panel.textSize || 32}px`,
            color: panel.textColor || '#ffffff',
            align: 'center',
            wordWrap: { width: width * 0.8 }
        }).setOrigin(0.5);
        this.panelContainer.add(txt);
        this.typewriterEffect(txt, panel.text || '');
    } else if (panel.type === 'dialogue') {
        const bg = this.add.rectangle(0, 0, width, height, panelBgColor).setOrigin(0, 0);
        this.panelContainer.add(bg);
        
        // Portrait
        let charColor = 0x888888;
        if (panel.speaker === 'Detective') charColor = 0x224488;
        else if (panel.speaker === 'Victim') charColor = 0x882222;
        const portrait = this.add.rectangle(150, height - 150, 100, 100, charColor).setOrigin(0.5);
        this.panelContainer.add(portrait);
        
        // Speaker name
        const speakerTxt = this.add.text(220, height - 200, panel.speaker || '???', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#d4af37',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        this.panelContainer.add(speakerTxt);
        
        // Dialogue text
        const dialogTxt = this.add.text(220, height - 160, '', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: panel.textColor || '#ffffff',
            wordWrap: { width: width - 260 }
        }).setOrigin(0, 0);
        this.panelContainer.add(dialogTxt);
        this.typewriterEffect(dialogTxt, panel.dialogue || '');
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
    if (['cold_open', 'discovery_scene', 'midpoint_reversal', 'final_reveal'].includes(this.cutsceneId)) {
        storyManager.advancePhase();
    }

    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
        switch(this.cutsceneId) {
            case 'cold_open':
                this.scene.start('CutsceneScene', { cutsceneId: 'opening_title' });
                break;
            case 'opening_title':
                this.scene.start('ExplorationScene', { roomId: 'main_hall' });
                break;
            case 'discovery_scene':
            case 'midpoint_reversal':
                this.scene.start('ExplorationScene');
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
