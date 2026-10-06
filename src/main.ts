// THE THIRTEENTH CHIME — Main Entry Point
import Phaser from 'phaser';
import { gameConfig } from './engine/GameConfig';
import { AudioManager } from './engine/AudioManager';
import { EventBus } from './engine/EventBus';

// Initialize the game
const game = new Phaser.Game(gameConfig);
(window as any).__PHASER_GAME__ = game;

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

  // Text speed slider
  const textSpeedSlider = document.getElementById('text-speed') as HTMLInputElement;
  if (textSpeedSlider) {
    const savedSpeed = localStorage.getItem('setting_text_speed');
    if (savedSpeed) textSpeedSlider.value = savedSpeed;
    textSpeedSlider.addEventListener('input', () => {
      localStorage.setItem('setting_text_speed', textSpeedSlider.value);
      EventBus.emit('setting-changed', { setting: 'text_speed', value: parseInt(textSpeedSlider.value, 10) });
    });
  }

  // Reduced motion checkbox
  const reducedMotionBox = document.getElementById('reduced-motion') as HTMLInputElement;
  if (reducedMotionBox) {
    const savedMotion = localStorage.getItem('setting_reduced_motion') === 'true';
    reducedMotionBox.checked = savedMotion;
    reducedMotionBox.addEventListener('change', () => {
      localStorage.setItem('setting_reduced_motion', String(reducedMotionBox.checked));
      EventBus.emit('setting-changed', { setting: 'reduced_motion', value: reducedMotionBox.checked });
    });
  }

  // Sound captions checkbox
  const soundCaptionsBox = document.getElementById('sound-captions') as HTMLInputElement;
  if (soundCaptionsBox) {
    const savedCaptions = localStorage.getItem('setting_sound_captions') === 'true';
    soundCaptionsBox.checked = savedCaptions;
    soundCaptionsBox.addEventListener('change', () => {
      localStorage.setItem('setting_sound_captions', String(soundCaptionsBox.checked));
      EventBus.emit('setting-changed', { setting: 'sound_captions', value: soundCaptionsBox.checked });
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
