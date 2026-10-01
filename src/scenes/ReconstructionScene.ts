import Phaser from 'phaser';
import { gameState } from '../logic/GameState';
import { AudioManager } from '../engine/AudioManager';
import { SceneTransition } from '../engine/SceneTransition';
import { timeline, TimelineEvent } from '../data/timeline';

export class ReconstructionScene extends Phaser.Scene {
  private slots: Phaser.GameObjects.Rectangle[] = [];
  private slotContents: (TimelineEvent | null)[] = [null, null, null, null, null];
  private currentHypothesis: 'A' | 'B' = 'A';
  private cards: Phaser.GameObjects.Container[] = [];
  private ghostVisuals: Phaser.GameObjects.Rectangle[] = [];
  
  constructor() {
    super('ReconstructionScene');
  }

  create() {
    // 1. Dark blueprint-style background with grid
    this.add.rectangle(0, 0, 640, 360, 0x001133).setOrigin(0);
    this.drawGrid();

    // 2. Room layout diagram
    this.createDiagram();

    // 3. Hypothesis tabs
    this.createTabs();

    // 4. Timeline slots
    this.createTimelineSlots();

    // 5 & 6. Draggable event cards
    this.createEventCards();

    // 8, 10, 11. Buttons
    this.createButtons();

    // Play music or ambiance if needed
    // AudioManager.getInstance().startMusic('reconstruction_theme');
  }

  private drawGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x335588, 0.3);
    for (let x = 0; x < 640; x += 32) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, 360);
    }
    for (let y = 0; y < 360; y += 32) {
      graphics.moveTo(0, y);
      graphics.lineTo(640, y);
    }
    graphics.strokePath();
  }

  private createDiagram() {
    // Room layout diagram of the Exhibition Chamber at top
    const diagX = 320;
    const diagY = 80;
    
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x4488ff, 1);
    
    // Walls
    graphics.strokeRect(diagX - 100, diagY - 50, 200, 100);
    
    // Desk
    graphics.fillStyle(0x3366cc, 0.5);
    graphics.fillRect(diagX - 20, diagY - 10, 40, 20);
    
    // Main Door
    graphics.lineStyle(3, 0xffaa00, 1);
    graphics.beginPath();
    graphics.moveTo(diagX - 100, diagY + 10);
    graphics.lineTo(diagX - 100, diagY + 40);
    graphics.strokePath();
    this.add.text(diagX - 130, diagY + 15, 'Door', { fontSize: '10px', color: '#fa0' });

    // Hidden Passage
    graphics.lineStyle(3, 0xff00aa, 1);
    graphics.beginPath();
    graphics.moveTo(diagX + 80, diagY - 50);
    graphics.lineTo(diagX + 100, diagY - 50);
    graphics.strokePath();
    this.add.text(diagX + 85, diagY - 70, 'Hidden\nPassage', { fontSize: '10px', color: '#f0a' });

    this.add.text(diagX, diagY - 60, 'Exhibition Chamber', { fontSize: '12px', color: '#48f' }).setOrigin(0.5);
  }

  private createTabs() {
    const tabA = this.add.rectangle(120, 20, 100, 24, this.currentHypothesis === 'A' ? 0x224488 : 0x112244)
      .setInteractive()
      .on('pointerdown', () => this.switchHypothesis('A'));
    const textA = this.add.text(120, 20, 'Hypothesis A', { fontSize: '12px' }).setOrigin(0.5);

    const tabB = this.add.rectangle(240, 20, 100, 24, this.currentHypothesis === 'B' ? 0x224488 : 0x112244)
      .setInteractive()
      .on('pointerdown', () => this.switchHypothesis('B'));
    const textB = this.add.text(240, 20, 'Hypothesis B', { fontSize: '12px' }).setOrigin(0.5);

    this.events.on('hypothesis_changed', () => {
      tabA.fillColor = this.currentHypothesis === 'A' ? 0x224488 : 0x112244;
      tabB.fillColor = this.currentHypothesis === 'B' ? 0x224488 : 0x112244;
      
      const descA = "Sable alive during announcement, killed in blackout.\nKiller entered via main door.";
      const descB = "Sable dead before announcement (poisoned).\nPre-recorded announcement. Hugo locked room via passage.";
      descText.setText(this.currentHypothesis === 'A' ? descA : descB);
      
      this.clearTimeline();
    });

    const descText = this.add.text(320, 20, "Sable alive during announcement, killed in blackout.\nKiller entered via main door.", { fontSize: '10px', color: '#aaa' });
  }

  private switchHypothesis(hyp: 'A' | 'B') {
    if (this.currentHypothesis !== hyp) {
      this.currentHypothesis = hyp;
      AudioManager.getInstance().playSFX('button_click');
      this.events.emit('hypothesis_changed');
    }
  }

  private createTimelineSlots() {
    const startX = 60;
    const spacing = 130;
    const y = 300;

    for (let i = 0; i < 5; i++) {
      const slot = this.add.rectangle(startX + i * spacing, y, 120, 80, 0x000000, 0.5)
        .setStrokeStyle(2, 0x4488ff);
      this.slots.push(slot);
      
      this.add.text(startX + i * spacing, y + 50, `Slot ${i + 1}`, { fontSize: '12px', color: '#48f' }).setOrigin(0.5);
    }
  }

  private createEventCards() {
    const events = Object.values(timeline);
    let startX = 40;
    let startY = 160;
    
    events.forEach((ev, i) => {
      const x = startX + (i % 4) * 150;
      const y = startY + Math.floor(i / 4) * 50;

      const container = this.add.container(x, y);
      
      const bg = this.add.rectangle(0, 0, 140, 40, this.getLocationColor(ev.description)).setStrokeStyle(1, 0xffffff);
      bg.setInteractive({ draggable: true });
      
      const timeText = this.add.text(-65, -15, ev.time, { fontSize: '10px', color: '#fff', fontStyle: 'bold' });
      const descText = this.add.text(-65, 0, ev.description.length > 35 ? ev.description.substring(0, 35) + '...' : ev.description, { fontSize: '9px', color: '#fff', wordWrap: { width: 130 } });

      container.add([bg, timeText, descText]);
      
      // Store event data
      (container as any).eventData = ev;
      (container as any).homeX = x;
      (container as any).homeY = y;
      
      this.cards.push(container);

      // Drag events
      this.input.setDraggable(bg);
      
      bg.on('dragstart', () => {
        this.children.bringToTop(container);
        bg.setStrokeStyle(2, 0xffff00);
      });

      bg.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        container.x = x + dragX;
        container.y = y + dragY;
      });

      bg.on('dragend', () => {
        bg.setStrokeStyle(1, 0xffffff);
        this.handleCardDrop(container);
      });
    });
  }

  private getLocationColor(desc: string): number {
    if (desc.includes('Exhibition Chamber')) return 0x662222;
    if (desc.includes('Library')) return 0x226622;
    if (desc.includes('Pendulum')) return 0x222266;
    if (desc.includes('Clockwork Gallery')) return 0x666622;
    return 0x444444;
  }

  private handleCardDrop(card: Phaser.GameObjects.Container) {
    let placed = false;
    
    // Check intersection with slots
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (Math.abs(card.x - slot.x) < 60 && Math.abs(card.y - slot.y) < 40) {
        // Remove from old slot if any
        const evData = (card as any).eventData;
        const oldIndex = this.slotContents.indexOf(evData);
        if (oldIndex !== -1) this.slotContents[oldIndex] = null;
        
        // If slot occupied, send old card home
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
        
        // Place new card
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
      // Remove from slot if it was in one
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

  private createButtons() {
    // VALIDATE
    const validateBtn = this.add.rectangle(560, 80, 100, 30, 0x228822).setInteractive();
    this.add.text(560, 80, 'VALIDATE', { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5);
    validateBtn.on('pointerdown', () => this.validate());

    // CLEAR
    const clearBtn = this.add.rectangle(560, 120, 100, 30, 0x882222).setInteractive();
    this.add.text(560, 120, 'CLEAR', { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5);
    clearBtn.on('pointerdown', () => this.clearTimeline());

    // BACK
    const backBtn = this.add.rectangle(40, 20, 60, 24, 0x444444).setInteractive();
    this.add.text(40, 20, 'BACK', { fontSize: '12px' }).setOrigin(0.5);
    backBtn.on('pointerdown', () => {
      AudioManager.getInstance().playSFX('button_click');
      SceneTransition.fadeToBlack(this, 500, () => {
        this.scene.start('ExplorationScene');
      });
    });
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
    this.updateGhosts();
  }

  private validate() {
    AudioManager.getInstance().playSFX('button_click');
    
    // Check if fully filled
    if (this.slotContents.includes(null)) {
      this.showFeedback('Fill all 5 slots first!', 0xff0000);
      return;
    }

    if (this.currentHypothesis !== 'B') {
      this.showFeedback('Hypothesis A contradicts evidence.', 0xff0000);
      this.cameras.main.shake(200, 0.01);
      return;
    }

    // Hypothesis B correct sequence:
    // 1. Poison (id: event_poison)
    // 2. Pre-recording (id: event_recording)
    // 3. Death (id: event_death)
    // 4. Hugo Discovery (id: event_hugo_discovery)
    // 5. Locked Room (id: event_locked_room)
    
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
      // Success!
      this.slots.forEach(s => s.setStrokeStyle(4, 0x00ff00));
      AudioManager.getInstance().playSFX('success_jingle');
      
      gameState.setDialogueFlag('reconstruction_complete');
      gameState.completeReconstruction();
      
      const successText = this.add.text(320, 180, 'RECONSTRUCTION COMPLETE', {
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#00ff00',
        backgroundColor: '#000000'
      }).setOrigin(0.5).setPadding(10);
      
      this.time.delayedCall(2000, () => {
        SceneTransition.fadeToBlack(this, 1000, () => {
          this.scene.start('ExplorationScene');
        });
      });
    } else {
      // Wrong
      this.slots[wrongIndex].setStrokeStyle(4, 0xff0000);
      this.cameras.main.shake(200, 0.01);
      this.showFeedback(`Slot ${wrongIndex + 1} is incorrect.`, 0xff0000);
      AudioManager.getInstance().playSFX('error_buzz');
      
      this.time.delayedCall(1000, () => {
        this.slots[wrongIndex].setStrokeStyle(2, 0x4488ff);
      });
    }
  }

  private showFeedback(msg: string, color: number) {
    const text = this.add.text(320, 240, msg, { fontSize: '16px', color: '#fff', backgroundColor: '#000' })
      .setOrigin(0.5)
      .setPadding(5);
    text.setTint(color);
    
    this.tweens.add({
      targets: text,
      alpha: 0,
      y: 220,
      duration: 2000,
      onComplete: () => text.destroy()
    });
  }

  private updateGhosts() {
    // Clear old ghosts
    this.ghostVisuals.forEach(g => g.destroy());
    this.ghostVisuals = [];
    
    const diagX = 320;
    const diagY = 80;

    // Based on events in slots, show where suspects are
    this.slotContents.forEach((ev, i) => {
      if (!ev) return;
      
      // Simple ghost representation logic
      if (ev.id.includes('poison') || ev.id.includes('death')) {
        // Show Sable at desk
        const ghost = this.add.rectangle(diagX, diagY, 10, 10, 0xaaaaaa, 0.6);
        this.ghostVisuals.push(ghost);
      }
      
      if (ev.id.includes('hugo') || ev.id.includes('locked_room')) {
        // Show Hugo near hidden passage
        const ghost = this.add.rectangle(diagX + 70, diagY - 40, 10, 10, 0x00ff00, 0.6);
        this.ghostVisuals.push(ghost);
      }
      
      if (ev.id.includes('lantern') || ev.id.includes('recording')) {
        // Show Nadia (maybe near door or outside)
        const ghost = this.add.rectangle(diagX - 80, diagY + 20, 10, 10, 0xff00ff, 0.6);
        this.ghostVisuals.push(ghost);
      }
    });
  }
}
