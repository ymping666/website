// FrontierCode browser-only Python runner.
// This is NOT a security boundary or a secret server-side judge.
// A dedicated Worker is terminated by the UI when it times out or is stopped.
const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
let pythonPromise = null;
let prepared = false;

async function getPython(requestId) {
  if (!pythonPromise) {
    pythonPromise = (async () => {
      self.postMessage({ type: 'loading', requestId });
      importScripts(PYODIDE_URL + 'pyodide.js');
      const runtime = await self.loadPyodide({ indexURL: PYODIDE_URL });
      self.postMessage({ type: 'ready', requestId });
      return runtime;
    })().catch(error => {
      pythonPromise = null;
      throw error;
    });
  }
  return pythonPromise;
}

const PYTHON_CASE_RUNNER = String.raw`
import ast, contextlib, io, json, traceback

class FCAssertionError(AssertionError):
    pass

def _fc_repr(value):
    try:
        text = repr(value)
    except Exception:
        text = '<unrepresentable value>'
    return text[:420] + ('…' if len(text) > 420 else '')

def _fc_assert_eq(actual, expected, expression):
    if not actual == expected:
        raise FCAssertionError('Expected: ' + _fc_repr(expected) + '\nActual: ' + _fc_repr(actual) + '\nAssertion: ' + expression)

class _FCInstrument(ast.NodeTransformer):
    def visit_Assert(self, node):
        expr = node.test
        label = ast.unparse(expr)
        if isinstance(expr, ast.Compare) and len(expr.ops) == 1 and isinstance(expr.ops[0], ast.Eq):
            replacement = ast.Expr(value=ast.Call(
                func=ast.Name(id='_fc_assert_eq', ctx=ast.Load()),
                args=[expr.left, expr.comparators[0], ast.Constant(label)],
                keywords=[]))
            return ast.copy_location(replacement, node)
        return ast.copy_location(ast.Assert(test=expr, msg=ast.Constant('Assertion failed: ' + label)), node)

def fc_run_one(student_source, test_source):
    output = io.StringIO()
    scope = {'__name__': '__main__', '_fc_assert_eq': _fc_assert_eq}
    try:
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            exec(compile(student_source, '<student>', 'exec'), scope, scope)
            tree = _FCInstrument().visit(ast.parse(test_source, filename='<test>'))
            ast.fix_missing_locations(tree)
            exec(compile(tree, '<test>', 'exec'), scope, scope)
        return json.dumps({'pass': True, 'stdout': output.getvalue()[-1200:]})
    except BaseException as exc:
        frames = traceback.extract_tb(exc.__traceback__)
        code_frame = next((f for f in reversed(frames) if f.filename in ('<student>', '<test>')), None)
        location = (code_frame.filename + ':' + str(code_frame.lineno)) if code_frame else ''
        message = str(exc) or type(exc).__name__
        return json.dumps({'pass': False, 'error_type': type(exc).__name__,
            'error': message[:1000], 'location': location,
            'stdout': output.getvalue()[-1200:]})
`;

self.onmessage = async (event) => {
  const data = event.data;
  if (!data || data.type !== 'run') return;
  const { requestId, code, tests } = data;
  try {
    const py = await getPython(requestId);
    if (!prepared) {
      await py.runPythonAsync(PYTHON_CASE_RUNNER);
      prepared = true;
    }
    self.postMessage({ type: 'running', requestId, total: tests.length });
    const results = [];
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      py.globals.set('fc_student_src', String(code));
      py.globals.set('fc_test_src', String(test.code));
      const response = await py.runPythonAsync('fc_run_one(fc_student_src, fc_test_src)');
      results.push({ name: test.name, source: test.code, ...JSON.parse(response) });
      self.postMessage({ type: 'progress', requestId, finished: i + 1, total: tests.length });
    }
    self.postMessage({ type: 'results', requestId, results });
  } catch (error) {
    self.postMessage({ type: 'error', requestId, error: String(error.message || error).slice(0, 900) });
  }
};
