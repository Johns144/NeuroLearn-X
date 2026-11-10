const test = require('node:test');
const assert = require('node:assert/strict');
const katex = require('katex');
const Q = require('../server/questions.js');
const MT = require('../public/js/mathtext.js');
const C = require('../public/js/curriculum.js');
const E = require('../public/js/engine.js');

const { frac, tf, tpoly, tlin } = Q.helpers;

// Every math segment must be valid LaTeX that KaTeX can typeset.
function assertTypesets(s, where) {
  const opens = (s.match(/\\\(/g) || []).length, closes = (s.match(/\\\)/g) || []).length;
  assert.equal(opens, closes, `unbalanced \\( \\) in ${where}: ${s}`);
  MT.segments(s).forEach(p => {
    if (p.math === undefined) return;
    assert.doesNotThrow(() => katex.renderToString(p.math, { throwOnError: true, displayMode: p.display }), `${where}: ${p.math}`);
  });
}

test('every curriculum skill has generators or a curated pool, and a key idea', () => {
  C.SKILLS.forEach(s => {
    const e = Q.BANK[s.id];
    assert.ok(e, `${s.id} has questions`);
    if (Array.isArray(e)) assert.ok(e.length, s.id);
    else assert.ok(e.pool.length >= 5, `${s.id} pool has at least 5 questions (a full practice set)`);
    assert.ok(Q.IDEAS[s.id], `${s.id} has a key idea`);
    assertTypesets(Q.IDEAS[s.id], `${s.id} idea`);
  });
  // Every track subject is covered.
  C.TRACK_IDS.forEach(t => C.trackSkills(t).forEach(id => assert.ok(Q.BANK[id], `${t}: ${id}`)));
});

test('curated pools: a practice set has no repeats; teacher edits, hides and additions apply', () => {
  const rng = E.mulberry32(3);
  const set = Q.generateSet('CW1', 5, rng);
  assert.equal(new Set(set.map(i => i.id)).size, 5);
  assert.ok(set.every(i => /^CW1#\d$/.test(i.id)));
  const spec = { prompt: 'Teacher question?', answer: 'Yes', wrong: [['No', 'a'], ['Maybe', 'b'], ['Never', 'c']], steps: ['Because.'] };
  const overrides = { 'CW1#1': { active: 0 }, 'CW1#2': { active: 1, spec: { ...spec, prompt: 'Edited question?' } } };
  const items = Q.generateSet('CW1', 5, rng, { overrides, customs: [{ id: 'X1', spec }] });
  const ids = items.map(i => i.id);
  assert.ok(!ids.includes('CW1#1'), 'hidden question is never asked');
  assert.ok(ids.includes('X1'), 'teacher question is included');
  assert.equal(items.find(i => i.id === 'CW1#2').prompt, 'Edited question?');
  assert.throws(() => Q.generateSet('CW1', 1, rng, { overrides: Object.fromEntries([1, 2, 3, 4, 5].map(i => [`CW1#${i}`, { active: 0 }])) }), /No active questions/);
  // Generated topics mix in custom questions for up to half the set.
  const mixed = Q.generateSet('PHA3', 4, rng, { customs: [{ id: 'X2', spec }] });
  assert.equal(mixed.filter(i => i.id === 'X2').length, 1);
});

test('teacher-written questions are validated', () => {
  const ok = Q.checkSpec({ prompt: 'Solve \\(x + 1 = 3\\).', answer: '\\(x = 2\\)', wrong: [['\\(x = 4\\)', 'Subtract, do not add.'], ['\\(x = 3\\)', ''], ['\\(x = 1\\)', '']], explanation: 'Subtract 1.' });
  assert.equal(ok.steps[0], 'Subtract 1.');
  assert.throws(() => Q.checkSpec({ prompt: 'Q here?', answer: 'A', wrong: [['A', ''], ['B', ''], ['C', '']], explanation: 'E e' }), /different/);
  assert.throws(() => Q.checkSpec({ prompt: 'Bad \\(\\frac{1}{\\)', answer: 'A', wrong: [['B', ''], ['C', ''], ['D', '']], explanation: 'E e' }), /render/);
  assert.throws(() => Q.checkSpec({ prompt: 'Q here?', answer: 'A', wrong: [['B', '']], explanation: 'E e' }), /three/);
});

test('1,000 items per skill: four distinct choices, valid LaTeX, a misconception for every wrong choice', () => {
  const rng = E.mulberry32(99);
  C.SKILLS.forEach(s => {
    for (let i = 0; i < 1000; i++) {
      const it = Q.generate(s.id, rng);
      assert.equal(it.choices.length, 4, `${s.id}: ${it.prompt}`);
      assert.equal(new Set(it.choices).size, 4, `${s.id} duplicate choices: ${it.choices}`);
      assert.ok(it.answer >= 0 && it.answer < 4);
      assert.equal(it.whys.length, 4);
      it.whys.forEach((w, j) => (j === it.answer ? assert.equal(w, null) : assert.ok(typeof w === 'string' && w.length > 10, `${s.id} missing why`)));
      assert.ok(Array.isArray(it.steps) && it.steps.length >= 1);
      [it.prompt, it.hint, ...it.choices, ...it.steps, ...it.whys.filter(Boolean)].forEach(t => {
        assert.equal(typeof t, 'string');
        assert.doesNotMatch(t, /NaN|undefined|Infinity/, `${s.id}: ${t}`);
        assertTypesets(t, s.id);
      });
      // Expressions shown as choices are in simplest sign form.
      [it.prompt, ...it.choices].forEach(t => assert.doesNotMatch(t, /\+ -\d|- -\d/, `${s.id}: ${t}`));
    }
  });
});

test('LaTeX helpers and plain-text fallback', () => {
  assert.equal(tpoly([1, -5, 6]), 'x^{2} - 5x + 6');
  assert.equal(tpoly([-1, 0, 4]), '-x^{2} + 4');
  assert.equal(tpoly([0, 0]), '0');
  assert.equal(tlin(3, -2, 'a'), '3a - 2');
  assert.equal(tf(frac(6, -8)), '-\\frac{3}{4}');
  assert.equal(tf(frac(10, 5)), '2');
  assert.equal(Q.helpers.peso(12100), '₱12,100.00');
  assert.equal(MT.texToPlain('Solve \\(x^{2} - 4 = 0\\)'), 'Solve x² − 4 = 0');
  assert.equal(MT.texToPlain('\\(\\frac{3}{4} + \\log_{2} 8\\)'), '3/4 + log₂ 8');
  assert.match(MT.render('a \\(x^{2}\\) <b>', katex), /katex/);
  assert.match(MT.render('a \\(x^{2}\\) <b>', katex), /&lt;b&gt;/, 'text parts are escaped');
});

// Spot-check the arithmetic by parsing the generators' own prompts.
test('answers are mathematically correct for parseable generators', () => {
  const rng = E.mulberry32(5);
  const inner = s => s.replace(/^\\\(|\\\)$/g, '');
  for (let i = 0; i < 500; i++) {
    let it = Q.BANK.J1[1](rng);
    let m = it.prompt.match(/(\d+) \+ (\d+) \\times (\d+) - (\d+)/);
    assert.equal(Number(inner(it.answer)), +m[1] + m[2] * m[3] - m[4]);

    it = Q.BANK.GM8[0](rng);
    m = it.prompt.match(/\\log_\{(\d+)\} (\d+)/);
    assert.equal(Number(m[1]) ** Number(inner(it.answer)), Number(m[2]));

    it = Q.BANK.J9[0](rng);
    m = it.prompt.match(/Solve: \\\((.+) = 0\\\)/);
    const roots = inner(it.answer).match(/-?\d+/g).map(Number);
    const evalPoly = x => eval(m[1].replace(/x\^\{2\}/, `(${x})**2`).replace(/(\d*)x/, (_, k) => `${k || 1}*(${x})`)); // eslint-disable-line no-eval
    roots.forEach(r => assert.equal(evalPoly(r), 0, it.prompt));
  }
});

test('generateSet avoids repeated prompts', () => {
  const set = Q.generateSet('GM9', 4, E.mulberry32(1));
  assert.equal(set.length, 4);
  assert.equal(new Set(set.map(i => i.prompt)).size, 4);
});
