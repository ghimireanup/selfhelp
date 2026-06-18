const path = require('path');
const express = require('express');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Difficulty -> point reward. Anything else falls back to Easy.
const ALLOWED_POINTS = new Set([1, 3, 5]);

// Success Score = total points earned from completed deeds.
function currentScore() {
  const row = db
    .prepare(`SELECT COALESCE(SUM(points), 0) AS score FROM deeds WHERE completed = 1`)
    .get();
  return row.score;
}

function listDeeds() {
  return db.prepare(`SELECT * FROM deeds ORDER BY created_at DESC, id DESC`).all();
}

// GET /api/deeds -> all deeds (newest first) + current cumulative score
app.get('/api/deeds', (req, res) => {
  res.json({ deeds: listDeeds(), score: currentScore() });
});

// POST /api/deeds -> create a good deed
app.post('/api/deeds', (req, res) => {
  const title = (req.body.title || '').trim();
  const description = (req.body.description || '').trim() || null;
  let points = parseInt(req.body.points, 10);
  if (!ALLOWED_POINTS.has(points)) points = 1;

  if (!title) {
    return res.status(400).json({ error: 'A title is required.' });
  }

  const info = db
    .prepare(
      `INSERT INTO deeds (title, description, points, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(title, description, points, new Date().toISOString());

  const deed = db.prepare(`SELECT * FROM deeds WHERE id = ?`).get(info.lastInsertRowid);
  res.status(201).json({ deed, score: currentScore() });
});

// PATCH /api/deeds/:id -> toggle completion
app.patch('/api/deeds/:id', (req, res) => {
  const deed = db.prepare(`SELECT * FROM deeds WHERE id = ?`).get(req.params.id);
  if (!deed) {
    return res.status(404).json({ error: 'Deed not found.' });
  }

  const completed = deed.completed ? 0 : 1;
  const completedAt = completed ? new Date().toISOString() : null;
  db.prepare(`UPDATE deeds SET completed = ?, completed_at = ? WHERE id = ?`).run(
    completed,
    completedAt,
    deed.id
  );

  const updated = db.prepare(`SELECT * FROM deeds WHERE id = ?`).get(deed.id);
  res.json({ deed: updated, score: currentScore() });
});

// DELETE /api/deeds/:id -> remove a deed
app.delete('/api/deeds/:id', (req, res) => {
  const info = db.prepare(`DELETE FROM deeds WHERE id = ?`).run(req.params.id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Deed not found.' });
  }
  res.json({ score: currentScore() });
});

app.listen(PORT, () => {
  console.log(`SelfHelp running at http://localhost:${PORT}`);
});
