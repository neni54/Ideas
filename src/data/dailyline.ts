// THE DAILY LINE: one short, funny line a day. Not a lesson: read it, smile, steal it.
// Days follow the 4-3-2-1 rule: in every 10 days, 4 A1 lines, 3 A1–A2, 2 A2–B1, 1 B1–C1.
// To add lines: append to DAILY_LINES with a unique id and its tier. Nothing else changes.
import { NEW_PHRASE_SLOTS } from './levels';
import type { Tier } from './types';

export interface DailyLine {
  id: string;
  tier: Tier;
  en: string;
  /** Natural Spanish (Spain). */
  es: string;
  /** Short explanation when the joke or the expression needs it. */
  note?: string;
  /** Optional expression of the collections it matches (shows "Ver ficha" / "Guardar"). */
  x?: string;
}

export const DAILY_LINES: DailyLine[] = [
  /* ── FIRST STEPS · A1 ── */
  { id: 'dl-1', tier: 1, en: 'Coffee first. Then talk.', es: 'Primero café. Luego hablamos.', note: 'Para las mañanas en las que no eres persona todavía.' },
  { id: 'dl-2', tier: 1, en: 'My cat is the boss.', es: 'Mi gato es el jefe.', note: 'Cualquiera con gato lo confirma.' },
  { id: 'dl-3', tier: 1, en: 'I love Fridays. Fridays love me too.', es: 'Me encantan los viernes. Y yo a ellos.' },
  { id: 'dl-4', tier: 1, en: 'Pizza is a vegetable. Trust me.', es: 'La pizza es una verdura. Confía en mí.', note: '"Trust me" = confía en mí. Ideal para decir mentiras evidentes.' },
  { id: 'dl-5', tier: 1, en: 'I\'m not late. Everyone is early.', es: 'No llego tarde. Es que todos llegan pronto.' },
  { id: 'dl-6', tier: 1, en: 'My bed is calling me.', es: 'Mi cama me está llamando.', note: 'Una forma graciosa de decir que te vas a dormir.' },
  { id: 'dl-7', tier: 1, en: 'Monday again? No, thank you.', es: '¿Otra vez lunes? No, gracias.' },
  { id: 'dl-8', tier: 1, en: 'I\'m on a diet. A cookie diet.', es: 'Estoy a dieta. A dieta de galletas.' },
  { id: 'dl-9', tier: 1, en: 'Good morning! Is it Friday yet?', es: '¡Buenos días! ¿Ya es viernes?', note: '"Yet" en una pregunta = "ya".' },
  { id: 'dl-10', tier: 1, en: 'I can cook. Toast is cooking.', es: 'Sé cocinar. Hacer tostadas es cocinar.' },
  { id: 'dl-11', tier: 1, en: 'My phone is at 1%. Me too.', es: 'Mi móvil está al 1 %. Yo también.', note: 'Para cuando estás sin energía.' },
  { id: 'dl-12', tier: 1, en: 'I love my job. On Fridays.', es: 'Me encanta mi trabajo. Los viernes.' },
  { id: 'dl-13', tier: 1, en: 'Sorry, I can\'t. I have plans with my sofa.', es: 'Lo siento, no puedo. Tengo planes con mi sofá.' },
  { id: 'dl-14', tier: 1, en: 'Is it hot in here, or is it me?', es: '¿Hace calor aquí o soy yo?', note: 'Una broma de ligoteo de las de toda la vida.' },
  { id: 'dl-15', tier: 1, en: 'Thank you, coffee. You are my best friend.', es: 'Gracias, café. Eres mi mejor amigo.' },
  { id: 'dl-16', tier: 1, en: 'Hello, weekend. I missed you.', es: 'Hola, fin de semana. Te he echado de menos.', note: '"I missed you" = te he echado de menos (no "te perdí").' },
  /* ── GETTING COMFORTABLE · A1–A2 ── */
  { id: 'dl-17', tier: 2, en: 'I\'m on my way! (I\'m still in bed.)', es: '¡Voy de camino! (Sigo en la cama.)', note: 'La mentira más famosa del mundo.', x: 'plans-1' },
  { id: 'dl-18', tier: 2, en: 'Count me in. For the food.', es: 'Me apunto. Por la comida.', note: '"Count me in" = me apunto.', x: 'plans-2' },
  { id: 'dl-19', tier: 2, en: 'No way! You washed the dishes?', es: '¡No me digas! ¿Has fregado los platos?', x: 'reactions-1' },
  { id: 'dl-20', tier: 2, en: 'Long time no see! It\'s been... a day.', es: '¡Cuánto tiempo sin verte! Ha pasado... un día.', x: 'smalltalk-2' },
  { id: 'dl-21', tier: 2, en: 'Dinner\'s on me. And by me, I mean you.', es: 'La cena la pago yo. Y por "yo" quiero decir tú.', note: '"It\'s on me" = invito yo.', x: 'manners-3' },
  { id: 'dl-22', tier: 2, en: 'Help yourself! (Not to my fries.)', es: '¡Sírvete! (Pero no de mis patatas.)', note: '"Help yourself" = sírvete lo que quieras.', x: 'manners-2' },
  { id: 'dl-23', tier: 2, en: 'I can\'t wait for the weekend. It\'s Tuesday.', es: 'Qué ganas de que llegue el fin de semana. Es martes.', x: 'plans-3' },
  { id: 'dl-24', tier: 2, en: 'Take your time. I\'m only starving.', es: 'Tómate tu tiempo. Solo me estoy muriendo de hambre.', note: '"Starving" = muerto de hambre (exagerando, claro).', x: 'manners-1' },
  { id: 'dl-25', tier: 2, en: 'What\'s up? — The rent.', es: '¿Qué pasa? — Que ha subido el alquiler.', note: 'Juego de palabras: "up" también significa "subir".', x: 'smalltalk-4' },
  { id: 'dl-26', tier: 2, en: 'Never mind. I found my glasses. On my head.', es: 'Déjalo. He encontrado mis gafas. En mi cabeza.', x: 'manners-4' },
  { id: 'dl-27', tier: 2, en: 'Fair enough. You win. This time.', es: 'Vale, es justo. Ganas tú. Esta vez.', x: 'reactions-5' },
  { id: 'dl-28', tier: 2, en: 'Me? Drama? Never.', es: '¿Yo? ¿Dramas? Jamás.' },
  /* ── REAL-LIFE ENGLISH · A2–B1 ── */
  { id: 'dl-29', tier: 3, en: 'I\'m running late, but with style.', es: 'Llego tarde, pero con estilo.', note: '"I\'m running late" = voy con retraso.', x: 'everyday-1' },
  { id: 'dl-30', tier: 3, en: 'Tell me about it. I\'ve been tired since 2015.', es: 'Dímelo a mí. Estoy cansado desde 2015.', note: '"Tell me about it" = dímelo a mí (no te pide que se lo cuentes).', x: 'sarcasm-3' },
  { id: 'dl-31', tier: 3, en: 'Let\'s call it a day. It\'s 10 a.m.', es: 'Dejémoslo por hoy. Son las 10 de la mañana.', note: '"Call it a day" = dejarlo por hoy.', x: 'idioms-2' },
  { id: 'dl-32', tier: 3, en: 'I didn\'t see that coming. Neither did my diet.', es: 'No me lo esperaba. Ni mi dieta tampoco.', x: 'plottwists-2' },
  { id: 'dl-33', tier: 3, en: 'My bad! I ate your yogurt. Again.', es: '¡Culpa mía! Me he comido tu yogur. Otra vez.', note: '"My bad" = culpa mía, en plan informal.', x: 'awkward-3' },
  { id: 'dl-34', tier: 3, en: 'Well, this is awkward. Your name is not Kevin.', es: 'Bueno, esto es incómodo. No te llamas Kevin.', x: 'awkward-1' },
  { id: 'dl-35', tier: 3, en: 'No spoilers! I\'m only on season one. Of 2019.', es: '¡Nada de spoilers! Voy por la primera temporada. De 2019.', x: 'popculture-1' },
  { id: 'dl-36', tier: 3, en: 'I\'m good, thanks. (Narrator: he was not good.)', es: 'Estoy bien, gracias. (Narrador: no estaba bien.)', note: 'Parodia de los documentales: el narrador cuenta la verdad.', x: 'everyday-2' },
  /* ── READ BETWEEN THE LINES / THINK IN ENGLISH · B1–C1 ── */
  { id: 'dl-37', tier: 4, en: 'Oh great, another meeting that could have been an email.', es: 'Genial, otra reunión que podría haber sido un correo.', note: 'Sarcasmo de oficina: "great" significa justo lo contrario.' },
  { id: 'dl-38', tier: 4, en: 'Per my last email... and my last two emails.', es: 'Como dije en mi último correo... y en los dos anteriores.', note: '"Per my last email" es la forma pasivo-agresiva de decir "ya te lo dije".', x: 'office-2' },
  { id: 'dl-39', tier: 5, en: 'I\'m not ignoring you. I\'m just emotionally on airplane mode.', es: 'No te ignoro. Es que emocionalmente estoy en modo avión.' },
  { id: 'dl-40', tier: 5, en: 'It\'s giving Monday energy, and it\'s only Sunday.', es: 'Me da vibras de lunes, y solo es domingo.', note: '"It\'s giving..." = me da vibras de... (slang muy actual).', x: 'redflags-4' },
];

const BY_TIER: Record<'1' | '2' | '3' | 'top', DailyLine[]> = {
  '1': DAILY_LINES.filter((l) => l.tier === 1),
  '2': DAILY_LINES.filter((l) => l.tier === 2),
  '3': DAILY_LINES.filter((l) => l.tier === 3),
  top: DAILY_LINES.filter((l) => l.tier >= 4),
};

/** Whole days since 2026-01-01 (local), for a stable rotation. */
function dayNumber(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2026, 0, 1)) / 86400000);
}

/**
 * The line of the day. Position in a 10-day block → level (4-3-2-1);
 * the n-th day of that level → the n-th line of that level (so lines rarely repeat).
 */
export function dailyLine(day: string): DailyLine {
  const n = Math.max(0, dayNumber(day));
  const slot = NEW_PHRASE_SLOTS[n % 10];
  const key = String(slot) as keyof typeof BY_TIER;
  const before = Math.floor(n / 10) * NEW_PHRASE_SLOTS.filter((s) => s === slot).length + NEW_PHRASE_SLOTS.slice(0, n % 10).filter((s) => s === slot).length;
  const pool = BY_TIER[key];
  return pool[before % pool.length];
}
