import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { ExpressionSheet } from './components/ExpressionCard';
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

  useEffect(() => {
    newDay();
    const onFocus = () => newDay();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [newDay]);

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
      <ExpressionSheet />
      <PackSheet />
      <Toasts />
    </div>
  );
}
