# EDULOGGER

Asistente docente: lista de alumnos, asistencia y calificaciones. Frontend HTML/CSS/JS + servidor Node + base de datos **SQLite**.

## Cómo ejecutarlo en Visual Studio Code
1. Instalá **Node.js 22.13 o superior** (https://nodejs.org). Verificá con `node -v`.
2. En VS Code: *Archivo → Abrir carpeta…* y elegí `edulogger`.
3. Abrí la terminal (`Ctrl + ñ`) y ejecutá `npm start` (no necesita `npm install`).
4. Abrí http://localhost:3000


Para recargar el servidor al editar: `npm run dev`.

## Estructura
- `server.js`: API REST + archivos estáticos
- `schema.sql`: tablas (courses, students, grades, attendance, settings)
- `data/edulogger.db`: se crea sola al iniciar
- `public/`: `index.html`, `css/styles.css`, `js/app.js`

## API
- `GET /api/state`: cursos, alumnos, notas, asistencia y ajustes
- `PUT /api/courses/:id`: crea o actualiza un curso completo
- `DELETE /api/courses/:id`: elimina un curso
- `PUT /api/settings`: recordatorio y curso actual

## Notas
- Si tenías cursos guardados en el navegador (versión anterior), se migran solos la primera vez.
- Leer planillas con foto usa Tesseract.js (necesita internet la primera vez).
- «Asistencia desde foto» solo funciona dentro de Claude.
- Para varios dispositivos o docentes, migrar a PostgreSQL/Supabase.
