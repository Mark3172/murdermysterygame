export interface HintData {
  phase: string;
  level1: string;
  level2: string;
  level3: string;
}

export const hints: Record<string, HintData> = {
  phase_1_investigation: {
    phase: 'Initial Investigation',
    level1: 'Take a close look around the Exhibition Chamber where the body was found. The professor was drinking something.',
    level2: 'Use the Trace Light on the thermos on the desk. It might reveal something invisible to the naked eye.',
    level3: 'The Trace Light shows chemical residue in the thermos. This is the poisoned tea. Also, check the door bolt for fingerprints.'
  },
  phase_2_alibis: {
    phase: 'Checking Alibis',
    level1: 'Talk to the suspects and cross-reference their claims with the environmental data.',
    level2: 'Hugo claims to have been on the Observation Deck. Check the sensors there with your Data Slicer.',
    level3: 'The rain sensor data from the Observation Deck shows no one was there during the blackout. Hugo is lying about his alibi.'
  },
  phase_3_locked_room: {
    phase: 'Solving the Locked Room',
    level1: 'If the main door was bolted from the inside, there must be another way in or out of the Exhibition Chamber.',
    level2: 'Investigate the Clockwork Gallery. There might be a hidden connection between the rooms. Use the Micro Rover.',
    level3: 'The Micro Rover reveals a hidden connecting door between the Clockwork Gallery and the Exhibition Chamber. This is how the stager escaped.'
  },
  phase_4_the_recording: {
    phase: 'The Pre-recorded Announcement',
    level1: 'The professor\'s voice during the blackout seemed odd. Can you analyze the audio?',
    level2: 'Use the Voice Prism on the recording of the announcement.',
    level3: 'The Voice Prism reveals splicing artifacts. The announcement was pre-recorded to establish a false time of death.'
  },
  phase_5_final_deduction: {
    phase: 'Final Confrontation',
    level1: 'Review the Project Echo notes and the missing lantern from the library.',
    level2: 'The 13th chime resonance matches the Pendulum Room, but Nadia was in the library. Or was she?',
    level3: 'Nadia used the missing lantern to navigate during the blackout, poisoned the tea earlier, and set up the recording to give herself an alibi.'
  }
};
