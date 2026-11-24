// THE BADGE SHOP · AMERICA COLLECTION. Original SVG artwork (no external images).
// Collectibles only: they give no XP, no advantage in games and are not profile achievements.
import type { ReactNode } from 'react';

export interface BadgeDef {
  id: string;
  no: number;
  name: string;
  /** What it shows (Spanish). */
  subject: string;
  /** One-line note for the detail view (Spanish). */
  blurb: string;
  shape: 'shield' | 'circle' | 'arch';
  finish: 'patch' | 'pin';
}

export const BADGES: BadgeDef[] = [
  { id: 'new-york', no: 1, name: 'NEW YORK', subject: 'La Estatua de la Libertad', blurb: 'La antorcha que daba la bienvenida a quien llegaba por mar a Nueva York.', shape: 'shield', finish: 'patch' },
  { id: 'san-francisco', no: 2, name: 'SAN FRANCISCO', subject: 'El Golden Gate', blurb: 'El puente colgante más fotografiado del mundo, entre la niebla de la bahía.', shape: 'circle', finish: 'pin' },
  { id: 'route-66', no: 3, name: 'ROUTE 66', subject: 'La carretera americana', blurb: 'De Chicago a Santa Mónica: la Mother Road de los viajes por carretera.', shape: 'arch', finish: 'patch' },
  { id: 'grand-canyon', no: 4, name: 'GRAND CANYON', subject: 'El Gran Cañón', blurb: 'Capas de roca de casi dos mil millones de años, talladas por el río Colorado.', shape: 'shield', finish: 'pin' },
  { id: 'nyc-taxi', no: 5, name: 'NYC TAXI', subject: 'El taxi amarillo', blurb: 'El yellow cab: levantar la mano en la esquina y "Where to?".', shape: 'circle', finish: 'patch' },
  { id: 'american-diner', no: 6, name: 'AMERICAN DINER', subject: 'Café y diner', blurb: 'Café rellenado sin pedirlo, tarta del día y una camarera que te llama "hon".', shape: 'arch', finish: 'pin' },
  { id: 'hollywood', no: 7, name: 'HOLLYWOOD', subject: 'El cartel de Hollywood', blurb: 'Nueve letras blancas sobre las colinas de Los Ángeles.', shape: 'shield', finish: 'patch' },
  { id: 'las-vegas', no: 8, name: 'LAS VEGAS', subject: 'Las luces de Las Vegas', blurb: 'El cartel de bienvenida, las bombillas y una noche que nunca termina.', shape: 'circle', finish: 'pin' },
  { id: 'brooklyn', no: 9, name: 'BROOKLYN', subject: 'El puente de Brooklyn', blurb: 'Arcos góticos de piedra y una telaraña de cables sobre el East River.', shape: 'arch', finish: 'patch' },
  { id: 'american-baseball', no: 10, name: 'AMERICAN BASEBALL', subject: 'El béisbol americano', blurb: 'Bate, pelota de costuras rojas y "Take me out to the ball game".', shape: 'shield', finish: 'pin' },
];
export const BADGE_BY_ID: Record<string, BadgeDef> = Object.fromEntries(BADGES.map((b) => [b.id, b]));

/* ───── palette ───── */
const C = {
  ch: '#1a1815',
  ch2: '#26221d',
  cream: '#ece3d1',
  cream2: '#d8ccb4',
  wine: '#8e2c3a',
  wine2: '#b8475a',
  gold: '#b89660',
  goldD: '#7a6240',
  goldL: '#dcc390',
};
const S = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

/* ───── illustrations (drawn in a 120 × 120 box) ───── */
const ART: Record<string, ReactNode> = {
  'new-york': (
    <>
      <circle cx="60" cy="58" r="44" fill={C.wine} opacity=".22" />
      {/* torch flame + cup */}
      <path d="M84 6c6 6 6 13 0 17c-6-4-6-11 0-17z" fill={C.goldL} />
      <path d="M84 11c2.5 3 2.5 7 0 9c-2.5-2-2.5-6 0-9z" fill={C.wine2} />
      <path d="M78 23h12l-3 7h-6z" fill={C.gold} />
      {/* raised arm */}
      <path d="M68 66L82 31" stroke={C.cream} strokeWidth="7" {...S} />
      {/* crown rays */}
      {[-160, -135, -110, -90, -70, -45, -20].map((a) => (
        <path key={a} d={`M${60 + 9 * Math.cos((a * Math.PI) / 180)} ${50 + 9 * Math.sin((a * Math.PI) / 180)}L${60 + 19 * Math.cos((a * Math.PI) / 180)} ${50 + 19 * Math.sin((a * Math.PI) / 180)}`} stroke={C.gold} strokeWidth="3.2" {...S} />
      ))}
      <path d="M49 49q11-7 22 0" stroke={C.goldL} strokeWidth="3" {...S} />
      {/* head */}
      <circle cx="60" cy="57" r="8.5" fill={C.cream} />
      {/* robe */}
      <path d="M45 112l5-42q10-8 20 0l6 42z" fill={C.cream} />
      <path d="M53 76l-2 34M60 74v38M67 76l3 34" stroke={C.cream2} strokeWidth="1.6" {...S} />
      {/* tablet */}
      <path d="M42 80l10-3l3 17l-10 3z" fill={C.gold} />
      {/* pedestal */}
      <path d="M38 112h44l-4 8h-36z" fill={C.goldD} />
    </>
  ),
  'san-francisco': (
    <>
      <circle cx="60" cy="72" r="26" fill={C.gold} opacity=".28" />
      {/* water */}
      <path d="M4 100q8-4 16 0t16 0t16 0t16 0t16 0t16 0t16 0M10 110q8-4 16 0t16 0t16 0t16 0t16 0t16 0" stroke={C.cream} strokeWidth="2" opacity=".55" {...S} />
      {/* cables */}
      <path d="M0 64Q20 50 33 18Q60 66 87 18Q100 50 120 64" stroke={C.goldL} strokeWidth="2.6" {...S} />
      {[44, 52, 60, 68, 76].map((x) => (
        <path key={x} d={`M${x} ${x === 60 ? 42 : x === 52 || x === 68 ? 38 : 30}V82`} stroke={C.goldL} strokeWidth="1.1" opacity=".8" />
      ))}
      {[12, 20, 100, 108].map((x) => (
        <path key={x} d={`M${x} ${x < 60 ? 58 - (x - 4) * 1.1 : 58 - (116 - x) * 1.1}V82`} stroke={C.goldL} strokeWidth="1.1" opacity=".8" />
      ))}
      {/* towers */}
      {[29, 83].map((x) => (
        <g key={x} fill={C.wine2}>
          <rect x={x} y="14" width="4" height="82" />
          <rect x={x + 6} y="14" width="4" height="82" />
          <rect x={x - 1} y="22" width="12" height="3" />
          <rect x={x - 1} y="40" width="12" height="3" />
          <rect x={x - 1} y="58" width="12" height="3" />
        </g>
      ))}
      {/* deck */}
      <path d="M0 82h120" stroke={C.wine} strokeWidth="6" />
      <path d="M0 80h120" stroke={C.wine2} strokeWidth="1.5" />
    </>
  ),
  'route-66': (
    <>
      {/* desert horizon */}
      <path d="M0 76h120" stroke={C.gold} strokeWidth="1.5" opacity=".6" />
      <path d="M6 76l12-14l8 8l10-10l12 16" fill={C.wine} opacity=".55" />
      <path d="M78 76l14-18l10 10l8-6l10 14" fill={C.wine} opacity=".55" />
      {/* road in perspective */}
      <path d="M52 76h16l34 44H18z" fill={C.ch2} />
      <path d="M60 80v6M60 92v9M60 107v12" stroke={C.goldL} strokeWidth="3" {...S} />
      <path d="M52 76L18 120M68 76l34 44" stroke={C.cream} strokeWidth="1.6" opacity=".7" />
      {/* US route shield */}
      <path d="M60 6c6 4 14 3 18 0l4 6c-2 4-2 9 0 13c6 12 3 28-22 40c-25-12-28-28-22-40c2-4 2-9 0-13l4-6c4 3 12 4 18 0z" fill={C.cream} stroke={C.ch} strokeWidth="2.5" />
      <text x="60" y="27" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="8" fontWeight="700" fill={C.ch} letterSpacing="1.5">
        ROUTE
      </text>
      <text x="60" y="54" textAnchor="middle" fontFamily="'Anton', 'Impact', sans-serif" fontSize="27" fill={C.ch}>
        66
      </text>
    </>
  ),
  'grand-canyon': (
    <>
      {/* sun */}
      <circle cx="84" cy="30" r="13" fill={C.goldL} />
      <path d="M62 30h-6M84 8V3M100 14l4-4M106 30h6" stroke={C.goldL} strokeWidth="2" {...S} />
      {/* strata, back to front */}
      <path d="M0 58l14-6h18l6-8h22l8 10h16l10-6h26v30H0z" fill={C.goldD} />
      <path d="M0 74l10-6h24l8-10h14l10 12h22l6-6h26v26H0z" fill={C.wine} />
      <path d="M0 64h34M68 70h52" stroke={C.goldL} strokeWidth="1.2" opacity=".55" />
      <path d="M0 90l18-8h16l10-10h20l8 12h20l12-6h16v38H0z" fill={C.gold} />
      <path d="M0 98h44M72 96h48M10 106h30M80 104h30" stroke={C.goldD} strokeWidth="1.4" opacity=".7" />
      {/* river */}
      <path d="M44 120c8-10 22-6 26-16s14-8 20-6" stroke={C.cream} strokeWidth="3.5" {...S} />
    </>
  ),
  'nyc-taxi': (
    <>
      {/* skyline */}
      <path d="M6 60V34h12v10h8V22h10v38M84 60V28h10v-8h6v8h8v32" fill={C.wine} opacity=".45" />
      {/* roof sign */}
      <rect x="44" y="30" width="32" height="12" rx="3" fill={C.cream} />
      <text x="60" y="39.5" textAnchor="middle" fontFamily="'Anton', 'Impact', sans-serif" fontSize="10" letterSpacing="1.5" fill={C.ch}>
        TAXI
      </text>
      {/* cab body */}
      <path d="M30 60l8-14h44l8 14z" fill={C.goldL} />
      <path d="M38 58l6-10h32l6 10z" fill={C.ch2} />
      <path d="M60 48v10" stroke={C.goldL} strokeWidth="2" />
      <rect x="16" y="58" width="88" height="30" rx="7" fill={C.goldL} />
      {/* checker band */}
      {Array.from({ length: 11 }, (_, i) => (
        <rect key={i} x={16 + i * 8} y={i % 2 ? 72 : 76} width="8" height="4" fill={C.ch} />
      ))}
      {/* lights & grille */}
      <circle cx="28" cy="66" r="5" fill={C.cream} />
      <circle cx="92" cy="66" r="5" fill={C.cream} />
      <rect x="44" y="62" width="32" height="8" rx="2" fill={C.goldD} />
      <path d="M50 62v8M56 62v8M62 62v8M68 62v8" stroke={C.goldL} strokeWidth="1" />
      {/* wheels */}
      <rect x="20" y="86" width="16" height="12" rx="3" fill={C.ch} />
      <rect x="84" y="86" width="16" height="12" rx="3" fill={C.ch} />
      <path d="M10 104h100" stroke={C.cream} strokeWidth="1.5" opacity=".5" />
    </>
  ),
  'american-diner': (
    <>
      {/* neon EAT sign */}
      <rect x="18" y="8" width="44" height="22" rx="11" fill="none" stroke={C.wine2} strokeWidth="3" />
      <text x="40" y="25" textAnchor="middle" fontFamily="'Anton', 'Impact', sans-serif" fontSize="14" letterSpacing="3" fill={C.cream}>
        EAT
      </text>
      <path d="M40 30v8" stroke={C.wine2} strokeWidth="2" />
      {/* steam */}
      <path d="M58 42c-6-6 6-10 0-16M70 44c-6-6 6-10 0-16M82 42c-6-6 6-10 0-16" stroke={C.goldL} strokeWidth="2.4" {...S} />
      {/* mug + saucer */}
      <path d="M44 52h52l-5 40q-1 6-7 6H56q-6 0-7-6z" fill={C.cream} />
      <path d="M46 62h48" stroke={C.wine} strokeWidth="7" />
      <path d="M96 60c14 0 14 22 -4 24" stroke={C.cream} strokeWidth="6" {...S} />
      <ellipse cx="70" cy="101" rx="40" ry="6" fill={C.gold} />
      <ellipse cx="70" cy="99" rx="30" ry="3" fill={C.goldL} />
      {/* checker floor */}
      {Array.from({ length: 15 }, (_, i) => (
        <rect key={i} x={i * 8} y={i % 2 ? 110 : 114} width="8" height="4" fill={C.cream} opacity=".8" />
      ))}
    </>
  ),
  hollywood: (
    <>
      {/* spotlights */}
      <path d="M20 120L6 8l18 2zM100 120l14-112l-18 2z" fill={C.goldL} opacity=".18" />
      {[[22, 18], [96, 24], [60, 12], [40, 30], [82, 8]].map(([x, y]) => (
        <path key={`${x}${y}`} d={`M${x} ${y - 4}l1.2 2.8l3 .2l-2.3 2l.8 3l-2.7-1.6l-2.7 1.6l.8-3l-2.3-2l3-.2z`} fill={C.goldL} />
      ))}
      {/* hills */}
      <path d="M0 96c20-26 40-44 64-46c22-2 40 14 56 30v40H0z" fill={C.wine} />
      <path d="M0 112c26-14 52-18 78-10c16 5 30 4 42 0v18H0z" fill={C.ch2} />
      {/* the sign */}
      {'HOLLYWOOD'.split('').map((ch, i) => (
        <text key={i} x={17 + i * 10.8} y={84 - i * 1.6} fontFamily="'Anton', 'Impact', sans-serif" fontSize="15" fill={C.cream} textAnchor="middle">
          {ch}
        </text>
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${14 + i * 10.8} ${85 - i * 1.6}v5M${20 + i * 10.8} ${85 - i * 1.6}v5`} stroke={C.cream2} strokeWidth=".8" />
      ))}
    </>
  ),
  'las-vegas': (
    <>
      {/* sign: elongated diamond with marquee bulbs */}
      <path d="M60 10L108 52L60 94L12 52z" fill={C.cream} stroke={C.gold} strokeWidth="3" strokeLinejoin="round" />
      {Array.from({ length: 24 }, (_, i) => {
        const t = i / 24;
        const pts = [[60, 10], [108, 52], [60, 94], [12, 52]];
        const seg = Math.floor(t * 4);
        const f = t * 4 - seg;
        const [a, b] = [pts[seg], pts[(seg + 1) % 4]];
        return <circle key={i} cx={a[0] + (b[0] - a[0]) * f} cy={a[1] + (b[1] - a[1]) * f} r="2" fill={i % 2 ? C.goldL : C.wine2} />;
      })}
      <text x="60" y="44" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="7" fontWeight="700" letterSpacing="1" fill={C.wine}>
        WELCOME TO
      </text>
      <text x="60" y="64" textAnchor="middle" fontFamily="'Anton', 'Impact', sans-serif" fontSize="20" letterSpacing="1.5" fill={C.ch}>
        VEGAS
      </text>
      {/* star on top */}
      <path d="M60 -2l3.5 7.5l8 1l-6 5.5l1.6 8l-7.1-4l-7.1 4l1.6-8l-6-5.5l8-1z" fill={C.wine2} stroke={C.goldL} strokeWidth="1" />
      {/* pole and dice */}
      <path d="M56 94h8v20h-8z" fill={C.gold} />
      <rect x="14" y="98" width="16" height="16" rx="3" fill={C.wine2} transform="rotate(-12 22 106)" />
      <circle cx="19" cy="103" r="1.6" fill={C.cream} />
      <circle cx="25" cy="109" r="1.6" fill={C.cream} />
      <rect x="90" y="98" width="16" height="16" rx="3" fill={C.cream} transform="rotate(10 98 106)" />
      <circle cx="98" cy="106" r="1.6" fill={C.ch} />
      <circle cx="94" cy="102" r="1.6" fill={C.ch} />
      <circle cx="102" cy="110" r="1.6" fill={C.ch} />
    </>
  ),
  brooklyn: (
    <>
      {/* fanning cables */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={`l${i}`} d={`M44 22L${2 + i * 7} ${70 + i * 1}`} stroke={C.goldL} strokeWidth="1.1" opacity=".85" />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={`r${i}`} d={`M76 22L${118 - i * 7} ${70 + i * 1}`} stroke={C.goldL} strokeWidth="1.1" opacity=".85" />
      ))}
      <path d="M0 40Q24 66 40 22M80 22Q96 66 120 40" stroke={C.gold} strokeWidth="2.4" {...S} />
      {/* stone tower with two gothic arches */}
      <path d="M34 112V20h52v92z" fill={C.cream2} />
      <path d="M34 20h52v6H34z" fill={C.cream} />
      <path d="M40 34h40M40 40h40" stroke={C.goldD} strokeWidth="1" opacity=".6" />
      <path d="M41 112V62q0-14 8-20q8 6 8 20v50zM63 112V62q0-14 8-20q8 6 8 20v50z" fill={C.ch} />
      {/* deck */}
      <path d="M0 74h120" stroke={C.wine} strokeWidth="5" />
      {/* river */}
      <path d="M0 116q10-4 20 0t20 0t20 0t20 0t20 0t20 0" stroke={C.cream} strokeWidth="2" opacity=".55" {...S} />
    </>
  ),
  'american-baseball': (
    <>
      {/* crossed bats */}
      <path d="M14 104L98 16" stroke={C.gold} strokeWidth="9" {...S} />
      <path d="M14 104L28 90" stroke={C.goldD} strokeWidth="5" {...S} />
      <path d="M106 104L22 16" stroke={C.gold} strokeWidth="9" {...S} />
      <path d="M106 104L92 90" stroke={C.goldD} strokeWidth="5" {...S} />
      <circle cx="11" cy="107" r="5" fill={C.goldD} />
      <circle cx="109" cy="107" r="5" fill={C.goldD} />
      {/* ball */}
      <circle cx="60" cy="58" r="30" fill={C.cream} stroke={C.cream2} strokeWidth="1.5" />
      <path d="M42 34c10 14 10 34 0 48M78 34c-10 14-10 34 0 48" stroke={C.wine2} strokeWidth="2" {...S} />
      {Array.from({ length: 8 }, (_, i) => {
        const y = 38 + i * 5.3;
        const xl = 42 + Math.sin(((i + 0.5) / 8) * Math.PI) * 7;
        const xr = 78 - Math.sin(((i + 0.5) / 8) * Math.PI) * 7;
        return (
          <g key={i} stroke={C.wine2} strokeWidth="1.4" strokeLinecap="round">
            <path d={`M${xl - 3} ${y - 1.5}l6 3`} />
            <path d={`M${xr + 3} ${y - 1.5}l-6 3`} />
          </g>
        );
      })}
      {/* home plate */}
      <path d="M50 98h20v8l-10 8l-10-8z" fill={C.cream} />
    </>
  ),
};

/* ───── base shapes (viewBox 0 0 200 232) ───── */
const SHAPES = {
  shield: (k = 0) => `M100 ${6 + k}L${190 - k} ${30 + k * 0.5}V${116}C${190 - k} ${170 - k * 0.6} ${150 - k * 0.4} ${206 - k} 100 ${228 - k}C${50 + k * 0.4} ${206 - k} ${10 + k} ${170 - k * 0.6} ${10 + k} 116V${30 + k * 0.5}Z`,
  circle: (k = 0) => `M100 ${18 + k}a${94 - k} ${94 - k} 0 1 1 0 ${2 * (94 - k)}a${94 - k} ${94 - k} 0 1 1 0 ${-2 * (94 - k)}z`,
  arch: (k = 0) => `M${12 + k} ${226 - k}V104A${88 - k} ${88 - k} 0 0 1 ${188 - k} 104V${226 - k}Z`,
};

export function BadgeArt({ id, size = 120, locked = false, className = '' }: { id: string; size?: number; locked?: boolean; className?: string }) {
  const b = BADGE_BY_ID[id];
  if (!b) return null;
  const shape = SHAPES[b.shape];
  const uid = `bd-${id}`;
  const nameSize = b.name.length > 13 ? 11.5 : b.name.length > 9 ? 14 : 17;
  return (
    <svg viewBox="0 0 200 232" width={size} height={(size * 232) / 200} className={`badge-art ${locked ? 'locked' : ''} ${className}`} role="img" aria-label={`${b.name}${locked ? ' (bloqueado)' : ''}`}>
      <defs>
        <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.goldL} />
          <stop offset=".45" stopColor={C.gold} />
          <stop offset="1" stopColor={C.goldD} />
        </linearGradient>
        <radialGradient id={`${uid}-field`} cx=".5" cy=".35" r=".75">
          <stop offset="0" stopColor={C.ch2} />
          <stop offset="1" stopColor={C.ch} />
        </radialGradient>
        <pattern id={`${uid}-weave`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0v4" stroke="#fff" strokeWidth="1" opacity=".05" />
        </pattern>
        <clipPath id={`${uid}-clip`}>
          <path d={shape(12)} />
        </clipPath>
        <filter id={`${uid}-gray`}>
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <g filter={locked ? `url(#${uid}-gray)` : undefined} opacity={locked ? 0.42 : 1}>
        {/* rim: gold metal (pin) or gold twill border (patch) */}
        <path d={shape(0)} fill={b.finish === 'pin' ? `url(#${uid}-rim)` : C.goldD} />
        {b.finish === 'patch' && <path d={shape(3)} fill="none" stroke={C.gold} strokeWidth="5" strokeDasharray="1.2 2.2" />}
        <path d={shape(10)} fill={`url(#${uid}-field)`} />
        {b.finish === 'patch' && <path d={shape(10)} fill={`url(#${uid}-weave)`} />}
        <path d={shape(15)} fill="none" stroke={b.finish === 'patch' ? C.cream : C.goldL} strokeWidth={b.finish === 'patch' ? 1.3 : 1} strokeDasharray={b.finish === 'patch' ? '3.5 3' : undefined} opacity=".55" />
        {/* top mark */}
        <text x="100" y={b.shape === 'shield' ? 44 : b.shape === 'circle' ? 46 : 52} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="8" letterSpacing="2" fill={C.gold}>
          ★ No. {String(b.no).padStart(2, '0')} ★
        </text>
        {/* illustration */}
        <g clipPath={`url(#${uid}-clip)`}>
          <g transform={`translate(${b.shape === 'circle' ? 42 : 40} ${b.shape === 'arch' ? 62 : b.shape === 'circle' ? 52 : 54}) scale(${b.shape === 'circle' ? 0.97 : 1})`}>{ART[id]}</g>
        </g>
        {/* name ribbon */}
        <g transform={`translate(0 ${b.shape === 'circle' ? 164 : b.shape === 'arch' ? 178 : 168})`}>
          <path d="M10 6h22v24H10l7-12z" fill="#6a1f2b" />
          <path d="M190 6h-22v24h22l-7-12z" fill="#6a1f2b" />
          <path d="M26 0h148v26H26z" fill="#922f40" />
          <path d="M26 26l6 4v-4zM174 26l-6 4v-4z" fill="#5a1a24" />
          <path d="M30 3h140M30 23h140" stroke={C.goldL} strokeWidth=".8" strokeDasharray="2 2" opacity=".7" />
          <text x="100" y={13 + nameSize * 0.36} textAnchor="middle" fontFamily="'Anton', 'Impact', sans-serif" fontSize={nameSize} letterSpacing="1.2" fill={C.cream}>
            {b.name}
          </text>
        </g>
        {/* enamel gloss */}
        {b.finish === 'pin' && <ellipse cx="72" cy="60" rx="46" ry="18" fill="#fff" opacity=".06" transform="rotate(-24 72 60)" />}
      </g>
      {locked && (
        <g transform="translate(100 112)">
          <circle r="22" fill={C.ch} stroke={C.gold} strokeWidth="1.5" />
          <rect x="-8" y="-3" width="16" height="13" rx="2.5" fill={C.gold} />
          <path d="M-5 -3v-4a5 5 0 0 1 10 0v4" stroke={C.gold} strokeWidth="2.4" fill="none" />
        </g>
      )}
    </svg>
  );
}
