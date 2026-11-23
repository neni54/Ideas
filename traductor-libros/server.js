// Servidor del Traductor de Libros (inglés → español).
// Sirve la interfaz web y expone /api/translate, que llama a Claude.
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "5mb" }));

app.use(express.static(path.join(here, "public")));
app.use("/vendor/jszip", express.static(path.join(here, "node_modules/jszip/dist")));
app.use("/vendor/pdfjs", express.static(path.join(here, "node_modules/pdfjs-dist/build")));

const MODELS = {
  "claude-opus-5-5": { fallbacks: true },
  "claude-sonnet-5-5": { fallbacks: true },
  "claude-haiku-5-5": { fallbacks: false },
};
const DEFAULT_MODEL = "claude-opus-5-5";

const VARIANTS = {
  neutral: "español neutro (comprensible en toda Hispanoamérica y España)",
  es: "español de España (usa «vosotros» cuando corresponda)",
  latam: "español latinoamericano (usa «ustedes», no «vosotros»)",
};

function clientFor(req) {
  const headerKey = req.get("x-anthropic-key");
  // Sin clave en la cabecera, el SDK usa ANTHROPIC_API_KEY u otra credencial del entorno.
  return headerKey ? new Anthropic({ apiKey: headerKey }) : new Anthropic();
}

app.get("/api/status", (_req, res) => {
  res.json({
    serverKey: Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
    models: Object.keys(MODELS),
    defaultModel: DEFAULT_MODEL,
  });
});

function buildSystem({ variant, glossary, bookTitle }) {
  return [
    "Eres un traductor literario profesional de inglés a español.",
    `Traduce al ${VARIANTS[variant] || VARIANTS.neutral}.`,
    "Reglas:",
    "- Traduce cada segmento de forma fiel al sentido, el tono, el registro y el estilo del autor; prioriza una prosa natural en español sobre la literalidad.",
    "- Devuelve exactamente un segmento traducido por cada segmento de entrada, en el mismo orden. No fusiones, dividas, omitas ni añadas segmentos.",
    "- Conserva nombres propios, números, cifras y la puntuación expresiva. Usa la raya (—) para diálogos cuando el original use comillas de diálogo.",
    "- Si un segmento no necesita traducción (un número, un símbolo, un nombre suelto), devuélvelo tal cual.",
    "- Mantén la coherencia terminológica con el contexto previo y con el glosario.",
    "- No añadas notas, comentarios ni explicaciones.",
    bookTitle ? `Libro: ${bookTitle}` : "",
    glossary?.trim() ? `Glosario y notas del usuario (respétalos):\n${glossary.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const SCHEMA = {
  type: "object",
  properties: {
    translations: { type: "array", items: { type: "string" } },
  },
  required: ["translations"],
  additionalProperties: false,
};

app.post("/api/translate", async (req, res) => {
  const { segments, context = [], glossary = "", variant = "neutral", bookTitle = "" } = req.body || {};
  const model = MODELS[req.body?.model] ? req.body.model : DEFAULT_MODEL;
  const effort = ["low", "medium", "high"].includes(req.body?.effort) ? req.body.effort : "medium";

  if (!Array.isArray(segments) || segments.length === 0 || segments.some((s) => typeof s !== "string")) {
    return res.status(400).json({ error: "Faltan segmentos válidos para traducir." });
  }

  const contextText = context.length
    ? "Contexto previo (ya traducido, solo como referencia, NO lo traduzcas de nuevo):\n" +
      context.map((c) => `EN: ${c.en}` + (c.es ? `\nES: ${c.es}` : "")).join("\n\n") +
      "\n\n"
    : "";

  const userText =
    contextText +
    `Traduce estos ${segments.length} segmentos. Responde con un objeto JSON cuyo campo "translations" sea una lista de ${segments.length} cadenas, en el mismo orden.\n\n` +
    JSON.stringify(segments.map((text, i) => ({ n: i + 1, text })), null, 1);

  const params = {
    model,
    max_tokens: 64000,
    system: [{ type: "text", text: buildSystem({ variant, glossary, bookTitle }), cache_control: { type: "ephemeral" } }],
    output_config: { effort, format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: userText }],
  };
  if (MODELS[model].fallbacks) {
    params.betas = ["server-side-fallback-2026-07-01"];
    params.fallbacks = "default";
  }

  try {
    const client = clientFor(req);
    const message = await client.beta.messages.stream(params).finalMessage();

    if (message.stop_reason === "refusal") {
      return res.status(422).json({ error: "El modelo rechazó traducir este fragmento.", refusal: true });
    }
    if (message.stop_reason === "max_tokens") {
      return res.status(422).json({ error: "Respuesta truncada; se reintentará con un fragmento más pequeño.", truncated: true });
    }
    const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: "La respuesta del modelo no es JSON válido." });
    }
    const translations = parsed.translations;
    if (!Array.isArray(translations) || translations.length !== segments.length) {
      return res.status(422).json({
        error: `Se esperaban ${segments.length} traducciones y llegaron ${translations?.length ?? 0}.`,
        mismatch: true,
      });
    }
    res.json({ translations, usage: message.usage, model: message.model });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(401).json({ error: "Clave de API inválida o ausente." });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "Límite de peticiones alcanzado; reintentando en unos segundos.", retry: true });
    }
    if (err instanceof Anthropic.APIStatusError) {
      return res.status(err.status >= 500 ? 503 : 400).json({ error: `Error de la API (${err.status}): ${err.message}`, retry: err.status >= 500 });
    }
    if (err instanceof Anthropic.APIConnectionError) {
      return res.status(503).json({ error: "No se pudo conectar con la API de Anthropic.", retry: true });
    }
    console.error(err);
    res.status(500).json({ error: String(err?.message || err) });
  }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Traductor de libros listo en http://localhost:${port}`);
});
