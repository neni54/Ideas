// Compares what a speech recogniser heard with the target phrase, word by word.
const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "he's": 'he is', "she's": 'she is', "it's": 'it is', "that's": 'that is',
  "what's": 'what is', "there's": 'there is', "i'll": 'i will', "you'll": 'you will', "we'll": 'we will', "it'll": 'it will', "i've": 'i have', "you've": 'you have',
  "we've": 'we have', "i'd": 'i would', "you'd": 'you would', "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'can not', "cannot": 'can not',
  "won't": 'will not', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not', "couldn't": 'could not', "wouldn't": 'would not',
  "shouldn't": 'should not',
  // Recognisers sometimes drop the apostrophe. Only forms that are not real words on their own.
  im: 'i am', ive: 'i have', youre: 'you are', theyre: 'they are', dont: 'do not', doesnt: 'does not', didnt: 'did not', cant: 'can not',
  isnt: 'is not', arent: 'are not', wasnt: 'was not', couldnt: 'could not', wouldnt: 'would not', thats: 'that is', whats: 'what is', lets: 'let us', "let's": 'let us', "could've": 'could have', "should've": 'should have', "wanna": 'want to', "gonna": 'going to', "gotta": 'got to',
};

export function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => (CONTRACTIONS[w] ?? w).split(' '))
    .map((w) => w.replace(/^'+|'+$/g, ''));
}

/** Longest-common-subsequence alignment: which target words were recognised. */
export function compare(target: string, heard: string) {
  const t = words(target);
  const h = words(heard);
  const dp = Array.from({ length: t.length + 1 }, () => new Array<number>(h.length + 1).fill(0));
  for (let i = t.length - 1; i >= 0; i--) for (let j = h.length - 1; j >= 0; j--) dp[i][j] = t[i] === h[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ok = new Array<boolean>(t.length).fill(false);
  const usedH = new Array<boolean>(h.length).fill(false);
  for (let i = 0, j = 0; i < t.length && j < h.length; ) {
    if (t[i] === h[j]) {
      ok[i] = true;
      usedH[j] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const matched = ok.filter(Boolean).length;
  return { target: t.map((w, i) => ({ w, ok: ok[i] })), extra: h.filter((_, j) => !usedH[j]), score: t.length ? matched / t.length : 0 };
}

