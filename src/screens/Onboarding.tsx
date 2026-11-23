import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Hero, Pip } from '../art/Art';
import { Btn } from '../components/ui';
import { useGame } from '../store/game';

const SLIDES = [
  {
    title: 'Lumora',
    text: 'Hubo un tiempo en que cada palabra brillaba. Las Palabras Luminosas mantenían vivo el reino.',
    mood: 'happy' as const,
  },
  {
    title: 'La Bruma del Olvido',
    text: 'Una niebla extraña cubrió el Valle Susurro y se llevó las palabras. Ahora nadie se entiende.',
    mood: 'sad' as const,
  },
  {
    title: '¡Te necesito!',
    text: 'Soy Pip. Tú puedes entender el idioma de la luz: el inglés. Tradúcelo y devolveremos el brillo al valle.',
    mood: 'wow' as const,
  },
];

export function Onboarding() {
  const finish = useGame((s) => s.finishOnboarding);
  const [i, setI] = useState(0);
  const [name, setName] = useState('');
  const naming = i >= SLIDES.length;
  const slide = SLIDES[Math.min(i, SLIDES.length - 1)];

  return (
    <div className="onboard">
      <div className={`onboard-sky ${i === 1 ? 'foggy' : ''}`} />
      <AnimatePresence mode="wait">
        {!naming ? (
          <motion.div key={i} className="onboard-slide" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
            <div className="float">
              <Pip size={150} mood={slide.mood} />
            </div>
            <h1 className="title-xl">{slide.title}</h1>
            <p className="onboard-text">{slide.text}</p>
          </motion.div>
        ) : (
          <motion.div key="name" className="onboard-slide" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="onboard-duo">
              <Hero size={110} mood="happy" />
              <div className="float">
                <Pip size={80} mood="happy" />
              </div>
            </div>
            <h1 className="title-lg">¿Cómo te llamas, Portador de Luz?</h1>
            <input
              className="name-input"
              value={name}
              maxLength={16}
              placeholder="Tu nombre de héroe"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && finish(name)}
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="onboard-footer">
        {!naming && (
          <div className="dots">
            {SLIDES.map((_, k) => (
              <span key={k} className={k === i ? 'on' : ''} />
            ))}
          </div>
        )}
        <Btn big onClick={() => (naming ? finish(name) : setI(i + 1))}>
          {naming ? '¡Comenzar la aventura!' : 'Continuar'}
        </Btn>
      </div>
    </div>
  );
}
