// THE THIRTEENTH CHIME — Main Entry Point
import Phaser from 'phaser';
import { gameConfig } from './engine/GameConfig';
import { AudioManager } from './engine/AudioManager';
import { EventBus } from './engine/EventBus';

// Initialize the game
const game = new Phaser.Game(gameConfig);

// Initialize audio manager and hook up HTML controls
const audioManager = AudioManager.getInstance();
audioManager.init();

// Global event handlers for HTML UI
document.addEventListener('DOMContentLoaded', () => {
  // Settings close button
  const settingsClose = document.getElementById('settings-close');
  if (settingsClose) {
    settingsClose.addEventListener('click', () => {
      const overlay = document.getElementById('settings-overlay');
      if (overlay) overlay.style.display = 'none';
    });
  }

  // Notebook close button
  const notebookClose = document.getElementById('notebook-close');
  if (notebookClose) {
    notebookClose.addEventListener('click', () => {
      const overlay = document.getElementById('notebook-overlay');
      if (overlay) overlay.style.display = 'none';
      EventBus.emit('notebook-closed');
    });
  }

  // Notebook tabs
  const tabs = document.querySelectorAll('.notebook-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = (tab as HTMLElement).dataset.tab || 'evidence';
      EventBus.emit('notebook-tab-changed', tabName);
    });
  });
});

// Prevent context menu on canvas
document.addEventListener('contextmenu', (e) => {
  if ((e.target as HTMLElement)?.tagName === 'CANVAS') {
    e.preventDefault();
  }
});

// Handle visibility change (pause when tab hidden)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.scene.scenes.forEach(scene => {
      if (scene.scene.isActive()) {
        // Don't auto-pause, just reduce audio
      }
    });
  }
});

export default game;
