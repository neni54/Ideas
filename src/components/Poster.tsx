import type { Pack } from '../data/types';
import { Icon } from './ui';

/** Typographic "series poster" for a phrase pack. */
export function Poster({ pack, locked, mastery, compact }: { pack: Pack; locked?: boolean; mastery?: number; compact?: boolean }) {
  return (
    <div
      className={`poster ${compact ? 'poster-compact' : ''} ${locked ? 'locked' : ''}`}
      style={{ ['--p1' as string]: pack.colors[0], ['--p2' as string]: pack.colors[1] }}
    >
      <div className="poster-top">
        <span>Vol. {String(pack.vol).padStart(2, '0')}</span>
        {locked && (
          <span className="poster-lock">
            <Icon name="lock" size={12} /> Nv {pack.unlock}
          </span>
        )}
      </div>
      <h3 className="poster-title">{pack.title}</h3>
      {!compact && <p className="poster-tag">{pack.tagline}</p>}
      {mastery !== undefined && !locked && (
        <div className="poster-mastery">
          <i style={{ width: `${Math.round(mastery * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
