// Maintenance command: precompute readable examples; production builds remain Node-only.
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { problems } from '../src/problems.mjs';
import { pythonCommand } from './config.mjs';
const python = String.raw`
import ast, functools, inspect, json, sys
examples = {}
class LabelLambdas(ast.NodeTransformer):
    def visit_Lambda(self, node):
        return ast.copy_location(ast.Call(func=ast.Name(id='_example_label', ctx=ast.Load()),
            args=[node, ast.Constant(ast.unparse(node))], keywords=[]), node)
def label(function, source):
    function._example_source = source
    return function
def display(value):
    if callable(value):
        return getattr(value, '_example_source', value.__name__)
    return repr(value)
for p in json.load(sys.stdin):
    name = p['signature'].split('(')[0].strip()
    samples = []
    for test in p['tests'][:2]:
        scope = {}
        exec(p['solution'], scope)
        original = scope[name]
        calls = []
        @functools.wraps(original)
        def record(*args, **kwargs):
            bound = inspect.signature(original).bind(*args, **kwargs)
            source = name + '(' + ', '.join(k + '=' + display(v) for k,v in bound.arguments.items()) + ')'
            value = original(*args, **kwargs)
            calls.append({'input': source, 'output': repr(value)})
            return value
        scope[name] = record
        scope['_example_label'] = label
        tree = ast.fix_missing_locations(LabelLambdas().visit(ast.parse(test['code'])))
        exec(compile(tree, '<example>', 'exec'), scope)
        if not calls:
            raise ValueError('No example call: ' + p['id'])
        samples.append(calls)
    examples[p['id']] = samples
print(json.dumps(examples, ensure_ascii=False, indent=2))
`;
const result = spawnSync(pythonCommand, ['-c', python], { input: JSON.stringify(problems), encoding: 'utf8', maxBuffer: 10_000_000 });
if (result.status !== 0) throw new Error(result.stderr || 'Example generation failed');
const file = new URL('../src/examples.json', import.meta.url);
if (process.argv.includes('--check')) {
  const expected = JSON.parse(await readFile(file, 'utf8'));
  const actual = JSON.parse(result.stdout);
  // libm can differ by a few ulps between Windows and Linux. Compare numeric
  // output tokens with a tolerance while keeping all inputs and structure exact.
  const outputMatches = (a, b) => {
    const numbers = /-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi;
    if (a.replace(numbers, '#') !== b.replace(numbers, '#')) return false;
    const x = a.match(numbers) || [], y = b.match(numbers) || [];
    return x.length === y.length && x.every((v, i) => Math.abs(Number(v) - Number(y[i])) <= 1e-12 * Math.max(1, Math.abs(Number(v))));
  };
  for (const p of problems) {
    const a = expected[p.id], b = actual[p.id];
    if (!a || JSON.stringify(a.map(calls => calls.map(c => c.input))) !== JSON.stringify(b.map(calls => calls.map(c => c.input)))
      || a.some((calls, i) => calls.some((c, j) => !outputMatches(c.output, b[i][j].output)))) {
      throw new Error('Readable examples are stale for ' + p.id + '; run node scripts/generate-examples.mjs');
    }
  }
} else await writeFile(file, result.stdout.trim() + '\n');
console.log(`PASS readable input/output examples verified against all ${problems.length} reference implementations`);
