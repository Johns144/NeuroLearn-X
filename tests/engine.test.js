// Run with: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../public/js/engine.js');
const C = require('../public/js/curriculum.js');
const { demoData } = require('../scripts/demo-data.js');

const G = C.graph;
const STD = C.STANDARD_SEQUENCE;
const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg || ''} expected ${b} ± ${eps}, got ${a}`);

let n = 0;
const att = (skillId, itemsCorrect, itemsTotal, extra = {}) => ({
  id: `t${++n}`, learnerId: 'X', skillId, date: `2026-09-${String(10 + (n % 18)).padStart(2, '0')}`,
  type: 'practice', itemsCorrect, itemsTotal, timeSec: G.byId[skillId].secPerItem * itemsTotal, hints: 0, effort: null, ...extra
});

// ------------------------------------------------------------ curriculum
test('curriculum graph is acyclic and standard sequence respects prerequisites', () => {
  assert.equal(G.topo.length, C.SKILLS.length);
  STD.forEach((id, i) => {
    assert.ok(G.byId[id], `${id} exists`);
    G.ancestors(id).forEach(a => {
      const j = STD.indexOf(a);
      if (j >= 0) assert.ok(j < i, `${a} precedes ${id}`);
    });
  });
  assert.throws(() => C.buildGraph([{ id: 'A', prereqs: ['B'] }, { id: 'B', prereqs: ['A'] }]), /cycle/);
  // Every track's sequence also meets each prerequisite before it is needed.
  assert.deepEqual(C.TRACK_IDS, ['STEM', 'HUMSS', 'ABM', 'GAS']);
  const FOCUS = {
    STEM: ['Pre-Calculus', 'Basic Calculus', 'General Biology 1', 'General Biology 2', 'General Chemistry 1', 'General Chemistry 2', 'General Physics 1', 'General Physics 2'],
    HUMSS: ['Creative Writing', 'Creative Nonfiction', 'World Religions', 'Philippine Politics', 'Disciplines and Ideas in the Social Sciences', 'Disciplines and Ideas in the Applied', 'Community Engagement', 'Trends, Networks'],
    ABM: ['Business Mathematics', 'Organization and Management', 'Fundamentals of Accountancy, Business and Management 1', 'Fundamentals of Accountancy, Business and Management 2', 'Applied Economics', 'Business Finance', 'Business Ethics', 'Principles of Marketing'],
    GAS: ['Creative Writing', 'World Religions', 'Social Sciences', 'Applied Economics', 'Organization and Management', 'Disaster Readiness', 'Business Mathematics', 'General Biology 1']
  };
  C.TRACK_IDS.forEach(t => {
    // Exactly the track's eight focus subjects, in this order.
    const subs = C.trackSubjects(t);
    assert.equal(subs.length, 8);
    subs.forEach((id, i) => assert.ok(C.SUBJECTS[id].name.includes(FOCUS[t][i]), `${t} #${i + 1}: ${C.SUBJECTS[id].name}`));
    assert.ok(subs.every(id => C.SUBJECTS[id].sequence.length >= 4), `${t}: every subject has its competencies`);
    const seq = C.trackSequence(t);
    seq.forEach((id, i) => G.ancestors(id).forEach(a => {
      const j = seq.indexOf(a);
      if (j >= 0) assert.ok(j < i, `${t}: ${a} precedes ${id}`);
    }));
    assert.ok(!seq.some(id => /^(GM|SP)/.test(id)), `${t} no longer includes the core math subjects`);
    // Foundations are Junior High topics only.
    C.trackSkills(t).filter(id => !seq.includes(id)).forEach(id => assert.equal(G.byId[id].level, 'JHS', `${t}: ${id}`));
  });
  assert.ok(C.trackSequence('STEM').includes('BC4') && !C.trackSequence('STEM').includes('BM1'));
  assert.ok(C.trackSequence('ABM').includes('BM4') && !C.trackSequence('ABM').includes('PC1'));
  assert.equal(C.subjectLabel('GAS', 'BIO1'), 'Elective 2: General Biology 1');
  assert.equal(C.subjectLabel('STEM', 'BIO1'), 'General Biology 1');
  assert.deepEqual(C.trackSubjects('TVL'), []);
  assert.throws(() => C.buildGraph([{ id: 'A', prereqs: ['Z'] }]), /unknown prerequisite/);
});

// ------------------------------------------------------------ 1. mastery
test('BKT step matches the closed form', () => {
  // p=0.25, correct: posterior 0.2125/0.4 = 0.53125, then learning + 0.46875*0.03
  close(E.bktStep(0.25, true), 0.5453125, 1e-12);
  // p=0.25, wrong: 0.0375/0.6 = 0.0625, then + 0.9375*0.03
  close(E.bktStep(0.25, false), 0.090625, 1e-12);
});

test('item sequence spreads exactly the correct count', () => {
  for (let t = 1; t <= 12; t++) for (let c = 0; c <= t; c++) {
    assert.equal(E.itemSequence(c, t).filter(Boolean).length, c);
  }
  // Mixed scores never end on a correct item when most are wrong, and vice versa.
  assert.equal(E.itemSequence(3, 10)[9], false);
  assert.equal(E.itemSequence(7, 10)[9], true);
});

test('a low score never reads as developing mastery', () => {
  const { mastery } = E.traceMastery([att('J6', 3, 10)], G);
  assert.equal(E.masteryStatus(mastery.J6), 'gap');
  assert.ok(mastery.J6.p < 0.35, `p = ${mastery.J6.p}`);
});

test('traceMastery: strong evidence masters a skill, prerequisites are inferred, untouched skills stay unverified', () => {
  const { mastery } = E.traceMastery([att('GM2', 10, 10), att('GM2', 9, 10)], G);
  assert.equal(E.masteryStatus(mastery.GM2), 'mastered');
  assert.equal(mastery.GM1.source, 'inferred');
  assert.equal(mastery.J4.source, 'inferred');
  assert.equal(mastery.GM9.source, 'prior');
  assert.equal(E.masteryStatus(mastery.GM9), 'unverified');
});

test('traceMastery records the state before each attempt, not after', () => {
  const a1 = att('J5', 0, 10, { date: '2026-09-01' });
  const a2 = att('J5', 10, 10, { date: '2026-09-02' });
  const { before } = E.traceMastery([a2, a1], G);
  assert.equal(before[a1.id].J5.source, 'prior');
  assert.equal(before[a2.id].J5.source, 'assessed');
  assert.ok(before[a2.id].J5.p < 0.3);
});

// ------------------------------------------------------------ 2. load
test('predicted load rises with errors, hints and prerequisite deficit', () => {
  const base = { intrinsic: 0.5, time: 0, error: 0.2, hints: 0, deficit: 0.1 };
  const l0 = E.predictLoad(E.PRIOR_MODEL, base).load;
  ['error', 'hints', 'deficit'].forEach(k => {
    assert.ok(E.predictLoad(E.PRIOR_MODEL, { ...base, [k]: base[k] + 0.4 }).load > l0, k);
  });
  assert.equal(E.loadBand(0.1).key, 'low');
  assert.equal(E.loadBand(0.45).key, 'optimal');
  assert.equal(E.loadBand(0.7).key, 'high');
  assert.equal(E.loadBand(0.95).key, 'overload');
  const p = E.predictLoad(E.PRIOR_MODEL, base);
  close(p.contributions.reduce((a, c) => a + c.contribution, E.PRIOR_MODEL.bias), Math.log(p.load / (1 - p.load)), 1e-9, 'contributions sum to the logit');
});

test('calibration stays on the prior with too few ratings and improves fit with enough', () => {
  const few = E.calibrateLoadModel([{ x: { intrinsic: 0.5, time: 0, error: 0.5, hints: 0, deficit: 0 }, y: 0.5 }]);
  assert.equal(few.calibrated, false);
  assert.deepEqual(few.w, E.PRIOR_MODEL.w);

  const truth = { bias: -2.0, w: { intrinsic: 1.0, time: 0.2, error: 3.5, hints: 0.5, deficit: 3.5 } };
  const rng = E.mulberry32(11);
  const samples = Array.from({ length: 200 }, () => {
    const x = { intrinsic: rng(), time: rng() * 2 - 1, error: rng(), hints: rng() * 0.5, deficit: rng() };
    return { x, y: E.predictLoad(truth, x).load };
  });
  const m = E.calibrateLoadModel(samples);
  assert.equal(m.calibrated, true);
  assert.ok(m.mae < m.priorMae * 0.6, `mae ${m.mae} vs prior ${m.priorMae}`);
  assert.ok(m.w.deficit > E.PRIOR_MODEL.w.deficit, 'moves the deficit weight toward the truth');
});

// ------------------------------------------------------------ 3. gaps
function weakFactoringLearner() {
  // Solid on functions, fails factoring; rational expressions never assessed.
  return [att('J4', 10, 10), att('J7', 10, 10), att('J8', 9, 10), att('GM1', 8, 8), att('GM2', 8, 8), att('GM2', 8, 8),
    att('J5', 2, 10), att('J5', 1, 10)];
}

test('diagnoseGaps finds the root gap beneath an unverified prerequisite', () => {
  const { mastery } = E.traceMastery(weakFactoringLearner(), G);
  const d = E.diagnoseGaps(mastery, G, STD, ['GM3']);
  const byId = Object.fromEntries(d.gaps.map(g => [g.id, g]));
  assert.equal(byId.J5.status, 'gap');
  assert.equal(byId.J5.isRoot, true);
  assert.equal(byId.J6.status, 'unverified');
  assert.equal(byId.J6.isRoot, false);
  assert.deepEqual(d.targets[0].blockedBy.sort(), ['J5', 'J6']);
  assert.equal(d.gaps[0].id, 'J5', 'root gaps sort first');
});

test('diagnoseGaps skips mastered targets', () => {
  const { mastery } = E.traceMastery(weakFactoringLearner(), G);
  const d = E.diagnoseGaps(mastery, G, STD, null);
  assert.ok(!d.targets.some(t => t.id === 'GM1' || t.id === 'GM2'));
});

// ------------------------------------------------------------ 4. pathway
test('pathway puts every prerequisite first and remediation just before what it unblocks', () => {
  const attempts = weakFactoringLearner();
  const { mastery } = E.traceMastery(attempts, G);
  const d = E.diagnoseGaps(mastery, G, STD, null);
  const p = E.recommendPathway(mastery, G, STD, d, E.learnerProfile(attempts, G), E.PRIOR_MODEL);
  const order = p.steps.map(s => s.skillId);
  assert.equal(new Set(order).size, order.length, 'no duplicates');
  order.forEach((id, i) => G.ancestors(id).forEach(a => {
    const j = order.indexOf(a);
    if (j >= 0) assert.ok(j < i, `${a} before ${id}`);
  }));
  assert.deepEqual(order.slice(0, 3), ['J5', 'J6', 'GM3']);
  assert.equal(p.steps[0].kind, 'remediate');
  assert.equal(p.steps[1].kind, 'verify');
  // J9 (quadratics) is only needed for GM5, so it waits until just before GM5.
  assert.equal(order.indexOf('J9'), order.indexOf('GM5') - 1);
  assert.equal(p.totalMinutes, p.steps.reduce((a, s) => a + s.minutes, 0));
});

// ------------------------------------------------------------ 5. comparison
test('simulation is reproducible, bounded and spends the same budget in both arms', () => {
  const attempts = weakFactoringLearner();
  const learner = { id: 'X' };
  const a = E.analyzeLearner({ learner, attempts, graph: G, standard: STD, model: E.PRIOR_MODEL });
  const args = { mastery: a.mastery, graph: G, standard: STD, pathway: a.pathway, profile: a.profile, model: E.PRIOR_MODEL, budget: 24, runs: 50, seed: 3 };
  const s1 = E.simulateComparison(args), s2 = E.simulateComparison(args);
  assert.deepEqual(s1, s2);
  ['adaptive', 'standard'].forEach(k => {
    assert.equal(s1[k].trajectory.length, 25);
    s1[k].trajectory.forEach(p => assert.ok(p.mean >= 0 && p.mean <= 100 && p.lo <= p.mean + 1e-9 && p.mean <= p.hi + 1e-9));
    assert.ok(s1[k].score.mean >= s1.baseline - 1e-9, `${k} does not lose knowledge`);
  });
});

test('Student t distribution matches table values', () => {
  close(E.tTwoTailed(2.228, 10), 0.05, 5e-4);
  close(E.tTwoTailed(2.045, 29), 0.05, 5e-4);
  close(E.tTwoTailed(1.96, 1e6), 0.05, 1e-3);
  close(E.tCritical(10), 2.228, 2e-3);
  close(E.tTwoTailed(0, 5), 1, 1e-12);
});

test('Welch t-test, Hedges g and normalized gain', () => {
  const w = E.welchTTest([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
  close(w.t, -1.8974, 1e-4);
  close(w.df, 5.8824, 1e-4);
  close(w.p, 0.1077, 2e-3);
  assert.ok(w.ci[0] < w.diff && w.diff < w.ci[1] && w.ci[1] > 0, 'CI spans zero when p > .05');
  assert.ok(E.hedgesG([5, 6, 7], [1, 2, 3]) > 0);
  assert.equal(E.effectLabel(0.55), 'medium');
  assert.equal(E.normalizedGain(40, 70), 0.5);
  assert.equal(E.normalizedGain(100, 100), null);
});

test('compareCohorts needs two complete learners per group', () => {
  const ls = [
    { id: 'a', group: 'adaptive', preTest: 40, postTest: 60 },
    { id: 'b', group: 'adaptive', preTest: 50, postTest: 75 },
    { id: 'c', group: 'standard', preTest: 45, postTest: 55 },
    { id: 'd', group: 'standard', preTest: null, postTest: 60 }
  ];
  assert.equal(E.compareCohorts(ls).ready, false);
  ls[3].preTest = 42;
  const cc = E.compareCohorts(ls);
  assert.equal(cc.ready, true);
  close(cc.groups.adaptive.gain.mean, 22.5, 1e-12);
  close(cc.groups.standard.gain.mean, 14, 1e-12);
});

test('pre/post comparison: improvement verdict, paired t-test and path progress', () => {
  assert.equal(E.improvement(40, 70).verdict, 'improved');
  assert.equal(E.improvement(40, 70).nGain, 0.5);
  assert.equal(E.improvement(60, 62).verdict, 'same');
  assert.equal(E.improvement(60, 50).verdict, 'declined');
  assert.equal(E.improvement(60, null), null);
  const pt = E.pairedTTest([40, 50, 45, 42], [60, 75, 55, 60]);
  close(pt.diff, 18.25, 1e-12);
  close(pt.t, 5.851, 1e-2);
  assert.equal(pt.df, 3);
  assert.ok(pt.p < 0.05 && pt.ci[0] > 0);
});

test('path completion needs near-mastery from the learner’s own answers', () => {
  const seq = C.trackSequence('HUMSS');
  const day = d => `2026-10-${String(d).padStart(2, '0')}`;
  const atts = [
    { ...att('CW1', 1, 5), date: day(1) },                  // practised but weak: not completed
    { ...att('CW2', 5, 5), date: day(1) },                  // 5 of 5: reaches near-mastery
    { ...att('CW3', 1, 1), type: 'diagnostic', date: day(1) } // one right answer is not enough
  ];
  const m = E.traceMastery(atts, G).mastery;
  assert.ok(m.CW2.peak >= E.MASTERY.near && m.CW1.peak < E.MASTERY.near && m.CW3.peak < E.MASTERY.near);
  const p = E.pathProgress(m, seq);
  assert.equal(p.done, 1);
  assert.equal(p.total, seq.length);
  assert.equal(p.complete, false);
  assert.ok(p.almost.length === 0 || p.almost.every(id => m[id].p >= E.MASTERY.developing));
  // Practising every topic at 3 of 5 is not enough any more; 5 of 5 is.
  const weak = E.traceMastery(seq.map(id => ({ ...att(id, 3, 5), date: day(2) })), G).mastery;
  assert.equal(E.pathProgress(weak, seq).complete, false);
  const strong = E.traceMastery(seq.map(id => ({ ...att(id, 5, 5), date: day(2) })), G).mastery;
  assert.equal(E.pathProgress(strong, seq).complete, true);
  // Completion survives forgetting: a later decline schedules a review instead.
  const later = E.traceMastery(seq.map(id => ({ ...att(id, 5, 5), date: day(2) })), G, E.BKT, { asOf: '2027-03-01' }).mastery;
  assert.equal(E.pathProgress(later, seq).complete, true);
});

test('answer order: mastery follows the real order when it is stored, and totals otherwise', () => {
  assert.deepEqual(E.parseAnswers('1H0r').map(x => [x.ok, x.hint, x.rapid]), [[true, false, false], [true, true, false], [false, false, false], [false, false, true]]);
  assert.equal(E.parseAnswers('12'), null, 'unknown codes are rejected');
  assert.equal(E.answerCode(true, true, false), 'H');
  // Same score, different order: ending on right answers means more mastery now.
  const late = E.traceMastery([{ ...att('CW1', 3, 5), answers: '00111' }], G).mastery.CW1;
  const early = E.traceMastery([{ ...att('CW1', 3, 5), answers: '11100' }], G).mastery.CW1;
  assert.ok(late.p > early.p + 0.1, `${late.p} vs ${early.p}`);
  // A code that disagrees with the totals is ignored: the totals are used instead.
  const bad = E.evidenceSequence({ ...att('CW1', 3, 5), answers: '11111' });
  assert.equal(bad.ordered, false);
  assert.equal(bad.obs.filter(Boolean).length, 3);
  // Rapid guesses stay out of the evidence.
  assert.deepEqual(E.evidenceSequence({ ...att('CW1', 3, 5), answers: '1R0r1', rapid: 2, rapidCorrect: 1 }).obs, [true, false, true]);
  const ev = E.evaluateMastery([{ ...att('CW1', 3, 5), answers: '00111' }, att('CW2', 2, 4)], G);
  assert.deepEqual([ev.nAnswers, ev.nOrdered], [9, 5]);
});

test('method check: from answers in order, the fitter recovers known BKT parameters', () => {
  const m = E.methodCheck(G);
  const fit = m.ordered.params;
  close(fit.pLearn, m.truth.pLearn, 0.04, 'pLearn');
  close(fit.pSlip, m.truth.pSlip, 0.04, 'pSlip');
  close(fit.pGuess, m.truth.pGuess, 0.04, 'pGuess');
  close(fit.pInit, m.truth.pInit, 0.08, 'pInit');
  assert.ok(fit.pForget < 0.01, `no forgetting in the simulation, fitted ${fit.pForget}`);
  assert.ok(m.ordered.metrics.fitted.auc > m.ordered.metrics.baseline.auc, 'fitted BKT beats percent correct on held-out students');
  assert.ok(m.ordered.metrics.fitted.logLoss < m.ordered.metrics.baseline.logLoss);
  // From totals only the estimates are further from the truth.
  const err = p => Object.keys(m.truth).reduce((s, k) => s + Math.abs(p[k] - m.truth[k]), 0);
  assert.ok(err(m.totals.params) > err(fit), `${err(m.totals.params)} vs ${err(fit)}`);
});

test('finishing the path unlocks the post-test: topics credited from later work stay as quick checks', () => {
  const seq = C.trackSequence('STEM');
  const bc = C.SUBJECTS.BC.sequence;
  // Strong practice on the last Basic Calculus topic credits its earlier topics without practising them.
  const strong = [1, 2, 3].map(d => ({ ...att(bc[bc.length - 1], 5, 5), date: `2026-10-0${d}` }));
  for (const group of ['adaptive', 'standard']) {
    const a = E.analyzeLearner({ learner: { id: 'X', track: 'STEM', group }, attempts: strong, graph: G, standard: seq, model: E.PRIOR_MODEL });
    const credited = seq.filter(id => a.mastery[id].source === 'inferred' && E.masteryStatus(a.mastery[id]) === 'mastered');
    assert.ok(credited.length, 'some topics are credited from later work');
    assert.equal(a.progress.complete, false, 'credited topics do not count toward the post-test');
    credited.forEach(id => {
      const step = a.pathway.steps.find(s => s.skillId === id);
      assert.ok(step, `${id} stays on the ${group} path`);
      if (group === 'adaptive') assert.deepEqual([step.kind, step.credited], ['verify', true]);
    });
    const x = E.explainPathway(a, G, seq, E.PRIOR_MODEL);
    assert.equal(x.steps.length, a.pathway.steps.length, 'every step can be explained');
  }
  // Every topic practised to mastery: nothing left on the path, and the post-test opens.
  const all = seq.flatMap(id => [1, 2].map(d => ({ ...att(id, 5, 5), date: `2026-10-0${d}` })));
  const done = E.analyzeLearner({ learner: { id: 'X', track: 'STEM', group: 'adaptive' }, attempts: all, graph: G, standard: seq, model: E.PRIOR_MODEL });
  assert.equal(done.progress.complete, true);
  assert.equal(done.pathway.steps.length, 0);
});

test('pathway percentage: whole-number share of complete topics, with a state for each pathway', () => {
  const seq = C.SUBJECTS.CW.sequence;
  const untouched = E.traceMastery([], G).mastery;
  assert.deepEqual([E.pathProgress(untouched, seq).percent, E.pathProgress(untouched, seq).state], [0, 'new']);
  // One of the subject's topics practised to near-mastery.
  const one = E.traceMastery([{ ...att(seq[0], 5, 5), date: '2026-10-01' }], G).mastery;
  const p = E.pathProgress(one, seq);
  assert.equal(p.state, 'active');
  assert.equal(p.percent, Math.round(100 / seq.length));
  // Practised but weak still counts as started, at 0%.
  const weak = E.pathProgress(E.traceMastery([{ ...att(seq[0], 1, 5), date: '2026-10-01' }], G).mastery, seq);
  assert.deepEqual([weak.percent, weak.state], [0, 'active']);
  const all = E.pathProgress(E.traceMastery(seq.map(id => ({ ...att(id, 5, 5), date: '2026-10-01' })), G).mastery, seq);
  assert.deepEqual([all.percent, all.state], [100, 'complete']);
  assert.equal(E.pathProgress(untouched, []).percent, 0);
});

test('forgetting: mastery decays between practice days, and spaced practice slows it', () => {
  const one = [{ ...att('CW2', 5, 5), date: '2026-10-01' }];
  const fresh = E.traceMastery(one, G, E.BKT, { asOf: '2026-10-01' }).mastery.CW2;
  const month = E.traceMastery(one, G, E.BKT, { asOf: '2026-10-31' }).mastery.CW2;
  assert.ok(month.p < fresh.p, 'a month without practice lowers recall');
  assert.ok(month.p > E.BKT.pInit, 'but never below the prior');
  assert.equal(month.peak, fresh.peak, 'the peak is kept');
  // The same five correct answers spread over three days are remembered better than one day's.
  const massed = [1, 1, 1].map((_, i) => ({ ...att('CW2', 5, 5), id: `m${i}`, date: '2026-10-01' }));
  const spaced = ['2026-10-01', '2026-10-04', '2026-10-08'].map((d, i) => ({ ...att('CW2', 5, 5), id: `s${i}`, date: d }));
  const asOf = { asOf: '2026-12-01' };
  const mM = E.traceMastery(massed, G, E.BKT, asOf).mastery.CW2, mS = E.traceMastery(spaced, G, E.BKT, asOf).mastery.CW2;
  assert.equal(mS.reviews, 3);
  assert.equal(mM.reviews, 1);
  assert.ok(mS.p > mM.p, `spaced ${mS.p.toFixed(3)} > massed ${mM.p.toFixed(3)}`);
  // No forgetting at all with pForget = 0.
  assert.equal(E.traceMastery(one, G, { ...E.BKT, pForget: 0 }, { asOf: '2027-01-01' }).mastery.CW2.p, fresh.p);
});

test('spaced review: completed topics fall due as recall fades, with growing intervals', () => {
  const seq = ['CW1', 'CW2'];
  const atts = [{ ...att('CW1', 5, 5), date: '2026-10-01' }];
  const sched = asOf => E.reviewSchedule(E.traceMastery(atts, G, E.BKT, { asOf }).mastery, seq, E.BKT, asOf);
  const now = sched('2026-10-02');
  assert.equal(now.length, 1, 'only completed topics are scheduled');
  assert.equal(now[0].due, false);
  const firstDue = now[0].inDays;
  assert.ok(firstDue > 1 && Number.isFinite(firstDue));
  const later = sched('2026-12-31')[0];
  assert.equal(later.due, true);
  assert.ok(later.sinceDays === 91 && later.recall < E.MASTERY.near);
  // After a second practice day, the next interval is longer.
  atts.push({ ...att('CW1', 5, 5), id: 'again', date: '2026-10-20' });
  const again = E.reviewSchedule(E.traceMastery(atts, G, E.BKT, { asOf: '2026-10-20' }).mastery, seq, E.BKT, '2026-10-20')[0];
  assert.ok(again.inDays > firstDue, `${again.inDays} > ${firstDue}`);
  // A due topic becomes a short review step on the adaptive path; the standard group is unchanged.
  const a = E.analyzeLearner({ learner: { id: 'X' }, attempts: atts.map(x => ({ ...x, learnerId: 'X' })), graph: G, standard: C.trackSequence('HUMSS'), model: E.PRIOR_MODEL, asOf: '2027-06-01' });
  const step = a.pathway.steps.find(s => s.skillId === 'CW1');
  assert.equal(step.kind, 'review');
  assert.match(step.reason, /Spaced review/);
  assert.equal(step.order, 1, 'due reviews lead the path');
  assert.deepEqual(a.pathway.steps.map(s => s.order), a.pathway.steps.map((_, i) => i + 1));
  const x = E.explainPathway(a, G, C.trackSequence('HUMSS'), E.PRIOR_MODEL).steps.find(s => s.skillId === 'CW1');
  assert.match(x.reasons[0].student, /Memory fades/);
  const std = E.analyzeLearner({ learner: { id: 'X', group: 'standard' }, attempts: atts.map(y => ({ ...y, learnerId: 'X' })), graph: G, standard: C.trackSequence('HUMSS'), model: E.PRIOR_MODEL, asOf: '2027-06-01' });
  assert.ok(std.pathway.steps.every(s => s.kind === 'learn'));
});

// Answers simulated from known BKT parameters (with forgetting toward the prior).
function simulateBkt(truth, { learners = 60, skills = ['CW1', 'CW2', 'CW3', 'CW4', 'CNF1', 'CNF2'], seed = 11 } = {}) {
  const rng = E.mulberry32(seed);
  const attempts = [];
  for (let l = 0; l < learners; l++) {
    skills.forEach(skillId => {
      let known = rng() < truth.pInit, day = 1, reviews = 0;
      const sessions = 2 + Math.floor(rng() * 3);
      for (let s = 0; s < sessions; s++) {
        if (s) {
          const gap = 1 + Math.floor(rng() * 20);
          if (known && rng() > Math.pow(1 - truth.pForget / (1 + reviews), gap)) known = rng() < truth.pInit;
          day += gap;
        }
        let correct = 0;
        const n = 4;
        for (let i = 0; i < n; i++) {
          if (rng() < (known ? 1 - truth.pSlip : truth.pGuess)) correct++;
          if (!known && rng() < truth.pLearn) known = true;
        }
        reviews++;
        const d = new Date(Date.UTC(2026, 8, 1) + day * 864e5).toISOString().slice(0, 10);
        attempts.push({ id: `L${l}${skillId}${s}`, learnerId: `L${l}`, skillId, date: d, type: 'practice', itemsCorrect: correct, itemsTotal: n, timeSec: 200, hints: 0, effort: null });
      }
    });
  }
  return attempts;
}

test('AUC matches hand-computed values', () => {
  assert.equal(E.auc([0.1, 0.4, 0.35, 0.8], [false, false, true, true]), 0.75);
  assert.equal(E.auc([0.5, 0.5, 0.5], [true, false, true]), 0.5, 'ties count half');
  assert.equal(E.auc([0.9, 0.8, 0.1], [true, true, false]), 1);
  assert.ok(Number.isNaN(E.auc([0.3, 0.4], [true, true])));
});

test('fitBKT recovers the parameters that generated the answers', () => {
  const truth = { pInit: 0.3, pLearn: 0.15, pSlip: 0.1, pGuess: 0.2, pForget: 0.03 };
  const seqs = E.bktSequences(simulateBkt(truth), G);
  const fit = E.fitBKT(seqs);
  const llTrue = seqs.reduce((s, q) => s + E.bktReplay(q, truth), 0);
  const llDefault = seqs.reduce((s, q) => s + E.bktReplay(q, E.BKT), 0);
  assert.ok(fit.logLik >= llTrue - 1, `fitted log-likelihood ${fit.logLik.toFixed(1)} ≥ true ${llTrue.toFixed(1)}`);
  assert.ok(fit.logLik > llDefault + 20, 'clearly better than the defaults');
  close(fit.params.pGuess, truth.pGuess, 0.08, 'pGuess');
  close(fit.params.pSlip, truth.pSlip, 0.08, 'pSlip');
  close(fit.params.pInit, truth.pInit, 0.15, 'pInit');
  Object.entries(E.BKT_BOUNDS).forEach(([k, [lo, hi]]) => assert.ok(fit.params[k] >= lo && fit.params[k] <= hi, k));
});

test('evaluateMastery: cross-validated AUC of fitted BKT against the percent-correct baseline', () => {
  const ev = E.evaluateMastery(simulateBkt({ pInit: 0.3, pLearn: 0.15, pSlip: 0.1, pGuess: 0.2, pForget: 0.03 }), G);
  assert.equal(ev.ready, true);
  assert.equal(ev.folds, 5);
  ['fitted', 'default', 'baseline'].forEach(k => assert.ok(ev.metrics[k].auc > 0.5 && ev.metrics[k].auc <= 1, k));
  assert.ok(ev.metrics.fitted.auc > ev.metrics.baseline.auc, `BKT ${ev.metrics.fitted.auc.toFixed(3)} beats percent correct ${ev.metrics.baseline.auc.toFixed(3)}`);
  assert.ok(ev.metrics.fitted.logLoss < ev.metrics.default.logLoss);
  assert.equal(ev.used, 'fitted');
  // Too little data: the defaults stay.
  const small = E.evaluateMastery(simulateBkt({ pInit: 0.3, pLearn: 0.15, pSlip: 0.1, pGuess: 0.2, pForget: 0.03 }, { learners: 3 }), G);
  assert.equal(small.ready, false);
  assert.deepEqual(small.params, E.BKT);
});

test('load model: cross-validated MAE beats the starting weights and a constant guess', () => {
  const rng = E.mulberry32(4);
  const truth = { bias: -2.5, w: { intrinsic: 1.0, time: 1.5, error: 3.0, hints: 0.5, deficit: 1.0 } };
  const samples = [];
  for (let i = 0; i < 300; i++) {
    const x = { intrinsic: rng(), time: 4 * rng() - 2, error: rng(), hints: rng() * 0.5, deficit: rng() };
    samples.push({ learnerId: `L${i % 20}`, x, y: E.clamp(E.predictLoad(truth, x).load + 0.05 * E.gaussian(rng), 0, 1) });
  }
  const cv = E.crossValidateLoad(samples);
  assert.equal(cv.ready, true);
  assert.equal(cv.byLearner, true, 'folds by learner');
  assert.ok(cv.mae.calibrated < cv.mae.prior && cv.mae.calibrated < cv.mae.constant, JSON.stringify(cv.mae));
  assert.equal(E.crossValidateLoad(samples.slice(0, 10)).ready, false);
});

test('one right answer reads as developing, not as a gap', () => {
  const m = E.traceMastery([{ ...att('CW1', 1, 1), type: 'diagnostic' }, { ...att('CW2', 0, 1), type: 'diagnostic' }], G).mastery;
  assert.equal(E.masteryStatus(m.CW1), 'developing');
  assert.equal(E.masteryStatus(m.CW2), 'gap');
});

// ------------------------------------------------------------ demo data
test('demo class is deterministic and complete', () => {
  const d1 = demoData(), d2 = demoData();
  assert.deepEqual(d1, d2);
  assert.equal(d1.learners.length, 16);
  assert.ok(d1.learners.every(l => Number.isFinite(l.preTest) && Number.isFinite(l.postTest)));
  assert.ok(d1.attempts.every(a => G.byId[a.skillId] && a.itemsCorrect <= a.itemsTotal));
  // Every track has students in both study groups, and attempts stay inside each student's track.
  C.TRACK_IDS.forEach(t => ['adaptive', 'standard'].forEach(gr => assert.ok(d1.learners.some(l => l.track === t && l.group === gr), `${t} ${gr}`)));
  const trackOf = Object.fromEntries(d1.learners.map(l => [l.id, l.track]));
  assert.ok(d1.attempts.every(a => C.trackSkills(trackOf[a.learnerId]).includes(a.skillId)));
});

test('pathway explanations are faithful to the model that produced the pathway', () => {
  const attempts = weakFactoringLearner();
  const a = E.analyzeLearner({ learner: { id: 'X' }, attempts, graph: G, standard: STD, model: E.PRIOR_MODEL });
  const x = E.explainPathway(a, G, STD, E.PRIOR_MODEL);
  assert.equal(x.steps.length, a.pathway.steps.length);
  const j5 = x.steps.find(s => s.skillId === 'J5');
  assert.equal(j5.kind, 'remediate');
  assert.match(j5.reasons.find(r => r.kind === 'why').teacher, /Root gap/);
  assert.match(j5.reasons.find(r => r.kind === 'when').student, /right before Operations on functions \(step 3\)/);
  x.steps.forEach((s, i) => {
    const step = a.pathway.steps[i];
    // Drivers are the model's own additive terms, largest first.
    const terms = step.forecast.contributions.map(c => c.contribution);
    assert.equal(Math.abs(s.drivers[0].contribution), Math.max(...terms.map(Math.abs)));
    ['student', 'teacher'].forEach(k => s.reasons.forEach(r => assert.ok(r[k] && r[k].length > 10)));
    // Counterfactual: mastering the weakest prerequisite never raises predicted load.
    if (s.counterfactual) assert.ok(s.counterfactual.to <= s.counterfactual.from + 1e-12);
  });
  // GM3 builds on J6; mastering it first must lower GM3's predicted load.
  const gm3 = x.steps.find(s => s.skillId === 'GM3');
  assert.ok(!gm3.counterfactual || gm3.counterfactual.to < gm3.counterfactual.from);
  assert.deepEqual(x.overview.added, a.pathway.steps.filter(s => s.kind !== 'learn').map(s => s.skillId));
  // A low-load but unlearned step never gets enrichment, and says why.
  a.pathway.steps.forEach((s, i) => {
    if (s.formatOverride) {
      assert.equal(s.format, 'optimal');
      assert.match(x.steps[i].reasons.find(r => r.kind === 'how').teacher, /instead of enrichment/);
    }
    if (s.format === 'low') assert.ok(a.mastery[s.skillId].p >= E.MASTERY.developing);
  });
  assert.ok(x.overview.skipped.includes('GM1') && x.overview.skipped.includes('GM2'));
});

test('standard-group learners get the fixed course order with no remediation', () => {
  const attempts = weakFactoringLearner();
  const a = E.analyzeLearner({ learner: { id: 'X', group: 'standard' }, attempts, graph: G, standard: STD, model: E.PRIOR_MODEL });
  assert.ok(a.pathway.standard);
  assert.ok(a.pathway.steps.every(s => s.kind === 'learn'));
  const order = a.pathway.steps.map(s => s.skillId);
  assert.deepEqual(order, STD.filter(id => order.includes(id)));
});
