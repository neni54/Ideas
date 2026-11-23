# Traductor de libros (inglés → español)

Aplicación web para traducir libros **EPUB** o **PDF** del inglés al español con Claude, **sin perder de vista el original**: cada párrafo traducido aparece alineado junto a su párrafo en inglés.

## Funciones

- **Subes un EPUB o PDF** (arrastrar y soltar). El libro se divide en capítulos y párrafos.
  - EPUB: usa el índice del libro para los capítulos.
  - PDF: reconstruye párrafos a partir del texto y agrupa por bloques de 10 páginas. Los PDF escaneados (solo imagen) necesitan OCR antes.
- **Vista bilingüe** con cuatro modos:
  - *Lado a lado*: inglés a la izquierda, español a la derecha, párrafo a párrafo.
  - *Intercalado*: cada párrafo en inglés seguido de su traducción.
  - *Solo español*: lectura cómoda; el botón **👁 Original** de cada párrafo despliega el texto en inglés.
  - *Solo inglés*.
- **Traducción por capítulo o del libro completo**, con barra de progreso, pausa y reanudación. El progreso se guarda en el navegador (IndexedDB): puedes cerrar y seguir otro día.
- **Correcciones a mano**: haz clic en cualquier párrafo traducido para editarlo, o pulsa **↻ Retraducir**.
- **Ajustes**: modelo (Opus 5.5 por defecto, Sonnet 5.5 o Haiku 5.5), esfuerzo, variante del español (neutro, España, Latinoamérica) y un **glosario por libro** (nombres que no se traducen, términos fijos, tuteo/usted…).
- **Coherencia**: cada lote se envía con los párrafos anteriores como contexto y con el glosario.
- **Exportar**:
  - Libro en español **.epub** (si el original era EPUB, conserva estilos, imágenes e índice y solo sustituye el texto).
  - **Edición bilingüe** .html (dos columnas).
  - Solo español .html (se puede imprimir a PDF desde el navegador).

## Puesta en marcha

Necesitas [Node.js](https://nodejs.org) 20 o superior y una clave de API de Anthropic.

```bash
cd traductor-libros
npm install
export ANTHROPIC_API_KEY=sk-ant-...   # en Windows (PowerShell): $env:ANTHROPIC_API_KEY="sk-ant-..."
npm start
```

Abre <http://localhost:3000>. Si prefieres no usar la variable de entorno, introduce la clave en **⚙️ Ajustes** (se guarda solo en tu navegador).

## Coste orientativo

Un libro de ~100 000 palabras son unos 150 000 tokens de entrada y ~200 000 de salida. Con Claude Opus 5.5 ($4 / $20 por millón) son unos 5 USD; con Sonnet 5.5 unos 2,5 USD; con Haiku 5.5, céntimos. El razonamiento interno del modelo añade algo más según el esfuerzo elegido.

## Notas técnicas

- `server.js` (Express) sirve la interfaz y expone `POST /api/translate`, que llama a la API de Claude con el SDK oficial (`@anthropic-ai/sdk`), salida estructurada en JSON y *fallback* del lado del servidor si el modelo rechaza un fragmento.
- `public/app.js` lee los EPUB con JSZip y los PDF con pdf.js, todo en el navegador.
- Si la respuesta no trae el mismo número de párrafos, el lote se divide en dos y se reintenta; los errores 429/5xx se reintentan con espera exponencial.
- En la exportación EPUB, un párrafo con formato mixto (p. ej. una sola palabra en cursiva) queda como texto plano; el formato que envuelve el párrafo entero sí se conserva.
