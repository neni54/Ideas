# SIDEYE · Niveles y dificultad del inglés

## Los 5 niveles

| # | Nivel | Rango | Frases | Colecciones |
|---|-------|-------|-------:|-------------|
| 1 | FIRST STEPS | A1 | 30 | Hello & Goodbye, Please & Thank You, How I Feel, Easy Questions, Yes No Maybe, Out and About |
| 2 | GETTING COMFORTABLE | A1–A2 | 22 | Small Talk, Quick Reactions, Making Plans, Nice & Polite |
| 3 | REAL-LIFE ENGLISH | A2–B1 | 29 | Everyday Conversations, Things We Say Things We Mean, Friends & Social Drama, Awkward Situations, Idioms & Phrasal Verbs, Main Character Energy, Plot Twists |
| 4 | READ BETWEEN THE LINES | B1–B2 | 34 | Sarcasm & Wit, Dating Disasters, Office Politics, Passive-Aggressive English, American Slang, Overthinking at 2 AM, Pop Culture |
| 5 | THINK IN ENGLISH | B2–C1 | 10 | Red Flags (+ frases C1 sueltas de otras colecciones) |

El nivel de cada frase sale de su campo `level` (A1→1, A2→2, B1→3, B2→4, C1→5),
salvo que tenga `tier` explícito o esté en `TIER_OVERRIDE` (`src/data/levels.ts`).

## Regla 4 · 3 · 2 · 1

Cada bloque de **10 frases nuevas** = 4 de FIRST STEPS + 3 de GETTING COMFORTABLE +
2 de REAL-LIFE ENGLISH + 1 superior (READ BETWEEN THE LINES; alterna con THINK IN ENGLISH
cuando ya has visto la mitad del nivel 4).

- Orden dentro del bloque: `NEW_PHRASE_SLOTS = [1,2,1,3,1,2,1,2,3,top]` → empieza fácil.
- La posición se calcula con las frases que el jugador ya ha visto, así que la proporción
  se mantiene entre lecciones, prácticas y sesiones (`src/engine/session.ts`: `nextNewTiers`, `pickNew`).
- Si un nivel se queda sin frases nuevas, se usa el siguiente más difícil y, si no, uno más fácil.

## Secciones

| Sección | Cómo respeta la dificultad |
|---------|----------------------------|
| Lecciones diarias | Frases nuevas con la regla 4·3·2·1 |
| What does it really mean / Catch the Sarcasm / Literal vs Natural / What Would You Say (prácticas) | Mismas frases nuevas con 4·3·2·1 |
| Quick Fire | Sorteo ponderado: nivel 1 ≈ 40 %, 2 ≈ 30 %, 3 ≈ 20 %, 4–5 ≈ 10 % |
| Memory | Solo repasa lo que ya has visto (hereda la progresión) |
| The Unexpected Twist | 36 escenas (6 nuevas fáciles); las nuevas salen de fácil a difícil |
| Voice Acting | Cada frase tiene nivel; las nuevas salen de fácil a difícil |
| THE DAILY LINE | 40 frases; cada 10 días: 4 nivel 1, 3 nivel 2, 2 nivel 3, 1 nivel 4–5 |
| Colección de la semana | Solo colecciones hasta un nivel acorde a tu experiencia |

## Progreso

- "Tu nivel de inglés" (Hoy): el primer nivel del que has visto menos del 80 %.
- Colecciones: agrupadas por nivel, con barra de progreso y marca "Tu nivel".
- Puedes abrir y jugar cualquier nivel; si es superior al tuyo, solo se muestra un aviso.
- Perfil: frases vistas por nivel.

## Añadir contenido

- Frases: añádelas a un pack con `level` (o `tier`). Nada más.
- Daily Line: añade una entrada a `DAILY_LINES` con `tier`.
- Escenas / Voice Acting: campo `tier` opcional.

## Pruebas

`npm run test:levels` (unidad) y `bash tests/run-levels-tests.sh` (unidad + iPhone).

Nota: una colección se coloca en el nivel de la mayoría de sus frases; cada frase conserva su propio nivel.
