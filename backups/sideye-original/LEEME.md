# Copia de seguridad: SIDEYE original

Copia íntegra de la **versión original** de SIDEYE, tal como estaba publicada en el Artifact
<https://claude.ai/artifact/U4RFEuBU3k66XCDfdfL4JE> antes de cualquier cambio del 24-11-2026.
Esta carpeta solo guarda la copia: **nada de la versión de pruebas la usa ni la modifica.**

| Archivo | Qué es |
|---|---|
| `sideye-artifact-original.html` | La página exactamente como la sirve claude.ai (569 147 bytes). SHA-256 `90fafcae011cac5eba06f01a1785e5263575628f85bf73ae50af01e974a1af29`. |
| `sideye-artifact-original-para-publicar.html` | El mismo contenido sin la envoltura que añade claude.ai: es el archivo que se publica para restaurar el Artifact. Publicado, el Artifact vuelve a dar el SHA-256 de arriba (comprobado el 24-11-2026). |

- Código fuente original: rama `claude/dreamy-lamport-hut2jt`, commit `49bc07e` ("Rebrand Subtext to SIDEYE"). Su compilación de un solo archivo (`npm run build:single`) contiene exactamente el mismo JavaScript y CSS que esta copia.
- El progreso guardado en la nube del Artifact (capacidad `db`) no está en este archivo: vive en claude.ai y no lo toca ninguna publicación de la página.

## Cómo restaurar el Artifact original

Publicar `sideye-artifact-original-para-publicar.html` en la URL del Artifact (pedírselo a Claude
indicando esta carpeta), y comprobar que la página publicada tiene el SHA-256 de la tabla.
