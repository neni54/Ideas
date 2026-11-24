// THE BADGE SHOP · the shared frame (embroidered patch or enamel pin) around each illustration.
// Works for any badge in the catalog: shape, finish, number, name ribbon, locked state.
import { BADGE_BY_ID } from './catalog';
import { C } from './palette';

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
          <g transform={`translate(${b.shape === 'circle' ? 42 : 40} ${b.shape === 'arch' ? 62 : b.shape === 'circle' ? 52 : 54}) scale(${b.shape === 'circle' ? 0.97 : 1})`}>{b.art}</g>
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
