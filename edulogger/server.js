// EDULOGGER · servidor sin dependencias (solo Node >= 22.13) + base de datos SQLite
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, "public");
fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
const db = new DatabaseSync(path.join(__dirname, "data", "edulogger.db"));
db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

const HDR = ["inst", "ori", "curso", "prec", "tur", "mat", "doc", "ciclo"];

function getState() {
  const cs = db.prepare("SELECT * FROM courses ORDER BY created_at").all().map((c) => {
    const stu = db.prepare("SELECT id,name FROM students WHERE course_id=? ORDER BY pos").all(c.id);
    const pos = new Map(stu.map((s, i) => [s.id, i]));
    const g = db.prepare("SELECT g.student_id,g.slot,g.value FROM grades g JOIN students s ON s.id=g.student_id WHERE s.course_id=?").all(c.id);
    const students = stu.map((s) => ({ n: s.name, g: ["", "", "", "", "", ""] }));
    g.forEach((r) => (students[pos.get(r.student_id)].g[r.slot] = r.value));
    const att = {};
    db.prepare("SELECT student_id,fecha,status,motivo FROM attendance WHERE course_id=?").all(c.id)
      .forEach((r) => ((att[r.fecha] ||= {})[pos.get(r.student_id)] = { s: r.status, m: r.motivo }));
    return { id: c.id, f: Object.fromEntries(HDR.map((k) => [k, c[k]])), stu: students, att };
  });
  const cur = db.prepare("SELECT value FROM settings WHERE key='cur'").get();
  const rem = db.prepare("SELECT value FROM settings WHERE key='rem'").get();
  return { cs, cur: cur ? JSON.parse(cur.value) : "", rem: rem ? JSON.parse(rem.value) : null };
}

function saveCourse(id, c) {
  db.exec("BEGIN");
  try {
    const f = c.f || {};
    const ex = db.prepare("SELECT 1 FROM courses WHERE id=?").get(id);
    if (ex) db.prepare(`UPDATE courses SET ${HDR.map((k) => k + "=?").join(",")} WHERE id=?`).run(...HDR.map((k) => f[k] || ""), id);
    else db.prepare(`INSERT INTO courses (id,${HDR.join(",")}) VALUES (?,${HDR.map(() => "?").join(",")})`).run(id, ...HDR.map((k) => f[k] || ""));
    db.prepare("DELETE FROM students WHERE course_id=?").run(id); // borra notas y asistencia en cascada
    const ids = (c.stu || []).map((s, i) => {
      const r = db.prepare("INSERT INTO students (course_id,pos,name) VALUES (?,?,?)").run(id, i, s.n || "");
      (s.g || []).forEach((v, j) => String(v).trim() && db.prepare("INSERT INTO grades (student_id,slot,value) VALUES (?,?,?)").run(r.lastInsertRowid, j, String(v)));
      return Number(r.lastInsertRowid);
    });
    for (const [fecha, d] of Object.entries(c.att || {}))
      for (const [i, a] of Object.entries(d))
        if (ids[i] !== undefined && ["P", "A", "J"].includes(a.s))
          db.prepare("INSERT INTO attendance (course_id,student_id,fecha,status,motivo) VALUES (?,?,?,?,?)").run(id, ids[i], fecha, a.s, a.m || "");
    db.exec("COMMIT");
  } catch (e) { db.exec("ROLLBACK"); throw e; }
}

const body = (req) => new Promise((ok, no) => {
  let b = ""; req.on("data", (d) => { b += d; if (b.length > 5e7) req.destroy(); });
  req.on("end", () => { try { ok(JSON.parse(b || "{}")); } catch (e) { no(e); } });
});
const json = (res, code, o) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(o)); };
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (url.pathname.startsWith("/api/")) {
      const m = url.pathname.match(/^\/api\/courses\/([\w-]+)$/);
      if (req.method === "GET" && url.pathname === "/api/state") return json(res, 200, getState());
      if (req.method === "PUT" && m) { saveCourse(m[1], await body(req)); return json(res, 200, { ok: true }); }
      if (req.method === "DELETE" && m) { db.prepare("DELETE FROM courses WHERE id=?").run(m[1]); return json(res, 200, { ok: true }); }
      if (req.method === "PUT" && url.pathname === "/api/settings") {
        const b = await body(req);
        for (const k of ["rem", "cur"]) if (k in b) db.prepare("INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(k, JSON.stringify(b[k]));
        return json(res, 200, { ok: true });
      }
      return json(res, 404, { error: "No encontrado" });
    }
    let f = path.normalize(path.join(PUB, url.pathname === "/" ? "index.html" : url.pathname));
    if (!f.startsWith(PUB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("404"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  } catch (e) { console.error(e); json(res, 500, { error: e.message }); }
}).listen(PORT, () => console.log(`EDULOGGER listo en http://localhost:${PORT}`));
