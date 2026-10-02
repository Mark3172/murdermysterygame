export interface GadgetData {
  id: string;
  name: string;
  icon: string;
  description: string;
  tutorialDialogue: string[];
  usableIn: string[];
  revealedEvidence: string[];
  limitations: string;
}

export const gadgets: Record<string, GadgetData> = {
  tranquility_focus: {
    id: 'tranquility_focus',
    name: 'Tranquility Focus',
    icon: '🧠',
    description: 'Enters a state of deep detective concentration to survey the area, highlight interactive points, and organize thoughts.',
    tutorialDialogue: [
      "Take a deep breath and focus, Ren.",
      "In this state of tranquility, subtle environmental clues become clear.",
      "Use this to review your case progress and steady your mind."
    ],
    usableIn: ['main_hall', 'exhibition_chamber', 'clockwork_gallery', 'library', 'pendulum_room', 'observation_deck'],
    revealedEvidence: [],
    limitations: 'Highlights general points of interest rather than hidden microscopic traces.'
  },
  voice_prism: {
    id: 'voice_prism',
    name: 'Voice Prism',
    icon: '🎙️',
    description: 'Analyzes audio recordings to isolate specific frequencies, detect editing artifacts, and reveal hidden layers of sound.',
    tutorialDialogue: [
      "Let's test out the Voice Prism, Ren.",
      "It can separate overlapping sounds and highlight digital tampering.",
      "Just point it at an audio source and look for the red spikes—those indicate splices."
    ],
    usableIn: ['main_hall', 'exhibition_chamber', 'library'],
    revealedEvidence: ['spliced_recording', 'petra_hidden_recorder'],
    limitations: 'Requires a clear audio source; background noise can interfere with analysis.'
  },
  trace_light: {
    id: 'trace_light',
    name: 'Trace Light',
    icon: '🔦',
    description: 'A specialized UV spectrum emitter that illuminates chemical residues, specific bodily fluids, and recently disturbed dust.',
    tutorialDialogue: [
      "The Trace Light isn't an ordinary flashlight.",
      "It makes certain chemical compounds glow. Try shining it around the room.",
      "Notice how the dust looks different where things were moved?"
    ],
    usableIn: ['exhibition_chamber', 'library', 'main_hall'],
    revealedEvidence: ['poisoned_tea', 'missing_lantern', 'nadia_vial'],
    limitations: 'Residues fade over time, and bright ambient light renders the glow invisible.'
  },
  micro_rover: {
    id: 'micro_rover',
    name: 'Micro Rover',
    icon: '🚙',
    description: 'A remote-controlled, tiny camera drone that can fit under doors and navigate tight spaces, like ventilation shafts.',
    tutorialDialogue: [
      "Deploying the Micro Rover here.",
      "Use the controls to steer it through small gaps.",
      "It has a built-in camera, so we can see what's on the other side."
    ],
    usableIn: ['clockwork_gallery', 'exhibition_chamber'],
    revealedEvidence: ['connecting_door'],
    limitations: 'Limited range due to signal degradation through thick walls.'
  },
  echo_lens: {
    id: 'echo_lens',
    name: 'Echo Lens',
    icon: '🔍',
    description: 'Visualizes sound wave reflections, allowing the user to match acoustic resonances to specific rooms or materials.',
    tutorialDialogue: [
      "The Echo Lens is fascinating. It translates sound into visual patterns.",
      "If we record a sound in one room, we can see if its acoustic signature matches another.",
      "Look at the shape of the sound waves; they tell a story."
    ],
    usableIn: ['pendulum_room', 'main_hall'],
    revealedEvidence: ['thirteenth_chime_resonance'],
    limitations: 'Needs a distinct, isolated sound to create a clear visual signature.'
  },
  data_slicer: {
    id: 'data_slicer',
    name: 'Data Slicer',
    icon: '💻',
    description: 'A portable terminal capable of decrypting files and interfacing with physical sensor logs to uncover hidden or deleted information.',
    tutorialDialogue: [
      "Connect the Data Slicer to that terminal, Ren.",
      "It'll pull up the raw logs, bypassing any surface-level UI.",
      "Let's see if anyone tried to cover their digital tracks."
    ],
    usableIn: ['observation_deck', 'library', 'pendulum_room'],
    revealedEvidence: ['rain_sensor_data', 'pendulum_weight_sensor'],
    limitations: 'Requires a physical connection to the target hardware system.'
  },
  chemical_sniffer: {
    id: 'chemical_sniffer',
    name: 'Chemical Sniffer',
    icon: '👃',
    description: 'Analyzes air composition and physical samples to identify complex molecular compounds, matching them against a database.',
    tutorialDialogue: [
      "This little device acts as an electronic nose.",
      "Hold it near a suspect substance, and it will break down the chemical makeup.",
      "It's perfect for finding trace elements of exotic materials."
    ],
    usableIn: ['exhibition_chamber', 'clockwork_gallery'],
    revealedEvidence: ['poisoned_tea'],
    limitations: 'Can be overwhelmed by strong ambient odors; needs proximity to the source.'
  }
};
