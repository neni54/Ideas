// Characters, pets, items, skins, achievements and mission templates.

export interface Character {
  id: string;
  name: string;
  role: string;
  color: string;
}

export const CHARACTERS: Record<string, Character> = {
  pip: { id: 'pip', name: 'Pip', role: 'Espíritu farolillo', color: '#ffc94d' },
  olmo: { id: 'olmo', name: 'Anciana Olmo', role: 'Sabia de la aldea', color: '#7fc8a9' },
  mira: { id: 'mira', name: 'Mira', role: 'Mercader', color: '#ff8fab' },
  bram: { id: 'bram', name: 'Bram', role: 'Herrero', color: '#ff9f5a' },
  tito: { id: 'tito', name: 'Tito', role: 'Pescador', color: '#5ab8ff' },
  luna: { id: 'luna', name: 'Luna', role: 'Exploradora', color: '#b69cff' },
  grumble: { id: 'grumble', name: 'Gruñón', role: 'Trol del Puente', color: '#6f8f6a' },
  morvena: { id: 'morvena', name: 'Morvena', role: 'Reina de la Bruma', color: '#8a6bd1' },
};

export type PetPerk = 'coins' | 'xp' | 'time' | 'none';
export interface Pet {
  id: string;
  name: string;
  desc: string;
  perk: PetPerk;
  price: number;
  color: string;
  accent: string;
}

export const PETS: Pet[] = [
  { id: 'pip', name: 'Pip', desc: 'Tu fiel farolillo. Siempre a tu lado.', perk: 'none', price: 0, color: '#ffd666', accent: '#ff9f1c' },
  { id: 'brasa', name: 'Brasa', desc: 'Zorrito de fuego. +15 % monedas.', perk: 'coins', price: 250, color: '#ff7a45', accent: '#ffd166' },
  { id: 'nimbo', name: 'Nimbo', desc: 'Búho de nube. +15 % XP.', perk: 'xp', price: 300, color: '#9ad7ff', accent: '#ffffff' },
  { id: 'musgo', name: 'Musgo', desc: 'Tortuga sabia. +5 s en retos de tiempo.', perk: 'time', price: 200, color: '#7ccf8a', accent: '#3f8f5a' },
];

export type ItemId = 'hint' | 'time' | 'freeze';
export interface Item {
  id: ItemId;
  name: string;
  desc: string;
  price: number;
  icon: string;
}

export const ITEMS: Item[] = [
  { id: 'hint', name: 'Pergamino de pista', desc: 'Elimina 2 opciones incorrectas.', price: 30, icon: '📜' },
  { id: 'time', name: 'Reloj de arena', desc: '+10 s en un reto de tiempo.', price: 25, icon: '⏳' },
  { id: 'freeze', name: 'Escudo de racha', desc: 'Protege tu racha un día sin jugar.', price: 120, icon: '🛡️' },
];

export interface Skin {
  id: string;
  name: string;
  cloak: string;
  trim: string;
  price: number;
}

export const SKINS: Skin[] = [
  { id: 'aurora', name: 'Capa Aurora', cloak: '#5b6cff', trim: '#ffd166', price: 0 },
  { id: 'ember', name: 'Capa Ascua', cloak: '#ef476f', trim: '#ffd166', price: 150 },
  { id: 'grove', name: 'Capa Arboleda', cloak: '#2a9d8f', trim: '#e9f5db', price: 150 },
  { id: 'night', name: 'Capa Nocturna', cloak: '#2b2d42', trim: '#b69cff', price: 300 },
];

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first', name: 'Primeros pasos', desc: 'Completa tu primer nivel.', icon: '👣' },
  { id: 'streak3', name: 'Llama viva', desc: 'Racha de 3 días.', icon: '🔥' },
  { id: 'streak7', name: 'Fuego eterno', desc: 'Racha de 7 días.', icon: '☄️' },
  { id: 'combo10', name: 'Imparable', desc: 'Consigue un combo de 10.', icon: '⚡' },
  { id: 'perfect', name: 'Sin mancha', desc: 'Completa un nivel sin fallos.', icon: '💎' },
  { id: 'echo10', name: 'Cazador de Ecos', desc: 'Domina 10 frases falladas.', icon: '🔮' },
  { id: 'boss', name: 'Matagigantes', desc: 'Derrota a un boss.', icon: '⚔️' },
  { id: 'pets', name: 'Domador', desc: 'Consigue 2 mascotas.', icon: '🐾' },
  { id: 'rich', name: 'Bolsa llena', desc: 'Acumula 500 monedas.', icon: '💰' },
  { id: 'lvl5', name: 'Héroe curtido', desc: 'Alcanza el nivel 5 de jugador.', icon: '🛡️' },
  { id: 'chests', name: 'Abrecofres', desc: 'Abre 5 cofres.', icon: '🗝️' },
  { id: 'valley', name: 'Luz del Valle', desc: 'Completa el Valle Susurro.', icon: '🌟' },
];

export type MissionKind = 'levels' | 'correct' | 'combo' | 'echoes' | 'coins' | 'stars3' | 'timed';
export interface MissionTemplate {
  id: string;
  kind: MissionKind;
  target: number;
  text: string;
  reward: number;
}

export const MISSION_POOL: MissionTemplate[] = [
  { id: 'lv2', kind: 'levels', target: 2, text: 'Completa 2 niveles', reward: 40 },
  { id: 'lv3', kind: 'levels', target: 3, text: 'Completa 3 niveles', reward: 60 },
  { id: 'c20', kind: 'correct', target: 20, text: 'Acierta 20 frases', reward: 40 },
  { id: 'c35', kind: 'correct', target: 35, text: 'Acierta 35 frases', reward: 60 },
  { id: 'cb5', kind: 'combo', target: 5, text: 'Logra un combo de 5', reward: 35 },
  { id: 'cb8', kind: 'combo', target: 8, text: 'Logra un combo de 8', reward: 50 },
  { id: 'ec3', kind: 'echoes', target: 3, text: 'Acierta 3 Ecos', reward: 45 },
  { id: 'co80', kind: 'coins', target: 80, text: 'Gana 80 monedas', reward: 40 },
  { id: 'st3', kind: 'stars3', target: 1, text: 'Consigue 3 estrellas en un nivel', reward: 50 },
  { id: 'tm1', kind: 'timed', target: 1, text: 'Supera un reto de tiempo', reward: 45 },
];
