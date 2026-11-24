PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  inst TEXT DEFAULT '', ori TEXT DEFAULT '', curso TEXT DEFAULT '', prec TEXT DEFAULT '',
  tur TEXT DEFAULT '', mat TEXT DEFAULT '', doc TEXT DEFAULT '', ciclo TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  pos INTEGER NOT NULL,
  name TEXT NOT NULL DEFAULT ''
);
-- slot: 0=1°T 1=2°T 2=3°T 3=Diciembre 4=Febrero/Marzo 5=Calif. definitiva
CREATE TABLE IF NOT EXISTS grades (
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (student_id, slot)
);
CREATE TABLE IF NOT EXISTS attendance (
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fecha TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('P','A','J')),
  motivo TEXT DEFAULT '',
  PRIMARY KEY (student_id, fecha)
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
