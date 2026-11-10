/*
 * NeuroLearn-X — analytics engine.
 *
 * The five links of the chain, all pure functions over plain data:
 *
 *   1. traceMastery        learner performance  -> per-skill mastery (Bayesian Knowledge Tracing)
 *   2. predictLoad         attempt / skill      -> cognitive load 0..1 (logistic model,
 *                                                  calibrated on Paas mental-effort ratings)
 *   3. diagnoseGaps        mastery + graph      -> root prerequisite gaps and what they block
 *   4. recommendPathway    gaps + load          -> ordered, load-aware personalized pathway
 *   5. simulateComparison  pathway vs standard  -> projected outcomes under one time budget
 *      compareCohorts      recorded pre/post    -> Welch t-test, effect size, normalized gain
 *
 * Runs unchanged in the browser (window.NLX.engine) and in Node (require).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NLX = Object.assign(root.NLX || {}, { engine: api });
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------------------------------------------------------------- helpers

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const sigmoid = z => 1 / (1 + Math.exp(-z));
  const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
  function sd(xs) {
    if (xs.length < 2) return NaN;
    const m = mean(xs);
    return Math.sqrt(xs.reduce((a, x) => a + (x - m) * (x - m), 0) / (xs.length - 1));
  }
  function quantile(xs, q) {
    if (!xs.length) return NaN;
    const s = [...xs].sort((a, b) => a - b);
    const pos = (s.length - 1) * q;
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    return s[lo] + (s[hi] - s[lo]) * (pos - lo);
  }

  // Small seeded PRNG so simulations and demo data are reproducible.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gaussian(rng) {
    let u = 0;
    while (u === 0) u = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
  }

  // ------------------------------------------------- 1. mastery (BKT)

  /*
   * Default parameters, used until fitBKT has enough real answers to replace
   * them. pGuess 0.25 fits four-option multiple choice; pLearn is per item,
   * kept small because little is learned while being assessed. pForget is
   * the share of the learned-above-prior mastery lost per day without
   * practice; each separate day the topic was practised divides that rate
   * (forgetting slows with spaced repetition).
   */
  const BKT = { pInit: 0.25, pLearn: 0.03, pSlip: 0.15, pGuess: 0.25, pForget: 0.02 };
  // near: the level a topic must reach to count as completed on the path.
  const MASTERY = { mastered: 0.85, developing: 0.6, near: 0.8 };
  // Answers faster than this are treated as rapid guesses: flagged, and left out of mastery.
  const RAPID_SEC = 3;

  const DAY = 86400000;
  const dayGap = (from, to) => (from && to ? Math.max(0, (Date.parse(to) - Date.parse(from)) / DAY) : 0);
  // Forgetting toward the prior; `reviews` separate practice days slow it down.
  function decay(p, days, reviews, prm = BKT) {
    if (!(days > 0) || !prm.pForget || p <= prm.pInit) return p;
    return prm.pInit + (p - prm.pInit) * Math.pow(1 - prm.pForget / (1 + reviews), days);
  }

  function bktStep(p, correct, prm = BKT) {
    const post = correct
      ? p * (1 - prm.pSlip) / (p * (1 - prm.pSlip) + (1 - p) * prm.pGuess)
      : p * prm.pSlip / (p * prm.pSlip + (1 - p) * (1 - prm.pGuess));
    return post + (1 - post) * prm.pLearn;
  }

  // Probability the learner answers an item correctly given mastery p.
  const pCorrect = (p, prm = BKT) => p * (1 - prm.pSlip) + (1 - p) * prm.pGuess;

  // For attempts with totals only (no answer order, see evidenceSequence).
  // BKT weights the latest items most, so spread correct answers evenly and
  // centred: neither the first nor the last item is systematically right or wrong.
  function itemSequence(correct, total) {
    const seq = [];
    const at = i => Math.floor(i * correct / total + 0.5);
    for (let i = 0; i < total; i++) seq.push(at(i + 0.5) > at(i - 0.5));
    return seq;
  }

  function sortAttempts(attempts) {
    return attempts
      .map((a, i) => ({ a, i }))
      .sort((x, y) => (x.a.date < y.a.date ? -1 : x.a.date > y.a.date ? 1 : x.i - y.i))
      .map(x => x.a);
  }

  /*
   * Mastery the rest of the chain should use. Assessed skills use their BKT
   * estimate. An unassessed prerequisite of a skill the learner already
   * handles well is credited ("inferred"); anything else stays at the prior
   * and is reported as unverified rather than as a gap.
   */
  function effectiveMastery(raw, graph, prm = BKT) {
    const out = {};
    graph.skills.forEach(s => {
      const r = raw[s.id];
      if (r && r.items > 0) {
        out[s.id] = { p: r.p, items: r.items, attempts: r.attempts, source: 'assessed', peak: r.peak, last: r.last, reviews: r.days.size, rapid: r.rapid };
        return;
      }
      let best = 0;
      graph.descendants(s.id).forEach(d => {
        const rd = raw[d];
        if (rd && rd.items > 0) best = Math.max(best, rd.p);
      });
      const inferred = best * 0.9;
      const base = { items: 0, attempts: 0, peak: 0, last: null, reviews: 0, rapid: r ? r.rapid : 0 };
      out[s.id] = inferred >= MASTERY.developing
        ? { ...base, p: inferred, source: 'inferred' }
        : { ...base, p: prm.pInit, source: 'prior' };
    });
    return out;
  }

  // Answers that count as evidence: rapid guesses are left out.
  const evidenceOf = a => ({
    correct: Math.max(0, a.itemsCorrect - (a.rapidCorrect || 0)),
    total: Math.max(0, a.itemsTotal - (a.rapid || 0))
  });

  /*
   * An attempt's answers in the order given, one character each: 1 right,
   * 0 wrong; H / h right / wrong after a hint; R / r a rapid guess, right /
   * wrong. Attempts recorded before this, and those a teacher enters by
   * hand, have totals only.
   */
  const ANSWER_CODES = { 1: [true, false, false], 0: [false, false, false], H: [true, true, false], h: [false, true, false], R: [true, false, true], r: [false, false, true] };
  const answerCode = (correct, hinted, rapid) => (rapid ? (correct ? 'R' : 'r') : hinted ? (correct ? 'H' : 'h') : correct ? '1' : '0');
  function parseAnswers(s) {
    if (typeof s !== 'string' || !s) return null;
    const out = [];
    for (const ch of s) {
      if (!ANSWER_CODES[ch]) return null;
      const [ok, hint, rapid] = ANSWER_CODES[ch];
      out.push({ ok, hint, rapid });
    }
    return out;
  }
  // The answers BKT learns from, in order (rapid guesses left out). ordered is
  // false when the order had to be rebuilt from the attempt's totals.
  function evidenceSequence(a) {
    const parsed = parseAnswers(a.answers);
    if (parsed && parsed.length === a.itemsTotal && parsed.filter(x => x.ok).length === a.itemsCorrect) {
      return { obs: parsed.filter(x => !x.rapid).map(x => x.ok), ordered: true };
    }
    const ev = evidenceOf(a);
    return { obs: itemSequence(ev.correct, ev.total), ordered: false };
  }

  // Every skill's mastery as of a date (forgetting since `at`, the date its p refers to).
  function decayedTo(raw, date, prm) {
    const out = {};
    Object.keys(raw).forEach(k => {
      const r = raw[k];
      out[k] = r.at && date > r.at ? { ...r, p: decay(r.p, dayGap(r.at, date), r.days.size, prm), at: date } : r;
    });
    return out;
  }

  /*
   * Replays a learner's attempts in date order: forgetting between practice
   * days, then a BKT update per answer (rapid guesses excluded). Returns
   * mastery (as of opts.asOf, or of the last attempt when omitted) plus, for
   * each attempt, the mastery state that existed *before* it — the load model
   * must only see what was known at the time.
   */
  function traceMastery(attempts, graph, prm = BKT, opts = {}) {
    let raw = {};
    const before = {};
    sortAttempts(attempts).forEach(att => {
      if (!graph.byId[att.skillId]) return;
      raw = decayedTo(raw, att.date, prm);
      before[att.id] = effectiveMastery(raw, graph, prm);
      const r = raw[att.skillId] = { ...(raw[att.skillId] || { p: prm.pInit, items: 0, attempts: 0, peak: 0, last: null, at: null, days: new Set(), rapid: 0 }) };
      const { obs } = evidenceSequence(att);
      obs.forEach(ok => { r.p = bktStep(r.p, ok, prm); });
      r.items += obs.length;
      r.rapid += att.rapid || 0;
      r.attempts += 1;
      if (obs.length) {
        r.peak = Math.max(r.peak, r.p);
        r.days = new Set([...r.days, att.date]);
        r.last = r.at = att.date;
      }
    });
    if (opts.asOf) raw = decayedTo(raw, opts.asOf, prm);
    return { mastery: effectiveMastery(raw, graph, prm), before };
  }

  function masteryStatus(m) {
    if (m.source === 'prior') return 'unverified';
    // One right answer (the diagnostic asks one per topic) lifts BKT only to
    // about 0.55: too little evidence to call the topic a gap.
    if (m.source === 'assessed' && m.items < 2 && m.p >= 0.5) return 'developing';
    if (m.p >= MASTERY.mastered) return 'mastered';
    if (m.p >= MASTERY.developing) return 'developing';
    return 'gap';
  }

  // ------------------------------------- 1b. fitting and validating BKT

  // Per learner and topic, the answers in order (rapid guesses left out), with
  // their dates and whether that order is the real one.
  function bktSequences(attempts, graph) {
    const by = {};
    sortAttempts(attempts).forEach(a => {
      if (!graph.byId[a.skillId]) return;
      const key = `${a.learnerId}|${a.skillId}`;
      const seq = by[key] || (by[key] = { learnerId: a.learnerId, skillId: a.skillId, obs: [] });
      const { obs, ordered } = evidenceSequence(a);
      obs.forEach(ok => seq.obs.push({ ok, date: a.date, ordered }));
    });
    return Object.values(by).filter(s => s.obs.length);
  }

  // Walks one sequence exactly as traceMastery does; see(prediction, actual) is
  // called before each answer updates the estimate. Returns the log-likelihood.
  function bktReplay(seq, prm, see) {
    let p = prm.pInit, at = null, ll = 0;
    const days = new Set();
    seq.obs.forEach(o => {
      if (at && o.date > at) p = decay(p, dayGap(at, o.date), days.size, prm);
      const pc = clamp(pCorrect(p, prm), 1e-6, 1 - 1e-6);
      if (see) see(pc, o.ok);
      ll += Math.log(o.ok ? pc : 1 - pc);
      p = bktStep(p, o.ok, prm);
      days.add(o.date);
      at = o.date;
    });
    return ll;
  }

  const BKT_BOUNDS = { pInit: [0.02, 0.9], pLearn: [0.005, 0.4], pSlip: [0.02, 0.3], pGuess: [0.05, 0.4], pForget: [0, 0.1] };

  /*
   * Maximum-likelihood BKT parameters by coordinate search: each parameter in
   * turn is scanned over a window that narrows every round. Guessing is kept
   * clearly below knowing (pGuess < 1 − pSlip − 0.05) so the states stay
   * interpretable.
   */
  function fitBKT(seqs, { rounds = 6, steps = 13, start = BKT } = {}) {
    const nll = prm => -seqs.reduce((s, q) => s + bktReplay(q, prm), 0);
    let best = { ...start };
    let bestLoss = nll(best);
    const width = {};
    Object.keys(BKT_BOUNDS).forEach(k => { width[k] = BKT_BOUNDS[k][1] - BKT_BOUNDS[k][0]; });
    for (let r = 0; r < rounds; r++) {
      Object.keys(BKT_BOUNDS).forEach(k => {
        const [lo, hi] = BKT_BOUNDS[k];
        const a = Math.max(lo, best[k] - width[k] / 2), b = Math.min(hi, best[k] + width[k] / 2);
        for (let i = 0; i < steps; i++) {
          const cand = { ...best, [k]: a + (b - a) * i / (steps - 1) };
          if (cand.pGuess >= 1 - cand.pSlip - 0.05) continue;
          const loss = nll(cand);
          if (loss < bestLoss - 1e-9) { best = cand; bestLoss = loss; }
        }
        width[k] /= 2.5;
      });
    }
    return { params: best, logLik: -bestLoss, n: seqs.reduce((s, q) => s + q.obs.length, 0) };
  }

  // Area under the ROC curve (Mann–Whitney, ties counted half).
  function auc(scores, labels) {
    const idx = scores.map((s, i) => i).sort((a, b) => scores[a] - scores[b]);
    const pos = labels.filter(Boolean).length, neg = labels.length - pos;
    if (!pos || !neg) return NaN;
    let rankSum = 0;
    for (let i = 0; i < idx.length;) {
      let j = i;
      while (j + 1 < idx.length && scores[idx[j + 1]] === scores[idx[i]]) j++;
      const rank = (i + j) / 2 + 1;
      for (let t = i; t <= j; t++) if (labels[idx[t]]) rankSum += rank;
      i = j + 1;
    }
    return (rankSum - pos * (pos + 1) / 2) / (pos * neg);
  }
  const logLoss = (scores, labels) => -mean(scores.map((p, i) => Math.log(labels[i] ? p : 1 - p)));

  /*
   * Fits BKT on the school's answers and checks it on learners it never saw
   * (k-fold cross-validation by learner). Every answer is predicted from the
   * answers before it by BKT with fitted parameters, BKT with the defaults,
   * and the baseline: the learner's percent correct on that topic so far
   * (Laplace-smoothed, so 50% before any answer). Reports AUC and log loss
   * for each. The fitted parameters are used only when they predict
   * held-out learners better than the defaults.
   */
  function evaluateMastery(attempts, graph, { folds = 5, minAnswers = 200, minLearners = 8 } = {}) {
    const seqs = bktSequences(attempts, graph);
    const learners = [...new Set(seqs.map(s => s.learnerId))].sort();
    const nAnswers = seqs.reduce((s, q) => s + q.obs.length, 0);
    const nOrdered = seqs.reduce((s, q) => s + q.obs.filter(o => o.ordered).length, 0);
    const base = { nAnswers, nOrdered, nLearners: learners.length, defaults: { ...BKT }, minAnswers, minLearners };
    if (nAnswers < minAnswers || learners.length < minLearners) return { ...base, ready: false, params: { ...BKT }, used: 'default' };
    const k = Math.min(folds, learners.length);
    const foldOf = {};
    learners.forEach((id, i) => { foldOf[id] = i % k; });
    const pred = { fitted: [], default: [], baseline: [] }, labels = [];
    for (let f = 0; f < k; f++) {
      const prm = fitBKT(seqs.filter(s => foldOf[s.learnerId] !== f)).params;
      seqs.filter(s => foldOf[s.learnerId] === f).forEach(s => {
        bktReplay(s, prm, (p, ok) => { pred.fitted.push(p); labels.push(ok); });
        bktReplay(s, BKT, p => pred.default.push(p));
        let c = 0;
        s.obs.forEach((o, n) => { pred.baseline.push((c + 1) / (n + 2)); c += o.ok ? 1 : 0; });
      });
    }
    const metrics = {};
    Object.keys(pred).forEach(key => { metrics[key] = { auc: auc(pred[key], labels), logLoss: logLoss(pred[key], labels) }; });
    const full = fitBKT(seqs);
    const better = metrics.fitted.logLoss < metrics.default.logLoss && !(metrics.fitted.auc < metrics.default.auc - 0.01);
    return { ...base, ready: true, folds: k, fitted: full.params, params: better ? full.params : { ...BKT }, used: better ? 'fitted' : 'default', metrics };
  }

  /*
   * Method check, on students whose true parameters are known: each student
   * starts knowing a topic with pInit, may learn it after any answer with
   * pLearn, and answers with slip and guess. No forgetting. Every practice
   * set keeps its answers in order. The same answers are then fitted twice:
   * in order, and rebuilt from each set's totals (how attempts used to be
   * stored). The fitter should recover the parameters from ordered answers.
   */
  const SIM_BKT = { pInit: 0.3, pLearn: 0.12, pSlip: 0.1, pGuess: 0.2, pForget: 0 };
  function simulateBKTAnswers(graph, truth = SIM_BKT, { learners = 40, skills = 8, sets = 3, items = 5, seed = 11 } = {}) {
    const rng = mulberry32(seed);
    const ids = graph.topo.slice(0, skills);
    const attempts = [];
    for (let l = 0; l < learners; l++) {
      ids.forEach(skillId => {
        let known = rng() < truth.pInit;
        for (let s = 0; s < sets; s++) {
          let answers = '';
          for (let i = 0; i < items; i++) {
            answers += (known ? rng() >= truth.pSlip : rng() < truth.pGuess) ? '1' : '0';
            if (!known && rng() < truth.pLearn) known = true;
          }
          const right = answers.split('1').length - 1;
          attempts.push({ id: `M${l}_${skillId}_${s}`, learnerId: `M${l}`, skillId, date: `2026-09-${String(1 + s * 7).padStart(2, '0')}`, type: 'practice',
            itemsCorrect: right, itemsTotal: items, timeSec: 60 * items, hints: 0, effort: null, answers });
        }
      });
    }
    return attempts;
  }
  function methodCheck(graph, opts) {
    const attempts = simulateBKTAnswers(graph, SIM_BKT, opts);
    const ordered = evaluateMastery(attempts, graph);
    const totals = evaluateMastery(attempts.map(({ answers, ...a }) => a), graph);
    const pick = r => ({ params: r.fitted, metrics: r.metrics });
    return { truth: { ...SIM_BKT }, learners: ordered.nLearners, answers: ordered.nAnswers, ordered: pick(ordered), totals: pick(totals) };
  }

  // ------------------------------------------- 2. cognitive load model

  const FEATURES = [
    { key: 'intrinsic', label: 'Intrinsic difficulty of the skill' },
    { key: 'time', label: 'Time on task vs expected' },
    { key: 'error', label: 'Error rate' },
    { key: 'hints', label: 'Hint reliance' },
    { key: 'deficit', label: 'Prerequisite deficit' }
  ];

  // Hand-set starting weights; calibrateLoadModel shifts them toward the
  // learners' own mental-effort ratings once enough ratings exist.
  const PRIOR_MODEL = {
    bias: -3.2,
    w: { intrinsic: 2.0, time: 0.9, error: 2.6, hints: 1.4, deficit: 2.2 },
    calibrated: false, n: 0
  };

  const LOAD_BANDS = [
    { key: 'low', label: 'Low', max: 0.30, note: 'Underload: the task may be too easy' },
    { key: 'optimal', label: 'Optimal', max: 0.60, note: 'Productive challenge' },
    { key: 'high', label: 'High', max: 0.80, note: 'Strained: add scaffolding' },
    { key: 'overload', label: 'Overload', max: Infinity, note: 'Working memory exceeded: learning stalls' }
  ];
  const loadBand = v => LOAD_BANDS.find(b => v < b.max);

  function prereqMean(skillId, mastery, graph) {
    const pre = graph.byId[skillId].prereqs;
    return pre.length ? mean(pre.map(p => mastery[p].p)) : 1;
  }

  function attemptFeatures(att, skill, masteryBefore, graph) {
    const total = Math.max(1, att.itemsTotal);
    const ratio = Math.max(1e-3, att.timeSec / (skill.secPerItem * total));
    return {
      intrinsic: skill.difficulty,
      time: clamp(Math.log2(ratio), -2, 2),
      error: 1 - att.itemsCorrect / total,
      hints: clamp((att.hints || 0) / total, 0, 1),
      deficit: 1 - prereqMean(skill.id, masteryBefore, graph)
    };
  }

  function predictLoad(model, x) {
    let z = model.bias;
    const contributions = FEATURES.map(f => {
      const c = model.w[f.key] * x[f.key];
      z += c;
      return { key: f.key, label: f.label, value: x[f.key], contribution: c };
    });
    const load = sigmoid(z);
    return { load, band: loadBand(load), contributions };
  }

  // Paas (1992) 9-point mental-effort rating -> 0..1 load target.
  const effortToLoad = e => (e - 1) / 8;

  /*
   * Maximum-a-posteriori logistic regression with soft labels: cross-entropy
   * against the rated load plus an L2 pull toward the prior weights, so a
   * handful of ratings nudges the model and many ratings can reshape it.
   */
  function calibrateLoadModel(samples, opts = {}) {
    const minSamples = opts.minSamples ?? 12;
    const prior = opts.prior || PRIOR_MODEL;
    if (samples.length < minSamples) return { ...prior, w: { ...prior.w }, calibrated: false, n: samples.length };
    const lambda = opts.lambda ?? 0.02;
    const lr = opts.lr ?? 0.5;
    const iters = opts.iters ?? 1500;
    const w = { ...prior.w };
    let b = prior.bias;
    const n = samples.length;
    for (let it = 0; it < iters; it++) {
      const g = { bias: 0 };
      FEATURES.forEach(f => { g[f.key] = 0; });
      samples.forEach(s => {
        let z = b;
        FEATURES.forEach(f => { z += w[f.key] * s.x[f.key]; });
        const err = sigmoid(z) - s.y;
        g.bias += err / n;
        FEATURES.forEach(f => { g[f.key] += err * s.x[f.key] / n; });
      });
      b -= lr * (g.bias + 2 * lambda * (b - prior.bias));
      FEATURES.forEach(f => { w[f.key] -= lr * (g[f.key] + 2 * lambda * (w[f.key] - prior.w[f.key])); });
    }
    const model = { bias: b, w, calibrated: true, n };
    const mae = m => mean(samples.map(s => Math.abs(predictLoad(m, s.x).load - s.y)));
    model.mae = mae(model);
    model.priorMae = mae(prior);
    return model;
  }

  /*
   * k-fold cross-validation of the load model: fitted on the other folds,
   * scored by mean absolute error on ratings it never saw. Folds are by
   * learner when there are enough learners, so a learner's own habits cannot
   * leak into their test fold. Compared with the starting weights and with
   * the simplest baseline, the mean rating of the training folds.
   */
  function crossValidateLoad(samples, { folds = 5, minSamples = 24 } = {}) {
    const n = samples.length;
    if (n < minSamples) return { ready: false, n, minSamples };
    const groups = [...new Set(samples.map(s => s.learnerId))].sort();
    const byLearner = groups.length >= folds;
    const k = Math.min(folds, byLearner ? groups.length : n);
    const foldOf = (s, i) => (byLearner ? groups.indexOf(s.learnerId) : i) % k;
    const err = { calibrated: [], prior: [], constant: [] };
    for (let f = 0; f < k; f++) {
      const train = samples.filter((s, i) => foldOf(s, i) !== f), test = samples.filter((s, i) => foldOf(s, i) === f);
      if (!train.length || !test.length) continue;
      const model = calibrateLoadModel(train, { minSamples: 1 });
      const c = mean(train.map(s => s.y));
      test.forEach(s => {
        err.calibrated.push(Math.abs(predictLoad(model, s.x).load - s.y));
        err.prior.push(Math.abs(predictLoad(PRIOR_MODEL, s.x).load - s.y));
        err.constant.push(Math.abs(c - s.y));
      });
    }
    return { ready: true, n, folds: k, byLearner, mae: { calibrated: mean(err.calibrated), prior: mean(err.prior), constant: mean(err.constant) } };
  }

  // Load-related habits of one learner, used to forecast load on skills they
  // have not attempted yet.
  function learnerProfile(attempts, graph) {
    const valid = attempts.filter(a => graph.byId[a.skillId] && a.itemsTotal > 0);
    if (!valid.length) return { time: 0, hints: 0.1 };
    return {
      time: mean(valid.map(a => clamp(Math.log2(Math.max(1e-3, a.timeSec / (graph.byId[a.skillId].secPerItem * a.itemsTotal))), -2, 2))),
      hints: mean(valid.map(a => clamp((a.hints || 0) / a.itemsTotal, 0, 1)))
    };
  }

  function forecastFeatures(skillId, mastery, graph, profile) {
    const skill = graph.byId[skillId];
    return {
      intrinsic: skill.difficulty,
      time: profile.time,
      error: 1 - pCorrect(mastery[skillId].p),
      hints: profile.hints,
      deficit: 1 - prereqMean(skillId, mastery, graph)
    };
  }

  function forecastLoad(skillId, mastery, graph, profile, model) {
    return predictLoad(model, forecastFeatures(skillId, mastery, graph, profile));
  }

  // Every rated attempt across all learners becomes one training sample.
  function collectLoadSamples(learners, attempts, graph, prm = BKT) {
    const samples = [];
    learners.forEach(l => {
      const own = attempts.filter(a => a.learnerId === l.id);
      const { before } = traceMastery(own, graph, prm);
      own.forEach(a => {
        if (a.effort == null || !before[a.id]) return;
        samples.push({ learnerId: l.id, x: attemptFeatures(a, graph.byId[a.skillId], before[a.id], graph), y: effortToLoad(a.effort) });
      });
    });
    return samples;
  }

  // --------------------------------------- 3. prerequisite gap diagnosis

  /*
   * targets: skill ids the learner is working toward (default: every
   * standard-sequence skill not yet mastered). A gap is a prerequisite that
   * is assessed below the developing threshold, or never assessed. A root gap
   * has no gap beneath it — fixing roots first unblocks everything above.
   */
  function diagnoseGaps(mastery, graph, standard, targets) {
    const goal = (targets && targets.length ? targets : standard)
      .filter(id => masteryStatus(mastery[id]) !== 'mastered');
    const problemStatus = new Set(['gap', 'unverified']);
    const gapMap = {};
    const targetRows = goal.map(t => {
      const blockedBy = [];
      graph.ancestors(t).forEach(a => {
        if (goal.includes(a)) return; // a target is taught in its own right, not remediated
        const st = masteryStatus(mastery[a]);
        if (!problemStatus.has(st)) return;
        blockedBy.push(a);
        (gapMap[a] || (gapMap[a] = { id: a, status: st, p: mastery[a].p, items: mastery[a].items, blocks: [] })).blocks.push(t);
      });
      return { id: t, status: masteryStatus(mastery[t]), p: mastery[t].p, blockedBy };
    });
    const gaps = Object.values(gapMap);
    gaps.forEach(g => {
      g.isRoot = ![...graph.ancestors(g.id)].some(a => gapMap[a]);
      g.impact = g.blocks.length;
    });
    gaps.sort((a, b) => (b.isRoot - a.isRoot) || (b.impact - a.impact) || (a.p - b.p) || (graph.topoIndex[a.id] - graph.topoIndex[b.id]));
    return { targets: targetRows, gaps };
  }

  // --------------------------------------- 4. personalized pathway

  const ACTIVITIES = {
    verify: 'Quick diagnostic check (5 items). Skip remediation if 4 or more are correct.',
    low: 'Enrichment and transfer problems; fade scaffolds (expertise-reversal effect).',
    optimal: 'Retrieval practice with immediate corrective feedback.',
    high: 'Faded worked examples, then guided practice.',
    overload: 'Chunked worked examples over two short sessions, with a prerequisite micro-review first.'
  };
  const STUDENT_ACTIVITIES = {
    verify: 'Answer a quick practice set. Get most right and you can move on.',
    low: 'Try challenge problems. You are ready for them.',
    optimal: 'Practise, then check each answer right away.',
    high: 'Read the worked examples and use hints, then try on your own.',
    overload: 'Two short sessions: review the basics, then follow worked examples step by step.'
  };
  const round5 = m => Math.max(5, Math.round(m / 5) * 5);

  /*
   * Orders gaps and targets so that every prerequisite comes first, each
   * remediation lands just before the earliest target that needs it, and
   * targets otherwise keep the familiar curriculum order. Load is forecast on
   * the state the learner will be in when they reach that step.
   */
  function recommendPathway(mastery, graph, standard, diagnosis, profile, model) {
    const gapById = {};
    diagnosis.gaps.forEach(g => { gapById[g.id] = g; });
    const targetIds = diagnosis.targets.map(t => t.id);
    const include = new Set([...diagnosis.gaps.map(g => g.id), ...targetIds]);
    const pos = id => {
      const i = standard.indexOf(id);
      return i >= 0 ? i : standard.length + graph.topoIndex[id];
    };
    const key = id => gapById[id]
      ? Math.min(...gapById[id].blocks.map(pos)) - 0.5 + (gapById[id].isRoot ? 0 : 0.01) - gapById[id].impact * 1e-4
      : pos(id);

    const pending = new Set(include);
    const done = new Set();
    const state = {};
    Object.keys(mastery).forEach(k => { state[k] = { ...mastery[k] }; });
    const steps = [];
    while (pending.size) {
      const ready = [...pending].filter(id => [...graph.ancestors(id)].every(a => !pending.has(a)));
      ready.sort((a, b) => key(a) - key(b) || graph.topoIndex[a] - graph.topoIndex[b]);
      const id = ready[0];
      pending.delete(id);
      const skill = graph.byId[id];
      const gap = gapById[id];
      const kind = gap ? (gap.status === 'unverified' ? 'verify' : 'remediate') : 'learn';
      const forecast = forecastLoad(id, state, graph, profile, model);
      const prereqs = skill.prereqs.map(p => ({ id: p, p: state[p].p }));
      // Enrichment suits learners who already know the skill; a light topic
      // that is not yet learned still gets practice with feedback.
      const lowButUnlearned = kind !== 'verify' && forecast.band.key === 'low' && state[id].p < MASTERY.developing;
      const format = kind === 'verify' ? 'verify' : lowButUnlearned ? 'optimal' : forecast.band.key;
      const activity = ACTIVITIES[format];
      let reason;
      if (kind === 'learn') {
        const fixed = [...graph.ancestors(id)].filter(a => done.has(a) && gapById[a]);
        reason = fixed.length ? `Target skill, now unblocked by ${fixed.join(', ')}` : 'Target skill';
      } else {
        reason = `${gap.isRoot ? 'Root gap' : 'Gap'} blocking ${gap.blocks.join(', ')}`;
      }
      const minutes = kind === 'verify'
        ? 10
        : round5(skill.minutes * (0.7 + forecast.load) * (forecast.band.key === 'overload' ? 1.2 : 1));
      steps.push({ order: steps.length + 1, skillId: id, kind, reason, forecast, prereqs, format, formatOverride: lowButUnlearned, activity, minutes, sessions: forecast.band.key === 'overload' ? 2 : 1 });
      // Assume the step is completed to mastery before forecasting the next one.
      state[id] = { ...state[id], p: Math.max(state[id].p, MASTERY.mastered), source: 'assessed' };
      done.add(id);
    }
    return { steps, totalMinutes: steps.reduce((a, s) => a + s.minutes, 0) };
  }

  /*
   * Control condition for the study: the course in its fixed order, with no
   * remediation and no load-based change of format.
   */
  function standardPathway(mastery, graph, standard, profile, model) {
    const steps = standard.filter(id => masteryStatus(mastery[id]) !== 'mastered').map((id, i) => ({
      order: i + 1, skillId: id, kind: 'learn', reason: 'Next topic in the course sequence',
      forecast: forecastLoad(id, mastery, graph, profile, model),
      prereqs: graph.byId[id].prereqs.map(p => ({ id: p, p: mastery[p].p })),
      activity: 'Lesson, then a practice set.', minutes: graph.byId[id].minutes, sessions: 1
    }));
    return { steps, totalMinutes: steps.reduce((a, s) => a + s.minutes, 0), standard: true };
  }

  // --------------------------------------- 4b. explanations (XAI)

  /*
   * Why each step is on the path, why it sits where it does, and why it gets
   * its format. Every statement is derived from the same quantities the
   * recommender used, so the explanation is faithful by construction:
   *   evidence        BKT mastery and how many answers it rests on
   *   placement       the prerequisite edges that fix the order
   *   load drivers    exact additive attributions of the logistic load model
   *                   (each feature's share of the log-odds above baseline)
   *   counterfactual  the predicted load if the weakest prerequisite were mastered
   * Each statement has a student and a teacher wording.
   */
  const pctTxt = v => `${Math.round(v * 100)}%`;
  const DRIVER_TEXT = {
    intrinsic: v => ({
      student: v >= 0.6 ? 'This is one of the more demanding topics.' : v >= 0.4 ? 'This topic is moderately demanding.' : 'This topic is fairly light.',
      teacher: `Intrinsic difficulty ${v.toFixed(2)}`
    }),
    time: v => {
      const r = Math.pow(2, v);
      return {
        student: r > 1.15 ? 'You usually take longer than expected on questions, which is fine but adds effort.' : r < 0.87 ? 'You usually work quickly.' : 'You usually work at the expected pace.',
        teacher: `Typical pace ${r.toFixed(1)}× the expected time`
      };
    },
    error: v => ({
      student: `You have not mastered it yet, so expect to get about ${pctTxt(1 - v)} right at first.`,
      teacher: `Expected error rate ${pctTxt(v)} at current mastery`
    }),
    hints: v => ({
      student: v >= 0.25 ? 'You often use hints, a sign that new topics feel heavy.' : 'You rarely need hints.',
      teacher: `Hints on ${pctTxt(v)} of items`
    }),
    deficit: v => ({
      student: v >= 0.3 ? 'Some skills it builds on are not solid yet.' : v > 0.1 ? 'The skills it builds on are mostly solid.' : 'The skills it builds on are solid.',
      teacher: `Prerequisite shortfall ${pctTxt(v)}`
    })
  };

  function loadDrivers(forecast) {
    const pos = forecast.contributions.filter(c => c.contribution > 0);
    const total = pos.reduce((a, c) => a + c.contribution, 0) || 1;
    return [...forecast.contributions]
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 3)
      .map(c => ({ key: c.key, label: c.label, contribution: c.contribution, share: Math.max(0, c.contribution) / total, ...DRIVER_TEXT[c.key](c.value) }));
  }

  function counterfactual(step, model, graph) {
    const weak = step.prereqs.filter(q => q.p < MASTERY.mastered).sort((a, b) => a.p - b.p)[0];
    if (!weak) return null;
    const x = {};
    step.forecast.contributions.forEach(c => { x[c.key] = c.value; });
    const ps = step.prereqs.map(q => (q.id === weak.id ? MASTERY.mastered : q.p));
    const after = predictLoad(model, { ...x, deficit: 1 - mean(ps) });
    return { skillId: weak.id, name: graph.byId[weak.id].name, from: step.forecast.load, to: after.load, band: after.band };
  }

  const pForgetOf = analysis => (analysis.bkt || BKT).pForget;
  function explainPathway(analysis, graph, standard, model) {
    const { pathway, diagnosis, mastery } = analysis;
    const steps = pathway.steps;
    const orderOf = {};
    steps.forEach(s => { orderOf[s.skillId] = s.order; });
    const gapById = {};
    diagnosis.gaps.forEach(g => { gapById[g.id] = g; });
    const name = id => graph.byId[id].name;
    const list = ids => (ids.length <= 2 ? ids.join(' and ') : `${ids.slice(0, -1).join(', ')} and ${ids[ids.length - 1]}`);

    const explained = steps.map(s => {
      const m = mastery[s.skillId];
      const reasons = [];
      // 1. Why it is on the path
      if (pathway.standard) {
        reasons.push({ kind: 'why', student: 'It is the next topic in the course.', teacher: 'Standard-sequence group: fixed course order, no remediation or adaptation.' });
      } else if (s.kind === 'review') {
        const r = s.review;
        reasons.push({
          kind: 'why',
          student: `You reached ${pctTxt(r.peak)} on this${r.sinceDays != null ? ` ${r.sinceDays} days ago` : ''}. Memory fades without practice: your recall is now predicted at ${pctTxt(r.recall)}. A short review now makes it last longer.`,
          teacher: `Spaced review: peak P(mastery) ${r.peak.toFixed(2)}, now ${r.recall.toFixed(2)} after forgetting (rate ${(pForgetOf(analysis) / (1 + r.reviews)).toFixed(3)}/day after ${r.reviews} practice day${r.reviews === 1 ? '' : 's'}); due below ${MASTERY.near}.`
        });
      } else if (s.kind === 'learn') {
        reasons.push({
          kind: 'why',
          student: m.source === 'assessed' ? `You are at ${pctTxt(m.p)} on this topic; 85% counts as mastered.` : 'You have not studied this topic yet.',
          teacher: `Target skill, P(mastery) = ${m.p.toFixed(2)}${m.items ? ` from ${m.items} items` : ' (no evidence yet)'}; mastered at 0.85.`
        });
      } else {
        const g = gapById[s.skillId];
        const blocks = g ? g.blocks.map(b => graph.byId[b].short) : [];
        reasons.push(s.kind === 'verify'
          ? {
            kind: 'why',
            student: `You have not been checked on this yet, and ${list(blocks)} ${blocks.length === 1 ? 'depends' : 'depend'} on it.`,
            teacher: `Unverified prerequisite (never assessed, not implied by later work) of ${g.blocks.join(', ')}.`
          }
          : {
            kind: 'why',
            student: `Your answers show this needs work: about ${pctTxt(m.p)} mastery from ${m.items} questions. It is needed for ${list(blocks)}.`,
            teacher: `${g && g.isRoot ? 'Root gap' : 'Gap'}: P(mastery) = ${m.p.toFixed(2)} from ${m.items} items (below 0.60). Blocks ${g ? g.blocks.join(', ') : '—'}.`
          });
      }
      // 2. Why it comes now
      if (!pathway.standard) {
        if (s.kind === 'review') {
          reasons.push({
            kind: 'when',
            student: 'It comes first because a review works best before you forget more. It does not need to wait for anything else on your path.',
            teacher: `Due reviews lead the path (lowest predicted recall first): retrieval before further decay; the topic was already completed, so no prerequisite waits on it.`
          });
        } else if (s.kind !== 'learn' && gapById[s.skillId]) {
          const firstUse = gapById[s.skillId].blocks.filter(b => orderOf[b]).sort((a, b) => orderOf[a] - orderOf[b])[0];
          if (firstUse) reasons.push({
            kind: 'when',
            student: `It comes right before ${name(firstUse)} (step ${orderOf[firstUse]}), the first step that uses it, so it is fresh when you need it.`,
            teacher: `Just-in-time placement: immediately before ${firstUse}, the earliest blocked target in the sequence.`
          });
        } else {
          const pre = graph.byId[s.skillId].prereqs;
          const parts = pre.map(p => (orderOf[p] && orderOf[p] < s.order ? `${graph.byId[p].short} (step ${orderOf[p]})` : `${graph.byId[p].short} (${masteryStatus(mastery[p])})`));
          if (pre.length) reasons.push({
            kind: 'when',
            student: `It builds on ${list(parts)}, so it comes after ${pre.length === 1 ? 'that' : 'those'}.`,
            teacher: `All prerequisites (${pre.join(', ')}) are mastered or scheduled earlier; otherwise curriculum order.`
          });
        }
      }
      // 3. Why this format
      const drivers = loadDrivers(s.forecast);
      if (!pathway.standard) {
        const feel = ({ low: 'light', optimal: 'just right', high: 'challenging', overload: 'like a lot at once' })[s.forecast.band.key];
        const plan = STUDENT_ACTIVITIES[s.format];
        reasons.push({
          kind: 'how',
          student: s.formatOverride
            ? `It should feel ${feel}, but you have not learned it yet, so you start with practice and feedback. ${plan}`
            : `We expect it to feel ${feel}, so: ${plan.charAt(0).toLowerCase()}${plan.slice(1)}`,
          teacher: `Predicted load ${pctTxt(s.forecast.load)} (${s.forecast.band.label}) at this point in the path → ${s.activity}${s.formatOverride ? ' (low load but mastery < 0.60, so practice with feedback instead of enrichment)' : ''}`
        });
      }
      const cf = pathway.standard ? null : counterfactual(s, model, graph);
      const evidence = m.items + s.prereqs.reduce((a, q) => a + (mastery[q.id].items || 0), 0);
      return {
        order: s.order, skillId: s.skillId, kind: s.kind, reasons, drivers, counterfactual: cf,
        confidence: { level: m.items >= 8 ? 'high' : evidence >= 8 ? 'medium' : 'low', answers: evidence }
      };
    });

    const inPath = new Set(steps.map(s => s.skillId));
    const skipped = standard.filter(id => !inPath.has(id) && masteryStatus(mastery[id]) === 'mastered');
    const added = steps.filter(s => s.kind !== 'learn').map(s => s.skillId);
    const roots = diagnosis.gaps.filter(g => g.isRoot).map(g => g.id);
    const overview = pathway.standard ? {
      student: [`Your path follows the course order: ${steps.length} topic${steps.length === 1 ? '' : 's'} to go.`, skipped.length ? `${skipped.length} topic${skipped.length === 1 ? ' is' : 's are'} already mastered and left out.` : ''].filter(Boolean),
      teacher: [`Standard-sequence group: ${steps.length} remaining topics in course order.`, `Skipped as mastered: ${skipped.join(', ') || 'none'}.`],
      added: [], skipped
    } : {
      student: [
        roots.length ? `We found ${roots.length} older skill${roots.length === 1 ? '' : 's'} that your subjects build on: ${list(roots.map(r => graph.byId[r].short))}. ${roots.length === 1 ? 'It is' : 'They are'} built into your path.` : 'Your foundations look solid, so your path goes straight to the topics of your subjects.',
        skipped.length ? `You have already mastered ${skipped.length} topic${skipped.length === 1 ? '' : 's'}, so ${skipped.length === 1 ? 'it is' : 'they are'} skipped.` : '',
        'Each review is placed right before the first topic that needs it, and harder steps come with worked examples.'
      ].filter(Boolean),
      teacher: [
        `${steps.length} steps vs ${standard.length} in the standard sequence: +${added.length} remediation/check (${added.join(', ') || 'none'}), −${skipped.length} already mastered (${skipped.join(', ') || 'none'}).`,
        `Root gaps: ${roots.join(', ') || 'none'}. Ordering: topological over the prerequisite graph, remediation just-in-time before the first blocked target, otherwise curriculum order.`,
        'Formats follow the logistic load forecast re-computed at each step, assuming earlier steps are completed to mastery.'
      ],
      added, skipped
    };
    return { overview, steps: explained };
  }

  // --------------------------------------- 5a. simulated comparison

  /*
   * A transparent learner model, not ground truth. Per study session on skill s:
   *   gain = (1 - k_s) * baseLearn * (0.25 + 0.75 * readiness) * loadFactor * noise
   * readiness is the mean true knowledge of s's prerequisites; load is the
   * model's forecast, cut by 0.15 when the adaptive path scaffolds a high-load
   * step with worked examples. Both arms get the same number of sessions.
   */
  const SIM = { baseLearn: 0.24, stepCap: 4, scaffoldRelief: 0.15 };

  function loadFactor(load) {
    if (load < LOAD_BANDS[0].max) return 0.9;
    if (load < LOAD_BANDS[1].max) return 1.0;
    if (load < LOAD_BANDS[2].max) return 0.6;
    return 0.3;
  }

  function scoreOf(k, standard) {
    return 100 * mean(standard.map(id => pCorrect(k[id])));
  }

  function simulateRun(start, plan, graph, standard, profile, model, budget, rng, sim) {
    const k = {};
    Object.keys(start).forEach(id => { k[id] = start[id]; });
    const asMastery = () => {
      const m = {};
      Object.keys(k).forEach(id => { m[id] = { p: k[id] }; });
      return m;
    };
    const trajectory = [scoreOf(k, standard)];
    let overload = 0;
    let used = 0;

    function study(id, scaffold) {
      const m = asMastery();
      const readiness = prereqMean(id, m, graph);
      let load = forecastLoad(id, m, graph, profile, model).load;
      if (scaffold && load >= LOAD_BANDS[1].max) load = Math.max(0, load - sim.scaffoldRelief);
      if (load >= LOAD_BANDS[2].max) overload++;
      const noise = 0.6 + 0.8 * rng();
      k[id] = clamp(k[id] + (1 - k[id]) * sim.baseLearn * (0.25 + 0.75 * readiness) * loadFactor(load) * noise, 0, 1);
      used++;
      trajectory.push(scoreOf(k, standard));
    }

    if (plan.mode === 'standard') {
      const per = Math.floor(budget / standard.length);
      let extra = budget - per * standard.length;
      standard.forEach(id => {
        const n = per + (extra-- > 0 ? 1 : 0);
        for (let i = 0; i < n; i++) study(id, false);
      });
    } else {
      plan.steps.forEach((step, i) => {
        if (used >= budget) return;
        if (step.kind === 'verify') {
          // One session spent on the check; only a failed check triggers study.
          used++;
          trajectory.push(scoreOf(k, standard));
          if (k[step.skillId] >= MASTERY.developing) return;
        }
        // Pace to the remaining budget so later steps are not starved.
        const fairShare = Math.round((budget - used) / (plan.steps.length - i));
        const cap = clamp(fairShare + 1, 1, sim.stepCap);
        let n = 0;
        while (used < budget && n < cap && k[step.skillId] < MASTERY.mastered) { study(step.skillId, true); n++; }
      });
      // Leftover time goes to the weakest standard-sequence skill that is ready.
      while (used < budget) {
        const m = asMastery();
        const next = [...standard].sort((a, b) => (k[a] - prereqMean(a, m, graph) * 0.5) - (k[b] - prereqMean(b, m, graph) * 0.5))[0];
        study(next, true);
      }
    }
    return {
      trajectory, overload, final: k,
      score: trajectory[trajectory.length - 1],
      mastered: standard.filter(id => k[id] >= MASTERY.mastered).length
    };
  }

  function summarize(runs, standard, budget) {
    const traj = [];
    for (let t = 0; t <= budget; t++) {
      const vals = runs.map(r => r.trajectory[Math.min(t, r.trajectory.length - 1)]);
      traj.push({ t, mean: mean(vals), lo: quantile(vals, 0.05), hi: quantile(vals, 0.95) });
    }
    const scores = runs.map(r => r.score);
    const perSkill = {};
    standard.forEach(id => { perSkill[id] = mean(runs.map(r => r.final[id])); });
    return {
      trajectory: traj,
      score: { mean: mean(scores), lo: quantile(scores, 0.05), hi: quantile(scores, 0.95) },
      mastered: mean(runs.map(r => r.mastered)),
      overload: mean(runs.map(r => r.overload)),
      perSkill
    };
  }

  function simulateComparison({ mastery, graph, standard, pathway, profile, model, budget = 30, runs = 300, seed = 7, sim = SIM }) {
    const start = {};
    Object.keys(mastery).forEach(id => { start[id] = mastery[id].p; });
    const out = {};
    ['adaptive', 'standard'].forEach(mode => {
      // Same seed per arm: both arms face the same sequence of luck.
      const rng = mulberry32(seed);
      const all = [];
      for (let r = 0; r < runs; r++) {
        all.push(simulateRun(start, { mode, steps: pathway.steps }, graph, standard, profile, model, budget, rng, sim));
      }
      out[mode] = summarize(all, standard, budget);
    });
    out.baseline = scoreOf(start, standard);
    out.budget = budget;
    out.runs = runs;
    return out;
  }

  // --------------------------------------- 5b. cohort statistics

  // Lanczos approximation of ln Γ(x).
  function lgamma(x) {
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x;
    const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function betacf(a, b, x) {
    const MAXIT = 200, EPS = 3e-14, FPMIN = 1e-300;
    let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  function incompleteBeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  // Two-tailed p-value of Student's t.
  const tTwoTailed = (t, df) => incompleteBeta(df / (df + t * t), df / 2, 0.5);
  // Critical t for a two-tailed level alpha, by bisection.
  function tCritical(df, alpha = 0.05) {
    let lo = 0, hi = 1000;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (tTwoTailed(mid, df) > alpha) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function welchTTest(a, b) {
    const va = sd(a) ** 2 / a.length, vb = sd(b) ** 2 / b.length;
    const se = Math.sqrt(va + vb);
    const diff = mean(a) - mean(b);
    if (!(se > 0)) return { t: NaN, df: NaN, p: NaN, diff, ci: [NaN, NaN] };
    const t = diff / se;
    const df = (va + vb) ** 2 / (va * va / (a.length - 1) + vb * vb / (b.length - 1));
    const tc = tCritical(df);
    return { t, df, p: tTwoTailed(t, df), diff, ci: [diff - tc * se, diff + tc * se] };
  }

  // Hedges' g: Cohen's d with pooled SD and small-sample correction.
  function hedgesG(a, b) {
    const na = a.length, nb = b.length;
    const pooled = Math.sqrt(((na - 1) * sd(a) ** 2 + (nb - 1) * sd(b) ** 2) / (na + nb - 2));
    const d = (mean(a) - mean(b)) / pooled;
    return d * (1 - 3 / (4 * (na + nb) - 9));
  }
  function effectLabel(g) {
    const m = Math.abs(g);
    return m < 0.2 ? 'negligible' : m < 0.5 ? 'small' : m < 0.8 ? 'medium' : 'large';
  }

  // Hake's normalized gain: share of the possible improvement achieved.
  const normalizedGain = (pre, post) => (pre >= 100 ? null : (post - pre) / (100 - pre));

  function compareCohorts(learners) {
    const complete = learners.filter(l => (l.group === 'adaptive' || l.group === 'standard') && Number.isFinite(l.preTest) && Number.isFinite(l.postTest));
    const groups = {};
    ['adaptive', 'standard'].forEach(gname => {
      const ls = complete.filter(l => l.group === gname);
      const gains = ls.map(l => l.postTest - l.preTest);
      const ng = ls.map(l => normalizedGain(l.preTest, l.postTest)).filter(v => v != null);
      groups[gname] = {
        n: ls.length,
        learners: ls,
        pre: { mean: mean(ls.map(l => l.preTest)), sd: sd(ls.map(l => l.preTest)) },
        post: { mean: mean(ls.map(l => l.postTest)), sd: sd(ls.map(l => l.postTest)) },
        gain: { mean: mean(gains), sd: sd(gains) },
        nGain: mean(ng),
        gains
      };
    });
    const ok = groups.adaptive.n >= 2 && groups.standard.n >= 2;
    return {
      groups,
      ready: ok,
      pretest: ok ? welchTTest(groups.adaptive.learners.map(l => l.preTest), groups.standard.learners.map(l => l.preTest)) : null,
      gain: ok ? welchTTest(groups.adaptive.gains, groups.standard.gains) : null,
      g: ok ? hedgesG(groups.adaptive.gains, groups.standard.gains) : null
    };
  }

  // ------------------------------------------ pre-test vs post-test

  /*
   * How far a learner is through their path: a topic counts as completed once
   * the learner's own answers have brought it to near-mastery (BKT ≥ 0.80 at
   * some point). Inferred credit and a single lucky answer do not count. The
   * post-test unlocks when every topic of the track is completed. Forgetting
   * afterwards does not undo completion; it schedules a review instead.
   */
  const completedTopic = m => m.source === 'assessed' && m.peak >= MASTERY.near;
  // Also used for one subject's topics: percent is the whole-number share
  // completed, state is 'new' (nothing answered yet), 'active' or 'complete'.
  function pathProgress(mastery, seq) {
    const remaining = seq.filter(id => !completedTopic(mastery[id]));
    const near = remaining.filter(id => mastery[id].source === 'assessed' && mastery[id].p >= MASTERY.developing);
    const done = seq.length - remaining.length;
    const complete = seq.length > 0 && remaining.length === 0;
    const state = complete ? 'complete' : seq.some(id => mastery[id].source === 'assessed') ? 'active' : 'new';
    return { done, total: seq.length, percent: seq.length ? Math.round((done / seq.length) * 100) : 0, state, complete, remaining, almost: near };
  }

  /*
   * Spaced review: a completed topic is due again once forgetting takes its
   * predicted recall below near-mastery. Each separate practice day slows
   * forgetting (see decay), so the gap before the next review grows.
   */
  function reviewSchedule(mastery, seq, prm = BKT, asOf = null) {
    return seq.filter(id => completedTopic(mastery[id])).map(id => {
      const m = mastery[id];
      const rate = prm.pForget / (1 + m.reviews);
      const due = m.p < MASTERY.near;
      const inDays = due ? 0 : rate > 0 && m.p > prm.pInit
        ? Math.max(1, Math.ceil(Math.log((MASTERY.near - prm.pInit) / (m.p - prm.pInit)) / Math.log(1 - rate)))
        : Infinity;
      return { id, due, recall: m.p, peak: m.peak, last: m.last, reviews: m.reviews, sinceDays: asOf && m.last ? Math.round(dayGap(m.last, asOf)) : null, inDays };
    });
  }

  // Path steps on topics due for review become short spaced-review steps,
  // moved to the front: a review helps most before recall fades further, and
  // a completed topic does not wait for anything else on the path.
  function markReviews(pathway, reviews) {
    const due = {};
    reviews.filter(r => r.due).forEach(r => { due[r.id] = r; });
    pathway.steps.forEach(s => {
      const r = due[s.skillId];
      if (!r) return;
      s.kind = 'review';
      s.review = r;
      s.minutes = Math.max(10, round5(s.minutes * 0.4));
      s.reason = `Spaced review: ${r.sinceDays != null ? `${r.sinceDays} days since practice, ` : ''}predicted recall ${pctTxt(r.recall)} (peak ${pctTxt(r.peak)})`;
    });
    pathway.steps = [...pathway.steps.filter(s => s.kind === 'review').sort((a, b) => a.review.recall - b.review.recall), ...pathway.steps.filter(s => s.kind !== 'review')];
    pathway.steps.forEach((s, i) => { s.order = i + 1; });
    pathway.totalMinutes = pathway.steps.reduce((a, s) => a + s.minutes, 0);
    return pathway;
  }

  // One question is about 3 points on a 32-question test; smaller changes are noise.
  const IMPROVE_MARGIN = 5;
  function improvement(pre, post) {
    if (!Number.isFinite(pre) || !Number.isFinite(post)) return null;
    const change = post - pre;
    return { pre, post, change, nGain: normalizedGain(pre, post), verdict: change >= IMPROVE_MARGIN ? 'improved' : change <= -IMPROVE_MARGIN ? 'declined' : 'same' };
  }

  // Paired t-test on post − pre for the learners who have both scores.
  function pairedTTest(pre, post) {
    const d = post.map((v, i) => v - pre[i]);
    const n = d.length, m = mean(d), s = sd(d);
    if (n < 2 || !(s > 0)) return { n, diff: m, t: NaN, df: n - 1, p: NaN, ci: [NaN, NaN], dz: NaN };
    const se = s / Math.sqrt(n), t = m / se, df = n - 1, tc = tCritical(df);
    return { n, diff: m, t, df, p: tTwoTailed(t, df), ci: [m - tc * se, m + tc * se], dz: m / s };
  }

  // --------------------------------------- whole chain for one learner

  /*
   * bkt: parameters to use (fitted for the school, or the defaults).
   * asOf: today's date, so mastery reflects forgetting since the last practice.
   */
  function analyzeLearner({ learner, attempts, graph, standard, model, targets, bkt = BKT, asOf = null }) {
    const own = attempts.filter(a => a.learnerId === learner.id);
    const { mastery, before } = traceMastery(own, graph, bkt, { asOf });
    const profile = learnerProfile(own, graph);
    const rows = sortAttempts(own).filter(a => before[a.id]).map(a => {
      const x = attemptFeatures(a, graph.byId[a.skillId], before[a.id], graph);
      return { attempt: a, x, prediction: predictLoad(model, x), rated: a.effort == null ? null : effortToLoad(a.effort) };
    });
    const forecasts = {};
    graph.skills.forEach(s => { forecasts[s.id] = forecastLoad(s.id, mastery, graph, profile, model); });
    const diagnosis = diagnoseGaps(mastery, graph, standard, targets);
    const reviews = reviewSchedule(mastery, standard, bkt, asOf);
    // The standard (control) group keeps the fixed course order: no adaptive reviews.
    const pathway = learner.group === 'standard'
      ? standardPathway(mastery, graph, targets && targets.length ? targets : standard, profile, model)
      : markReviews(recommendPathway(mastery, graph, standard, diagnosis, profile, model), reviews);
    return { mastery, profile, rows, forecasts, diagnosis, pathway, reviews, progress: pathProgress(mastery, standard), bkt };
  }

  return {
    // helpers
    clamp, sigmoid, mean, sd, quantile, mulberry32, gaussian,
    // 1
    BKT, MASTERY, RAPID_SEC, bktStep, pCorrect, decay, itemSequence, sortAttempts, traceMastery, effectiveMastery, masteryStatus,
    BKT_BOUNDS, bktSequences, bktReplay, fitBKT, auc, logLoss, evaluateMastery,
    answerCode, parseAnswers, evidenceSequence, SIM_BKT, simulateBKTAnswers, methodCheck,
    // 2
    FEATURES, PRIOR_MODEL, LOAD_BANDS, loadBand, attemptFeatures, predictLoad, effortToLoad,
    calibrateLoadModel, crossValidateLoad, collectLoadSamples, learnerProfile, forecastFeatures, forecastLoad,
    // 3
    diagnoseGaps,
    // 4
    ACTIVITIES, STUDENT_ACTIVITIES, recommendPathway, standardPathway, explainPathway, loadDrivers,
    // 5
    SIM, simulateComparison, simulateRun, scoreOf,
    incompleteBeta, tTwoTailed, tCritical, welchTTest, hedgesG, effectLabel, normalizedGain, compareCohorts,
    pathProgress, completedTopic, reviewSchedule, markReviews, IMPROVE_MARGIN, improvement, pairedTTest,
    // chain
    analyzeLearner
  };
});
