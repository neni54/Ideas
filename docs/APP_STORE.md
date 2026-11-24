# SIDEYE en la App Store: guía paso a paso

SIDEYE ya está preparada como app de iOS con [Capacitor](https://capacitorjs.com). La interfaz
(React) va dentro de la app y las funciones de IA (traducción, voz y pronunciación) llaman a
tu servidor publicado. Las claves de API se quedan en ese servidor y nunca van dentro de la app.

```
iPhone (app SIDEYE)  ──HTTPS──▶  servidor SIDEYE (Render)  ──▶  OpenAI / Anthropic
   juego + progreso local            /api/translate, /api/tts, /api/transcribe
```

Hay tres formas de compartirla, de la más rápida a la más lenta:

| Cómo | Qué necesitas | Quién puede usarla |
|---|---|---|
| **1. Enlace web** (se instala desde Safari) | Solo publicar el servidor (paso 1) | Cualquiera con el enlace, también desde Android |
| **2. TestFlight** (beta de Apple) | Mac + cuenta de Apple Developer (99 $/año) | Hasta 10 000 personas con un enlace público |
| **3. App Store** | Lo mismo que TestFlight + la revisión de Apple | Todo el mundo |

---

## Paso 1. Publicar el servidor (para las tres opciones)

1. Crea una cuenta en [render.com](https://render.com) y conecta tu GitHub.
2. **New → Blueprint** y elige este repositorio. Render lee `render.yaml`.
3. Cuando te lo pida, pega `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`.
4. Al terminar tendrás una URL como `https://sideye.onrender.com`. Ábrela: es la app web.
5. Comprueba `https://TU-URL/api/status`: los tres servicios deben salir `"ready": true`.

> El plan gratuito de Render "duerme" el servidor tras 15 minutos sin uso, y la primera
> petición después tarda unos 30 segundos. Para la App Store conviene el plan de pago más
> barato, porque un revisor de Apple que espera 30 segundos puede rechazar la app.

**Compartir ya (opción 1):** manda la URL. En iPhone: Safari → Compartir → *Añadir a pantalla de
inicio*. Se abre a pantalla completa con su icono, como una app.

---

## Paso 2. Preparar la app de iOS

Necesitas un **Mac con Xcode** (gratis en la Mac App Store) y Node 20 o superior.

```bash
git clone <este repositorio> && cd Ideas
npm install
cp .env.ios.example .env.ios       # pon en VITE_API_BASE la URL del paso 1
npm run ios:sync                   # compila la web y la copia al proyecto de Xcode
npm run ios:open                   # abre Xcode
```

En Xcode:

1. En el panel izquierdo, pulsa **App** y luego la pestaña **Signing & Capabilities**.
2. **Team**: elige tu cuenta de Apple Developer.
3. **Bundle Identifier**: cámbialo de `app.sideye.ios` a uno tuyo, por ejemplo
   `com.tunombre.sideye`. Debe ser único en todo el mundo. Cámbialo también en
   `capacitor.config.ts` para que coincidan.
4. Elige un iPhone en la barra superior y pulsa ▶ para probarla en el simulador o en tu iPhone.

Cada vez que cambies código web: `npm run ios:sync` y vuelve a pulsar ▶.

### Lo que ya está configurado

- Icono de 1024×1024 sin transparencia y pantalla de inicio con los colores de SIDEYE.
- Permiso de micrófono con su texto explicativo (Apple rechaza la app si falta).
- `ITSAppUsesNonExemptEncryption = NO`, para que no te pregunte por cifrado en cada subida.
- Solo iPhone y en vertical (menos capturas que preparar; en iPad funciona en modo iPhone).
- Idioma principal: español.
- El servidor acepta peticiones de la app (CORS para `capacitor://localhost`).
- Páginas de [privacidad](../public/privacy.html) y [soporte](../public/support.html), servidas
  en `https://TU-URL/privacy.html` y `https://TU-URL/support.html`.
  **Antes de enviar:** cambia `soporte@example.com` en `public/support.html` por tu correo.

---

## Paso 3. Darte de alta en Apple

1. Apúntate al [Apple Developer Program](https://developer.apple.com/programs/enroll/)
   (99 USD al año). Como particular, la app aparecerá con tu nombre.
2. En [App Store Connect](https://appstoreconnect.apple.com) → **Apps → +** → *Nueva app*:
   - Plataforma: iOS · Nombre: `SIDEYE` (si está cogido, prueba `SIDEYE: English Subtext`)
   - Idioma principal: Español (España) · Bundle ID: el del paso 2 · SKU: `sideye-001`

---

## Paso 4. Subir una versión (TestFlight)

1. En Xcode, arriba elige **Any iOS Device (arm64)**.
2. Menú **Product → Archive**. Al acabar se abre el *Organizer*.
3. **Distribute App → App Store Connect → Upload**. Deja las opciones por defecto.
4. A los 10-30 minutos aparece en App Store Connect → **TestFlight**.

**Compartir por TestFlight (opción 2):** TestFlight → *Pruebas externas* → crea un grupo →
añade la versión. Apple hace una revisión corta (normalmente menos de un día). Después activa
**Enlace público** y compártelo. Quien lo abra instala TestFlight y luego SIDEYE.

Para la siguiente versión, sube el número de **Build** en Xcode (App → General → Build: 2, 3…).

---

## Paso 5. Ficha de la App Store

Textos listos para pegar (puedes cambiarlos):

- **Subtítulo** (30 caracteres): `El inglés que no está en libros`
- **Texto promocional:** `Sarcasmo, indirectas y slang: entiende lo que de verdad quieren decir.`
- **Palabras clave** (100 caracteres):
  `ingles,aprender,idiomas,slang,sarcasmo,expresiones,frases,vocabulario,pronunciacion,B2,C1`
- **Descripción:**

  > YOU KNOW THE WORDS. NOW GET THE MEANING.
  >
  > Sabes inglés, pero cuando alguien dice "That's an interesting choice", ¿sabes que no le
  > gusta nada? SIDEYE te enseña el inglés que no viene en los libros: sarcasmo, indirectas,
  > slang, humor, oficina y conversaciones reales.
  >
  > • Lecciones de 5 minutos con repaso inteligente
  > • 11 modos de juego: Catch the Sarcasm, Literal vs. Natural, Context Detective…
  > • Traductor con IA que conserva el tono, el sarcasmo y el registro
  > • Voz natural en cada frase, a velocidad normal o lenta
  > • Practica tu pronunciación y comprueba si se te entiende
  > • Racha, niveles, logros y estadísticas
  >
  > Para adultos de nivel B1 a C1. Sin cuentas ni anuncios. Tu progreso se queda en tu iPhone.

- **Categoría:** Educación (secundaria: Juegos → Educativos)
- **URL de soporte:** `https://TU-URL/support.html`
- **URL de política de privacidad:** `https://TU-URL/privacy.html`
- **Capturas:** iPhone de 6,9" (1320×2868 o 1290×2796). Mínimo 3. Hazlas en el simulador del
  iPhone 16 Pro Max con ⌘S. Buenas pantallas: inicio, una lección, el traductor, el perfil.
- **Clasificación por edad:** responde *ninguno* a todo, salvo "Lenguaje vulgar u obsceno /
  humor crudo": márcalo como *poco frecuente/leve* si alguna expresión es malsonante.
- **Precio:** Gratis (o el que quieras en *Precios y disponibilidad*).

### Privacidad de la app (las "etiquetas nutricionales")

App Store Connect → *Privacidad de la app*. Respuestas que encajan con lo que hace SIDEYE:

- **¿Recopilas datos?** Sí.
  - **Datos de audio** (grabaciones de pronunciación) → *Funcionalidad de la app* · no vinculados
    a la identidad · no se usan para rastreo.
  - **Otro contenido del usuario** (textos del traductor) → lo mismo.
- No hay rastreo, ni analítica, ni publicidad, ni datos de contacto.

### Notas para el revisor

En *Información de la revisión de la app*:

> SIDEYE no requiere cuenta. Para probar: pulsa "Empezar", completa la introducción y juega una
> lección. El traductor está en la pestaña Traductor. La voz se activa con el icono de altavoz de
> cada frase. La práctica de pronunciación pide permiso de micrófono solo al pulsar grabar. Las
> funciones de IA necesitan conexión a internet.

Después pulsa **Añadir para revisión → Enviar**. Apple suele responder en 24-48 horas.

---

## Problemas típicos de revisión y cómo evitarlos

| Motivo de rechazo | Cómo está cubierto |
|---|---|
| 2.1 La app no funciona o falla | Servidor en plan de pago, sin "dormir". Revisa `/api/status` antes de enviar. |
| 4.2 Funcionalidad mínima ("es solo una web") | SIDEYE tiene juego offline, progreso local, micrófono y voz: es una app completa. |
| 5.1.1 Falta la política de privacidad o el permiso no se explica | `privacy.html` y el texto `NSMicrophoneUsageDescription` ya están. |
| 1.5 Falta un contacto de soporte | Pon tu correo real en `public/support.html`. |

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run ios:sync` | Compila la web con la URL de `.env.ios` y la copia a `ios/` |
| `npm run ios:open` | Abre el proyecto en Xcode |
| `npm run build` / `npm run serve` | Web y servidor (lo que ejecuta Render) |
