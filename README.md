# Lumora: English Quest 🏮

Un RPG de aventura móvil donde aprendes inglés traduciendo frases al español para
devolver la luz a un valle cubierto por la **Bruma del Olvido**.

> Diseño completo (arquitectura, pantallas, datos, mecánicas, flujo): [`docs/DISENO.md`](docs/DISENO.md)

## Ejecutar

```bash
npm install
npm run dev          # desarrollo en http://localhost:5173
npm run build        # build de producción en dist/
npm run build:single # un único index.html autocontenido en dist-single/
```

El juego es mobile-first: en escritorio se muestra como una columna de móvil.
El progreso se guarda en `localStorage` (sin backend).

## Qué incluye el MVP

- **Mundo 1 – Valle Susurro**: 20 niveles × 10 frases (200 frases con explicación de cada error).
- **4 tipos de ejercicio**: elegir traducción, forjar la frase (ordenar fichas),
  completar el hechizo (hueco), conversación con personajes.
- **Niveles especiales**: retos de tiempo (6, 9, 16), sellos y cofre (5, 15, 19),
  bosses (10 Gruñón, 20 Morvena) con vida, corazones y golpes críticos.
- **Progresión**: XP, nivel de jugador, monedas, estrellas, cofres, racha diaria,
  escudos de racha, 12 logros, 4 mascotas con bonus, 4 skins, tienda.
- **Ecos (repetición espaciada)**: cada frase fallada vuelve al final de la partida
  y se guarda en un sistema Leitner (0 → 4 h → 1 d → 3 d → 7 d → dominada).
  Se mezclan en los niveles y tienen su propio *Santuario de Ecos*.
- **Dificultad adaptable** según la precisión de las últimas 30 respuestas.
- **Misiones diarias** (3 al día, deterministas por fecha) + cofre diario.
- **Voz en inglés** (speechSynthesis, normal y lenta) y efectos de sonido sintetizados.

## Estructura

```
src/
  data/       contenido puro (mundo, personajes, objetos, logros, misiones)
  engine/     lógica de juego sin React (sesiones, SRS, progresión, misiones)
  store/      estado global persistido (Zustand)
  art/        ilustraciones SVG
  components/ UI reutilizable
  exercises/  los 4 tipos de ejercicio
  screens/    pantallas
  audio/      SFX y voz
```

Para añadir un mundo nuevo basta con crear otro archivo en `src/data/` con la misma
forma que `world1.ts`.
