/*
 * NeuroLearn-X — SVG charts. Each builder returns an SVG string; hover
 * tooltips are driven by `data-tip` attributes (see bindTooltips) and the
 * trajectory chart registers a crosshair handler.
 */
(function (root) {
  'use strict';

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f1 = v => (Math.round(v * 10) / 10).toFixed(1);
  const pct = v => `${Math.round(v * 100)}%`;
  const registry = {};
  let uid = 0;

  // ------------------------------------------------ load contributions
  // Diverging bars around zero: right raises predicted load, left lowers it.
  function contributions(items) {
    const W = 560, labelW = 200, valueW = 52, rowH = 30, top = 18;
    const H = top + items.length * rowH + 8;
    const plotW = W - labelW - valueW;
    const maxAbs = Math.max(1, ...items.map(i => Math.abs(i.contribution)));
    const x0 = labelW + plotW / 2;
    const sx = v => (v / maxAbs) * (plotW / 2 - 4);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Contribution of each factor to predicted cognitive load">`;
    s += `<text x="${x0 - 6}" y="11" text-anchor="end" class="axis-label">← lowers load</text>`;
    s += `<text x="${x0 + 6}" y="11" class="axis-label">raises load →</text>`;
    items.forEach((it, i) => {
      const y = top + i * rowH;
      const w = Math.abs(sx(it.contribution));
      const pos = it.contribution >= 0;
      const x = pos ? x0 : x0 - w;
      const tip = `<b>${esc(it.label)}</b><br>Feature value ${it.value.toFixed(2)} × weight = ${it.contribution >= 0 ? '+' : ''}${it.contribution.toFixed(2)} on the log-odds scale`;
      s += `<g data-tip="${esc(tip)}">`;
      s += `<rect x="0" y="${y}" width="${W}" height="${rowH}" fill="transparent"/>`;
      s += `<text x="${labelW - 10}" y="${y + rowH / 2 + 4}" text-anchor="end">${esc(it.label)}</text>`;
      if (w > 0.5) s += `<rect x="${x}" y="${y + 7}" width="${w}" height="${rowH - 14}" rx="3" fill="var(${pos ? '--div-pos' : '--div-neg'})"/>`;
      s += `<text x="${W - 4}" y="${y + rowH / 2 + 4}" text-anchor="end" class="num">${it.contribution >= 0 ? '+' : '−'}${Math.abs(it.contribution).toFixed(2)}</text>`;
      s += `</g>`;
    });
    s += `<line class="baseline" x1="${x0}" x2="${x0}" y1="${top - 2}" y2="${H - 6}"/>`;
    return s + `</svg>`;
  }

  // ------------------------------------------------ simulated trajectory
  function trajectory(sim) {
    const id = `traj${++uid}`;
    const W = 680, H = 280, m = { l: 40, r: 104, t: 14, b: 34 };
    const all = [...sim.adaptive.trajectory, ...sim.standard.trajectory];
    const yMin = Math.max(0, Math.floor(Math.min(...all.map(p => p.lo)) / 10) * 10);
    const yMax = Math.min(100, Math.ceil(Math.max(...all.map(p => p.hi)) / 10) * 10);
    const sx = t => m.l + (t / sim.budget) * (W - m.l - m.r);
    const sy = v => m.t + (1 - (v - yMin) / Math.max(1, yMax - yMin)) * (H - m.t - m.b);
    let s = `<svg class="chart" id="${id}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Projected post-test score after each study session, adaptive versus standard">`;
    for (let v = yMin; v <= yMax; v += 10) {
      s += `<line class="grid-line" x1="${m.l}" x2="${W - m.r}" y1="${sy(v)}" y2="${sy(v)}"/>`;
      s += `<text x="${m.l - 6}" y="${sy(v) + 4}" text-anchor="end" class="num">${v}</text>`;
    }
    const step = sim.budget <= 20 ? 5 : 10;
    for (let t = 0; t <= sim.budget; t += step) {
      s += `<text x="${sx(t)}" y="${H - m.b + 16}" text-anchor="middle" class="num">${t}</text>`;
    }
    s += `<text x="${(m.l + W - m.r) / 2}" y="${H - 4}" text-anchor="middle" class="axis-label">Study sessions</text>`;
    s += `<line class="baseline" x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/>`;
    const series = [['adaptive', '--series-1', 'Adaptive'], ['standard', '--series-2', 'Standard']];
    series.forEach(([key, color]) => {
      const tr = sim[key].trajectory;
      const band = tr.map(p => `${sx(p.t)},${sy(p.hi)}`).join(' ') + ' ' + [...tr].reverse().map(p => `${sx(p.t)},${sy(p.lo)}`).join(' ');
      s += `<polygon points="${band}" fill="var(${color})" opacity="0.12"/>`;
    });
    series.forEach(([key, color]) => {
      const tr = sim[key].trajectory;
      s += `<polyline points="${tr.map(p => `${sx(p.t)},${sy(p.mean)}`).join(' ')}" fill="none" stroke="var(${color})" stroke-width="2" stroke-linejoin="round"/>`;
    });
    // Direct end labels, nudged apart when they would collide.
    const ends = series.map(([key, color, label]) => ({ y: sy(sim[key].trajectory[sim.budget].mean), color, label, v: sim[key].trajectory[sim.budget].mean }));
    if (Math.abs(ends[0].y - ends[1].y) < 14) {
      const mid = (ends[0].y + ends[1].y) / 2, up = ends[0].y <= ends[1].y ? 0 : 1;
      ends[up].y = mid - 7; ends[1 - up].y = mid + 7;
    }
    ends.forEach(e => {
      s += `<circle cx="${sx(sim.budget)}" cy="${sy(e.v)}" r="4" fill="var(${e.color})" stroke="var(--surface)" stroke-width="2"/>`;
      s += `<text x="${sx(sim.budget) + 10}" y="${e.y + 4}" style="fill:var(--ink)">${e.label} ${f1(e.v)}</text>`;
    });
    s += `<line class="xhair" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" stroke="var(--ink-2)" stroke-width="1" visibility="hidden"/>`;
    s += `<rect class="hover-layer" x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}" fill="transparent" data-chart="${id}"/>`;
    s += `</svg>`;
    registry[id] = {
      W, sx,
      invert: px => Math.max(0, Math.min(sim.budget, Math.round(((px - m.l) / (W - m.l - m.r)) * sim.budget))),
      tip: t => {
        const a = sim.adaptive.trajectory[t], b = sim.standard.trajectory[t];
        return `<b>After ${t} session${t === 1 ? '' : 's'}</b>` +
          `<div class="tt-row"><span><i style="background:var(--series-1)"></i>Adaptive</span><span class="num">${f1(a.mean)} (${f1(a.lo)}–${f1(a.hi)})</span></div>` +
          `<div class="tt-row"><span><i style="background:var(--series-2)"></i>Standard</span><span class="num">${f1(b.mean)} (${f1(b.lo)}–${f1(b.hi)})</span></div>`;
      }
    };
    return s;
  }

  // ------------------------------------------------ per-skill final mastery
  function skillBars(sim, ids, byId, threshold) {
    // Grows wider for long sequences (a track has 30+ topics); wrap it in .chart-scroll.
    const m = { l: 40, r: 10, t: 12, b: 36 }, W = Math.max(680, m.l + m.r + ids.length * 42), H = 250;
    const groupW = (W - m.l - m.r) / ids.length;
    const barW = Math.min(18, groupW / 2 - 6);
    const sy = v => m.t + (1 - v) * (H - m.t - m.b);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}"${W > 680 ? ` style="min-width:${W}px"` : ''} role="img" aria-label="Projected final mastery per skill, adaptive versus standard">`;
    [0, 0.25, 0.5, 0.75, 1].forEach(v => {
      s += `<line class="grid-line" x1="${m.l}" x2="${W - m.r}" y1="${sy(v)}" y2="${sy(v)}"/>`;
      s += `<text x="${m.l - 6}" y="${sy(v) + 4}" text-anchor="end" class="num">${v * 100}</text>`;
    });
    s += `<line x1="${m.l}" x2="${W - m.r}" y1="${sy(threshold)}" y2="${sy(threshold)}" stroke="var(--ink-2)" stroke-dasharray="4 3" opacity="0.7"/>`;
    s += `<text x="${W - m.r}" y="${sy(threshold) - 4}" text-anchor="end" class="axis-label">mastery ${threshold * 100}</text>`;
    ids.forEach((id, i) => {
      const gx = m.l + i * groupW;
      const cx = gx + groupW / 2;
      const a = sim.adaptive.perSkill[id], b = sim.standard.perSkill[id];
      const tip = `<b>${esc(id)} · ${esc(byId[id].name)}</b>` +
        `<div class="tt-row"><span><i style="background:var(--series-1)"></i>Adaptive</span><span class="num">${pct(a)}</span></div>` +
        `<div class="tt-row"><span><i style="background:var(--series-2)"></i>Standard</span><span class="num">${pct(b)}</span></div>`;
      s += `<g data-tip="${esc(tip)}"><rect x="${gx}" y="${m.t}" width="${groupW}" height="${H - m.t - m.b}" fill="transparent"/>`;
      [[a, '--series-1', cx - barW - 1], [b, '--series-2', cx + 1]].forEach(([v, c, x]) => {
        const y = sy(v), h = sy(0) - y;
        // Rounded top, square base anchored to the baseline.
        s += `<path d="M${x},${sy(0)} V${y + 3} Q${x},${y} ${x + 3},${y} H${x + barW - 3} Q${x + barW},${y} ${x + barW},${y + 3} V${sy(0)} Z" fill="var(${c})"${h < 3 ? ' opacity="0.9"' : ''}/>`;
      });
      s += `<text x="${cx}" y="${H - m.b + 15}" text-anchor="middle">${esc(id)}</text></g>`;
    });
    s += `<line class="baseline" x1="${m.l}" x2="${W - m.r}" y1="${sy(0)}" y2="${sy(0)}"/>`;
    return s + `</svg>`;
  }

  // ------------------------------------------------ cohort gain strip plot
  function gainStrip(groups) {
    const W = 680, H = 170, m = { l: 92, r: 16, t: 14, b: 34 };
    const all = [...groups.adaptive.gains, ...groups.standard.gains];
    const lo = Math.min(0, Math.floor(Math.min(...all) / 10) * 10);
    const hi = Math.max(10, Math.ceil(Math.max(...all) / 10) * 10);
    const sx = v => m.l + ((v - lo) / (hi - lo)) * (W - m.l - m.r);
    const rows = [['adaptive', 'Adaptive', '--series-1'], ['standard', 'Standard', '--series-2']];
    const rowH = (H - m.t - m.b) / 2;
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Post-test minus pre-test gain for each learner, by group">`;
    for (let v = lo; v <= hi; v += 10) {
      s += `<line class="grid-line" x1="${sx(v)}" x2="${sx(v)}" y1="${m.t}" y2="${H - m.b}"/>`;
      s += `<text x="${sx(v)}" y="${H - m.b + 15}" text-anchor="middle" class="num">${v > 0 ? '+' : ''}${v}</text>`;
    }
    if (lo < 0) s += `<line class="baseline" x1="${sx(0)}" x2="${sx(0)}" y1="${m.t}" y2="${H - m.b}"/>`;
    s += `<text x="${(m.l + W - m.r) / 2}" y="${H - 3}" text-anchor="middle" class="axis-label">Gain (post-test − pre-test, points)</text>`;
    rows.forEach(([key, label, color], r) => {
      const cy = m.t + rowH * r + rowH / 2;
      const g = groups[key];
      s += `<text x="${m.l - 12}" y="${cy + 4}" text-anchor="end" style="fill:var(--ink)">${label} (n=${g.n})</text>`;
      // Small vertical jitter by index keeps tied gains visible.
      g.learners.forEach((l, i) => {
        const gain = l.postTest - l.preTest;
        const jy = cy + ((i % 3) - 1) * 7;
        const tip = `<b>${esc(l.name)}</b><br>Pre ${l.preTest} → Post ${l.postTest} (gain ${gain >= 0 ? '+' : ''}${gain})`;
        s += `<g data-tip="${esc(tip)}"><circle cx="${sx(gain)}" cy="${jy}" r="11" fill="transparent"/>` +
          `<circle cx="${sx(gain)}" cy="${jy}" r="5" fill="var(${color})" stroke="var(--surface)" stroke-width="2"/></g>`;
      });
      if (g.n) {
        const mx = sx(g.gain.mean);
        s += `<line x1="${mx}" x2="${mx}" y1="${cy - rowH / 2 + 6}" y2="${cy + rowH / 2 - 6}" stroke="var(--ink)" stroke-width="2"/>`;
        s += `<text x="${mx + 5}" y="${cy - rowH / 2 + 14}" style="fill:var(--ink)" class="num">mean ${g.gain.mean >= 0 ? '+' : ''}${f1(g.gain.mean)}</text>`;
      }
    });
    return s + `</svg>`;
  }

  // ------------------------------------------------ prerequisite graph
  /*
   * Swimlane layout: one horizontal lane per subject (Junior High foundations
   * on top), topics left to right by prerequisite depth, so every link points
   * forward and links inside a subject are straight lines. Nodes sharing a
   * lane and column are ordered by the lanes they feed (barycenter), which
   * keeps cross-lane links short. Links between lanes are drawn faintly;
   * hovering a topic highlights its own links.
   *
   * lanes: [{ id, label, ids, stack }] in display order; every shown id is in
   * one. stack: true lets topics share a column (used for foundations).
   */
  function dag({ graph, mastery, status, relevant, targets, hotEdges, lanes }) {
    const ids = lanes.flatMap(l => l.ids);
    const shown = new Set(ids);
    const laneOf = {};
    lanes.forEach((l, i) => l.ids.forEach(id => { laneOf[id] = i; }));
    // Column: right of every shown prerequisite, so links always go left to right.
    // A subject's topics also sit in one row, each right of the one before it;
    // only a lane marked stack (the foundations) puts topics in a shared column.
    // A subject lane keeps the order its ids are given in (the teaching order).
    const prev = {};
    lanes.forEach(l => { if (!l.stack) l.ids.forEach((id, i) => { if (i) prev[id] = l.ids[i - 1]; }); });
    const col = {};
    const colOf = id => {
      if (col[id] == null) {
        const before = graph.byId[id].prereqs.filter(p => shown.has(p));
        if (prev[id]) before.push(prev[id]);
        col[id] = Math.max(-1, ...before.map(colOf)) + 1;
      }
      return col[id];
    };
    ids.forEach(colOf);
    const children = {};
    ids.forEach(id => graph.byId[id].prereqs.forEach(p => { if (shown.has(p)) (children[p] = children[p] || []).push(id); }));
    // Within a lane, stack topics that share a column; order them by where their links go.
    const row = {}, laneRows = lanes.map(() => 1);
    lanes.forEach((l, li) => {
      const byCol = {};
      l.ids.forEach(id => { (byCol[col[id]] = byCol[col[id]] || []).push(id); });
      Object.values(byCol).forEach(list => {
        const bary = id => { const ks = children[id] || []; return ks.length ? ks.reduce((s, k) => s + laneOf[k], 0) / ks.length : li; };
        list.sort((a, b) => bary(a) - bary(b) || graph.topoIndex[a] - graph.topoIndex[b]);
        list.forEach((id, r) => { row[id] = r; });
        laneRows[li] = Math.max(laneRows[li], list.length);
      });
    });
    const nodeW = 128, nodeH = 44, colGap = 40, rowGap = 10, laneHead = 26, lanePad = 12, laneGap = 8, left = 12;
    const cols = Math.max(...ids.map(id => col[id])) + 1;
    const W = left * 2 + cols * nodeW + (cols - 1) * colGap;
    const laneY = [];
    let y = 0;
    lanes.forEach((l, i) => { laneY[i] = y; y += laneHead + laneRows[i] * nodeH + (laneRows[i] - 1) * rowGap + lanePad + laneGap; });
    const H = y - laneGap;
    const pos = {};
    ids.forEach(id => {
      const li = laneOf[id];
      pos[id] = { x: left + col[id] * (nodeW + colGap), y: laneY[li] + laneHead + row[id] * (nodeH + rowGap) };
    });
    const fill = { mastered: 'var(--good)', developing: 'var(--warning)', gap: 'var(--critical)', unverified: 'var(--neutral)' };
    const mark = { mastered: '✓', developing: '~', gap: '✕', unverified: '?' };
    let s = `<svg class="chart dag" viewBox="0 0 ${W} ${H}" style="min-width:${W}px" role="img" aria-label="Prerequisite graph by subject, coloured by mastery status">`;
    lanes.forEach((l, i) => {
      const h = laneHead + laneRows[i] * nodeH + (laneRows[i] - 1) * rowGap + lanePad;
      s += `<rect class="dag-lane${i % 2 ? ' alt' : ''}" x="0" y="${laneY[i]}" width="${W}" height="${h}" rx="10"/>`;
      s += `<text class="dag-lane-label" x="${left}" y="${laneY[i] + 17}">${esc(l.label)}</text>`;
    });
    // Links: same-lane neighbours are straight; a same-row link that would cross a
    // topic in between arcs over it; links between lanes are smooth curves.
    const edges = [];
    ids.forEach(id => graph.byId[id].prereqs.forEach(p => { if (shown.has(p)) edges.push([p, id]); }));
    const occupied = new Set(ids.map(id => `${laneOf[id]}:${row[id]}:${col[id]}`));
    edges.sort((e1, e2) => hotEdges.has(`${e1[0]}>${e1[1]}`) - hotEdges.has(`${e2[0]}>${e2[1]}`));
    edges.forEach(([p, id]) => {
      const a = pos[p], b = pos[id];
      const hot = hotEdges.has(`${p}>${id}`);
      const same = laneOf[p] === laneOf[id];
      const dim = !relevant.has(p) || !relevant.has(id);
      let d;
      if (same && row[p] === row[id]) {
        let blocked = false;
        for (let c = col[p] + 1; c < col[id]; c++) if (occupied.has(`${laneOf[id]}:${row[id]}:${c}`)) blocked = true;
        if (blocked) {
          const x1 = a.x + nodeW / 2, x2 = b.x + nodeW / 2, top = a.y - 2, lift = Math.min(22, laneHead - 4);
          d = `M${x1},${top} C${x1},${top - lift} ${x2},${top - lift} ${x2},${top}`;
        } else d = `M${a.x + nodeW},${a.y + nodeH / 2} L${b.x},${b.y + nodeH / 2}`;
      } else {
        const x1 = a.x + nodeW, y1 = a.y + nodeH / 2, x2 = b.x, y2 = b.y + nodeH / 2, mx = x1 + Math.max(colGap * 0.6, (x2 - x1) / 2);
        d = `M${x1},${y1} C${mx},${y1} ${x2 - Math.max(colGap * 0.6, (x2 - x1) / 2)},${y2} ${x2},${y2}`;
      }
      s += `<path class="dag-edge${same ? '' : ' cross'}${hot ? ' hot' : ''}${dim && !hot ? ' dim' : ''}" data-from="${esc(p)}" data-to="${esc(id)}" d="${d}" marker-end="url(#dagArrow${hot ? 'Hot' : ''})"/>`;
    });
    s += `<defs><marker id="dagArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" class="dag-arrow"/></marker>
      <marker id="dagArrowHot" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" class="dag-arrow hot"/></marker></defs>`;
    ids.forEach(id => {
      const p = pos[id], st = status[id], skill = graph.byId[id];
      const cls = `dag-node${relevant.has(id) ? '' : ' dim'}${targets.has(id) ? ' target' : ''}`;
      const tip = `<b>${esc(id)} · ${esc(skill.name)}</b><br>${esc(st)} · mastery ${pct(mastery[id].p)} (${mastery[id].source})${targets.has(id) ? '<br>Target skill' : ''}`;
      const stroke = targets.has(id) ? 'var(--ink)' : fill[st];
      const dash = st === 'unverified' ? ' stroke-dasharray="4 3"' : '';
      const name = skill.short.length > 17 ? `${skill.short.slice(0, 16)}…` : skill.short;
      s += `<g class="${cls}" data-id="${esc(id)}" data-tip="${esc(tip)}">` +
        // Tint as a translucent fill over a white base, so older browsers without color-mix() draw it too.
        `<rect x="${p.x}" y="${p.y}" width="${nodeW}" height="${nodeH}" rx="9" fill="#fff"/>` +
        `<rect x="${p.x}" y="${p.y}" width="${nodeW}" height="${nodeH}" rx="9" fill="${fill[st]}" fill-opacity="0.14" stroke="${stroke}"${dash}/>` +
        `<rect x="${p.x}" y="${p.y}" width="4" height="${nodeH}" rx="2" fill="${fill[st]}"/>` +
        `<text class="id" x="${p.x + 11}" y="${p.y + 17}">${esc(id)}</text>` +
        `<text class="pct" x="${p.x + nodeW - 9}" y="${p.y + 17}" text-anchor="end">${mark[st]} ${pct(mastery[id].p)}</text>` +
        `<text x="${p.x + 11}" y="${p.y + 34}">${esc(name)}</text></g>`;
    });
    return s + `</svg>`;
  }

  // Hovering a topic in the graph highlights its links and neighbours. On a
  // touch screen a tap does the same, and a tap on empty space clears it.
  function bindDag(doc) {
    const focus = (svg, node) => {
      svg.querySelectorAll('.on').forEach(el => el.classList.remove('on'));
      svg.classList.toggle('focus', !!node);
      svg.dataset.focused = node ? node.dataset.id : '';
      if (!node) return;
      const id = node.dataset.id;
      node.classList.add('on');
      svg.querySelectorAll('.dag-edge').forEach(el => {
        if (el.dataset.from !== id && el.dataset.to !== id) return;
        el.classList.add('on');
        const other = svg.querySelector(`.dag-node[data-id="${el.dataset.from === id ? el.dataset.to : el.dataset.from}"]`);
        if (other) other.classList.add('on');
      });
    };
    const target = e => ({ node: e.target.closest && e.target.closest('.dag-node'), svg: e.target.closest && e.target.closest('svg.dag') });
    doc.addEventListener('pointerover', e => {
      if (e.pointerType !== 'mouse') return;
      const { node, svg } = target(e);
      if (svg) focus(svg, node);
    });
    doc.addEventListener('pointerup', e => {
      if (e.pointerType === 'mouse') return;
      const { node, svg } = target(e);
      doc.querySelectorAll('svg.dag.focus').forEach(s => { if (s !== svg) focus(s, null); });
      // A second tap on the same topic clears the highlight.
      if (svg) focus(svg, node && svg.dataset.focused !== node.dataset.id ? node : null);
    });
    doc.addEventListener('pointerout', e => {
      if (e.pointerType !== 'mouse') return;
      const svg = e.target.closest && e.target.closest('svg.dag');
      if (svg && !svg.contains(e.relatedTarget)) focus(svg, null);
    });
  }

  // ------------------------------------------------ load gauge
  // Half-dial split into the four load bands, with a needle at the forecast.
  function gauge(load, bands) {
    const W = 240, H = 138, cx = 120, cy = 118, r = 92;
    const pt = (v, rad) => [cx + rad * Math.cos(Math.PI * (1 - v)), cy - rad * Math.sin(Math.PI * (1 - v))];
    const colors = { low: '#b9c8e0', optimal: 'var(--good)', high: 'var(--warning)', overload: 'var(--critical)' };
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" style="max-width:260px" role="img" aria-label="Predicted load ${Math.round(load * 100)} percent">`;
    let from = 0;
    bands.forEach(b => {
      const to = Math.min(1, b.max);
      const [x0, y0] = pt(from + 0.006, r), [x1, y1] = pt(to - 0.006, r);
      s += `<path d="M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}" fill="none" stroke="${colors[b.key]}" stroke-width="18" stroke-linecap="butt"/>`;
      from = to;
    });
    const [nx, ny] = pt(Math.max(0.01, Math.min(0.99, load)), r - 26);
    s += `<line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="7" fill="var(--ink)" stroke="var(--surface)" stroke-width="3"/>`;
    s += `<text x="${pt(0, r)[0]}" y="${cy + 16}" text-anchor="middle" class="axis-label">easy</text>`;
    s += `<text x="${pt(1, r)[0]}" y="${cy + 16}" text-anchor="middle" class="axis-label">heavy</text>`;
    return s + `</svg>`;
  }

  // ------------------------------------------------ hover layer
  function bindTooltips(doc) {
    bindDag(doc);
    const tt = doc.getElementById('tooltip');
    const place = (e) => {
      const pad = 14;
      const r = tt.getBoundingClientRect();
      let x = e.clientX + pad, y = e.clientY + pad;
      if (x + r.width > window.innerWidth - 8) x = e.clientX - r.width - pad;
      if (y + r.height > window.innerHeight - 8) y = e.clientY - r.height - pad;
      tt.style.left = `${Math.max(8, x)}px`;
      tt.style.top = `${Math.max(8, y)}px`;
    };
    let lastChart = null;
    // Mouse: follow the pointer. Touch and pen have no hover, so a tap shows
    // the tooltip and a tap anywhere else hides it.
    const show = e => {
      const layer = e.target.closest && e.target.closest('.hover-layer');
      if (lastChart && (!layer || layer.dataset.chart !== lastChart.id)) {
        lastChart.svg.querySelector('.xhair').setAttribute('visibility', 'hidden');
        lastChart = null;
      }
      if (layer && registry[layer.dataset.chart]) {
        const svg = layer.ownerSVGElement;
        const reg = registry[layer.dataset.chart];
        const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const local = pt.matrixTransform(svg.getScreenCTM().inverse());
        const t = Math.max(0, Math.round(reg.invert(local.x)));
        const xh = svg.querySelector('.xhair');
        const x = reg.sx(Math.min(t, Infinity));
        xh.setAttribute('x1', x); xh.setAttribute('x2', x); xh.setAttribute('visibility', 'visible');
        lastChart = { id: layer.dataset.chart, svg };
        try { tt.innerHTML = reg.tip(t); } catch (err) { tt.hidden = true; return; }
        tt.hidden = false; place(e);
        return;
      }
      const el = e.target.closest && e.target.closest('[data-tip]');
      if (!el) { tt.hidden = true; return; }
      tt.innerHTML = el.getAttribute('data-tip');
      tt.hidden = false;
      place(e);
    };
    doc.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') show(e); });
    doc.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') show(e); });
    doc.addEventListener('pointerleave', () => { tt.hidden = true; });
    doc.addEventListener('scroll', () => { tt.hidden = true; }, true);
  }

  root.NLX = Object.assign(root.NLX || {}, { charts: { esc, contributions, trajectory, skillBars, gainStrip, dag, gauge, bindTooltips } });
})(typeof self !== 'undefined' ? self : this);
