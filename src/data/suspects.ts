export interface SuspectData {
  id: string;
  name: string;
  age: number;
  title: string;
  description: string;
  personality: string;
  publicSecret: string;
  realSecret: string;
  alibiClaim: string;
  alibiTruth: string;
  isKiller: boolean;
  isLockedRoomStager: boolean;
  portraitColors: { hair: string; skin: string; outfit: string; accent: string };
  dialogueTreeId: string;
  locationDuringBlackout: string;
}

export const suspects: Record<string, SuspectData> = {
  nadia: {
    id: 'nadia',
    name: 'Nadia Thorn',
    age: 38,
    title: 'Lead Acoustician',
    description: 'A precise, tightly wound woman with sharp features and a habit of tapping rhythmic patterns. She wears a crisp lab coat over a lavender blouse.',
    personality: 'Cold, calculating, seemingly highly professional but masking deep resentment. Speaks in exact, measured sentences.',
    publicSecret: 'Dislikes the Professor for stunting her career growth.',
    realSecret: 'She falsified the data for Project Echo 12 years ago, leading to the disaster, and the Professor just found out.',
    alibiClaim: 'I was in the Library looking for a replacement emergency lantern when the lights went out.',
    alibiTruth: 'She had already stolen the lantern, poisoned the tea, and set up the recording. She was orchestrating the blackout from the main breaker.',
    isKiller: true,
    isLockedRoomStager: false,
    portraitColors: { hair: '#2c3e50', skin: '#f1c40f', outfit: '#ecf0f1', accent: '#9b59b6' },
    dialogueTreeId: 'nadia_interview',
    locationDuringBlackout: 'main_hall'
  },
  hugo: {
    id: 'hugo',
    name: 'Dr. Hugo Wren',
    age: 35,
    title: 'Medical Doctor (Sable\'s Son)',
    description: 'A stressed, disheveled man in an expensive but rumpled suit. He has bags under his eyes and avoids eye contact.',
    personality: 'Anxious, defensive, deeply burdened by his father\'s legacy and his own perceived failures.',
    publicSecret: 'He has massive gambling debts.',
    realSecret: 'He has been illegally supplying his father with experimental stimulants to keep him working, which would be revealed in an autopsy.',
    alibiClaim: 'I was out on the Observation Deck getting some fresh air. The doors jammed during the blackout.',
    alibiTruth: 'He was in the Clockwork Gallery, heard a noise, used the secret door, found his father dead, and locked the door in a panic to stop an autopsy.',
    isKiller: false,
    isLockedRoomStager: true,
    portraitColors: { hair: '#8e44ad', skin: '#e67e22', outfit: '#34495e', accent: '#c0392b' },
    dialogueTreeId: 'hugo_interview',
    locationDuringBlackout: 'exhibition_chamber'
  },
  petra: {
    id: 'petra',
    name: 'Petra Solano',
    age: 29,
    title: 'Investigative Journalist',
    description: 'Energetic and sharp-eyed, dressed in practical gear with a camera permanently slung around her neck.',
    personality: 'Relentless, cynical, driven by a personal sense of justice. Distrusts authority.',
    publicSecret: 'She is writing an unauthorized, highly critical biography of Professor Sable.',
    realSecret: 'She is the daughter of Kenji Maro, the researcher who died in the Project Echo disaster, seeking revenge.',
    alibiClaim: 'I was in the Clockwork Gallery, trying to get a good angle for photos of the main gear assembly.',
    alibiTruth: 'She actually was in the Clockwork Gallery, planting a bug to record the Professor\'s private conversations.',
    isKiller: false,
    isLockedRoomStager: false,
    portraitColors: { hair: '#e74c3c', skin: '#d35400', outfit: '#27ae60', accent: '#f39c12' },
    dialogueTreeId: 'petra_interview',
    locationDuringBlackout: 'clockwork_gallery'
  },
  felix: {
    id: 'felix',
    name: 'Felix Ashworth',
    age: 50,
    title: 'Wealthy Patron',
    description: 'A large, florid man with an immaculate tailored suit and an imposing demeanor. Always seems to be sweating slightly.',
    personality: 'Arrogant, dismissive of those he considers beneath him, used to getting his way with money.',
    publicSecret: 'He plans to cut funding to the Observatory to build a luxury resort on the mountain.',
    realSecret: 'He has been embezzling funds from the Observatory\'s accounts for years, and the audit was tomorrow.',
    alibiClaim: 'I was in the hallway trying to fix a fuse box that seemed to be sparking.',
    alibiTruth: 'He was in the Library/Archive, desperately altering financial records and spilling ink on himself.',
    isKiller: false,
    isLockedRoomStager: false,
    portraitColors: { hair: '#bdc3c7', skin: '#f5b041', outfit: '#2c3e50', accent: '#f1c40f' },
    dialogueTreeId: 'felix_interview',
    locationDuringBlackout: 'library'
  },
  iris: {
    id: 'iris',
    name: 'Iris Blackwell',
    age: 60,
    title: 'Retired Engineer',
    description: 'A quiet, dignified woman with streaks of gray hair and burn scars on her left hand. Carries a worn notebook.',
    personality: 'Melancholic, observant, speaks softly but carries an air of profound grief.',
    publicSecret: 'She visits the observatory on the anniversary of Project Echo to mourn.',
    realSecret: 'She knows the truth about Nadia\'s falsified data but kept quiet out of misplaced guilt over her own mistakes.',
    alibiClaim: 'I was in the Pendulum Room, watching the swing. I find it peaceful.',
    alibiTruth: 'She was exactly where she claimed to be, standing motionless in the dark.',
    isKiller: false,
    isLockedRoomStager: false,
    portraitColors: { hair: '#7f8c8d', skin: '#cd6155', outfit: '#3498db', accent: '#bdc3c7' },
    dialogueTreeId: 'iris_interview',
    locationDuringBlackout: 'pendulum_room'
  }
};
