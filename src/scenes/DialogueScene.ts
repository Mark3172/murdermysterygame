import * as Phaser from 'phaser';
import { EventBus } from '../engine/EventBus';
import { gameState } from '../logic/GameState';
import { AudioManager } from '../engine/AudioManager';
import { storyManager } from '../logic/StoryPhaseManager';

// Temporary inline dialogue data since import wasn't specified
const dialogueData: any = {
    talk_butler: {
        start: {
            speaker: 'Butler',
            text: 'Good evening, detective. How may I assist you?',
            choices: [
                { text: 'Where were you at the time of the murder?', next: 'alibi' },
                { text: 'Goodbye.', next: null }
            ]
        },
        alibi: {
            speaker: 'Butler',
            text: 'I was in the pantry, polishing the silverware.',
            setFlag: 'butler_alibi_heard',
            choices: [
                { text: 'I see.', next: null }
            ]
        }
    }
};

export class DialogueScene extends Phaser.Scene {
    private dialogueId: string = '';
    private container!: HTMLElement;
    private speakerEl!: HTMLElement;
    private textEl!: HTMLElement;
    private choicesEl!: HTMLElement;
    private continueEl!: HTMLElement;
    private portraitSprite!: Phaser.GameObjects.Rectangle;
    private currentText: string = '';
    private typeIndex: number = 0;
    private typeTimer: Phaser.Time.TimerEvent | null = null;
    private currentNode: any = null;
    private dialogueTree: any = null;

    constructor() {
        super('DialogueScene');
    }

    init(data: any) {
        this.dialogueId = data.dialogueId || 'talk_butler';
    }

    create() {
        EventBus.emit('dialogue-started');
        
        // Portrait
        this.portraitSprite = this.add.rectangle(60, 300, 80, 80, 0x00aaff).setOrigin(0.5, 1);
        
        // HTML elements mapping
        this.container = document.getElementById('dialogue-container') as HTMLElement;
        this.speakerEl = document.getElementById('dialogue-speaker') as HTMLElement;
        this.textEl = document.getElementById('dialogue-text') as HTMLElement;
        this.choicesEl = document.getElementById('dialogue-choices') as HTMLElement;
        this.continueEl = document.getElementById('dialogue-continue') as HTMLElement;

        if (!this.container) {
            // fallback if html not present
            this.createFallbackHTML();
        }

        this.container.style.display = 'block';
        this.choicesEl.innerHTML = '';
        this.continueEl.style.display = 'none';

        this.dialogueTree = dialogueData[this.dialogueId] || dialogueData['talk_butler'];
        this.showNode('start');

        this.input.keyboard?.on('keydown-SPACE', this.handleContinue, this);
        this.input.keyboard?.on('keydown-ENTER', this.handleContinue, this);
    }

    createFallbackHTML() {
        this.container = document.createElement('div');
        this.container.id = 'dialogue-container';
        this.container.style.position = 'absolute';
        this.container.style.bottom = '10px';
        this.container.style.left = '100px';
        this.container.style.width = '440px';
        this.container.style.height = '100px';
        this.container.style.backgroundColor = 'rgba(0,0,0,0.8)';
        this.container.style.color = '#fff';
        this.container.style.padding = '10px';
        this.container.style.border = '2px solid #fff';
        document.body.appendChild(this.container);

        this.speakerEl = document.createElement('div');
        this.speakerEl.id = 'dialogue-speaker';
        this.speakerEl.style.fontWeight = 'bold';
        this.speakerEl.style.marginBottom = '5px';
        this.container.appendChild(this.speakerEl);

        this.textEl = document.createElement('div');
        this.textEl.id = 'dialogue-text';
        this.container.appendChild(this.textEl);

        this.choicesEl = document.createElement('div');
        this.choicesEl.id = 'dialogue-choices';
        this.choicesEl.style.marginTop = '10px';
        this.container.appendChild(this.choicesEl);

        this.continueEl = document.createElement('div');
        this.continueEl.id = 'dialogue-continue';
        this.continueEl.innerText = 'Press SPACE to continue';
        this.continueEl.style.position = 'absolute';
        this.continueEl.style.bottom = '5px';
        this.continueEl.style.right = '5px';
        this.continueEl.style.fontSize = '12px';
        this.container.appendChild(this.continueEl);
    }

    showNode(nodeId: string | null) {
        if (!nodeId || !this.dialogueTree[nodeId]) {
            this.endDialogue();
            return;
        }

        this.currentNode = this.dialogueTree[nodeId];
        this.speakerEl.innerText = this.currentNode.speaker || 'Narrator';
        
        if (this.currentNode.setFlag) {
            gameState.setDialogueFlag(this.currentNode.setFlag);
        }
        if (this.currentNode.giveEvidence) {
            gameState.collectEvidence(this.currentNode.giveEvidence);
        }
        if (this.currentNode.triggerEvent) {
            EventBus.emit(this.currentNode.triggerEvent);
        }

        this.textEl.innerText = '';
        this.choicesEl.innerHTML = '';
        this.continueEl.style.display = 'none';
        this.currentText = this.currentNode.text;
        this.typeIndex = 0;

        if (this.typeTimer) this.typeTimer.remove();
        
        this.typeTimer = this.time.addEvent({
            delay: 30,
            callback: this.typeCharacter,
            callbackScope: this,
            repeat: this.currentText.length - 1
        });
    }

    typeCharacter() {
        this.textEl.innerText += this.currentText[this.typeIndex];
        this.typeIndex++;
        AudioManager.getInstance().playSFX('type_blip');

        if (this.typeIndex === this.currentText.length) {
            this.showChoicesOrContinue();
        }
    }

    showChoicesOrContinue() {
        if (this.currentNode.choices && this.currentNode.choices.length > 0) {
            this.currentNode.choices.forEach((choice: any, index: number) => {
                const btn = document.createElement('button');
                btn.innerText = choice.text;
                btn.style.display = 'block';
                btn.style.margin = '2px 0';
                btn.onclick = () => {
                    this.showNode(choice.next);
                };
                this.choicesEl.appendChild(btn);
            });
        } else {
            this.continueEl.style.display = 'block';
        }
    }

    handleContinue() {
        if (this.typeIndex < this.currentText.length) {
            if (this.typeTimer) this.typeTimer.remove();
            this.textEl.innerText = this.currentText;
            this.typeIndex = this.currentText.length;
            this.showChoicesOrContinue();
        } else if (!this.currentNode.choices || this.currentNode.choices.length === 0) {
            this.showNode(this.currentNode.next);
        }
    }

    endDialogue() {
        this.container.style.display = 'none';
        EventBus.emit('dialogue-ended');
        this.scene.stop();
    }
}
