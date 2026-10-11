import {pythonCommand} from './config.mjs';
// Test the same Python assertion instrumentation that runs in the browser Worker.
// CPython checks the instrumentation; browser-e2e separately checks actual Pyodide.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { problems } from '../src/problems.mjs';

const code = readFileSync(new URL('../src/runner.worker.js', import.meta.url), 'utf8');
const match = code.match(/const PYTHON_CASE_RUNNER = String\.raw`([\s\S]*?)`;/);
if (!match) throw new Error('Python runner not found');
const runner = match[1];
const payload = {
  problems: problems.map(p => ({ id: p.id, reference: p.solution, starter: p.starter, tests: p.tests })),
};
const suite = `import json,sys
items=json.load(sys.stdin)['problems']
${runner}
count=0
for p in items:
    for t in p['tests']:
        verdict=json.loads(fc_run_one(p['reference'],t['code']))
        if not verdict['pass']:
            print('REFERENCE FAILED:',p['id'],t['name'],verdict)
            sys.exit(1)
        count+=1
starter_fail=json.loads(fc_run_one("def f(x):\\n    return 0", "assert f(7) == 9"))
assert starter_fail['pass'] is False
assert 'Expected: 9' in starter_fail['error']
assert 'Actual: 0' in starter_fail['error']
assert starter_fail['error_type']=='FCAssertionError'
syntax=json.loads(fc_run_one('def bad(:',"assert 1 == 1"))
assert syntax['pass'] is False and syntax['error_type']=='SyntaxError'
printed=json.loads(fc_run_one('def f():\\n    print(\\"hello\\")\\n    return 1',"assert f() == 1"))
assert printed['pass'] is True and 'hello' in printed['stdout']
floating=json.loads(fc_run_one('', 'r=0.5; expected=0.8; assert abs(r-expected)<1e-9'))
observed={row['expression']:row['value'] for row in floating['observations']}
assert observed['r']=='0.5' and observed['expected']=='0.8'
assert float(observed['abs(r - expected)'])>0.29 and observed['1e-09']=='1e-09'
bounds=json.loads(fc_run_one('', 'r=[5]; assert 9<r[0]<=10'))
assert bounds['observations']==[{'expression':'9','value':'9'},{'expression':'r[0]','value':'5'}]
# A failed first comparison must not evaluate the remaining chained operand.
short=json.loads(fc_run_one('', 'assert 2 < 1 < (1/0)'))
assert short['error_type']=='FCAssertionError'
single=json.loads(fc_run_one('', 'calls=[]\\ndef f():\\n    calls.append(1)\\n    return len(calls)\\nassert 0 < f() < 2\\nassert len(calls)==1'))
assert single['pass'] is True
late=json.loads(fc_run_one('', 'assert all(i<30 for i in range(40))'))
assert len(late['observations'])<=24 and any(row['expression']=='i' and row['value']=='30' for row in late['observations'])
custom=json.loads(fc_run_custom('def f(x):\\n    print("debug")\\n    return x*2','f(x=7)','f'))
assert custom['pass'] and custom['value']=='14' and 'debug' in custom['stdout']
assert not json.loads(fc_run_custom('def f(): return 1','other()','f'))['pass']
assert not json.loads(fc_run_custom('def f(): return 1','f(); f()','f'))['pass']
assert not json.loads(fc_run_custom('def f(): return 1/0','f()','f'))['pass']
# The published samples must reject attention that ignores query/key weights.
attention=next(p for p in items if p['id']=='attention-scaled-dot-product')
average='def scaled_attention(q, keys, values):\\n    return [sum(v[j] for v in values)/len(values) for j in range(len(values[0]))]'
assert not all(json.loads(fc_run_one(average,test['code']))['pass'] for test in attention['tests'][:2])
print('PASS',count,'browser-worker-instrumented reference checks')
print('PASS failure details (expected/actual), syntax errors, captured stdout')
print('PASS tolerance/range observations, short-circuit and single evaluation, custom calls, nondegenerate attention samples')
`;
const response = spawnSync(pythonCommand, ['-c', suite], { input: JSON.stringify(payload), encoding: 'utf8' });
if (response.stdout) process.stdout.write(response.stdout);
if (response.stderr) process.stderr.write(response.stderr);
if (response.status !== 0) process.exit(1);
