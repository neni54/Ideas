# THE BADGE SHOP · cómo ampliar el catálogo

> Versión de pruebas. Para añadir contenido basta con añadir **datos e ilustraciones**: los tokens,
> las compras y MY BADGE COLLECTION no se tocan.

## Dónde está cada cosa

| Archivo | Qué contiene | ¿Se toca al añadir escudos? |
|---|---|---|
| `src/badges/collections/<colección>.tsx` | La colección y sus escudos (datos + ilustración SVG) | **Sí** |
| `src/badges/catalog.ts` | La lista de colecciones (`COLLECTION_MODULES`), la validación y la regla de compra | Solo para dar de alta una colección nueva (una línea) |
| `src/badges/types.ts` | Qué campos tiene un escudo y una colección | No |
| `src/badges/BadgeArt.tsx` | El marco común (parche bordado o pin esmaltado, cinta con el nombre, número, bloqueo) | No |
| `src/badges/palette.ts` | Colores SIDEYE: carbón, crema, burdeos, oro envejecido | No |
| `src/screens/Shop.tsx`, `src/store/game.ts` | Tienda, colección personal, compras | No |

## Campos de un escudo

| Campo | Obligatorio | Para qué |
|---|---|---|
| `id` | Sí | Identificador **único y permanente** en todo el catálogo. Las compras se guardan por este id: no se reutiliza ni se renombra nunca. |
| `name` | Sí | Nombre en inglés, en mayúsculas (aparece en la cinta). |
| `collection` | Sí | `id` de su colección. |
| `no` | Sí | Número dentro de la colección (No. 01…). |
| `subject` | Sí | Qué representa, en español (subtítulo). |
| `description` | Sí | Texto de la vista ampliada, en español. |
| `art` | Sí | Ilustración SVG dibujada en una caja de 120 × 120. |
| `price` | No | Precio en tokens. Por defecto, el de la colección (10 en AMERICA). |
| `status` | No | `available` (a la venta), `coming-soon` (se ve como "Próximamente", no se puede comprar) o `retired` (ya no se vende; solo lo ve quien lo tiene). Por defecto, el de la colección o `available`. |
| `shape` | No | `shield`, `circle` o `arch`. |
| `finish` | No | `patch` (bordado) o `pin` (esmaltado). |

## Añadir un escudo a una colección existente

En `src/badges/collections/america.tsx`, añadir un objeto al final de `badges`:

```tsx
{
  id: 'chicago',                    // nuevo y único
  no: 11,
  name: 'CHICAGO',
  collection: 'america',
  subject: 'The Bean y el skyline',
  description: 'Cloud Gate refleja el skyline de la Windy City.',
  shape: 'circle',
  finish: 'pin',
  // status: 'coming-soon',         // opcional: visible pero todavía no se vende
  art: (
    <>
      {/* SVG en una caja de 120 × 120, con los colores de C (palette.ts) */}
    </>
  ),
},
```

Aparece solo en THE BADGE SHOP y en MY BADGE COLLECTION.

## Crear una colección nueva

1. Crear `src/badges/collections/west-coast.tsx`:

   ```tsx
   import type { CollectionModule } from '../types';
   import { C, S } from '../palette';

   export const westCoast: CollectionModule = {
     collection: {
       id: 'west-coast',
       name: 'WEST COAST COLLECTION',
       tagline: 'Sun, surf and fog.',
       description: 'Escudos de la costa oeste de Estados Unidos.',
       price: 10,
       // status: 'coming-soon',     // toda la colección como "Próximamente"
     },
     badges: [ /* escudos como arriba, con collection: 'west-coast' */ ],
   };
   ```

2. Darla de alta en `src/badges/catalog.ts`:

   ```ts
   import { westCoast } from './collections/west-coast';
   const COLLECTION_MODULES: CollectionModule[] = [america, westCoast];
   ```

Con más de una colección, la tienda muestra filtros por colección y el progreso de cada una.

## Garantías

- **Las compras se conservan:** se guardan por id de escudo en el dispositivo. Añadir colecciones no las toca.
- **Sin duplicados:**
  - `buildCatalog` detecta ids repetidos (de escudo o de colección), números repetidos en una colección, precios inválidos y colecciones mal escritas;
  - un id duplicado nunca se vende dos veces;
  - un escudo ya comprado no se puede volver a comprar.
- **Una sola regla de compra** (`canBuy` en `catalog.ts`): no lo tiene ya, está a la venta y hay saldo suficiente.
- Para comprobar el catálogo después de añadir contenido: `npm run test:badges`.

## Pedir escudos nuevos

Basta con decirle a Claude, por ejemplo:

> "Añade a THE BADGE SHOP una colección WEST COAST con MALIBU, SEATTLE y PORTLAND; PORTLAND como próximamente."

Claude añadirá el archivo de la colección y las ilustraciones, y ejecutará `npm run test:badges` y `npm run test:tokens`.
