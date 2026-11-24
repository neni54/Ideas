# SIDEYE en tu móvil (web app / PWA)

SIDEYE funciona como una app instalada en iPhone y Android desde un enlace HTTPS,
sin App Store y sin abrir Claude. Esta guía explica cómo publicarla, instalarla, cuánto cuesta
y qué está comprobado.

## Cómo está montada

```
Móvil (Safari / Chrome, o icono en la pantalla de inicio)
  │  app instalada: HTML + JS + fuentes + iconos guardados en el móvil (service worker)
  │  progreso: en el propio móvil (localStorage)
  ▼ HTTPS
Servidor SIDEYE (Node, server/index.mjs) en Render
  ├─ sirve la app (comprimida con brotli/gzip)
  └─ /api/translate · /api/tts · /api/transcribe   ← aquí, y solo aquí, viven las claves
        ▼
     OpenAI (voz y reconocimiento de voz) · Anthropic Claude (traductor)
```

| Pieza | ¿Hace falta? | Qué es |
|---|---|---|
| Alojamiento con HTTPS | Sí | Render (gratis o 7 USD/mes). Cualquier hosting de Node 20+ sirve. |
| Backend | Sí, ya existe | `server/index.mjs`. Protege las claves, limita peticiones por IP y guarda en caché los audios. |
| Base de datos | No | El progreso se guarda en cada móvil. No hay cuentas. |
| Almacenamiento de archivos | No | Los audios generados se cachean en el servidor; si se borran, se vuelven a generar. |
| API de voz y pronunciación | Sí, para la voz IA | OpenAI (`OPENAI_API_KEY`). Sin ella, la app usa la voz del móvil (si lo permites en Perfil). |
| API de traducción | Recomendada | Anthropic (`ANTHROPIC_API_KEY`, Claude). Si solo pones la de OpenAI, traduce con OpenAI. |

Las claves **no** llegan nunca al navegador: el móvil solo habla con tu servidor.

## 1. Publicar (unos 10 minutos, una sola vez)

1. Entra en [render.com](https://render.com) y regístrate con tu cuenta de GitHub.
2. **New → Blueprint** → elige el repositorio `neni54/Ideas` y la rama
   **`claude/nifty-cannon-7o68bx`** (el repositorio no tiene rama `main`).
3. Render lee `render.yaml` y te pide tres valores:
   - `OPENAI_API_KEY`: de <https://platform.openai.com/api-keys>.
   - `ANTHROPIC_API_KEY`: de <https://console.anthropic.com/settings/keys> (opcional).
   - `ACCESS_CODE`: inventa un código (por ejemplo `sideye-2026`). Quien abra el enlace lo
     escribirá una vez al usar la voz o el traductor. Así nadie más gasta tu saldo. Puedes
     dejarlo vacío para acceso libre.
4. **Apply**. A los 3-5 minutos tendrás tu enlace: `https://sideye-XXXX.onrender.com`.
5. Comprueba `https://TU-ENLACE/api/status`: `translate`, `tts` y `stt` deben decir `"ready": true`.

Cada vez que se suba código nuevo a esa rama, Render vuelve a publicar solo. La app instalada
en el móvil muestra **"Nueva versión de SIDEYE · Actualizar"**, y al pulsarlo se actualiza sin
perder el progreso.

## 2. Instalar en el móvil

**iPhone (Safari):**
1. Abre el enlace en **Safari** (no en Chrome ni dentro de otra app).
2. Toca **Compartir** (el cuadrado con la flecha) → **Añadir a pantalla de inicio** → **Añadir**.
3. Abre SIDEYE desde el icono. Se abre a pantalla completa, con su pantalla de inicio.
4. Importante: en iPhone, la app instalada guarda el progreso aparte de Safari.
   **Instala primero y juega desde el icono.**

**Android (Chrome):**
1. Abre el enlace en Chrome.
2. Pulsa **Instalar app** en la tarjeta de la pestaña *Hoy* (o en *Perfil*), o en el menú **⋮ →
   Instalar aplicación**.
3. SIDEYE aparece en el cajón de aplicaciones como cualquier otra app.

La app también indica estos pasos en *Hoy* (tarjeta "Instala SIDEYE") y en *Perfil*.

## 3. Costes orientativos

| Servicio | Coste |
|---|---|
| Render plan Free | 0 USD. El servidor "duerme" tras 15 min sin uso; la app instalada abre igual al instante (está en el móvil), pero la primera voz o traducción tras la pausa tarda unos 30-60 s. |
| Render plan Starter | 7 USD/mes. Siempre despierto. Recomendado si lo usarán otras personas. |
| OpenAI voz (`gpt-4o-mini-tts`) | Céntimos: una frase de 3 s cuesta del orden de 0,001 USD, y cada frase se genera una sola vez porque queda en caché. |
| OpenAI pronunciación (`gpt-4o-transcribe`) | Unos 0,006 USD por minuto de grabación (cada intento dura segundos). |
| Claude Opus 5.5 (traductor) | 4 USD por millón de tokens de entrada y 20 USD por millón de salida: del orden de 1-2 céntimos por traducción. |

Para pruebas personales, el gasto de API suele quedarse en unos pocos dólares al mes. Pon un
límite de gasto en las consolas de OpenAI y Anthropic. Los precios de OpenAI cambian: consulta
<https://openai.com/api/pricing>.

## 4. Qué incluye la versión web

- **Diseño móvil**: pensada para una mano; botones de al menos 44 px de alto; el botón
  *Continuar* de cada respuesta siempre queda a mano, también en pantallas pequeñas; sin
  desplazamiento horizontal de 320 px en adelante; funciona en vertical y en horizontal.
- **PWA**: manifest, iconos (192, 512, 1024, maskable, Apple), pantallas de inicio para 12 tamaños
  de iPhone, modo standalone, tarjeta de instalación para Android e iPhone.
- **Service worker**: la app abre al instante y sin conexión (el juego y el progreso funcionan
  offline; voz IA y traductor necesitan internet).
- **Actualizaciones**: cada publicación crea una versión nueva; la app avisa y se actualiza al
  pulsar *Actualizar*, sin perder el progreso.
- **Carga**: fuentes incluidas en la app (sin Google Fonts), código dividido en dos paquetes y
  compresión brotli: la primera carga baja de ~720 KB a ~320 KB.
- **Audio en iPhone**: el audio se "desbloquea" con el primer toque, como exige Safari, para
  que la voz IA suene aunque llegue tras una petición de red.
