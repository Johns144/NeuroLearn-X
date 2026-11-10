/*
 * NeuroLearn-X — synthetic class for trying the teacher views.
 *
 * Four students per track. Each learner gets hidden "true" knowledge with one
 * to three weak spots among their track's foundations and entry topics;
 * attempts are sampled from it. Effort ratings come from a load rule that
 * deliberately differs from the engine's prior, so calibration has something
 * to learn. Post-tests come from one simulator run under the learner's
 * assigned group: they illustrate the workflow and prove nothing. Knowledge
 * does not change between answers here, so the mastery model has little to
 * predict: its accuracy on this class says nothing about real students.
 */
'use strict';
const E = require('../public/js/engine.js');
const C = require('../public/js/curriculum.js');

const BUDGET = 60; // study sessions between pre- and post-test

function demoData(seed = 2026) {
  const rng = E.mulberry32(seed);
  const g = C.graph;
  const names = ['Andrea Santos', 'Miguel Reyes', 'Bea Villanueva', 'Carlo Mendoza', 'Dana Cruz', 'Enzo Garcia',
    'Faith Ramos', 'Gab Aquino', 'Hannah Lim', 'Ivan Dela Cruz', 'Jasmine Torres', 'Kyle Navarro',
    'Lara Bautista', 'Marco Castillo', 'Nina Flores', 'Oscar Pascual'];
  const truthModel = { bias: -3.0, w: { intrinsic: 1.6, time: 0.5, error: 2.4, hints: 1.8, deficit: 3.0 } };
  const data = { learners: [], attempts: [] };
  const start = new Date('2026-08-03T08:00:00');
  const day = n => { const d = new Date(start); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

  names.forEach((name, li) => {
    const track = C.TRACK_IDS[li % 4];
    // Two adaptive and two standard students in every track, so track and group are not confounded.
    const group = Math.floor(li / 4) % 2 === 0 ? 'adaptive' : 'standard';
    const learner = { id: `L${String(li + 1).padStart(2, '0')}`, name, strand: track, track, group, preTest: null, postTest: null };
    data.learners.push(learner);
    const seq = C.trackSequence(track);
    const subjects = C.trackSubjects(track).map(id => C.SUBJECTS[id]);
    const jhs = C.trackSkills(track).filter(id => g.byId[id].level === 'JHS');

    const ability = 0.45 + 0.4 * rng();
    const candidates = [...jhs, ...subjects.map(s => s.sequence[0])];
    const weak = new Set();
    const nWeak = 1 + Math.floor(rng() * 3);
    while (weak.size < nWeak) weak.add(candidates[Math.floor(rng() * candidates.length)]);
    const truth = {};
    g.topo.forEach(id => {
      const s = g.byId[id];
      const ancestorWeak = [...g.ancestors(id)].some(a => weak.has(a));
      // Earlier topics of a subject are known better than later ones.
      const at = s.level === 'SHS' ? C.SUBJECTS[s.subject].sequence.indexOf(id) : -1;
      let k;
      if (weak.has(id)) k = 0.1 + 0.3 * rng();
      else if (s.level === 'JHS') k = ability + 0.15 + 0.1 * E.gaussian(rng);
      else if (at === 0) k = ability - 0.1 - s.difficulty * 0.3 + 0.08 * E.gaussian(rng);
      else if (at === 1) k = ability - 0.3 - s.difficulty * 0.3 + 0.08 * E.gaussian(rng);
      else k = 0.05 + 0.15 * rng();
      if (ancestorWeak && s.level === 'SHS') k *= 0.55;
      truth[id] = E.clamp(k, 0.02, 0.98);
    });

    // The in-app diagnostic (1 item per topic, a few foundation checks),
    // then practice on the first topics of three subjects.
    const plan = [
      ...seq.map(id => ({ id, type: 'diagnostic', items: 1, at: 0 })),
      ...jhs.filter(() => rng() < 0.5).slice(0, 4).map(id => ({ id, type: 'diagnostic', items: 3, at: 1 })),
      ...subjects.slice(0, 3).flatMap((s, i) => [s.sequence[0], s.sequence[0]].map((id, j) => ({ id, type: 'practice', items: 5, at: 3 + i * 3 + j })))
    ];
    plan.forEach((p, i) => {
      const s = g.byId[p.id];
      let correct = 0, answers = '';
      for (let k = 0; k < p.items; k++) {
        const ok = rng() < E.pCorrect(truth[p.id]);
        if (ok) correct++;
        answers += ok ? '1' : '0';
      }
      const struggle = (1 - truth[p.id]) * s.difficulty;
      const timeSec = Math.round(s.secPerItem * p.items * Math.exp(0.2 * E.gaussian(rng)) * (0.8 + 1.4 * struggle));
      const hints = Math.min(p.items, Math.round(p.items * (1 - truth[p.id]) * 0.5 * rng()));
      const attempt = { id: `A${learner.id}_${i}`, learnerId: learner.id, skillId: p.id, date: day(p.at + (li % 3)), type: p.type, itemsCorrect: correct, itemsTotal: p.items, timeSec, hints, effort: null, answers };
      if (rng() < 0.7) {
        const deficit = 1 - (s.prereqs.length ? E.mean(s.prereqs.map(q => truth[q])) : 1);
        const x = { intrinsic: s.difficulty, time: E.clamp(Math.log2(timeSec / (s.secPerItem * p.items)), -2, 2), error: 1 - correct / p.items, hints: hints / p.items, deficit };
        attempt.effort = E.clamp(Math.round(1 + 8 * (E.predictLoad(truthModel, x).load + 0.07 * E.gaussian(rng))), 1, 9);
      }
      data.attempts.push(attempt);
    });

    learner.preTest = Math.round(E.clamp(E.scoreOf(truth, seq) + 3 * E.gaussian(rng), 0, 100));
    const analysis = E.analyzeLearner({ learner: { ...learner, group: 'adaptive' }, attempts: data.attempts, graph: g, standard: seq, model: E.PRIOR_MODEL });
    const run = E.simulateRun(truth, { mode: learner.group, steps: analysis.pathway.steps }, g, seq, analysis.profile, E.PRIOR_MODEL, BUDGET, rng, E.SIM);
    learner.postTest = Math.round(E.clamp(run.score + 4 * E.gaussian(rng), 0, 100));
  });
  return data;
}

module.exports = { demoData, BUDGET };
