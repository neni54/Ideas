// SIDEYE · the five levels of English and the 4-3-2-1 rule for new phrases.
import type { Cefr, Tier } from './types';

export interface Level {
  tier: Tier;
  name: string;
  /** CEFR range shown to the user. */
  range: string;
  /** Spanish name and one line about what it covers. */
  es: string;
  blurb: string;
}

export const LEVELS: Level[] = [
  { tier: 1, name: 'FIRST STEPS', range: 'A1', es: 'Primeros pasos', blurb: 'Saludos, pedir algo, decir cómo estás: frases cortas del día a día.' },
  { tier: 2, name: 'GETTING COMFORTABLE', range: 'A1–A2', es: 'Cogiendo soltura', blurb: 'Expresiones muy frecuentes y respuestas rápidas que usan los nativos.' },
  { tier: 3, name: 'REAL-LIFE ENGLISH', range: 'A2–B1', es: 'Inglés de la vida real', blurb: 'Conversaciones reales, planes, quedar, disculparse, el primer sarcasmo fácil.' },
  { tier: 4, name: 'READ BETWEEN THE LINES', range: 'B1–B2', es: 'Leer entre líneas', blurb: 'Ironía, indirectas, oficina y citas: lo que se dice sin decirlo.' },
  { tier: 5, name: 'THINK IN ENGLISH', range: 'B2–C1', es: 'Pensar en inglés', blurb: 'Pasivo-agresivo, slang y dobles sentidos para entenderlo todo.' },
];
export const LEVEL_BY_TIER: Record<Tier, Level> = Object.fromEntries(LEVELS.map((l) => [l.tier, l])) as Record<Tier, Level>;

/**
 * Order of difficulty for every block of 10 NEW phrases:
 * 4 × FIRST STEPS, 3 × GETTING COMFORTABLE, 2 × REAL-LIFE ENGLISH, 1 × higher (4 or 5).
 * Spread out so the hardest slot is always the last of the ten.
 */
export const NEW_PHRASE_SLOTS: (1 | 2 | 3 | 'top')[] = [1, 2, 1, 3, 1, 2, 1, 2, 3, 'top'];

/** Default level from the CEFR tag (older content); content can set its own `tier`. */
export const tierFromCefr = (c: Cefr): Tier => (c === 'A1' ? 1 : c === 'A2' ? 2 : c === 'B1' ? 3 : c === 'B2' ? 4 : 5);

/** XP per correct answer by level (harder levels give a little more). */
export const XP_BY_TIER: Record<Tier, number> = { 1: 8, 2: 9, 3: 10, 4: 12, 5: 15 };

/** Level adjustments for older content whose CEFR tag does not reflect its real difficulty. */
export const TIER_OVERRIDE: Record<string, Tier> = {
  'everyday-2': 2, // I'm good, thanks.
  'meant-3': 2, // No worries at all!
  'meant-4': 4, // That's an interesting choice. (easy words, ironic meaning)
  'passive-3': 4, // Thanks for nothing. (passive-aggressive)
};

/** SIDEYE level of an expression (or any content with a CEFR tag and an optional tier). */
export function tierOf(x: { id?: string; level: Cefr; tier?: Tier }): Tier {
  return x.tier ?? (x.id ? TIER_OVERRIDE[x.id] : undefined) ?? tierFromCefr(x.level);
}

/** Short label for chips: "A1", "A1–A2"… */
export const tierRange = (t: Tier) => LEVEL_BY_TIER[t].range;
