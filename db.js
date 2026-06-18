const path = require('path');
const Database = require('better-sqlite3');

// File-based SQLite database lives next to the server so data persists
// between restarts. Override the location with SELFHELP_DB if needed.
const dbPath = process.env.SELFHELP_DB || path.join(__dirname, 'selfhelp.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS deeds (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT    NOT NULL,
    description  TEXT,
    points       INTEGER NOT NULL DEFAULT 1,
    completed    INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    created_at   TEXT    NOT NULL,
    awarded      INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS stats (
    id             INTEGER PRIMARY KEY CHECK (id = 1),
    lifetime_score INTEGER NOT NULL DEFAULT 0
  );

  INSERT OR IGNORE INTO stats (id, lifetime_score) VALUES (1, 0);
`);

// Migrate older databases that predate the `awarded` column.
const hasAwarded = db
  .prepare(`PRAGMA table_info(deeds)`)
  .all()
  .some((col) => col.name === 'awarded');
if (!hasAwarded) {
  db.exec(`ALTER TABLE deeds ADD COLUMN awarded INTEGER NOT NULL DEFAULT 0`);
}

module.exports = db;
