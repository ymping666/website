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
print('PASS',count,'browser-worker-instrumented reference checks')
print('PASS failure details (expected/actual), syntax errors, captured stdout')
`;
const response = spawnSync(pythonCommand, ['-c', suite], { input: JSON.stringify(payload), encoding: 'utf8' });
if (response.stdout) process.stdout.write(response.stdout);
if (response.stderr) process.stderr.write(response.stderr);
if (response.status !== 0) process.exit(1);
