export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  portrait?: string;
  choices?: { text: string; nextId: string; condition?: string; evidenceRequired?: string; }[];
  next?: string;
  setFlag?: string;
  giveEvidence?: string;
  triggerEvent?: string;
}

export interface DialogueTree {
  id: string;
  startNode: string;
  nodes: Record<string, DialogueNode>;
}

export const dialogue: Record<string, DialogueTree> = {
  intro_arrival: {
    id: 'intro_arrival',
    startNode: 'node1',
    nodes: {
      'node1': { id: 'node1', speaker: 'Dr. Vale', text: 'Well, Ren. Stellara Observatory. Magnificent, isn\'t it? The air itself vibrates with scientific potential.', next: 'node2' },
      'node2': { id: 'node2', speaker: 'Ren', text: 'It\'s loud. And cold. And why did we have to come up here in the middle of a storm?', next: 'node3' },
      'node3': { id: 'node3', speaker: 'Dr. Vale', text: 'Because Professor Sable promised a demonstration that would "redefine acoustic physics." You can\'t miss history just because of a little drizzle.', next: 'node4' },
      'node4': { id: 'node4', speaker: 'Ren', text: '(I have a bad feeling about this...) Let\'s just get inside.', triggerEvent: 'end_dialogue' }
    }
  },
  aldric_greeting: {
    id: 'aldric_greeting',
    startNode: 'node1',
    nodes: {
      'node1': { id: 'node1', speaker: 'Prof. Sable', text: 'Ah, Mira! And your young protégé. Welcome. I am on the verge of a breakthrough.', next: 'node2' },
      'node2': { id: 'node2', speaker: 'Dr. Vale', text: 'Aldric, you look terrible. Have you slept?', next: 'node3' },
      'node3': { id: 'node3', speaker: 'Prof. Sable', text: 'Sleep is for those who aren\'t about to change the world. Tonight at 8:00, the culmination of my life\'s work. Don\'t miss the announcement.', triggerEvent: 'end_dialogue' }
    }
  },
  post_discovery: {
    id: 'post_discovery',
    startNode: 'node1',
    nodes: {
      'node1': { id: 'node1', speaker: 'Dr. Vale', text: 'He\'s gone. It looks like poison. And the door was bolted from the inside.', next: 'node2' },
      'node2': { id: 'node2', speaker: 'Ren', text: 'A locked room murder? Just like in the books!', next: 'node3' },
      'node3': { id: 'node3', speaker: 'Dr. Vale', text: 'This isn\'t fiction, Ren. The killer is still trapped in this facility with us because of the storm. We need to gather evidence. Use the gadgets I gave you.', triggerEvent: 'start_investigation' }
    }
  },
  nadia_interview: {
    id: 'nadia_interview',
    startNode: 'greet',
    nodes: {
      'greet': { id: 'greet', speaker: 'Nadia', text: 'What do you want? I have a headache, and the police aren\'t here yet.', choices: [
        { text: 'Where were you during the blackout?', nextId: 'alibi' },
        { text: 'Did you hear anything strange?', nextId: 'heard' },
        { text: '(Present Missing Lantern)', nextId: 'confront_lantern', evidenceRequired: 'missing_lantern' },
        { text: '(Present Poisoned Tea)', nextId: 'confront_poison', evidenceRequired: 'poisoned_tea' },
        { text: 'Never mind.', nextId: 'leave' }
      ]},
      'alibi': { id: 'alibi', speaker: 'Nadia', text: 'I was in the Library. When the lights went out, I tried to find an emergency lantern.', next: 'greet' },
      'heard': { id: 'heard', speaker: 'Nadia', text: 'Just the storm outside. And people shouting in the hall when the power cut.', next: 'greet' },
      'confront_lantern': { id: 'confront_lantern', speaker: 'Nadia', text: 'You found a dust outline? So what? Someone else must have taken it. I was fumbling in the dark.', next: 'greet' },
      'confront_poison': { id: 'confront_poison', speaker: 'Nadia', text: 'Solvent in his tea? How dreadful. The Professor was always careless with chemicals.', next: 'greet' },
      'leave': { id: 'leave', speaker: 'Ren', text: 'I\'ll talk to you later.', triggerEvent: 'end_dialogue' }
    }
  },
  hugo_interview: {
    id: 'hugo_interview',
    startNode: 'greet',
    nodes: {
      'greet': { id: 'greet', speaker: 'Hugo', text: 'My father... I can\'t believe it. What do you want?', choices: [
        { text: 'Where were you during the blackout?', nextId: 'alibi' },
        { text: 'Why did you lock the door?', nextId: 'confront_prints', evidenceRequired: 'hugo_fingerprints' },
        { text: 'The Observation Deck was empty.', nextId: 'confront_sensors', evidenceRequired: 'rain_sensor_data' },
        { text: '(Confront) You bolted the room from inside and escaped!', nextId: 'confront_hugo', evidenceRequired: 'connecting_door' },
        { text: 'Leave him alone.', nextId: 'leave' }
      ]},
      'alibi': { id: 'alibi', speaker: 'Hugo', text: 'I needed fresh air. I was on the Observation Deck. When the lights went out, the electronic doors jammed. I was stuck out there.', next: 'greet' },
      'confront_prints': { id: 'confront_prints', speaker: 'Hugo', text: 'My fingerprints? I... I touched the door earlier today! When I brought him his tea!', next: 'greet' },
      'confront_sensors': { id: 'confront_sensors', speaker: 'Hugo', text: 'The sensors are broken! Everything in this rusted place is broken! Look, I didn\'t kill him!', next: 'greet' },
      'confront_hugo': {
        id: 'confront_hugo',
        speaker: 'Ren',
        text: 'Hugo, you lied. You weren\'t on the Observation Deck—the weather sensors prove no one was there. And your fingerprints are on the deadbolt. You locked the Exhibition Chamber from the inside and escaped through the secret tunnel behind the clockwork gallery!',
        next: 'hugo_breakdown'
      },
      'hugo_breakdown': {
        id: 'hugo_breakdown',
        speaker: 'Hugo',
        text: '[Breaks down] Yes! Yes, I bolted the door! When the lights went out, I used the secret tunnel and found him dead. His tea was spilled. He was taking stimulants I gave him illegally. If they did an autopsy immediately, I\'d lose my medical license. I bolted the door from inside to buy time and ran! But I swear I didn\'t poison him!',
        setFlag: 'hugo_confessed',
        next: 'vale_realization'
      },
      'vale_realization': {
        id: 'vale_realization',
        speaker: 'Dr. Vale',
        text: 'So the room was only locked AFTER Aldric died... The killer never needed a locked-room trick! The timeline we assumed is completely broken.',
        triggerEvent: 'end_dialogue'
      },
      'leave': { id: 'leave', speaker: 'Ren', text: 'Let\'s give him some space.', triggerEvent: 'end_dialogue' }
    }
  },
  petra_interview: {
    id: 'petra_interview',
    startNode: 'greet',
    nodes: {
      'greet': { id: 'greet', speaker: 'Petra', text: 'Quite the scoop, isn\'t it? The great Professor Sable, murdered. You playing detective, kid?', choices: [
        { text: 'Where were you?', nextId: 'alibi' },
        { text: 'Why were you bugging the gallery?', nextId: 'confront_bug', evidenceRequired: 'petra_hidden_recorder' },
        { text: 'See you around.', nextId: 'leave' }
      ]},
      'alibi': { id: 'alibi', speaker: 'Petra', text: 'Clockwork Gallery. Getting B-roll footage. It\'s dark and loud down there. Didn\'t see a thing.', next: 'greet' },
      'confront_bug': { id: 'confront_bug', speaker: 'Petra', text: 'Alright, fine. I planted a mic. I\'m an investigative journalist, it\'s what I do. But listen to the tape—someone ran past me in the dark!', next: 'greet' },
      'leave': { id: 'leave', speaker: 'Ren', text: 'Goodbye.', triggerEvent: 'end_dialogue' }
    }
  },
  felix_interview: {
    id: 'felix_interview',
    startNode: 'greet',
    nodes: {
      'greet': { id: 'greet', speaker: 'Felix', text: 'This is a disaster for public relations. What is it, boy?', choices: [
        { text: 'Where were you?', nextId: 'alibi' },
        { text: 'What is that ink on your sleeve?', nextId: 'confront_ink', evidenceRequired: 'felix_ink_stain' },
        { text: 'Nothing right now.', nextId: 'leave' }
      ]},
      'alibi': { id: 'alibi', speaker: 'Felix', text: 'In the hallway. A fuse box was sparking, I was attempting to repair it when the entire grid failed.', next: 'greet' },
      'confront_ink': { id: 'confront_ink', speaker: 'Felix', text: 'Ink? Nonsense, it\'s grease from the fuse box. Now leave me be.', next: 'greet' },
      'leave': { id: 'leave', speaker: 'Ren', text: 'Goodbye.', triggerEvent: 'end_dialogue' }
    }
  },
  iris_interview: {
    id: 'iris_interview',
    startNode: 'greet',
    nodes: {
      'greet': { id: 'greet', speaker: 'Iris', text: 'Aldric is dead... Just like the others. What do you need to know, young detective?', choices: [
        { text: 'Where were you?', nextId: 'alibi' },
        { text: 'The weight sensors confirm your alibi.', nextId: 'confirm_alibi', evidenceRequired: 'pendulum_weight_sensor' },
        { text: 'I need to keep looking.', nextId: 'leave' }
      ]},
      'alibi': { id: 'alibi', speaker: 'Iris', text: 'I was in the Pendulum Room. I go there to think. I didn\'t move the entire time the lights were out.', next: 'greet' },
      'confirm_alibi': { id: 'confirm_alibi', speaker: 'Iris', text: 'I told you the truth. But truth is a rare commodity in this observatory.', next: 'greet' },
      'leave': { id: 'leave', speaker: 'Ren', text: 'Thank you.', triggerEvent: 'end_dialogue' }
    }
  },
  hugo_confrontation: {
    id: 'hugo_confrontation',
    startNode: 'start',
    nodes: {
      'start': { id: 'start', speaker: 'Ren', text: 'Hugo, you lied. You weren\'t on the Observation Deck. The sensors prove it.', next: 'node2' },
      'node2': { id: 'node2', speaker: 'Hugo', text: 'I... you can\'t prove anything!', next: 'node3' },
      'node3': { id: 'node3', speaker: 'Ren', text: 'I also found the hidden door. And your fingerprints on the lock. You locked the Exhibition Chamber from the inside and escaped through the wall.', next: 'node4' },
      'node4': { id: 'node4', speaker: 'Hugo', text: '[Breaks down] Yes! Yes, I locked it! But I didn\'t kill him!', next: 'node5' },
      'node5': { id: 'node5', speaker: 'Hugo', text: 'When the lights went out, I heard a noise. I used the secret tunnel... and I found him dead. His tea spilled.', next: 'node6' },
      'node6': { id: 'node6', speaker: 'Dr. Vale', text: 'Why lock the door, Hugo?', next: 'node7' },
      'node7': { id: 'node7', speaker: 'Hugo', text: 'He was taking experimental stimulants. I was prescribing them to him illegally so he could finish his work. If they did an autopsy immediately, I\'d lose my license. I just needed time to think! So I bolted the door and ran.', setFlag: 'hugo_confessed', triggerEvent: 'end_dialogue' }
    }
  },
  nadia_confrontation: {
    id: 'nadia_confrontation',
    startNode: 'start',
    nodes: {
      'start': { id: 'start', speaker: 'Ren', text: 'It was you, Nadia. You poisoned Professor Sable.', next: 'node2' },
      'node2': { id: 'node2', speaker: 'Nadia', text: 'Preposterous. I have an alibi. I was in the library when the announcement happened, and then the lights went out.', next: 'node3' },
      'node3': { id: 'node3', speaker: 'Ren', text: 'The announcement was spliced from old tapes. The Voice Prism proved it. You played it over the PA to establish a fake time of death.', next: 'node4' },
      'node4': { id: 'node4', speaker: 'Nadia', text: 'You have a wild imagination. How could I navigate the dark to do all this?', next: 'node5' },
      'node5': { id: 'node5', speaker: 'Ren', text: 'You stole the lantern from the library before the blackout. And we found the solvent vial in the plant pot, with your perfume on it.', next: 'node6' },
      'node6': { id: 'node6', speaker: 'Dr. Vale', text: 'And the motive? We found the original Project Echo logs. You altered the calibration data 12 years ago. Sable found out, didn\'t he?', next: 'node7' },
      'node7': { id: 'node7', speaker: 'Nadia', text: 'He was going to expose me! Ruin my career! After I gave him everything! Yes... I did it. And I\'d do it again to protect my work.', triggerEvent: 'trigger_ending' }
    }
  },
  gadget_tutorials: {
    id: 'gadget_tutorials',
    startNode: 'start',
    nodes: {
      'start': { id: 'start', speaker: 'Dr. Vale', text: 'Use your gadgets, Ren. They are the key to seeing what the naked eye misses.', triggerEvent: 'end_dialogue' }
    }
  },
  vale_commentary: {
    id: 'vale_commentary',
    startNode: 'start',
    nodes: {
      'start': { id: 'start', speaker: 'Dr. Vale', text: 'Look closely at the environment. Nothing is as it seems in this place.', triggerEvent: 'end_dialogue' }
    }
  }
};
