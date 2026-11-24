# Copia de seguridad: versión de PRUEBAS antes de SIDEYE TOKENS / THE BADGE SHOP

Fecha: 24-11-2026. Estado publicado en https://sideye27.netlify.app justo antes de añadir los tokens.

- Código: rama `claude/nifty-cannon-7o68bx`, commit `4df2a41`
  ("Test version: remove SIDEYE SPEAK (back to the version before it)").
- `sideye-pruebas-web.zip`: la web ya compilada de ese commit (contenido de `dist/`).

## Cómo volver a esta versión

- **Código:** pedir a Claude que restaure la rama al commit `4df2a41` (con un `git revert`
  de los cambios posteriores, sin borrar historial).
- **Solo la web, sin tocar el código:** en Netlify → *Deploys* → arrastrar el contenido de
  `sideye-pruebas-web.zip` descomprimido. Ojo: así no se publican las funciones de IA
  (`/api/*`); para eso, desplegar el commit desde Git.

El Artifact original y su copia están en `backups/sideye-original/` y no se ven afectados.
