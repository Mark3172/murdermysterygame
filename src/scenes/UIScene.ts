import * as Phaser from 'phaser';
import { EventBus } from '../engine/EventBus';
import { gameState } from '../logic/GameState';
import { AudioManager } from '../engine/AudioManager';
import { storyManager } from '../logic/StoryPhaseManager';
import { hintSystem } from '../logic/HintSystem';
import { gadgets } from '../data/gadgets';

export class UIScene extends Phaser.Scene {
    private gadgetText!: Phaser.GameObjects.Text;
    private objectiveText!: HTMLElement;

    constructor() {
        super({ key: 'UIScene', active: true });
    }

    create() {
        // Setup HUD bar
        const hudBar = document.getElementById('hud-bar');
        if (!hudBar) this.createFallbackHUD();
        else hudBar.style.display = 'flex';

        this.objectiveText = document.getElementById('objective-text') as HTMLElement;
        if (this.objectiveText) {
            this.objectiveText.innerText = 'Objective: Explore the mansion.';
        }

        // Setup Buttons
        const btnNotebook = document.getElementById('btn-notebook');
        if (btnNotebook) btnNotebook.onclick = () => this.toggleNotebook();

        const btnGadgets = document.getElementById('btn-gadgets');
        if (btnGadgets) btnGadgets.onclick = () => this.cycleGadgets();

        const btnHint = document.getElementById('btn-hint');
        if (btnHint) btnHint.onclick = () => this.showHint();

        const btnSettings = document.getElementById('btn-settings');
        if (btnSettings) btnSettings.onclick = () => this.toggleSettings();

        // Settings Overlay
        const settingsClose = document.getElementById('settings-close');
        if (settingsClose) settingsClose.onclick = () => this.toggleSettings();

        // Keyboard shortcuts
        this.input.keyboard?.on('keydown-N', () => this.toggleNotebook());
        this.input.keyboard?.on('keydown-H', () => this.showHint());
        this.input.keyboard?.on('keydown-ESC', () => this.togglePause());

        // Gadget Text
        this.gadgetText = this.add.text(500, 340, 'Gadget: None', { fontSize: '12px', color: '#fff', backgroundColor: '#000' }).setOrigin(1, 1);
        this.updateGadgetText();

        EventBus.on('gadget-unlocked', this.updateGadgetText, this);
    }

    createFallbackHUD() {
        const hud = document.createElement('div');
        hud.id = 'hud-bar';
        hud.style.position = 'absolute';
        hud.style.top = '0';
        hud.style.width = '100%';
        hud.style.height = '30px';
        hud.style.backgroundColor = '#333';
        hud.style.color = '#fff';
        hud.style.display = 'flex';
        hud.style.justifyContent = 'space-between';
        hud.style.alignItems = 'center';
        hud.style.padding = '0 10px';
        
        hud.innerHTML = `
            <span id="objective-text">Objective: ???</span>
            <div>
                <button id="btn-notebook">Notebook</button>
                <button id="btn-gadgets">Gadgets</button>
                <button id="btn-hint">Hint</button>
                <button id="btn-settings">⚙</button>
            </div>
        `;
        document.body.appendChild(hud);
    }

    update(time: number, delta: number) {
        if (this.objectiveText && storyManager) {
            // just an example of keeping it updated, could be event-driven
            // this.objectiveText.innerText = storyManager.getCurrentObjective();
        }
    }

    toggleNotebook() {
        if (this.scene.isActive('NotebookScene')) {
            this.scene.stop('NotebookScene');
        } else {
            this.scene.launch('NotebookScene');
        }
    }

    private currentGadget: string | null = null;

    cycleGadgets() {
        const unlocked = gameState.getUnlockedGadgets();
        if (unlocked.length === 0) return;
        
        let idx = this.currentGadget ? unlocked.indexOf(this.currentGadget) : -1;
        idx = (idx + 1) % unlocked.length;
        this.currentGadget = unlocked[idx];
        
        this.updateGadgetText();
        AudioManager.getInstance().playSFX('ui_click');
    }

    updateGadgetText() {
        const gadgetId = this.currentGadget;
        if (gadgetId) {
            const gadget = (gadgets as any)[gadgetId];
            this.gadgetText.setText(`Gadget: ${gadget ? gadget.name : gadgetId}`);
        } else {
            this.gadgetText.setText('Gadget: None');
        }
    }

    showHint() {
        const hintObj = hintSystem.getHint();
        const hintText = hintObj ? `[Hint L${hintObj.level}] ${hintObj.text}` : 'No hint available.';
        // show toast
        const toast = this.add.text(320, 50, hintText, { backgroundColor: '#000000e0', color: '#ffea70', fontFamily: 'Courier New', fontSize: '11px', padding: { x: 8, y: 4 }, wordWrap: { width: 450 } }).setOrigin(0.5);
        this.tweens.add({
            targets: toast,
            alpha: 0,
            delay: 4000,
            duration: 1000,
            onComplete: () => toast.destroy()
        });
    }

    toggleSettings() {
        const settings = document.getElementById('settings-overlay');
        if (settings) {
            settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
        }
    }

    togglePause() {
        // Implement pause
    }
}
