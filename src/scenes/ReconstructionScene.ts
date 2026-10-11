import Phaser from 'phaser';
import { gameState } from '../logic/GameState';
import { AudioManager } from '../engine/AudioManager';
import { SceneTransition } from '../engine/SceneTransition';
import { timeline, TimelineEvent } from '../data/timeline';
import { PixelRenderer } from '../rendering/PixelRenderer';
import { storyManager } from '../logic/StoryPhaseManager';

export class ReconstructionScene extends Phaser.Scene {
  private slots: Phaser.GameObjects.Rectangle[] = [];
  private slotContents: (TimelineEvent | null)[] = [null, null, null, null, null];
  private currentHypothesis: 'A' | 'B' = 'B'; // Default to B as the puzzle target
  private cards: Phaser.GameObjects.Container[] = [];
  private ghostVisuals: Phaser.GameObjects.GameObject[] = [];

  private tabABg!: Phaser.GameObjects.Rectangle;
  private tabBBg!: Phaser.GameObjects.Rectangle;
  private tabAText!: Phaser.GameObjects.Text;
  private tabBText!: Phaser.GameObjects.Text;
  private hypothesisTitleText!: Phaser.GameObjects.Text;
  private hypothesisDescText!: Phaser.GameObjects.Text;
  private hypothesisBadge!: Phaser.GameObjects.Text;

  private feedbackBanner?: Phaser.GameObjects.Container;

  constructor() {
    super('ReconstructionScene');
  }

  create() {
    // Generate character sprites for spectral visualization
    PixelRenderer.generateCharacterSprite(this, 'aldric');
    PixelRenderer.generateCharacterSprite(this, 'hugo');
    PixelRenderer.generateCharacterSprite(this, 'nadia');

    const hud = document.getElementById('hud-bar');
    if (hud) hud.style.display = 'none';

    if (this.scene.isActive('UIScene')) {
      this.scene.sleep('UIScene');
    }

    this.events.once('shutdown', () => {
      if (this.scene.isSleeping('UIScene')) {
        this.scene.wake('UIScene');
      }
    });

    // 1. Dark Blueprint Backdrop with Grid
    this.createBlueprintBackdrop();

    // 2. Top Header Toolbar (Back button, Title, Hypothesis Tabs)
    this.createHeaderToolbar();

    // 3. Top Deck: Hypothesis Dossier, Blueprint Diagram, Action Controls
    this.createTopDeck();

    // 4. Middle Section: Available Timeline Events Pool
    this.createEventCards();

    // 5. Bottom Section: 5 Chronological Timeline Slots
    this.createTimelineSlots();

    // Initial state setup
    this.updateHypothesisDisplay();
  }

  private createBlueprintBackdrop() {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x020a18, 0x020a18, 0x06142a, 0x081a34, 1);
    bg.fillRect(0, 0, width, height);

    // Grid lines
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1a3a60, 0.35);
    for (let x = 0; x < width; x += 32) {
      grid.moveTo(x, 0);
      grid.lineTo(x, height);
    }
    for (let y = 0; y < height; y += 32) {
      grid.moveTo(0, y);
      grid.lineTo(width, y);
    }
    grid.strokePath();

    // Subtle decorative blueprint border
    const border = this.add.graphics();
    border.lineStyle(2, 0x245484, 0.8);
    border.strokeRect(6, 6, width - 12, height - 12);
  }

  private createHeaderToolbar() {
    // Top bar background strip
    const bar = this.add.graphics();
    bar.fillStyle(0x051020, 0.95);
    bar.fillRect(6, 6, 628, 26);
    bar.lineStyle(1, 0x234a75, 0.8);
    bar.strokeLineShape(new Phaser.Geom.Line(6, 32, 634, 32));

    // BACK Button
    const backBtn = this.add.container(44, 19);
    const backBg = this.add.rectangle(0, 0, 64, 20, 0x162438)
      .setStrokeStyle(1, 0x4a7a9e)
      .setInteractive({ useHandCursor: true });
    const backTxt = this.add.text(0, 0, '← BACK', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#c2d4e8',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    backBtn.add([backBg, backTxt]);

    backBg.on('pointerover', () => {
      backBg.setFillStyle(0x243a58);
      backBg.setStrokeStyle(1, 0x7ac4d4);
      backTxt.setColor('#ffffff');
    });
    backBg.on('pointerout', () => {
      backBg.setFillStyle(0x162438);
      backBg.setStrokeStyle(1, 0x4a7a9e);
      backTxt.setColor('#c2d4e8');
    });
    backBg.on('pointerdown', () => {
      AudioManager.getInstance().playSFX('button_click');
      SceneTransition.fadeToBlack(this, 400, () => {
        this.scene.start('ExplorationScene');
      });
    });

    // Scene Title
    this.add.text(200, 19, '✦ ECHO RECONSTRUCTION ✦', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#d4af37',
      fontStyle: 'bold',
      letterSpacing: 1
    }).setOrigin(0.5);

    // Hypothesis Tabs on the Right
    // Tab A
    this.tabABg = this.add.rectangle(450, 19, 108, 20, 0x11223a)
      .setStrokeStyle(1, 0x2a5078)
      .setInteractive({ useHandCursor: true });
    this.tabAText = this.add.text(450, 19, 'Hypothesis A', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#7f9ebd'
    }).setOrigin(0.5);

    this.tabABg.on('pointerdown', () => this.switchHypothesis('A'));
    this.tabABg.on('pointerover', () => {
      if (this.currentHypothesis !== 'A') this.tabABg.setFillStyle(0x1a3458);
    });
    this.tabABg.on('pointerout', () => {
      if (this.currentHypothesis !== 'A') this.tabABg.setFillStyle(0x11223a);
    });

    // Tab B
    this.tabBBg = this.add.rectangle(568, 19, 116, 20, 0x1f4870)
      .setStrokeStyle(1, 0xd4af37)
      .setInteractive({ useHandCursor: true });
    this.tabBText = this.add.text(568, 19, 'Hypothesis B ★', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tabBBg.on('pointerdown', () => this.switchHypothesis('B'));
    this.tabBBg.on('pointerover', () => {
      if (this.currentHypothesis !== 'B') this.tabBBg.setFillStyle(0x285684);
    });
    this.tabBBg.on('pointerout', () => {
      if (this.currentHypothesis !== 'B') this.tabBBg.setFillStyle(0x1f4870);
    });
  }

  private createTopDeck() {
    // 1. Left Dossier Panel (x: 12, y: 36, w: 176, h: 104)
    const dossierBg = this.add.rectangle(100, 88, 176, 104, 0x071324, 0.9)
      .setStrokeStyle(1, 0x1e4268);

    this.add.text(18, 42, 'CASE DOSSIER THEORY:', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      color: '#7ac4d4',
      fontStyle: 'bold'
    });

    this.hypothesisTitleText = this.add.text(18, 56, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#ffd700',
      fontStyle: 'bold'
    });

    this.hypothesisDescText = this.add.text(18, 68, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '8.5px',
      color: '#b6cadc',
      lineSpacing: 2,
      wordWrap: { width: 166 }
    });

    this.hypothesisBadge = this.add.text(18, 116, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '8px',
      fontStyle: 'bold',
      padding: { x: 4, y: 2 }
    });

    // 2. Center Exhibition Chamber Blueprint (x: 194, y: 36, w: 304, h: 104)
    const diagBox = this.add.rectangle(346, 88, 304, 104, 0x051020, 0.95)
      .setStrokeStyle(1, 0x1e4268);

    this.add.text(346, 43, 'EXHIBITION CHAMBER // OVERHEAD BLUEPRINT', {
      fontFamily: 'Courier New, monospace',
      fontSize: '8.5px',
      color: '#4ac4d4',
      fontStyle: 'bold',
      letterSpacing: 1
    }).setOrigin(0.5);

    // Chamber Walls (Center = 346, 92, W = 180, H = 64)
    const diagX = 346;
    const diagY = 92;
    const roomW = 180;
    const roomH = 64;

    const g = this.add.graphics();
    // Inner floor grid
    g.fillStyle(0x0a1a30, 0.7);
    g.fillRect(diagX - roomW / 2, diagY - roomH / 2, roomW, roomH);

    // Grid markings
    g.lineStyle(1, 0x1c3858, 0.4);
    for (let x = diagX - roomW / 2 + 20; x < diagX + roomW / 2; x += 20) {
      g.moveTo(x, diagY - roomH / 2);
      g.lineTo(x, diagY + roomH / 2);
    }
    g.strokePath();

    // Walls
    g.lineStyle(2, 0x3d78b0, 1);
    g.strokeRect(diagX - roomW / 2, diagY - roomH / 2, roomW, roomH);

    // Professor's Desk at Center
    g.fillStyle(0x183050, 1);
    g.fillRect(diagX - 22, diagY - 10, 44, 20);
    g.lineStyle(1, 0x7ac4d4, 0.8);
    g.strokeRect(diagX - 22, diagY - 10, 44, 20);

    this.add.text(diagX, diagY, '🪑 DESK / TEA', {
      fontFamily: 'Courier New, monospace',
      fontSize: '7.5px',
      color: '#9ad0ea'
    }).setOrigin(0.5);

    // Main Door on West Wall
    g.lineStyle(3, 0xffaa00, 1);
    g.beginPath();
    g.moveTo(diagX - roomW / 2, diagY - 12);
    g.lineTo(diagX - roomW / 2, diagY + 12);
    g.strokePath();

    this.add.text(diagX - roomW / 2 - 4, diagY, '🚪 MAIN DOOR\n[BOLTED]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '7px',
      color: '#ffb300',
      align: 'right'
    }).setOrigin(1, 0.5);

    // Hidden Passage on North-East Wall
    g.lineStyle(3, 0xe040fb, 1);
    g.beginPath();
    g.moveTo(diagX + roomW / 2 - 34, diagY - roomH / 2);
    g.lineTo(diagX + roomW / 2 - 6, diagY - roomH / 2);
    g.strokePath();

    this.add.text(diagX + roomW / 2 - 20, diagY - roomH / 2 - 4, '⚡ FLUE PASSAGE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '7px',
      color: '#e040fb',
      align: 'center'
    }).setOrigin(0.5, 1);

    // 3. Right Action Controls Panel (x: 504, y: 36, w: 124, h: 104)
    this.add.rectangle(568, 88, 124, 104, 0x071324, 0.9)
      .setStrokeStyle(1, 0x1e4268);

    // VALIDATE BUTTON
    const valBtn = this.add.container(568, 64);
    const valBg = this.add.rectangle(0, 0, 110, 34, 0x165b26)
      .setStrokeStyle(1.5, 0x4ac47a)
      .setInteractive({ useHandCursor: true });
    const valTxt = this.add.text(0, 0, '✔ VALIDATE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      letterSpacing: 1
    }).setOrigin(0.5);
    valBtn.add([valBg, valTxt]);

    valBg.on('pointerover', () => {
      valBg.setFillStyle(0x228038);
      valBg.setStrokeStyle(2, 0x76ff9c);
      valTxt.setColor('#ffffdd');
    });
    valBg.on('pointerout', () => {
      valBg.setFillStyle(0x165b26);
      valBg.setStrokeStyle(1.5, 0x4ac47a);
      valTxt.setColor('#ffffff');
    });
    valBg.on('pointerdown', () => this.validate());

    // CLEAR BUTTON
    const clrBtn = this.add.container(568, 110);
    const clrBg = this.add.rectangle(0, 0, 110, 28, 0x3d1b1b)
      .setStrokeStyle(1, 0x8a3838)
      .setInteractive({ useHandCursor: true });
    const clrTxt = this.add.text(0, 0, '↺ CLEAR SLOTS', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#e0b4b4',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    clrBtn.add([clrBg, clrTxt]);

    clrBg.on('pointerover', () => {
      clrBg.setFillStyle(0x5a2424);
      clrBg.setStrokeStyle(1.5, 0xcc5252);
      clrTxt.setColor('#ffffff');
    });
    clrBg.on('pointerout', () => {
      clrBg.setFillStyle(0x3d1b1b);
      clrBg.setStrokeStyle(1, 0x8a3838);
      clrTxt.setColor('#e0b4b4');
    });
    clrBg.on('pointerdown', () => this.clearTimeline());
  }

  private updateHypothesisDisplay() {
    if (this.currentHypothesis === 'A') {
      this.tabABg.setFillStyle(0x1e4268);
      this.tabABg.setStrokeStyle(1.5, 0xd4af37);
      this.tabAText.setColor('#ffd700');
      this.tabAText.setFontStyle('bold');

      this.tabBBg.setFillStyle(0x0e1b2e);
      this.tabBBg.setStrokeStyle(1, 0x2a5078);
      this.tabBText.setColor('#7f9ebd');
      this.tabBText.setFontStyle('normal');

      this.hypothesisTitleText.setText('HYPOTHESIS A (Original Theory)');
      this.hypothesisTitleText.setColor('#e08844');
      this.hypothesisDescText.setText(
        'Sable was alive during the 7:45 PM announcement and killed during the 8:00 PM blackout.\nKiller breached the sealed chamber via main door.'
      );
      this.hypothesisBadge.setText('⚠ CONTRADICTED BY EVIDENCE');
      this.hypothesisBadge.setBackgroundColor('#421414');
      this.hypothesisBadge.setColor('#ff8888');
    } else {
      this.tabBBg.setFillStyle(0x1e4268);
      this.tabBBg.setStrokeStyle(1.5, 0xd4af37);
      this.tabBText.setColor('#ffd700');
      this.tabBText.setFontStyle('bold');

      this.tabABg.setFillStyle(0x0e1b2e);
      this.tabABg.setStrokeStyle(1, 0x2a5078);
      this.tabAText.setColor('#7f9ebd');
      this.tabAText.setFontStyle('normal');

      this.hypothesisTitleText.setText('HYPOTHESIS B (Acoustic Truth)');
      this.hypothesisTitleText.setColor('#4ac47a');
      this.hypothesisDescText.setText(
        'Sable poisoned at 7:30 PM. 7:45 PM speech was pre-recorded & spliced.\nHugo found body at 8:05 PM.'
      );
      this.hypothesisBadge.setText('★ TARGET RECONSTRUCTION PUZZLE');
      this.hypothesisBadge.setBackgroundColor('#143520');
      this.hypothesisBadge.setColor('#76ff9c');
    }
  }

  private switchHypothesis(hyp: 'A' | 'B') {
    if (this.currentHypothesis !== hyp) {
      this.currentHypothesis = hyp;
      AudioManager.getInstance().playSFX('button_click');
      this.updateHypothesisDisplay();
      this.clearTimeline();
    }
  }

  private createEventCards() {
    this.add.text(14, 146, 'AVAILABLE TIMELINE EVENTS (Click to Place / Drag into Slots):', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      color: '#7ac4d4',
      fontStyle: 'bold',
      letterSpacing: 0.5
    });

    const events = Object.values(timeline);

    // 4 columns x 2 rows
    // Centers: x = 80, 240, 400, 560
    // Rows: y = 174, 216
    const colCenters = [80, 240, 400, 560];
    const rowCenters = [174, 216];
    const cardW = 114;
    const cardH = 38;

    events.forEach((ev, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = colCenters[col];
      const y = rowCenters[row];

      const container = this.add.container(x, y);

      // Card Background
      const bg = this.add.rectangle(0, 0, cardW, cardH, 0x09182a)
        .setStrokeStyle(1, 0x284f76);
      bg.setInteractive({ draggable: true, useHandCursor: true });

      // Location accent stripe on left edge
      const stripeColor = this.getLocationColor(ev.description);
      const stripe = this.add.rectangle(-cardW / 2 + 2, 0, 4, cardH - 2, stripeColor);

      // Top line: Time badge & Location tag
      const locTag = this.getLocationTag(ev.description);
      const timeTxt = this.add.text(-cardW / 2 + 8, -cardH / 2 + 3, `⏱ ${ev.time}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '8.5px',
        color: '#ffd700',
        fontStyle: 'bold'
      });

      const locTxt = this.add.text(cardW / 2 - 5, -cardH / 2 + 3, locTag, {
        fontFamily: 'Courier New, monospace',
        fontSize: '7.5px',
        color: '#7ac4d4'
      }).setOrigin(1, 0);

      // Event short description
      const descShort = this.getCardShortDescription(ev);
      const descTxt = this.add.text(-cardW / 2 + 8, -cardH / 2 + 15, descShort, {
        fontFamily: 'Courier New, monospace',
        fontSize: '7.5px',
        color: '#d0dfed',
        lineSpacing: 1,
        wordWrap: { width: cardW - 14 }
      });

      container.add([bg, stripe, timeTxt, locTxt, descTxt]);

      (container as any).eventData = ev;
      (container as any).homeX = x;
      (container as any).homeY = y;

      this.cards.push(container);

      // Drag mechanics
      this.input.setDraggable(bg);
      let wasDragged = false;

      bg.on('dragstart', () => {
        wasDragged = true;
        this.children.bringToTop(container);
        bg.setStrokeStyle(2, 0xffd700);
      });

      bg.on('drag', (pointer: Phaser.Input.Pointer) => {
        container.x = pointer.x;
        container.y = pointer.y;
      });

      bg.on('dragend', () => {
        bg.setStrokeStyle(1, 0x284f76);
        this.handleCardDrop(container);
        this.time.delayedCall(80, () => { wasDragged = false; });
      });

      // Click to toggle place / return
      bg.on('pointerup', () => {
        if (wasDragged) return;
        const evData = (container as any).eventData;
        const currentSlotIdx = this.slotContents.indexOf(evData);

        if (currentSlotIdx !== -1) {
          // Return home
          this.slotContents[currentSlotIdx] = null;
          this.tweens.add({
            targets: container,
            x: (container as any).homeX,
            y: (container as any).homeY,
            duration: 200
          });
          AudioManager.getInstance().playSFX('button_click');
          this.updateGhosts();
        } else {
          // Find first empty slot
          const firstEmpty = this.slotContents.indexOf(null);
          if (firstEmpty !== -1) {
            this.slotContents[firstEmpty] = evData;
            const slot = this.slots[firstEmpty];
            this.tweens.add({
              targets: container,
              x: slot.x,
              y: slot.y,
              duration: 200
            });
            AudioManager.getInstance().playSFX('item_pickup');
            this.updateGhosts();
          }
        }
      });
    });
  }

  private getLocationColor(desc: string): number {
    if (desc.includes('Exhibition Chamber') || desc.includes('thermos') || desc.includes('succumbs')) return 0xb71c1c; // Chamber Crimson
    if (desc.includes('Library')) return 0x2e7d32; // Library Green
    if (desc.includes('Pendulum')) return 0x1565c0; // Pendulum Blue
    if (desc.includes('Clockwork Gallery')) return 0xf57f17; // Gallery Amber
    return 0x546e7a;
  }

  private getLocationTag(desc: string): string {
    if (desc.includes('Exhibition Chamber') || desc.includes('thermos') || desc.includes('succumbs')) return '[Chamber]';
    if (desc.includes('Library')) return '[Library]';
    if (desc.includes('Pendulum')) return '[Pendulum]';
    if (desc.includes('Clockwork Gallery')) return '[Gallery]';
    return '[Hall]';
  }

  private getCardShortDescription(ev: TimelineEvent): string {
    switch (ev.id) {
      case 'event_lantern':
        return 'Nadia steals lantern from Library.';
      case 'event_poison':
        return 'Nadia slips solvent into tea thermos.';
      case 'event_recording':
        return 'Spliced speech plays over PA system.';
      case 'event_death':
        return 'Prof. Sable dies of poison in chamber.';
      case 'event_blackout':
        return '13th chime triggers room blackout.';
      case 'event_hugo_discovery':
        return 'Hugo finds dead father via flue.';
      case 'event_locked_room':
        return 'Hugo bolts door & escapes via flue.';
      case 'event_petra_snooping':
        return 'Petra plants mic in Clockwork Gallery.';
      default:
        return ev.description.length > 45 ? ev.description.substring(0, 42) + '...' : ev.description;
    }
  }

  private createTimelineSlots() {
    this.add.text(14, 248, 'HYPOTHESIS TIMELINE SEQUENCE (5 Chronological Order Slots):', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      color: '#ffd700',
      fontStyle: 'bold',
      letterSpacing: 0.5
    });

    const slotW = 114;
    const slotH = 72;
    const slotCenters = [72, 196, 320, 444, 568];
    const slotY = 296;
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V'];
    const slotGuides = [
      '1. Initial Action',
      '2. Broadcast Cue',
      '3. Crime Reaction',
      '4. Breach Discovery',
      '5. Locked Room'
    ];

    for (let i = 0; i < 5; i++) {
      const x = slotCenters[i];

      // Outer Slot Plate
      const slot = this.add.rectangle(x, slotY, slotW, slotH, 0x051222, 0.8)
        .setStrokeStyle(1.5, 0x224870);
      this.slots.push(slot);

      // Step Tag Badge on Left
      this.add.text(x - slotW / 2 + 6, slotY - slotH / 2 + 6, romanNumerals[i], {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#ffd700',
        fontStyle: 'bold'
      });

      // Guide label aligned on Right
      this.add.text(x + slotW / 2 - 6, slotY - slotH / 2 + 7, slotGuides[i], {
        fontFamily: 'Courier New, monospace',
        fontSize: '7px',
        color: '#7faac8'
      }).setOrigin(1, 0);

      // Empty slot prompt
      this.add.text(x, slotY + 8, '[ Drop Event ]', {
        fontFamily: 'Courier New, monospace',
        fontSize: '8px',
        color: '#2a5078',
        fontStyle: 'italic'
      }).setOrigin(0.5);

      // Bottom slot footer tag
      this.add.text(x, slotY + slotH / 2 + 9, `SLOT ${i + 1}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '8.5px',
        color: '#4ac4d4',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }
  }

  private handleCardDrop(card: Phaser.GameObjects.Container) {
    let placed = false;

    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (Math.abs(card.x - slot.x) < 58 && Math.abs(card.y - slot.y) < 36) {
        const evData = (card as any).eventData;
        const oldIndex = this.slotContents.indexOf(evData);
        if (oldIndex !== -1) this.slotContents[oldIndex] = null;

        // If slot already occupied, return the prior card home
        if (this.slotContents[i]) {
          const oldEv = this.slotContents[i];
          const oldCard = this.cards.find(c => (c as any).eventData === oldEv);
          if (oldCard) {
            this.tweens.add({
              targets: oldCard,
              x: (oldCard as any).homeX,
              y: (oldCard as any).homeY,
              duration: 200
            });
          }
        }

        this.slotContents[i] = evData;
        card.x = slot.x;
        card.y = slot.y;
        placed = true;
        AudioManager.getInstance().playSFX('item_pickup');
        this.updateGhosts();
        break;
      }
    }

    if (!placed) {
      const evData = (card as any).eventData;
      const oldIndex = this.slotContents.indexOf(evData);
      if (oldIndex !== -1) {
        this.slotContents[oldIndex] = null;
        this.updateGhosts();
      }

      this.tweens.add({
        targets: card,
        x: (card as any).homeX,
        y: (card as any).homeY,
        duration: 200
      });
    }
  }

  private clearTimeline() {
    AudioManager.getInstance().playSFX('button_click');
    this.slotContents = [null, null, null, null, null];
    this.cards.forEach(card => {
      this.tweens.add({
        targets: card,
        x: (card as any).homeX,
        y: (card as any).homeY,
        duration: 200
      });
    });
    this.slots.forEach(s => s.setStrokeStyle(1.5, 0x224870));
    this.updateGhosts();
  }

  private validate() {
    AudioManager.getInstance().playSFX('button_click');

    if (this.slotContents.includes(null)) {
      this.showFeedbackBanner('⚠ Fill all 5 timeline sequence slots before validating!', '#ffaa00', 0x3d2810);
      AudioManager.getInstance().playSFX('error_buzz');
      return;
    }

    if (this.currentHypothesis !== 'B') {
      this.showFeedbackBanner('⚠ Hypothesis A is contradicted by forensic evidence! Switch to Hypothesis B.', '#ff6666', 0x3d1414);
      this.cameras.main.shake(200, 0.008);
      AudioManager.getInstance().playSFX('error_buzz');
      return;
    }

    // Hypothesis B correct chronological sequence:
    // 1. Poison (event_poison)
    // 2. Pre-recording (event_recording)
    // 3. Death (event_death)
    // 4. Hugo Discovery (event_hugo_discovery)
    // 5. Locked Room (event_locked_room)
    const correctIds = [
      'event_poison',
      'event_recording',
      'event_death',
      'event_hugo_discovery',
      'event_locked_room'
    ];

    let wrongIndex = -1;
    for (let i = 0; i < 5; i++) {
      if (this.slotContents[i]!.id !== correctIds[i]) {
        wrongIndex = i;
        break;
      }
    }

    if (wrongIndex === -1) {
      // SUCCESS!
      this.slots.forEach(s => s.setStrokeStyle(2.5, 0x00ff77));
      AudioManager.getInstance().playSFX('success_jingle');

      gameState.setDialogueFlag('reconstruction_complete');
      gameState.completeReconstruction();

      this.showFeedbackBanner('✦ RECONSTRUCTION COMPLETE: TIMELINE VERIFIED ✦', '#76ff9c', 0x144222);

      this.time.delayedCall(1600, () => {
        SceneTransition.fadeToBlack(this, 800, () => {
          storyManager.advancePhase();
          this.scene.start('ExplorationScene', { roomId: 'main_hall' });
        });
      });
    } else {
      // Erroneous slot
      this.slots[wrongIndex].setStrokeStyle(3, 0xff3333);
      this.cameras.main.shake(220, 0.008);
      AudioManager.getInstance().playSFX('error_buzz');

      const expectedNames = [
        '1. Nadia slipping poison into thermos',
        '2. PA spliced broadcast',
        '3. Professor succumbing to poison',
        '4. Hugo discovery via secret flue',
        '5. Hugo bolting door from inside'
      ];

      this.showFeedbackBanner(
        `⚠ Inconsistency at Slot ${wrongIndex + 1}. Expected: ${expectedNames[wrongIndex]}.`,
        '#ff5555',
        0x3d1414
      );

      this.time.delayedCall(1200, () => {
        this.slots[wrongIndex].setStrokeStyle(1.5, 0x224870);
      });
    }
  }

  private showFeedbackBanner(msg: string, textColor: string, bgColor: number) {
    if (this.feedbackBanner) {
      this.feedbackBanner.destroy();
      this.feedbackBanner = undefined;
    }

    const container = this.add.container(320, 246);
    const bg = this.add.rectangle(0, 0, 520, 22, bgColor, 0.95)
      .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(textColor).color);
    const txt = this.add.text(0, 0, msg, {
      fontFamily: 'Courier New, monospace',
      fontSize: '9.5px',
      color: textColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, txt]);
    container.setDepth(200);
    this.feedbackBanner = container;

    this.tweens.add({
      targets: container,
      alpha: 0,
      delay: 2400,
      duration: 600,
      onComplete: () => {
        container.destroy();
        if (this.feedbackBanner === container) this.feedbackBanner = undefined;
      }
    });
  }

  private updateGhosts() {
    this.ghostVisuals.forEach(g => g.destroy());
    this.ghostVisuals = [];

    const diagX = 346;
    const diagY = 92;

    this.slotContents.forEach(ev => {
      if (!ev) return;

      if (ev.id.includes('poison') || ev.id.includes('death')) {
        // Professor Sable at desk
        const container = this.add.container(diagX, diagY);
        const wave = this.add.circle(0, 0, 10, 0x7ac4d4, 0.35);
        this.tweens.add({ targets: wave, scale: 1.4, alpha: 0, duration: 1200, repeat: -1 });
        const sprite = this.add.sprite(0, 0, 'char_aldric', 'down_0').setTint(0x7ac4d4).setAlpha(0.9);
        container.add([wave, sprite]);
        container.setDepth(15);
        this.ghostVisuals.push(container);
      }

      if (ev.id.includes('hugo') || ev.id.includes('locked_room')) {
        // Hugo near hidden passage
        const container = this.add.container(diagX + 68, diagY - 14);
        const wave = this.add.circle(0, 0, 10, 0x4ac47a, 0.35);
        this.tweens.add({ targets: wave, scale: 1.4, alpha: 0, duration: 1200, repeat: -1 });
        const sprite = this.add.sprite(0, 0, 'char_hugo', 'down_0').setTint(0x4ac47a).setAlpha(0.9);
        container.add([wave, sprite]);
        container.setDepth(15);
        this.ghostVisuals.push(container);
      }

      if (ev.id.includes('lantern') || ev.id.includes('recording')) {
        // Nadia near entrance
        const container = this.add.container(diagX - 68, diagY);
        const wave = this.add.circle(0, 0, 10, 0xda70d6, 0.35);
        this.tweens.add({ targets: wave, scale: 1.4, alpha: 0, duration: 1200, repeat: -1 });
        const sprite = this.add.sprite(0, 0, 'char_nadia', 'down_0').setTint(0xda70d6).setAlpha(0.9);
        container.add([wave, sprite]);
        container.setDepth(15);
        this.ghostVisuals.push(container);
      }
    });
  }
}
