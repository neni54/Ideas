# Subtext — Documento de diseño (v2)

> *English, between the lines.* Una app para adultos de 25 a 50 años que ya se defienden
> en inglés (B1–C1) y quieren entender a los nativos de verdad: el sarcasmo, las indirectas,
> el slang y lo que la gente dice cuando quiere decir otra cosa.

La v1 (*Lumora*) era un RPG de fantasía con frases de nivel A1–A2, un único mecanismo
(traducir) y una estética cartoon (monedas, cofres, mascotas). La v2 conserva la base técnica
y la rehace para un público adulto.

---

## 1. Qué se conservó de la v1 y qué cambió

| Se conserva | Cambia |
|---|---|
| Arquitectura `data/ → engine/ → store/ → screens/` | Mundo de fantasía → colecciones temáticas tipo "temporada" |
| Repetición espaciada Leitner (ahora para **todas** las expresiones) | 200 frases A1–A2 → 75 expresiones B1–C1 con ficha didáctica completa |
| Reinserción del fallo en la misma sesión, con **otro** modo | 4 ejercicios de traducción → 9 modos de juego con lógica e interfaz propias |
| Misiones diarias deterministas por fecha | Monedas, cofres, mascotas y skins → XP, títulos, colección y estadísticas |
| Racha con escudos (ahora se ganan, no se compran) | Estética cartoon → editorial oscura (carbón, crema, burdeos, oliva) |
| Dificultad adaptable según las últimas 30 respuestas | Mensajes infantiles → voz ingeniosa y algo sarcástica |
| Guardado seguro en `localStorage`, voz TTS, SFX sintetizados | Se migran nombre, XP y racha del guardado de la v1 |

---

## 2. Contenido

Cada **expresión** (`src/data/types.ts`) es una unidad didáctica completa, y todos los modos
se generan a partir de sus campos. Añadir un pack nuevo es solo añadir datos.

| Campo | Para qué sirve |
|---|---|
| `en` (con `[fragmento]`), `es`, `level` (CEFR), `tags` | La expresión, su traducción natural (España), nivel y registro |
| `context`, `meaning`, `mistake`, `ex` | La ficha: cuándo se usa, matiz real, error típico, otro ejemplo |
| `gist`, `literal`, `wrong[2]` | Significado real vs. trampa literal vs. interpretaciones erróneas |
| `intent`, `scene` | Tono (sincero, sarcástico, pasivo-agresivo…) y la escena que lo da |
| `cue[3]` | Lo que te dicen + dos respuestas poco naturales |
| `chunkWrong[2]` | Casi-aciertos del fragmento ("on the wall" vs "on the fence") |
| `calques[2]` | Lo que diría un hispanohablante traduciendo palabra por palabra |
| `battle[3]` | Situación + expresión rival parecida + la diferencia |

**15 colecciones × 5 expresiones**: Everyday Conversations, Sarcasm & Wit, Dating Disasters,
Things We Say / Things We Mean, Office Politics, Friends & Social Drama, Awkward Situations,
Idioms & Phrasal Verbs, Passive-Aggressive English, American Slang, Red Flags,
Overthinking at 2 AM, Main Character Energy, Pop Culture, Plot Twists.
Todo el contenido es original; no reproduce diálogos ni frases célebres de series o películas.

---

## 3. Modos de juego

| Modo | Mecánica | Interfaz |
|---|---|---|
| What Does It Really Mean? | Significado real vs. traducción literal | Cita editorial grande + opciones A–D |
| Catch the Sarcasm | Escena + frase → elegir el tono | Rejilla de tonos con descripción |
| Literal vs. Natural | Idea en español → elegir la versión nativa | "Borradores" etiquetados como Nativo / Calco |
| What Would You Say? | Te escriben → elige tu respuesta | Chat con estados *online / Read / seen* |
| Context Detective | Situación + prueba → hipótesis | Expediente ("case file") |
| Complete the Conversation | Falta el fragmento exacto | Transcripción con hueco + piezas |
| Phrase Battle | Dos expresiones parecidas, una encaja | Duelo A vs B |
| Quick Fire | 60 s de sí o no (¿suena nativo? / ¿significa esto?) | Temporizador circular, flechas del teclado |
| Memory | Tarjetas que giran + autoevaluación (Ni idea / Me costó / Lo sabía) | Volteo 3D, programación SRS |

Tras cada respuesta, un **panel de veredicto** muestra una frase de la "voz" de la app, la
expresión con audio, el matiz (o la diferencia, o el tono) y, si fallas, el error típico.
"Ficha completa" abre la ficha de la expresión.

---

## 4. Sesiones

- **Sesión de hoy (5 min)**: 8 desafíos = hasta 3 repasos vencidos + 3 nuevas (del nivel CEFR que te toca) + 1 **sorpresa** de una colección bloqueada.
- **Episodio**: las 5 expresiones de una colección, dos veces y en modos distintos, más 2 repasos de otras colecciones.
- **Práctica**: 8 desafíos de un solo modo (desde *Juegos* o desde una colección).
- **Memory** y **Quick Fire**: flujos propios.

---

## 5. Progresión

- **XP** según el nivel CEFR (10/12/15), bonus por racha de aciertos, por terminar, por sesión perfecta, por la sesión diaria y ×1.5 en la *colección de la semana*.
- **Niveles con título**: Tourist → Exchange Student → Expat → Regular → Local → Insider → Smooth Talker → Native-adjacent → Unbothered → Legend. Las colecciones se abren por nivel.
- **Dominio por expresión** (0–5, Leitner: 10 min · 1 d · 3 d · 7 d · 16 d · 45 d). Solo sube si la tarjeta "tocaba": no se puede hacer trampa empollando.
- **Racha diaria** con escudos (se gana uno cada 7 días de racha y otro con el bonus de retos).
- **3 retos diarios** + bonus (XP, escudo y comodines 50/50).
- **16 logros** con nombres en inglés ("Fluent in Sarcasm", "Flawless. Annoyingly.", "2 AM Philosopher"…).
- **Estadísticas**: actividad de 7 días, precisión por modo, progreso por nivel CEFR.

---

## 6. Pantallas y navegación

```
Onboarding (propuesta de valor → intereses → nombre)
  └─ Hoy · Colecciones · Juegos · Frases · Perfil   (navegación inferior)
        Hoy ─▶ Sesión de hoy / Memory / Quick Fire / Colección recomendada
        Colecciones ─▶ Ficha de colección ─▶ Episodio o práctica por modo
        Juegos ─▶ 9 modos
        Frases ─▶ Buscador + filtros ─▶ Ficha de expresión (con mini-reto)
  Juego ─▶ Veredicto ─▶ … ─▶ Resultados ─▶ (Subida de nivel) ─▶ pestaña de origen
```

---

## 7. Servicios de IA (v2.1)

```
Navegador ──/api/translate──▶ server/index.mjs ──▶ Claude Opus 5.5 (o OpenAI) · salida JSON con esquema
          ──/api/tts───────▶                  ──▶ OpenAI gpt-4o-mini-tts · voz + instrucciones de tono
          ──/api/transcribe▶                  ──▶ OpenAI gpt-4o-transcribe
          ──/api/status────▶ qué está configurado (sin revelar claves)
```

- **Por qué OpenAI para la voz:** `gpt-4o-mini-tts` acepta instrucciones de interpretación
  (sarcasmo, coqueteo, frustración, ritmo lento para aprender) en cada petición, suena natural en
  inglés estadounidense, es barato y la misma clave sirve para el reconocimiento de voz.
  ElevenLabs tiene voces excelentes pero exigiría una segunda clave para la transcripción y un
  control de tono menos directo; el adaptador está aislado en `server/providers.mjs` para poder
  cambiarlo.
- **Errores:** cada fallo se traduce a un código (`not_configured`, `provider_auth`,
  `provider_unreachable`, `rate_limited`, `bad_output`, `refused`) con un mensaje en español
  que la interfaz muestra tal cual. Nada falla en silencio.
- **Coste:** caché de audio en disco y memoria, deduplicación de peticiones simultáneas,
  límites por IP y longitud máxima de texto.

---

## 8. Progresión continua y regla de los 3 fallos (v2.2)

Antes, la "Sesión de hoy" era única por día: al terminarla, la tarjeta principal pasaba a
"Done for today" con un "Repetir (sin bonus)" secundario que apenas traía contenido nuevo, y los
resultados no ofrecían una lección siguiente. Ahora:

- **Lecciones ilimitadas.** "Siguiente lección" siempre disponible (resultados y Hoy). El bonus
  de la primera lección del día se mantiene.
- **Regla de los 3 fallos** (`src/engine/gate.ts`): en una sesión de aprendizaje (lección,
  episodio o práctica de cualquier modo) se cuentan las **expresiones distintas falladas al primer
  intento**; las segundas oportunidades nunca suman. Con 0, 1 o 2 se sigue aprendiendo. Con 3 o más
  la sesión termina con normalidad, las falladas quedan para la **medianoche local** y se pausa
  solo el contenido **nuevo** hasta el día siguiente.
- **Durante la pausa** funcionan: lecciones de repaso (solo expresiones ya vistas), Memory,
  Quick Fire, juegos (con lo ya visto), episodios de lo ya conocido, colección, estadísticas,
  traductor y perfil.
- **Al día siguiente** la lección empieza por las expresiones falladas; en cuanto se aciertan
  (o se marcan "Me costó"/"Lo sabía" en Memory) vuelve el contenido nuevo, sin más esperas.
  Si en ese repaso vuelve a haber 3 fallos, se aplica la regla de nuevo.
- **Día local**: se compara la fecha del calendario local (`YYYY-MM-DD`), no 24 h de
  temporizador. La app reevalúa el día a medianoche aunque siga abierta y al volver a primer
  plano. El estado (`reviewLock`) se guarda con el resto del progreso (navegador y nube), así que
  recargar no lo salta ni lo reinicia.
- **Estado por expresión**: Nueva · Aprendiendo · Necesita repaso · Dominada (filtros en Frases).
  Las falladas vuelven antes (Leitner caja 0) y las acertadas se espacian; las dominadas solo
  rellenan una lección cuando no queda nada mejor que practicar.
