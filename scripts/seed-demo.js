/*
 * Adds a synthetic demo class (one teacher, 16 students with history) to the
 * database so the teacher views can be explored. Never run this on a
 * database with real learners you intend to report on.
 *
 *   node scripts/seed-demo.js            uses NLX_DB or data/neurolearnx.db
 *
 * The generated sign-in details are written to data/demo-accounts.txt.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { openDb, tx } = require('../server/db.js');
const A = require('../server/auth.js');
const { demoData } = require('./demo-data.js');

const DB_FILE = process.env.NLX_DB || path.join(__dirname, '..', 'data', 'neurolearnx.db');
const db = openDb(DB_FILE);
const exists = db.prepare('SELECT 1 FROM users WHERE username = ?').get('demo.teacher');
if (exists) { console.log('The demo class already exists (username demo.teacher). Nothing changed.'); process.exit(0); }

const pw = () => crypto.randomBytes(6).toString('base64url');
const now = new Date().toISOString();
const data = demoData();
const teacherPw = pw(), studentPw = pw();
const teacherId = A.newId('T'), classId = A.newId('C');
const studentHash = A.hashPassword(studentPw);
const lines = [`NeuroLearn-X demo accounts (synthetic data) — created ${now}`, '', `Teacher   username: demo.teacher   password: ${teacherPw}`, '', `All demo students share the password: ${studentPw}`];

tx(db, () => {
  db.prepare(`INSERT INTO users (id, role, username, name, pass_hash, created_at) VALUES (?, 'teacher', 'demo.teacher', 'Demo Teacher', ?, ?)`).run(teacherId, A.hashPassword(teacherPw), now);
  db.prepare('INSERT INTO classes (id, name, teacher_id, join_code, created_at) VALUES (?, ?, ?, ?, ?)').run(classId, 'Demo class (synthetic)', teacherId, A.joinCode(), now);
  const idMap = {};
  data.learners.forEach(l => {
    const id = A.newId('S');
    idMap[l.id] = id;
    const username = `demo.${l.name.toLowerCase().replace(/[^a-z]+/g, '.')}`.replace(/\.+$/, '');
    lines.push(`Student   username: ${username}`);
    db.prepare(`INSERT INTO users (id, role, username, name, pass_hash, class_id, strand, grp, pre_test, post_test, diagnostic_done, created_at)
      VALUES (?, 'student', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`).run(id, username, l.name, studentHash, classId, l.strand, l.group, l.preTest, l.postTest, now);
  });
  // source 'demo' keeps these made-up answers out of the models once real students exist.
  const ins = db.prepare(`INSERT INTO attempts (id, learner_id, skill_id, date, type, items_correct, items_total, time_sec, hints, effort, source, created_at, answers)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'demo', ?, ?)`);
  data.attempts.forEach(a => ins.run(A.newId('A'), idMap[a.learnerId], a.skillId, a.date, a.type, a.itemsCorrect, a.itemsTotal, a.timeSec, a.hints, a.effort, now, a.answers || ''));
});

const out = path.join(path.dirname(DB_FILE), 'demo-accounts.txt');
fs.writeFileSync(out, lines.join('\n') + '\n');
console.log(`Demo class added to ${DB_FILE}`);
console.log(`Sign-in details written to ${out}`);
