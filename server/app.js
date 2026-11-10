/*
 * NeuroLearn-X — HTTP API and static file server.
 *
 * Every /api route checks the session and role; teachers only reach
 * students in classes they own, students only reach their own records.
 * State-changing requests must be JSON and carry the X-NLX header, which a
 * cross-site form cannot set (CSRF protection alongside SameSite cookies).
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { tx } = require('./db.js');
const A = require('./auth.js');
const QZ = require('./assess.js');
const Q = require('./questions.js');
const E = require('../public/js/engine.js');
const C = require('../public/js/curriculum.js');

const G = C.graph;
const PUBLIC = path.join(__dirname, '..', 'public');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json'
};
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
};
const USERNAME = /^[A-Za-z0-9._-]{3,32}$/;
// Students choose one of these tracks; '' only for accounts made before tracks existed.
const TRACKS = C.TRACK_IDS;
const track = (v, required) => {
  if (!required && (v === '' || v == null)) return '';
  return oneOf(v, TRACKS, 'track. Choose STEM, HUMSS, ABM or GAS');
};
const now = () => new Date().toISOString();
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const err = QZ.httpError;

// ------------------------------------------------------------ validation
function str(v, name, min = 1, max = 80) {
  if (typeof v !== 'string') throw err(400, `${name} is required.`);
  const s = v.trim();
  if (s.length < min || s.length > max) throw err(400, `${name} must be ${min}–${max} characters.`);
  return s;
}
function int(v, name, min, max, nullable = false) {
  if (nullable && (v === null || v === '' || v === undefined)) return null;
  if (!Number.isInteger(v) || v < min || v > max) throw err(400, `${name} must be a whole number from ${min} to ${max}.`);
  return v;
}
function username(v) {
  const u = str(v, 'Username', 3, 32);
  if (!USERNAME.test(u)) throw err(400, 'Username may use letters, numbers, dots, dashes and underscores (3–32 characters).');
  return u;
}
function password(v, role) {
  const min = role === 'teacher' ? 8 : 6;
  if (typeof v !== 'string' || v.length < min || v.length > 128) throw err(400, `Password must be at least ${min} characters.`);
  return v;
}
function oneOf(v, list, name) { if (!list.includes(v)) throw err(400, `Invalid ${name}.`); return v; }

// ------------------------------------------------------------ app
const KATEX_DIR = path.join(__dirname, '..', 'node_modules', 'katex', 'dist');

/*
 * teacherSignupCode: when set, teachers creating their own account must
 * enter it (share it only with staff). When empty, teacher sign-up is open.
 */
function createApp({ db, secureCookies = false, teacherSignupCode = '' }) {
  const throttle = new A.LoginThrottle();
  let modelCache = null;
  const invalidateModel = () => { if (modelCache) modelCache.dirty = true; };

  const q = {
    userByName: db.prepare('SELECT * FROM users WHERE username = ?'),
    user: db.prepare('SELECT * FROM users WHERE id = ?'),
    countUsers: db.prepare('SELECT COUNT(*) AS n FROM users'),
    insertUser: db.prepare(`INSERT INTO users (id, role, username, name, pass_hash, must_change, class_id, strand, grp, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    insertClass: db.prepare('INSERT INTO classes (id, name, teacher_id, join_code, created_at) VALUES (?, ?, ?, ?, ?)'),
    classById: db.prepare('SELECT * FROM classes WHERE id = ?'),
    classByCode: db.prepare('SELECT * FROM classes WHERE join_code = ?'),
    classesOf: db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM users u WHERE u.class_id = c.id) AS students FROM classes c WHERE teacher_id = ? ORDER BY created_at`),
    studentsOf: db.prepare(`SELECT u.*, c.name AS class_name FROM users u JOIN classes c ON c.id = u.class_id
      WHERE c.teacher_id = ? AND u.role = 'student' ORDER BY c.created_at, u.name COLLATE NOCASE`),
    attemptsOfTeacher: db.prepare(`SELECT a.* FROM attempts a JOIN users u ON u.id = a.learner_id JOIN classes c ON c.id = u.class_id
      WHERE c.teacher_id = ? ORDER BY a.date, a.created_at`),
    attemptsOf: db.prepare('SELECT * FROM attempts WHERE learner_id = ? ORDER BY date, created_at'),
    insertAttempt: db.prepare(`INSERT INTO attempts (id, learner_id, skill_id, date, type, items_correct, items_total, time_sec, hints, effort, source, created_at, rapid, rapid_correct, answers)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    activeQuiz: db.prepare(`SELECT * FROM quizzes WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1`),
    insertQuiz: db.prepare('INSERT INTO quizzes (id, user_id, kind, status, state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    saveQuiz: db.prepare('UPDATE quizzes SET state = ?, status = ?, updated_at = ? WHERE id = ?'),
    allStudents: db.prepare(`SELECT u.*, c.name AS class_name FROM users u LEFT JOIN classes c ON c.id = u.class_id WHERE u.role = 'student'`),
    allAttempts: db.prepare('SELECT * FROM attempts'),
    bankOf: db.prepare('SELECT * FROM item_bank WHERE skill_id = ? ORDER BY updated_at'),
    bankRow: db.prepare('SELECT * FROM item_bank WHERE id = ?'),
    bankAll: db.prepare('SELECT skill_id, kind, active, spec FROM item_bank'),
    bankUpsert: db.prepare(`INSERT INTO item_bank (id, skill_id, kind, active, spec, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET active = excluded.active, spec = excluded.spec, updated_by = excluded.updated_by, updated_at = excluded.updated_at`),
    insertResult: db.prepare(`INSERT INTO test_results (id, user_id, kind, track, percent, correct, total, answered, time_sec, timed_out, subjects, created_at, rapid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    resultsOf: db.prepare('SELECT * FROM test_results WHERE user_id = ? ORDER BY created_at'),
    resultsOfTeacher: db.prepare(`SELECT r.* FROM test_results r JOIN users u ON u.id = r.user_id JOIN classes c ON c.id = u.class_id
      WHERE c.teacher_id = ? ORDER BY r.created_at`),
    insertResponse: db.prepare(`INSERT INTO responses (user_id, quiz_id, kind, skill_id, subject_id, number, correct, time_sec, created_at, rapid, hinted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    responsesOf: db.prepare(`SELECT * FROM responses WHERE user_id = ? AND kind IN ('diagnostic', 'posttest') ORDER BY created_at, number`),
    rapidOfTeacher: db.prepare(`SELECT r.kind, COUNT(*) AS n, SUM(r.rapid) AS rapid FROM responses r JOIN users u ON u.id = r.user_id JOIN classes c ON c.id = u.class_id
      WHERE c.teacher_id = ? GROUP BY r.kind`)
  };

  const learnerOut = u => ({
    id: u.id, name: u.name, username: u.username, track: u.strand, section: u.class_name || '', classId: u.class_id,
    group: u.grp, preTest: u.pre_test, postTest: u.post_test, diagnosticDone: !!u.diagnostic_done
  });
  const attemptOut = a => ({
    id: a.id, learnerId: a.learner_id, skillId: a.skill_id, date: a.date, type: a.type,
    itemsCorrect: a.items_correct, itemsTotal: a.items_total, timeSec: a.time_sec, hints: a.hints, effort: a.effort, source: a.source,
    rapid: a.rapid || 0, rapidCorrect: a.rapid_correct || 0, answers: a.answers || ''
  });
  const resultOut = r => ({
    id: r.id, learnerId: r.user_id, kind: r.kind, track: r.track, percent: r.percent, correct: r.correct, total: r.total,
    answered: r.answered, timeSec: r.time_sec, timedOut: !!r.timed_out, subjects: JSON.parse(r.subjects), date: r.created_at, rapid: r.rapid || 0
  });
  // Latest pre- and post-test of each learner.
  function latestResults(rows) {
    const out = {};
    rows.forEach(r => { (out[r.user_id] = out[r.user_id] || {})[r.kind] = resultOut(r); });
    return out;
  }
  const userOut = u => ({ id: u.id, role: u.role, name: u.name, username: u.username, mustChange: !!u.must_change });
  const classOut = c => ({ id: c.id, name: c.name, joinCode: c.join_code, assessment: c.assessment, students: c.students ?? 0 });

  /*
   * School-wide models, fitted on every learner's answers, not just one class:
   *   bkt   BKT parameters fitted by maximum likelihood and validated against
   *         a percent-correct baseline (AUC, cross-validated by learner)
   *   load  the load model calibrated on effort ratings, with its
   *         cross-validated MAE
   * Refitting takes a moment, so new answers mark the models stale and they
   * are refitted at most once a minute (or on request from the Model check page).
   * The synthetic demo class (source 'demo') is left out as soon as real
   * students have enough answers to fit on; until then it is used, and flagged.
   */
  const REFIT_MS = 60e3;
  function models({ fresh = false } = {}) {
    const stale = !modelCache || (modelCache.dirty && (fresh || Date.now() - modelCache.at > REFIT_MS));
    if (stale) {
      const learners = q.allStudents.all().map(learnerOut);
      const all = q.allAttempts.all().map(attemptOut);
      const real = all.filter(a => a.source !== 'demo');
      let attempts = real, bkt = E.evaluateMastery(real, G);
      const demoAnswers = all.length - real.length;
      if (!bkt.ready && demoAnswers) { attempts = all; bkt = E.evaluateMastery(all, G); }
      bkt.data = { synthetic: attempts !== real, demoAttempts: demoAnswers, demoExcluded: attempts === real && demoAnswers > 0 };
      const samples = E.collectLoadSamples(learners, attempts, G, bkt.params);
      modelCache = { at: Date.now(), dirty: false, bkt, load: E.calibrateLoadModel(samples), loadCv: E.crossValidateLoad(samples) };
    }
    return modelCache;
  }
  // The method check uses simulated students only, so it never changes: computed once.
  let methodCache = null;
  const methodCheck = () => methodCache || (methodCache = E.methodCheck(G));
  const loadModel = () => models().load;
  const bktParams = () => models().bkt.params;

  function recordAttempt(learnerId, r, source = 'app') {
    q.insertAttempt.run(A.newId('A'), learnerId, r.skillId, r.date || today(), r.type, r.itemsCorrect, r.itemsTotal, r.timeSec, r.hints || 0, r.effort ?? null, source, now(), r.rapid || 0, r.rapidCorrect || 0, r.answers || '');
    invalidateModel();
  }

  function ownStudent(teacher, studentId) {
    const s = db.prepare(`SELECT u.* FROM users u JOIN classes c ON c.id = u.class_id WHERE u.id = ? AND u.role = 'student' AND c.teacher_id = ?`).get(studentId, teacher.id);
    if (!s) throw err(404, 'Student not found.');
    return s;
  }
  function ownClass(teacher, classId) {
    const c = q.classById.get(classId);
    if (!c || c.teacher_id !== teacher.id) throw err(404, 'Class not found.');
    return c;
  }
  function uniqueCode() {
    for (;;) { const code = A.joinCode(); if (!q.classByCode.get(code)) return code; }
  }
  function assertFreeUsername(u) {
    if (q.userByName.get(u)) throw err(409, 'That username is already taken.');
  }

  // ---------------------------------------------------------- question bank
  // The school's edits for one topic, in the form Q.generateSet takes.
  function bankExtra(skillId) {
    const overrides = {}, customs = [];
    q.bankOf.all(skillId).forEach(r => {
      const spec = r.spec ? JSON.parse(r.spec) : null;
      if (r.kind === 'override') overrides[r.id] = { active: !!r.active, spec };
      else if (r.active) customs.push({ id: r.id, spec });
    });
    return { overrides, customs };
  }
  const src = (skillId, n, rng) => Q.generateSet(skillId, n, rng, bankExtra(skillId));
  // The track's subjects as diagnostic / pre-post-test sets.
  const trackPlan = user => C.trackSubjects(user.strand).map(id => ({ id, label: C.subjectLabel(user.strand, id), skills: C.SUBJECTS[id].sequence }));

  // ---------------------------------------------------------- quiz helpers
  function loadQuiz(user) {
    const row = q.activeQuiz.get(user.id);
    if (!row) return null;
    const state = JSON.parse(row.state);
    // Quizzes saved in an older format cannot be resumed; start afresh.
    if (state.v !== 3) { q.saveQuiz.run(row.state, 'abandoned', now(), row.id); return null; }
    return { row, state };
  }
  function saveQuiz(row, state) {
    q.saveQuiz.run(JSON.stringify(state), state.finished ? 'finished' : 'active', now(), row.id);
  }
  // The diagnostic is the pre-test; its score and the post-test's are compared.
  function finishSideEffects(user, kind, state) {
    if (kind === 'practice') return;
    const sm = QZ.summary(state, G);
    const subjects = sm.subjects.map(s => ({ id: s.id, label: s.label, correct: s.correct, total: s.total, answered: s.answered, topics: s.topics.map(t => ({ id: t.id, correct: t.correct, answered: t.answered })) }));
    q.insertResult.run(A.newId('R'), user.id, kind === 'diagnostic' ? 'pre' : 'post', user.strand, sm.percent, sm.correct, sm.total, sm.answered, sm.timeSec, sm.timedOut ? 1 : 0, JSON.stringify(subjects), now(), sm.rapid || 0);
    if (kind === 'diagnostic') db.prepare('UPDATE users SET diagnostic_done = 1, pre_test = ? WHERE id = ?').run(sm.percent, user.id);
    else db.prepare('UPDATE users SET post_test = ? WHERE id = ?').run(sm.percent, user.id);
  }
  // Runs the test clock: a test whose 30 minutes are used up is closed here.
  function settleClock(user, active) {
    const wasFinished = active.state.finished;
    tx(db, () => {
      const records = QZ.tick(active.state, G);
      records.forEach(r => recordAttempt(user.id, r));
      if (active.state.finished && !wasFinished) {
        saveQuiz(active.row, active.state);
        finishSideEffects(user, active.row.kind, active.state);
      }
    });
  }

  /*
   * The post-test opens once every topic of the learner's path is completed
   * (brought to near-mastery by their own answers), or earlier when the
   * teacher opens it for the class.
   */
  function postTestStatus(user) {
    const seq = C.trackSequence(user.strand);
    const attempts = q.attemptsOf.all(user.id).map(attemptOut);
    const progress = E.pathProgress(E.traceMastery(attempts, G, bktParams(), { asOf: today() }).mastery, seq);
    const cls = user.class_id ? q.classById.get(user.class_id) : null;
    const reason = !user.diagnostic_done ? null : progress.complete ? 'path' : cls && cls.assessment === 'post' ? 'teacher' : null;
    return { available: !!reason && user.post_test == null, reason, done: user.post_test != null, progress: { done: progress.done, total: progress.total } };
  }

  // ---------------------------------------------------------- routes
  const routes = [];
  const route = (method, pattern, roles, handler) => {
    const keys = [];
    const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}$`);
    routes.push({ method, re, keys, roles, handler });
  };

  route('GET', '/api/session', null, ({ user }) => {
    if (!user && q.countUsers.get().n === 0) return { setupNeeded: true };
    return { user: user ? userOut(user) : null, teacherSignup: teacherSignupCode ? 'code' : 'open' };
  });

  // Teachers without an account create their own, with their first class.
  route('POST', '/api/register-teacher', null, ({ body, res }) => {
    if (teacherSignupCode) {
      const given = typeof body.signupCode === 'string' ? body.signupCode.trim() : '';
      const a = Buffer.from(given), b = Buffer.from(teacherSignupCode);
      if (a.length !== b.length || !require('node:crypto').timingSafeEqual(a, b)) throw err(403, 'That school sign-up code is not correct. Ask your school’s NeuroLearn-X administrator.');
    }
    const name = str(body.name, 'Name'), u = username(body.username), pw = password(body.password, 'teacher');
    const className = body.className && String(body.className).trim() ? str(body.className, 'Class name', 1, 60) : null;
    assertFreeUsername(u);
    const id = A.newId('T');
    tx(db, () => {
      q.insertUser.run(id, 'teacher', u, name, A.hashPassword(pw), 0, null, '', '', now());
      if (className) q.insertClass.run(A.newId('C'), className, id, uniqueCode(), now());
    });
    startSession(res, id);
    return { user: userOut(q.user.get(id)) };
  });

  route('POST', '/api/setup', null, ({ body, res }) => {
    if (q.countUsers.get().n !== 0) throw err(403, 'Setup is already complete.');
    const name = str(body.name, 'Name'), u = username(body.username), pw = password(body.password, 'teacher');
    const className = str(body.className, 'Class name', 1, 60);
    const id = A.newId('T');
    tx(db, () => {
      q.insertUser.run(id, 'teacher', u, name, A.hashPassword(pw), 0, null, '', '', now());
      q.insertClass.run(A.newId('C'), className, id, uniqueCode(), now());
    });
    startSession(res, id);
    return { user: userOut(q.user.get(id)) };
  });

  route('POST', '/api/login', null, ({ body, res, ip }) => {
    const u = typeof body.username === 'string' ? body.username.trim() : '';
    const pw = typeof body.password === 'string' ? body.password : '';
    const wait = throttle.blocked(ip, u);
    if (wait) throw err(429, `Too many attempts. Try again in ${Math.ceil(wait / 60)} minute${wait > 60 ? 's' : ''}.`);
    const row = u ? q.userByName.get(u) : null;
    const ok = A.verifyPassword(pw, row ? row.pass_hash : A.DUMMY_HASH) && !!row;
    if (!ok) { throttle.fail(ip, u); throw err(401, 'Wrong username or password.'); }
    if (body.role && body.role !== row.role) throw err(403, row.role === 'teacher' ? 'This is a teacher account. Use the Teacher tab.' : 'This is a student account. Use the Student tab.');
    throttle.succeed(ip, u);
    startSession(res, row.id);
    return { user: userOut(row) };
  });

  route('POST', '/api/logout', null, ({ token, res }) => {
    A.destroySession(db, token);
    clearCookie(res);
    return { ok: true };
  });

  route('POST', '/api/register', null, ({ body, res }) => {
    const code = str(body.joinCode, 'Class code', 4, 12).toUpperCase().replace(/\s+/g, '');
    const cls = q.classByCode.get(code);
    if (!cls) throw err(400, 'That class code was not found. Check it with your teacher.');
    const name = str(body.name, 'Name'), u = username(body.username), pw = password(body.password, 'student');
    const tr = track(body.track, true);
    assertFreeUsername(u);
    const id = A.newId('S');
    q.insertUser.run(id, 'student', u, name, A.hashPassword(pw), 0, cls.id, tr, '', now());
    startSession(res, id);
    return { user: userOut(q.user.get(id)) };
  });

  // A student can set their own track (e.g. an account made before tracks
  // existed, or after switching). Their path follows it immediately.
  route('PATCH', '/api/student/track', ['student'], ({ user, body }) => {
    db.prepare('UPDATE users SET strand = ? WHERE id = ?').run(track(body.track, true), user.id);
    return { ok: true };
  });

  route('POST', '/api/password', ['teacher', 'student'], ({ user, body, token }) => {
    if (!A.verifyPassword(typeof body.current === 'string' ? body.current : '', user.pass_hash)) throw err(400, 'Your current password is not correct.');
    const pw = password(body.next, user.role);
    db.prepare('UPDATE users SET pass_hash = ?, must_change = 0 WHERE id = ?').run(A.hashPassword(pw), user.id);
    A.destroyUserSessions(db, user.id, token);
    return { ok: true };
  });

  // ---------------------------------------------------------- student
  route('GET', '/api/student/state', ['student'], ({ user }) => {
    const cls = user.class_id ? q.classById.get(user.class_id) : null;
    const me = learnerOut({ ...user, class_name: cls ? cls.name : '' });
    const active = loadQuiz(user);
    return {
      learner: me, className: cls ? cls.name : '',
      attempts: q.attemptsOf.all(user.id).map(attemptOut),
      model: loadModel(),
      bkt: bktParams(),
      needsDiagnostic: !user.diagnostic_done,
      posttest: postTestStatus(user),
      results: latestResults(q.resultsOf.all(user.id))[user.id] || {},
      activeQuiz: active ? active.row.kind : null
    };
  });

  route('POST', '/api/quiz/start', ['student'], ({ user, body }) => {
    const kind = oneOf(body.kind, ['diagnostic', 'practice', 'posttest'], 'quiz type');
    const active = loadQuiz(user);
    if (active) {
      if (active.row.kind === kind && (kind !== 'practice' || active.state.blocks[0].skills[0] === body.skillId)) {
        settleClock(user, active);
        const v = QZ.view(active.state, G);
        if (!active.state.finished) saveQuiz(active.row, active.state);
        return { quiz: v };
      }
      if (active.row.kind === 'practice') q.saveQuiz.run(active.row.state, 'abandoned', now(), active.row.id);
      else throw err(409, active.row.kind === 'diagnostic' ? 'Finish your diagnostic first.' : 'Finish your post-test first.');
    }
    let state;
    if (kind === 'diagnostic') {
      if (user.diagnostic_done) throw err(409, 'You have already completed the diagnostic.');
      state = QZ.start('diagnostic', { graph: G, subjects: trackPlan(user), src });
    } else if (kind === 'practice') {
      if (!user.diagnostic_done) throw err(409, 'Finish your diagnostic first.');
      // Practice stays within the student's track subjects and their foundations.
      const allowed = C.trackSkills(user.strand);
      if (!allowed.includes(body.skillId)) throw err(400, 'That topic is not part of your track’s subjects.');
      state = QZ.start('practice', { graph: G, skillId: body.skillId, src });
    } else {
      const st = postTestStatus(user);
      if (st.done) throw err(409, 'You have already taken the post-test.');
      if (!st.available) throw err(409, `The post-test opens when your learning path is complete (${st.progress.done} of ${st.progress.total} topics done).`);
      state = QZ.start('posttest', { graph: G, subjects: trackPlan(user), src });
    }
    const id = A.newId('Q');
    q.insertQuiz.run(id, user.id, kind, 'active', JSON.stringify(state), now(), now());
    const v = QZ.view(state, G);
    q.saveQuiz.run(JSON.stringify(state), 'active', now(), id); // persists the first servedAt
    return { quiz: v };
  });

  route('GET', '/api/quiz/current', ['student'], ({ user }) => {
    const active = loadQuiz(user);
    if (!active) return { quiz: null };
    settleClock(user, active);
    const v = QZ.view(active.state, G);
    if (!active.state.finished) saveQuiz(active.row, active.state); // persists servedAt for timing
    return { quiz: v };
  });

  route('POST', '/api/quiz/hint', ['student'], ({ user }) => {
    const active = loadQuiz(user);
    if (!active) throw err(409, 'No quiz in progress.');
    const hint = QZ.hint(active.state);
    saveQuiz(active.row, active.state);
    return { hint };
  });

  route('POST', '/api/quiz/answer', ['student'], ({ user, body }) => {
    const active = loadQuiz(user);
    if (!active) throw err(409, 'No quiz in progress.');
    settleClock(user, active);
    if (active.state.finished) return { feedback: { saved: true, timeUp: true }, quiz: QZ.view(active.state, G) };
    const out = tx(db, () => {
      const { feedback, records, response } = QZ.answer(active.state, body.choice, G, Date.now(), src);
      records.forEach(r => recordAttempt(user.id, r));
      q.insertResponse.run(user.id, active.row.id, active.row.kind, response.skillId, response.subjectId, response.number, response.correct ? 1 : 0, response.timeSec, now(), response.rapid ? 1 : 0, response.hinted ? 1 : 0);
      saveQuiz(active.row, active.state);
      if (active.state.finished) finishSideEffects(user, active.row.kind, active.state);
      return { feedback: { ...feedback, timeUp: active.state.timedOut } };
    });
    const v = QZ.view(active.state, G);
    if (!active.state.finished) saveQuiz(active.row, active.state); // the next question's servedAt
    return { ...out, quiz: v };
  });

  route('POST', '/api/quiz/effort', ['student'], ({ user, body }) => {
    const active = loadQuiz(user);
    if (!active) throw err(409, 'No quiz in progress.');
    tx(db, () => {
      const records = QZ.rateEffort(active.state, body.effort ?? null, G, src);
      records.forEach(r => recordAttempt(user.id, r));
      saveQuiz(active.row, active.state);
      if (active.state.finished) finishSideEffects(user, active.row.kind, active.state);
    });
    const v = QZ.view(active.state, G);
    if (!active.state.finished) saveQuiz(active.row, active.state);
    return { quiz: v };
  });

  route('POST', '/api/quiz/quit', ['student'], ({ user }) => {
    const active = loadQuiz(user);
    if (!active) return { ok: true };
    if (active.row.kind !== 'practice') throw err(409, 'You can pause this and come back later, but it cannot be cancelled.');
    q.saveQuiz.run(active.row.state, 'abandoned', now(), active.row.id);
    return { ok: true };
  });

  // ---------------------------------------------------------- teacher
  route('GET', '/api/teacher/state', ['teacher'], ({ user }) => ({
    classes: q.classesOf.all(user.id).map(classOut),
    learners: q.studentsOf.all(user.id).map(learnerOut),
    attempts: q.attemptsOfTeacher.all(user.id).map(attemptOut),
    results: latestResults(q.resultsOfTeacher.all(user.id)),
    model: loadModel(),
    bkt: bktParams()
  }));

  // Model check: how well the fitted models predict data they were not fitted on.
  route('GET', '/api/models', ['teacher'], ({ user, req }) => {
    const m = models({ fresh: new URL(req.url, 'http://local').searchParams.get('fresh') === '1' });
    const rapid = {};
    q.rapidOfTeacher.all(user.id).forEach(r => { rapid[r.kind] = { answers: r.n, rapid: r.rapid || 0 }; });
    return { computedAt: new Date(m.at).toISOString(), bkt: m.bkt, load: m.load, loadCv: m.loadCv, rapid, rapidSec: E.RAPID_SEC, method: methodCheck() };
  });

  // Every timed-test answer of one student, with the time spent on it.
  route('GET', '/api/students/:id/responses', ['teacher'], ({ user, params }) => {
    const s = ownStudent(user, params.id);
    return {
      responses: q.responsesOf.all(s.id).map(r => ({
        quizId: r.quiz_id, kind: r.kind, skillId: r.skill_id, subjectId: r.subject_id, number: r.number,
        correct: !!r.correct, timeSec: r.time_sec, date: r.created_at, rapid: !!r.rapid, hinted: !!r.hinted
      }))
    };
  });

  // Lets a student take the post-test again (their earlier result stays on record).
  route('POST', '/api/students/:id/retake-posttest', ['teacher'], ({ user, params }) => {
    const s = ownStudent(user, params.id);
    db.prepare('UPDATE users SET post_test = NULL WHERE id = ?').run(s.id);
    db.prepare(`UPDATE quizzes SET status = 'abandoned' WHERE user_id = ? AND status = 'active' AND kind = 'posttest'`).run(s.id);
    return { ok: true };
  });

  route('POST', '/api/classes', ['teacher'], ({ user, body }) => {
    const id = A.newId('C');
    q.insertClass.run(id, str(body.name, 'Class name', 1, 60), user.id, uniqueCode(), now());
    return { ok: true, id };
  });

  route('PATCH', '/api/classes/:id', ['teacher'], ({ user, body, params }) => {
    const c = ownClass(user, params.id);
    const name = body.name !== undefined ? str(body.name, 'Class name', 1, 60) : c.name;
    // 'post' opens the post-test for the whole class before paths are complete.
    // (The pre-test is the diagnostic, so there is no 'pre' window any more.)
    const assessment = body.assessment !== undefined ? oneOf(body.assessment, ['none', 'post'], 'post-test setting') : c.assessment;
    db.prepare('UPDATE classes SET name = ?, assessment = ? WHERE id = ?').run(name, assessment, c.id);
    return { ok: true };
  });

  route('POST', '/api/classes/:id/join-code', ['teacher'], ({ user, params }) => {
    const c = ownClass(user, params.id);
    const code = uniqueCode();
    db.prepare('UPDATE classes SET join_code = ? WHERE id = ?').run(code, c.id);
    return { joinCode: code };
  });

  // Balanced random assignment to the two study arms.
  route('POST', '/api/classes/:id/randomize', ['teacher'], ({ user, params }) => {
    const c = ownClass(user, params.id);
    const ids = db.prepare(`SELECT id FROM users WHERE class_id = ? AND role = 'student'`).all(c.id).map(r => r.id);
    for (let i = ids.length - 1; i > 0; i--) { const j = require('node:crypto').randomInt(i + 1); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    const set = db.prepare('UPDATE users SET grp = ? WHERE id = ?');
    tx(db, () => ids.forEach((id, i) => set.run(i % 2 === 0 ? 'adaptive' : 'standard', id)));
    return { ok: true, assigned: ids.length };
  });

  route('POST', '/api/students', ['teacher'], ({ user, body }) => {
    const c = ownClass(user, body.classId);
    const name = str(body.name, 'Name'), u = username(body.username), pw = password(body.password, 'student');
    const tr = track(body.track, true), group = oneOf(body.group || '', ['', 'adaptive', 'standard'], 'group');
    assertFreeUsername(u);
    const id = A.newId('S');
    q.insertUser.run(id, 'student', u, name, A.hashPassword(pw), 1, c.id, tr, group, now());
    return { ok: true, id };
  });

  route('PATCH', '/api/students/:id', ['teacher'], ({ user, body, params }) => {
    const s = ownStudent(user, params.id);
    const next = {
      name: body.name !== undefined ? str(body.name, 'Name') : s.name,
      strand: body.track !== undefined ? track(body.track, true) : s.strand,
      grp: body.group !== undefined ? oneOf(body.group, ['', 'adaptive', 'standard'], 'group') : s.grp,
      pre: body.preTest !== undefined ? int(body.preTest, 'Pre-test', 0, 100, true) : s.pre_test,
      post: body.postTest !== undefined ? int(body.postTest, 'Post-test', 0, 100, true) : s.post_test,
      cls: body.classId !== undefined ? ownClass(user, body.classId).id : s.class_id
    };
    db.prepare('UPDATE users SET name = ?, strand = ?, grp = ?, pre_test = ?, post_test = ?, class_id = ? WHERE id = ?')
      .run(next.name, next.strand, next.grp, next.pre, next.post, next.cls, s.id);
    return { ok: true };
  });

  route('POST', '/api/students/:id/password', ['teacher'], ({ user, body, params }) => {
    const s = ownStudent(user, params.id);
    db.prepare('UPDATE users SET pass_hash = ?, must_change = 1 WHERE id = ?').run(A.hashPassword(password(body.password, 'student')), s.id);
    A.destroyUserSessions(db, s.id);
    return { ok: true };
  });

  route('POST', '/api/students/:id/retake-diagnostic', ['teacher'], ({ user, params }) => {
    const s = ownStudent(user, params.id);
    db.prepare('UPDATE users SET diagnostic_done = 0 WHERE id = ?').run(s.id);
    db.prepare(`UPDATE quizzes SET status = 'abandoned' WHERE user_id = ? AND status = 'active'`).run(s.id);
    return { ok: true };
  });

  route('DELETE', '/api/students/:id', ['teacher'], ({ user, params }) => {
    const s = ownStudent(user, params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(s.id);
    invalidateModel();
    return { ok: true };
  });

  route('POST', '/api/attempts', ['teacher'], ({ user, body }) => {
    const s = ownStudent(user, body.learnerId);
    const itemsTotal = int(body.itemsTotal, 'Items total', 1, 100);
    const r = {
      skillId: oneOf(body.skillId, G.skills.map(x => x.id), 'skill'),
      date: /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : today(),
      type: oneOf(body.type, ['diagnostic', 'practice', 'quiz', 'summative'], 'type'),
      itemsCorrect: int(body.itemsCorrect, 'Items correct', 0, itemsTotal), itemsTotal,
      timeSec: int(body.timeSec, 'Time', 1, 36000), hints: int(body.hints ?? 0, 'Hints', 0, 100),
      effort: int(body.effort, 'Effort', 1, 9, true)
    };
    recordAttempt(s.id, r, 'teacher');
    return { ok: true };
  });

  route('DELETE', '/api/attempts/:id', ['teacher'], ({ user, params }) => {
    const a = db.prepare('SELECT * FROM attempts WHERE id = ?').get(params.id);
    if (!a) throw err(404, 'Attempt not found.');
    ownStudent(user, a.learner_id);
    db.prepare('DELETE FROM attempts WHERE id = ?').run(a.id);
    invalidateModel();
    return { ok: true };
  });

  // ---------------------------------------------------------- question bank (teachers)
  // Curated topics need two active questions: the diagnostic asks two per topic.
  const MIN_ACTIVE = 2;
  const bankSkill = id => oneOf(id, G.skills.map(s => s.id), 'topic');
  const specOut = s => ({ prompt: s.prompt, answer: String(s.answer), wrong: s.wrong.slice(0, 3).map(w => [String(w[0]), w[1] || '']), hint: s.hint || '', explanation: (s.steps || []).join('\n') });
  function bankItems(skillId) {
    const rows = q.bankOf.all(skillId);
    const over = Object.fromEntries(rows.filter(r => r.kind === 'override').map(r => [r.id, r]));
    const builtins = (Q.builtinItems(skillId) || []).map(b => {
      const o = over[b.id];
      return { id: b.id, kind: 'builtin', active: o ? !!o.active : true, edited: !!(o && o.spec), spec: specOut(o && o.spec ? JSON.parse(o.spec) : b.spec), updatedBy: o ? o.updated_by : '', updatedAt: o ? o.updated_at : '' };
    });
    const customs = rows.filter(r => r.kind === 'custom').map(r => ({ id: r.id, kind: 'custom', active: !!r.active, edited: false, spec: specOut(JSON.parse(r.spec)), updatedBy: r.updated_by, updatedAt: r.updated_at }));
    return [...builtins, ...customs];
  }
  // Resolves an item id to { skillId, builtin } or 404.
  function bankRef(id) {
    const m = /^([A-Z0-9]+)#\d+$/.exec(id);
    if (m && G.byId[m[1]] && (Q.builtinItems(m[1]) || []).some(b => b.id === id)) return { skillId: m[1], builtin: true, row: q.bankRow.get(id) };
    const row = q.bankRow.get(id);
    if (!row || row.kind !== 'custom') throw err(404, 'Question not found.');
    return { skillId: row.skill_id, builtin: false, row };
  }
  function assertEnoughActive(skillId) {
    if (Q.isGenerated(skillId)) return;
    if (bankItems(skillId).filter(i => i.active).length < MIN_ACTIVE) throw err(409, `Keep at least ${MIN_ACTIVE} active questions in this topic.`);
  }
  const bankOut = skillId => {
    const generated = Q.isGenerated(skillId);
    const rng = E.mulberry32(Date.now() % 1e9);
    // Generated topics show a few freshly generated examples instead of a fixed list.
    const samples = generated ? Q.generateSet(skillId, 3, rng).map(i => ({ prompt: i.prompt, choices: i.choices, answer: i.answer })) : [];
    return { skillId, generated, minActive: generated ? 0 : MIN_ACTIVE, items: bankItems(skillId), samples };
  };

  route('GET', '/api/bank', ['teacher'], () => {
    const counts = {};
    G.skills.forEach(s => { const b = Q.builtinItems(s.id); counts[s.id] = { builtin: b ? b.length : 0, generated: Q.isGenerated(s.id), custom: 0, hidden: 0, edited: 0 }; });
    q.bankAll.all().forEach(r => {
      const c = counts[r.skill_id];
      if (!c) return;
      if (r.kind === 'custom') { if (r.active) c.custom++; } else { if (!r.active) c.hidden++; if (r.spec) c.edited++; }
    });
    return { counts };
  });

  route('GET', '/api/bank/skills/:skill', ['teacher'], ({ params }) => bankOut(bankSkill(params.skill)));

  route('POST', '/api/bank/skills/:skill', ['teacher'], ({ user, params, body }) => {
    const skillId = bankSkill(params.skill);
    const spec = Q.checkSpec(body);
    q.bankUpsert.run(A.newId('I'), skillId, 'custom', 1, JSON.stringify(spec), user.name, now());
    return bankOut(skillId);
  });

  route('PUT', '/api/bank/items/:id', ['teacher'], ({ user, params, body }) => {
    const ref = bankRef(params.id);
    const spec = Q.checkSpec(body);
    const active = ref.row ? ref.row.active : 1;
    q.bankUpsert.run(params.id, ref.skillId, ref.builtin ? 'override' : 'custom', active, JSON.stringify(spec), user.name, now());
    return bankOut(ref.skillId);
  });

  route('POST', '/api/bank/items/:id/active', ['teacher'], ({ user, params, body }) => {
    const ref = bankRef(params.id);
    if (typeof body.active !== 'boolean') throw err(400, 'Say whether the question is active.');
    tx(db, () => {
      q.bankUpsert.run(params.id, ref.skillId, ref.builtin ? 'override' : 'custom', body.active ? 1 : 0, ref.row ? ref.row.spec : null, user.name, now());
      if (!body.active) assertEnoughActive(ref.skillId);
    });
    return bankOut(ref.skillId);
  });

  // Deletes a teacher's question, or restores a built-in one to its original.
  route('DELETE', '/api/bank/items/:id', ['teacher'], ({ params }) => {
    const ref = bankRef(params.id);
    tx(db, () => {
      db.prepare('DELETE FROM item_bank WHERE id = ?').run(params.id);
      if (!ref.builtin && ref.row.active) assertEnoughActive(ref.skillId);
    });
    return bankOut(ref.skillId);
  });

  route('POST', '/api/teachers', ['teacher'], ({ body }) => {
    const name = str(body.name, 'Name'), u = username(body.username), pw = password(body.password, 'teacher');
    assertFreeUsername(u);
    q.insertUser.run(A.newId('T'), 'teacher', u, name, A.hashPassword(pw), 1, null, '', '', now());
    return { ok: true };
  });

  // ---------------------------------------------------------- plumbing
  function cookieStr(name, value, maxAge) {
    return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureCookies ? '; Secure' : ''}`;
  }
  function startSession(res, userId) {
    const s = A.createSession(db, userId);
    res.setHeader('Set-Cookie', cookieStr('nlx_session', s.token, s.maxAge));
  }
  function clearCookie(res) { res.setHeader('Set-Cookie', cookieStr('nlx_session', '', 0)); }
  function readCookie(req, name) {
    const m = (req.headers.cookie || '').split(/;\s*/).find(c => c.startsWith(`${name}=`));
    return m ? decodeURIComponent(m.slice(name.length + 1)) : null;
  }
  function send(res, status, body, headers = {}) {
    res.writeHead(status, { ...SECURITY_HEADERS, 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8', ...headers });
    res.end(JSON.stringify(body));
  }
  function readBody(req) {
    return new Promise((resolve, reject) => {
      let size = 0; const chunks = [];
      req.on('data', c => { size += c.length; if (size > 100e3) { reject(err(413, 'Request too large.')); req.destroy(); } else chunks.push(c); });
      req.on('end', () => {
        if (!chunks.length) return resolve({});
        try { const v = JSON.parse(Buffer.concat(chunks).toString('utf8')); resolve(v && typeof v === 'object' ? v : {}); } catch (e) { reject(err(400, 'Invalid JSON.')); }
      });
      req.on('error', reject);
    });
  }
  function serveStatic(req, res, pathname) {
    // KaTeX is served from the installed package so it works without internet.
    let root = PUBLIC;
    let rel = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
    if (rel.startsWith('vendor/katex/')) { root = KATEX_DIR; rel = rel.slice('vendor/katex/'.length); }
    const file = path.normalize(path.join(root, rel));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  }

  return async function handle(req, res) {
    const url = new URL(req.url, 'http://local');
    if (!url.pathname.startsWith('/api/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed.' });
      return serveStatic(req, res, url.pathname);
    }
    try {
      if (req.method !== 'GET') {
        if (req.headers['x-nlx'] !== '1' || !String(req.headers['content-type'] || '').startsWith('application/json')) throw err(403, 'Request blocked.');
      }
      const r = routes.find(x => x.method === req.method && x.re.test(url.pathname));
      if (!r) throw err(404, 'Not found.');
      const params = {};
      const m = url.pathname.match(r.re);
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      const token = readCookie(req, 'nlx_session');
      const user = A.sessionUser(db, token);
      if (r.roles) {
        if (!user) throw err(401, 'Please sign in.');
        if (!r.roles.includes(user.role)) throw err(403, 'You do not have access to this.');
        if (user.must_change && r.method !== 'GET' && url.pathname !== '/api/password') throw err(403, 'Please change your password first.');
      }
      const body = req.method === 'GET' ? {} : await readBody(req);
      const ip = req.socket.remoteAddress || '';
      const out = await r.handler({ req, res, body, params, user, token, ip });
      send(res, 200, out);
    } catch (e) {
      const status = e.status || 500;
      if (status === 500) console.error(e);
      send(res, status, { error: status === 500 ? 'Something went wrong on the server.' : e.message });
    }
  };
}

module.exports = { createApp };
