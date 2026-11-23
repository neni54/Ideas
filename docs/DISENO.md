# Lumora: English Quest — Documento de diseño (MVP)

> Un RPG de aventura móvil donde la magia es el idioma. Para avanzar, el jugador
> comprende y traduce frases en inglés al español.

---

## 1. Concepto y fantasía

El reino de **Lumora** estaba unido por las *Palabras Luminosas*. Una niebla
llamada **la Bruma del Olvido** ha cubierto los mundos y ha robado sus palabras.
El jugador es un **Portador de Luz** acompañado por **Pip**, un espíritu-farolillo.
Cada frase traducida devuelve luz al mundo: abre puertas, despierta personajes,
rompe sellos y, al final, derrota a los guardianes de la Bruma.

**Mundo 1 – Valle Susurro**: aldea, bosque, río, ruinas y la Torre de la Bruma.
20 niveles en un camino serpenteante, con 2 bosses (nivel 10 y 20) y cofres.

Principios de diseño:

1. **Juego primero, lección después.** El jugador nunca "hace ejercicios": abre
   cofres, habla con personajes, rompe sellos y lucha contra bosses.
2. **El error enseña, no castiga.** Fallar muestra la respuesta correcta, explica
   el porqué con una pista corta, y la frase vuelve más tarde ("Eco").
3. **Una pantalla, una función.** Nada compite por la atención.
4. **Motivo para volver mañana**: racha, misiones diarias, cofre diario, Ecos
   pendientes y el siguiente nivel siempre visible.

---

## 2. Arquitectura técnica

| Capa | Elección | Motivo |
|---|---|---|
| UI | React 18 + TypeScript | Componentes, tipado del contenido |
| Build | Vite | Rápido, build a un único HTML para compartir |
| Estado | Zustand + persistencia en `localStorage` | Simple, sin backend en el MVP |
| Animación | Framer Motion + CSS keyframes | Transiciones suaves de pantalla y feedback |
| Arte | SVG inline dibujado a mano | Nítido en cualquier pantalla, sin assets externos |
| Audio | Web Audio API (SFX sintetizados) + `speechSynthesis` (voz en inglés) | Cero archivos de audio |

```
src/
├── main.tsx / App.tsx        # arranque y "router" por estado
├── data/                     # CONTENIDO (puro, sin lógica)
│   ├── world1.ts             # 20 niveles × 10 frases
│   ├── characters.ts         # personajes y diálogos
│   ├── pets.ts · items.ts · skins.ts
│   ├── achievements.ts       # definiciones de logros
│   └── missions.ts           # plantillas de misiones diarias
├── engine/                   # LÓGICA DE JUEGO (pura, testeable)
│   ├── session.ts            # construye la partida (frases + Ecos + tipos)
│   ├── exercises.ts          # genera opciones, distractores, fichas
│   ├── srs.ts                # repetición espaciada (Leitner)
│   ├── progression.ts        # XP, niveles, estrellas, recompensas
│   ├── missions.ts           # misiones del día
│   └── date.ts               # utilidades de día/racha
├── store/game.ts             # estado global persistido + acciones
├── audio/                    # sfx.ts, speech.ts
├── components/               # UI reutilizable (botones, barras, cofre, Pip…)
├── art/                      # ilustraciones SVG (personajes, mapa, cofres)
├── exercises/                # 4 tipos de ejercicio
└── screens/                  # pantallas
```

**Regla:** `data/` no conoce React, `engine/` no conoce React, las pantallas sólo
llaman acciones del store. Así añadir el Mundo 2 es añadir un archivo de datos.

---

## 3. Pantallas

| # | Pantalla | Función única |
|---|---|---|
| 0 | **Prólogo** (primera vez) | Historia en 3 viñetas + nombre del héroe |
| 1 | **Campamento (Home)** | Botón gigante *Continuar*, racha, nivel, misiones y Ecos |
| 2 | **Mapa del mundo** | Camino de 20 nodos, desbloqueo, estrellas, cofres, bosses |
| 3 | **Briefing de nivel** | Quién te necesita, qué hay en juego, botón Jugar |
| 4 | **Gameplay** | Un reto a la vez, feedback inmediato |
| 5 | **Resultados** | Estrellas, XP, monedas, cofre, subida de nivel |
| 6 | **Misiones** | 3 misiones diarias + cofre diario |
| 7 | **Mochila** | Monedas, objetos, mascotas, skins, tienda |
| 8 | **Perfil** | Estadísticas, logros, ajustes |

Navegación inferior (5 pestañas): **Inicio · Mapa · Misiones · Mochila · Perfil**.
Se oculta durante el gameplay para máxima inmersión.

---

## 4. Flujo de navegación

```
Primera vez → Prólogo → Campamento
Campamento ──Continuar──▶ Briefing ─Jugar─▶ Gameplay ─▶ Resultados ─▶ (Cofre) ─▶ (Subida de nivel) ─▶ Mapa
Campamento ──Ecos──────▶ Gameplay (modo repaso) ─▶ Resultados ─▶ Campamento
Mapa ──nodo──▶ Briefing   ·   Mapa ──nodo cofre──▶ Apertura de cofre
Gameplay ──✕──▶ Confirmar salida ─▶ Mapa (sin perder progreso global)
```

---

## 5. Estructura de datos

```ts
Phrase      { id, en, es, key, tip, traps?, alt? }
            // es usa [corchetes] para marcar la palabra clave del ejercicio "completar"
            // traps: traducciones trampa escritas a mano (falsos amigos, tiempos…)
Level       { id, n, title, story, character, kind: 'normal'|'timed'|'chest'|'boss',
              phrases: Phrase[10], boss? { name, hp } }
World       { id, name, levels: Level[20] }

PlayerState {
  name, skin, activePet,
  xp, coins, streak, lastPlayDay, streakFreezes,
  levels:   { [levelId]: { stars, best, completed } },
  srs:      { [phraseId]: { box: 0..5, due: timestamp, fails } },
  stats:    { correct, answered, bestCombo, levelsDone, echoesCleared, chests, perfects, bossWins },
  missions: { day, list: [{ id, target, progress, claimed }], chestClaimed },
  inventory:{ items: { hint, time, freeze }, pets: string[], skins: string[] },
  achievements: { [id]: unlockedAt },
  recent:   boolean[]  // últimas 30 respuestas → dificultad adaptable
  settings: { sound, voice }
}
```

---

## 6. Mecánicas

### Tipos de ejercicio (4 en el MVP)
1. **Elige la traducción** – 4 opciones en español (correcta + trampas + frases del nivel).
2. **Forja la frase** – ordenar fichas de palabras en español (+ 2 fichas señuelo con dificultad alta).
3. **Completa el hechizo** – la traducción tiene un hueco; elegir la palabra correcta.
4. **Conversación** – un personaje habla en inglés en un bocadillo; eliges qué ha dicho.

### Modificadores de nivel
- **Reto de tiempo** (⏳): cuenta atrás por frase; el tiempo sobrante da monedas extra.
- **Cofre/Puerta** (🔒): cada acierto rompe un sello; al final se abre el cofre.
- **Boss battle** (⚔️): el boss tiene vida; cada acierto es un ataque, cada fallo
  te quita un corazón (5). Frases más largas y sólo ejercicios difíciles.
  Si pierdes, el boss queda herido: la siguiente vez empieza con menos vida.

### Recompensas
- Acierto: **+10 XP**, **+3 monedas**. Combo ≥3: +2 XP extra por acierto.
- Estrellas: ★ completar · ★★ ≥70 % · ★★★ ≥90 %.
- Primera vez completado: bonus de monedas. Repetir: recompensas reducidas.
- Cofres: niveles 5 y 15 (cofre), bosses (cofre épico), cofre diario.
- Nivel de jugador: XP necesario = 80 + 40·(nivel−1).

### Errores sin frustración
- Feedback en una hoja inferior suave (no roja agresiva) con:
  respuesta correcta, frase en inglés con audio y **por qué** (`tip`).
- La frase fallada **vuelve al final de la misma partida** y se guarda como **Eco**.

### Repetición inteligente (Ecos – sistema Leitner)
- Fallo → caja 0, vencimiento inmediato.
- Acierto en un Eco → sube de caja; intervalos: 0 · 4 h · 1 d · 3 d · 7 d.
- Caja 5 → **dominada** (sale del sistema, cuenta para logros).
- Cada partida inyecta hasta 3 Ecos vencidos (marcados con 🔮).
- El Campamento ofrece **Santuario de Ecos** para repasar todo lo vencido.

### Dificultad adaptable
Precisión de las últimas 30 respuestas:
- < 60 % → más "Elige", 3 opciones, más tiempo.
- 60–85 % → mezcla equilibrada.
- > 85 % → más "Forja" con señuelos y "Completa", menos tiempo.

### Racha y misiones
- La racha sube al completar al menos un nivel en un día nuevo.
  Un día sin jugar la rompe, salvo que tengas **Escudo de racha** (se gasta solo).
- 3 misiones diarias aleatorias y deterministas por fecha; completar las 3 abre
  el **cofre diario**.

### Inventario
- **Objetos**: Pergamino de pista (elimina 2 opciones), Reloj de arena (+10 s),
  Escudo de racha.
- **Mascotas** (bonus pasivo): Pip (base), Brasa (+15 % monedas),
  Nimbo (+15 % XP), Musgo (+5 s en retos de tiempo).
- **Skins**: capas del héroe en distintos colores.
- **Tienda** con monedas.

### Logros (12)
Primeros pasos, Racha de 3/7 días, Combo ×10, Nivel perfecto, Cazador de Ecos,
Matagigantes (boss), Coleccionista (mascotas), Rico (500 monedas), Héroe nivel 5,
Valle completado, Abrecofres.

---

## 7. Hoja de ruta tras el MVP
- Mundos 2–5 (Puerto Brisa, Desierto de Ámbar, Ciudad Reloj, Cumbres del Eco).
- Ejercicio de escucha (sólo audio) y de dictado.
- Cuentas + sincronización en la nube; ligas semanales.
- PWA instalable con notificaciones de racha.
