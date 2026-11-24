// The app's personality: a clever friend, slightly sarcastic, never a schoolteacher.

const LINES = {
  correct: [
    'Nice. You actually got the nuance.',
    'Clean. Very clean.',
    'Correct. Smugness permitted.',
    'Exactly that.',
    'You read the room.',
    'Look at you, understanding things.',
    'That is the one.',
    'Correct, and without a dictionary. Growth.',
  ],
  streak: [
    "Native-level instincts. Don't get cocky.",
    'Three in a row. Who even are you?',
    'On a roll. Try not to make it your whole personality.',
    'Keep going. This is weirdly impressive.',
    'At this point you could eavesdrop professionally.',
  ],
  tone: [
    'You caught the sarcasm. Impressive.',
    "Tone detected. Nobody's fooling you.",
    'You heard the eye-roll. Good ears.',
    'Side-eye: detected. Well done.',
  ],
  natural: [
    'That sounded like a local. Unsettling.',
    'Zero accent detected. Well, almost.',
    'Nobody would guess you learned that from an app.',
  ],
  retry: ['Second time is the charm.', 'There it is.', 'Better. Much better.', 'Redemption arc complete.'],
  literal: [
    'That was a little too literal.',
    'Your dictionary is proud. Nobody else is.',
    'Word by word is how you end up on the wrong date.',
    'Literal translation strikes again.',
  ],
  calque: [
    'Grammatically fine. Nobody says it.',
    'That is Spanish wearing an English costume.',
    'Understandable. Also slightly alarming.',
  ],
  wrongTone: [
    'Technically possible. Emotionally questionable.',
    'You missed the eye-roll.',
    'Read it again. With attitude this time.',
    'Your English is improving. Your judgment is another story.',
  ],
  wrong: [
    'Well, that was awkward. At least now you know.',
    'Close. Not close enough to text back.',
    'Plot twist: no.',
    'Bold choice. Wrong, but bold.',
    "That's okay. This is how it sticks.",
  ],
  newPhrase: ['Phrase unlocked.', 'New one for the collection.', 'Added to your phrasebook.'],
};

export type VoiceKey = keyof typeof LINES;

const recent: string[] = [];

/** Picks a line, avoiding anything said recently so the feedback never feels repetitive. */
export function say(key: VoiceKey): string {
  const pool = LINES[key];
  const fresh = pool.filter((l) => !recent.includes(l));
  const pick = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length || pool.length))];
  recent.push(pick);
  if (recent.length > 10) recent.shift();
  return pick;
}

export function verdict(accuracy: number): { title: string; sub: string } {
  if (accuracy >= 1) return { title: 'Flawless. Annoyingly.', sub: 'Ni un fallo. Ya puedes ir a cenas con nativos.' };
  if (accuracy >= 0.85) return { title: 'Smooth.', sub: 'Pillas lo que no se dice. Se nota.' };
  if (accuracy >= 0.7) return { title: "You'd survive a dinner party.", sub: 'Buen nivel. Un par de matices se te escaparon.' };
  if (accuracy >= 0.5) return { title: 'Getting there.', sub: 'Lo que no se dice empieza a asomar. Lo fallado vuelve en Memory.' };
  return { title: 'Rough one. That is how it sticks.', sub: 'Los errores de hoy son los aciertos de la semana que viene.' };
}

export function greeting(name: string) {
  const h = new Date().getHours();
  if (h < 5) return `Still up, ${name}?`;
  if (h < 12) return `Morning, ${name}.`;
  if (h < 20) return `Afternoon, ${name}.`;
  return `Evening, ${name}.`;
}
