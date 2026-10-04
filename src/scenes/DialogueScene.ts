import { Scene } from 'phaser';
import { dialogue, DialogueTree, DialogueNode } from '../data/dialogue';
import { gameState } from '../logic/GameState';
import { EventBus } from '../engine/EventBus';
import { PortraitRenderer } from '../rendering/PortraitRenderer';

export class DialogueScene extends Scene {
  private dialogueId!: string;
  private suspectId?: string;
  private tree: DialogueTree | null = null;
  private currentNode: DialogueNode | null = null;
  
  private container!: HTMLElement;
  private speakerEl!: HTMLElement;
  private textEl!: HTMLElement;
  private choicesEl!: HTMLElement;
  private continueEl!: HTMLElement;

  private typewriterTimer: number | null = null;
  private isTyping: boolean = false;
  private fullText: string = '';
  
  private portraitRect!: Phaser.GameObjects.Rectangle;
  private selectedChoiceIndex: number = 0;
  private currentChoices: { text: string; nextId: string }[] = [];

  constructor() {
    super('DialogueScene');
  }

  init(data: { dialogueId: string; suspectId?: string }) {
    this.dialogueId = data.dialogueId;
    this.suspectId = data.suspectId;
  }

  create() {
    if (this.suspectId) {
      gameState.markSuspectInterviewed(this.suspectId);
    }

    this.setupDOM();

    this.events.once('shutdown', () => {
      if (this.container) {
        this.container.onclick = null;
      }
      if (this.continueEl) {
        this.continueEl.onclick = null;
      }
      if (this.typewriterTimer !== null) {
        window.clearInterval(this.typewriterTimer);
        this.typewriterTimer = null;
      }
    });

    this.input.keyboard?.on('keydown-SPACE', this.handleAdvance, this);
    this.input.keyboard?.on('keydown-E', this.handleAdvance, this);
    this.input.on('pointerdown', this.handleAdvance, this);
    
    this.input.keyboard?.on('keydown-UP', this.handleChoiceUp, this);
    this.input.keyboard?.on('keydown-DOWN', this.handleChoiceDown, this);
    this.input.keyboard?.on('keydown-ENTER', this.handleChoiceEnter, this);

    this.input.keyboard?.on('keydown-ONE', () => this.makeChoice(0), this);
    this.input.keyboard?.on('keydown-TWO', () => this.makeChoice(1), this);
    this.input.keyboard?.on('keydown-THREE', () => this.makeChoice(2), this);
    this.input.keyboard?.on('keydown-FOUR', () => this.makeChoice(3), this);

    this.tree = dialogue[this.dialogueId];

    if (!this.tree) {
      this.showFallbackMessage();
    } else {
      this.displayNode(this.tree.nodes[this.tree.startNode]);
    }
  }

  private setupDOM() {
    this.container = document.getElementById('dialogue-container') as HTMLElement;
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'dialogue-container';
      this.container.style.position = 'absolute';
      this.container.style.bottom = '20px';
      this.container.style.left = '160px';
      this.container.style.width = 'calc(100% - 180px)';
      this.container.style.height = '200px';
      this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      this.container.style.color = '#fff';
      this.container.style.padding = '20px';
      this.container.style.boxSizing = 'border-box';
      this.container.style.fontFamily = 'monospace';
      this.container.style.fontSize = '18px';
      this.container.style.zIndex = '1000';
      document.body.appendChild(this.container);
    }
    this.container.style.display = 'flex';

    let avatarEl = document.getElementById('dialogue-avatar');
    if (!avatarEl) {
      avatarEl = document.createElement('div');
      avatarEl.id = 'dialogue-avatar';
      this.container.prepend(avatarEl);
    }

    this.speakerEl = document.getElementById('dialogue-speaker') as HTMLElement;
    if (!this.speakerEl) {
      this.speakerEl = document.createElement('div');
      this.speakerEl.id = 'dialogue-speaker';
      this.speakerEl.style.fontWeight = 'bold';
      this.speakerEl.style.marginBottom = '10px';
      this.speakerEl.style.fontSize = '24px';
      this.container.appendChild(this.speakerEl);
    }

    this.textEl = document.getElementById('dialogue-text') as HTMLElement;
    if (!this.textEl) {
      this.textEl = document.createElement('div');
      this.textEl.id = 'dialogue-text';
      this.textEl.style.marginBottom = '20px';
      this.container.appendChild(this.textEl);
    }

    this.choicesEl = document.getElementById('dialogue-choices') as HTMLElement;
    if (!this.choicesEl) {
      this.choicesEl = document.createElement('div');
      this.choicesEl.id = 'dialogue-choices';
      this.container.appendChild(this.choicesEl);
    }

    this.continueEl = document.getElementById('dialogue-continue') as HTMLElement;
    if (!this.continueEl) {
      this.continueEl = document.createElement('div');
      this.continueEl.id = 'dialogue-continue';
      this.continueEl.style.position = 'absolute';
      this.continueEl.style.bottom = '10px';
      this.continueEl.style.right = '20px';
      this.continueEl.style.fontSize = '14px';
      this.continueEl.style.color = '#aaa';
      this.container.appendChild(this.continueEl);
    }

    // Enable mouse click to advance dialogue or complete typewriter text immediately
    this.container.onclick = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest('.dialogue-choice')) {
        return;
      }
      this.handleAdvance();
    };

    if (this.continueEl) {
      this.continueEl.onclick = (e: MouseEvent) => {
        e.stopPropagation();
        this.handleAdvance();
      };
      this.continueEl.style.cursor = 'pointer';
    }
  }

  private showFallbackMessage() {
    this.speakerEl.textContent = '???';
    this.speakerEl.style.color = '#d4af37';
    this.updatePortraitColor('#d4af37');
    this.currentNode = null;
    this.startTypewriter("I don't have anything to say right now.");
    this.choicesEl.innerHTML = '';
    this.continueEl.style.display = 'block';
    this.continueEl.textContent = '▼ Click to continue (or press [E] / [Space])';
  }

  private displayNode(node: DialogueNode) {
    this.currentNode = node;
    
    if (node.setFlag) {
      gameState.setDialogueFlag(node.setFlag);
    }
    if (node.giveEvidence) {
      gameState.collectEvidence(node.giveEvidence);
    }
    
    const colorMap: Record<string, string> = {
      'Ren': '#1e78d6',
      'Dr. Vale': '#44aa88',
      'Nadia': '#aa4466',
      'Hugo': '#aa8844',
      'Petra': '#66aa44',
      'Felix': '#8844aa',
      'Iris': '#4466aa'
    };
    const colorHex = colorMap[node.speaker] || '#d4af37';
    
    this.speakerEl.textContent = node.speaker;
    this.speakerEl.style.color = colorHex;
    this.updatePortraitColor(colorHex);

    this.choicesEl.innerHTML = '';
    this.continueEl.style.display = 'none';

    this.startTypewriter(node.text);
  }

  private updatePortraitColor(hexColor: string) {
    const avatarEl = document.getElementById('dialogue-avatar');
    if (!avatarEl) return;

    avatarEl.style.borderColor = hexColor;

    // Map speaker to character ID
    const speakerMap: Record<string, string> = {
      'Ren': 'ren',
      'Dr. Vale': 'vale',
      'Nadia': 'nadia',
      'Nadia Thorn': 'nadia',
      'Hugo': 'hugo',
      'Dr. Hugo': 'hugo',
      'Dr. Hugo Wren': 'hugo',
      'Petra': 'petra',
      'Petra Solano': 'petra',
      'Felix': 'felix',
      'Felix Ashworth': 'felix',
      'Iris': 'iris',
      'Iris Blackwell': 'iris',
      'Aldric': 'aldric',
      'Professor Sable': 'aldric',
      'Prof. Sable': 'aldric'
    };

    const charId = speakerMap[this.speakerEl.textContent || ''] || this.suspectId || 'ren';
    
    // Determine expression dynamically based on node config or narrative tone
    let expression = 'neutral';
    if (this.currentNode?.portrait) {
      expression = this.currentNode.portrait;
    } else if (this.currentNode?.text) {
      const txt = this.currentNode.text;
      if (txt.includes('?!') || txt.includes('What?!') || txt.includes('Dead?!') || txt.includes('Murdered')) {
        expression = 'surprised';
      } else if (txt.includes('Hmm') || txt.includes('Let\'s see') || txt.includes('Perhaps') || txt.includes('Curious')) {
        expression = 'thinking';
      } else if (txt.includes('Nonsense!') || txt.includes('How dare you') || txt.includes('Ridiculous!')) {
        expression = 'angry';
      } else if (txt.includes('I... I') || txt.includes('nervous') || txt.includes('Please, Detective')) {
        expression = 'nervous';
      }
    }

    const portraitKey = PortraitRenderer.generatePortrait(this, charId, expression);

    if (this.textures.exists(portraitKey)) {
      try {
        const tex = this.textures.get(portraitKey);
        const src = tex.getSourceImage() as HTMLCanvasElement;
        if (src && src.toDataURL) {
          avatarEl.style.backgroundImage = `url(${src.toDataURL()})`;
          avatarEl.style.backgroundSize = 'cover';
          avatarEl.style.backgroundPosition = 'center';
          avatarEl.style.imageRendering = 'pixelated';
          avatarEl.textContent = '';
          return;
        }
      } catch (e) {}
    }

    // Fallback if texture not yet rendered
    avatarEl.style.backgroundImage = 'none';
    avatarEl.style.backgroundColor = hexColor;
    avatarEl.textContent = this.speakerEl.textContent ? this.speakerEl.textContent.charAt(0) : '?';
  }

  private startTypewriter(text: string) {
    this.fullText = text;
    this.textEl.textContent = '';
    this.isTyping = true;
    
    let charIndex = 0;
    if (this.typewriterTimer !== null) {
      window.clearInterval(this.typewriterTimer);
    }
    
    const speedSetting = typeof window !== 'undefined' ? parseInt(localStorage.getItem('setting_text_speed') || '3', 10) : 3;
    const interval = Math.max(8, 30 - (speedSetting - 3) * 8);

    this.typewriterTimer = window.setInterval(() => {
      this.textEl.textContent += this.fullText[charIndex];
      charIndex++;
      
      if (charIndex >= this.fullText.length) {
        this.finishTypewriter();
      }
    }, interval);
  }

  private finishTypewriter() {
    if (this.typewriterTimer !== null) {
      window.clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }
    this.textEl.textContent = this.fullText;
    this.isTyping = false;

    if (this.currentNode) {
      this.showChoicesOrContinue();
    } else {
      this.continueEl.style.display = 'block';
    }
  }

  private showChoicesOrContinue() {
    if (!this.currentNode) return;
    
    let hasChoices = false;
    this.currentChoices = [];
    this.selectedChoiceIndex = 0;

    if (this.currentNode.choices && this.currentNode.choices.length > 0) {
      const validChoices = this.currentNode.choices.filter(choice => {
        if (choice.evidenceRequired && !gameState.hasEvidence(choice.evidenceRequired)) {
          return false;
        }
        if (choice.condition && !gameState.hasDialogueFlag(choice.condition)) {
          return false;
        }
        return true;
      });

      if (validChoices.length > 0) {
        hasChoices = true;
        this.currentChoices = validChoices.map(c => ({ text: c.text, nextId: c.nextId }));
        this.renderChoices();
      }
    }

    if (!hasChoices) {
      this.continueEl.style.display = 'block';
      this.continueEl.textContent = '▼ Click to continue (or press [E] / [Space])';
      this.continueEl.style.cursor = 'pointer';
    }
  }

  private renderChoices() {
    this.choicesEl.innerHTML = '';
    this.currentChoices.forEach((choice, index) => {
      const btn = document.createElement('div');
      btn.className = `dialogue-choice ${index === this.selectedChoiceIndex ? 'selected' : ''}`;
      btn.textContent = `[${index + 1}] ${choice.text}`;
      btn.style.cursor = 'pointer';
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      
      btn.onmouseenter = () => {
        this.selectedChoiceIndex = index;
        this.updateChoiceSelection();
      };
      
      btn.onclick = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        this.makeChoice(index);
      };

      btn.onpointerdown = (e: PointerEvent) => {
        e.stopPropagation();
      };
      
      this.choicesEl.appendChild(btn);
    });
  }

  private updateChoiceSelection() {
    const choiceEls = this.choicesEl.querySelectorAll('.dialogue-choice');
    choiceEls.forEach((el, idx) => {
      if (idx === this.selectedChoiceIndex) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  private handleChoiceUp() {
    if (!this.isTyping && this.currentChoices.length > 0) {
      this.selectedChoiceIndex = (this.selectedChoiceIndex - 1 + this.currentChoices.length) % this.currentChoices.length;
      this.updateChoiceSelection();
    }
  }

  private handleChoiceDown() {
    if (!this.isTyping && this.currentChoices.length > 0) {
      this.selectedChoiceIndex = (this.selectedChoiceIndex + 1) % this.currentChoices.length;
      this.updateChoiceSelection();
    }
  }

  private handleChoiceEnter() {
    if (!this.isTyping && this.currentChoices.length > 0) {
      this.makeChoice(this.selectedChoiceIndex);
    } else {
      this.handleAdvance();
    }
  }

  private makeChoice(index: number) {
    if (index >= 0 && index < this.currentChoices.length) {
      const nextId = this.currentChoices[index].nextId;
      this.advanceToNode(nextId);
    }
  }

  private handleAdvance() {
    if (this.isTyping) {
      this.finishTypewriter();
      return;
    }

    if (!this.currentNode) {
      this.endDialogue();
      return;
    }

    if (this.currentChoices.length > 0) {
      return;
    }

    if (this.currentNode.triggerEvent) {
      const event = this.currentNode.triggerEvent;
      if (event === 'end_dialogue') {
        this.endDialogue();
        return;
      } else if (event === 'trigger_ending') {
        if (typeof (gameState as any).identifyKiller === 'function') {
          (gameState as any).identifyKiller();
        }
        this.container.style.display = 'none';
        this.scene.start('CutsceneScene', { cutsceneId: 'ending' });
        return;
      } else if (event === 'start_investigation') {
        const allGadgets = ['tranquility_focus', 'echo_lens', 'trace_light', 'micro_rover', 'voice_prism'];
        allGadgets.forEach(g => gameState.unlockGadget(g));
        gameState.setPhase('investigation_1');
        EventBus.emit('gadget-unlocked', null);
      }
    }

    if (this.currentNode.next) {
      this.advanceToNode(this.currentNode.next);
    } else {
      this.endDialogue();
    }
  }

  private advanceToNode(nodeId: string) {
    if (this.tree && this.tree.nodes[nodeId]) {
      this.displayNode(this.tree.nodes[nodeId]);
    } else {
      this.endDialogue();
    }
  }

  private endDialogue() {
    this.container.style.display = 'none';
    EventBus.emit('dialogue-ended');
    this.scene.stop();
  }
}
