# Subtext

*English, between the lines.* Una app para aprender el inglés que no viene en los libros:
sarcasmo, indirectas, slang, citas, oficina y conversaciones reales. Para adultos, de B1 a C1.

> Diseño, contenido, mecánicas y qué cambió respecto a la v1: [`docs/DISENO.md`](docs/DISENO.md)

## Ejecutar

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build de producción en dist/
npm run build:single # un único index.html autocontenido en dist-single/
```

Es mobile-first; en escritorio se muestra como una columna centrada. El progreso se guarda en
`localStorage` (sin backend). Si existía una partida de la versión anterior (*Lumora*), se
conservan el nombre, la XP y la racha.

## Qué incluye

- **75 expresiones originales en 15 colecciones**, cada una con traducción natural, nivel CEFR,
  contexto, matiz, tono, error típico, ejemplo extra, rival parecida y mini-reto.
- **9 modos de juego**: What Does It Really Mean?, Catch the Sarcasm, Literal vs. Natural,
  What Would You Say?, Context Detective, Complete the Conversation, Phrase Battle, Quick Fire
  y Memory.
- **Sesión diaria de 5 minutos** con repasos, novedades y una sorpresa; frase del día;
  colección de la semana; retos diarios; resumen semanal.
- **Progresión**: XP, niveles con título, dominio por expresión con repetición espaciada,
  racha con escudos, comodines 50/50, 16 logros y estadísticas por modo y por nivel CEFR.

## Añadir contenido

Crea un pack en `src/data/packs/` con `pack({...}, [...expresiones])` y añádelo a la lista de
`src/data/content.ts`. Todos los modos se generan solos a partir de los campos de cada expresión.
