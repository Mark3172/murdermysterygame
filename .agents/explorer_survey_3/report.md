# Comprehensive Survey Report: UI, Typography, Canvas vs. DOM, & Build Infrastructure

**Agent**: Explorer 3 (UI & Typography Explorer)  
**Project**: The Thirteenth Chime  
**Date**: 2026-10-02  
**Status**: Completed Survey & Architecture Proposal  

---

## 1. Executive Summary

A comprehensive investigation of the codebase for *The Thirteenth Chime* was conducted focusing on typography rendering clarity, UI presentation layers, notification toasts, dialogue boxes, floating prompts, and build/test infrastructure. 

### Key Findings:
1. **Severe Text Blur & Jaggedness Root Cause**: The game engine (`Phaser 3.87.0`) is configured with an internal virtual canvas resolution of **640 × 360** pixels (`src/engine/GameConfig.ts:5-6`), configured with `pixelArt: true`, `antialias: false`, and stretched across modern displays via `canvas { image-rendering: pixelated; }` (`index.html:25-30`). Any text drawn directly onto the Phaser canvas (`this.add.text`) is rasterized at minuscule sizes (7px to 12px) without anti-aliasing and subsequently upscaled 3× to 6×, resulting in broken, blocky, distorted glyphs.
2. **Font Selection Bottleneck**: The entire game heavily defaults to `'Courier New'`, a thin-stroke mechanical monospaced typewriter font designed in 1955. At 8px–11px raster heights on a 360p canvas, the hairline stems drop pixels entirely, leading to severe legibility degradation.
3. **Canvas-Rendered Toasts & Modals**: Critical narrative feedback components—specifically evidence discovery announcements (`showDiscovery`), status messages (`showMsg`), progressive hint toasts (`showHint`), bottom interaction prompts (`interactionPrompt`), and gadget analysis minigames (`echoLensMini`, `microRoverMini`, `voicePrismMini`)—are rendered using canvas text and primitive shapes directly on the 640×360 canvas buffer.
4. **Existing DOM Overlay Framework**: An HTML DOM container (`#ui-overlay` in `index.html:31-38`) already overlays the game canvas with `pointer-events: none;`. It successfully hosts `#dialogue-container`, `#notebook-overlay`, and `#settings-overlay`. Because `#ui-overlay` is rendered by the browser at the display's native resolution (e.g. 1080p, 1440p, 4K Retina), HTML/CSS elements placed within it have crisp subpixel anti-aliasing, clean line spacing, and full typographic clarity.
5. **Build & Test Infrastructure**: The project uses Vite 5.2.0 and TypeScript 5.4.0. Running `npm run build` (`tsc && vite build`) passes cleanly with exit code 0 and zero compiler errors. No automated test runner (Vitest / Jest) is currently installed in `package.json`.

---

## 2. Root Cause Analysis: Canvas Text vs. DOM Overlays

### 2.1 Virtual Resolution vs. Display Resolution
In `src/engine/GameConfig.ts`:
```typescript
export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;

export const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    parent: 'game-container',
    ...
};
```
And in `index.html:25-30`:
```css
canvas {
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

### 2.2 The Blur / Pixelation Mechanism
1. **Low-Density Rasterization**: When `this.add.text(x, y, text, { fontSize: '10px' })` is executed, Phaser renders the glyphs to an offscreen texture buffer at 10px height inside a 640×360 coordinate system.
2. **Nearest-Neighbor Upscaling**: When displayed on a standard 1080p screen (1920×1080), the canvas is scaled up by a factor of **3.0×**. On a 1440p screen (2560×1440), it is scaled by **4.0×**. On a 4K screen (3840×2160), it is scaled by **6.0×**. Because `image-rendering: pixelated` is enforced, each 1px stroke becomes a massive 3×3 or 4×4 pixel block.
3. **Fractional Scaling Distortion**: When the browser window is sized arbitrarily (e.g., laptop viewport with UI bars, 1366×768 or fractional zoom), the scale multiplier is non-integer (e.g. 2.45×). Nearest-neighbor filtering causes stroke widths to alternate between 2 and 3 pixels, producing warped, uneven letters.
4. **Background Interference**: Canvas text often lacks high-contrast opaque container backing. When rendered over detailed room tilemaps (such as marble checkers or parquet wood), low-contrast text (#a0b0c0 or #8899aa) blends into the background patterns.

### 2.3 The DOM Overlay Advantage
The `#ui-overlay` element sits directly on top of the `<canvas>`:
```css
#ui-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  user-select: none;
  z-index: 10;
}
```
Because `#ui-overlay` is an HTML element sized to the canvas's client bounds, any HTML element placed inside:
- Renders at native device pixel density (e.g. 1920×1080 at 1x DPR, or 3840×2160 at 2x DPR).
- Utilizes full subpixel anti-aliasing (ClearType on Windows, CoreText on macOS).
- Has crisp CSS borders, box shadows, and backdrop filters.
- Eliminates blur and pixel distortion entirely.

---

## 3. Comprehensive Inventory of Text Rendering

Below is an exhaustive catalog of all text rendering locations across the codebase, contrasting canvas rendering against DOM overlays.

| Category | Component / Location | File & Line | Target Element / Call | Font & Size | Rendering Layer | Readability Assessment & Defects |
|---|---|---|---|---|---|---|
| **Notification** | `showDiscovery` (Evidence alert) | `src/scenes/ExplorationScene.ts:699-706` | `this.add.text(320, 100/125/155, ...)` | Courier New, 12px / 14px / 9px | Canvas (640x360) | **CRITICAL BLUR**. 9px Courier New description text is distorted and barely legible when scaled up 3x+. Flash background lacks contrast. |
| **Toast** | `showMsg` (System status) | `src/scenes/ExplorationScene.ts:693-697` | `this.add.text(320, 300, ...)` | Courier New, 10px | Canvas (640x360) | **BLURRY**. 10px monospace text at bottom center is pixelated; overlaps if multiple messages triggered. |
| **Notification** | `showHint` (Tiered hints) | `src/scenes/UIScene.ts:166-178` | `this.add.text(320, 50, ...)` | Courier New, 11px | Canvas (640x360) | **BLURRY**. 11px Courier New toast overlaps with HUD bar, jagged letterforms, no structured tier framing. |
| **HUD** | Floating Prompt | `src/scenes/ExplorationScene.ts:356, 442-452` | `this.interactionPrompt` (`this.add.text`) | Courier New, 11px | Canvas (640x360) | **BLURRY**. In-world floating interaction prompt at (320, 325); pixelated key hint. |
| **Overworld** | Player Name Tag | `src/scenes/ExplorationScene.ts:96` | `this.playerTag` (`this.add.text`) | Courier New, 8px | Canvas (640x360) | **VERY LOW RES**. 8px tag over Ren sprite. |
| **Overworld** | Doorway Badges | `src/scenes/ExplorationScene.ts:142` | `doorBadge` (`this.add.text`) | Courier New, 8px | Canvas (640x360) | **LOW RES**. 8px text floating over doors. |
| **Overworld** | Clue Proximity Labels | `src/scenes/ExplorationScene.ts:218, 638` | `this.add.text(ox, oy + ...)` | Courier New, 8px | Canvas (640x360) | **LOW RES**. 8px text near interactables. |
| **Overworld** | Suspect Role Labels | `src/scenes/ExplorationScene.ts:257` | `this.add.text(nx, ny + 18, ...)` | Courier New, 8px | Canvas (640x360) | **LOW RES**. 8px text under suspect sprites. |
| **Overworld** | Room Banner | `src/scenes/ExplorationScene.ts:277, 772` | `this.add.text(w/2, 14, ...)` | Courier New, 9px / 10px | Canvas (640x360) | **LOW RES**. Fixed room title banner. |
| **Gadget Minigame** | Echo Lens Sound Modal | `src/scenes/ExplorationScene.ts:516-544` | `this.add.text` (6 text objects) | Courier New, 8px – 11px | Canvas (640x360) | **BLURRY**. Analysis notes at 8px are difficult to read; buttons are canvas rectangles. |
| **Gadget Minigame** | Micro Rover Drone Modal | `src/scenes/ExplorationScene.ts:546-565` | `this.add.text` (3 text objects) | Courier New, 8px – 10px | Canvas (640x360) | **BLURRY**. Drone instruction text at 8px Courier New. |
| **Gadget Minigame** | Voice Prism Modal | `src/scenes/ExplorationScene.ts:581-616` | `this.add.text` (6 text objects) | Courier New, 7px – 10px | Canvas (640x360) | **CRITICAL BLUR**. Splice label at 7px Courier New is nearly unreadable. |
| **HUD** | Active Gadget Badge | `src/scenes/UIScene.ts:65, 146-164` | `this.gadgetText` (`this.add.text`) | Courier New, 10px | Canvas (640x360) | **BLURRY**. 10px text at bottom-left corner of screen. |
| **HUD** | Top Navigation Bar | `index.html:254-293`, `src/scenes/UIScene.ts:19-44` | `#hud-bar` (DOM `#objective-text`, `#btn-*`) | Courier New, 11px | **DOM Overlay** | **SHARP BUT MONOSPACE**. Crisp high-DPI rendering, but uses Courier New monospace rather than clean modern sans-serif. |
| **Dialogue** | In-Game Dialogue Box | `index.html:43-158`, `src/scenes/DialogueScene.ts` | `#dialogue-container` (`#dialogue-text`, `#dialogue-speaker`, `#dialogue-choices`) | Georgia 14px (text), Courier New 13px (choices & speaker) | **DOM Overlay** | **SHARP**. Text is sharp Georgia serif; choices use Courier New with low-contrast borders; speaker color dynamically applied to text but not badge border/glow. |
| **Notebook** | Case Notebook Tabs & Log | `index.html:160-227`, `src/scenes/NotebookScene.ts` | `#notebook-overlay` (`#notebook-content`) | Courier New 12px – 17px | **DOM Overlay** | **SHARP**. Evidence cards and suspect profiles render crisply in DOM. |
| **Settings** | Audio & Speed Controls | `index.html:229-252`, `src/scenes/SettingsScene.ts` | `#settings-overlay` | Courier New 14px | **DOM Overlay** | **SHARP**. Sliders and labels render crisply in DOM. |
| **Pause Menu** | In-Game Pause Options | `src/scenes/SettingsScene.ts:18, 21, 42` | `this.add.text(320, ...)` | Default canvas font, 16px / 20px | Canvas (640x360) | **BLURRY**. 'PAUSED', 'Resume', 'Save Game' rendered as canvas text behind DOM settings. |
| **Cutscene** | Narrative & Cutscene Panels | `src/scenes/CutsceneScene.ts:45, 62, 192, 201, 212` | `this.add.text` (`speakerTxt`, `dialogTxt`, `prompt`) | Courier New 13px/9px, Georgia 12px | Canvas (640x360) | **BLURRY**. Cutscene dialogue rendered on 640x360 canvas with 12px Georgia serif; antialias off creates jagged serif strokes. |
| **Cutscene** | Comic Panel Speech Bubbles | `src/rendering/ComicPanelRenderer.ts:35, 113, 117` | `this.scene.add.text` | monospace, 14px / 16px / 24px | Canvas (640x360) | **BLURRY**. Monospace speech bubbles on canvas. |
| **Deduction** | Final Accusation Board | `src/scenes/DeductionScene.ts:34, 48, 112, 126, 155` | `this.add.text` (panels, buttons, feedback) | Courier / Courier New, 12px – 24px | Canvas (640x360) | **BLURRY**. Entire accusation board (culprit, method, alibi, evidence picker) rendered on canvas. |
| **Reconstruction**| Timeline & Blueprint | `src/scenes/ReconstructionScene.ts:77, 85, 87, 94, 112`| `this.add.text` (room tags, hypothesis) | Default canvas font, 10px – 12px | Canvas (640x360) | **BLURRY**. Blueprint notes rendered on canvas. |
| **Title** | Main Menu & Credits | `src/scenes/TitleScene.ts:55, 63, 130`, `CreditsScene.ts:56` | `this.add.text` (Title, subtitle, menu buttons) | serif, 18px / 32px | Canvas (640x360) | **BLURRY**. Serif title and buttons on canvas. |
| **Preload** | Fallback Portrait Generator | `src/scenes/PreloadScene.ts:151-152` | `ctx.fillText(`${char}-${expr}`, 5, 32)` | Arial, 10px | Offscreen Canvas | Used only for fallback portrait generation. |

---

## 4. Deep-Dive on Target UI Components (Requirement R3)

### 4.1 Evidence Discovery Card (`showDiscovery`)
- **Current Location**: `src/scenes/ExplorationScene.ts:699-708`
- **Current Implementation**:
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
- **Issues Identified**:
  - Rendered at 320, 100 on the 640x360 canvas with low-density fonts (`9px`, `12px`, `14px`).
  - Upscaled 3x with `pixelArt: true` and `image-rendering: pixelated;`, turning description lines into fragmented pixel clusters.
  - No opaque bounding card: text appears directly over room background tile art, making it illegible when standing on contrasting floors or near bright lights.
  - Auto-destroys via tween timer without allowing manual dismissal or re-reading.

### 4.2 System Message Toast (`showMsg`)
- **Current Location**: `src/scenes/ExplorationScene.ts:693-697`
- **Current Implementation**:
  ```typescript
  private showMsg(text: string) {
    AudioManager.getInstance().playSFX('ui_click');
    const m=this.add.text(320,300,text,{fontSize:'10px',color:'#e0e8f0',fontFamily:'Courier New',backgroundColor:'#0a0a12',padding:{x:8,y:4},wordWrap:{width:400}}).setOrigin(0.5).setDepth(300).setScrollFactor(0);
    this.tweens.add({targets:m,alpha:0,delay:3000,duration:500,onComplete:()=>m.destroy()});
  }
  ```
- **Issues Identified**:
  - `fontSize: '10px'` Courier New in a 640x360 coordinate space.
  - If multiple interactions occur consecutively (e.g. trying gadgets or examining objects rapidly), new text objects spawn directly over the old ones without queue management.

### 4.3 Progressive Hint Notifications (`showHint`)
- **Current Location**: `src/scenes/UIScene.ts:166-179`
- **Current Implementation**:
  ```typescript
  showHint() {
      AudioManager.getInstance().playSFX('bellChime');
      const hintObj = hintSystem.getHint();
      const hintText = hintObj ? `[Hint L${hintObj.level}] ${hintObj.text}` : 'No hint available.';
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
  ```
- **Issues Identified**:
  - Drawn at coordinate (320, 50) directly below the top HUD bar. On low resolution, 11px Courier New is heavily pixelated.
  - Lacks visual tier distinction: Tier 1, 2, and 3 hints look identical except for the tiny `[Hint L1]` string.
  - No dismiss button; overlaps with subsequent hint presses if `H` is pressed repeatedly.

### 4.4 Floating Interactive Prompt (`this.interactionPrompt`)
- **Current Location**: `src/scenes/ExplorationScene.ts:356-366, 442-452`
- **Current Implementation**:
  ```typescript
  this.interactionPrompt = this.add.text(320, 325, '', {
    fontSize: '11px',
    color: '#ffea70',
    backgroundColor: '#0a0e1cf0',
    padding: { x: 12, y: 5 },
    fontFamily: 'Courier New, monospace'
  }).setOrigin(0.5).setDepth(600).setScrollFactor(0).setVisible(false).setInteractive({ useHandCursor: true });
  ```
- **Issues Identified**:
  - Positioned at (320, 325) near the bottom of the canvas.
  - When the player moves across the room, the text updates dynamically (`💬 [E] Talk to...`, `🔍 [E] Examine...`), but the canvas text bounding box re-rasterizes at 11px nearest-neighbor scaling.
  - The key hint `[E]` looks like plain text without visual affordance (e.g. keyboard badge pill `<kbd>`).

### 4.5 Dialogue Box & Choices (`#dialogue-container`)
- **Current Location**: `index.html:43-158`, `src/scenes/DialogueScene.ts`
- **Implementation Strengths**: Already implemented in HTML DOM inside `#ui-overlay`.
- **Issues Identified**:
  - Dialogue choices (`.dialogue-choice`) use `'Courier New', monospace; font-size: 13px;` which looks thin and dated.
  - Speaker badge (`#dialogue-speaker`) is styled with static gold CSS (`border-left: 3px solid #d4af37`), but `DialogueScene.ts:193` only updates `this.speakerEl.style.color = colorHex;` without updating the border or background tint to match character color.
  - Line height and typography hierarchy can be significantly improved with Georgia serif for dialogue text (15px, line-height 1.55) and modern sans-serif for choices and speaker badges.

---

## 5. Architectural Elevation Design: High-DPI HTML/CSS UI System

To satisfy Requirement R3, canvas-rendered toasts, notifications, and prompts must be elevated into high-DPI HTML/CSS overlay cards inside `#ui-overlay`.

### 5.1 Typography Design System
We propose adopting a dual-typography hierarchy tailored for a Victorian / sci-fi mystery atmosphere:

1. **Narrative / Investigation Serif**:
   ```css
   --font-serif: Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, 'Times New Roman', serif;
   ```
   - **Usage**: Evidence descriptions, dialogue lines, cutscene narration, case notes, hint body text.
   - **Attributes**: Warm, authoritative, high-contrast serif strokes, superior legibility with generous line spacing (`line-height: 1.55`).
2. **Modern High-Contrast Clean Sans-Serif**:
   ```css
   --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
   ```
   - **Usage**: HUD controls, speaker badges, choice options, interaction prompt pills, toast alerts, category badges.
   - **Attributes**: Crisp vector rendering across all display scaling levels (100%, 125%, 150%, 200%), solid stem weights, zero pixel drop.
3. **Investigation Technical Monospace**:
   ```css
   --font-mono: 'SF Mono', Consolas, 'Liberation Mono', Menlo, Monaco, monospace;
   ```
   - **Usage**: Clue timestamps, gadget resonance frequencies, code ciphers.
   - **Attributes**: Replaces Courier New with Consolas / SF Mono for crisp, solid-weight glyphs.

### 5.2 DOM Overlay Architecture
In `index.html`, add dedicated, semantic DOM elements inside `#ui-overlay`:

```html
<div id="ui-overlay">
  <!-- Existing HUD and overlays -->
  <div id="loading-screen">...</div>
  <div id="hud-bar">...</div>
  <div id="dialogue-container">...</div>
  <div id="notebook-overlay">...</div>
  <div id="settings-overlay">...</div>

  <!-- NEW HIGH-DPI ELEVATED UI COMPONENTS -->
  
  <!-- 1. Discovery Modal / Card -->
  <div id="discovery-modal" class="ui-modal-backdrop" style="display:none;">
    <div class="discovery-card">
      <div class="discovery-header">
        <span class="discovery-badge">📋 EVIDENCE DISCOVERED</span>
        <span class="discovery-category" id="discovery-category-pill">Physical</span>
      </div>
      <h2 class="discovery-title" id="discovery-title">Clue Name</h2>
      <p class="discovery-desc" id="discovery-desc">Detailed clue description...</p>
      <div class="discovery-footer">
        <span class="discovery-prompt">Press [SPACE] / [E] or Click anywhere to dismiss</span>
      </div>
    </div>
  </div>

  <!-- 2. System Notification Toast -->
  <div id="toast-container">
    <div id="game-toast" class="game-toast" style="display:none;">
      <span id="toast-icon">💡</span>
      <span id="toast-message">Toast message text</span>
    </div>
  </div>

  <!-- 3. Progressive 3-Tier Hint Card -->
  <div id="hint-overlay" style="display:none;">
    <div class="hint-card">
      <div class="hint-header">
        <span id="hint-tier-badge" class="tier-1">💡 TIER 1: ATMOSPHERIC NUDGE</span>
        <button id="hint-close-btn" class="hint-close">✕</button>
      </div>
      <div class="hint-body" id="hint-text">Hint content text goes here...</div>
      <div class="hint-footer">
        <span class="hint-action">Press [H] for next tier</span>
      </div>
    </div>
  </div>

  <!-- 4. Floating Interaction Prompt -->
  <div id="interaction-prompt-container" style="display:none;">
    <div class="interaction-pill">
      <span class="prompt-icon" id="prompt-icon">🔍</span>
      <kbd class="prompt-key">E</kbd>
      <span class="prompt-label" id="prompt-label">Examine Object</span>
    </div>
  </div>
</div>
```

### 5.3 High-Contrast Stylesheet Specifications
```css
/* Modern High-DPI UI Styles */

/* 1. Discovery Modal Card */
.ui-modal-backdrop {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(4, 6, 12, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 70;
  pointer-events: auto;
  animation: fadeIn 0.2s ease-out;
}

.discovery-card {
  width: 90%;
  max-width: 480px;
  background: rgba(12, 16, 28, 0.96);
  border: 2px solid #d4af37;
  border-radius: 8px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.9), 0 0 24px rgba(212, 175, 55, 0.25);
  padding: 22px 26px;
  color: #f0f4f8;
  font-family: var(--font-serif);
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.discovery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.discovery-badge {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #d4af37;
  text-transform: uppercase;
}

.discovery-category {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(74, 196, 212, 0.15);
  color: #7ac4d4;
  border: 1px solid rgba(74, 196, 212, 0.3);
  text-transform: uppercase;
}

.discovery-title {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 10px;
  line-height: 1.3;
}

.discovery-desc {
  font-family: var(--font-serif);
  font-size: 14px;
  line-height: 1.55;
  color: #d0dce5;
  margin-bottom: 16px;
}

.discovery-footer {
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  padding-top: 10px;
  text-align: right;
  font-family: var(--font-sans);
  font-size: 11px;
  color: #8899aa;
}

/* 2. System Toast */
#toast-container {
  position: absolute;
  bottom: 58px;
  left: 0; right: 0;
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 55;
}

.game-toast {
  background: rgba(10, 14, 26, 0.94);
  border: 1px solid #4a6a8a;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
  padding: 8px 18px;
  color: #edf2f7;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  animation: fadeIn 0.15s ease-out;
}

/* 3. Progressive 3-Tier Hint Card */
#hint-overlay {
  position: absolute;
  top: 46px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 520px;
  pointer-events: auto;
  z-index: 65;
  animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.hint-card {
  background: rgba(10, 14, 26, 0.97);
  border: 2px solid #d4af37;
  border-radius: 8px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.85), 0 0 16px rgba(212, 175, 55, 0.2);
  padding: 16px 20px;
}

.hint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.hint-card .tier-1 {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #7ac4d4;
  text-transform: uppercase;
}

.hint-card .tier-2 {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #ffbb33;
  text-transform: uppercase;
}

.hint-card .tier-3 {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #ff6644;
  text-transform: uppercase;
}

.hint-body {
  font-family: var(--font-serif);
  font-size: 14px;
  line-height: 1.5;
  color: #edf2f7;
  margin-bottom: 10px;
}

.hint-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 8px;
  display: flex;
  justify-content: space-between;
  font-family: var(--font-sans);
  font-size: 11px;
  color: #8899aa;
}

/* 4. Floating Interaction Pill */
#interaction-prompt-container {
  position: absolute;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: auto;
  z-index: 45;
  animation: fadeIn 0.15s ease-out;
}

.interaction-pill {
  background: rgba(8, 12, 24, 0.92);
  border: 1px solid #d4af37;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.7);
  border-radius: 20px;
  padding: 6px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: #ffea70;
}

.interaction-pill kbd {
  background: #1e2838;
  border: 1px solid #7ac4d4;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.5);
  color: #ffffff;
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
}
```

### 5.4 EventBus Integration Bridge
The bridge pattern cleanly decouples Phaser scenes from the HTML DOM:
- **Discovery Card**:
  - `EventBus.emit('show-discovery', { name, desc, category })`
  - In `ExplorationScene.ts`, `this.showDiscovery(name, desc)` simply emits this event.
  - A global DOM manager listener receives the payload and updates `#discovery-title`, `#discovery-desc`, `#discovery-category-pill`, and displays `#discovery-modal`.
- **System Toast**:
  - `EventBus.emit('show-msg', { text, icon, duration })`
  - Displays `#game-toast` with smooth CSS transition and auto-dismiss timer.
- **Progressive Hint**:
  - `EventBus.emit('show-hint', { hintObj })`
  - Displays `#hint-overlay` with the appropriate tier badge class (`tier-1`, `tier-2`, `tier-3`), updates `#hint-text`, and sets up click/esc dismissal.
- **Interaction Prompt**:
  - `EventBus.emit('update-prompt', { visible: true, icon: '🔍', action: 'Examine Connecting Door Deadbolt' })`
  - Displays `#interaction-prompt-container` with clean `<kbd>E</kbd>` pill.

---

## 6. Build & Test Infrastructure Assessment

### 6.1 Package Configuration (`package.json`)
```json
{
  "name": "the-thirteenth-chime",
  "version": "1.0.0",
  "type": "module",
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
}
```

### 6.2 TypeScript Configuration (`tsconfig.json`)
- Strict mode is enabled (`"strict": true`).
- Path alias `"@/*": ["./src/*"]` is defined.
- `"noEmit": true` configured, using Vite for bundling.
- Verifying with `npx tsc --noEmit` produces **0 type errors**.

### 6.3 Vite Configuration (`vite.config.ts`)
- Bundles Phaser into a separate manual chunk (`phaser: ['phaser']`).
- Base path set to `./` for relative asset loading.
- Builds targets to `esnext`.

### 6.4 Build Verification
Execution of `npm run build` completed synchronously:
```
> the-thirteenth-chime@1.0.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 39 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                    13.59 kB │ gzip:   3.20 kB
dist/assets/index-DyUXKu5L.js     269.59 kB │ gzip:  58.30 kB
dist/assets/phaser-BfqUv9B0.js  1,478.57 kB │ gzip: 339.69 kB
✓ built in 9.23s
```
**Result**: Build succeeded with exit code 0.

### 6.5 Automated Test Runner Status
- Currently, **no test framework** (e.g., Vitest, Jest) is listed in `package.json` dependencies or scripts.
- No unit test or integration test files (`*.test.ts` or `*.spec.ts`) exist in the repository.
- Verification is currently achieved via:
  1. `npx tsc --noEmit` (Static type validation)
  2. `npm run build` (Full TypeScript compiler + Vite Rollup bundling)

---

## 7. Actionable Implementation Plan for Engineering Agent

For the subsequent implementation agent:

1. **`index.html` Markup & Styling**:
   - Add the typography CSS variables (`--font-serif`, `--font-sans`, `--font-mono`).
   - Add DOM nodes for `#discovery-modal`, `#game-toast`, `#hint-overlay`, and `#interaction-prompt-container`.
   - Update `.dialogue-choice` styles to use `--font-sans` with high-contrast borders and active states.
2. **`src/engine/UIManager.ts` (or Global DOM Handlers in `src/main.ts`)**:
   - Implement event listeners for:
     - `'show-discovery'`: displays `#discovery-modal`, hooks key/click listeners to dismiss.
     - `'show-msg'`: displays `#game-toast` with smooth timeout management.
     - `'show-hint'`: displays `#hint-overlay` with tier color badge.
     - `'update-prompt'`: updates `#interaction-prompt-container`.
3. **Refactor `src/scenes/ExplorationScene.ts`**:
   - In `showDiscovery(name, desc)`: replace canvas text creation with `EventBus.emit('show-discovery', { name, desc })`.
   - In `showMsg(text)`: replace canvas text creation with `EventBus.emit('show-msg', { text })`.
   - In `update()` interaction prompt logic: replace `this.interactionPrompt.setText(...)` with `EventBus.emit('update-prompt', { ... })`.
4. **Refactor `src/scenes/UIScene.ts`**:
   - In `showHint()`: replace canvas toast with `EventBus.emit('show-hint', { hintObj })`.
5. **Verify**:
   - Run `npm run build` to verify 0 errors.
   - Verify UI rendering clarity in browser preview.
