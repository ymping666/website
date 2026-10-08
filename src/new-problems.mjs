// FrontierCode v0.5: independent, deterministic coding contracts.
// Concepts follow the linked research; problem text and tests are original.
export const newProblems = [
  {
    id:'react-trace-validator', number:10, track:'Agent Engineering', difficulty:'Medium',
    title:'Validate a ReAct Thought–Action–Observation Trace', duration:'18 min',
    tags:['ReAct','State Machine','Agent Control'],
    description:'A simplified ReAct agent produces typed events. Before replaying or scoring a trace, validate that its thought, tool action, observation and finish events follow the required execution protocol. This is a deterministic protocol exercise, not a simulation of the language model itself.',
    requirements:[
      'Input events is a list of strings drawn from "thought", "action", "observation", and "finish". An empty list is invalid.',
      'The first event must be "thought". An "action" must directly follow a "thought"; an "observation" must directly follow an "action".',
      'After an "observation", the next event must be "thought" or "finish". After a "thought", the next event must be "action" or "finish".',
      'A valid trace ends with exactly one "finish" and nothing afterward. Return bool; never execute tool calls.'
    ],
    signature:'valid_react_trace(events)',
    starter:`def valid_react_trace(events):\n    """Return True iff the trace obeys the simplified ReAct protocol."""\n    # TODO: validate the event-state transitions\n    pass`,
    solution:`def valid_react_trace(events):\n    phase = 'thought'\n    for i, event in enumerate(events):\n        if phase == 'thought':\n            if event != 'thought':\n                return False\n            phase = 'action_or_finish'\n        elif phase == 'action_or_finish':\n            if event == 'action':\n                phase = 'observation'\n            elif event == 'finish':\n                return i == len(events) - 1\n            else:\n                return False\n        elif phase == 'observation':\n            if event != 'observation':\n                return False\n            phase = 'thought_or_finish'\n        else:\n            if event == 'thought':\n                phase = 'action_or_finish'\n            elif event == 'finish':\n                return i == len(events) - 1\n            else:\n                return False\n    return False`,
    explanation:[
      'Express the protocol as a small finite-state machine. The next legal event depends on the previous event, not on the total number of events.',
      'An action creates a pending tool invocation; exactly one observation must follow before the agent can reason again.',
      'A finish event terminates the trace. Check its position so extra events after termination cannot be accepted.',
      'This validator uses an educational ReAct-shaped protocol; production traces can represent tool errors, parallel actions and additional event types.'
    ],
    complexity:'Time: O(n) for n events. Space: O(1).',
    pitfall:'Merely checking that "finish" exists will accidentally accept action-without-observation and events after termination.',
    hints:['Track what event kind is allowed next, starting with "thought".','A finish is only legal after a thought or observation, and must be the last event.'],
    references:[{title:'ReAct (Yao et al., 2022)',url:'https://arxiv.org/abs/2210.03629'}],
    tests:[
      {name:'Single thought and finish',code:`assert valid_react_trace(['thought','finish']) is True`},
      {name:'Full interleaved trajectory',code:`assert valid_react_trace(['thought','action','observation','thought','action','observation','finish']) is True`},
      {name:'Finish directly after observation',code:`assert valid_react_trace(['thought','action','observation','finish']) is True`},
      {name:'Missing observation',code:`assert valid_react_trace(['thought','action','finish']) is False`},
      {name:'Action without thought',code:`assert valid_react_trace(['action','observation','finish']) is False`},
      {name:'Unknown event',code:`assert valid_react_trace(['thought','wait','finish']) is False`},
      {name:'Cannot continue after finish',code:`assert valid_react_trace(['thought','finish','thought']) is False`},
      {name:'Empty and unfinished',code:`assert valid_react_trace([]) is False; assert valid_react_trace(['thought']) is False`}
    ]
  },
  {
    id:'agent-plan-ready', number:11, track:'Agent Engineering', difficulty:'Medium',
    title:'Find Ready Tasks in a Dependency Plan', duration:'17 min',
    tags:['Planning','DAG','Dependency Resolution'],
    description:'Plan-and-execute agents often represent work as tasks with prerequisites. Determine which tasks can start now without ignoring dependencies or rerunning completed tasks.',
    requirements:[
      'Input tasks is a dict mapping unique task names (str) to lists of prerequisite task names. Every prerequisite names a key in tasks, and the dependency graph is acyclic.',
      'Input completed is a collection of task names from tasks; repeated completed names are allowed.',
      'A task is ready if it is not completed and all of its prerequisites are completed.',
      'Return ready task names in lexicographically ascending order. Do not mutate either input.'
    ],
    signature:'ready_tasks(tasks, completed)',
    starter:`def ready_tasks(tasks, completed):\n    """Return sorted task names whose prerequisites are satisfied."""\n    # TODO\n    pass`,
    solution:`def ready_tasks(tasks, completed):\n    done = set(completed)\n    return sorted(\n        name for name, deps in tasks.items()\n        if name not in done and all(dep in done for dep in deps)\n    )`,
    explanation:[
      'A dependency plan is not necessarily a single sequential list; multiple independent tasks can be ready at once.',
      'Use a set for fast membership checks, and exclude already completed tasks before testing prerequisites.',
      'The contract guarantees a valid DAG. Cycle detection and repair are valuable extensions, but are outside this problem.'
    ],
    complexity:'Time: O(V + E + R log R), for V tasks, E prerequisite edges and R ready tasks; O(V) space for completed and results.',
    pitfall:'Checking that any prerequisite is completed is incorrect: a task may start only after all of its prerequisites have completed.',
    hints:['Convert completed to a set for membership checks.','Use all(...) for every prerequisite, then sort the resulting names.'],
    references:[{title:'Hello-Agents — agent paradigms overview',url:'https://github.com/datawhalechina/hello-agents'}],
    tests:[
      {name:'Initial parallel tasks',code:`assert ready_tasks({'draft':[],'research':[],'publish':['draft','research']},[]) == ['draft','research']`},
      {name:'All prerequisites required',code:`assert ready_tasks({'a':[],'b':[],'c':['a','b']},['a']) == ['b']`},
      {name:'Unlock downstream task',code:`assert ready_tasks({'a':[],'b':[],'c':['a','b']},['b','a']) == ['c']`},
      {name:'Never rerun completed',code:`assert ready_tasks({'a':[],'b':['a']},['a','a']) == ['b']`},
      {name:'Empty input',code:`assert ready_tasks({},[]) == []`},
      {name:'Preserve source plan',code:`plan={'b':['a'],'a':[]}; result=ready_tasks(plan,[]); assert result==['a'] and plan=={'b':['a'],'a':[]}`}
    ]
  },
  {
    id:'agent-reflection-controller', number:12, track:'Agent Engineering', difficulty:'Medium',
    title:'Implement a Reflection Retry Controller', duration:'18 min',
    tags:['Reflection','Stopping Criteria','Feedback'],
    description:'Reflection agents retry a task after using evaluator feedback. Implement only the deterministic controller that decides when another attempt is justified; no LLM API or self-critique generation is required.',
    requirements:[
      'scores is a chronological list of float evaluation scores (higher is better), each in [0, 1]. max_rounds is a nonnegative integer.',
      'Return "target_reached" if scores is nonempty and its last value is at least target; this rule has highest priority.',
      'Otherwise return "budget_exhausted" when len(scores) >= max_rounds.',
      'Otherwise, if at least two scores exist and scores[-1] - scores[-2] < min_improvement, return "plateau". min_improvement is nonnegative.',
      'Return "continue" in all other cases, including when no attempts have occurred and a positive budget remains.'
    ],
    signature:'reflection_decision(scores, max_rounds, target, min_improvement)',
    starter:`def reflection_decision(scores, max_rounds, target, min_improvement):\n    """Return a deterministic reflection-loop control decision."""\n    # TODO\n    pass`,
    solution:`def reflection_decision(scores, max_rounds, target, min_improvement):\n    if scores and scores[-1] >= target:\n        return 'target_reached'\n    if len(scores) >= max_rounds:\n        return 'budget_exhausted'\n    if len(scores) >= 2 and scores[-1] - scores[-2] < min_improvement:\n        return 'plateau'\n    return 'continue'`,
    explanation:[
      'Always check whether the goal has already been reached before considering retry limits.',
      'Budget exhaustion prevents unbounded cost or execution even if scores continue improving.',
      'A small or negative improvement between the last two rounds can trigger early termination. This simple heuristic is not a statistical convergence test.',
      'The challenge isolates a control policy that can wrap a Reflection- or Reflexion-style agent, rather than claiming to reproduce the original agent architecture.'
    ],
    complexity:'Time: O(1), space: O(1).',
    pitfall:'Stopping only when the feedback text contains a magic phrase is fragile; the loop must also have measurable limits and explicit precedence.',
    hints:['First inspect only the last score against target.','Next test the round budget, then compare only the last two scores.'],
    references:[{title:'Reflexion (Shinn et al., 2023)',url:'https://arxiv.org/abs/2303.11366'}],
    tests:[
      {name:'Target overrides budget',code:`assert reflection_decision([0.4,0.9],2,0.9,0.1)=='target_reached'`},
      {name:'Budget exhausted',code:`assert reflection_decision([0.3,0.5],2,0.9,0.1)=='budget_exhausted'`},
      {name:'Plateau with zero gain',code:`assert reflection_decision([0.4,0.4],4,0.9,0.01)=='plateau'`},
      {name:'Improving feedback',code:`assert reflection_decision([0.4,0.65],4,0.9,0.1)=='continue'`},
      {name:'Negative improvement',code:`assert reflection_decision([0.7,0.5],4,0.9,0.0)=='plateau'`},
      {name:'Start with no scores',code:`assert reflection_decision([],3,0.9,0.1)=='continue'`},
      {name:'Zero budget',code:`assert reflection_decision([],0,0.9,0.1)=='budget_exhausted'`},
      {name:'Threshold equality continues',code:`assert reflection_decision([0.5,0.75],4,0.9,0.25)=='continue'`}
    ]
  },
  {
    id:'tool-schema-enforcer', number:13, track:'Agent Engineering', difficulty:'Medium',
    title:'Validate Tool Arguments Against a Registry', duration:'19 min',
    tags:['Tool Calling','Schema Validation','Safety'],
    description:'After parsing an LLM tool request, check that the requested tool exists and that its arguments exactly match a known schema. This exercise performs validation only, never tool execution.',
    requirements:[
      'request is a dict with keys "tool" and "arguments"; registry maps tool names to dicts of parameter names and type tags "str", "int" or "bool".',
      'Return "unknown_tool" when the tool name is absent from the registry.',
      'For a known tool, return "invalid_arguments" if arguments is not a dict, or if required keys are missing, extra keys exist, or a value has the wrong exact type.',
      'Python bool must NOT be accepted for schema type "int". Return "ok" only for an exact valid request. Never call a tool.'
    ],
    signature:'validate_tool_request(request, registry)',
    starter:`def validate_tool_request(request, registry):\n    """Return 'ok', 'unknown_tool', or 'invalid_arguments'."""\n    # TODO\n    pass`,
    solution:`def validate_tool_request(request, registry):\n    name = request.get('tool')\n    if name not in registry:\n        return 'unknown_tool'\n    schema = registry[name]\n    args = request.get('arguments')\n    if not isinstance(args, dict) or set(args) != set(schema):\n        return 'invalid_arguments'\n    types = {'str': str, 'int': int, 'bool': bool}\n    for key, tag in schema.items():\n        if type(args[key]) is not types[tag]:\n            return 'invalid_arguments'\n    return 'ok'`,
    explanation:[
      'Treat registry lookup as a strict allowlist. Unknown tools are rejected before any argument processing.',
      'Exact key equality rejects both missing and unexpected argument names, which is useful for narrow prototype contracts.',
      'Use type(value) is int rather than isinstance(value, int) because Python bool is a subclass of int.',
      'Real production agents additionally need authorization policies, output validation, auditing and explicit tool-side permissions.'
    ],
    complexity:'Time: O(k) and space O(k) for k schema keys (key-set comparison and checks).',
    pitfall:'Allowing unspecified extra arguments can accidentally forward fields to a downstream API that was never meant to receive them.',
    hints:['Check name in registry first, then ensure arguments is a dict with exactly the expected keys.','Map string tags to Python built-in types and compare type(value) directly.'],
    references:[{title:'Hello-Agents — tools and communication protocols',url:'https://github.com/datawhalechina/hello-agents'}],
    tests:[
      {name:'Valid arguments',code:`r={'search':{'query':'str','limit':'int'}}; assert validate_tool_request({'tool':'search','arguments':{'query':'ai','limit':3}},r)=='ok'`},
      {name:'Unknown tool',code:`assert validate_tool_request({'tool':'shell','arguments':{}},{'search':{}})=='unknown_tool'`},
      {name:'Missing required argument',code:`assert validate_tool_request({'tool':'search','arguments':{'query':'q'}},{'search':{'query':'str','limit':'int'}})=='invalid_arguments'`},
      {name:'Extra argument rejected',code:`assert validate_tool_request({'tool':'fetch','arguments':{'url':'x','extra':True}},{'fetch':{'url':'str'}})=='invalid_arguments'`},
      {name:'Boolean is not integer',code:`assert validate_tool_request({'tool':'search','arguments':{'limit':True}},{'search':{'limit':'int'}})=='invalid_arguments'`},
      {name:'Boolean schema',code:`assert validate_tool_request({'tool':'flag','arguments':{'enabled':False}},{'flag':{'enabled':'bool'}})=='ok'`},
      {name:'Non-dict arguments',code:`assert validate_tool_request({'tool':'ping','arguments':[]},{'ping':{}})=='invalid_arguments'`},
      {name:'Empty schema permits empty dict',code:`assert validate_tool_request({'tool':'ping','arguments':{}},{'ping':{}})=='ok'`}
    ]
  },
  {
    id:'mpc-first-action', number:14, track:'World Models', difficulty:'Medium',
    title:'Implement the First Action of an MPC Plan', duration:'20 min',
    tags:['MPC','Dynamics','Planning Horizon'],
    description:'At each control step, model predictive control (MPC) evaluates candidate action sequences under a known transition model, but commits only to the FIRST action of the best predicted sequence.',
    requirements:[
      'Inputs state is a float; candidates is a list of nonempty lists of scalar actions (all the same length). transition(state, action) and cost(next_state) are supplied pure callable functions.',
      'For each candidate, apply transition in order and sum cost(next_state) after every transition, with no discount.',
      'Return the first action of the minimum-cost candidate. If several candidates tie, choose the first in input order.',
      'Return None for an empty candidate list. Do not mutate the input state or execute actions on a real environment.'
    ],
    signature:'mpc_first_action(state, candidates, transition, cost)',
    starter:`def mpc_first_action(state, candidates, transition, cost):\n    """Choose only the first action of the best imagined rollout."""\n    # TODO\n    pass`,
    solution:`def mpc_first_action(state, candidates, transition, cost):\n    best_action = None\n    best_cost = float('inf')\n    for actions in candidates:\n        predicted = state\n        total = 0.0\n        for action in actions:\n            predicted = transition(predicted, action)\n            total += cost(predicted)\n        if total < best_cost:\n            best_cost = total\n            best_action = actions[0]\n    return best_action`,
    explanation:[
      'For each proposed action sequence, make an independent rollout beginning from the CURRENT state.',
      'Score the entire imagined trajectory. Using the predicted state after each transition is different from evaluating only the immediate action.',
      'Return only the first action. A real MPC controller observes the next state and replans, rather than executing the entire imagined sequence open-loop.',
      'Strict less-than preserves input order when costs tie.'
    ],
    complexity:'Time: O(NH) model steps for N candidates and horizon H. Auxiliary space O(1) excluding the given candidates.',
    pitfall:'Do not let one candidate rollout overwrite the initial state for the next candidate: each plan must be evaluated from the same starting state.',
    hints:['Simulate each candidate using a separate local predicted variable initialized to state.','Track the lowest trajectory cost and return only actions[0].'],
    references:[{title:'World Models & Spatial Intelligence — learning roadmap',url:'https://overdued.github.io/world-model-spatial-intelligence-course/'}],
    tests:[
      {name:'Future cost beats greedy action',code:`assert mpc_first_action(0,[[1,5],[2,0]],lambda s,a:s+a,lambda s:s*s)==2`},
      {name:'Predicted state resets',code:`assert mpc_first_action(0,[[10],[1]],lambda s,a:s+a,lambda s:abs(s))==1`},
      {name:'Input-order tie break',code:`assert mpc_first_action(0,[[1],[-1]],lambda s,a:s+a,lambda s:abs(s))==1`},
      {name:'Empty candidates',code:`assert mpc_first_action(0,[],lambda s,a:s+a,lambda s:s*s) is None`},
      {name:'Uses stepwise states',code:`assert mpc_first_action(0,[[3,-4],[1,1]],lambda s,a:s+a,lambda s:abs(s))==1`},
      {name:'State remains unchanged',code:`state=5; mpc_first_action(state,[[0],[1]],lambda s,a:s+a,lambda s:abs(s)); assert state==5`}
    ]
  },
  {
    id:'cem-categorical-update', number:15, track:'World Models', difficulty:'Hard',
    title:'Update a Categorical CEM Planning Distribution', duration:'25 min',
    tags:['CEM','Sampling','Planning'],
    description:'The Cross-Entropy Method (CEM) for planning improves a candidate distribution by selecting low-cost action sequences (elites). Implement the categorical maximum-likelihood update for a single iteration over discrete actions.',
    requirements:[
      'candidates is a nonempty list of equal-length lists of integer action IDs in range [0, n_actions). costs has the same length as candidates.',
      'elite_count is an integer between 1 and len(candidates). Rank candidates by increasing cost; preserve original candidate order for ties.',
      'Return a list of length horizon. At each step t, return a list of n_actions probabilities equal to the frequency of each action among the selected elite sequences.',
      'Do not add smoothing, sample new sequences, or modify candidates. The horizon may be zero, in which case return [].'
    ],
    signature:'cem_elite_frequencies(candidates, costs, elite_count, n_actions)',
    starter:`def cem_elite_frequencies(candidates, costs, elite_count, n_actions):\n    """Fit per-timestep categorical action frequencies to elites."""\n    # TODO\n    pass`,
    solution:`def cem_elite_frequencies(candidates, costs, elite_count, n_actions):\n    elite_indices = sorted(range(len(candidates)), key=lambda i: costs[i])[:elite_count]\n    horizon = len(candidates[0])\n    frequencies = [[0.0] * n_actions for _ in range(horizon)]\n    for i in elite_indices:\n        for t, action in enumerate(candidates[i]):\n            frequencies[t][action] += 1.0 / elite_count\n    return frequencies`,
    explanation:[
      'CEM selects the best fraction of sampled candidates according to a reward or cost objective. Here lower cost is better.',
      'For a categorical action sequence model with independent distributions per time step, the maximum-likelihood fit is the observed elite frequency.',
      'Stable sorting makes ties deterministic. Independent rows are necessary: aliasing rows would corrupt all time steps together.',
      'This task isolates ONE update; full CEM planning iteratively samples, evaluates and refits distributions and may use smoothing to avoid premature collapse.'
    ],
    complexity:'Time: O(N log N + EH + H·A), with N candidates, E elites, horizon H and A action values. Space: O(N + H·A).',
    pitfall:'Counting frequencies across all candidates instead of elites (or mixing time steps) does not implement a CEM elite update.',
    hints:['Sort candidate indices using their costs; take the first elite_count.','Accumulate action counts separately at every time index, then normalize by elite_count.'],
    references:[{title:'World Models & Spatial Intelligence — planning topics',url:'https://overdued.github.io/world-model-spatial-intelligence-course/'}],
    tests:[
      {name:'Two elites, two steps',code:`assert cem_elite_frequencies([[0,1],[1,1],[1,0]],[2,1,3],2,2)==[[0.5,0.5],[0.0,1.0]]`},
      {name:'Cheapest single elite',code:`assert cem_elite_frequencies([[0,0],[1,1]],[10,1],1,2)==[[0.0,1.0],[0.0,1.0]]`},
      {name:'Stable cost ties',code:`assert cem_elite_frequencies([[2],[1],[0]],[0,0,0],2,3)==[[0.0,0.5,0.5]]`},
      {name:'All candidates',code:`assert cem_elite_frequencies([[0],[0],[1]],[1,2,3],3,2)==[[2/3,1/3]]`},
      {name:'Zero horizon',code:`assert cem_elite_frequencies([[],[]],[1,0],1,3)==[]`},
      {name:'No shared row aliases',code:`assert cem_elite_frequencies([[0,1],[1,0]],[0,1],1,2)==[[1.0,0.0],[0.0,1.0]]`}
    ]
  },
  {
    id:'prediction-vs-decision', number:16, track:'World Models', difficulty:'Hard',
    title:'Compare Forecast MSE with Planning Regret', duration:'22 min',
    tags:['World Model Evaluation','Prediction Error','Planning Regret'],
    description:'Two models forecast the costs of the same candidate actions. A model can achieve lower mean squared error yet induce higher decision regret. Calculate both metrics for each model to make this trade-off explicit.',
    requirements:[
      'pred_a, pred_b and true_costs are nonempty dicts containing exactly the same action-name keys; values are finite real numbers.',
      'For each model, MSE is the mean squared error of its predicted costs against true_costs over all actions.',
      'Each model chooses the minimum predicted-cost action, breaking ties lexicographically. Regret is that action’s true cost minus the minimum true cost.',
      'Return a dict with numeric keys "mse_a", "mse_b", "regret_a", "regret_b", and string keys "lower_mse" and "lower_regret". Each winner is "A", "B", or "tie" for equal metrics.'
    ],
    signature:'compare_forecasts(pred_a, pred_b, true_costs)',
    starter:`def compare_forecasts(pred_a, pred_b, true_costs):\n    """Compare prediction accuracy and downstream action regret."""\n    # TODO\n    pass`,
    solution:`def compare_forecasts(pred_a, pred_b, true_costs):\n    actions = sorted(true_costs)\n    def metrics(pred):\n        mse = sum((pred[a] - true_costs[a]) ** 2 for a in actions) / len(actions)\n        chosen = min(actions, key=lambda a: pred[a])\n        regret = true_costs[chosen] - min(true_costs.values())\n        return mse, regret\n    mse_a, regret_a = metrics(pred_a)\n    mse_b, regret_b = metrics(pred_b)\n    def winner(a, b):\n        return 'A' if a < b else ('B' if b < a else 'tie')\n    return {\n        'mse_a': mse_a, 'mse_b': mse_b,\n        'regret_a': regret_a, 'regret_b': regret_b,\n        'lower_mse': winner(mse_a, mse_b),\n        'lower_regret': winner(regret_a, regret_b)\n    }`,
    explanation:[
      'MSE measures prediction closeness across every evaluated action; it does not automatically preserve the optimal action ranking.',
      'Planning regret scores the action selected by a model using ground-truth costs relative to the true optimal cost.',
      'The metrics are computed on the same action set, but can select different model winners. This is a diagnostic toy evaluation, not a claim about any particular model architecture or benchmark.',
      'An informative test deliberately creates a model with lower MSE that selects a worse action than a noisier alternative.'
    ],
    complexity:'Time: O(A log A) for A action names sorted once; additional space O(A).',
    pitfall:'Comparing only the best predicted cost cannot reveal true decision quality. Score the chosen action against true costs.',
    hints:['Implement one metrics(pred) helper that computes MSE and regret.','For equal predicted costs, use sorted action names to get a deterministic tie-break.'],
    references:[{title:'World Models & Spatial Intelligence — evaluation roadmap',url:'https://overdued.github.io/world-model-spatial-intelligence-course/'}],
    tests:[
      {name:'Lower MSE can have higher regret',code:`r=compare_forecasts({'a':2,'b':1,'c':100},{'a':0,'b':3,'c':94},{'a':0,'b':1,'c':100}); assert r['lower_mse']=='A' and r['lower_regret']=='B' and r['regret_a']==1 and r['regret_b']==0`},
      {name:'Both predictors perfect',code:`r=compare_forecasts({'a':0,'b':5},{'a':0,'b':5},{'a':0,'b':5}); assert r['lower_mse']=='tie' and r['lower_regret']=='tie' and r['mse_a']==0`},
      {name:'A better on both',code:`r=compare_forecasts({'a':0,'b':2},{'a':3,'b':1},{'a':0,'b':2}); assert r['lower_mse']=='A' and r['lower_regret']=='A'`},
      {name:'B better on both',code:`r=compare_forecasts({'a':2,'b':0},{'a':0,'b':2},{'a':0,'b':2}); assert r['lower_mse']=='B' and r['lower_regret']=='B'`},
      {name:'One-action edge case',code:`r=compare_forecasts({'only':4},{'only':7},{'only':5}); assert r['mse_a']==1 and r['mse_b']==4 and r['regret_a']==0 and r['regret_b']==0`},
      {name:'Tied predictive costs',code:`r=compare_forecasts({'b':0,'a':0},{'a':1,'b':2},{'a':5,'b':0}); assert r['regret_a']==5`},
      {name:'MSE uses every action',code:`r=compare_forecasts({'a':1,'b':2,'c':3},{'a':1,'b':2,'c':5},{'a':1,'b':2,'c':3}); assert r['mse_a']==0 and abs(r['mse_b']-4/3)<1e-12`}
    ]
  },
  {
    id:'risk-sensitive-planner', number:17, track:'World Models', difficulty:'Medium',
    title:'Choose Actions Under Model Uncertainty', duration:'17 min',
    tags:['Uncertainty','Risk-Sensitive Control','Model Bias'],
    description:'A planner has a predicted mean cost and a predicted cost variance for each candidate action. Implement a simple risk-sensitive upper-confidence cost rule: minimize mean + risk_weight × standard deviation.',
    requirements:[
      'means and variances are dicts with exactly the same action-name keys, each variance is nonnegative, and risk_weight is nonnegative.',
      'Score each action as means[action] + risk_weight * sqrt(variances[action]).',
      'Return the lowest-scoring action, breaking exact ties lexicographically.',
      'Return None if the action dictionaries are empty. The standard deviation is sqrt(variance), not variance itself.'
    ],
    signature:'risk_sensitive_action(means, variances, risk_weight)',
    starter:`def risk_sensitive_action(means, variances, risk_weight):\n    """Pick an action minimizing a mean-plus-uncertainty cost."""\n    # TODO\n    pass`,
    solution:`import math\n\ndef risk_sensitive_action(means, variances, risk_weight):\n    if not means:\n        return None\n    return min(\n        sorted(means),\n        key=lambda a: means[a] + risk_weight * math.sqrt(variances[a])\n    )`,
    explanation:[
      'Mean-only planners ignore how uncertain their imagined outcomes are. The added standard-deviation term creates a tunable preference for lower-uncertainty options.',
      'Converting variance to standard deviation matters because the two have different units; the coefficient applies to standard deviation here.',
      'With risk_weight zero, this reduces exactly to a mean-cost planner. This is a toy risk heuristic, not a calibrated probabilistic safety guarantee.'
    ],
    complexity:'Time: O(A log A) for sorting A action keys; auxiliary space O(A).',
    pitfall:'Using risk_weight × variance rather than × sqrt(variance) changes rankings and violates the stated decision rule.',
    hints:['Use math.sqrt on each variance.','Sort action names before applying min(..., key=...) to break ties consistently.'],
    references:[{title:'World Models & Spatial Intelligence — uncertainty and planning',url:'https://overdued.github.io/world-model-spatial-intelligence-course/'}],
    tests:[
      {name:'Uncertainty changes choice',code:`assert risk_sensitive_action({'risky':0,'safe':2},{'risky':16,'safe':0},1.0)=='safe'`},
      {name:'Zero risk selects mean',code:`assert risk_sensitive_action({'a':1,'b':2},{'a':100,'b':0},0.0)=='a'`},
      {name:'Square root, not variance',code:`assert risk_sensitive_action({'a':0,'b':4},{'a':9,'b':0},1.0)=='a'`},
      {name:'Alphabetical ties',code:`assert risk_sensitive_action({'z':1,'a':1},{'z':0,'a':0},2.0)=='a'`},
      {name:'Empty action dictionary',code:`assert risk_sensitive_action({}, {},1.0) is None`},
      {name:'Zero variance',code:`assert risk_sensitive_action({'a':0,'b':1},{'a':0,'b':0},1.0)=='a'`}
    ]
  }
];
