/*
 * NeuroLearn-X — UI controller.
 *
 * Signed-out:  sign in (student / teacher), join a class, first-run setup.
 * Student:     diagnostic on first sign-in, then home, my path, practice,
 *              my skills. Quizzes are graded on the server.
 * Teacher:     class dashboard, classes and accounts, and the five-stage
 *              analysis chain over their own students.
 */
(function () {
  'use strict';
  const { engine: E, curriculum: C, charts: V, icon, api, math: MT } = window.NLX;
  const G = C.graph;
  const esc = V.esc;
  // Text with \( … \) math, rendered by KaTeX (plain-text fallback if it did not load).
  const mx = s => MT.render(s, window.katex);

  // ------------------------------------------------------------ constants
  const NAV = {
    student: [
      { id: 'dashboard', icon: 'home', label: 'Home', title: 'My dashboard' },
      { id: 'pathway', icon: 'path', label: 'My path', title: 'My learning path' },
      { id: 'practice', icon: 'play', label: 'Practice', title: 'Practice' },
      { id: 'gaps', icon: 'target', label: 'My skills', title: 'My skills' },
      { id: 'account', icon: 'user', label: 'Account', title: 'My account' }
    ],
    teacher: [
      { id: 'dashboard', icon: 'home', label: 'Dashboard', short: 'Home', title: 'Class dashboard' },
      { id: 'classes', icon: 'users', label: 'Classes', title: 'Classes and students' },
      { id: 'progress', icon: 'star', label: 'Progress', title: 'Pre-test and post-test progress' },
      { id: 'bank', icon: 'bank', label: 'Question bank', short: 'Questions', title: 'Question bank' },
      { id: 'record', icon: 'record', label: 'Performance', step: 1, title: 'Record performance' },
      { id: 'load', icon: 'load', label: 'Cognitive load', step: 2, title: 'Cognitive load' },
      { id: 'gaps', icon: 'gaps', label: 'Skill gaps', step: 3, title: 'Skill gaps' },
      { id: 'pathway', icon: 'path', label: 'Pathways', step: 4, title: 'Recommend a pathway' },
      { id: 'outcomes', icon: 'chart', label: 'Outcomes', step: 5, title: 'Compare learning outcomes' },
      { id: 'models', icon: 'target', label: 'Model check', title: 'Model check' },
      { id: 'account', icon: 'user', label: 'Account', title: 'My account' }
    ]
  };
  const HIDDEN_TABS = { quiz: 'Assessment', diagnostic: 'Diagnostic', posttest: 'Post-test', results: 'Results', history: 'Practice history' };
  // Student pages reached from another page; the nav keeps the parent highlighted.
  const SUB_PAGES = { history: 'practice' };
  const LEARNER_TABS = ['record', 'load', 'gaps', 'pathway', 'outcomes'];
  const ATTEMPT_TYPES = ['diagnostic', 'practice', 'quiz', 'summative'];
  const TRACKS = C.TRACK_IDS;
  // Subject names as the track's curriculum lists them (GAS shows its slots, e.g. "Elective 1: …").
  const subjectName = (track, id) => C.subjectLabel(track, id);
  const subjectList = track => C.trackSubjects(track).map(id => subjectName(track, id)).join(', ');
  const trackOptions = (selected, placeholder) => `<option value="">${placeholder}</option>${TRACKS.map(t => `<option value="${t}"${t === selected ? ' selected' : ''}>${t}</option>`).join('')}`;
  // The learner's fixed topic order across all of their track's subjects.
  const seqOf = l => C.trackSequence(l && l.track);
  // Foundation (Junior High) skills that the learner's track subjects build on.
  const foundationsOf = l => C.trackSkills(l && l.track).filter(id => G.byId[id].level === 'JHS');
  const PAAS = ['Very, very low', 'Very low', 'Low', 'Rather low', 'Neither low nor high', 'Rather high', 'High', 'Very high', 'Very, very high'];
  // Teachers and students share the plain status names.
  const STUDENT_STATUS = { mastered: 'Mastered', developing: 'Almost there', gap: 'Needs practice', unverified: 'Not checked yet' };
  const STATUS_MARK = { mastered: '✓', developing: '~', gap: '!', unverified: '?' };
  const KIND_LABEL = { remediate: 'Remediation', verify: 'Check', learn: 'New skill', review: 'Spaced review' };
  const STUDENT_KIND = { remediate: 'Strengthen', verify: 'Quick check', learn: 'New topic', review: 'Review' };
  const FEEL = {
    low: { title: 'Feels easy', text: 'You are ready for a challenge. Try harder problems.' },
    optimal: { title: 'Just right', text: 'A good stretch. Practise and check your answers as you go.' },
    high: { title: 'Challenging', text: 'Study the worked examples first, then try similar problems on your own.' },
    overload: { title: 'A lot at once', text: 'We split this into two short sessions. Review the basics first.' }
  };
  // Cognitive load in teachers' terms: each level's name and what to do about it.
  const BAND_PLAIN = {
    low: { title: 'Easy', range: 'under 30%', todo: 'Give harder or enrichment problems.' },
    optimal: { title: 'Just right', range: '30–60%', todo: 'Regular practice with feedback.' },
    high: { title: 'Hard', range: '60–80%', todo: 'Start with worked examples, then guided practice.' },
    overload: { title: 'Too much', range: '80% or more', todo: 'Review the basics first, then teach it over two short sessions.' }
  };
  // The five load signals, as a teacher would say them.
  const SIGNAL_PLAIN = {
    intrinsic: 'The topic itself is demanding', time: 'Works slower than expected', error: 'Gets many answers wrong',
    hints: 'Relies on hints', deficit: 'Weak in the earlier topics it needs'
  };
  const GROUP_LABEL ={ adaptive: 'Adaptive', standard: 'Standard', '': 'Not in study' };
  // Share of rapid guesses above which a result is flagged as possibly not reflecting ability.
  const RAPID_WARN = 0.15;
  // Practice history rows shown at first, and added by each "Show more".
  const HISTORY_PAGE = 15;
  // Steps after the current one that My learning path shows before "Show the rest".
  const PATH_SOON = 2;
  const PATHWAY_STATE = { complete: 'Complete', active: 'In progress', new: 'Not started' };
  const ATTEMPT_LABEL = { diagnostic: 'Diagnostic', practice: 'Practice', quiz: 'Quiz', summative: 'Post-test' };
  // Tabs shown in a phone's bottom bar before the rest move into "More".
  const MOBILE_TABS = 4;
  const touchScreen = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  // ------------------------------------------------------------ state
  const S = {
    user: null,
    data: null,
    tab: 'dashboard',
    learnerId: pref('learner'),
    target: '',
    forecastSkill: '',
    budget: 60, runs: 300, sim: null, simKey: '', cohortTrack: '',
    bankTrack: 'STEM', bankSkill: '', bank: null, bankCounts: null, bankLoading: false,
    progressTrack: '', progressId: '', responses: {}, clockEnd: null, clockRunning: false,
    authMode: 'login', authRole: 'student', teacherSignup: 'open',
    quiz: null, after: null, feedback: null, selected: null, hint: null, busy: false,
    stepsShown: 0, setLog: [],
    summary: null, practiceBefore: null,
    // practiceSubject null: open the subject of the next path step.
    practiceSubject: null, historySubject: '', historyType: '', historyShown: HISTORY_PAGE,
    form: { skillId: '', type: 'quiz', date: today() }
  };
  let rev = 0;

  function pref(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(`neurolearnx.ui.${k}`);
      localStorage.setItem(`neurolearnx.ui.${k}`, v);
    } catch (e) { return null; }
    return null;
  }
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  const $ = sel => document.querySelector(sel);
  const panel = $('#panel');
  const pct = v => `${Math.round(v * 100)}%`;
  const f1 = v => (Math.round(v * 10) / 10).toFixed(1);
  const fmtP = p => (p < 0.001 ? '< .001' : p.toFixed(3).replace(/^0/, ''));
  const hm = mins => (mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60 ? `${mins % 60} min` : ''}`.trim() : `${mins} min`);
  const skillName = id => `${id} · ${G.byId[id].name}`;
  const firstName = name => name.split(/\s+/)[0];
  const initials = name => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const isStudent = () => S.user && S.user.role === 'student';
  const pill = (cls, label) => `<span class="pill ${cls}"><span class="dot"></span>${esc(label)}</span>`;
  const statusPill = st => pill(st, STUDENT_STATUS[st]);
  const bandPill = (band, load) => pill(band.key, `${isStudent() ? FEEL[band.key].title : BAND_PLAIN[band.key].title}${load != null ? ` · ${pct(load)}` : ''}`);
  const masteryBar = p => `<div class="mastery-cell"><div class="bar threshold"><span style="width:${(p * 100).toFixed(1)}%"></span></div><span class="num">${pct(p)}</span></div>`;
  const tile = (ic, label, value, sub) => `<div class="tile"><div class="tile-ic">${icon(ic)}</div><div><div class="label">${label}</div><div class="value">${value}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div></div>`;
  const cardTitle = (ic, title, sub) => `<div class="card-title"><span class="badge-ic">${icon(ic, 18)}</span><div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div></div>`;
  // Input with a leading icon.
  const field = (ic, input) => `<span class="field">${icon(ic, 18)}${input}</span>`;
  const pwField = (name, label, auto, extra = '') => `<label>${label}<span class="field pw-wrap">${icon('lock', 18)}<input type="password" name="${name}" autocomplete="${auto}" required placeholder="••••••••" ${extra}><button type="button" data-action="toggle-pw">Show</button></span></label>`;
  const trail = ic => icon(ic, 18).replace('class="ic"', 'class="ic trail"');

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }
  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  // Runs an API call; a lost session sends the user back to sign in.
  async function run(fn, errorEl) {
    try {
      return await fn();
    } catch (e) {
      if (e.status === 401 && S.user) { S.user = null; showAuth('login'); toast('Your session ended. Please sign in again.'); return undefined; }
      if (errorEl) errorEl.textContent = e.message; else toast(e.message);
      return undefined;
    }
  }

  // ------------------------------------------------------------ boot & data
  async function boot() {
    const s = await run(() => api.get('/api/session'));
    $('#boot').hidden = true;
    if (!s) { $('#boot').hidden = false; $('#boot').textContent = 'Cannot reach the NeuroLearn-X server.'; return; }
    if (s.setupNeeded) return showAuth('setup');
    S.teacherSignup = s.teacherSignup || 'open';
    if (!s.user) return showAuth('login');
    S.user = s.user;
    await enterApp();
  }

  async function loadData() {
    if (isStudent()) {
      const d = await api.get('/api/student/state');
      S.data = { ...d, learners: [d.learner] };
    } else {
      S.data = await api.get('/api/teacher/state');
      if (!S.data.learners.some(l => l.id === S.learnerId)) S.learnerId = S.data.learners[0] ? S.data.learners[0].id : null;
    }
    rev++;
  }

  async function enterApp() {
    const ok = await run(loadData);
    if (ok === undefined && !S.data) return;
    $('#auth').hidden = true;
    $('#app').hidden = false;
    const fromHash = location.hash.slice(1);
    S.tab = openable(fromHash) ? fromHash : 'dashboard';
    if (S.user.mustChange) S.tab = 'account';
    else if (isStudent()) {
      if (S.data.activeQuiz) await resumeQuiz();
      else if (S.data.needsDiagnostic) S.tab = 'diagnostic';
    }
    render();
  }

  function navItems() { return NAV[S.user.role]; }
  // Pages a link or the address bar may open: the nav tabs, plus a student's sub-pages.
  const openable = id => navItems().some(n => n.id === id) || (isStudent() && id in SUB_PAGES);
  function current() {
    if (isStudent()) return S.data.learners[0];
    return S.data.learners.find(l => l.id === S.learnerId) || S.data.learners[0] || null;
  }
  function compute() {
    const learner = current();
    const model = S.data.model;
    const useTarget = ['gaps', 'pathway', 'outcomes'].includes(S.tab);
    const analysis = learner ? analyze(learner, useTarget ? targetIds(learner) : null) : null;
    return { learner, model, analysis, seq: seqOf(learner) };
  }
  // The full chain for one learner, with the school's fitted BKT and forgetting up to today.
  const analyze = (learner, targets = null) => E.analyzeLearner({
    learner, attempts: S.data.attempts, graph: G, standard: seqOf(learner), model: S.data.model, targets, bkt: S.data.bkt || E.BKT, asOf: today()
  });
  // The goal chosen in the Target / My goal menu: a whole subject or one topic.
  function targetIds(learner) {
    if (!S.target) return null;
    if (S.target.startsWith('subj:')) {
      const sub = C.SUBJECTS[S.target.slice(5)];
      return sub && C.trackSubjects(learner.track).includes(sub.id) ? sub.sequence : null;
    }
    return seqOf(learner).includes(S.target) ? [S.target] : null;
  }
  const masteredCount = (a, seq) => seq.filter(id => E.masteryStatus(a.mastery[id]) === 'mastered').length;
  const avgMastery = (a, seq) => (seq.length ? E.mean(seq.map(id => a.mastery[id].p)) : 0);
  // Pages other than Account are off-limits until a forced password change,
  // and for students until the diagnostic (or an open class test) is done.
  const locked = () => S.user.mustChange ||
    (isStudent() && (S.data.needsDiagnostic || (['quiz', 'diagnostic'].includes(S.tab) && !!S.quiz && !S.quiz.finished && S.quiz.kind !== 'practice')));

  // ------------------------------------------------------------ auth screens
  function showAuth(mode) {
    S.authMode = mode;
    $('#boot').hidden = true;
    $('#app').hidden = true;
    $('#auth').hidden = false;
    renderAuth();
  }

  function renderAuth() {
    const card = $('#authCard');
    const m = S.authMode;
    const back = '<button class="back-link" type="button" data-action="auth-mode" data-mode="login">' + icon('arrow', 16) + ' Sign in</button>';
    const nameField = `<label>Full name${field('user', '<input name="name" autocomplete="name" required maxlength="80" placeholder="Juan Dela Cruz">')}</label>`;
    const userField = (auto = 'username') => `<label>Username${field('at', `<input name="username" autocomplete="${auto}" required maxlength="32" placeholder="juan.delacruz">`)}</label>`;
    if (m === 'setup') {
      card.innerHTML = `<h2>Set up NeuroLearn-X</h2><p class="lead">Create the first teacher account and class.</p>
        <form data-auth="setup" novalidate>
          ${nameField}${userField('username')}
          ${pwField('password', 'Password', 'new-password', 'minlength="8"')}
          <label>First class${field('school', '<input name="className" required maxlength="60" placeholder="Grade 11 – STEM A">')}</label>
          <p class="form-error" role="alert"></p>
          <button class="btn primary" type="submit">Create account ${trail('arrow')}</button>
        </form>`;
    } else if (m === 'teacher-register') {
      card.innerHTML = `${back}<h2>Create a teacher account</h2><p class="lead">Then share your class code with students.</p>
        <form data-auth="teacher-register" novalidate>
          ${nameField}${userField()}
          ${pwField('password', 'Password', 'new-password', 'minlength="8"')}
          ${pwField('confirm', 'Confirm password', 'new-password')}
          <label>First class <span class="hint">(optional)</span>${field('school', '<input name="className" maxlength="60" placeholder="Grade 11 – STEM A">')}</label>
          ${S.teacherSignup === 'code' ? `<label>School sign-up code${field('key', '<input name="signupCode" required autocomplete="off" placeholder="From your administrator">')}</label>` : ''}
          <p class="form-error" role="alert"></p>
          <button class="btn primary" type="submit">Create teacher account ${trail('arrow')}</button>
        </form>`;
    } else if (m === 'register') {
      card.innerHTML = `${back}<h2>Join your class</h2><p class="lead">Enter the code from your teacher.</p>
        <form data-auth="register" novalidate>
          <label>Class code${field('hash', '<input name="joinCode" required maxlength="12" autocomplete="off" style="text-transform:uppercase;letter-spacing:.14em;font-weight:700" placeholder="K7M2QX">')}</label>
          ${nameField}
          <label>Track${field('path', `<select name="track" required>${trackOptions('', 'Choose your track')}</select>`)}
            <span class="hint" id="trackHint" hidden></span></label>
          ${userField()}
          ${pwField('password', 'Password', 'new-password', 'minlength="6"')}
          ${pwField('confirm', 'Confirm password', 'new-password')}
          <p class="form-error" role="alert"></p>
          <button class="btn primary" type="submit">Create my account ${trail('arrow')}</button>
        </form>`;
    } else {
      const student = S.authRole === 'student';
      card.innerHTML = `<h2>Welcome back</h2><p class="lead">Sign in to continue.</p>
        <div class="tabs" role="tablist" data-active="${student ? 'student' : 'teacher'}">
          <button type="button" role="tab" aria-selected="${student}" data-action="auth-role" data-role="student">${icon('school', 18)} Student</button>
          <button type="button" role="tab" aria-selected="${!student}" data-action="auth-role" data-role="teacher">${icon('users', 18)} Teacher</button>
        </div>
        <form data-auth="login" novalidate>
          ${userField()}
          ${pwField('password', 'Password', 'current-password')}
          <p class="form-error" role="alert"></p>
          <button class="btn primary" type="submit">Sign in ${trail('arrow')}</button>
        </form>
        <div class="auth-alt">${authAlt(student)}</div>`;
    }
    // On phones, focusing would pop the keyboard over the screen before the user asks for it.
    const first = card.querySelector('input');
    if (first && !touchScreen()) first.focus({ preventScroll: true });
  }
  // The second way in: joining a class (students) or creating an account (teachers).
  function authAlt(student) {
    return `<div class="or">${student ? 'New student?' : 'New teacher?'}</div>
      ${student
        ? `<button class="btn secondary" type="button" data-action="auth-mode" data-mode="register">${icon('hash', 18)} Join your class with a code</button>
           <p class="auth-foot">Forgot your password? Ask your teacher.</p>`
        : `<button class="btn secondary" type="button" data-action="auth-mode" data-mode="teacher-register">${icon('userPlus', 18)} Create a teacher account</button>`}`;
  }
  // Switching role keeps the form (and anything typed) and slides the pill across.
  function setAuthRole(role) {
    S.authRole = role;
    const card = $('#authCard'), tabs = card.querySelector('.tabs');
    if (!tabs) return renderAuth();
    tabs.dataset.active = role;
    tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.role === role)));
    card.querySelector('.auth-alt').innerHTML = authAlt(role === 'student');
  }

  $('#authCard').addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    if (b.dataset.action === 'auth-role') setAuthRole(b.dataset.role);
    if (b.dataset.action === 'auth-mode') { S.authMode = b.dataset.mode; renderAuth(); }
    if (b.dataset.action === 'toggle-pw') togglePw(b);
  });

  // Show which subjects a track covers as soon as one is picked.
  $('#authCard').addEventListener('change', e => {
    if (e.target.name !== 'track') return;
    const hint = $('#trackHint');
    if (!hint) return;
    hint.hidden = !e.target.value;
    hint.textContent = e.target.value ? subjectList(e.target.value) : '';
  });

  $('#authCard').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const fd = Object.fromEntries(new FormData(form));
    const errEl = form.querySelector('.form-error');
    errEl.textContent = '';
    const btn = form.querySelector('button[type=submit]');
    const mode = form.dataset.auth;
    if ((mode === 'register' || mode === 'teacher-register') && fd.password !== fd.confirm) { errEl.textContent = 'The two passwords do not match.'; return; }
    if (mode === 'register' && !fd.track) { errEl.textContent = 'Choose your track: STEM, HUMSS, ABM or GAS.'; return; }
    btn.disabled = true;
    const url = { login: '/api/login', register: '/api/register', setup: '/api/setup', 'teacher-register': '/api/register-teacher' }[mode];
    const body = mode === 'login' ? { username: fd.username, password: fd.password, role: S.authRole } : fd;
    const res = await run(() => api.post(url, body), errEl);
    btn.disabled = false;
    if (!res) return;
    S.user = res.user;
    S.quiz = null; S.summary = null;
    await enterApp();
    if (mode === 'register' || mode === 'teacher-register') toast(`Welcome, ${firstName(res.user.name)}!`);
  });

  function togglePw(b) {
    const input = b.parentElement.querySelector('input');
    input.type = input.type === 'password' ? 'text' : 'password';
    b.textContent = input.type === 'password' ? 'Show' : 'Hide';
  }

  async function logout() {
    await run(() => api.post('/api/logout'));
    S.user = null; S.data = null; S.quiz = null; S.summary = null;
    history.replaceState(null, '', location.pathname);
    showAuth('login');
  }

  // ------------------------------------------------------------ chrome
  function renderChrome(ctx) {
    const items = navItems();
    const lock = locked();
    // A phone's bottom bar fits five tabs: with more, the first four stay and the rest open from "More".
    const overflow = items.length > MOBILE_TABS + 1 ? items.slice(MOBILE_TABS).map(n => n.id) : [];
    const navTab = SUB_PAGES[S.tab] || S.tab;
    const navButton = (n, cls = '') => `<button class="nav-item${cls}" type="button" data-tab="${n.id}"${n.id === navTab ? ' aria-current="page"' : ''}${lock && n.id !== 'account' ? ' disabled' : ''}>
        ${icon(n.icon)}<span class="lbl">${n.short ? `<span class="lbl-full">${n.label}</span><span class="lbl-short">${n.short}</span>` : n.label}</span>${n.step ? `<span class="step-no">${n.step}</span>` : ''}</button>`;
    const nav = items.map(n => navButton(n, overflow.includes(n.id) ? ' overflow' : ''));
    if (!isStudent()) nav.splice(4, 0, '<div class="side-label">Analysis chain</div>');
    if (overflow.length) {
      nav.push(`<button class="nav-item nav-more" type="button" data-action="nav-more" aria-expanded="${!!S.moreOpen}" aria-controls="moreSheet"${overflow.includes(S.tab) ? ' aria-current="page"' : ''}>${icon('more')}<span class="lbl">More</span></button>`);
    }
    $('#sideNav').innerHTML = nav.join('');
    $('#moreSheet').innerHTML = `<div class="more-grid">${items.filter(n => overflow.includes(n.id)).map(n => navButton(n)).join('')}</div>`;
    $('#moreSheet').hidden = $('#moreBackdrop').hidden = !(S.moreOpen && overflow.length);

    const page = items.find(n => n.id === S.tab);
    $('#pageTitle').textContent = page ? page.title : S.tab === 'quiz' && S.quiz ? quizTitle(S.quiz) : HIDDEN_TABS[S.tab] || '';
    const learner = ctx.learner;
    // The header stays to the page title; only the analysis chain notes its step.
    const sub = !isStudent() && page && page.step ? `Step ${page.step} of 5` : '';
    $('#pageSub').textContent = sub;
    $('#pageSub').hidden = !sub;
    $('#roleLabel').textContent = isStudent() ? 'Student' : 'Teacher';

    const showPicker = !isStudent() && LEARNER_TABS.includes(S.tab) && S.data.learners.length;
    $('#learnerPicker').hidden = !showPicker;
    if (showPicker) {
      $('#learnerSelect').innerHTML = S.data.learners.map(l => `<option value="${esc(l.id)}"${learner && l.id === learner.id ? ' selected' : ''}>${esc(l.name)}${l.section ? ` · ${esc(l.section)}` : ''}</option>`).join('');
    }
    $('#dataMenuWrap').hidden = isStudent();

    $('#sideCard').innerHTML = isStudent()
      ? `<b>${icon('bulb', 16)} Study tip</b>After each set, rate how hard you had to think. Your path uses it to pick the right kind of help.`
      : `<b>${icon('load', 16)} Load model</b>${ctx.model.calibrated ? `Calibrated on ${ctx.model.n} effort ratings.` : `Using starting weights until 12 effort ratings are logged (now ${ctx.model.n}).`}`;
    $('#sideUser').innerHTML = `<span class="avatar">${esc(initials(S.user.name))}</span>
      <div class="who"><b>${esc(S.user.name)}</b><span>@${esc(S.user.username)}</span></div>
      <button class="btn icon-btn" type="button" data-action="logout" title="Sign out" aria-label="Sign out">${icon('logout', 18)}</button>`;
  }

  function render() {
    const ctx = compute();
    renderChrome(ctx);
    history.replaceState(null, '', `#${S.tab}`);
    const views = {
      dashboard: isStudent() ? viewStudentHome : viewTeacherHome,
      classes: viewClasses, progress: viewProgress, bank: viewBank, models: viewModels, record: viewRecord, load: viewLoad,
      gaps: isStudent() ? viewMySkills : viewGaps,
      pathway: viewPathway, outcomes: viewOutcomes, practice: viewPractice, history: viewHistory,
      account: viewAccount, diagnostic: viewDiagnosticIntro, quiz: viewQuiz, results: viewResults,
      posttest: ({ learner }) => testIntro(learner, 'posttest', S.data.activeQuiz === 'posttest')
    };
    if (!isStudent() && LEARNER_TABS.includes(S.tab) && !ctx.learner) {
      panel.innerHTML = noStudents();
      return;
    }
    // Everything is organised by track subjects, so a learner without a track has nothing to show yet.
    if (ctx.learner && !ctx.learner.track && (isStudent() ? !['account', 'quiz', 'results', 'diagnostic'].includes(S.tab) : LEARNER_TABS.includes(S.tab))) {
      panel.innerHTML = isStudent() ? head('Choose your track', 'Your path, practice and tests follow the subjects of your track.') + trackCallout(ctx.learner)
        : `<div class="card empty"><h2>${esc(ctx.learner.name)} has no track yet</h2><p style="margin:8px 0 16px">Set their track (STEM, HUMSS, ABM or GAS) to analyse their subjects.</p>
          <button class="btn primary" type="button" data-action="go" data-tab="classes">${icon('users', 18)} Go to classes</button></div>`;
      return;
    }
    panel.innerHTML = (views[S.tab] || views.dashboard)(ctx);
    if (S.tab === 'outcomes') renderCohortStats();
    stackTables();
  }

  /*
   * On a narrow screen a table too wide to fit becomes one card per row, each
   * value labelled with its column heading, instead of scrolling sideways.
   * Re-checked whenever the page is drawn or the screen turns.
   */
  function stackTables() {
    panel.querySelectorAll('.table-wrap > table').forEach(t => {
      const heads = [...t.querySelectorAll('thead th')].map(th => th.textContent.trim());
      t.querySelectorAll('tbody tr').forEach(tr => [...tr.children].forEach((td, i) => {
        if (!td.hasAttribute('data-label') && !td.hasAttribute('colspan')) td.setAttribute('data-label', heads[i] || '');
      }));
      t.classList.remove('stack');
      if (window.innerWidth <= 640 && t.scrollWidth > t.parentElement.clientWidth + 2) t.classList.add('stack');
    });
  }
  let stackTimer = null;
  window.addEventListener('resize', () => { clearTimeout(stackTimer); stackTimer = setTimeout(stackTables, 150); });

  function noStudents() {
    return `<div class="card empty"><h2>No students yet</h2><p style="margin:8px 0 16px">Share your class code so students can join, or add student accounts yourself.</p>
      <button class="btn primary" type="button" data-action="go" data-tab="classes">${icon('users', 18)} Go to classes</button></div>`;
  }

  function setTab(id) {
    if (locked() && id !== 'account') return;
    S.moreOpen = false;
    S.tab = id;
    render();
    window.scrollTo({ top: 0 });
    panel.focus({ preventScroll: true });
  }

  function head(title, text, extra = '', eyebrow = '') {
    return `<div class="panel-head"><div>${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ''}<h2>${title}</h2>${text ? `<p>${text}</p>` : ''}</div>${extra}</div>`;
  }

  // Goal menu limited to the learner's track: everything, one subject, or one topic.
  function targetSelect(learner) {
    const track = learner && learner.track;
    const subs = C.trackSubjects(track);
    const sel = v => (S.target === v ? ' selected' : '');
    return `<label>${isStudent() ? 'My goal' : 'Goal'}
      <select data-bind="target">
        <option value="">${isStudent() ? 'All my subjects' : 'All of this student’s subjects'}</option>
        ${subs.map(id => `<option value="subj:${id}"${sel(`subj:${id}`)}>${esc(subjectName(track, id))} (whole subject)</option>`).join('')}
        ${subs.map(id => `<optgroup label="${esc(subjectName(track, id))}">${C.SUBJECTS[id].sequence.map(sk => `<option value="${sk}"${sel(sk)}>${esc(skillName(sk))}</option>`).join('')}</optgroup>`).join('')}
      </select></label>`;
  }

  // Skill cards grouped by the learner's track subjects.
  function subjectCards(learner, mastery, action) {
    return C.trackSubjects(learner.track).map(id => {
      const sub = C.SUBJECTS[id];
      const done = sub.sequence.filter(sk => E.masteryStatus(mastery[sk]) === 'mastered').length;
      return `<div class="card"><div class="card-head">${cardTitle('book', esc(subjectName(learner.track, id)), `${done} of ${sub.sequence.length} mastered · ${esc(sub.area)}`)}</div>
        <div class="skill-grid">${sub.sequence.map(sk => skillChip(sk, mastery[sk], action)).join('')}</div></div>`;
    }).join('');
  }

  function skillChip(id, m, action) {
    const st = E.masteryStatus(m);
    return `<div class="skill-chip ${st}" data-tip="${esc(`<b>${id} · ${G.byId[id].name}</b><br>${STUDENT_STATUS[st]} · ${pct(m.p)}`)}">
      <div class="top"><span class="id">${id}</span><span class="status-ic ${st}" aria-hidden="true">${STATUS_MARK[st]}</span></div>
      <div class="name">${esc(G.byId[id].short)}</div>
      ${masteryBar(m.p)}
      <div class="hint" style="margin-top:4px">${STUDENT_STATUS[st]}</div>
      ${action ? `<button class="btn small" type="button" style="margin-top:8px;width:100%" data-action="practice" data-skill="${id}">${icon('play', 14)} Practise</button>` : ''}
    </div>`;
  }

  function studentReason(step, diagnosis) {
    if (step.kind === 'learn') return `New topic in ${C.SUBJECTS[G.byId[step.skillId].subject].name}`;
    if (step.kind === 'review') return `You finished this ${step.review.sinceDays} days ago. A short review keeps it from fading.`;
    const gap = diagnosis.gaps.find(g => g.id === step.skillId);
    const needs = gap ? gap.blocks.slice(0, 3).map(b => G.byId[b].short).join(', ') + (gap.blocks.length > 3 ? ' and more' : '') : '';
    return step.kind === 'verify' ? `Let's check you remember this. You need it for ${needs}.` : `Builds a skill you need for ${needs}.`;
  }

  // ------------------------------------------------------------ student: diagnostic & quizzes
  function viewDiagnosticIntro({ learner }) {
    const resume = S.data.activeQuiz === 'diagnostic';
    if (!learner.track) {
      return `<section class="hero"><div class="hero-main"><h2>Welcome, ${esc(firstName(learner.name))}!</h2>
        <p>Choose your track first. Your diagnostic checks the subjects of that track.</p></div></section>${trackCallout(learner)}`;
    }
    return testIntro(learner, 'diagnostic', resume);
  }

  // Intro shared by the diagnostic (pre-test) and the post-test: same format, so the scores compare.
  function testIntro(learner, kind, resume) {
    const subs = C.trackSubjects(learner.track);
    const topics = seqOf(learner).length;
    const pre = kind === 'diagnostic';
    const action = pre ? 'start-diagnostic' : 'start-posttest';
    return `<section class="hero">
        <div class="hero-main">
          <h2>${resume ? 'Welcome back' : pre ? `Welcome, ${esc(firstName(learner.name))}!` : 'Time for your post-test'}</h2>
          <p>${resume ? 'Your answers are saved. The clock continues where you left off.' : pre ? 'Let’s find out what you already know, so your path starts in the right place.' : 'You finished your path. Let’s see how much you have grown since your diagnostic.'}</p>
        </div>
        <div class="hero-side"><button class="btn light" type="button" data-action="${action}">${icon('play', 18)} ${resume ? 'Continue' : 'Start'}</button></div>
      </section>
      <div class="intro-steps">
        <div><b>${icon('clock', 18)} ${QZ_MINUTES} minutes</b>${topics} questions, one on each topic of your ${subs.length} subjects. Questions you do not reach count as not answered.</div>
        <div><b>${icon('target', 18)} No hints</b>Answers are shown at the end. ${pre ? 'This is also your pre-test.' : 'Your score is compared with your diagnostic.'}</div>
        <div><b>${icon('load', 18)} One rating per subject</b>After each subject, tell us how hard you had to think.</div>
      </div>`;
  }

  async function startQuiz(kind, skillId) {
    if (S.busy) return;
    S.busy = true;
    if (kind === 'practice') {
      const { analysis } = compute();
      S.practiceBefore = { skillId, p: analysis.mastery[skillId].p };
    }
    const res = await run(() => api.post('/api/quiz/start', { kind, skillId }));
    S.busy = false;
    if (!res) return;
    if (res.quiz.finished) { await finishQuiz(res.quiz); return; }
    S.quiz = res.quiz;
    syncClock(res.quiz, true);
    S.after = null; S.feedback = null; S.selected = null; S.hint = res.quiz.question ? res.quiz.question.hint : null;
    S.setLog = []; S.stepsShown = 0; S.rapidWarned = false;
    S.data.activeQuiz = kind;
    S.tab = 'quiz';
    render();
    window.scrollTo({ top: 0 });
  }

  async function resumeQuiz() {
    const res = await run(() => api.get('/api/quiz/current'));
    if (res && res.quiz && res.quiz.finished) {
      // The clock ran out while the student was away.
      S.summary = { kind: res.quiz.kind, ...res.quiz.summary };
      S.tab = 'results';
      await run(loadData);
    } else if (res && res.quiz) {
      S.quiz = res.quiz; syncClock(res.quiz, true); S.after = null; S.feedback = null; S.selected = null;
      S.hint = res.quiz.question ? res.quiz.question.hint : null;
      S.setLog = []; S.stepsShown = 0; S.rapidWarned = false;
      S.tab = 'quiz';
    } else if (S.data.needsDiagnostic) S.tab = 'diagnostic';
  }

  function quizTitle(q) {
    if (q.kind === 'diagnostic') return 'Diagnostic';
    if (q.kind === 'posttest') return 'Post-test';
    return `Practice · ${q.skill ? q.skill.short : ''}`;
  }

  // ------------------------------------------------------------ test clock
  /*
   * The server owns the clock and ends the test; the page counts down between
   * requests. The countdown lives in one place (clock.left at clock.at) and
   * every redraw reads it, so selecting an answer never resets it. Server
   * updates may only move it down: the server's figure includes request time
   * the page cannot see, so it can be a moment ahead or behind, and a clock
   * that steps back reads as a glitch. A fresh start, or the server reporting
   * time left after the page reached zero, resets it.
   */
  const QZ_MINUTES = 30;
  let clockTimer = null;
  const clock = { left: 0, at: 0, running: false, kind: null };
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const clockLeft = () => Math.max(0, clock.running ? clock.left - (Date.now() - clock.at) / 1000 : clock.left);
  function syncClock(q, reset = false) {
    if (!q || !q.timer) { clock.kind = null; return; }
    const server = q.timer.remainingSec;
    const sameTest = !reset && clock.kind === q.kind;
    clock.left = sameTest ? Math.min(clockLeft(), server) : server;
    clock.at = Date.now();
    clock.running = !!q.timer.running;
    clock.kind = q.kind;
    if (!clockTimer) clockTimer = setInterval(tickClock, 250);
    tickClock();
  }
  function paintClock(el) {
    const left = clockLeft();
    el.querySelector('b').textContent = mmss(Math.ceil(left));
    el.classList.toggle('low', left <= 300);
    el.classList.toggle('critical', left <= 60);
    el.classList.toggle('paused', !clock.running);
  }
  function tickClock() {
    const el = $('#quizClock');
    if (!el || !S.quiz || !S.quiz.timer || S.quiz.finished) return;
    paintClock(el);
    if (clock.running && clockLeft() <= 0 && !S.busy && !S.clockExpiring) {
      S.clockExpiring = true;
      run(() => api.get('/api/quiz/current')).then(async r => {
        S.clockExpiring = false;
        if (r && r.quiz && r.quiz.finished) { toast('Time is up. Your answers are saved.'); await finishQuiz(r.quiz); }
        else if (r && r.quiz) { S.quiz = r.quiz; syncClock(r.quiz, true); }
      });
    }
  }
  const clockHtml = q => {
    if (!q.timer) return '';
    const left = clock.kind === q.kind ? clockLeft() : q.timer.remainingSec;
    return `<div class="quiz-clock${left <= 300 ? ' low' : ''}${left <= 60 ? ' critical' : ''}" id="quizClock" role="timer" aria-label="Time left">${icon('clock', 16)}<b>${mmss(Math.ceil(left))}</b></div>`;
  };

  function viewQuiz() {
    const q = S.quiz;
    if (!q) return '<div class="card empty">No quiz in progress.</div>';
    const planned = Math.max(q.blocksPlanned, q.blocksDone + 1);
    const progress = q.kind === 'practice' ? '' : `<div class="quiz-progress">${q.kind === 'diagnostic' ? `Set ${q.blocksDone + 1} of about ${planned}` : `Subject ${q.blocksDone + 1} of ${planned}`}${q.block && q.kind !== 'practice' ? ` · <b>${esc(q.block.label)}</b>` : ''}
      <div class="track"><span style="width:${Math.min(100, (q.blocksDone / planned) * 100)}%"></span></div></div>`;
    let body;
    if (q.awaitingEffort) {
      const sc = q.blockScore;
      body = `<div class="card">
        <p class="eyebrow">${icon('check', 14)} ${q.block ? esc(q.block.label) : 'Set'} complete${sc.correct != null ? ` · ${sc.correct} of ${sc.total} correct` : ''}</p>
        <h2 style="font-size:1.3rem">How hard did you have to think in that set?</h2>
        <p class="muted" style="margin-top:4px">There is no wrong answer. This tells your path how much support to give you.</p>
        <div class="effort-scale" role="group" aria-label="Mental effort from 1 to 9">
          ${PAAS.map((p, i) => `<button type="button" data-action="effort" data-value="${i + 1}" title="${p}" aria-label="${i + 1}: ${p}">${i + 1}</button>`).join('')}
        </div>
        <div class="effort-ends"><span>1 · Very, very easy</span><span>5 · In between</span><span>9 · Very, very hard</span></div>
        <div class="quiz-actions"><span></span><button class="btn ghost" type="button" data-action="effort" data-value="">Skip this question</button></div>
      </div>`;
    } else {
      const qu = q.question;
      const fb = S.feedback;
      const choices = qu.choices.map((c, i) => {
        let cls = '';
        if (fb && !fb.saved) cls = i === fb.answer ? ' correct' : i === fb.choice ? ' wrong' : '';
        return `<button class="choice${cls}" type="button" data-action="choose" data-index="${i}" aria-pressed="${S.selected === i}"${fb ? ' disabled' : ''}>
          <span class="letter">${'ABCD'[i]}</span><span class="choice-body">${mx(c)}</span></button>`;
      }).join('');
      body = `<div class="card">
        <div class="quiz-top">
          <span class="skill-tag">${icon('target', 16)} ${esc(q.skill.name)}</span>
          <span class="dots" aria-label="Question ${q.itemIndex + 1} of ${q.itemsInBlock}">${Array.from({ length: q.itemsInBlock }, (_, i) => `<i class="${i < q.itemIndex || (i === q.itemIndex && fb) ? 'done' : i === q.itemIndex ? 'now' : ''}"></i>`).join('')}</span>
        </div>
        <div class="hint" style="font-weight:700">Question ${q.itemIndex + 1} of ${q.itemsInBlock}</div>
        <div class="question">${mx(qu.prompt)}</div>
        <div class="choices">${choices}</div>
        ${S.hint && !fb ? `<div class="hint-box">${icon('bulb', 18)}<div><b>Hint</b>${mx(S.hint)}</div></div>` : ''}
        ${fb ? feedbackPanel(q, fb) : ''}
        <div class="quiz-actions">
          <div>${qu.hintsAllowed && !fb && !S.hint ? `<button class="btn" type="button" data-action="hint">${icon('bulb', 16)} Show a hint</button>` : ''}</div>
          ${fb ? `<button class="btn primary" type="button" data-action="next">Next ${icon('arrow', 16)}</button>`
            : `<button class="btn primary" type="button" data-action="check"${S.selected == null ? ' disabled' : ''}>Check answer</button>`}
        </div>
      </div>`;
    }
    const exit = q.kind === 'practice'
      ? '<button class="btn ghost small" type="button" data-action="quit-practice">Stop practising</button>'
      : clockHtml(q);
    return `<div class="quiz">
      <div class="panel-head"><div><span class="eyebrow">${q.kind === 'diagnostic' ? 'Pre-test' : q.kind === 'posttest' ? 'After your path' : 'Practice set'}</span><h2>${esc(quizTitle(q))}</h2></div>${exit}</div>
      ${progress}${body}</div>`;
  }

  /*
   * Explainable feedback after an answer: why the chosen option is wrong (the
   * misconception that produces it), a worked solution revealed one step at a
   * time, the key idea, and a tutor note personalized from this student's
   * mastery and their answers so far in the set.
   */
  function feedbackPanel(q, fb) {
    if (fb.saved) return `<div class="feedback ok">${icon('check', 18)}<div><b>Answer saved.</b>Your score is shown at the end of the test.</div></div>`;
    const steps = fb.steps || [];
    const shown = Math.min(S.stepsShown, steps.length);
    const L = 'ABCD';
    const head = fb.correct
      ? `<b>Correct!</b>${fb.hinted ? 'You used a hint on this one.' : 'Well reasoned.'}`
      : `<b>Not quite. The answer is ${L[fb.answer]}: <span class="inline-choice">${mx(q.question.choices[fb.answer])}</span></b>
         ${fb.why ? `<div class="why"><span class="why-tag">Why ${L[fb.choice]} is not right</span>${mx(fb.why)}</div>` : ''}`;
    return `<div class="feedback ${fb.correct ? 'ok' : 'no'}">${icon(fb.correct ? 'check' : 'alert', 18)}<div>${head}</div></div>
      <div class="solution">
        <div class="solution-head"><b>${icon('path', 16)} Why the answer is ${L[fb.answer]}: step by step</b><span class="hint">${shown} of ${steps.length}</span></div>
        ${shown ? `<ol class="sol-steps">${steps.slice(0, shown).map(s => `<li>${mx(s)}</li>`).join('')}</ol>` : ''}
        ${shown < steps.length ? `<div class="row-actions" style="justify-content:flex-start;margin-top:8px">
          <button class="btn small" type="button" data-action="step-next">${shown === 0 ? 'Walk me through it' : 'Next step'}</button>
          ${steps.length - shown > 1 ? '<button class="btn small" type="button" data-action="steps-all">Show all steps</button>' : ''}</div>` : ''}
        ${fb.idea ? `<div class="idea"><span class="why-tag">Key idea</span>${mx(fb.idea)}</div>` : ''}
      </div>
      ${q.kind === 'practice' ? tutorNote(q, fb) : ''}`;
  }

  function tutorNote(q, fb) {
    const { analysis } = compute();
    const log = S.setLog;
    const notes = [];
    let streak = 0;
    for (let i = log.length - 1; i >= 0 && log[i].correct; i--) streak++;
    const lastTwoWrong = log.length >= 2 && !log[log.length - 1].correct && !log[log.length - 2].correct;
    if (fb.rapid) notes.push(`That answer came in under ${E.RAPID_SEC} seconds, so it does not count toward your mastery. Read the question fully, then answer.`);
    else if (lastTwoWrong) notes.push('Two tricky ones in a row is normal when a topic is new. Go through every step above before the next question: it uses the same idea.');
    else if (fb.correct && fb.hinted) notes.push('The hint helped you get there. On the next question, try the first step on your own before opening the hint.');
    else if (!fb.correct && fb.hinted) notes.push('Even with the hint this one was hard. Focus on the first step of the solution; once it clicks, the rest follows.');
    else if (fb.correct && streak >= 2) notes.push(`${streak} in a row. You are getting the hang of this.`);
    else if (fb.correct) notes.push('Nice. Read the key idea so you can do it again without help.');
    else notes.push('Read why your choice does not work, then walk through the solution one step at a time.');
    const weak = G.byId[q.skill.id].prereqs.map(id => ({ id, m: analysis.mastery[id] })).filter(x => x.m.p < 0.6).sort((a, b) => a.m.p - b.m.p)[0];
    if (weak && !fb.correct) notes.push(`This question builds on ${G.byId[weak.id].name}, where you are at ${pct(weak.m.p)}. A short practice on it after this set will make questions like this easier.`);
    return `<div class="tutor"><span class="tutor-ic">${icon('bulb', 18)}</span><div><b>Your tutor</b>${notes.map(n => `<p>${esc(n)}</p>`).join('')}</div></div>`;
  }

  async function quizAction(action, b) {
    if (S.busy) return;
    if (action === 'choose') { S.selected = Number(b.dataset.index); render(); return; }
    if (action === 'step-next') { S.stepsShown++; render(); return; }
    if (action === 'steps-all') { S.stepsShown = 99; render(); return; }
    S.busy = true;
    try {
      if (action === 'hint') {
        const r = await run(() => api.post('/api/quiz/hint'));
        if (r) S.hint = r.hint;
      } else if (action === 'check') {
        const choice = S.selected;
        const r = await run(() => api.post('/api/quiz/answer', { choice }));
        if (r && r.feedback.saved) {
          // Timed tests reveal nothing per question: go straight on.
          S.quiz = r.quiz; S.selected = null; S.feedback = null; S.after = null;
          syncClock(r.quiz);
          // One gentle reminder per test: answers under 3 seconds are flagged.
          if (r.feedback.rapid && !S.rapidWarned) { S.rapidWarned = true; toast('That was very quick. Read each question fully before answering.'); }
          if (r.quiz.finished) {
            if (r.feedback.timeUp) toast('Time is up. Your answers are saved.');
            await finishQuiz(r.quiz); return;
          }
        } else if (r) {
          S.feedback = { ...r.feedback, choice };
          S.after = r.quiz;
          if (!r.feedback.saved) {
            S.lastIdea = r.feedback.idea;
            S.setLog.push({ skillId: S.quiz.skill.id, correct: r.feedback.correct, hinted: r.feedback.hinted, why: r.feedback.why });
            const n = S.setLog.length;
            // Open the walk-through on a wrong answer; open it fully after two misses in a row.
            S.stepsShown = r.feedback.correct ? 0 : (n >= 2 && !S.setLog[n - 2].correct ? 99 : 1);
          }
        }
      } else if (action === 'next') {
        if (S.after && (S.after.awaitingEffort || S.after.finished)) S.quiz = S.after;
        else {
          const r = await run(() => api.get('/api/quiz/current'));
          if (r && r.quiz) S.quiz = r.quiz;
        }
        S.feedback = null; S.selected = null; S.after = null;
        S.hint = S.quiz.question ? S.quiz.question.hint : null;
        if (S.quiz.finished) { await finishQuiz(S.quiz); return; }
      } else if (action === 'effort') {
        const value = b.dataset.value ? Number(b.dataset.value) : null;
        const r = await run(() => api.post('/api/quiz/effort', { effort: value }));
        if (r) {
          S.quiz = r.quiz;
          S.hint = r.quiz.question ? r.quiz.question.hint : null;
          if (r.quiz.finished) { await finishQuiz(r.quiz); return; }
          if (r.quiz.question) {
            const cur = await run(() => api.get('/api/quiz/current'));
            if (cur && cur.quiz) S.quiz = cur.quiz;
            if (S.quiz.finished) { await finishQuiz(S.quiz); return; }
          }
          syncClock(S.quiz);
        }
      } else if (action === 'quit-practice') {
        await run(() => api.post('/api/quiz/quit'));
        S.quiz = null; S.data.activeQuiz = null;
        S.tab = 'practice';
      }
      render();
      if (action === 'next' || action === 'effort') window.scrollTo({ top: 0 });
    } finally {
      S.busy = false;
    }
  }

  async function finishQuiz(q) {
    S.summary = { kind: q.kind, ...q.summary };
    S.quiz = null;
    await run(loadData);
    S.tab = 'results';
    S.busy = false;
    render();
    window.scrollTo({ top: 0 });
  }

  // ------------------------------------------------------------ pre/post results (both roles)
  const VERDICT = { improved: ['mastered', 'Improved'], same: ['developing', 'About the same'], declined: ['gap', 'Declined'] };
  const verdictPill = imp => (imp ? pill(...VERDICT[imp.verdict]) : pill('unverified', 'Waiting for post-test'));
  const signed = v => `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v))}`;

  // One topic of a test: right, wrong, or not reached in time.
  function topicResultRow(t) {
    const st = !t.answered ? 'unverified' : t.correct ? 'mastered' : 'gap';
    const label = !t.answered ? 'Not reached' : t.correct ? 'Correct' : 'Not correct';
    return `<div class="result-row"><span class="status-ic ${st}">${STATUS_MARK[st]}</span><div><b style="font-size:.9rem">${esc(t.name || G.byId[t.id].name)}</b><div class="hint">${label}</div></div></div>`;
  }

  function improvementTiles(imp, post) {
    return `<div class="tiles">
      ${tile('book', 'Diagnostic (pre-test)', `${imp.pre}%`, 'before your path')}
      ${tile('star', 'Post-test', `${imp.post}%`, post && post.timeSec != null ? `${mmss(post.timeSec)} used` : 'after your path')}
      ${tile('chart', 'Change', `<span class="${imp.change >= 0 ? 'delta-up' : 'delta-down'}">${imp.change >= 0 ? '▲' : '▼'} ${signed(imp.change)}</span>`, 'percentage points')}
      ${tile('target', 'Normalized gain', imp.nGain == null ? '—' : imp.nGain.toFixed(2), 'share of the possible gain')}
    </div>`;
  }

  // Pre and post score of every subject, side by side.
  function prePostBars(preSubjects, postSubjects) {
    const preBy = Object.fromEntries((preSubjects || []).map(s => [s.id, s]));
    const pctOf = s => (s && s.total ? Math.round(100 * s.correct / s.total) : null);
    const rows = (postSubjects || preSubjects || []).map(s => {
      const a = pctOf(preBy[s.id]), b = postSubjects ? pctOf(s) : null;
      const ch = a != null && b != null ? b - a : null;
      return `<div class="pp-row"><div class="pp-label">${esc(s.label)}</div>
        <div class="pp-bars"><div class="pp-bar pre"><i style="width:${a || 0}%"></i><span>${a == null ? '—' : `${a}%`}</span></div>
          <div class="pp-bar post"><i style="width:${b || 0}%"></i><span>${b == null ? '—' : `${b}%`}</span></div></div>
        <div class="pp-change ${ch == null ? '' : ch > 0 ? 'delta-up' : ch < 0 ? 'delta-down' : ''}">${ch == null ? '' : signed(ch)}</div></div>`;
    }).join('');
    return `<div class="legend" style="margin-bottom:10px"><span><i class="key pre"></i>Diagnostic (pre-test)</span><span><i class="key post"></i>Post-test</span></div><div class="pp-list">${rows}</div>`;
  }

  function viewResults({ analysis, learner }) {
    const sm = S.summary;
    if (!sm) return viewStudentHome({ analysis, learner });
    if (sm.kind === 'diagnostic' || sm.kind === 'posttest') {
      const pre = sm.kind === 'diagnostic';
      const topics = sm.subjects.flatMap(s => s.topics);
      const right = topics.filter(t => t.correct).length, missed = topics.filter(t => t.answered && !t.correct).length;
      const timeNote = `${mmss(sm.timeSec)} of ${QZ_MINUTES}:00 used${sm.timedOut ? ' · time ran out' : ''}`;
      const subjectCards = `<div class="grid halves">${sm.subjects.map(s => `<div class="card"><div class="card-head">${cardTitle('book', esc(s.label), `${s.correct} of ${s.total} correct`)}</div>
          <div class="result-list">${s.topics.map(topicResultRow).join('')}</div></div>`).join('')}</div>`;
      if (pre) {
        const steps = analysis.pathway.steps.slice(0, 3);
        return `<section class="hero"><div class="hero-main"><h2>Your starting point is ready!</h2>
            <p>Your path now starts with what will help you most.</p></div>
            <div class="hero-side"><span class="next-label">Pre-test score</span><span class="next-skill" style="font-size:2.2rem">${sm.percent}%</span>
              <button class="btn light" type="button" data-action="go" data-tab="dashboard">Go to my dashboard ${icon('arrow', 18)}</button></div></section>
          <div class="tiles">
            ${tile('check', 'Correct', `${right}<span class="muted" style="font-size:1rem;font-weight:600"> / ${topics.length}</span>`, 'one question per topic')}
            ${tile('alert', 'To strengthen', missed, 'built into your path')}
            ${tile('clock', 'Time', mmss(sm.timeSec), timeNote)}
            ${tile('path', 'Steps on your path', analysis.pathway.steps.length, hm(analysis.pathway.totalMinutes))}
          </div>
          <div class="card"><div class="card-head">${cardTitle('path', 'Your first steps')}<button class="btn link" type="button" data-action="go" data-tab="pathway">My whole path ${icon('arrow', 16)}</button></div>
            ${steps.length ? `<div class="next-list">${steps.map((s, i) => `<div class="next-item"><span class="n">${i + 1}</span><div><div class="t">${esc(G.byId[s.skillId].name)}</div><div class="s">${STUDENT_KIND[s.kind]} · ${s.minutes} min</div></div><span></span></div>`).join('')}</div>` : '<div class="empty">You have nothing left to learn here!</div>'}</div>
          ${subjectCards}`;
      }
      const preRes = S.data.results && S.data.results.pre;
      const imp = preRes ? E.improvement(preRes.percent, sm.percent) : null;
      return `<section class="hero"><div class="hero-main"><h2>${imp && imp.verdict === 'improved' ? 'You improved!' : 'Post-test complete'}</h2>
          <p>${imp ? `From ${imp.pre}% on your diagnostic to ${imp.post}% now.` : 'Your teacher can now see your score.'}</p></div>
          <div class="hero-side"><span class="next-label">Post-test score</span><span class="next-skill" style="font-size:2.2rem">${sm.percent}%</span>
            <button class="btn light" type="button" data-action="go" data-tab="dashboard">Go to my dashboard ${icon('arrow', 18)}</button></div></section>
        ${imp ? improvementTiles(imp, sm) : ''}
        ${preRes ? `<div class="card"><div class="card-head">${cardTitle('chart', 'Before and after, by subject')}</div>${prePostBars(preRes.subjects, sm.subjects)}</div>` : ''}
        ${subjectCards}`;
    }
    const b = { ...sm.blocks[0], skillId: sm.blocks[0].id, name: sm.blocks[0].label };
    const before = S.practiceBefore && S.practiceBefore.skillId === b.skillId ? S.practiceBefore.p : null;
    const after = analysis.mastery[b.skillId].p;
    const up = before != null ? after - before : 0;
    // Tutor summary: the misconceptions behind this set's wrong answers, and
    // the weakest prerequisite worth practising next.
    const misses = [...new Set(S.setLog.filter(e => !e.correct && e.why).map(e => e.why))].slice(0, 3);
    const hinted = S.setLog.filter(e => e.hinted).length;
    const weak = G.byId[b.skillId].prereqs.map(id => ({ id, p: analysis.mastery[id].p })).filter(x => x.p < 0.6).sort((x, y) => x.p - y.p)[0];
    const tutor = `<div class="card tutor-card" style="max-width:640px;margin:18px auto 0">
      <div class="card-head">${cardTitle('bulb', 'Your tutor’s summary', 'Based on your answers in this set')}</div>
      ${misses.length ? `<p style="font-weight:600;margin-bottom:6px">What tripped you up:</p><ul class="miss-list">${misses.map(w => `<li>${mx(w)}</li>`).join('')}</ul>`
        : '<p>No mistakes in this set. Keep practising now and then so it stays fresh.</p>'}
      ${hinted ? `<p class="muted" style="margin-top:8px">You used ${hinted} hint${hinted === 1 ? '' : 's'}. Next time, try the first step on your own before opening one.</p>` : ''}
      ${weak ? `<div class="callout" style="margin:14px 0 0"><div><b>Strengthen ${esc(G.byId[weak.id].name)} first</b><span class="muted" style="font-size:.88rem">This topic builds on it, and you are at ${pct(weak.p)} there.</span></div>
        <button class="btn primary" type="button" data-action="practice" data-skill="${weak.id}">${icon('play', 14)} Practise it</button></div>` : ''}
      ${S.lastIdea ? `<div class="idea" style="margin-top:12px"><span class="why-tag">Key idea</span>${mx(S.lastIdea)}</div>` : ''}
    </div>`;
    return `<div class="card" style="max-width:640px;margin:0 auto;text-align:center">
      <p class="eyebrow">${icon('check', 14)} Practice complete</p><h2>${esc(b.name)}</h2>
      <div class="big-score" style="margin:16px 0">${b.correct}/${b.total}</div>
      <p class="muted">Mastery is now <b>${pct(after)}</b>${before != null ? ` <span class="${up >= 0 ? 'delta-up' : 'delta-down'}">(${up >= 0 ? '▲ +' : '▼ −'}${Math.round(Math.abs(up) * 100)} points)</span>` : ''}.
        ${E.masteryStatus(analysis.mastery[b.skillId]) === 'mastered' ? 'You have mastered this skill!' : 'Keep going: another set will help it stick.'}</p>
      <div class="row" style="justify-content:center;margin-top:18px;flex-wrap:wrap">
        <button class="btn" type="button" data-action="practice" data-skill="${b.skillId}" style="flex:0 0 auto">${icon('refresh', 16)} Practise again</button>
        <button class="btn primary" type="button" data-action="go" data-tab="pathway" style="flex:0 0 auto">Back to my path ${icon('arrow', 16)}</button>
      </div></div>${tutor}`;
  }

  // ------------------------------------------------------------ student pages
  // Post-test invitation once the path is complete (or the teacher opened it).
  function postTestCallout() {
    const pt = S.data.posttest;
    if (!pt || pt.done) return '';
    if (S.data.activeQuiz === 'posttest') {
      return `<div class="callout"><div><b>${icon('clock', 16)} Your post-test is in progress</b></div>
        <button class="btn primary" type="button" data-action="start-posttest">Continue</button></div>`;
    }
    if (!pt.available) return '';
    return `<div class="callout"><div><b>${icon('star', 16)} ${pt.reason === 'path' ? 'You completed your learning path!' : 'Your teacher opened the post-test'}</b>
      <span class="muted" style="font-size:.88rem">${QZ_MINUTES} minutes · see how much you improved since your diagnostic.</span></div>
      <button class="btn primary" type="button" data-action="go" data-tab="posttest">Take the post-test</button></div>`;
  }

  // Path progress toward the post-test, or the before/after result once taken.
  function progressCard(learner, analysis) {
    const res = S.data.results || {};
    if (res.pre && res.post) {
      const imp = E.improvement(res.pre.percent, res.post.percent);
      return `<div class="card"><div class="card-head">${cardTitle('chart', 'My improvement', 'Diagnostic compared with post-test')}${verdictPill(imp)}</div>
        ${improvementTiles(imp, res.post)}${prePostBars(res.pre.subjects, res.post.subjects)}</div>`;
    }
    const prog = analysis.progress;
    const near = Math.round(E.MASTERY.near * 100);
    return `<div class="card"><div class="card-head">${cardTitle('path', 'Path progress', `A topic is complete at ${near}% mastery. Complete them all to unlock the post-test.`)}<span class="score" style="font-weight:800">${prog.percent}% <span class="muted" style="font-weight:600">· ${prog.done}/${prog.total}</span></span></div>
      <div class="progress-track big"><span style="width:${prog.total ? (prog.done / prog.total) * 100 : 0}%"></span></div>
      <p class="hint" style="margin-top:10px">${prog.almost.length ? `<b>${prog.almost.length}</b> more ${prog.almost.length === 1 ? 'topic is' : 'topics are'} close (60% or more). ` : ''}${res.pre ? `Diagnostic (pre-test): <b>${res.pre.percent}%</b>` : ''}</p></div>`;
  }

  /*
   * Spaced review: completed topics whose predicted recall has faded below
   * near-mastery, and when the next ones fall due. Reviewing a little before
   * forgetting sets in makes each memory last longer.
   */
  function reviewCard(analysis, compact, skip = '') {
    const due = analysis.reviews.filter(r => r.due && r.id !== skip).sort((a, b) => a.recall - b.recall);
    const soon = analysis.reviews.filter(r => !r.due && Number.isFinite(r.inDays)).sort((a, b) => a.inDays - b.inDays).slice(0, 3);
    if (!due.length && !soon.length) return '';
    const row = r => `<div class="next-item"><span class="n">${icon('refresh', 14)}</span>
      <div><div class="t">${esc(G.byId[r.id].name)}</div><div class="s">${r.due ? `Recall about ${pct(r.recall)} · last practised ${r.sinceDays} day${r.sinceDays === 1 ? '' : 's'} ago` : `Review in ${r.inDays} day${r.inDays === 1 ? '' : 's'}`}</div></div>
      ${r.due ? `<button class="btn small" type="button" data-action="practice" data-skill="${r.id}">${icon('play', 14)} Review</button>` : '<span></span>'}</div>`;
    return `<div class="card"><div class="card-head">${cardTitle('refresh', due.length ? `${due.length} topic${due.length === 1 ? '' : 's'} due for review` : 'Coming up for review', 'Short reviews keep finished topics fresh')}</div>
      <div class="next-list">${due.slice(0, compact ? 3 : 8).map(row).join('')}${due.length ? '' : soon.map(row).join('')}</div></div>`;
  }

  // Students from before tracks existed are asked to pick one.
  function trackCallout(learner) {
    if (learner.track) return '';
    return `<div class="callout"><div><b>${icon('school', 16)} Choose your track</b>
      <span class="muted" style="font-size:.88rem">Your path will focus on the subjects of your track.</span></div>
      <label style="flex:0 1 220px"><select data-bind="my-track">${trackOptions('', 'Choose your track')}</select></label></div>`;
  }

  function viewStudentHome({ learner, analysis, model, seq }) {
    const steps = analysis.pathway.steps;
    const firstWhy = steps.length ? E.explainPathway(analysis, G, seq, model).steps[0].reasons[0].student : '';
    const next = steps[0];
    const mastered = masteredCount(analysis, seq);
    const own = E.sortAttempts(S.data.attempts).reverse();
    const toFix = analysis.diagnosis.gaps.length;

    const hero = `<section class="hero">
      <div class="hero-main">
        <h2>Hi, ${esc(firstName(learner.name))}!</h2>
        <p>${steps.length ? `Your ${learner.track ? `${esc(learner.track)} ` : ''}path has ${steps.length} steps, picked for what you already know. Take them one at a time.` : 'You have mastered every topic in your track subjects. Amazing work!'}</p>
        <div class="progress">
          <div class="progress-label"><span>${mastered} of ${seq.length} topics mastered</span><span>${pct(mastered / seq.length)}</span></div>
          <div class="progress-track"><span style="width:${(mastered / seq.length) * 100}%"></span></div>
        </div>
      </div>
      ${next ? `<div class="hero-side">
        <span class="next-label">Up next</span>
        <span class="next-skill">${esc(G.byId[next.skillId].name)}</span>
        <button class="btn light" type="button" data-action="practice" data-skill="${next.skillId}">${icon('play', 16)} Start this step</button>
      </div>` : ''}
    </section>`;

    const tiles = `<div class="tiles">
      ${tile('star', 'Topics mastered', `${mastered}<span class="muted" style="font-size:1rem;font-weight:600"> / ${seq.length}</span>`, `${C.trackSubjects(learner.track).length} subjects`)}
      ${tile('target', 'Average mastery', pct(avgMastery(analysis, seq)), 'across your subjects')}
      ${tile('alert', 'Skills to strengthen', toFix, toFix ? 'older skills to review first' : 'none, nice!')}
      ${tile('clock', 'Time to finish', steps.length ? hm(analysis.pathway.totalMinutes) : '—', 'estimated study time')}
    </div>`;

    const upNext = steps.length ? `<div class="next-list">${steps.slice(0, 3).map((s, i) => `
      <div class="next-item">
        <span class="n">${i + 1}</span>
        <div><div class="t">${esc(G.byId[s.skillId].name)}</div><div class="s">${STUDENT_KIND[s.kind]} · ${s.minutes} min · ${FEEL[s.forecast.band.key].title}</div>
          ${i === 0 && firstWhy ? `<div class="why-line">${icon('bulb', 13)} ${esc(firstWhy)}</div>` : ''}</div>
        <button class="btn small${i === 0 ? ' primary' : ''}" type="button" data-action="practice" data-skill="${s.skillId}">${icon('play', 14)} Practise</button>
      </div>`).join('')}</div>
      <div class="row end" style="margin-top:12px"><button class="btn link" type="button" data-action="go" data-tab="pathway">See my whole path ${icon('arrow', 16)}</button></div>`
      : '<div class="empty">Nothing left on your path.</div>';

    const feel = next ? `<div class="gauge-wrap">${V.gauge(next.forecast.load, E.LOAD_BANDS)}
        <div class="g-title">${FEEL[next.forecast.band.key].title}</div><div class="g-text">${esc(FEEL[next.forecast.band.key].text)}</div></div>`
      : '<div class="empty">No next step to predict.</div>';

    const recent = own.length ? `<div class="activity-list">${own.slice(0, 4).map(a => {
      const r = a.itemsCorrect / a.itemsTotal, st = r >= 0.7 ? 'mastered' : r >= 0.5 ? 'developing' : 'gap';
      return `<div class="a-row"><span class="status-ic ${st}" aria-hidden="true">${STATUS_MARK[st]}</span>
        <div><div style="font-weight:600;font-size:.9rem">${esc(G.byId[a.skillId].short)}</div><div class="hint">${esc(a.date)} · ${esc(a.type)}</div></div>
        <span class="score">${a.itemsCorrect}/${a.itemsTotal}</span></div>`;
    }).join('')}</div>` : '<div class="empty">No practice yet.</div>';

    const subjects = `<div class="pw-mini">${C.trackSubjects(learner.track).map(id => {
      const p = pathwayProgress(analysis.mastery, C.SUBJECTS[id].sequence);
      return `<div class="pw-mini-row">${ring(p.percent, p.state, 40)}<div><b>${esc(subjectName(learner.track, id))}</b><div class="hint">${pathwayLine(p)}</div></div></div>`;
    }).join('')}</div>`;

    return trackCallout(learner) + postTestCallout() + hero + tiles + progressCard(learner, analysis) + reviewCard(analysis, true) + `
      <div class="grid dash">
        <div class="card"><div class="card-head">${cardTitle('path', 'Up next on my path', 'Do these in order')}</div>${upNext}</div>
        <div class="card"><div class="card-head">${cardTitle('load', 'How hard will it feel?', next ? `For: ${esc(G.byId[next.skillId].short)}` : '')}</div>${feel}</div>
      </div>
      <div class="grid dash">
        <div class="card"><div class="card-head">${cardTitle('book', `My ${learner.track ? esc(learner.track) + ' ' : ''}subjects`)}<button class="btn link" type="button" data-action="go" data-tab="gaps">All my skills ${icon('arrow', 16)}</button></div>
          ${subjects}</div>
        <div class="card"><div class="card-head">${cardTitle('clock', 'Recent activity')}${own.length ? `<button class="btn link" type="button" data-action="go" data-tab="history">All history ${icon('arrow', 16)}</button>` : ''}</div>${recent}</div>
      </div>`;
  }

  // ------------------------------------------------------------ student: practice
  /*
   * A learning pathway is one subject's topics in order (or the Junior High
   * foundations). Its percentage counts complete topics by the same 80% rule
   * that unlocks the post-test, so every progress number agrees.
   */
  const pathwayProgress = (mastery, ids) => E.pathProgress(mastery, ids);
  const subjectTitle = (track, id) => (id === 'JHS' ? 'Junior High foundations' : subjectName(track, id));
  function pathwaysOf(learner) {
    const subs = C.trackSubjects(learner.track).map(id => ({ id, name: subjectTitle(learner.track, id), ids: C.SUBJECTS[id].sequence }));
    const jhs = foundationsOf(learner);
    return jhs.length ? [...subs, { id: 'JHS', name: subjectTitle(learner.track, 'JHS'), ids: jhs }] : subs;
  }

  function ring(percent, state, size = 48) {
    const r = 20, c = 2 * Math.PI * r;
    return `<span class="ring ${state}" style="--ring:${size}px" role="img" aria-label="${percent}% complete">
      <svg viewBox="0 0 48 48" aria-hidden="true"><circle class="ring-track" cx="24" cy="24" r="${r}"/>
        ${percent ? `<circle class="ring-fill" cx="24" cy="24" r="${r}" transform="rotate(-90 24 24)" stroke-dasharray="${((c * percent) / 100).toFixed(2)} ${c.toFixed(2)}"/>` : ''}</svg>
      <b>${percent}%</b></span>`;
  }
  const pathwayLine = p => `${p.done} of ${p.total} topics complete · <span class="pw-state ${p.state}">${PATHWAY_STATE[p.state]}</span>`;
  // The whole path (all track subjects) as one bar with its percentage.
  function pathStrip(prog) {
    const p = prog.percent;
    return `<div class="path-strip"><div class="progress-label"><span>My path</span><span><b>${p}%</b> · ${prog.done} of ${prog.total} topics complete</span></div>
      <div class="progress-track big" role="img" aria-label="Path ${p}% complete"><span style="width:${p}%"></span></div></div>`;
  }

  // One subject pathway: the summary row, and its topics when open.
  function pathwayRow(g, analysis, nextId, isOpen) {
    const p = pathwayProgress(analysis.mastery, g.ids);
    const hasNext = g.ids.includes(nextId);
    const topics = isOpen ? `<ol class="pw-topics" id="pw-${g.id}">${g.ids.map(id => {
      const m = analysis.mastery[id], done = E.completedTopic(m), st = done ? 'mastered' : E.masteryStatus(m), next = id === nextId;
      return `<li class="pw-topic${next ? ' next' : ''}"><span class="status-ic ${st}" aria-hidden="true">${STATUS_MARK[st]}</span>
        <div class="pw-topic-text"><div class="t">${esc(G.byId[id].name)}</div>
          <div class="s">${done ? 'Complete' : STUDENT_STATUS[st]} · ${pct(m.p)}${next ? ' · <b>Up next</b>' : ''}</div></div>
        <button class="btn small${next ? ' primary' : ''}" type="button" data-action="practice" data-skill="${id}">${icon(done ? 'refresh' : 'play', 14)} ${done ? 'Review' : 'Practise'}</button></li>`;
    }).join('')}</ol>` : '';
    return `<div class="pw${isOpen ? ' open' : ''}">
      <button class="pw-head" type="button" data-action="practice-subject" data-subject="${g.id}" aria-expanded="${isOpen}" aria-controls="pw-${g.id}">
        ${ring(p.percent, p.state)}
        <span class="pw-text"><b>${esc(g.name)}</b><span class="hint">${pathwayLine(p)}</span></span>
        ${hasNext ? '<span class="pill kind pw-next">Up next</span>' : ''}<span class="pw-chev">${icon('chevron', 18)}</span>
      </button>${topics}</div>`;
  }

  /*
   * Practice shows one thing to do now (the next path step), any reviews that
   * are due, and the subject pathways as a list where one subject opens at a
   * time. The full history lives on its own page.
   */
  function viewPractice({ analysis, learner }) {
    const steps = analysis.pathway.steps;
    const next = steps[0];
    const nextId = next ? next.skillId : '';
    const own = S.data.attempts.length;
    const pathways = pathwaysOf(learner);
    const open = S.practiceSubject !== null ? S.practiceSubject : nextId ? G.byId[nextId].subject : '';

    const focus = next ? `<div class="card focus">
        <div class="focus-main">
          <span class="eyebrow">${icon('path', 14)} Up next on your path</span>
          <h3>${esc(G.byId[nextId].name)}</h3>
          <p class="muted">${esc(subjectTitle(learner.track, G.byId[nextId].subject))} · ${STUDENT_KIND[next.kind]} · about ${next.minutes} min</p>
          <div class="focus-mastery"><span class="hint">Your mastery</span>${masteryBar(analysis.mastery[nextId].p)}</div>
        </div>
        <button class="btn primary focus-go" type="button" data-action="practice" data-skill="${nextId}">${icon('play', 16)} Start practice</button>
        ${steps.length > 1 ? `<div class="focus-then"><span class="hint">Then:</span>${steps.slice(1, 3).map(s => `<span class="chip">${esc(G.byId[s.skillId].short)}</span>`).join('')}
          <button class="btn link" type="button" data-action="go" data-tab="pathway">Whole path ${icon('arrow', 14)}</button></div>` : ''}
        ${pathStrip(analysis.progress)}
      </div>`
      : `<div class="card focus done"><div class="focus-main"><span class="eyebrow">${icon('star', 14)} Path complete</span>
          <h3>You have finished your path</h3><p class="muted">Open any subject below to keep your topics fresh.</p></div></div>`;

    const historyBtn = `<button class="btn" type="button" data-action="go" data-tab="history" style="flex:0 0 auto">${icon('clock', 16)} History${own ? ` <span class="count-badge">${own}</span>` : ''}</button>`;
    return head('Practice', 'Start your next step, or open a subject to choose a topic. Each set has 5 questions with hints and worked answers.', historyBtn)
      + trackCallout(learner) + postTestCallout() + focus
      // Reviews due besides the next step, which the card above already offers.
      + (analysis.reviews.some(r => r.due && r.id !== nextId) ? reviewCard(analysis, true, nextId) : '') + `
      <div class="card"><div class="card-head">${cardTitle('book', 'My subject pathways', 'Open a subject to see its topics')}</div>
        <div class="pw-list">${pathways.map(g => pathwayRow(g, analysis, nextId, g.id === open)).join('')}</div></div>`;
  }

  // Every set the student has done, newest first, filterable, a page at a time.
  function viewHistory({ learner }) {
    const own = E.sortAttempts(S.data.attempts).reverse();
    const subjOf = a => G.byId[a.skillId].subject;
    const subjects = [...new Set(own.map(subjOf))];
    const types = ATTEMPT_TYPES.filter(t => own.some(a => a.type === t));
    const kept = own.filter(a => (!S.historySubject || subjOf(a) === S.historySubject) && (!S.historyType || a.type === S.historyType));
    // A diagnostic or post-test is stored per topic; it shows as one row per day.
    const rows = [], tests = {};
    kept.forEach(a => {
      if (a.type !== 'diagnostic' && a.type !== 'summative') { rows.push(a); return; }
      const key = `${a.type} ${a.date}`;
      if (!tests[key]) rows.push(tests[key] = { type: a.type, date: a.date, parts: [], itemsCorrect: 0, itemsTotal: 0, timeSec: 0 });
      tests[key].parts.push(a);
      ['itemsCorrect', 'itemsTotal', 'timeSec'].forEach(k => { tests[key][k] += a[k]; });
    });
    const shown = rows.slice(0, S.historyShown);
    const sum = k => kept.reduce((s, a) => s + a[k], 0);
    const total = sum('itemsTotal');

    const dayLabel = d => {
      const [y, m, day] = d.split('-').map(Number);
      const t = today(), dt = new Date(y, m - 1, day);
      const yest = new Date(); yest.setDate(yest.getDate() - 1);
      if (d === t) return 'Today';
      if (dt.toDateString() === yest.toDateString()) return 'Yesterday';
      return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: y === new Date().getFullYear() ? undefined : 'numeric' });
    };
    const groups = [];
    shown.forEach(a => {
      if (!groups.length || groups[groups.length - 1].date !== a.date) groups.push({ date: a.date, items: [] });
      groups[groups.length - 1].items.push(a);
    });
    const list = groups.map(g => `<div class="h-day"><h4>${esc(dayLabel(g.date))}</h4><div class="activity-list">${g.items.map(a => {
      const r = a.itemsCorrect / a.itemsTotal, st = r >= 0.7 ? 'mastered' : r >= 0.5 ? 'developing' : 'gap';
      const name = a.parts ? `${ATTEMPT_LABEL[a.type]} test` : esc(G.byId[a.skillId].name);
      const about = a.parts ? `${a.parts.length} topic${a.parts.length === 1 ? '' : 's'}` : `${esc(subjectTitle(learner.track, subjOf(a)))} · ${ATTEMPT_LABEL[a.type] || esc(a.type)}`;
      return `<div class="a-row"><span class="status-ic ${st}" aria-hidden="true">${STATUS_MARK[st]}</span>
        <div class="h-text"><div class="t">${name}</div>
          <div class="hint">${about} · ${f1(a.timeSec / 60)} min${a.hints ? ` · ${a.hints} hint${a.hints === 1 ? '' : 's'}` : ''}</div></div>
        <span class="score">${a.itemsCorrect}/${a.itemsTotal}</span>
        ${a.type === 'practice' ? `<button class="btn small icon-btn" type="button" data-action="practice" data-skill="${a.skillId}" title="Practise again" aria-label="Practise ${esc(G.byId[a.skillId].short)} again">${icon('refresh', 16)}</button>` : '<span class="icon-btn-gap"></span>'}</div>`;
    }).join('')}</div></div>`).join('');

    const filters = own.length ? `<div class="row h-filters">
        <label>Subject<select data-bind="historySubject"><option value="">All subjects</option>${subjects.map(id => `<option value="${id}"${id === S.historySubject ? ' selected' : ''}>${esc(subjectTitle(learner.track, id))}</option>`).join('')}</select></label>
        <label>Type<select data-bind="historyType"><option value="">All types</option>${types.map(t => `<option value="${t}"${t === S.historyType ? ' selected' : ''}>${ATTEMPT_LABEL[t]}</option>`).join('')}</select></label></div>` : '';

    const back = `<button class="btn" type="button" data-action="go" data-tab="practice" style="flex:0 0 auto">${icon('back', 16)} Practice</button>`;
    return head('Practice history', 'Every set you have done, newest first.', back) + (own.length ? `
      <div class="tiles">
        ${tile('record', 'Sets done', rows.length, S.historySubject || S.historyType ? 'with these filters' : 'all time')}
        ${tile('check', 'Correct answers', total ? pct(sum('itemsCorrect') / total) : '—', `${sum('itemsCorrect')} of ${total}`)}
        ${tile('clock', 'Time practised', hm(Math.round(sum('timeSec') / 60)), 'across these sets')}
      </div>
      <div class="card">${filters}
        ${shown.length ? list : '<div class="empty">No sets match these filters.</div>'}
        ${rows.length > shown.length ? `<div class="row end" style="margin-top:12px"><button class="btn" type="button" data-action="history-more">Show ${Math.min(HISTORY_PAGE, rows.length - shown.length)} more <span class="hint">(${rows.length - shown.length} left)</span></button></div>` : ''}
      </div>`
      : `<div class="card empty"><h2>No practice yet</h2><p style="margin:8px 0 16px">Your sets will show here after you finish one.</p>
        <button class="btn primary" type="button" data-action="go" data-tab="practice">${icon('play', 16)} Go to practice</button></div>`);
  }

  function viewMySkills({ analysis, learner }) {
    const { mastery, diagnosis } = analysis;
    const roots = diagnosis.gaps.filter(g => g.isRoot);
    const fix = roots.length ? `<div class="gap-list">${roots.map(g => `
      <div class="gap-item root">
        <h3><span class="status-ic ${g.status}" aria-hidden="true">${STATUS_MARK[g.status]}</span>${esc(G.byId[g.id].name)}</h3>
        <p>${g.status === 'unverified' ? 'Not checked yet. A quick practice set will tell us if you need to review it.' : `You are at ${pct(g.p)} on this. Reviewing it will make ${g.impact} later topic${g.impact === 1 ? '' : 's'} easier.`}</p>
        <div class="chips"><span class="hint">Helps with:</span>${g.blocks.map(b => `<span class="chip">${esc(G.byId[b].short)}</span>`).join('')}</div>
        <button class="btn small primary" type="button" style="margin-top:10px" data-action="practice" data-skill="${g.id}">${icon('play', 14)} Practise this</button>
      </div>`).join('')}</div>`
      : '<div class="empty">Nothing to fix first. Your foundations are solid.</div>';
    const jhs = foundationsOf(learner);
    return head('My skills', 'Green means mastered. Work on the skills marked “Needs practice” first. They make the next topics easier.',
      `<div class="head-controls">${targetSelect(learner)}</div>`) + trackCallout(learner) + `
      <div class="card"><div class="card-head">${cardTitle('alert', 'Strengthen these first')}</div>${fix}</div>
      ${subjectCards(learner, mastery, false)}
      <div class="card"><div class="card-head">${cardTitle('book', 'Foundations from Junior High', 'The building blocks your subjects use')}</div>
        <div class="skill-grid">${jhs.map(id => skillChip(id, mastery[id])).join('')}</div></div>`;
  }

  // ------------------------------------------------------------ pathway (both)
  // "Why this step?": evidence, placement, load drivers and a what-if, each in
  // the reader's language. Generated by engine.explainPathway from the same
  // numbers that produced the pathway.
  function xaiPanel(x, student) {
    if (!x) return '';
    const tag = { why: student ? 'Why it is here' : 'Why included', when: student ? 'Why now' : 'Placement', how: student ? 'How you will learn it' : 'Format' };
    const reasons = x.reasons.map(r => `<li><span class="xai-tag ${r.kind}">${tag[r.kind]}</span><span>${esc(student ? r.student : r.teacher)}</span></li>`).join('');
    const pushes = x.drivers.filter(d => d.contribution > 0.05);
    const drivers = pushes.length ? `<div class="drivers"><div class="hint" style="font-weight:700">${student ? 'What makes this step feel harder' : 'Load drivers (share of the model’s push toward high load)'}</div>
      ${pushes.map(d => `<div class="driver"><span class="d-label">${esc(student ? d.student : `${d.label}: ${d.teacher}`)}</span><span class="d-bar"><span style="width:${Math.round(d.share * 100)}%"></span></span><span class="d-val">${Math.round(d.share * 100)}%</span></div>`).join('')}</div>` : '';
    const cf = x.counterfactual;
    const cfHtml = cf ? `<div class="cf">${icon('refresh', 14)}<span>${student
      ? `If you master <b>${esc(cf.name)}</b> first, this step is predicted to feel easier: ${pct(cf.from)} → ${pct(cf.to)} effort.`
      : `What if: with <b>${esc(cf.name)}</b> brought to 85% mastery first, this step's cognitive load would drop from ${pct(cf.from)} to ${pct(cf.to)} (${BAND_PLAIN[cf.band.key].title.toLowerCase()}).`}</span></div>` : '';
    const conf = `<span class="chip">${x.confidence.answers ? `Based on ${x.confidence.answers} answer${x.confidence.answers === 1 ? '' : 's'}` : 'No answers yet'} · ${x.confidence.level} confidence</span>`;
    return `<details class="xai"><summary>${icon('bulb', 14)} Why this step?</summary>
      <ul class="xai-reasons">${reasons}</ul>${drivers}${cfHtml}<div style="margin-top:8px">${conf}</div></details>`;
  }

  function viewPathway({ learner, analysis, model, seq }) {
    const student = isStudent();
    const { pathway, diagnosis } = analysis;
    const steps = pathway.steps;
    const remed = steps.filter(s => s.kind !== 'learn').length;
    const heavy = steps.filter(s => s.forecast.load >= 0.6).length;
    const xai = E.explainPathway(analysis, G, seq, model);
    const xByOrder = {};
    xai.steps.forEach(x => { xByOrder[x.order] = x; });
    const overviewList = `<ul class="xai-list">${(student ? xai.overview.student : xai.overview.teacher).map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      <p class="hint" style="margin-top:8px">Open “Why this step?” on any step for the details behind it.</p>`;
    // Students see the explanation folded to one line until they ask for it.
    const overview = !steps.length ? '' : student
      ? `<details class="card xai-overview disclose"><summary>${cardTitle('bulb', 'How was my path built?', 'In plain words')}</summary>${overviewList}</details>`
      : `<div class="card xai-overview">
      <div class="card-head">${cardTitle('bulb', 'Why this pathway', 'Derived from the mastery, gap and load models')}
        ${!pathway.standard ? `<div class="chips">${xai.overview.added.length ? `<span class="chip">+${xai.overview.added.length} review/check</span>` : ''}${xai.overview.skipped.length ? `<span class="chip">−${xai.overview.skipped.length} already mastered</span>` : ''}</div>` : ''}</div>
      ${overviewList}</div>`;

    const stepName = s => esc(student ? G.byId[s.skillId].name : skillName(s.skillId));
    const stepBody = s => `<div class="why">${esc(student ? studentReason(s, diagnosis) : s.reason)}</div>
          <div class="meta"><span class="pill kind">${(student ? STUDENT_KIND : KIND_LABEL)[s.kind]}</span>${pathway.standard ? '' : bandPill(s.forecast.band, student ? null : s.forecast.load)}${student || pathway.standard ? '' : '<span class="hint">predicted load when reached</span>'}</div>
          <div class="activity">${icon('bulb', 16)}<span>${esc(student && !pathway.standard ? E.STUDENT_ACTIVITIES[s.format] : s.activity)}</span></div>
          ${xaiPanel(xByOrder[s.order], student)}`;
    const practiseBtn = (s, primary) => `<button class="btn small${primary ? ' primary' : ''} no-print" type="button" data-action="practice" data-skill="${s.skillId}">${icon('play', 14)} Practise</button>`;
    const fullStep = (s, cls = '') => `
      <li class="step ${s.kind}${cls}">
        <span class="order">${s.order}</span>
        <div><h3>${stepName(s)}</h3>${stepBody(s)}</div>
        <div class="time">${s.minutes} min<small>${s.sessions > 1 ? `${s.sessions} sessions` : '1 session'}</small>
          ${student ? practiseBtn(s, s.order === 1) : ''}</div>
      </li>`;
    // One line per step; the reason, format and "Why this step?" open on request.
    const compactStep = s => `
      <li class="step compact ${s.kind}">
        <span class="order">${s.order}</span>
        <div><h3>${stepName(s)}</h3>
          <div class="why">${STUDENT_KIND[s.kind]} · ${esc(subjectTitle(learner.track, G.byId[s.skillId].subject))}</div>
          <details class="step-more"><summary>Details</summary>${stepBody(s)}</details></div>
        <div class="time">${s.minutes} min${practiseBtn(s, false)}</div>
      </li>`;

    /*
     * Progressive disclosure for students: the step to do now in full, the
     * next two as single lines, and the rest folded away until asked for.
     * Printing shows every step. Teachers always see the whole list.
     */
    let list;
    if (!steps.length) list = `<div class="empty">${student ? 'You have finished your path. Well done!' : 'Nothing to schedule: the target skills are mastered.'}</div>`;
    else if (!student) list = `<ol class="pathway">${steps.map(s => fullStep(s)).join('')}</ol>`;
    else {
      const soon = steps.slice(1, PATH_SOON + 1), later = steps.slice(PATH_SOON + 1);
      const laterMin = later.reduce((n, s) => n + s.minutes, 0);
      list = `<h4 class="path-sec">Now</h4><ol class="pathway split">${fullStep(steps[0], ' current')}</ol>
        ${soon.length ? `<h4 class="path-sec">Coming up</h4><ol class="pathway split">${soon.map(compactStep).join('')}</ol>` : ''}
        ${later.length ? `<div class="later-wrap${S.pathAll ? '' : ' collapsed'}" id="pathLater"><h4 class="path-sec">Later</h4>
            <ol class="pathway split">${later.map(compactStep).join('')}</ol></div>
          <button class="btn path-toggle no-print" type="button" data-action="path-all" aria-expanded="${!!S.pathAll}" aria-controls="pathLater">
            ${S.pathAll ? `Show fewer steps ${icon('chevron', 16).replace('class="ic"', 'class="ic flip"')}` : `Show the rest of my path · ${later.length} more step${later.length === 1 ? '' : 's'}, about ${hm(laterMin)} ${icon('chevron', 16)}`}</button>` : ''}`;
    }

    const controls = `<div class="row no-print head-controls">${targetSelect(learner)}<button class="btn" type="button" data-action="print" style="flex:0 0 auto">Print</button></div>`;
    const header = student
      ? head('My learning path', pathway.standard ? 'Work through the topics in order. Practise each one until it feels solid.' : 'Follow the steps in order. Older skills you need come first, right before the topic that uses them.', controls)
      : head(`Pathway for ${esc(learner.name)}`, pathway.standard
        ? 'This learner is in the <b>standard-sequence</b> group, so they follow the course in its fixed order without remediation or load-based formats.'
        : 'Prerequisites come first, each remediation lands just before the first target it unblocks, and the format follows the load forecast for that step.', controls, 'Step 4 · Recommend');

    const tiles = `<div class="tiles">
        ${tile('path', student ? 'Steps on my path' : 'Steps', steps.length, `${steps.length - remed} new topics`)}
        ${tile('alert', student ? 'Reviews and checks' : 'Remediation and checks', remed, student ? 'older skills to refresh' : 'for prerequisite gaps')}
        ${tile('clock', student ? 'Time needed' : 'Estimated time', steps.length ? hm(pathway.totalMinutes) : '—', 'longer for harder steps')}
        ${tile('load', student ? 'Challenging steps' : 'High-load steps', heavy, pathway.standard ? 'predicted' : 'with worked examples')}
      </div>`;
    // Students see the step to do first; the totals and explanation follow it.
    return student
      ? header + `<div class="card">${pathStrip(analysis.progress)}${list}</div>${overview}<div class="path-after">${tiles}</div>`
      : header + tiles + overview + `<div class="card">${list}</div>`;
  }

  // ------------------------------------------------------------ account (both)
  function viewAccount() {
    const must = S.user.mustChange;
    return head('My account', must ? 'Your password was set by your teacher. Please choose your own password to continue.' : `Signed in as @${esc(S.user.username)}.`) + `
      <div class="grid halves">
        <div class="card"><div class="card-head">${cardTitle('key', 'Change password')}</div>
          <form id="passwordForm" class="stack" novalidate>
            ${pwField('current', must ? 'Temporary password' : 'Current password', 'current-password')}
            ${pwField('next', `New password (at least ${isStudent() ? 6 : 8} characters)`, 'new-password')}
            ${pwField('confirm', 'Type the new password again', 'new-password')}
            <p class="form-error" role="alert"></p>
            <div class="row end"><button class="btn primary" type="submit">Save password</button></div>
          </form></div>
        ${isStudent() ? `<div class="card"><div class="card-head">${cardTitle('user', 'Profile')}</div>
            <table><tbody><tr><td class="muted">Name</td><td><b>${esc(S.user.name)}</b></td></tr><tr><td class="muted">Username</td><td>@${esc(S.user.username)}</td></tr>
            <tr><td class="muted">Class</td><td>${esc(S.data.className || '—')}</td></tr>
            <tr><td class="muted">Track</td><td><select data-bind="my-track" aria-label="My track">${trackOptions(S.data.learner.track, 'Choose your track')}</select>
              <div class="hint" style="margin-top:4px">${S.data.learner.track ? `Subjects: ${esc(subjectList(S.data.learner.track))}` : 'Pick your track to focus on its subjects.'}</div></td></tr></tbody></table>
            <p class="note">Changing your track changes the subjects on your path. Your earlier results are kept. To change your name or class, ask your teacher.</p></div>`
          : `<div class="card"><div class="card-head">${cardTitle('userPlus', 'Add a teacher account', 'For a colleague in your school')}</div>
            <form id="teacherForm" class="stack" novalidate>
              <label>Full name<input name="name" required maxlength="80"></label>
              <label>Username<input name="username" required maxlength="32" autocomplete="off"></label>
              ${pwField('password', 'Temporary password (at least 8 characters)', 'new-password')}
              <p class="hint">They will be asked to choose their own password the first time they sign in.</p>
              <p class="form-error" role="alert"></p>
              <div class="row end"><button class="btn primary" type="submit">Create teacher account</button></div>
            </form></div>`}
      </div>
      <div class="card"><div class="row" style="align-items:center"><div class="muted" style="flex:1 1 240px">Using a shared computer? Always sign out when you finish.</div>
        <button class="btn" type="button" data-action="logout" style="flex:0 0 auto">${icon('logout', 16)} Sign out</button></div></div>`;
  }

  // ------------------------------------------------------------ teacher home
  function viewTeacherHome() {
    const model = S.data.model;
    if (!S.data.learners.length) {
      const c = S.data.classes[0];
      return `<section class="hero"><div class="hero-main"><h2>Welcome, ${esc(firstName(S.user.name))}!</h2>
          <p>Your class is ready. Share the class code with your students. They create their own accounts and take the diagnostic as soon as they sign in.</p></div>
          ${c ? `<div class="hero-side"><span class="next-label">${esc(c.name)} · class code</span><span class="next-skill" style="font-size:1.8rem;letter-spacing:.12em">${esc(c.joinCode)}</span>
          <button class="btn light" type="button" data-action="go" data-tab="classes">Manage classes ${icon('arrow', 16)}</button></div>` : ''}</section>`;
    }
    const rows = S.data.learners.map(l => {
      const seq = seqOf(l);
      const a = analyze(l);
      const roots = a.diagnosis.gaps.filter(g => g.isRoot && g.status === 'gap');
      return { l, a, seq, roots, mastered: masteredCount(a, seq), avg: avgMastery(a, seq), next: a.pathway.steps[0], imp: E.improvement(l.preTest, l.postTest) };
    });
    const tested = rows.filter(r => r.imp), improved = tested.filter(r => r.imp.verdict === 'improved').length;
    rows.sort((x, y) => (x.l.diagnosticDone - y.l.diagnosticDone) || (y.roots.length - x.roots.length) || (x.avg - y.avg));
    const diagnosed = rows.filter(r => r.l.diagnosticDone).length;
    const needSupport = rows.filter(r => r.roots.length).length;
    const classAvg = E.mean(rows.filter(r => r.l.diagnosticDone).map(r => r.avg));

    const tally = {};
    rows.forEach(r => r.roots.forEach(g => { tally[g.id] = (tally[g.id] || 0) + 1; }));
    const common = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxCount = Math.max(1, ...common.map(c => c[1]));
    const commonBars = common.length ? `<div class="hbars">${common.map(([id, n]) => `
      <div class="hbar" data-tip="${esc(`<b>${id} · ${G.byId[id].name}</b><br>Root gap for ${n} student${n === 1 ? '' : 's'}`)}">
        <span class="name"><b>${id}</b> ${esc(G.byId[id].short)}</span><span class="track"><span style="width:${(n / maxCount) * 100}%"></span></span><span class="count">${n}</span>
      </div>`).join('')}</div><p class="note">Tested prerequisites below 60% with no weaker skill beneath them. Reteaching one of these helps every student counted.</p>`
      : '<div class="empty">No confirmed root gaps yet.</div>';

    const statusOf = r => !r.l.diagnosticDone ? pill('unverified', 'Diagnostic pending') : r.roots.length ? pill('gap', 'Needs support') : r.avg < 0.6 ? pill('developing', 'Keep watching') : pill('mastered', 'On track');
    const table = `<div class="table-wrap"><table>
      <thead><tr><th>Student</th><th>Status</th><th style="min-width:130px">Avg mastery</th><th class="num">Mastered</th><th class="num">Pre → Post</th><th>Root gaps</th><th>Next step</th><th></th></tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td><div class="learner-cell"><span class="avatar">${esc(initials(r.l.name))}</span><div><b>${esc(r.l.name)}</b><div class="hint">${esc(C.trackLabel(r.l.track))} · ${esc(r.l.section || '')}${r.l.group ? ` · ${GROUP_LABEL[r.l.group]}` : ''}</div></div></div></td>
        <td>${statusOf(r)}</td><td>${r.l.diagnosticDone ? masteryBar(r.avg) : '<span class="muted">—</span>'}</td><td class="num">${r.mastered}/${r.seq.length}</td>
        <td class="num" style="white-space:nowrap">${r.l.preTest == null ? '<span class="muted">—</span>' : `${r.l.preTest}% → ${r.l.postTest == null ? '<span class="muted">…</span>' : `${r.l.postTest}%`}`}${r.imp ? ` <b class="${r.imp.change >= 0 ? 'delta-up' : 'delta-down'}">${signed(r.imp.change)}</b>` : ''}</td>
        <td>${r.roots.length ? r.roots.map(g => `<span class="chip">${g.id}</span>`).join(' ') : '<span class="muted">—</span>'}</td>
        <td>${r.l.diagnosticDone && r.next ? `${esc(G.byId[r.next.skillId].short)} <span class="hint">(${KIND_LABEL[r.next.kind].toLowerCase()})</span>` : '<span class="muted">—</span>'}</td>
        <td><button class="btn small" type="button" data-action="open-learner" data-id="${esc(r.l.id)}">Open</button></td>
      </tr>`).join('')}</tbody></table></div>`;

    const cc = E.compareCohorts(S.data.learners);
    const ga = cc.groups.adaptive, gs = cc.groups.standard;
    const gainMax = Math.max(1, ga.gain.mean || 0, gs.gain.mean || 0);
    const groupCard = cc.ready ? `<div class="hbars">
        ${[['Adaptive', ga, '--series-1'], ['Standard', gs, '--series-2']].map(([n, g, c]) => `
        <div class="hbar"><span class="name">${n} (n=${g.n})</span><span class="track"><span style="width:${Math.max(0, g.gain.mean) / gainMax * 100}%;background:var(${c})"></span></span><span class="count">${g.gain.mean >= 0 ? '+' : '−'}${f1(Math.abs(g.gain.mean))}</span></div>`).join('')}
      </div>
      <p class="note">Mean gain from pre-test to post-test. Hedges’ g = ${cc.g.toFixed(2)} (${E.effectLabel(cc.g)}), Welch p = ${fmtP(cc.gain.p)}.</p>
      <div class="row end" style="margin-top:8px"><button class="btn link" type="button" data-action="go" data-tab="outcomes">Full results ${icon('arrow', 16)}</button></div>`
      : `<div class="empty">Results appear when at least two students per group have a diagnostic and a post-test score. See <button class="btn link" type="button" data-action="go" data-tab="progress">Progress</button>.</div>`;

    const avgSteps = E.mean(rows.filter(r => r.l.diagnosticDone).map(r => r.a.pathway.steps.length));
    const chain = [
      ['record', 'record', 'Performance', `${S.data.attempts.length} attempts recorded`],
      ['load', 'load', 'Cognitive load', model.calibrated ? `Calibrated on ${model.n} ratings` : `${model.n} of 12 ratings`],
      ['gaps', 'gaps', 'Skill gaps', `${needSupport} student${needSupport === 1 ? '' : 's'} with root gaps`],
      ['pathway', 'path', 'Pathways', diagnosed ? `${f1(avgSteps)} steps on average` : 'Waiting for diagnostics'],
      ['outcomes', 'chart', 'Outcomes', cc.ready ? `g = ${cc.g.toFixed(2)} on gains` : 'Awaiting test scores']
    ];

    return `<div class="tiles">
        ${tile('users', 'Students', S.data.learners.length, `${S.data.classes.length} class${S.data.classes.length === 1 ? '' : 'es'}`)}
        ${tile('check', 'Diagnostic done', `${diagnosed}<span class="muted" style="font-size:1rem;font-weight:600"> / ${rows.length}</span>`, 'first sign-in assessment')}
        ${tile('star', 'Improved', tested.length ? `${improved}<span class="muted" style="font-size:1rem;font-weight:600"> / ${tested.length}</span>` : '—', tested.length ? `average ${signed(E.mean(tested.map(r => r.imp.change)))} points · <button class="btn link" type="button" data-action="go" data-tab="progress">details</button>` : `no post-tests yet · class mastery ${diagnosed ? pct(classAvg) : '—'}`)}
        ${tile('alert', 'Need support', needSupport, 'have a confirmed root gap')}
      </div>
      <div class="card"><div class="card-head">${cardTitle('path', 'Analysis chain', 'From performance data to a compared outcome. Open any step.')}</div>
        <div class="chain-row">${chain.map(([tab, ic, t, v], i) => `
          <button class="chain-card" type="button" data-action="go" data-tab="${tab}">
            <span class="top">${icon(ic)}<span class="no">STEP ${i + 1}</span></span><span class="t">${t}</span><span class="v">${v}</span>
          </button>`).join('')}</div>
      </div>
      <div class="grid dash">
        <div class="card"><div class="card-head">${cardTitle('alert', 'Most common root gaps', 'Students per prerequisite')}</div>${commonBars}</div>
        <div class="card"><div class="card-head">${cardTitle('chart', 'Adaptive vs standard', 'Gains so far')}</div>${groupCard}</div>
      </div>
      <div class="card"><div class="card-head">${cardTitle('users', 'Students', 'Who needs attention first')}</div>${table}</div>`;
  }

  // ------------------------------------------------------------ teacher: progress
  // Each student's diagnostic (pre-test) against their post-test, with path progress.
  function progressRows() {
    const res = S.data.results || {};
    return S.data.learners.filter(l => !S.progressTrack || l.track === S.progressTrack).map(l => {
      const own = S.data.attempts.filter(a => a.learnerId === l.id);
      const prog = E.pathProgress(E.traceMastery(own, G, S.data.bkt || E.BKT, { asOf: today() }).mastery, seqOf(l));
      const rapid = own.reduce((n, a) => n + (a.rapid || 0), 0), answers = own.reduce((n, a) => n + a.itemsTotal, 0);
      return { l, r: res[l.id] || {}, prog, imp: E.improvement(l.preTest, l.postTest), rapid, answers };
    });
  }

  function viewProgress() {
    const rows = progressRows();
    const both = rows.filter(x => x.imp);
    const n = v => both.filter(x => x.imp.verdict === v).length;
    const pt = both.length >= 2 ? E.pairedTTest(both.map(x => x.imp.pre), both.map(x => x.imp.post)) : null;
    const avg = k => (both.length ? Math.round(E.mean(both.map(x => x.imp[k]))) : null);
    const order = { improved: 0, same: 1, declined: 2 };
    rows.sort((a, b) => (a.imp ? order[a.imp.verdict] : 3) - (b.imp ? order[b.imp.verdict] : 3) || (b.imp ? b.imp.change : 0) - (a.imp ? a.imp.change : 0) || a.l.name.localeCompare(b.l.name));
    const table = rows.length ? `<div class="table-wrap"><table>
      <thead><tr><th>Student</th><th style="min-width:150px">Path progress</th><th class="num">Diagnostic</th><th class="num">Post-test</th><th class="num">Change</th><th>Result</th><th></th></tr></thead>
      <tbody>${rows.map(x => `<tr${x.l.id === S.progressId ? ' style="background:var(--accent-soft)"' : ''}>
        <td><div class="learner-cell"><span class="avatar">${esc(initials(x.l.name))}</span><div><b>${esc(x.l.name)}</b><div class="hint">${esc(x.l.track || '—')} · ${esc(x.l.section || '')}</div></div></div></td>
        <td><div class="mastery-cell"><div class="bar"><span style="width:${x.prog.total ? (x.prog.done / x.prog.total) * 100 : 0}%"></span></div><span class="num">${x.prog.done}/${x.prog.total}</span></div></td>
        <td class="num">${x.l.preTest == null ? '<span class="muted">—</span>' : `${x.l.preTest}%`}</td>
        <td class="num">${x.l.postTest == null ? '<span class="muted">—</span>' : `${x.l.postTest}%`}</td>
        <td class="num">${x.imp ? `<b class="${x.imp.change >= 0 ? 'delta-up' : 'delta-down'}">${signed(x.imp.change)}</b>` : ''}</td>
        <td>${x.l.diagnosticDone ? verdictPill(x.imp) : pill('unverified', 'Diagnostic pending')}${x.answers && x.rapid / x.answers > RAPID_WARN ? ` <span class="rapid-tag" title="${x.rapid} of ${x.answers} answers under ${E.RAPID_SEC} s">⚡ ${Math.round(100 * x.rapid / x.answers)}% rapid</span>` : ''}</td>
        <td><button class="btn small" type="button" data-action="progress-open" data-id="${esc(x.l.id)}">Details</button></td></tr>`).join('')}</tbody></table></div>`
      : '<div class="empty">No students in this track.</div>';
    const sel = rows.find(x => x.l.id === S.progressId);
    return head('Pre-test and post-test', 'The diagnostic is each student’s pre-test. The post-test opens when their learning path is complete, in the same format, so the two scores compare directly.',
      `<label class="head-controls">Track<select data-bind="progressTrack"><option value="">All tracks</option>${TRACKS.map(t => `<option${t === S.progressTrack ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`) + `
      <div class="tiles">
        ${tile('check', 'Post-tests taken', `${both.length}<span class="muted" style="font-size:1rem;font-weight:600"> / ${rows.length}</span>`, `${rows.filter(x => x.prog.complete).length} finished their path`)}
        ${tile('chart', 'Average score', both.length ? `${avg('pre')}% → ${avg('post')}%` : '—', 'diagnostic → post-test')}
        ${tile('star', 'Improved', both.length ? `${n('improved')}<span class="muted" style="font-size:1rem;font-weight:600"> / ${both.length}</span>` : '—', both.length ? `${n('same')} about the same · ${n('declined')} declined` : `±${E.IMPROVE_MARGIN} points counts as the same`)}
        ${tile('target', 'Paired t-test', pt && Number.isFinite(pt.t) ? `<span class="num" style="font-size:1.2rem">t(${pt.df}) = ${pt.t.toFixed(2)}</span>` : '—', pt && Number.isFinite(pt.p) ? `p = ${fmtP(pt.p)} · d = ${pt.dz.toFixed(2)}` : 'needs 2 or more post-tests')}
      </div>
      ${sel ? progressDetail(sel) : ''}
      <div class="card"><div class="card-head">${cardTitle('users', 'Students', 'Improved first')}</div>${table}</div>`;
  }

  function progressDetail(x) {
    const { l, r, imp, prog } = x;
    const resp = S.responses[l.id];
    if (resp === undefined) {
      S.responses[l.id] = null;
      run(() => api.get(`/api/students/${encodeURIComponent(l.id)}/responses`)).then(d => {
        S.responses[l.id] = d ? d.responses : [];
        if (S.tab === 'progress') render();
      });
    }
    const scores = imp ? improvementTiles(imp, r.post)
      : `<div class="tiles">${tile('book', 'Diagnostic (pre-test)', l.preTest == null ? '—' : `${l.preTest}%`, r.pre ? `${mmss(r.pre.timeSec)} used` : '')}
          ${tile('path', 'Path progress', `${prog.done}/${prog.total}`, prog.complete ? 'post-test unlocked' : 'topics practised or mastered')}</div>`;
    return `<div class="card" id="progressDetail">
      <div class="card-head">${cardTitle('user', esc(l.name), `${esc(C.trackLabel(l.track))}`)}
        <div class="row-actions">${verdictPill(imp)}
          ${l.postTest != null ? `<button class="btn small" type="button" data-action="retake-posttest" data-id="${esc(l.id)}">${icon('refresh', 14)} Allow retake</button>` : ''}
          <button class="btn small ghost" type="button" data-action="progress-close" aria-label="Close details">✕</button></div></div>
      ${scores}
      ${r.pre ? `<h3 style="margin:18px 0 8px">By subject</h3>${prePostBars(r.pre.subjects, r.post ? r.post.subjects : null)}` : ''}
      <h3 style="margin:22px 0 8px">Time per question</h3>
      ${resp == null ? '<div class="empty">Loading…</div>' : responseTables(l, resp)}
    </div>`;
  }

  // Time spent on each question of the latest diagnostic and post-test.
  function responseTables(l, responses) {
    const latest = kind => {
      const rows = responses.filter(x => x.kind === kind);
      const quiz = rows.length ? rows[rows.length - 1].quizId : null;
      return rows.filter(x => x.quizId === quiz);
    };
    const sets = [['diagnostic', 'Diagnostic (pre-test)'], ['posttest', 'Post-test']].map(([k, label]) => [label, latest(k)]).filter(s => s[1].length);
    if (!sets.length) return '<div class="empty">No timed answers yet.</div>';
    return `<div class="grid halves">${sets.map(([label, rows]) => {
      const times = rows.map(x => x.timeSec);
      const med = E.quantile([...times].sort((a, b) => a - b), 0.5), max = Math.max(...times, 1);
      const total = times.reduce((a, b) => a + b, 0);
      const rapid = rows.filter(x => x.rapid).length;
      const subj = id => (id ? C.subjectLabel(l.track, id) : 'Foundation check');
      return `<div><div class="row" style="justify-content:space-between;align-items:baseline;margin-bottom:6px"><b>${label}</b>
          <span class="hint">${rows.length} answered · ${mmss(total)} total · ${Math.round(total / rows.length)} s average${rapid ? ` · <b class="delta-down">${rapid} rapid guess${rapid === 1 ? '' : 'es'}</b>` : ''}</span></div>
        ${rapid / rows.length > RAPID_WARN ? `<div class="callout warn" style="margin:0 0 8px">${icon('alert', 16)}<span>${Math.round(100 * rapid / rows.length)}% of answers took under ${E.RAPID_SEC} seconds. This score may not reflect what the student knows.</span></div>` : ''}
        <div class="table-wrap" style="max-height:420px"><table><thead><tr><th class="num">#</th><th>Topic</th><th></th><th style="min-width:130px">Time</th></tr></thead>
        <tbody>${rows.map(x => `<tr><td class="num">${x.number}</td><td><b>${esc(G.byId[x.skillId] ? G.byId[x.skillId].short : x.skillId)}</b><div class="hint">${esc(subj(x.subjectId))}</div></td>
          <td>${x.correct ? '<span class="delta-up">✓</span>' : '<span class="delta-down">✗</span>'}</td>
          <td><div class="time-cell"><span class="bar"><i class="${x.rapid ? 'rapid' : x.timeSec > 2 * med ? 'slow' : ''}" style="width:${(x.timeSec / max) * 100}%"></i></span><span class="num">${x.timeSec < 10 ? x.timeSec.toFixed(1) : Math.round(x.timeSec)} s</span>${x.rapid ? `<span class="rapid-tag" title="Answered in under ${E.RAPID_SEC} seconds">⚡ rapid</span>` : ''}</div></td></tr>`).join('')}</tbody></table></div></div>`;
    }).join('')}</div><p class="note">Amber bars took more than twice this student’s typical time on a question. ⚡ marks rapid guesses (under ${E.RAPID_SEC} seconds): they still count in the score, but not as evidence of mastery.</p>`;
  }

  // ------------------------------------------------------------ teacher: model check
  /*
   * How well the models predict data they were not fitted on: BKT against a
   * percent-correct baseline (cross-validated AUC), the load model against
   * its starting weights and a constant guess (cross-validated MAE), and how
   * often students rapid-guess.
   */
  function loadModels(fresh) {
    S.modelsLoading = true;
    return run(() => api.get(`/api/models${fresh ? '?fresh=1' : ''}`)).then(d => {
      S.modelsLoading = false;
      if (d) S.modelsData = d;
      if (S.tab === 'models') render();
    });
  }
  const BKT_ROWS = [
    ['pInit', 'Already known', 'Chance a topic is known before any practice'],
    ['pLearn', 'Learning', 'Chance of learning the topic from one question'],
    ['pSlip', 'Slip', 'Chance of a wrong answer although the topic is known'],
    ['pGuess', 'Guess', 'Chance of a right answer without knowing it'],
    ['pForget', 'Forgetting', 'Share of learned mastery lost per day before any review (divided by 1 + practice days)']
  ];
  // Days for the learned part of mastery to halve after one practice day.
  const halfLife = f => (f > 0 ? Math.round(Math.log(0.5) / Math.log(1 - f / 2)) : Infinity);
  function scoreBars(rows, { lo, hi, fmt, better }) {
    const best = better === 'high' ? Math.max(...rows.map(r => r[1])) : Math.min(...rows.map(r => r[1]));
    return `<div class="hbars scores">${rows.map(([name, v, note]) => `<div class="hbar"><span class="name">${name === rows[0][0] ? `<b>${esc(name)}</b>` : esc(name)}${note ? `<div class="hint">${esc(note)}</div>` : ''}</span>
      <span class="track"><span style="width:${Math.max(2, Math.min(100, ((v - lo) / (hi - lo)) * 100))}%;${v === best ? '' : 'background:#a9bad3'}"></span></span><span class="count">${fmt(v)}</span></div>`).join('')}</div>`;
  }

  /*
   * Model check for teachers: a plain verdict on each model first (green
   * works, yellow be careful, grey not enough data yet), then the evidence
   * behind each verdict folded underneath, technical names in brackets.
   */
  function viewModels() {
    const d = S.modelsData;
    if (!d) {
      if (!S.modelsLoading) loadModels(false);
      return head('How accurate are the estimates?', 'Checking…');
    }
    const b = d.bkt, cv = d.loadCv, m = d.method;
    const f2 = v => (Number.isFinite(v) ? v.toFixed(2) : '—');
    const f3 = v => (Number.isFinite(v) ? v.toFixed(3) : '—');
    const data = b.data || {};
    const ordered = b.nAnswers ? b.nOrdered / b.nAnswers : 0;
    const verdict = (tone, title, text) => `<div class="verdict ${tone}"><span class="v-dot" aria-hidden="true"></span><div><b>${title}</b><p>${text}</p></div></div>`;

    // Mastery: does BKT predict the next answer better than percent correct?
    let vMastery;
    if (!b.ready) vMastery = verdict('wait', 'Mastery: using standard settings for now', `To tune itself to your school, NeuroLearn-X needs ${b.minAnswers} answers from ${b.minLearners} students (now ${b.nAnswers} from ${b.nLearners}). Until then it uses standard settings from research.`);
    else if (data.synthetic) vMastery = verdict('warn', 'Mastery: only tested on sample data', 'These results come from the made-up demo class, so they say nothing about real students yet.');
    else {
      const fit = b.metrics.fitted.auc, base = b.metrics.baseline.auc;
      vMastery = fit > base + 0.01
        ? verdict('good', 'Mastery: better than a simple score', `It predicts students' next answers better than their percent correct does (accuracy score ${f2(fit)} against ${f2(base)}, where 0.5 is a coin flip and 1 is perfect).`)
        : verdict('warn', 'Mastery: no better than a simple score yet', `Its accuracy score is ${f2(fit)}, against ${f2(base)} for plain percent correct (0.5 is a coin flip, 1 is perfect). More answers from real students should help.`);
    }
    // Load: is the estimate closer to students' own effort ratings than the class average?
    let vLoad;
    if (!cv.ready) vLoad = verdict('wait', 'Cognitive load: starting settings', `It checks itself once students have given ${cv.minSamples} effort ratings (now ${cv.n}).`);
    else {
      const cal = Math.round(cv.mae.calibrated * 100), avg = Math.round(cv.mae.constant * 100);
      vLoad = cv.mae.calibrated < cv.mae.constant
        ? verdict('good', 'Cognitive load: closer than a guess', `On average its estimate is ${cal} points (out of 100) from how hard students said a set felt. Always guessing the class average would be ${avg} points off.`)
        : verdict('warn', 'Cognitive load: treat as a rough guide', `On average its estimate is ${cal} points (out of 100) from how hard students said a set felt, while always guessing the class average would be only ${avg} points off. It should improve as more students rate their effort.`);
    }
    // Rushed answers across everything students have answered.
    const kinds = [['diagnostic', 'Diagnostic'], ['posttest', 'Post-test'], ['practice', 'Practice']].filter(([k]) => d.rapid[k]);
    const nAns = kinds.reduce((s, [k]) => s + d.rapid[k].answers, 0), nRapid = kinds.reduce((s, [k]) => s + d.rapid[k].rapid, 0);
    const vRapid = !nAns ? verdict('wait', 'Rushed answers: none recorded yet', 'Answers will show here once students start the diagnostic or practice.')
      : nRapid / nAns > RAPID_WARN
        ? verdict('warn', `Rushed answers: ${pct(nRapid / nAns)} of answers`, `${nRapid} of ${nAns} answers were given in under ${d.rapidSec} seconds, too fast to have read the question. They are left out of mastery. Remind students to read each question.`)
        : verdict('good', `Rushed answers: ${pct(nRapid / nAns)} of answers`, `Only ${nRapid} of ${nAns} answers were given in under ${d.rapidSec} seconds. These are left out of mastery.`);

    const glance = `<div class="card"><div class="card-head">${cardTitle('check', 'At a glance', 'Green: working well · Yellow: be careful · Grey: not enough data yet')}</div>
      ${data.synthetic ? `<div class="callout warn">${icon('alert', 16)}<span style="flex:1 1 0;min-width:0"><b>Most of this data is from the made-up demo class.</b> Real students' answers take over once there are ${b.minAnswers} answers from ${b.minLearners} students.</span></div>` : ''}
      <div class="verdicts">${vMastery}${vLoad}${vRapid}</div></div>`;

    const section = (ic, title, sub, body) => `<details class="card disclose"><summary>${cardTitle(ic, title, sub)}</summary>${body}</details>`;
    const orderNote = b.nAnswers ? `<p class="hint" style="margin-bottom:10px"><b>${pct(ordered)}</b> of these answers are saved in the order they were given (${b.nOrdered} of ${b.nAnswers}).${ordered < 1 ? ' The rest were saved before that, or entered by hand, so their order is rebuilt from each set’s totals.' : ''}</p>` : '';
    const masteryBody = `${data.demoExcluded ? '<p class="hint" style="margin-bottom:10px">The made-up demo class is left out: these figures are real students only.</p>' : ''}${orderNote}
      ${b.ready ? `<h4 class="sub-h">Predicting each student's next answer</h4>
        ${scoreBars([['Tuned to your school', b.metrics.fitted.auc], ['Standard settings', b.metrics.default.auc], ['Percent correct so far (simple score)', b.metrics.baseline.auc]], { lo: 0.5, hi: 1, fmt: v => `score ${f2(v)}`, better: 'high' })}
        <p class="note">Each student is tested with settings learned from the other students only, one answer at a time. A score of 0.5 is a coin flip and 1 is perfect; studies of this kind of model in real classrooms commonly report about 0.65 to 0.75. The tuned settings are used only when they beat the standard ones.<br>
          <span class="hint">Technical: Bayesian Knowledge Tracing; AUC, ${b.folds}-fold cross-validation by student; log loss ${f3(b.metrics.fitted.logLoss)} tuned, ${f3(b.metrics.default.logLoss)} standard, ${f3(b.metrics.baseline.logLoss)} simple score.</span></p>`
        : `<p class="muted">Tuning starts at ${b.minAnswers} answers from ${b.minLearners} students (now ${b.nAnswers} from ${b.nLearners}).</p>`}
      <h4 class="sub-h">The settings</h4>
      <div class="table-wrap"><table><thead><tr><th>Setting</th><th class="num">Standard</th><th class="num">Tuned</th><th class="num">In use</th></tr></thead>
        <tbody>${BKT_ROWS.map(([k, label, meaning]) => `<tr><td><b>${label}</b><div class="hint">${meaning}</div></td>
          <td class="num">${f3(b.defaults[k])}</td><td class="num">${b.fitted ? f3(b.fitted[k]) : '—'}</td><td class="num"><b>${f3(b.params[k])}</b></td></tr>`).join('')}</tbody></table></div>
      <p class="note">With the settings in use, what a student learned fades by half in about ${halfLife(b.params.pForget)} days without practice; each extra practice day slows the fading.</p>`;

    const methodBody = m ? `<p class="muted" style="font-size:.9rem;margin-bottom:10px">A test with a known answer: made-up students are created from the true values below, then NeuroLearn-X sees only their answers and has to work the values out. It is tried twice: with answers in the order given, and with only each set’s totals.</p>
      <div class="table-wrap"><table><thead><tr><th>Setting</th><th class="num">True value</th><th class="num">Found from answers in order</th><th class="num">Found from totals only</th></tr></thead>
        <tbody>${BKT_ROWS.map(([k, label]) => `<tr><td><b>${label}</b></td><td class="num"><b>${f3(m.truth[k])}</b></td>
          <td class="num">${f3(m.ordered.params[k])}</td><td class="num">${f3(m.totals.params[k])}</td></tr>`).join('')}</tbody></table></div>
      <p class="note">From answers in order, the values found are close to the true ones, and next answers are predicted with a score of ${f2(m.ordered.metrics.fitted.auc)} (simple score ${f2(m.ordered.metrics.baseline.auc)}). From totals only, the values drift, for example finding forgetting that is not there. That is why every answer is now saved in order.</p>` : '';

    const loadBody = cv.ready ? `${scoreBars([['Tuned to your students', cv.mae.calibrated * 100], ['Starting settings', cv.mae.prior * 100], ['Always guess the class average', cv.mae.constant * 100]], { lo: 0, hi: Math.max(cv.mae.constant, cv.mae.prior, cv.mae.calibrated) * 100, fmt: v => `${v.toFixed(1)} points off`, better: 'low' })}
        <p class="note">How far the estimate is, on average, from the effort students reported after a set (1–9, turned into 0–100), checked on students it did not learn from. Lower is better.<br>
          <span class="hint">Technical: mean absolute error, ${cv.folds}-fold cross-validation ${cv.byLearner ? 'by student' : 'by rating'}, ${cv.n} effort ratings.</span></p>`
      : `<p class="muted">The check starts at ${cv.minSamples} effort ratings (now ${cv.n}).</p>`;

    const rapidBody = kinds.length ? `<div class="table-wrap"><table><thead><tr><th>Where</th><th class="num">Answers</th><th class="num">Rushed</th><th class="num">Share</th></tr></thead>
        <tbody>${kinds.map(([k, label]) => { const r = d.rapid[k]; return `<tr><td>${label}</td><td class="num">${r.answers}</td><td class="num">${r.rapid}</td><td class="num">${pct(r.answers ? r.rapid / r.answers : 0)}</td></tr>`; }).join('')}</tbody></table></div>
        <p class="note">Rushed answers (under ${d.rapidSec} seconds) still count in test scores, but not toward mastery. A student who rushes more than ${Math.round(RAPID_WARN * 100)}% of answers is flagged on the Progress page.</p>` : '<div class="empty">No answers yet.</div>';

    // Fitted values sitting on a search limit: the data could not pin them down.
    const atLimit = b.fitted ? BKT_ROWS.filter(([k]) => E.BKT_BOUNDS[k].some(edge => Math.abs(b.fitted[k] - edge) < 1e-6) && !(k === 'pForget' && b.fitted[k] === 0)).map(r => r[1]) : [];
    const limits = [
      data.synthetic && 'Not enough real student data yet: most results come from the made-up demo class.',
      atLimit.length && `The ${atLimit.join(' and ')} setting${atLimit.length === 1 ? '' : 's'} hit the edge of the allowed range: the data cannot pin ${atLimit.length === 1 ? 'it' : 'them'} down yet.`,
      b.nAnswers && ordered < 1 && `${pct(1 - ordered)} of answers were saved before their order was kept, which makes the tuned settings less reliable (see the known-answer test).`,
      'The diagnostic and post-test ask one question per topic, so for many topics the estimate starts from a single answer.',
      'The same settings are used for every topic: harder topics are not treated separately.',
      'Answers given after a hint count like other answers. Hint use is saved so its effect can be studied.',
      'With few students, these results can change a lot: always mention how many students and answers they are based on.',
      'Cognitive load is learned from how hard students say a set felt, which is their own opinion.'
    ].filter(Boolean);

    return head('How accurate are the estimates?', 'NeuroLearn-X tests itself on students it did not learn from. Start with the summary; open any section below for the evidence.',
      `<div class="row-actions"><span class="hint" style="align-self:center">Checked ${esc(new Date(d.computedAt).toLocaleString())}</span><button class="btn small" type="button" data-action="models-refit">${icon('refresh', 14)} Check again</button></div>`) +
      glance +
      section('target', 'Mastery: the details', b.ready ? `${b.nAnswers} answers from ${b.nLearners} students` : 'Not enough answers yet', masteryBody) +
      (m ? section('check', 'Known-answer test', `${m.learners} made-up students · shows the method works`, methodBody) : '') +
      section('load', 'Cognitive load: the details', cv.ready ? `${cv.n} effort ratings` : 'Not enough ratings yet', loadBody) +
      section('alert', 'Rushed answers: the details', `Answers in under ${d.rapidSec} seconds`, rapidBody) +
      `<div class="card"><div class="card-head">${cardTitle('alert', 'Known limitations', 'Say these before anyone asks')}</div>
        <ul class="xai-list">${limits.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`;
  }

  // ------------------------------------------------------------ teacher: classes
  function viewClasses() {
    const classes = S.data.classes;
    const cards = classes.map(c => {
      const students = S.data.learners.filter(l => l.classId === c.id);
      const rows = students.length ? students.map(l => `<tr>
          <td><div class="learner-cell"><span class="avatar">${esc(initials(l.name))}</span><div><b>${esc(l.name)}</b><div class="hint">@${esc(l.username)}</div></div></div></td>
          <td><select data-student="${esc(l.id)}" data-field="track" aria-label="Track for ${esc(l.name)}">${trackOptions(l.track, '—')}</select></td>
          <td><select data-student="${esc(l.id)}" data-field="group" aria-label="Study group for ${esc(l.name)}">
            ${['adaptive', 'standard', ''].map(gk => `<option value="${gk}"${l.group === gk ? ' selected' : ''}>${GROUP_LABEL[gk]}</option>`).join('')}</select></td>
          <td>${l.diagnosticDone ? pill('mastered', 'Done') : pill('unverified', 'Pending')}</td>
          <td class="num">${l.preTest ?? '—'}</td><td class="num">${l.postTest ?? '—'}</td>
          <td><div class="row-actions">
            <button class="btn small" type="button" data-action="reset-password" data-id="${esc(l.id)}" title="Set a new temporary password">${icon('key', 14)}</button>
            <button class="btn small" type="button" data-action="retake" data-id="${esc(l.id)}" title="Let the student retake the diagnostic">${icon('refresh', 14)}</button>
            <button class="btn small ghost" type="button" data-action="remove-student" data-id="${esc(l.id)}" title="Remove student" aria-label="Remove ${esc(l.name)}">${icon('trash', 14)}</button>
          </div></td></tr>`).join('')
        : '<tr><td colspan="7" class="empty">No students yet. Share the class code, or add a student.</td></tr>';
      return `<div class="card">
        <div class="card-head">${cardTitle('school', esc(c.name), `${students.length} student${students.length === 1 ? '' : 's'}`)}
          <div class="row-actions"><button class="btn small" type="button" data-action="rename-class" data-id="${c.id}">Rename</button>
          <button class="btn small primary" type="button" data-action="add-student" data-id="${c.id}">${icon('userPlus', 14)} Add student</button></div></div>
        <div class="class-tools">
          <div><div class="hint" style="font-weight:700;margin-bottom:4px">Class code</div>
            <span class="code-badge"><span class="code">${esc(c.joinCode)}</span>
            <button class="btn small" type="button" data-action="copy-code" data-code="${esc(c.joinCode)}" title="Copy code">${icon('copy', 14)}</button>
            <button class="btn small" type="button" data-action="new-code" data-id="${c.id}" title="Make a new code (the old one stops working)">${icon('refresh', 14)}</button></span></div>
          <label style="flex:0 1 260px">Post-test
            <select data-class="${c.id}" data-field="assessment">
              <option value="none"${c.assessment !== 'post' ? ' selected' : ''}>When each student’s path is complete</option>
              <option value="post"${c.assessment === 'post' ? ' selected' : ''}>Open now for the whole class</option>
            </select></label>
          <button class="btn" type="button" data-action="randomize" data-id="${c.id}">${icon('users', 16)} Randomly assign study groups</button>
        </div>
        <div class="table-wrap" style="margin-top:14px"><table>
          <thead><tr><th>Student</th><th>Track</th><th>Study group</th><th>Diagnostic</th><th class="num">Pre</th><th class="num">Post</th><th></th></tr></thead>
          <tbody>${rows}</tbody></table></div>
      </div>`;
    }).join('');
    return head('Classes and students', 'Students join with the class code and take the diagnostic (their pre-test) on first sign-in. The post-test opens when their path is complete.',
      `<button class="btn primary" type="button" data-action="new-class">${icon('plus', 16)} New class</button>`) + cards +
      `<p class="note">Study groups: <b>Adaptive</b> students get the personalized pathway; <b>Standard</b> students follow the course in its fixed order. Use random assignment for a fair comparison.</p>`;
  }

  // ------------------------------------------------------------ teacher: question bank
  // The bank is shared by the whole school; a teacher browses it one track at a time.
  function bankTopics(track) {
    return [...C.trackSubjects(track).map(id => [subjectName(track, id), C.SUBJECTS[id].sequence]),
      ['Junior High foundations', C.trackSkills(track).filter(id => G.byId[id].level === 'JHS')]].filter(g => g[1].length);
  }
  async function loadBank() {
    const skillId = S.bankSkill;
    try {
      const [counts, bank] = await Promise.all([api.get('/api/bank'), api.get(`/api/bank/skills/${encodeURIComponent(skillId)}`)]);
      S.bankCounts = counts.counts; S.bank = bank;
    } catch (e) {
      if (e.status === 401) throw e;
      S.bank = { skillId, error: e.message };
    }
  }
  const refreshBankCounts = () => run(async () => { S.bankCounts = (await api.get('/api/bank')).counts; });
  function bankCount(id) {
    const c = S.bankCounts && S.bankCounts[id];
    if (!c) return '';
    return c.generated ? `auto${c.custom ? ` +${c.custom}` : ''}` : String(c.builtin - c.hidden + c.custom);
  }

  function viewBank() {
    const track = S.bankTrack;
    const groups = bankTopics(track);
    if (!groups.some(g => g[1].includes(S.bankSkill))) S.bankSkill = groups[0][1][0];
    const b = S.bank && S.bank.skillId === S.bankSkill ? S.bank : null;
    if (!b && !S.bankLoading) {
      S.bankLoading = true;
      run(loadBank).finally(() => { S.bankLoading = false; if (S.tab === 'bank') render(); });
    }
    const topics = `<div class="card bank-topics"><label style="margin-bottom:10px">Track<select data-bind="bankTrack">${TRACKS.map(t => `<option${t === track ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
      ${groups.map(([label, ids]) => `<h4>${esc(label)}</h4>${ids.map(id => `<button class="bank-topic" type="button" data-action="bank-topic" data-skill="${id}"${id === S.bankSkill ? ' aria-current="true"' : ''}>
        <span>${esc(G.byId[id].short)}</span><span class="n">${bankCount(id)}</span></button>`).join('')}`).join('')}</div>`;
    const sk = G.byId[S.bankSkill];
    let body;
    if (!b) body = '<div class="card empty">Loading questions…</div>';
    else if (b.error) body = `<div class="card empty">${esc(b.error)}</div>`;
    else {
      const customs = b.items.filter(i => i.kind === 'custom'), builtins = b.items.filter(i => i.kind === 'builtin');
      const active = b.items.filter(i => i.active).length;
      const intro = b.generated
        ? `<div class="callout" style="margin:0 0 14px"><div><b>${icon('refresh', 16)} Generated with fresh numbers every time</b>
            <span class="muted" style="font-size:.88rem">This topic has no fixed list: each student gets new values, so answers cannot be copied. Questions you add are mixed in for up to half of a set.</span></div></div>
          <h3 style="margin-bottom:8px">Examples students might see</h3>
          <div class="q-list">${b.samples.map(s => `<div class="q-card"><div class="q-prompt">${mx(s.prompt)}</div>
            <ul class="q-choices">${s.choices.map((c, i) => `<li class="${i === s.answer ? 'right' : ''}"><span>${'ABCD'[i]}.</span><span>${mx(c)}</span>${i === s.answer ? '<span class="why">correct</span>' : ''}</li>`).join('')}</ul></div>`).join('')}</div>
          <h3 style="margin:18px 0 8px">Questions added by teachers</h3>`
        : `<p class="muted" style="font-size:.9rem;margin-bottom:12px">${active} active question${active === 1 ? '' : 's'} (${builtins.length} built-in, ${customs.length} added). Students need at least ${b.minActive}: the diagnostic asks 2 per topic and practice sets ask 5, repeating when there are fewer.</p>`;
      const list = (b.generated ? customs : b.items).map((it, n) => qCard(it, n + 1)).join('');
      body = `<div class="card"><div class="card-head">${cardTitle('bank', esc(skillName(sk.id)), esc(C.SUBJECTS[sk.subject] ? C.SUBJECTS[sk.subject].name : 'Junior High foundation'))}
          <button class="btn primary small" type="button" data-action="bank-add">${icon('plus', 14)} Add question</button></div>
        ${intro}<div class="q-list">${list || '<div class="empty">No questions added yet.</div>'}</div></div>`;
    }
    return head('Question bank', 'Every topic of every track comes with a starter bank. Edit, hide or add questions here; changes reach students in all classes right away. Answers and explanations are what students see as tutoring feedback.') +
      `<div class="bank-layout">${topics}<div>${body}</div></div>`;
  }

  function qCard(it, n) {
    const sp = it.spec;
    const badge = it.kind === 'custom' ? pill('developing', `Added by ${it.updatedBy || 'a teacher'}`) : it.edited ? pill('developing', `Edited${it.updatedBy ? ` by ${it.updatedBy}` : ''}`) : pill('mastered', 'Built-in');
    const choices = [[sp.answer, null], ...sp.wrong];
    const steps = sp.explanation.split('\n').filter(Boolean);
    const id = esc(it.id);
    return `<div class="q-card${it.active ? '' : ' off'}">
      <div class="q-head"><div class="chips" style="margin:0"><b>Q${n}</b> ${badge} ${it.active ? '' : pill('unverified', 'Hidden from students')}</div>
        <div class="row-actions">
          <button class="btn small" type="button" data-action="bank-edit" data-id="${id}">${icon('edit', 14)} Edit</button>
          <button class="btn small" type="button" data-action="bank-toggle" data-id="${id}" data-active="${it.active ? 0 : 1}">${icon(it.active ? 'eyeOff' : 'eye', 14)} ${it.active ? 'Hide' : 'Show'}</button>
          ${it.kind === 'builtin' && it.edited ? `<button class="btn small" type="button" data-action="bank-restore" data-id="${id}" title="Undo the edits">${icon('refresh', 14)} Restore</button>` : ''}
          ${it.kind === 'custom' ? `<button class="btn small ghost" type="button" data-action="bank-delete" data-id="${id}" aria-label="Delete question">${icon('trash', 14)}</button>` : ''}
        </div></div>
      <div class="q-prompt">${mx(sp.prompt)}</div>
      <ul class="q-choices">${choices.map(([c, why]) => `<li class="${why === null ? 'right' : ''}"><span>${why === null ? '✓' : '✗'}</span><span>${mx(c)}</span>${why === null ? '<span class="why">correct</span>' : why ? `<span class="why">${mx(why)}</span>` : ''}</li>`).join('')}</ul>
      <details><summary>Hint and worked solution</summary>
        ${sp.hint ? `<p style="margin:6px 0"><b>Hint:</b> ${mx(sp.hint)}</p>` : ''}
        <ol class="sol-steps">${steps.map(s => `<li>${mx(s)}</li>`).join('')}</ol></details>
    </div>`;
  }

  function bankEditor(item) {
    const sp = item ? item.spec : { prompt: '', answer: '', wrong: [['', ''], ['', ''], ['', '']], hint: '', explanation: '' };
    openDialog(`<h2>${item ? 'Edit question' : 'Add a question'}</h2>
      <p class="lead">${esc(skillName(S.bankSkill))}. Write math between \\( and \\), for example <code>\\(\\frac{1}{2}x^{2}\\)</code>. The preview shows what students will see.</p>
      <label>Question<textarea name="prompt" rows="3" required maxlength="1500">${esc(sp.prompt)}</textarea></label>
      <label>Correct answer<input name="answer" required maxlength="400" value="${esc(sp.answer)}"></label>
      ${[0, 1, 2].map(i => `<div class="wrong-row"><label>Wrong option ${i + 1}<input name="w${i}" required maxlength="400" value="${esc(sp.wrong[i][0])}"></label>
        <label>Why it is wrong (tutor feedback)<input name="y${i}" maxlength="600" value="${esc(sp.wrong[i][1])}" placeholder="The mistake that leads here"></label></div>`).join('')}
      <label>Hint (optional)<input name="hint" maxlength="400" value="${esc(sp.hint)}"></label>
      <label>Worked solution, one step per line<textarea name="explanation" rows="4" required maxlength="2000">${esc(sp.explanation)}</textarea></label>
      <div><div class="hint" style="font-weight:700;margin-bottom:4px">Preview</div><div class="q-preview" id="qPreview"></div></div>`,
    fd => {
      const body = { prompt: fd.prompt, answer: fd.answer, wrong: [0, 1, 2].map(i => [fd[`w${i}`], fd[`y${i}`]]), hint: fd.hint, explanation: fd.explanation };
      return item ? api.put(`/api/bank/items/${encodeURIComponent(item.id)}`, body) : api.post(`/api/bank/skills/${encodeURIComponent(S.bankSkill)}`, body);
    }, { wide: true, done: async res => { S.bank = res; await refreshBankCounts(); toast(item ? 'Question saved' : 'Question added'); } });
    bankPreview();
  }
  function bankPreview() {
    const box = $('#qPreview');
    if (!box) return;
    const f = Object.fromEntries(new FormData($('#dialogForm')));
    const opts = [f.answer, f.w0, f.w1, f.w2];
    box.innerHTML = `<div class="q-prompt">${mx(f.prompt || 'Your question appears here.')}</div>
      <ul class="q-choices">${opts.map((o, i) => `<li class="${i === 0 ? 'right' : ''}"><span>${'ABCD'[i]}.</span><span>${mx(o || '…')}</span></li>`).join('')}</ul>
      ${f.explanation ? `<ol class="sol-steps">${f.explanation.split('\n').filter(s => s.trim()).map(s => `<li>${mx(s)}</li>`).join('')}</ol>` : ''}
      <p class="hint" style="margin-top:6px">Students see the options in a random order.</p>`;
  }

  async function bankAction(a, b) {
    const id = b.dataset.id;
    const it = S.bank && S.bank.items ? S.bank.items.find(x => x.id === id) : null;
    const url = `/api/bank/items/${encodeURIComponent(id || '')}`;
    let res;
    if (a === 'bank-topic') { S.bankSkill = b.dataset.skill; render(); return; }
    if (a === 'bank-add') return bankEditor(null);
    if (a === 'bank-edit') return bankEditor(it);
    if (a === 'bank-toggle') res = await run(() => api.post(`${url}/active`, { active: b.dataset.active === '1' }));
    if (a === 'bank-restore') {
      if (!confirm('Restore the original question? Your edits to it are discarded.')) return;
      res = await run(() => api.del(url));
    }
    if (a === 'bank-delete') {
      if (!confirm('Delete this question? Students will no longer get it.')) return;
      res = await run(() => api.del(url));
    }
    if (!res) return;
    S.bank = res;
    await refreshBankCounts();
    render();
    toast({ 'bank-toggle': b.dataset.active === '1' ? 'Question shown to students' : 'Question hidden', 'bank-restore': 'Original restored', 'bank-delete': 'Question deleted' }[a]);
  }

  // ------------------------------------------------------------ dialogs
  const dialog = $('#dialog');
  let dialogSubmit = null, dialogDone = null;
  function openDialog(html, onSubmit, opts = {}) {
    $('#dialogBody').innerHTML = `<form id="dialogForm" class="stack" novalidate>${html}
      <p class="form-error" role="alert"></p>
      <div class="row end"><button class="btn" type="button" data-action="close-dialog">Cancel</button><button class="btn primary" type="submit">Save</button></div></form>`;
    dialogSubmit = onSubmit;
    dialogDone = opts.done || null;
    dialog.classList.toggle('wide', !!opts.wide);
    // iOS before 15.4 has no showModal(): show it as a plain overlay instead.
    if (dialog.showModal) dialog.showModal(); else { dialog.setAttribute('open', ''); dialog.classList.add('fallback'); }
    const first = dialog.querySelector('input, select, textarea');
    if (first && !touchScreen()) first.focus();
  }
  function closeDialog() {
    if (dialog.close) dialog.close(); else dialog.removeAttribute('open');
  }
  dialog.addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    if (b.dataset.action === 'close-dialog') closeDialog();
    if (b.dataset.action === 'toggle-pw') togglePw(b);
  });
  dialog.addEventListener('input', () => bankPreview());
  dialog.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const errEl = form.querySelector('.form-error');
    errEl.textContent = '';
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    const ok = await run(() => dialogSubmit(Object.fromEntries(new FormData(form))), errEl);
    btn.disabled = false;
    if (ok !== undefined) {
      closeDialog();
      if (dialogDone) await dialogDone(ok);
      await refresh();
    }
  });
  async function refresh() { await run(loadData); render(); }

  // ------------------------------------------------------------ teacher: record
  function viewRecord({ learner, analysis }) {
    const own = E.sortAttempts(S.data.attempts.filter(a => a.learnerId === learner.id)).reverse();
    const f = S.form;
    // The learner's track subjects, then the Junior High foundations they use.
    const groups = [...C.trackSubjects(learner.track).map(id => [subjectName(learner.track, id), C.SUBJECTS[id].sequence]),
      ...(foundationsOf(learner).length ? [['Junior High foundations', foundationsOf(learner)]] : [])];
    const skillOptions = groups.map(([label, ids]) => `<optgroup label="${esc(label)}">${
      ids.map(id => `<option value="${id}"${f.skillId === id ? ' selected' : ''}>${esc(skillName(id))}</option>`).join('')}</optgroup>`).join('');
    const masteryRows = groups.map(([label, ids]) => `<tr class="group-row"><td colspan="4">${esc(label)}</td></tr>` +
      ids.map(id => {
        const s = G.byId[id], m = analysis.mastery[id];
        const ev = m.source === 'assessed' ? `${m.items} items · ${m.attempts} attempt${m.attempts === 1 ? '' : 's'}` : m.source === 'inferred' ? 'Inferred from later skills' : 'Not assessed';
        return `<tr><td><b>${s.id}</b> ${esc(s.name)}</td><td>${statusPill(E.masteryStatus(m))}</td><td style="min-width:130px">${masteryBar(m.p)}</td><td class="muted" style="font-size:.8rem">${ev}</td></tr>`;
      }).join('')).join('') || '<tr><td colspan="4" class="empty">Set this student’s track to see their subjects.</td></tr>';
    const attemptRows = own.length ? own.map(a => `<tr>
        <td class="num">${esc(a.date)}</td><td><b>${a.skillId}</b> <span class="muted">${esc(G.byId[a.skillId].short)}</span></td>
        <td>${esc(a.type)}${a.source === 'teacher' ? ' <span class="hint">(entered)</span>' : ''}</td><td class="num">${a.itemsCorrect}/${a.itemsTotal} <span class="muted">(${pct(a.itemsCorrect / a.itemsTotal)})</span></td>
        <td class="num">${f1(a.timeSec / 60)} min</td><td class="num">${a.hints}</td>
        <td class="num">${a.effort == null ? '<span class="muted">—</span>' : a.effort}</td>
        <td><button class="btn ghost small" type="button" data-action="delete-attempt" data-id="${esc(a.id)}" aria-label="Delete attempt">Delete</button></td>
      </tr>`).join('') : '<tr><td colspan="8" class="empty">No attempts yet. The diagnostic records them automatically.</td></tr>';

    return head(`Performance of ${esc(learner.name)}`,
      'In-app diagnostics and practice are recorded automatically. Use this form for paper quizzes and other offline work.', '', 'Step 1 · Record') + `
      <div class="grid two">
        <div class="card"><div class="card-head">${cardTitle('record', 'Record an offline attempt')}</div>
          <form id="attemptForm" class="stack" novalidate>
            <label>Skill<select name="skillId" required>${skillOptions}</select></label>
            <div class="row">
              <label>Type<select name="type">${ATTEMPT_TYPES.map(t => `<option${f.type === t ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
              <label>Date<input type="date" name="date" value="${esc(f.date)}" required></label>
            </div>
            <div class="row">
              <label>Items correct<input type="number" name="itemsCorrect" min="0" max="100" step="1" required></label>
              <label>Items total<input type="number" name="itemsTotal" min="1" max="100" step="1" value="10" required></label>
            </div>
            <div class="row">
              <label>Time spent (min)<input type="number" name="minutes" min="0.5" max="600" step="0.5" required></label>
              <label>Hints used<input type="number" name="hints" min="0" max="100" step="1" value="0"></label>
            </div>
            <label>Mental effort (student's 1–9 rating)
              <select name="effort"><option value="">Not rated</option>${PAAS.map((p, i) => `<option value="${i + 1}">${i + 1} · ${p}</option>`).join('')}</select></label>
            <p class="form-error" role="alert"></p>
            <div class="row end"><button class="btn primary" type="submit">${icon('check', 18)} Record attempt</button></div>
          </form></div>
        <div class="card"><div class="card-head">${cardTitle('target', 'Mastery map', `${esc(learner.section || '')} · group: ${GROUP_LABEL[learner.group || '']} · marker at 85%`)}</div>
          <div class="table-wrap"><table><thead><tr><th>Skill</th><th>Status</th><th>Mastery</th><th>Evidence</th></tr></thead><tbody>${masteryRows}</tbody></table></div></div>
      </div>
      <div class="card"><div class="card-head">${cardTitle('clock', 'Attempt history', `${own.length} recorded`)}</div>
        <div class="table-wrap"><table>
          <thead><tr><th>Date</th><th>Skill</th><th>Type</th><th class="num">Score</th><th class="num">Time</th><th class="num">Hints</th><th class="num">Effort</th><th></th></tr></thead>
          <tbody>${attemptRows}</tbody></table></div></div>`;
  }

  async function submitAttempt(form) {
    const fd = new FormData(form);
    const num = k => Number(fd.get(k));
    const errEl = form.querySelector('.form-error');
    const minutes = num('minutes');
    if (fd.get('itemsCorrect') === '' || !(minutes > 0)) { errEl.textContent = 'Enter the items correct and the minutes spent.'; return; }
    const body = {
      learnerId: current().id, skillId: fd.get('skillId'), type: fd.get('type'), date: fd.get('date'),
      itemsCorrect: num('itemsCorrect'), itemsTotal: num('itemsTotal'), timeSec: Math.round(minutes * 60),
      hints: num('hints') || 0, effort: fd.get('effort') ? num('effort') : null
    };
    const ok = await run(() => api.post('/api/attempts', body), errEl);
    if (!ok) return;
    S.form = { skillId: body.skillId, type: body.type, date: body.date };
    await refresh();
    toast(`Recorded ${body.skillId}: ${body.itemsCorrect}/${body.itemsTotal}`);
  }

  // ------------------------------------------------------------ teacher: load
  /*
   * Cognitive load, in a teacher's terms: what the levels mean and what to do,
   * one topic checked in detail, and every topic grouped by level. How the
   * estimate is made, and how it compared with the student's own ratings,
   * are folded away for those who want them.
   */
  function viewLoad({ model, analysis, learner }) {
    const P = E.PRIOR_MODEL;
    const seq = seqOf(learner), scope = C.trackSkills(learner.track);
    const open = seq.filter(id => E.masteryStatus(analysis.mastery[id]) !== 'mastered');
    if (!S.forecastSkill || !scope.includes(S.forecastSkill)) S.forecastSkill = open[0] || seq[0];
    const fc = analysis.forecasts[S.forecastSkill];
    const plain = BAND_PLAIN[fc.band.key];
    const name = esc(firstName(learner.name));

    const guide = `<div class="band-guide">${E.LOAD_BANDS.map(b => `<div class="band-row"><span>${pill(b.key, BAND_PLAIN[b.key].title)}</span>
      <span class="hint">${BAND_PLAIN[b.key].range}</span><span>${esc(BAND_PLAIN[b.key].todo)}</span></div>`).join('')}</div>`;

    // What pushes this topic's estimate up, as shares of the total push.
    const pushes = fc.contributions.filter(c => c.contribution > 0.05).sort((a, b) => b.contribution - a.contribution);
    const pushTotal = pushes.reduce((s, c) => s + c.contribution, 0) || 1;
    const why = pushes.length ? `<div class="drivers">${pushes.map(c => `<div class="driver"><span class="d-label">${esc(SIGNAL_PLAIN[c.key])}</span>
        <span class="d-bar"><span style="width:${Math.round((c.contribution / pushTotal) * 100)}%"></span></span><span class="d-val">${Math.round((c.contribution / pushTotal) * 100)}%</span></div>`).join('')}</div>`
      : '<p class="muted">Nothing in particular makes this topic hard for this student.</p>';
    const check = `<div class="card" id="loadCheck"><div class="card-head">${cardTitle('target', 'Check one topic', 'Before you teach it')}</div>
      <label style="margin-bottom:14px">Topic<select data-bind="forecastSkill">${scope.map(id => `<option value="${id}"${id === S.forecastSkill ? ' selected' : ''}>${esc(G.byId[id].name)}</option>`).join('')}</select></label>
      <div class="load-result"><div class="load-big ${fc.band.key}">${pct(fc.load)}</div>
        <div><div>${bandPill(fc.band)}</div><p style="margin-top:6px"><b>What to do:</b> ${esc(plain.todo)}</p></div></div>
      <h4 class="sub-h">Why it is rated this way</h4>${why}</div>`;

    // Every topic of the track, hardest level first, mastered ones apart.
    const groups = [...E.LOAD_BANDS].reverse().map(b => ({ b, ids: open.filter(id => analysis.forecasts[id].band.key === b.key) })).filter(g => g.ids.length);
    const done = seq.filter(id => !open.includes(id));
    const chip = id => `<button class="chip-btn${id === S.forecastSkill ? ' on' : ''}" type="button" data-action="forecast-pick" data-skill="${id}">${esc(G.byId[id].short)} <span class="hint">${pct(analysis.forecasts[id].load)}</span></button>`;
    const byLevel = `<div class="card"><div class="card-head">${cardTitle('path', `All ${esc(C.trackLabel(learner.track))} topics by level`, 'Tap a topic to check it above')}</div>
      ${groups.map(g => `<div class="level-group"><div class="level-head">${pill(g.b.key, BAND_PLAIN[g.b.key].title)}<span class="hint">${g.ids.length} topic${g.ids.length === 1 ? '' : 's'}</span></div>
        <div class="chip-row">${g.ids.map(chip).join('')}</div></div>`).join('') || '<div class="empty">Every topic is mastered.</div>'}
      ${done.length ? `<p class="hint" style="margin-top:10px">Already mastered, not shown: ${done.length} topic${done.length === 1 ? '' : 's'}.</p>` : ''}</div>`;

    const status = model.calibrated
      ? `Tuned to this school using <b>${model.n}</b> effort ratings from students. <button class="btn link" type="button" data-action="go" data-tab="models">How accurate is it?</button>`
      : `Using research-based starting settings. It tunes itself once students have given 12 effort ratings (now ${model.n}).`;
    const weights = E.FEATURES.map(f => `<tr><td>${esc(SIGNAL_PLAIN[f.key])}<div class="hint">${esc(f.label)}</div></td><td class="num">${P.w[f.key].toFixed(2)}</td><td class="num"><b>${model.w[f.key].toFixed(2)}</b></td></tr>`).join('') +
      `<tr><td class="muted">Starting point (intercept)</td><td class="num">${P.bias.toFixed(2)}</td><td class="num"><b>${model.bias.toFixed(2)}</b></td></tr>`;
    const how = `<details class="card disclose"><summary>${cardTitle('bulb', 'How the estimate is made', 'For those who want the details')}</summary>
      <p style="font-size:.9rem">${status}</p>
      <p class="muted" style="font-size:.88rem;margin-top:8px">Five signals are weighed and combined into one percentage (a logistic model). A bigger weight means that signal matters more. After each set, students rate their mental effort from 1 to 9, and the weights are adjusted so the estimates match those ratings.</p>
      <div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>Signal</th><th class="num">Starting weight</th><th class="num">Weight now</th></tr></thead><tbody>${weights}</tbody></table></div></details>`;

    const rows = [...analysis.rows].reverse().map(r => {
      const a = r.attempt;
      const diff = r.rated == null ? null : Math.round((r.prediction.load - r.rated) * 100);
      return `<div class="past-row"><div><b>${esc(G.byId[a.skillId].short)}</b><div class="hint">${esc(a.date)} · ${a.itemsCorrect}/${a.itemsTotal} right · ${f1(Math.pow(2, r.x.time))}× expected time · ${a.hints} hint${a.hints === 1 ? '' : 's'}</div></div>
        <div class="past-vals"><span class="hint">Estimated</span>${bandPill(r.prediction.band, r.prediction.load)}
          <span class="hint">Student said</span>${r.rated == null ? '<span class="muted">—</span>' : `<b>${a.effort}/9</b> <span class="hint">(${pct(r.rated)}${diff ? `, ${diff > 0 ? 'estimate ' + diff + ' higher' : 'estimate ' + -diff + ' lower'}` : ''})</span>`}</div></div>`;
    }).join('');
    const past = `<details class="card disclose"><summary>${cardTitle('record', 'Past sets: estimate vs. what the student said', `${analysis.rows.length} set${analysis.rows.length === 1 ? '' : 's'}`)}</summary>
      ${rows ? `<div class="past-list">${rows}</div>` : '<div class="empty">No sets yet.</div>'}</details>`;

    return head(`How hard will each topic feel for ${name}?`,
      `NeuroLearn-X estimates the mental effort (cognitive load) each topic will take ${name}, from 0% to 100%. It looks at how demanding the topic is, how ${name} has been doing, and how ${name} rated their own effort after each set.`, '', 'Step 2 · Cognitive load') + `
      <div class="card"><div class="card-head">${cardTitle('load', 'What the levels mean')}</div>${guide}</div>
      ${check}${byLevel}${how}${past}`;
  }

  // ------------------------------------------------------------ teacher: gaps
  // Graph lanes: Junior High foundations first, then the track's subjects in order.
  function dagLanes(learner, relevant) {
    const shown = G.topo.filter(id => relevant.has(id));
    const subjects = C.trackSubjects(learner.track);
    const extra = [...new Set(shown.map(id => G.byId[id].subject))].filter(s => s !== 'JHS' && !subjects.includes(s));
    return ['JHS', ...subjects, ...extra].map(s => ({
      id: s,
      label: s === 'JHS' ? 'Junior High foundations' : subjects.includes(s) ? subjectName(learner.track, s) : C.SUBJECTS[s].name,
      // Subjects in teaching order; foundations in prerequisite order.
      ids: s === 'JHS' ? shown.filter(id => G.byId[id].subject === s) : C.SUBJECTS[s].sequence.filter(id => relevant.has(id)),
      stack: s === 'JHS'
    })).filter(l => l.ids.length);
  }

  function viewGaps({ analysis, learner }) {
    const { diagnosis, mastery } = analysis;
    const targets = new Set(diagnosis.targets.map(t => t.id));
    const relevant = new Set(targets);
    targets.forEach(t => G.ancestors(t).forEach(a => relevant.add(a)));
    const status = {};
    G.skills.forEach(s => { status[s.id] = E.masteryStatus(mastery[s.id]); });
    // Red marks only the first step out of each root gap: what it directly holds
    // back. Pointing at a topic shows the rest of its chain.
    const hot = new Set();
    diagnosis.gaps.filter(g => g.isRoot).forEach(g => {
      G.skills.forEach(s => { if (relevant.has(s.id) && s.prereqs.includes(g.id)) hot.add(`${g.id}>${s.id}`); });
    });
    /*
     * In a teacher's words: the weak topics with no weak topic beneath them
     * ("fix these first", the root gaps), the other weak topics and which of
     * those they wait on, and which goal topics can be taught now. The full
     * prerequisite map is folded away: it needs a wide screen.
     */
    const short = id => esc(G.byId[id].short);
    const chipList = (ids, max = 6) => `${ids.slice(0, max).map(id => `<span class="chip">${short(id)}</span>`).join('')}${ids.length > max ? `<span class="hint">and ${ids.length - max} more</span>` : ''}`;
    const roots = diagnosis.gaps.filter(g => g.isRoot), others = diagnosis.gaps.filter(g => !g.isRoot);
    const notMastered = diagnosis.targets.filter(t => t.status !== 'mastered');
    const ready = notMastered.filter(t => !t.blockedBy.length), waiting = notMastered.filter(t => t.blockedBy.length);
    const name = esc(firstName(learner.name));

    const fixFirst = roots.length ? `<div class="gap-list">${roots.map(g => `
      <div class="gap-item root">
        <h3>${esc(G.byId[g.id].name)} ${statusPill(g.status)}</h3>
        <p>${g.status === 'unverified' ? 'Give a short quiz on it before teaching the topics that need it.' : `${name} has about ${pct(g.p)} mastery here. Review it before moving on.`}</p>
        <div class="chips"><span class="hint">Fixing it helps with ${g.impact} topic${g.impact === 1 ? '' : 's'}:</span>${chipList(g.blocks)}</div>
      </div>`).join('')}</div>`
      : `<div class="empty">${diagnosis.targets.length ? `Nothing to fix first. ${name}'s earlier topics are solid.` : 'Every goal topic is already mastered.'}</div>`;
    const alsoWeak = others.length ? `<div class="card"><div class="card-head">${cardTitle('gaps', 'Also weak', 'These should improve once the topics above are fixed')}</div>
      <div class="simple-list">${others.map(g => {
        const under = roots.filter(r => G.ancestors(g.id).has(r.id)).map(r => r.id);
        return `<div class="simple-row"><div><b>${esc(G.byId[g.id].name)}</b>${under.length ? `<div class="chips" style="margin-top:4px"><span class="hint">Needs first:</span>${chipList(under, 4)}</div>` : ''}</div>${statusPill(g.status)}</div>`;
      }).join('')}</div></div>` : '';
    const goals = `<div class="card"><div class="card-head">${cardTitle('target', 'Goal topics', 'From the goal chosen above')}</div>
      ${notMastered.length ? `${ready.length ? `<h4 class="sub-h">Ready to teach now</h4><div class="chips">${chipList(ready.map(t => t.id), 40)}</div>` : ''}
        ${waiting.length ? `<h4 class="sub-h">Waiting on earlier topics</h4><div class="simple-list">${waiting.map(t => `<div class="simple-row"><div><b>${esc(G.byId[t.id].name)}</b>
          <div class="chips" style="margin-top:4px"><span class="hint">Needs first:</span>${chipList(t.blockedBy, 4)}</div></div></div>`).join('')}</div>` : ''}`
        : '<div class="empty">Every goal topic is already mastered.</div>'}
      ${diagnosis.targets.length > notMastered.length ? `<p class="hint" style="margin-top:10px">Already mastered: ${diagnosis.targets.length - notMastered.length} topic${diagnosis.targets.length - notMastered.length === 1 ? '' : 's'}.</p>` : ''}</div>`;

    const map = `<details class="card disclose"><summary>${cardTitle('gaps', 'Show the prerequisite map', 'Every topic and what it builds on')}</summary>
      <ul class="map-key">
        <li>Each box is a topic, coloured by how well ${name} knows it. One row per subject.</li>
        <li>Arrows point from a topic to the topics that build on it. <b style="color:var(--critical-ink)">Red arrows</b> start at a “fix first” topic.</li>
        <li>A thick outline marks a goal topic. Point at or tap a topic to highlight what it needs and unlocks.</li>
      </ul>
      <div class="legend">${['mastered', 'developing', 'gap', 'unverified'].map(s => `<span>${statusPill(s)}</span>`).join('')}</div>
      <p class="hint mobile-only" style="margin-bottom:6px">The map is wide: scroll sideways to see all of it.</p>
      <div class="chart-scroll">${V.dag({ graph: G, mastery, status, relevant, targets, hotEdges: hot, lanes: dagLanes(learner, relevant) })}</div></details>`;

    return head(`What is holding ${name} back?`,
      `${learner.diagnosticDone ? '' : `<b>${name} has not taken the diagnostic yet</b>, so most topics are not checked. `}Topics build on earlier ones. When an earlier topic is weak, the topics after it get harder. Start with the topics under “Fix these first”: each one unlocks several others.`,
      `<div class="head-controls">${targetSelect(learner)}</div>`, 'Step 3 · Skill gaps') + `
      <div class="tiles">
        ${tile('alert', 'Fix these first', roots.length, 'weak earlier topics')}
        ${tile('gaps', 'Also weak', others.length, 'improve after the fixes')}
        ${tile('check', 'Ready to teach', ready.length, 'goal topics')}
        ${tile('clock', 'Waiting', waiting.length, 'on earlier topics')}
      </div>
      <div class="card"><div class="card-head">${cardTitle('alert', 'Fix these first', 'Weak topics that other topics depend on')}</div>${fixFirst}</div>
      ${alsoWeak}${goals}${map}`;
  }

  // ------------------------------------------------------------ teacher: outcomes
  function runSim(analysis, model, learner) {
    const key = `${learner.id}|${learner.track}|${rev}|${S.budget}|${S.runs}`;
    if (S.simKey === key && S.sim) return S.sim;
    // The projection always compares the adaptive pathway with the standard order,
    // whichever group the learner is in. Like the pre/post-test it covers every
    // subject of the learner's track.
    const seq = seqOf(learner);
    const diagnosis = E.diagnoseGaps(analysis.mastery, G, seq, null);
    const adaptive = E.recommendPathway(analysis.mastery, G, seq, diagnosis, analysis.profile, model);
    S.sim = E.simulateComparison({ mastery: analysis.mastery, graph: G, standard: seq, pathway: adaptive, profile: analysis.profile, model, budget: S.budget, runs: S.runs });
    S.simKey = key;
    return S.sim;
  }

  function viewOutcomes({ learner, analysis, model }) {
    const sim = runSim(analysis, model, learner);
    const A = sim.adaptive, B = sim.standard;
    const diff = A.score.mean - B.score.mean;
    const trajRows = A.trajectory.filter(p => p.t % 5 === 0 || p.t === sim.budget).map(p => `<tr><td class="num">${p.t}</td><td class="num">${f1(p.mean)}</td><td class="num">${f1(B.trajectory[p.t].mean)}</td></tr>`).join('');
    const seq = seqOf(learner);
    const skillRows = seq.map(id => `<tr><td>${esc(skillName(id))}</td><td class="num">${pct(A.perSkill[id])}</td><td class="num">${pct(B.perSkill[id])}</td></tr>`).join('');
    const unverified = C.trackSkills(learner.track).filter(id => analysis.mastery[id].source === 'prior').length;
    const legend = `<div class="legend"><span><i class="line" style="background:var(--series-1)"></i>Adaptive pathway</span><span><i class="line" style="background:var(--series-2)"></i>Standard sequence</span></div>`;
    const key = c => `<span class="key" style="background:var(${c})"></span>`;
    return head('Compare learning outcomes',
      'The cohort evaluation compares real pre- and post-test results between study groups. The projection replays one student’s adaptive pathway and the standard sequence through a learner model.', '', 'Step 5 · Compare') + `
      <div class="card" id="cohortCard">
        <div class="card-head">${cardTitle('users', 'Cohort evaluation · adaptive vs standard', 'Diagnostic (pre-test) and post-test scores appear automatically. You can also type scores from paper tests.')}
          <div class="row no-print" style="align-items:end;flex:0 1 330px">
            <label>Track<select data-bind="cohortTrack"><option value="">All tracks</option>${TRACKS.map(t => `<option${t === S.cohortTrack ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
            <button class="btn small" type="button" data-action="export-outcomes" style="flex:0 0 auto">Export CSV</button></div></div>
        <p class="hint" style="margin:-4px 0 10px">Each track’s test covers its own subjects, so compare within one track when the groups mix tracks.</p>
        <div id="cohortStats"></div>
        <details class="table-view"><summary>Students and scores</summary>
          <div class="table-wrap"><table>
            <thead><tr><th>Student</th><th>Class</th><th>Track</th><th>Group</th><th class="num">Pre-test</th><th class="num">Post-test</th><th class="num">Gain</th></tr></thead>
            <tbody>${cohort().map(l => `<tr>
              <td><div class="learner-cell"><span class="avatar">${esc(initials(l.name))}</span>${esc(l.name)}</div></td><td>${esc(l.section || '')}</td><td>${esc(l.track || '—')}</td>
              <td><select data-student="${esc(l.id)}" data-field="group" aria-label="Group for ${esc(l.name)}">${['adaptive', 'standard', ''].map(gk => `<option value="${gk}"${l.group === gk ? ' selected' : ''}>${GROUP_LABEL[gk]}</option>`).join('')}</select></td>
              <td class="num"><input type="number" min="0" max="100" step="1" data-student="${esc(l.id)}" data-field="preTest" value="${l.preTest ?? ''}" aria-label="Pre-test for ${esc(l.name)}"></td>
              <td class="num"><input type="number" min="0" max="100" step="1" data-student="${esc(l.id)}" data-field="postTest" value="${l.postTest ?? ''}" aria-label="Post-test for ${esc(l.name)}"></td>
              <td class="num">${l.preTest != null && l.postTest != null ? `${l.postTest - l.preTest >= 0 ? '+' : '−'}${Math.abs(l.postTest - l.preTest)}` : '—'}</td>
            </tr>`).join('')}</tbody></table></div>
        </details>
      </div>
      <div class="card">
        <div class="card-head">${cardTitle('chart', `${esc(C.trackLabel(learner.track))} projection for ${esc(learner.name)}`, `All ${seq.length} topics of the track’s subjects · Monte Carlo, ${sim.runs} runs per arm · starting projected score ${f1(sim.baseline)}`)}
          <div class="row no-print" style="align-items:end;flex:0 1 360px">
            <label>Study sessions<input type="number" data-bind="budget" min="10" max="150" step="1" value="${S.budget}"></label>
            <label>Runs<select data-bind="runs">${[100, 300, 1000].map(r => `<option${r === S.runs ? ' selected' : ''}>${r}</option>`).join('')}</select></label>
          </div></div>
        <div class="tiles">
          ${tile('path', `${key('--series-1')}Adaptive post-test`, f1(A.score.mean), `90% of runs ${f1(A.score.lo)}–${f1(A.score.hi)}`)}
          ${tile('book', `${key('--series-2')}Standard post-test`, f1(B.score.mean), `90% of runs ${f1(B.score.lo)}–${f1(B.score.hi)}`)}
          ${tile('chart', 'Difference', `<span class="${diff >= 0 ? 'delta-up' : 'delta-down'}">${diff >= 0 ? '▲ +' : '▼ −'}${f1(Math.abs(diff))}</span>`, 'points, adaptive minus standard')}
          ${tile('load', 'Overload sessions', `${f1(A.overload)} <span class="muted" style="font-size:1rem">vs ${f1(B.overload)}</span>`, 'predicted load ≥ 80%')}
        </div>
        <div class="stack" style="margin-top:20px;gap:24px;max-width:860px">
          <div><h3 style="margin-bottom:6px">Projected post-test after each session</h3>${legend}${V.trajectory(sim)}
            <details class="table-view"><summary>Show as table</summary><table><thead><tr><th class="num">Session</th><th class="num">Adaptive</th><th class="num">Standard</th></tr></thead><tbody>${trajRows}</tbody></table></details></div>
          <div><h3 style="margin-bottom:6px">Projected final mastery by skill</h3>${legend.replace(/class="line" /g, '')}<div class="chart-scroll">${V.skillBars(sim, seq, G.byId, E.MASTERY.mastered)}</div>
            <details class="table-view"><summary>Show as table</summary><table><thead><tr><th>Skill</th><th class="num">Adaptive</th><th class="num">Standard</th></tr></thead><tbody>${skillRows}</tbody></table></details></div>
        </div>
        <p class="note">This is a model, not evidence: learning per session scales with prerequisite readiness and is damped by predicted load.${unverified ? ` ${unverified} skills are unverified and start at the 25% prior.` : ''} Report the cohort evaluation above as your finding.</p>
      </div>`;
  }

  // Learners in the cohort comparison: everyone, or one track.
  const cohort = () => S.data.learners.filter(l => !S.cohortTrack || l.track === S.cohortTrack);

  function renderCohortStats() {
    const box = $('#cohortStats');
    if (!box) return;
    const cc = E.compareCohorts(cohort());
    const ga = cc.groups.adaptive, gs = cc.groups.standard;
    const cell = v => (Number.isFinite(v) ? f1(v) : '—');
    const ng = v => (Number.isFinite(v) ? v.toFixed(2) : '—');
    const table = `<div class="table-wrap"><table>
      <thead><tr><th>Group</th><th class="num">n</th><th class="num">Pre M (SD)</th><th class="num">Post M (SD)</th><th class="num">Gain M (SD)</th><th class="num">Normalized gain ⟨g⟩</th></tr></thead>
      <tbody>${[['Adaptive pathway', ga, '--series-1'], ['Standard sequence', gs, '--series-2']].map(([name, g, c]) => `<tr>
        <td><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(${c});margin-right:6px"></span>${name}</td>
        <td class="num">${g.n}</td><td class="num">${cell(g.pre.mean)} (${cell(g.pre.sd)})</td><td class="num">${cell(g.post.mean)} (${cell(g.post.sd)})</td>
        <td class="num">${cell(g.gain.mean)} (${cell(g.gain.sd)})</td><td class="num">${ng(g.nGain)}</td></tr>`).join('')}</tbody></table></div>`;
    if (!cc.ready) {
      box.innerHTML = table + '<p class="note">Statistics need at least two students with both scores in each group.</p>';
      return;
    }
    const t = cc.gain;
    const preWarn = cc.pretest.p < 0.05
      ? `<b>Groups differed at pre-test</b> (p = ${fmtP(cc.pretest.p)}); consider ANCOVA with pre-test as covariate.`
      : `Pre-test means did not differ significantly (p = ${fmtP(cc.pretest.p)}), consistent with comparable groups at baseline.`;
    box.innerHTML = table + `
      <div class="tiles" style="margin:16px 0">
        ${tile('chart', 'Difference in mean gain', `<span class="${t.diff >= 0 ? 'delta-up' : 'delta-down'}">${t.diff >= 0 ? '▲ +' : '▼ −'}${f1(Math.abs(t.diff))}</span>`, `95% CI ${f1(t.ci[0])} to ${f1(t.ci[1])} points`)}
        ${tile('target', 'Welch’s t-test on gains', `<span class="num" style="font-size:1.25rem">t(${f1(t.df)}) = ${t.t.toFixed(2)}</span>`, `p = ${fmtP(t.p)} · ${t.p < 0.05 ? 'significant' : 'not significant'} at α = .05`)}
        ${tile('star', 'Effect size (Hedges’ g)', cc.g.toFixed(2), `${E.effectLabel(cc.g)} effect`)}
      </div>
      ${V.gainStrip(cc.groups)}
      <p class="note">Adaptive students gained ${f1(Math.abs(t.diff))} points ${t.diff >= 0 ? 'more' : 'less'} on average than standard-sequence students (Welch t(${f1(t.df)}) = ${t.t.toFixed(2)}, p = ${fmtP(t.p)}, g = ${cc.g.toFixed(2)}). ${preWarn}${ga.n + gs.n < 30 ? ` With ${ga.n + gs.n} students the estimate is imprecise; report the confidence interval alongside p.` : ''}</p>`;
  }

  async function updateStudentField(el) {
    const l = S.data.learners.find(x => x.id === el.dataset.student);
    if (!l) return;
    const field = el.dataset.field;
    let value = el.value;
    if (field === 'track' && !value) { render(); return; }
    if (field !== 'group' && field !== 'track') value = value === '' ? null : Math.max(0, Math.min(100, Math.round(Number(value))));
    const ok = await run(() => api.patch(`/api/students/${encodeURIComponent(l.id)}`, { [field]: value }));
    if (!ok) { render(); return; }
    l[field] = value;
    if (field === 'track') { rev++; render(); toast(`${l.name} is now on the ${value} track`); return; }
    rev++;
    if (S.tab === 'outcomes') renderCohortStats();
    toast('Saved');
  }

  // ------------------------------------------------------------ exports
  function attemptsCsv() {
    const names = {};
    S.data.learners.forEach(l => { names[l.id] = l.name; });
    const esc2 = v => (v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    // answers_in_order: 1 right, 0 wrong, H/h after a hint, R/r rapid guess; empty when only totals are known.
    const head = ['student', 'username', 'skill_id', 'skill', 'date', 'type', 'source', 'items_correct', 'items_total', 'time_sec', 'hints', 'effort_1_9', 'answers_in_order'];
    const user = {}; S.data.learners.forEach(l => { user[l.id] = l.username; });
    return [head.join(','), ...S.data.attempts.map(a => [names[a.learnerId], user[a.learnerId], a.skillId, G.byId[a.skillId].name, a.date, a.type, a.source,
      a.itemsCorrect, a.itemsTotal, a.timeSec, a.hints, a.effort, a.answers].map(esc2).join(','))].join('\n');
  }
  function outcomesCsv() {
    const head = ['student', 'username', 'class', 'track', 'group', 'diagnostic_done', 'pre_test', 'post_test', 'gain', 'normalized_gain'];
    return [head.join(','), ...S.data.learners.map(l => {
      const gain = l.preTest != null && l.postTest != null ? l.postTest - l.preTest : '';
      const ng = gain !== '' ? E.normalizedGain(l.preTest, l.postTest) : null;
      return [l.name, l.username, l.section, l.track, l.group, l.diagnosticDone ? 1 : 0, l.preTest ?? '', l.postTest ?? '', gain, ng == null ? '' : ng.toFixed(3)]
        .map(v => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(',');
    })].join('\n');
  }

  // ------------------------------------------------------------ events
  $('#sideNav').addEventListener('click', e => {
    if (e.target.closest('[data-action="nav-more"]')) { setMore(!S.moreOpen); return; }
    const b = e.target.closest('[data-tab]');
    if (b && !b.disabled) setTab(b.dataset.tab);
  });
  // "More" panel on phones
  function setMore(open) {
    S.moreOpen = open;
    $('#moreSheet').hidden = $('#moreBackdrop').hidden = !open;
    const more = $('#sideNav [data-action="nav-more"]');
    if (more) more.setAttribute('aria-expanded', String(open));
  }
  $('#moreSheet').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (b && !b.disabled) { S.moreOpen = false; setTab(b.dataset.tab); }
  });
  $('#moreBackdrop').addEventListener('click', () => setMore(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.moreOpen) setMore(false); });
  $('#sideUser').addEventListener('click', e => { if (e.target.closest('[data-action="logout"]')) logout(); });
  $('#mobileLogout').innerHTML = icon('logout');
  $('#mobileLogout').addEventListener('click', logout);
  $('#learnerSelect').addEventListener('change', e => {
    S.learnerId = e.target.value;
    pref('learner', S.learnerId);
    render();
  });

  panel.addEventListener('submit', async e => {
    const form = e.target;
    if (form.id === 'attemptForm') { e.preventDefault(); await submitAttempt(form); }
    if (form.id === 'passwordForm') {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(form));
      const errEl = form.querySelector('.form-error');
      if (fd.next !== fd.confirm) { errEl.textContent = 'The new passwords do not match.'; return; }
      const ok = await run(() => api.post('/api/password', { current: fd.current, next: fd.next }), errEl);
      if (!ok) return;
      const wasForced = S.user.mustChange;
      S.user.mustChange = false;
      toast('Password changed');
      if (wasForced) await enterApp(); else render();
    }
    if (form.id === 'teacherForm') {
      e.preventDefault();
      const ok = await run(() => api.post('/api/teachers', Object.fromEntries(new FormData(form))), form.querySelector('.form-error'));
      if (ok) { form.reset(); toast('Teacher account created'); }
    }
  });

  panel.addEventListener('click', async e => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const a = b.dataset.action;
    if (['choose', 'hint', 'check', 'next', 'effort', 'quit-practice', 'step-next', 'steps-all'].includes(a)) return quizAction(a, b);
    if (a.startsWith('bank-')) return bankAction(a, b);
    switch (a) {
      case 'go': setTab(b.dataset.tab); break;
      case 'logout': logout(); break;
      case 'toggle-pw': togglePw(b); break;
      case 'print': window.print(); break;
      case 'start-diagnostic': startQuiz('diagnostic'); break;
      case 'start-posttest': startQuiz('posttest'); break;
      case 'progress-open':
        S.progressId = b.dataset.id; render();
        { const d = $('#progressDetail'); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        break;
      case 'progress-close': S.progressId = ''; render(); break;
      case 'models-refit': b.disabled = true; await loadModels(true); await refresh(); toast('Models refitted'); break;
      case 'retake-posttest': {
        const l = S.data.learners.find(x => x.id === b.dataset.id);
        if (!confirm(`Let ${l.name} take the post-test again? Their earlier result stays on record.`)) return;
        if (await run(() => api.post(`/api/students/${encodeURIComponent(l.id)}/retake-posttest`))) { delete S.responses[l.id]; await refresh(); toast('Post-test reopened'); }
        break;
      }
      case 'practice': startQuiz('practice', b.dataset.skill); break;
      case 'practice-subject': {
        // One subject open at a time; tapping the open one closes it.
        const id = b.dataset.subject;
        S.practiceSubject = b.getAttribute('aria-expanded') === 'true' ? '' : id;
        render();
        const row = $(`[data-subject="${id}"]`);
        if (row && S.practiceSubject) row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        break;
      }
      case 'history-more': S.historyShown += HISTORY_PAGE; render(); break;
      case 'forecast-pick': {
        S.forecastSkill = b.dataset.skill;
        render();
        const c = $('#loadCheck');
        if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
      case 'path-all': {
        S.pathAll = !S.pathAll;
        render();
        const el = S.pathAll ? $('#pathLater') : $('[data-action="path-all"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: S.pathAll ? 'start' : 'center' });
        break;
      }
      case 'open-learner':
        S.learnerId = b.dataset.id; pref('learner', S.learnerId); setTab('pathway'); break;
      case 'export-outcomes': download('neurolearnx-outcomes.csv', outcomesCsv(), 'text/csv'); break;
      case 'delete-attempt':
        if (!confirm('Delete this attempt? Mastery will be recalculated without it.')) return;
        if (await run(() => api.del(`/api/attempts/${encodeURIComponent(b.dataset.id)}`))) { await refresh(); toast('Attempt deleted'); }
        break;
      case 'new-class':
        openDialog(`<h2>New class</h2><p class="lead">A class code is created for students to join.</p>
          <label>Class name<input name="name" required maxlength="60" placeholder="Grade 11 – ABM B"></label>`, fd => api.post('/api/classes', { name: fd.name }));
        break;
      case 'rename-class': {
        const c = S.data.classes.find(x => x.id === b.dataset.id);
        openDialog(`<h2>Rename class</h2><label>Class name<input name="name" required maxlength="60" value="${esc(c.name)}"></label>`,
          fd => api.patch(`/api/classes/${c.id}`, { name: fd.name }));
        break;
      }
      case 'add-student': {
        const c = S.data.classes.find(x => x.id === b.dataset.id);
        openDialog(`<h2>Add student to ${esc(c.name)}</h2><p class="lead">Give the student their username and temporary password. They choose a new password when they first sign in.</p>
          <label>Full name<input name="name" required maxlength="80"></label>
          <div class="row"><label>Username<input name="username" required maxlength="32" autocomplete="off"></label>
            <label>Track<select name="track" required>${trackOptions('', 'Choose a track')}</select></label></div>
          ${pwField('password', 'Temporary password (at least 6 characters)', 'new-password')}
          <label>Study group<select name="group"><option value="">Not in study</option><option value="adaptive">Adaptive</option><option value="standard">Standard</option></select></label>`,
        fd => api.post('/api/students', { ...fd, classId: c.id }));
        break;
      }
      case 'reset-password': {
        const l = S.data.learners.find(x => x.id === b.dataset.id);
        openDialog(`<h2>Reset password for ${esc(l.name)}</h2><p class="lead">The student signs in with this temporary password and must then choose a new one. Any open sessions are signed out.</p>
          ${pwField('password', 'Temporary password (at least 6 characters)', 'new-password')}`,
        fd => api.post(`/api/students/${encodeURIComponent(l.id)}/password`, { password: fd.password }));
        break;
      }
      case 'retake': {
        const l = S.data.learners.find(x => x.id === b.dataset.id);
        if (!confirm(`Let ${l.name} take the diagnostic again? Their earlier results stay in the record.`)) return;
        if (await run(() => api.post(`/api/students/${encodeURIComponent(l.id)}/retake-diagnostic`))) { await refresh(); toast('Diagnostic reopened'); }
        break;
      }
      case 'remove-student': {
        const l = S.data.learners.find(x => x.id === b.dataset.id);
        if (!confirm(`Permanently remove ${l.name} and all of their results? This cannot be undone.`)) return;
        if (await run(() => api.del(`/api/students/${encodeURIComponent(l.id)}`))) { await refresh(); toast('Student removed'); }
        break;
      }
      case 'copy-code':
        try { await navigator.clipboard.writeText(b.dataset.code); toast('Class code copied'); } catch (err) { toast(`Class code: ${b.dataset.code}`); }
        break;
      case 'new-code':
        if (!confirm('Make a new class code? The old code will stop working for new students.')) return;
        if (await run(() => api.post(`/api/classes/${b.dataset.id}/join-code`))) { await refresh(); toast('New class code ready'); }
        break;
      case 'randomize':
        if (!confirm('Randomly split this class into equal Adaptive and Standard groups? This replaces current group choices.')) return;
        if (await run(() => api.post(`/api/classes/${b.dataset.id}/randomize`))) { await refresh(); toast('Groups assigned'); }
        break;
    }
  });

  panel.addEventListener('change', async e => {
    const el = e.target;
    if (el.dataset.student) { await updateStudentField(el); return; }
    if (el.dataset.class) {
      if (await run(() => api.patch(`/api/classes/${el.dataset.class}`, { assessment: el.value }))) {
        await refresh(); toast(el.value === 'post' ? 'Post-test opened for the class' : 'Post-test opens as each path is completed');
      }
      return;
    }
    const bind = el.dataset.bind;
    if (!bind) return;
    if (bind === 'my-track') {
      if (!el.value) return;
      if (await run(() => api.patch('/api/student/track', { track: el.value }))) {
        S.target = '';
        await refresh();
        toast(`Your path now focuses on ${el.value}: ${subjectList(el.value)}`);
      }
      return;
    }
    if (bind === 'historySubject' || bind === 'historyType') S.historyShown = HISTORY_PAGE;
    if (bind === 'target') S.target = el.value;
    else if (bind === 'budget') S.budget = Math.max(10, Math.min(150, Math.round(Number(el.value)) || 60));
    else if (bind === 'runs') S.runs = Number(el.value);
    else S[bind] = el.value;
    render();
  });

  const menuBtn = $('#dataMenuBtn'), menu = $('#dataMenu');
  menuBtn.innerHTML = icon('data');
  const closeMenu = () => { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); };
  menuBtn.addEventListener('click', () => { menu.hidden = !menu.hidden; menuBtn.setAttribute('aria-expanded', String(!menu.hidden)); });
  document.addEventListener('click', e => { if (!e.target.closest('.menu')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  menu.addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    closeMenu();
    if (b.dataset.action === 'export-json') download(`neurolearnx-${today()}.json`, JSON.stringify({ classes: S.data.classes, learners: S.data.learners, attempts: S.data.attempts }, null, 2), 'application/json');
    if (b.dataset.action === 'export-attempts') download('neurolearnx-attempts.csv', attemptsCsv(), 'text/csv');
    if (b.dataset.action === 'export-outcomes') download('neurolearnx-outcomes.csv', outcomesCsv(), 'text/csv');
  });

  window.addEventListener('hashchange', () => {
    if (!S.user || !S.data) return;
    const id = location.hash.slice(1);
    if (id !== S.tab && openable(id) && !locked()) { S.tab = id; render(); window.scrollTo({ top: 0 }); }
  });

  V.bindTooltips(document);
  boot();
})();
