const $ = s => document.querySelector(s), KEY = "mi-espacio-docente-v3";
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const hoy = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") };
const FL = [["inst", "Establecimiento"], ["ori", "Orientación"], ["curso", "Curso"], ["prec", "Preceptor"], ["tur", "Turno"], ["mat", "Asignatura"], ["doc", "Profesor"], ["ciclo", "Año"]];
const blank = () => Object.fromEntries(FL.map(x => [x[0], ""]));
const newStu = n => ({ n: n || "", g: ["", "", "", "", "", ""] });
let S = { view: "home", tab: "alumnos", step: 0, f: blank(), stu: [], course: false, cs: [], cid: "", rem: { on: false, h: "08:00", last: "" }, remMsg: "", att: {}, fecha: hoy(), msg: "", note: "" };
const api = async (m, u, b) => { const r = await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }); if (!r.ok) throw new Error(r.status); return r.json() };
function applyState(d) { if (d && d.rem) S.rem = d.rem; if (d && d.cs && d.cs.length) { S.cs = d.cs; S.course = true; S.view = "course"; openCourse(d.cur) } }
let dbOk = true;
try {
  let d = await api("GET", "/api/state");
  if (!d.cs.length) { try { const o = JSON.parse(localStorage.getItem(KEY)); if (o && o.cs && o.cs.length) { d = o; for (const c of o.cs) await api("PUT", "/api/courses/" + c.id, c); setTimeout(() => toast("Se migraron tus cursos guardados en el navegador a la base de datos ✅", 6000), 600) } } catch (e) { } }
  applyState(d)
} catch (e) { dbOk = false; setTimeout(() => toast("⚠️ No hay conexión con la base de datos. Iniciá el servidor con npm start.", 8000), 600) }
function openCourse(id) { const c = S.cs.find(x => x.id === id) || S.cs[0]; Object.assign(S, { f: c.f, stu: c.stu, att: c.att, cid: c.id }) }
let svT;
async function persist(msg) { try { const c = S.cs.find(x => x.id === S.cid); if (c) await api("PUT", "/api/courses/" + c.id, c); await api("PUT", "/api/settings", { rem: S.rem, cur: S.cid }); dbOk = true; if (msg) toast(msg, 2600); return true } catch (e) { dbOk = false; toast("⚠️ No se pudo guardar en la base de datos. Revisá que el servidor esté corriendo.", 5000); return false } }
const save = () => { if (S.course && S.view === "course") { let c = S.cs.find(x => x.id === S.cid); if (!c) { c = { id: S.cid }; S.cs.push(c) } c.f = S.f; c.stu = S.stu; c.att = S.att } clearTimeout(svT); svT = setTimeout(() => persist(), 400) };
const NAV = [["home", "🏠", "Inicio"], ["alumnos", "👥", "Alumnos"], ["asist", "✅", "Asistencia"], ["notas", "📝", "Calificaciones"], ["avisos", "🔔", "Avisos"]];
const st = v => !String(v).trim() ? "fal" : String(v).includes("?") ? "dud" : "ok";
const chip = v => { const s = st(v); return s === "ok" ? '<span class="chip c-ok">Listo</span>' : s === "dud" ? '<span class="chip c-dud">Confirmar</span>' : '<span class="chip c-fal">Falta</span>' };
const bad = n => !n.trim() || n.includes("?");
function pending() { let n = 0; FL.forEach(([k]) => { if (S.f[k].includes("?") || (k === "curso" && !S.f[k].trim())) n++ }); S.stu.forEach(s => { if (bad(s.n)) n++ }); return S.stu.length ? n : n + 1 }
function renderNav() {
  const cur = S.view === "course" ? S.tab : S.view === "avisos" ? "avisos" : "home";
  $("#nav").innerHTML = '<div class="brand">EDULOGGER</div>' + NAV.map(n => `<button class="nb" data-nav="${n[0]}"${cur === n[0] ? ' aria-current="page"' : ""}><span aria-hidden="true">${n[1]}</span>${n[2]}${n[0] === "avisos" && alerts().length ? `<b class="bd">${alerts().length}</b>` : ""}</button>`).join("")
}
const stepper = () => '<ol class="steps">' + ["Fotografiar", "Revisar", "Crear"].map((t, i) => `<li class="${i < S.step ? "done" : i === S.step ? "on" : ""}">${t}</li>`).join("") + "</ol>";
const sheet = c => `<div class="sheet ${c || ""}"><div class="hd">PLANILLA DE CALIFICACIONES</div>${'<div class="ln m"></div><div class="ln s"></div><div class="ln"></div>'.repeat(4)}<div class="beam"></div></div>`;
const roster = () => `<div class="nom">${S.stu.map((s, i) => `<div class="${bad(s.n) ? "q" : ""}"><input data-s="${i}" value="${esc(s.n)}" aria-label="Alumno ${i + 1}" placeholder="APELLIDO Nombre"><button class="x" data-del="${i}" aria-label="Quitar alumno">✕</button></div>`).join("")}</div><button class="btn ghost" data-act="add">+ Agregar alumno</button>`;
const fields = () => FL.map(([k, l]) => `<div class="f"><label for="f-${k}">${l}</label><input id="f-${k}" data-f="${k}" value="${esc(S.f[k])}" placeholder="Escribilo acá"><span data-chip="${k}">${chip(S.f[k])}</span></div>`).join("");

function homeOld() {
  return '<h1 class="hello">EDULOGGER</h1><p class="sub">Fotografiá tu lista o planilla impresa y armamos todo.</p>' +
    (S.note ? `<div class="card">${esc(S.note)}</div>` : "") +
    '<section class="hero"><div class="cam" aria-hidden="true">📷</div><h2>Escanear mi planilla</h2><p>Sacá una foto a la lista de alumnos (con buena luz y bien plana). La leemos, creamos la lista y pasás directo a tomar asistencia.</p><div class="bar" style="margin:0"><label class="btn light" style="position:relative;overflow:hidden">📷 Sacar foto de la lista<input class="vh" type="file" accept="image/*" capture="environment" data-scan></label><button class="btn ghost" style="color:inherit;border-color:currentColor" data-act="start">Otras opciones</button></div></section>' +
    (S.cs.length ? '<h3 style="margin:18px 0 8px">Mis cursos</h3><div class="bar" style="margin-top:0">' + S.cs.map(c => `<button class="btn" data-open="${c.id}">${esc(c.f.curso)}${c.f.mat ? " · " + esc(c.f.mat) : ""}</button>`).join("") + '</div><p class="hint">Cada planilla que escanees crea un curso nuevo.</p>' : "")
}
function scanView() {
  const rd = S.step === 0 && S.msg; return stepper() + '<div class="scan">' + sheet(rd ? "scanning" : "") + '<div><h2>' + (rd ? "Leyendo la planilla…" : "Fotografiar la planilla") + '</h2><p class="sub">' + (rd ? esc(S.msg) : "Sacá una foto de la planilla impresa o elegí una imagen. Lo que no se lea con claridad lo marcamos con “?” para que lo corrijas; no inventamos datos.") + "</p>" +
    (rd ? "" : '<div class="bar" style="margin-top:0"><label class="btn" style="position:relative;overflow:hidden">📷 Sacar foto<input class="vh" type="file" accept="image/*" capture="environment" data-scan></label><label class="btn" style="position:relative;overflow:hidden">🖼️ Elegir imagen<input class="vh" type="file" accept="image/*" data-scan></label>' + (camOk() ? '<button class="btn" data-act="cam">🎥 Usar cámara</button>' : '') + '</div><div id="pz" class="pz" tabindex="0">📋 Hacé clic acá y pegá la captura (Ctrl+V)</div><p class="hint">Para escanear la pantalla de la compu: en Windows apretá <b>Win+Shift+S</b>, marcá la lista y después pegá acá con <b>Ctrl+V</b> (en Mac: <b>Cmd+Shift+Ctrl+4</b> y <b>Cmd+V</b>). También podés arrastrar una imagen.</p>' + (dispOk() ? '<button class="btn" data-act="pant">🖥️ Capturar pantalla</button>' : '') + '<div id="camBox"></div><div class="bar"><button class="btn ghost" data-act="manual">Pegar lista o cargar a mano</button><button class="btn ghost" data-nav="home">Volver</button></div>') + "</div></div>"
}
function reviewView() {
  const p = pending();
  return stepper() + '<h2>Revisá lo que encontramos</h2><p class="sub">' + esc(S.note || "Corregí lo que haga falta. Los datos con “?” no se leyeron con seguridad.") + '</p><div class="card">' + fields() + '</div><details class="card"><summary><b>Pegar lista de nombres</b> (copiada de Word, Excel o del celular)</summary><textarea id="pasteTx" rows="5" placeholder="Un alumno por línea"></textarea><button class="btn" data-act="ptxt">Cargar nombres</button></details><h3 style="margin:18px 0 8px">Alumnos · <span id="cnt">' + S.stu.length + '</span></h3><div class="card" id="ros">' + roster() + '</div><div class="bar"><button class="btn" id="mk" data-act="make"' + (S.stu.length ? "" : " disabled") + '>Crear mi espacio</button><span class="hint" id="pend">' + (p ? "Faltan " + p + " dato" + (p > 1 ? "s" : "") + " por completar o confirmar" : "Todo listo") + "</span></div>"
}
function refresh() { const p = pending(); if ($("#mk")) { $("#mk").disabled = !S.stu.length; $("#pend").textContent = p ? "Faltan " + p + " dato" + (p > 1 ? "s" : "") + " por completar o confirmar" : "Todo listo" } }

const cls = v => { v = String(v).trim().toUpperCase(); if (v === "A") return "aus"; const n = parseFloat(v.replace(",", ".")); return !(n >= 1 && n <= 10) ? "" : n >= 6 ? "ap" : n >= 4 ? "des" : "apl" };
const CC = { ap: "ap", aus: "ap", des: "de", apl: "pl", "": "" };
function fin(g) { const n = g.slice(0, 3).map(v => parseFloat(String(v).replace(",", "."))); return n.every(x => x >= 1 && x <= 10) ? Math.floor((n[0] + n[1] + n[2]) / 3 + .5) : "" }
function notasView() {
  let h = '<div class="card noprint"><details><summary>Datos de la planilla (editables)</summary>' + fields() + '</details></div><div class="card wrap"><p>Nota de 1 a 10, o A si estuvo ausente. Aprobado 6–10 (negro) · Desaprobado 4–5 (verde) · Aplazado 1–3 (rojo). La calificación final es el promedio de los 3 trimestres.</p><table><tr><th rowspan="2">N°</th><th rowspan="2">Apellido y nombre</th><th colspan="3">Trimestre</th><th rowspan="2">Calif. final</th><th colspan="2">Instancia</th><th rowspan="2">Calif. defin.</th></tr><tr><th>1°</th><th>2°</th><th>3°</th><th>Dic.</th><th>Feb/Mar</th></tr>';
  S.stu.forEach((s, i) => {
    const I = j => `<td><input data-g="${i}" data-j="${j}" maxlength="4" value="${esc(s.g[j])}" aria-label="Nota ${j + 1} de ${esc(s.n)}"></td>`;
    h += `<tr><td>${String(i + 1).padStart(2, "0")}</td><td class="nm">${esc(s.n)}</td>${I(0)}${I(1)}${I(2)}<td id="f${i}"></td>${I(3)}${I(4)}${I(5)}</tr>`
  });
  return h + '</table></div><div class="card wrap"><h3 style="margin-bottom:8px">Cuadro de calificaciones</h3><table id="sum"></table></div><button class="btn noprint" onclick="window.print()">Imprimir planilla</button>'
}
function calc() {
  const cnt = [0, 1, 2, 3].map(() => ({ ap: 0, des: 0, apl: 0, aus: 0 }));
  S.stu.forEach((s, i) => {
    const f = fin(s.g), e = $("#f" + i); if (e) { e.textContent = f; e.className = CC[cls(f)] }
    [s.g[0], s.g[1], s.g[2], f].forEach((v, j) => { const k = cls(v); if (k) cnt[j][k]++ })
  });
  document.querySelectorAll("td input[data-g]").forEach(n => n.className = CC[cls(n.value)] || "");
  const R = [["Aprobados (negro)", "ap", "ap"], ["Desaprobados (verde)", "des", "de"], ["Aplazados (rojo)", "apl", "pl"], ["Ausentes (negro)", "aus", "ap"]];
  const T = o => o.ap + o.des + o.apl + o.aus;
  let h = '<tr><th rowspan="2">Calificación</th>' + ["1er. trimestre", "2do. trimestre", "3er. trimestre", "Calif. final"].map(x => `<th colspan="2">${x}</th>`).join("") + "</tr><tr>" + "<th>N°</th><th>%</th>".repeat(4) + "</tr>";
  R.forEach(([l, k, c]) => { h += `<tr><td class="nm ${c}">${l}</td>` + cnt.map(o => `<td class="${c}">${o[k]}</td><td class="${c}">${T(o) ? Math.round(o[k] / T(o) * 100) : 0}%</td>`).join("") + "</tr>" });
  h += "<tr><th>Totales</th>" + cnt.map(o => `<th>${T(o)}</th><th>${T(o) ? "100%" : "0%"}</th>`).join("") + "</tr>";
  const s = $("#sum"); if (s) s.innerHTML = h
}
function courseView() {
  const f = S.f, t = S.tab;
  let h = `<div class="head"><h1>${esc(f.curso) || "Mi curso"}${f.mat ? " · " + esc(f.mat) : ""}</h1><p>${esc(f.ori)} · Turno ${esc(f.tur.toLowerCase())} · ${esc(f.ciclo)}</p><div class="chips"><span>👥 ${S.stu.length} alumnos</span><span>✅ ${Object.values(S.att[hoy()] || {}).filter(a => a.s === "P").length} presentes hoy</span></div><p>${esc(f.inst)}${f.doc ? " · Profesor: " + esc(f.doc) : ""}${f.prec ? " · Preceptor: " + esc(f.prec) : ""}</p></div><div class="tabs" role="tablist">` +
    [["alumnos", "Alumnos"], ["asist", "Asistencia"], ["notas", "Calificaciones"]].map(x => `<button class="tab" role="tab" aria-selected="${t === x[0]}" data-nav="${x[0]}">${x[1]}</button>`).join("") + "</div>";
  if (t === "alumnos") h += hdrCard() + '<div class="card" id="ros">' + roster() + '</div><div class="bar noprint"><button class="btn ghost" data-act="more">📷 Agregar alumnos desde otra planilla</button></div>';
  if (t === "asist") h += hdrCard() + attView(); if (t === "notas") h += notasView(); return h
}
function render() { const v = S.view; $("#main").innerHTML = v === "home" ? home() : v === "avisos" ? avisosView() : v === "scan" ? scanView() : v === "review" ? reviewView() : courseView(); renderNav(); window.scrollTo(0, 0); if (v === "course" && S.tab === "notas") calc() }
function go(n) { S.note = ""; S.merge = false; if (n === "home") S.view = "home"; else if (n === "avisos") S.view = "avisos"; else if (S.course) { if (S.view !== "course") openCourse(S.cid); S.view = "course"; S.tab = n } else { S.view = "home"; S.note = "Primero escaneá una planilla para crear tu curso." } render() }

async function reduce(file) { let bm; try { bm = await createImageBitmap(file, { resizeWidth: 1800, resizeQuality: "medium" }) } catch (e) { bm = await createImageBitmap(file) } const k = Math.min(1, 1800 / Math.max(bm.width, bm.height)), c = document.createElement("canvas"); c.width = bm.width * k; c.height = bm.height * k; c.getContext("2d").drawImage(bm, 0, 0, c.width, c.height); return new Promise(r => c.toBlob(r, "image/jpeg", .85)) }

const PROMPT = 'Esta es la foto de una planilla escolar argentina. Devolvé SOLO un JSON: {"escuela":"","orientacion":"","curso":"","preceptor":"","turno":"","asignatura":"","profesor":"","anio":"","alumnos":["APELLIDO Nombre"]}. Transcribí exactamente lo que se lee, en el orden de la lista y sin los números de orden. Omití las filas vacías. Si la lista es una nómina con columnas separadas (Apellidos, Nombres, DNI, fecha de nacimiento, sexo), uní Apellidos y Nombres como APELLIDO Nombre e ignorá todas las demás columnas. Si no figura la asignatura, dejala vacía. Si el curso figura junto al nombre del colegio (por ejemplo "Colegio N° 68 - 4to Año 2da"), el curso es solo el año y la división. Si una palabra no se lee con certeza escribí ? en su lugar. Si un dato del encabezado no se ve, dejalo como cadena vacía. No inventes nada.';
let ocrUsed = false;
async function getSample() { try { if (typeof claude === "undefined") return null; const m = await claude.use("sample"); if (m && (await m.limits()).images) return m } catch (e) { } return null }
async function readSheet(file) {
  const sm = await getSample(), img = await reduce(file); ocrUsed = !sm;
  if (sm) return await sm.json(PROMPT, { images: [img], cache: false });
  return await ocrSheet(img)
}
function loadTess() { return window.Tesseract ? Promise.resolve() : new Promise((ok, no) => { const e = document.createElement("script"); e.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js"; e.onload = ok; e.onerror = () => no({ code: "ocr" }); document.head.appendChild(e) }) }
async function ocrSheet(img) { try { await loadTess(); S.msg = "Leyendo con el lector del dispositivo… la primera vez descarga el idioma."; render(); const o = await Tesseract.recognize(img, "spa"); return parseOcr(o.data.text) } catch (e) { throw { code: "ocr" } } }
function parseOcr(tx) {
  const L = tx.split("\n").map(l => l.trim()).filter(Boolean), r = { escuela: "", orientacion: "", curso: "", preceptor: "", turno: "", asignatura: "", profesor: "", anio: "", alumnos: [] };
  const g = re => { for (const l of L) { const m = l.match(re); if (m) return m[1].trim() } return "" };
  r.escuela = g(/((?:escuela|colegio|instituto|e\.?e\.?s\.?)\b.*)/i); r.curso = g(/curso\s*[:\-]?\s*(.+)/i); r.turno = g(/turno\s*[:\-]?\s*(\w+)/i); r.asignatura = g(/(?:asignatura|materia)\s*[:\-]?\s*(.+)/i); r.profesor = g(/profesor(?:a)?\s*[:\-]?\s*(.+)/i); r.preceptor = g(/preceptor(?:a)?\s*[:\-]?\s*(.+)/i); r.orientacion = g(/orientaci[oó]n\s*[:\-]?\s*(.+)/i); r.anio = g(/\b(20\d\d)\b/);
  const kw = /escuela|colegio|instituto|curso|turno|asignatura|materia|profesor|preceptor|orientaci|a[ñn]o|planilla|lista|nombre|apellido|dni|trimestre/i;
  r.alumnos = L.map(l => l.replace(/^[\s\d.\-)|]+/, "").replace(/[|_\[\]{}]+/g, " ").replace(/\s+/g, " ").trim()).filter(l => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ,.\-]{5,}$/.test(l) && l.split(" ").length >= 2 && !kw.test(l));
  return r
}
async function attScan(file) {
  const sm = await getSample(); if (!sm) { toast("Leer la asistencia desde una foto requiere abrir EDULOGGER dentro de Claude. Mientras tanto usá «Todos presentes» y marcá las ausencias.", 7000); return }
  toast("Leyendo la asistencia de la foto…", 25000);
  try {
    const lista = S.stu.map((x, i) => (i + 1) + ". " + x.n).join("\n");
    const r = await sm.json('Foto de una lista de asistencia de un curso. Alumnos registrados (numerados):\n' + lista + '\n\nDevolvé SOLO un JSON {"presentes":[números],"ausentes":[números],"justificados":[números]} con el número de cada alumno de la lista según lo marcado en la foto (P, tilde o ✓ = presente; A, X o cruz = ausente; J = justificado). Relacioná por apellido aunque el orden sea distinto. Si un alumno no tiene marca clara no lo incluyas. No inventes.', { images: [await reduce(file)], cache: false });
    const x = S.att[S.fecha] = S.att[S.fecha] || {}; let n = 0;
    [["presentes", "P"], ["ausentes", "A"], ["justificados", "J"]].forEach(([k, v]) => (r[k] || []).forEach(num => { const i = num - 1; if (S.stu[i]) { x[i] = { s: v, m: "" }; n++ } }));
    save(); render(); toast(n + " alumnos marcados desde la foto. Revisalos.", 5000)
  }
  catch (e) { toast("No se pudo leer la asistencia de la foto. Probá con una imagen más nítida.", 5000) }
}
function shareAtt() {
  const d = S.att[S.fecha] || {}, L = { P: "Presente", A: "Ausente", J: "Justificado" };
  const t = (S.f.curso || "Curso") + " · " + S.fecha + "\n" + S.stu.map((x, i) => (i + 1) + ". " + x.n + " — " + (d[i] ? L[d[i].s] : "sin registrar")).join("\n");
  if (navigator.share) navigator.share({ text: t }).catch(() => { }); else if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast("Resumen copiado"), () => toast("No se pudo copiar"))
}
const hdrMiss = () => ["inst", "curso", "mat", "tur"].filter(k => !S.f[k].trim() || S.f[k].includes("?")).length;
const hdrCard = () => `<details class="card noprint"${hdrMiss() ? " open" : ""}><summary>${hdrMiss() ? "⚠️ Encabezado incompleto (" + hdrMiss() + " datos): completalo o editalo" : "✏️ Editar encabezado"}</summary>${fields()}</details>`;
async function scan(file) {
  stopCam(); S.view = "scan"; S.step = 0; S.msg = "Leyendo encabezado y lista de alumnos… puede tardar hasta un minuto."; S.note = ""; render();
  const prevF = S.f, prevS = S.stu, mg = S.merge && S.course; S.f = blank(); S.stu = [];
  try {
    const r = await readSheet(file);
    const mp = { escuela: "inst", orientacion: "ori", curso: "curso", preceptor: "prec", turno: "tur", asignatura: "mat", profesor: "doc", anio: "ciclo" };
    for (const k in mp) S.f[mp[k]] = r[k] || "";
    S.stu = (r.alumnos || []).map(newStu); S.note = S.stu.length ? "" : "No se leyeron alumnos. Agregalos a mano."
  }
  catch (e) { const c = e && e.code; S.note = c === "ocr" ? "No se pudo leer la foto en este dispositivo. Probá con una imagen más nítida y recta, o pegá la lista de nombres." : c === "not_granted" ? "No diste permiso para que Claude lea la foto. Probá de nuevo y aceptá el permiso." : c === "rate_limited" ? "Hay demasiadas lecturas seguidas. Esperá un minuto y probá de nuevo." : "No se pudo leer la foto (" + (c || "error") + "). Probá con una imagen más nítida o pegá la lista de nombres." }
  if (mg) { const have = new Set(prevS.map(s => s.n.trim().toLowerCase())); S.stu = prevS.concat(S.stu.filter(s => !have.has(s.n.trim().toLowerCase()))); for (const k in prevF) if (prevF[k].trim()) S.f[k] = prevF[k]; S.note = S.note || "Sumamos los alumnos nuevos a tu curso. Revisá la lista." }
  if (!mg && S.stu.length) { make("asist"); toast("Lista creada con " + S.stu.length + " alumnos. " + (ocrUsed ? "Revisá los nombres. " : "") + (hdrMiss() ? "Completá el encabezado y tomá asistencia." : "Ya podés tomar asistencia."), 6000); return }
  S.step = 1; S.view = "review"; render(); toast(S.stu.length ? "Planilla leída: " + S.stu.length + " alumnos. Revisá los datos." : (S.note || "No se pudo leer la planilla."), 4500)
}
function make(tab) { S.stu = S.stu.filter(s => s.n.trim()); S.course = true; S.tab = tab || "alumnos"; S.view = "course"; if (!S.merge) { S.att = {}; S.cid = "c" + Date.now() } S.merge = false; save(); render(); toast("Curso guardado: " + S.f.curso + " · " + S.stu.length + " alumnos", 3800) }

document.addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t) return; const d = t.dataset;
  if (d.open) { openCourse(d.open); S.view = "course"; S.tab = d.tabto || "alumnos"; render(); return }
  if (d.nav) { go(d.nav); return }
  if (d.del !== undefined) { const nm = S.stu[d.del].n, k0 = +d.del; S.stu.splice(k0, 1); for (const f in S.att) { const o = S.att[f], n = {}; for (const i in o) { const x = +i; if (x < k0) n[x] = o[x]; else if (x > k0) n[x - 1] = o[x] } S.att[f] = n } toast("Alumno quitado" + (nm.trim() ? ": " + nm : "")); S.view === "course" && save(); $("#ros").innerHTML = roster(); if ($("#cnt")) $("#cnt").textContent = S.stu.length; refresh(); return }
  if (d.att !== undefined) { const x = S.att[S.fecha] = S.att[S.fecha] || {}; x[d.att] = { s: d.v, m: (x[d.att] && x[d.att].m) || "" }; save(); render(); const sn = S.stu[d.att].n, lb = { P: "Presente", A: "Ausente", J: "Justificado" }[d.v]; let ab = 0; if (d.v === "A") for (const k in S.att) if (S.att[k][d.att] && S.att[k][d.att].s === "A") ab++; toast(sn + ": " + lb + (ab >= 3 ? " · llegó a " + ab + " ausencias" : "") + (d.v === "J" ? " · escribí el motivo" : ""), ab >= 3 ? 5000 : 2600); return }
  const a = d.act;
  if (a === "start") { S.merge = false; S.step = 0; S.msg = ""; S.view = "scan"; render() }
  else if (a === "manual") { S.merge = false; S.f = blank(); S.stu = [newStu()]; S.note = "Completá los datos de la planilla y la lista de alumnos."; S.step = 1; S.view = "review"; render() }
  else if (a === "add") { S.stu.push(newStu()); toast("Alumno agregado: escribí el nombre"); if (S.course) save(); $("#ros").innerHTML = roster(); if ($("#cnt")) $("#cnt").textContent = S.stu.length; refresh() }
  else if (a === "saveatt") { S.lock = S.lock || {}; S.lock[S.fecha] = true; clearTimeout(svT); save(); clearTimeout(svT); persist("💾 Asistencia del " + S.fecha + " guardada en la base de datos ✅").then(ok => { if (!ok) S.lock[S.fecha] = false; render() }) }
  else if (a === "editatt") { S.lock[S.fecha] = false; render(); toast("Modo edición activado: modificá y volvé a guardar") }
  else if (a === "make") make(); else if (a === "share") shareAtt();
  else if (a === "cam") cam(); else if (a === "pant") pantalla(); else if (a === "snap") snap(); else if (a === "stopcam") { stopCam(); $("#camBox").innerHTML = "" }
  else if (a === "more") { S.merge = true; S.step = 0; S.msg = ""; S.view = "scan"; render() }
  else if (a === "alla") { const x = S.att[S.fecha] = S.att[S.fecha] || {}; S.stu.forEach((s, i) => x[i] = { s: "A", m: "" }); save(); render(); toast("Todos marcados ausentes (" + S.stu.length + ")") }
  else if (a === "ptxt") { const t = ($("#pasteTx").value || "").split("\n").map(l => { l = l.trim(); if (!l) return ""; const c = l.split("\t").map(x => x.trim()); if (c.length >= 3 && /^\d+$/.test(c[0])) return c[1] + " " + c[2]; return l.replace(/^\d+[\s.\-)]+/, "") }).filter(Boolean); t.forEach(n => S.stu.push(newStu(n))); $("#ros").innerHTML = roster(); $("#cnt").textContent = S.stu.length; refresh(); toast(t.length + " nombres cargados") }
  else if (a === "allp") { const x = S.att[S.fecha] = S.att[S.fecha] || {}; S.stu.forEach((s, i) => x[i] = { s: "P", m: "" }); save(); render(); toast("Todos marcados presentes (" + S.stu.length + ")") }
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.dataset.scan !== undefined && t.files.length) scan(t.files[0]);
  if (t.dataset.attscan !== undefined && t.files.length) attScan(t.files[0]);
  if (t.dataset.fecha !== undefined && t.value) { S.fecha = t.value; render() }
  if (t.dataset.remon !== undefined) { S.rem.on = t.checked; toast(t.checked ? "Recordatorio activado a las " + S.rem.h : "Recordatorio desactivado"); if (t.checked && window.Notification && Notification.permission === "default") { try { Notification.requestPermission().then(p => { S.remMsg = p === "granted" ? "Notificaciones del navegador activadas." : "El navegador no dio permiso: el aviso se mostrará dentro de la página."; const e = $("#remn"); if (e) e.textContent = S.remMsg }) } catch (x) { } } save() }
  if (t.dataset.remh !== undefined && t.value) { S.rem.h = t.value; S.rem.last = ""; save(); toast("Recordatorio a las " + t.value) }
  if (t.dataset.mot !== undefined) toast("Motivo guardado"); if (t.dataset.g !== undefined) toast("Nota guardada", 1600); if (t.dataset.s !== undefined && S.view === "course") toast("Alumno actualizado", 1800); if (t.dataset.f !== undefined && S.view === "course") toast("Dato guardado", 1800)
});
document.addEventListener("input", e => {
  const t = e.target, d = t.dataset;
  if (d.f) { S.f[d.f] = t.value; const c = $("[data-chip=" + d.f + "]"); if (c) c.innerHTML = chip(t.value); refresh(); if (S.course) save() }
  else if (d.s !== undefined) { S.stu[d.s].n = t.value; t.parentNode.className = bad(t.value) ? "q" : ""; refresh(); if (S.course) save() }
  else if (d.g !== undefined) { S.stu[d.g].g[d.j] = t.value; save(); calc() }
  else if (d.mot !== undefined) { S.att[S.fecha][d.mot].m = t.value; save() }
});
document.addEventListener("paste", e => { const it = [...((e.clipboardData && e.clipboardData.items) || [])].find(i => i.type.startsWith("image/")); if (it && (S.view === "scan" || S.view === "home")) scan(it.getAsFile()) });
document.addEventListener("dragover", e => e.preventDefault());
document.addEventListener("drop", e => { e.preventDefault(); const f = [...(e.dataTransfer.files || [])].find(x => x.type.startsWith("image/")); if (f && S.view === "scan") scan(f) });
let strm = null;
function camOk() { try { const p = document.permissionsPolicy || document.featurePolicy; return !p || !p.allowsFeature || p.allowsFeature("camera") } catch (e) { return true } }
function dispOk() { try { const p = document.permissionsPolicy || document.featurePolicy; return !!(p && p.allowsFeature && p.allowsFeature("display-capture") && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) } catch (e) { return false } }
async function pantalla() { try { const s = await navigator.mediaDevices.getDisplayMedia({ video: true }); const v = document.createElement("video"); v.srcObject = s; v.muted = true; await v.play(); await new Promise(r => setTimeout(r, 500)); const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0); s.getTracks().forEach(t => t.stop()); c.toBlob(b => scan(b), "image/jpeg", .9) } catch (e) { toast("No se pudo capturar la pantalla. Usá Win+Shift+S y pegá con Ctrl+V.", 5000) } }
function stopCam() { if (strm) { strm.getTracks().forEach(t => t.stop()); strm = null } }
async function cam() { const b = $("#camBox"); try { strm = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); b.innerHTML = '<video id="vid" autoplay playsinline muted style="width:100%;max-width:420px;border-radius:12px"></video><div class="bar"><button class="btn" data-act="snap">📸 Capturar</button><button class="btn ghost" data-act="stopcam">Cerrar cámara</button></div>'; $("#vid").srcObject = strm } catch (e) { toast("No se pudo abrir la cámara", 3500); b.innerHTML = '<p class="hint">La cámara en vivo no está disponible dentro de esta página (el navegador la bloquea). En el celular usá <b>Sacar foto</b>. En la compu, sacá la foto con el celular, pasala a la compu y usá <b>Elegir imagen</b>, o pegá una captura de pantalla.</p>' } }
function snap() { const v = $("#vid"); if (!v || !v.videoWidth) return; const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0); c.toBlob(b => { stopCam(); scan(b) }, "image/jpeg", .9) }
function alerts() {
  const out = [], t = hoy(), w = new Date().getDay();
  S.cs.forEach(c => {
    const nm = c.f.curso || "Curso", d = c.att[t] || {}, reg = Object.keys(d).length;
    if (w > 0 && w < 6 && c.stu.length && reg < c.stu.length) out.push({ k: "as", c: c.id, t: nm + ": " + (reg ? "falta completar la asistencia de hoy (" + reg + "/" + c.stu.length + ")" : "todavía no tomaste asistencia hoy") + "." });
    const aus = c.stu.map((s, i) => [s.n, Object.values(c.att).filter(a => a[i] && a[i].s === "A").length]).filter(x => x[1] >= 3);
    if (aus.length) out.push({ k: "fa", c: c.id, t: nm + ": " + aus.length + " alumno" + (aus.length > 1 ? "s" : "") + " con 3 o más ausencias (" + aus.map(x => x[0] + " " + x[1]).join(", ") + ")." });
    for (let j = 0; j < 3; j++) { const f = c.stu.filter(s => String(s.g[j]).trim()).length; if (f && f < c.stu.length) { out.push({ k: "no", c: c.id, t: nm + ": faltan " + (c.stu.length - f) + " notas del " + (j + 1) + "° trimestre." }); break } }
  });
  return out
}
function avisosView() {
  const a = alerts(), R = S.rem;
  return '<h1 class="hello">Avisos</h1><p class="sub">Pendientes de tus cursos.</p><div class="card">' + (a.length ? a.map(x => `<div class="al"><div class="top"><span class="n">${esc(x.t)}</span><button class="btn ghost" data-open="${x.c}" data-tabto="${x.k === "no" ? "notas" : "asist"}">Ver</button></div></div>`).join("") : '<p class="hint">No hay pendientes. ✅</p>') + '</div><div class="card"><h3 style="margin-bottom:8px">Recordatorio diario</h3><label class="bar" style="margin:0"><input type="checkbox" data-remon style="width:auto"' + (R.on ? " checked" : "") + '> Avisarme de lunes a viernes a las <input type="time" data-remh value="' + R.h + '" style="width:auto"></label><p class="hint" id="remn">' + esc(S.remMsg || "El aviso aparece mientras la página esté abierta; no puede llegar con la página cerrada.") + "</p></div>"
}
let tm; function toast(m, ms) { let e = $("#toast"); if (!e) { e = document.createElement("div"); e.id = "toast"; e.setAttribute("role", "status"); document.body.appendChild(e) } e.textContent = m; e.className = "on"; clearTimeout(tm); tm = setTimeout(() => e.className = "", ms || 3200) }
function tick() {
  const R = S.rem; if (!R.on) return; const n = new Date(), w = n.getDay(), hm = String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0");
  if (w > 0 && w < 6 && hm >= R.h && R.last !== hoy()) { const a = alerts(); R.last = hoy(); save(); if (a.length) { const m = "Tenés " + a.length + " pendiente" + (a.length > 1 ? "s" : "") + ": " + a[0].t; toast(m, 9000); try { if (window.Notification && Notification.permission === "granted") new Notification("EDULOGGER", { body: m }) } catch (e) { } } }
}
function ini(n) { return n.replace(/\?/g, "").trim().split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase() || "?" }
function home() {
  const c = S.cs.find(x => x.id === S.cid) || S.cs[0], N = c ? c.stu.length : 0, pr = c ? Object.keys(c.att[hoy()] || {}).length : 0, av = alerts().length;
  const lb = (t, i) => `<label class="btn light" style="position:relative;overflow:hidden">${t}<input class="vh" type="file" accept="image/*"${i ? ' capture="environment"' : ""} data-scan></label>`;
  return '<h1 class="hello">¡Hola! 👋</h1><p class="sub">Tu asistente para lista, asistencia y calificaciones.</p>' + (S.note ? `<div class="card">${esc(S.note)}</div>` : "") +
    `<section class="hero"><div class="cam" aria-hidden="true">📷</div><h2>Creá tu lista desde una foto</h2><p>Sacale una foto a la lista impresa: EDULOGGER lee los nombres, arma el curso y te deja tomar asistencia.</p><div class="bar" style="margin:0">${lb("📷 Sacar foto", 1)}${lb("🖼️ Elegir imagen", 0)}<button class="btn ghost" style="color:inherit;border-color:currentColor" data-act="start">Pegar captura o lista</button></div></section>` +
    `<div class="tiles"><button class="tile t1" data-nav="asist"><span class="big">📋</span><b>Asistencia</b><small>${c ? pr + " de " + N + " hoy" : "Sin curso"}</small></button><button class="tile t2" data-nav="alumnos"><span class="big">👥</span><b>Alumnos</b><small>${N} en el curso</small></button><button class="tile t3" data-nav="notas"><span class="big">📝</span><b>Calificaciones</b><small>Planilla y cuadro</small></button><button class="tile t4" data-nav="avisos"><span class="big">🔔</span><b>Avisos</b><small>${av} pendiente${av === 1 ? "" : "s"}</small></button></div>` +
    (S.cs.length ? `<div class="card"><h3 style="margin-bottom:10px">Mis cursos</h3><div class="bar" style="margin:0">${S.cs.map(c => `<button class="btn" data-open="${c.id}">${esc(c.f.curso)}${c.f.mat ? " · " + esc(c.f.mat) : ""}</button>`).join("")}</div><p class="hint">Cada planilla que escanees crea un curso nuevo.</p></div>` : "")
}
function attView() {
  const d = S.att[S.fecha] || {}; const dates = Object.keys(S.att); const c = { P: 0, A: 0, J: 0 }; Object.values(d).forEach(a => c[a.s]++); const sin = S.stu.length - c.P - c.A - c.J, L = !!(S.lock && S.lock[S.fecha]), D = L ? " disabled" : "";
  return `<div class="card"><div class="bar" style="margin:0"><h3 style="margin-right:auto">Asistencia del <input type="date" id="fe" value="${S.fecha}" data-fecha style="width:auto;display:inline-block"></h3></div><div class="bar" style="margin:10px 0 0"><span class="pill g">${c.P} presentes</span><span class="pill r">${c.A} ausentes</span><span class="pill y">${c.J} justificados</span><span class="pill">${sin} sin registrar</span><button class="btn ghost" data-act="allp"${D}>Todos presentes</button><button class="btn ghost" data-act="alla"${D}>Todos ausentes</button><label class="btn ghost" style="position:relative;overflow:hidden">📷 Asistencia desde foto<input class="vh" type="file" accept="image/*" data-attscan></label><button class="btn ghost" data-act="share">📤 Compartir</button></div><div class="bar" style="margin:10px 0 0"><button class="btn" data-act="saveatt"${L ? " disabled" : ""}>💾 Guardar asistencia</button><button class="btn ghost" data-act="editatt"${L ? "" : " disabled"}>✏️ Editar</button>${L ? '<span class="hint">Asistencia guardada. Tocá Editar para modificarla.</span>' : ""}</div></div><div class="card">` +
    S.stu.map((s, i) => {
      const a = d[i] || {}, t = { P: 0, A: 0, J: 0 }; dates.forEach(k => { const x = S.att[k][i]; if (x) t[x.s]++ });
      return `<div class="al s${a.s || ""}"><div class="top"><span class="av">${ini(s.n)}</span><span class="n">${esc(s.n)}</span><div class="seg" role="group" aria-label="Asistencia de ${esc(s.n)}">${["P", "A", "J"].map(k => `<button class="${k}" aria-pressed="${a.s === k}" data-att="${i}" data-v="${k}"${D}>${{ P: "Presente", A: "Ausente", J: "Justificado" }[k]}</button>`).join("")}</div></div>${a.s === "J" ? `<input class="mot" data-mot="${i}" placeholder="Motivo de la justificación" value="${esc(a.m || "")}"${D}>` : ""}</div>`
    }).join("") + "</div>"
}
setInterval(tick, 30000); tick();
document.addEventListener("click", e => { if (e.target.closest && e.target.closest("label.btn")) { try { sessionStorage.setItem("edu-cam", "1") } catch (x) { } } });
document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(() => { try { sessionStorage.removeItem("edu-cam") } catch (x) { } }, 2500) });
let rebooted = false; try { if (sessionStorage.getItem("edu-cam")) { sessionStorage.removeItem("edu-cam"); rebooted = true } } catch (x) { }
if (rebooted) { S.view = "scan"; S.step = 0; S.msg = ""; S.note = "" }
render();
if (rebooted) toast("El celular cerró la página al abrir la cámara (poca memoria). Sacá la foto con la app Cámara y elegíla con “Elegir imagen”.", 9000);