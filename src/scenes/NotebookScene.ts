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
                tabs.forEach(t => t.classList.remove('active'));
                const target = e.target as HTMLElement;
                target.classList.add('active');
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
            const collected = gameState.getCollectedEvidence();
            html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <h3 style="color:#d4af37; font-size:14px; text-transform:uppercase; letter-spacing:1px;">Collected Evidence (${collected.length}/12)</h3>
            </div><ul style="list-style:none; padding:0;">`;
            
            collected.forEach(evId => {
                const ev = (evidenceData as any)[evId];
                if (ev) {
                    const desc = ev.fullDesc || ev.shortDesc || 'No details recorded.';
                    const cat = ev.category || 'physical';
                    const categoryColors: Record<string, string> = {
                        acoustic: '#4ac4d4',
                        physical: '#c49a4a',
                        document: '#9ac44a',
                        testimony: '#d44ac4'
                    };
                    const catColor = categoryColors[cat] || '#7ac4d4';
                    html += `<li class="evidence-item" style="border-left: 3px solid ${catColor};">
                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <strong class="evidence-name">${ev.name}</strong>
                            <span style="font-size:10px; background:rgba(30,40,60,0.8); color:${catColor}; border:1px solid ${catColor}55; padding:2px 6px; border-radius:3px; text-transform:uppercase;">${cat}</span>
                        </div>
                        <div class="evidence-desc">${desc}</div>
                    </li>`;
                } else {
                    html += `<li class="evidence-item">Unknown evidence record (${evId})</li>`;
                }
            });
            if (collected.length === 0) {
                html += '<li style="color:#8a96a4; font-style:italic; padding:16px 0;">No clues discovered yet. Use your gadgets to inspect suspicious spots.</li>';
            }
            html += '</ul>';
        } else if (tabName === 'suspects') {
            html = '<h3 style="color:#d4af37; font-size:14px; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Persons of Interest</h3><ul style="list-style:none; padding:0;">';
            Object.values(suspects).forEach((s: any) => {
                const interviewed = gameState.isSuspectInterviewed(s.id);
                const statusBadge = interviewed 
                    ? '<span style="color:#4ac47a; font-size:10px; border:1px solid #4ac47a; padding:1px 5px; border-radius:3px;">INTERVIEWED</span>'
                    : '<span style="color:#e0a040; font-size:10px; border:1px solid #e0a040; padding:1px 5px; border-radius:3px;">NOT INTERVIEWED</span>';
                const outfitColor = s.portraitColors?.outfit || '#d4af37';
                html += `<li class="evidence-item" style="border-left: 3px solid ${outfitColor};">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong class="evidence-name">${s.name}</strong>
                        ${statusBadge}
                    </div>
                    <div style="color:#7a90a4; font-size:11px; margin-top:2px;">${s.title}</div>
                    <div class="evidence-desc" style="margin-top:6px;"><strong>Statement / Alibi:</strong> ${s.alibi || 'No statement recorded yet.'}</div>
                </li>`;
            });
            html += '</ul>';
        } else if (tabName === 'objectives') {
            const phase = storyManager.getCurrentPhase();
            html = '<h3 style="color:#d4af37; font-size:14px; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Current Investigation</h3>';
            html += `<div class="evidence-item" style="border-left:3px solid #d4af37;">
                <div style="margin-bottom:8px;"><strong style="color:#d4af37;">Phase:</strong> <span style="color:#ffffff;">${phase?.name || 'Arrival'}</span></div>
                <div style="margin-bottom:8px;"><strong style="color:#d4af37;">Objective:</strong> <span style="color:#e0e8f0;">${storyManager.getObjective() || 'Investigate the observatory and gather clues.'}</span></div>
                <div style="margin-bottom:8px;"><strong style="color:#d4af37;">Evidence Collected:</strong> <span style="color:#4ac47a;">${gameState.getCollectedEvidence().length} / 12 key clues</span></div>
                <div><strong style="color:#d4af37;">Available Gadgets:</strong> <span style="color:#9ad4ea;">${gameState.getUnlockedGadgets().map(g => g.replace(/_/g, ' ')).join(', ') || 'Tranquility Focus'}</span></div>
            </div>`;
        } else if (tabName === 'history') {
            html = '<h3 style="color:#d4af37; font-size:14px; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Case Timeline Notes</h3>';
            html += `<div class="evidence-item" style="border-left:3px solid #7ac4d4;">
                <p style="color:#b8c8d8; font-size:12px; line-height:1.5;">
                    • 7:45 PM: Professor Aldric Sable's demonstration announcement over the PA.<br>
                    • 8:00 PM: The 13th chime rings across the observatory. Instant total blackout.<br>
                    • 8:05 PM: Power restored. Professor Sable found dead inside the sealed Exhibition Chamber bolted from the inside.
                </p>
            </div>`;
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
