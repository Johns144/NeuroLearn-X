/*
 * NeuroLearn-X — mixed text-and-math strings.
 *
 * Question text, choices, hints and worked steps are plain text with LaTeX
 * between \( … \) (inline) or \[ … \] (display). In the browser they are
 * rendered with KaTeX; if KaTeX is unavailable, texToPlain gives a readable
 * Unicode fallback.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NLX = Object.assign(root.NLX || {}, { math: api });
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SEGMENT = /\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g;
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻', '+': '⁺', n: 'ⁿ', x: 'ˣ' };
  const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
  const escHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Splits a string into text and math pieces.
  function segments(s) {
    const out = [];
    let last = 0, m;
    SEGMENT.lastIndex = 0;
    while ((m = SEGMENT.exec(s))) {
      if (m.index > last) out.push({ text: s.slice(last, m.index) });
      out.push({ math: m[1] !== undefined ? m[1] : m[2], display: m[2] !== undefined });
      last = SEGMENT.lastIndex;
    }
    if (last < s.length) out.push({ text: s.slice(last) });
    return out;
  }

  function mathToPlain(t) {
    let s = t;
    for (let i = 0; i < 4; i++) s = s.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => `${/^[\w.]+$/.test(a) ? a : `(${a})`}/${/^[\w.]+$/.test(b) ? b : `(${b})`}`);
    s = s.replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
      .replace(/\\log_\{?(\w+)\}?/g, (_, b) => `log${[...b].map(c => SUB[c] || c).join('')}`)
      .replace(/\^\{([^{}]*)\}/g, (_, e) => ([...e].every(c => SUP[c]) ? [...e].map(c => SUP[c]).join('') : `^(${e})`))
      .replace(/\^(\w)/g, (_, e) => SUP[e] || `^${e}`)
      .replace(/_\{([^{}]*)\}/g, (_, e) => [...e].map(c => SUB[c] || c).join(''))
      .replace(/\\text\{([^{}]*)\}/g, '$1')
      .replace(/\\(left|right|,|;|!|displaystyle)/g, '')
      .replace(/\\quad|\\qquad/g, '  ')
      .replace(/\\cdot/g, '·').replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\circ/g, '∘')
      .replace(/\\le(q)?/g, '≤').replace(/\\ge(q)?/g, '≥').replace(/\\neq/g, '≠').replace(/\\pm/g, '±')
      .replace(/\\Rightarrow/g, '⇒').replace(/\\to/g, '→').replace(/\\approx/g, '≈')
      .replace(/\\\{/g, '{').replace(/\\\}/g, '}').replace(/\\%/g, '%')
      .replace(/[{}]/g, '')
      .replace(/(^|[^\w)])-/g, '$1−').replace(/ - /g, ' − ');
    return s;
  }

  const texToPlain = s => segments(String(s)).map(p => (p.math !== undefined ? mathToPlain(p.math) : p.text)).join('');

  // Escaped HTML with every math segment rendered by KaTeX when available.
  function render(s, katex) {
    return segments(String(s)).map(p => {
      if (p.math === undefined) return escHtml(p.text);
      if (katex) {
        // Inline fractions are typeset at full size so students can read them.
        const src = !p.display && /\\frac/.test(p.math) ? `\\displaystyle ${p.math}` : p.math;
        try { return katex.renderToString(src, { displayMode: p.display, throwOnError: false, output: 'htmlAndMathml' }); } catch (e) { /* fall through */ }
      }
      return `<span class="math-fallback">${escHtml(mathToPlain(p.math))}</span>`;
    }).join('');
  }

  return { segments, texToPlain, render };
});
