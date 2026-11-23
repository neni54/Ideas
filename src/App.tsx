import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ExpressionSheet } from './components/ExpressionCard';
import { AudioBar } from './components/Speak';
import { Translate } from './screens/Translate';
import { useServices } from './services/api';
import { BottomNav, Toasts } from './components/ui';
import { Games, Library, PackSheet } from './screens/Browse';
import { Memory, QuickFire } from './screens/Drills';
import { Onboarding } from './screens/Onboarding';
import { Play } from './screens/Play';
import { Results } from './screens/Results';
import { Today } from './screens/Today';
import { Phrases, Profile } from './screens/You';
import { useGame } from './store/game';

export default function App() {
  const onboarded = useGame((s) => s.onboarded);
  const screen = useGame((s) => s.screen);
  const newDay = useGame((s) => s.newDay);
  const runId = useGame((s) => s.runId);
  const [hydrated, setHydrated] = useState(() => useGame.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return;
    const off = useGame.persist.onFinishHydration(() => setHydrated(true));
    if (useGame.persist.hasHydrated()) setHydrated(true);
    return off;
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    useServices.getState().load();
    newDay();
    const onFocus = () => newDay();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [newDay, hydrated]);

  if (!hydrated)
    return (
      <div className="app">
        <div className="screen center-screen loading-save">
          <div className="wordmark">
            Sub<span>text</span>
          </div>
          <p className="muted">
            <span className="spin" /> Cargando tu progreso…
          </p>
        </div>
      </div>
    );

  if (!onboarded)
    return (
      <div className="app">
        <Onboarding />
      </div>
    );

  const immersive = ['play', 'quickfire', 'memory', 'results'].includes(screen);
  const views: Record<string, JSX.Element> = {
    today: <Today />,
    library: <Library />,
    games: <Games />,
    phrases: <Phrases />,
    translate: <Translate />,
    profile: <Profile />,
    play: <Play key={runId} />,
    quickfire: <QuickFire key={runId} />,
    memory: <Memory key={runId} />,
    results: <Results />,
  };

  return (
    <div className={`app ${immersive ? 'immersive' : ''}`}>
      <AnimatePresence mode="wait">
        <motion.div key={screen + (immersive ? runId : '')} className="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {views[screen]}
        </motion.div>
      </AnimatePresence>
      {!immersive && <BottomNav />}
      <AudioBar />
      <ExpressionSheet />
      <PackSheet />
      <Toasts />
    </div>
  );
}
