/*
 * NeuroLearn-X — drifting neural-network mesh behind the sign-in screen.
 * Runs only while the sign-in screen is visible; draws one still frame when
 * the user prefers reduced motion.
 */
(function () {
  'use strict';
  const canvas = document.getElementById('authMesh');
  const auth = document.getElementById('auth');
  if (!canvas || !auth || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  const LINK = 150;
  let nodes = [], w = 0, h = 0, raf = 0, pointer = { x: -1e4, y: -1e4 };

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.max(24, Math.min(80, Math.round((w * h) / 16000)));
    nodes = Array.from({ length: n }, (_, i) => nodes[i] || {
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: 1.2 + Math.random() * 1.6, phase: Math.random() * Math.PI * 2
    });
    nodes.forEach(p => { p.x = Math.min(p.x, w); p.y = Math.min(p.y, h); });
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    nodes.forEach(p => {
      if (!still.matches) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
    });
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(190, 220, 255, ${0.22 * (1 - d / LINK)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      // Nodes near the pointer light up and connect to it.
      const dp = Math.hypot(a.x - pointer.x, a.y - pointer.y);
      if (dp < LINK * 1.3) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 * (1 - dp / (LINK * 1.3))})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke();
      }
      const pulse = still.matches ? 0.6 : 0.45 + 0.35 * Math.sin(t / 900 + a.phase);
      ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }
    if (!still.matches && !auth.hidden) raf = requestAnimationFrame(frame);
  }

  function start() {
    cancelAnimationFrame(raf);
    if (auth.hidden) return;
    resize();
    raf = requestAnimationFrame(frame);
  }

  new MutationObserver(start).observe(auth, { attributes: true, attributeFilter: ['hidden'] });
  window.addEventListener('resize', start);
  still.addEventListener('change', start);
  auth.addEventListener('pointermove', e => { pointer = { x: e.clientX, y: e.clientY }; });
  auth.addEventListener('pointerleave', () => { pointer = { x: -1e4, y: -1e4 }; });
  start();
})();
