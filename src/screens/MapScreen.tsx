import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Hero, StarIcon } from '../art/Art';
import { LevelBriefing } from '../components/LevelBriefing';
import { WORLD1 } from '../data/world1';
import type { Level } from '../data/types';
import { sfx } from '../audio/sfx';
import { currentLevel, isLevelUnlocked, useGame } from '../store/game';

const W = 400;
const H = 2280;
const nodePos = (i: number) => ({ x: 200 + 108 * Math.sin(i * 0.85), y: H - 130 - i * 105 });

const ZONES = [
  { from: 0, name: 'Aldea del Alba', icon: '🏡' },
  { from: 5, name: 'Río Cantarín', icon: '🌊' },
  { from: 10, name: 'Bosque de los Ecos', icon: '🌲' },
  { from: 13, name: 'Ruinas Antiguas', icon: '🏛️' },
  { from: 15, name: 'Paso Helado', icon: '❄️' },
  { from: 18, name: 'Torre de la Bruma', icon: '🗼' },
];

function pathThrough(points: { x: number; y: number }[]) {
  return points
    .map((p, i) => {
      if (i === 0) return `M${p.x} ${p.y}`;
      const a = points[i - 1];
      return `C${a.x} ${a.y - 55} ${p.x} ${p.y + 55} ${p.x} ${p.y}`;
    })
    .join(' ');
}

function Tree({ x, y, s = 1, dark = false }: { x: number; y: number; s?: number; dark?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-3} y={-2} width={6} height={14} fill="#6b4a2f" />
      <path d="M0 -40 L18 -8 L-18 -8 Z" fill={dark ? '#1f5c3a' : '#3fa45b'} />
      <path d="M0 -28 L22 4 L-22 4 Z" fill={dark ? '#246b43' : '#4cbb6a'} />
    </g>
  );
}

function House({ x, y, roof = '#e76f51' }: { x: number; y: number; roof?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-18} y={-16} width={36} height={26} rx={3} fill="#fbe8c8" />
      <path d="M-24 -14 L0 -36 L24 -14 Z" fill={roof} />
      <rect x={-5} y={-4} width={10} height={14} rx={2} fill="#8d5a3b" />
      <rect x={-14} y={-10} width={7} height={7} rx={1} fill="#ffd166" />
    </g>
  );
}

function MapArt({ fogY, points, doneCount }: { fogY: number; points: { x: number; y: number }[]; doneCount: number }) {
  const full = pathThrough(points);
  const done = pathThrough(points.slice(0, Math.max(1, doneCount + 1)));
  return (
    <svg className="map-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="mapBg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2a1f5c" />
          <stop offset="0.12" stopColor="#5b4a9e" />
          <stop offset="0.16" stopColor="#bfe0f2" />
          <stop offset="0.27" stopColor="#e3f2fb" />
          <stop offset="0.29" stopColor="#e5cf96" />
          <stop offset="0.36" stopColor="#c9b27a" />
          <stop offset="0.38" stopColor="#2f7d4f" />
          <stop offset="0.5" stopColor="#3b8f5c" />
          <stop offset="0.53" stopColor="#6cc28a" />
          <stop offset="0.74" stopColor="#79c98a" />
          <stop offset="0.76" stopColor="#9bdc8e" />
          <stop offset="1" stopColor="#b6e78f" />
        </linearGradient>
        <linearGradient id="fogEdge" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4a3f86" stopOpacity="0.82" />
          <stop offset="1" stopColor="#c7bfee" stopOpacity="0" />
        </linearGradient>
        <filter id="blur8">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <rect width={W} height={H} fill="url(#mapBg)" />

      {/* Tower zone */}
      <g opacity={0.95}>
        <path d="M-20 300 L60 170 L120 260 L190 130 L260 250 L330 160 L420 300 Z" fill="#41347a" />
        <g transform="translate(200 60)">
          <rect x={-22} y={20} width={44} height={110} fill="#2b2150" />
          <path d="M-30 22 L0 -34 L30 22 Z" fill="#6a4bc4" />
          <rect x={-8} y={50} width={16} height={22} rx={8} fill="#ffd166" opacity={0.8} />
          <circle cx={0} cy={-36} r={6} fill="#b69cff" />
        </g>
      </g>
      {/* Snowy mountains */}
      <path d="M-20 560 L70 400 L140 520 L210 380 L290 510 L360 420 L420 560 Z" fill="#a9cde4" />
      <path d="M70 400 L88 432 L54 432 Z M210 380 L230 416 L190 416 Z M360 420 L376 448 L344 448 Z" fill="#fff" />
      {/* Frozen lake */}
      <ellipse cx={90} cy={600} rx={70} ry={26} fill="#9fd3f0" stroke="#fff" strokeWidth={3} />
      {/* Ruins */}
      {[60, 330, 300, 90].map((x, i) => (
        <g key={i} transform={`translate(${x} ${700 + (i % 2) * 60})`}>
          <rect x={-8} y={-40} width={16} height={46} fill="#e7d7ad" />
          <rect x={-12} y={-46} width={24} height={8} fill="#cdb98a" />
        </g>
      ))}
      {/* Forest */}
      {Array.from({ length: 22 }).map((_, i) => {
        const x = (i * 71) % 400;
        const y = 860 + ((i * 53) % 300);
        const p = points.some((pt) => Math.abs(pt.x - x) < 46 && Math.abs(pt.y - y) < 46);
        return p ? null : <Tree key={i} x={x} y={y} s={1 + (i % 3) * 0.2} dark />;
      })}
      {/* River with bridge */}
      <path d="M-20 1250 C80 1200 140 1330 220 1300 C300 1270 340 1380 420 1350" stroke="#4fb3e8" strokeWidth={46} fill="none" />
      <path d="M-20 1250 C80 1200 140 1330 220 1300 C300 1270 340 1380 420 1350" stroke="#9ee0ff" strokeWidth={10} fill="none" strokeDasharray="20 30" className="river-flow" />
      <path d="M-20 1560 C100 1530 160 1620 260 1590 C330 1570 380 1610 420 1600" stroke="#4fb3e8" strokeWidth={30} fill="none" opacity={0.9} />
      {/* Village */}
      <House x={70} y={2040} />
      <House x={330} y={1960} roof="#5a8dee" />
      <House x={60} y={1820} roof="#9b5de5" />
      <House x={345} y={2200} roof="#f4a261" />
      {[30, 370, 120, 300, 20, 380].map((x, i) => (
        <Tree key={'v' + i} x={x} y={1700 + i * 90} s={0.9} />
      ))}
      {[[120, 2230], [280, 2120], [40, 1660], [360, 1700]].map(([x, y], i) => (
        <g key={'f' + i} transform={`translate(${x} ${y})`}>
          <circle r={4} fill="#ff8fab" />
          <circle r={4} cx={10} cy={4} fill="#ffd166" />
          <circle r={4} cx={-8} cy={6} fill="#fff" />
        </g>
      ))}

      {/* Path */}
      <path d={full} stroke="#5b4a3a" strokeOpacity={0.25} strokeWidth={22} fill="none" strokeLinecap="round" />
      <path d={full} stroke="#fff" strokeOpacity={0.7} strokeWidth={6} fill="none" strokeDasharray="2 16" strokeLinecap="round" />
      <path d={done} stroke="#ffd166" strokeWidth={8} fill="none" strokeLinecap="round" />

      {/* The Fog of Forgetting covers what is still locked */}
      {fogY > 0 && (
        <g className="fog-layer">
          <rect x={-40} y={-40} width={W + 80} height={Math.max(0, fogY - 110)} fill="#3b3266" opacity={0.82} />
          <rect x={-40} y={fogY - 150} width={W + 80} height={150} fill="url(#fogEdge)" />
          {Array.from({ length: 9 }).map((_, i) => (
            <ellipse key={i} cx={(i * 63) % 420} cy={fogY - 20 - (i % 3) * 18} rx={70} ry={28} fill="#c7bfee" opacity={0.55} filter="url(#blur8)" />
          ))}
        </g>
      )}
    </svg>
  );
}

export function MapScreen() {
  const { levels, mapFocus } = useGame();
  const [brief, setBrief] = useState<Level | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const points = useMemo(() => WORLD1.levels.map((_, i) => nodePos(i)), []);
  const cur = currentLevel(levels);
  const doneCount = WORLD1.levels.filter((l) => levels[l.id]?.completed).length;
  const curIdx = cur.n - 1;
  const fogY = doneCount >= WORLD1.levels.length ? 0 : points[curIdx].y - 70;

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const focusIdx = mapFocus ? WORLD1.levels.findIndex((l) => l.id === mapFocus) : curIdx;
    const target = points[Math.max(0, focusIdx)];
    const inner = el.firstElementChild as HTMLElement;
    const scale = inner.offsetHeight / H;
    el.scrollTop = target.y * scale - el.clientHeight * 0.55;
  }, [mapFocus, curIdx, points]);

  return (
    <div className="screen map-screen" ref={scroller}>
      <div className="map-inner" style={{ aspectRatio: `${W} / ${H}` }}>
        <MapArt fogY={fogY} points={points} doneCount={doneCount} />

        {ZONES.map((z) => {
          const p = points[z.from];
          return (
            <div key={z.name} className="zone-banner" style={{ top: `${((p.y + 62) / H) * 100}%`, left: p.x > 200 ? '6%' : undefined, right: p.x <= 200 ? '6%' : undefined }}>
              {z.icon} {z.name}
            </div>
          );
        })}

        {WORLD1.levels.map((l, i) => {
          const p = points[i];
          const prog = levels[l.id];
          const unlocked = isLevelUnlocked(levels, l.id);
          const isCur = l.id === cur.id && !prog?.completed;
          const icon = l.kind === 'boss' ? '☠️' : l.kind === 'chest' ? (prog?.completed ? '🔓' : '🧰') : l.kind === 'timed' ? '⏳' : null;
          return (
            <div key={l.id} className="node-wrap" style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}>
              {isCur && (
                <motion.div className="node-hero" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  <HeroMini />
                </motion.div>
              )}
              <motion.button
                className={`node node-${l.kind} ${prog?.completed ? 'done' : ''} ${unlocked ? 'open' : 'locked'} ${isCur ? 'current' : ''}`}
                whileTap={unlocked ? { scale: 0.9 } : undefined}
                onClick={() => {
                  if (!unlocked) {
                    sfx.wrong();
                    return;
                  }
                  sfx.tap();
                  setBrief(l);
                }}
                aria-label={`Nivel ${l.n}: ${l.title}`}
              >
                {unlocked ? icon ?? <span className="node-n">{l.n}</span> : '🔒'}
              </motion.button>
              {prog?.completed && (
                <div className="node-stars">
                  {[1, 2, 3].map((k) => (
                    <StarIcon key={k} size={15} filled={k <= prog.stars} />
                  ))}
                </div>
              )}
              {isCur && <div className="node-label">{l.title}</div>}
            </div>
          );
        })}
      </div>
      <LevelBriefing level={brief} onClose={() => setBrief(null)} />
    </div>
  );
}

function HeroMini() {
  const skin = useGame((s) => s.skin);
  return (
    <div className="bob">
      <Hero size={46} skin={skin} mood="happy" />
    </div>
  );
}
