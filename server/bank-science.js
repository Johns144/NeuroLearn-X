/*
 * NeuroLearn-X — STEM science item bank: General Biology 1–2, General
 * Chemistry 1–2, General Physics 1–2.
 *
 * Each topic has either generators (fresh numbers every time) or a curated
 * pool of questions. Every wrong option carries the misconception behind it.
 * Teachers can review, edit, hide and add questions in the app.
 */
'use strict';

module.exports = function scienceBank(H) {
  const { ri, pick, shuffle, frac, M, tf } = H;
  const dec = v => String(Math.round(v * 1000) / 1000);
  const I = (prompt, answer, w1, w2, w3, explain, hint) => ({ prompt, answer, wrong: [w1, w2, w3], steps: [explain], hint });
  // Builds an item from a list of [option, why] candidates (one correct).
  const choose = (rng, prompt, answer, candidates, explain, hint) => ({ prompt, answer, wrong: shuffle(rng, candidates), steps: Array.isArray(explain) ? explain : [explain], hint });
  const chem = s => M(`\\mathrm{${s}}`);
  const unit = (v, u) => M(`${v}\\ \\text{${u}}`);

  const S = {};

  // ================================================================ General Biology 1
  S.BIOA1 = {
    idea: 'All living things are made of cells; organelles divide the work of the cell.',
    hint: 'Match each structure with its job in the cell.',
    pool: [
      I('Which organelle produces most of a cell’s ATP through cellular respiration?', 'Mitochondrion',
        ['Chloroplast', 'Chloroplasts capture light energy for photosynthesis; they do not carry out cellular respiration.'],
        ['Ribosome', 'Ribosomes build proteins, not ATP.'],
        ['Golgi apparatus', 'The Golgi apparatus modifies, sorts and packages proteins.'],
        'Mitochondria carry out the Krebs cycle and the electron transport chain, which make most of the cell’s ATP.'),
      I('Which statement is part of the cell theory?', 'All cells come from pre-existing cells.',
        ['All cells have a nucleus.', 'Prokaryotic cells such as bacteria have no nucleus.'],
        ['Cells can arise from non-living matter.', 'That is spontaneous generation, which the cell theory rejects.'],
        ['Only animals are made of cells.', 'Plants, fungi and microorganisms are made of cells too.'],
        'Cell theory: all living things are made of cells, the cell is the basic unit of life, and all cells come from pre-existing cells (Schleiden, Schwann, Virchow).'),
      I('Which structure is found in plant cells but NOT in animal cells?', 'Cell wall',
        ['Cell membrane', 'Both plant and animal cells have a cell membrane.'],
        ['Mitochondrion', 'Plant cells have mitochondria too.'],
        ['Ribosome', 'All cells have ribosomes.'],
        'Plant cells have a cellulose cell wall, chloroplasts and a large central vacuole; animal cells have no cell wall.'),
      I('What is the main difference between prokaryotic and eukaryotic cells?', 'Eukaryotic cells have a nucleus and membrane-bound organelles.',
        ['Prokaryotic cells are always larger.', 'Prokaryotic cells are usually much smaller than eukaryotic cells.'],
        ['Only prokaryotic cells contain DNA.', 'All cells contain DNA.'],
        ['Eukaryotic cells have no ribosomes.', 'Eukaryotic cells have ribosomes; every cell needs them to make proteins.'],
        'Prokaryotes (bacteria, archaea) keep their DNA in a nucleoid with no membrane; eukaryotes enclose it in a nucleus and have membrane-bound organelles.'),
      I('According to the fluid mosaic model, the cell membrane is mainly made of:', 'A phospholipid bilayer with embedded proteins',
        ['A layer of cellulose', 'Cellulose forms the plant cell wall, not the membrane.'],
        ['A double strand of DNA', 'DNA is genetic material, not part of the membrane.'],
        ['A single layer of starch', 'Starch is a storage carbohydrate.'],
        'Phospholipids form a bilayer with water-loving heads outside and water-fearing tails inside; proteins float in it like a mosaic.')
    ]
  };
  S.BIOA2 = {
    idea: 'Mitosis makes two identical diploid cells for growth and repair; meiosis makes four different haploid gametes.',
    hint: 'Think about how many cells are made and how many chromosomes each has.',
    pool: [
      I('What does meiosis produce?', 'Four haploid cells that are genetically different',
        ['Two diploid cells that are identical', 'That describes mitosis.'],
        ['Four diploid cells that are identical', 'Meiosis halves the chromosome number, and crossing over makes the cells different.'],
        ['Two haploid cells that are identical', 'Meiosis has two divisions, so it makes four cells.'],
        'Meiosis I separates homologous chromosomes and meiosis II separates sister chromatids, giving four haploid gametes.'),
      I('In which phase of mitosis do the chromosomes line up at the middle of the cell?', 'Metaphase',
        ['Prophase', 'In prophase the chromosomes condense and the spindle forms.'],
        ['Anaphase', 'In anaphase the sister chromatids are pulled apart.'],
        ['Telophase', 'In telophase the nuclear envelopes re-form.'],
        'Order of mitosis: prophase, metaphase (line up in the middle), anaphase (pull apart), telophase.'),
      I(`A human body cell has ${M('46')} chromosomes. How many chromosomes are in a human egg cell?`, M('23'),
        [M('46'), 'Gametes are haploid, so they have half the number of chromosomes.'],
        [M('92'), 'That doubles the number; gametes have half.'],
        [M('12'), 'Half of 46 is 23.'],
        'Meiosis halves the chromosome number so that fertilization restores 46.'),
      I('When does crossing over happen?', 'Prophase I of meiosis',
        ['Metaphase of mitosis', 'Homologous chromosomes do not pair up in mitosis.'],
        ['Anaphase II of meiosis', 'By anaphase II the homologous chromosomes have already separated.'],
        ['The S phase of interphase', 'The S phase copies DNA; exchange between homologues happens later.'],
        'In prophase I, homologous chromosomes pair up and exchange segments, which creates genetic variation.'),
      I('In which part of the cell cycle is DNA copied?', 'The S phase of interphase',
        ['Prophase', 'DNA is already copied before mitosis begins.'],
        ['Cytokinesis', 'Cytokinesis divides the cytoplasm.'],
        ['The G1 phase', 'G1 is a growth phase before DNA synthesis.'],
        'Interphase has G1 (growth), S (DNA synthesis) and G2 (preparation for division).')
    ]
  };
  S.BIOA3 = {
    idea: 'Carbohydrates, lipids, proteins and nucleic acids are built from monomers; enzymes are proteins that speed up reactions.',
    hint: 'Recall the building block (monomer) of each biomolecule.',
    pool: [
      I('What are the building blocks (monomers) of proteins?', 'Amino acids',
        ['Nucleotides', 'Nucleotides build nucleic acids such as DNA and RNA.'],
        ['Monosaccharides', 'Monosaccharides build carbohydrates.'],
        ['Fatty acids and glycerol', 'Those build fats (lipids).'],
        'Amino acids join by peptide bonds to form polypeptides, which fold into proteins.'),
      I('Which biomolecule is the cell’s main quick source of energy?', 'Carbohydrates such as glucose',
        ['Nucleic acids', 'Nucleic acids store genetic information.'],
        ['Proteins', 'Proteins are mainly structural and functional; they are used for energy only when needed.'],
        ['Vitamins', 'Vitamins help reactions but are not a main energy source.'],
        'Cells break down glucose in cellular respiration to make ATP.'),
      I('How do enzymes speed up chemical reactions?', 'They lower the activation energy.',
        ['They raise the temperature of the cell.', 'Enzymes work at body temperature without heating the cell.'],
        ['They are used up in the reaction.', 'Enzymes are catalysts; they are not consumed.'],
        ['They add energy to the reactants.', 'Enzymes do not supply energy; they lower the energy barrier.'],
        'An enzyme binds the substrate at its active site and offers an easier pathway with lower activation energy.'),
      I('Why does very high temperature stop most enzymes from working?', 'The enzyme denatures, so its active site changes shape.',
        ['The substrate becomes too small.', 'Heat changes the enzyme’s shape, not the substrate’s size.'],
        ['Enzymes only work in the cold.', 'Most human enzymes work best near 37 °C.'],
        ['Heat turns the enzyme into a carbohydrate.', 'Proteins do not turn into carbohydrates when heated.'],
        'Heat breaks the bonds that hold the protein’s 3D shape, so the substrate no longer fits the active site.'),
      I('Which biomolecule forms cell membranes and stores long-term energy?', 'Lipids',
        ['Proteins', 'Proteins sit in membranes, but lipids form the membrane itself.'],
        ['Nucleic acids', 'Nucleic acids carry genetic information.'],
        ['Carbohydrates', 'Carbohydrates are short-term energy; lipids store more energy per gram.'],
        'Phospholipids form membranes, and fats store about twice as much energy per gram as carbohydrates.')
    ]
  };
  S.BIOA4 = {
    idea: 'Photosynthesis stores light energy in glucose; cellular respiration releases it as ATP.',
    hint: 'Compare the inputs and outputs of the two processes.',
    pool: [
      I('What are the products of photosynthesis?', 'Glucose and oxygen',
        ['Carbon dioxide and water', 'Those are the reactants (inputs) of photosynthesis.'],
        ['ATP and carbon dioxide', 'Carbon dioxide is used up in photosynthesis, not produced.'],
        ['Oxygen and carbon dioxide', 'Plants take in carbon dioxide during photosynthesis.'],
        `${M('6CO_2 + 6H_2O \\xrightarrow{\\text{light}} C_6H_{12}O_6 + 6O_2')}`),
      I('Where in the cell does photosynthesis take place?', 'Chloroplast',
        ['Mitochondrion', 'Mitochondria carry out cellular respiration.'],
        ['Nucleus', 'The nucleus stores DNA.'],
        ['Ribosome', 'Ribosomes make proteins.'],
        'The light reactions happen in the thylakoids and the Calvin cycle in the stroma of the chloroplast.'),
      I('Which stage of cellular respiration produces the most ATP?', 'The electron transport chain',
        ['Glycolysis', 'Glycolysis makes only 2 ATP (net).'],
        ['The Krebs cycle', 'The Krebs cycle makes 2 ATP; its main job is to load NADH and FADH₂.'],
        ['Fermentation', 'Fermentation makes no ATP beyond glycolysis.'],
        'Oxidative phosphorylation in the electron transport chain makes about 32–34 of the roughly 36–38 ATP per glucose.'),
      I('In what form is energy carried and used directly by cells?', 'ATP',
        ['Glucose', 'Glucose stores energy but must first be broken down to make ATP.'],
        ['DNA', 'DNA stores genetic information, not usable energy.'],
        ['Oxygen', 'Oxygen is the final electron acceptor, not an energy carrier.'],
        'ATP releases energy when its last phosphate bond is broken, powering the cell’s work.'),
      I('When oxygen runs short, human muscle cells keep making ATP by:', 'Lactic acid fermentation',
        ['Alcoholic fermentation', 'Yeast does alcoholic fermentation; muscle cells make lactic acid.'],
        ['Photosynthesis', 'Animal cells cannot photosynthesize.'],
        ['The Calvin cycle', 'The Calvin cycle is part of photosynthesis.'],
        'Without oxygen, pyruvate becomes lactic acid so that glycolysis can keep making 2 ATP.')
    ]
  };

  // ================================================================ General Biology 2
  S.BIOB1 = {
    idea: 'Each parent passes one allele; a Punnett square shows every equally likely combination.',
    hint: 'Draw a 2 × 2 Punnett square with one parent’s alleles on each side.',
    gens: [rng => {
      const [org, dom, L, rec] = pick(rng, [['pea plants', 'purple flowers', 'P', 'white flowers'], ['guinea pigs', 'black fur', 'B', 'white fur'],
        ['tomato plants', 'tall stems', 'T', 'short stems'], ['mice', 'brown fur', 'R', 'white fur']]);
      const l = L.toLowerCase();
      const g = s => s.replace(/X/g, L).replace(/x/g, l);
      const [a, b] = pick(rng, [['Xx', 'Xx'], ['Xx', 'xx'], ['XX', 'xx'], ['XX', 'Xx'], ['Xx', 'Xx']]);
      const combos = [];
      for (const p of a) for (const q of b) combos.push(p + q);
      const k = combos.filter(c => c === 'xx').length;
      const askRec = rng() < 0.6;
      const n = askRec ? k : 4 - k;
      const opts = [0, 1, 2, 3, 4].map(v => frac(v, 4));
      const show = f => (f.n === 0 ? M('0') : f.n === f.d ? M('1') : M(tf(f)));
      const target = askRec ? rec : dom;
      return {
        prompt: `In ${org}, the allele for ${dom} (${M(L)}) is dominant over the allele for ${rec} (${M(l)}). Two parents with genotypes ${M(g(a))} and ${M(g(b))} are crossed. What is the probability that an offspring has ${target}?`,
        answer: show(frac(n, 4)),
        wrong: shuffle(rng, opts.filter(f => f.n * 4 !== n * f.d).map(f => {
          const v = Math.round(f.n * 4 / f.d);
          return [show(f), v === 4 - n ? `That is the probability of the other trait (${askRec ? dom : rec}).` : `Count the boxes in the Punnett square with ${target}: it is ${n} out of 4, not ${v}.`];
        })),
        steps: [`Gametes: ${M(g(a))} gives ${M(g(a[0]))} or ${M(g(a[1]))}; ${M(g(b))} gives ${M(g(b[0]))} or ${M(g(b[1]))}.`,
          `The four boxes: ${combos.map(c => M(g(c))).join(', ')}.`,
          `${target.charAt(0).toUpperCase() + target.slice(1)} ${askRec ? `needs ${M(g('xx'))}` : `needs at least one ${M(L)}`}: ${n} of 4 boxes, so ${show(frac(n, 4))}.`]
      };
    }]
  };
  S.BIOB2 = {
    idea: 'In DNA, A pairs with T and C with G; in RNA, uracil (U) replaces thymine.',
    hint: 'Pair each base in order: A–T (or A–U in RNA) and C–G.',
    gens: [rng => {
      // Needs an A (so the DNA partner T and the RNA partner U differ) and a C or G.
      let strand;
      do { strand = Array.from({ length: 6 }, () => pick(rng, ['A', 'T', 'C', 'G'])).join(''); } while (!/A/.test(strand) || !/[CG]/.test(strand));
      const pairD = { A: 'T', T: 'A', C: 'G', G: 'C' }, pairR = { A: 'U', T: 'A', C: 'G', G: 'C' };
      const comp = [...strand].map(c => pairD[c]).join(''), mrna = [...strand].map(c => pairR[c]).join('');
      const swapped = [...strand].map(c => ({ A: 'C', T: 'G', C: 'A', G: 'T' })[c]).join('');
      const tt = s => M(`\\texttt{${s}}`);
      const toRna = rng() < 0.5;
      const ans = toRna ? mrna : comp;
      return {
        prompt: toRna ? `A DNA template strand reads ${tt(strand)}. What mRNA strand is transcribed from it?` : `One strand of DNA reads ${tt(strand)}. What is the complementary DNA strand?`,
        answer: tt(ans),
        wrong: [
          [tt(toRna ? comp : mrna), toRna ? 'mRNA uses uracil (U) instead of thymine (T).' : 'DNA uses thymine (T); uracil (U) is only in RNA.'],
          [tt(toRna ? strand.replace(/T/g, 'U') : strand), 'You copied the strand instead of pairing each base.'],
          [tt(swapped), 'Check the pairing rules: A pairs with T (or U) and C pairs with G.'],
          [tt([...ans].reverse().join('')), 'Pair the bases in the same order; do not reverse the strand.']
        ],
        steps: [`Pair each base: ${toRna ? 'A → U, T → A, C → G, G → C' : 'A → T, T → A, C → G, G → C'}.`, `${tt(strand)} → ${tt(ans)}`]
      };
    }]
  };
  S.BIOB3 = {
    idea: 'Natural selection: heritable variation plus unequal survival and reproduction changes a population over generations.',
    hint: 'Evolution acts on populations through traits that are passed on.',
    pool: [
      I('According to Darwin’s theory of natural selection, which individuals are most likely to survive and reproduce?', 'Those with traits best suited to their environment',
        ['The largest individuals', 'Size helps only if it suits the environment.'],
        ['Those that try hardest to change', 'Individuals cannot evolve by effort during their lives; that resembles Lamarck’s idea.'],
        ['All individuals equally', 'Variation means some individuals survive and reproduce better than others.'],
        'Variation exists, more offspring are born than can survive, and individuals with helpful heritable traits leave more offspring.'),
      I('Bacteria that survive an antibiotic multiply into a resistant population. This is an example of:', 'Natural selection',
        ['Inheritance of acquired traits', 'The bacteria did not acquire resistance by use; resistant variants already existed and survived.'],
        ['Artificial selection', 'People did not deliberately breed these bacteria.'],
        ['Genetic drift', 'Drift is random; here survival depended on a trait.'],
        'The antibiotic killed susceptible bacteria; resistant ones survived and passed on the trait.'),
      I('A bat’s wing and a human arm have similar bones but different uses. They are:', 'Homologous structures',
        ['Analogous structures', 'Analogous structures have similar uses but different origins, like bird and insect wings.'],
        ['Vestigial structures', 'Vestigial structures have lost most of their function.'],
        ['Unrelated structures', 'The shared bone pattern points to a common ancestor.'],
        'Homologous structures come from a common ancestor, which is evidence for evolution.'),
      I('Which is the best definition of evolution?', 'Change in the heritable traits of a population over generations',
        ['Change in one organism during its life', 'Individuals do not evolve; populations do.'],
        ['The origin of life from non-living matter', 'That is abiogenesis.'],
        ['Any growth of an organism', 'Growth is development, not evolution.'],
        'Evolution is measured in populations across generations.'),
      I('Which gives direct evidence of organisms that lived long ago?', 'Fossils',
        ['Similar genes in living species', 'That is indirect molecular evidence from living organisms.'],
        ['Similar embryos of living species', 'Embryology is indirect evidence from living organisms.'],
        ['Selective breeding of dogs today', 'That shows artificial selection now, not past organisms.'],
        'Fossils are preserved remains or traces of past organisms.')
    ]
  };
  S.BIOB4 = {
    idea: 'Taxonomy groups organisms from domain (broadest) to species (most specific); names follow binomial nomenclature.',
    hint: 'Remember: Domain, Kingdom, Phylum, Class, Order, Family, Genus, Species.',
    pool: [
      I('Which order of taxonomic ranks goes from broadest to most specific?', 'Domain, Kingdom, Phylum, Class, Order, Family, Genus, Species',
        ['Kingdom, Domain, Phylum, Class, Order, Family, Genus, Species', 'Domain is the broadest rank, above kingdom.'],
        ['Species, Genus, Family, Order, Class, Phylum, Kingdom, Domain', 'That goes from most specific to broadest.'],
        ['Domain, Kingdom, Class, Phylum, Order, Family, Genus, Species', 'Phylum comes before class.'],
        'A memory aid: “Dear King Philip Came Over For Good Soup”.'),
      I(`In the scientific name ${M('\\textit{Homo sapiens}')}, what does “Homo” name?`, 'The genus',
        ['The species', 'The species name is both words; “sapiens” is the specific epithet.'],
        ['The family', 'Humans belong to the family Hominidae.'],
        ['The kingdom', 'Humans belong to kingdom Animalia.'],
        'In binomial nomenclature (Linnaeus), the first word is the genus (capitalized) and the second is the specific epithet.'),
      I('Which kingdom has organisms that absorb food and have cell walls made of chitin?', 'Fungi',
        ['Plantae', 'Plants make their own food and have cellulose walls.'],
        ['Animalia', 'Animals ingest food and have no cell walls.'],
        ['Protista', 'Protists are mostly single-celled and varied.'],
        'Fungi such as mushrooms and molds digest food outside their bodies and absorb it.'),
      I('Of these ranks, organisms that share the same ___ are the most alike.', 'Genus',
        ['Family', 'A family contains several genera, so its members are less alike.'],
        ['Order', 'An order is broader than a family.'],
        ['Kingdom', 'Kingdom is one of the broadest ranks.'],
        'The more specific the shared rank, the more similar the organisms.'),
      I('A cladogram groups organisms by:', 'Shared derived traits that show common ancestry',
        ['Their size', 'Size alone does not show ancestry.'],
        ['Where they live', 'Habitat is not evidence of shared ancestry.'],
        ['How useful they are to people', 'Usefulness to people says nothing about ancestry.'],
        'Each branch point in a cladogram marks a new shared trait inherited from a common ancestor.')
    ]
  };

  // ================================================================ General Chemistry 1
  S.CHA1 = {
    idea: `Density is mass per volume, \\(\\rho = \\frac{m}{V}\\); convert units with factors equal to 1.`,
    hint: 'Check the units: density is g/mL; 1 kg = 1000 g.',
    gens: [
      rng => {
        const d = pick(rng, [0.8, 1, 2.7, 7.9, 11.3, 13.6]), V = ri(rng, 2, 40), m = Math.round(d * V * 10) / 10;
        return {
          prompt: `A sample has a mass of ${unit(m, 'g')} and a volume of ${unit(V, 'mL')}. What is its density?`,
          answer: unit(dec(m / V), 'g/mL'),
          wrong: [[unit(dec(V / m), 'g/mL'), 'Density is mass divided by volume, not volume divided by mass.'],
            [unit(dec(m * V), 'g/mL'), 'Divide the mass by the volume; do not multiply.'],
            [unit(dec(m - V), 'g/mL'), 'Density is a ratio, found by division.']],
          steps: [`${M(`\\rho = \\frac{m}{V} = \\frac{${m}\\ \\text{g}}{${V}\\ \\text{mL}}`)}`, `${M(`\\rho = ${dec(m / V)}\\ \\text{g/mL}`)}`]
        };
      },
      rng => {
        const g = pick(rng, [75, 250, 480, 1500, 3200, 50]);
        return {
          prompt: `Express ${unit(g, 'g')} in kilograms.`, answer: unit(dec(g / 1000), 'kg'),
          wrong: [[unit(g * 1000, 'kg'), 'There are 1000 g in 1 kg, so divide by 1000.'],
            [unit(dec(g / 100), 'kg'), 'Use 1000 g = 1 kg, not 100.'],
            [unit(dec(g / 10), 'kg'), 'Use 1000 g = 1 kg, not 10.']],
          steps: [`${M(`${g}\\ \\text{g} \\times \\frac{1\\ \\text{kg}}{1000\\ \\text{g}} = ${dec(g / 1000)}\\ \\text{kg}`)}`]
        };
      },
      rng => {
        const [thing, kind] = pick(rng, [['table salt (sodium chloride)', 'Compound'], ['oxygen gas', 'Element'], ['seawater', 'Homogeneous mixture'],
          ['halo-halo', 'Heterogeneous mixture'], ['pure water', 'Compound'], ['iron', 'Element'], ['air', 'Homogeneous mixture'], ['sand mixed with pebbles', 'Heterogeneous mixture']]);
        const why = {
          Element: 'An element is one kind of atom and cannot be broken down chemically.',
          Compound: 'A compound has two or more elements chemically combined in a fixed ratio.',
          'Homogeneous mixture': 'A homogeneous mixture looks the same throughout (a solution).',
          'Heterogeneous mixture': 'A heterogeneous mixture has visibly different parts.'
        };
        return choose(rng, `How is ${thing} classified?`, kind, Object.keys(why).filter(k => k !== kind).map(k => [k, `Not this: ${why[k]}`]), why[kind]);
      }
    ]
  };
  const ELEMENTS = [['carbon', 'C', 6, 12], ['nitrogen', 'N', 7, 14], ['oxygen', 'O', 8, 16], ['sodium', 'Na', 11, 23], ['magnesium', 'Mg', 12, 24],
    ['aluminum', 'Al', 13, 27], ['chlorine', 'Cl', 17, 35], ['potassium', 'K', 19, 39], ['calcium', 'Ca', 20, 40], ['iron', 'Fe', 26, 56]];
  S.CHA2 = {
    idea: 'Atomic number = protons; mass number = protons + neutrons; a neutral atom has as many electrons as protons.',
    hint: 'Neutrons = mass number − atomic number.',
    gens: [
      rng => {
        const [name, sym, Z, A] = pick(rng, ELEMENTS);
        return {
          prompt: `An atom of ${name}, ${M(`^{${A}}_{${Z}}\\mathrm{${sym}}`)}, has how many neutrons?`, answer: M(A - Z),
          wrong: [[M(Z), 'That is the number of protons (the atomic number).'], [M(A), 'That is the mass number, protons plus neutrons.'], [M(A + Z), 'Subtract: neutrons = mass number − atomic number.']],
          steps: [`${M(`n = A - Z = ${A} - ${Z} = ${A - Z}`)}`]
        };
      },
      rng => {
        const [name, sym, Z, A] = pick(rng, ELEMENTS);
        return {
          prompt: `How many electrons are in a neutral atom of ${name} (${M(`^{${A}}_{${Z}}\\mathrm{${sym}}`)})?`, answer: M(Z),
          wrong: [[M(A - Z), 'That is the number of neutrons.'], [M(A), 'That is the mass number.'], [M(Z + 1), 'A neutral atom has exactly as many electrons as protons.']],
          steps: ['In a neutral atom, electrons = protons = atomic number.', `So ${M(Z)} electrons.`]
        };
      },
      rng => {
        const [name, sym, Z, q] = pick(rng, [['sodium', 'Na', 11, 1], ['magnesium', 'Mg', 12, 2], ['chlorine', 'Cl', 17, -1], ['oxygen', 'O', 8, -2], ['calcium', 'Ca', 20, 2], ['aluminum', 'Al', 13, 3]]);
        const ion = `\\mathrm{${sym}}^{${Math.abs(q) === 1 ? '' : Math.abs(q)}${q > 0 ? '+' : '-'}}`;
        return {
          prompt: `How many electrons does the ion ${M(ion)} have? (${name}: atomic number ${M(Z)})`, answer: M(Z - q),
          wrong: [[M(Z), 'An ion has gained or lost electrons, so it differs from the atomic number.'], [M(Z + q), 'A positive ion has lost electrons; a negative ion has gained them.'], [M(Math.abs(q)), 'That is the charge, not the number of electrons.']],
          steps: [`${q > 0 ? `A ${q}+ charge means ${q} electron${q > 1 ? 's' : ''} lost` : `A ${-q}− charge means ${-q} electron${q < -1 ? 's' : ''} gained`}.`, `${M(`${Z} ${q > 0 ? '-' : '+'} ${Math.abs(q)} = ${Z - q}`)} electrons.`]
        };
      }
    ]
  };
  const COMPOUNDS = [['H_2O', [['H', 2, 1], ['O', 1, 16]]], ['CO_2', [['C', 1, 12], ['O', 2, 16]]], ['NaCl', [['Na', 1, 23], ['Cl', 1, 35.5]]],
    ['CH_4', [['C', 1, 12], ['H', 4, 1]]], ['NH_3', [['N', 1, 14], ['H', 3, 1]]], ['CaCO_3', [['Ca', 1, 40], ['C', 1, 12], ['O', 3, 16]]],
    ['H_2SO_4', [['H', 2, 1], ['S', 1, 32], ['O', 4, 16]]], ['C_6H_{12}O_6', [['C', 6, 12], ['H', 12, 1], ['O', 6, 16]]]];
  const molar = parts => parts.reduce((s, [, n, m]) => s + n * m, 0);
  S.CHA3 = {
    idea: `One mole has \\(6.02 \\times 10^{23}\\) particles; moles = mass ÷ molar mass.`,
    hint: 'Molar mass = sum of (atomic mass × subscript) for every element.',
    gens: [
      rng => {
        const [f, parts] = pick(rng, COMPOUNDS), Mm = molar(parts), noSub = parts.reduce((s, [, , m]) => s + m, 0);
        return {
          prompt: `What is the molar mass of ${chem(f)}? (H = 1, C = 12, N = 14, O = 16, Na = 23, S = 32, Cl = 35.5, Ca = 40)`,
          answer: unit(dec(Mm), 'g/mol'),
          wrong: [[unit(dec(noSub), 'g/mol'), 'Multiply each atomic mass by its subscript before adding.'], [unit(dec(Mm + 16), 'g/mol'), 'Recheck the number of oxygen atoms.'], [unit(dec(Mm * 2), 'g/mol'), 'Add each element once, using its subscript.']],
          steps: [`${M(parts.map(([e, n, m]) => `${n}(${m})`).join(' + '))}`, `${M(`= ${dec(Mm)}\\ \\text{g/mol}`)}`]
        };
      },
      rng => {
        const [f, parts] = pick(rng, COMPOUNDS), Mm = molar(parts), n = pick(rng, [0.5, 2, 3, 4, 5]), m = n * Mm;
        return {
          prompt: `How many moles are in ${unit(dec(m), 'g')} of ${chem(f)} (molar mass ${M(`${dec(Mm)}\\ \\text{g/mol}`)})?`,
          answer: unit(dec(n), 'mol'),
          wrong: [[unit(dec(m * Mm), 'mol'), 'Divide the mass by the molar mass; do not multiply.'], [unit(dec(Mm / m), 'mol'), 'Moles = mass ÷ molar mass, not molar mass ÷ mass.'], [unit(dec(n + 1), 'mol'), 'Recheck the division.']],
          steps: [`${M(`n = \\frac{m}{M} = \\frac{${dec(m)}}{${dec(Mm)}} = ${dec(n)}\\ \\text{mol}`)}`]
        };
      },
      rng => {
        const n = pick(rng, [0.5, 1, 1.5]);
        return {
          prompt: `How many molecules are in ${unit(n, 'mol')} of water?`, answer: M(`${dec(n * 6.02)} \\times 10^{23}`),
          wrong: [[M('6.02 \\times 10^{23}'), 'That is one mole; multiply by the number of moles.'], [M(`${n} \\times 10^{23}`), 'Use Avogadro’s number, 6.02 × 10²³.'], [M(`${dec(6.02 / n)} \\times 10^{23}`), 'Multiply by the moles; do not divide.'],
            [M(`${dec(n * 6.02)} \\times 10^{-23}`), 'The exponent is positive: Avogadro’s number is 6.02 × 10²³.'], [M(`${dec(n * 6.02)} \\times 10^{22}`), 'Keep the exponent 23.']],
          steps: [`${M(`N = n \\times 6.02 \\times 10^{23} = ${n} \\times 6.02 \\times 10^{23} = ${dec(n * 6.02)} \\times 10^{23}`)}`]
        };
      }
    ]
  };
  S.CHA4 = {
    idea: 'Use mole ratios from the balanced equation; for gases, PV stays constant at fixed temperature and V/T at fixed pressure (in kelvin).',
    hint: 'Write the relationship first, then substitute.',
    gens: [
      rng => {
        const P1 = pick(rng, [1, 2, 3, 4]), V1 = ri(rng, 2, 12);
        let P2 = pick(rng, [1, 2, 3, 4, 6, 8]); while (P2 === P1) P2 = pick(rng, [1, 2, 3, 4, 6, 8]);
        return {
          prompt: `A gas occupies ${unit(V1, 'L')} at ${unit(P1, 'atm')}. At constant temperature, what is its volume at ${unit(P2, 'atm')}?`,
          answer: unit(dec(P1 * V1 / P2), 'L'),
          wrong: [[unit(dec(P2 * V1 / P1), 'L'), 'Pressure and volume are inversely related (Boyle’s law): V₂ = P₁V₁ ÷ P₂.'], [unit(V1, 'L'), 'The volume changes when the pressure changes.'], [unit(dec(P1 * V1 * P2), 'L'), 'Divide by the new pressure; do not multiply.']],
          steps: [`${M('P_1V_1 = P_2V_2')}`, `${M(`V_2 = \\frac{${P1} \\times ${V1}}{${P2}} = ${dec(P1 * V1 / P2)}\\ \\text{L}`)}`]
        };
      },
      rng => {
        const [c1, c2] = pick(rng, [[27, 127], [27, 327], [127, 327], [-73, 127], [27, 177]]), V1 = pick(rng, [2, 3, 4, 6]);
        const T1 = c1 + 273, T2 = c2 + 273;
        return {
          prompt: `A gas has a volume of ${unit(V1, 'L')} at ${M(`${c1}^{\\circ}\\text{C}`)}. At constant pressure, what is its volume at ${M(`${c2}^{\\circ}\\text{C}`)}?`,
          answer: unit(dec(V1 * T2 / T1), 'L'),
          wrong: [[unit(dec(V1 * c2 / c1), 'L'), 'Convert to kelvin first (K = °C + 273); gas laws use absolute temperature.'], [unit(dec(V1 * T1 / T2), 'L'), 'At constant pressure, volume rises with temperature (Charles’s law).'], [unit(V1, 'L'), 'The volume changes when the temperature changes.']],
          steps: [`${M(`T_1 = ${T1}\\ \\text{K},\\ T_2 = ${T2}\\ \\text{K}`)}`, `${M(`V_2 = V_1 \\cdot \\frac{T_2}{T_1} = ${V1} \\cdot \\frac{${T2}}{${T1}} = ${dec(V1 * T2 / T1)}\\ \\text{L}`)}`]
        };
      },
      rng => {
        const [eq, a, b, ra, rb] = pick(rng, [['2H_2 + O_2 \\rightarrow 2H_2O', 'H_2', 'O_2', 2, 1], ['N_2 + 3H_2 \\rightarrow 2NH_3', 'N_2', 'NH_3', 1, 2], ['CH_4 + 2O_2 \\rightarrow CO_2 + 2H_2O', 'CH_4', 'O_2', 1, 2]]);
        const n = pick(rng, [2, 3, 4, 6]);
        return {
          prompt: `For ${chem(eq)}, how many moles of ${chem(b)} react with or form from ${unit(n, 'mol')} of ${chem(a)}?`,
          answer: unit(dec(n * rb / ra), 'mol'),
          wrong: [[unit(dec(n * ra / rb), 'mol'), 'Use the mole ratio the right way up: moles of what you want over moles of what you have.'], [unit(n, 'mol'), 'The coefficients are not 1 : 1; use the mole ratio.'], [unit(dec(n * rb * ra), 'mol'), 'Multiply by the ratio of coefficients, not by both coefficients.']],
          steps: [`Mole ratio ${M(`${chem(b).slice(2, -2)} : ${chem(a).slice(2, -2)} = ${rb} : ${ra}`)}.`, `${M(`${n} \\times \\frac{${rb}}{${ra}} = ${dec(n * rb / ra)}\\ \\text{mol}`)}`]
        };
      }
    ]
  };

  // ================================================================ General Chemistry 2
  S.CHB1 = {
    idea: 'Intermolecular forces (dispersion, dipole–dipole, hydrogen bonding) decide boiling points, vapor pressure and surface tension.',
    hint: 'Hydrogen bonds need H attached to N, O or F; nonpolar molecules have only dispersion forces.',
    pool: [
      I('Which intermolecular force explains water’s unusually high boiling point?', 'Hydrogen bonding',
        ['Only London dispersion forces', 'All molecules have dispersion forces, but water’s hydrogen bonds are much stronger.'],
        ['Ionic bonding', 'Water is molecular; ionic bonds are between ions in ionic compounds.'],
        ['Metallic bonding', 'Metallic bonding occurs in metals.'],
        'In water, H is bonded to O, so molecules form strong hydrogen bonds with each other.'),
      I(`Which substance has ONLY London dispersion forces between its molecules?`, chem('CH_4'),
        [chem('H_2O'), 'Water forms hydrogen bonds.'],
        [chem('NH_3'), 'Ammonia forms hydrogen bonds (H bonded to N).'],
        [chem('HCl'), 'HCl is polar, so it also has dipole–dipole forces.'],
        'Methane is nonpolar, so dispersion forces are its only intermolecular forces.'),
      I('Stronger intermolecular forces usually give a substance:', 'A higher boiling point',
        ['A lower boiling point', 'Stronger attractions take more energy to overcome.'],
        ['A higher vapor pressure', 'Stronger forces hold molecules in the liquid, lowering vapor pressure.'],
        ['Lower surface tension', 'Stronger forces raise surface tension.'],
        'More energy is needed to separate strongly attracted molecules.'),
      I('Dipole–dipole forces act between:', 'Polar molecules',
        ['Nonpolar molecules only', 'Nonpolar molecules have no permanent dipole.'],
        ['Metal atoms', 'Metal atoms are held by metallic bonding.'],
        ['Ions in a crystal', 'Ions are held by ionic bonds.'],
        'The positive end of one polar molecule attracts the negative end of another.'),
      I('Why can a small needle float on still water?', 'Surface tension',
        ['Viscosity', 'Viscosity is resistance to flow.'],
        ['Capillary action', 'Capillary action is a liquid rising in a narrow tube.'],
        ['Evaporation', 'Evaporation is a change of phase.'],
        'Hydrogen bonds at the surface make water act like a stretched film.')
    ]
  };
  S.CHB2 = {
    idea: 'Molarity = moles of solute ÷ liters of solution.',
    hint: `Use \\(M = \\frac{n}{V}\\) with V in liters.`,
    gens: [
      rng => {
        const n = pick(rng, [0.1, 0.2, 0.25, 0.5, 1, 1.5, 2]), V = pick(rng, [0.25, 0.5, 1, 2]);
        return {
          prompt: `${unit(n, 'mol')} of NaCl is dissolved to make ${unit(V, 'L')} of solution. What is the molarity?`, answer: unit(dec(n / V), 'M'),
          wrong: [[unit(dec(n * V), 'M'), 'Divide moles by liters; do not multiply.'], [unit(dec(V / n), 'M'), 'Molarity is moles ÷ liters, not liters ÷ moles.'], [unit(dec(n / (V * 1000)), 'M'), 'The volume is already in liters.']],
          steps: [`${M(`M = \\frac{n}{V} = \\frac{${n}}{${V}} = ${dec(n / V)}\\ \\text{M}`)}`]
        };
      },
      rng => {
        const Mo = pick(rng, [0.1, 0.5, 1, 2]), V = pick(rng, [0.25, 0.5, 1, 2]);
        return {
          prompt: `How many grams of NaOH (molar mass ${M('40\\ \\text{g/mol}')}) are needed for ${unit(V, 'L')} of a ${unit(Mo, 'M')} solution?`,
          answer: unit(dec(Mo * V * 40), 'g'),
          wrong: [[unit(dec(Mo * V), 'g'), 'That is the number of moles; multiply by the molar mass.'], [unit(dec(Mo * 40), 'g'), 'Multiply by the volume as well.'], [unit(dec(Mo * 40 / V), 'g'), 'Multiply by the volume; do not divide.']],
          steps: [`Moles: ${M(`${Mo} \\times ${V} = ${dec(Mo * V)}\\ \\text{mol}`)}.`, `Mass: ${M(`${dec(Mo * V)} \\times 40 = ${dec(Mo * V * 40)}\\ \\text{g}`)}.`]
        };
      },
      rng => {
        const solute = ri(rng, 5, 40), water = pick(rng, [60, 80, 95, 160, 200]);
        return {
          prompt: `${unit(solute, 'g')} of sugar is dissolved in ${unit(water, 'g')} of water. What is the percent by mass of sugar?`,
          answer: M(`${dec(100 * solute / (solute + water))}\\%`),
          wrong: [[M(`${dec(100 * solute / water)}\\%`), 'Divide by the mass of the whole solution (solute + solvent), not just the water.'], [M(`${dec(solute / (solute + water))}\\%`), 'Multiply by 100 to get a percent.'], [M(`${dec(100 * water / (solute + water))}\\%`), 'That is the percent of water.']],
          steps: [`Solution mass: ${M(`${solute} + ${water} = ${solute + water}\\ \\text{g}`)}.`, `${M(`\\frac{${solute}}{${solute + water}} \\times 100 = ${dec(100 * solute / (solute + water))}\\%`)}`]
        };
      }
    ]
  };
  S.CHB3 = {
    idea: 'Collisions, temperature, concentration, surface area and catalysts set reaction rates; Le Chatelier’s principle predicts equilibrium shifts.',
    hint: 'Ask what happens to the number of effective collisions, or how the system can undo the change.',
    pool: [
      I('Raising the temperature usually makes a reaction rate:', 'Increase',
        ['Decrease', 'Hotter particles move faster and collide more often with enough energy.'],
        ['Stay the same', 'Temperature strongly affects the rate.'],
        ['Drop to zero', 'Heating does not stop reactions.'],
        'More particles have energy above the activation energy at higher temperature.'),
      I('A catalyst speeds up a reaction by:', 'Providing a pathway with lower activation energy',
        ['Raising the temperature', 'A catalyst does not heat the mixture.'],
        ['Being used up as a reactant', 'A catalyst is not consumed.'],
        ['Changing the products', 'A catalyst gives the same products, only faster.'],
        'Catalysts lower the energy barrier without being used up.'),
      I(`In the equilibrium ${chem('N_2 + 3H_2 \\rightleftharpoons 2NH_3')}, adding more ${chem('N_2')} will:`, 'Shift the equilibrium to the right, forming more ammonia',
        ['Shift the equilibrium to the left', 'The system uses up the added reactant by making more product.'],
        ['Have no effect', 'Adding a reactant disturbs the equilibrium.'],
        ['Stop the reaction', 'Equilibrium is dynamic; reactions keep going.'],
        'Le Chatelier’s principle: a system at equilibrium shifts to reduce an imposed change.'),
      I('At chemical equilibrium:', 'The forward and reverse reaction rates are equal.',
        ['All reactions have stopped.', 'Equilibrium is dynamic; both reactions continue at equal rates.'],
        ['Reactant and product amounts are always equal.', 'Concentrations stay constant but are usually not equal.'],
        ['Only products remain.', 'Reactants and products are both present.'],
        'The concentrations stop changing because the two rates balance.'),
      I('Crushing a solid reactant into powder makes it react faster because:', 'It increases the surface area for collisions.',
        ['It raises the activation energy.', 'Activation energy is unchanged; more particles are exposed.'],
        ['It changes the products.', 'The products stay the same.'],
        ['It lowers the temperature.', 'Crushing does not cool the reactant.'],
        'More exposed particles means more collisions per second.')
    ]
  };
  S.CHB4 = {
    idea: `\\(\\text{pH} = -\\log[\\text{H}^+]\\); pH below 7 is acidic, 7 neutral, above 7 basic; pH + pOH = 14.`,
    hint: 'pH is the exponent of the hydrogen-ion concentration, with the sign flipped.',
    gens: [
      rng => {
        const n = ri(rng, 1, 13);
        return {
          prompt: `A solution has ${M(`[\\text{H}^+] = 1 \\times 10^{-${n}}\\ \\text{M}`)}. What is its pH?`, answer: M(n),
          wrong: [[M(-n), 'pH = −log[H⁺], so the pH is positive.'], ...(14 - n !== n ? [[M(14 - n), 'That is the pOH (14 − pH).']] : []), [M(n + 1), 'Read the exponent carefully.'], [M(10 * n), 'pH is the exponent, not ten times it.']],
          steps: [`${M(`\\text{pH} = -\\log(10^{-${n}}) = ${n}`)}`]
        };
      },
      rng => {
        const p = pick(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
        const kind = p < 7 ? 'Acidic' : p > 7 ? 'Basic' : 'Neutral';
        const why = { Acidic: 'Acidic solutions have pH below 7.', Basic: 'Basic solutions have pH above 7.', Neutral: 'Only pH 7 is neutral.' };
        return choose(rng, `A solution has pH ${M(p)}. It is:`, kind,
          [...Object.keys(why).filter(k => k !== kind).map(k => [k, why[k]]), ['Saturated', 'Saturation describes how much solute is dissolved, not acidity.']], `pH ${p} is ${kind.toLowerCase()} (below 7 acidic, 7 neutral, above 7 basic).`);
      },
      rng => {
        const p = ri(rng, 2, 12);
        return {
          prompt: `A solution has pH ${M(p)}. What is its pOH?`, answer: M(14 - p),
          wrong: [[M(p), 'pOH is not equal to pH unless the pH is 7.'], [M(14 + p), 'Subtract from 14: pOH = 14 − pH.'], [M(7 - p), 'Use 14, not 7: pH + pOH = 14.']].filter(w => w[0] !== M(14 - p)),
          steps: [`${M(`\\text{pOH} = 14 - \\text{pH} = 14 - ${p} = ${14 - p}`)}`]
        };
      }
    ]
  };

  // ================================================================ General Physics 1
  S.PHA1 = {
    idea: 'Vectors have size and direction; perpendicular vectors combine by the Pythagorean theorem.',
    hint: `For perpendicular vectors, \\(R = \\sqrt{a^2 + b^2}\\).`,
    gens: [
      rng => {
        const [a, b, c] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]]);
        return {
          prompt: `A student walks ${unit(a, 'm')} east and then ${unit(b, 'm')} north. What is the size of the displacement?`, answer: unit(c, 'm'),
          wrong: [[unit(a + b, 'm'), 'That is the distance walked. Perpendicular displacements add by the Pythagorean theorem.'], [unit(Math.abs(a - b), 'm'), 'Subtract only when the vectors point in opposite directions.'], [unit(a * a + b * b, 'm'), 'Take the square root of a² + b².']],
          steps: [`${M(`R = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a + b * b}} = ${c}\\ \\text{m}`)}`]
        };
      },
      rng => {
        const v = pick(rng, [18, 36, 54, 72, 90, 108]);
        return {
          prompt: `Convert ${unit(v, 'km/h')} to meters per second.`, answer: unit(dec(v / 3.6), 'm/s'),
          wrong: [[unit(dec(v * 3.6), 'm/s'), 'Divide by 3.6 to go from km/h to m/s.'], [unit(dec(v * 1000 / 60), 'm/s'), 'One hour is 3600 seconds, not 60.'], [unit(dec(v / 36), 'm/s'), 'Divide by 3.6, not 36.']],
          steps: [`${M(`${v}\\ \\tfrac{\\text{km}}{\\text{h}} \\times \\frac{1000\\ \\text{m}}{3600\\ \\text{s}} = ${dec(v / 3.6)}\\ \\text{m/s}`)}`]
        };
      },
      rng => {
        const vec = pick(rng, ['velocity', 'displacement', 'force', 'acceleration']);
        const scalars = shuffle(rng, ['speed', 'distance', 'mass', 'time', 'temperature', 'energy']).slice(0, 4);
        return choose(rng, 'Which of these is a vector quantity?', vec.charAt(0).toUpperCase() + vec.slice(1),
          scalars.map(s => [s.charAt(0).toUpperCase() + s.slice(1), `${s.charAt(0).toUpperCase() + s.slice(1)} has size only, so it is a scalar.`]), `${vec.charAt(0).toUpperCase() + vec.slice(1)} has both size and direction.`);
      }
    ]
  };
  S.PHA2 = {
    idea: `For constant acceleration: \\(v = v_0 + at\\) and, from rest, \\(d = \\tfrac{1}{2}at^2\\).`,
    hint: 'List what you know (v₀, a, t), then pick the equation that has your unknown.',
    gens: [
      rng => {
        const u = ri(rng, 0, 10), a = ri(rng, 1, 5), t = ri(rng, 2, 8);
        return {
          prompt: `A car moving at ${unit(u, 'm/s')} speeds up at ${M(`${a}\\ \\text{m/s}^2`)} for ${unit(t, 's')}. What is its final velocity?`, answer: unit(u + a * t, 'm/s'),
          wrong: [[unit(u + a, 'm/s'), 'Multiply the acceleration by the time.'], [unit(a * t, 'm/s'), 'Add the initial velocity.'], [unit(u * a * t || a * t + 1, 'm/s'), 'Use v = v₀ + at.']],
          steps: [`${M(`v = v_0 + at = ${u} + ${a}(${t}) = ${u + a * t}\\ \\text{m/s}`)}`]
        };
      },
      rng => {
        const a = pick(rng, [2, 4, 6, 8, 10]), t = ri(rng, 2, 6);
        return {
          prompt: `An object starts from rest and accelerates at ${M(`${a}\\ \\text{m/s}^2`)}. How far does it travel in ${unit(t, 's')}?`, answer: unit(a * t * t / 2, 'm'),
          wrong: [[unit(a * t * t, 'm'), 'Use d = ½at²; you left out the ½.'], [unit(a * t / 2, 'm'), 'Square the time.'], [unit(a * t, 'm'), 'That is the final speed, not the distance.']],
          steps: [`${M(`d = \\tfrac{1}{2}at^2 = \\tfrac{1}{2}(${a})(${t})^2 = ${a * t * t / 2}\\ \\text{m}`)}`]
        };
      },
      rng => {
        // Realistic running speeds of 4–8 m/s.
        const d = pick(rng, [100, 200, 400, 800]), t = d / pick(rng, [4, 5, 8]);
        return {
          prompt: `A runner covers ${unit(d, 'm')} in ${unit(t, 's')}. What is the average speed?`, answer: unit(dec(d / t), 'm/s'),
          wrong: [[unit(d * t, 'm/s'), 'Divide distance by time; do not multiply.'], [unit(dec(t / d), 'm/s'), 'Speed is distance ÷ time, not time ÷ distance.'], [unit(d - t, 'm/s'), 'Speed is a ratio, found by division.']],
          steps: [`${M(`v = \\frac{d}{t} = \\frac{${d}}{${t}} = ${dec(d / t)}\\ \\text{m/s}`)}`]
        };
      }
    ]
  };
  S.PHA3 = {
    idea: 'First law: inertia. Second law: F = ma. Third law: equal and opposite forces act on different objects.',
    hint: 'Decide which law describes the situation, or use F = ma.',
    gens: [
      rng => {
        const m = ri(rng, 2, 20), a = ri(rng, 1, 6);
        return {
          prompt: `What net force is needed to accelerate a ${unit(m, 'kg')} box at ${M(`${a}\\ \\text{m/s}^2`)}?`, answer: unit(m * a, 'N'),
          wrong: [[unit(dec(m / a), 'N'), 'Multiply mass by acceleration: F = ma.'], [unit(m + a, 'N'), 'Force is mass times acceleration, not their sum.'], [unit(dec(a / m), 'N'), 'F = ma, not a ÷ m.']],
          steps: [`${M(`F = ma = ${m} \\times ${a} = ${m * a}\\ \\text{N}`)}`]
        };
      },
      rng => {
        const m = pick(rng, [2, 4, 5, 8, 10]), F = m * ri(rng, 2, 6);
        return {
          prompt: `A net force of ${unit(F, 'N')} acts on a ${unit(m, 'kg')} cart. What is its acceleration?`, answer: M(`${F / m}\\ \\text{m/s}^2`),
          wrong: [[M(`${F * m}\\ \\text{m/s}^2`), 'Divide force by mass: a = F/m.'], [M(`${dec(m / F)}\\ \\text{m/s}^2`), 'a = F ÷ m, not m ÷ F.'], [M(`${F - m}\\ \\text{m/s}^2`), 'Use division, not subtraction.'], [M(`${F + m}\\ \\text{m/s}^2`), 'Use division, not addition.']],
          steps: [`${M(`a = \\frac{F}{m} = \\frac{${F}}{${m}} = ${F / m}\\ \\text{m/s}^2`)}`]
        };
      },
      rng => {
        const [sit, law] = pick(rng, [['Passengers lurch forward when a jeepney stops suddenly.', 'First law (inertia)'], ['A rocket pushes gas backward and moves forward.', 'Third law (action–reaction)'],
          ['The same push accelerates an empty cart more than a full cart.', 'Second law (F = ma)'], ['A book on a table stays at rest unless something pushes it.', 'First law (inertia)'], ['When you push a wall, the wall pushes back on you.', 'Third law (action–reaction)']]);
        const laws = ['First law (inertia)', 'Second law (F = ma)', 'Third law (action–reaction)', 'Law of universal gravitation'];
        const why = { 'First law (inertia)': 'The first law is about objects keeping their state of motion.', 'Second law (F = ma)': 'The second law links force, mass and acceleration.', 'Third law (action–reaction)': 'The third law is about paired forces between two objects.', 'Law of universal gravitation': 'Gravitation describes attraction between masses.' };
        return choose(rng, `Which of Newton’s laws best explains this? “${sit}”`, law, laws.filter(l => l !== law).map(l => [l, why[l]]), why[law]);
      }
    ]
  };
  S.PHA4 = {
    idea: `\\(KE = \\tfrac{1}{2}mv^2\\), \\(PE = mgh\\), and momentum \\(p = mv\\).`,
    hint: 'Pick the formula for the quantity asked, and watch the squares.',
    gens: [
      rng => {
        const m = ri(rng, 1, 10), v = ri(rng, 2, 10);
        return {
          prompt: `What is the kinetic energy of a ${unit(m, 'kg')} ball moving at ${unit(v, 'm/s')}?`, answer: unit(dec(m * v * v / 2), 'J'),
          wrong: [[unit(m * v * v, 'J'), 'KE = ½mv²; you left out the ½.'], [unit(dec(m * v / 2), 'J'), 'Square the speed.'], [unit(m * v, 'J'), 'That is the momentum (mv), not kinetic energy.']],
          steps: [`${M(`KE = \\tfrac{1}{2}mv^2 = \\tfrac{1}{2}(${m})(${v})^2 = ${dec(m * v * v / 2)}\\ \\text{J}`)}`]
        };
      },
      rng => {
        const m = ri(rng, 1, 10), h = ri(rng, 2, 20);
        return {
          prompt: `What is the gravitational potential energy of a ${unit(m, 'kg')} object ${unit(h, 'm')} above the ground? (${M('g = 9.8\\ \\text{m/s}^2')})`, answer: unit(dec(m * 9.8 * h), 'J'),
          wrong: [[unit(m * h, 'J'), 'Multiply by g = 9.8 m/s² as well.'], [unit(dec(m * 9.8), 'J'), 'Multiply by the height too.'], [unit(dec(m * 9.8 * h / 2), 'J'), 'PE = mgh has no ½.']],
          steps: [`${M(`PE = mgh = ${m}(9.8)(${h}) = ${dec(m * 9.8 * h)}\\ \\text{J}`)}`]
        };
      },
      rng => {
        const m = ri(rng, 2, 60), v = ri(rng, 2, 12);
        return {
          prompt: `What is the momentum of a ${unit(m, 'kg')} cart moving at ${unit(v, 'm/s')}?`, answer: M(`${m * v}\\ \\text{kg}\\cdot\\text{m/s}`),
          wrong: [[M(`${dec(m * v * v / 2)}\\ \\text{kg}\\cdot\\text{m/s}`), 'That is the kinetic energy formula. Momentum is p = mv.'], [M(`${m + v}\\ \\text{kg}\\cdot\\text{m/s}`), 'Multiply mass by velocity.'], [M(`${dec(m / v)}\\ \\text{kg}\\cdot\\text{m/s}`), 'Multiply; do not divide.'],
            [M(`${m * v * v}\\ \\text{kg}\\cdot\\text{m/s}`), 'Momentum uses v, not v².'], [M(`${dec(m * v / 2)}\\ \\text{kg}\\cdot\\text{m/s}`), 'Momentum has no ½: p = mv.']],
          steps: [`${M(`p = mv = ${m} \\times ${v} = ${m * v}\\ \\text{kg}\\cdot\\text{m/s}`)}`]
        };
      }
    ]
  };

  // ================================================================ General Physics 2
  S.PHB1 = {
    idea: `Coulomb’s law: \\(F = k\\frac{q_1q_2}{r^2}\\); like charges repel, unlike charges attract.`,
    hint: 'Force follows the product of the charges and falls off with the square of the distance.',
    gens: [
      rng => {
        const k = pick(rng, [2, 3, 4]);
        const fr = d => (d === 1 ? 'F' : `\\frac{F}{${d}}`);
        return {
          prompt: `Two charges attract with force ${M('F')}. If the distance between them is multiplied by ${k}, what is the new force?`, answer: M(fr(k * k)),
          wrong: [[M(fr(k)), 'Coulomb’s law is inverse-square: divide by the square of the factor.'], [M(`${k}F`), 'Force decreases as the distance increases.'], [M(`${k * k}F`), 'The force gets weaker, not stronger, with distance.']],
          steps: [`${M('F \\propto \\frac{1}{r^2}')}`, `${M(`\\frac{1}{${k}^2} = \\frac{1}{${k * k}}`)}, so the new force is ${M(fr(k * k))}.`]
        };
      },
      rng => {
        const a = pick(rng, [2, 3]), b = pick(rng, [1, 2, 3]);
        return {
          prompt: `The force between two charges is ${M('F')}. One charge is multiplied by ${a} and the other by ${b}, with the distance unchanged. What is the new force?`, answer: M(`${a * b === 1 ? '' : a * b}F`),
          wrong: [[M(`${a + b}F`), 'Multiply the factors; force depends on the product of the charges.'], [M(`\\frac{F}{${a * b}}`), 'Larger charges give a larger force.'], [M(`${(a * b) ** 2}F`), 'Only distance appears squared in Coulomb’s law.'],
            [M(`${Math.max(a, b)}F`), 'Both charges changed, so multiply by both factors.'], [M('F'), 'Changing the charges changes the force.']].filter(w => w[0] !== M(`${a * b}F`)),
          steps: [`${M('F \\propto q_1q_2')}`, `${M(`${a} \\times ${b} = ${a * b}`)}, so the force becomes ${M(`${a * b}F`)}.`]
        };
      },
      rng => choose(rng, 'A balloon rubbed on hair becomes negatively charged. What happened?', 'Electrons moved from the hair to the balloon.',
        [['Protons moved from the balloon to the hair.', 'Protons stay in the nucleus; only electrons move when rubbing.'], ['The balloon created new electrons.', 'Charge is conserved; it is only transferred.'], ['Neutrons moved to the balloon.', 'Neutrons have no charge.']],
        'Charging by friction transfers electrons; the object that gains electrons becomes negative.')
    ]
  };
  S.PHB2 = {
    idea: 'Ohm’s law V = IR; series resistances add; in parallel, the total is smaller than any single branch.',
    hint: 'Write V = IR, then rearrange for the unknown.',
    gens: [
      rng => {
        const R = pick(rng, [2, 4, 5, 6, 10, 12, 20]), I = pick(rng, [0.5, 1, 1.5, 2, 3]), V = R * I;
        return {
          prompt: `A ${M(`${V}\\ \\text{V}`)} battery is connected across a ${M(`${R}\\ \\Omega`)} resistor. What current flows?`, answer: unit(dec(I), 'A'),
          wrong: [[unit(V * R, 'A'), 'Divide voltage by resistance: I = V/R.'], [unit(dec(R / V), 'A'), 'I = V ÷ R, not R ÷ V.'], [unit(V - R, 'A'), 'Use division (Ohm’s law), not subtraction.']],
          steps: [`${M(`I = \\frac{V}{R} = \\frac{${V}}{${R}} = ${dec(I)}\\ \\text{A}`)}`]
        };
      },
      rng => {
        const r = [ri(rng, 2, 10), ri(rng, 2, 10), ri(rng, 2, 10)];
        const sum = r[0] + r[1] + r[2];
        return {
          prompt: `Resistors of ${M(`${r[0]}\\ \\Omega`)}, ${M(`${r[1]}\\ \\Omega`)} and ${M(`${r[2]}\\ \\Omega`)} are connected in series. What is the total resistance?`, answer: M(`${sum}\\ \\Omega`),
          wrong: [[M(`${dec(1 / (1 / r[0] + 1 / r[1] + 1 / r[2]))}\\ \\Omega`), 'That is the parallel formula. In series, resistances simply add.'], [M(`${r[0] * r[1] * r[2]}\\ \\Omega`), 'Add the resistances; do not multiply.'], [M(`${Math.max(...r)}\\ \\Omega`), 'Every resistor in series adds to the total.']],
          steps: [`${M(`R_T = ${r[0]} + ${r[1]} + ${r[2]} = ${sum}\\ \\Omega`)}`]
        };
      },
      rng => {
        const R = pick(rng, [4, 6, 8, 10, 12, 20]);
        return {
          prompt: `Two identical ${M(`${R}\\ \\Omega`)} resistors are connected in parallel. What is the total resistance?`, answer: M(`${R / 2}\\ \\Omega`),
          wrong: [[M(`${2 * R}\\ \\Omega`), 'That is the series total. In parallel the total is smaller than either resistor.'], [M(`${R}\\ \\Omega`), 'Adding a parallel path lowers the total resistance.'], [M(`${R * R}\\ \\Omega`), 'Use 1/R_T = 1/R₁ + 1/R₂.']],
          steps: [`${M(`\\frac{1}{R_T} = \\frac{1}{${R}} + \\frac{1}{${R}} = \\frac{2}{${R}}`)}`, `${M(`R_T = ${R / 2}\\ \\Omega`)}`]
        };
      }
    ]
  };
  S.PHB3 = {
    idea: 'Moving charges make magnetic fields, and a changing magnetic field induces a current (Faraday’s law).',
    hint: 'Ask what is changing: a current, or a magnetic field through a coil.',
    pool: [
      I('A bar magnet is pushed into a coil connected to a galvanometer. What happens?', 'A current is induced in the coil while the magnet moves.',
        ['Nothing happens unless the coil has a battery.', 'A changing magnetic field induces current without a battery (Faraday’s law).'],
        ['The magnet loses all its magnetism.', 'The magnet keeps its magnetism.'],
        ['The coil becomes a permanent magnet.', 'The induced current stops when the magnet stops moving.'],
        'Changing the magnetic flux through the coil induces a voltage and current.'),
      I('Two like magnetic poles (north and north):', 'Repel each other',
        ['Attract each other', 'Unlike poles attract; like poles repel.'],
        ['Have no effect on each other', 'Magnetic poles always exert forces on each other.'],
        ['Cancel each other’s magnetism', 'The magnets keep their magnetism.'],
        'Like poles repel, unlike poles attract.'),
      I('Which device changes mechanical energy into electrical energy using electromagnetic induction?', 'Generator',
        ['Electric motor', 'A motor does the reverse: electrical to mechanical energy.'],
        ['Transformer', 'A transformer changes AC voltage; it does not convert mechanical energy.'],
        ['Battery', 'A battery converts chemical energy.'],
        'Turning a coil in a magnetic field induces a current.'),
      I('A step-up transformer has more turns in its secondary coil. It:', 'Increases the voltage',
        ['Increases the power', 'An ideal transformer cannot create power; voltage rises while current falls.'],
        ['Decreases the voltage', 'That is a step-down transformer.'],
        ['Works best on steady DC', 'Transformers need changing (AC) current.'],
        `\\(\\frac{V_s}{V_p} = \\frac{N_s}{N_p}\\): more secondary turns give a higher voltage.`),
      I('The magnetic field around a long straight wire carrying current:', 'Forms circles around the wire',
        ['Points straight away from the wire', 'The field lines circle the wire.'],
        ['Exists only at the ends of the wire', 'The field surrounds the whole length of the wire.'],
        ['Is zero', 'Every current produces a magnetic field.'],
        'Use the right-hand rule: thumb along the current, fingers curl along the field.')
    ]
  };
  S.PHB4 = {
    idea: `Wave speed \\(v = f\\lambda\\); light reflects, refracts and diffracts.`,
    hint: 'Write v = fλ and solve for the unknown.',
    gens: [
      rng => {
        const f = pick(rng, [2, 5, 10, 20, 50, 100]), l = pick(rng, [0.5, 1, 2, 3, 4]);
        return {
          prompt: `A wave has frequency ${unit(f, 'Hz')} and wavelength ${unit(l, 'm')}. What is its speed?`, answer: unit(dec(f * l), 'm/s'),
          wrong: [[unit(dec(f / l), 'm/s'), 'Multiply frequency by wavelength: v = fλ.'], [unit(dec(l / f), 'm/s'), 'v = f × λ, not λ ÷ f.'], [unit(dec(f + l), 'm/s'), 'Multiply; do not add.']],
          steps: [`${M(`v = f\\lambda = ${f} \\times ${l} = ${dec(f * l)}\\ \\text{m/s}`)}`]
        };
      },
      rng => {
        const v = pick(rng, [340, 330, 1500]), f = pick(rng, [10, 20, 50, 100]);
        return {
          prompt: `Sound travels at ${unit(v, 'm/s')}. What is the wavelength of a ${unit(f, 'Hz')} sound?`, answer: unit(dec(v / f), 'm'),
          wrong: [[unit(v * f, 'm'), 'λ = v ÷ f; do not multiply.'], [unit(dec(f / v), 'm'), 'λ = v ÷ f, not f ÷ v.'], [unit(v - f, 'm'), 'Use division, not subtraction.']],
          steps: [`${M(`\\lambda = \\frac{v}{f} = \\frac{${v}}{${f}} = ${dec(v / f)}\\ \\text{m}`)}`]
        };
      },
      rng => {
        const [desc, ans] = pick(rng, [['A straw looks bent in a glass of water.', 'Refraction'], ['You see your image in a still pond.', 'Reflection'],
          ['Sound is heard around the corner of a building.', 'Diffraction'], ['White light splits into colors through a prism.', 'Dispersion']]);
        const why = { Refraction: 'Refraction is bending when light changes medium.', Reflection: 'Reflection is light bouncing off a surface.', Diffraction: 'Diffraction is waves spreading around obstacles or through openings.', Dispersion: 'Dispersion is splitting light into colors by wavelength.' };
        return choose(rng, `Which wave behavior explains this? “${desc}”`, ans, Object.keys(why).filter(k => k !== ans).map(k => [k, why[k]]), why[ans]);
      }
    ]
  };

  return S;
};
