import * as Phaser from 'phaser';
import { EventBus } from '../engine/EventBus';
import { gameState } from '../logic/GameState';
import { AudioManager } from '../engine/AudioManager';
import { storyManager } from '../logic/StoryPhaseManager';
import { hintSystem } from '../logic/HintSystem';
import { gadgets } from '../data/gadgets';
import { rooms } from '../data/rooms';

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

        const btnGadgetTutorial = document.getElementById('btn-gadget-tutorial');
        if (btnGadgetTutorial) btnGadgetTutorial.onclick = () => this.playGadgetTutorial();

        const btnHint = document.getElementById('btn-hint');
        if (btnHint) btnHint.onclick = () => this.showHint();

        const btnSettings = document.getElementById('btn-settings');
        if (btnSettings) btnSettings.onclick = () => this.toggleSettings();

        // Settings Overlay
        const settingsClose = document.getElementById('settings-close');
        if (settingsClose) settingsClose.onclick = () => this.toggleSettings();

        // Keyboard shortcuts
        this.input.keyboard?.on('keydown-N', () => this.toggleNotebook());
        this.input.keyboard?.on('keydown-T', () => this.playGadgetTutorial());
        this.input.keyboard?.on('keydown-H', () => this.showHint());
        this.input.keyboard?.on('keydown-ESC', () => this.togglePause());

        // Quick gadget keys 1-5
        const gadgetSlots: Record<string, string> = {
            'ONE': 'tranquility_focus', 'NUMPAD_ONE': 'tranquility_focus',
            'TWO': 'echo_lens', 'NUMPAD_TWO': 'echo_lens',
            'THREE': 'trace_light', 'NUMPAD_THREE': 'trace_light',
            'FOUR': 'micro_rover', 'NUMPAD_FOUR': 'micro_rover',
            'FIVE': 'voice_prism', 'NUMPAD_FIVE': 'voice_prism'
        };
        Object.entries(gadgetSlots).forEach(([k, gId]) => {
            this.input.keyboard?.on(`keydown-${k}`, () => {
                EventBus.emit('gadget-selected', gId);
            });
        });

        // Gadget Text badge (hidden from canvas, gadget is cleanly shown in top HUD bar)
        this.gadgetText = this.add.text(16, 346, '🔧 Gadgets [1-5]: Click or press 1-5', { 
            fontSize: '10px', 
            color: '#8899aa', 
            backgroundColor: '#0a0e1cee',
            padding: { x: 8, y: 4 },
            fontFamily: 'Courier New, monospace'
        }).setOrigin(0, 1).setVisible(false);
        this.updateGadgetText();

        EventBus.on('gadget-unlocked', this.updateGadgetText, this);
        EventBus.on('gadget-changed', (g: string | null) => {
            this.currentGadget = g;
            this.updateGadgetText();
        }, this);

        // Room badge in top HUD
        this.updateRoomBadge(gameState.getCurrentRoom() || 'main_hall');
        EventBus.on('room-changed', (r: string) => this.updateRoomBadge(r), this);
    }

    updateRoomBadge(roomId: string) {
        const badge = document.getElementById('hud-room-badge');
        if (badge) {
            const r = rooms[roomId];
            const name = r ? r.name : roomId.replace(/_/g, ' ');
            badge.innerText = `📍 ${name.toUpperCase()}`;
        }
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

    playGadgetTutorial() {
        AudioManager.getInstance().playSFX('discoveryString');
        if (this.scene.isActive('NotebookScene')) {
            this.scene.stop('NotebookScene');
        }
        this.scene.start('CutsceneScene', { cutsceneId: 'gadget_tutorial', returnTo: 'ExplorationScene' });
    }

    private currentGadget: string | null = null;

    cycleGadgets() {
        const defaultGadgets = ['tranquility_focus', 'echo_lens', 'trace_light', 'micro_rover', 'voice_prism'];
        defaultGadgets.forEach(g => gameState.unlockGadget(g));
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
        const btnGadgets = document.getElementById('btn-gadgets');
        const gadgetSlotNums: Record<string, number> = {
            tranquility_focus: 1, echo_lens: 2, trace_light: 3, micro_rover: 4, voice_prism: 5
        };
        if (gadgetId) {
            const gadget = (gadgets as any)[gadgetId];
            const name = gadget ? gadget.name : gadgetId.replace(/_/g, ' ');
            const slot = gadgetSlotNums[gadgetId] || 1;
            this.gadgetText.setText(`🔧 Active: [${slot}] ${name} [Click / 1-5 to switch]`);
            this.gadgetText.setColor('#4ac47a');
            if (btnGadgets) btnGadgets.innerText = `🔧 [${slot}] ${name}`;
        } else {
            this.gadgetText.setText('🔧 Gadgets: None equipped [Click / 1-5 to equip]');
            this.gadgetText.setColor('#ffea70');
            if (btnGadgets) btnGadgets.innerText = 'Gadgets [1-5]';
        }
    }

    private hintTimeout: any = null;

    showHint() {
        AudioManager.getInstance().playSFX('bellChime');
        const hintObj = hintSystem.getHint();
        if (!hintObj) return;

        // Emit EventBus event 'show-hint' for decoupled UI overlays
        EventBus.emit('show-hint', {
            level: hintObj.level,
            tier: hintObj.tier,
            text: hintObj.text,
            objectiveId: hintObj.objectiveId,
            chamber: hintObj.chamber,
            category: hintObj.chamber,
            phase: hintObj.phase,
            hasMore: hintObj.hasMore,
        });

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('show-hint', {
                detail: {
                    level: hintObj.level,
                    tier: hintObj.tier,
                    text: hintObj.text,
                    objectiveId: hintObj.objectiveId,
                    chamber: hintObj.chamber,
                    category: hintObj.chamber,
                    phase: hintObj.phase,
                    hasMore: hintObj.hasMore,
                }
            }));
        }

        // High-DPI HTML Overlay Toast (fallback only if #hint-overlay is not in DOM)
        if (typeof document !== 'undefined' && !document.getElementById('hint-overlay')) {
            let toastEl = document.getElementById('hint-toast-overlay');
            if (!toastEl) {
                toastEl = document.createElement('div');
                toastEl.id = 'hint-toast-overlay';
                toastEl.style.cssText = `
                    position: fixed;
                    top: 44px;
                    left: 50%;
                    transform: translateX(-50%);
                    max-width: 560px;
                    width: 90%;
                    background: rgba(10, 14, 26, 0.96);
                    border: 1px solid #d4af37;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8), 0 0 10px rgba(212, 175, 55, 0.2);
                    border-radius: 4px;
                    padding: 12px 16px;
                    z-index: 2000;
                    color: #e6ecf2;
                    font-family: Georgia, serif;
                    pointer-events: auto;
                    transition: opacity 0.3s ease, transform 0.3s ease;
                `;
                document.body.appendChild(toastEl);
            }

            const tierColors: Record<number, string> = {
                1: '#4a90e2', // Atmospheric Blue
                2: '#e6c229', // Room Direction Amber
                3: '#e74c3c', // Actionable Directive Red
            };
            const tierTitles: Record<number, string> = {
                1: 'Tier 1 • Atmospheric Nudge',
                2: 'Tier 2 • Room & Focus Direction',
                3: 'Tier 3 • Actionable Detective Direction',
            };

            const pips = [1, 2, 3].map(t => 
                `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; margin:0 3px; background:${t <= hintObj.tier ? tierColors[hintObj.tier] : '#333a4d'};"></span>`
            ).join('');

            toastEl.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #232b3e; padding-bottom:6px; margin-bottom:8px;">
                    <span style="font-size:12px; font-weight:bold; color:${tierColors[hintObj.tier]}; font-family:'Courier New', monospace; letter-spacing:1px;">
                        💡 ${tierTitles[hintObj.tier].toUpperCase()}
                    </span>
                    <div style="display:flex; align-items:center;">
                        <span style="font-size:11px; color:#88a0b8; margin-right:8px; font-family:'Courier New', monospace;">[${hintObj.chamber}]</span>
                        ${pips}
                    </div>
                </div>
                <div style="font-size:14px; line-height:1.5; color:#ffffff;">
                    ${hintObj.text}
                </div>
                <div style="margin-top:8px; font-size:10px; color:#8899aa; font-family:'Courier New', monospace; text-align:right;">
                    Press [H] again for next tier • Auto-closes in 6s
                </div>
            `;

            toastEl.style.opacity = '1';
            toastEl.style.display = 'block';

            if (this.hintTimeout) clearTimeout(this.hintTimeout);
            this.hintTimeout = setTimeout(() => {
                if (toastEl) toastEl.style.opacity = '0';
            }, 6000);
        }

        // Canvas fallback for environments where DOM overlay is hidden
        // On-canvas fallback only if HTML hint overlay is not present
        if (typeof document === 'undefined' || !document.getElementById('hint-overlay')) {
            const hintText = `[Hint L${hintObj.level} • ${hintObj.chamber}] ${hintObj.text}`;
            const toast = this.add.text(320, 50, hintText, {
                backgroundColor: '#050710f0',
                color: '#ffea70',
                fontFamily: 'Courier New',
                fontSize: '11px',
                padding: { x: 10, y: 6 },
                wordWrap: { width: 480 }
            }).setOrigin(0.5);
            this.tweens.add({
                targets: toast,
                alpha: 0,
                delay: 4500,
                duration: 1000,
                onComplete: () => toast.destroy()
            });
        }
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
