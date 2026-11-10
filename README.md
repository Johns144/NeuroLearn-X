# NeuroLearn-X

Adaptive learning pathways for Senior High School learners and their teachers. It covers the eight focus subjects of each track (STEM, HUMSS, ABM, GAS) and the Junior High School skills they build on.

```
record performance → predict cognitive load → diagnose prerequisite gaps → recommend pathway → compare outcomes
```

It runs on Node.js 22.13 or newer and uses Node's built-in SQLite and crypto modules. The only package is KaTeX, which typesets the mathematics. It is installed locally and served by the app itself, so it works without internet.

## Run it

Once, after copying the project:

```bash
npm install
```

Then:

```bash
npm start
```

Open http://localhost:3000. The first visit asks you to create the first teacher account and class. After that, teachers can create their own accounts from the sign-in page (Teacher tab → **Create a teacher account**).

To let students on the same school network connect from their own devices:

```bash
npm run start:lan
```

The server prints the address to share, for example `http://192.168.1.20:3000`. Windows may ask you to allow Node through the firewall.

### Phones, tablets and PCs

The same address works in any current browser: Chrome, Edge, Firefox or Safari on a PC or Mac, Chrome on Android, and Safari on iPhone and iPad (iOS 15 or later).

- **Phone layout.** The sidebar becomes a bottom bar. Students see all five of their tabs. Teachers see four, and the rest are under **More**.
- **During practice and tests.** The answer buttons stay above the bottom bar, and the test clock stays at the top of the screen.
- **iPhone.** Text fields use 16 px text, so the page doesn't zoom in when you tap one.
- **Touch targets.** Buttons and answer choices are at least 44 px tall on touch screens.
- **Tooltips and graph.** A tap shows a tooltip, and in the prerequisite graph a tap highlights a topic's links.
- **Install it like an app.** Android (Chrome): menu → *Install app* or *Add to Home screen*. iPhone (Safari): Share → *Add to Home Screen*. It then opens full screen with its own icon. It still needs the server, since there is no offline mode. To redraw the icons, run `node scripts/make-icons.js`.
- **Over the internet (not just the school Wi-Fi).** Serve it over HTTPS and set `SECURE_COOKIES=1`.

Other commands:

| Command | What it does |
|---|---|
| `npm test` | Engine, question-bank and end-to-end API tests |
| `npm run seed-demo` | Adds a synthetic 16-student demo class for exploring the teacher views. Sign-in details go to `data/demo-accounts.txt`. Do not use on a database you will report on. |

Settings (environment variables): `PORT` (default 3000), `HOST` (default 127.0.0.1), `NLX_DB` (default `data/neurolearnx.db`), `SECURE_COOKIES=1` when served over HTTPS, and `TEACHER_SIGNUP_CODE`. If `TEACHER_SIGNUP_CODE` is set, teachers creating their own account must enter that code. Share it only with staff, so students cannot make teacher accounts. If it is not set, teacher sign-up is open.

## Tracks and subjects

Students choose a **track** when they join: STEM, HUMSS, ABM or GAS. The app then works only with that track's eight focus subjects:

| Track | Subjects |
|---|---|
| STEM | Pre-Calculus, Basic Calculus, General Biology 1 and 2, General Chemistry 1 and 2, General Physics 1 and 2 |
| HUMSS | Creative Writing / Malikhaing Pagsulat, Creative Nonfiction, Introduction to World Religions and Belief Systems, Philippine Politics and Governance, Disciplines and Ideas in the Social Sciences (DISS), Disciplines and Ideas in the Applied Social Sciences (DIASS), Community Engagement, Solidarity and Citizenship (CESC), Trends, Networks and Critical Thinking in the 21st Century Culture |
| ABM | Business Mathematics, Organization and Management, Fundamentals of ABM 1 and 2, Applied Economics, Business Finance, Business Ethics and Social Responsibility, Principles of Marketing |
| GAS | Humanities 1: Creative Writing, Humanities 2: World Religions and Belief Systems, Social Science 1: DISS, Applied Economics, Organization and Management, Disaster Readiness and Risk Reduction, Elective 1: Business Mathematics, Elective 2: General Biology 1 |

Each subject is split into four or five topics (competencies), linked in a prerequisite graph. Quantitative topics also link to the Junior High skills they use. For example, Business Finance links to percent and ratio, and Genetics in General Biology 2 links to probability. GAS uses fixed choices for its Humanities, Social Science and Elective slots. To change any mapping, edit `TRACKS` and `SUBJECT_SKILLS` in `public/js/curriculum.js`.

What follows the track:
- the diagnostic (pre-test) and the post-test, with one set for each of the track's subjects;
- the learning path, skills, practice topics, dashboards and the outcome projection;
- the server, which refuses practice outside the track.

General Mathematics and Statistics and Probability remain in the skill graph, but no track uses them.

A student can change track on the Account page, and a teacher can change it on the Classes page. Earlier results are kept.

## Diagnostic (pre-test) and post-test

Both tests use the same format, so their scores compare directly:
- **Format.** One question on every topic of the student's 8 subjects (about 32), in one set per subject. There are no hints, and answers are shown only at the end.
- **Timing.** **30 minutes**, counted by the server. A test can be paused and resumed, but an open question counts at most 5 minutes against the clock. When time runs out, the test ends and topics not reached count as not answered.
- **Time per question.** The server records the time spent on every question. Teachers see it per student on the **Progress** page; questions that took more than twice the student's usual time are marked.
- **Foundation checks.** In the diagnostic only: when half or fewer of a subject's answers are right, up to 4 short checks on the Junior High skills behind it follow. They shape the path but are not part of the score.
- **When the post-test opens.** Once every topic of the student's path is *completed*: the student's own answers have brought it to near-mastery (BKT mastery of at least 0.80). Inferred credit, a single lucky answer and rapid guesses don't count. Forgetting afterwards doesn't undo completion; it schedules a review instead. A teacher can also open the post-test early for a whole class from the Classes page.

The **Progress** page shows, for each student and for the class:
- the diagnostic and post-test scores, the change in points and the normalized gain;
- a verdict: improved, about the same (within ±5 points, about one or two questions), or declined;
- scores by subject;
- path progress;
- a paired t-test over everyone with both scores.

Students see the same comparison on their dashboard once they finish the post-test.

## Models and how they are checked

**Mastery (Bayesian Knowledge Tracing) with forgetting.**
- **Updates.** Each answer updates the probability that the student knows the topic. The parameters are: already known (pInit), learning from a question (pLearn), slip (pSlip), guess (pGuess) and forgetting (pForget).
- **Forgetting.** Between practice days, the learned part of mastery fades toward the prior. Each separate day the topic was practised divides the daily rate, so spaced practice is remembered longer than the same practice crammed into one day.

**Fitting BKT on your students.**
- **How.** The parameters are fitted by maximum likelihood on every student's answers in the school, then checked with 5-fold cross-validation by student: each student's answers are predicted one at a time by a model fitted without them.
- **What's compared.** The fitted model, the default parameters, and a baseline that uses the student's percent correct on that topic so far. Each is scored by **AUC** and log loss.
- **When fitted values are used.** Only when they beat the defaults on held-out students. Fitting starts at 200 answers from 8 students; until then the defaults are used.
- **Data.** Fitting uses the same per-set answer counts the app traces mastery from. Individual parameters are recovered only approximately, but prediction is what the check measures.

On simulated data with known parameters (4,208 answers, 60 students), the cross-validated results were:

| Model | AUC | Log loss |
|---|---|---|
| Fitted BKT | 0.793 | 0.515 |
| BKT with default parameters | 0.778 | 0.557 |
| Percent-correct baseline | 0.743 | 0.599 |

**Cognitive load.**
- **How it's fitted.** The logistic load model is re-fitted on students' 1–9 effort ratings.
- **How it's checked.** By 5-fold cross-validation by student, using **MAE** on ratings the model never saw, compared with the starting weights and a constant guess (the average rating).
- **When it runs.** Cross-validation starts at 24 ratings.

**Rapid guessing.**
- **What's flagged.** Answers given in under **3 seconds**: in practice, the diagnostic and the post-test.
- **Effect on mastery.** They don't count as evidence of mastery. They still count in test scores, so pre and post stay comparable.
- **Feedback.** Students get one gentle reminder per test, and a tutor note in practice.
- **What teachers see.** Rapid guesses are marked in the time-per-question tables, and a student with more than 15% rapid guesses is flagged on the Progress page.

**Spaced review.**
- **When a review is due.** A completed topic falls due again when its predicted recall drops below 0.80. Each review on a new day makes the next interval longer.
- **On the path.** Due topics appear as short "Review" steps at the start of the adaptive path (lowest recall first), and on the student's Home and Practice pages with the next upcoming reviews. The standard (control) group keeps the fixed course order without adaptive reviews.

Teachers see all of this on the **Model check** page. Models are refitted at most once a minute as new answers arrive, or straight away with **Refit now**.

## Question bank

Every topic comes with a starter bank, and teachers manage it under **Question bank**:
- **Calculation topics** (Pre-Calculus, Basic Calculus, chemistry and physics problems, accounting, finance, economics, Business Mathematics) are *generated*. Each student gets fresh numbers, and every wrong option comes from a specific mistake.
- **Concept topics** (biology, the HUMSS subjects, Organization and Management, ethics, marketing, DRRR) have a curated pool of five or more questions. Each wrong option has its own explanation.

Teachers can:
- edit any built-in question, and restore the original later;
- hide a question;
- add their own questions, with a live KaTeX preview.

Teacher-added questions need three wrong options, each with its "why it is wrong" feedback, plus a worked solution with one step per line. The server checks that the math renders before saving. Curated topics must keep at least two active questions.

The bank is shared by the whole school, and changes apply to new sets right away. In generated topics, teacher questions are mixed in for up to half of a set.

The starter content follows the DepEd curriculum guides, but it is a starting point. Have subject teachers review it before a study.

## Explainable AI and tutoring

- **Why this step?** Every step on a learning path has an explanation panel, in student wording or teacher wording. It shows:
  - the evidence: mastery, and how many answers it rests on;
  - why the step sits where it does: the prerequisite it waits for, or the first topic it unblocks;
  - why it gets its format;
  - the factors pushing its predicted load up. These are the load model's own additive terms, shown as shares.
  - a what-if: "If you master *Factoring* first, this step's predicted effort drops from 78% to 52%".

  A "How your path was built" summary compares the path with the standard sequence. Everything comes from the same numbers that produced the path (`engine.explainPathway`), so the explanation cannot drift from the recommendation.
- **Tutoring on practice questions.** After each answer the student sees:
  - why their choice is wrong. Every wrong option is generated from a specific misconception, which comes with its own explanation.
  - a worked solution revealed one step at a time ("Walk me through it").
  - the key idea of the skill.
  - a personal tutor note based on their mastery and their answers so far in the set. For example, after two misses in a row it opens the full solution; if a prerequisite is weak, it names it. At the end of the set, the tutor summarises the misconceptions and suggests the prerequisite to practise next.
- The diagnostic shows the solution steps but no tutor notes. The class pre/post-test shows no answers until it is finished.
- All maths in questions, choices, hints and solutions is LaTeX rendered with KaTeX. Every generated item is checked by the test suite to typeset without errors.

## How people use it

**Teacher**
1. Create your account: on first run through setup, afterwards with **Create a teacher account** on the sign-in page, or ask a colleague (Account → Add a teacher account).
2. Share your class code (Classes page). Students create their own accounts with it. You can also add students yourself with a temporary password.
3. Optionally assign study groups, using **Randomly assign study groups** for a fair comparison.
4. Watch the **Progress** page. Each student's diagnostic is their pre-test, and their post-test opens when their path is complete. You can also open it early for the class on the Classes page. Because each track's test is different, the Outcomes page can compare study groups within one track.
5. Follow each student through the analysis chain: Performance, Cognitive load, Skill gaps, Pathways, Outcomes. Paper quizzes can be entered on the Performance page.
6. Review and extend the questions on the **Question bank** page.

**Student**
1. Join with the class code, or sign in with the account your teacher made (you set your own password on first sign-in).
2. **The diagnostic runs first.** It is a 30-minute pre-test with one question per topic (see above). After each subject, the student rates how hard they had to think (1–9).
3. The results page shows their starting point. Their dashboard and learning path are then built from it.
4. Practice sets (5 questions with hints and worked answers) update mastery and the path immediately. The dashboard shows path progress toward the post-test (a topic is complete at 80% mastery) and any topics due for review.
5. When every topic is complete, the post-test unlocks. Afterwards the dashboard compares it with the diagnostic, subject by subject.

## Project layout

| Path | Role |
|---|---|
| `server/server.js` | Entry point |
| `server/app.js` | HTTP API, access control, static files, security headers |
| `server/auth.js` | scrypt password hashing, sessions, login throttling, class codes |
| `server/db.js` | SQLite schema: users, classes, attempts, the question-bank edits (`item_bank`), pre/post scores (`test_results`) and the time on every answer (`responses`) |
| `server/assess.js` | Engine for the timed diagnostic and post-test, and for practice. It turns each finished set into one attempt record per topic and each answer into a timed response. |
| `server/questions.js` | Question bank core: builds 4-option items in LaTeX, with a hint, step-by-step solution, key idea and a misconception for every wrong option; applies teacher edits; validates teacher questions |
| `server/questions-tracks.js`, `bank-science.js`, `bank-humss.js`, `bank-abm.js` | Generators and curated pools for every track subject |
| `public/js/mathtext.js` | Renders text with `\( … \)` maths through KaTeX, with a plain-text fallback |
| `public/js/engine.js` | The analytics chain (BKT mastery, load model, gap diagnosis, pathway, simulation, statistics). It is shared by the browser and the server. |
| `public/js/curriculum.js` | Tracks, subjects, skill graph and each track's standard sequence |
| `public/js/app.js` | Student and teacher interface |
| `scripts/` | Demo-class generator and seed script |
| `tests/` | `engine`, `questions` and `server` test suites |

## How each stage works

1. **Record performance.** Every finished diagnostic, practice or test set is stored as an attempt: items correct out of total, rapid guesses, time measured by the server (capped at 10 minutes per item), hints used, and the 1–9 effort rating. Mastery comes from Bayesian Knowledge Tracing with forgetting, fitted on your students (see *Models and how they are checked*).
2. **Predict cognitive load.** A logistic model combines skill difficulty, time against the expected time, error rate, hint use and prerequisite shortfall. It is re-fitted to every effort rating in the school once there are 12 or more, and cross-validated once there are 24.
3. **Diagnose gaps.** The engine walks back through the prerequisite graph from each target skill. A *root gap* has no weak skill beneath it. The Skill gaps page draws the graph with one lane per subject (Junior High foundations on top) and topics left to right in prerequisite order, so every link points forward. Pointing at a topic highlights what it needs and what it unlocks.
4. **Recommend a pathway.** Prerequisites come first, each remediation is placed just before the first topic that needs it, and the format follows the load forecast. Students in the **standard** group get the course in its fixed order instead. That is the control condition.
5. **Compare outcomes.** Pre- and post-test scores by group give normalized gain, Welch's t-test with a 95% CI, Hedges' g, and a baseline check. A per-student simulation is also available, labelled as a model.

## Security and privacy

- Passwords are hashed with scrypt and a per-user salt. Sessions are random tokens in HttpOnly, SameSite cookies, and only a hash of each token is stored. Sessions last 12 hours.
- Five wrong passwords lock that username for 5 minutes from that address.
- Teachers only see students in their own classes. Students only see their own records. Question answers never leave the server until the student answers.
- State-changing requests require a custom header, which blocks cross-site form attacks. Responses carry a strict Content-Security-Policy.
- Learner records are personal data under the Data Privacy Act of 2012 (RA 10173). Get consent, keep the server on school premises or a trusted host, and serve it over HTTPS if it is reachable beyond the school network.
- **Back up** by copying `data/neurolearnx.db` while the server is stopped. To start completely fresh, stop the server and delete the `data` folder.

## Before a real study

- Have the subject teachers of each track review the starter questions, the prerequisite links and the difficulty values, and map topics to the official DepEd MELC codes.
- Compare study groups within one track, or make sure each track has students in both groups: each track's pre/post-test covers different subjects.
- BKT is fitted on your own students once there are enough answers. Check the **Model check** page: the fitted model should beat the percent-correct baseline on AUC, and the load model's cross-validated MAE should beat the constant guess. If they don't, report that rather than the model's predictions. The thresholds (0.80 to complete a topic, 3 seconds for a rapid guess) are design choices; state them in your methods.
- With one or two sections, report confidence intervals and effect sizes, not only p-values. If pre-test means differ between groups, use ANCOVA.
