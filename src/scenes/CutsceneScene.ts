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
  private returnTo: string | null = null;
  private returnRoom: string | null = null;
  private currentTypewriterTextObj: Phaser.GameObjects.Text | null = null;
  private currentFullText: string = '';
  private isFinishing: boolean = false;
  
  constructor() {
    super('CutsceneScene');
  }

  init(data: any) {
    this.cutsceneId = data.cutsceneId || 'cold_open';
    this.returnTo = data.returnTo || null;
    this.returnRoom = data.returnRoom || null;
    this.currentPanelIndex = 0;
    this.isTransitioning = false;
    this.isFinishing = false;
    if (this.input) this.input.enabled = true;
  }

  create() {
    // Hide HUD bar during cinematic cutscene
    const hud = document.getElementById('hud-bar');
    if (hud) hud.style.display = 'none';

    // Ensure SettingsScene is closed and sleep UIScene so Pause doesn't overlap cutscenes
    if (this.scene.isActive('SettingsScene')) {
        this.scene.stop('SettingsScene');
    }
    if (this.scene.isActive('UIScene')) {
        this.scene.sleep('UIScene');
    }

    this.events.once('shutdown', () => {
        if (this.scene.isSleeping('UIScene')) {
            this.scene.wake('UIScene');
        }
    });

    this.cutsceneData = cutscenes[this.cutsceneId];
    if (!this.cutsceneData) {
        console.warn(`Cutscene ${this.cutsceneId} not found, falling back.`);
        this.finishCutscene();
        return;
    }

    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.panelContainer = this.add.container(0, 0);
    this.uiContainer = this.add.container(0, 0);
    this.uiContainer.setDepth(100);

    const { width, height } = this.scale;

    // Skip button
    const skipButton = this.add.text(width - 15, 12, '✕ Skip [ESC / S]', {
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

    // Panel counter positioned neatly in the top right beside the Skip button
    this.panelCounterText = this.add.text(width - 130, 15, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#7f93aa',
        backgroundColor: '#0c101c',
        padding: { x: 6, y: 3 }
    }).setOrigin(1, 0);
    this.uiContainer.add(this.panelCounterText);

    // Inputs
    this.input.on('pointerdown', this.handleAdvance, this);
    this.input.keyboard?.on('keydown-SPACE', this.handleAdvance, this);
    this.input.keyboard?.on('keydown-ESC', () => this.finishCutscene());
    this.input.keyboard?.on('keydown-S', () => this.finishCutscene());

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
    
    this.panelCounterText.setText(`[ ${this.currentPanelIndex + 1} / ${this.cutsceneData.panels.length} ]`);
    
    // Clear previous panel
    this.panelContainer.removeAll(true);
    
    if (this.typeWriterTimer) {
        this.typeWriterTimer.destroy();
        this.typeWriterTimer = undefined;
    }
    this.currentTypewriterTextObj = null;
    this.currentFullText = '';
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

        // Dialogue text (using lining numbers font stack so numerals 0-9 align evenly on the baseline)
        const dialogTxt = this.add.text(98, boxY + 32, '', {
            fontFamily: '"Times New Roman", Times, "Segoe UI", serif',
            fontSize: '12px',
            color: panel.textColor || '#edf2f8',
            lineSpacing: 4,
            wordWrap: { width: width - 155 }
        }).setOrigin(0, 0);
        this.panelContainer.add(dialogTxt);
        this.typewriterEffect(dialogTxt, panel.dialogue || '');

        // Prompt
        const prompt = this.add.text(width - 32, boxY + boxH - 14, '▼ [SPACE] / Click', {
            fontFamily: 'Courier New, monospace',
            fontSize: '9px',
            color: '#7ac4d4',
            fontStyle: 'bold',
            backgroundColor: '#0d1424',
            padding: { x: 5, y: 2 }
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
        const reduced = typeof window !== 'undefined' && localStorage.getItem('setting_reduced_motion') === 'true';
        if (reduced) {
            this.cameras.main.flash(panel.duration || 400, 70, 80, 100);
        } else {
            this.cameras.main.shake(panel.duration || 500, 0.05);
        }
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
    this.currentTypewriterTextObj = textObj;
    this.currentFullText = fullText;
    const speedSetting = typeof window !== 'undefined' ? parseInt(localStorage.getItem('setting_text_speed') || '3', 10) : 3;
    const charDelay = Math.max(8, 25 - (speedSetting - 3) * 7);
    let charIndex = 0;
    this.typeWriterTimer = this.time.addEvent({
        delay: charDelay,
        callback: () => {
            charIndex++;
            textObj.setText(fullText.substring(0, charIndex));
            if (charIndex >= fullText.length) {
                if (this.typeWriterTimer) {
                    this.typeWriterTimer.destroy();
                    this.typeWriterTimer = undefined;
                }
                this.currentTypewriterTextObj = null;
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
        if (this.currentTypewriterTextObj) {
            this.currentTypewriterTextObj.setText(this.currentFullText);
            this.currentTypewriterTextObj = null;
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
    if (this.isFinishing) return;
    this.isFinishing = true;

    if (this.autoAdvanceTimer) {
        this.autoAdvanceTimer.destroy();
        this.autoAdvanceTimer = undefined;
    }
    if (this.typeWriterTimer) {
        this.typeWriterTimer.destroy();
        this.typeWriterTimer = undefined;
    }

    if (this.input) {
        this.input.enabled = false;
    }

    gameState.markCutsceneSeen(this.cutsceneId);

    // Advance story phase
    if (['cold_open', 'opening_title', 'discovery_scene', 'midpoint_reversal', 'final_reveal'].includes(this.cutsceneId)) {
        storyManager.advancePhase();
    }

    let transitioned = false;
    const doTransition = () => {
        if (transitioned) return;
        transitioned = true;

        if (this.returnTo) {
            const targetRoom = this.returnRoom || gameState.getCurrentRoom() || 'main_hall';
            this.scene.start(this.returnTo, { roomId: targetRoom });
            return;
        }
        switch(this.cutsceneId) {
            case 'cold_open':
                this.scene.start('CutsceneScene', { cutsceneId: 'opening_title' });
                break;
            case 'opening_title':
                this.scene.start('ExplorationScene', { roomId: 'main_hall' });
                break;
            case 'gadget_tutorial':
                this.scene.start('ExplorationScene', { roomId: 'main_hall' });
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
                this.scene.start('ExplorationScene', { roomId: 'main_hall' });
                break;
        }
    };

    try {
        this.cameras.main.resetFX();
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', doTransition);
    } catch(e) {}
    this.time.delayedCall(450, doTransition);
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

    // 9. Gadget Tutorial Panel 0: 5 Gadgets Overview
    if (cid === 'gadget_tutorial' && pIdx === 0) {
      const g = this.add.graphics();
      // Obsidian card background
      g.fillStyle(0x060914, 1);
      g.fillRect(10, 10, width - 20, height - 20);

      // Gold border & studs
      g.lineStyle(2, 0xd4af37, 0.9);
      g.strokeRect(10, 10, width - 20, height - 20);
      g.lineStyle(1, 0x8a6a28, 0.5);
      g.strokeRect(16, 16, width - 32, height - 32);

      g.fillStyle(0xd4af37, 1);
      g.fillCircle(14, 14, 3); g.fillCircle(width - 14, 14, 3);
      g.fillCircle(14, height - 14, 3); g.fillCircle(width - 14, height - 14, 3);

      const title = this.add.text(width / 2, 38, '✦ DR. VALE\'S SCIENTIFIC TOOLKIT ✦', {
        fontFamily: 'Georgia, serif',
        fontSize: '17px',
        color: '#f6d888',
        fontStyle: 'bold',
        letterSpacing: 2
      }).setOrigin(0.5);

      const sub = this.add.text(width / 2, 58, 'FIVE SPECIALIZED GADGETS TO UNRAVEL THE CONSPIRACY', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: '#88a6c8',
        fontStyle: 'bold',
        letterSpacing: 1.5
      }).setOrigin(0.5);

      // 5 gadget summary cards across the screen
      const cards = [
        { slot: '[1]', name: 'FOCUS', desc: 'Perception\n& Clues', color: 0x14223c, border: 0x4a9aff, icon: '🧠' },
        { slot: '[2]', name: 'ECHO LENS', desc: 'Acoustic\nResonance', color: 0x0a2830, border: 0x33e0ff, icon: '🔍' },
        { slot: '[3]', name: 'TRACE LIGHT', desc: 'UV Poison\n& Prints', color: 0x280e38, border: 0xd888ff, icon: '🔦' },
        { slot: '[4]', name: 'MICRO ROVER', desc: 'Air Ducts\n& Telemetry', color: 0x30200a, border: 0xffb844, icon: '🚙' },
        { slot: '[5]', name: 'VOICE PRISM', desc: 'Frequency\n& Splices', color: 0x2e0c1a, border: 0xff4488, icon: '🎙️' }
      ];

      const startX = 64;
      const stepX = 128;
      const cardY = 165;
      const cardW = 112;
      const cardH = 148;

      cards.forEach((c, idx) => {
        const cx = startX + idx * stepX;
        // Card bg
        g.fillStyle(c.color, 0.95);
        g.fillRect(cx - cardW / 2, cardY - cardH / 2, cardW, cardH);
        g.lineStyle(1.5, c.border, 0.9);
        g.strokeRect(cx - cardW / 2, cardY - cardH / 2, cardW, cardH);

        // Key badge at top
        const slotText = this.add.text(cx, cardY - 52, c.slot, {
          fontFamily: 'Courier New, monospace',
          fontSize: '11px',
          color: '#ffffff',
          fontStyle: 'bold',
          backgroundColor: '#0a0d18e0',
          padding: { x: 6, y: 2 }
        }).setOrigin(0.5);

        // Emoji / Icon
        const iconText = this.add.text(cx, cardY - 20, c.icon, {
          fontSize: '24px'
        }).setOrigin(0.5);

        // Name
        const nameText = this.add.text(cx, cardY + 16, c.name, {
          fontFamily: 'Georgia, serif',
          fontSize: '10px',
          color: '#ffd700',
          fontStyle: 'bold',
          align: 'center'
        }).setOrigin(0.5);

        // Desc
        const descText = this.add.text(cx, cardY + 44, c.desc, {
          fontFamily: 'Courier New, monospace',
          fontSize: '8px',
          color: '#d0e0f0',
          align: 'center',
          lineSpacing: 2
        }).setOrigin(0.5);

        this.panelContainer.add([slotText, iconText, nameText, descText]);
      });

      const prompt = this.add.text(width / 2, 282, '▼ PRESS [SPACE] OR CLICK TO LEARN OPERATIONS', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: '#ffea70',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.panelContainer.add([g, title, sub, prompt]);
      return true;
    }

    // 10. Gadget Tutorial Panel 2: Tranquility Focus
    if (cid === 'gadget_tutorial' && pIdx === 2) {
      const g = this.add.graphics();
      g.fillGradientStyle(0x060c1c, 0x060c1c, 0x0c1836, 0x12244c, 1);
      g.fillRect(0, 0, width, height);

      // Expanding concentric mind focus waves
      const ring1 = this.add.circle(320, 120, 45, 0x4a9aff, 0).setStrokeStyle(2, 0x4a9aff, 0.8);
      const ring2 = this.add.circle(320, 120, 85, 0x66bbff, 0).setStrokeStyle(2, 0x66bbff, 0.5);
      const ring3 = this.add.circle(320, 120, 125, 0xd4af37, 0).setStrokeStyle(1.5, 0xd4af37, 0.4);

      this.tweens.add({ targets: ring1, scale: 1.6, alpha: 0, duration: 1800, repeat: -1 });
      this.tweens.add({ targets: ring2, scale: 1.6, alpha: 0, duration: 1800, delay: 450, repeat: -1 });
      this.tweens.add({ targets: ring3, scale: 1.6, alpha: 0, duration: 1800, delay: 900, repeat: -1 });

      // Chronometer Pocket-Watch Focus Center
      g.fillStyle(0x0c1a38, 1);
      g.fillCircle(320, 120, 48);
      g.lineStyle(3, 0xd4af37, 1);
      g.strokeCircle(320, 120, 48);

      // Glowing Eye / Mind symbol
      g.lineStyle(2, 0x7ac4ff, 1);
      g.strokeEllipse(320, 120, 56, 26);
      g.fillStyle(0xffd700, 1);
      g.fillCircle(320, 120, 8);
      g.fillStyle(0x0a1428, 1);
      g.fillCircle(320, 120, 4);

      // Telemetry Cards
      const t1 = this.add.text(320, 212, '✦ PULSE RATE: 58 BPM // SENSORY CALIBRATION: HEIGHTENED ✦', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#66bbff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const t2 = this.add.text(320, 232, 'EFFECT: HIGHLIGHTS ALL PROPS, CLUES, AND NPC DETAILS IN CURRENT ROOM', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: '#edf2f8'
      }).setOrigin(0.5);

      const hotkey = this.add.text(320, 260, 'HOTKEY: PRESS [1] TO ACTIVATE TRANQUILITY FOCUS', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#ffd700',
        fontStyle: 'bold',
        backgroundColor: '#0a162ef0',
        padding: { x: 14, y: 5 }
      }).setOrigin(0.5);

      this.panelContainer.add([g, ring1, ring2, ring3, t1, t2, hotkey]);
      return true;
    }

    // 11. Gadget Tutorial Panel 4: Echo Lens
    if (cid === 'gadget_tutorial' && pIdx === 4) {
      const g = this.add.graphics();
      g.fillStyle(0x050d14, 1);
      g.fillRect(0, 0, width, height);

      // Steampunk Oscilloscope Housing
      g.fillStyle(0x18242a, 1);
      g.fillRoundedRect(90, 24, width - 180, 175, 8);
      g.lineStyle(2, 0xd4af37, 0.9);
      g.strokeRoundedRect(90, 24, width - 180, 175, 8);

      // CRT Phosphor Display
      g.fillStyle(0x031818, 1);
      g.fillRoundedRect(106, 38, width - 212, 147, 5);

      // Grid
      g.lineStyle(1, 0x093030, 0.8);
      for (let x = 106; x <= width - 106; x += 32) {
        g.beginPath(); g.moveTo(x, 38); g.lineTo(x, 185); g.stroke();
      }
      for (let y = 38; y <= 185; y += 22) {
        g.beginPath(); g.moveTo(106, y); g.lineTo(width - 106, y); g.stroke();
      }

      // Dual Oscillating Acoustic Sine Waves in Cyan
      g.lineStyle(2.5, 0x33e0ff, 0.95);
      g.beginPath();
      for (let x = 110; x <= width - 110; x += 4) {
        const y = 112 + Math.sin((x - 110) * 0.08) * 24 * Math.sin(x * 0.02);
        if (x === 110) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();

      // Telemetry
      const t1 = this.add.text(320, 212, '✦ ACOUSTIC FREQUENCY MAPPING // 432 Hz HARMONIC DETECTED ✦', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#33e0ff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const t2 = this.add.text(320, 232, 'APPLICATION: TRACE SOUND REFLECTIONS, VIBRATION ANOMALIES & RAIN SENSORS', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: '#edf2f8'
      }).setOrigin(0.5);

      const hotkey = this.add.text(320, 260, 'HOTKEY: PRESS [2] TO ACTIVATE ECHO LENS', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#ffd700',
        fontStyle: 'bold',
        backgroundColor: '#071e2ef0',
        padding: { x: 14, y: 5 }
      }).setOrigin(0.5);

      this.panelContainer.add([g, t1, t2, hotkey]);
      return true;
    }

    // 12. Gadget Tutorial Panel 6: Trace Light
    if (cid === 'gadget_tutorial' && pIdx === 6) {
      const g = this.add.graphics();
      g.fillStyle(0x0e051a, 1);
      g.fillRect(0, 0, width, height);

      // Angled UV flashlight cone beam
      g.fillStyle(0x8822cc, 0.22);
      g.beginPath();
      g.moveTo(140, 20);
      g.lineTo(40, 210);
      g.lineTo(540, 210);
      g.closePath();
      g.fillPath();

      // Deadbolt on door with glowing cyan smudged fingerprints
      g.fillStyle(0x2a1c12, 1);
      g.fillRect(170, 60, 110, 80);
      g.lineStyle(2, 0xd4af37, 0.85);
      g.strokeRect(170, 60, 110, 80);
      // Brass bolt
      g.fillStyle(0x5a4218, 1);
      g.fillRect(195, 90, 80, 20);

      // Glowing Cyan Fingerprints
      g.lineStyle(1.5, 0x44ffff, 0.95);
      for (let r = 3; r <= 15; r += 3) {
        g.strokeCircle(235, 100, r);
      }
      const printTag = this.add.text(235, 50, 'LATENT FINGERPRINTS', {
        fontFamily: 'Courier New, monospace',
        fontSize: '8px',
        color: '#44ffff',
        backgroundColor: '#0a1020f0',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5);

      // Poisoned teacup with glowing green aconitine residue
      g.fillStyle(0xdcdcdc, 1);
      g.fillRect(370, 85, 36, 40); // Teacup
      g.lineStyle(1, 0x888888, 1);
      g.strokeRect(370, 85, 36, 40);
      // Neon green toxic puddle
      g.fillStyle(0x22ee44, 0.9);
      g.fillEllipse(388, 132, 54, 14);
      const poisonTag = this.add.text(388, 70, 'ACONITINE TOXIN GLOW', {
        fontFamily: 'Courier New, monospace',
        fontSize: '8px',
        color: '#22ee44',
        backgroundColor: '#081a0af0',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5);

      // Telemetry
      const t1 = this.add.text(320, 212, '✦ ULTRAVIOLET 365nm // FLUORESCENCE ACTIVE ✦', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#d888ff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const t2 = this.add.text(320, 232, 'APPLICATION: EXPOSES LATENT FINGERPRINTS, POISON PUDDLES & HIDDEN RESIDUES', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: '#edf2f8'
      }).setOrigin(0.5);

      const hotkey = this.add.text(320, 260, 'HOTKEY: PRESS [3] TO ACTIVATE TRACE LIGHT', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#ffd700',
        fontStyle: 'bold',
        backgroundColor: '#260838f0',
        padding: { x: 14, y: 5 }
      }).setOrigin(0.5);

      this.panelContainer.add([g, printTag, poisonTag, t1, t2, hotkey]);
      return true;
    }

    // 13. Gadget Tutorial Panel 8: Micro Rover
    if (cid === 'gadget_tutorial' && pIdx === 8) {
      const g = this.add.graphics();
      g.fillStyle(0x0e0a05, 1);
      g.fillRect(0, 0, width, height);

      // Steampunk blueprint terminal
      g.fillStyle(0x1c140a, 1);
      g.fillRect(70, 26, width - 140, 170);
      g.lineStyle(2, 0xd4af37, 0.9);
      g.strokeRect(70, 26, width - 140, 170);

      // Blueprint duct schematic
      g.lineStyle(1, 0x5a3c18, 0.6);
      g.strokeRect(100, 54, width - 200, 115);
      // Wall gap duct passage
      g.fillStyle(0x281a0e, 1);
      g.fillRect(160, 90, 320, 45);
      g.lineStyle(2, 0xb87a28, 0.85);
      g.strokeRect(160, 90, 320, 45);

      // Micro Crawler Rover Sprite/Graphics inside duct
      const rx = 280, ry = 112;
      g.fillStyle(0xb8860b, 1);
      g.fillRoundedRect(rx - 22, ry - 12, 44, 24, 4); // Brass chassis
      // 6 treads/wheels
      g.fillStyle(0x221a10, 1);
      [-16, 0, 16].forEach(wx => {
        g.fillRect(rx + wx - 4, ry - 16, 8, 4);
        g.fillRect(rx + wx - 4, ry + 12, 8, 4);
      });
      // Headlights
      g.fillStyle(0xffea70, 0.9);
      g.fillCircle(rx + 20, ry - 6, 3);
      g.fillCircle(rx + 20, ry + 6, 3);
      // Antenna
      g.lineStyle(1.5, 0xd4af37, 1);
      g.beginPath(); g.moveTo(rx - 12, ry); g.lineTo(rx - 22, ry - 14); g.stroke();
      g.fillStyle(0xff3333, 1); g.fillCircle(rx - 22, ry - 14, 2);

      // Secret passage door at end of duct
      g.fillStyle(0xd4af37, 1);
      g.fillRect(450, 94, 14, 37);

      const roverLabel = this.add.text(rx, ry - 24, 'MICRO ROVER UNIT 01', {
        fontFamily: 'Courier New, monospace',
        fontSize: '8px',
        color: '#ffea70',
        backgroundColor: '#0a0d18f0',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5);

      // Telemetry
      const t1 = this.add.text(320, 212, '✦ REMOTE ROVER TELEMETRY // SIGNAL STRENGTH: 98% ✦', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#ffb844',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const t2 = this.add.text(320, 232, 'APPLICATION: INFILTRATE NARROW WALL GAPS & VENTILATION DUCTS TO BYPASS LOCKS', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: '#edf2f8'
      }).setOrigin(0.5);

      const hotkey = this.add.text(320, 260, 'HOTKEY: PRESS [4] TO DEPLOY MICRO ROVER', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#ffd700',
        fontStyle: 'bold',
        backgroundColor: '#301c0af0',
        padding: { x: 14, y: 5 }
      }).setOrigin(0.5);

      this.panelContainer.add([g, roverLabel, t1, t2, hotkey]);
      return true;
    }

    // 14. Gadget Tutorial Panel 10: Voice Prism
    if (cid === 'gadget_tutorial' && pIdx === 10) {
      const g = this.add.graphics();
      g.fillStyle(0x0c0612, 1);
      g.fillRect(0, 0, width, height);

      // Mahogany & Brass Wire Recorder Casing
      g.fillStyle(0x1c101c, 1);
      g.fillRect(80, 24, width - 160, 175);
      g.lineStyle(2, 0xd4af37, 0.9);
      g.strokeRect(80, 24, width - 160, 175);

      // Twin Spinning Wire Tape Reels
      g.lineStyle(2, 0x8a6a28, 0.8);
      g.strokeCircle(160, 80, 32); g.strokeCircle(480, 80, 32);
      g.fillStyle(0xd4af37, 1);
      g.fillCircle(160, 80, 6); g.fillCircle(480, 80, 6);

      // Spectrograph Screen in Center
      g.fillStyle(0x05040a, 1);
      g.fillRect(215, 40, 210, 80);
      g.lineStyle(1.5, 0x4a8a9a, 0.8);
      g.strokeRect(215, 40, 210, 80);

      // Normal cyan audio frequencies
      g.lineStyle(2, 0x4ac4d4, 0.9);
      g.beginPath();
      for (let x = 220; x < 305; x += 3) {
        const y = 80 + Math.sin((x - 220) * 0.15) * 16;
        if (x === 220) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();

      // Red Splice Spike (center)
      g.lineStyle(2.5, 0xff2222, 1);
      g.beginPath();
      g.moveTo(305, 80);
      g.lineTo(312, 48);
      g.lineTo(322, 112);
      g.lineTo(330, 80);
      g.stroke();

      // Normal resumed frequencies
      g.lineStyle(2, 0x4ac4d4, 0.9);
      g.beginPath();
      for (let x = 330; x <= 420; x += 3) {
        const y = 80 + Math.sin((x - 330) * 0.15) * 16;
        if (x === 330) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();

      const spliceTag = this.add.text(317, 134, '⚠ SPLICE DETECTED // 94% CONFIDENCE', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: '#ff4444',
        fontStyle: 'bold',
        backgroundColor: '#2a0a14f0',
        padding: { x: 6, y: 3 }
      }).setOrigin(0.5);

      // Telemetry
      const t1 = this.add.text(320, 212, '✦ FREQUENCY BREAK ANALYSIS & VOICE RECOGNITION ✦', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#ff66aa',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const t2 = this.add.text(320, 232, 'APPLICATION: EXPOSE PRE-RECORDED ANNOUNCEMENTS, TAPED ALIBIS & AUDIO TAMPERING', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: '#edf2f8'
      }).setOrigin(0.5);

      const hotkey = this.add.text(320, 260, 'HOTKEY: PRESS [5] TO ACTIVATE VOICE PRISM', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#ffd700',
        fontStyle: 'bold',
        backgroundColor: '#300a20f0',
        padding: { x: 14, y: 5 }
      }).setOrigin(0.5);

      this.panelContainer.add([g, spliceTag, t1, t2, hotkey]);
      return true;
    }

    return false;
  }
}
