# SIDEYE · versión de pruebas en Netlify

> Esta guía es **solo para la versión de pruebas** (rama `claude/nifty-cannon-7o68bx`).
> La versión original (Artifact en claude.ai y rama `claude/dreamy-lamport-hut2jt`) no se toca.
> Copia de seguridad del original: `backups/sideye-original/`.

## Qué se publica

- **La app** (`dist/`): web app / PWA instalable, con service worker, iconos y pantallas de inicio.
- **Las funciones de IA** (`netlify/functions/api.mjs`): `/api/translate`, `/api/tts`,
  `/api/transcribe` y `/api/status`. Usan el mismo código que el servidor (`server/providers.mjs`).
  Las claves viven en Netlify y nunca llegan al móvil.
- No hace falta base de datos: el progreso se guarda en el móvil (y se puede exportar en *Perfil →
  Copia de seguridad*).

## Pasos (una sola vez, unos 10 minutos)

1. Entra en <https://app.netlify.com> con tu cuenta de GitHub.
2. **Add new site → Import an existing project → GitHub** → elige `neni54/Ideas`.
3. En **Branch to deploy** elige **`claude/nifty-cannon-7o68bx`**. El resto (comando de build,
   carpeta `dist`, funciones) lo lee de `netlify.toml`: no cambies nada.
4. En **Environment variables** (o después en *Site configuration → Environment variables*) añade:

   | Variable | Valor |
   |---|---|
   | `OPENAI_API_KEY` | tu clave de OpenAI (voz y pronunciación) |
   | `ANTHROPIC_API_KEY` | tu clave de Anthropic (traductor con Claude; opcional) |
   | `ACCESS_CODE` | un código que inventes, para que nadie más gaste tu saldo |
   | `TRANSLATE_EFFORT` | `low` (traducciones más rápidas; ver "Límites") |

5. **Deploy**. En 2-3 minutos tendrás `https://NOMBRE.netlify.app`. Puedes cambiar el nombre en
   *Site configuration → Change site name*.
6. Comprueba `https://NOMBRE.netlify.app/api/status`: `translate`, `tts` y `stt` deben decir
   `"ready": true`.

Cada cambio que se suba a esa rama se publica solo, y la app instalada muestra *Nueva versión ·
Actualizar*.

## Instalar en el iPhone

1. Abre el enlace en **Safari**.
2. **Compartir → Añadir a pantalla de inicio → Añadir**.
3. Abre SIDEYE desde el icono y juega desde ahí (en iPhone, el progreso de Safari y el de la app
   instalada van por separado).

## Límites y costes (comprobar en netlify.com/pricing)

- Netlify tiene plan gratuito para proyectos personales. No he podido consultar hoy sus páginas de
  precios ni de límites; revisa allí las cifras actuales.
- **Tiempo por petición:** las funciones normales de Netlify cortan a los ~10 segundos por defecto
  (dato que conozco, no verificado hoy). La voz y la pronunciación tardan menos. Una traducción con
  Claude puede acercarse a ese límite; por eso se recomienda `TRANSLATE_EFFORT=low`. Si aun así ves
  "Error del servidor", la alternativa es el servidor completo en Render (`render.yaml`).
- **Coste de API:** el mismo que en `docs/WEB_APP_MOVIL.md` (céntimos por sesión de práctica).
- En Netlify la caché de audios solo dura mientras la función está "caliente"; algunas frases se
  pueden volver a generar (coste mínimo).
