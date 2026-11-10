// Prints the full chain for the demo cohort: `node tests/demo-report.js [learnerIndex]`
const E = require('../public/js/engine.js');
const C = require('../public/js/curriculum.js');
const { demoData, BUDGET } = require('../scripts/demo-data.js');

const d = demoData();
const model = E.calibrateLoadModel(E.collectLoadSamples(d.learners, d.attempts, C.graph));
console.log('Load model:', JSON.stringify({ bias: +model.bias.toFixed(2), w: Object.fromEntries(Object.entries(model.w).map(([k, v]) => [k, +v.toFixed(2)])), n: model.n, mae: model.mae && +model.mae.toFixed(3), priorMae: model.priorMae && +model.priorMae.toFixed(3) }));

const learner = d.learners[Number(process.argv[2] || 0)];
const seq = C.trackSequence(learner.track);
const a = E.analyzeLearner({ learner, attempts: d.attempts, graph: C.graph, standard: seq, model });
console.log(`\n${learner.name} (${learner.track}, ${learner.group})`);
console.log('Mastery:', seq.map(k => `${k}=${a.mastery[k].p.toFixed(2)}${a.mastery[k].source[0]}`).join(' '));
console.log('Gaps:', a.diagnosis.gaps.map(g => `${g.id}[${g.status}${g.isRoot ? ',root' : ''}] blocks ${g.blocks.join('/')}`).join('; '));
console.log('Pathway:');
a.pathway.steps.forEach(s => console.log(`  ${s.order}. ${s.skillId} ${s.kind} load=${s.forecast.load.toFixed(2)} (${s.forecast.band.key}) ${s.minutes}min - ${s.reason}`));

const sim = E.simulateComparison({ mastery: a.mastery, graph: C.graph, standard: seq, pathway: a.pathway, profile: a.profile, model, budget: BUDGET, runs: 300 });
const fmt = r => `${r.score.mean.toFixed(1)} [${r.score.lo.toFixed(1)}-${r.score.hi.toFixed(1)}], mastered ${r.mastered.toFixed(1)}, overload sessions ${r.overload.toFixed(1)}`;
console.log(`\nSimulation (start ${sim.baseline.toFixed(1)}): adaptive ${fmt(sim.adaptive)}; standard ${fmt(sim.standard)}`);

const cc = E.compareCohorts(d.learners);
console.log('\nCohort gains:', JSON.stringify({ adaptive: cc.groups.adaptive.gain, standard: cc.groups.standard.gain }));
console.log('Welch on gains:', JSON.stringify(cc.gain), 'g =', cc.g.toFixed(2), '| pretest p =', cc.pretest.p.toFixed(3));
console.log(d.learners.map(l => `${l.track}/${l.group[0]}:${l.preTest}->${l.postTest}`).join(' '));
