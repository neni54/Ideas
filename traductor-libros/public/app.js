// Traductor de libros — lógica del navegador.
// Lee EPUB/PDF, divide en párrafos, traduce por lotes con /api/translate
// y muestra original y traducción alineados párrafo a párrafo.
import * as pdfjsLib from "/vendor/pdfjs/pdf.min.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs";

const JSZip = window.JSZip;
const $ = (s) => document.querySelector(s);

// ---------- Almacenamiento (IndexedDB) ----------
const db = await new Promise((resolve, reject) => {
  const req = indexedDB.open("traductor-libros", 1);
  req.onupgradeneeded = () => {
    req.result.createObjectStore("books", { keyPath: "id" });
    req.result.createObjectStore("files", { keyPath: "id" });
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});
function idb(store, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const r = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(r?.result);
    tx.onerror = () => reject(tx.error);
  });
}
const getBook = (id) => idb("books", "readonly", (s) => s.get(id));
const putBook = (b) => idb("books", "readwrite", (s) => s.put(b));
const allBooks = () => idb("books", "readonly", (s) => s.getAll());
const getFile = (id) => idb("files", "readonly", (s) => s.get(id));
const putFile = (f) => idb("files", "readwrite", (s) => s.put(f));
async function deleteBook(id) {
  await idb("books", "readwrite", (s) => s.delete(id));
  await idb("files", "readwrite", (s) => s.delete(id));
}

// ---------- Ajustes ----------
const settings = Object.assign(
  { apiKey: "", model: "claude-opus-5-5", effort: "medium", variant: "neutral", viewMode: "side" },
  safeJSON(localStorage.getItem("traductor-settings"))
);
function safeJSON(s) { try { return JSON.parse(s) || {}; } catch { return {}; } }
function saveSettings() { try { localStorage.setItem("traductor-settings", JSON.stringify(settings)); } catch {} }

let serverStatus = { serverKey: false };
fetch("/api/status").then((r) => r.json()).then((s) => (serverStatus = s)).catch(() => {});

// ---------- Utilidades ----------
let toastTimer;
function toast(msg, ms = 4000) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), ms);
}
const clean = (s) => s.replace(/\s+/g, " ").trim();
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
async function hashBuffer(buf) {
  const h = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(h).slice(0, 12)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function download(name, blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// ---------- Lectura de EPUB ----------
const BLOCK_SEL = "p,h1,h2,h3,h4,h5,h6,li,blockquote,dt,dd,figcaption,pre,td,th,caption,div";
const HEAD_RE = /^h[1-6]$/i;

function parseXml(text, type = "application/xhtml+xml") {
  let doc = new DOMParser().parseFromString(text, type);
  if (doc.getElementsByTagName("parsererror").length) doc = new DOMParser().parseFromString(text, "text/html");
  return doc;
}
function resolvePath(base, href) {
  const parts = (base ? base.split("/").slice(0, -1) : []).concat(decodeURIComponent(href.split("#")[0]).split("/"));
  const out = [];
  for (const p of parts) {
    if (p === "..") out.pop();
    else if (p && p !== ".") out.push(p);
  }
  return out.join("/");
}
// Bloques "hoja": elementos de bloque sin otros bloques dentro. Se usa igual al exportar.
function leafBlocks(doc) {
  const body = doc.body || doc.getElementsByTagName("body")[0] || doc.documentElement;
  return [...body.querySelectorAll(BLOCK_SEL)].filter((el) => !el.querySelector(BLOCK_SEL));
}

async function parseEpub(buf) {
  const zip = await JSZip.loadAsync(buf);
  const container = parseXml(await zip.file("META-INF/container.xml").async("text"), "application/xml");
  const opfPath = container.querySelector("rootfile").getAttribute("full-path");
  const opf = parseXml(await zip.file(opfPath).async("text"), "application/xml");
  const title = clean(opf.getElementsByTagName("dc:title")[0]?.textContent || opf.querySelector("title")?.textContent || "");
  const manifest = {};
  for (const it of opf.querySelectorAll("manifest > item")) {
    manifest[it.getAttribute("id")] = { href: resolvePath(opfPath, it.getAttribute("href")), type: it.getAttribute("media-type"), props: it.getAttribute("properties") || "" };
  }

  // Títulos de capítulo desde el índice (nav de EPUB3 o NCX de EPUB2)
  const tocTitles = {};
  const navItem = Object.values(manifest).find((m) => m.props.includes("nav"));
  const ncxId = opf.querySelector("spine")?.getAttribute("toc");
  try {
    if (navItem && zip.file(navItem.href)) {
      const nav = parseXml(await zip.file(navItem.href).async("text"));
      for (const a of nav.querySelectorAll("nav a[href]")) {
        const p = resolvePath(navItem.href, a.getAttribute("href"));
        if (!tocTitles[p]) tocTitles[p] = clean(a.textContent);
      }
    } else if (ncxId && manifest[ncxId] && zip.file(manifest[ncxId].href)) {
      const ncxHref = manifest[ncxId].href;
      const ncx = parseXml(await zip.file(ncxHref).async("text"), "application/xml");
      for (const np of ncx.getElementsByTagName("navPoint")) {
        const src = np.getElementsByTagName("content")[0]?.getAttribute("src");
        const label = np.getElementsByTagName("text")[0]?.textContent;
        if (src && label) {
          const p = resolvePath(ncxHref, src);
          if (!tocTitles[p]) tocTitles[p] = clean(label);
        }
      }
    }
  } catch (e) { console.warn("Índice no legible", e); }

  const sections = [];
  let segCounter = 0;
  for (const ref of opf.querySelectorAll("spine > itemref")) {
    const item = manifest[ref.getAttribute("idref")];
    if (!item || !zip.file(item.href) || !/x?html/.test(item.type || "html")) continue;
    const doc = parseXml(await zip.file(item.href).async("text"));
    const segs = [];
    leafBlocks(doc).forEach((el, idx) => {
      const text = clean(el.textContent);
      if (!text || !/[A-Za-z]/.test(text)) return;
      segs.push({ id: "s" + segCounter++, en: text, idx, h: HEAD_RE.test(el.localName) });
    });
    if (!segs.length) continue;
    const firstHead = segs.find((s) => s.h)?.en;
    sections.push({ title: tocTitles[item.href] || firstHead || `Sección ${sections.length + 1}`, file: item.href, segs });
  }
  return { title, sections };
}

// ---------- Lectura de PDF ----------
async function parsePdf(buf, onProgress) {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
  const meta = await pdf.getMetadata().catch(() => null);
  const paragraphs = []; // { text, page }
  let textChars = 0;

  for (let p = 1; p <= pdf.numPages; p++) {
    onProgress?.(`Leyendo página ${p} de ${pdf.numPages}…`);
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    // Agrupar fragmentos en líneas por su coordenada vertical
    const lines = [];
    let cur = null;
    for (const it of content.items) {
      if (!("str" in it)) continue;
      const y = it.transform[5], x = it.transform[4], hgt = Math.abs(it.transform[3]) || it.height || 10;
      if (!cur || Math.abs(cur.y - y) > hgt * 0.5) {
        if (cur) lines.push(cur);
        cur = { y, x, h: hgt, end: x + (it.width || 0), text: it.str };
      } else {
        cur.end = Math.max(cur.end, x + (it.width || 0));
        cur.text += (cur.text.endsWith(" ") || it.str.startsWith(" ") ? "" : (it.str ? " " : "")) + it.str;
      }
      if (it.hasEOL) { lines.push(cur); cur = null; }
    }
    if (cur) lines.push(cur);
    const ls = lines.map((l) => ({ ...l, text: clean(l.text) })).filter((l) => l.text);
    textChars += ls.reduce((n, l) => n + l.text.length, 0);
    // Quitar números de página / cabeceras sueltas
    const body = ls.filter((l, i) => !(/^\d{1,4}$/.test(l.text) && (i === 0 || i === ls.length - 1)));
    if (!body.length) continue;

    const gaps = [];
    for (let i = 1; i < body.length; i++) gaps.push(Math.abs(body[i - 1].y - body[i].y));
    const sorted = [...gaps].sort((a, b) => a - b);
    const typical = sorted[Math.floor(sorted.length / 2)] || body[0].h * 1.2;
    const minX = Math.min(...body.map((l) => l.x));
    const maxEnd = Math.max(...body.map((l) => l.end));

    const pageParas = [];
    let para = { text: body[0].text, page: p };
    for (let i = 1; i < body.length; i++) {
      const l = body[i];
      const gap = gaps[i - 1];
      const indented = l.x - minX > l.h * 0.8;
      const prevEnds = /[.!?:"”’)]$/.test(para.text);
      // Línea anterior corta y terminada en punto: suele ser fin de párrafo
      const prevShort = prevEnds && maxEnd - body[i - 1].end > body[i - 1].h * 3;
      const newPara = gap > typical * 1.3 || (indented && prevEnds) || prevShort || Math.abs(l.h - body[i - 1].h) > 2;
      if (newPara) {
        pageParas.push(para);
        para = { text: l.text, page: p };
      } else {
        para.text = joinLine(para.text, l.text);
      }
    }
    pageParas.push(para);
    // Si el párrafo de la página anterior quedó a medias y esta empieza en minúscula, unirlos
    const last = paragraphs[paragraphs.length - 1];
    if (last && !/[.!?:"”’)]$/.test(last.text) && /^[a-z]/.test(pageParas[0].text)) {
      last.text = joinLine(last.text, pageParas.shift().text);
    }
    paragraphs.push(...pageParas);
  }
  if (textChars < 200) {
    throw new Error("Este PDF parece escaneado (no contiene texto seleccionable). Necesita OCR antes de poder traducirlo.");
  }

  // Agrupar en secciones de 10 páginas
  const PAGES = 10;
  const sections = [];
  let segCounter = 0;
  for (const para of paragraphs) {
    if (!/[A-Za-z]/.test(para.text)) continue;
    const k = Math.floor((para.page - 1) / PAGES);
    if (!sections[k]) sections[k] = { title: `Páginas ${k * PAGES + 1}–${Math.min((k + 1) * PAGES, pdf.numPages)}`, segs: [] };
    sections[k].segs.push({ id: "s" + segCounter++, en: para.text, page: para.page, h: para.text.length < 60 && !/[.,;]$/.test(para.text) && para.text === para.text.toUpperCase() });
  }
  return { title: clean(meta?.info?.Title || ""), sections: sections.filter(Boolean) };
}
function joinLine(a, b) {
  // Une palabras cortadas con guion al final de línea
  return /[A-Za-z]-$/.test(a) && /^[a-z]/.test(b) ? a.slice(0, -1) + b : a + " " + b;
}

// ---------- Carga de archivos ----------
async function loadFile(file) {
  const status = $("#loadStatus");
  const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";
  const isEpub = /\.epub$/i.test(file.name) || file.type === "application/epub+zip";
  if (!isPdf && !isEpub) return toast("Formato no admitido. Sube un archivo .epub o .pdf");
  try {
    status.textContent = "Leyendo el libro…";
    const buf = await file.arrayBuffer();
    const id = await hashBuffer(buf);
    const existing = await getBook(id);
    if (existing) { status.textContent = ""; return openBook(id); }
    const parsed = isPdf ? await parsePdf(buf.slice(0), (m) => (status.textContent = m)) : await parseEpub(buf);
    if (!parsed.sections.length) throw new Error("No se encontró texto en el libro.");
    const book = {
      id,
      type: isPdf ? "pdf" : "epub",
      fileName: file.name,
      title: parsed.title || file.name.replace(/\.(epub|pdf)$/i, ""),
      sections: parsed.sections,
      tr: {},
      glossary: "",
      current: 0,
      added: Date.now(),
    };
    await putFile({ id, name: file.name, data: buf });
    await putBook(book);
    status.textContent = "";
    openBook(id);
  } catch (e) {
    console.error(e);
    status.textContent = "";
    toast("No se pudo leer el archivo: " + e.message, 8000);
  }
}

const dz = $("#dropzone");
$("#fileInput").addEventListener("change", (e) => e.target.files[0] && loadFile(e.target.files[0]));
dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("over"); });
dz.addEventListener("dragleave", () => dz.classList.remove("over"));
dz.addEventListener("drop", (e) => {
  e.preventDefault();
  dz.classList.remove("over");
  if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
});

// ---------- Biblioteca ----------
const countSegs = (b) => b.sections.reduce((n, s) => n + s.segs.length, 0);
const countDone = (b, segs) => segs.filter((s) => b.tr[s.id]).length;

async function showLibrary() {
  book = null;
  stopTranslating();
  $("#libraryView").hidden = false;
  $("#readerView").hidden = true;
  $("#bookInfo").hidden = true;
  $("#bookActions").hidden = true;
  const books = (await allBooks()).sort((a, b) => b.added - a.added);
  const ul = $("#bookList");
  ul.innerHTML = books.length ? "" : '<li class="muted">Todavía no has subido ningún libro.</li>';
  for (const b of books) {
    const total = countSegs(b);
    const done = b.sections.reduce((n, s) => n + countDone(b, s.segs), 0);
    const li = document.createElement("li");
    li.innerHTML = `<div class="title"><strong>${esc(b.title)}</strong><br><span class="muted">${b.type.toUpperCase()} · ${b.sections.length} secciones · ${Math.round((done / total) * 100)} % traducido</span></div>
      <button data-del>Eliminar</button>`;
    li.querySelector(".title").onclick = () => openBook(b.id);
    li.querySelector("[data-del]").onclick = async () => {
      if (confirm(`¿Eliminar «${b.title}» y su traducción?`)) { await deleteBook(b.id); showLibrary(); }
    };
    ul.appendChild(li);
  }
}
$("#homeBtn").onclick = showLibrary;

// ---------- Lector ----------
let book = null;
const pane = document.querySelector(".pane");

async function openBook(id) {
  book = await getBook(id);
  $("#libraryView").hidden = true;
  $("#readerView").hidden = false;
  $("#bookInfo").hidden = false;
  $("#bookActions").hidden = false;
  $("#bookTitle").textContent = book.title;
  applyViewMode();
  renderToc();
  renderSection(book.current || 0);
  updateProgress();
}

function applyViewMode() {
  $("#viewMode").value = settings.viewMode;
  pane.className = "pane mode-" + settings.viewMode;
}
$("#viewMode").onchange = (e) => { settings.viewMode = e.target.value; saveSettings(); applyViewMode(); };

function renderToc() {
  const ol = $("#tocList");
  ol.innerHTML = "";
  book.sections.forEach((s, i) => {
    const li = document.createElement("li");
    li.dataset.i = i;
    li.innerHTML = `<span>${esc(s.title)}</span><span class="pct"></span>`;
    li.onclick = () => renderSection(i);
    ol.appendChild(li);
  });
  updateToc();
}
function updateToc() {
  [...$("#tocList").children].forEach((li, i) => {
    const s = book.sections[i];
    const pct = Math.round((countDone(book, s.segs) / s.segs.length) * 100);
    const el = li.querySelector(".pct");
    el.textContent = pct + " %";
    el.classList.toggle("done", pct === 100);
    li.classList.toggle("active", i === book.current);
  });
}
function updateProgress() {
  const total = countSegs(book);
  const done = book.sections.reduce((n, s) => n + countDone(book, s.segs), 0);
  const pct = total ? (done / total) * 100 : 0;
  $("#progressBar").style.width = pct + "%";
  $("#progressText").textContent = `${Math.floor(pct)} % · ${done}/${total} párrafos`;
}

function renderSection(i) {
  book.current = Math.max(0, Math.min(i, book.sections.length - 1));
  putBook(book);
  const sec = book.sections[book.current];
  const rows = $("#rows");
  rows.innerHTML = "";
  for (const seg of sec.segs) rows.appendChild(makeRow(seg));
  $("#prevChap").disabled = book.current === 0;
  $("#nextChap").disabled = book.current === book.sections.length - 1;
  updateToc();
  window.scrollTo({ top: 0 });
}
$("#prevChap").onclick = () => renderSection(book.current - 1);
$("#nextChap").onclick = () => renderSection(book.current + 1);

function makeRow(seg) {
  const row = document.createElement("div");
  row.className = "row" + (seg.h ? " heading" : "");
  row.dataset.id = seg.id;
  const en = document.createElement("div");
  en.className = "en";
  en.textContent = seg.en;
  if (seg.page) en.title = `Página ${seg.page}`;
  const es = document.createElement("div");
  es.className = "es";
  es.contentEditable = "true";
  es.spellcheck = true;
  es.lang = "es";
  const tools = document.createElement("div");
  tools.className = "row-tools";
  const orig = document.createElement("button");
  orig.className = "show-orig";
  orig.textContent = "👁 Original";
  orig.title = "Mostrar u ocultar el texto original";
  orig.onclick = (e) => { e.stopPropagation(); row.classList.toggle("show-en"); };
  const redo = document.createElement("button");
  redo.textContent = "↻ Retraducir";
  redo.title = "Volver a traducir este párrafo";
  redo.onclick = (e) => { e.stopPropagation(); translateSegs([seg], { force: true }); };
  tools.append(orig, redo);
  row.append(en, es, tools);
  fillRow(row, seg);

  es.addEventListener("focus", () => {
    if (es.classList.contains("missing") || es.classList.contains("error")) { es.textContent = ""; es.classList.remove("missing", "error"); }
  });
  es.addEventListener("blur", () => {
    const val = es.innerText.trim();
    if (val && val !== book.tr[seg.id]) { book.tr[seg.id] = val; putBook(book); updateToc(); updateProgress(); }
    fillRow(row, seg);
  });
  return row;
}
function fillRow(row, seg) {
  const es = row.querySelector(".es");
  if (document.activeElement === es) return;
  es.classList.remove("missing", "error", "working");
  if (working.has(seg.id)) { es.textContent = ""; es.classList.add("working"); }
  else if (book.tr[seg.id]) es.textContent = book.tr[seg.id];
  else if (errors.has(seg.id)) { es.textContent = "No se pudo traducir: " + errors.get(seg.id); es.classList.add("error"); }
  else { es.textContent = "Sin traducir"; es.classList.add("missing"); }
}
function refreshRows(segs) {
  for (const seg of segs) {
    const row = document.querySelector(`.row[data-id="${seg.id}"]`);
    if (row) fillRow(row, seg);
  }
}

// ---------- Traducción ----------
const working = new Set();
const errors = new Map();
let running = false;
let stopRequested = false;
const CHUNK_SEGS = 25, CHUNK_CHARS = 7000, CONCURRENCY = 3;

function chunkSegs(segs) {
  const chunks = [];
  let cur = [], chars = 0;
  for (const s of segs) {
    if (cur.length && (cur.length >= CHUNK_SEGS || chars + s.en.length > CHUNK_CHARS)) { chunks.push(cur); cur = []; chars = 0; }
    cur.push(s);
    chars += s.en.length;
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}
function contextFor(seg) {
  for (const sec of book.sections) {
    const i = sec.segs.indexOf(seg);
    if (i >= 0) return sec.segs.slice(Math.max(0, i - 3), i).map((s) => ({ en: s.en, es: book.tr[s.id] || "" }));
  }
  return [];
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callApi(segs) {
  const headers = { "content-type": "application/json" };
  if (settings.apiKey) headers["x-anthropic-key"] = settings.apiKey;
  for (let attempt = 0; ; attempt++) {
    const r = await fetch("/api/translate", {
      method: "POST",
      headers,
      body: JSON.stringify({
        segments: segs.map((s) => s.en),
        context: contextFor(segs[0]),
        glossary: book.glossary,
        variant: settings.variant,
        model: settings.model,
        effort: settings.effort,
        bookTitle: book.title,
      }),
    });
    const data = await r.json().catch(() => ({ error: `Error HTTP ${r.status}` }));
    if (r.ok) return data.translations;
    if (data.retry && attempt < 5 && !stopRequested) { await sleep(2000 * 2 ** attempt); continue; }
    const err = new Error(data.error || `Error HTTP ${r.status}`);
    err.splittable = data.mismatch || data.truncated;
    err.fatal = r.status === 401;
    throw err;
  }
}

async function translateChunk(segs) {
  try {
    const out = await callApi(segs);
    segs.forEach((s, i) => { book.tr[s.id] = out[i]; errors.delete(s.id); });
  } catch (e) {
    if (e.fatal) throw e;
    if (e.splittable && segs.length > 1) {
      const mid = Math.ceil(segs.length / 2);
      await translateChunk(segs.slice(0, mid));
      await translateChunk(segs.slice(mid));
      return;
    }
    segs.forEach((s) => errors.set(s.id, e.message));
  } finally {
    segs.forEach((s) => working.delete(s.id));
    refreshRows(segs);
  }
  await putBook(book);
  updateToc();
  updateProgress();
}

async function translateSegs(segs, { force = false } = {}) {
  const todo = segs.filter((s) => force || !book.tr[s.id]);
  if (!todo.length) return;
  if (!settings.apiKey && !serverStatus.serverKey) {
    toast("Primero indica tu clave de API de Anthropic en Ajustes ⚙️");
    return openSettings();
  }
  if (force) todo.forEach((s) => delete book.tr[s.id]);
  const queue = chunkSegs(todo);
  running = true;
  stopRequested = false;
  setButtons();
  try {
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length && !stopRequested) {
        const chunk = queue.shift();
        chunk.forEach((s) => working.add(s.id));
        refreshRows(chunk);
        await translateChunk(chunk);
      }
    });
    await Promise.all(workers);
    const failed = todo.filter((s) => errors.has(s.id)).length;
    if (stopRequested) toast("Traducción en pausa. Puedes continuar cuando quieras.");
    else if (failed) toast(`Terminado con ${failed} párrafo(s) sin traducir. Pulsa «↻ Retraducir» en ellos o vuelve a lanzar la traducción.`, 7000);
    else toast("¡Traducción completada!");
  } catch (e) {
    toast(e.message, 8000);
    if (e.fatal) openSettings();
  } finally {
    running = false;
    working.clear();
    if (book) refreshRows(book.sections[book.current].segs);
    setButtons();
  }
}
function stopTranslating() { if (running) stopRequested = true; }
function setButtons() {
  $("#translateAllBtn").textContent = running ? "⏸ Pausar" : "Traducir todo";
  $("#translateChapterBtn").disabled = running;
}
$("#translateChapterBtn").onclick = () => translateSegs(book.sections[book.current].segs);
$("#translateAllBtn").onclick = () => {
  if (running) return stopTranslating();
  // Empieza por el capítulo abierto y sigue en orden
  const order = [...book.sections.slice(book.current), ...book.sections.slice(0, book.current)];
  translateSegs(order.flatMap((s) => s.segs));
};

// ---------- Ajustes (diálogo) ----------
function openSettings() {
  $("#apiKey").value = settings.apiKey;
  $("#apiKeyRow").querySelector("small").textContent = serverStatus.serverKey
    ? "El servidor ya tiene una clave configurada; este campo es opcional."
    : "Solo se guarda en este navegador y se envía a tu servidor local para llamar a la API.";
  $("#model").value = settings.model;
  $("#effort").value = settings.effort;
  $("#variant").value = settings.variant;
  $("#glossary").value = book?.glossary || "";
  $("#glossary").disabled = !book;
  $("#settingsDlg").showModal();
}
$("#settingsBtn").onclick = openSettings;
$("#settingsDlg").addEventListener("close", () => {
  if ($("#settingsDlg").returnValue !== "save") return;
  settings.apiKey = $("#apiKey").value.trim();
  settings.model = $("#model").value;
  settings.effort = $("#effort").value;
  settings.variant = $("#variant").value;
  saveSettings();
  if (book) { book.glossary = $("#glossary").value; putBook(book); }
});

// ---------- Exportar ----------
$("#exportBtn").onclick = (e) => { e.stopPropagation(); $("#exportMenu").hidden = !$("#exportMenu").hidden; };
document.addEventListener("click", () => ($("#exportMenu").hidden = true));
$("#exportMenu").addEventListener("click", async (e) => {
  const kind = e.target.dataset.export;
  if (!kind) return;
  try {
    if (kind === "epub") await exportEpub();
    if (kind === "bilingual") exportHtml(true);
    if (kind === "spanish-html") exportHtml(false);
  } catch (err) {
    console.error(err);
    toast("No se pudo exportar: " + err.message, 8000);
  }
});
const baseName = () => book.title.replace(/[\\/:*?"<>|]+/g, "").slice(0, 80) || "libro";
const trOr = (seg) => book.tr[seg.id] || seg.en;

function exportHtml(bilingual) {
  const body = book.sections.map((sec) => {
    const rows = sec.segs.map((s) => {
      const tag = s.h ? "h3" : "p";
      return bilingual
        ? `<tr><td class="en"><${tag}>${esc(s.en)}</${tag}></td><td><${tag}>${esc(trOr(s))}</${tag}></td></tr>`
        : `<${tag}>${esc(trOr(s))}</${tag}>`;
    }).join("\n");
    return bilingual ? `<h2>${esc(sec.title)}</h2><table>${rows}</table>` : `<section>${rows}</section>`;
  }).join("\n");
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(book.title)}</title>
<style>body{font:17px/1.6 Georgia,serif;max-width:${bilingual ? "1200px" : "70ch"};margin:2em auto;padding:0 1em;color:#222}
table{border-collapse:collapse;width:100%}td{vertical-align:top;width:50%;padding:.3em 1em;border-bottom:1px solid #eee}
td.en{color:#666}p{margin:.5em 0}section{page-break-after:always}h2{margin-top:2em}</style></head>
<body><h1>${esc(book.title)}</h1>${body}</body></html>`;
  download(`${baseName()}${bilingual ? " (bilingüe)" : " (español)"}.html`, new Blob([html], { type: "text/html" }));
}

async function exportEpub() {
  const missing = countSegs(book) - book.sections.reduce((n, s) => n + countDone(book, s.segs), 0);
  if (missing && !confirm(`Faltan ${missing} párrafos por traducir; se dejarán en inglés. ¿Exportar igualmente?`)) return;
  toast("Generando EPUB…");
  const blob = book.type === "epub" ? await rebuildEpub() : await buildEpubFromScratch();
  download(`${baseName()} (español).epub`, blob);
}

// Para EPUB: se reutiliza el original (estilos, imágenes, índice) y se sustituye el texto
async function rebuildEpub() {
  const file = await getFile(book.id);
  const zip = await JSZip.loadAsync(file.data);
  for (const sec of book.sections) {
    const raw = await zip.file(sec.file).async("text");
    const isXml = !/^\s*<!doctype html>\s*<html(?![^>]*xmlns)/i.test(raw);
    const doc = parseXml(raw);
    const blocks = leafBlocks(doc);
    for (const seg of sec.segs) {
      const el = blocks[seg.idx];
      if (el && book.tr[seg.id]) replaceText(el, book.tr[seg.id]);
    }
    const root = doc.documentElement;
    root.setAttribute("lang", "es");
    if (isXml) root.setAttribute("xml:lang", "es");
    const out = isXml ? new XMLSerializer().serializeToString(doc) : "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
    zip.file(sec.file, (isXml && !out.startsWith("<?xml") ? '<?xml version="1.0" encoding="utf-8"?>\n' : "") + out);
  }
  // Marcar el idioma del libro como español
  const container = parseXml(await zip.file("META-INF/container.xml").async("text"), "application/xml");
  const opfPath = container.querySelector("rootfile").getAttribute("full-path");
  let opf = await zip.file(opfPath).async("text");
  opf = opf.replace(/(<dc:language[^>]*>)[^<]*(<\/dc:language>)/, "$1es$2");
  zip.file(opfPath, opf);
  // mimetype debe ir primero y sin comprimir
  const mimetype = await zip.file("mimetype")?.async("text");
  zip.remove("mimetype");
  const out = new JSZip();
  out.file("mimetype", mimetype || "application/epub+zip", { compression: "STORE" });
  for (const [path, f] of Object.entries(zip.files)) if (!f.dir) out.file(path, await f.async("uint8array"));
  return out.generateAsync({ type: "blob", mimeType: "application/epub+zip", compression: "DEFLATE" });
}
// Sustituye el texto de un bloque. Si el bloque solo tiene un elemento en línea
// envolviendo todo el texto (p. ej. <em>…</em>), se conserva ese formato.
function replaceText(el, text) {
  let target = el;
  while (target.children.length === 1 && clean(target.children[0].textContent) === clean(target.textContent) && !/^(img|br|svg)$/i.test(target.children[0].localName)) {
    target = target.children[0];
  }
  const imgs = [...target.querySelectorAll("img, svg, image")];
  target.textContent = text;
  imgs.forEach((i) => target.prepend(i));
}

async function buildEpubFromScratch() {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file("META-INF/container.xml", `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);
  const x = (s) => esc(s).replace(/'/g, "&#39;");
  const chapters = book.sections.map((sec, i) => {
    const name = `cap${String(i + 1).padStart(3, "0")}.xhtml`;
    const body = sec.segs.map((s) => (s.h ? `<h2>${x(trOr(s))}</h2>` : `<p>${x(trOr(s))}</p>`)).join("\n");
    zip.file(`OEBPS/${name}`, `<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" lang="es" xml:lang="es"><head><title>${x(sec.title)}</title><link rel="stylesheet" href="estilo.css"/></head><body>${body}</body></html>`);
    return { name, title: sec.title, id: `c${i + 1}` };
  });
  zip.file("OEBPS/estilo.css", "body{font-family:serif;line-height:1.5}p{text-indent:1.5em;margin:0 0 .3em}h2{text-align:center}");
  zip.file("OEBPS/nav.xhtml", `<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="es"><head><title>Índice</title></head><body><nav epub:type="toc"><h1>Índice</h1><ol>${chapters.map((c) => `<li><a href="${c.name}">${x(c.title)}</a></li>`).join("")}</ol></nav></body></html>`);
  const uid = "urn:uuid:" + crypto.randomUUID();
  const modified = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  zip.file("OEBPS/content.opf", `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid" xml:lang="es">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="uid">${uid}</dc:identifier><dc:title>${x(book.title)}</dc:title><dc:language>es</dc:language><meta property="dcterms:modified">${modified}</meta></metadata>
<manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="css" href="estilo.css" media-type="text/css"/>${chapters.map((c) => `<item id="${c.id}" href="${c.name}" media-type="application/xhtml+xml"/>`).join("")}</manifest>
<spine>${chapters.map((c) => `<itemref idref="${c.id}"/>`).join("")}</spine></package>`);
  return zip.generateAsync({ type: "blob", mimeType: "application/epub+zip", compression: "DEFLATE" });
}

// ---------- Inicio ----------
window.addEventListener("beforeunload", (e) => { if (running) { e.preventDefault(); e.returnValue = ""; } });
showLibrary();
