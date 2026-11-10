/*
 * NeuroLearn-X — SQLite storage (Node's built-in node:sqlite, no dependencies).
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  role            TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  username        TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name            TEXT NOT NULL,
  pass_hash       TEXT NOT NULL,
  must_change     INTEGER NOT NULL DEFAULT 0,
  class_id        TEXT REFERENCES classes(id),
  strand          TEXT NOT NULL DEFAULT '',
  grp             TEXT NOT NULL DEFAULT '' CHECK (grp IN ('', 'adaptive', 'standard')),
  pre_test        INTEGER,
  post_test       INTEGER,
  diagnostic_done INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS classes (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  teacher_id  TEXT NOT NULL REFERENCES users(id),
  join_code   TEXT NOT NULL UNIQUE,
  assessment  TEXT NOT NULL DEFAULT 'none' CHECK (assessment IN ('none', 'pre', 'post')),
  created_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS attempts (
  id             TEXT PRIMARY KEY,
  learner_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id       TEXT NOT NULL,
  date           TEXT NOT NULL,
  type           TEXT NOT NULL,
  items_correct  INTEGER NOT NULL,
  items_total    INTEGER NOT NULL,
  time_sec       INTEGER NOT NULL,
  hints          INTEGER NOT NULL DEFAULT 0,
  effort         INTEGER,
  source         TEXT NOT NULL DEFAULT 'app',
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS attempts_learner ON attempts(learner_id);
CREATE TABLE IF NOT EXISTS quizzes (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active',
  state       TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS quizzes_user ON quizzes(user_id, status);
-- Teachers' changes to the question bank, shared by the whole school.
-- 'custom' rows are new questions; 'override' rows edit or hide a built-in
-- question (id = its built-in id, e.g. CW1#3).
CREATE TABLE IF NOT EXISTS item_bank (
  id          TEXT PRIMARY KEY,
  skill_id    TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('custom', 'override')),
  active      INTEGER NOT NULL DEFAULT 1,
  spec        TEXT,
  updated_by  TEXT NOT NULL DEFAULT '',
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS item_bank_skill ON item_bank(skill_id);
-- Pre-test (the diagnostic) and post-test scores, with a per-subject breakdown (JSON).
CREATE TABLE IF NOT EXISTS test_results (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('pre', 'post')),
  track       TEXT NOT NULL DEFAULT '',
  percent     INTEGER NOT NULL,
  correct     INTEGER NOT NULL,
  total       INTEGER NOT NULL,
  answered    INTEGER NOT NULL,
  time_sec    INTEGER NOT NULL,
  timed_out   INTEGER NOT NULL DEFAULT 0,
  subjects    TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS test_results_user ON test_results(user_id, kind);
-- One row per answered question: how long the student spent on it.
CREATE TABLE IF NOT EXISTS responses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id     TEXT NOT NULL,
  kind        TEXT NOT NULL,
  skill_id    TEXT NOT NULL,
  subject_id  TEXT,
  number      INTEGER NOT NULL,
  correct     INTEGER NOT NULL,
  time_sec    REAL NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS responses_user ON responses(user_id, quiz_id);
`;

// Columns added after the first release; existing databases get them on open.
// rapid = answers under 3 seconds (rapid guesses), kept out of mastery estimates.
const ADDED_COLUMNS = [
  ['attempts', 'rapid', 'INTEGER NOT NULL DEFAULT 0'],
  ['attempts', 'rapid_correct', 'INTEGER NOT NULL DEFAULT 0'],
  ['responses', 'rapid', 'INTEGER NOT NULL DEFAULT 0'],
  ['test_results', 'rapid', 'INTEGER NOT NULL DEFAULT 0'],
  // An attempt's answers in order, one character each (engine.answerCode); '' when only totals are known.
  ['attempts', 'answers', "TEXT NOT NULL DEFAULT ''"],
  ['responses', 'hinted', 'INTEGER NOT NULL DEFAULT 0']
];

function migrate(db) {
  ADDED_COLUMNS.forEach(([table, col, def]) => {
    const has = db.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === col);
    if (!has) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
  });
  // The synthetic demo class was once stored like real answers. Marking it
  // keeps made-up students out of the models once real students exist.
  db.exec(`UPDATE attempts SET source = 'demo' WHERE source = 'app' AND learner_id IN
    (SELECT u.id FROM users u JOIN classes c ON c.id = u.class_id WHERE c.name = 'Demo class (synthetic)')`);
}

function openDb(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

// Runs fn inside a transaction; rolls back on any throw.
function tx(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

module.exports = { openDb, tx, migrate };
