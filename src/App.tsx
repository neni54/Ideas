import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ExpressionSheet } from './components/ExpressionCard';
import { AudioBar } from './components/Speak';
import { UpdateBanner } from './components/Pwa';
import { SpeakScreen } from './screens/Speak';
import { useSpeakNav } from './speak/player';
import { Logo } from './components/Logo';
import { Translate } from './screens/Translate';
import { Twist } from './screens/Twist';
import { VoiceActing } from './screens/VoiceActing';
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
import { nextLocalMidnight } from './engine/gate';

export default function App() {
  const onboarded = useGame((s) => s.onboarded);
  const screen = useGame((s) => s.screen);
  const newDay = useGame((s) => s.newDay);
  const runId = useGame((s) => s.runId);
  const speakView = useSpeakNav((s) => s.view.name);
  const [hydrated, setHydrated] = useState(() => useGame.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return;
    const off = useGame.persist.onFinishHydration(() => setHydrated(true));
    if (useGame.persist.hasHydrated()) setHydrated(true);
    return off;
  }, [hydrated]);

  // Re-evaluate the day (missions, streak, review lock) exactly at local midnight, even with the app open.
  const [, setDayTick] = useState(0);
  useEffect(() => {
    if (!hydrated) return;
    let t: number;
    const arm = () => {
      t = window.setTimeout(() => {
        newDay();
        setDayTick((n) => n + 1);
        arm();
      }, Math.max(1000, nextLocalMidnight() - Date.now() + 500));
    };
    arm();
    const onVisible = () => document.visibilityState === 'visible' && (newDay(), setDayTick((n) => n + 1));
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(t);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [hydrated, newDay]);

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
          <Logo size={44} />
          <p className="slogan-sm">You know the words. Now get the meaning.</p>
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

  const immersive = ['play', 'quickfire', 'memory', 'twist', 'voice', 'results'].includes(screen) || (screen === 'speak' && (speakView === 'practice' || speakView === 'chat'));
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
    twist: <Twist key={runId} />,
    voice: <VoiceActing key={runId} />,
    results: <Results />,
    speak: <SpeakScreen />,
  };

  return (
    <div className={`app ${immersive ? 'immersive' : ''} ${screen === 'voice' ? 'on-voice' : ''}`}>
      <AnimatePresence mode="wait">
        <motion.div key={screen + (immersive ? runId : '') + (screen === 'speak' ? speakView : '')} className="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {views[screen]}
        </motion.div>
      </AnimatePresence>
      {!immersive && <BottomNav />}
      <AudioBar />
      <ExpressionSheet />
      <PackSheet />
      <Toasts />
      <UpdateBanner />
    </div>
  );
}
