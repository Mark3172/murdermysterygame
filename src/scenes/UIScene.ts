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

        // Gadget Text badge
        this.gadgetText = this.add.text(16, 346, '🔧 Gadget: None [Press 1-5]', { 
            fontSize: '10px', 
            color: '#8899aa', 
            backgroundColor: '#0a0e1cee',
            padding: { x: 8, y: 4 },
            fontFamily: 'Courier New, monospace'
        }).setOrigin(0, 1).setInteractive({ useHandCursor: true });
        this.gadgetText.on('pointerdown', () => this.cycleGadgets());
        this.updateGadgetText();

        EventBus.on('gadget-unlocked', this.updateGadgetText, this);
        EventBus.on('gadget-changed', (g: string | null) => {
            this.currentGadget = g;
            this.updateGadgetText();
        }, this);
    }

    createFallbackHUD() {
        const hud = document.createElement('div');
        hud.id = 'hud-bar';
        hud.style.position = 'absolute';
        hud.style.top = '0';
        hud.style.width = '100%';
        hud.style.height = '30px';
        hud.style.backgroundColor = '#16192b';
        hud.style.borderBottom = '1px solid #3a4260';
        hud.style.color = '#fff';
        hud.style.display = 'flex';
        hud.style.justifyContent = 'space-between';
        hud.style.alignItems = 'center';
        hud.style.padding = '0 12px';
        hud.style.zIndex = '50';
        
        hud.innerHTML = `
            <span id="objective-text" style="font-family:'Courier New', monospace; font-size:12px; color:#d4af37;">Objective: Explore the observatory</span>
            <div>
                <button id="btn-notebook" style="background:#20283e; color:#fff; border:1px solid #4a567a; padding:3px 8px; margin:0 2px; cursor:pointer;">Notebook [N]</button>
                <button id="btn-gadgets" style="background:#20283e; color:#fff; border:1px solid #4a567a; padding:3px 8px; margin:0 2px; cursor:pointer;">Gadgets [1-5]</button>
                <button id="btn-hint" style="background:#20283e; color:#ffdf6d; border:1px solid #4a567a; padding:3px 8px; margin:0 2px; cursor:pointer;">Hint [H]</button>
                <button id="btn-settings" style="background:#20283e; color:#fff; border:1px solid #4a567a; padding:3px 8px; margin:0 2px; cursor:pointer;">⚙ [ESC]</button>
            </div>
        `;
        document.body.appendChild(hud);
    }

    update(time: number, delta: number) {
        if (this.objectiveText) {
            const currentObj = storyManager.getObjective();
            const textToDisplay = currentObj ? `Objective: ${currentObj}` : 'Objective: Investigate the observatory';
            if (this.objectiveText.innerText !== textToDisplay) {
                this.objectiveText.innerText = textToDisplay;
            }
        }
    }

    toggleNotebook() {
        AudioManager.getInstance().playSFX('paperRustle');
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
        AudioManager.getInstance().playSFX('gadget_beep');
        EventBus.emit('gadget-selected', this.currentGadget);
    }

    updateGadgetText() {
        const gadgetId = this.currentGadget;
        if (gadgetId) {
            const gadget = (gadgets as any)[gadgetId];
            this.gadgetText.setText(`🔧 Active: ${gadget ? gadget.name : gadgetId} [Press 1-5 to switch]`);
            this.gadgetText.setColor('#4ac47a');
        } else {
            this.gadgetText.setText('🔧 Gadget: None [Press 1-5 to equip]');
            this.gadgetText.setColor('#8899aa');
        }
    }

    showHint() {
        AudioManager.getInstance().playSFX('bellChime');
        const hintObj = hintSystem.getHint();
        const hintText = hintObj ? `[Hint L${hintObj.level}] ${hintObj.text}` : 'No hint available.';
        // show toast
        const toast = this.add.text(320, 50, hintText, { backgroundColor: '#050710f0', color: '#ffea70', fontFamily: 'Courier New', fontSize: '11px', padding: { x: 10, y: 6 }, wordWrap: { width: 480 } }).setOrigin(0.5);
        this.tweens.add({
            targets: toast,
            alpha: 0,
            delay: 4500,
            duration: 1000,
            onComplete: () => toast.destroy()
        });
    }

    toggleSettings() {
        AudioManager.getInstance().playSFX('ui_click');
        if (this.scene.isActive('SettingsScene')) {
            this.scene.stop('SettingsScene');
        } else {
            this.scene.launch('SettingsScene');
        }
    }

    togglePause() {
        this.toggleSettings();
    }
}
