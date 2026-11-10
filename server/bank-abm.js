/*
 * NeuroLearn-X — ABM item bank: Organization and Management, FABM 1 and 2,
 * Applied Economics, Business Finance, Business Ethics and Social
 * Responsibility, Principles of Marketing. (Business Mathematics lives in
 * questions-tracks.js.) Applied Economics and Organization and Management
 * are also GAS subjects.
 */
'use strict';

module.exports = function abmBank(H) {
  const { ri, pick, shuffle, M, peso } = H;
  const dec = v => String(Math.round(v * 1000) / 1000);
  const I = (prompt, answer, w1, w2, w3, explain) => ({ prompt, answer, wrong: [w1, w2, w3], steps: [explain] });
  const choose = (rng, prompt, answer, candidates, explain) => ({ prompt, answer, wrong: shuffle(rng, candidates), steps: Array.isArray(explain) ? explain : [explain] });
  const k = n => n * 1000;
  const S = {};

  // ================================================================ Organization and Management
  S.OM1 = {
    idea: 'Management gets things done through people using four functions: planning, organizing, leading and controlling.',
    hint: 'Name the management function being described.',
    pool: [
      I('The four functions of management are:', 'Planning, organizing, leading and controlling',
        ['Buying, selling, saving and investing', 'Those are business activities, not management functions.'], ['Product, price, place and promotion', 'That is the marketing mix.'], ['Hiring, firing, paying and promoting', 'Those are parts of staffing only.'],
        'Henri Fayol’s functions, simplified into four.'),
      I('Setting goals and deciding how to reach them is:', 'Planning',
        ['Organizing', 'Organizing arranges tasks, people and resources.'], ['Leading', 'Leading motivates and directs people.'], ['Controlling', 'Controlling checks results against goals.'],
        'Planning comes first and guides the other functions.'),
      I('Comparing actual results with targets and correcting deviations is:', 'Controlling',
        ['Planning', 'Planning sets the targets.'], ['Organizing', 'Organizing arranges resources.'], ['Leading', 'Leading motivates people.'],
        'Controlling closes the loop back to planning.'),
      I('Top-level managers most need:', 'Conceptual skills to see the organization as a whole',
        ['Only technical skills', 'First-line managers rely most on technical skills.'], ['Only typing skills', 'Typing is not a management skill.'], ['No people skills', 'Human skills matter at every level.'],
        'Robert Katz: technical, human and conceptual skills.'),
      I('Management is best defined as:', 'Getting things done efficiently and effectively through and with people',
        ['Doing every task yourself', 'Managers work through others.'], ['Owning the company', 'Owners and managers can be different people.'], ['Making as many rules as possible', 'Rules are tools, not the purpose.'],
        'Efficiency = doing things right; effectiveness = doing the right things.')
    ]
  };
  S.OM2 = {
    idea: 'A firm works within internal and external environments; SWOT sorts strengths and weaknesses (internal) from opportunities and threats (external).',
    hint: 'Decide whether the factor is inside the firm (S/W) or outside it (O/T).',
    pool: [
      I('In SWOT analysis, a new competitor entering the market is a(n):', 'Threat',
        ['Weakness', 'Weaknesses are internal to the firm.'], ['Opportunity', 'A new competitor makes things harder, not easier.'], ['Strength', 'Strengths are internal advantages.'],
        'External negative factors are threats.'),
      I('A company’s highly skilled workforce is a(n):', 'Strength',
        ['Threat', 'Threats are external.'], ['Opportunity', 'Opportunities are external.'], ['Weakness', 'A skilled workforce is an advantage.'],
        'Internal positive factors are strengths.'),
      I('Which belongs to a firm’s external environment?', 'Government regulations',
        ['The company’s culture', 'Culture is internal.'], ['Employees’ skills', 'Employees are part of the internal environment.'], ['The internal budget', 'The budget is internal.'],
        'The external environment includes economic, political, social, technological and legal factors.'),
      I('Rising demand for eco-friendly products, for a firm that already uses recycled materials, is a(n):', 'Opportunity',
        ['Threat', 'It favors the firm.'], ['Weakness', 'It is outside the firm and positive.'], ['Strength', 'It is an external trend, not an internal trait.'],
        'External positive factors are opportunities.'),
      I('Organizational culture refers to:', 'Shared values, beliefs and practices within an organization',
        ['The company’s products', 'Products are outputs, not culture.'], ['The office building', 'A building is a physical asset.'], ['The tax rate', 'Taxes are external.'],
        'Culture shapes how people behave at work.')
    ]
  };
  S.OM3 = {
    idea: 'Plans range from strategic (long-term) to operational (day-to-day); organizing sets up structure, chain of command and span of control.',
    hint: 'Match the planning or structure term with its meaning.',
    pool: [
      I('Long-term plans made by top management for the whole organization are:', 'Strategic plans',
        ['Operational plans', 'Operational plans are short-term and day-to-day.'], ['Tactical plans', 'Tactical plans are middle-level plans that carry out strategy.'], ['Contingency plans', 'Contingency plans are backups.'],
        'Strategic plans set overall direction.'),
      I('A backup plan to use if something goes wrong is a:', 'Contingency plan',
        ['Strategic plan', 'Strategic plans set long-term direction.'], ['Budget', 'A budget is a financial plan.'], ['Policy', 'A policy is a standing guide for decisions.'],
        'Contingency plans prepare for “what if” situations.'),
      I('A chart that shows an organization’s structure and reporting lines is an:', 'Organizational chart',
        ['Gantt chart', 'A Gantt chart schedules tasks over time.'], ['Pie chart', 'A pie chart shows parts of a whole.'], ['Flowchart', 'A flowchart shows the steps of a process.'],
        'It shows who reports to whom.'),
      I('The number of employees a manager directly supervises is the:', 'Span of control',
        ['Chain of command', 'The chain of command is the line of authority.'], ['Delegation', 'Delegation is assigning authority to others.'], ['Departmentalization', 'Departmentalization groups jobs into units.'],
        'Wide spans mean flatter organizations.'),
      I('The principle that each employee reports to only one supervisor is:', 'Unity of command',
        ['Span of control', 'That is how many people a manager supervises.'], ['Division of labor', 'That splits work into specialized tasks.'], ['Centralization', 'That concentrates decision-making at the top.'],
        'It avoids conflicting orders.')
    ]
  };
  S.OM4 = {
    idea: 'Staffing fills jobs, leading motivates people (Maslow, Herzberg) and controlling measures performance against standards.',
    hint: 'Recall the motivation theories and leadership styles.',
    pool: [
      I('In Maslow’s hierarchy of needs, the highest level is:', 'Self-actualization',
        ['Esteem', 'Esteem is just below self-actualization.'], ['Safety', 'Safety is a lower need.'], ['Physiological', 'Physiological needs are the base.'],
        'Physiological, safety, belonging, esteem, self-actualization.'),
      I('In Herzberg’s two-factor theory, which is a hygiene factor?', 'Salary',
        ['Recognition', 'Recognition is a motivator.'], ['Achievement', 'Achievement is a motivator.'], ['Responsibility', 'Responsibility is a motivator.'],
        'Hygiene factors prevent dissatisfaction; motivators create satisfaction.'),
      I('A leader who makes decisions alone with little input from the team uses which style?', 'Autocratic',
        ['Democratic', 'A democratic leader involves the team.'], ['Laissez-faire', 'A laissez-faire leader leaves decisions to the team.'], ['Transformational', 'A transformational leader inspires change.'],
        'Autocratic leadership can be fast but may lower morale.'),
      I('Recruitment is:', 'Attracting qualified applicants for a job',
        ['Choosing the best applicant', 'That is selection.'], ['Training new employees', 'That is training and development.'], ['Evaluating performance', 'That is performance appraisal.'],
        'Recruitment comes before selection.'),
      I('The controlling process begins with:', 'Setting performance standards',
        ['Firing employees', 'Firing is not part of the control process.'], ['Measuring sales only', 'Measurement comes after standards are set.'], ['Ignoring results', 'Control compares results with standards.'],
        'Set standards, measure performance, compare, then correct.')
    ]
  };

  // ================================================================ FABM 1
  S.FA1 = {
    idea: 'Accounting identifies, records and communicates financial information to internal and external users.',
    hint: 'Ask who uses the information and why.',
    pool: [
      I('Accounting is:', 'The process of identifying, recording and communicating financial information',
        ['Only counting cash', 'Accounting covers far more than cash.'], ['Selling products', 'That is sales.'], ['Hiring employees', 'That is human resources.'],
        'It is called the language of business.'),
      I('Which is an external user of financial statements?', 'A bank deciding whether to lend',
        ['The company’s managers', 'Managers are internal users.'], ['Department heads', 'Department heads are internal users.'], ['The internal auditor', 'Internal auditors work inside the company.'],
        'External users include creditors, investors and government.'),
      I('The branch of accounting that prepares reports mainly for external users is:', 'Financial accounting',
        ['Management accounting', 'Management accounting serves internal decision-makers.'], ['Tax accounting', 'Tax accounting prepares tax returns.'], ['Auditing', 'Auditing examines financial records.'],
        'Financial statements follow accounting standards (PFRS).'),
      I('A business owned by one person is a:', 'Sole proprietorship',
        ['Partnership', 'A partnership has two or more owners.'], ['Corporation', 'A corporation is a separate legal entity owned by stockholders.'], ['Cooperative', 'A cooperative is owned by its members.'],
        'The owner has unlimited liability.'),
      I('Keeping business records separate from the owner’s personal records follows which concept?', 'Separate entity concept',
        ['Going concern', 'Going concern assumes the business will keep operating.'], ['Time period', 'Time period divides the business life into periods.'], ['Matching principle', 'Matching pairs expenses with the revenues they help earn.'],
        'The business is treated as distinct from its owner.')
    ]
  };
  S.FA2 = {
    idea: 'Assets = Liabilities + Owner’s Equity, and every transaction keeps it balanced.',
    hint: 'Write A = L + E and solve for the missing part.',
    gens: [
      rng => {
        const L = k(ri(rng, 10, 90)), E = k(ri(rng, 10, 90)), A = L + E;
        const ask = pick(rng, ['A', 'L', 'E']);
        const q = { A: `Liabilities are ${peso(L)} and owner’s equity is ${peso(E)}. What are the total assets?`, L: `Total assets are ${peso(A)} and owner’s equity is ${peso(E)}. What are the total liabilities?`, E: `Total assets are ${peso(A)} and liabilities are ${peso(L)}. What is the owner’s equity?` }[ask];
        const ans = { A, L, E }[ask];
        const other = { A: [L, E], L: [A, E], E: [A, L] }[ask];
        return {
          prompt: q, answer: peso(ans),
          wrong: [[peso(ask === 'A' ? Math.abs(L - E) : other[0] + other[1]), ask === 'A' ? 'Assets are the sum of liabilities and equity.' : 'Subtract: the missing part is assets minus the known part.'],
            [peso(other[0]), 'That is one of the given amounts; use the equation.'], [peso(other[1]), 'That is one of the given amounts; use the equation.']],
          steps: [`${M('A = L + E')}`, ask === 'A' ? `${M(`A = ${L} + ${E} = ${A}`)}` : ask === 'L' ? `${M(`L = A - E = ${A} - ${E} = ${L}`)}` : `${M(`E = A - L = ${A} - ${L} = ${E}`)}`]
        };
      },
      rng => {
        const amt = k(ri(rng, 5, 80));
        const [tx, effect] = pick(rng, [[`The owner invests ${peso(amt)} cash in the business.`, 'Assets increase and owner’s equity increases'],
          [`The business buys equipment on account for ${peso(amt)}.`, 'Assets increase and liabilities increase'],
          [`The business pays ${peso(amt)} of its accounts payable.`, 'Assets decrease and liabilities decrease'],
          [`The business buys supplies for ${peso(amt)} cash.`, 'One asset increases and another asset decreases'],
          [`The business pays ${peso(amt)} for rent expense.`, 'Assets decrease and owner’s equity decreases']]);
        const why = {
          'Assets increase and owner’s equity increases': 'That happens when the owner invests or the business earns revenue.',
          'Assets increase and liabilities increase': 'That happens when the business acquires something on credit or borrows.',
          'Assets decrease and liabilities decrease': 'That happens when the business pays a debt.',
          'One asset increases and another asset decreases': 'That happens when one asset is exchanged for another.',
          'Assets decrease and owner’s equity decreases': 'That happens with expenses or owner withdrawals.'
        };
        return choose(rng, `${tx} What is the effect on the accounting equation?`, effect, Object.keys(why).filter(x => x !== effect).map(x => [x, why[x]]), `${why[effect]} The equation stays balanced.`);
      }
    ]
  };
  const ACCOUNTS = [['Cash', 'Asset'], ['Accounts Receivable', 'Asset'], ['Equipment', 'Asset'], ['Supplies', 'Asset'], ['Accounts Payable', 'Liability'], ['Notes Payable', 'Liability'],
    ['Owner, Capital', 'Owner’s equity'], ['Service Revenue', 'Revenue'], ['Rent Expense', 'Expense'], ['Salaries Expense', 'Expense'], ['Utilities Expense', 'Expense']];
  const NORMAL = { Asset: 'Debit', Liability: 'Credit', 'Owner’s equity': 'Credit', Revenue: 'Credit', Expense: 'Debit' };
  S.FA3 = {
    idea: 'Assets and expenses have normal debit balances; liabilities, owner’s equity and revenue have normal credit balances.',
    hint: 'Classify the account first, then recall its normal balance.',
    gens: [
      rng => {
        const [acct, type] = pick(rng, ACCOUNTS);
        const why = { Asset: 'Assets are resources the business owns.', Liability: 'Liabilities are amounts the business owes.', 'Owner’s equity': 'Owner’s equity is the owner’s claim on assets.', Revenue: 'Revenue is income earned from operations.', Expense: 'Expenses are costs used up to earn revenue.' };
        return choose(rng, `How is the account “${acct}” classified?`, type, Object.keys(why).filter(t => t !== type).map(t => [t, `Not this one: ${why[t]}`]), why[type]);
      },
      rng => {
        const [acct, type] = pick(rng, ACCOUNTS), nb = NORMAL[type];
        return choose(rng, `What is the normal balance of “${acct}”?`, nb,
          [[nb === 'Debit' ? 'Credit' : 'Debit', `${type === 'Owner’s equity' ? 'Owner’s equity' : `${type} accounts`} increase on the ${nb.toLowerCase()} side.`], ['It has no normal balance', 'Every account has a normal balance on its increase side.'], ['It changes every month', 'The normal balance does not change.']],
          `${acct} is ${type === 'Asset' || type === 'Expense' ? 'an' : 'a'} ${type.toLowerCase()} account, which increases with a ${nb.toLowerCase()}.`);
      }
    ]
  };
  S.FA4 = {
    idea: 'The accounting cycle: analyze, journalize, post, trial balance, adjust, prepare statements, close.',
    hint: 'Put the steps of the accounting cycle in order.',
    pool: [
      I('The first step of the accounting cycle is:', 'Analyzing business transactions',
        ['Preparing financial statements', 'Statements come near the end.'], ['Posting to the ledger', 'Posting comes after journalizing.'], ['Recording closing entries', 'Closing is the last step.'],
        'Each transaction is analyzed for its effect before it is recorded.'),
      I('The “book of original entry” is the:', 'Journal',
        ['Ledger', 'The ledger is the book of final entry.'], ['Trial balance', 'A trial balance lists account balances.'], ['Worksheet', 'A worksheet helps prepare statements.'],
        'Transactions are first recorded in the journal.'),
      I('Transferring journal entries to the ledger accounts is called:', 'Posting',
        ['Journalizing', 'Journalizing records transactions in the journal.'], ['Closing', 'Closing resets temporary accounts.'], ['Adjusting', 'Adjusting updates accounts at period end.'],
        'Posting sorts entries by account.'),
      I('A trial balance is prepared to:', 'Check that total debits equal total credits',
        ['Compute the owner’s taxes', 'That is tax accounting.'], ['Record new transactions', 'Transactions are recorded in the journal.'], ['Replace the financial statements', 'It is a working tool, not a statement.'],
        'Equal totals show the ledger is in balance.'),
      I(`The owner invests ${peso(50000)} cash in the business. The journal entry is:`, 'Debit Cash; credit Owner, Capital',
        ['Debit Owner, Capital; credit Cash', 'That reverses the entry; cash (an asset) increases with a debit.'], ['Debit Cash; credit Service Revenue', 'An owner’s investment is not revenue.'], ['Debit Cash; credit Accounts Payable', 'The business owes nothing to a creditor here.'],
        'Cash increases (debit) and the owner’s capital increases (credit).')
    ]
  };

  // ================================================================ FABM 2
  S.FB1 = {
    idea: 'The statement of financial position shows assets, liabilities and equity, split into current (within one year) and non-current.',
    hint: 'Current means expected to be used or settled within one year.',
    gens: [
      rng => {
        const cash = k(ri(rng, 10, 60)), ar = k(ri(rng, 5, 40)), eq = k(ri(rng, 50, 200)), ap = k(ri(rng, 5, 50));
        const total = cash + ar + eq;
        return {
          prompt: `A business has Cash ${peso(cash)}, Accounts Receivable ${peso(ar)}, Equipment ${peso(eq)} and Accounts Payable ${peso(ap)}. What are its total assets?`,
          answer: peso(total),
          wrong: [[peso(cash + ar), 'Equipment is also an asset (non-current).'], [peso(total + ap), 'Accounts payable is a liability, not an asset.'], [peso(total - ap), 'That is the owner’s equity (assets minus liabilities).']],
          steps: [`Assets: Cash, Accounts Receivable and Equipment.`, `${M(`${cash} + ${ar} + ${eq} = ${total}`)}, so ${peso(total)}.`]
        };
      },
      rng => {
        const [item, cls] = pick(rng, [['Cash', 'Current asset'], ['Accounts receivable', 'Current asset'], ['Land', 'Non-current asset'], ['Equipment', 'Non-current asset'],
          ['Accounts payable', 'Current liability'], ['Salaries payable', 'Current liability'], ['A bank loan payable in five years', 'Non-current liability']]);
        const why = { 'Current asset': 'Current assets are used or turned into cash within one year.', 'Non-current asset': 'Non-current assets are used for more than one year.', 'Current liability': 'Current liabilities are due within one year.', 'Non-current liability': 'Non-current liabilities are due after more than one year.' };
        return choose(rng, `How is “${item}” classified on the statement of financial position?`, cls, Object.keys(why).filter(c => c !== cls).map(c => [c, `Not this one: ${why[c]}`]), why[cls]);
      }
    ]
  };
  S.FB2 = {
    idea: 'Net income = revenues − expenses; for a merchandiser, gross profit = net sales − cost of goods sold.',
    hint: 'Subtract all expenses from total revenue.',
    gens: [
      rng => {
        const R = k(ri(rng, 80, 300)), ex = [k(ri(rng, 10, 60)), k(ri(rng, 5, 40)), k(ri(rng, 5, 30))], tot = ex[0] + ex[1] + ex[2], NI = R - tot;
        const show = v => (v >= 0 ? `Net income of ${peso(v)}` : `Net loss of ${peso(-v)}`);
        return {
          prompt: `Service revenue is ${peso(R)}. Expenses: salaries ${peso(ex[0])}, rent ${peso(ex[1])}, utilities ${peso(ex[2])}. What is the result for the period?`,
          answer: show(NI),
          wrong: [[show(R), 'Subtract the expenses from the revenue.'], [show(R + tot), 'Expenses are subtracted, not added.'], [show(R - ex[0]), 'Subtract all the expenses, not just salaries.']],
          steps: [`Total expenses: ${M(`${ex[0]} + ${ex[1]} + ${ex[2]} = ${tot}`)}.`, `${M(`${R} - ${tot} = ${NI}`)}, so ${show(NI).toLowerCase()}.`]
        };
      },
      rng => {
        const sales = k(ri(rng, 100, 400)), cogs = k(ri(rng, 40, 90));
        return {
          prompt: `Net sales are ${peso(sales)} and the cost of goods sold is ${peso(cogs)}. What is the gross profit?`, answer: peso(sales - cogs),
          wrong: [[peso(sales + cogs), 'Gross profit subtracts cost of goods sold from sales.'], [peso(cogs), 'That is the cost of goods sold itself.'], [peso(sales), 'Deduct the cost of goods sold.']],
          steps: [`${M(`${sales} - ${cogs} = ${sales - cogs}`)}, so ${peso(sales - cogs)}.`]
        };
      }
    ]
  };
  S.FB3 = {
    idea: 'Cash flows are operating, investing or financing; ratios such as the current ratio (current assets ÷ current liabilities) test liquidity.',
    hint: 'Operating = daily business; investing = long-term assets; financing = owners and lenders.',
    gens: [
      rng => {
        const cl = k(ri(rng, 20, 80)), r = pick(rng, [1.5, 2, 2.5, 3, 1.25]), ca = cl * r;
        return {
          prompt: `Current assets are ${peso(ca)} and current liabilities are ${peso(cl)}. What is the current ratio?`, answer: M(`${dec(r)} : 1`),
          wrong: [[M(`${dec(cl / ca)} : 1`), 'Divide current assets by current liabilities, not the other way round.'], [M(`${dec(ca - cl)} : 1`), 'A ratio is found by division, not subtraction.'], [M(`${dec(r + 1)} : 1`), 'Recheck the division.']],
          steps: [`${M(`\\frac{${ca}}{${cl}} = ${dec(r)}`)}`, `So the current ratio is ${M(`${dec(r)} : 1`)}.`]
        };
      },
      rng => {
        const [act, cat] = pick(rng, [['Paying employees’ salaries', 'Operating activity'], ['Collecting cash from customers', 'Operating activity'], ['Buying equipment', 'Investing activity'],
          ['Selling land owned by the business', 'Investing activity'], ['Borrowing from a bank', 'Financing activity'], ['The owner investing cash', 'Financing activity'], ['Repaying a bank loan', 'Financing activity']]);
        const why = { 'Operating activity': 'Operating cash flows come from day-to-day business.', 'Investing activity': 'Investing cash flows involve buying or selling long-term assets.', 'Financing activity': 'Financing cash flows involve owners and lenders.' };
        return choose(rng, `In the statement of cash flows, “${act}” is a(n):`, cat,
          [...Object.keys(why).filter(c => c !== cat).map(c => [c, `Not this one: ${why[c]}`]), ['Non-cash item', 'This transaction involves cash.']], why[cat]);
      }
    ]
  };
  S.FB4 = {
    idea: 'VAT in the Philippines is 12%; a bank reconciliation matches the bank statement with the cash book.',
    hint: 'For VAT-exclusive prices multiply by 12%; for VAT-inclusive prices take 12/112.',
    gens: [
      rng => {
        const p = ri(rng, 2, 50) * 100;
        return {
          prompt: `An item sells for ${peso(p)} before VAT. How much is the 12% VAT?`, answer: peso(p * 0.12),
          wrong: [[peso(p * 1.12), 'That is the price including VAT.'], [peso(p * 12 / 112), 'Use 12/112 only when the price already includes VAT.'], [peso(p * 0.012), 'Twelve percent is 0.12, not 0.012.']],
          steps: [`${M(`${p} \\times 0.12 = ${dec(p * 0.12)}`)}, so the VAT is ${peso(p * 0.12)}.`]
        };
      },
      rng => {
        const p = ri(rng, 1, 40) * 112;
        return {
          prompt: `A receipt shows a VAT-inclusive total of ${peso(p)}. How much of it is VAT (12%)?`, answer: peso(p * 12 / 112),
          wrong: [[peso(p * 0.12), 'The total already includes VAT, so take 12/112 of it, not 12%.'], [peso(p - p * 0.12), 'That subtracts 12% of the total; use 12/112 instead.'], [peso(p * 112 / 100 - p), 'Do not add VAT again; it is already included.']],
          steps: [`${M(`${p} \\times \\frac{12}{112} = ${dec(p * 12 / 112)}`)}, so the VAT is ${peso(p * 12 / 112)}.`]
        };
      },
      rng => {
        const bank = k(ri(rng, 20, 90)), dit = k(ri(rng, 2, 15)), oc = k(ri(rng, 2, 15));
        return {
          prompt: `The bank statement shows ${peso(bank)}. There is a deposit in transit of ${peso(dit)} and an outstanding check of ${peso(oc)}. What is the adjusted bank balance?`,
          answer: peso(bank + dit - oc),
          wrong: [[peso(bank - dit + oc), 'Deposits in transit are added and outstanding checks are deducted.'], [peso(bank + dit + oc), 'Outstanding checks are deducted from the bank balance.'], [peso(bank), 'Adjust the bank balance for both items.']],
          steps: [`${M(`${bank} + ${dit} - ${oc} = ${bank + dit - oc}`)}, so ${peso(bank + dit - oc)}.`]
        };
      }
    ]
  };

  // ================================================================ Applied Economics
  S.AE1 = {
    idea: 'Scarcity forces choices; the opportunity cost of a choice is the value of the next best alternative given up.',
    hint: 'Ask what was given up to make the choice.',
    pool: [
      I('The basic economic problem is:', 'Scarcity: unlimited wants but limited resources',
        ['Too much money', 'Money is not the root problem.'], ['Too many goods', 'The problem is too few resources for all wants.'], ['Lack of wants', 'Wants are unlimited.'],
        'Scarcity forces every society to choose.'),
      I('Opportunity cost is:', 'The value of the next best alternative given up',
        ['The price paid in cash', 'Cash price is only part of the cost.'], ['The total of all alternatives', 'Only the next best one counts.'], ['A cost that is always zero', 'Every choice has an opportunity cost.'],
        'Choosing one thing means giving up another.'),
      I(`A student chooses to study instead of working a part-time job that pays ${peso(500)}. The opportunity cost of studying is:`, `The ${peso(500)} in wages given up`,
        ['Zero, because studying is free', 'The lost wages are a real cost.'], ['The cost of the textbook only', 'The wages given up are the next best alternative.'], ['The future salary from studying', 'That is a benefit, not the cost.'],
        'The next best alternative was working for ₱500.'),
      I('The three basic economic questions are:', 'What, how and for whom to produce',
        ['Who, where and when to buy', 'Those are not the basic questions.'], ['Why, how much and when to save', 'Those relate to saving.'], ['Which bank, which loan, which rate', 'Those relate to finance.'],
        'Every economy must answer these questions.'),
      I('Applied economics differs from theoretical economics because it:', 'Applies economic principles to real-world issues and decisions',
        ['Uses no data', 'Applied economics relies heavily on data.'], ['Ignores businesses', 'It often analyzes business decisions.'], ['Deals only with history', 'It addresses current issues.'],
        'It uses theory to solve practical problems.')
    ]
  };
  S.AE2 = {
    idea: 'Demand falls as price rises; supply rises as price rises; equilibrium is where quantity demanded equals quantity supplied.',
    hint: 'Decide whether the event affects buyers (demand) or sellers (supply).',
    gens: [
      rng => {
        const P = ri(rng, 10, 40), b = ri(rng, 1, 4), d = ri(rng, 1, 4), Q = ri(rng, 40, 120);
        const a = Q + b * P, c = Q - d * P;
        const qs = c === 0 ? `${d}P` : `${c} + ${d}P`;
        return {
          prompt: `Demand is ${M(`Q_d = ${a} - ${b}P`)} and supply is ${M(`Q_s = ${qs}`)}. What is the equilibrium price?`, answer: M(`P = ${P}`),
          wrong: [[M(`P = ${Q}`), 'That is the equilibrium quantity, not the price.'], [M(`P = ${P + 5}`), 'Set Qd equal to Qs and solve carefully.'], [M(`P = ${Math.round(a / b)}`), 'That is where demand hits zero; set Qd = Qs instead.']],
          steps: [`${M(`${a} - ${b}P = ${qs}`)}`, `${M(`${a - c} = ${b + d}P \\Rightarrow P = ${P}`)}`]
        };
      },
      rng => {
        const [sit, ans] = pick(rng, [['A typhoon destroys many rice farms.', 'Supply decreases (shifts left)'], ['New technology lowers the cost of making phones.', 'Supply increases (shifts right)'],
          ['A popular influencer promotes a drink.', 'Demand increases (shifts right)'], ['Consumers’ incomes fall (for a normal good).', 'Demand decreases (shifts left)'], ['The price of coffee rises sharply, so people look for substitutes like tea. (Market for tea)', 'Demand increases (shifts right)']]);
        const why = { 'Demand increases (shifts right)': 'Demand rises when buyers want more at every price.', 'Demand decreases (shifts left)': 'Demand falls when buyers want less at every price.', 'Supply increases (shifts right)': 'Supply rises when producing becomes easier or cheaper.', 'Supply decreases (shifts left)': 'Supply falls when producing becomes harder or costlier.' };
        return choose(rng, `What happens in the market? “${sit}”`, ans, Object.keys(why).filter(x => x !== ans).map(x => [x, `Not this one: ${why[x]}`]), why[ans]);
      }
    ]
  };
  S.AE3 = {
    idea: 'Price elasticity = % change in quantity ÷ % change in price; market structures range from perfect competition to monopoly.',
    hint: 'Elasticity above 1 is elastic; below 1 is inelastic.',
    gens: [
      rng => {
        const dp = pick(rng, [5, 10, 20, 25]), e = pick(rng, [0.4, 0.5, 1.5, 2, 3]), dq = dp * e;
        const kind = e > 1 ? 'elastic' : 'inelastic';
        return {
          prompt: `When the price of a good rises by ${M(`${dp}\\%`)}, the quantity demanded falls by ${M(`${dec(dq)}\\%`)}. What is the price elasticity of demand, and is demand elastic or inelastic?`,
          answer: `${M(dec(e))}, ${kind}`,
          wrong: [[`${M(dec(dp / dq))}, ${dp / dq > 1 ? 'elastic' : 'inelastic'}`, 'Divide the % change in quantity by the % change in price, not the reverse.'], [`${M(dec(e))}, ${kind === 'elastic' ? 'inelastic' : 'elastic'}`, 'Above 1 is elastic; below 1 is inelastic.'], [`${M(dec(dq - dp))}, ${kind}`, 'Elasticity is a ratio, found by division.']],
          steps: [`${M(`E = \\frac{${dec(dq)}\\%}{${dp}\\%} = ${dec(e)}`)}`, `${dec(e)} is ${e > 1 ? 'greater' : 'less'} than 1, so demand is ${kind}.`]
        };
      },
      rng => {
        const [desc, ans] = pick(rng, [['Many sellers offer identical products, like rice farmers in a big market.', 'Perfect competition'], ['One firm is the only seller, with no close substitutes.', 'Monopoly'],
          ['A few large firms dominate the market, like the telecommunications industry.', 'Oligopoly'], ['Many sellers offer similar but differentiated products, like milk tea shops.', 'Monopolistic competition']]);
        const why = { 'Perfect competition': 'Perfect competition has many sellers of identical products.', Monopoly: 'A monopoly has a single seller.', Oligopoly: 'An oligopoly has a few dominant firms.', 'Monopolistic competition': 'Monopolistic competition has many sellers of differentiated products.' };
        return choose(rng, `Which market structure is described? “${desc}”`, ans, Object.keys(why).filter(x => x !== ans).map(x => [x, `Not this one: ${why[x]}`]), why[ans]);
      }
    ]
  };
  S.AE4 = {
    idea: 'Inflation is the rise in the general price level, measured with the CPI; real income falls when prices rise faster than pay.',
    hint: 'Inflation rate = (new CPI − old CPI) ÷ old CPI × 100.',
    gens: [
      rng => {
        const c1 = pick(rng, [100, 120, 125, 150, 200]), r = pick(rng, [2, 4, 5, 6, 8, 10]), c2 = c1 * (1 + r / 100);
        return {
          prompt: `The consumer price index rose from ${M(c1)} to ${M(dec(c2))}. What is the inflation rate?`, answer: M(`${r}\\%`),
          wrong: [[M(`${dec(c2 - c1)}\\%`), 'Divide the change by the old CPI, then multiply by 100.'], [M(`${dec(100 * (c2 - c1) / c2)}\\%`), 'Divide by the old CPI, not the new one.'], [M(`${dec(100 * c2 / c1)}\\%`), 'Subtract the old CPI first to get the change.']],
          steps: [`${M(`\\frac{${dec(c2)} - ${c1}}{${c1}} \\times 100 = ${r}\\%`)}`]
        };
      },
      rng => {
        const w = pick(rng, [3, 4, 5, 6]), inf = pick(rng, [2, 4, 6, 7, 8]);
        if (w === inf) return S.AE4.gens[0](rng);
        const real = w - inf;
        const ans = real > 0 ? `Real wage rises by about ${real}%` : `Real wage falls by about ${-real}%`;
        return choose(rng, `A worker’s pay rises by ${M(`${w}\\%`)} while inflation is ${M(`${inf}\\%`)}. What happens to the real wage?`, ans,
          [[real > 0 ? `Real wage falls by about ${real}%` : `Real wage rises by about ${-real}%`, 'Compare the pay increase with inflation: real change ≈ pay change − inflation.'], [`Real wage rises by about ${w}%`, 'Inflation reduces what the pay can buy.'], ['Real wage stays the same', 'It only stays the same if pay grows exactly as fast as prices.'],
            [`Real wage falls by about ${inf}%`, 'The real change is pay growth minus inflation, not inflation alone.'], [`Real wage rises by about ${w + inf}%`, 'Inflation is subtracted, not added.']],
          `Real change ≈ ${w}% − ${inf}% = ${real}%.`);
      },
      rng => choose(rng, 'In the Philippines, regional minimum wages are set by:', 'The Regional Tripartite Wages and Productivity Boards',
        [['The Bangko Sentral ng Pilipinas', 'The BSP manages monetary policy, not wages.'], ['Each employer alone', 'Minimum wages are set by law, not by employers alone.'], ['The Commission on Elections', 'COMELEC runs elections.']],
        'The RTWPBs set minimum wages for each region.')
    ]
  };

  // ================================================================ Business Finance
  S.BF1 = {
    idea: 'Financial management plans, raises and invests funds to increase the value of the firm.',
    hint: 'Think about the three main decisions: investing, financing and dividends.',
    pool: [
      I('The main goal of financial management in a corporation is to:', 'Maximize the owners’ wealth (the value of the firm)',
        ['Maximize the number of employees', 'Workforce size is not the goal.'], ['Avoid all risk', 'Some risk is needed to earn returns.'], ['Pay as little tax as possible by any means', 'Illegal tax avoidance is not acceptable.'],
        'Value maximization considers both return and risk.'),
      I('Deciding which long-term assets to invest in is the:', 'Investment (capital budgeting) decision',
        ['Financing decision', 'The financing decision is about how to raise funds.'], ['Dividend decision', 'The dividend decision is about distributing profits.'], ['Working capital decision', 'Working capital is about short-term assets and liabilities.'],
        'Capital budgeting evaluates long-term projects.'),
      I('Banks, insurance companies and the stock exchange are examples of:', 'Financial institutions and markets',
        ['Government agencies only', 'Most of these are private.'], ['Manufacturing firms', 'They provide financial services, not goods.'], ['Non-profit charities', 'They are mostly for-profit.'],
        'They channel funds from savers to users.'),
      I('The Bangko Sentral ng Pilipinas mainly:', 'Manages monetary policy and supervises banks',
        ['Collects income taxes', 'The BIR collects taxes.'], ['Approves stock offerings', 'The SEC regulates securities.'], ['Prepares the national budget', 'The DBM prepares the budget.'],
        'The BSP aims for price stability.'),
      I('Compared with the capital market, the money market deals with:', 'Short-term funds of one year or less',
        ['Only long-term bonds', 'Long-term securities trade in the capital market.'], ['Physical goods', 'Financial markets trade claims, not goods.'], ['Only foreign currency', 'Foreign exchange is a separate market.'],
        'Treasury bills are a money market instrument.')
    ]
  };
  S.BF2 = {
    idea: 'Budgets and forecasts plan cash and profit: ending cash = beginning cash + receipts − disbursements; break-even = fixed costs ÷ unit contribution margin.',
    hint: 'Write the budget formula, then substitute.',
    gens: [
      rng => {
        const B = k(ri(rng, 10, 50)), R = k(ri(rng, 30, 120)), Dd = k(ri(rng, 20, 110));
        return {
          prompt: `Beginning cash is ${peso(B)}, expected cash receipts are ${peso(R)} and expected disbursements are ${peso(Dd)}. What is the ending cash balance?`,
          answer: peso(B + R - Dd),
          wrong: [[peso(B + R + Dd), 'Disbursements are cash going out; subtract them.'], [peso(R - Dd), 'Include the beginning cash balance.'], [peso(B - R + Dd), 'Receipts are added and disbursements subtracted.']],
          steps: [`${M(`${B} + ${R} - ${Dd} = ${B + R - Dd}`)}, so ${peso(B + R - Dd)}.`]
        };
      },
      rng => {
        // Variable cost must differ from the contribution margin, or two options coincide.
        let P, V;
        do { P = pick(rng, [50, 80, 100, 120, 150]); V = P - pick(rng, [20, 25, 30, 40]); } while (V === P - V);
        const F = (P - V) * ri(rng, 100, 900);
        return {
          prompt: `A product sells for ${peso(P)} with a variable cost of ${peso(V)} per unit. Fixed costs are ${peso(F)}. How many units must be sold to break even?`,
          answer: `${(F / (P - V)).toLocaleString('en-US')} units`,
          wrong: [[`${Math.round(F / P).toLocaleString('en-US')} units`, 'Divide by the contribution margin (price − variable cost), not the price.'], [`${Math.round(F / V).toLocaleString('en-US')} units`, 'Divide by price minus variable cost.'], [`${(F / (P - V) * 2).toLocaleString('en-US')} units`, 'Recheck the division.']],
          steps: [`Contribution margin: ${M(`${P} - ${V} = ${P - V}`)} per unit.`, `${M(`\\frac{${F}}{${P - V}} = ${F / (P - V)}`)} units.`]
        };
      }
    ]
  };
  S.BF3 = {
    idea: `Money today is worth more than money later: \\(FV = PV(1 + r)^n\\) and \\(PV = \\frac{FV}{(1 + r)^n}\\).`,
    hint: 'Grow a present amount with (1 + r)ⁿ; discount a future amount by dividing by it.',
    gens: [
      rng => {
        const PV = k(ri(rng, 5, 50)), r = pick(rng, [5, 10]), n = pick(rng, [1, 2, 3]), FV = PV * (1 + r / 100) ** n;
        return {
          prompt: `${peso(PV)} is invested at ${M(`${r}\\%`)} compounded annually for ${n} year${n > 1 ? 's' : ''}. What is the future value?`, answer: peso(FV),
          wrong: [[peso(PV * (1 + r * n / 100)), 'That is simple interest; compound interest earns interest on interest.'], [peso(FV - PV), 'That is only the interest earned.'], [peso(PV * (1 + r / 100) ** (n + 1)), `Use n = ${n} years.`]],
          steps: [`${M(`FV = ${PV}(1 + ${r / 100})^{${n}}`)}`, `So ${peso(FV)}.`]
        };
      },
      rng => {
        const r = pick(rng, [5, 10]), n = pick(rng, [1, 2]), PV = k(ri(rng, 5, 40)), FV = PV * (1 + r / 100) ** n;
        return {
          prompt: `How much must be deposited today at ${M(`${r}\\%`)} compounded annually to have ${peso(FV)} in ${n} year${n > 1 ? 's' : ''}?`, answer: peso(PV),
          wrong: [[peso(FV * (1 + r / 100) ** n), 'Divide by (1 + r)ⁿ to discount; do not multiply.'], [peso(FV), 'Money grows over time, so you need less today.'], [peso(FV * (1 - r * n / 100)), 'Discount with (1 + r)ⁿ, not by subtracting simple interest.']],
          steps: [`${M(`PV = \\frac{FV}{(1 + r)^n} = \\frac{${dec(FV)}}{(1 + ${r / 100})^{${n}}}`)}`, `So ${peso(PV)}.`]
        };
      }
    ]
  };
  S.BF4 = {
    idea: 'Firms raise funds through debt (borrowing) or equity (ownership); higher expected return usually comes with higher risk.',
    hint: 'Ask whether the funds must be repaid (debt) or give ownership (equity).',
    pool: [
      I('Issuing shares of stock is a form of:', 'Equity financing',
        ['Debt financing', 'Debt is borrowing that must be repaid with interest.'], ['Trade credit', 'Trade credit is buying from suppliers on account.'], ['Leasing', 'Leasing is renting an asset.'],
        'Shareholders become part-owners of the firm.'),
      I('A bank loan that must be repaid with interest is:', 'Debt financing',
        ['Equity financing', 'Equity gives ownership and need not be repaid.'], ['Retained earnings', 'Retained earnings are internal funds.'], ['A grant', 'Grants usually need not be repaid.'],
        'Interest is the cost of debt.'),
      I('Trade credit means:', 'Buying from suppliers now and paying them later',
        ['Selling shares to the public', 'That is equity financing.'], ['Borrowing from a bank', 'That is a bank loan.'], ['Paying in advance', 'Trade credit delays payment.'],
        'It is a common short-term source of funds.'),
      I('The risk–return trade-off says that:', 'Investments with higher expected returns usually carry higher risk',
        ['Higher returns always mean lower risk', 'It is the reverse.'], ['Risk and return are unrelated', 'They are closely related.'], ['All investments have the same risk', 'Risk differs widely.'],
        'Investors demand more return for bearing more risk.'),
      I('Diversification lowers risk by:', 'Spreading investments across different assets',
        ['Putting all money in one stock', 'That concentrates risk.'], ['Avoiding all investments', 'That gives up returns entirely.'], ['Borrowing more money', 'Borrowing raises risk.'],
        '“Don’t put all your eggs in one basket.”')
    ]
  };

  // ================================================================ Business Ethics and Social Responsibility
  S.BE1 = {
    idea: 'Utilitarianism weighs consequences, Kant’s deontology stresses duty, and virtue ethics asks what a good person would do.',
    hint: 'Ask whether the theory focuses on results, duty or character.',
    pool: [
      I('Utilitarianism judges an action right if it:', 'Produces the greatest good for the greatest number',
        ['Follows duty regardless of results', 'That is deontology (Kant).'], ['Shows good character', 'That is virtue ethics.'], ['Benefits only oneself', 'That is ethical egoism.'],
        'Jeremy Bentham and John Stuart Mill developed utilitarianism.'),
      I('Immanuel Kant’s ethics focuses on:', 'Duty and moral rules that apply to everyone',
        ['Maximizing pleasure', 'That is utilitarianism.'], ['Personal profit', 'That is not Kant’s view.'], ['Following the majority', 'Kant relies on reason, not majority opinion.'],
        'Kant’s theory is called deontology.'),
      I('Virtue ethics, associated with Aristotle, asks:', 'What would a person of good character do?',
        ['Which action earns the most money?', 'That is not an ethical theory.'], ['What does the law require?', 'That is legal compliance.'], ['What does the boss want?', 'That is obedience.'],
        'Virtues such as honesty and courage guide action.'),
      I('Ethics is the study of:', 'What is morally right and wrong',
        ['How to earn the most profit', 'That is finance or economics.'], ['Laws only', 'Ethics goes beyond what is legal.'], ['Customer preferences', 'That is marketing.'],
        'Ethics examines moral principles and values.'),
      I('Kant’s rule to act only on principles you could want everyone to follow is the:', 'Categorical imperative',
        ['Golden mean', 'The golden mean is Aristotle’s virtue between extremes.'], ['Principle of utility', 'That is utilitarianism.'], ['Social contract', 'That is an agreement to form society.'],
        'It tests whether a rule could be universal.')
    ]
  };
  S.BE2 = {
    idea: 'Businesses owe ethical duties to all stakeholders, not only shareholders: honesty, fairness and avoiding conflicts of interest.',
    hint: 'Ask who is affected and whether anyone is deceived or treated unfairly.',
    pool: [
      I('Stakeholders are:', 'Everyone who affects or is affected by the business, such as employees, customers and the community',
        ['Only stockholders', 'Stockholders are one kind of stakeholder.'], ['Only managers', 'Managers are one group among many.'], ['Only competitors', 'Competitors are one group among many.'],
        'Stakeholder theory widens the firm’s responsibilities.'),
      I('A company hides a product defect to avoid recall costs. This mainly violates:', 'Honesty and responsibility to customers',
        ['Efficiency', 'The issue is ethics, not efficiency.'], ['Market share goals', 'The harm is to customer safety and trust.'], ['Brand design', 'Design is unrelated.'],
        'Concealing dangers puts customers at risk.'),
      I('Insider trading is:', 'Using confidential company information to trade stocks for personal gain',
        ['Trading only with insiders’ permission', 'Permission does not make it legal.'], ['Buying shares after public announcements', 'That uses public information.'], ['Saving money in a bank', 'That is not trading.'],
        'It is unfair to other investors and illegal.'),
      I('A conflict of interest occurs when:', 'Personal interests could improperly influence professional decisions',
        ['Two teams compete in sports', 'That is ordinary competition.'], ['Employees disagree about a plan', 'Disagreement is normal.'], ['A company has many products', 'That is product variety.'],
        'Example: hiring a relative’s firm without fair bidding.'),
      I('A whistleblower is:', 'An employee who reports wrongdoing in an organization',
        ['A referee in sports', 'In business ethics, the term refers to reporting misconduct.'], ['A marketing officer', 'That is a job title.'], ['A competitor’s spy', 'That is espionage.'],
        'Whistleblowers expose fraud or harm in the public interest.')
    ]
  };
  S.BE3 = {
    idea: 'Corporate social responsibility goes beyond profit: Carroll’s pyramid has economic, legal, ethical and philanthropic layers.',
    hint: 'Recall the four layers of Carroll’s pyramid, from the base up.',
    pool: [
      I('In Carroll’s CSR pyramid, the base (most fundamental) responsibility is:', 'Economic responsibility (being profitable)',
        ['Philanthropic responsibility', 'Philanthropy is at the top of the pyramid.'], ['Ethical responsibility', 'Ethics is the third layer.'], ['Legal responsibility', 'Legal duties are the second layer.'],
        'A business must survive to meet its other responsibilities.'),
      I('A company funding scholarships for local students mainly shows:', 'Philanthropic responsibility',
        ['Legal responsibility', 'No law requires this.'], ['Economic responsibility', 'It does not aim at profit.'], ['Unethical conduct', 'It is a positive contribution.'],
        'Philanthropy is voluntary giving to society.'),
      I('Following labor and environmental laws is a firm’s:', 'Legal responsibility',
        ['Philanthropic responsibility', 'Philanthropy is voluntary.'], ['Marketing strategy', 'Obeying the law is a duty, not a strategy.'], ['Economic responsibility', 'That concerns profitability.'],
        'Businesses must operate within the law.'),
      I('Corporate social responsibility means:', 'A business’s commitment to contribute to society and the environment beyond profit',
        ['Paying no taxes', 'CSR includes paying taxes fairly.'], ['Only advertising', 'Advertising is not CSR.'], ['Maximizing short-term profit at any cost', 'CSR balances profit with responsibility.'],
        'CSR considers the firm’s impact on stakeholders.'),
      I('The “triple bottom line” refers to:', 'People, planet and profit',
        ['Price, product and place', 'That resembles the marketing mix.'], ['Debt, equity and assets', 'That describes financial structure.'], ['Morning, noon and night shifts', 'That is scheduling.'],
        'Firms measure social, environmental and financial performance.')
    ]
  };
  S.BE4 = {
    idea: 'Philippine laws (Consumer Act, Data Privacy Act) and Filipino values guide ethical business; bribery and deception are wrong.',
    hint: 'Match the law or value with the issue described.',
    pool: [
      I('Which Philippine law protects consumers against deceptive and unfair sales practices?', 'Consumer Act of the Philippines (RA 7394)',
        ['RA 9262', 'RA 9262 is the Anti-Violence Against Women and Their Children Act.'], ['RA 10173', 'RA 10173 is the Data Privacy Act.'], ['RA 4373', 'RA 4373 regulates social work.'],
        'RA 7394 covers product safety, labeling and fair sales.'),
      I('A business that collects customers’ personal information must comply with the:', 'Data Privacy Act of 2012 (RA 10173)',
        ['Consumer Act (RA 7394)', 'The Consumer Act covers sales practices, not personal data.'], ['Labor Code', 'The Labor Code covers employment.'], ['Local Government Code', 'That covers local governments.'],
        'The National Privacy Commission enforces it.'),
      I('Fair trade aims to:', 'Pay producers fair prices and ensure decent working conditions',
        ['Lower prices by cutting wages', 'That is the opposite of fair trade.'], ['Ban all imports', 'Fair trade is about how trade is done.'], ['Help only large companies', 'It mainly helps small producers.'],
        'Fair trade supports small farmers and artisans.'),
      I('Giving a gift to a government official to win a contract is:', 'Bribery',
        ['Networking', 'Networking does not involve improper payments.'], ['Philanthropy', 'Philanthropy is giving without expecting favors.'], ['Marketing', 'Marketing promotes products openly.'],
        'Bribery corrupts fair decision-making and is illegal.'),
      I('In Filipino business culture, “palabra de honor” means:', 'Keeping one’s word and commitments',
        ['Avoiding confrontation at all costs', 'That relates to pakikisama.'], ['Repaying favors', 'That is utang na loob.'], ['Leaving things to fate', 'That is bahala na.'],
        'Trust built on one’s word is a valued business virtue.')
    ]
  };

  // ================================================================ Principles of Marketing
  S.MK1 = {
    idea: 'Marketing creates and delivers value to satisfy customer needs and wants profitably.',
    hint: 'Focus on the customer’s needs and the value exchanged.',
    pool: [
      I('Marketing is best described as:', 'Creating, communicating and delivering value to customers and building relationships',
        ['Only selling', 'Selling is one part of marketing.'], ['Only advertising', 'Advertising is one promotional tool.'], ['Only making products', 'Production is a separate function.'],
        'Marketing starts and ends with the customer.'),
      I('A need differs from a want because a need is:', 'A basic human requirement, while a want is shaped by culture and personality',
        ['Always more expensive', 'Cost does not define a need.'], ['Something advertised', 'Advertising creates wants, not needs.'], ['A luxury item', 'Luxuries are wants.'],
        'Hunger is a need; craving a particular burger is a want.'),
      I('The marketing concept says a firm succeeds by:', 'Finding and satisfying customer needs better than competitors',
        ['Producing as much as possible', 'That is the production concept.'], ['Pushing sales aggressively', 'That is the selling concept.'], ['Focusing only on product features', 'That is the product concept.'],
        'Customer focus drives the marketing concept.'),
      I('In marketing, an exchange is:', 'Obtaining something desired by offering something in return',
        ['Giving products away', 'An exchange involves something in return.'], ['Changing a product’s color', 'That is product modification.'], ['A currency rate', 'That is foreign exchange.'],
        'Exchange is the core idea of marketing.'),
      I('Customer value is:', 'The difference between the benefits a customer gets and the costs paid',
        ['The product’s price only', 'Price is only part of the cost.'], ['The company’s profit', 'Profit is the firm’s gain.'], ['The number of customers', 'That is market size.'],
        'Customers choose offers with the greatest perceived value.')
    ]
  };
  S.MK2 = {
    idea: 'The marketing mix (4Ps) is product, price, place and promotion.',
    hint: 'Decide which of the 4Ps the decision belongs to.',
    pool: [
      I('The 4Ps of the marketing mix are:', 'Product, price, place and promotion',
        ['People, planet, profit and purpose', 'That resembles the triple bottom line.'], ['Planning, organizing, leading and controlling', 'Those are management functions.'], ['Price, profit, payroll and permits', 'Those are not the 4Ps.'],
        'E. Jerome McCarthy popularized the 4Ps.'),
      I('Deciding to sell through sari-sari stores and online shops is a decision about:', 'Place (distribution)',
        ['Price', 'Price is what customers pay.'], ['Promotion', 'Promotion is communication.'], ['Product', 'Product is what is sold.'],
        'Place covers channels and locations.'),
      I('A buy-one-take-one offer for a limited time is part of:', 'Promotion (sales promotion)',
        ['Place', 'Place is about distribution.'], ['Product design', 'The product itself is unchanged.'], ['Market research', 'Research gathers information.'],
        'Sales promotions are short-term incentives.'),
      I('Setting a low introductory price to win many buyers quickly is:', 'Penetration pricing',
        ['Price skimming', 'Skimming starts with a high price.'], ['Cost-plus pricing', 'Cost-plus adds a markup to cost.'], ['Psychological pricing', 'That uses prices like ₱99.'],
        'Penetration pricing builds market share fast.'),
      I('Packaging and brand name are decisions about:', 'Product',
        ['Place', 'Place concerns distribution.'], ['Price', 'Price concerns what customers pay.'], ['Promotion', 'Promotion concerns communication.'],
        'Product decisions include features, design, brand and packaging.')
    ]
  };
  S.MK3 = {
    idea: 'Segment the market, target the best segments and position the product in customers’ minds; consumers move from need recognition to purchase.',
    hint: 'Match the step: segmentation divides, targeting chooses, positioning differentiates.',
    pool: [
      I('Dividing a market into groups with similar needs is:', 'Market segmentation',
        ['Targeting', 'Targeting chooses which segments to serve.'], ['Positioning', 'Positioning shapes the product’s image.'], ['Pricing', 'Pricing sets what customers pay.'],
        'Segmentation comes first in STP.'),
      I('Segmenting customers by age, gender and income is:', 'Demographic segmentation',
        ['Geographic segmentation', 'Geographic uses location.'], ['Psychographic segmentation', 'Psychographic uses lifestyle and values.'], ['Behavioral segmentation', 'Behavioral uses usage and loyalty.'],
        'Demographics are measurable population traits.'),
      I('Positioning means:', 'Creating a distinct place for the product in target customers’ minds',
        ['Placing products on store shelves', 'That is merchandising.'], ['Setting the price', 'That is pricing.'], ['Choosing the factory location', 'That is operations.'],
        'Example: a brand known for being the most affordable.'),
      I('Segmenting customers by lifestyle and values is:', 'Psychographic segmentation',
        ['Demographic segmentation', 'Demographic uses age, income and similar traits.'], ['Geographic segmentation', 'Geographic uses location.'], ['Behavioral segmentation', 'Behavioral uses buying behavior.'],
        'Psychographics capture attitudes and interests.'),
      I('In the consumer buying process, the first stage is:', 'Need recognition',
        ['Information search', 'Searching follows recognizing a need.'], ['Evaluation of alternatives', 'That comes after the search.'], ['Purchase decision', 'That comes near the end.'],
        'The process: need recognition, search, evaluation, purchase, post-purchase behavior.')
    ]
  };
  S.MK4 = {
    idea: 'Marketing research gathers primary and secondary data; promotion uses advertising, personal selling, PR and sales promotion across the product life cycle.',
    hint: 'Match the research or promotion term with its description.',
    pool: [
      I('Data collected first-hand for a specific study, such as surveys and interviews, is:', 'Primary data',
        ['Secondary data', 'Secondary data already exists, gathered for another purpose.'], ['Census data only', 'Census data is secondary for most marketers.'], ['Fake data', 'Research data must be genuine.'],
        'Primary data fits the research question directly.'),
      I('The product life cycle stage with rapidly rising sales is:', 'Growth',
        ['Introduction', 'Sales are slow at introduction.'], ['Maturity', 'Sales level off at maturity.'], ['Decline', 'Sales fall in decline.'],
        'Competitors often enter during growth.'),
      I('The promotion tool that uses paid, non-personal messages in media is:', 'Advertising',
        ['Personal selling', 'Personal selling is face-to-face.'], ['Public relations', 'PR builds goodwill, often through unpaid coverage.'], ['Sales promotion', 'Sales promotion uses short-term incentives.'],
        'Advertising reaches many people at once.'),
      I('Integrated marketing communications means:', 'Coordinating all promotional tools to deliver one consistent message',
        ['Using only one medium', 'IMC uses many tools together.'], ['Lowering prices', 'That is pricing.'], ['Hiring more salespeople', 'That is staffing.'],
        'Consistency strengthens the brand.'),
      I('A focus group is:', 'A small group discussion, guided by a moderator, to explore opinions',
        ['A large online survey', 'Surveys collect structured answers from many people.'], ['A sales team meeting', 'Focus groups involve customers.'], ['An advertising slogan', 'A slogan is promotional copy.'],
        'Focus groups give rich qualitative insight.')
    ]
  };

  return S;
};
