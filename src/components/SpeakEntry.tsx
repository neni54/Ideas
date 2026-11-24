// Entry card for SIDEYE SPEAK (Games and Today).
import { useGame } from '../store/game';
import { useSpeakNav } from '../speak/player';
import { Icon } from './ui';

export function SpeakEntry({ compact = false }: { compact?: boolean }) {
  const go = useGame((s) => s.go);
  const open = useSpeakNav((s) => s.open);
  return (
    <button
      className={`speak-entry ${compact ? 'speak-entry-compact' : ''}`}
      onClick={() => {
        open({ name: 'hub' });
        go('speak');
      }}
    >
      <span className="eyebrow">Nuevo · gratis</span>
      <b>
        SIDEYE <em>SPEAK</em>
      </b>
      <small>Don&rsquo;t just understand it. Say it.</small>
      {!compact && <span className="speak-entry-sub">Pronunciación y conversaciones con la voz de tu móvil.</span>}
      <span className="speak-entry-go">
        <Icon name="mic" size={18} />
      </span>
    </button>
  );
}
