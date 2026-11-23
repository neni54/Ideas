import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { BottomNav, Hud, Toasts } from './components/ui';
import { Home } from './screens/Home';
import { MapScreen } from './screens/MapScreen';
import { Bag, Missions, Profile } from './screens/Meta';
import { Onboarding } from './screens/Onboarding';
import { Play } from './screens/Play';
import { Results } from './screens/Results';
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

  const immersive = screen === 'play' || screen === 'results';
  const views: Record<string, JSX.Element> = {
    home: <Home />,
    map: <MapScreen />,
    missions: <Missions />,
    bag: <Bag />,
    profile: <Profile />,
    play: <Play key={runId} />,
    results: <Results />,
  };

  return (
    <div className={`app ${immersive ? 'immersive' : ''} screen-${screen}`}>
      <div className="stars-bg" aria-hidden />
      {!immersive && <Hud />}
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          className="view"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22 }}
        >
          {views[screen]}
        </motion.div>
      </AnimatePresence>
      {!immersive && <BottomNav />}
      <Toasts />
    </div>
  );
}
