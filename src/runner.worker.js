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
    def __init__(self, message, observations=None):
        super().__init__(message)
        self.observations = observations or []

def _fc_repr(value):
    try:
        text = repr(value)
    except Exception:
        text = '<unrepresentable value>'
    return text[:420] + ('…' if len(text) > 420 else '')

def _fc_assert_eq(actual, expected, expression):
    if not actual == expected:
        raise FCAssertionError('Expected: ' + _fc_repr(expected) + '\nActual: ' + _fc_repr(actual) + '\nAssertion: ' + expression,
            [{'expression': 'Actual', 'value': _fc_repr(actual)}, {'expression': 'Expected', 'value': _fc_repr(expected)}])

def _fc_capture(value, expression, observations):
    # Capture each operand when Python evaluates it, preserving short circuiting.
    observations.append({'expression': expression, 'value': _fc_repr(value)})
    if len(observations) > 24:
        observations.pop(0)
    return value

def _fc_failure(expression, observations):
    return FCAssertionError('Assertion failed: ' + expression, observations)

class _FCObserve(ast.NodeTransformer):
    def wrap(self, node):
        label = ast.unparse(node)
        return ast.copy_location(ast.Call(func=ast.Name(id='_fc_capture', ctx=ast.Load()),
            args=[self.visit(node), ast.Constant(label), ast.Name(id='_fc_observations', ctx=ast.Load())], keywords=[]), node)

    def visit_Compare(self, node):
        node.left = self.wrap(node.left)
        node.comparators = [self.wrap(value) for value in node.comparators]
        return node

    def visit_Call(self, node):
        # For abs(actual - expected) < tolerance show both values and the error.
        if isinstance(node.func, ast.Name) and node.func.id == 'abs' and len(node.args) == 1 and isinstance(node.args[0], ast.BinOp) and isinstance(node.args[0].op, ast.Sub):
            difference = node.args[0]
            difference.left = self.wrap(difference.left)
            difference.right = self.wrap(difference.right)
            return node
        return self.generic_visit(node)

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
        clear = ast.Assign(targets=[ast.Name(id='_fc_observations', ctx=ast.Store())], value=ast.List(elts=[], ctx=ast.Load()))
        failure = ast.Raise(exc=ast.Call(func=ast.Name(id='_fc_failure', ctx=ast.Load()),
            args=[ast.Constant(label), ast.Name(id='_fc_observations', ctx=ast.Load())], keywords=[]), cause=None)
        check = ast.If(test=ast.UnaryOp(op=ast.Not(), operand=_FCObserve().visit(expr)), body=[failure], orelse=[])
        return [ast.copy_location(clear, node), ast.copy_location(check, node)]

def fc_run_one(student_source, test_source):
    output = io.StringIO()
    scope = {'__name__': '__main__', '_fc_assert_eq': _fc_assert_eq, '_fc_capture': _fc_capture, '_fc_failure': _fc_failure}
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
            'observations': getattr(exc, 'observations', []),
            'stdout': output.getvalue()[-1200:]})

def fc_run_custom(student_source, call_source, function_name):
    output = io.StringIO()
    scope = {'__name__': '__main__'}
    try:
        tree = ast.parse(call_source, filename='<custom>', mode='eval')
        if not isinstance(tree.body, ast.Call) or not isinstance(tree.body.func, ast.Name) or tree.body.func.id != function_name:
            raise ValueError('Enter one call to ' + function_name + '(...)')
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            exec(compile(student_source, '<student>', 'exec'), scope, scope)
            value = eval(compile(tree, '<custom>', 'eval'), scope, scope)
        return json.dumps({'pass': True, 'value': _fc_repr(value), 'stdout': output.getvalue()[-1200:]})
    except BaseException as exc:
        return json.dumps({'pass': False, 'error_type': type(exc).__name__, 'error': str(exc)[:1000], 'stdout': output.getvalue()[-1200:]})
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
    if (data.mode === 'custom') {
      py.globals.set('fc_student_src', String(code));
      py.globals.set('fc_custom_src', String(data.call));
      py.globals.set('fc_function_name', String(data.functionName));
      const response = await py.runPythonAsync('fc_run_custom(fc_student_src, fc_custom_src, fc_function_name)');
      self.postMessage({ type: 'custom-result', requestId, result: JSON.parse(response) });
      return;
    }
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
