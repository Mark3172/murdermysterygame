export interface CutscenePanel {
  type: 'image' | 'text' | 'dialogue' | 'transition';
  backgroundColor?: string;
  elements?: { type: 'rect'|'circle'|'text'|'line'; x: number; y: number; width?: number; height?: number; color?: string; text?: string; fontSize?: number; }[];
  text?: string;
  textColor?: string;
  textSize?: number;
  speaker?: string;
  dialogue?: string;
  animation?: 'fade_in' | 'slide_left' | 'slide_right' | 'slide_up' | 'zoom_in' | 'shake' | 'flash' | 'none';
  duration?: number;
  sound?: string;
  setFlag?: string;
  giveEvidence?: string;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
}

export interface CutsceneData {
  id: string;
  name: string;
  panels: CutscenePanel[];
  music?: string;
  skippable: boolean;
  onSkipFlags?: string[];
  onSkipEvidence?: string[];
}

export const cutscenes: Record<string, CutsceneData> = {
  cold_open: {
    id: 'cold_open',
    name: 'Prologue',
    skippable: true,
    music: 'tense_theme',
    panels: [
      {
        type: 'image',
        backgroundColor: '#070a14',
        elements: [
          // Mountain silhouette
          { type: 'rect', x: 320, y: 300, width: 640, height: 120, color: '#0d1322' },
          // Observatory dome
          { type: 'circle', x: 320, y: 220, width: 140, height: 140, color: '#161d30' },
          { type: 'rect', x: 320, y: 250, width: 140, height: 80, color: '#161d30' },
          // Dome slit
          { type: 'rect', x: 320, y: 200, width: 12, height: 70, color: '#ffd700' },
          // Lightning flash line
          { type: 'line', x: 140, y: 40, width: 180, height: 160, color: '#c8e2ff' },
          { type: 'text', x: 320, y: 70, text: 'STELLARA MOUNTAIN OBSERVATORY • 7:55 PM', fontSize: 13, color: '#ffd700' }
        ],
        animation: 'fade_in',
        sound: 'thunder',
        autoAdvance: true,
        autoAdvanceDelay: 3200
      },
      {
        type: 'text',
        text: 'A violent gale batters the glass dome. Tonight was supposed to be a grand reopening.',
        textColor: '#e0ecf8',
        textSize: 15,
        animation: 'fade_in',
        autoAdvance: true,
        autoAdvanceDelay: 3500
      },
      {
        type: 'image',
        backgroundColor: '#0c0e18',
        elements: [
          // Clock face backing
          { type: 'circle', x: 320, y: 170, width: 160, height: 160, color: '#1a2233' },
          { type: 'circle', x: 320, y: 170, width: 150, height: 150, color: '#121724' },
          // Clockwork gears
          { type: 'circle', x: 260, y: 140, width: 60, height: 60, color: '#c49a45' },
          { type: 'circle', x: 370, y: 190, width: 80, height: 80, color: '#8a652a' },
          // Pendulum rod & brass bob
          { type: 'line', x: 320, y: 70, width: 0, height: 180, color: '#ffd700' },
          { type: 'circle', x: 320, y: 250, width: 36, height: 36, color: '#d4af37' },
          { type: 'text', x: 320, y: 310, text: 'Tick.   Tock.   Tick.   Tock.', fontSize: 13, color: '#a0b4c8' }
        ],
        animation: 'zoom_in',
        sound: 'clockTick',
        autoAdvance: true,
        autoAdvanceDelay: 3200
      },
      {
        type: 'image',
        backgroundColor: '#08080c',
        elements: [
          // Gold pocket watch case
          { type: 'circle', x: 320, y: 160, width: 130, height: 130, color: '#d4af37' },
          { type: 'circle', x: 320, y: 160, width: 116, height: 116, color: '#f5f0dc' },
          // Hands frozen at 8:00
          { type: 'line', x: 320, y: 160, width: 0, height: -45, color: '#1a1a1a' },
          { type: 'line', x: 320, y: 160, width: 0, height: 35, color: '#1a1a1a' },
          // Shatter lines
          { type: 'line', x: 280, y: 120, width: 70, height: 70, color: '#3a6688' },
          { type: 'line', x: 330, y: 130, width: -40, height: 50, color: '#3a6688' },
          { type: 'text', x: 320, y: 280, text: 'A trembling hand drops a shattered pocket watch...', fontSize: 13, color: '#ff6666' }
        ],
        animation: 'shake',
        sound: 'glass_shatter',
        autoAdvance: true,
        autoAdvanceDelay: 3400
      },
      {
        type: 'image',
        backgroundColor: '#000000',
        elements: [
          { type: 'text', x: 320, y: 150, text: '⚡ BLACKOUT ⚡', fontSize: 20, color: '#ff3333' },
          { type: 'text', x: 320, y: 190, text: 'The entire observatory power grid collapses.', fontSize: 13, color: '#cccccc' }
        ],
        animation: 'flash',
        sound: 'doorOpen',
        autoAdvance: true,
        autoAdvanceDelay: 2500
      },
      {
        type: 'image',
        backgroundColor: '#050711',
        elements: [
          // Acoustic resonance waves
          { type: 'circle', x: 320, y: 160, width: 70, height: 70, color: '#4ac4d4' },
          { type: 'circle', x: 320, y: 160, width: 140, height: 140, color: '#2a5a7a' },
          { type: 'circle', x: 320, y: 160, width: 220, height: 220, color: '#1a334a' },
          // Great bronze bell
          { type: 'rect', x: 320, y: 160, width: 44, height: 50, color: '#d4af37' },
          { type: 'circle', x: 320, y: 185, width: 54, height: 30, color: '#c49a34' },
          { type: 'text', x: 320, y: 270, text: 'DING... DING... DING...', fontSize: 15, color: '#ffd700' },
          { type: 'text', x: 320, y: 305, text: 'Twelve chimes for eight o\'clock. But then...', fontSize: 12, color: '#a0c0d8' }
        ],
        animation: 'zoom_in',
        sound: 'bellChime',
        autoAdvance: true,
        autoAdvanceDelay: 3500
      },
      {
        type: 'text',
        text: 'B O O M !   A   T H I R T E E N T H   C H I M E .\n\nEveryone heard Professor Sable speak.\nNobody saw him alive.',
        textColor: '#ffdd66',
        textSize: 16,
        animation: 'shake',
        sound: 'bellChime',
        autoAdvance: true,
        autoAdvanceDelay: 4200
      }
    ]
  },
  opening_title: {
    id: 'opening_title',
    name: 'Title Sequence',
    skippable: true,
    music: 'main_theme',
    panels: [
      {
        type: 'image',
        backgroundColor: '#0a0d1a',
        elements: [
          { type: 'rect', x: 320, y: 180, width: 620, height: 340, color: '#121828' },
          { type: 'rect', x: 320, y: 180, width: 610, height: 330, color: '#090d18' },
          // Golden title plate
          { type: 'text', x: 320, y: 110, text: 'THE THIRTEENTH CHIME', fontSize: 26, color: '#d4af37' },
          { type: 'text', x: 320, y: 145, text: 'EPISODE 01: THE CLOCKWORK OBSERVATORY', fontSize: 11, color: '#88a6c8' },
          { type: 'line', x: 180, y: 165, width: 280, height: 0, color: '#d4af37' },
          // Ren & Vale profile boxes
          { type: 'rect', x: 230, y: 230, width: 90, height: 90, color: '#1a2a44' },
          { type: 'circle', x: 230, y: 220, width: 40, height: 40, color: '#f0cfb2' },
          { type: 'rect', x: 230, y: 250, width: 50, height: 35, color: '#224488' },
          { type: 'text', x: 230, y: 290, text: 'REN KASUGA\nHigh School Detective', fontSize: 9, color: '#7ab4f8' },

          { type: 'rect', x: 410, y: 230, width: 90, height: 90, color: '#1a3328' },
          { type: 'circle', x: 410, y: 220, width: 40, height: 40, color: '#f0cfb2' },
          { type: 'rect', x: 410, y: 250, width: 50, height: 35, color: '#338866' },
          { type: 'text', x: 410, y: 290, text: 'DR. MIRA VALE\nEccentric Inventor', fontSize: 9, color: '#68d391' }
        ],
        animation: 'zoom_in',
        sound: 'discoveryString',
        duration: 2500,
        autoAdvance: true,
        autoAdvanceDelay: 4500
      },
      {
        type: 'dialogue',
        speaker: 'Ren',
        dialogue: 'Dr. Vale, that thirteenth chime wasn\'t mechanical. The resonance pattern was completely unnatural.',
        animation: 'slide_up'
      },
      {
        type: 'dialogue',
        speaker: 'Dr. Vale',
        dialogue: 'Precisely, Ren! Use the scientific gadgets in your coat. Observe every detail, uncover the false timeline, and expose the truth!',
        animation: 'slide_left'
      }
    ]
  },
  gadget_tutorial: {
    id: 'gadget_tutorial',
    name: 'Gadget Operations Briefing',
    skippable: true,
    music: 'main_theme',
    panels: [
      {
        type: 'image',
        backgroundColor: '#070a16',
        animation: 'fade_in',
        sound: 'discoveryString',
        duration: 1500,
        autoAdvance: true,
        autoAdvanceDelay: 3200
      },
      {
        type: 'dialogue',
        speaker: 'Dr. Vale',
        dialogue: 'Ren, my scientific inventions in your coat are calibrated for this investigation. Let me review each gadget\'s operation with you.',
        animation: 'slide_up'
      },
      // Gadget 1: Tranquility Focus
      {
        type: 'image',
        backgroundColor: '#081226',
        animation: 'zoom_in',
        sound: 'digital_beep',
        duration: 1200,
        autoAdvance: true,
        autoAdvanceDelay: 2800
      },
      {
        type: 'dialogue',
        speaker: 'Dr. Vale',
        dialogue: '[HOTKEY: KEY 1] TRANQUILITY FOCUS — Steady your breathing to enter deep concentration. It highlights all interactive props and points of interest across the chamber.',
        animation: 'slide_left'
      },
      // Gadget 2: Echo Lens
      {
        type: 'image',
        backgroundColor: '#061824',
        animation: 'zoom_in',
        sound: 'digital_beep',
        duration: 1200,
        autoAdvance: true,
        autoAdvanceDelay: 2800
      },
      {
        type: 'dialogue',
        speaker: 'Dr. Vale',
        dialogue: '[HOTKEY: KEY 2] ECHO LENS — An acoustic visualizer that converts sound vibrations into visible waveforms. Use it to trace hidden resonance and sensor data.',
        animation: 'slide_left'
      },
      // Gadget 3: Trace Light
      {
        type: 'image',
        backgroundColor: '#180826',
        animation: 'zoom_in',
        sound: 'digital_beep',
        duration: 1200,
        autoAdvance: true,
        autoAdvanceDelay: 2800
      },
      {
        type: 'dialogue',
        speaker: 'Dr. Vale',
        dialogue: '[HOTKEY: KEY 3] TRACE LIGHT — Ultraviolet spectrum illuminator. It reveals invisible chemical traces, aconitine poison residues, and smudged fingerprints on locks.',
        animation: 'slide_left'
      },
      // Gadget 4: Micro Rover
      {
        type: 'image',
        backgroundColor: '#1e1408',
        animation: 'zoom_in',
        sound: 'digital_beep',
        duration: 1200,
        autoAdvance: true,
        autoAdvanceDelay: 2800
      },
      {
        type: 'dialogue',
        speaker: 'Dr. Vale',
        dialogue: '[HOTKEY: KEY 4] MICRO ROVER — Deploy a miniature crawler drone with live telemetry. It crawls through narrow wall gaps and ventilation ducts to bypass locked doors.',
        animation: 'slide_left'
      },
      // Gadget 5: Voice Prism
      {
        type: 'image',
        backgroundColor: '#180a1c',
        animation: 'zoom_in',
        sound: 'digital_beep',
        duration: 1200,
        autoAdvance: true,
        autoAdvanceDelay: 2800
      },
      {
        type: 'dialogue',
        speaker: 'Dr. Vale',
        dialogue: '[HOTKEY: KEY 5] VOICE PRISM — Audio spectrograph that analyzes sound frequencies and tape splices. If a voice or PA recording was pre-recorded or tampered with, this exposes it!',
        animation: 'slide_left'
      },
      {
        type: 'dialogue',
        speaker: 'Ren',
        dialogue: 'Understood, Doctor. Keys [1] through [5] to equip, or click the Gadgets button on the top HUD bar. Let\'s uncover the truth!',
        animation: 'slide_up'
      }
    ]
  },
  discovery_scene: {
    id: 'discovery_scene',
    name: 'Finding the Body',
    skippable: false,
    music: 'suspense_theme',
    panels: [
      { type: 'text', text: 'The heavy door to the Exhibition Chamber is bolted shut from the inside.', textColor: '#ffffff' },
      { type: 'dialogue', speaker: 'Hugo', dialogue: 'Dad! Dad, open the door! The lights are back on!' },
      { type: 'dialogue', speaker: 'Dr. Vale', dialogue: 'Stand back. I have a universal bypass tool... also known as a crowbar.' },
      { type: 'image', backgroundColor: '#000000', animation: 'shake', sound: 'door_bash' },
      { type: 'text', text: 'The door flies open.', textColor: '#ffffff', animation: 'flash' },
      { type: 'image', backgroundColor: '#2c1e16', elements: [{ type: 'rect', x: 200, y: 150, width: 240, height: 50, color: '#4a3a30' }, { type: 'circle', x: 250, y: 180, width: 40, height: 40, color: '#222222' }], animation: 'slide_up' },
      { type: 'dialogue', speaker: 'Ren', dialogue: 'Professor Sable... he\'s...' },
      { type: 'dialogue', speaker: 'Dr. Vale', dialogue: 'Don\'t touch anything. This is a crime scene now. And the killer locked the door from the inside.' }
    ]
  },
  midpoint_reversal: {
    id: 'midpoint_reversal',
    name: 'The Recording Revelation',
    skippable: false,
    music: 'revelation_theme',
    panels: [
      { type: 'dialogue', speaker: 'Ren', dialogue: 'Dr. Vale, look at the Voice Prism output for the PA announcement.' },
      { type: 'image', backgroundColor: '#111111', elements: [{ type: 'line', x: 100, y: 180, width: 200, height: 180, color: '#00ff00' }, { type: 'line', x: 200, y: 180, width: 200, height: 80, color: '#ff0000' }, { type: 'line', x: 200, y: 80, width: 300, height: 180, color: '#00ff00' }], animation: 'zoom_in', sound: 'digital_beep' },
      { type: 'dialogue', speaker: 'Dr. Vale', dialogue: 'Fascinating. Those red spikes indicate a stark frequency break. It\'s a splice.' },
      { type: 'dialogue', speaker: 'Ren', dialogue: 'He didn\'t make that announcement at 7:45 PM. It was pre-recorded!' },
      { type: 'dialogue', speaker: 'Dr. Vale', dialogue: 'Which means the Professor could have been dead long before the lights went out. All their alibis just went out the window.' }
    ]
  },
  final_reveal: {
    id: 'final_reveal',
    name: 'J\'Accuse',
    skippable: false,
    music: 'climax_theme',
    panels: [
      { type: 'image', backgroundColor: '#1a1a2e', elements: [{ type: 'text', x: 320, y: 180, text: 'THE TRUTH', fontSize: 40, color: '#ff0000' }], animation: 'flash' },
      { type: 'dialogue', speaker: 'Ren', dialogue: 'You thought you had the perfect alibi, Nadia.' },
      { type: 'dialogue', speaker: 'Nadia', dialogue: 'I was in the Library! The lights went out, and I was looking for a lantern.' },
      { type: 'dialogue', speaker: 'Ren', dialogue: 'Yes, you took a lantern. But the Trace Light shows you took it BEFORE the blackout.' },
      { type: 'dialogue', speaker: 'Ren', dialogue: 'Because you knew the blackout was coming. You orchestrated it with the 13th chime resonance to cover up the poisoning!' },
      { type: 'image', backgroundColor: '#4a1111', animation: 'zoom_in', sound: 'dramatic_boom' },
      { type: 'dialogue', speaker: 'Nadia', dialogue: '...You insolent little brat. You have no idea what he did. What he forced me to cover up 12 years ago.' }
    ]
  },
  ending: {
    id: 'ending',
    name: 'Resolution',
    skippable: true,
    music: 'melancholy_theme',
    panels: [
      { type: 'text', text: 'The police arrive shortly after the confession.', textColor: '#ffffff', animation: 'fade_in' },
      { type: 'dialogue', speaker: 'Hugo', dialogue: 'I just... I didn\'t want them to see what I\'d been giving him. I panicked. I\'m sorry.' },
      { type: 'dialogue', speaker: 'Dr. Vale', dialogue: 'Your father\'s legacy is tarnished, Hugo. But truth is more important than reputation.' },
      { type: 'text', text: 'As Nadia is led away, she turns back one last time.', textColor: '#ffffff' },
      { type: 'dialogue', speaker: 'Nadia', dialogue: 'Project Echo was a mistake. We should never have played god with sound.' },
      { type: 'image', backgroundColor: '#000000', animation: 'fade_in', duration: 3000, autoAdvance: true, autoAdvanceDelay: 1000 }
    ]
  },
  credits_scene: {
    id: 'credits_scene',
    name: 'Credits',
    skippable: true,
    music: 'main_theme',
    panels: [
      { type: 'text', text: 'THE THIRTEENTH CHIME', textColor: '#cda434', textSize: 40, animation: 'slide_up' },
      { type: 'text', text: 'A game of deduction and acoustic anomalies.', textColor: '#aaaaaa', animation: 'fade_in' }
    ]
  },
  post_credits: {
    id: 'post_credits',
    name: 'The Photo',
    skippable: false,
    music: 'mysterious_theme',
    panels: [
      { type: 'image', backgroundColor: '#111111', elements: [{ type: 'rect', x: 250, y: 100, width: 140, height: 160, color: '#dddddd' }], animation: 'zoom_in' },
      { type: 'dialogue', speaker: 'Ren', dialogue: 'Dr. Vale... this photo I found in the chamber. The Project Echo team.' },
      { type: 'dialogue', speaker: 'Dr. Vale', dialogue: 'Yes, I see Sable, Iris... wait. Is that...?' },
      { type: 'dialogue', speaker: 'Ren', dialogue: 'That\'s my mother. Why didn\'t she ever tell me she worked here?' },
      { type: 'text', text: 'TO BE CONTINUED...', textColor: '#ffffff', textSize: 30, animation: 'flash', duration: 4000, autoAdvance: true, autoAdvanceDelay: 4000 }
    ]
  }
};
