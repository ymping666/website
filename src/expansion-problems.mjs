// FrontierCode v0.7 — 13 original, fully specified, independently tested exercises.
export const expansionProblems = [
  {
    "id": "agent-topological-schedule",
    "number": 18,
    "track": "Agent Engineering",
    "difficulty": "Medium",
    "title": "Schedule an Agent Plan in Dependency Order",
    "duration": "20 min",
    "tags": [
      "Planning",
      "DAG",
      "Topological Sort"
    ],
    "description": "A plan executor receives named tasks and their prerequisites. Produce a deterministic execution order or detect that a circular plan cannot be executed.",
    "requirements": [
      "tasks maps task names to prerequisite-name lists. Every prerequisite exists as a task key; inputs may contain cycles.",
      "Return a list including each task exactly once, with every prerequisite scheduled before its dependent.",
      "Among currently ready tasks, always choose the lexicographically smallest name.",
      "Return None if no complete topological schedule exists (including self-dependencies). Return [] for no tasks."
    ],
    "signature": "schedule_plan(tasks)",
    "starter": "def schedule_plan(tasks):\n    \"\"\"Return lexicographic topological order or None on cycles.\"\"\"\n    # TODO\n    pass",
    "solution": "import heapq\n\ndef schedule_plan(tasks):\n    indegree = {name: len(set(deps)) for name, deps in tasks.items()}\n    successors = {name: [] for name in tasks}\n    for name, deps in tasks.items():\n        for dep in set(deps):\n            successors[dep].append(name)\n    ready = [name for name, deg in indegree.items() if deg == 0]\n    heapq.heapify(ready)\n    order = []\n    while ready:\n        name = heapq.heappop(ready)\n        order.append(name)\n        for child in successors[name]:\n            indegree[child] -= 1\n            if indegree[child] == 0:\n                heapq.heappush(ready, child)\n    return order if len(order) == len(tasks) else None",
    "explanation": [
      "A task dependency graph is a directed graph. Kahn’s algorithm tracks how many prerequisites remain unsatisfied.",
      "A min-heap selects the alphabetically first ready task, making the output reproducible.",
      "If tasks remain unscheduled after the heap becomes empty, the graph contains a directed cycle.",
      "Deduplicating each prerequisite list prevents duplicate edges from corrupting the in-degree count."
    ],
    "complexity": "Time O((V+E) log V) with a min-heap, extra space O(V+E).",
    "pitfall": "Sorting task names first is not enough; lexical order must never violate prerequisites.",
    "hints": [
      "Build an in-degree map and reverse dependency edges.",
      "Use heapq to pick the next available task, and check whether all tasks were scheduled."
    ],
    "references": [
      {
        "title": "Hello-Agents — conceptual overview",
        "url": "https://github.com/datawhalechina/hello-agents"
      }
    ],
    "tests": [
      {
        "name": "Simple chain",
        "code": "assert schedule_plan({'write':['research'],'research':[]}) == ['research','write']"
      },
      {
        "name": "Independent tasks",
        "code": "assert schedule_plan({'z':[],'a':[],'b':[]}) == ['a','b','z']"
      },
      {
        "name": "Ready task ordering",
        "code": "assert schedule_plan({'c':['a'],'b':[],'a':[]}) == ['a','b','c']"
      },
      {
        "name": "Cycle",
        "code": "assert schedule_plan({'a':['b'],'b':['a']}) is None"
      },
      {
        "name": "Self dependency",
        "code": "assert schedule_plan({'a':['a']}) is None"
      },
      {
        "name": "Empty graph",
        "code": "assert schedule_plan({}) == []"
      },
      {
        "name": "Duplicate prerequisite",
        "code": "assert schedule_plan({'a':[],'b':['a','a']}) == ['a','b']"
      },
      {
        "name": "Do not mutate plan",
        "code": "x={'b':['a'],'a':[]}; schedule_plan(x); assert x=={'b':['a'],'a':[]}"
      }
    ]
  },
  {
    "id": "agent-merge-tool-results",
    "number": 19,
    "track": "Agent Engineering",
    "difficulty": "Medium",
    "title": "Merge Parallel Tool Results in Call Order",
    "duration": "17 min",
    "tags": [
      "Tools",
      "Concurrency",
      "Determinism"
    ],
    "description": "Parallel tool calls can finish in any order. Restore the original request order without losing legitimate None results or accepting stale replies.",
    "requirements": [
      "call_ids is a list of distinct string IDs in dispatch order; responses contains (call_id, value) pairs in arrival order.",
      "For each dispatched call return (call_id, first_value) in dispatch order. Use None for calls with no response.",
      "Ignore response IDs that were never dispatched. If duplicate results arrive for one ID, the first observed value wins.",
      "Do not mutate the inputs. Values are arbitrary Python objects including None."
    ],
    "signature": "merge_results(call_ids, responses)",
    "starter": "def merge_results(call_ids, responses):\n    \"\"\"Align out-of-order tool results with dispatched IDs.\"\"\"\n    # TODO\n    pass",
    "solution": "def merge_results(call_ids, responses):\n    allowed = set(call_ids)\n    first = {}\n    for call_id, value in responses:\n        if call_id in allowed and call_id not in first:\n            first[call_id] = value\n    return [(call_id, first.get(call_id)) for call_id in call_ids]",
    "explanation": [
      "Model tool invocations with unique correlation IDs rather than matching responses by arrival position.",
      "Collect the first recognized response per ID. Membership tests distinguish a genuine None value from an unseen response.",
      "Iterate over call_ids at the end to return stable dispatch order even if execution was concurrent."
    ],
    "complexity": "Time O(N+M), extra space O(N+M) for N calls and M replies.",
    "pitfall": "A simple dict assignment keeps the last duplicate, which violates first-response-wins.",
    "hints": [
      "Build a set of known request IDs.",
      "Only add a response when its ID is recognized and not already in the result mapping."
    ],
    "references": [
      {
        "title": "Hello-Agents — conceptual overview",
        "url": "https://github.com/datawhalechina/hello-agents"
      }
    ],
    "tests": [
      {
        "name": "Out-of-order replies",
        "code": "assert merge_results(['a','b'], [('b',2),('a',1)]) == [('a',1),('b',2)]"
      },
      {
        "name": "Missing reply",
        "code": "assert merge_results(['a','b'], [('b',2)]) == [('a',None),('b',2)]"
      },
      {
        "name": "First duplicate wins",
        "code": "assert merge_results(['a'], [('a',1),('a',99)]) == [('a',1)]"
      },
      {
        "name": "Unknown reply ignored",
        "code": "assert merge_results(['a'], [('x',100),('a',3)]) == [('a',3)]"
      },
      {
        "name": "None is legitimate",
        "code": "assert merge_results(['a'], [('a',None),('a','late')]) == [('a',None)]"
      },
      {
        "name": "No calls",
        "code": "assert merge_results([], [('x',9)]) == []"
      },
      {
        "name": "Input preserved",
        "code": "r=[('b',2),('a',1)]; merge_results(['a','b'],r); assert r==[('b',2),('a',1)]"
      }
    ]
  },
  {
    "id": "agent-exponential-backoff",
    "number": 20,
    "track": "Agent Engineering",
    "difficulty": "Easy",
    "title": "Implement Bounded Tool Retry Backoff",
    "duration": "14 min",
    "tags": [
      "Reliability",
      "Retry",
      "Rate Limits"
    ],
    "description": "After a tool failure, an agent runner should wait before retrying. Implement a bounded exponential retry schedule and reset it after a successful call.",
    "requirements": [
      "outcomes is a chronological list of booleans: True means a successful call; False means failure.",
      "For a success, emit 0.0 and reset the failure streak.",
      "For the n-th consecutive failure, emit min(max_delay, base_delay * 2**(n-1)).",
      "Assume 0 < base_delay <= max_delay. Return one floating-point delay per outcome without sleeping."
    ],
    "signature": "retry_delays(outcomes, base_delay, max_delay)",
    "starter": "def retry_delays(outcomes, base_delay, max_delay):\n    \"\"\"Pure function: calculate delays, do not call sleep().\"\"\"\n    # TODO\n    pass",
    "solution": "def retry_delays(outcomes, base_delay, max_delay):\n    result = []\n    delay = 0.0\n    for success in outcomes:\n        if success:\n            delay = 0.0\n            result.append(0.0)\n        else:\n            delay = min(max_delay, base_delay if delay == 0 else delay * 2)\n            result.append(float(delay))\n    return result",
    "explanation": [
      "A consecutive failure streak doubles the delay, reducing repeated requests to a failing service.",
      "Capping the incremental delay avoids gigantic exponent computations after very long failure sequences.",
      "A successful operation resets the retry state; this exercise computes delays only and does not perform I/O."
    ],
    "complexity": "Time O(n), additional space O(n) for the output list.",
    "pitfall": "Counting total failures rather than consecutive failures misses recovery resets.",
    "hints": [
      "Track the previous delay and reset it on success.",
      "Clamp each doubled delay to max_delay."
    ],
    "references": [
      {
        "title": "Hello-Agents — conceptual overview",
        "url": "https://github.com/datawhalechina/hello-agents"
      }
    ],
    "tests": [
      {
        "name": "Basic retry pattern",
        "code": "assert retry_delays([False,False,False],1,10) == [1.0,2.0,4.0]"
      },
      {
        "name": "Cap",
        "code": "assert retry_delays([False]*6,1,5) == [1.0,2.0,4.0,5.0,5.0,5.0]"
      },
      {
        "name": "Reset on success",
        "code": "assert retry_delays([False,False,True,False],1,10) == [1.0,2.0,0.0,1.0]"
      },
      {
        "name": "No events",
        "code": "assert retry_delays([],1,5)==[]"
      },
      {
        "name": "Noninteger cap",
        "code": "assert retry_delays([False]*4,0.5,1.5)==[0.5,1.0,1.5,1.5]"
      },
      {
        "name": "All success",
        "code": "assert retry_delays([True,True],1,8)==[0.0,0.0]"
      },
      {
        "name": "Long run stays bounded",
        "code": "d=retry_delays([False]*300,1,3); assert len(d)==300 and d[-1]==3.0"
      }
    ]
  },
  {
    "id": "agent-jsonrpc-response",
    "number": 21,
    "track": "Agent Engineering",
    "difficulty": "Medium",
    "title": "Validate a JSON-RPC Tool Response Envelope",
    "duration": "19 min",
    "tags": [
      "Tool Protocol",
      "JSON-RPC",
      "Validation"
    ],
    "description": "Tool integrations often exchange JSON-RPC-shaped messages. Validate a simplified response envelope and classify successful results versus remote errors.",
    "requirements": [
      "message is a Python object representing decoded JSON; expected_id is a str or int (bool is not a valid ID).",
      "A valid envelope must be a dict with jsonrpc == \"2.0\", and an id whose type AND value equal expected_id.",
      "Exactly one of \"result\" or \"error\" must exist. Any JSON value is permitted for result, including None.",
      "If error is used, it must be a dict with non-bool int code and nonblank string message. Return \"success\", \"remote_error\", or \"invalid\"."
    ],
    "signature": "classify_rpc_response(message, expected_id)",
    "starter": "def classify_rpc_response(message, expected_id):\n    \"\"\"Classify a simplified JSON-RPC 2.0 response envelope.\"\"\"\n    # TODO\n    pass",
    "solution": "def classify_rpc_response(message, expected_id):\n    if not isinstance(message, dict) or message.get('jsonrpc') != '2.0':\n        return 'invalid'\n    actual_id = message.get('id')\n    if type(expected_id) not in (str, int) or type(actual_id) is not type(expected_id) or actual_id != expected_id:\n        return 'invalid'\n    has_result = 'result' in message\n    has_error = 'error' in message\n    if has_result == has_error:\n        return 'invalid'\n    if has_result:\n        return 'success'\n    error = message['error']\n    if not isinstance(error, dict):\n        return 'invalid'\n    code = error.get('code')\n    label = error.get('message')\n    if type(code) is not int or not isinstance(label, str) or not label.strip():\n        return 'invalid'\n    return 'remote_error' ",
    "explanation": [
      "Do not assume any parsed JSON value has the shape of an RPC response.",
      "Check whether each key exists rather than testing whether its value is truthy: null is a legal successful result.",
      "The expected correlation ID must match both value and type; Python considers True == 1, so explicit type equality matters.",
      "A valid remote error is different from an invalid protocol envelope; callers should handle these cases separately."
    ],
    "complexity": "Time O(1), additional space O(1), treating envelope fields as already-decoded objects.",
    "pitfall": "Using message.get(\"result\") to test for success rejects a valid response with result=None.",
    "hints": [
      "Use the XOR of key-presence checks to enforce exactly one result kind.",
      "Beware of bool being a subclass of int in Python."
    ],
    "references": [
      {
        "title": "JSON-RPC 2.0 Specification",
        "url": "https://www.jsonrpc.org/specification"
      }
    ],
    "tests": [
      {
        "name": "Valid result",
        "code": "assert classify_rpc_response({'jsonrpc':'2.0','id':1,'result':{'ok':True}},1)=='success'"
      },
      {
        "name": "Null result is valid",
        "code": "assert classify_rpc_response({'jsonrpc':'2.0','id':'a','result':None},'a')=='success'"
      },
      {
        "name": "Remote error",
        "code": "assert classify_rpc_response({'jsonrpc':'2.0','id':2,'error':{'code':-32602,'message':'Bad args'}},2)=='remote_error'"
      },
      {
        "name": "Both fields invalid",
        "code": "assert classify_rpc_response({'jsonrpc':'2.0','id':1,'result':3,'error':{'code':-1,'message':'bad'}},1)=='invalid'"
      },
      {
        "name": "Missing fields",
        "code": "assert classify_rpc_response({'jsonrpc':'2.0','id':1},1)=='invalid'"
      },
      {
        "name": "Mismatched id type",
        "code": "assert classify_rpc_response({'jsonrpc':'2.0','id':True,'result':1},1)=='invalid'"
      },
      {
        "name": "Invalid error code",
        "code": "assert classify_rpc_response({'jsonrpc':'2.0','id':1,'error':{'code':True,'message':'bad'}},1)=='invalid'"
      },
      {
        "name": "Invalid version",
        "code": "assert classify_rpc_response({'jsonrpc':'1.0','id':1,'result':1},1)=='invalid'"
      },
      {
        "name": "Wrong container",
        "code": "assert classify_rpc_response([],1)=='invalid'"
      }
    ]
  },
  {
    "id": "world-discrete-bayes-filter",
    "number": 22,
    "track": "World Models",
    "difficulty": "Medium",
    "title": "Update a Discrete POMDP Belief State",
    "duration": "24 min",
    "tags": [
      "Belief States",
      "POMDP",
      "Bayesian Filtering"
    ],
    "description": "A partially observed world model predicts the next hidden state using a transition matrix, then incorporates a new observation using Bayes’ rule.",
    "requirements": [
      "belief is a probability vector of length n. transition is an n×n row-stochastic matrix where transition[i][j] = P(s_next=j | s=i).",
      "likelihood[j] is P(observation | s_next=j). All elements are finite and nonnegative. Assume dimension consistency.",
      "Compute predicted[j] = sum_i belief[i] * transition[i][j], then posterior[j] ∝ predicted[j] * likelihood[j].",
      "Normalize to sum to one. If the normalizer is zero, raise ValueError. Return a new list without mutating input."
    ],
    "signature": "belief_update(belief, transition, likelihood)",
    "starter": "def belief_update(belief, transition, likelihood):\n    \"\"\"One predict/update step for a finite-state POMDP.\"\"\"\n    # TODO\n    pass",
    "solution": "def belief_update(belief, transition, likelihood):\n    n = len(belief)\n    predicted = [sum(belief[i] * transition[i][j] for i in range(n)) for j in range(n)]\n    unnormalized = [predicted[j] * likelihood[j] for j in range(n)]\n    evidence = sum(unnormalized)\n    if evidence == 0:\n        raise ValueError('observation has zero probability')\n    return [value / evidence for value in unnormalized]",
    "explanation": [
      "Predict: marginalize over the previous hidden state using the action-conditioned transition model (a fixed action is implicit here).",
      "Update: multiply each predicted state probability by the likelihood of the new observation.",
      "Normalize the unnormalized posterior. A zero evidence term means the observation is impossible under the supplied model.",
      "The returned vector is a belief over hidden states, not a guess of a single most-likely state."
    ],
    "complexity": "Time O(n²), extra space O(n), for n hidden states.",
    "pitfall": "Normalizing only the observation likelihood discards the dynamics prior.",
    "hints": [
      "Compute each predicted state j by summing over source states i.",
      "Multiply by likelihood and normalize only after all states are updated."
    ],
    "references": [
      {
        "title": "World Models & Spatial Intelligence — study roadmap",
        "url": "https://overdued.github.io/world-model-spatial-intelligence-course/"
      }
    ],
    "tests": [
      {
        "name": "Identity transition",
        "code": "assert all(abs(a-b)<1e-12 for a,b in zip(belief_update([.5,.5],[[1,0],[0,1]],[.8,.2]),[.8,.2]))"
      },
      {
        "name": "State swap",
        "code": "assert belief_update([1,0],[[0,1],[1,0]],[.2,.9])==[0.0,1.0]"
      },
      {
        "name": "Dynamics plus observation",
        "code": "r=belief_update([.8,.2],[[.9,.1],[.2,.8]],[.25,.75]); assert abs(r[0]-.19/.37)<1e-12 and abs(r[1]-.18/.37)<1e-12"
      },
      {
        "name": "Uniform likelihood preserves prior",
        "code": "r=belief_update([.25,.75],[[1,0],[0,1]],[.5,.5]); assert all(abs(a-b)<1e-12 for a,b in zip(r,[.25,.75]))"
      },
      {
        "name": "Zero evidence",
        "code": "try:\n belief_update([1,0],[[1,0],[0,1]],[0,1]); assert False\nexcept ValueError: pass"
      },
      {
        "name": "One state",
        "code": "assert belief_update([1],[[1]],[.2]) == [1.0]"
      },
      {
        "name": "Inputs unchanged",
        "code": "b=[.5,.5]; t=[[1,0],[0,1]]; l=[.1,.9]; belief_update(b,t,l); assert b==[.5,.5] and t==[[1,0],[0,1]] and l==[.1,.9]"
      }
    ]
  },
  {
    "id": "world-belief-propagation",
    "number": 23,
    "track": "World Models",
    "difficulty": "Medium",
    "title": "Propagate a Linear-Gaussian State Belief",
    "duration": "19 min",
    "tags": [
      "Dynamics",
      "Uncertainty",
      "Stochastic Models"
    ],
    "description": "A simplified stochastic dynamics model has x_(t+1) = a*x_t + u_t + noise, with independent zero-mean Gaussian process noise. Propagate the mean and variance through a control sequence.",
    "requirements": [
      "mean and variance are scalars for the initial Gaussian belief, variance >= 0. Assume process_var >= 0 and controls are finite.",
      "At each control u, update mean = a*mean + u.",
      "Update variance = (a*a)*variance + process_var independently of u.",
      "Return [(next_mean, next_variance), ...] after each control, excluding the initial state; [] for empty controls."
    ],
    "signature": "propagate_belief(mean, variance, a, process_var, controls)",
    "starter": "def propagate_belief(mean, variance, a, process_var, controls):\n    \"\"\"Return Gaussian belief moments after each action.\"\"\"\n    # TODO\n    pass",
    "solution": "def propagate_belief(mean, variance, a, process_var, controls):\n    output = []\n    for u in controls:\n        mean = a * mean + u\n        variance = a * a * variance + process_var\n        output.append((mean, variance))\n    return output",
    "explanation": [
      "For linear Gaussian transitions, expectations and variances can be propagated analytically without sampling.",
      "Multiplying a random variable by a scales its variance by a². Independent additive noise contributes process_var.",
      "Uncertainty accumulates over longer imagined trajectories even if the mean trajectory looks plausible."
    ],
    "complexity": "Time O(T), output/extra space O(T) for T controls.",
    "pitfall": "Updating variance with a rather than a² is wrong and can create negative variances for negative a.",
    "hints": [
      "The mean follows the deterministic transition.",
      "The variance uses a**2 and adds process noise at each step."
    ],
    "references": [
      {
        "title": "World Models & Spatial Intelligence — study roadmap",
        "url": "https://overdued.github.io/world-model-spatial-intelligence-course/"
      }
    ],
    "tests": [
      {
        "name": "Two controls",
        "code": "assert propagate_belief(0,1,1,.5,[2,3])==[(2,1.5),(5,2.0)]"
      },
      {
        "name": "Negative dynamics gain",
        "code": "assert propagate_belief(1,2,-2,1,[0])==[(-2,9)]"
      },
      {
        "name": "Zero dynamics",
        "code": "assert propagate_belief(5,3,0,2,[1,2])==[(1,2),(2,2)]"
      },
      {
        "name": "Empty controls",
        "code": "assert propagate_belief(0,1,1,1,[])==[]"
      },
      {
        "name": "Deterministic case",
        "code": "assert propagate_belief(1,0,2,0,[1,0])==[(3,0),(6,0)]"
      },
      {
        "name": "Process variance every step",
        "code": "assert propagate_belief(0,0,1,.25,[0,0,0])==[(0,.25),(0,.5),(0,.75)]"
      }
    ]
  },
  {
    "id": "world-rollout-error-curve",
    "number": 24,
    "track": "World Models",
    "difficulty": "Medium",
    "title": "Compute a Multi-Step Rollout Error Curve",
    "duration": "21 min",
    "tags": [
      "Rollouts",
      "Evaluation",
      "Horizon"
    ],
    "description": "One-step prediction accuracy can hide compounding model errors. Build an error curve that tracks cumulative mean squared error as the open-loop rollout horizon increases.",
    "requirements": [
      "predicted and target are equal-length sequences of state vectors. All vectors share a nonzero dimension d; inputs can be empty.",
      "For horizon h (1-indexed), return squared error averaged over the first h state vectors and all d coordinates.",
      "Output a list of length T, one value for every prefix horizon h=1..T. Return [] when T=0.",
      "Do not mutate inputs and do not use NumPy or external packages."
    ],
    "signature": "rollout_mse_curve(predicted, target)",
    "starter": "def rollout_mse_curve(predicted, target):\n    \"\"\"Compute prefix MSE for horizons 1..T.\"\"\"\n    # TODO\n    pass",
    "solution": "def rollout_mse_curve(predicted, target):\n    if not predicted:\n        return []\n    dimensions = len(predicted[0])\n    accumulated = 0.0\n    curve = []\n    for h, (estimated, actual) in enumerate(zip(predicted, target), start=1):\n        accumulated += sum((x - y) ** 2 for x, y in zip(estimated, actual))\n        curve.append(accumulated / (h * dimensions))\n    return curve",
    "explanation": [
      "Per-step coordinate errors can be accumulated as the horizon grows.",
      "The prefix denominator is h*d, so each horizon measures all coordinates observed through that step.",
      "An error curve is a diagnostic; a model with lower rollout MSE need not induce better decisions in a planner."
    ],
    "complexity": "Time O(Td), additional space O(T) for T steps of d-dimensional states.",
    "pitfall": "Dividing by only d reports cumulative squared error, not prefix MSE.",
    "hints": [
      "Accumulate the squared residuals at each time step.",
      "Normalize by the total number of coordinates seen so far."
    ],
    "references": [
      {
        "title": "World Models & Spatial Intelligence — study roadmap",
        "url": "https://overdued.github.io/world-model-spatial-intelligence-course/"
      }
    ],
    "tests": [
      {
        "name": "Two scalar steps",
        "code": "assert rollout_mse_curve([[1],[3]],[[0],[1]])==[1.0,2.5]"
      },
      {
        "name": "Two coordinates",
        "code": "assert rollout_mse_curve([[1,1],[2,2]],[[0,0],[1,1]])==[1.0,1.0]"
      },
      {
        "name": "Late error",
        "code": "assert rollout_mse_curve([[0],[0],[3]],[[0],[0],[0]])==[0.0,0.0,3.0]"
      },
      {
        "name": "Empty sequence",
        "code": "assert rollout_mse_curve([],[])==[]"
      },
      {
        "name": "Exact predictions",
        "code": "assert rollout_mse_curve([[1,2],[-1,3]],[[1,2],[-1,3]])==[0.0,0.0]"
      },
      {
        "name": "Negative error symmetric",
        "code": "assert rollout_mse_curve([[-2]],[[2]])==[16.0]"
      }
    ]
  },
  {
    "id": "world-diagonal-gaussian-kl",
    "number": 25,
    "track": "World Models",
    "difficulty": "Hard",
    "title": "Compute the KL Loss of a Gaussian Latent State",
    "duration": "26 min",
    "tags": [
      "RSSM",
      "Latent Variables",
      "KL Divergence"
    ],
    "description": "Probabilistic latent-state models compare an approximate posterior with a prior. Implement the KL divergence between two diagonal Gaussian distributions; this is one building block, not a full RSSM.",
    "requirements": [
      "q_mean, q_var, p_mean and p_var are equal-length vectors; all variance entries are strictly positive.",
      "Return KL(q || p) summed over dimensions: 0.5 * sum(log(p_var/q_var) + (q_var + (q_mean-p_mean)**2)/p_var - 1).",
      "Return 0.0 for zero-dimensional vectors. Use the natural logarithm.",
      "Do not import NumPy and do not assume the divergence is symmetric."
    ],
    "signature": "diagonal_gaussian_kl(q_mean, q_var, p_mean, p_var)",
    "starter": "def diagonal_gaussian_kl(q_mean, q_var, p_mean, p_var):\n    \"\"\"KL(q || p) for diagonal Gaussians (variances, not stddevs).\"\"\"\n    # TODO\n    pass",
    "solution": "import math\n\ndef diagonal_gaussian_kl(q_mean, q_var, p_mean, p_var):\n    total = 0.0\n    for mq, vq, mp, vp in zip(q_mean, q_var, p_mean, p_var):\n        total += math.log(vp / vq) + (vq + (mq - mp) ** 2) / vp - 1\n    return 0.5 * total",
    "explanation": [
      "KL divergence between independent dimensions is the sum of the scalar divergences.",
      "The relative variance and squared mean difference both contribute; posterior and prior positions cannot be swapped.",
      "This exercise assumes diagonal Gaussian distributions and is not an implementation of the recurrent state-space model or its full training objective."
    ],
    "complexity": "Time O(d), extra space O(1) for d latent coordinates.",
    "pitfall": "Confusing variance with standard deviation introduces a systematic factor-of-two error.",
    "hints": [
      "Write out the one-dimensional closed form first.",
      "For d independent coordinates, sum the terms and multiply by 0.5."
    ],
    "references": [
      {
        "title": "Learning Latent Dynamics for Planning from Pixels (Hafner et al.)",
        "url": "https://arxiv.org/abs/1811.04551"
      }
    ],
    "tests": [
      {
        "name": "Identical distributions",
        "code": "assert abs(diagonal_gaussian_kl([0,1],[1,2],[0,1],[1,2]))<1e-12"
      },
      {
        "name": "Shifted mean",
        "code": "assert abs(diagonal_gaussian_kl([2],[1],[0],[1])-2)<1e-12"
      },
      {
        "name": "Different variances",
        "code": "import math; assert abs(diagonal_gaussian_kl([0],[1],[0],[2])-(.5*(math.log(2)+.5-1)))<1e-12"
      },
      {
        "name": "Non-symmetry",
        "code": "a=diagonal_gaussian_kl([0],[1],[0],[4]); b=diagonal_gaussian_kl([0],[4],[0],[1]); assert abs(a-b)>0.1"
      },
      {
        "name": "Additivity over dimensions",
        "code": "a=diagonal_gaussian_kl([0],[1],[1],[2]); b=diagonal_gaussian_kl([1],[2],[0],[1]); c=diagonal_gaussian_kl([0,1],[1,2],[1,0],[2,1]); assert abs(c-a-b)<1e-12"
      },
      {
        "name": "Zero dimension",
        "code": "assert diagonal_gaussian_kl([],[],[],[])==0.0"
      },
      {
        "name": "Two squared means",
        "code": "assert abs(diagonal_gaussian_kl([1,-1],[1,1],[0,0],[1,1])-1)<1e-12"
      }
    ]
  },
  {
    "id": "llm-mean-reciprocal-rank",
    "number": 26,
    "track": "LLM Systems",
    "difficulty": "Easy",
    "title": "Implement Mean Reciprocal Rank for Retrieval",
    "duration": "14 min",
    "tags": [
      "RAG",
      "Ranking",
      "Evaluation"
    ],
    "description": "Retrieval systems often need a ranking-sensitive metric. Calculate MRR from per-query ranked IDs and relevance sets.",
    "requirements": [
      "ranked_lists is a list of document-ID lists; relevant_per_query is the corresponding list of relevant-ID collections.",
      "For each query, use 1/r where r is the 1-indexed rank of the FIRST relevant result; assign zero if none is retrieved.",
      "Return the arithmetic mean over queries. Return 0.0 for no queries.",
      "Do not count all relevant results: MRR is based only on the first relevant rank."
    ],
    "signature": "mean_reciprocal_rank(ranked_lists, relevant_per_query)",
    "starter": "def mean_reciprocal_rank(ranked_lists, relevant_per_query):\n    \"\"\"Return retrieval MRR across queries.\"\"\"\n    # TODO\n    pass",
    "solution": "def mean_reciprocal_rank(ranked_lists, relevant_per_query):\n    if not ranked_lists:\n        return 0.0\n    total = 0.0\n    for ranked, relevant in zip(ranked_lists, relevant_per_query):\n        gold = set(relevant)\n        for rank, doc in enumerate(ranked, start=1):\n            if doc in gold:\n                total += 1.0 / rank\n                break\n    return total / len(ranked_lists)",
    "explanation": [
      "MRR rewards putting the first relevant document near the top of the ranked list.",
      "Missing relevant documents contribute zero; they remain in the denominator.",
      "Unlike Recall@K, MRR does not reward finding additional relevant documents after the first."
    ],
    "complexity": "Time O(sum lengths of ranked lists plus relevance sets), additional space O(max relevance-set size).",
    "pitfall": "Dividing by only queries with at least one hit artificially inflates MRR.",
    "hints": [
      "Find the index of the first relevant document, if any.",
      "Average reciprocal ranks over ALL queries, including misses."
    ],
    "references": [],
    "tests": [
      {
        "name": "One hit at rank two",
        "code": "assert mean_reciprocal_rank([['x','a']], [['a']])==.5"
      },
      {
        "name": "Mixed queries",
        "code": "assert abs(mean_reciprocal_rank([['a'],['x','b'],['z']], [['a'],['b'],['c']])-.5)<1e-12"
      },
      {
        "name": "First hit only",
        "code": "assert mean_reciprocal_rank([['a','b']], [['a','b']])==1.0"
      },
      {
        "name": "Empty query list",
        "code": "assert mean_reciprocal_rank([],[])==0.0"
      },
      {
        "name": "No hits",
        "code": "assert mean_reciprocal_rank([['x']], [['a']])==0.0"
      },
      {
        "name": "Two possible relevant",
        "code": "assert mean_reciprocal_rank([['z','b','a']], [['a','b']])==.5"
      },
      {
        "name": "Repeated result",
        "code": "assert mean_reciprocal_rank([['x','x','a']], [['a']])==1/3"
      }
    ]
  },
  {
    "id": "llm-topk-softmax",
    "number": 27,
    "track": "LLM Systems",
    "difficulty": "Medium",
    "title": "Implement Stable Top-K Token Probabilities",
    "duration": "21 min",
    "tags": [
      "Sampling",
      "Numerical Stability",
      "Inference"
    ],
    "description": "An LLM decoder restricts the candidate vocabulary to K logits before renormalizing their probabilities. Implement this deterministic probability transform without actually sampling a token.",
    "requirements": [
      "logits is a nonempty list of finite floats; k is an integer between 1 and len(logits), inclusive.",
      "Retain the k indices with highest logit values; break equal-logit ties in favor of lower token indices.",
      "Apply softmax to only the retained logits, subtracting their maximum before exponentiation to avoid overflow.",
      "Return a probability list of the original vocabulary length, with 0.0 at excluded indices and total probability ~1."
    ],
    "signature": "top_k_probabilities(logits, k)",
    "starter": "def top_k_probabilities(logits, k):\n    \"\"\"Return stable top-k softmax weights for token indices.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\n\ndef top_k_probabilities(logits, k):\n    selected = sorted(range(len(logits)), key=lambda i: (-logits[i], i))[:k]\n    peak = max(logits[i] for i in selected)\n    weights = [math.exp(logits[i] - peak) for i in selected]\n    total = sum(weights)\n    result = [0.0] * len(logits)\n    for idx, weight in zip(selected, weights):\n        result[idx] = weight / total\n    return result",
    "explanation": [
      "Sorting by descending logit and then ascending index produces deterministic top-k membership.",
      "Excluded tokens must have exactly zero probability before renormalization.",
      "Subtracting the maximum logit avoids overflow; softmax ratios are unchanged by a common offset."
    ],
    "complexity": "Time O(V log V), extra space O(V) for vocabulary size V.",
    "pitfall": "Running full-vocabulary softmax and then zeroing tail probabilities without renormalizing yields a distribution that sums to less than one.",
    "hints": [
      "Choose top-k indices first, not just top-k values.",
      "Normalize exp(logit - max_selected_logit) only across chosen indices."
    ],
    "references": [],
    "tests": [
      {
        "name": "Top one is deterministic",
        "code": "assert top_k_probabilities([1,3,2],1)==[0.0,1.0,0.0]"
      },
      {
        "name": "Equal logits tie index",
        "code": "assert top_k_probabilities([1,1,1],2)==[.5,.5,0.0]"
      },
      {
        "name": "Full vocabulary softmax",
        "code": "p=top_k_probabilities([0,0],2); assert p==[.5,.5]"
      },
      {
        "name": "Large positive logits",
        "code": "p=top_k_probabilities([1000,1001,999],2); assert p[2]==0.0 and abs(sum(p)-1)<1e-12 and p[1]>p[0]"
      },
      {
        "name": "Large negative logits",
        "code": "p=top_k_probabilities([-1001,-1000],1); assert p==[0.0,1.0]"
      },
      {
        "name": "Selected weights normalized",
        "code": "p=top_k_probabilities([3,2,1,0],3); assert abs(sum(p)-1)<1e-12 and p[-1]==0.0"
      },
      {
        "name": "Ties at boundary",
        "code": "assert top_k_probabilities([0,2,2,2],2)==[0.0,.5,.5,0.0]"
      }
    ]
  },
  {
    "id": "llm-evidence-context-pack",
    "number": 28,
    "track": "LLM Systems",
    "difficulty": "Easy",
    "title": "Pack Retrieved Evidence into a Token Budget",
    "duration": "13 min",
    "tags": [
      "RAG",
      "Context Budget",
      "Retrieval"
    ],
    "description": "Retrieved passages arrive in relevance order. Write a deterministic context packer that preserves the longest consecutive prefix that fits the remaining prompt budget.",
    "requirements": [
      "chunks is a list of distinct passage IDs; token_counts is a same-length list of nonnegative integers.",
      "Starting from the first passage, append a passage only when its token count fits the remaining budget.",
      "Stop immediately at the first passage that does not fit; do not skip ahead to later passages.",
      "Return a new list of accepted IDs, preserving order. budget is nonnegative."
    ],
    "signature": "pack_context(chunks, token_counts, budget)",
    "starter": "def pack_context(chunks, token_counts, budget):\n    \"\"\"Pack the longest fitting consecutive prefix.\"\"\"\n    # TODO\n    pass",
    "solution": "def pack_context(chunks, token_counts, budget):\n    accepted = []\n    remaining = budget\n    for chunk, count in zip(chunks, token_counts):\n        if count > remaining:\n            break\n        accepted.append(chunk)\n        remaining -= count\n    return accepted",
    "explanation": [
      "A strict prefix policy preserves the retriever’s ranking and avoids dropping a higher-ranked passage for a lower-ranked one.",
      "The budget is decremented after each accepted passage; a passage that exactly fits should be included.",
      "This models the context-assembly algorithm only. Real systems must account for message formatting and tokenizer-specific costs."
    ],
    "complexity": "Time O(n) in the number of inspected passages; additional space O(n) for accepted IDs.",
    "pitfall": "Skipping an oversized passage and adding a later smaller one breaks the strict-prefix requirement.",
    "hints": [
      "Iterate in the original retrieved order.",
      "Use break rather than continue when a passage does not fit."
    ],
    "references": [],
    "tests": [
      {
        "name": "Prefix fits",
        "code": "assert pack_context(['a','b','c'],[3,4,2],7)==['a','b']"
      },
      {
        "name": "Do not skip",
        "code": "assert pack_context(['a','b','c'],[3,8,1],5)==['a']"
      },
      {
        "name": "Exact budget",
        "code": "assert pack_context(['a'],[5],5)==['a']"
      },
      {
        "name": "First too big",
        "code": "assert pack_context(['a','b'],[6,1],5)==[]"
      },
      {
        "name": "Empty",
        "code": "assert pack_context([],[],10)==[]"
      },
      {
        "name": "Zero-count passage",
        "code": "assert pack_context(['a','b'],[0,1],0)==['a']"
      },
      {
        "name": "Original input unchanged",
        "code": "c=['x','y']; t=[1,2]; pack_context(c,t,1); assert c==['x','y'] and t==[1,2]"
      }
    ]
  },
  {
    "id": "foundation-epsilon-greedy",
    "number": 29,
    "track": "AI Foundations",
    "difficulty": "Easy",
    "title": "Choose an Epsilon-Greedy Action Deterministically",
    "duration": "14 min",
    "tags": [
      "Reinforcement Learning",
      "Exploration",
      "Policy"
    ],
    "description": "Epsilon-greedy policies balance exploitation and exploration. Implement the action choice using supplied random draws, so every solution can be tested without nondeterminism.",
    "requirements": [
      "q_values is a nonempty list of finite action values, epsilon is in [0,1], and uniform_draw is in [0,1).",
      "When uniform_draw < epsilon, return random_index (a valid action index supplied by the caller).",
      "Otherwise return the index with maximum Q-value. Break ties in favor of the lowest index.",
      "Do not call the random module; the random draw and random action index are already provided."
    ],
    "signature": "epsilon_greedy(q_values, epsilon, uniform_draw, random_index)",
    "starter": "def epsilon_greedy(q_values, epsilon, uniform_draw, random_index):\n    \"\"\"Choose an action from supplied random values.\"\"\"\n    # TODO\n    pass",
    "solution": "def epsilon_greedy(q_values, epsilon, uniform_draw, random_index):\n    if uniform_draw < epsilon:\n        return random_index\n    return max(range(len(q_values)), key=lambda i: q_values[i])",
    "explanation": [
      "Epsilon is the probability of exploring rather than following the current greedy action.",
      "Injecting the random draw into the function makes the policy testable with exact expectations.",
      "Python max returns the first maximum in an ordered sequence of action indices, giving deterministic tie-breaking."
    ],
    "complexity": "Time O(A) in greedy mode, O(1) in exploration mode; additional space O(1).",
    "pitfall": "Exploration is uniform over ALL actions, including the greedy action; do not exclude the maximum-value action.",
    "hints": [
      "Compare uniform_draw against epsilon.",
      "For greedy selection, iterate action indices in ascending order."
    ],
    "references": [],
    "tests": [
      {
        "name": "Pure greedy",
        "code": "assert epsilon_greedy([1,5,3],0,0.1,0)==1"
      },
      {
        "name": "Explore chosen action",
        "code": "assert epsilon_greedy([1,5,3],1,.9,2)==2"
      },
      {
        "name": "Boundary draw equality",
        "code": "assert epsilon_greedy([1,5],.5,.5,0)==1"
      },
      {
        "name": "Tie lowest index",
        "code": "assert epsilon_greedy([4,4,1],0,.7,2)==0"
      },
      {
        "name": "Explore greedy possible",
        "code": "assert epsilon_greedy([1,5],1,.1,1)==1"
      },
      {
        "name": "Negative values",
        "code": "assert epsilon_greedy([-4,-1,-3],0,.2,0)==1"
      },
      {
        "name": "Single action",
        "code": "assert epsilon_greedy([1],.2,.9,0)==0"
      }
    ]
  },
  {
    "id": "foundation-nstep-return",
    "number": 30,
    "track": "AI Foundations",
    "difficulty": "Medium",
    "title": "Compute a Terminal-Aware Discounted Return",
    "duration": "17 min",
    "tags": [
      "Reinforcement Learning",
      "Returns",
      "Bootstrapping"
    ],
    "description": "Reinforcement-learning targets combine observed rewards and a bootstrap estimate when the rollout has not terminated. Implement a discounted return that masks the bootstrap after terminal states.",
    "requirements": [
      "rewards is a list of finite floats; terminals is a same-length list of booleans. gamma is between 0 and 1 inclusive.",
      "Sum gamma**t * rewards[t] in chronological order until the first terminal flag (including its reward).",
      "If any terminal flag is encountered, do not add a bootstrap estimate or include later rewards.",
      "If no terminal is encountered, add gamma**len(rewards) * bootstrap_value. With empty rewards, return bootstrap_value."
    ],
    "signature": "discounted_return(rewards, terminals, gamma, bootstrap_value)",
    "starter": "def discounted_return(rewards, terminals, gamma, bootstrap_value):\n    \"\"\"Compute an n-step return with a terminal mask.\"\"\"\n    # TODO\n    pass",
    "solution": "def discounted_return(rewards, terminals, gamma, bootstrap_value):\n    total = 0.0\n    weight = 1.0\n    for reward, terminal in zip(rewards, terminals):\n        total += weight * reward\n        if terminal:\n            return total\n        weight *= gamma\n    return total + weight * bootstrap_value",
    "explanation": [
      "Accumulate immediate rewards first, scaling each successive reward by an additional factor of gamma.",
      "A terminal transition ends the trajectory, so the value function cannot be used to bootstrap beyond it.",
      "Without termination, the estimated continuation value contributes after all recorded steps at gamma**n."
    ],
    "complexity": "Time O(n), additional space O(1).",
    "pitfall": "Always adding a bootstrapped value after a terminal transition gives inflated targets.",
    "hints": [
      "Track a running discount weight initialized to one.",
      "Exit immediately after including a reward whose terminal flag is True."
    ],
    "references": [],
    "tests": [
      {
        "name": "No terminal",
        "code": "assert discounted_return([1,2],[False,False],.5,4)==3.0"
      },
      {
        "name": "Early terminal",
        "code": "assert discounted_return([1,2,50],[False,True,False],.5,100)==2.0"
      },
      {
        "name": "Terminal on first",
        "code": "assert discounted_return([3,100],[True,False],.9,50)==3.0"
      },
      {
        "name": "Empty rewards",
        "code": "assert discounted_return([],[],.8,7)==7.0"
      },
      {
        "name": "Zero gamma",
        "code": "assert discounted_return([2,3],[False,False],0,100)==2.0"
      },
      {
        "name": "Gamma one",
        "code": "assert discounted_return([1,2],[False,False],1,5)==8.0"
      },
      {
        "name": "Terminal last",
        "code": "assert discounted_return([1,2],[False,True],.5,100)==2.0"
      }
    ]
  }
];
