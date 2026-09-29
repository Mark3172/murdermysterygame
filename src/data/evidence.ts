export interface EvidenceData {
  id: string;
  name: string;
  shortDesc: string;
  fullDesc: string;
  discoveryLocation: string;
  gadgetRequired?: string;
  discoveryDialogue: string;
  relatedSuspect?: string;
  isRequired: boolean;
  category: 'physical' | 'testimony' | 'acoustic' | 'document';
}

export const evidence: Record<string, EvidenceData> = {
  spliced_recording: {
    id: 'spliced_recording',
    name: 'Spliced Recording',
    shortDesc: 'Audio of the announcement showing digital splicing.',
    fullDesc: 'Analysis of the public address recording reveals clear digital splicing artifacts. Professor Sable\'s speech was pre-recorded and pieced together from earlier lectures to make it sound like he was alive at 7:45 PM.',
    discoveryLocation: 'Main Hall',
    gadgetRequired: 'voice_prism',
    discoveryDialogue: "Wait... look at these waveform spikes. The pitch jumps unnaturally here and here. Dr. Vale, this announcement was patched together from different recordings!",
    isRequired: true,
    category: 'acoustic'
  },
  poisoned_tea: {
    id: 'poisoned_tea',
    name: 'Poisoned Tea',
    shortDesc: 'Thermos containing traces of clockwork solvent.',
    fullDesc: 'The Professor\'s favorite thermos. UV analysis shows glowing residue around the rim and inside. Chemical analysis confirms it\'s a highly toxic industrial solvent used for cleaning heavy clockwork machinery.',
    discoveryLocation: 'Exhibition Chamber',
    gadgetRequired: 'trace_light',
    discoveryDialogue: "The Trace Light is picking up a strange glow around the rim of the thermos. This isn't ordinary tea. Someone spiked it with something caustic.",
    isRequired: true,
    category: 'physical'
  },
  missing_lantern: {
    id: 'missing_lantern',
    name: 'Missing Lantern',
    shortDesc: 'Dust outline indicating a removed lantern.',
    fullDesc: 'A clear, rectangular area free of dust on a shelf in the Library. The dimensions perfectly match the standard emergency lanterns used in the observatory. Someone took it recently, before the blackout.',
    discoveryLocation: 'Library/Archive',
    gadgetRequired: 'trace_light',
    discoveryDialogue: "Look at this dust outline. A lantern was sitting right here until very recently. If someone took it before the blackout, they knew the lights were going to go out.",
    isRequired: true,
    category: 'physical'
  },
  hugo_fingerprints: {
    id: 'hugo_fingerprints',
    name: 'Hugo\'s Fingerprints',
    shortDesc: 'Smudged prints on the interior lock bolt.',
    fullDesc: 'Distinct fingerprints found on the heavy iron bolt locking the Exhibition Chamber from the inside. They belong to Hugo Wren. He must have locked the door from within.',
    discoveryLocation: 'Exhibition Chamber',
    gadgetRequired: 'trace_light',
    discoveryDialogue: "There are partial prints on the heavy bolt locking the main door. And they match Hugo. Why would the victim's son lock him in?",
    relatedSuspect: 'hugo',
    isRequired: true,
    category: 'physical'
  },
  connecting_door: {
    id: 'connecting_door',
    name: 'Connecting Door',
    shortDesc: 'Hidden passageway behind the Exhibition Chamber.',
    fullDesc: 'A narrow, concealed maintenance passage connecting the Clockwork Gallery directly to the Exhibition Chamber. The hinges have been recently oiled, and there are scuff marks on the floor.',
    discoveryLocation: 'Clockwork Gallery',
    gadgetRequired: 'micro_rover',
    discoveryDialogue: "The Micro Rover found a gap behind the main gear assembly. It leads straight into a maintenance tunnel... which comes out behind a tapestry in the Exhibition Chamber! A secret exit.",
    isRequired: true,
    category: 'physical'
  },
  rain_sensor_data: {
    id: 'rain_sensor_data',
    name: 'Rain Sensor Data',
    shortDesc: 'Log showing empty Observation Deck.',
    fullDesc: 'The motion and pressure sensors on the Observation Deck floor. The logs from 7:30 PM to 8:30 PM show absolutely zero activity, directly contradicting Hugo\'s claim that he was there during the blackout.',
    discoveryLocation: 'Observation Deck',
    gadgetRequired: 'data_slicer',
    discoveryDialogue: "According to the Data Slicer, the floor sensors up here didn't register a single footstep between 7:30 and 8:30. Hugo wasn't on the Observation Deck at all.",
    relatedSuspect: 'hugo',
    isRequired: true,
    category: 'document'
  },
  petra_hidden_recorder: {
    id: 'petra_hidden_recorder',
    name: 'Petra\'s Hidden Recorder',
    shortDesc: 'Audio capturing suspicious activity in the gallery.',
    fullDesc: 'A small, voice-activated recorder hidden near the entrance of the Clockwork Gallery. It captured hurried footsteps during the blackout, the sound of liquid pouring, and a frantic whispered apology.',
    discoveryLocation: 'Clockwork Gallery',
    gadgetRequired: 'voice_prism',
    discoveryDialogue: "Petra hid a mic here to eavesdrop on the Professor. But listen... during the blackout, it picked up heavy footsteps running past, then a whisper: 'I'm sorry, I'm so sorry.'",
    relatedSuspect: 'petra',
    isRequired: true,
    category: 'acoustic'
  },
  felix_ink_stain: {
    id: 'felix_ink_stain',
    name: 'Felix\'s Ink Stain',
    shortDesc: 'Specific ink found on Felix and archive records.',
    fullDesc: 'A distinctive, dark violet ink stain on the cuff of Felix Ashworth\'s shirt. The exact same chemical composition is found on recently altered financial ledgers in the Archive, proving he was doctoring the books.',
    discoveryLocation: 'Library/Archive',
    gadgetRequired: 'chemical_sniffer',
    discoveryDialogue: "The Sniffer confirms the chemical makeup of this ink. It's identical to the stain on Felix's sleeve. He wasn't fixing a fuse box; he was here cooking the books.",
    relatedSuspect: 'felix',
    isRequired: false,
    category: 'physical'
  },
  thirteenth_chime_resonance: {
    id: 'thirteenth_chime_resonance',
    name: 'Thirteenth Chime Resonance',
    shortDesc: 'Acoustic profile of the sinister chime.',
    fullDesc: 'An acoustic analysis of the eerie 13th chime that triggered the blackout. The Echo Lens reveals its waveform perfectly matches the ambient resonance of the Pendulum Room, but amplified to a dangerous, structural-damaging frequency—the exact signature of the failed Project Echo.',
    discoveryLocation: 'Pendulum Room',
    gadgetRequired: 'echo_lens',
    discoveryDialogue: "Look at the wave pattern of that 13th chime on the Echo Lens. It aligns perfectly with the acoustics of the Pendulum Room. This wasn't a mechanical error; it was a targeted acoustic strike.",
    isRequired: true,
    category: 'acoustic'
  },
  nadia_vial: {
    id: 'nadia_vial',
    name: 'Nadia\'s Vial',
    shortDesc: 'Empty vial with solvent residue in Nadia\'s pocket.',
    fullDesc: 'A small glass vial found discarded in a potted plant near the Library. UV light reveals trace amounts of the same clockwork solvent found in the Professor\'s tea. A faint scent of Nadia\'s lavender perfume lingers on the glass.',
    discoveryLocation: 'Library/Archive',
    gadgetRequired: 'trace_light',
    discoveryDialogue: "The Trace Light lit this vial up like a Christmas tree. It's the same solvent from the tea. And it smells faintly of lavender... just like Nadia Thorn.",
    relatedSuspect: 'nadia',
    isRequired: true,
    category: 'physical'
  },
  pendulum_weight_sensor: {
    id: 'pendulum_weight_sensor',
    name: 'Pendulum Weight Sensor',
    shortDesc: 'Confirms Iris was near the pendulum.',
    fullDesc: 'Weight distribution logs from the floor grates around the great pendulum. They confirm a person matching Iris Blackwell\'s weight was standing perfectly still in the room during the entire duration of the blackout, verifying her alibi.',
    discoveryLocation: 'Pendulum Room',
    gadgetRequired: 'data_slicer',
    discoveryDialogue: "The floor weight sensors show someone standing motionless near the pendulum control panel for almost an hour. It matches Iris's physical profile. She really was here the whole time.",
    relatedSuspect: 'iris',
    isRequired: false,
    category: 'document'
  },
  project_echo_notes: {
    id: 'project_echo_notes',
    name: 'Project Echo Notes',
    shortDesc: 'Falsified data hiding acoustic dangers.',
    fullDesc: 'Hidden logs from the disastrous Project Echo 12 years ago. They show that the fatal acoustic resonance was not an accident, but a result of deliberately falsified calibration data. The handwriting on the altered notes matches Nadia Thorn.',
    discoveryLocation: 'Library/Archive',
    discoveryDialogue: "These are the original logs from Project Echo. Wait, the calibration numbers have been altered. And the handwriting on these corrections... it matches the notes Nadia took during our interview.",
    relatedSuspect: 'nadia',
    isRequired: true,
    category: 'document'
  },
  mothers_photo: {
    id: 'mothers_photo',
    name: 'Mother\'s Photo',
    shortDesc: 'A photo of Ren\'s mother with the Project Echo team.',
    fullDesc: 'An old, faded photograph found tucked behind a plaque in the Exhibition Chamber. It shows the original Project Echo team, including Professor Sable, Iris Blackwell... and Ren\'s mother, smiling brightly.',
    discoveryLocation: 'Exhibition Chamber',
    discoveryDialogue: "What's this? A photo tucked behind the plaque. It's the old research team... Professor Sable, Iris... and... Mom? My mother was part of Project Echo?",
    isRequired: false,
    category: 'physical'
  }
};
