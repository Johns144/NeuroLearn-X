/*
 * NeuroLearn-X — item generators for the track subjects:
 * Statistics and Probability (all tracks), Pre-Calculus and Basic Calculus
 * (STEM), Business Mathematics (ABM), and the two Junior High foundations
 * they need (probability, data). Same item format as questions.js.
 */
'use strict';

module.exports = function trackBank(H) {
  const { ri, nz, pick, shuffle, frac, M, D, tf, pm, tpoly, tlin, peso } = H;
  const dec = v => String(Math.round(v * 1000) / 1000);
  const zeros = n => Array(Math.max(0, n)).fill(0);
  const mono = (c, e) => tpoly([c, ...zeros(e)]);           // c·x^e
  const xp = e => (e === 1 ? 'x' : `x^{${e}}`);
  const pw = (base, e) => (e === 1 ? `(${base})` : `(${base})^{${e}}`);
  const pct = v => M(`${dec(v)}\\%`);
  // Four probabilities (in hundredths, multiples of 5, each at least 5) summing to 100.
  function dist4(rng) {
    for (;;) {
      const a = ri(rng, 1, 12) * 5, b = ri(rng, 1, 12) * 5, c = ri(rng, 1, 12) * 5, d = 100 - a - b - c;
      if (d >= 5) return [a, b, c, d];
    }
  }
  const p2 = h => dec(h / 100);

  const IDEAS = {
    J10: `Probability = favourable outcomes ÷ all possible outcomes, and \\(P(\\text{not } A) = 1 - P(A)\\).`,
    J11: 'The mean is the total divided by the count; the median is the middle value of the sorted data.',
    SP1: 'In a probability distribution every probability is between 0 and 1, and they add up to exactly 1.',
    SP2: `\\(E(X) = \\sum x\\,P(x)\\) and \\(\\operatorname{Var}(X) = E(X^{2}) - [E(X)]^{2}\\).`,
    SP3: `A z-score counts standard deviations from the mean: \\(z = \\frac{x - \\mu}{\\sigma}\\).`,
    SP4: `Sample means centre on \\(\\mu\\) and vary less than single values: \\(\\sigma_{\\bar{x}} = \\frac{\\sigma}{\\sqrt{n}}\\).`,
    SP5: `A confidence interval is \\(\\bar{x} \\pm z\\cdot\\frac{\\sigma}{\\sqrt{n}}\\); 95% uses \\(z = 1.96\\).`,
    PC1: `A circle with center \\((h, k)\\) and radius \\(r\\) is \\((x - h)^{2} + (y - k)^{2} = r^{2}\\).`,
    PC2: `Arithmetic: add \\(d\\) each time, \\(S_n = \\frac{n}{2}(a_1 + a_n)\\). Geometric: multiply by \\(r\\), \\(a_n = a_1 r^{n-1}\\).`,
    PC3: `\\(\\pi\\) radians \\(= 180^{\\circ}\\), so multiply degrees by \\(\\frac{\\pi}{180}\\).`,
    PC4: 'Exact values come from the 30-60-90 and 45-45-90 triangles.',
    PC5: `\\(\\sin^{2}\\theta + \\cos^{2}\\theta = 1\\), and the other identities follow from it.`,
    BC1: 'Try substitution first; if it gives 0/0, factor and cancel, then substitute.',
    BC2: `Power rule: \\(\\frac{d}{dx}x^{n} = nx^{n-1}\\); constants have derivative 0.`,
    BC3: `Product rule \\((uv)' = u'v + uv'\\); chain rule: derivative of the outside times the derivative of the inside.`,
    BC4: `Antidifferentiate by raising the exponent and dividing by it: \\(\\int x^{n}dx = \\frac{x^{n+1}}{n+1} + C\\).`,
    BM1: 'To change a fraction or decimal to a percent, multiply by 100.',
    BM2: 'Markup adds a percent of the cost; markdown subtracts a percent of the price.',
    BM3: 'Commission = rate × sales; graduated rates apply only to the amount in each bracket.',
    BM4: 'Gross pay = regular pay + overtime pay; overtime on regular days is 125% of the hourly rate.'
  };

  const BANK = {
    J10: [
      rng => {
        const r = ri(rng, 1, 6), b = ri(rng, 1, 6), g = ri(rng, 1, 6), T = r + b + g, ans = frac(r, T);
        return {
          prompt: `A bag has ${r} red, ${b} blue and ${g} green marbles. One marble is drawn at random. What is ${M('P(\\text{red})')}?`,
          answer: M(tf(ans)),
          wrong: [
            [M(tf(frac(r, T - r))), 'That compares red with the other marbles (odds). Probability compares red with all the marbles.'],
            [M(tf(frac(T - r, T))), 'That is the probability of NOT drawing red.'],
            [M(tf(frac(1, 3))), 'The colours are not equally likely; count the marbles of each colour.'],
            [M(tf(frac(r, T + 1))), `Recheck the total: ${r} + ${b} + ${g} = ${T}.`]
          ],
          hint: 'Probability = number of red marbles ÷ total number of marbles.',
          steps: [`Total marbles: ${M(`${r} + ${b} + ${g} = ${T}`)}.`, `${M(`P(\\text{red}) = \\frac{${r}}{${T}}${tf(ans) !== `\\frac{${r}}{${T}}` ? ` = ${tf(ans)}` : ''}`)}`]
        };
      },
      rng => {
        const k = ri(rng, 1, 4), outs = [];
        for (let i = k + 1; i <= 6; i++) outs.push(i);
        return {
          prompt: `A fair die is rolled once. What is the probability of rolling a number greater than ${k}?`,
          answer: M(tf(frac(6 - k, 6))),
          wrong: [
            [M(tf(frac(7 - k, 6))), `“Greater than ${k}” does not include ${k} itself.`],
            [M(tf(frac(k, 6))), `That counts the numbers up to ${k}, not above it.`],
            [M(tf(frac(6 - k, 12))), 'A die has 6 outcomes, not 12.']
          ],
          hint: 'List the outcomes greater than the number, then divide by 6.',
          steps: [`Outcomes greater than ${k}: ${M(`\\{${outs.join(', ')}\\}`)}, that is ${6 - k} outcomes.`, `${M(`P = \\frac{${6 - k}}{6} = ${tf(frac(6 - k, 6))}`)}`]
        };
      },
      rng => {
        const p = ri(rng, 3, 9) * 5;
        return {
          prompt: `The probability that it rains tomorrow is ${M(p2(p))}. What is the probability that it does NOT rain?`,
          answer: M(p2(100 - p)),
          wrong: [
            [M(p2(p)), 'That is the probability that it does rain.'],
            [M(p2(100 + p)), 'A probability can never be more than 1. Subtract from 1 instead.'],
            [M(p2(90 - p)), 'Recheck the subtraction from 1.']
          ],
          hint: `\\(P(\\text{not } A) = 1 - P(A)\\).`,
          steps: [`${M(`P(\\text{no rain}) = 1 - ${p2(p)} = ${p2(100 - p)}`)}`]
        };
      }
    ],
    J11: [
      rng => {
        let vals;
        do { vals = Array.from({ length: 5 }, () => ri(rng, 2, 20)); } while (vals.reduce((a, b) => a + b, 0) % 5 !== 0);
        const sum = vals.reduce((a, b) => a + b, 0), mean = sum / 5, med = [...vals].sort((a, b) => a - b)[2];
        return {
          prompt: `Find the mean of ${M(vals.join(',\\ '))}.`, answer: M(mean),
          wrong: [
            [M(med), 'That is the median (the middle value when sorted), not the mean.'],
            [M(sum), 'That is the total. Divide it by how many values there are.'],
            [M(dec(sum / 4)), 'There are 5 values, so divide by 5.'],
            [M(Math.max(...vals) - Math.min(...vals)), 'That is the range (largest minus smallest).']
          ],
          hint: 'Add all the values, then divide by how many there are.',
          steps: [`Add: ${M(`${vals.join(' + ')} = ${sum}`)}.`, `Divide by 5: ${M(`\\frac{${sum}}{5} = ${mean}`)}.`]
        };
      },
      rng => {
        const shown = shuffle(rng, Array.from({ length: 30 }, (_, i) => i + 1)).slice(0, 6);
        const s = [...shown].sort((a, b) => a - b);
        const med = (s[2] + s[3]) / 2;
        return {
          prompt: `Find the median of ${M(shown.join(',\\ '))}.`, answer: M(dec(med)),
          wrong: [
            [M(s[2]), 'With an even number of values, the median is the average of the two middle values.'],
            [M(s[3]), 'With an even number of values, the median is the average of the two middle values.'],
            [M(dec((shown[2] + shown[3]) / 2)), 'Sort the values from smallest to largest first.'],
            [M(dec(shown.reduce((a, b) => a + b, 0) / 6)), 'That is the mean, not the median.']
          ],
          hint: 'Sort the values. With 6 values, average the 3rd and 4th.',
          steps: [`Sorted: ${M(s.join(',\\ '))}.`, `Middle two: ${M(s[2])} and ${M(s[3])}, so the median is ${M(`\\frac{${s[2]} + ${s[3]}}{2} = ${dec(med)}`)}.`]
        };
      }
    ],
    SP1: [
      rng => {
        const p = dist4(rng), i = ri(rng, 0, 3);
        const cells = p.map((h, j) => (j === i ? '?' : p2(h))).join(' & ');
        const given = p.filter((_, j) => j !== i).map(p2);
        return {
          prompt: `The table shows the probability distribution of ${M('X')}. What is the missing probability?${D(`\\begin{array}{c|cccc} x & 0 & 1 & 2 & 3 \\\\ \\hline P(X = x) & ${cells} \\end{array}`)}`,
          answer: M(p2(p[i])),
          wrong: [
            [M(p2(100 - p[i])), 'That is the total of the given probabilities. The missing one makes the total exactly 1.'],
            [M('0.25'), 'The probabilities need not be equal; they must add up to 1.'],
            [M(p2(p[i] + 10)), 'Recheck the subtraction: the four probabilities must total 1.'],
            [M(p2(Math.max(1, p[i] - 5))), 'Recheck the subtraction: the four probabilities must total 1.']
          ],
          hint: 'All the probabilities in a distribution add up to 1.',
          steps: ['The probabilities must add up to 1.', `${M(`1 - (${given.join(' + ')}) = ${p2(p[i])}`)}`]
        };
      },
      rng => {
        let a, b; do { a = ri(rng, 1, 7); b = ri(rng, 1, 8 - a); } while (10 - a - b < 1);
        const ok = [a, b, 10 - a - b].map(v => dec(v / 10));
        const list = arr => M(`${arr.join(',\\ ')}`);
        return {
          prompt: `Which list could be the probabilities of all the values of a discrete random variable?`,
          answer: list(ok),
          wrong: [
            [list([dec((a + 1) / 10), dec(b / 10), dec((10 - a - b) / 10)]), 'These add up to 1.1, not 1.'],
            [list([dec(a / 10), dec(b / 10), dec((12 - a - b) / 10)]), 'These add up to 1.2, not 1.'],
            [list([dec(a / 10), dec(b / 10), dec((9 - a - b) / 10)]), 'These add up to 0.9, not 1.'],
            [list(['0.6', '0.5', '-0.1']), 'A probability can never be negative.']
          ],
          hint: 'Each probability must be between 0 and 1, and together they must add up to 1.',
          steps: [`${M(`${ok.join(' + ')} = 1`)}, and every value is between 0 and 1.`, 'So this list is a valid probability distribution.']
        };
      }
    ],
    SP2: [
      rng => {
        const p = dist4(rng);
        const E = (p[1] + 2 * p[2] + 3 * p[3]) / 100;
        return {
          prompt: `Find ${M('E(X)')} for the distribution below.${D(`\\begin{array}{c|cccc} x & 0 & 1 & 2 & 3 \\\\ \\hline P(X = x) & ${p.map(p2).join(' & ')} \\end{array}`)}`,
          answer: M(dec(E)),
          wrong: [
            [M(1), 'That is the sum of the probabilities, which is always 1.'],
            [M(1.5), 'Each value must be weighted by its probability; the plain average of 0, 1, 2, 3 ignores them.'],
            [M(dec(E + 1)), 'The values of X are 0, 1, 2 and 3; check each product x · P(X = x).'],
            [M(dec(E + 0.5)), 'Recheck each product x · P(X = x).']
          ],
          hint: `Multiply each value by its probability and add: \\(E(X) = \\sum x\\,P(x)\\).`,
          steps: [`${M('E(X) = \\sum x \\cdot P(x)')}`, `${M(`= 0(${p2(p[0])}) + 1(${p2(p[1])}) + 2(${p2(p[2])}) + 3(${p2(p[3])}) = ${dec(E)}`)}`]
        };
      },
      rng => {
        const m = ri(rng, 10, 25), v = ri(rng, 20, 150), e = m * m + v;
        return {
          prompt: `A random variable has ${M(`E(X) = ${dec(m / 10)}`)} and ${M(`E(X^{2}) = ${dec(e / 100)}`)}. Find ${M('\\operatorname{Var}(X)')}.`,
          answer: M(dec(v / 100)),
          wrong: [
            [M(dec(e / 100 - m / 10)), 'Square the mean before subtracting: Var(X) = E(X²) − [E(X)]².'],
            [M(dec((m * m - e) / 100)), 'Subtract in the right order: E(X²) − [E(X)]².'],
            [M(dec(Math.round(Math.sqrt(v / 100) * 100) / 100)), 'That is the standard deviation, the square root of the variance.']
          ],
          hint: `\\(\\operatorname{Var}(X) = E(X^{2}) - [E(X)]^{2}\\).`,
          steps: [`${M('\\operatorname{Var}(X) = E(X^{2}) - [E(X)]^{2}')}`, `${M(`= ${dec(e / 100)} - (${dec(m / 10)})^{2} = ${dec(e / 100)} - ${dec(m * m / 100)} = ${dec(v / 100)}`)}`]
        };
      }
    ],
    SP3: [
      rng => {
        const mu = ri(rng, 10, 17) * 5, s = pick(rng, [4, 6, 8, 10]), z = pick(rng, [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5]), x = mu + z * s;
        return {
          prompt: `Test scores have mean ${M(`\\mu = ${mu}`)} and standard deviation ${M(`\\sigma = ${s}`)}. What is the z-score of a score of ${M(x)}?`,
          answer: M(`z = ${dec(z)}`),
          wrong: [
            [M(`z = ${dec(-z)}`), 'Subtract the mean from the score (x − μ), not the other way round.'],
            [M(`z = ${dec(x - mu)}`), 'Divide the difference by the standard deviation.'],
            [M(`z = ${dec(z / s)}`), 'Divide by σ, not by σ².'],
            [M(`z = ${dec(z + 1)}`), 'Recheck the division.']
          ],
          hint: `\\(z = \\frac{x - \\mu}{\\sigma}\\).`,
          steps: [`${M('z = \\frac{x - \\mu}{\\sigma}')}`, `${M(`z = \\frac{${x} - ${mu}}{${s}} = \\frac{${x - mu}}{${s}} = ${dec(z)}`)}`]
        };
      },
      rng => {
        const k = ri(rng, 1, 3), vals = { 1: 68, 2: 95, 3: 99.7 };
        const others = [1, 2, 3].filter(j => j !== k);
        return {
          prompt: `In a normal distribution, about what percent of the data lie within ${k} standard deviation${k > 1 ? 's' : ''} of the mean?`,
          answer: pct(vals[k]),
          wrong: [
            ...others.map(j => [pct(vals[j]), `That is the percent within ${j} standard deviation${j > 1 ? 's' : ''}.`]),
            [pct(50), 'Half of the data lie below the mean; this question asks about a band around the mean.']
          ],
          hint: 'Use the 68–95–99.7 rule.',
          steps: ['The empirical rule: about 68%, 95% and 99.7% of the data lie within 1, 2 and 3 standard deviations of the mean.', `So within ${k}: ${pct(vals[k])}.`]
        };
      }
    ],
    SP4: [
      rng => {
        const s = pick(rng, [6, 8, 10, 12, 15, 20, 24, 30]), n = pick(rng, [4, 9, 16, 25, 36, 64, 100]), r = Math.sqrt(n);
        return {
          prompt: `A population has ${M(`\\sigma = ${s}`)}. What is the standard error of the mean for samples of size ${M(`n = ${n}`)}?`,
          answer: M(dec(s / r)),
          wrong: [
            [M(dec(s / n)), 'Divide by the square root of n, not by n.'],
            [M(dec(s * r)), 'Sample means vary less than single values, so divide by √n.'],
            [M(s), 'That is the population standard deviation, not the standard error.']
          ],
          hint: `\\(\\sigma_{\\bar{x}} = \\frac{\\sigma}{\\sqrt{n}}\\).`,
          steps: [`${M('\\sigma_{\\bar{x}} = \\frac{\\sigma}{\\sqrt{n}}')}`, `${M(`= \\frac{${s}}{\\sqrt{${n}}} = \\frac{${s}}{${r}} = ${dec(s / r)}`)}`]
        };
      },
      rng => {
        const mu = ri(rng, 20, 90), n = pick(rng, [4, 9, 16, 25]);
        return {
          prompt: `A population has mean ${M(`\\mu = ${mu}`)}. Many random samples of size ${M(`n = ${n}`)} are taken. What is the mean of the sample means?`,
          answer: M(mu),
          wrong: [
            [M(dec(mu / n)), 'The mean of the sample means equals μ; only their spread depends on n.'],
            [M(dec(mu / Math.sqrt(n))), 'Dividing by √n applies to the standard deviation of the sample means, not their mean.'],
            [M(mu * n), 'Sample means centre on μ; nothing is multiplied by n.']
          ],
          hint: 'Sample means centre on the population mean.',
          steps: [`${M('\\mu_{\\bar{x}} = \\mu')}`, `So the mean of the sample means is ${M(mu)}.`]
        };
      }
    ],
    SP5: [
      rng => {
        const xb = ri(rng, 50, 90), [s, n] = pick(rng, [[10, 25], [12, 36], [15, 25], [20, 16], [10, 100], [18, 36]]);
        const se = s / Math.sqrt(n), E = 1.96 * se;
        const ci = e => M(`(${dec(xb - e)},\\ ${dec(xb + e)})`);
        return {
          prompt: `A sample of ${M(`n = ${n}`)} has mean ${M(`\\bar{x} = ${xb}`)}. The population has ${M(`\\sigma = ${s}`)}. Find the 95% confidence interval for ${M('\\mu')}.`,
          answer: ci(E),
          wrong: [
            [ci(1.96 * s), 'Use the standard error σ/√n, not σ.'],
            [ci(1.645 * se), 'For 95% confidence use z = 1.96; 1.645 is for 90%.'],
            [ci(se), 'Multiply the standard error by z = 1.96.']
          ],
          hint: `\\(\\bar{x} \\pm 1.96\\cdot\\frac{\\sigma}{\\sqrt{n}}\\).`,
          steps: [`Standard error: ${M(`\\frac{${s}}{\\sqrt{${n}}} = ${dec(se)}`)}.`, `Margin of error: ${M(`E = 1.96 \\times ${dec(se)} = ${dec(E)}`)}.`, `${M(`${xb} \\pm ${dec(E)}`)} gives ${ci(E)}.`]
        };
      },
      rng => {
        const [lvl, z] = pick(rng, [[90, 1.645], [95, 1.96], [99, 2.576]]), [s, n] = pick(rng, [[10, 25], [12, 16], [20, 100], [15, 9]]);
        const se = s / Math.sqrt(n);
        const others = [[90, 1.645], [95, 1.96], [99, 2.576]].filter(o => o[0] !== lvl);
        return {
          prompt: `Find the margin of error for a ${lvl}% confidence interval when ${M(`\\sigma = ${s}`)} and ${M(`n = ${n}`)}.`,
          answer: M(`E = ${dec(z * se)}`),
          wrong: [
            ...others.map(([l, zz]) => [M(`E = ${dec(zz * se)}`), `That uses z = ${zz}, the value for ${l}% confidence.`]),
            [M(`E = ${dec(z * s / n)}`), 'Divide σ by √n, not by n.']
          ],
          hint: `\\(E = z\\cdot\\frac{\\sigma}{\\sqrt{n}}\\), with \\(z = 1.645, 1.96, 2.576\\) for 90%, 95%, 99%.`,
          steps: [`For ${lvl}% confidence, ${M(`z = ${z}`)}.`, `${M(`E = ${z} \\times \\frac{${s}}{\\sqrt{${n}}} = ${z} \\times ${dec(se)} = ${dec(z * se)}`)}`]
        };
      }
    ],
    PC1: [
      rng => {
        const h = ri(rng, -6, 6), k = nz(rng, -6, 6), r = ri(rng, 2, 9);
        const sq = (v, c) => (c === 0 ? `${v}^{2}` : `(${tlin(1, -c, v)})^{2}`);
        const desc = (a, b, rad) => `Center ${M(`(${a}, ${b})`)}, radius ${M(rad)}`;
        return {
          prompt: `Find the center and radius of the circle ${M(`${sq('x', h)} + ${sq('y', k)} = ${r * r}`)}.`,
          answer: desc(h, k, r),
          wrong: [
            [desc(-h, -k, r), 'The center’s coordinates have the opposite signs of the numbers inside the brackets.'],
            [desc(h, k, r * r), `The right side is r², so the radius is √${r * r} = ${r}.`],
            [desc(k, h, r), 'You swapped the x- and y-coordinates of the center.'],
            [desc(-h, -k, r * r), 'Two slips: the signs of the center, and the radius is the square root of the right side.']
          ],
          hint: `Compare with \\((x - h)^{2} + (y - k)^{2} = r^{2}\\).`,
          steps: [`Compare with ${M('(x - h)^{2} + (y - k)^{2} = r^{2}')}.`, `${M(`h = ${h},\\ k = ${k}`)} and ${M(`r^{2} = ${r * r}`)}, so ${M(`r = ${r}`)}.`]
        };
      },
      rng => {
        const h = nz(rng, -6, 6), k = nz(rng, -6, 6), r = ri(rng, 2, 9);
        const eq = (a, b, rhs) => M(`(${tlin(1, -a)})^{2} + (${tlin(1, -b, 'y')})^{2} = ${rhs}`);
        return {
          prompt: `Write the equation of the circle with center ${M(`(${h}, ${k})`)} and radius ${M(r)}.`,
          answer: eq(h, k, r * r),
          wrong: [
            [eq(h, k, r), 'The right side is r², not r.'],
            [eq(-h, -k, r * r), 'Use (x − h) and (y − k): the signs inside are opposite to the center’s coordinates.'],
            [eq(-h, -k, r), 'Two slips: the signs inside the brackets, and the right side must be r².']
          ],
          hint: `\\((x - h)^{2} + (y - k)^{2} = r^{2}\\).`,
          steps: [`${M(`h = ${h},\\ k = ${k},\\ r^{2} = ${r * r}`)}`, `${eq(h, k, r * r)}`]
        };
      }
    ],
    PC2: [
      rng => {
        const a = ri(rng, 1, 10), d = ri(rng, 2, 6), n = ri(rng, 6, 12), an = a + (n - 1) * d, S = n * (a + an) / 2;
        return {
          prompt: `Find the sum of the first ${n} terms of the arithmetic sequence ${M(`${a},\\ ${a + d},\\ ${a + 2 * d},\\ \\ldots`)}.`,
          answer: M(S),
          wrong: [
            [M(an), `That is the ${n}th term, not the sum.`],
            [M(n * a), 'The terms grow by d each time; you added the first term n times.'],
            [M(n * (a + an)), 'Divide by 2: the sum is n/2 times (first + last).']
          ],
          hint: `\\(S_n = \\frac{n}{2}(a_1 + a_n)\\), where \\(a_n = a_1 + (n - 1)d\\).`,
          steps: [`Last term: ${M(`a_{${n}} = ${a} + (${n} - 1)(${d}) = ${an}`)}.`, `${M(`S_{${n}} = \\frac{${n}}{2}(${a} + ${an}) = ${S}`)}`]
        };
      },
      rng => {
        const a = ri(rng, 2, 5), r = ri(rng, 2, 3), n = ri(rng, 4, 6);
        return {
          prompt: `Find the ${n}th term of the geometric sequence ${M(`${a},\\ ${a * r},\\ ${a * r * r},\\ \\ldots`)}.`,
          answer: M(a * r ** (n - 1)),
          wrong: [
            [M(a * r ** n), 'The exponent is n − 1, because the first term has no factor of r.'],
            [M(a + (n - 1) * r), 'That is the arithmetic formula. A geometric sequence multiplies by r each time.'],
            [M((a * r) ** (n - 1)), 'Only r is raised to the power n − 1, not a·r.']
          ],
          hint: `\\(a_n = a_1 r^{n-1}\\).`,
          steps: [`Common ratio ${M(`r = ${r}`)}.`, `${M(`a_{${n}} = ${a} \\cdot ${r}^{${n - 1}} = ${a} \\cdot ${r ** (n - 1)} = ${a * r ** (n - 1)}`)}`]
        };
      },
      rng => {
        const a = ri(rng, 1, 4), r = ri(rng, 2, 3), n = ri(rng, 4, 6), S = a * (r ** n - 1) / (r - 1);
        return {
          prompt: `Find the sum of the first ${n} terms of the geometric sequence ${M(`${a},\\ ${a * r},\\ ${a * r * r},\\ \\ldots`)}.`,
          answer: M(S),
          wrong: [
            [M(a * r ** (n - 1)), 'That is the last term, not the sum.'],
            [M(a * (r ** n - 1)), `Divide by r − 1 = ${r - 1}.`],
            [M(n * a), 'The terms grow; you cannot just multiply the first term by n.']
          ],
          hint: `\\(S_n = \\frac{a_1(r^{n} - 1)}{r - 1}\\).`,
          steps: [`${M(`S_{${n}} = \\frac{${a}(${r}^{${n}} - 1)}{${r} - 1}`)}`, `${M(`= \\frac{${a}(${r ** n - 1})}{${r - 1}} = ${S}`)}`]
        };
      }
    ],
    PC3: [
      rng => {
        const deg = pick(rng, [30, 45, 60, 120, 135, 150, 210, 225, 240, 270, 300, 315, 330]);
        const rad = f => (f.d === 1 ? (f.n === 1 ? '\\pi' : `${f.n}\\pi`) : f.n === 1 ? `\\frac{\\pi}{${f.d}}` : `\\frac{${f.n}\\pi}{${f.d}}`);
        return {
          prompt: `Convert ${M(`${deg}^{\\circ}`)} to radians.`, answer: M(rad(frac(deg, 180))),
          wrong: [
            [M(`${deg}\\pi`), 'Multiply by π/180, not by π alone.'],
            [M(rad(frac(180, deg))), 'You used the conversion factor upside down: radians = degrees × π/180.'],
            [M(rad(frac(deg, 360))), 'π radians is 180°, not 360°.']
          ],
          hint: `Multiply by \\(\\frac{\\pi}{180}\\).`,
          steps: [`${M(`${deg}^{\\circ} \\times \\frac{\\pi}{180} = \\frac{${deg}\\pi}{180}`)}`, `Simplify: ${M(rad(frac(deg, 180)))}.`]
        };
      },
      rng => {
        const [n, d] = pick(rng, [[1, 6], [1, 4], [1, 3], [2, 3], [3, 4], [5, 6], [7, 6], [5, 4], [4, 3], [3, 2], [5, 3], [7, 4], [11, 6]]);
        const deg = 180 * n / d;
        const rad = n === 1 ? `\\frac{\\pi}{${d}}` : `\\frac{${n}\\pi}{${d}}`;
        return {
          prompt: `Convert ${M(rad)} radians to degrees.`, answer: M(`${deg}^{\\circ}`),
          wrong: [
            [M(`${2 * deg}^{\\circ}`), 'π radians is 180°, not 360°.'],
            [M(`${dec(n / d)}^{\\circ}`), 'Replace π with 180°.'],
            [M(`${Math.abs(180 - deg) || 360}^{\\circ}`), 'That is the difference from 180°, not the converted angle.'],
            [M(`${dec(180 * d / n)}^{\\circ}`), 'You flipped the fraction. Multiply 180° by the fraction in front of π.'],
            [M(`${dec(90 * n / d)}^{\\circ}`), 'π radians is 180°, not 90°.']
          ],
          hint: `Replace \\(\\pi\\) with \\(180^{\\circ}\\).`,
          steps: [`${M(`${rad} = \\frac{${n} \\times 180^{\\circ}}{${d}}`)}`, `${M(`= ${deg}^{\\circ}`)}`]
        };
      }
    ],
    PC4: [
      rng => {
        const V = {
          sin: { 30: '\\frac{1}{2}', 45: '\\frac{\\sqrt{2}}{2}', 60: '\\frac{\\sqrt{3}}{2}' },
          cos: { 30: '\\frac{\\sqrt{3}}{2}', 45: '\\frac{\\sqrt{2}}{2}', 60: '\\frac{1}{2}' },
          tan: { 30: '\\frac{\\sqrt{3}}{3}', 45: '1', 60: '\\sqrt{3}' }
        };
        const fn = pick(rng, ['sin', 'cos', 'tan']), t = pick(rng, [30, 45, 60]), ans = V[fn][t];
        const seen = new Map();
        ['sin', 'cos', 'tan'].forEach(f => [30, 45, 60].forEach(a => { if (!seen.has(V[f][a])) seen.set(V[f][a], `${f} ${a}°`); }));
        const wrong = shuffle(rng, [...seen.entries()].filter(([v]) => v !== ans)).map(([v, where]) => [M(v), `That is the value of ${where}. Rebuild the special triangle to check which ratio you need.`]);
        return {
          prompt: `Find the exact value of ${M(`\\${fn} ${t}^{\\circ}`)}.`, answer: M(ans), wrong,
          hint: `Use the ${t === 45 ? '45-45-90' : '30-60-90'} triangle.`,
          steps: [`The ${t === 45 ? '45-45-90 triangle has sides' : '30-60-90 triangle has sides'} ${t === 45 ? M('1,\\ 1,\\ \\sqrt{2}') : M('1,\\ \\sqrt{3},\\ 2')}.`,
            `${M(`\\${fn} ${t}^{\\circ} = ${fn === 'sin' ? '\\frac{\\text{opposite}}{\\text{hypotenuse}}' : fn === 'cos' ? '\\frac{\\text{adjacent}}{\\text{hypotenuse}}' : '\\frac{\\text{opposite}}{\\text{adjacent}}'} = ${ans}`)}`]
        };
      },
      rng => {
        const Q = { I: 'both sine and cosine are positive', II: 'sine is positive and cosine is negative', III: 'both sine and cosine are negative', IV: 'sine is negative and cosine is positive' };
        const q = pick(rng, Object.keys(Q));
        const cond = { I: '\\sin\\theta > 0 \\text{ and } \\cos\\theta > 0', II: '\\sin\\theta > 0 \\text{ and } \\cos\\theta < 0', III: '\\sin\\theta < 0 \\text{ and } \\cos\\theta < 0', IV: '\\sin\\theta < 0 \\text{ and } \\cos\\theta > 0' }[q];
        return {
          prompt: `In which quadrant does ${M('\\theta')} lie if ${M(cond)}?`, answer: `Quadrant ${q}`,
          wrong: Object.keys(Q).filter(k => k !== q).map(k => [`Quadrant ${k}`, `In Quadrant ${k}, ${Q[k]}.`]),
          hint: 'Sine follows the y-coordinate and cosine the x-coordinate on the unit circle.',
          steps: ['On the unit circle, cos θ is the x-coordinate and sin θ is the y-coordinate.', `${Q[q].charAt(0).toUpperCase() + Q[q].slice(1)} only in Quadrant ${q}.`]
        };
      }
    ],
    PC5: [
      rng => {
        const [a, b, c] = pick(rng, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [4, 3, 5], [12, 5, 13]]);
        return {
          prompt: `If ${M(`\\sin\\theta = \\frac{${a}}{${c}}`)} and ${M('\\theta')} is in Quadrant I, find ${M('\\cos\\theta')}.`,
          answer: M(`\\frac{${b}}{${c}}`),
          wrong: [
            [M(`\\frac{${c}}{${b}}`), 'That is sec θ, the reciprocal of cos θ.'],
            [M(`\\frac{${a}}{${b}}`), 'That is tan θ = sin θ / cos θ.'],
            [M(tf(frac(c - a, c))), 'sin²θ + cos²θ = 1 uses squares; cos θ is not 1 − sin θ.']
          ],
          hint: `Use \\(\\sin^{2}\\theta + \\cos^{2}\\theta = 1\\).`,
          steps: [`${M('\\cos^{2}\\theta = 1 - \\sin^{2}\\theta')}`, `${M(`= 1 - \\left(\\frac{${a}}{${c}}\\right)^{2} = \\frac{${c * c - a * a}}{${c * c}}`)}`, `Quadrant I, so cosine is positive: ${M(`\\cos\\theta = \\frac{${b}}{${c}}`)}.`]
        };
      },
      rng => {
        const pool = [
          ['\\sin^{2}\\theta + \\cos^{2}\\theta', '1'], ['1 + \\tan^{2}\\theta', '\\sec^{2}\\theta'], ['\\frac{\\sin\\theta}{\\cos\\theta}', '\\tan\\theta'],
          ['1 - \\cos^{2}\\theta', '\\sin^{2}\\theta'], ['1 + \\cot^{2}\\theta', '\\csc^{2}\\theta'], ['\\frac{1}{\\cos\\theta}', '\\sec\\theta']
        ];
        const i = ri(rng, 0, pool.length - 1), [expr, ans] = pool[i];
        const others = shuffle(rng, pool.filter((_, j) => j !== i)).slice(0, 3);
        return {
          prompt: `Simplify ${M(expr)}.`, answer: M(ans),
          wrong: others.map(([e, v]) => [M(v), `${M(v)} is equal to ${M(e)}, not to ${M(expr)}.`]),
          hint: `Start from \\(\\sin^{2}\\theta + \\cos^{2}\\theta = 1\\) or the definitions of the ratios.`,
          steps: [`${M(`${expr} = ${ans}`)}`, 'This is one of the fundamental identities.']
        };
      }
    ],
    BC1: [
      rng => {
        const a = ri(rng, 1, 9);
        return {
          prompt: `Evaluate ${M(`\\lim_{x \\to ${a}} \\frac{x^{2} - ${a * a}}{x - ${a}}`)}.`, answer: M(2 * a),
          wrong: [
            [M(0), 'Substituting gives 0/0, which is not 0. Factor and cancel first.'],
            ['The limit does not exist', 'The 0/0 form only means you must simplify first; the limit exists.'],
            [M(a), `After cancelling, substitute into x + ${a}: the result is ${2 * a}.`]
          ],
          hint: 'Substitution gives 0/0. Factor the numerator and cancel.',
          steps: [`${M(`\\frac{x^{2} - ${a * a}}{x - ${a}} = \\frac{(x + ${a})(x - ${a})}{x - ${a}} = x + ${a}`)}`, `${M(`\\lim_{x \\to ${a}} (x + ${a}) = ${2 * a}`)}`]
        };
      },
      rng => {
        const p = ri(rng, 1, 3), q = nz(rng, -5, 5), r = ri(rng, -6, 6), k = nz(rng, -3, 3), v = p * k * k + q * k + r;
        return {
          prompt: `Evaluate ${M(`\\lim_{x \\to ${k}} (${tpoly([p, q, r])})`)}.`, answer: M(v),
          wrong: [
            [M(p * k * k - q * k + r), 'Check the sign of the middle term after substituting.'],
            [M(-p * k * k + q * k + r), 'Squaring never gives a negative result.'],
            [M(2 * p * k + q * k + r), 'x² means x times x, not 2 times x.']
          ],
          hint: 'A polynomial is continuous, so substitute directly.',
          steps: ['Polynomials are continuous, so the limit is the value at the point.', `${M(`${p}(${k})^{2} + (${q})(${k}) + (${r}) = ${v}`)}`]
        };
      },
      rng => {
        const a = ri(rng, 1, 9), c = ri(rng, 2, 9), b = nz(rng, -9, 9), d = nz(rng, -9, 9);
        return {
          prompt: `Evaluate ${M(`\\lim_{x \\to \\infty} \\frac{${tpoly([a, 0, b])}}{${tpoly([c, 0, d])}}`)}.`, answer: M(tf(frac(a, c))),
          wrong: [
            [M(0), 'The degrees are equal, so the limit is the ratio of the leading coefficients, not 0.'],
            [M('\\infty'), 'The degrees are equal, so the limit is finite.'],
            [M(tf(frac(b, d))), 'As x grows, the leading terms dominate, not the constants.'],
            [M(tf(frac(c, a))), 'Divide the numerator’s leading coefficient by the denominator’s.']
          ],
          hint: 'Compare the degrees, then the leading coefficients.',
          steps: ['Numerator and denominator both have degree 2.', `The limit is the ratio of leading coefficients: ${M(`\\frac{${a}}{${c}} = ${tf(frac(a, c))}`)}.`]
        };
      }
    ],
    BC2: [
      rng => {
        const a = ri(rng, 2, 6), n = ri(rng, 3, 5), b = nz(rng, -9, 9), c = nz(rng, -9, 9);
        const f = [a, ...zeros(n - 2), b, c], d = [a * n, ...zeros(n - 2), b];
        return {
          prompt: `Find ${M("f'(x)")} if ${M(`f(x) = ${tpoly(f)}`)}.`, answer: M(`f'(x) = ${tpoly(d)}`),
          wrong: [
            [M(`f'(x) = ${tpoly([a, ...zeros(n - 2), b])}`), `Multiply by the exponent ${n} before lowering it.`],
            [M(`f'(x) = ${tpoly([a * n, ...zeros(n - 1), b, 0].slice(0, n + 1))}`), 'After multiplying by the exponent, lower it by 1.'],
            [M(`f'(x) = ${tpoly(d)} ${pm(c)}`), 'The derivative of a constant is 0.']
          ],
          hint: `Power rule: \\(\\frac{d}{dx}x^{n} = nx^{n-1}\\).`,
          steps: [`${M(`\\frac{d}{dx}\\left(${mono(a, n)}\\right) = ${mono(a * n, n - 1)}`)}`, `${M(`\\frac{d}{dx}\\left(${mono(b, 1)}\\right) = ${b}`)}, and the derivative of ${M(c)} is 0.`, `${M(`f'(x) = ${tpoly(d)}`)}`]
        };
      },
      rng => {
        const b = nz(rng, -8, 8), c = ri(rng, -9, 9), k = nz(rng, -4, 4);
        return {
          prompt: `Find the slope of the tangent line to ${M(`f(x) = ${tpoly([1, b, c])}`)} at ${M(`x = ${k}`)}.`, answer: M(2 * k + b),
          wrong: [
            [M(k * k + b * k + c), 'That is the function value (the height), not the slope.'],
            [M(2 * k), `Include the derivative of ${tpoly([b, 0])}, which is ${b}.`],
            [M(k * k + b), 'Differentiate first: f′(x) = 2x + b, then substitute.']
          ],
          hint: `The slope of the tangent is \\(f'(k)\\).`,
          steps: [`${M(`f'(x) = ${tlin(2, b)}`)}`, `${M(`f'(${k}) = 2(${k}) ${pm(b)} = ${2 * k + b}`)}`]
        };
      }
    ],
    BC3: [
      rng => {
        const a = ri(rng, 2, 5), b = nz(rng, -6, 6), n = ri(rng, 2, 5), inside = tlin(a, b);
        return {
          prompt: `Differentiate ${M(`y = (${inside})^{${n}}`)}.`, answer: M(`y' = ${n * a}${pw(inside, n - 1)}`),
          wrong: [
            [M(`y' = ${n}${pw(inside, n - 1)}`), `Chain rule: also multiply by the derivative of the inside, ${a}.`],
            [M(`y' = ${n * a}${pw(inside, n)}`), 'Lower the outer exponent by 1.'],
            [M(`y' = ${a}${pw(inside, n - 1)}`), `Multiply by the outer exponent ${n} too.`],
            [M(`y' = ${n}${pw(inside, n - 1)} + ${a}`), 'Multiply by the derivative of the inside; do not add it.'],
            [M(`y' = ${n * a}${pw(inside, n + 1)}`), 'The power rule lowers the exponent by 1; it does not raise it.']
          ],
          hint: 'Derivative of the outside (power rule), times the derivative of the inside.',
          steps: [`Outside: ${M(`u^{${n}} \\to ${n}u^{${n - 1}}`)}; inside: ${M(`u = ${inside},\\ u' = ${a}`)}.`, `${M(`y' = ${n}${pw(inside, n - 1)} \\cdot ${a} = ${n * a}${pw(inside, n - 1)}`)}`]
        };
      },
      rng => {
        const m = ri(rng, 2, 4), c = nz(rng, -6, 6);
        const ans = tpoly([m + 1, c * m, ...zeros(m - 1)]);
        return {
          prompt: `Differentiate ${M(`y = ${xp(m)}(${tlin(1, c)})`)}.`, answer: M(`y' = ${ans}`),
          wrong: [
            [M(`y' = ${mono(m, m - 1)}`), "The derivative of a product is not the product of the derivatives. Use (uv)′ = u′v + uv′."],
            [M(`y' = ${tpoly([m, c * m, ...zeros(m - 1)])}`), 'You used only u′v; add uv′ as well.'],
            [M(`y' = ${xp(m)}`), 'You used only uv′; add u′v as well.']
          ],
          hint: `Product rule: \\((uv)' = u'v + uv'\\).`,
          steps: [`${M(`u = ${xp(m)},\\ u' = ${mono(m, m - 1)};\\ v = ${tlin(1, c)},\\ v' = 1`)}`, `${M(`y' = ${mono(m, m - 1)}(${tlin(1, c)}) + ${xp(m)} = ${ans}`)}`]
        };
      }
    ],
    BC4: [
      rng => {
        const n = ri(rng, 1, 4), k = ri(rng, 1, 4), a = k * (n + 1);
        return {
          prompt: `Find ${M(`\\int ${mono(a, n)}\\,dx`)}.`, answer: M(`${mono(k, n + 1)} + C`),
          wrong: [
            [M(`${mono(a * n, n - 1)} + C`), 'That is the derivative. Antidifferentiation raises the exponent and divides by it.'],
            [M(`${mono(a, n + 1)} + C`), `Divide by the new exponent ${n + 1}.`],
            [M(mono(k, n + 1)), 'An indefinite integral needs the constant of integration, + C.']
          ],
          hint: `\\(\\int x^{n}dx = \\frac{x^{n+1}}{n+1} + C\\).`,
          steps: [`${M(`\\int ${mono(a, n)}\\,dx = ${a}\\cdot\\frac{x^{${n + 1}}}{${n + 1}} + C`)}`, `${M(`= ${mono(k, n + 1)} + C`)}`]
        };
      },
      rng => {
        const p = 2 * ri(rng, 1, 5), q = nz(rng, -9, 9);
        return {
          prompt: `Find ${M(`\\int (${tlin(p, q)})\\,dx`)}.`, answer: M(`${tpoly([p / 2, q, 0])} + C`),
          wrong: [
            [M(`${tpoly([p, q, 0])} + C`), 'Divide by the new exponent 2 when you integrate x.'],
            [M(`${mono(p / 2, 2)} + C`), `The antiderivative of the constant ${q} is ${q}x.`],
            [M(`${p} + C`), 'That is the derivative of the expression, not its antiderivative.']
          ],
          hint: 'Integrate term by term: raise each exponent by 1 and divide by the new exponent.',
          steps: [`${M(`\\int ${mono(p, 1)}\\,dx = ${mono(p / 2, 2)}`)} and ${M(`\\int ${q}\\,dx = ${mono(q, 1)}`)}.`, `${M(`${tpoly([p / 2, q, 0])} + C`)}`]
        };
      }
    ],
    BM1: [
      rng => {
        const b = pick(rng, [4, 5, 8, 20, 25]), a = ri(rng, 1, b - 1), p = 100 * a / b;
        return {
          prompt: `A store sold ${M(`\\frac{${a}}{${b}}`)} of its stock. What percent of the stock is that?`, answer: pct(p),
          wrong: [
            [pct(a / b), 'Multiply the decimal by 100 to change it to a percent.'],
            [pct(100 * b / a), 'You divided the wrong way round: numerator ÷ denominator.'],
            [pct(p + 10), 'Recheck the division.']
          ],
          hint: 'Divide the numerator by the denominator, then multiply by 100.',
          steps: [`${M(`\\frac{${a}}{${b}} = ${dec(a / b)}`)}`, `${M(`${dec(a / b)} \\times 100 = ${dec(p)}\\%`)}`]
        };
      },
      rng => {
        let B, p, A;
        do { B = pick(rng, [200, 250, 400, 500, 800, 1000]); p = pick(rng, [5, 10, 12.5, 15, 20, 25, 40]); A = B * p / 100; } while (!Number.isInteger(A));
        return {
          prompt: `${peso(A)} is what percent of ${peso(B)}?`, answer: pct(p),
          wrong: [
            [pct(100 * B / A), 'Divide the part by the whole, not the whole by the part.'],
            [pct(A / B), 'Multiply by 100 to get a percent.'],
            [pct(p * 2), 'Recheck the division.']
          ],
          hint: 'Percent = part ÷ whole × 100.',
          steps: [`${M(`\\frac{${A}}{${B}} = ${dec(A / B)}`)}`, `${M(`${dec(A / B)} \\times 100 = ${dec(p)}\\%`)}`]
        };
      }
    ],
    BM2: [
      rng => {
        const C = ri(rng, 2, 40) * 50, m = pick(rng, [10, 20, 25, 30, 40, 50]), up = C * m / 100;
        return {
          prompt: `An item costs ${peso(C)}. The store adds a ${M(`${m}\\%`)} markup on cost. What is the selling price?`, answer: peso(C + up),
          wrong: [
            [peso(up), 'That is the markup itself. Add it to the cost.'],
            [peso(C - up), 'That would be a markdown. A markup increases the price.'],
            [peso(C + m), `Add ${m}% of the cost, not ${m} pesos.`]
          ],
          hint: 'Selling price = cost + markup, where markup = rate × cost.',
          steps: [`Markup: ${M(`${dec(m / 100)} \\times ${C} = ${dec(up)}`)}.`, `Selling price: ${M(`${C} + ${dec(up)} = ${dec(C + up)}`)}, so ${peso(C + up)}.`]
        };
      },
      rng => {
        const S = ri(rng, 2, 30) * 100, d = pick(rng, [10, 15, 20, 25, 30, 40]), off = S * d / 100;
        return {
          prompt: `A jacket is priced at ${peso(S)} and marked down by ${M(`${d}\\%`)}. What is the sale price?`, answer: peso(S - off),
          wrong: [
            [peso(off), 'That is the markdown amount. Subtract it from the price.'],
            [peso(S + off), 'A markdown lowers the price.'],
            [peso(S - d), `Subtract ${d}% of the price, not ${d} pesos.`]
          ],
          hint: 'Sale price = price − markdown, where markdown = rate × price.',
          steps: [`Markdown: ${M(`${dec(d / 100)} \\times ${S} = ${dec(off)}`)}.`, `Sale price: ${M(`${S} - ${dec(off)} = ${dec(S - off)}`)}, so ${peso(S - off)}.`]
        };
      },
      rng => {
        const C = pick(rng, [200, 400, 500, 800, 1000, 1200]), p = pick(rng, [10, 20, 25, 40, 50]), S = C * (1 + p / 100);
        return {
          prompt: `A seller buys an item for ${peso(C)} and sells it for ${peso(S)}. What is the percent profit on cost?`, answer: pct(p),
          wrong: [
            [pct(Math.round((S - C) / S * 1000) / 10), 'Percent profit on cost divides by the cost, not the selling price.'],
            [pct(S - C), 'That is the profit in pesos; divide it by the cost and multiply by 100.'],
            [pct(Math.round(S / C * 1000) / 10), 'Divide the profit, not the selling price, by the cost.']
          ],
          hint: 'Percent profit on cost = (selling price − cost) ÷ cost × 100.',
          steps: [`Profit: ${M(`${S} - ${C} = ${S - C}`)}.`, `${M(`\\frac{${S - C}}{${C}} \\times 100 = ${p}\\%`)}`]
        };
      }
    ],
    BM3: [
      rng => {
        const S = ri(rng, 2, 40) * 5000, r = pick(rng, [2, 3, 4, 5, 8, 10]), com = S * r / 100;
        return {
          prompt: `A sales agent earns a ${M(`${r}\\%`)} commission. How much is the commission on sales of ${peso(S)}?`, answer: peso(com),
          wrong: [
            [peso(com * 10), `Write the rate as a decimal: ${r}% = ${dec(r / 100)}.`],
            [peso(S + com), 'That is sales plus commission. The commission is only the percent of sales.'],
            [peso(com / 10), `Recheck the decimal: ${r}% = ${dec(r / 100)}.`]
          ],
          hint: 'Commission = rate × sales.',
          steps: [`${M(`${dec(r / 100)} \\times ${S} = ${dec(com)}`)}, so ${peso(com)}.`]
        };
      },
      rng => {
        const T = pick(rng, [50000, 100000]), r1 = pick(rng, [3, 4, 5]), r2 = r1 + pick(rng, [2, 3, 5]), S = T + ri(rng, 1, 20) * 5000;
        const com = T * r1 / 100 + (S - T) * r2 / 100;
        return {
          prompt: `An agent earns ${M(`${r1}\\%`)} on the first ${peso(T)} of sales and ${M(`${r2}\\%`)} on sales above that. What is the commission on sales of ${peso(S)}?`,
          answer: peso(com),
          wrong: [
            [peso(S * r1 / 100), `Sales above ${peso(T)} earn the higher rate, ${r2}%.`],
            [peso(S * r2 / 100), `Only the amount above ${peso(T)} earns ${r2}%.`],
            [peso(T * r1 / 100 + S * r2 / 100), `Apply ${r2}% only to the excess, ${peso(S - T)}.`]
          ],
          hint: 'Split the sales into the two brackets and apply each rate to its own bracket.',
          steps: [`First bracket: ${M(`${dec(r1 / 100)} \\times ${T} = ${dec(T * r1 / 100)}`)}.`, `Excess: ${M(`${S} - ${T} = ${S - T}`)}, and ${M(`${dec(r2 / 100)} \\times ${S - T} = ${dec((S - T) * r2 / 100)}`)}.`, `Total: ${peso(com)}.`]
        };
      }
    ],
    BM4: [
      rng => {
        const h = pick(rng, [60, 70, 75, 80, 90, 100]), d = ri(rng, 5, 6), o = ri(rng, 2, 10);
        const reg = 8 * d * h, ot = o * h * 1.25;
        return {
          prompt: `A worker earns ${peso(h)} per hour, works 8 regular hours a day for ${d} days, and ${o} overtime hours on regular days (paid at 125%). What is the gross pay for the week?`,
          answer: peso(reg + ot),
          wrong: [
            [peso(reg + o * h), 'Overtime is paid at 125% of the hourly rate, not the regular rate.'],
            [peso(reg), 'Include the overtime pay.'],
            [peso(reg + o * h * 1.5), 'Overtime on a regular day is 125%, not 150%.']
          ],
          hint: 'Gross pay = regular pay + overtime pay.',
          steps: [`Regular pay: ${M(`8 \\times ${d} \\times ${h} = ${reg}`)}.`, `Overtime pay: ${M(`${o} \\times ${h} \\times 1.25 = ${dec(ot)}`)}.`, `Gross pay: ${peso(reg + ot)}.`]
        };
      },
      rng => {
        const D = pick(rng, [450, 500, 550, 610, 645, 700]), P = pick(rng, [11, 13, 22, 26]), a = ri(rng, 1, 3);
        return {
          prompt: `A worker’s daily rate is ${peso(D)}. There are ${P} working days in the pay period, and the worker was absent ${a} day${a === 1 ? '' : 's'}. What is the pay for the period?`,
          answer: peso(D * (P - a)),
          wrong: [
            [peso(D * P), 'Deduct the days absent.'],
            [peso(D * (P + a)), 'Absences reduce the days paid; they are subtracted.'],
            [peso(D * P - a), `Deduct ${a} day${a === 1 ? '' : 's'} of pay, not ${a} pesos.`]
          ],
          hint: 'Pay = daily rate × days actually worked.',
          steps: [`Days worked: ${M(`${P} - ${a} = ${P - a}`)}.`, `${M(`${D} \\times ${P - a} = ${D * (P - a)}`)}, so ${peso(D * (P - a))}.`]
        };
      }
    ]
  };
  return { BANK, IDEAS };
};
