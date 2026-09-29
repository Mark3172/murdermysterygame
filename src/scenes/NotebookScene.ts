import * as Phaser from 'phaser';
import { gameState } from '../logic/GameState';
import { storyManager } from '../logic/StoryPhaseManager';
import { evidence as evidenceData } from '../data/evidence';
import { suspects } from '../data/suspects';

export class NotebookScene extends Phaser.Scene {
    private overlay!: HTMLElement;

    constructor() {
        super('NotebookScene');
    }

    create() {
        this.overlay = document.getElementById('notebook-overlay') as HTMLElement;
        if (!this.overlay) {
            this.createFallbackHTML();
        }
        
        this.overlay.style.display = 'flex';
        this.populateTabs();

        this.input.keyboard?.on('keydown-TAB', this.closeNotebook, this);
        this.input.keyboard?.on('keydown-N', this.closeNotebook, this);
        
        const closeBtn = document.getElementById('notebook-close');
        if (closeBtn) closeBtn.onclick = () => this.closeNotebook();
    }

    createFallbackHTML() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'notebook-overlay';
        this.overlay.style.position = 'absolute';
        this.overlay.style.top = '10%';
        this.overlay.style.left = '10%';
        this.overlay.style.width = '80%';
        this.overlay.style.height = '80%';
        this.overlay.style.backgroundColor = '#ddd';
        this.overlay.style.display = 'flex';
        this.overlay.style.flexDirection = 'column';
        this.overlay.style.zIndex = '1000';
        document.body.appendChild(this.overlay);

        const tabs = document.createElement('div');
        tabs.innerHTML = `
            <button class="notebook-tab" data-tab="evidence">Evidence</button>
            <button class="notebook-tab" data-tab="suspects">Suspects</button>
            <button class="notebook-tab" data-tab="objectives">Objectives</button>
            <button id="notebook-close" style="float:right">Close</button>
        `;
        this.overlay.appendChild(tabs);

        const content = document.createElement('div');
        content.id = 'notebook-content';
        content.style.flex = '1';
        content.style.padding = '10px';
        content.style.overflowY = 'auto';
        this.overlay.appendChild(content);
    }

    populateTabs() {
        const tabs = document.querySelectorAll('.notebook-tab');
        tabs.forEach(tab => {
            (tab as HTMLElement).onclick = (e) => {
                const target = e.target as HTMLElement;
                this.showTab(target.getAttribute('data-tab') || 'evidence');
            };
        });
        this.showTab('evidence');
    }

    showTab(tabName: string) {
        const content = document.getElementById('notebook-content');
        if (!content) return;

        let html = '';

        if (tabName === 'evidence') {
            html = '<h2>Evidence</h2><ul>';
            gameState.getCollectedEvidence().forEach(evId => {
                const ev = (evidenceData as any)[evId];
                if (ev) {
                    html += `<li class="evidence-item"><strong class="evidence-name">${ev.name}</strong>: <span class="evidence-desc">${ev.description}</span></li>`;
                } else {
                    html += `<li>Unknown evidence (${evId})</li>`;
                }
            });
            if (gameState.getCollectedEvidence().length === 0) html += '<li>No evidence collected yet.</li>';
            html += '</ul>';
        } else if (tabName === 'suspects') {
            html = '<h2>Suspects</h2><ul>';
            // Mock iteration
            Object.values(suspects).forEach((s: any) => {
                html += `<li><strong>${s.name}</strong> - ${s.title}<br>Alibi: ${s.alibi || 'Unknown'}</li>`;
            });
            html += '</ul>';
        } else if (tabName === 'objectives') {
            html = '<h2>Objectives</h2>';
            html += `<p>Current Phase: Phase ${storyManager.getCurrentPhase()}</p>`;
            html += `<p>Objective: Investigate the mansion.</p>`; // simplified
        }

        content.innerHTML = html;
    }

    closeNotebook() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
        this.scene.stop();
    }
}
