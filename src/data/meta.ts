import type { Intent, Tag } from './types';

export type Mode = 'meaning' | 'sarcasm' | 'natural' | 'reply' | 'detective' | 'complete' | 'battle' | 'quickfire' | 'memory';

export interface ModeInfo {
  id: Mode;
  title: string;
  es: string;
  desc: string;
  glyph: string;
}

export const MODES: ModeInfo[] = [
  { id: 'meaning', title: 'What Does It Really Mean?', es: 'Qué significa de verdad', desc: 'Lo literal es una trampa. Encuentra el significado real.', glyph: '“ ”' },
  { id: 'sarcasm', title: 'Catch the Sarcasm', es: 'Pilla el tono', desc: 'Sincero, sarcástico, pasivo-agresivo, coqueto… Lee el tono.', glyph: '~' },
  { id: 'natural', title: 'Literal vs. Natural', es: 'Literal o nativo', desc: 'Elige cómo lo diría alguien nativo, no un traductor.', glyph: '≠' },
  { id: 'reply', title: 'What Would You Say?', es: 'Qué dirías tú', desc: 'Te escriben. Elige la respuesta que suena natural.', glyph: '↩' },
  { id: 'detective', title: 'Context Detective', es: 'Detective de contexto', desc: 'Analiza la escena y deduce qué está pasando.', glyph: '⌕' },
  { id: 'complete', title: 'Complete the Conversation', es: 'Completa la conversación', desc: 'Falta un trozo de la expresión. Pon la pieza exacta.', glyph: '_' },
  { id: 'battle', title: 'Phrase Battle', es: 'Duelo de frases', desc: 'Dos expresiones parecidas. Solo una encaja de verdad.', glyph: 'vs' },
  { id: 'quickfire', title: 'Quick Fire', es: 'Ráfaga', desc: '60 segundos. Sí o no. Instinto puro.', glyph: '⚡︎' },
  { id: 'memory', title: 'Memory Mode', es: 'Memoria', desc: 'Repaso espaciado de lo que estás a punto de olvidar.', glyph: '◐' },
];
export const MODE_BY_ID = Object.fromEntries(MODES.map((m) => [m.id, m])) as Record<Mode, ModeInfo>;
export const IN_RUN_MODES: Mode[] = ['meaning', 'sarcasm', 'natural', 'reply', 'detective', 'complete', 'battle'];

export const INTENTS: { id: Intent; label: string; hint: string }[] = [
  { id: 'sincere', label: 'Sincero', hint: 'Lo dice tal cual' },
  { id: 'sarcastic', label: 'Sarcástico', hint: 'Quiere decir lo contrario' },
  { id: 'passive-aggressive', label: 'Pasivo-agresivo', hint: 'Educado con veneno' },
  { id: 'annoyed', label: 'Molesto', hint: 'Enfado poco disimulado' },
  { id: 'joking', label: 'De broma', hint: 'Humor, sin mala intención' },
  { id: 'flirty', label: 'Coqueto', hint: 'Está ligando' },
  { id: 'evasive', label: 'Evasivo', hint: 'Esquiva sin decir "no"' },
];
export const INTENT_LABEL = Object.fromEntries(INTENTS.map((i) => [i.id, i.label])) as Record<Intent, string>;

export const TAG_LABEL: Record<Tag, string> = {
  informal: 'informal',
  slang: 'slang',
  idiom: 'idiom',
  phrasal: 'phrasal verb',
  sarcastic: 'sarcástico',
  humorous: 'humor',
  rude: 'borde',
  flirty: 'coqueto',
  polite: 'educado',
  work: 'trabajo',
  'passive-aggressive': 'pasivo-agresivo',
};

export const LEVEL_TITLES = [
  'Tourist',
  'Exchange Student',
  'Expat',
  'Regular',
  'Local',
  'Insider',
  'Smooth Talker',
  'Native-adjacent',
  'Unbothered',
  'Legend',
];
export const titleFor = (level: number) => LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1];

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first', name: 'Small Talk Survivor', desc: 'Termina tu primera sesión.' },
  { id: 'streak3', name: 'Habit Forming', desc: 'Racha de 3 días.' },
  { id: 'streak7', name: 'Suspiciously Consistent', desc: 'Racha de 7 días.' },
  { id: 'streak14', name: 'Main Character Behaviour', desc: 'Racha de 14 días.' },
  { id: 'combo10', name: 'On a Roll', desc: 'Encadena 10 aciertos.' },
  { id: 'perfect', name: 'Flawless. Annoyingly.', desc: 'Termina una sesión sin un solo fallo.' },
  { id: 'sarcasm10', name: 'Fluent in Sarcasm', desc: 'Identifica 10 tonos en Catch the Sarcasm.' },
  { id: 'literal15', name: 'Lost in Translation? Not Anymore', desc: 'Elige la versión nativa 15 veces.' },
  { id: 'phrases25', name: 'Collector of Comebacks', desc: 'Reúne 25 expresiones en tu colección.' },
  { id: 'mastered10', name: 'It Finally Clicked', desc: 'Domina 10 expresiones.' },
  { id: 'qf20', name: 'Quick on the Draw', desc: 'Haz 20 o más en Quick Fire.' },
  { id: 'memory30', name: 'Long-Term Relationship', desc: 'Repasa 30 tarjetas en Memory.' },
  { id: 'c1x10', name: 'Show-off', desc: 'Acierta 10 desafíos de nivel C1.' },
  { id: 'night', name: '2 AM Philosopher', desc: 'Juega entre medianoche y las 4.' },
  { id: 'packs5', name: 'Binge Learner', desc: 'Juega 5 colecciones distintas.' },
  { id: 'lvl5', name: 'Basically a Local', desc: 'Alcanza el nivel 5.' },
];

export type MissionKind = 'sessions' | 'correct' | 'sarcasm' | 'memory' | 'quickfire' | 'combo' | 'discover' | 'daily';
export interface MissionTemplate {
  id: string;
  kind: MissionKind;
  target: number;
  text: string;
  reward: number;
}

export const MISSION_POOL: MissionTemplate[] = [
  { id: 's1', kind: 'sessions', target: 1, text: 'Termina una sesión', reward: 40 },
  { id: 's2', kind: 'sessions', target: 2, text: 'Termina dos sesiones', reward: 70 },
  { id: 'c20', kind: 'correct', target: 20, text: 'Acierta 20 desafíos', reward: 50 },
  { id: 'sa3', kind: 'sarcasm', target: 3, text: 'Pilla 3 tonos en Catch the Sarcasm', reward: 50 },
  { id: 'm5', kind: 'memory', target: 5, text: 'Repasa 5 tarjetas en Memory', reward: 40 },
  { id: 'q12', kind: 'quickfire', target: 12, text: 'Haz 12 o más en Quick Fire', reward: 50 },
  { id: 'cb6', kind: 'combo', target: 6, text: 'Encadena 6 aciertos', reward: 45 },
  { id: 'd3', kind: 'discover', target: 3, text: 'Descubre 3 expresiones nuevas', reward: 40 },
  { id: 'dm', kind: 'daily', target: 1, text: 'Completa una lección', reward: 50 },
];
