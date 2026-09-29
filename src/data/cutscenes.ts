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
      { type: 'text', text: 'Rain batters the glass of the Stellara Observatory.', textColor: '#ffffff', animation: 'fade_in', duration: 2000, autoAdvance: true, autoAdvanceDelay: 3000 },
      { type: 'image', backgroundColor: '#000000', elements: [{ type: 'circle', x: 320, y: 180, width: 100, height: 100, color: '#4a4a4a' }], animation: 'zoom_in', sound: 'heavy_rain' },
      { type: 'text', text: 'A heavy pendulum swings. Tick. Tock.', textColor: '#aaaaaa', animation: 'fade_in' },
      { type: 'image', backgroundColor: '#111111', elements: [{ type: 'line', x: 200, y: 180, width: 440, height: 180, color: '#888888' }], animation: 'slide_right', sound: 'deep_whoosh' },
      { type: 'text', text: 'A trembling hand reaches for a pocket watch.', textColor: '#ffffff', animation: 'fade_in' },
      { type: 'image', backgroundColor: '#050505', elements: [{ type: 'circle', x: 320, y: 180, width: 50, height: 50, color: '#d4af37' }, { type: 'line', x: 300, y: 160, width: 340, height: 200, color: '#000000' }], animation: 'flash', sound: 'glass_shatter' },
      { type: 'text', text: 'The glass is shattered.', textColor: '#ff0000', animation: 'fade_in' },
      { type: 'image', backgroundColor: '#000000', animation: 'none', sound: 'power_down', autoAdvance: true, autoAdvanceDelay: 1000 },
      { type: 'text', text: 'Then, total darkness.', textColor: '#ffffff', animation: 'fade_in', autoAdvance: true, autoAdvanceDelay: 2000 },
      { type: 'text', text: 'And the thirteenth chime begins.', textColor: '#ff5555', textSize: 32, animation: 'shake', sound: 'chime_13', autoAdvance: true, autoAdvanceDelay: 4000 }
    ]
  },
  opening_title: {
    id: 'opening_title',
    name: 'Title Sequence',
    skippable: true,
    music: 'main_theme',
    panels: [
      { type: 'image', backgroundColor: '#1a1a2e', elements: [{ type: 'text', x: 320, y: 150, text: 'THE THIRTEENTH CHIME', fontSize: 48, color: '#cda434' }], animation: 'fade_in', duration: 3000 },
      { type: 'dialogue', speaker: 'Ren', dialogue: 'I never thought a school trip to an observatory would end like this.', animation: 'slide_up' },
      { type: 'dialogue', speaker: 'Dr. Vale', dialogue: 'Keep your eyes peeled, Ren. Science is about observing the details others miss.', animation: 'slide_left' }
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
