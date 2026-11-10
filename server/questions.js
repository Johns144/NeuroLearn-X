/*
 * NeuroLearn-X — item bank.
 *
 * One or more generators per skill. Each call builds a fresh four-option
 * multiple-choice item from random numbers. Text is plain; mathematics is
 * LaTeX between \( … \) or \[ … \], rendered with KaTeX in the browser.
 *
 * Every item carries what the tutor needs to explain itself:
 *   hint    a nudge, shown on request (counted as hint use)
 *   steps   a worked solution, revealed one step at a time
 *   whys    for each choice, why it is wrong (the misconception that
 *           produces it); null for the correct choice
 *   idea    the key idea of the skill
 *
 * Answers stay on the server until the student has answered.
 */
'use strict';

// ---------------------------------------------------------------- helpers
const ri = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
const nz = (rng, a, b) => { let v = 0; while (v === 0) v = ri(rng, a, b); return v; };
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
function frac(n, d) {
  if (d === 0) throw new Error('zero denominator');
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

// LaTeX builders
const M = s => `\\(${s}\\)`;
const D = s => `\\[${s}\\]`;
const tf = f => (f.d === 1 ? `${f.n}` : f.n < 0 ? `-\\frac{${-f.n}}{${f.d}}` : `\\frac{${f.n}}{${f.d}}`);
const par = n => (n < 0 ? `(${n})` : `${n}`);
const pm = n => (n < 0 ? `- ${-n}` : `+ ${n}`);
// Polynomial from coefficients, highest power first: [1, -5, 6] -> "x^{2} - 5x + 6"
function tpoly(coeffs, v = 'x') {
  const deg = coeffs.length - 1;
  let out = '';
  coeffs.forEach((c, i) => {
    if (c === 0) return;
    const p = deg - i, abs = Math.abs(c);
    const body = p === 0 ? `${abs}` : `${abs === 1 ? '' : abs}${v}${p > 1 ? `^{${p}}` : ''}`;
    out += out === '' ? (c < 0 ? '-' : '') + body : (c < 0 ? ' - ' : ' + ') + body;
  });
  return out || '0';
}
const tlin = (a, b, v = 'x') => tpoly([a, b], v);
const commas = n => {
  const [i, d] = n.toFixed(2).split('.');
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${d}`;
};
const peso = n => `₱${commas(Math.round(n * 100) / 100)}`;
const pesoInt = n => `₱${commas(n).replace(/\.00$/, '')}`;
const expand = (m, n) => tpoly([1, m + n, m * n]);
const factored = (m, n) => `(${tlin(1, m)})(${tlin(1, n)})`;

// Near-miss distractors for numeric answers, when a generator runs short.
function fallbackDistractors(answer) {
  const why = 'Close, but this comes from an arithmetic slip. Recheck each step carefully.';
  let m = answer.match(/^\\\(([A-Za-z] = )?(-?\d+)\\\)$/);
  if (m) return [1, -1, 2, -2, 3, -3, 5].map(k => [M(`${m[1] || ''}${Number(m[2]) + k}`), why]);
  m = answer.match(/^\\\((x = |y = )?(-)?\\frac\{(\d+)\}\{(\d+)\}\\\)$/);
  if (m) {
    const n = (m[2] ? -1 : 1) * Number(m[3]), d = Number(m[4]), pre = m[1] || '';
    return [frac(n + 1, d), frac(n - 1, d), frac(n, d + 1), frac(2 * n, d), frac(n + d, d), frac(n - d, d)].map(f => [M(`${pre}${tf(f)}`), why]);
  }
  m = answer.match(/^\\\((-?[\d.]+)\\%\\\)$/);
  if (m) return [5, -5, 10, -10, 15].map(k => [M(`${String(Math.round((Number(m[1]) + k) * 1000) / 1000)}\\%`), why]);
  m = answer.match(/^\\\((z = |E = )?(-?\d+\.\d+)\\\)$/);
  if (m) return [0.1, -0.1, 0.01, -0.01, 0.2].map(k => [M(`${m[1] || ''}${String(Math.round((Number(m[2]) + k) * 1000) / 1000)}`), why]);
  // Quantities with units, e.g. \(12.5\ \text{m/s}\)
  m = answer.match(/^\\\((-?[\d.]+)\\ \\text\{([^}]*)\}(\^\{?\d\}?)?\\\)$/);
  if (m) {
    const v = Number(m[1]);
    return [1.1, 0.9, 1.5, 0.5, 2].map(f => [M(`${String(Math.round(v * f * 1000) / 1000)}\\ \\text{${m[2]}}${m[3] || ''}`), why]);
  }
  m = answer.match(/^₱([\d,]+)(\.\d+)?$/);
  if (m) {
    const v = Number(m[1].replace(/,/g, '') + (m[2] || ''));
    return [0.1, -0.1, 0.5, 0.25].map(k => [m[2] ? peso(v * (1 + k)) : pesoInt(Math.round(v * (1 + k))), why]);
  }
  return [];
}

const IDEAS = {
  J1: 'Multiply and divide before adding and subtracting; fractions need a common denominator before you add them.',
  J2: `A percent is a number out of 100: \\(p\\% = \\frac{p}{100}\\).`,
  J3: `Same base: multiply \\(\\Rightarrow\\) add exponents, divide \\(\\Rightarrow\\) subtract, power of a power \\(\\Rightarrow\\) multiply. \\(a^{-n} = \\frac{1}{a^{n}}\\).`,
  J4: 'Only like terms combine. Multiply binomials term by term (FOIL).',
  J5: `To factor \\(x^{2} + bx + c\\), find two numbers whose product is \\(c\\) and whose sum is \\(b\\).`,
  J6: 'Factor first, then cancel common factors (never cancel terms of a sum).',
  J7: 'Undo operations in reverse order. Dividing an inequality by a negative number flips the sign.',
  J8: 'A function pairs each input with exactly one output.',
  J9: `Write the quadratic as a product equal to zero; each factor gives a root. The discriminant \\(b^{2} - 4ac\\) counts the real roots.`,
  GM1: 'A function model has a fixed part and a part that changes with the input.',
  GM2: 'To evaluate f(a), replace every x with a (in brackets) and simplify.',
  GM3: `\\((f \\pm g)(x) = f(x) \\pm g(x)\\), \\((f \\cdot g)(x) = f(x)\\,g(x)\\), \\(\\left(\\frac{f}{g}\\right)(x) = \\frac{f(x)}{g(x)}\\).`,
  GM4: `\\((f \\circ g)(x) = f(g(x))\\): apply g first, then f.`,
  GM5: 'Vertical asymptotes come from zeros of the denominator; horizontal asymptotes compare the degrees.',
  GM6: 'To find an inverse, swap x and y and solve for y. The inverse undoes the function.',
  GM7: 'Write both sides as powers of the same base, then set the exponents equal.',
  GM8: `\\(\\log_{b} N = k\\) means \\(b^{k} = N\\): a logarithm is an exponent.`,
  GM9: `Simple interest: \\(I = Prt\\). Compound amount: \\(F = P(1 + r)^{t}\\).`,
  GM10: `Ordinary annuity: \\(F = R\\cdot\\frac{(1+j)^{n} - 1}{j}\\) and \\(P = R\\cdot\\frac{1 - (1+j)^{-n}}{j}\\).`
};

function makeItem(spec, rng, skillId) {
  const answer = String(spec.answer);
  const seen = new Set([answer]);
  const wrong = [];
  [...spec.wrong, ...fallbackDistractors(answer)].forEach(([v, why]) => {
    const s = String(v);
    if (wrong.length < 3 && !seen.has(s) && !/NaN|undefined|Infinity/.test(s)) { seen.add(s); wrong.push([s, why]); }
  });
  if (wrong.length < 3) throw new Error(`Not enough distractors for "${spec.prompt}"`);
  const correct = [answer, null];
  const order = shuffle(rng, [correct, ...wrong]);
  return {
    prompt: spec.prompt,
    choices: order.map(o => o[0]),
    answer: order.indexOf(correct),
    whys: order.map(o => (o === correct ? null : o[1] || 'This option does not fit. Compare it with the worked solution.')),
    hint: spec.hint || HINTS[skillId] || 'Rule out the options that clearly do not fit, then compare the rest.',
    steps: spec.steps && spec.steps.length ? spec.steps : ['Review the key idea of this topic.'],
    idea: IDEAS[skillId] || ''
  };
}
// Topic-level hints for curated pools whose questions carry no hint of their own.
const HINTS = {};

// ---------------------------------------------------------------- generators
const BANK = {
  // ---- Junior High foundations
  J1: [
    rng => {
      const b = ri(rng, 2, 9); let d = ri(rng, 2, 9); while (d === b) d = ri(rng, 2, 9);
      const a = ri(rng, 1, b - 1), c = ri(rng, 1, d - 1);
      const ans = frac(a * d + c * b, b * d);
      const raw = `\\frac{${a * d + c * b}}{${b * d}}`;
      return {
        prompt: `Add: ${M(`\\frac{${a}}{${b}} + \\frac{${c}}{${d}}`)}`, answer: M(tf(ans)),
        wrong: [
          [M(tf(frac(a + c, b + d))), 'You added the numerators and the denominators separately. Fractions need a common denominator first.'],
          [M(tf(frac(a + c, b * d))), 'You found a common denominator but did not rewrite the numerators to match it.'],
          [M(tf(frac(a * c, b * d))), 'That is the product of the fractions, not their sum.'],
          [M(tf(frac(a * d + c * b, b + d))), 'The numerator is right, but the common denominator is the product of the denominators, not their sum.']
        ],
        hint: 'Rewrite both fractions with a common denominator before adding.',
        steps: [
          `Common denominator: ${M(`${b} \\times ${d} = ${b * d}`)}.`,
          `Rewrite each fraction: ${M(`\\frac{${a}}{${b}} = \\frac{${a * d}}{${b * d}}`)} and ${M(`\\frac{${c}}{${d}} = \\frac{${c * b}}{${b * d}}`)}.`,
          `Add the numerators: ${M(`\\frac{${a * d}}{${b * d}} + \\frac{${c * b}}{${b * d}} = ${raw}`)}${tf(ans) !== raw ? `, which simplifies to ${M(tf(ans))}` : ''}.`
        ]
      };
    },
    rng => {
      const a = ri(rng, 2, 9), b = ri(rng, 2, 9), c = ri(rng, 2, 9), d = ri(rng, 1, 9);
      return {
        prompt: `Evaluate: ${M(`${a} + ${b} \\times ${c} - ${d}`)}`, answer: M(a + b * c - d),
        wrong: [
          [M((a + b) * c - d), 'You added before multiplying. Multiplication comes first.'],
          [M(a + b * (c - d)), 'You subtracted before multiplying. Multiply first, then add and subtract from left to right.'],
          [M(a + b * c + d), 'The last operation is a subtraction, not an addition.'],
          [M((a + b) * (c - d)), 'You grouped the numbers in pairs. Follow the order of operations instead.']
        ],
        hint: 'Multiply before you add or subtract.',
        steps: [`Multiply first: ${M(`${b} \\times ${c} = ${b * c}`)}.`, `Then work left to right: ${M(`${a} + ${b * c} - ${d} = ${a + b * c - d}`)}.`]
      };
    },
    rng => {
      const a = ri(rng, 2, 9), b = ri(rng, 2, 9), c = ri(rng, 2, 12);
      return {
        prompt: `Evaluate: ${M(`(-${a}) \\times ${b} + ${c}`)}`, answer: M(-a * b + c),
        wrong: [
          [M(a * b + c), 'A negative times a positive is negative, not positive.'],
          [M(-a * b - c), 'Only the product is negative. The +' + c + ' is still added.'],
          [M(-(a * b + c)), `The negative sign belongs to ${a} only, not to the whole expression.`],
          [M(-a * (b + c)), 'You added before multiplying.']
        ],
        hint: 'A negative times a positive is negative. Multiply first, then add.',
        steps: [`${M(`(-${a}) \\times ${b} = ${-a * b}`)} (negative × positive = negative).`, `${M(`${-a * b} + ${c} = ${-a * b + c}`)}.`]
      };
    }
  ],
  J2: [
    rng => {
      const p = pick(rng, [10, 20, 25, 30, 40, 50, 60, 75]), N = ri(rng, 2, 20) * 20, ans = p * N / 100;
      return {
        prompt: `What is ${M(`${p}\\%`)} of ${M(N)}?`, answer: M(ans),
        wrong: [
          [M(N * p / 10), 'You divided by 10 instead of 100. Percent means “out of 100”.'],
          [M(N - ans), `That is what is left after removing ${p}%, not ${p}% itself.`],
          [M(ans + N / 10), `Recheck the multiplication: ${p}% is ${p / 100}.`],
          [M(p + N), 'Taking a percent of a number means multiplying, not adding.']
        ],
        hint: `Change ${p}% to a decimal and multiply.`,
        steps: [`${M(`${p}\\% = \\frac{${p}}{100} = ${p / 100}`)}`, `${M(`${p / 100} \\times ${N} = ${ans}`)}`]
      };
    },
    rng => {
      const P = ri(rng, 2, 20) * 100, p = pick(rng, [10, 15, 20, 25, 30, 40]);
      const off = P * p / 100;
      return {
        prompt: `A bag costs ${pesoInt(P)}. It is on sale at ${p}% off. What is the sale price?`, answer: pesoInt(P - off),
        wrong: [
          [pesoInt(off), 'That is the discount itself. Subtract it from the original price.'],
          [pesoInt(P + off), 'You added the discount. A sale lowers the price.'],
          [pesoInt(P - p), `You subtracted the number ${p}, not ${p}% of the price.`],
          [pesoInt(P - 2 * off), 'You took the discount off twice.']
        ],
        hint: `Find ${p}% of ${pesoInt(P)} first, then subtract it from the price.`,
        steps: [`Discount: ${M(`${p / 100} \\times ${P} = ${off}`)}, so ${pesoInt(off)} off.`, `Sale price: ${M(`${P} - ${off} = ${P - off}`)}, which is ${pesoInt(P - off)}.`]
      };
    },
    rng => {
      const a = ri(rng, 1, 5), b = ri(rng, a + 1, 9), k = ri(rng, 2, 20) * 10, N = (a + b) * k;
      return {
        prompt: `Share ₱${N} between two friends in the ratio ${M(`${a} : ${b}`)}. How much is the larger share?`, answer: `₱${b * k}`,
        wrong: [
          [`₱${a * k}`, 'That is the smaller share.'],
          [`₱${k}`, `That is the value of one part. The larger share has ${b} parts.`],
          [`₱${N - b}`, 'You subtracted a ratio number from the total. Divide the total into equal parts instead.'],
          [`₱${b * (k + 10)}`, `Recheck the value of one part: ${N} ÷ ${a + b}.`]
        ],
        hint: `There are ${a} + ${b} = ${a + b} equal parts. Find the value of one part.`,
        steps: [`Total parts: ${M(`${a} + ${b} = ${a + b}`)}.`, `One part: ${M(`${N} \\div ${a + b} = ${k}`)}.`, `Larger share: ${M(`${b} \\times ${k} = ${b * k}`)}, so ₱${b * k}.`]
      };
    }
  ],
  J3: [
    rng => {
      const a = ri(rng, 2, 7), b = ri(rng, 2, 7);
      return {
        prompt: `Simplify: ${M(`x^{${a}} \\cdot x^{${b}}`)}`, answer: M(`x^{${a + b}}`),
        wrong: [
          [M(`x^{${a * b}}`), 'You multiplied the exponents. When you multiply powers with the same base, add them.'],
          [M(`2x^{${a + b}}`), 'Nothing doubles the coefficient; it stays 1.'],
          [M(`x^{${a + b + 1}}`), `Recheck the sum of the exponents: ${a} + ${b}.`],
          [M(`x^{${a + b - 1}}`), `Recheck the sum of the exponents: ${a} + ${b}.`],
          [M(`2x^{${a * b}}`), 'Add the exponents, and the coefficient stays 1.']
        ],
        hint: 'When you multiply powers with the same base, add the exponents.',
        steps: [`Same base, so add the exponents: ${M(`x^{${a}} \\cdot x^{${b}} = x^{${a} + ${b}}`)}.`, `${M(`x^{${a} + ${b}} = x^{${a + b}}`)}`]
      };
    },
    rng => {
      const a = ri(rng, 2, 5), b = ri(rng, 2, 4);
      return {
        prompt: `Simplify: ${M(`(x^{${a}})^{${b}}`)}`, answer: M(`x^{${a * b}}`),
        wrong: [
          [M(`x^{${a + b}}`), 'You added the exponents. A power raised to a power multiplies them.'],
          [M(`${b}x^{${a}}`), 'The outer exponent is not a coefficient; it raises the whole power.'],
          [M(`x^{${a * b + 1}}`), `Recheck the product: ${a} × ${b}.`],
          [M(`x^{${a * b - 1}}`), `Recheck the product: ${a} × ${b}.`]
        ],
        hint: 'A power raised to a power: multiply the exponents.',
        steps: [`${M(`(x^{${a}})^{${b}} = x^{${a} \\cdot ${b}}`)}`, `${M(`= x^{${a * b}}`)}`]
      };
    },
    rng => {
      const a = ri(rng, 6, 10), b = ri(rng, 2, a - 2);
      return {
        prompt: `Simplify: ${M(`x^{${a}} \\div x^{${b}}`)}`, answer: M(`x^{${a - b}}`),
        wrong: [
          [M(`x^{${a + b}}`), 'You added the exponents. When dividing, subtract them.'],
          [M(`x^{${a - b + 1}}`), `Recheck the difference: ${a} − ${b}.`],
          [M(`\\frac{1}{x^{${a - b}}}`), 'The larger exponent is on top, so the result stays in the numerator.'],
          [M(`x^{${a * b}}`), 'Exponents are subtracted when dividing, not multiplied.']
        ],
        hint: 'When you divide powers with the same base, subtract the exponents.',
        steps: [`${M(`x^{${a}} \\div x^{${b}} = x^{${a} - ${b}}`)}`, `${M(`= x^{${a - b}}`)}`]
      };
    },
    rng => {
      const B = ri(rng, 2, 5), n = ri(rng, 2, 3);
      return {
        prompt: `Evaluate: ${M(`${B}^{-${n}}`)}`, answer: M(`\\frac{1}{${B ** n}}`),
        wrong: [
          [M(-(B ** n)), 'A negative exponent does not make the number negative. It means “one over”.'],
          [M(-B * n), `${B}^${n} means ${B} multiplied by itself ${n} times, and the negative exponent means a reciprocal.`],
          [M(`\\frac{1}{${B * n}}`), `Right idea (a reciprocal), but ${B}^${n} is ${B ** n}, not ${B} × ${n}.`],
          [M(B ** n), 'You dropped the negative exponent. It turns the power into its reciprocal.'],
          [M(`-\\frac{1}{${B ** n}}`), 'The reciprocal is right, but a negative exponent does not make the value negative.'],
          [M(`\\frac{1}{${B ** (n + 1)}}`), `Recheck the power: ${B}^${n} = ${B ** n}.`]
        ],
        hint: 'A negative exponent means “one over” the positive power.',
        steps: [`${M(`${B}^{-${n}} = \\frac{1}{${B}^{${n}}}`)}`, `${M(`${B}^{${n}} = ${B ** n}`)}, so the answer is ${M(`\\frac{1}{${B ** n}}`)}.`]
      };
    }
  ],
  J4: [
    rng => {
      const a = ri(rng, 1, 9), c = ri(rng, 1, 9), b = ri(rng, 1, 9), d = ri(rng, 1, 9);
      return {
        prompt: `Simplify: ${M(`(${tlin(a, b)}) + (${tlin(c, -d)})`)}`, answer: M(tlin(a + c, b - d)),
        wrong: [
          [M(tlin(a + c, b + d)), `The second constant is −${d}; subtract it.`],
          [M(tlin(a - c, b - d)), 'Both x-terms are added; you subtracted them.'],
          [M(tlin(a * c, b - d)), 'Like terms are added, not multiplied.'],
          [M(tlin(a + c + 1, b - d)), `Recheck the x-coefficients: ${a} + ${c}.`]
        ],
        hint: 'Combine like terms: x-terms with x-terms, numbers with numbers.',
        steps: [`x-terms: ${M(`${tpoly([a, 0])} + ${tpoly([c, 0])} = ${tpoly([a + c, 0])}`)}.`, `Constants: ${M(`${b} - ${d} = ${b - d}`)}.`, `Result: ${M(tlin(a + c, b - d))}.`]
      };
    },
    rng => {
      const a = nz(rng, -9, 9), b = nz(rng, -9, 9);
      return {
        prompt: `Expand: ${M(factored(a, b))}`, answer: M(expand(a, b)),
        wrong: [
          [M(tpoly([1, a * b, a + b])), 'You swapped the middle and last terms.'],
          [M(tpoly([1, a + b, a + b])), `The last term is the product ${a} · ${b}, not the sum.`],
          [M(tpoly([1, 0, a * b])), 'You left out the middle term (outer + inner products).'],
          [M(tpoly([1, -(a + b), a * b])), 'Check the sign of the middle term.'],
          [M(tpoly([1, a + b, -a * b])), 'Check the sign of the last term: it is the product of the two constants.'],
          [M(tpoly([1, 2 * a, a * b])), 'Combine the outer and inner terms; do not double just one of them.']
        ],
        hint: 'Use FOIL: First, Outer, Inner, Last.',
        steps: [
          `FOIL: ${M(`x \\cdot x + ${par(b)}x + ${par(a)}x + ${par(a)} \\cdot ${par(b)}`)}`,
          `Combine the middle terms: ${M(`${par(a)} + ${par(b)} = ${a + b}`)}, and ${M(`${par(a)} \\cdot ${par(b)} = ${a * b}`)}.`,
          `Result: ${M(expand(a, b))}.`
        ]
      };
    },
    rng => {
      const p = ri(rng, 1, 3), q = nz(rng, -5, 5), r = ri(rng, -6, 6), k = nz(rng, -4, 4);
      const v = p * k * k + q * k + r;
      return {
        prompt: `Evaluate ${M(tpoly([p, q, r]))} when ${M(`x = ${k}`)}.`, answer: M(v),
        wrong: [
          [M(p * k * k - q * k + r), 'Check the sign of the middle term after substituting.'],
          [M(-p * k * k + q * k + r), 'Squaring a number never gives a negative result.'],
          [M((p * k) ** 2 + q * k + r), 'Square x first, then multiply by the coefficient.'],
          [M(2 * p * k + q * k + r), `x² means x times x, not 2 times x.`]
        ],
        hint: `Replace every x with (${k}). Square before multiplying by the coefficient.`,
        steps: [
          `Substitute: ${M(`${p}(${k})^{2} + (${q})(${k}) + (${r})`)}`,
          `${M(`= ${p * k * k} + ${par(q * k)} + ${par(r)} = ${v}`)}`
        ]
      };
    }
  ],
  J5: [
    rng => {
      const a = nz(rng, -9, 9); let b = nz(rng, -9, 9); while (a + b === 0) b = nz(rng, -9, 9);
      const target = expand(a, b);
      const cand = [[-a, -b], [a, -b], [-a, b], [a * b, 1], [a + b, 0]].filter(([m, n]) => expand(m, n) !== target);
      return {
        prompt: `Factor completely: ${M(target)}`, answer: M(factored(a, b)),
        wrong: cand.map(([m, n]) => [M(factored(m, n)), `Multiply it out: ${M(`${factored(m, n)} = ${expand(m, n)}`)}, which is not ${M(target)}.`]),
        hint: `Find two numbers whose product is ${a * b} and whose sum is ${a + b}.`,
        steps: [
          `Look for two numbers with product ${M(a * b)} and sum ${M(a + b)}: they are ${M(a)} and ${M(b)}.`,
          `So ${M(`${target} = ${factored(a, b)}`)}.`,
          `Check by expanding: ${M(`${factored(a, b)} = ${target}`)}.`
        ]
      };
    },
    rng => {
      const a = ri(rng, 2, 12);
      const opts = [[`(x - ${a})^{2}`, tpoly([1, -2 * a, a * a])], [`(x + ${a})^{2}`, tpoly([1, 2 * a, a * a])],
        [`(x - ${a * a})(x + 1)`, expand(-a * a, 1)], [`(x + ${a * a})(x - 1)`, expand(a * a, -1)]];
      return {
        prompt: `Factor completely: ${M(`x^{2} - ${a * a}`)}`, answer: M(`(x + ${a})(x - ${a})`),
        wrong: opts.map(([f, e]) => [M(f), `Multiply it out: ${M(`${f} = ${e}`)}, which is not ${M(`x^{2} - ${a * a}`)}.`]),
        hint: `This is a difference of two squares: \\(a^{2} - b^{2} = (a + b)(a - b)\\).`,
        steps: [`${M(`x^{2} - ${a * a} = x^{2} - ${a}^{2}`)}`, `Difference of squares: ${M(`(x + ${a})(x - ${a})`)}.`]
      };
    },
    rng => {
      const a = nz(rng, -9, 9); let b = nz(rng, -9, 9); while (b === a) b = nz(rng, -9, 9);
      const poly = expand(a, b);
      const at = x => x * x + (a + b) * x + a * b;
      const others = [...new Set([-a, -b, a * b, a + b, a + 1, b - 1, 2 * a, 2 * b, a + 3, -(a * b)])].filter(r => r !== a && r !== b);
      return {
        prompt: `Which of these is a factor of ${M(poly)}?`, answer: M(`(${tlin(1, a)})`),
        wrong: others.map(r => [M(`(${tlin(1, r)})`), `If ${M(tlin(1, r))} were a factor, then ${M(`x = ${-r}`)} would make the expression 0, but it gives ${M(at(-r))}.`]),
        hint: `Factor the trinomial: look for two numbers with product ${a * b} and sum ${a + b}.`,
        steps: [`${M(`${poly} = ${factored(a, b)}`)}`, `So ${M(`(${tlin(1, a)})`)} is a factor (and so is ${M(`(${tlin(1, b)})`)}).`]
      };
    }
  ],
  J6: [
    rng => {
      const a = ri(rng, 2, 9);
      return {
        prompt: `Simplify ${M(`\\frac{x^{2} - ${a * a}}{x - ${a}}`)}, where ${M(`x \\neq ${a}`)}.`, answer: M(`x + ${a}`),
        wrong: [
          [M(`x - ${a}`), `After factoring, x − ${a} is what cancels; x + ${a} is what remains.`],
          [M(`x^{2} - ${a}`), 'You cannot cancel parts of a sum. Factor first, then cancel whole factors.'],
          [M(`\\frac{x + ${a}}{x - ${a}}`), `The factor (x − ${a}) in the numerator cancels with the denominator.`],
          [M(`x + ${a * a}`), `Recheck the factoring: x² − ${a * a} = (x + ${a})(x − ${a}).`]
        ],
        hint: 'Factor the numerator first, then cancel the common factor.',
        steps: [`Factor: ${M(`x^{2} - ${a * a} = (x + ${a})(x - ${a})`)}.`, `${M(`\\frac{(x + ${a})(x - ${a})}{x - ${a}} = x + ${a}`)}`]
      };
    },
    rng => {
      const a = nz(rng, -8, 8); let b = nz(rng, -8, 8); while (b === a || a + b === 0) b = nz(rng, -8, 8);
      return {
        prompt: `Simplify: ${M(`\\frac{${expand(a, b)}}{${tlin(1, a)}}`)}`, answer: M(tlin(1, b)),
        wrong: [
          [M(tlin(1, -b)), 'Check the sign in the remaining factor.'],
          [M(tlin(1, a)), 'That is the factor that cancels, not the one that remains.'],
          [M(tlin(1, a + b)), 'Factor the numerator completely before cancelling.'],
          [M(tlin(1, a * b)), 'Factor the numerator completely before cancelling.'],
          [M(factored(a, b)), 'That is the factored numerator. You still need to cancel the common factor with the denominator.'],
          [M(tlin(1, -a)), 'Check the signs in your factors.']
        ],
        hint: 'Factor the trinomial, then cancel the factor that matches the denominator.',
        steps: [`Factor: ${M(`${expand(a, b)} = ${factored(a, b)}`)}.`, `Cancel ${M(`(${tlin(1, a)})`)}: the result is ${M(tlin(1, b))}.`]
      };
    },
    rng => {
      const a = ri(rng, 1, 9), b = ri(rng, 1, 9);
      return {
        prompt: `Add: ${M(`\\frac{${a}}{x} + \\frac{${b}}{x}`)}`, answer: M(`\\frac{${a + b}}{x}`),
        wrong: [
          [M(`\\frac{${a + b}}{2x}`), 'With a common denominator, keep it. Do not add the denominators.'],
          [M(`\\frac{${a * b}}{x}`), 'Add the numerators; do not multiply them.'],
          [M(`\\frac{${a + b}}{x^{2}}`), 'The denominator stays x when you add.'],
          [M(`${a + b}x`), 'The x is in the denominator, not the numerator.']
        ],
        hint: 'Same denominator: add the numerators and keep the denominator.',
        steps: [`${M(`\\frac{${a}}{x} + \\frac{${b}}{x} = \\frac{${a} + ${b}}{x} = \\frac{${a + b}}{x}`)}`]
      };
    },
    rng => {
      const a = ri(rng, 2, 9); let b = ri(rng, 2, 9); while (b === a) b = ri(rng, 2, 9);
      return {
        prompt: `Multiply and simplify (${M('x \\neq 0')}): ${M(`\\frac{${a}}{x} \\cdot \\frac{x}{${b}}`)}`, answer: M(tf(frac(a, b))),
        wrong: [
          [M(tf(frac(b, a))), 'You flipped the result. Numerators multiply numerators.'],
          [M(`\\frac{${a}x}{${b}}`), 'The x in the numerator cancels with the x in the denominator.'],
          [M(a * b), `${b} is in the denominator, so it divides; it does not multiply.`],
          [M(`\\frac{${a}}{${b}x^{2}}`), 'The x terms cancel; they do not combine into x².']
        ],
        hint: 'Multiply numerators and denominators, then cancel x.',
        steps: [`${M(`\\frac{${a} \\cdot x}{x \\cdot ${b}} = \\frac{${a}}{${b}}`)}`, frac(a, b).d !== b ? `Simplify: ${M(tf(frac(a, b)))}.` : 'This is already in lowest terms.']
      };
    }
  ],
  J7: [
    rng => {
      const x0 = nz(rng, -9, 9), a = ri(rng, 2, 9) * pick(rng, [1, -1]), b = nz(rng, -15, 15), c = a * x0 + b;
      return {
        prompt: `Solve for ${M('x')}: ${M(`${tlin(a, b)} = ${c}`)}`, answer: M(`x = ${x0}`),
        wrong: [
          [M(`x = ${tf(frac(c + b, a))}`), `You ${b > 0 ? 'added' : 'subtracted'} ${Math.abs(b)} on the wrong side. Undo it with the opposite operation.`],
          [M(`x = ${-x0}`), 'Check the sign when you divide.'],
          [M(`x = ${c - b}`), `You forgot to divide by the coefficient ${a}.`],
          [M(`x = ${tf(frac(c, a))}`), 'Move the constant term before you divide.']
        ],
        hint: `Undo the ${b > 0 ? 'addition' : 'subtraction'} first, then divide by ${a}.`,
        steps: [`${b > 0 ? 'Subtract' : 'Add'} ${M(Math.abs(b))} on both sides: ${M(`${tpoly([a, 0])} = ${c - b}`)}.`, `Divide by ${M(a)}: ${M(`x = \\frac{${c - b}}{${a}} = ${x0}`)}.`]
      };
    },
    rng => {
      const a = -ri(rng, 2, 6), x0 = nz(rng, -8, 8), b = nz(rng, -10, 10), c = a * x0 + b;
      return {
        prompt: `Solve: ${M(`${tlin(a, b)} < ${c}`)}`, answer: M(`x > ${x0}`),
        wrong: [
          [M(`x < ${x0}`), 'Dividing both sides by a negative number reverses the inequality sign.'],
          [M(`x > ${-x0}`), 'Check the sign of the number after dividing.'],
          [M(`x < ${-x0}`), 'Two slips: the inequality must flip, and the number’s sign is off.']
        ],
        hint: 'Dividing both sides by a negative number reverses the inequality sign.',
        steps: [`${b > 0 ? 'Subtract' : 'Add'} ${M(Math.abs(b))}: ${M(`${tpoly([a, 0])} < ${c - b}`)}.`, `Divide by ${M(a)} and flip the sign: ${M(`x > ${x0}`)}.`]
      };
    }
  ],
  J8: [
    rng => {
      const xs = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3).sort((p, q) => p - q);
      const set = pairs => M(`\\{${pairs.map(([x, y]) => `(${x}, ${y})`).join(', ')}\\}`);
      const fn = xs.map(x => [x, ri(rng, 1, 12)]);
      const wrongs = new Map();
      while (wrongs.size < 3) {
        const base = xs.map(x => [x, ri(rng, 1, 12)]);
        const i = ri(rng, 0, 1);
        let y = ri(rng, 1, 12); while (y === base[i][1]) y = ri(rng, 1, 12);
        base[i + 1] = [base[i][0], y];
        wrongs.set(set(base), `The input ${base[i][0]} is paired with two different outputs (${base[i][1]} and ${y}), so this is not a function.`);
      }
      return {
        prompt: 'Which set of ordered pairs represents a function?', answer: set(fn), wrong: [...wrongs.entries()],
        hint: 'In a function, each x-value is paired with exactly one y-value.',
        steps: ['Check whether any x-value appears twice with different y-values.', `In ${set(fn)} every x-value appears once, so it is a function.`]
      };
    },
    rng => {
      const xs = shuffle(rng, [1, 2, 3, 4, 5]).slice(0, 3).sort((p, q) => p - q);
      const ys = shuffle(rng, [6, 7, 8, 9, 10, 11, 12]).slice(0, 3);
      const rel = xs.map((x, i) => `(${x}, ${ys[i]})`).join(', ');
      const s = v => M(`\\{${[...v].sort((p, q) => p - q).join(', ')}\\}`);
      return {
        prompt: `What is the domain of the relation ${M(`\\{${rel}\\}`)}?`, answer: s(xs),
        wrong: [
          [s(ys), 'That is the range: the set of y-values.'],
          [s([...xs, ...ys]), 'The domain contains only the first coordinates.'],
          [s([xs[0], ys[0]]), 'That is one ordered pair, not the domain.'],
          [s(xs.slice(0, 2)), 'You left out one of the x-values.']
        ],
        hint: 'The domain is the set of all first coordinates (x-values).',
        steps: [`The first coordinates are ${M(xs.join(', '))}.`, `So the domain is ${s(xs)}.`]
      };
    },
    rng => {
      const x1 = ri(rng, -5, 5); let x2 = ri(rng, -5, 5); while (x2 === x1) x2 = ri(rng, -5, 5);
      const y1 = ri(rng, -6, 6); let y2 = ri(rng, -6, 6); while (y2 === y1) y2 = ri(rng, -6, 6);
      const m = frac(y2 - y1, x2 - x1);
      return {
        prompt: `What is the slope of the line through ${M(`(${x1}, ${y1})`)} and ${M(`(${x2}, ${y2})`)}?`, answer: M(tf(m)),
        wrong: [
          [M(tf(frac(x2 - x1, y2 - y1))), 'You divided the change in x by the change in y. Slope is rise over run.'],
          [M(tf(frac(-m.n, m.d))), 'Subtract in the same order on top and bottom (second point minus first point).'],
          x1 + x2 !== 0 ? [M(tf(frac(y1 + y2, x1 + x2))), 'Slope uses differences of coordinates, not sums.'] : ['No slope (vertical line)', 'Only a vertical line, where both x-values are equal, has no slope.'],
          [M(tf(frac(m.n + m.d, m.d))), 'Recheck the subtraction in the numerator.']
        ],
        hint: `Slope \\(= \\frac{y_2 - y_1}{x_2 - x_1}\\).`,
        steps: [`${M('m = \\frac{y_2 - y_1}{x_2 - x_1}')}`, `${M(`m = \\frac{${y2} - ${par(y1)}}{${x2} - ${par(x1)}} = \\frac{${y2 - y1}}{${x2 - x1}} = ${tf(m)}`)}`]
      };
    }
  ],
  J9: [
    rng => {
      const r1 = nz(rng, -9, 9); let r2 = nz(rng, -9, 9); while (r2 === r1 || r2 === -r1) r2 = nz(rng, -9, 9);
      const roots = (p, q) => { const [s, t] = [p, q].sort((m, n) => m - n); return M(`x = ${s} \\text{ or } x = ${t}`); };
      const poly = tpoly([1, -(r1 + r2), r1 * r2]);
      return {
        prompt: `Solve: ${M(`${poly} = 0`)}`, answer: roots(r1, r2),
        wrong: [
          [roots(-r1, -r2), 'Both signs are flipped. Setting x − r = 0 gives x = r, not −r.'],
          [roots(r1, -r2), 'One root has the wrong sign. Set each factor equal to zero carefully.'],
          [roots(-r1, r2), 'One root has the wrong sign. Set each factor equal to zero carefully.']
        ],
        hint: `Factor: find two numbers with product ${r1 * r2} and sum ${-(r1 + r2)}. Then set each factor to zero.`,
        steps: [`Factor: ${M(`${poly} = (${tlin(1, -r1)})(${tlin(1, -r2)})`)}.`, `Set each factor to zero: ${M(`${tlin(1, -r1)} = 0`)} or ${M(`${tlin(1, -r2)} = 0`)}.`, `So ${roots(r1, r2)}.`]
      };
    },
    rng => {
      const a = ri(rng, 1, 3), b = ri(rng, -6, 6), c = nz(rng, -6, 6), Dv = b * b - 4 * a * c;
      const kinds = ['two distinct real roots', 'one real root (a double root)', 'no real roots'];
      const ans = Dv > 0 ? kinds[0] : Dv === 0 ? kinds[1] : kinds[2];
      const why = { [kinds[0]]: 'That needs a positive discriminant.', [kinds[1]]: 'That needs a discriminant of exactly 0.', [kinds[2]]: 'That needs a negative discriminant.' };
      return {
        prompt: `How many real roots does ${M(`${tpoly([a, b, c])} = 0`)} have?`, answer: ans,
        wrong: [...kinds.filter(k => k !== ans).map(k => [k, `${why[k]} Here it is ${Dv}.`]), ['infinitely many real roots', 'A quadratic equation has at most two roots.']],
        hint: `Compute the discriminant \\(b^{2} - 4ac\\) and check its sign.`,
        steps: [`${M(`b^{2} - 4ac = (${b})^{2} - 4(${a})(${c}) = ${Dv}`)}`, `The discriminant is ${Dv > 0 ? 'positive' : Dv === 0 ? 'zero' : 'negative'}, so there ${Dv > 0 ? 'are two distinct real roots' : Dv === 0 ? 'is one (double) real root' : 'are no real roots'}.`]
      };
    },
    rng => {
      const a = ri(rng, 1, 4), b = nz(rng, -9, 9), c = nz(rng, -9, 9);
      return {
        prompt: `What is the sum of the roots of ${M(`${tpoly([a, b, c])} = 0`)}?`, answer: M(tf(frac(-b, a))),
        wrong: [
          [M(tf(frac(b, a))), 'The sum of the roots is −b/a; you dropped the negative sign.'],
          [M(tf(frac(c, a))), 'c/a is the product of the roots, not the sum.'],
          [M(tf(frac(-c, a))), 'The sum uses b, not c.'],
          [M(-b * a), 'Divide −b by a; do not multiply.']
        ],
        hint: `For \\(ax^{2} + bx + c = 0\\), the sum of the roots is \\(-\\frac{b}{a}\\).`,
        steps: [`Sum of roots ${M('= -\\frac{b}{a}')}.`, `${M(`-\\frac{${b}}{${a}} = ${tf(frac(-b, a))}`)}`]
      };
    }
  ],

  // ---- General Mathematics
  GM1: [
    rng => {
      const [thing, unit, v] = pick(rng, [['A taxi charges', 'kilometre', 'd'], ['A printing shop charges', 'page', 'p'], ['A gym charges', 'visit', 'v']]);
      const base = pick(rng, [40, 45, 50, 60]), rate = pick(rng, [12, 13.5, 14, 15]);
      return {
        prompt: `${thing} a fixed fee of ₱${base} plus ₱${rate} per ${unit}. Which function gives the total cost ${M('C')} for ${M(v)} ${unit}s?`,
        answer: M(`C(${v}) = ${base} + ${rate}${v}`),
        wrong: [
          [M(`C(${v}) = ${rate} + ${base}${v}`), 'You swapped the two parts. The fixed fee is paid once; the per-unit rate is multiplied by the number of units.'],
          [M(`C(${v}) = ${base + rate}${v}`), 'The fixed fee should not be multiplied by the number of units.'],
          [M(`C(${v}) = ${base}${v} + ${rate}${v}`), 'The fixed fee is paid once, not for every unit.'],
          [M(`C(${v}) = ${base} - ${rate}${v}`), 'Each unit adds to the cost, so the rate term is added.']
        ],
        hint: 'The fixed fee is paid once. Only the per-unit charge is multiplied by the number of units.',
        steps: [`Fixed part: ₱${base}, paid once.`, `Changing part: ₱${rate} for each ${unit}, so ${M(`${rate}${v}`)}.`, `Total: ${M(`C(${v}) = ${base} + ${rate}${v}`)}.`]
      };
    },
    rng => {
      const not = pick(rng, ['x = y^{2}', 'x^{2} + y^{2} = 25', 'y^{2} = x + 4', 'x = |y|']);
      const yes = shuffle(rng, ['y = x^{2}', 'y = 2x + 1', 'y = |x|', 'y = x^{3} - 1', 'y = \\sqrt{x}']).slice(0, 3);
      return {
        prompt: `Which equation does NOT define ${M('y')} as a function of ${M('x')}?`, answer: M(not),
        wrong: yes.map(e => [M(e), `Each x-value gives exactly one y-value in ${M(e)}, so it is a function.`]),
        hint: 'Try one x-value. If it gives two different y-values, it is not a function.',
        steps: [`In ${M(not)}, a single x-value can pair with two y-values (one positive, one negative).`, 'So it fails the vertical line test: y is not a function of x.']
      };
    },
    rng => {
      const first = pick(rng, [30, 40, 50]), extra = pick(rng, [10, 15, 20]), h = ri(rng, 4, 9);
      const fee = first + extra * (h - 3);
      return {
        prompt: `Parking costs ₱${first} for the first 3 hours and ₱${extra} for each additional hour. How much is parking for ${h} hours?`,
        answer: `₱${fee}`,
        wrong: [
          [`₱${extra * h}`, 'The first 3 hours have their own fixed price.'],
          [`₱${first + extra * h}`, 'You charged the extra rate for all hours, including the first 3.'],
          [`₱${Math.round(first * h / 3)}`, 'The additional hours use a different rate from the first 3 hours.'],
          [`₱${first + extra * (h - 2)}`, `Count only the hours after the first 3: ${h} − 3 = ${h - 3}.`]
        ],
        hint: `The first 3 hours cost ₱${first} in total. Count only the hours after that.`,
        steps: [`Additional hours: ${M(`${h} - 3 = ${h - 3}`)}.`, `Cost: ${M(`${first} + ${extra} \\times ${h - 3} = ${fee}`)}, so ₱${fee}.`]
      };
    }
  ],
  GM2: [
    rng => {
      const a = nz(rng, -3, 3), b = nz(rng, -6, 6), c = ri(rng, -9, 9), k = nz(rng, -4, 4);
      const v = a * k * k + b * k + c;
      return {
        prompt: `If ${M(`f(x) = ${tpoly([a, b, c])}`)}, find ${M(`f(${k})`)}.`, answer: M(v),
        wrong: [
          [M(a * k * k - b * k + c), 'Check the sign of the middle term after substituting.'],
          [M(-a * k * k + b * k + c), 'Squaring a number never makes it negative; keep the sign of the coefficient.'],
          [M((a * k) ** 2 + b * k + c), 'Square x first, then multiply by the coefficient.'],
          [M(a * k * k + b + c), `The middle term is b·x, so multiply ${b} by ${k}.`]
        ],
        hint: `Substitute x = ${k} everywhere. Square ${k} first.`,
        steps: [`${M(`f(${k}) = ${a}(${k})^{2} + (${b})(${k}) + (${c})`)}`, `${M(`= ${a * k * k} + ${par(b * k)} + ${par(c)} = ${v}`)}`]
      };
    },
    rng => {
      const m = ri(rng, 0, 3), p = ri(rng, 1, 5), q = ri(rng, 2, 5), r = ri(rng, 1, 6);
      const k = rng() < 0.5 ? m - ri(rng, 1, 3) : m + ri(rng, 0, 3);
      const left = k * k + p, right = q * k - r;
      const useLeft = k < m;
      const ans = useLeft ? left : right, other = useLeft ? right : left;
      const rule = useLeft ? `x^{2} + ${p}` : tlin(q, -r);
      return {
        prompt: `Find ${M(`f(${k})`)} for ${D(`f(x) = \\begin{cases} x^{2} + ${p} & \\text{if } x < ${m} \\\\ ${tlin(q, -r)} & \\text{if } x \\ge ${m} \\end{cases}`)}`,
        answer: M(ans),
        wrong: [
          [M(other), `You used the wrong rule. ${k} is ${useLeft ? 'less than' : 'at least'} ${m}, so the ${useLeft ? 'first' : 'second'} rule applies.`],
          [M(ans + q), 'Recheck the arithmetic after substituting.'],
          [M(-ans), 'Check the sign of your result.'],
          [M(k * k - p), 'Recheck which rule applies and its constant term.']
        ],
        hint: `First decide which rule applies: is ${k} less than ${m}, or at least ${m}?`,
        steps: [`Is ${M(`${k} < ${m}`)}? ${useLeft ? 'Yes' : 'No'}, so use ${M(rule)}.`, `${M(`f(${k}) = ${useLeft ? `(${k})^{2} + ${p}` : `${q}(${k}) - ${r}`} = ${ans}`)}`]
      };
    },
    rng => {
      const p = ri(rng, 2, 6), q = nz(rng, -9, 9);
      return {
        prompt: `If ${M(`f(x) = ${tlin(p, q)}`)}, find ${M('f(a + 1)')}.`, answer: M(tlin(p, p + q, 'a')),
        wrong: [
          [M(tlin(p, q + 1, 'a')), 'You added 1 after applying f. Replace x with the whole expression (a + 1) instead.'],
          [M(tlin(p + 1, q, 'a')), `The 1 is part of the input, so it is multiplied by ${p} too.`],
          [M(`${tlin(p, q, 'a')} + 1`), `Distribute ${p} over (a + 1); do not just add 1 at the end.`],
          [M(tlin(p, p * q, 'a')), `Recheck the constant: ${p} · 1 + (${q}).`]
        ],
        hint: 'Replace x with the whole expression (a + 1), then distribute.',
        steps: [`${M(`f(a + 1) = ${p}(a + 1) ${pm(q)}`)}`, `${M(`= ${p}a + ${p} ${pm(q)} = ${tlin(p, p + q, 'a')}`)}`]
      };
    }
  ],
  GM3: [
    rng => {
      const a = ri(rng, 1, 6), b = nz(rng, -9, 9), c = ri(rng, 1, 6), d = nz(rng, -9, 9);
      return {
        prompt: `${M(`f(x) = ${tlin(a, b)}`)} and ${M(`g(x) = ${tlin(c, d)}`)}. Find ${M('(f + g)(x)')}.`, answer: M(tlin(a + c, b + d)),
        wrong: [
          [M(tlin(a + c, b - d)), 'Add both constants; you subtracted one.'],
          [M(tlin(a - c, b + d)), 'Add the x-terms as well.'],
          [M(tlin(a * c, b * d)), 'Adding functions adds like terms; it does not multiply them.'],
          [M(tpoly([a * c, a * d + b * c, b * d])), 'That is the product (f · g)(x), not the sum.']
        ],
        hint: 'Add the two functions: combine the x-terms and the constants.',
        steps: [`${M(`(f + g)(x) = (${tlin(a, b)}) + (${tlin(c, d)})`)}`, `${M(`= ${tlin(a + c, b + d)}`)}`]
      };
    },
    rng => {
      const a = ri(rng, 1, 6), b = nz(rng, -9, 9), c = ri(rng, 1, 6), d = nz(rng, -9, 9), k = nz(rng, -5, 5);
      const fk = a * k + b, gk = c * k + d;
      return {
        prompt: `${M(`f(x) = ${tlin(a, b)}`)} and ${M(`g(x) = ${tlin(c, d)}`)}. Find ${M(`(f - g)(${k})`)}.`, answer: M(fk - gk),
        wrong: [
          [M(fk + gk), 'That is (f + g), not (f − g).'],
          [M(gk - fk), 'Order matters: compute f(k) − g(k), not g(k) − f(k).'],
          [M((a - c) * k + b + d), 'Subtract the whole of g(k), including its constant.'],
          [M(fk * gk), 'That is the product, not the difference.']
        ],
        hint: `Find f(${k}) and g(${k}) separately, then subtract.`,
        steps: [`${M(`f(${k}) = ${fk}`)} and ${M(`g(${k}) = ${gk}`)}.`, `${M(`(f - g)(${k}) = ${fk} - ${par(gk)} = ${fk - gk}`)}`]
      };
    },
    rng => {
      const a = ri(rng, 1, 5), b = nz(rng, -6, 6), c = ri(rng, 1, 5), d = nz(rng, -6, 6), k = nz(rng, -3, 3);
      const fk = a * k + b, gk = c * k + d;
      return {
        prompt: `${M(`f(x) = ${tlin(a, b)}`)} and ${M(`g(x) = ${tlin(c, d)}`)}. Find ${M(`(f \\cdot g)(${k})`)}.`, answer: M(fk * gk),
        wrong: [
          [M(fk + gk), 'That is the sum, not the product.'],
          [M(a * c * k + b * d), 'Multiply the full values f(k) and g(k), not matching parts.'],
          [M(fk * gk + 1), 'Recheck the multiplication.'],
          [M(a * c * k * k + b * d), 'You left out the cross terms. Multiply the full values f(k) and g(k).']
        ],
        hint: `\\((f \\cdot g)(${k})\\) means \\(f(${k}) \\times g(${k})\\).`,
        steps: [`${M(`f(${k}) = ${fk}`)} and ${M(`g(${k}) = ${gk}`)}.`, `${M(`(f \\cdot g)(${k}) = ${par(fk)} \\cdot ${par(gk)} = ${fk * gk}`)}`]
      };
    },
    rng => {
      const a = ri(rng, 1, 6), c = ri(rng, 1, 6), k = nz(rng, -4, 4);
      let b = nz(rng, -9, 9); while (a * k + b === 0) b = nz(rng, -9, 9);
      let d = nz(rng, -9, 9); while (c * k + d === 0) d = nz(rng, -9, 9);
      const fk = a * k + b, gk = c * k + d;
      return {
        prompt: `${M(`f(x) = ${tlin(a, b)}`)} and ${M(`g(x) = ${tlin(c, d)}`)}. Find ${M(`\\left(\\frac{f}{g}\\right)(${k})`)}.`, answer: M(tf(frac(fk, gk))),
        wrong: [
          [M(tf(frac(gk, fk))), 'You divided g by f. The function on top is f.'],
          [M(tf(frac(a, c))), 'Divide the values f(k) and g(k), not just the coefficients.'],
          [M(fk - gk), 'That is the difference, not the quotient.'],
          [M(tf(frac(fk + 1, gk))), 'Recheck f(k).']
        ],
        hint: `Divide f(${k}) by g(${k}).`,
        steps: [`${M(`f(${k}) = ${fk}`)} and ${M(`g(${k}) = ${gk}`)}.`, `${M(`\\frac{${fk}}{${gk}} = ${tf(frac(fk, gk))}`)}`]
      };
    }
  ],
  GM4: [
    rng => {
      const a = ri(rng, 2, 5), b = nz(rng, -6, 6), c = nz(rng, -5, 5), k = nz(rng, -3, 3);
      const f = x => a * x + b, g = x => x * x + c;
      return {
        prompt: `${M(`f(x) = ${tlin(a, b)}`)} and ${M(`g(x) = ${tpoly([1, 0, c])}`)}. Find ${M(`(f \\circ g)(${k})`)}.`, answer: M(f(g(k))),
        wrong: [
          [M(g(f(k))), `You applied f first. In (f ∘ g)(${k}), g acts first, then f.`],
          [M(f(k) * g(k)), 'Composition is not multiplication.'],
          [M(f(k) + g(k)), 'Composition is not addition.'],
          [M(f(g(k)) + a), 'Recheck the last step.']
        ],
        hint: `\\((f \\circ g)(${k}) = f(g(${k}))\\). Work from the inside out: find \\(g(${k})\\) first.`,
        steps: [`Inside first: ${M(`g(${k}) = (${k})^{2} ${pm(c)} = ${g(k)}`)}.`, `Then ${M(`f(${g(k)}) = ${a}(${g(k)}) ${pm(b)} = ${f(g(k))}`)}.`]
      };
    },
    rng => {
      const a = ri(rng, 2, 5), b = nz(rng, -6, 6);
      let c, d;
      // f(g(x)) and g(f(x)) must differ, or the classic swap error is invisible.
      do { c = ri(rng, 2, 5); d = nz(rng, -6, 6); } while (a * d + b === c * b + d);
      return {
        prompt: `${M(`f(x) = ${tlin(a, b)}`)} and ${M(`g(x) = ${tlin(c, d)}`)}. Find ${M('f(g(x))')}.`, answer: M(tlin(a * c, a * d + b)),
        wrong: [
          [M(tlin(a * c, c * b + d)), 'That is g(f(x)). For f(g(x)), put g(x) into f.'],
          [M(tlin(a + c, b + d)), 'That is (f + g)(x), not a composition.'],
          [M(tlin(a * c, b * d)), `Distribute ${a} over the whole of g(x).`],
          [M(tlin(a * c, b + d)), `When distributing, multiply ${d} by ${a} too.`],
          [M(tlin(a * c, a * d)), `After distributing, remember to add f’s constant ${b}.`],
          [M(tlin(a * c, a * d - b)), `Check the sign of f’s constant ${b} when you add it.`]
        ],
        hint: 'Replace every x in f with the whole expression g(x).',
        steps: [`${M(`f(g(x)) = ${a}(${tlin(c, d)}) ${pm(b)}`)}`, `${M(`= ${tlin(a * c, a * d)} ${pm(b)} = ${tlin(a * c, a * d + b)}`)}`]
      };
    },
    rng => {
      const a = ri(rng, 2, 4), b = nz(rng, -5, 5);
      return {
        prompt: `${M(`f(x) = ${tlin(a, b)}`)} and ${M('g(x) = x^{2}')}. Find ${M('g(f(x))')}.`, answer: M(tpoly([a * a, 2 * a * b, b * b])),
        wrong: [
          [M(tpoly([a, 0, b])), 'That is f(g(x)), with x² put into f.'],
          [M(tpoly([a * a, 0, b * b])), 'Squaring a binomial includes the middle term 2abx.'],
          [M(tpoly([a, 2 * a * b, b * b])), `Square the coefficient ${a} too.`],
          [M(tpoly([a * a, a * b, b * b])), 'The middle term is 2abx, not abx.']
        ],
        hint: 'g squares whatever goes in. Square the whole binomial f(x).',
        steps: [`${M(`g(f(x)) = (${tlin(a, b)})^{2}`)}`, `${M(`= ${a * a}x^{2} + 2(${a})(${b})x + ${par(b)}^{2} = ${tpoly([a * a, 2 * a * b, b * b])}`)}`]
      };
    }
  ],
  GM5: [
    rng => {
      const b = nz(rng, -9, 9); let a = nz(rng, -9, 9); while (a === -b) a = nz(rng, -9, 9);
      return {
        prompt: `What is the vertical asymptote of ${M(`f(x) = \\frac{${tlin(1, a)}}{${tlin(1, -b)}}`)}?`, answer: M(`x = ${b}`),
        wrong: [
          [M(`x = ${-b}`), `Solve ${M(`${tlin(1, -b)} = 0`)} carefully: it gives ${M(`x = ${b}`)}.`],
          [M(`x = ${-a}`), 'That makes the numerator zero, so it is a zero of f, not an asymptote.'],
          [M('y = 1'), 'That is the horizontal asymptote.'],
          [M(`y = ${b}`), 'A vertical asymptote is a vertical line, written x = ….']
        ],
        hint: 'Set the denominator equal to zero (after checking it does not cancel with the numerator).',
        steps: [`Denominator ${M(`${tlin(1, -b)} = 0`)} when ${M(`x = ${b}`)}.`, `The numerator is ${M(a + b)} there, not zero, so ${M(`x = ${b}`)} is a vertical asymptote.`]
      };
    },
    rng => {
      const a = ri(rng, 1, 9), c = ri(rng, 2, 9), b = nz(rng, -9, 9), d = nz(rng, -9, 9);
      return {
        prompt: `What is the horizontal asymptote of ${M(`f(x) = \\frac{${tlin(a, b)}}{${tlin(c, d)}}`)}?`, answer: M(`y = ${tf(frac(a, c))}`),
        wrong: [
          [M(`y = ${tf(frac(c, a))}`), 'Divide the numerator’s leading coefficient by the denominator’s, not the other way round.'],
          [M('y = 0'), 'y = 0 happens when the denominator has the higher degree. Here the degrees are equal.'],
          [M(`x = ${tf(frac(-d, c))}`), 'That is the vertical asymptote.'],
          [M(`y = ${tf(frac(b, d))}`), 'Use the leading coefficients, not the constant terms.']
        ],
        hint: 'Numerator and denominator have the same degree: divide the leading coefficients.',
        steps: ['Both numerator and denominator have degree 1.', `Divide the leading coefficients: ${M(`y = \\frac{${a}}{${c}} = ${tf(frac(a, c))}`)}.`]
      };
    },
    rng => {
      const b = nz(rng, -6, 6); let a = nz(rng, -9, 9); while (a === -b) a = nz(rng, -9, 9);
      const x = a + 2 * b;
      return {
        prompt: `Solve: ${M(`\\frac{${tlin(1, a)}}{${tlin(1, -b)}} = 2`)}`, answer: M(`x = ${x}`),
        wrong: [
          [M(`x = ${a - 2 * b}`), `Distribute carefully: ${M(`2(${tlin(1, -b)}) = ${tlin(2, -2 * b)}`)}.`],
          [M(`x = ${2 * b - a}`), 'Recheck the signs when you move terms across.'],
          [M(`x = ${a + b}`), 'Multiply the whole denominator by 2.'],
          [M(`x = ${b}`), 'That value makes the denominator zero, so it can never be a solution.']
        ],
        hint: `Multiply both sides by the denominator, then solve the linear equation.`,
        steps: [`${M(`${tlin(1, a)} = 2(${tlin(1, -b)})`)}`, `${M(`${tlin(1, a)} = ${tlin(2, -2 * b)}`)}`, `${M(`x = ${x}`)} (and ${M(`x \\neq ${b}`)}, so it is valid).`]
      };
    },
    rng => {
      const a = nz(rng, -8, 8); let b = nz(rng, -8, 8); while (b === -a || b === a) b = nz(rng, -8, 8);
      return {
        prompt: `What is the zero of ${M(`f(x) = \\frac{${tlin(1, -a)}}{${tlin(1, b)}}`)}?`, answer: M(`x = ${a}`),
        wrong: [
          [M(`x = ${-a}`), `Solve ${M(`${tlin(1, -a)} = 0`)} carefully: it gives ${M(`x = ${a}`)}.`],
          [M(`x = ${-b}`), 'That makes the denominator zero, which gives an asymptote, not a zero.'],
          [M(`x = ${b}`), 'Zeros come from the numerator.'],
          ['There is no zero', 'The numerator is zero at one x-value where the denominator is not zero.']
        ],
        hint: 'A rational function is zero where its numerator is zero and its denominator is not.',
        steps: [`Numerator ${M(`${tlin(1, -a)} = 0`)} when ${M(`x = ${a}`)}.`, `The denominator is ${M(a + b)} there, not zero, so ${M(`x = ${a}`)} is the zero.`]
      };
    }
  ],
  GM6: [
    rng => {
      const a = ri(rng, 2, 7), b = nz(rng, -9, 9);
      return {
        prompt: `Find the inverse of ${M(`f(x) = ${tlin(a, b)}`)}.`, answer: M(`f^{-1}(x) = \\frac{${tlin(1, -b)}}{${a}}`),
        wrong: [
          [M(`f^{-1}(x) = \\frac{${tlin(1, b)}}{${a}}`), `Undo ${b > 0 ? '+' : '−'}${Math.abs(b)} with the opposite operation.`],
          [M(`f^{-1}(x) = ${tlin(a, -b)}`), `Undo “times ${a}” by dividing, not multiplying.`],
          [M(`f^{-1}(x) = \\frac{1}{${tlin(a, b)}}`), 'The inverse function is not the reciprocal 1/f(x).'],
          [M(`f^{-1}(x) = ${a}(${tlin(1, -b)})`), `Divide by ${a} instead of multiplying.`]
        ],
        hint: 'Write y = f(x), swap x and y, then solve for y.',
        steps: [`${M(`y = ${tlin(a, b)}`)}. Swap: ${M(`x = ${a}y ${pm(b)}`)}.`, `${M(`${a}y = ${tlin(1, -b)}`)}, so ${M(`y = \\frac{${tlin(1, -b)}}{${a}}`)}.`]
      };
    },
    rng => {
      const a = ri(rng, 2, 6), b = nz(rng, -9, 9), m = nz(rng, -6, 6), k = a * m + b;
      return {
        prompt: `${M(`f(x) = ${tlin(a, b)}`)}. Find ${M(`f^{-1}(${k})`)}.`, answer: M(m),
        wrong: [
          [M(a * k + b), `That is f(${k}), not f⁻¹(${k}).`],
          [M(tf(frac(k + b, a))), 'Undo the constant with the opposite operation before dividing.'],
          [M(-m), 'Check the sign of your answer.'],
          [M(tf(frac(k, a))), 'Undo the constant before dividing.']
        ],
        hint: `\\(f^{-1}(${k})\\) is the x that makes \\(f(x) = ${k}\\).`,
        steps: [`Solve ${M(`${tlin(a, b)} = ${k}`)}.`, `${M(`${a}x = ${k - b}`)}, so ${M(`x = ${m}`)}.`]
      };
    },
    rng => {
      const yes = pick(rng, ['f(x) = 2x + 1', 'f(x) = x^{3}', 'f(x) = 5 - 3x', 'f(x) = x^{3} + 2']);
      const reasons = {
        'f(x) = x^{2}': 'f(2) = f(−2) = 4', 'f(x) = |x|': 'f(3) = f(−3) = 3', 'f(x) = x^{4} - 1': 'f(1) = f(−1) = 0',
        'f(x) = x^{2} + 3x': 'f(0) = f(−3) = 0', 'f(x) = 7': 'every input gives 7'
      };
      const no = shuffle(rng, Object.keys(reasons)).slice(0, 3);
      return {
        prompt: 'Which function is one-to-one (and so has an inverse function)?', answer: M(yes),
        wrong: no.map(f => [M(f), `Not one-to-one: ${reasons[f]}, so two inputs share an output and it fails the horizontal line test.`]),
        hint: 'Use the horizontal line test: no horizontal line may cross the graph twice.',
        steps: [`${M(yes)} is always increasing or always decreasing.`, 'So different inputs always give different outputs: it is one-to-one.']
      };
    }
  ],
  GM7: [
    rng => {
      const B = pick(rng, [2, 3, 5]);
      const t = B === 2 ? ri(rng, 2, 6) : B === 3 ? ri(rng, 2, 5) : ri(rng, 2, 4);
      const m = ri(rng, 1, 3), x0 = nz(rng, -3, 4), c = t - m * x0;
      const exp = c === 0 ? (m === 1 ? 'x' : `${m}x`) : tlin(m, c);
      return {
        prompt: `Solve: ${M(`${B}^{${exp}} = ${B ** t}`)}`, answer: M(`x = ${x0}`),
        wrong: [
          [M(`x = ${t}`), `${t} is the value of the exponent; you still need to solve for x.`],
          [M(`x = ${tf(frac(t + c, m))}`), 'Move the constant with the opposite operation.'],
          [M(`x = ${x0 + 1}`), 'Recheck the last step.'],
          [M(`x = ${tf(frac(B ** t - c, m))}`), `Set the exponents equal: ${exp} = ${t}, not ${exp} = ${B ** t}.`]
        ],
        hint: `Write ${B ** t} as a power of ${B}, then set the exponents equal.`,
        steps: [`${M(`${B ** t} = ${B}^{${t}}`)}`, `Set the exponents equal: ${M(`${exp} = ${t}`)}.`, `Solve: ${M(`x = ${x0}`)}.`]
      };
    },
    rng => {
      const P0 = pick(rng, [100, 250, 500, 1000]), n = ri(rng, 2, 5), k = ri(rng, 2, 5);
      return {
        prompt: `A bacteria culture starts with ${M(P0)} cells and doubles every ${n} hours. How many cells are there after ${k * n} hours?`,
        answer: M(P0 * 2 ** k),
        wrong: [
          [M(P0 * 2 * k), `Doubling ${k} times means multiplying by 2 ${k} times (2^${k}), not by 2 × ${k}.`],
          [M(P0 * k * k), `Use powers of 2: 2^${k}.`],
          [M(P0 + 2 ** k), 'Multiply the starting amount by 2^k; do not add.'],
          [M(P0 * 2 ** (k + 1)), `Count the doublings: ${k * n} ÷ ${n} = ${k}.`]
        ],
        hint: `${k * n} hours is ${k} doubling periods. Use \\(P = P_0 \\cdot 2^{t}\\), where t counts the doublings.`,
        steps: [`Number of doublings: ${M(`${k * n} \\div ${n} = ${k}`)}.`, `${M(`${P0} \\cdot 2^{${k}} = ${P0} \\cdot ${2 ** k} = ${P0 * 2 ** k}`)}`]
      };
    },
    rng => {
      const a = pick(rng, [2, 3, 5]), b = pick(rng, [2, 3]), k = ri(rng, 0, 4);
      return {
        prompt: `If ${M(`f(x) = ${a} \\cdot ${b}^{x}`)}, find ${M(`f(${k})`)}.`, answer: M(a * b ** k),
        wrong: [
          [M((a * b) ** k), `Only ${b} is raised to the power, not ${a} · ${b}.`],
          [M(a * b * k), `${b}^x is repeated multiplication, not ${b} · x.`],
          [M(a + b ** k), `Multiply by ${a}; do not add.`],
          [M(a * b ** (k + 1)), 'Recheck the exponent.']
        ],
        hint: 'Raise the base to the power first, then multiply by the coefficient.',
        steps: [`${M(`${b}^{${k}} = ${b ** k}`)}`, `${M(`f(${k}) = ${a} \\cdot ${b ** k} = ${a * b ** k}`)}`]
      };
    }
  ],
  GM8: [
    rng => {
      const B = pick(rng, [2, 3, 5, 10]), k = B === 10 ? ri(rng, 1, 4) : ri(rng, 2, B === 2 ? 6 : 4);
      return {
        prompt: `Evaluate: ${M(`\\log_{${B}} ${B ** k}`)}`, answer: M(k),
        wrong: [
          [M(B ** k / B), 'A logarithm gives an exponent, not the number divided by the base.'],
          [M(k + 1), `Check: ${B}^${k + 1} = ${B ** (k + 1)}, not ${B ** k}.`],
          [M(B * k), 'The answer is the exponent itself.'],
          [M(k - 1), `Check: ${B}^${k - 1} = ${B ** (k - 1)}, not ${B ** k}.`]
        ],
        hint: `Ask: ${B} to what power gives ${B ** k}?`,
        steps: [`${M(`${B}^{${k}} = ${B ** k}`)}`, `So ${M(`\\log_{${B}} ${B ** k} = ${k}`)}.`]
      };
    },
    rng => {
      const B = ri(rng, 2, 5), k = ri(rng, 2, 4);
      return {
        prompt: `Solve for ${M('x')}: ${M(`\\log_{${B}} x = ${k}`)}`, answer: M(`x = ${B ** k}`),
        wrong: [
          [M(`x = ${B * k}`), `log_b x = k means x = b^k, not b · k.`],
          [M(`x = ${k ** B}`), 'The base of the logarithm is the base of the power.'],
          [M(`x = ${B ** (k - 1)}`), 'Recheck the exponent.'],
          [M(`x = ${B + k}`), 'Rewrite in exponential form instead of adding.']
        ],
        hint: `Rewrite the logarithm in exponential form: \\(\\log_b x = k\\) means \\(b^{k} = x\\).`,
        steps: [`${M(`\\log_{${B}} x = ${k} \\Rightarrow x = ${B}^{${k}}`)}`, `${M(`x = ${B ** k}`)}`]
      };
    },
    rng => {
      const B = pick(rng, [2, 3]), p = ri(rng, 1, 3), q = ri(rng, 2, 4);
      return {
        prompt: `Evaluate: ${M(`\\log_{${B}} ${B ** p} + \\log_{${B}} ${B ** q}`)}`, answer: M(p + q),
        wrong: [
          [M(p * q), 'The two logarithms are added, so add their values.'],
          [M(p + q + 1), 'Recheck each logarithm separately.'],
          [M(B ** p + B ** q), 'Evaluate the logarithms, not the numbers inside them.'],
          [M(q - p), 'The logarithms are added, not subtracted.']
        ],
        hint: 'Evaluate each logarithm on its own, or use log a + log b = log(ab).',
        steps: [`${M(`\\log_{${B}} ${B ** p} = ${p}`)} and ${M(`\\log_{${B}} ${B ** q} = ${q}`)}.`, `Sum: ${M(`${p} + ${q} = ${p + q}`)}.`]
      };
    },
    rng => {
      // Base and exponent must differ, or swapping them would look the same.
      const B = pick(rng, [2, 3, 4, 5]); let k = ri(rng, 2, 4); while (k === B) k = ri(rng, 2, 4);
      const N = B ** k;
      return {
        prompt: `Which is the logarithmic form of ${M(`${B}^{${k}} = ${N}`)}?`, answer: M(`\\log_{${B}} ${N} = ${k}`),
        wrong: [
          [M(`\\log_{${k}} ${N} = ${B}`), 'The base of the power stays the base of the logarithm.'],
          [M(`\\log_{${N}} ${B} = ${k}`), 'The result of the power goes inside the logarithm, not into the base.'],
          [M(`\\log_{${B}} ${k} = ${N}`), 'The logarithm’s value is the exponent, not the result.']
        ],
        hint: `\\(b^{k} = N\\) becomes \\(\\log_{b} N = k\\). The base stays the base.`,
        steps: [`Base ${M(B)}, exponent ${M(k)}, result ${M(N)}.`, `${M(`\\log_{${B}} ${N} = ${k}`)}`]
      };
    }
  ],
  GM9: [
    rng => {
      const P = pick(rng, [10000, 15000, 20000, 25000, 50000]), r = pick(rng, [2, 3, 4, 5, 6, 8]), t = ri(rng, 2, 5);
      const I = P * r * t / 100;
      return {
        prompt: `Find the simple interest on ${peso(P)} at ${M(`${r}\\%`)} per year for ${t} years.`, answer: peso(I),
        wrong: [
          [peso(P * r / 100), `That is the interest for one year. Multiply by t = ${t}.`],
          [peso(P + I), 'That is the maturity value (principal + interest), not the interest.'],
          [peso(I * 10), `Write the rate as a decimal: ${r}% = ${r / 100}.`],
          [peso(I / 2), 'Recheck the multiplication.']
        ],
        hint: 'Use I = Prt, with r written as a decimal and t in years.',
        steps: [`${M(`I = Prt`)}`, `${M(`I = ${P} \\times ${r / 100} \\times ${t} = ${I}`)}, so ${peso(I)}.`]
      };
    },
    rng => {
      const P = pick(rng, [10000, 20000, 30000, 40000]), r = pick(rng, [3, 4, 5, 6]), t = ri(rng, 2, 4);
      const F = P * (1 + r * t / 100);
      return {
        prompt: `${peso(P)} is invested at ${M(`${r}\\%`)} simple interest for ${t} years. What is the maturity value?`, answer: peso(F),
        wrong: [
          [peso(P * r * t / 100), 'That is only the interest. Add the principal.'],
          [peso(P * (1 + r / 100) ** t), 'That is compound interest. This question uses simple interest.'],
          [peso(P * (1 + r / 100)), `Multiply the rate by the number of years (${t}).`],
          [peso(P + P * r / 100), `Interest is earned for all ${t} years.`]
        ],
        hint: 'Maturity value F = P + I = P(1 + rt).',
        steps: [`${M('F = P(1 + rt)')}`, `${M(`F = ${P}(1 + ${r / 100} \\times ${t}) = ${F}`)}, so ${peso(F)}.`]
      };
    },
    rng => {
      const P = pick(rng, [10000, 20000, 50000]), r = pick(rng, [5, 10]), t = pick(rng, [2, 3]);
      const F = P * (1 + r / 100) ** t;
      return {
        prompt: `${peso(P)} is deposited at ${M(`${r}\\%`)} compounded annually. How much is in the account after ${t} years?`, answer: peso(F),
        wrong: [
          [peso(P * (1 + r * t / 100)), 'That is simple interest. Compound interest also earns interest on earlier interest.'],
          [peso(F - P), 'That is only the interest earned. Include the principal.'],
          [peso(P * (1 + r / 100) ** (t + 1)), `Use exponent t = ${t}.`],
          [peso(P * r * t / 100), 'That is simple interest only.']
        ],
        hint: 'Compound amount: F = P(1 + r)^t.',
        steps: [`${M('F = P(1 + r)^{t}')}`, `${M(`F = ${P}(1 + ${r / 100})^{${t}} = ${P} \\times ${(1 + r / 100) ** t}`)}`, `So ${peso(F)}.`]
      };
    }
  ],
  GM10: [
    rng => {
      const R = pick(rng, [1000, 2000, 5000]), rate = pick(rng, [5, 10]), n = ri(rng, 2, 4), j = rate / 100;
      const F = R * ((1 + j) ** n - 1) / j;
      return {
        prompt: `A student deposits ${peso(R)} at the end of each year for ${n} years into an account earning ${M(`${rate}\\%`)} compounded annually. What is the future value of these deposits?`,
        answer: peso(F),
        wrong: [
          [peso(R * n), 'That adds the deposits but ignores the interest they earn.'],
          [peso(R * (1 + j) ** n), 'That is the value of a single deposit, not a series of deposits.'],
          [peso(F * (1 + j)), 'That would be an annuity due (payments at the beginning of each period).'],
          [peso(F - R), 'Recheck the formula: every payment counts.']
        ],
        hint: `Future value of an ordinary annuity: \\(F = R\\cdot\\frac{(1 + j)^{n} - 1}{j}\\).`,
        steps: [`${M('F = R\\cdot\\frac{(1 + j)^{n} - 1}{j}')}`, `${M(`F = ${R}\\cdot\\frac{(1 + ${j})^{${n}} - 1}{${j}}`)}`, `So ${peso(F)}.`]
      };
    },
    rng => {
      const R = pick(rng, [1100, 2000, 5000]), rate = pick(rng, [5, 10]), n = ri(rng, 2, 3), j = rate / 100;
      const P = R * (1 - (1 + j) ** -n) / j;
      return {
        prompt: `What is the present value of ${n} yearly payments of ${peso(R)}, made at the end of each year, at ${M(`${rate}\\%`)} compounded annually?`,
        answer: peso(P),
        wrong: [
          [peso(R * n), 'That ignores the time value of money: future payments are worth less today.'],
          [peso(R * ((1 + j) ** n - 1) / j), 'That is the future value, not the present value.'],
          [peso(R * n / (1 + j) ** n), 'Each payment is discounted by its own number of periods.'],
          [peso(P * (1 + j)), 'That would be an annuity due.']
        ],
        hint: `Present value of an ordinary annuity: \\(P = R\\cdot\\frac{1 - (1 + j)^{-n}}{j}\\).`,
        steps: [`${M('P = R\\cdot\\frac{1 - (1 + j)^{-n}}{j}')}`, `${M(`P = ${R}\\cdot\\frac{1 - (1 + ${j})^{-${n}}}{${j}}`)}`, `So ${peso(P)}.`]
      };
    },
    rng => {
      const q = pick(rng, [
        ['An annuity whose payments are made at the beginning of each period is called', 'an annuity due',
          [['an ordinary annuity', 'Ordinary annuity payments are at the end of each period.'], ['a deferred annuity', 'A deferred annuity starts its payments later.'], ['a perpetuity', 'A perpetuity has payments that never end.']], 'Think about when each payment happens.'],
        ['An annuity whose first payment starts only after several periods is called', 'a deferred annuity',
          [['an annuity due', 'An annuity due pays at the beginning of each period, starting now.'], ['an ordinary annuity', 'An ordinary annuity starts paying at the end of the first period.'], ['a simple interest loan', 'That is a loan, not a series of payments.']], 'The payments are postponed.'],
        ['An annuity whose payments are made at the end of each period is called', 'an ordinary annuity',
          [['an annuity due', 'An annuity due pays at the beginning of each period.'], ['a deferred annuity', 'A deferred annuity starts its payments later.'], ['a perpetuity', 'A perpetuity has payments that never end.']], 'This is the most common kind of annuity.']
      ]);
      return { prompt: `${q[0]} ____.`, answer: q[1], wrong: q[2], hint: q[3], steps: [`The answer is ${q[1]}.`] };
    }
  ]
};

/*
 * Track subjects. Math topics (Statistics, Pre-Calculus, Basic Calculus,
 * Business Math) use generators; the science, HUMSS, ABM and DRRR banks
 * mix generators with curated pools. A BANK entry is either an array of
 * generator functions or { pool: [spec, …] }.
 */
{
  const H = { ri, nz, pick, shuffle, frac, M, D, tf, par, pm, tpoly, tlin, peso, pesoInt, commas };
  const extra = require('./questions-tracks.js')(H);
  Object.assign(BANK, extra.BANK);
  Object.assign(IDEAS, extra.IDEAS);
  [require('./bank-science.js')(H), require('./bank-humss.js')(H), require('./bank-abm.js')(H)].forEach(bank => {
    Object.entries(bank).forEach(([id, def]) => {
      BANK[id] = def.gens || { pool: def.pool };
      IDEAS[id] = def.idea;
      HINTS[id] = def.hint;
    });
  });
}

const isGenerated = skillId => Array.isArray(BANK[skillId]);

// Curated questions of a topic with their stable ids ("CW1#3"); null for generated topics.
function builtinItems(skillId) {
  const e = BANK[skillId];
  return e && !Array.isArray(e) ? e.pool.map((spec, i) => ({ id: `${skillId}#${i + 1}`, spec })) : null;
}

function noQuestions(skillId) {
  const e = new Error(`No active questions for ${skillId}. A teacher can add some in the question bank.`);
  e.status = 409;
  return e;
}

/*
 * n items for a topic. `extra` carries the school's question-bank changes:
 *   overrides  { builtinId: { active, spec|null } }  edits or hides built-in questions
 *   customs    [{ id, spec }]                        teacher-written questions
 * Curated topics draw from the edited pool plus custom questions; generated
 * topics mix in custom questions for up to half of the set.
 */
function generateSet(skillId, n, rng = Math.random, extra = {}) {
  const entry = BANK[skillId];
  if (!entry) throw new Error(`No questions for skill ${skillId}`);
  const overrides = extra.overrides || {};
  const customs = (extra.customs || []).map(c => ({ id: c.id, spec: c.spec }));
  const build = ({ id, spec }) => ({ ...makeItem(spec, rng, skillId), id });
  if (!Array.isArray(entry)) {
    const pool = builtinItems(skillId)
      .map(b => (overrides[b.id] ? { id: b.id, spec: overrides[b.id].spec || b.spec, active: overrides[b.id].active } : { ...b, active: true }))
      .filter(b => b.active)
      .concat(customs);
    if (!pool.length) throw noQuestions(skillId);
    const order = shuffle(rng, pool);
    return Array.from({ length: n }, (_, i) => build(order[i % order.length]));
  }
  const out = [], prompts = new Set();
  for (let tries = 0; out.length < n && tries < n * 20; tries++) {
    const item = { ...makeItem(pick(rng, entry)(rng), rng, skillId), id: null };
    if (prompts.has(item.prompt) && tries < n * 15) continue;
    prompts.add(item.prompt);
    out.push(item);
  }
  if (customs.length && n > 1) {
    shuffle(rng, customs).slice(0, Math.floor(n / 2)).forEach((c, i) => { out[i] = build(c); });
    return shuffle(rng, out);
  }
  return out;
}

const generate = (skillId, rng = Math.random) => generateSet(skillId, 1, rng)[0];

/*
 * Checks a teacher-written question and returns it in the bank's format:
 * { prompt, answer, wrong: [[text, why] ×3], hint, steps: [explanation] }.
 * Math must be valid LaTeX between \( \) so it renders for students.
 */
function checkSpec(input) {
  const katex = require('katex');
  const MT = require('../public/js/mathtext.js');
  const txt = (v, name, min, max) => {
    const s = typeof v === 'string' ? v.trim() : '';
    if (s.length < min || s.length > max) throw Object.assign(new Error(`${name} must be ${min}–${max} characters.`), { status: 400 });
    return s;
  };
  const wrongs = Array.isArray(input.wrong) ? input.wrong : [];
  if (wrongs.length !== 3) throw Object.assign(new Error('Give exactly three wrong options.'), { status: 400 });
  const spec = {
    prompt: txt(input.prompt, 'Question', 5, 1500),
    answer: txt(input.answer, 'Correct answer', 1, 400),
    wrong: wrongs.map((w, i) => [txt(w && w[0], `Wrong option ${i + 1}`, 1, 400), txt((w && w[1]) || '', `Why option ${i + 1} is wrong`, 0, 600)]),
    hint: txt(input.hint || '', 'Hint', 0, 400) || undefined,
    // One step of the worked solution per line.
    steps: txt(input.explanation, 'Explanation', 3, 2000).split(/\n+/).map(s => s.trim()).filter(Boolean)
  };
  const all = [spec.prompt, spec.answer, ...spec.wrong.flat(), spec.hint || '', ...spec.steps];
  if (new Set([spec.answer, ...spec.wrong.map(w => w[0])]).size !== 4) throw Object.assign(new Error('The four options must all be different.'), { status: 400 });
  all.forEach(s => {
    if ((s.match(/\\\(/g) || []).length !== (s.match(/\\\)/g) || []).length) throw Object.assign(new Error('Every \\( must have a matching \\).'), { status: 400 });
    MT.segments(s).forEach(p => {
      if (p.math === undefined) return;
      try { katex.renderToString(p.math, { throwOnError: true }); } catch (e) { throw Object.assign(new Error(`This math does not render: ${p.math}`), { status: 400 }); }
    });
  });
  return spec;
}

module.exports = { BANK, IDEAS, HINTS, generate, generateSet, builtinItems, isGenerated, checkSpec, helpers: { frac, tf, tpoly, tlin, peso, commas, makeItem } };
