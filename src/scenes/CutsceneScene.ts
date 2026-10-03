import { Scene } from 'phaser';
import { cutscenes, CutsceneData, CutscenePanel } from '../data/cutscenes';
import { gameState } from '../logic/GameState';
import { AudioManager } from '../engine/AudioManager';
import { storyManager } from '../logic/StoryPhaseManager';
import { PortraitRenderer } from '../rendering/PortraitRenderer';
import { PixelRenderer } from '../rendering/PixelRenderer';

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
        
        if (this.renderSpecialCinematicIllustration(panel, width, height)) {
            // Handled with authentic Victorian noir illustration
        } else if (panel.elements) {
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

  private renderSpecialCinematicIllustration(panel: CutscenePanel, width: number, height: number): boolean {
    const cid = this.cutsceneId;
    const pIdx = this.currentPanelIndex;

    // 1. cold_open Panel 0: Stellara Mountain Observatory in storm
    if (cid === 'cold_open' && pIdx === 0) {
      const g = this.add.graphics();
      // Storm sky gradient
      g.fillGradientStyle(0x060812, 0x060812, 0x10172c, 0x161e38, 1);
      g.fillRect(0, 0, width, height);

      // Jagged Stellara mountain peaks
      g.fillStyle(0x0c1224, 1);
      g.beginPath();
      g.moveTo(0, height);
      g.lineTo(0, 220);
      g.lineTo(80, 170);
      g.lineTo(180, 210);
      g.lineTo(320, 130); // Observatory summit
      g.lineTo(460, 205);
      g.lineTo(560, 165);
      g.lineTo(width, 230);
      g.lineTo(width, height);
      g.closePath();
      g.fillPath();

      // Observatory Victorian dome silhouette
      g.fillStyle(0x05070e, 1);
      g.fillRect(275, 140, 90, 70);
      g.beginPath();
      g.arc(320, 140, 45, Math.PI, 0);
      g.fill();

      // Glowing observation telescope slit
      g.fillStyle(0xd4af37, 0.7);
      g.fillRect(317, 100, 6, 50);
      g.fillStyle(0xfff4be, 0.9);
      g.fillCircle(320, 112, 3);

      // Warm arched windows
      g.fillStyle(0xffd700, 0.5);
      g.fillRect(288, 155, 10, 16);
      g.fillRect(342, 155, 10, 16);

      // Lightning strike
      const bolt = this.add.graphics();
      bolt.lineStyle(2, 0xc8e2ff, 0.95);
      bolt.beginPath();
      bolt.moveTo(130, 20);
      bolt.lineTo(190, 70);
      bolt.lineTo(165, 100);
      bolt.lineTo(240, 150);
      bolt.lineTo(315, 105);
      bolt.stroke();
      this.tweens.add({ targets: bolt, alpha: { from: 1, to: 0 }, duration: 400, delay: 200 });

      // Title banner at top
      const banner = this.add.text(width / 2, 50, '✦ STELLARA MOUNTAIN OBSERVATORY • 7:55 PM ✦', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#ffd700',
        stroke: '#05070e',
        strokeThickness: 3,
        letterSpacing: 1.5
      }).setOrigin(0.5);

      this.panelContainer.add([g, bolt, banner]);
      return true;
    }

    // 2. cold_open Panel 2: The Clockwork Movement
    if (cid === 'cold_open' && pIdx === 2) {
      const g = this.add.graphics();
      g.fillGradientStyle(0x0b0d18, 0x0b0d18, 0x141828, 0x181e32, 1);
      g.fillRect(0, 0, width, height);

      // Large interlocking brass clockwork gears in background
      g.lineStyle(3, 0x8a6828, 0.4);
      g.strokeCircle(240, 140, 65);
      g.strokeCircle(400, 180, 85);

      // Clock face outer brass housing
      g.fillStyle(0x182030, 1);
      g.fillCircle(320, 160, 84);
      g.lineStyle(3, 0xd4af37, 0.95);
      g.strokeCircle(320, 160, 84);

      // Ivory clock dial
      g.fillStyle(0xede8d2, 1);
      g.fillCircle(320, 160, 74);
      g.lineStyle(1.5, 0x5a4828, 0.6);
      g.strokeCircle(320, 160, 66);

      // Roman numerals on dial
      const numerals = [
        { text: 'XII', x: 320, y: 104 },
        { text: 'III', x: 376, y: 160 },
        { text: 'VI', x: 320, y: 216 },
        { text: 'IX', x: 264, y: 160 }
      ];
      numerals.forEach(n => {
        const t = this.add.text(n.x, n.y, n.text, {
          fontFamily: 'Georgia, serif',
          fontSize: '11px',
          color: '#221a10',
          fontStyle: 'bold'
        }).setOrigin(0.5);
        this.panelContainer.add(t);
      });

      // Clock hands (pointing to 7:58)
      g.lineStyle(2, 0x141620, 1);
      g.beginPath();
      g.moveTo(320, 160); g.lineTo(290, 190); // Hour hand toward VIII
      g.moveTo(320, 160); g.lineTo(315, 108); // Minute hand toward XII
      g.stroke();
      g.fillStyle(0xd4af37, 1);
      g.fillCircle(320, 160, 4);

      // Pendulum swinging below
      const pend = this.add.graphics();
      pend.lineStyle(2, 0xd4af37, 0.9);
      pend.beginPath();
      pend.moveTo(320, 160); pend.lineTo(320, 260);
      pend.stroke();
      pend.fillStyle(0xd4af37, 1);
      pend.fillCircle(320, 260, 16);
      pend.fillStyle(0xffea70, 0.7);
      pend.fillCircle(320, 260, 8);

      const pendContainer = this.add.container(0, 0, [pend]);
      this.tweens.add({
        targets: pendContainer,
        x: { from: -14, to: 14 },
        yoyo: true,
        repeat: -1,
        duration: 900,
        ease: 'Sine.easeInOut'
      });

      // Subtitle
      const sub = this.add.text(width / 2, 310, 'Tick.   Tock.   Tick.   Tock.', {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#c0d4e8',
        letterSpacing: 2
      }).setOrigin(0.5);

      this.panelContainer.add([g, pendContainer, sub]);
      return true;
    }

    // 3. cold_open Panel 3: Shattered Pocket Watch
    if (cid === 'cold_open' && pIdx === 3) {
      const g = this.add.graphics();
      g.fillStyle(0x06060c, 1);
      g.fillRect(0, 0, width, height);

      // Dark velvet surface
      g.fillStyle(0x120c16, 0.9);
      g.fillCircle(320, 160, 120);

      // Gold ornate pocket watch case
      g.fillStyle(0xd4af37, 1);
      g.fillCircle(320, 160, 72);
      // Winding stem & ring at top
      g.fillRect(316, 76, 8, 12);
      g.lineStyle(2.5, 0xd4af37, 1);
      g.strokeCircle(320, 72, 10);

      // Watch enamel dial
      g.fillStyle(0xf6f0da, 1);
      g.fillCircle(320, 160, 62);
      g.lineStyle(1.5, 0x6a5430, 0.7);
      g.strokeCircle(320, 160, 56);

      // Hands frozen at exactly 8:00
      g.lineStyle(2.5, 0x1a1210, 1);
      g.beginPath();
      g.moveTo(320, 160); g.lineTo(320, 114); // Minute hand directly at XII
      g.moveTo(320, 160); g.lineTo(282, 185); // Hour hand at VIII
      g.stroke();
      g.fillStyle(0xd4af37, 1);
      g.fillCircle(320, 160, 4);

      // Intricate glass fractures
      g.lineStyle(1.5, 0x4477aa, 0.85);
      g.beginPath();
      g.moveTo(320, 160); g.lineTo(270, 130);
      g.moveTo(290, 140); g.lineTo(260, 175);
      g.moveTo(320, 160); g.lineTo(365, 145);
      g.moveTo(345, 150); g.lineTo(375, 185);
      g.moveTo(320, 160); g.lineTo(315, 215);
      g.stroke();

      // Warning text
      const warn = this.add.text(width / 2, 280, 'A trembling hand drops a shattered pocket watch...', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#ff6b6b',
        fontStyle: 'italic',
        letterSpacing: 0.5
      }).setOrigin(0.5);

      this.panelContainer.add([g, warn]);
      return true;
    }

    // 4. cold_open Panel 5: The Great Bronze Bell & 13th Chime
    if (cid === 'cold_open' && pIdx === 5) {
      const g = this.add.graphics();
      g.fillStyle(0x050711, 1);
      g.fillRect(0, 0, width, height);

      // Expanding acoustic resonance soundwaves
      const wave1 = this.add.circle(320, 150, 40, 0x4ac4d4, 0).setStrokeStyle(2, 0x4ac4d4, 0.8);
      const wave2 = this.add.circle(320, 150, 80, 0x2a9ab4, 0).setStrokeStyle(2, 0x2a9ab4, 0.6);
      const wave3 = this.add.circle(320, 150, 120, 0xd4af37, 0).setStrokeStyle(2, 0xd4af37, 0.4);

      this.tweens.add({ targets: wave1, scale: 1.8, alpha: 0, duration: 1600, repeat: -1 });
      this.tweens.add({ targets: wave2, scale: 1.8, alpha: 0, duration: 1600, delay: 400, repeat: -1 });
      this.tweens.add({ targets: wave3, scale: 1.8, alpha: 0, duration: 1600, delay: 800, repeat: -1 });

      // Great Bronze Bell silhouette
      g.fillStyle(0xd4af37, 1);
      g.beginPath();
      // Bell crown and body
      g.moveTo(300, 110);
      g.lineTo(340, 110);
      g.lineTo(352, 170);
      g.lineTo(365, 185);
      g.lineTo(275, 185);
      g.lineTo(288, 170);
      g.closePath();
      g.fillPath();

      // Bell lip & clapper
      g.fillStyle(0xb89228, 1);
      g.fillEllipse(320, 185, 90, 18);
      g.fillStyle(0x2a1c0c, 1);
      g.fillCircle(320, 188, 7);

      const chimeText = this.add.text(width / 2, 260, '✦ DING... DING... DING... ✦', {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#ffd700',
        fontStyle: 'bold',
        letterSpacing: 2
      }).setOrigin(0.5);

      const subText = this.add.text(width / 2, 298, 'Twelve chimes for eight o\'clock. But then...', {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: '#a0c0d8',
        fontStyle: 'italic'
      }).setOrigin(0.5);

      this.panelContainer.add([g, wave1, wave2, wave3, chimeText, subText]);
      return true;
    }

    // 5. opening_title Panel 0: Title Sequence with Ren & Dr. Vale
    if (cid === 'opening_title' && pIdx === 0) {
      const g = this.add.graphics();
      // Deep obsidian card
      g.fillStyle(0x080c18, 1);
      g.fillRect(10, 10, width - 20, height - 20);

      // Double Victorian Gold Border with Corner Ornaments
      g.lineStyle(2, 0xd4af37, 0.9);
      g.strokeRect(10, 10, width - 20, height - 20);
      g.lineStyle(1, 0x8a6a28, 0.5);
      g.strokeRect(16, 16, width - 32, height - 32);

      // Corner filigree studs
      g.fillStyle(0xd4af37, 1);
      g.fillCircle(14, 14, 3);
      g.fillCircle(width - 14, 14, 3);
      g.fillCircle(14, height - 14, 3);
      g.fillCircle(width - 14, height - 14, 3);

      // Title & Episode Subtitle
      const title = this.add.text(width / 2, 60, 'THE THIRTEENTH CHIME', {
        fontFamily: 'Georgia, serif',
        fontSize: '26px',
        color: '#f6d888',
        fontStyle: 'bold',
        stroke: '#080a14',
        strokeThickness: 4,
        letterSpacing: 2
      }).setOrigin(0.5);

      const subtitle = this.add.text(width / 2, 92, 'EPISODE 01: THE CLOCKWORK OBSERVATORY', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#88a6c8',
        fontStyle: 'bold',
        letterSpacing: 2
      }).setOrigin(0.5);

      // Wing divider
      g.lineStyle(1.5, 0xd4af37, 0.8);
      g.beginPath();
      g.moveTo(180, 108); g.lineTo(280, 108);
      g.moveTo(360, 108); g.lineTo(460, 108);
      g.stroke();
      g.fillStyle(0xd4af37, 1);
      g.fillCircle(width / 2, 108, 3);

      // Character Card 1: Ren Kasuga
      const rCardX = 220, rCardY = 225;
      g.fillStyle(0x0f1828, 1);
      g.fillRect(rCardX - 52, rCardY - 80, 104, 140);
      g.lineStyle(1.5, 0xd4af37, 0.7);
      g.strokeRect(rCardX - 52, rCardY - 80, 104, 140);

      const renKey = PortraitRenderer.generatePortrait(this, 'ren', 'neutral');
      const renImg = this.add.image(rCardX, rCardY - 26, renKey).setDisplaySize(60, 60);

      const renName = this.add.text(rCardX, rCardY + 16, 'REN KASUGA', {
        fontFamily: 'Georgia, serif',
        fontSize: '11px',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const renRole = this.add.text(rCardX, rCardY + 34, 'Detective', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: '#7ab4f8'
      }).setOrigin(0.5);

      // Character Card 2: Dr. Mira Vale
      const vCardX = 420, vCardY = 225;
      g.fillStyle(0x0d1f1c, 1);
      g.fillRect(vCardX - 52, vCardY - 80, 104, 140);
      g.lineStyle(1.5, 0xd4af37, 0.7);
      g.strokeRect(vCardX - 52, rCardY - 80, 104, 140);

      const valeKey = PortraitRenderer.generatePortrait(this, 'vale', 'neutral');
      const valeImg = this.add.image(vCardX, vCardY - 26, valeKey).setDisplaySize(60, 60);

      const valeName = this.add.text(vCardX, vCardY + 16, 'DR. MIRA VALE', {
        fontFamily: 'Georgia, serif',
        fontSize: '11px',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const valeRole = this.add.text(vCardX, vCardY + 34, 'Inventor', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: '#68d391'
      }).setOrigin(0.5);

      this.panelContainer.add([g, title, subtitle, renImg, renName, renRole, valeImg, valeName, valeRole]);
      return true;
    }

    // 6. discovery_scene Panel 5: Professor Sable's Crime Scene Desk
    if (cid === 'discovery_scene' && pIdx === 5) {
      PixelRenderer.generateAllProps(this);
      const g = this.add.graphics();
      g.fillStyle(0x07080f, 1);
      g.fillRect(0, 0, width, height);

      // Single ominous overhead spotlight beam
      g.fillStyle(0xfff0aa, 0.08);
      g.beginPath();
      g.moveTo(320, 0);
      g.lineTo(200, 280);
      g.lineTo(440, 280);
      g.closePath();
      g.fillPath();

      // Spotlight pool on floor
      g.fillStyle(0xfff0aa, 0.12);
      g.fillEllipse(320, 240, 240, 50);

      // Crime scene desk prop (scaled up 1.5x)
      if (this.textures.exists('prop_crime_scene_desk')) {
        const desk = this.add.image(320, 170, 'prop_crime_scene_desk').setScale(1.5);
        this.panelContainer.add(desk);
      }

      // Placard at bottom
      const placard = this.add.text(width / 2, 290, '✦ EXHIBITION CHAMBER • CRIME SCENE ✦', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#e24a4a',
        fontStyle: 'bold',
        stroke: '#05070e',
        strokeThickness: 3
      }).setOrigin(0.5);

      this.panelContainer.add([g, placard]);
      return true;
    }

    // 7. midpoint_reversal Panel 1: Spliced Recording Anomaly
    if (cid === 'midpoint_reversal' && pIdx === 1) {
      const g = this.add.graphics();
      g.fillStyle(0x070b12, 1);
      g.fillRect(0, 0, width, height);

      // Steampunk oscilloscope monitor frame
      g.fillStyle(0x161e2a, 1);
      g.fillRoundedRect(80, 40, width - 160, 220, 10);
      g.lineStyle(2, 0xd4af37, 0.85);
      g.strokeRoundedRect(80, 40, width - 160, 220, 10);

      // CRT phosphor screen
      g.fillStyle(0x041008, 1);
      g.fillRoundedRect(96, 56, width - 192, 188, 6);

      // Grid lines
      g.lineStyle(1, 0x0a2a16, 0.8);
      for (let x = 96; x <= width - 96; x += 32) {
        g.beginPath(); g.moveTo(x, 56); g.lineTo(x, 244); g.stroke();
      }
      for (let y = 56; y <= 244; y += 24) {
        g.beginPath(); g.moveTo(96, y); g.lineTo(width - 96, y); g.stroke();
      }

      // Normal waveform (left)
      g.lineStyle(2, 0x22ee66, 0.9);
      g.beginPath();
      for (let x = 100; x < 280; x += 4) {
        const y = 150 + Math.sin((x - 100) * 0.12) * 22;
        if (x === 100) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();

      // Crimson splice discontinuity spike (center)
      g.lineStyle(3, 0xff2222, 1);
      g.beginPath();
      g.moveTo(280, 150);
      g.lineTo(290, 80);
      g.lineTo(300, 225);
      g.lineTo(315, 75);
      g.lineTo(325, 215);
      g.lineTo(335, 150);
      g.stroke();

      // Normal waveform resumed (right)
      g.lineStyle(2, 0x22ee66, 0.9);
      g.beginPath();
      for (let x = 335; x <= 535; x += 4) {
        const y = 150 + Math.sin((x - 335) * 0.12) * 22;
        if (x === 335) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();

      // Splice warning flag
      const tag = this.add.text(312, 66, '⚠ SPLICE DETECTED [7:45:12 PM]', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#ff4444',
        fontStyle: 'bold',
        backgroundColor: '#2a0a0ae0',
        padding: { x: 6, y: 3 }
      }).setOrigin(0.5);

      const caption = this.add.text(width / 2, 285, 'VOICE PRISM: HARMONIC DISCONTINUITY DETECTED', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#ffea70',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.panelContainer.add([g, tag, caption]);
      return true;
    }

    // 8. post_credits Panel 0: The Mysterious Photograph
    if (cid === 'post_credits' && pIdx === 0) {
      const g = this.add.graphics();
      // Moody mahogany surface
      g.fillStyle(0x0c0910, 1);
      g.fillRect(0, 0, width, height);
      g.fillStyle(0x181014, 0.9);
      g.fillRect(60, 30, width - 120, height - 60);

      // Weathered vintage photograph backing & gold frame
      const px = 250, py = 55, pw = 140, ph = 175;
      g.fillStyle(0xd4af37, 0.95);
      g.fillRect(px - 4, py - 4, pw + 8, ph + 8);
      g.fillStyle(0x2e2016, 1);
      g.fillRect(px, py, pw, ph);
      g.fillStyle(0x423020, 1);
      g.fillRect(px + 6, py + 6, pw - 12, ph - 38);

      // Studio backdrop
      g.fillStyle(0x56402c, 0.8);
      g.fillRect(px + 10, py + 10, pw - 20, ph - 46);

      // Young Professor Aldric Sable (right)
      g.fillStyle(0x322216, 1); g.fillRect(px + 78, py + 52, 38, 48); // Tweed jacket
      g.fillStyle(0xd2b49c, 1); g.fillRect(px + 88, py + 28, 18, 22); // Face
      g.fillStyle(0x1a120c, 1); g.fillRect(px + 86, py + 22, 22, 10); // Hair
      g.lineStyle(1, 0xdfb038, 1);
      g.strokeRect(px + 90, py + 32, 6, 6); g.strokeRect(px + 98, py + 32, 6, 6); // Round spectacles

      // Elena Kasuga (Ren's mother, left)
      g.fillStyle(0x3c2024, 1); g.fillRect(px + 24, py + 56, 36, 44); // Lace dress
      g.fillStyle(0xdec0a8, 1); g.fillRect(px + 32, py + 32, 18, 20); // Face
      g.fillStyle(0x1a161c, 1); g.fillRect(px + 28, py + 24, 26, 14); // Dark wavy hair
      g.fillRect(px + 26, py + 32, 6, 24);
      g.fillStyle(0xa0b0c8, 1); g.fillRect(px + 34, py + 26, 4, 8); // Rogue silver streak
      g.fillStyle(0xc0c8d8, 1); g.fillCircle(px + 41, py + 56, 3); // Silver pendant

      // Inscription
      const insc = this.add.text(px + pw / 2, py + ph - 20, 'Elena & Aldric • 1916', {
        fontFamily: 'Georgia, serif',
        fontSize: '11px',
        color: '#bfa882',
        fontStyle: 'italic'
      }).setOrigin(0.5);

      // Detective gloved hand holding photo
      g.fillStyle(0x281a14, 1);
      g.fillRect(px - 14, py + ph - 50, 24, 34);
      g.fillCircle(px + 6, py + ph - 24, 9);

      const notice = this.add.text(width / 2, 275, 'FOUND BEHIND THE COMMEMORATIVE PLAQUE', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#ffd700',
        letterSpacing: 1.5
      }).setOrigin(0.5);

      this.panelContainer.add([g, insc, notice]);
      return true;
    }

    return false;
  }
}
