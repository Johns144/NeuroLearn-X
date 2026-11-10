/*
 * NeuroLearn-X — quiz engine.
 *
 *   diagnostic  First thing a student does, and their pre-test. One set per
 *               subject of the student's track, one question on every topic,
 *               30 minutes, no hints, answers shown only at the end. When a
 *               set goes badly, short checks on the Junior High foundations
 *               behind the missed topics follow (at most a handful; they guide
 *               the path but are not part of the score).
 *   posttest    Taken after the learning path is complete (or when the
 *               teacher opens it): the same format as the diagnostic, so the
 *               two scores can be compared.
 *   practice    One set on a chosen topic, with hints and worked answers.
 *
 * Each finished set becomes one attempt record per topic it covered (items,
 * the answers in the order given, server-measured time, hints, and the
 * student's 1–9 effort rating), which is what the analytics engine consumes. Every answer also yields a response
 * record with the time spent on that question. State is plain JSON so it
 * survives restarts.
 *
 * `src(skillId, n, rng)` supplies the questions; the server passes one that
 * applies the teachers' question-bank edits.
 */
'use strict';
const Q = require('./questions.js');
const { RAPID_SEC, answerCode } = require('../public/js/engine.js');

const TEST_MINUTES = 30;
const CONFIG = {
  diagnostic: { perSkill: 1, hints: false, reveal: false, effort: true, limitSec: TEST_MINUTES * 60, foundations: true, type: 'diagnostic' },
  posttest: { perSkill: 1, hints: false, reveal: false, effort: true, limitSec: TEST_MINUTES * 60, foundations: false, type: 'summative' },
  practice: { items: 5, hints: true, reveal: true, effort: true, limitSec: 0, foundations: false, type: 'practice' }
};
// Foundation checks in the diagnostic: 3 items each, 2 to pass, at most 4.
const FOUNDATION = { items: 3, pass: 2, max: 4 };
// Longest a single question can count: an idle tab should not eat the test
// clock or inflate time on task.
const ITEM_CAP_SEC = { timed: 300, untimed: 600 };
const defaultSrc = (skillId, n, rng) => Q.generateSet(skillId, n, rng);

/*
 * subjects: [{ id, label, skills }] in the order the track teaches them.
 * Plans are what a block will cover; blocks are plans with their questions.
 */
function start(kind, { graph, skillId, subjects, rng = Math.random, src = defaultSrc }) {
  if (!CONFIG[kind]) throw new Error('Unknown quiz kind');
  const state = { v: 3, kind, subjects: [], queue: [], passed: [], probed: [], blocks: [], b: 0, i: 0, awaitingEffort: false, finished: false, timedOut: false };
  if (kind === 'practice') {
    state.blocks.push(newBlock({ type: 'skill', label: graph.byId[skillId].name, skills: [skillId] }, kind, rng, src));
  } else {
    if (!subjects || !subjects.length) throw httpError(409, 'Choose your track first.');
    state.subjects = subjects.map(s => ({ id: s.id, label: s.label, skills: [...s.skills] }));
    state.queue = state.subjects.map(s => ({ type: 'subject', ...s }));
    state.blocks.push(newBlock(state.queue.shift(), kind, rng, src));
  }
  return state;
}

function newBlock(plan, kind, rng, src) {
  const per = plan.type === 'foundation' ? FOUNDATION.items : kind === 'practice' ? CONFIG.practice.items : CONFIG[kind].perSkill;
  const items = [];
  plan.skills.forEach(id => src(id, per, rng).forEach(it => items.push({ ...it, skillId: id, servedAt: null, answeredAt: null, choice: null, correct: null, hinted: false })));
  return { ...plan, items, effort: null, done: false };
}

const block = state => state.blocks[state.b];
const item = state => block(state).items[state.i];
const skillOut = (graph, id) => ({ id, name: graph.byId[id].name, short: graph.byId[id].short });
const blockOut = bl => ({ type: bl.type, label: bl.label });
const capOf = state => (CONFIG[state.kind].limitSec ? ITEM_CAP_SEC.timed : ITEM_CAP_SEC.untimed);
const itemSec = (state, x) => Math.min(capOf(state), Math.max(0, (x.answeredAt - x.servedAt) / 1000));

// Seconds of test time used: answered questions plus the one on screen.
function elapsed(state, now = Date.now()) {
  // A test that ran out used all of its time, including the question left open.
  if (state.timedOut) return CONFIG[state.kind].limitSec;
  let s = 0;
  state.blocks.forEach(bl => bl.items.forEach(x => { if (x.answeredAt != null) s += itemSec(state, x); }));
  if (!state.finished && !state.awaitingEffort) {
    const it = item(state);
    if (it && it.servedAt != null && it.answeredAt == null) s += Math.min(capOf(state), Math.max(0, (now - it.servedAt) / 1000));
  }
  return s;
}

/*
 * Ends a timed test whose time has run out. Returns the attempt records for
 * the topics answered in the unfinished set (topics never reached get none,
 * so they stay unverified rather than counted as gaps).
 */
function tick(state, graph, now = Date.now()) {
  const limit = CONFIG[state.kind].limitSec;
  if (!limit || state.finished || elapsed(state, now) < limit) return [];
  return timeUp(state);
}

function timeUp(state) {
  const bl = block(state);
  const answered = bl.items.filter(x => x.answeredAt != null);
  let records = [];
  if (!bl.done && answered.length) {
    bl.done = true;
    records = recordsOf(state, bl, bl.effort);
  }
  state.awaitingEffort = false;
  state.finished = true;
  state.timedOut = true;
  state.queue = [];
  return records;
}

// What the student may see. Never includes the answer of an open item.
function view(state, graph, now = Date.now()) {
  const cfg = CONFIG[state.kind];
  const done = state.blocks.filter(b => b.done).length;
  const base = {
    kind: state.kind, blocksDone: done,
    blocksPlanned: state.kind === 'practice' ? 1 : done + (state.finished ? 0 : 1) + state.queue.length,
    timer: cfg.limitSec ? { limitSec: cfg.limitSec, remainingSec: Math.max(0, Math.round(cfg.limitSec - elapsed(state, now))), running: !state.awaitingEffort && !state.finished } : null
  };
  if (state.finished) return { ...base, finished: true, summary: summary(state, graph) };
  const bl = block(state);
  if (state.awaitingEffort) {
    return { ...base, block: blockOut(bl), skill: skillOut(graph, bl.skills[0]), awaitingEffort: true, blockScore: cfg.reveal ? { correct: bl.items.filter(x => x.correct).length, total: bl.items.length } : { total: bl.items.length } };
  }
  const it = item(state);
  if (it.servedAt == null) {
    it.servedAt = now;
    if (base.timer) base.timer.running = true;
  }
  return {
    ...base, block: blockOut(bl), skill: skillOut(graph, it.skillId),
    itemIndex: state.i, itemsInBlock: bl.items.length,
    question: { prompt: it.prompt, choices: it.choices, hintsAllowed: cfg.hints, hint: it.hinted ? it.hint : null }
  };
}

function hint(state) {
  if (!CONFIG[state.kind].hints) throw httpError(400, 'Hints are not available in this test.');
  if (state.finished || state.awaitingEffort) throw httpError(409, 'No open question.');
  const it = item(state);
  it.hinted = true;
  return it.hint;
}

/*
 * Grades the open item. Returns feedback, the response record for this
 * question (with its time) and, when a block closes without an effort step
 * or the time runs out, the attempts to record.
 */
function answer(state, choice, graph, now = Date.now(), src = defaultSrc, rng = Math.random) {
  if (state.finished) throw httpError(409, state.timedOut ? 'Time is up. Your answers so far are saved.' : 'This test is finished.');
  if (state.awaitingEffort) throw httpError(409, 'No open question.');
  if (!Number.isInteger(choice) || choice < 0 || choice > 3) throw httpError(400, 'Choose one of the four options.');
  const cfg = CONFIG[state.kind];
  const bl = block(state);
  const it = item(state);
  if (it.servedAt == null) it.servedAt = now;
  it.answeredAt = now;
  it.choice = choice;
  it.correct = choice === it.answer;
  // Answered faster than anyone can read the question: a rapid guess. It is
  // flagged, and left out of mastery estimates (the score still counts it).
  it.rapid = itemSec(state, it) < RAPID_SEC;
  const number = state.blocks.reduce((n, b) => n + b.items.filter(x => x.answeredAt != null).length, 0);
  const response = { skillId: it.skillId, block: bl.type, subjectId: bl.type === 'subject' ? bl.id : null, number, correct: it.correct, timeSec: Math.round(itemSec(state, it) * 10) / 10, hinted: it.hinted, rapid: it.rapid };
  // Tutoring feedback in practice: worked steps, the key idea and, for a wrong
  // choice, the misconception behind it. Tests reveal nothing until the end.
  const feedback = cfg.reveal
    ? { correct: it.correct, answer: it.answer, steps: it.steps, idea: it.idea, why: it.whys ? it.whys[choice] : null, hinted: it.hinted, rapid: it.rapid }
    : { saved: true, rapid: it.rapid };
  let records = [];
  if (cfg.limitSec && elapsed(state, now) >= cfg.limitSec) {
    records = timeUp(state);
  } else if (state.i < bl.items.length - 1) {
    state.i++;
  } else if (cfg.effort) {
    state.awaitingEffort = true;
  } else {
    records = closeBlock(state, graph, null, src, rng);
  }
  return { feedback, records, response };
}

// Effort rating (1–9, or null to skip) closes the block.
function rateEffort(state, effort, graph, src = defaultSrc, rng = Math.random) {
  if (!state.awaitingEffort) throw httpError(409, 'Nothing to rate right now.');
  if (effort !== null && !(Number.isInteger(effort) && effort >= 1 && effort <= 9)) throw httpError(400, 'Effort must be 1 to 9.');
  state.awaitingEffort = false;
  return closeBlock(state, graph, effort, src, rng);
}

// Per-topic results of a block over its answered questions, in the order asked.
function bySkill(state, bl) {
  return bl.skills.map(id => {
    const its = bl.items.filter(x => x.skillId === id && x.answeredAt != null);
    return {
      skillId: id, correct: its.filter(x => x.correct).length, total: its.length, timeSec: its.reduce((s, x) => s + itemSec(state, x), 0), hints: its.filter(x => x.hinted).length,
      rapid: its.filter(x => x.rapid).length, rapidCorrect: its.filter(x => x.rapid && x.correct).length,
      answers: its.map(x => answerCode(x.correct, x.hinted, x.rapid)).join('')
    };
  }).filter(p => p.total > 0);
}

function recordsOf(state, bl, effort) {
  return bySkill(state, bl).map(p => ({
    skillId: p.skillId, type: CONFIG[state.kind].type,
    itemsCorrect: p.correct, itemsTotal: p.total,
    timeSec: Math.max(1, Math.round(p.timeSec)), hints: p.hints, effort,
    rapid: p.rapid, rapidCorrect: p.rapidCorrect, answers: p.answers
  }));
}

function closeBlock(state, graph, effort, src, rng) {
  const bl = block(state);
  bl.effort = effort;
  bl.done = true;
  const records = recordsOf(state, bl, effort);
  if (CONFIG[state.kind].foundations) {
    planFoundations(state, graph, bl, bySkill(state, bl));
    // A queued check may have been credited since by a foundation passed above it.
    while (state.queue.length && state.queue[0].type === 'foundation' && credited(state, graph, state.queue[0].skills[0])) state.queue.shift();
  }
  if (state.kind !== 'practice' && state.queue.length) startNext(state, state.queue.shift(), rng, src);
  else state.finished = true;
  return records;
}

const credited = (state, graph, id) => state.passed.some(p => p === id || graph.ancestors(p).has(id));

/*
 * After a diagnostic set: if half or fewer of its answers were right, check
 * the Junior High foundations behind the topics the student missed,
 * deepest-reaching first. A passed foundation credits everything beneath it;
 * a failed one opens its own foundations. Never more than FOUNDATION.max.
 */
function planFoundations(state, graph, bl, parts) {
  const correct = parts.reduce((s, p) => s + p.correct, 0), total = parts.reduce((s, p) => s + p.total, 0);
  if (bl.type === 'foundation') {
    if (correct >= FOUNDATION.pass) { state.passed.push(bl.skills[0]); return; }
  } else if (correct * 2 > total) return;
  const weak = bl.type === 'foundation' ? bl.skills : parts.filter(p => p.correct * 2 <= p.total).map(p => p.skillId);
  const wanted = new Set();
  weak.forEach(id => {
    const direct = graph.byId[id].prereqs.filter(p => graph.byId[p].level === 'JHS');
    // An SHS topic with no direct JHS link reaches Junior High through its prerequisites.
    (direct.length ? direct : [...graph.ancestors(id)].filter(p => graph.byId[p].level === 'JHS')).forEach(p => wanted.add(p));
  });
  const fresh = [...wanted]
    .filter(id => !state.probed.includes(id) && !credited(state, graph, id))
    .sort((a, b) => graph.topoIndex[b] - graph.topoIndex[a])
    .slice(0, FOUNDATION.max - state.probed.length);
  state.probed.push(...fresh);
  // Checked right away, while the subject is fresh.
  state.queue.unshift(...fresh.map(id => ({ type: 'foundation', label: `Foundation check: ${graph.byId[id].name}`, skills: [id] })));
}

function startNext(state, plan, rng, src) {
  state.blocks.push(newBlock(plan, state.kind, rng, src));
  state.b = state.blocks.length - 1;
  state.i = 0;
}

/*
 * Practice: the finished set. Tests: the score over every topic of every
 * subject (topics not reached in time count as not correct, so a pre-test
 * and a post-test are scored on the same total), per subject and per topic.
 */
function summary(state, graph, now = Date.now()) {
  const blocks = state.blocks.filter(b => b.done).map(b => {
    const skills = bySkill(state, b).map(p => ({ id: p.skillId, name: graph.byId[p.skillId].name, correct: p.correct, total: p.total }));
    return { type: b.type, id: b.id || b.skills[0], label: b.label, skills, correct: skills.reduce((s, x) => s + x.correct, 0), total: skills.reduce((s, x) => s + x.total, 0) };
  });
  if (state.kind === 'practice') {
    const correct = blocks.reduce((s, b) => s + b.correct, 0), total = blocks.reduce((s, b) => s + b.total, 0);
    return { blocks, correct, total, percent: total ? Math.round(100 * correct / total) : 0 };
  }
  const per = CONFIG[state.kind].perSkill;
  const subjects = state.subjects.map(s => {
    const bl = state.blocks.find(b => b.type === 'subject' && b.id === s.id);
    const topics = s.skills.map(id => {
      const its = bl ? bl.items.filter(x => x.skillId === id && x.answeredAt != null) : [];
      return { id, name: graph.byId[id].name, correct: its.filter(x => x.correct).length, total: per, answered: its.length };
    });
    return { id: s.id, label: s.label, topics, correct: topics.reduce((a, t) => a + t.correct, 0), total: topics.length * per, answered: topics.reduce((a, t) => a + t.answered, 0) };
  });
  const correct = subjects.reduce((a, s) => a + s.correct, 0), total = subjects.reduce((a, s) => a + s.total, 0);
  // Rapid guesses among the scored (subject) questions.
  const rapid = state.blocks.filter(b => b.type === 'subject').reduce((n, b) => n + b.items.filter(x => x.rapid).length, 0);
  return {
    blocks, subjects, rapid,
    foundations: blocks.filter(b => b.type === 'foundation'),
    correct, total, answered: subjects.reduce((a, s) => a + s.answered, 0),
    percent: total ? Math.round(100 * correct / total) : 0,
    timeSec: Math.round(elapsed(state, now)), limitSec: CONFIG[state.kind].limitSec, timedOut: state.timedOut
  };
}

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

module.exports = { CONFIG, FOUNDATION, TEST_MINUTES, start, view, tick, hint, answer, rateEffort, summary, elapsed, httpError };
