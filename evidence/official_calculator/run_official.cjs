/* Execute the unmodified ITD calculator asset in a fresh JS context per case. */
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'itdcalc-current.js'), 'utf8');
const rows = JSON.parse(fs.readFileSync(0, 'utf8'));
const results = rows.map((row) => {
  const context = vm.createContext({
    console,
    $: {each: (items, callback) => Object.entries(items || {}).forEach(([key, value]) => callback(key, value))},
  });
  vm.runInContext(source, context, {timeout: 3000});
  const year = row.assessment_year.slice(0, 4);
  const input = {
    framework: 'calculator', calcType: 'advanced', itrType: 'regular',
    assYr: row.assessment_year, cStatus: 'IND', rstatus: row.resident === false ? 'NR' : 'R',
    age: row.age >= 80 ? 'SSR' : row.age >= 60 ? 'SR' : 'NM',
    oldnewslab: row.regime, slinc: row.taxable_income,
    duedate: new Date(`${year}-07-31T00:00:00Z`),
    filedate: new Date(`${year}-04-01T00:00:00Z`),
    prevItrFileDt: null, paymentdetails: [], dedlist: [], tdsdetails: [],
  };
  const originalInput = structuredClone(input);
  context.input = input;
  vm.runInContext('doCalculation(input)', context, {timeout: 3000});
  const fields = ['gti', 'totalti', 'GrossTax', 'rebate87A', 'TaxAftr87A', 'Surcharge', 'ECess', 'TotalTax', 'BalTax'];
  const output = Object.fromEntries(fields.map(key => [key, input[key]]));
  for (const [key, value] of Object.entries(output)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${row.id}: invalid ${key}: ${value}`);
  }
  return {...row, official_input: originalInput, official_output: output};
});
process.stdout.write(JSON.stringify(results, null, 2) + '\n');
