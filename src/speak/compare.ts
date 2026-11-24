// SIDEYE SPEAK · compares what the browser recognised (or what was typed) with the target phrase.
// This is a WORD comparison, not a pronunciation (phoneme) assessment, and the UI says so.

export type TokenState = 'match' | 'missing' | 'different' | 'extra';
export interface Token {
  state: TokenState;
  /** Word of the target phrase (empty for 'extra'). */
  word: string;
  /** What was heard instead ('different' / 'extra'). */
  heard?: string;
}
export interface Comparison {
  tokens: Token[];
  matched: number;
  total: number;
  /** Simple, honest tips in Spanish. */
  tips: string[];
}

const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "he's": 'he is', "she's": 'she is', "it's": 'it is', "that's": 'that is',
  "what's": 'what is', "there's": 'there is', "here's": 'here is', "who's": 'who is', "let's": 'let us', "i'll": 'i will', "you'll": 'you will', "we'll": 'we will',
  "they'll": 'they will', "i've": 'i have', "you've": 'you have', "we've": 'we have', "they've": 'they have', "i'd": 'i would', "you'd": 'you would',
  "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'can not', "cannot": 'can not', "won't": 'will not', "isn't": 'is not', "aren't": 'are not',
  "wasn't": 'was not', "weren't": 'were not', "couldn't": 'could not', "shouldn't": 'should not', "wouldn't": 'would not', "haven't": 'have not', "hasn't": 'has not',
  gonna: 'going to', wanna: 'want to', gotta: 'got to', "y'all": 'you all', ok: 'okay',
};
const NUMBERS: Record<string, string> = { '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten', '2000s': 'two thousands' };

interface W {
  norm: string;
  /** Original word (without surrounding punctuation), same for every part of a contraction. */
  shown: string;
  /** Index of the original word this part belongs to ("I'm" → two parts, one group). */
  group: number;
}

/** Normalises a phrase into comparable words; contractions expand ("I'm" → "i am") in one group. */
function words(text: string): W[] {
  const out: W[] = [];
  const raw = text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2014\u2013]/g, ' ')
    .replace(/\[|\]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  raw.forEach((w, g) => {
    const shown = w.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, '');
    const clean = shown.toLowerCase();
    if (!clean) return;
    for (const n of (CONTRACTIONS[clean] ?? NUMBERS[clean] ?? clean).split(' ')) out.push({ norm: n.replace(/'/g, ''), shown, group: g });
  });
  return out;
}

/** Edit distance between two words (small typo / homophone tolerance). */
function close(a: string, b: string) {
  if (a === b) return true;
  // A dropped final -s/-ed/-d is exactly what we want to point out, so it never counts as close.
  if (a === b + 's' || b === a + 's' || a === b + 'd' || b === a + 'd' || a === b + 'ed' || b === a + 'ed') return false;
  if (Math.abs(a.length - b.length) > 2 || Math.min(a.length, b.length) < 4) return false;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length] <= 1;
}

export function compare(target: string, heard: string): Comparison {
  const T = words(target);
  const H = words(heard);
  // Longest common subsequence alignment on normalised words.
  const n = T.length;
  const m = H.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) L[i][j] = close(T[i].norm, H[j].norm) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  // Per target part: matched / missing / replaced by a heard part. Heard parts left over are extra.
  type Part = { t?: W; h?: W; state: TokenState };
  const parts: Part[] = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && close(T[i].norm, H[j].norm)) parts.push({ t: T[i++], h: H[j++], state: 'match' });
    else if (i < n && j < m && L[i + 1][j + 1] === L[i][j]) parts.push({ t: T[i++], h: H[j++], state: 'different' });
    else if (i < n && (j >= m || L[i + 1][j] >= L[i][j + 1])) parts.push({ t: T[i++], state: 'missing' });
    else parts.push({ h: H[j++], state: 'extra' });
  }
  // Back to the words the person sees: one token per original target word.
  const tokens: Token[] = [];
  const seenHeard = new Set<number>();
  for (let k = 0; k < parts.length; ) {
    const p = parts[k];
    if (!p.t) {
      if (p.h && !seenHeard.has(p.h.group)) tokens.push({ state: 'extra', word: '', heard: p.h.shown });
      if (p.h) seenHeard.add(p.h.group);
      k++;
      continue;
    }
    const g = p.t.group;
    const group: Part[] = [];
    while (k < parts.length && (parts[k].t?.group === g || (!parts[k].t && group.length && k + 1 < parts.length && parts[k + 1].t?.group === g))) group.push(parts[k++]);
    const ts = group.filter((x) => x.t);
    const heardWords = [...new Set(group.filter((x) => x.h && x.state !== 'match').map((x) => x.h!.shown))];
    group.forEach((x) => x.h && seenHeard.add(x.h.group));
    const state: TokenState = ts.every((x) => x.state === 'match') ? 'match' : ts.every((x) => x.state === 'missing') ? 'missing' : 'different';
    tokens.push({ state, word: p.t.shown, heard: state === 'different' ? heardWords.join(' ') || undefined : undefined });
  }
  const targetTokens = tokens.filter((t) => t.state !== 'extra');
  const matched = targetTokens.filter((t) => t.state === 'match').length;
  return { tokens, matched, total: targetTokens.length, tips: tipsFor(tokens, targetTokens.map((t) => t.word.toLowerCase())) };
}

const SMALL = new Set(['a', 'an', 'the', 'to', 'of', 'at', 'on', 'in', 'is', 'am', 'are', 'it', 'and', 'for', 'you', 'me', 'i', 'so', 'up', 'be']);

function tipsFor(tokens: Token[], target: string[]): string[] {
  const tips: string[] = [];
  const missing = tokens.filter((t) => t.state === 'missing').map((t) => t.word.toLowerCase());
  const different = tokens.filter((t) => t.state === 'different');
  const extra = tokens.filter((t) => t.state === 'extra');
  if (!missing.length && !different.length && !extra.length) {
    tips.push('Tu navegador ha reconocido todas las palabras. Para afinar el ritmo y la entonación, escúchala otra vez y repítela imitando la melodía.');
    return tips;
  }
  if (missing.some((w) => SMALL.has(w.replace(/[^a-z]/g, ''))))
    tips.push('Faltan palabras cortas (como "to", "the" o "a"). En inglés se pronuncian rápido y suaves, pero no desaparecen: une la palabra corta a la siguiente.');
  if (missing.length && missing.length >= Math.ceil(target.length / 2)) tips.push('Se ha entendido menos de la mitad. Prueba más despacio, frase completa y sin pausas largas.');
  const contraction = different.find((t) => t.word.includes("'"));
  if (contraction) tips.push(`En "${contraction.word}" se ha perdido parte de la contracción. Pronuncia el final ("'m", "'ll", "'re", "'s") pegado a la palabra.`);
  const finals = different.filter((t) => t.heard && t.word && t.heard.slice(0, 3) === t.word.toLowerCase().slice(0, 3));
  if (finals.length) tips.push(`"${finals[0].word}" se ha entendido como "${finals[0].heard}". Marca bien el final de la palabra (las consonantes finales cuentan mucho en inglés).`);
  else if (different.length && !contraction) tips.push(`"${different[0].word}" se ha entendido como "${different[0].heard}". Escucha esa palabra en la voz de ejemplo y repítela sola antes de decir la frase entera.`);
  if (extra.length && !missing.length) tips.push('Se han reconocido palabras de más. Puede ser ruido de fondo o una muletilla: prueba en un sitio más tranquilo.');
  if (tips.length < 2) tips.push('Usa "Escuchar despacio" y repite justo después, como una sombra (shadowing).');
  return tips.slice(0, 3);
}

/** How well a free answer matches one of the choices (0..1), for conversations. */
export function similarity(a: string, b: string): number {
  const A = words(a).map((w) => w.norm);
  const B = words(b).map((w) => w.norm);
  if (!A.length || !B.length) return 0;
  const n = A.length;
  const m = B.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = close(A[i], B[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  return (2 * L[0][0]) / (n + m);
}
