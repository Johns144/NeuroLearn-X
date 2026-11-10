/*
 * NeuroLearn-X — curriculum knowledge graph.
 *
 * Senior High School mathematics subjects, the Junior High School
 * competencies they build on, and which subjects each track takes. Each
 * skill lists its direct prerequisites, so the whole set forms one directed
 * acyclic graph that the engine walks to diagnose gaps and to order pathways.
 *
 *   SUBJECTS  each with its fixed teaching sequence
 *   TRACKS    STEM, ABM, HUMSS, GAS, and the subjects each one takes
 *             (DepEd SHS: two core math subjects for everyone, plus the
 *             track's specialized math subjects). Edit TRACKS to change this.
 *
 *   difficulty  intrinsic complexity 0..1 (element interactivity), feeds the
 *               cognitive load model
 *   minutes     typical length of one instructional session on the skill
 *   secPerItem  expected seconds per assessment item, used to judge time on task
 *
 * Map these to the official DepEd MELC codes for your school year before use.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NLX = Object.assign(root.NLX || {}, { curriculum: api });
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SUBJECT = 'Senior High School';

  const SKILLS = [
    // Junior High School foundations
    { id: 'J1', level: 'JHS', grade: 7, name: 'Operations on real numbers and fractions', prereqs: [], difficulty: 0.2, minutes: 30, secPerItem: 45 },
    { id: 'J2', level: 'JHS', grade: 7, name: 'Percent, ratio and proportion', prereqs: ['J1'], difficulty: 0.25, minutes: 30, secPerItem: 60 },
    { id: 'J3', level: 'JHS', grade: 8, name: 'Laws of exponents', prereqs: ['J1'], difficulty: 0.3, minutes: 30, secPerItem: 50 },
    { id: 'J4', level: 'JHS', grade: 8, name: 'Algebraic expressions and polynomials', prereqs: ['J1'], difficulty: 0.35, minutes: 35, secPerItem: 60 },
    { id: 'J5', level: 'JHS', grade: 8, name: 'Factoring polynomials', prereqs: ['J4'], difficulty: 0.45, minutes: 40, secPerItem: 75 },
    { id: 'J6', level: 'JHS', grade: 8, name: 'Rational algebraic expressions', prereqs: ['J5'], difficulty: 0.5, minutes: 40, secPerItem: 90 },
    { id: 'J7', level: 'JHS', grade: 8, name: 'Linear equations and inequalities', prereqs: ['J4'], difficulty: 0.35, minutes: 35, secPerItem: 60 },
    { id: 'J8', level: 'JHS', grade: 8, name: 'Relations and functions (introduction)', prereqs: ['J7'], difficulty: 0.4, minutes: 35, secPerItem: 60 },
    { id: 'J9', level: 'JHS', grade: 9, name: 'Quadratic equations', prereqs: ['J5'], difficulty: 0.5, minutes: 40, secPerItem: 90 },
    { id: 'J10', level: 'JHS', grade: 10, name: 'Probability of simple events', prereqs: ['J1'], difficulty: 0.3, minutes: 30, secPerItem: 60 },
    { id: 'J11', level: 'JHS', grade: 7, name: 'Mean, median and spread of data', prereqs: ['J1'], difficulty: 0.35, minutes: 35, secPerItem: 75 },

    // Senior High School — General Mathematics (core, all tracks)
    { id: 'GM1', level: 'SHS', grade: 11, name: 'Functions as models and their representations', prereqs: ['J8'], difficulty: 0.45, minutes: 45, secPerItem: 75 },
    { id: 'GM2', level: 'SHS', grade: 11, name: 'Evaluating functions', prereqs: ['GM1', 'J4'], difficulty: 0.35, minutes: 40, secPerItem: 60 },
    { id: 'GM3', level: 'SHS', grade: 11, name: 'Operations on functions', prereqs: ['GM2', 'J6'], difficulty: 0.55, minutes: 45, secPerItem: 90 },
    { id: 'GM4', level: 'SHS', grade: 11, name: 'Composition of functions', prereqs: ['GM3'], difficulty: 0.6, minutes: 45, secPerItem: 90 },
    { id: 'GM5', level: 'SHS', grade: 11, name: 'Rational functions, equations and inequalities', prereqs: ['GM2', 'J6', 'J9'], difficulty: 0.7, minutes: 50, secPerItem: 120 },
    { id: 'GM6', level: 'SHS', grade: 11, name: 'Inverse functions', prereqs: ['GM4'], difficulty: 0.65, minutes: 45, secPerItem: 100 },
    { id: 'GM7', level: 'SHS', grade: 11, name: 'Exponential functions, equations and inequalities', prereqs: ['GM2', 'J3'], difficulty: 0.65, minutes: 50, secPerItem: 100 },
    { id: 'GM8', level: 'SHS', grade: 11, name: 'Logarithmic functions, equations and inequalities', prereqs: ['GM6', 'GM7'], difficulty: 0.75, minutes: 50, secPerItem: 120 },
    { id: 'GM9', level: 'SHS', grade: 11, name: 'Simple and compound interest', prereqs: ['GM7', 'J2'], difficulty: 0.55, minutes: 45, secPerItem: 120 },
    { id: 'GM10', level: 'SHS', grade: 11, name: 'Simple and general annuities', prereqs: ['GM9'], difficulty: 0.7, minutes: 50, secPerItem: 150 },

    // Statistics and Probability (core, all tracks)
    { id: 'SP1', level: 'SHS', grade: 11, name: 'Random variables and probability distributions', prereqs: ['J10'], difficulty: 0.45, minutes: 45, secPerItem: 75 },
    { id: 'SP2', level: 'SHS', grade: 11, name: 'Mean and variance of a discrete random variable', prereqs: ['SP1', 'J11'], difficulty: 0.55, minutes: 45, secPerItem: 100 },
    { id: 'SP3', level: 'SHS', grade: 11, name: 'Normal distribution and z-scores', prereqs: ['J11'], difficulty: 0.5, minutes: 45, secPerItem: 90 },
    { id: 'SP4', level: 'SHS', grade: 11, name: 'Sampling distribution of the sample mean', prereqs: ['SP3'], difficulty: 0.6, minutes: 45, secPerItem: 100 },
    { id: 'SP5', level: 'SHS', grade: 11, name: 'Confidence intervals for the population mean', prereqs: ['SP4'], difficulty: 0.65, minutes: 50, secPerItem: 120 },

    // Pre-Calculus (STEM)
    { id: 'PC1', level: 'SHS', grade: 11, name: 'Circles and their equations', prereqs: ['J9'], difficulty: 0.5, minutes: 45, secPerItem: 90 },
    { id: 'PC2', level: 'SHS', grade: 11, name: 'Arithmetic and geometric sequences and series', prereqs: ['J1', 'J3'], difficulty: 0.5, minutes: 45, secPerItem: 90 },
    { id: 'PC3', level: 'SHS', grade: 11, name: 'Angles in degrees and radians', prereqs: ['J1'], difficulty: 0.4, minutes: 40, secPerItem: 60 },
    { id: 'PC4', level: 'SHS', grade: 11, name: 'Trigonometric values of special angles', prereqs: ['PC3'], difficulty: 0.55, minutes: 45, secPerItem: 75 },
    { id: 'PC5', level: 'SHS', grade: 11, name: 'Fundamental trigonometric identities', prereqs: ['PC4', 'J6'], difficulty: 0.65, minutes: 50, secPerItem: 100 },

    // Basic Calculus (STEM)
    { id: 'BC1', level: 'SHS', grade: 11, name: 'Limits of algebraic functions', prereqs: ['J8', 'J6'], difficulty: 0.6, minutes: 50, secPerItem: 100 },
    { id: 'BC2', level: 'SHS', grade: 11, name: 'Derivatives by the power rule', prereqs: ['BC1', 'J3'], difficulty: 0.55, minutes: 45, secPerItem: 75 },
    { id: 'BC3', level: 'SHS', grade: 11, name: 'Product and chain rules', prereqs: ['BC2'], difficulty: 0.7, minutes: 50, secPerItem: 120 },
    { id: 'BC4', level: 'SHS', grade: 11, name: 'Antiderivatives (indefinite integrals)', prereqs: ['BC2'], difficulty: 0.65, minutes: 50, secPerItem: 100 },

    // Business Mathematics (ABM)
    { id: 'BM1', level: 'SHS', grade: 11, name: 'Fractions, decimals and percent in business', prereqs: ['J1', 'J2'], difficulty: 0.3, minutes: 35, secPerItem: 60 },
    { id: 'BM2', level: 'SHS', grade: 11, name: 'Markup, markdown and profit', prereqs: ['BM1'], difficulty: 0.45, minutes: 40, secPerItem: 90 },
    { id: 'BM3', level: 'SHS', grade: 11, name: 'Commissions', prereqs: ['BM1'], difficulty: 0.4, minutes: 40, secPerItem: 90 },
    { id: 'BM4', level: 'SHS', grade: 11, name: 'Salaries, wages and overtime pay', prereqs: ['BM1'], difficulty: 0.45, minutes: 40, secPerItem: 100 }
  ];

  // Track subjects outside mathematics. Each competency is
  // [id, name, short label, prerequisites, difficulty].
  const SUBJECT_SKILLS = {
    BIO1: [['BIOA1', 'Cell theory and cell structure', 'Cells', [], 0.4], ['BIOA2', 'Cell cycle: mitosis and meiosis', 'Cell division', ['BIOA1'], 0.5],
      ['BIOA3', 'Biomolecules and enzymes', 'Biomolecules', [], 0.45], ['BIOA4', 'Photosynthesis and cellular respiration', 'Bioenergetics', ['BIOA1', 'BIOA3'], 0.55]],
    BIO2: [['BIOB1', 'Mendelian genetics', 'Genetics', ['BIOA2', 'J10'], 0.5], ['BIOB2', 'DNA, RNA and protein synthesis', 'DNA & RNA', ['BIOA3'], 0.55],
      ['BIOB3', 'Evolution and natural selection', 'Evolution', ['BIOB1'], 0.45], ['BIOB4', 'Systematics and taxonomy', 'Taxonomy', ['BIOB3'], 0.4]],
    CHEM1: [['CHA1', 'Matter and measurement', 'Matter', ['J2', 'J3'], 0.4], ['CHA2', 'Atomic structure', 'Atoms', [], 0.45],
      ['CHA3', 'The mole and molar mass', 'Moles', ['CHA2', 'J3'], 0.55], ['CHA4', 'Stoichiometry and gas laws', 'Stoich & gases', ['CHA3', 'J7'], 0.65]],
    CHEM2: [['CHB1', 'Intermolecular forces', 'IMF', ['CHA2'], 0.5], ['CHB2', 'Solutions and concentration', 'Solutions', ['CHA3'], 0.55],
      ['CHB3', 'Chemical kinetics and equilibrium', 'Kinetics', ['CHB2'], 0.55], ['CHB4', 'Acids, bases and pH', 'pH', ['CHB2', 'J3'], 0.55]],
    PHYS1: [['PHA1', 'Units and vectors', 'Vectors', ['J1'], 0.4], ['PHA2', 'Kinematics in one dimension', 'Kinematics', ['PHA1', 'J7'], 0.5],
      ['PHA3', 'Newton’s laws of motion', 'Newton’s laws', ['PHA2'], 0.5], ['PHA4', 'Work, energy and momentum', 'Energy', ['PHA3'], 0.55]],
    PHYS2: [['PHB1', 'Electric charge and Coulomb’s law', 'Electrostatics', ['PHA3', 'J3'], 0.55], ['PHB2', 'Electric circuits and Ohm’s law', 'Circuits', ['PHB1', 'J7'], 0.55],
      ['PHB3', 'Magnetism and electromagnetic induction', 'Magnetism', ['PHB2'], 0.5], ['PHB4', 'Waves, light and optics', 'Waves', ['PHA2'], 0.5]],
    CW: [['CW1', 'Imagery and figurative language', 'Figurative lang.', [], 0.35], ['CW2', 'Poetry: elements and forms', 'Poetry', ['CW1'], 0.4],
      ['CW3', 'Fiction: elements of the short story', 'Fiction', [], 0.4], ['CW4', 'Drama: elements of the play', 'Drama', ['CW3'], 0.4]],
    CNF: [['CNF1', 'The nature of creative nonfiction', 'Nature of CNF', [], 0.35], ['CNF2', 'Forms of creative nonfiction', 'CNF forms', ['CNF1'], 0.4],
      ['CNF3', 'Literary techniques in nonfiction', 'Techniques', ['CNF1'], 0.45], ['CNF4', 'Ethics and critical reading of nonfiction', 'Ethics', ['CNF2'], 0.45]],
    IWRBS: [['WR1', 'Religion, spirituality and belief systems', 'Belief systems', [], 0.35], ['WR2', 'Judaism and Christianity', 'Judaism & Christianity', ['WR1'], 0.4],
      ['WR3', 'Islam', 'Islam', ['WR1'], 0.4], ['WR4', 'Hinduism, Buddhism and East Asian religions', 'Asian religions', ['WR1'], 0.45]],
    PPG: [['PPG1', 'Politics, power and ideologies', 'Politics & power', [], 0.4], ['PPG2', 'The 1987 Constitution and the branches of government', 'Branches', ['PPG1'], 0.45],
      ['PPG3', 'Elections and political parties', 'Elections', ['PPG2'], 0.4], ['PPG4', 'Local government and civil society', 'Local gov’t', ['PPG2'], 0.45]],
    DISS: [['DSS1', 'The social sciences and their disciplines', 'Disciplines', [], 0.35], ['DSS2', 'Structural-functionalism, Marxism and symbolic interactionism', 'Classic theories', ['DSS1'], 0.5],
      ['DSS3', 'Psychoanalysis, rational choice, institutionalism and feminism', 'More theories', ['DSS2'], 0.55], ['DSS4', 'Filipino thinkers in the social sciences', 'Filipino thought', ['DSS1'], 0.45]],
    DIASS: [['DAS1', 'The applied social sciences', 'Applied SS', ['DSS1'], 0.35], ['DAS2', 'Counseling', 'Counseling', ['DAS1'], 0.4],
      ['DAS3', 'Social work', 'Social work', ['DAS1'], 0.4], ['DAS4', 'Communication', 'Communication', ['DAS1'], 0.4]],
    CESC: [['CES1', 'Community: concepts and perspectives', 'Community', [], 0.35], ['CES2', 'Community engagement and action', 'Engagement', ['CES1'], 0.4],
      ['CES3', 'Solidarity and citizenship', 'Citizenship', ['CES1'], 0.4], ['CES4', 'Human rights and social justice', 'Human rights', ['CES3'], 0.45]],
    TNCT: [['TNC1', 'Trends, fads and megatrends', 'Trends', [], 0.35], ['TNC2', 'Strategic analysis and intuitive thinking', 'Thinking', ['TNC1'], 0.45],
      ['TNC3', 'Neural, social and ICT networks', 'Networks', [], 0.4], ['TNC4', 'Global issues and planetary citizenship', 'Global issues', ['TNC3'], 0.45]],
    OM: [['OM1', 'Management: nature and functions', 'Functions', [], 0.35], ['OM2', 'The firm and its environment', 'Environment', ['OM1'], 0.4],
      ['OM3', 'Planning and organizing', 'Planning', ['OM1'], 0.45], ['OM4', 'Staffing, leading and controlling', 'Leading', ['OM3'], 0.45]],
    FABM1: [['FA1', 'Accounting concepts and users', 'Accounting basics', [], 0.35], ['FA2', 'The accounting equation', 'Acct. equation', ['FA1', 'J1'], 0.45],
      ['FA3', 'Accounts and normal balances', 'Accounts', ['FA2'], 0.45], ['FA4', 'Journalizing and the accounting cycle', 'Accounting cycle', ['FA3'], 0.5]],
    FABM2: [['FB1', 'Statement of financial position', 'Balance sheet', ['FA4'], 0.5], ['FB2', 'Statement of comprehensive income', 'Income statement', ['FA4'], 0.5],
      ['FB3', 'Cash flows and financial ratios', 'Cash flow & ratios', ['FB1', 'FB2', 'J2'], 0.55], ['FB4', 'Taxes and bank reconciliation', 'Taxes & bank rec.', ['FB2', 'J2'], 0.55]],
    AE: [['AE1', 'Scarcity, choice and opportunity cost', 'Scarcity', [], 0.35], ['AE2', 'Demand, supply and market equilibrium', 'Supply & demand', ['AE1', 'J7'], 0.5],
      ['AE3', 'Elasticity and market structures', 'Markets', ['AE2'], 0.55], ['AE4', 'Contemporary Philippine economic issues', 'PH economy', ['AE1', 'J2'], 0.5]],
    BF: [['BF1', 'The role of finance and financial institutions', 'Finance basics', [], 0.4], ['BF2', 'Financial planning and budgeting', 'Budgeting', ['BF1', 'J1'], 0.5],
      ['BF3', 'Time value of money', 'Time value', ['BF1', 'J2'], 0.55], ['BF4', 'Sources of financing; risk and return', 'Financing', ['BF1'], 0.45]],
    BESR: [['BE1', 'Ethics: concepts and theories', 'Ethical theories', [], 0.4], ['BE2', 'Business ethics and stakeholders', 'Stakeholders', ['BE1'], 0.4],
      ['BE3', 'Corporate social responsibility', 'CSR', ['BE2'], 0.4], ['BE4', 'Ethical issues and Filipino values in business', 'Issues & values', ['BE2'], 0.45]],
    MKT: [['MK1', 'Marketing concepts', 'Marketing basics', [], 0.35], ['MK2', 'The marketing mix', '4Ps', ['MK1'], 0.4],
      ['MK3', 'Segmentation, targeting and positioning', 'STP', ['MK1'], 0.45], ['MK4', 'Marketing research and promotion', 'Research & promo', ['MK2'], 0.45]],
    DRRR: [['DR1', 'Disaster, hazard, exposure, vulnerability and risk', 'Risk concepts', [], 0.35], ['DR2', 'Earthquake and volcanic hazards', 'Geologic hazards', ['DR1'], 0.4],
      ['DR3', 'Hydrometeorological hazards', 'Typhoons & floods', ['DR1'], 0.4], ['DR4', 'Fire hazards and the DRRM law', 'Fire & DRRM law', ['DR1'], 0.4]]
  };
  const SHORT_EXTRA = {};
  Object.values(SUBJECT_SKILLS).flat().forEach(([id, name, short, prereqs, difficulty]) => {
    SKILLS.push({ id, level: 'SHS', grade: 11, name, prereqs, difficulty, minutes: 40, secPerItem: 50 });
    SHORT_EXTRA[id] = short;
  });

  // Compact labels for graph nodes and chart axes.
  const SHORT = {
    J1: 'Real numbers', J2: 'Percent & ratio', J3: 'Exponent laws', J4: 'Polynomials', J5: 'Factoring',
    J6: 'Rational expr.', J7: 'Linear eq.', J8: 'Functions intro', J9: 'Quadratics', J10: 'Probability', J11: 'Data & averages',
    GM1: 'Functions', GM2: 'Evaluating', GM3: 'Operations', GM4: 'Composition', GM5: 'Rational fns',
    GM6: 'Inverse fns', GM7: 'Exponential', GM8: 'Logarithmic', GM9: 'Interest', GM10: 'Annuities',
    SP1: 'Distributions', SP2: 'Mean of X', SP3: 'z-scores', SP4: 'Sampling', SP5: 'Confidence int.',
    PC1: 'Circles', PC2: 'Series', PC3: 'Radians', PC4: 'Trig values', PC5: 'Identities',
    BC1: 'Limits', BC2: 'Power rule', BC3: 'Product & chain', BC4: 'Antiderivatives',
    BM1: 'Business %', BM2: 'Markup', BM3: 'Commission', BM4: 'Wages',
    ...SHORT_EXTRA
  };
  const subject = (id, name, short, area, sequence) => ({ id, name, short, area, sequence });
  const seqOf = code => SUBJECT_SKILLS[code].map(s => s[0]);
  const SUBJECTS = {
    // General Mathematics and Statistics are kept in the graph for reuse, but no track takes them.
    GM: subject('GM', 'General Mathematics', 'General Math', 'Mathematics', ['GM1', 'GM2', 'GM3', 'GM4', 'GM5', 'GM6', 'GM7', 'GM8', 'GM9', 'GM10']),
    SP: subject('SP', 'Statistics and Probability', 'Statistics', 'Mathematics', ['SP1', 'SP2', 'SP3', 'SP4', 'SP5']),
    PC: subject('PC', 'Pre-Calculus', 'Pre-Calculus', 'Mathematics', ['PC1', 'PC2', 'PC3', 'PC4', 'PC5']),
    BC: subject('BC', 'Basic Calculus', 'Basic Calculus', 'Mathematics', ['BC1', 'BC2', 'BC3', 'BC4']),
    BIO1: subject('BIO1', 'General Biology 1', 'Gen Bio 1', 'Science', seqOf('BIO1')),
    BIO2: subject('BIO2', 'General Biology 2', 'Gen Bio 2', 'Science', seqOf('BIO2')),
    CHEM1: subject('CHEM1', 'General Chemistry 1', 'Gen Chem 1', 'Science', seqOf('CHEM1')),
    CHEM2: subject('CHEM2', 'General Chemistry 2', 'Gen Chem 2', 'Science', seqOf('CHEM2')),
    PHYS1: subject('PHYS1', 'General Physics 1', 'Gen Physics 1', 'Science', seqOf('PHYS1')),
    PHYS2: subject('PHYS2', 'General Physics 2', 'Gen Physics 2', 'Science', seqOf('PHYS2')),
    CW: subject('CW', 'Creative Writing / Malikhaing Pagsulat', 'Creative Writing', 'Humanities', seqOf('CW')),
    CNF: subject('CNF', 'Creative Nonfiction', 'Creative Nonfiction', 'Humanities', seqOf('CNF')),
    IWRBS: subject('IWRBS', 'Introduction to World Religions and Belief Systems', 'World Religions', 'Humanities', seqOf('IWRBS')),
    PPG: subject('PPG', 'Philippine Politics and Governance', 'Politics & Gov’t', 'Social Science', seqOf('PPG')),
    DISS: subject('DISS', 'Disciplines and Ideas in the Social Sciences', 'Social Sciences', 'Social Science', seqOf('DISS')),
    DIASS: subject('DIASS', 'Disciplines and Ideas in the Applied Social Sciences', 'Applied Social Sci.', 'Social Science', seqOf('DIASS')),
    CESC: subject('CESC', 'Community Engagement, Solidarity, and Citizenship', 'Community Engagement', 'Social Science', seqOf('CESC')),
    TNCT: subject('TNCT', 'Trends, Networks, and Critical Thinking in the 21st Century Culture', 'Trends & Networks', 'Social Science', seqOf('TNCT')),
    BM: subject('BM', 'Business Mathematics', 'Business Math', 'Business', ['BM1', 'BM2', 'BM3', 'BM4']),
    OM: subject('OM', 'Organization and Management', 'Org & Management', 'Business', seqOf('OM')),
    FABM1: subject('FABM1', 'Fundamentals of Accountancy, Business and Management 1', 'FABM 1', 'Business', seqOf('FABM1')),
    FABM2: subject('FABM2', 'Fundamentals of Accountancy, Business and Management 2', 'FABM 2', 'Business', seqOf('FABM2')),
    AE: subject('AE', 'Applied Economics', 'Applied Economics', 'Business', seqOf('AE')),
    BF: subject('BF', 'Business Finance', 'Business Finance', 'Business', seqOf('BF')),
    BESR: subject('BESR', 'Business Ethics and Social Responsibility', 'Business Ethics', 'Business', seqOf('BESR')),
    MKT: subject('MKT', 'Principles of Marketing', 'Marketing', 'Business', seqOf('MKT')),
    DRRR: subject('DRRR', 'Disaster Readiness and Risk Reduction', 'DRRR', 'Science', seqOf('DRRR'))
  };
  /*
   * The 8 focus subjects of each track, in order. GAS fills its
   * "selected subject" slots with fixed defaults (see GAS.slots); change
   * them here if your school offers different ones.
   */
  const TRACKS = {
    STEM: { id: 'STEM', name: 'Science, Technology, Engineering and Mathematics', subjects: ['PC', 'BC', 'BIO1', 'BIO2', 'CHEM1', 'CHEM2', 'PHYS1', 'PHYS2'] },
    HUMSS: { id: 'HUMSS', name: 'Humanities and Social Sciences', subjects: ['CW', 'CNF', 'IWRBS', 'PPG', 'DISS', 'DIASS', 'CESC', 'TNCT'] },
    ABM: { id: 'ABM', name: 'Accountancy, Business and Management', subjects: ['BM', 'OM', 'FABM1', 'FABM2', 'AE', 'BF', 'BESR', 'MKT'] },
    GAS: {
      id: 'GAS', name: 'General Academic Strand', subjects: ['CW', 'IWRBS', 'DISS', 'AE', 'OM', 'DRRR', 'BM', 'BIO1'],
      slots: { CW: 'Humanities 1', IWRBS: 'Humanities 2', DISS: 'Social Science 1', BM: 'Elective 1', BIO1: 'Elective 2' }
    }
  };
  const TRACK_IDS = Object.keys(TRACKS);

  SKILLS.forEach(s => {
    s.short = SHORT[s.id];
    s.subject = s.level === 'JHS' ? 'JHS' : Object.values(SUBJECTS).find(sub => sub.sequence.includes(s.id)).id;
  });

  // The General Mathematics sequence; kept for the engine's tests and for reuse.
  const STANDARD_SEQUENCE = SUBJECTS.GM.sequence;

  const trackSubjects = track => (TRACKS[track] ? TRACKS[track].subjects : []);
  // "Humanities 1: Creative Writing / Malikhaing Pagsulat" for GAS slots, else the subject name.
  const subjectLabel = (track, id) => {
    const slot = TRACKS[track] && TRACKS[track].slots && TRACKS[track].slots[id];
    return slot ? `${slot}: ${SUBJECTS[id].name}` : SUBJECTS[id].name;
  };
  // The fixed order a learner on this track meets their topics.
  const trackSequence = track => trackSubjects(track).flatMap(id => SUBJECTS[id].sequence);

  function buildGraph(skills) {
    const byId = {};
    const children = {};
    skills.forEach(s => { byId[s.id] = s; children[s.id] = []; });
    skills.forEach(s => s.prereqs.forEach(p => {
      if (!byId[p]) throw new Error(`Skill ${s.id} lists unknown prerequisite ${p}`);
      children[p].push(s.id);
    }));

    // Kahn's algorithm; keeps declaration order among ties and rejects cycles.
    const indeg = {};
    skills.forEach(s => { indeg[s.id] = s.prereqs.length; });
    const queue = skills.filter(s => indeg[s.id] === 0).map(s => s.id);
    const topo = [];
    while (queue.length) {
      const id = queue.shift();
      topo.push(id);
      children[id].forEach(c => { if (--indeg[c] === 0) queue.push(c); });
    }
    if (topo.length !== skills.length) throw new Error('Curriculum graph contains a cycle');
    const topoIndex = {};
    topo.forEach((id, i) => { topoIndex[id] = i; });

    const ancestorCache = {};
    function ancestors(id) {
      if (ancestorCache[id]) return ancestorCache[id];
      const out = new Set();
      byId[id].prereqs.forEach(p => { out.add(p); ancestors(p).forEach(a => out.add(a)); });
      ancestorCache[id] = out;
      return out;
    }
    const descendantCache = {};
    function descendants(id) {
      if (descendantCache[id]) return descendantCache[id];
      const out = new Set();
      children[id].forEach(c => { out.add(c); descendants(c).forEach(d => out.add(d)); });
      descendantCache[id] = out;
      return out;
    }
    // Longest path from a root, used to lay the graph out in columns.
    const depth = {};
    topo.forEach(id => {
      depth[id] = byId[id].prereqs.reduce((m, p) => Math.max(m, depth[p] + 1), 0);
    });

    return { skills, byId, children, topo, topoIndex, ancestors, descendants, depth };
  }

  const graph = buildGraph(SKILLS);

  // Everything a track needs: its subjects' skills plus the foundations under them.
  function trackSkills(track) {
    const out = new Set(trackSequence(track));
    [...out].forEach(id => graph.ancestors(id).forEach(a => out.add(a)));
    return graph.topo.filter(id => out.has(id));
  }
  const trackLabel = track => (TRACKS[track] ? track : 'No track');

  return {
    SUBJECT, SKILLS, SUBJECTS, TRACKS, TRACK_IDS, STANDARD_SEQUENCE,
    trackSubjects, trackSequence, trackSkills, trackLabel, subjectLabel, buildGraph, graph
  };
});
