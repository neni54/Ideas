# Subtext

*English, between the lines.* Una app para aprender el inglés que no viene en los libros:
sarcasmo, indirectas, slang, citas, oficina y conversaciones reales. Para adultos, de B1 a C1.

> Diseño, contenido, mecánicas y qué cambió respecto a la v1: [`docs/DISENO.md`](docs/DISENO.md)

## Ejecutar

```bash
npm install
cp .env.example .env      # y rellena las claves (ver abajo)
npm start                 # build + servidor en http://localhost:8787
```

Desarrollo con recarga en caliente: `npm run dev:api` (servidor de IA, puerto 8787) y, en otra
terminal, `npm run dev` (Vite, http://localhost:5173, que reenvía `/api` al servidor).

## Servicios de IA (traducción, voz y pronunciación)

Las claves **solo** viven en el servidor (`.env`, que está en `.gitignore`). El navegador nunca
las ve: habla con `server/index.mjs` por `/api/*`.

| Variable | Para qué | Dónde conseguirla |
|---|---|---|
| `OPENAI_API_KEY` | Voz en inglés (`gpt-4o-mini-tts`) y reconocimiento de voz para la práctica de pronunciación (`gpt-4o-transcribe`) | https://platform.openai.com/api-keys (empieza por `sk-`) |
| `ANTHROPIC_API_KEY` | Traductor con IA (Claude Opus 5.5) | https://console.anthropic.com/settings/keys (empieza por `sk-ant-`) |

- Si solo pones `OPENAI_API_KEY`, el traductor usa OpenAI (`TRANSLATE_PROVIDER=openai`).
- Sin claves la app funciona igual (el juego no depende de ellas); el traductor muestra qué falta,
  y la voz usa la del dispositivo **solo si lo permites en Perfil → Ajustes**, siempre etiquetada.
- Estado en vivo: `GET /api/status` y Perfil → Servicios de IA.

**Cómo funciona la voz:** cada botón de altavoz pide el audio a `/api/tts` con el texto en inglés
y un *tono* (sarcástico, divertido, molesto, coqueto, profesional…) derivado de la expresión; el
modelo recibe instrucciones de entonación para sonar como un hablante estadounidense natural. El
botón 0.7× pide una toma lenta (no acelerada artificialmente). Los audios se guardan en caché en
el servidor (`.cache/tts`, memoria + disco) y en el navegador, y las peticiones idénticas
simultáneas se agrupan en una sola llamada. Una barra global permite pausar, reanudar, repetir y
muestra cualquier error.

**Pronunciación:** graba con el micrófono, transcribe con reconocimiento de voz real y compara
palabra por palabra con la frase objetivo. Mide si se te entiende; no es una evaluación fonética.

**Despliegue:** cualquier hosting de Node ≥ 20.12 (Render, Railway, Fly.io, un VPS…): define las
variables de entorno en el panel del proveedor, ejecuta `npm install && npm run build` y arranca
con `npm run serve`. Una copia estática (como `npm run build:single`) no tiene servidor y, por
tanto, no tiene traducción ni voz IA.

## Qué incluye

- **75 expresiones originales en 15 colecciones**, cada una con traducción natural, nivel CEFR,
  contexto, matiz, tono, error típico, ejemplo extra, rival parecida y mini-reto.
- **9 modos de juego**: What Does It Really Mean?, Catch the Sarcasm, Literal vs. Natural,
  What Would You Say?, Context Detective, Complete the Conversation, Phrase Battle, Quick Fire
  y Memory.
- **Lecciones continuas de 5 minutos** (repasos, novedades y una sorpresa) sin límite diario;
  solo una lección con 3 fallos pausa el contenido nuevo hasta el día siguiente, que empieza
  repasando lo fallado; frase del día;
  colección de la semana; retos diarios; resumen semanal.
- **Traductor con IA** (inglés ↔ español de España) que conserva tono, sarcasmo y registro,
  explica idioms y doble sentido, da la traducción literal que *no* hay que usar y alternativas.
- **Voz IA natural** en cada frase en inglés: normal, lenta, pausa/reanudar, repetir y
  conversaciones completas con dos voces; práctica de pronunciación con reconocimiento de voz.
- **Progresión**: XP, niveles con título, dominio por expresión con repetición espaciada,
  racha con escudos, comodines 50/50, 16 logros y estadísticas por modo y por nivel CEFR.

## Pruebas

```bash
npm run test:gate   # progresión y regla de los 3 fallos en 5 zonas horarias
npm run test:api    # servidor de IA contra un proveedor simulado (sin coste)
```

## Añadir contenido

Crea un pack en `src/data/packs/` con `pack({...}, [...expresiones])` y añádelo a la lista de
`src/data/content.ts`. Todos los modos se generan solos a partir de los campos de cada expresión.
