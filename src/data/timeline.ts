export interface TimelineEvent {
  id: string;
  time: string;
  description: string;
  isCorrectPosition: number;
  associatedEvidence: string[];
  isVisible: boolean;
}

export const timeline: Record<string, TimelineEvent> = {
  event_lantern: {
    id: 'event_lantern',
    time: '7:15 PM',
    description: 'Nadia Thorn sneaks into the Library and steals a lantern, leaving a dust outline.',
    isCorrectPosition: 0,
    associatedEvidence: ['missing_lantern'],
    isVisible: false
  },
  event_poison: {
    id: 'event_poison',
    time: '7:30 PM',
    description: 'Nadia Thorn slips clockwork lubricant solvent into Professor Sable\'s thermos while visiting him in the Exhibition Chamber.',
    isCorrectPosition: 1,
    associatedEvidence: ['poisoned_tea', 'nadia_vial'],
    isVisible: false
  },
  event_recording: {
    id: 'event_recording',
    time: '7:45 PM',
    description: 'Nadia uses the PA system to broadcast a pre-recorded, spliced message of Professor Sable starting the presentation.',
    isCorrectPosition: 2,
    associatedEvidence: ['spliced_recording'],
    isVisible: false
  },
  event_death: {
    id: 'event_death',
    time: '7:50 PM',
    description: 'Professor Sable succumbs to the poison in the Exhibition Chamber.',
    isCorrectPosition: 3,
    associatedEvidence: ['poisoned_tea'],
    isVisible: false
  },
  event_blackout: {
    id: 'event_blackout',
    time: '8:00 PM',
    description: 'The scheduled 13th chime triggers a pre-planned blackout. The echo of the chime matches the Pendulum Room.',
    isCorrectPosition: 4,
    associatedEvidence: ['thirteenth_chime_resonance'],
    isVisible: false
  },
  event_hugo_discovery: {
    id: 'event_hugo_discovery',
    time: '8:05 PM',
    description: 'During the blackout, Hugo Wren enters the Exhibition Chamber via the hidden connecting door and discovers his father dead.',
    isCorrectPosition: 5,
    associatedEvidence: ['connecting_door'],
    isVisible: false
  },
  event_locked_room: {
    id: 'event_locked_room',
    time: '8:10 PM',
    description: 'Hugo locks the Exhibition Chamber from the inside to delay an autopsy and hide unauthorized medication, escaping through the hidden door.',
    isCorrectPosition: 6,
    associatedEvidence: ['hugo_fingerprints'],
    isVisible: false
  },
  event_petra_snooping: {
    id: 'event_petra_snooping',
    time: '8:15 PM',
    description: 'Petra Solano plants a hidden recorder in the Clockwork Gallery, capturing footsteps and a whispered apology.',
    isCorrectPosition: 7,
    associatedEvidence: ['petra_hidden_recorder'],
    isVisible: false
  }
};
