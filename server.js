import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------- Database setup ----------------
import { mkdirSync } from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'cwl.db');
mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    th INTEGER NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS day_data (
    participant_id TEXT NOT NULL,
    day INTEGER NOT NULL,
    opp_th TEXT DEFAULT '',
    percent INTEGER DEFAULT NULL,
    attack_stars INTEGER DEFAULT 0,
    stars_lost INTEGER DEFAULT 0,
    attacked INTEGER DEFAULT 0,
    PRIMARY KEY (participant_id, day),
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
  );
`);

try { db.exec(`ALTER TABLE participants ADD COLUMN sort_order INTEGER DEFAULT 0`); } catch (_) {}
db.exec(`UPDATE participants SET sort_order = rowid WHERE sort_order = 0 AND NOT EXISTS (SELECT 1 FROM participants WHERE sort_order != 0)`);

// Prepared statements
const stmts = {
  getParticipants: db.prepare('SELECT id, name, th FROM participants ORDER BY sort_order ASC, created_at ASC'),
  getAllDayData: db.prepare('SELECT * FROM day_data'),
  insertParticipant: db.prepare('INSERT INTO participants (id, name, th) VALUES (?, ?, ?)'),
  insertEmptyDay: db.prepare('INSERT INTO day_data (participant_id, day) VALUES (?, ?)'),
  deleteParticipant: db.prepare('DELETE FROM participants WHERE id = ?'),
  upsertDay: db.prepare(`
    INSERT INTO day_data (participant_id, day, opp_th, percent, attack_stars, stars_lost, attacked)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(participant_id, day) DO UPDATE SET
      opp_th = excluded.opp_th,
      percent = excluded.percent,
      attack_stars = excluded.attack_stars,
      stars_lost = excluded.stars_lost,
      attacked = excluded.attacked
  `),
  deleteAllParticipants: db.prepare('DELETE FROM participants'),
  deleteAllDays: db.prepare('DELETE FROM day_data'),
  updateSortOrder: db.prepare('UPDATE participants SET sort_order = ? WHERE id = ?'),
};

const DAYS = [1, 2, 3, 4, 5, 6, 7];

// ---------------- App setup ----------------
const app = express();
app.use(cors());
app.use(express.json());

// GET full state
app.get('/api/state', (_req, res) => {
  try {
    const participants = stmts.getParticipants.all();
    const dayRows = stmts.getAllDayData.all();

    const data = {};
    participants.forEach(p => {
      data[p.id] = {};
      DAYS.forEach(d => {
        data[p.id][d] = {
          oppTH: '', percent: '', attackStars: 0, starsLost: 0, attacked: false,
        };
      });
    });

    dayRows.forEach(row => {
      if (data[row.participant_id]) {
        data[row.participant_id][row.day] = {
          oppTH: row.opp_th,
          percent: row.percent === null ? '' : row.percent,
          attackStars: row.attack_stars,
          starsLost: row.stars_lost,
          attacked: !!row.attacked,
        };
      }
    });

    res.json({ participants, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// POST add participant
app.post('/api/participants', (req, res) => {
  const { id, name, th } = req.body;
  if (!id || !name || !th) {
    return res.status(400).json({ error: 'invalid payload' });
  }
  try {
    const tx = db.transaction(() => {
      stmts.insertParticipant.run(id, name, th);
      DAYS.forEach(d => stmts.insertEmptyDay.run(id, d));
    });
    tx();
    res.json({ id, name, th });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE participant
app.delete('/api/participants/:id', (req, res) => {
  try {
    stmts.deleteParticipant.run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// PUT update day data
app.put('/api/day-data', (req, res) => {
  const { participantId, day, oppTH, percent, attackStars, starsLost, attacked } = req.body;
  if (!participantId || !day) {
    return res.status(400).json({ error: 'invalid payload' });
  }
  try {
    stmts.upsertDay.run(
      participantId,
      Number(day),
      oppTH || '',
      percent === '' || percent === null || percent === undefined ? null : Number(percent),
      Number(attackStars) || 0,
      Number(starsLost) || 0,
      attacked ? 1 : 0,
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// PUT reorder participants
app.put('/api/participants/order', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' });
  try {
    const tx = db.transaction(() => {
      ids.forEach((id, i) => stmts.updateSortOrder.run(i, id));
    });
    tx();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE all (reset)
app.delete('/api/state', (_req, res) => {
  try {
    const tx = db.transaction(() => {
      stmts.deleteAllParticipants.run();
      stmts.deleteAllDays.run();
    });
    tx();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Serve React build in production (must be after all /api routes)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🏰  CWL server listo en http://localhost:${PORT}`);
  console.log(`📦  Base de datos: ${DB_PATH}\n`);
});
