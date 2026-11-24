import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { BRAND, Logo } from '../components/Logo';
import { Btn, Icon } from '../components/ui';
import { useGame, type Goal } from '../store/game';

const GOALS: { id: Goal; label: string; sub: string }[] = [
  { id: 'series', label: 'Series y pelis', sub: 'Entender sin subtítulos' },
  { id: 'work', label: 'Trabajo', sub: 'Reuniones, correos, jefes' },
  { id: 'dating', label: 'Citas', sub: 'Apps, mensajes y señales' },
  { id: 'social', label: 'Vida social', sub: 'Amigos, cenas, cotilleos' },
];

const DEMO = [
  { en: '“That’s an interesting choice.”', es: 'No me gusta nada.' },
  { en: '“No rush, but…”', es: 'Lo necesito ya.' },
  { en: '“I’m fine. Seriously.”', es: 'No está bien.' },
];

export function Onboarding() {
  const { finishOnboarding, name: prevName } = useGame();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [name, setName] = useState(prevName);
  const [demo, setDemo] = useState(0);

  useEffect(() => {
    if (step !== 0) return;
    const t = setInterval(() => setDemo((d) => (d + 1) % DEMO.length), 2600);
    return () => clearInterval(t);
  }, [step]);

  return (
    <div className="screen onboard">
      <Logo size={30} />
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="s0" className="ob-step" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <h1 className="slogan">
              You know the words.
              <br />
              <em>Now get the meaning.</em>
            </h1>
            <p className="lead">{BRAND.message}</p>
            <p className="muted ob-es">Sarcasmo, indirectas, humor y referencias culturales: el inglés que se dice de verdad. De B1 a C1.</p>
            <div className="demo">
              <AnimatePresence mode="wait">
                <motion.div key={demo} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                  <p className="demo-en">{DEMO[demo].en}</p>
                  <p className="demo-es">
                    <span>Traducción real</span> {DEMO[demo].es}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
        {step === 1 && (
          <motion.div key="s1" className="ob-step" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="eyebrow">1 de 2</div>
            <h1 className="display">Where do you want to stop translating in your head?</h1>
            <p className="muted">Elige uno o varios. Lo usamos para recomendarte colecciones.</p>
            <div className="goals">
              {GOALS.map((g) => {
                const on = goals.includes(g.id);
                return (
                  <button key={g.id} className={`goal ${on ? 'on' : ''}`} onClick={() => setGoals(on ? goals.filter((x) => x !== g.id) : [...goals, g.id])} aria-pressed={on}>
                    <b>{g.label}</b>
                    <small>{g.sub}</small>
                    <span className="goal-check">{on && <Icon name="check" size={14} />}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="s2" className="ob-step" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="eyebrow">2 de 2</div>
            <h1 className="display">What should we call you?</h1>
            <input
              id="ob-name"
              className="name-input"
              value={name}
              maxLength={20}
              placeholder="Tu nombre"
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && finishOnboarding(name, goals)}
            />
            <p className="muted">Cinco minutos al día bastan. Te avisamos de lo que estás a punto de olvidar.</p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="ob-foot">
        <div className="ob-dots">
          {[0, 1, 2].map((i) => (
            <i key={i} className={i === step ? 'on' : ''} />
          ))}
        </div>
        <Btn wide onClick={() => (step < 2 ? setStep(step + 1) : finishOnboarding(name, goals))}>
          {step === 0 ? 'Empezar' : step === 1 ? (goals.length ? 'Continuar' : 'Saltar') : 'Entrar'} <Icon name="arrow" size={16} />
        </Btn>
      </div>
    </div>
  );
}
