import { MISSION_POOL, type MissionKind } from '../data/meta';
import { seeded, shuffle } from './date';

export interface MissionState {
  id: string;
  kind: MissionKind;
  target: number;
  text: string;
  reward: number;
  progress: number;
  claimed: boolean;
}

export function dailyMissions(day: string): MissionState[] {
  const rand = seeded('lumora-' + day);
  const picked: MissionState[] = [];
  const kinds = new Set<MissionKind>();
  for (const m of shuffle(MISSION_POOL, rand)) {
    if (kinds.has(m.kind)) continue;
    kinds.add(m.kind);
    picked.push({ ...m, progress: 0, claimed: false });
    if (picked.length === 3) break;
  }
  return picked;
}
