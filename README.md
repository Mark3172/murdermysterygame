# THE THIRTEENTH CHIME

A playable 2D browser murder mystery game built with **Phaser 3**, **TypeScript**, and **Vite**.

![Genre](https://img.shields.dash.org/badge/genre-murder--mystery-blue)
![Engine](https://img.shields.dash.org/badge/engine-Phaser--3.87-purple)
![Language](https://img.shields.dash.org/badge/language-TypeScript-blue)

---

## 🔍 Story & Concept

**The Thirteenth Chime** is inspired by classic detective anime (such as *Detective Conan*). You play as **Ren Kasuga**, a 15-year-old teenage detective accompanying eccentric scientist **Dr. Mira Vale** to the grand reopening of the isolated Stellara Clockwork Observatory.

During a violent storm, the observatory's founder, **Professor Aldric Sable**, announces he will reveal the truth about a fatal experiment from twelve years ago. Suddenly, the power fails, a scream echoes, and the observatory bell rings **thirteen times**. When power is restored, Professor Sable is found dead inside a locked exhibition chamber.

---

## 🛠 Features & Mechanics

- **2D Top-Down Exploration**: Navigate 6 rooms in the observatory with smooth keyboard (WASD/Arrows) and touch controls.
- **Echo Reconstruction**: Signature deduction mechanic allowing players to compare competing hypotheses (A vs B) with ghost pixel reenactments.
- **Scientific Gadget Suite**:
  - 🔍 **Tranquility Focus**: Softens background noise and highlights inspectable clues.
  - 🎧 **Echo Lens**: Compares acoustic waveforms and isolated bell resonances.
  - 🔦 **Trace Light**: Reveals hidden fingerprints and chemical residues.
  - 🤖 **Micro Rover**: Explores tight spaces and hidden passages.
  - 🔊 **Voice Prism**: Analyzes recorded audio for voice matching and editing artifacts.
- **Animated Comic Cutscenes**: Story sequences rendered with panel animations, speech bubbles, and sound synchronization.
- **Procedural Pixel Art & Web Audio**: Dynamic rendering using Phaser Graphics and synthesized Web Audio (no external asset dependencies).
- **Airtight Mystery Solution**: 5 suspects with distinct secrets, 12 essential clues, branching dialogue trees, non-linear investigation, and a multi-stage deduction confrontation.

---

## 🎮 How to Play

### Controls
- **Movement**: `WASD` / `Arrow Keys` (Desktop) or On-Screen Virtual D-Pad (Mobile)
- **Interact / Talk**: `E` or `Action Button`
- **Notebook**: `N` or HUD `Notes` button
- **Gadgets**: Number keys `1`–`5` or HUD `Gadgets` button
- **Settings / Pause**: `ESC` or HUD `Settings` icon

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation & Execution

```bash
# Clone repository
git clone https://github.com/Mark3172/murdermysterygame.git
cd murdermysterygame

# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

---

## 📜 Credits & License

- **Engine**: Phaser 3.87+
- **Build System**: Vite 5.2+ & TypeScript 5.4+
- **Audio & Visuals**: Procedurally generated via Web Audio API and Canvas/Phaser Graphics API
