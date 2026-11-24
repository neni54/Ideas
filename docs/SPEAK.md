# SIDEYE SPEAK · versión gratuita (v1)

> *Don't just understand it. Say it.*
>
> Solo en la **versión de pruebas** (Netlify, rama `claude/nifty-cannon-7o68bx`).
> El Artifact original y su rama no tienen esta función.

## Qué incluye

| Parte | Qué hace | Con qué funciona |
|---|---|---|
| **Voz y ajustes** | Lista las voces en inglés instaladas en el dispositivo (EE. UU. primero), muestra de cada una, voz automática o elegida, velocidad (lenta / normal / rápida) y lectura automática en conversaciones. La elección se guarda en el dispositivo y se usa también en el resto de SIDEYE cuando suena la voz del dispositivo. | `speechSynthesis` del navegador |
| **Pronunciación** | Frase aprendida → escuchar (normal / despacio) → traducción y explicación → repetir por voz o por escrito → comparación palabra a palabra (coincide / diferente / no aparece / de más) → consejos → "Grabarme y comparar" (oír el original y luego tu voz). | Voces del dispositivo + reconocimiento del navegador (si existe) + micrófono para la grabación local |
| **Conversaciones guiadas** | 7 situaciones (small talk, amigos, trabajo, sarcasmo, situaciones incómodas, citas, inglés americano cotidiano) con **52 rutas** en total. Respuesta tocando una opción, por voz o por escrito; explicación de cada respuesta y de los dobles sentidos; "Dila en voz alta"; al final, las expresiones usadas y "Practicar estas frases". Las conversaciones con expresiones que ya conoces salen primero. | Diálogos preparados (no hay IA generativa) |

## Lo que NO hace (y la app lo dice)

- **No evalúa la pronunciación.** Compara las palabras que el navegador ha reconocido con la frase.
  No analiza fonemas ni acento y no da porcentajes de pronunciación. Muestra "N de M palabras
  reconocidas" porque es un recuento real de palabras, no una nota.
- **No es una IA.** Las conversaciones están escritas de antemano y ramificadas.
- **No inventa voces ni géneros.** Solo lista voces que el dispositivo tiene. El género aparece solo para
  nombres de voces conocidos con certeza (Samantha, Aaron, Daniel…); las demás son "Voice 1, Voice 2…".
  Las voces de efectos (Bubbles, Zarvox…) no se listan.

## Privacidad y costes

- Sin claves API, sin servicios de pago, sin endpoints nuevos. SPEAK no hace ninguna petición a
  nuestro servidor ni a terceros.
- SIDEYE no graba ni envía audio a ningún sitio.
  - "Grabarme y comparar" guarda la grabación solo en la memoria del dispositivo. Se borra al pasar de frase o salir.
  - El micrófono se libera al terminar.
- El **reconocimiento de voz** lo hace el propio navegador. Safari usa el dictado de Apple y Chrome el
  servicio de Google, que pueden procesar el audio en sus servidores según el dispositivo. La app lo
  explica en la pantalla de SPEAK, y la respuesta escrita está siempre disponible.

## Sin conexión

| Función | ¿Sin internet? |
|---|---|
| Abrir SPEAK, frases, explicaciones, conversaciones y rutas | Sí (todo está dentro de la app) |
| Voces del dispositivo, muestras y velocidad | Sí, con las voces instaladas en el iPhone. Algunas voces "mejoradas" pueden necesitar descarga previa. |
| Comparación palabra a palabra y consejos | Sí |
| Respuesta escrita | Sí |
| "Grabarme y comparar" | Sí |
| Reconocimiento de voz | Depende del navegador: Chrome necesita internet; Safari puede necesitarla según el modelo y el idioma. Si falla, la app pasa a la respuesta escrita. |

## iPhone: limitaciones del reconocimiento de voz

- Safari en iPhone tiene `webkitSpeechRecognition` (iOS 14.5 o posterior), pero **no siempre funciona**:
  - En la **app instalada en la pantalla de inicio** suele fallar con un error de servicio.
  - También necesita que **Siri / Dictado** estén activados en el iPhone.
- La app no da por hecho que funcione. Lo comprueba la primera vez que pulsas "Hablar". Si falla:
  - lo recuerda en ese dispositivo y oculta el botón;
  - muestra un mensaje claro, sin códigos técnicos;
  - ofrece la respuesta escrita y "Grabarme y comparar".
- Permiso del micrófono: Ajustes del iPhone → Safari → Micrófono (o el aviso que aparece al pulsar "Hablar").

## Pruebas realizadas (simuladas, no en un iPhone real)

En Chromium emulando un iPhone 15, con un motor de voz simulado como el de iOS (las voces llegan con
retraso) y tres escenarios de reconocimiento: funciona, no existe y falla.

- Voces: lista, géneros, "Voice N", exclusión de voces de efectos y de idiomas no ingleses, muestra,
  elección guardada tras recargar.
- Velocidad aplicada.
- Pronunciación por voz y por escrito, con la comparación.
- Conversación: por toque, por voz y por texto; respuesta no reconocida; final de ruta; práctica desde la conversación.
- Sin peticiones de red de SPEAK y sin errores en la página.

Pendiente de probar en un iPhone real: el reconocimiento de Safari y de la app instalada, el permiso de
micrófono, las voces reales del dispositivo y "Grabarme y comparar".

## Archivos

- `src/speak/voices.ts`: voces del dispositivo, etiquetas y preferencias.
- `src/speak/recognition.ts`: reconocimiento del navegador con detección real de soporte.
- `src/speak/compare.ts`: comparación palabra a palabra y consejos.
- `src/speak/dialogues.ts`: las 7 conversaciones ramificadas.
- `src/speak/recorder.ts`: "Grabarme y comparar" (solo en memoria).
- `src/speak/player.ts`: reproducción con la voz del dispositivo y navegación.
- `src/screens/Speak.tsx`: pantallas.
- `src/components/SpeakEntry.tsx`: accesos desde *Hoy* y *Juegos*.
