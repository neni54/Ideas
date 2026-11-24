// Small level chip (A1, A1–A2, A2–B1, B1–B2, B2–C1) shown in every mode.
import { LEVEL_BY_TIER, tierOf } from '../data/levels';
import type { Cefr, Tier } from '../data/types';

export function LevelTag({ item, tier, full = false }: { item?: { id?: string; level: Cefr; tier?: Tier }; tier?: Tier; full?: boolean }) {
  const t = tier ?? (item ? tierOf(item) : 1);
  const l = LEVEL_BY_TIER[t];
  return (
    <span className={`lvl lvl-t${t}`} title={`${l.name} · ${l.range}`}>
      {full ? `${l.name} · ${l.range}` : l.range}
    </span>
  );
}
