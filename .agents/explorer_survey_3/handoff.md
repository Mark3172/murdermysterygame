# Handoff Report: UI, Typography, Canvas vs. DOM, & Build Survey

**From**: Explorer 3 (UI & Typography Explorer)  
**To**: Orchestrator (0a00207e-c04d-4242-863e-63876d6e6031)  
**Date**: 2026-10-02  
**Handoff Type**: Hard (Survey Task Complete)  
**Reference Report**: `C:\Users\Lenovo\.gemini\antigravity\scratch\murdermysterygame\.agents\explorer_survey_3\report.md`  

---

## 1. Observation

Direct observations from codebase inspection, line numbers, and tool execution:

1. **Resolution & Canvas Configuration**:
   - `src/engine/GameConfig.ts:5-6, 12-14, 23-26`:
     ```typescript
     export const GAME_WIDTH = 640;
     export const GAME_HEIGHT = 360;
     ...
     pixelArt: true,
     roundPixels: true,
     antialias: false,
     scale: {
         mode: Phaser.Scale.FIT,
         autoCenter: Phaser.Scale.CENTER_BOTH
     },
     parent: 'game-container',
     ```
   - `index.html:25-30`:
     ```css
     canvas {
       image-rendering: -moz-crisp-edges;
       image-rendering: -webkit-crisp-edges;
       image-rendering: pixelated;
       image-rendering: crisp-edges;
     }
     ```

2. **Font Family Declarations**:
   - `index.html:13`: `font-family: 'Courier New', monospace;` applied globally to `body, html`.
   - `index.html:98`: `font-family: Georgia, serif;` applied to `#dialogue-text`.
   - `index.html:118`: `font-family: 'Courier New', monospace;` applied to `.dialogue-choice`.
   - Throughout `src/scenes/*.ts`: `'Courier New'` or `'Courier New, monospace'` is hardcoded in over 30 `this.add.text` calls at font sizes ranging from 7px to 14px.

3. **Canvas-Rendered Toasts, Modals, & Prompts**:
   - `src/scenes/ExplorationScene.ts:693-697`:
     ```typescript
     private showMsg(text: string) {
       AudioManager.getInstance().playSFX('ui_click');
       const m=this.add.text(320,300,text,{fontSize:'10px',color:'#e0e8f0',fontFamily:'Courier New',backgroundColor:'#0a0a12',padding:{x:8,y:4},wordWrap:{width:400}}).setOrigin(0.5).setDepth(300).setScrollFactor(0);
       this.tweens.add({targets:m,alpha:0,delay:3000,duration:500,onComplete:()=>m.destroy()});
     }
     ```
   - `src/scenes/ExplorationScene.ts:699-708`:
     ```typescript
     private showDiscovery(name: string, desc: string) {
       AudioManager.getInstance().playSFX('discoveryString');
       const f=this.add.rectangle(320,180,640,360,0xc4a44a,0.15).setDepth(500).setScrollFactor(0);
       this.tweens.add({targets:f,alpha:0,duration:500,onComplete:()=>f.destroy()});
       const h=this.add.text(320,100,'📋 EVIDENCE FOUND',{fontSize:'12px',color:'#c4a44a',fontFamily:'Courier New'}).setOrigin(0.5).setDepth(501).setScrollFactor(0);
       const n=this.add.text(320,125,name,{fontSize:'14px',color:'#ffffff',fontFamily:'Courier New',fontStyle:'bold'}).setOrigin(0.5).setDepth(501).setScrollFactor(0);
       const d=this.add.text(320,155,desc,{fontSize:'9px',color:'#a0b0c0',fontFamily:'Courier New',wordWrap:{width:350},align:'center'}).setOrigin(0.5,0).setDepth(501).setScrollFactor(0);
       this.tweens.add({targets:[h,n,d],alpha:0,delay:4000,duration:1000,onComplete:()=>{h.destroy();n.destroy();d.destroy();}});
       EventBus.emit('evidence-found', name);
     }
     ```
   - `src/scenes/UIScene.ts:166-179`:
     ```typescript
     showHint() {
         AudioManager.getInstance().playSFX('bellChime');
         const hintObj = hintSystem.getHint();
         const hintText = hintObj ? `[Hint L${hintObj.level}] ${hintObj.text}` : 'No hint available.';
         const toast = this.add.text(320, 50, hintText, { backgroundColor: '#050710f0', color: '#ffea70', fontFamily: 'Courier New', fontSize: '11px', padding: { x: 10, y: 6 }, wordWrap: { width: 480 } }).setOrigin(0.5);
         ...
     }
     ```
   - `src/scenes/ExplorationScene.ts:356-362, 443-452`:
     ```typescript
     this.interactionPrompt = this.add.text(320, 325, '', {
       fontSize: '11px',
       color: '#ffea70',
       backgroundColor: '#0a0e1cf0',
       padding: { x: 12, y: 5 },
       fontFamily: 'Courier New, monospace'
     }).setOrigin(0.5).setDepth(600).setScrollFactor(0).setVisible(false).setInteractive({ useHandCursor: true });
     ```

4. **DOM Overlay Layer**:
   - `index.html:31-38`: `#ui-overlay` is an absolutely positioned overlay with `pointer-events: none;` that mirrors the exact bounding box of the canvas.
   - It hosts `#dialogue-container` (HTML dialogue box), `#notebook-overlay` (case notebook), and `#settings-overlay` (settings panel). All text inside these containers renders at native monitor resolution (high-DPI) with clean vector typography.

5. **Build and Test Tooling**:
   - `package.json:5-9, 10-16`:
     ```json
     "scripts": {
       "dev": "vite",
       "build": "tsc && vite build",
       "preview": "vite preview"
     },
     "dependencies": {
       "phaser": "^3.87.0"
     },
     "devDependencies": {
       "typescript": "^5.4.0",
       "vite": "^5.2.0"
     }
     ```
   - `npx tsc --noEmit` executed: returned exit code 0, 0 errors.
   - `npm run build` executed: returned exit code 0, completed in 9.23s, output chunks `dist/index.html` (13.59 kB), `dist/assets/index-DyUXKu5L.js` (269.59 kB), `dist/assets/phaser-BfqUv9B0.js` (1,478.57 kB).
   - Test runner check: No Vitest or Jest package installed in `node_modules` or declared in `package.json`. No test files exist.

---

## 2. Logic Chain

1. **Premise 1 (Observation 1)**: The Phaser canvas has an internal resolution of 640×360, antialiasing disabled (`antialias: false`), and nearest-neighbor scaling enforced via CSS (`image-rendering: pixelated;`).
2. **Premise 2 (Observation 2 & 3)**: When text is created with `this.add.text` at sizes between 7px and 14px in Courier New, it is drawn into the 640×360 framebuffer. The thin 1px stems of Courier New lose subpixel details, and upon being upscaled 3×–6× to display resolution, each pixel becomes a blocky 3×3 square, producing jagged, fragmented, and blurry letterforms.
3. **Premise 3 (Observation 4)**: In contrast, elements inside `#ui-overlay` in `index.html` are rendered by the browser's DOM compositor at the actual physical screen resolution (e.g. 1920×1080 at DPR 1.0 or 3840×2160 at DPR 2.0). The browser applies full subpixel anti-aliasing and native font rasterization, yielding crystal-clear glyphs.
4. **Premise 4 (Observation 3 & 4)**: Currently, `showDiscovery`, `showMsg`, `showHint`, `interactionPrompt`, and gadget minigame modals are rendered on the low-resolution canvas rather than inside `#ui-overlay`.
5. **Deduction**: Elevating `showDiscovery`, `showMsg`, `showHint`, and `interactionPrompt` from canvas `this.add.text` calls into HTML/CSS overlay cards within `#ui-overlay` (using Georgia serif for narrative and system sans-serif for UI/badges) will eliminate blurry text completely and ensure crisp high-DPI readability on all display resolutions without fractional scaling artifacts.
6. **Tooling Verification (Observation 5)**: `npm run build` (`tsc && vite build`) and `npx tsc --noEmit` verify compilation integrity with 0 errors.

---

## 3. Caveats

1. **Overworld In-Game Labels**: Character role tags (`this.playerTag`, suspect labels) and door badges are positioned dynamically in world space relative to moving sprites. Elevating these dynamic in-world labels to DOM elements would require per-frame coordinate conversion from Phaser camera world space to screen space. Therefore, keeping overworld labels on canvas with clean high-contrast styling while elevating all narrative toasts, notifications, dialogs, hints, and inspection modals to DOM is the cleanest, lowest-risk architecture.
2. **No Automated Test Runner**: There are currently no Vitest/Jest unit test scripts in the repository. The build test command is `npm run build` (`tsc && vite build`), which compiles and typechecks all TypeScript modules.
3. No caveats regarding code access or build integrity.

---

## 4. Conclusion

1. **Definitive Diagnosis**: The blurriness in toasts, hints, discovery popups, and prompts stems directly from rendering low-density monospaced text onto a 640×360 canvas with pixelated upscaling.
2. **Actionable Architecture**:
   - Elevate `showDiscovery` to a DOM card (`#discovery-modal`) inside `#ui-overlay` featuring high-contrast Georgia serif typography, gold borders, and category pills.
   - Elevate `showMsg` to a DOM toast (`#game-toast`) inside `#ui-overlay` with clean system sans-serif.
   - Elevate `showHint` to a tiered DOM card (`#hint-overlay`) inside `#ui-overlay` with visual tier badges (Tier 1 cyan, Tier 2 amber, Tier 3 gold).
   - Elevate `this.interactionPrompt` to a bottom DOM pill (`#interaction-prompt-container`) with a clean `<kbd>E</kbd>` key indicator.
   - Decouple scenes from DOM via `EventBus` (`show-discovery`, `show-msg`, `show-hint`, `update-prompt`).
   - Upgrade dialogue choice typography from Courier New to modern high-contrast system sans-serif.

---

## 5. Verification Method

1. **Build Verification**:
   - Command: `npm run build`
   - Expected Result: Exits with code 0, 0 TypeScript errors, Vite bundle output generated in `dist/`.
2. **Static Typecheck**:
   - Command: `npx tsc --noEmit`
   - Expected Result: Exits with code 0 with 0 diagnostics.
3. **Inspect Output Files**:
   - `C:\Users\Lenovo\.gemini\antigravity\scratch\murdermysterygame\.agents\explorer_survey_3\report.md`
   - `C:\Users\Lenovo\.gemini\antigravity\scratch\murdermysterygame\.agents\explorer_survey_3\handoff.md`
4. **Invalidation Condition**:
   - If `npm run build` fails with TypeScript compiler errors.
   - If `#ui-overlay` fails to resize with the canvas during viewport resizing.
