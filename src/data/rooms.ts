export interface RoomData {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  backgroundColor: string;
  accentColor: string;
  exits: { direction: string; targetRoom: string; x: number; y: number }[];
  interactables: { id: string; name: string; x: number; y: number; width: number; height: number; description: string; evidenceId?: string; gadgetRequired?: string; dialogueOnInteract?: string; }[];
  npcs: { id: string; suspectId?: string; x: number; y: number; }[];
  spawnPoint: { x: number; y: number };
  ambience: string;
  features: string[];
}

export const rooms: Record<string, RoomData> = {
  main_hall: {
    id: 'main_hall',
    name: 'Main Hall',
    description: 'A grand, domed hall with polished brass railings and marble floors. The faint hum of machinery is ever-present.',
    width: 32,
    height: 24,
    backgroundColor: '#1a1a2e',
    accentColor: '#cda434',
    exits: [
      { direction: 'up', targetRoom: 'observation_deck', x: 16, y: 1 },
      { direction: 'down', targetRoom: 'clockwork_gallery', x: 16, y: 22 },
      { direction: 'left', targetRoom: 'library', x: 1, y: 12 },
      { direction: 'right', targetRoom: 'pendulum_room', x: 30, y: 12 },
      { direction: 'up', targetRoom: 'exhibition_chamber', x: 8, y: 1 }
    ],
    interactables: [
      { id: 'pa_speaker', name: 'PA Speaker', x: 16, y: 5, width: 2, height: 2, description: 'The main speaker system. It crackles with static.', evidenceId: 'spliced_recording', gadgetRequired: 'voice_prism', dialogueOnInteract: 'The announcement came from this speaker. If I use the Voice Prism, I might be able to analyze the audio playback.' }
    ],
    npcs: [
      { id: 'npc_nadia', suspectId: 'nadia', x: 10, y: 10 }
    ],
    spawnPoint: { x: 16, y: 18 },
    ambience: 'low_hum',
    features: ['brass_railings', 'marble_floor']
  },
  exhibition_chamber: {
    id: 'exhibition_chamber',
    name: 'Exhibition Chamber',
    description: 'A secure room meant for showcasing sensitive prototypes. It currently holds Professor Sable\'s latest work.',
    width: 24,
    height: 20,
    backgroundColor: '#2c1e16',
    accentColor: '#8b4513',
    exits: [
      { direction: 'up', targetRoom: 'main_hall', x: 12, y: 1 },
      { direction: 'hidden', targetRoom: 'clockwork_gallery', x: 12, y: 19 } // Hidden door
    ],
    interactables: [
      { id: 'desk', name: 'Professor\'s Desk', x: 12, y: 10, width: 4, height: 3, description: 'Scattered papers and a thermos of tea.' },
      { id: 'thermos', name: 'Thermos', x: 13, y: 10, width: 1, height: 1, description: 'A half-empty thermos of tea.', evidenceId: 'poisoned_tea', gadgetRequired: 'trace_light', dialogueOnInteract: 'The Trace Light shows something glowing around the rim of this thermos.' },
      { id: 'door_bolt', name: 'Heavy Bolt', x: 12, y: 1, width: 2, height: 1, description: 'The heavy deadbolt used to lock the door from the inside.', evidenceId: 'hugo_fingerprints', gadgetRequired: 'trace_light', dialogueOnInteract: 'There are smudged fingerprints on this bolt. The Trace Light makes them clear.' },
      { id: 'plaque', name: 'Commemorative Plaque', x: 2, y: 5, width: 1, height: 2, description: 'A plaque listing the founders of the observatory.', evidenceId: 'mothers_photo', dialogueOnInteract: 'There\'s something slipped behind the edge of this plaque...' }
    ],
    npcs: [
      { id: 'npc_hugo', suspectId: 'hugo', x: 5, y: 15 }
    ],
    spawnPoint: { x: 12, y: 2 },
    ambience: 'eerie_silence',
    features: ['locked_door', 'prototype_display']
  },
  clockwork_gallery: {
    id: 'clockwork_gallery',
    name: 'Clockwork Gallery',
    description: 'A mesmerizing room filled with turning gears and ticking escapements. The noise is overwhelming.',
    width: 28,
    height: 22,
    backgroundColor: '#2a2015',
    accentColor: '#d4af37',
    exits: [
      { direction: 'up', targetRoom: 'main_hall', x: 14, y: 1 },
      { direction: 'hidden', targetRoom: 'exhibition_chamber', x: 14, y: 20 }
    ],
    interactables: [
      { id: 'main_gear', name: 'Main Gear Assembly', x: 14, y: 10, width: 6, height: 6, description: 'A massive, churning set of brass gears.' },
      { id: 'dark_corner', name: 'Dark Corner', x: 3, y: 3, width: 2, height: 2, description: 'A shadowed alcove near the entrance.', evidenceId: 'petra_hidden_recorder', gadgetRequired: 'voice_prism', dialogueOnInteract: 'Wait, the Voice Prism is picking up a faint electronic hum from this dark corner.' },
      { id: 'wall_gap', name: 'Gap behind Gears', x: 14, y: 19, width: 2, height: 1, description: 'A small gap between the wall and the machinery.', evidenceId: 'connecting_door', gadgetRequired: 'micro_rover', dialogueOnInteract: 'This gap is too small for me, but the Micro Rover can fit right in.' }
    ],
    npcs: [
      { id: 'npc_petra', suspectId: 'petra', x: 20, y: 10 }
    ],
    spawnPoint: { x: 14, y: 2 },
    ambience: 'loud_ticking',
    features: ['giant_gears', 'steam_vents']
  },
  library: {
    id: 'library',
    name: 'Library & Archive',
    description: 'Tall shelves crammed with dusty tomes and technical manuals. It smells of old paper and dust.',
    width: 26,
    height: 26,
    backgroundColor: '#1b2631',
    accentColor: '#5dade2',
    exits: [
      { direction: 'right', targetRoom: 'main_hall', x: 24, y: 13 }
    ],
    interactables: [
      { id: 'shelf_3', name: 'Shelf 3', x: 5, y: 5, width: 4, height: 1, description: 'Emergency supplies usually kept here.', evidenceId: 'missing_lantern', gadgetRequired: 'trace_light', dialogueOnInteract: 'The Trace Light shows a perfect rectangular area free of dust. A lantern is missing.' },
      { id: 'archive_desk', name: 'Archive Desk', x: 13, y: 13, width: 3, height: 2, description: 'Ledgers and inkwells.' },
      { id: 'spilled_ink', name: 'Spilled Ink', x: 14, y: 13, width: 1, height: 1, description: 'A fresh, violet ink stain on the ledger.', evidenceId: 'felix_ink_stain', gadgetRequired: 'trace_light', dialogueOnInteract: 'The Sniffer confirms this ink is a very specific, rare violet blend.' },
      { id: 'old_files', name: 'Filing Cabinet', x: 2, y: 20, width: 2, height: 2, description: 'Old project records.', evidenceId: 'project_echo_notes', dialogueOnInteract: 'These are the files for Project Echo. The calibration numbers look altered.' },
      { id: 'potted_plant', name: 'Potted Plant', x: 20, y: 2, width: 2, height: 2, description: 'A large fern.', evidenceId: 'nadia_vial', gadgetRequired: 'trace_light', dialogueOnInteract: 'Something is glowing in the dirt of this plant under the Trace Light.' }
    ],
    npcs: [
      { id: 'npc_felix', suspectId: 'felix', x: 10, y: 15 }
    ],
    spawnPoint: { x: 23, y: 13 },
    ambience: 'muffled_wind',
    features: ['bookshelves', 'dust_motes']
  },
  pendulum_room: {
    id: 'pendulum_room',
    name: 'Pendulum Room',
    description: 'A vast, empty chamber dominated by a massive Foucault pendulum swinging rhythmically in the center.',
    width: 30,
    height: 28,
    backgroundColor: '#17202a',
    accentColor: '#8e44ad',
    exits: [
      { direction: 'left', targetRoom: 'main_hall', x: 2, y: 14 }
    ],
    interactables: [
      { id: 'pendulum', name: 'Great Pendulum', x: 15, y: 14, width: 4, height: 4, description: 'A heavy brass weight swinging eternally.' },
      { id: 'acoustics', name: 'Room Acoustics', x: 15, y: 5, width: 2, height: 2, description: 'The echo in here is very distinct.', evidenceId: 'thirteenth_chime_resonance', gadgetRequired: 'echo_lens', dialogueOnInteract: 'The Echo Lens maps the sound waves of this room perfectly to the 13th chime.' },
      { id: 'floor_grates', name: 'Floor Grates', x: 10, y: 14, width: 2, height: 2, description: 'Ventilation grates with built-in weight sensors for maintenance logging.', evidenceId: 'pendulum_weight_sensor', gadgetRequired: 'echo_lens', dialogueOnInteract: 'The Data Slicer can pull the logs from these floor weight sensors.' }
    ],
    npcs: [
      { id: 'npc_iris', suspectId: 'iris', x: 20, y: 20 }
    ],
    spawnPoint: { x: 3, y: 14 },
    ambience: 'deep_whoosh',
    features: ['swinging_pendulum', 'echoing_walls']
  },
  observation_deck: {
    id: 'observation_deck',
    name: 'Observation Deck',
    description: 'An open-air balcony freezing in the rain. Telescopes point blindly into the storm clouds.',
    width: 20,
    height: 15,
    backgroundColor: '#0a0a1a',
    accentColor: '#3498db',
    exits: [
      { direction: 'down', targetRoom: 'main_hall', x: 10, y: 14 }
    ],
    interactables: [
      { id: 'telescope', name: 'Telescope', x: 10, y: 5, width: 2, height: 2, description: 'A large optical telescope, currently capped.' },
      { id: 'deck_sensors', name: 'Weather Sensors', x: 2, y: 2, width: 2, height: 2, description: 'Environmental monitoring equipment.', evidenceId: 'rain_sensor_data', gadgetRequired: 'echo_lens', dialogueOnInteract: 'The Data Slicer can connect to the weather station logs to check foot traffic.' }
    ],
    npcs: [],
    spawnPoint: { x: 10, y: 13 },
    ambience: 'heavy_rain',
    features: ['rain_effect', 'telescopes']
  }
};
