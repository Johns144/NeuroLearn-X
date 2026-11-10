// End-to-end API tests against a real HTTP server and an in-memory database.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { openDb } = require('../server/db.js');
const { createApp } = require('../server/app.js');
const A = require('../server/auth.js');
const QZ = require('../server/assess.js');
const C = require('../public/js/curriculum.js');

const G = C.graph;

function startServer(opts = {}) {
  const db = openDb(':memory:');
  const server = http.createServer(createApp({ db, ...opts }));
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ db, server, base: `http://127.0.0.1:${server.address().port}` })));
}

function client(base) {
  let cookie = '';
  const req = async (method, url, body, headers = {}) => {
    const h = { Accept: 'application/json', ...headers };
    if (cookie) h.Cookie = cookie;
    if (method !== 'GET' && !('X-NLX' in headers)) { h['Content-Type'] = 'application/json'; h['X-NLX'] = '1'; }
    const res = await fetch(base + url, { method, headers: h, body: method !== 'GET' ? JSON.stringify(body || {}) : undefined });
    const sc = res.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    let data = {};
    try { data = await res.json(); } catch (e) { /* not json */ }
    return { status: res.status, data, res };
  };
  return {
    get: u => req('GET', u), post: (u, b, h) => req('POST', u, b, h), patch: (u, b) => req('PATCH', u, b), put: (u, b) => req('PUT', u, b), del: u => req('DELETE', u),
    raw: (u) => fetch(base + u)
  };
}

// Pretends the open question has been on screen for `sec` seconds, so test
// answers are not instant (which would flag them as rapid guesses).
function ageOpen(db, userId, sec = 8) {
  const row = db.prepare(`SELECT id, state FROM quizzes WHERE user_id = ? AND status = 'active'`).get(userId);
  if (!row) return;
  const st = JSON.parse(row.state);
  const it = st.blocks[st.b] && st.blocks[st.b].items[st.i];
  if (!it || it.answeredAt != null) return;
  it.servedAt = Date.now() - sec * 1000;
  db.prepare('UPDATE quizzes SET state = ? WHERE id = ?').run(JSON.stringify(st), row.id);
}

// Answers the open quiz, correct or not per skill, until it finishes.
async function finishQuiz(db, c, userId, isCorrect, effort = 5, sec = 8) {
  for (let guard = 0; guard < 400; guard++) {
    const { data } = await c.get('/api/quiz/current');
    const qv = data.quiz;
    if (!qv || qv.finished) return qv;
    if (qv.awaitingEffort) {
      const e = await c.post('/api/quiz/effort', { effort });
      assert.equal(e.status, 200, JSON.stringify(e.data));
      if (e.data.quiz.finished) return e.data.quiz;
      continue;
    }
    ageOpen(db, userId, sec);
    const st = JSON.parse(db.prepare(`SELECT state FROM quizzes WHERE user_id = ? AND status = 'active'`).get(userId).state);
    const it = st.blocks[st.b].items[st.i];
    const choice = isCorrect(qv.skill.id) ? it.answer : (it.answer + 1) % 4;
    const r = await c.post('/api/quiz/answer', { choice });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    if (r.data.quiz.finished) return r.data.quiz;
  }
  throw new Error('quiz did not finish');
}

test('password hashing and verification', () => {
  const h = A.hashPassword('correct horse');
  assert.match(h, /^scrypt\$/);
  assert.ok(A.verifyPassword('correct horse', h));
  assert.ok(!A.verifyPassword('wrong horse', h));
  assert.notEqual(A.hashPassword('correct horse'), h, 'salted');
});

const plan = track => C.trackSubjects(track).map(id => ({ id, label: C.subjectLabel(track, id), skills: C.SUBJECTS[id].sequence }));

// Runs a quiz to the end in memory; ok(skillId) decides whether to answer right.
function runQuiz(kind, track, ok) {
  const st = QZ.start(kind, { graph: G, subjects: plan(track) });
  const records = [];
  for (let g = 0; g < 500 && !st.finished; g++) {
    if (st.awaitingEffort) { records.push(...QZ.rateEffort(st, 5, G)); continue; }
    const it = st.blocks[st.b].items[st.i];
    records.push(...QZ.answer(st, ok(it.skillId) ? it.answer : (it.answer + 1) % 4, G).records);
  }
  assert.ok(st.finished);
  return { st, records, summary: QZ.summary(st, G) };
}

test('diagnostic: one set per track subject, one question per topic, no hints', () => {
  C.TRACK_IDS.forEach(track => {
    const { st, records, summary } = runQuiz('diagnostic', track, () => true);
    assert.deepEqual(st.blocks.map(b => b.id), C.trackSubjects(track), `${track} covers exactly its 8 subjects`);
    st.blocks.forEach(b => assert.equal(b.items.length, C.SUBJECTS[b.id].sequence.length));
    assert.deepEqual(records.map(r => r.skillId), C.trackSequence(track), 'one record per topic, in teaching order');
    assert.ok(records.every(r => r.itemsTotal === 1 && r.itemsCorrect === 1 && r.effort === 5 && r.type === 'diagnostic'));
    assert.equal(summary.total, C.trackSequence(track).length);
    assert.equal(summary.percent, 100);
    assert.equal(summary.timedOut, false);
  });
  // GAS sets carry their curriculum slot names.
  const gas = runQuiz('diagnostic', 'GAS', () => true).summary.subjects.map(s => s.label);
  assert.ok(gas[0].startsWith('Humanities 1: Creative Writing') && gas.some(l => l.startsWith('Elective 2:')), gas.join(' | '));
  // Tests reveal nothing per question and allow no hints.
  const st = QZ.start('diagnostic', { graph: G, subjects: plan('STEM') });
  assert.throws(() => QZ.hint(st), /not available/);
  QZ.view(st, G, 1e6);
  const { feedback, response } = QZ.answer(st, 0, G, 1e6 + 9000);
  assert.deepEqual(feedback, { saved: true, rapid: false });
  assert.equal(response.number, 1);
  assert.equal(response.subjectId, 'PC');
  assert.equal(response.timeSec, 9);
});

test('rapid guesses: answers under 3 seconds are flagged and kept out of mastery evidence', () => {
  const st = QZ.start('practice', { graph: G, skillId: 'CW1' });
  let t = 1e6;
  const records = [];
  // Two careful answers, then three instant ones (all correct).
  [9000, 7000, 1500, 800, 2900].forEach(ms => {
    QZ.view(st, G, t);
    const it = st.blocks[0].items[st.i];
    const r = QZ.answer(st, it.answer, G, t += ms);
    assert.equal(r.response.rapid, ms < 3000, `${ms} ms`);
    assert.equal(r.feedback.rapid, ms < 3000);
  });
  records.push(...QZ.rateEffort(st, 4, G));
  assert.deepEqual([records[0].itemsCorrect, records[0].itemsTotal, records[0].rapid, records[0].rapidCorrect], [5, 5, 3, 3]);
  // Mastery only counts the two careful answers.
  const E = require('../public/js/engine.js');
  const a = { ...records[0], id: 'r1', learnerId: 'X', date: '2026-10-01' };
  const m = E.traceMastery([a], G).mastery.CW1;
  assert.equal(m.items, 2);
  assert.equal(m.rapid, 3);
  const all = E.traceMastery([{ ...a, rapid: 0, rapidCorrect: 0, answers: '' }], G).mastery.CW1;
  assert.ok(all.p > m.p, 'counting the rapid answers would overstate mastery');
});

test('answer order: each set records its answers in order, with hints and rapid guesses marked', () => {
  const st = QZ.start('practice', { graph: G, skillId: 'CW1' });
  let t = 1e6;
  const responses = [];
  // right · right after a hint · wrong · a rapid right guess · wrong
  [[true, false, 9000], [true, true, 8000], [false, false, 8000], [true, false, 1000], [false, false, 7000]].forEach(([right, useHint, ms]) => {
    QZ.view(st, G, t);
    if (useHint) QZ.hint(st);
    const it = st.blocks[0].items[st.i];
    responses.push(QZ.answer(st, right ? it.answer : (it.answer + 1) % 4, G, t += ms).response);
  });
  const [rec] = QZ.rateEffort(st, 5, G);
  assert.equal(rec.answers, '1H0R0');
  assert.deepEqual(responses.map(r => r.hinted), [false, true, false, false, false]);
  assert.deepEqual([rec.itemsCorrect, rec.itemsTotal, rec.hints, rec.rapid], [3, 5, 1, 1]);
});

test('timed tests: 30 minutes on the server clock, then unreached topics count as not answered', () => {
  const st = QZ.start('diagnostic', { graph: G, subjects: plan('HUMSS') });
  let t = 1_000_000;
  QZ.view(st, G, t);
  // Two questions, 40 s and 70 s.
  let r = QZ.answer(st, 0, G, t += 40_000);
  assert.equal(r.response.timeSec, 40);
  QZ.view(st, G, t);
  r = QZ.answer(st, 0, G, t += 70_000);
  assert.equal(r.response.timeSec, 70);
  QZ.view(st, G, t);
  assert.equal(QZ.view(st, G, t).timer.remainingSec, 1800 - 110);
  // An idle question counts at most 5 minutes against the clock.
  assert.equal(QZ.view(st, G, t + 3_600_000).timer.remainingSec, 1800 - 110 - 300);
  // Keep answering slowly until the 30 minutes are used.
  let records = [];
  while (!st.finished) {
    if (st.awaitingEffort) { records.push(...QZ.rateEffort(st, 4, G)); QZ.view(st, G, t); continue; }
    records.push(...QZ.tick(st, G, t));
    if (st.finished) break;
    records.push(...QZ.answer(st, 0, G, t += 280_000).records);
    if (!st.finished) QZ.view(st, G, t);
  }
  assert.ok(st.timedOut);
  const sm = QZ.summary(st, G, t);
  assert.equal(sm.total, C.trackSequence('HUMSS').length, 'scored on every topic');
  assert.ok(sm.answered < sm.total && sm.answered >= 7, `${sm.answered} answered`);
  assert.equal(sm.timeSec, 1800);
  assert.ok(sm.subjects.some(s => s.answered === 0), 'later subjects were not reached');
  assert.ok(records.every(rec => rec.itemsTotal === 1), 'only answered topics are recorded');
  assert.throws(() => QZ.answer(st, 0, G, t), /Time is up/);
  // Practice is not timed.
  assert.equal(QZ.view(QZ.start('practice', { graph: G, skillId: 'CW1' }), G).timer, null);
});

test('diagnostic: weak subject sets add a few Junior High foundation checks', () => {
  const { st, records } = runQuiz('diagnostic', 'STEM', id => id.startsWith('J'));
  const found = st.blocks.filter(b => b.type === 'foundation');
  assert.ok(found.length > 0 && found.length <= QZ.FOUNDATION.max, `${found.length} foundation checks`);
  assert.ok(found.every(b => G.byId[b.skills[0]].level === 'JHS' && b.items.length === QZ.FOUNDATION.items));
  assert.equal(st.blocks[1].type, 'foundation', 'checked right after the subject that needed it');
  assert.ok(records.every(r => C.trackSkills('STEM').includes(r.skillId)));
  // HUMSS subjects do not rest on Junior High math: no foundation checks.
  assert.ok(runQuiz('diagnostic', 'HUMSS', () => false).st.blocks.every(b => b.type === 'subject'));
  // Passing a foundation credits everything beneath it.
  const passFound = runQuiz('diagnostic', 'STEM', id => G.byId[id].level === 'JHS').st;
  const probed = passFound.blocks.filter(b => b.type === 'foundation').map(b => b.skills[0]);
  probed.forEach((id, i) => probed.slice(i + 1).forEach(later => assert.ok(!G.ancestors(id).has(later), `${later} is credited through ${id}`)));
});

test('post-test: same format as the diagnostic, without foundation checks', () => {
  const { st, records, summary } = runQuiz('posttest', 'ABM', id => id.startsWith('BM'));
  assert.deepEqual(st.blocks.map(b => b.id), C.trackSubjects('ABM'), 'no foundation checks even when sets go badly');
  assert.equal(summary.total, C.trackSequence('ABM').length);
  assert.equal(summary.correct, C.SUBJECTS.BM.sequence.length);
  assert.equal(summary.subjects.find(s => s.id === 'BM').correct, C.SUBJECTS.BM.sequence.length);
  assert.ok(records.every(r => r.type === 'summative' && r.itemsTotal === 1 && r.effort === 5));
  assert.throws(() => QZ.start('posttest', { graph: G, subjects: [] }), /track/);
});

test('full journey: setup, join class, diagnostic, practice, assessment, teacher view', async () => {
  const { db, server, base } = await startServer();
  try {
    const teacher = client(base);
    assert.deepEqual((await teacher.get('/api/session')).data, { setupNeeded: true });
    let r = await teacher.post('/api/setup', { name: 'Ms Reyes', username: 'ms.reyes', password: 'teach-pass-1', className: 'Grade 11 STEM A' });
    assert.equal(r.status, 200);
    assert.equal(r.data.user.role, 'teacher');
    assert.equal((await client(base).post('/api/setup', { name: 'X', username: 'xx.yy', password: 'abcdefgh', className: 'Y' })).status, 403, 'setup runs once');

    const tstate = (await teacher.get('/api/teacher/state')).data;
    const code = tstate.classes[0].joinCode;
    assert.match(code, /^[A-Z2-9]{6}$/);

    const student = client(base);
    assert.equal((await student.post('/api/register', { joinCode: 'NOPE99', name: 'Ana', username: 'ana.cruz', password: 'secret1' })).status, 400);
    assert.equal((await student.post('/api/register', { joinCode: code, name: 'Ana Cruz', username: 'ana.cruz', password: 'secret1' })).status, 400, 'a track is required');
    assert.equal((await student.post('/api/register', { joinCode: code, name: 'Ana Cruz', username: 'ana.cruz', password: 'secret1', track: 'TVL' })).status, 400, 'only STEM, HUMSS, ABM, GAS');
    r = await student.post('/api/register', { joinCode: code.toLowerCase(), name: 'Ana Cruz', username: 'ana.cruz', password: 'secret1', track: 'STEM' });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    const sid = r.data.user.id;
    assert.equal((await client(base).post('/api/register', { joinCode: code, name: 'Other', username: 'ANA.CRUZ', password: 'secret1', track: 'GAS' })).status, 409, 'usernames are case-insensitive unique');

    // Access control and CSRF guard
    assert.equal((await student.get('/api/teacher/state')).status, 403);
    assert.equal((await client(base).get('/api/student/state')).status, 401);
    assert.equal((await student.post('/api/quiz/start', { kind: 'diagnostic' }, { 'X-NLX': undefined })).status, 403, 'missing CSRF header is refused');

    // First sign-in: diagnostic is required before practice
    let s = (await student.get('/api/student/state')).data;
    assert.equal(s.needsDiagnostic, true);
    assert.equal((await student.post('/api/quiz/start', { kind: 'practice', skillId: 'PC1' })).status, 409);
    r = await student.post('/api/quiz/start', { kind: 'diagnostic' });
    assert.equal(r.status, 200);
    assert.deepEqual(r.data.quiz.block, { type: 'subject', label: 'Pre-Calculus' });
    assert.equal(r.data.quiz.blocksPlanned, 8);
    assert.equal(r.data.quiz.skill.id, 'PC1');
    assert.equal(r.data.quiz.question.choices.length, 4);
    assert.equal(r.data.quiz.question.answer, undefined, 'answer never sent to the client');
    assert.match(r.data.quiz.question.prompt + r.data.quiz.question.choices.join(''), /\\\(/, 'math arrives as LaTeX');
    assert.equal(r.data.quiz.timer.limitSec, 1800);
    assert.ok(r.data.quiz.timer.remainingSec > 1790 && r.data.quiz.timer.running);
    assert.equal((await student.post('/api/quiz/hint')).status, 400, 'no hints in the diagnostic');
    // The pre-test reveals nothing per question.
    {
      const st = JSON.parse(db.prepare(`SELECT state FROM quizzes WHERE user_id = ? AND status = 'active'`).get(sid).state);
      const it = st.blocks[0].items[0];
      ageOpen(db, sid);
      const res = await student.post('/api/quiz/answer', { choice: (it.answer + 1) % 4 });
      assert.deepEqual(res.data.feedback, { saved: true, rapid: false, timeUp: false });
      assert.equal(res.data.quiz.skill.id, 'PC2', 'the next question comes straight back');
    }

    // Strong on Junior High foundations, weak on the SHS subjects so far
    const summary = await finishQuiz(db, student, sid, skillId => skillId.startsWith('J'));
    assert.ok(summary.finished);
    assert.equal(summary.summary.percent, 0);
    s = (await student.get('/api/student/state')).data;
    assert.equal(s.needsDiagnostic, false);
    const diag = s.attempts.filter(a => a.type === 'diagnostic');
    C.trackSequence('STEM').forEach(id => assert.ok(diag.some(a => a.skillId === id), `${id} was assessed`));
    assert.ok(diag.every(a => a.effort === 5 && a.timeSec >= 1 && a.itemsTotal === (a.skillId.startsWith('J') ? 3 : 1)));
    assert.equal(diag.find(a => a.skillId === 'PC1').itemsCorrect, 0);
    const found = diag.filter(a => a.skillId.startsWith('J'));
    assert.ok(found.length >= 1 && found.length <= QZ.FOUNDATION.max && found.every(a => a.itemsCorrect === 3));
    assert.equal((await student.post('/api/quiz/start', { kind: 'diagnostic' })).status, 409, 'cannot retake without teacher');
    // The diagnostic is the pre-test.
    assert.equal(s.learner.preTest, 0);
    assert.equal(s.results.pre.percent, 0);
    assert.equal(s.results.pre.total, C.trackSequence('STEM').length);
    assert.equal(s.results.pre.subjects.length, 8);
    assert.deepEqual(s.posttest, { available: false, reason: null, done: false, progress: { done: 0, total: C.trackSequence('STEM').length } });
    // Every answer has its own time on record.
    const resp = (await teacher.get(`/api/students/${sid}/responses`)).data.responses;
    assert.equal(resp.length, C.trackSequence('STEM').length + found.length * QZ.FOUNDATION.items);
    assert.deepEqual(resp.map(x => x.number), resp.map((_, i) => i + 1));
    assert.ok(resp.every(x => x.kind === 'diagnostic' && x.timeSec >= 0));
    assert.equal(resp[0].skillId, 'PC1');
    assert.equal(resp[0].correct, false);

    assert.ok(diag.every(a => C.trackSkills('STEM').includes(a.skillId)), 'a STEM diagnostic stays in STEM subjects');
    assert.equal(s.learner.track, 'STEM');
    // Practice stays inside the track: Business Math is not a STEM subject.
    assert.equal((await student.post('/api/quiz/start', { kind: 'practice', skillId: 'BM2' })).status, 400);
    // Practice set
    r = await student.post('/api/quiz/start', { kind: 'practice', skillId: 'PHA3' });
    assert.equal(r.data.quiz.itemsInBlock, 5);
    await finishQuiz(db, student, sid, () => true, 3);
    s = (await student.get('/api/student/state')).data;
    const prac = s.attempts.filter(a => a.type === 'practice');
    assert.equal(prac.length, 1);
    assert.equal(prac[0].itemsCorrect, 5);
    assert.equal(prac[0].answers, '11111', 'the set keeps its answers in order');
    assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM responses WHERE user_id = ? AND kind = 'practice' AND hinted = 0`).get(sid).n, 5);

    // The post-test waits for a complete path, unless the teacher opens it.
    s = (await student.get('/api/student/state')).data;
    assert.equal(s.posttest.progress.done, 1, 'a topic brought to near-mastery (5 of 5 in practice) counts as completed');
    const locked = await student.post('/api/quiz/start', { kind: 'posttest' });
    assert.equal(locked.status, 409);
    assert.match(locked.data.error, /1 of 33 topics/);
    const classId = tstate.classes[0].id;
    assert.equal((await teacher.patch(`/api/classes/${classId}`, { assessment: 'pre' })).status, 400, 'the pre-test is the diagnostic');
    assert.equal((await teacher.patch(`/api/classes/${classId}`, { assessment: 'post' })).status, 200);
    s = (await student.get('/api/student/state')).data;
    assert.equal(s.posttest.available, true);
    assert.equal(s.posttest.reason, 'teacher');
    r = await student.post('/api/quiz/start', { kind: 'posttest' });
    assert.equal(r.status, 200);
    assert.equal(r.data.quiz.timer.limitSec, 1800);
    assert.equal((await student.post('/api/quiz/hint')).status, 400, 'no hints in the post-test');
    {
      // An instant answer is accepted but flagged as a rapid guess.
      const fb = (await student.post('/api/quiz/answer', { choice: 0 })).data.feedback;
      assert.deepEqual(fb, { saved: true, rapid: true, timeUp: false }, 'the post-test reveals no answers');
    }
    // The first item (PC1) was answered with option 0 above, which may or may not be right.
    const first = JSON.parse(db.prepare(`SELECT state FROM quizzes WHERE user_id = ? AND status = 'active'`).get(sid).state).blocks[0].items[0];
    const asum = await finishQuiz(db, student, sid, id => id.startsWith('PC'));
    const expected = C.SUBJECTS.PC.sequence.length - 1 + (first.correct ? 1 : 0);
    assert.equal(asum.summary.total, C.trackSequence('STEM').length, 'one question per topic');
    assert.equal(asum.summary.subjects.length, 8);
    assert.ok(asum.summary.foundations.length === 0, 'no foundation checks in the post-test');
    assert.equal(asum.summary.correct, expected);
    s = (await student.get('/api/student/state')).data;
    const postPct = Math.round(100 * expected / C.trackSequence('STEM').length);
    assert.equal(s.learner.postTest, postPct);
    assert.equal(s.results.post.percent, postPct);
    assert.equal(s.results.post.subjects.find(x => x.id === 'PC').correct, expected);
    assert.equal(s.posttest.done, true);
    assert.equal((await student.post('/api/quiz/start', { kind: 'posttest' })).status, 409, 'taken once');
    // The teacher sees both results and can allow a retake.
    const tr = (await teacher.get('/api/teacher/state')).data.results[sid];
    assert.equal(tr.pre.percent, 0);
    assert.equal(tr.post.percent, postPct);
    const postResp = (await teacher.get(`/api/students/${sid}/responses`)).data.responses.filter(x => x.kind === 'posttest');
    assert.equal(postResp.length, C.trackSequence('STEM').length);
    assert.deepEqual(postResp.filter(x => x.rapid).map(x => x.number), [1], 'only the instant first answer is flagged');
    assert.equal(tr.post.rapid, 1);
    // Model check: fitted models and their validation, for teachers only.
    const mc = (await teacher.get('/api/models?fresh=1')).data;
    assert.equal(mc.rapidSec, 3);
    assert.equal(mc.bkt.used, 'default', 'one student is too little data to replace the defaults');
    assert.equal(mc.bkt.ready, false);
    assert.equal(typeof mc.load.bias, 'number');
    assert.ok(mc.rapid.posttest.rapid >= 1);
    assert.equal((await student.get('/api/models')).status, 403);
    assert.equal((await teacher.post(`/api/students/${sid}/retake-posttest`)).status, 200);
    assert.equal((await student.get('/api/student/state')).data.posttest.available, true);
    assert.equal((await teacher.patch(`/api/classes/${classId}`, { assessment: 'none' })).status, 200);

    // Teacher sees everything for their class
    const t2 = (await teacher.get('/api/teacher/state')).data;
    assert.equal(t2.learners.length, 1);
    assert.equal(t2.learners[0].diagnosticDone, true);
    assert.equal(t2.attempts.length, s.attempts.length);
    assert.equal(typeof t2.model.bias, 'number');
    assert.equal((await teacher.patch(`/api/students/${sid}`, { group: 'adaptive', postTest: 55 })).status, 200);
    assert.equal((await teacher.patch(`/api/students/${sid}`, { postTest: 150 })).status, 400);

    // A second teacher cannot reach another teacher's students
    assert.equal((await teacher.post('/api/teachers', { name: 'Mr Lim', username: 'mr.lim', password: 'temp-pass-9' })).status, 200);
    const other = client(base);
    r = await other.post('/api/login', { username: 'mr.lim', password: 'temp-pass-9', role: 'teacher' });
    assert.equal(r.data.user.mustChange, true);
    assert.equal((await other.post('/api/classes', { name: 'X' })).status, 403, 'must change password first');
    assert.equal((await other.post('/api/password', { current: 'temp-pass-9', next: 'my-own-pass' })).status, 200);
    assert.equal((await other.patch(`/api/students/${sid}`, { group: 'standard' })).status, 404);
    assert.equal((await other.get('/api/teacher/state')).data.learners.length, 0);
    assert.equal((await other.get(`/api/students/${sid}/responses`)).status, 404, 'answer times stay with the student’s own teacher');

    // Password reset signs the student out and forces a new password
    assert.equal((await teacher.post(`/api/students/${sid}/password`, { password: 'reset-77' })).status, 200);
    assert.equal((await student.get('/api/student/state')).status, 401);
    r = await student.post('/api/login', { username: 'ana.cruz', password: 'reset-77', role: 'student' });
    assert.equal(r.data.user.mustChange, true);
    assert.equal((await student.post('/api/quiz/start', { kind: 'practice', skillId: 'CHB2' })).status, 403);
    assert.equal((await student.post('/api/password', { current: 'reset-77', next: 'mine-123' })).status, 200);
    assert.equal((await student.post('/api/quiz/start', { kind: 'practice', skillId: 'CHB2' })).status, 200);

    // Switching track changes what can be practised.
    assert.equal((await student.post('/api/quiz/quit')).status, 200);
    assert.equal((await student.patch('/api/student/track', { track: 'ABM' })).status, 200);
    assert.equal((await student.patch('/api/student/track', { track: 'Sports' })).status, 400);
    assert.equal((await student.post('/api/quiz/start', { kind: 'practice', skillId: 'BM2' })).status, 200);
    assert.equal((await student.post('/api/quiz/start', { kind: 'practice', skillId: 'BC1' })).status, 400, 'Basic Calculus is not an ABM subject');

    // Wrong role tab gives a clear message
    assert.equal((await client(base).post('/api/login', { username: 'ana.cruz', password: 'mine-123', role: 'teacher' })).status, 403);
  } finally {
    server.close();
  }
});

test('question bank: teachers add, edit, hide and restore questions; students get the result', async () => {
  const { db, server, base } = await startServer();
  try {
    const t = client(base);
    await t.post('/api/setup', { name: 'Ms Dela Cruz', username: 'ms.dc', password: 'teach-pass-1', className: 'HUMSS A' });
    const code = (await t.get('/api/teacher/state')).data.classes[0].joinCode;
    const s = client(base);
    const sid = (await s.post('/api/register', { joinCode: code, name: 'Ben', username: 'ben.h', password: 'secret1', track: 'HUMSS' })).data.user.id;
    assert.equal((await s.get('/api/bank/skills/CW1')).status, 403, 'students cannot see the bank');

    let b = (await t.get('/api/bank/skills/CW1')).data;
    assert.equal(b.generated, false);
    assert.equal(b.items.length, 5);
    assert.ok(b.items.every(i => i.kind === 'builtin' && i.active && i.spec.wrong.length === 3 && i.spec.explanation));
    const g = (await t.get('/api/bank/skills/PHA3')).data;
    assert.equal(g.generated, true);
    assert.equal(g.samples.length, 3, 'generated topics show examples');
    assert.equal((await t.get('/api/bank/skills/NOPE')).status, 400);

    const mine = { prompt: 'Which device repeats a consonant sound at the start of words?', answer: 'Alliteration', wrong: [['Assonance', 'That repeats vowel sounds.'], ['Simile', ''], ['Irony', '']], hint: '', explanation: 'Alliteration repeats initial consonants.\nExample: "Peter Piper picked".' };
    assert.equal((await t.post('/api/bank/skills/CW1', { ...mine, wrong: mine.wrong.slice(0, 2) })).status, 400);
    b = (await t.post('/api/bank/skills/CW1', mine)).data;
    const custom = b.items.find(i => i.kind === 'custom');
    assert.equal(custom.spec.explanation, mine.explanation, 'one step per line');
    assert.equal(custom.updatedBy, 'Ms Dela Cruz');

    b = (await t.put(`/api/bank/items/${encodeURIComponent('CW1#1')}`, { ...mine, prompt: 'Edited built-in question?' })).data;
    assert.ok(b.items.find(i => i.id === 'CW1#1').edited);
    for (const n of [2, 3, 4]) b = (await t.post(`/api/bank/items/${encodeURIComponent(`CW1#${n}`)}/active`, { active: false })).data;
    assert.equal(b.items.filter(i => i.active).length, 3);
    // CW1#1 (edited), CW1#5 and the custom question remain; one more can go, then the minimum holds.
    assert.equal((await t.post(`/api/bank/items/${encodeURIComponent('CW1#5')}/active`, { active: false })).status, 200);
    assert.equal((await t.post(`/api/bank/items/${encodeURIComponent('CW1#1')}/active`, { active: false })).status, 409);
    assert.equal((await t.del(`/api/bank/items/${custom.id}`)).status, 409, 'deleting would leave too few');
    const counts = (await t.get('/api/bank')).data.counts.CW1;
    assert.deepEqual(counts, { builtin: 5, generated: false, custom: 1, hidden: 4, edited: 1 });

    // A student practising CW1 only gets active questions, with the teacher's edits.
    db.prepare('UPDATE users SET diagnostic_done = 1 WHERE id = ?').run(sid);
    assert.equal((await s.post('/api/quiz/start', { kind: 'practice', skillId: 'CW1' })).status, 200);
    const items = JSON.parse(db.prepare(`SELECT state FROM quizzes WHERE user_id = ? AND status = 'active'`).get(sid).state).blocks[0].items;
    assert.ok(items.every(i => i.id === 'CW1#1' || i.id === custom.id), items.map(i => i.id).join(','));
    assert.ok(items.some(i => i.prompt === 'Edited built-in question?'));

    // Restoring a built-in question undoes the edit.
    b = (await t.del(`/api/bank/items/${encodeURIComponent('CW1#1')}`)).data;
    assert.equal(b.items.find(i => i.id === 'CW1#1').edited, false);
    assert.equal((await t.del('/api/bank/items/nope')).status, 404);
  } finally { server.close(); }
});

test('models: the synthetic demo class is marked, used only until real students can be fitted, and flagged', async () => {
  const { server, base, db } = await startServer();
  try {
    const t = client(base);
    await t.post('/api/setup', { name: 'Ms Lim', username: 'ms.lim', password: 'teach-pass-1', className: 'STEM A' });
    const teacherId = db.prepare(`SELECT id FROM users WHERE role = 'teacher'`).get().id;
    const realClass = db.prepare('SELECT id FROM classes').get().id;
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO classes (id, name, teacher_id, join_code, created_at) VALUES ('CDEMO', 'Demo class (synthetic)', ?, 'DEMO42', ?)`).run(teacherId, now);
    const data = require('../scripts/demo-data.js').demoData();
    const addClass = (classId, prefix, source) => {
      data.learners.forEach(l => db.prepare(`INSERT INTO users (id, role, username, name, pass_hash, class_id, strand, diagnostic_done, created_at) VALUES (?, 'student', ?, ?, 'x', ?, ?, 1, ?)`)
        .run(prefix + l.id, `${prefix}.${l.id}`.toLowerCase(), l.name, classId, l.strand, now));
      data.attempts.forEach((a, i) => db.prepare(`INSERT INTO attempts (id, learner_id, skill_id, date, type, items_correct, items_total, time_sec, hints, source, created_at, answers)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(`${prefix}A${i}`, prefix + a.learnerId, a.skillId, a.date, a.type, a.itemsCorrect, a.itemsTotal, a.timeSec, a.hints, source, now, a.answers));
    };
    // A demo class seeded before demo answers were marked: the migration marks it.
    addClass('CDEMO', 'D', 'app');
    require('../server/db.js').migrate(db);
    assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM attempts WHERE source = 'app'`).get().n, 0);
    let mc = (await t.get('/api/models?fresh=1')).data;
    assert.equal(mc.bkt.ready, true);
    assert.equal(mc.bkt.data.synthetic, true, 'only demo answers: used, and flagged');
    assert.equal(mc.bkt.nOrdered, mc.bkt.nAnswers, 'demo answers keep their order');
    assert.ok(mc.method.ordered.params.pLearn > 0, 'the method check comes with the model check');
    // Real students with enough answers: the demo class is left out.
    addClass(realClass, 'R', 'app');
    assert.equal((await t.post('/api/attempts', { learnerId: 'RL01', skillId: 'J1', type: 'quiz', itemsCorrect: 1, itemsTotal: 2, timeSec: 60 })).status, 200);
    mc = (await t.get('/api/models?fresh=1')).data;
    assert.equal(mc.bkt.data.synthetic, false);
    assert.equal(mc.bkt.data.demoExcluded, true);
    assert.equal(mc.bkt.nLearners, data.learners.length);
    assert.equal(mc.bkt.nAnswers - mc.bkt.nOrdered, 2, 'the hand-entered attempt has totals only');
  } finally { server.close(); }
});

test('teachers can create their own account, optionally gated by a school code', async () => {
  let { server, base } = await startServer();
  try {
    await client(base).post('/api/setup', { name: 'Admin', username: 'admin.t', password: 'password1', className: 'A' });
    const t = client(base);
    assert.equal((await t.get('/api/session')).data.teacherSignup, 'open');
    assert.equal((await t.post('/api/register-teacher', { name: 'New T', username: 'new.t', password: 'short' })).status, 400);
    const r = await t.post('/api/register-teacher', { name: 'New Teacher', username: 'new.t', password: 'password22', className: 'Grade 11 ABM' });
    assert.equal(r.status, 200);
    assert.equal(r.data.user.role, 'teacher');
    const st = (await t.get('/api/teacher/state')).data;
    assert.equal(st.classes.length, 1);
    assert.equal(st.classes[0].name, 'Grade 11 ABM');
    assert.equal((await client(base).post('/api/register-teacher', { name: 'Dup', username: 'NEW.T', password: 'password22' })).status, 409);
  } finally { server.close(); }

  ({ server, base } = await startServer({ teacherSignupCode: 'SCHOOL-2026' }));
  try {
    await client(base).post('/api/setup', { name: 'Admin', username: 'admin.t', password: 'password1', className: 'A' });
    const t = client(base);
    assert.equal((await t.get('/api/session')).data.teacherSignup, 'code');
    assert.equal((await t.post('/api/register-teacher', { name: 'X', username: 'x.teacher', password: 'password22', signupCode: 'wrong' })).status, 403);
    assert.equal((await t.post('/api/register-teacher', { name: 'X', username: 'x.teacher', password: 'password22', signupCode: 'SCHOOL-2026' })).status, 200);
  } finally { server.close(); }
});

test('login throttling, static files and path traversal', async () => {
  const { server, base } = await startServer();
  try {
    const t = client(base);
    await t.post('/api/setup', { name: 'T', username: 'teacher1', password: 'password1', className: 'C' });
    const c = client(base);
    for (let i = 0; i < 5; i++) assert.equal((await c.post('/api/login', { username: 'teacher1', password: 'nope' })).status, 401);
    const locked = await c.post('/api/login', { username: 'teacher1', password: 'password1' });
    assert.equal(locked.status, 429, 'locked even with the right password');
    assert.equal((await c.post('/api/login', { username: 'nobody', password: 'x' })).status, 401, 'unknown users get the same message');

    const page = await c.raw('/');
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-security-policy'), /default-src 'self'/);
    assert.match(await page.text(), /NeuroLearn-X/);
    assert.equal((await c.raw('/..%2fserver%2fapp.js')).status, 404);
    assert.equal((await c.raw('/js/engine.js')).status, 200);
    const k = await c.raw('/vendor/katex/katex.min.js');
    assert.equal(k.status, 200, 'KaTeX served locally');
    assert.equal((await c.raw('/vendor/katex/fonts/KaTeX_Main-Regular.woff2')).headers.get('content-type'), 'font/woff2');
    assert.equal((await c.raw('/vendor/katex/..%2f..%2f..%2fpackage.json')).status, 404);
    // Installable on phones: manifest and home-screen icons.
    const man = await c.raw('/manifest.webmanifest');
    assert.equal(man.headers.get('content-type'), 'application/manifest+json');
    const manifest = await man.json();
    assert.equal(manifest.display, 'standalone');
    for (const icon of [...manifest.icons.map(i => i.src), 'icons/apple-touch-icon.png', 'icons/favicon-32.png']) {
      const r = await c.raw(`/${icon}`);
      assert.equal(r.status, 200, icon);
      assert.equal(r.headers.get('content-type'), 'image/png');
    }
    assert.match(await (await c.raw('/')).text(), /viewport-fit=cover/);
  } finally {
    server.close();
  }
});
