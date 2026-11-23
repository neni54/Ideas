import { Npc } from '../art/Art';
import { CHARACTERS } from '../data/meta';
import type { Level } from '../data/types';
import { useGame } from '../store/game';
import { Btn, Modal, Stars } from './ui';

export const KIND_LABEL: Record<Level['kind'], { icon: string; label: string; cls: string }> = {
  normal: { icon: '✨', label: 'Aventura', cls: 'k-normal' },
  timed: { icon: '⏳', label: 'Reto de tiempo', cls: 'k-timed' },
  chest: { icon: '🔒', label: 'Sellos y cofre', cls: 'k-chest' },
  boss: { icon: '⚔️', label: 'Batalla de jefe', cls: 'k-boss' },
};

export function LevelBriefing({ level, onClose }: { level: Level | null; onClose: () => void }) {
  const { levels, play, srs } = useGame();
  if (!level) return <Modal open={false}>{null}</Modal>;
  const prog = levels[level.id];
  const ch = CHARACTERS[level.character];
  const kind = KIND_LABEL[level.kind];
  const echoes = Object.values(srs).filter((c) => c.due <= Date.now()).length;
  return (
    <Modal open={!!level} onClose={onClose} className={`briefing ${level.kind === 'boss' ? 'briefing-boss' : ''}`}>
      <button className="modal-x" onClick={onClose} aria-label="Cerrar">
        ✕
      </button>
      <div className="briefing-top">
        <span className={`kind-badge ${kind.cls}`}>
          {kind.icon} {kind.label}
        </span>
        <small>Nivel {level.n}</small>
      </div>
      <div className="briefing-portrait">
        <Npc id={level.character} size={level.kind === 'boss' ? 140 : 100} />
      </div>
      <h2 className="title-lg">{level.title}</h2>
      <p className="briefing-story">
        <b style={{ color: ch.color }}>{ch.name}</b> · {level.story}
      </p>
      <div className="briefing-goal">🎯 {level.goal}</div>
      <div className="briefing-meta">
        {prog?.completed ? <Stars n={prog.stars} size={22} /> : <span className="reward-pill">+30 XP · +25 🪙 primera vez</span>}
        {level.kind !== 'boss' && echoes > 0 && <span className="echo-pill">🔮 {Math.min(3, echoes)} Ecos</span>}
      </div>
      <Btn big variant={level.kind === 'boss' ? 'danger' : 'primary'} onClick={() => play({ mode: 'level', levelId: level.id })}>
        {level.kind === 'boss' ? '¡A la batalla!' : prog?.completed ? 'Jugar de nuevo' : 'Jugar'}
      </Btn>
    </Modal>
  );
}
