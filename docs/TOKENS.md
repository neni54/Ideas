# SIDEYE TOKENS · EXTRA CHANCE · THE BADGE SHOP

> Solo en la **versión de pruebas** (https://sideye27.netlify.app, rama `claude/nifty-cannon-7o68bx`).
> El Artifact original no tiene esta función. Copia de la versión anterior: `backups/test-antes-de-tokens/`.

## Reglas

| | |
|---|---|
| **Ganar** | +1 token por cada **lección del día** o **episodio de colección** terminado **sin ningún error** (todas las respuestas bien a la primera). |
| **Una vez por lección** | Cada lección tiene un identificador: un episodio es siempre la misma lección (`episode:<colección>`) y una lección del día se identifica por el conjunto exacto de frases que contiene (`daily:<hash>`). Si esa lección ya pagó su token, repetirla no da otro; la app lo dice en los resultados. |
| **No cuentan** | Juegos de práctica sueltos, Quick Fire, Memory, The Unexpected Twist y Voice Acting. |
| **Nunca** | Los tokens no caducan, los errores no los quitan y no se compran con dinero. |
| **Gastar** | EXTRA CHANCE: 1 token. Un escudo de THE BADGE SHOP: 10 tokens. |

Los tokens se calculan dentro de la misma función que ya cerraba cada lección (`finishRun` en
`src/store/game.ts`), con los mismos aciertos y errores que usa el resto del juego. No hay un sistema paralelo.

## EXTRA CHANCE

- Aparece el día en que se activa el bloqueo de 3 errores: en la pantalla de resultados y en *Hoy*.
- Dos opciones: **EXTRA CHANCE — USE 1 TOKEN** y **WAIT UNTIL TOMORROW**.
- Al usarla se descuenta exactamente 1 token y se abre **una lección más hoy**, que puede incluir contenido nuevo.
- **El bloqueo original no cambia:**
  - los errores del día, el repaso pendiente de mañana y las estadísticas se mantienen;
  - la oportunidad solo decide si la siguiente lección puede incluir frases nuevas (`gateWithChance` en `src/engine/gate.ts`).
- Al terminar esa lección, la oportunidad se gasta.
  - Si vuelves a llegar a 3 errores, o simplemente quieres otra lección, puedes usar otro token.
  - Solo puede haber una oportunidad pendiente a la vez: una doble pulsación nunca gasta dos tokens.
- Sin saldo, el botón está desactivado y se explica que toca esperar a mañana.
- Si compras una oportunidad y no la usas ese día, al día siguiente se **devuelve** el token, y queda en el historial.

## THE BADGE SHOP · AMERICA COLLECTION

- 10 escudos originales en SVG (`src/data/badges.tsx`):
  NEW YORK, SAN FRANCISCO, ROUTE 66, GRAND CANYON, NYC TAXI, AMERICAN DINER, HOLLYWOOD,
  LAS VEGAS, BROOKLYN y AMERICAN BASEBALL.
  - Cada uno tiene su propia ilustración.
  - Acabado de parche bordado o de pin esmaltado.
  - Paleta: carbón, crema, burdeos y oro envejecido.
- Precio único: 10 tokens.
- Al tocar un escudo se abre la vista ampliada: nombre, precio y saldo. Hay que confirmar antes de que se descuente nada.
- Comprados una vez, son tuyos para siempre. No se pueden comprar dos veces.
- **MY BADGE COLLECTION** muestra los 10: los tuyos en color y los que faltan bloqueados, pero visibles.
- Son solo coleccionables: no son logros del perfil y no dan XP ni ventajas.

## MY TOKENS

- La pastilla con el saldo aparece en *Hoy* y en THE BADGE SHOP. Al tocarla se abre MY TOKENS:
  - el saldo;
  - las reglas;
  - el historial de movimientos, con su motivo y su fecha.

## Datos

- Todo se guarda en el dispositivo, con el progreso del juego (`localStorage`, clave `subtext-save-v1`):
  - `tokens`: el saldo;
  - `tokenLog`: el historial (los últimos 80 movimientos);
  - `tokenAwards`: las lecciones que ya han pagado su token;
  - `badges`: los escudos comprados;
  - `extraChance`: la oportunidad pendiente.
- Entran en la copia de seguridad de *Perfil*.
- Sin cuentas, sin APIs, sin pagos.

## Pruebas

- `bash tests/run-tokens-tests.sh`: 29 comprobaciones en un iPhone emulado.
  - Lección perfecta: +1 exacto.
  - Lección con 1 error: 0.
  - Repetir una lección: 0.
  - Bloqueo de 3 errores.
  - EXTRA CHANCE:
    - descuenta exactamente 1, también con doble pulsación;
    - la lección extra funciona;
    - los errores y las estadísticas se mantienen;
    - sin saldo no deja gastar.
  - Escudos:
    - no se descuenta nada antes de confirmar;
    - se descuentan exactamente 10;
    - no se compran dos veces;
    - aparecen en la colección.
  - Los datos se conservan al cerrar y abrir.
  - La devolución de la oportunidad sin usar.
  - Sin errores en la página.
- `npm run test:gate`, `npm run test:api` y `bash tests/run-mobile-tests.sh`: el resto de SIDEYE.
