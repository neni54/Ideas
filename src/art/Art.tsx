// Hand-drawn SVG art: mascot, hero, NPCs, bosses, pets, chests and icons.
import { CHARACTERS, PETS, SKINS } from '../data/meta';

type Mood = 'idle' | 'happy' | 'sad' | 'wow';

function Eyes({ cx1, cx2, cy, r = 3.2, mood = 'idle' }: { cx1: number; cx2: number; cy: number; r?: number; mood?: Mood }) {
  if (mood === 'happy')
    return (
      <g stroke="#2b2140" strokeWidth={2.6} strokeLinecap="round" fill="none">
        <path d={`M${cx1 - r} ${cy + 1} Q${cx1} ${cy - r - 1} ${cx1 + r} ${cy + 1}`} />
        <path d={`M${cx2 - r} ${cy + 1} Q${cx2} ${cy - r - 1} ${cx2 + r} ${cy + 1}`} />
      </g>
    );
  return (
    <g>
      <ellipse cx={cx1} cy={cy} rx={r} ry={mood === 'wow' ? r * 1.35 : r * 1.15} fill="#2b2140" />
      <ellipse cx={cx2} cy={cy} rx={r} ry={mood === 'wow' ? r * 1.35 : r * 1.15} fill="#2b2140" />
      <circle cx={cx1 + r * 0.35} cy={cy - r * 0.4} r={r * 0.38} fill="#fff" />
      <circle cx={cx2 + r * 0.35} cy={cy - r * 0.4} r={r * 0.38} fill="#fff" />
      {mood === 'sad' && (
        <g stroke="#2b2140" strokeWidth={2} strokeLinecap="round">
          <path d={`M${cx1 - r - 1} ${cy - r - 4} L${cx1 + r} ${cy - r - 2}`} />
          <path d={`M${cx2 + r + 1} ${cy - r - 4} L${cx2 - r} ${cy - r - 2}`} />
        </g>
      )}
    </g>
  );
}

function Mouth({ x, y, mood = 'idle', w = 6 }: { x: number; y: number; mood?: Mood; w?: number }) {
  if (mood === 'sad') return <path d={`M${x - w / 2} ${y + 2} Q${x} ${y - 2} ${x + w / 2} ${y + 2}`} stroke="#2b2140" strokeWidth={2.2} fill="none" strokeLinecap="round" />;
  if (mood === 'wow') return <ellipse cx={x} cy={y + 1} rx={w / 3} ry={w / 2.5} fill="#2b2140" />;
  if (mood === 'happy')
    return <path d={`M${x - w / 2} ${y - 1} Q${x} ${y + w * 0.9} ${x + w / 2} ${y - 1} Z`} fill="#2b2140" />;
  return <path d={`M${x - w / 2} ${y} Q${x} ${y + w / 2} ${x + w / 2} ${y}`} stroke="#2b2140" strokeWidth={2.2} fill="none" strokeLinecap="round" />;
}

/** Pip, the lantern spirit. */
export function Pip({ size = 96, mood = 'idle', className = '' }: { size?: number; mood?: Mood; className?: string }) {
  return (
    <svg viewBox="0 0 100 110" width={size} height={size * 1.1} className={`pip ${className}`} aria-label="Pip">
      <defs>
        <radialGradient id="pipGlow" cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor="#fff6c7" stopOpacity={0.95} />
          <stop offset="100%" stopColor="#ffcb47" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="pipBody" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff8d6" />
          <stop offset="55%" stopColor="#ffd666" />
          <stop offset="100%" stopColor="#ff9f1c" />
        </radialGradient>
        <linearGradient id="pipFlame" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="100%" stopColor="#ffb703" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="62" r="46" fill="url(#pipGlow)" className="pip-glow" />
      <path className="pip-flame" d="M50 6 C58 18 64 22 60 32 C57 40 43 40 40 32 C37 24 46 20 50 6 Z" fill="url(#pipFlame)" />
      <path d="M50 18 C54 24 56 27 54 32 C52 35 48 35 46 32 C44 28 48 25 50 18 Z" fill="#fff3b0" />
      <ellipse cx="50" cy="66" rx="32" ry="30" fill="url(#pipBody)" />
      <ellipse cx="38" cy="52" rx="9" ry="6" fill="#fff" opacity={0.55} transform="rotate(-25 38 52)" />
      <path d="M22 70 Q14 74 16 82" stroke="#ff9f1c" strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M78 70 Q86 74 84 82" stroke="#ff9f1c" strokeWidth={5} strokeLinecap="round" fill="none" />
      <Eyes cx1={40} cx2={60} cy={64} r={4} mood={mood} />
      <ellipse cx="32" cy="75" rx="5" ry="3" fill="#ff7a7a" opacity={0.55} />
      <ellipse cx="68" cy="75" rx="5" ry="3" fill="#ff7a7a" opacity={0.55} />
      <Mouth x={50} y={76} mood={mood} w={9} />
    </svg>
  );
}

/** The player's hero, coloured by the equipped cloak skin. */
export function Hero({ size = 80, skin = 'aurora', mood = 'idle' }: { size?: number; skin?: string; mood?: Mood }) {
  const k = SKINS.find((s) => s.id === skin) ?? SKINS[0];
  return (
    <svg viewBox="0 0 100 110" width={size} height={size * 1.1} aria-label="Héroe">
      <path d="M22 108 Q20 66 50 60 Q80 66 78 108 Z" fill={k.cloak} />
      <path d="M50 60 L38 108 M50 60 L62 108" stroke={k.trim} strokeWidth={3} opacity={0.6} />
      <path d="M30 64 Q50 78 70 64" stroke={k.trim} strokeWidth={5} fill="none" strokeLinecap="round" />
      <circle cx="50" cy="66" r="4.5" fill={k.trim} />
      <path d="M18 46 Q16 10 50 10 Q84 10 82 46 Q78 22 50 22 Q22 22 18 46 Z" fill={k.cloak} />
      <circle cx="50" cy="42" r="24" fill="#ffd9b8" />
      <path d="M27 38 Q30 18 50 18 Q72 18 74 38 Q66 28 56 30 Q48 24 40 31 Q32 30 27 38 Z" fill="#5b3a29" />
      <path d="M18 46 Q18 18 50 14 Q82 18 82 46 L76 44 Q74 22 50 20 Q26 22 24 44 Z" fill={k.cloak} />
      <Eyes cx1={41} cx2={59} cy={45} r={3.4} mood={mood} />
      <ellipse cx="34" cy="53" rx="4" ry="2.4" fill="#ff8a8a" opacity={0.5} />
      <ellipse cx="66" cy="53" rx="4" ry="2.4" fill="#ff8a8a" opacity={0.5} />
      <Mouth x={50} y={54} mood={mood} w={7} />
    </svg>
  );
}

interface NpcLook {
  skin: string;
  hair: string;
  outfit: string;
  extra?: JSX.Element;
}

const NPC_LOOKS: Record<string, NpcLook> = {
  olmo: {
    skin: '#e8c4a0',
    hair: '#f1f1f1',
    outfit: '#3f8f6f',
    extra: (
      <g>
        <path d="M20 44 Q18 8 50 6 Q82 8 80 44 Q72 18 50 18 Q28 18 20 44 Z" fill="#3f8f6f" />
        <circle cx="50" cy="10" r="5" fill="#a8e6cf" />
        <path d="M36 58 Q50 66 64 58" stroke="#fff" strokeWidth={2} fill="none" opacity={0.6} />
        <g stroke="#2b2140" strokeWidth={1.8} fill="none">
          <circle cx="41" cy="44" r="6.5" />
          <circle cx="59" cy="44" r="6.5" />
          <path d="M47.5 44 L52.5 44" />
        </g>
      </g>
    ),
  },
  mira: {
    skin: '#f3c7a5',
    hair: '#8b4a2b',
    outfit: '#ff6f91',
    extra: (
      <g>
        <circle cx="50" cy="13" r="10" fill="#8b4a2b" />
        <path d="M26 62 Q50 74 74 62 L72 70 Q50 82 28 70 Z" fill="#ffd166" />
        <circle cx="72" cy="24" r="4" fill="#ffd166" />
      </g>
    ),
  },
  bram: {
    skin: '#d9a07a',
    hair: '#3d2b1f',
    outfit: '#c8553d',
    extra: (
      <g>
        <path d="M30 50 Q32 74 50 76 Q68 74 70 50 Q62 60 50 60 Q38 60 30 50 Z" fill="#6b3e26" />
        <path d="M42 56 Q50 60 58 56" stroke="#3d2b1f" strokeWidth={3} fill="none" />
        <rect x="34" y="80" width="32" height="30" rx="4" fill="#8d6e63" />
      </g>
    ),
  },
  tito: {
    skin: '#f0c095',
    hair: '#2f2f2f',
    outfit: '#2f80ed',
    extra: (
      <g>
        <path d="M18 30 Q50 2 82 30 L88 34 Q50 26 12 34 Z" fill="#f2c94c" />
        <path d="M28 30 Q50 10 72 30 Z" fill="#f2c94c" />
        <path d="M30 26 L70 26" stroke="#2f80ed" strokeWidth={4} />
      </g>
    ),
  },
  luna: {
    skin: '#f6d1b1',
    hair: '#4b2e83',
    outfit: '#7b61ff',
    extra: (
      <g>
        <path d="M24 42 Q20 82 34 92 L30 50 Z M76 42 Q80 82 66 92 L70 50 Z" fill="#4b2e83" />
        <rect x="27" y="22" width="46" height="9" rx="4.5" fill="#3a3a52" />
        <circle cx="40" cy="26" r="6" fill="#9ad7ff" stroke="#3a3a52" strokeWidth={2.5} />
        <circle cx="60" cy="26" r="6" fill="#9ad7ff" stroke="#3a3a52" strokeWidth={2.5} />
      </g>
    ),
  },
};

export function Npc({ id, size = 80, mood = 'idle' }: { id: string; size?: number; mood?: Mood }) {
  if (id === 'pip') return <Pip size={size} mood={mood} />;
  if (id === 'grumble') return <Grumble size={size} mood={mood} />;
  if (id === 'morvena') return <Morvena size={size} mood={mood} />;
  const look = NPC_LOOKS[id] ?? NPC_LOOKS.olmo;
  return (
    <svg viewBox="0 0 100 110" width={size} height={size * 1.1} aria-label={CHARACTERS[id]?.name}>
      <path d="M20 110 Q20 70 50 66 Q80 70 80 110 Z" fill={look.outfit} />
      <circle cx="50" cy="44" r="24" fill={look.skin} />
      <path d="M26 42 Q26 18 50 18 Q74 18 74 42 Q66 30 50 30 Q34 30 26 42 Z" fill={look.hair} />
      {look.extra}
      <Eyes cx1={41} cx2={59} cy={44} r={3.2} mood={mood} />
      <ellipse cx="34" cy="52" rx="4" ry="2.4" fill="#ff8a8a" opacity={0.45} />
      <ellipse cx="66" cy="52" rx="4" ry="2.4" fill="#ff8a8a" opacity={0.45} />
      {id !== 'bram' && <Mouth x={50} y={55} mood={mood} w={7} />}
    </svg>
  );
}

export function Grumble({ size = 160, mood = 'idle' }: { size?: number; mood?: Mood }) {
  return (
    <svg viewBox="0 0 160 160" width={size} height={size} aria-label="Gruñón">
      <defs>
        <radialGradient id="trollSkin" cx="45%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#9fc28f" />
          <stop offset="100%" stopColor="#4f6f49" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="150" rx="60" ry="8" fill="#000" opacity={0.2} />
      <path d="M30 150 Q22 90 80 82 Q138 90 130 150 Z" fill="#6d4c41" />
      <path d="M50 90 L80 150 L110 90" fill="#8d6e63" />
      <path d="M38 50 L22 18 L52 38 Z M122 50 L138 18 L108 38 Z" fill="#e6dcc3" />
      <ellipse cx="80" cy="60" rx="48" ry="40" fill="url(#trollSkin)" />
      <ellipse cx="80" cy="70" rx="14" ry="10" fill="#6f8f6a" />
      <g fill="#fff">
        <circle cx="62" cy="52" r="10" />
        <circle cx="98" cy="52" r="10" />
      </g>
      <g fill={mood === 'sad' ? '#2b2140' : '#ff4d4d'}>
        <circle cx="64" cy="54" r="4.5" />
        <circle cx="96" cy="54" r="4.5" />
      </g>
      <path d={mood === 'sad' ? 'M50 40 L74 46 M110 40 L86 46' : 'M50 44 L74 38 M110 44 L86 38'} stroke="#2b3a28" strokeWidth={5} strokeLinecap="round" />
      <path d={mood === 'sad' ? 'M60 92 Q80 82 100 92' : 'M58 84 Q80 96 102 84'} stroke="#2b3a28" strokeWidth={4} fill="#3a2a2a" />
      <path d="M66 86 L70 78 L74 87 M86 87 L90 78 L94 86" fill="#fff" />
    </svg>
  );
}

export function Morvena({ size = 160, mood = 'idle' }: { size?: number; mood?: Mood }) {
  return (
    <svg viewBox="0 0 160 160" width={size} height={size} aria-label="Morvena">
      <defs>
        <linearGradient id="morvRobe" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6a4bc4" />
          <stop offset="100%" stopColor="#2b1d5c" />
        </linearGradient>
        <radialGradient id="mist" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c9b8ff" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#c9b8ff" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx="80" cy="85" r="76" fill="url(#mist)" className="pip-glow" />
      <path d="M28 156 Q34 96 80 84 Q126 96 132 156 Q118 146 106 156 Q94 146 80 156 Q66 146 54 156 Q42 146 28 156 Z" fill="url(#morvRobe)" />
      <path d="M40 40 Q34 96 50 120 L56 60 Z M120 40 Q126 96 110 120 L104 60 Z" fill="#d9d4ff" />
      <circle cx="80" cy="60" r="28" fill="#e3dcff" />
      <path d="M52 56 Q54 28 80 28 Q106 28 108 56 Q96 40 80 42 Q64 40 52 56 Z" fill="#d9d4ff" />
      <path d="M58 30 L62 12 L70 24 L80 6 L90 24 L98 12 L102 30 Z" fill="#ffd166" stroke="#e0a800" strokeWidth={2} />
      <circle cx="80" cy="20" r="3.5" fill="#ef476f" />
      <g fill={mood === 'sad' || mood === 'happy' ? '#2b2140' : '#7b2cbf'}>
        <path d="M64 60 Q70 54 76 60 Q70 64 64 60 Z" />
        <path d="M84 60 Q90 54 96 60 Q90 64 84 60 Z" />
      </g>
      <path d={mood === 'happy' ? 'M70 74 Q80 82 90 74' : 'M70 76 Q80 72 90 76'} stroke="#7b2cbf" strokeWidth={3} fill="none" strokeLinecap="round" />
      <circle cx="80" cy="100" r="7" fill="#b69cff" stroke="#ffd166" strokeWidth={2} />
    </svg>
  );
}

export function PetArt({ id, size = 64 }: { id: string; size?: number }) {
  const p = PETS.find((x) => x.id === id) ?? PETS[0];
  if (p.id === 'pip') return <Pip size={size} mood="happy" />;
  if (p.id === 'brasa')
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} aria-label={p.name}>
        <path d="M70 70 Q96 60 90 30 Q84 56 66 58 Z" fill={p.accent} />
        <ellipse cx="50" cy="70" rx="24" ry="20" fill={p.color} />
        <path d="M26 30 L34 6 L46 28 Z M74 30 L66 6 L54 28 Z" fill={p.color} />
        <path d="M31 24 L34 12 L40 24 Z M69 24 L66 12 L60 24 Z" fill="#ffd6c2" />
        <ellipse cx="50" cy="44" rx="26" ry="22" fill={p.color} />
        <path d="M30 50 Q50 72 70 50 Q60 58 50 58 Q40 58 30 50 Z" fill="#fff3e6" />
        <Eyes cx1={41} cx2={59} cy={42} r={3} />
        <ellipse cx="50" cy="52" rx="3.5" ry="2.5" fill="#2b2140" />
      </svg>
    );
  if (p.id === 'nimbo')
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} aria-label={p.name}>
        <path d="M18 66 Q8 56 18 46 Q16 30 34 30 Q40 14 58 20 Q76 14 80 32 Q96 36 88 54 Q96 70 78 74 L24 74 Q12 74 18 66 Z" fill="#e9f6ff" />
        <ellipse cx="50" cy="58" rx="26" ry="24" fill={p.color} />
        <path d="M30 40 L26 26 L40 36 Z M70 40 L74 26 L60 36 Z" fill={p.color} />
        <circle cx="40" cy="52" r="9" fill="#fff" />
        <circle cx="60" cy="52" r="9" fill="#fff" />
        <circle cx="40" cy="53" r="4.5" fill="#2b2140" />
        <circle cx="60" cy="53" r="4.5" fill="#2b2140" />
        <path d="M46 62 L50 68 L54 62 Z" fill="#ffb703" />
      </svg>
    );
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-label={p.name}>
      <ellipse cx="78" cy="62" rx="12" ry="10" fill="#b5e3b5" />
      <path d="M18 72 Q20 32 52 30 Q84 32 84 72 Z" fill={p.accent} />
      <path d="M30 70 Q34 44 52 42 Q70 44 74 70" stroke={p.color} strokeWidth={4} fill="none" />
      <path d="M52 30 L52 72 M34 50 L70 50" stroke={p.color} strokeWidth={3} />
      <circle cx="84" cy="58" r="12" fill="#b5e3b5" />
      <circle cx="87" cy="55" r="2.5" fill="#2b2140" />
      <ellipse cx="26" cy="76" rx="7" ry="4" fill="#b5e3b5" />
      <ellipse cx="72" cy="76" rx="7" ry="4" fill="#b5e3b5" />
    </svg>
  );
}

export function ChestArt({ size = 120, open = false, tier = 'rare' }: { size?: number; open?: boolean; tier?: 'common' | 'rare' | 'epic' }) {
  const body = tier === 'epic' ? '#7b2cbf' : tier === 'rare' ? '#c0713a' : '#a0704a';
  const metal = tier === 'epic' ? '#ffd166' : '#f4c542';
  return (
    <svg viewBox="0 0 120 110" width={size} height={size * 0.92} aria-label="Cofre">
      <ellipse cx="60" cy="104" rx="46" ry="6" fill="#000" opacity={0.2} />
      {open && (
        <g className="chest-rays">
          {Array.from({ length: 10 }).map((_, i) => (
            <path key={i} d="M60 50 L54 -20 L66 -20 Z" fill="#fff6c7" opacity={0.5} transform={`rotate(${i * 36} 60 50)`} />
          ))}
          <circle cx="60" cy="52" r="22" fill="#fff6c7" opacity={0.9} />
        </g>
      )}
      <rect x="16" y="52" width="88" height="48" rx="8" fill={body} />
      <rect x="16" y="52" width="88" height="10" fill="#000" opacity={0.12} />
      <rect x="28" y="52" width="8" height="48" fill={metal} />
      <rect x="84" y="52" width="8" height="48" fill={metal} />
      <g style={{ transformOrigin: '60px 52px', transform: open ? 'rotate(-28deg) translateY(-10px)' : 'none', transition: 'transform .45s cubic-bezier(.3,1.6,.5,1)' }}>
        <path d="M16 54 Q16 24 60 22 Q104 24 104 54 Z" fill={body} />
        <path d="M28 52 Q28 28 36 25 L36 52 Z M84 52 L84 25 Q92 28 92 52 Z" fill={metal} />
        <path d="M16 54 Q16 24 60 22 Q104 24 104 54" stroke="#000" strokeOpacity={0.15} strokeWidth={3} fill="none" />
      </g>
      <rect x="50" y="56" width="20" height="20" rx="4" fill={metal} />
      <circle cx="60" cy="64" r="3.5" fill="#3a2a1a" />
      <rect x="58.5" y="65" width="3" height="6" fill="#3a2a1a" />
    </svg>
  );
}

export const CoinIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
    <circle cx="12" cy="12" r="11" fill="#f4b400" />
    <circle cx="12" cy="12" r="8" fill="#ffd54f" stroke="#f4b400" strokeWidth={1.5} />
    <path d="M12 7.5 L13.4 10.6 L16.6 11 L14.2 13.1 L14.9 16.3 L12 14.6 L9.1 16.3 L9.8 13.1 L7.4 11 L10.6 10.6 Z" fill="#f4b400" />
  </svg>
);

export const XpIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
    <path d="M12 1 L21 6.5 V17.5 L12 23 L3 17.5 V6.5 Z" fill="#7b61ff" />
    <path d="M12 4 L18.5 8 V16 L12 20 L5.5 16 V8 Z" fill="#a594ff" />
    <text x="12" y="15.5" textAnchor="middle" fontSize="8" fontWeight="900" fill="#fff" fontFamily="Fredoka, sans-serif">XP</text>
  </svg>
);

export const FlameIcon = ({ size = 22, lit = true }: { size?: number; lit?: boolean }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
    <path d="M12 1 C14 6 19 8 19 14 A7 7 0 0 1 5 14 C5 10 8 9 8 5 C10 7 11 8 12 1 Z" fill={lit ? '#ff7b00' : '#b9b4c7'} />
    <path d="M12 10 C13 13 16 14 16 17 A4 4 0 0 1 8 17 C8 15 10 14 12 10 Z" fill={lit ? '#ffd166' : '#dcd8e6'} />
  </svg>
);

export const StarIcon = ({ size = 22, filled = true }: { size?: number; filled?: boolean }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
    <path
      d="M12 1.8 L15.1 8.2 L22 9.1 L16.9 13.9 L18.2 20.8 L12 17.4 L5.8 20.8 L7.1 13.9 L2 9.1 L8.9 8.2 Z"
      fill={filled ? '#ffc93c' : '#d9d4e7'}
      stroke={filled ? '#f29e00' : '#c4bdd8'}
      strokeWidth={1.4}
      strokeLinejoin="round"
    />
  </svg>
);

export const HeartIcon = ({ size = 22, filled = true }: { size?: number; filled?: boolean }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
    <path d="M12 21 C4 15 1 11 3.5 6.5 C5.5 3 10 3.5 12 7 C14 3.5 18.5 3 20.5 6.5 C23 11 20 15 12 21 Z" fill={filled ? '#ff4d6d' : '#d9d4e7'} />
    {filled && <ellipse cx="8" cy="8" rx="2.4" ry="1.6" fill="#fff" opacity={0.6} transform="rotate(-30 8 8)" />}
  </svg>
);
