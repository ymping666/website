"""Authored challenge catalog expansion. One deterministic Python contract per exercise."""
from pathlib import Path
import json

BASE=Path(__file__).resolve().parents[1]
problems=[]

def add(pid,track,level,title,mins,tags,desc,requirements,signature,starter,solution,explanations,complexity,pitfall,hints,tests,refs=None):
    assert len(requirements)>=3 and len(tests)>=5 and len(explanations)>=3
    num=18+len(problems)
    problems.append(dict(id=pid,number=num,track=track,difficulty=level,title=title,duration=f'{mins} min',tags=tags,
       description=desc,requirements=requirements,signature=signature,starter=starter,solution=solution,
       explanation=explanations,complexity=complexity,pitfall=pitfall,hints=hints,
       references=refs or [],tests=[dict(name=n,code=s) for n,s in tests]))

HELLO=[dict(title='Hello-Agents — conceptual overview',url='https://github.com/datawhalechina/hello-agents')]
WORLD=[dict(title='World Models & Spatial Intelligence — study roadmap',url='https://overdued.github.io/world-model-spatial-intelligence-course/')]
RSSM=[dict(title='Learning Latent Dynamics for Planning from Pixels (Hafner et al.)',url='https://arxiv.org/abs/1811.04551')]
AGENT='Agent Engineering'; WM='World Models'; LLM='LLM Systems'; FUND='AI Foundations'

add('agent-topological-schedule',AGENT,'Medium','Schedule an Agent Plan in Dependency Order',20,
 ['Planning','DAG','Topological Sort'],
 'A plan executor receives named tasks and their prerequisites. Produce a deterministic execution order or detect that a circular plan cannot be executed.',
 ['tasks maps task names to prerequisite-name lists. Every prerequisite exists as a task key; inputs may contain cycles.',
  'Return a list including each task exactly once, with every prerequisite scheduled before its dependent.',
  'Among currently ready tasks, always choose the lexicographically smallest name.',
  'Return None if no complete topological schedule exists (including self-dependencies). Return [] for no tasks.'],
 'schedule_plan(tasks)',
 'def schedule_plan(tasks):\n    """Return lexicographic topological order or None on cycles."""\n    # TODO\n    pass',
 '''import heapq

def schedule_plan(tasks):
    indegree = {name: len(set(deps)) for name, deps in tasks.items()}
    successors = {name: [] for name in tasks}
    for name, deps in tasks.items():
        for dep in set(deps):
            successors[dep].append(name)
    ready = [name for name, deg in indegree.items() if deg == 0]
    heapq.heapify(ready)
    order = []
    while ready:
        name = heapq.heappop(ready)
        order.append(name)
        for child in successors[name]:
            indegree[child] -= 1
            if indegree[child] == 0:
                heapq.heappush(ready, child)
    return order if len(order) == len(tasks) else None''',
 ['A task dependency graph is a directed graph. Kahn’s algorithm tracks how many prerequisites remain unsatisfied.',
  'A min-heap selects the alphabetically first ready task, making the output reproducible.',
  'If tasks remain unscheduled after the heap becomes empty, the graph contains a directed cycle.',
  'Deduplicating each prerequisite list prevents duplicate edges from corrupting the in-degree count.'],
 'Time O((V+E) log V) with a min-heap, extra space O(V+E).',
 'Sorting task names first is not enough; lexical order must never violate prerequisites.',
 ['Build an in-degree map and reverse dependency edges.','Use heapq to pick the next available task, and check whether all tasks were scheduled.'],[
 ('Simple chain',"assert schedule_plan({'write':['research'],'research':[]}) == ['research','write']"),
 ('Independent tasks',"assert schedule_plan({'z':[],'a':[],'b':[]}) == ['a','b','z']"),
 ('Ready task ordering',"assert schedule_plan({'c':['a'],'b':[],'a':[]}) == ['a','b','c']"),
 ('Cycle',"assert schedule_plan({'a':['b'],'b':['a']}) is None"),
 ('Self dependency',"assert schedule_plan({'a':['a']}) is None"),
 ('Empty graph',"assert schedule_plan({}) == []"),
 ('Duplicate prerequisite',"assert schedule_plan({'a':[],'b':['a','a']}) == ['a','b']"),
 ('Do not mutate plan',"x={'b':['a'],'a':[]}; schedule_plan(x); assert x=={'b':['a'],'a':[]}")],HELLO)

add('agent-merge-tool-results',AGENT,'Medium','Merge Parallel Tool Results in Call Order',17,
 ['Tools','Concurrency','Determinism'],
 'Parallel tool calls can finish in any order. Restore the original request order without losing legitimate None results or accepting stale replies.',
 ['call_ids is a list of distinct string IDs in dispatch order; responses contains (call_id, value) pairs in arrival order.',
  'For each dispatched call return (call_id, first_value) in dispatch order. Use None for calls with no response.',
  'Ignore response IDs that were never dispatched. If duplicate results arrive for one ID, the first observed value wins.',
  'Do not mutate the inputs. Values are arbitrary Python objects including None.'],
 'merge_results(call_ids, responses)',
 'def merge_results(call_ids, responses):\n    """Align out-of-order tool results with dispatched IDs."""\n    # TODO\n    pass',
 '''def merge_results(call_ids, responses):
    allowed = set(call_ids)
    first = {}
    for call_id, value in responses:
        if call_id in allowed and call_id not in first:
            first[call_id] = value
    return [(call_id, first.get(call_id)) for call_id in call_ids]''',
 ['Model tool invocations with unique correlation IDs rather than matching responses by arrival position.',
  'Collect the first recognized response per ID. Membership tests distinguish a genuine None value from an unseen response.',
  'Iterate over call_ids at the end to return stable dispatch order even if execution was concurrent.'],
 'Time O(N+M), extra space O(N+M) for N calls and M replies.',
 'A simple dict assignment keeps the last duplicate, which violates first-response-wins.',
 ['Build a set of known request IDs.','Only add a response when its ID is recognized and not already in the result mapping.'],[
 ('Out-of-order replies',"assert merge_results(['a','b'], [('b',2),('a',1)]) == [('a',1),('b',2)]"),
 ('Missing reply',"assert merge_results(['a','b'], [('b',2)]) == [('a',None),('b',2)]"),
 ('First duplicate wins',"assert merge_results(['a'], [('a',1),('a',99)]) == [('a',1)]"),
 ('Unknown reply ignored',"assert merge_results(['a'], [('x',100),('a',3)]) == [('a',3)]"),
 ('None is legitimate',"assert merge_results(['a'], [('a',None),('a','late')]) == [('a',None)]"),
 ('No calls',"assert merge_results([], [('x',9)]) == []"),
 ('Input preserved',"r=[('b',2),('a',1)]; merge_results(['a','b'],r); assert r==[('b',2),('a',1)]")],HELLO)

add('agent-exponential-backoff',AGENT,'Easy','Implement Bounded Tool Retry Backoff',14,
 ['Reliability','Retry','Rate Limits'],
 'After a tool failure, an agent runner should wait before retrying. Implement a bounded exponential retry schedule and reset it after a successful call.',
 ['outcomes is a chronological list of booleans: True means a successful call; False means failure.',
  'For a success, emit 0.0 and reset the failure streak.',
  'For the n-th consecutive failure, emit min(max_delay, base_delay * 2**(n-1)).',
  'Assume 0 < base_delay <= max_delay. Return one floating-point delay per outcome without sleeping.'],
 'retry_delays(outcomes, base_delay, max_delay)',
 'def retry_delays(outcomes, base_delay, max_delay):\n    """Pure function: calculate delays, do not call sleep()."""\n    # TODO\n    pass',
 '''def retry_delays(outcomes, base_delay, max_delay):
    result = []
    delay = 0.0
    for success in outcomes:
        if success:
            delay = 0.0
            result.append(0.0)
        else:
            delay = min(max_delay, base_delay if delay == 0 else delay * 2)
            result.append(float(delay))
    return result''',
 ['A consecutive failure streak doubles the delay, reducing repeated requests to a failing service.',
  'Capping the incremental delay avoids gigantic exponent computations after very long failure sequences.',
  'A successful operation resets the retry state; this exercise computes delays only and does not perform I/O.'],
 'Time O(n), additional space O(n) for the output list.',
 'Counting total failures rather than consecutive failures misses recovery resets.',
 ['Track the previous delay and reset it on success.','Clamp each doubled delay to max_delay.'],[
 ('Basic retry pattern',"assert retry_delays([False,False,False],1,10) == [1.0,2.0,4.0]"),
 ('Cap',"assert retry_delays([False]*6,1,5) == [1.0,2.0,4.0,5.0,5.0,5.0]"),
 ('Reset on success',"assert retry_delays([False,False,True,False],1,10) == [1.0,2.0,0.0,1.0]"),
 ('No events',"assert retry_delays([],1,5)==[]"),
 ('Noninteger cap',"assert retry_delays([False]*4,0.5,1.5)==[0.5,1.0,1.5,1.5]"),
 ('All success',"assert retry_delays([True,True],1,8)==[0.0,0.0]"),
 ('Long run stays bounded',"d=retry_delays([False]*300,1,3); assert len(d)==300 and d[-1]==3.0")],HELLO)

add('agent-jsonrpc-response',AGENT,'Medium','Validate a JSON-RPC Tool Response Envelope',19,
 ['Tool Protocol','JSON-RPC','Validation'],
 'Tool integrations often exchange JSON-RPC-shaped messages. Validate a simplified response envelope and classify successful results versus remote errors.',
 ['message is a Python object representing decoded JSON; expected_id is a str or int (bool is not a valid ID).',
  'A valid envelope must be a dict with jsonrpc == "2.0", and an id whose type AND value equal expected_id.',
  'Exactly one of "result" or "error" must exist. Any JSON value is permitted for result, including None.',
  'If error is used, it must be a dict with non-bool int code and nonblank string message. Return "success", "remote_error", or "invalid".'],
 'classify_rpc_response(message, expected_id)',
 'def classify_rpc_response(message, expected_id):\n    """Classify a simplified JSON-RPC 2.0 response envelope."""\n    # TODO\n    pass',
 '''def classify_rpc_response(message, expected_id):
    if not isinstance(message, dict) or message.get('jsonrpc') != '2.0':
        return 'invalid'
    actual_id = message.get('id')
    if type(expected_id) not in (str, int) or type(actual_id) is not type(expected_id) or actual_id != expected_id:
        return 'invalid'
    has_result = 'result' in message
    has_error = 'error' in message
    if has_result == has_error:
        return 'invalid'
    if has_result:
        return 'success'
    error = message['error']
    if not isinstance(error, dict):
        return 'invalid'
    code = error.get('code')
    label = error.get('message')
    if type(code) is not int or not isinstance(label, str) or not label.strip():
        return 'invalid'
    return 'remote_error' ''',
 ['Do not assume any parsed JSON value has the shape of an RPC response.',
  'Check whether each key exists rather than testing whether its value is truthy: null is a legal successful result.',
  'The expected correlation ID must match both value and type; Python considers True == 1, so explicit type equality matters.',
  'A valid remote error is different from an invalid protocol envelope; callers should handle these cases separately.'],
 'Time O(1), additional space O(1), treating envelope fields as already-decoded objects.',
 'Using message.get("result") to test for success rejects a valid response with result=None.',
 ['Use the XOR of key-presence checks to enforce exactly one result kind.','Beware of bool being a subclass of int in Python.'],[
 ('Valid result',"assert classify_rpc_response({'jsonrpc':'2.0','id':1,'result':{'ok':True}},1)=='success'"),
 ('Null result is valid',"assert classify_rpc_response({'jsonrpc':'2.0','id':'a','result':None},'a')=='success'"),
 ('Remote error',"assert classify_rpc_response({'jsonrpc':'2.0','id':2,'error':{'code':-32602,'message':'Bad args'}},2)=='remote_error'"),
 ('Both fields invalid',"assert classify_rpc_response({'jsonrpc':'2.0','id':1,'result':3,'error':{'code':-1,'message':'bad'}},1)=='invalid'"),
 ('Missing fields',"assert classify_rpc_response({'jsonrpc':'2.0','id':1},1)=='invalid'"),
 ('Mismatched id type',"assert classify_rpc_response({'jsonrpc':'2.0','id':True,'result':1},1)=='invalid'"),
 ('Invalid error code',"assert classify_rpc_response({'jsonrpc':'2.0','id':1,'error':{'code':True,'message':'bad'}},1)=='invalid'"),
 ('Invalid version',"assert classify_rpc_response({'jsonrpc':'1.0','id':1,'result':1},1)=='invalid'"),
 ('Wrong container',"assert classify_rpc_response([],1)=='invalid'")],
 [dict(title='JSON-RPC 2.0 Specification',url='https://www.jsonrpc.org/specification')])

add('world-discrete-bayes-filter',WM,'Medium','Update a Discrete POMDP Belief State',24,
 ['Belief States','POMDP','Bayesian Filtering'],
 'A partially observed world model predicts the next hidden state using a transition matrix, then incorporates a new observation using Bayes’ rule.',
 ['belief is a probability vector of length n. transition is an n×n row-stochastic matrix where transition[i][j] = P(s_next=j | s=i).',
  'likelihood[j] is P(observation | s_next=j). All elements are finite and nonnegative. Assume dimension consistency.',
  'Compute predicted[j] = sum_i belief[i] * transition[i][j], then posterior[j] ∝ predicted[j] * likelihood[j].',
  'Normalize to sum to one. If the normalizer is zero, raise ValueError. Return a new list without mutating input.'],
 'belief_update(belief, transition, likelihood)',
 'def belief_update(belief, transition, likelihood):\n    """One predict/update step for a finite-state POMDP."""\n    # TODO\n    pass',
 '''def belief_update(belief, transition, likelihood):
    n = len(belief)
    predicted = [sum(belief[i] * transition[i][j] for i in range(n)) for j in range(n)]
    unnormalized = [predicted[j] * likelihood[j] for j in range(n)]
    evidence = sum(unnormalized)
    if evidence == 0:
        raise ValueError('observation has zero probability')
    return [value / evidence for value in unnormalized]''',
 ['Predict: marginalize over the previous hidden state using the action-conditioned transition model (a fixed action is implicit here).',
  'Update: multiply each predicted state probability by the likelihood of the new observation.',
  'Normalize the unnormalized posterior. A zero evidence term means the observation is impossible under the supplied model.',
  'The returned vector is a belief over hidden states, not a guess of a single most-likely state.'],
 'Time O(n²), extra space O(n), for n hidden states.',
 'Normalizing only the observation likelihood discards the dynamics prior.',
 ['Compute each predicted state j by summing over source states i.','Multiply by likelihood and normalize only after all states are updated.'],[
 ('Identity transition',"assert all(abs(a-b)<1e-12 for a,b in zip(belief_update([.5,.5],[[1,0],[0,1]],[.8,.2]),[.8,.2]))"),
 ('State swap',"assert belief_update([1,0],[[0,1],[1,0]],[.2,.9])==[0.0,1.0]"),
 ('Dynamics plus observation',"r=belief_update([.8,.2],[[.9,.1],[.2,.8]],[.25,.75]); assert abs(r[0]-.19/.37)<1e-12 and abs(r[1]-.18/.37)<1e-12"),
 ('Uniform likelihood preserves prior',"r=belief_update([.25,.75],[[1,0],[0,1]],[.5,.5]); assert all(abs(a-b)<1e-12 for a,b in zip(r,[.25,.75]))"),
 ('Zero evidence',"try:\n belief_update([1,0],[[1,0],[0,1]],[0,1]); assert False\nexcept ValueError: pass"),
 ('One state',"assert belief_update([1],[[1]],[.2]) == [1.0]"),
 ('Inputs unchanged',"b=[.5,.5]; t=[[1,0],[0,1]]; l=[.1,.9]; belief_update(b,t,l); assert b==[.5,.5] and t==[[1,0],[0,1]] and l==[.1,.9]")],WORLD)

add('world-belief-propagation',WM,'Medium','Propagate a Linear-Gaussian State Belief',19,
 ['Dynamics','Uncertainty','Stochastic Models'],
 'A simplified stochastic dynamics model has x_(t+1) = a*x_t + u_t + noise, with independent zero-mean Gaussian process noise. Propagate the mean and variance through a control sequence.',
 ['mean and variance are scalars for the initial Gaussian belief, variance >= 0. Assume process_var >= 0 and controls are finite.',
  'At each control u, update mean = a*mean + u.',
  'Update variance = (a*a)*variance + process_var independently of u.',
  'Return [(next_mean, next_variance), ...] after each control, excluding the initial state; [] for empty controls.'],
 'propagate_belief(mean, variance, a, process_var, controls)',
 'def propagate_belief(mean, variance, a, process_var, controls):\n    """Return Gaussian belief moments after each action."""\n    # TODO\n    pass',
 '''def propagate_belief(mean, variance, a, process_var, controls):
    output = []
    for u in controls:
        mean = a * mean + u
        variance = a * a * variance + process_var
        output.append((mean, variance))
    return output''',
 ['For linear Gaussian transitions, expectations and variances can be propagated analytically without sampling.',
  'Multiplying a random variable by a scales its variance by a². Independent additive noise contributes process_var.',
  'Uncertainty accumulates over longer imagined trajectories even if the mean trajectory looks plausible.'],
 'Time O(T), output/extra space O(T) for T controls.',
 'Updating variance with a rather than a² is wrong and can create negative variances for negative a.',
 ['The mean follows the deterministic transition.','The variance uses a**2 and adds process noise at each step.'],[
 ('Two controls',"assert propagate_belief(0,1,1,.5,[2,3])==[(2,1.5),(5,2.0)]"),
 ('Negative dynamics gain',"assert propagate_belief(1,2,-2,1,[0])==[(-2,9)]"),
 ('Zero dynamics',"assert propagate_belief(5,3,0,2,[1,2])==[(1,2),(2,2)]"),
 ('Empty controls',"assert propagate_belief(0,1,1,1,[])==[]"),
 ('Deterministic case',"assert propagate_belief(1,0,2,0,[1,0])==[(3,0),(6,0)]"),
 ('Process variance every step',"assert propagate_belief(0,0,1,.25,[0,0,0])==[(0,.25),(0,.5),(0,.75)]")],WORLD)

add('world-rollout-error-curve',WM,'Medium','Compute a Multi-Step Rollout Error Curve',21,
 ['Rollouts','Evaluation','Horizon'],
 'One-step prediction accuracy can hide compounding model errors. Build an error curve that tracks cumulative mean squared error as the open-loop rollout horizon increases.',
 ['predicted and target are equal-length sequences of state vectors. All vectors share a nonzero dimension d; inputs can be empty.',
  'For horizon h (1-indexed), return squared error averaged over the first h state vectors and all d coordinates.',
  'Output a list of length T, one value for every prefix horizon h=1..T. Return [] when T=0.',
  'Do not mutate inputs and do not use NumPy or external packages.'],
 'rollout_mse_curve(predicted, target)',
 'def rollout_mse_curve(predicted, target):\n    """Compute prefix MSE for horizons 1..T."""\n    # TODO\n    pass',
 '''def rollout_mse_curve(predicted, target):
    if not predicted:
        return []
    dimensions = len(predicted[0])
    accumulated = 0.0
    curve = []
    for h, (estimated, actual) in enumerate(zip(predicted, target), start=1):
        accumulated += sum((x - y) ** 2 for x, y in zip(estimated, actual))
        curve.append(accumulated / (h * dimensions))
    return curve''',
 ['Per-step coordinate errors can be accumulated as the horizon grows.',
  'The prefix denominator is h*d, so each horizon measures all coordinates observed through that step.',
  'An error curve is a diagnostic; a model with lower rollout MSE need not induce better decisions in a planner.'],
 'Time O(Td), additional space O(T) for T steps of d-dimensional states.',
 'Dividing by only d reports cumulative squared error, not prefix MSE.',
 ['Accumulate the squared residuals at each time step.','Normalize by the total number of coordinates seen so far.'],[
 ('Two scalar steps',"assert rollout_mse_curve([[1],[3]],[[0],[1]])==[1.0,2.5]"),
 ('Two coordinates',"assert rollout_mse_curve([[1,1],[2,2]],[[0,0],[1,1]])==[1.0,1.0]"),
 ('Late error',"assert rollout_mse_curve([[0],[0],[3]],[[0],[0],[0]])==[0.0,0.0,3.0]"),
 ('Empty sequence',"assert rollout_mse_curve([],[])==[]"),
 ('Exact predictions',"assert rollout_mse_curve([[1,2],[-1,3]],[[1,2],[-1,3]])==[0.0,0.0]"),
 ('Negative error symmetric',"assert rollout_mse_curve([[-2]],[[2]])==[16.0]")],WORLD)

add('world-diagonal-gaussian-kl',WM,'Hard','Compute the KL Loss of a Gaussian Latent State',26,
 ['RSSM','Latent Variables','KL Divergence'],
 'Probabilistic latent-state models compare an approximate posterior with a prior. Implement the KL divergence between two diagonal Gaussian distributions; this is one building block, not a full RSSM.',
 ['q_mean, q_var, p_mean and p_var are equal-length vectors; all variance entries are strictly positive.',
  'Return KL(q || p) summed over dimensions: 0.5 * sum(log(p_var/q_var) + (q_var + (q_mean-p_mean)**2)/p_var - 1).',
  'Return 0.0 for zero-dimensional vectors. Use the natural logarithm.',
  'Do not import NumPy and do not assume the divergence is symmetric.'],
 'diagonal_gaussian_kl(q_mean, q_var, p_mean, p_var)',
 'def diagonal_gaussian_kl(q_mean, q_var, p_mean, p_var):\n    """KL(q || p) for diagonal Gaussians (variances, not stddevs)."""\n    # TODO\n    pass',
 '''import math

def diagonal_gaussian_kl(q_mean, q_var, p_mean, p_var):
    total = 0.0
    for mq, vq, mp, vp in zip(q_mean, q_var, p_mean, p_var):
        total += math.log(vp / vq) + (vq + (mq - mp) ** 2) / vp - 1
    return 0.5 * total''',
 ['KL divergence between independent dimensions is the sum of the scalar divergences.',
  'The relative variance and squared mean difference both contribute; posterior and prior positions cannot be swapped.',
  'This exercise assumes diagonal Gaussian distributions and is not an implementation of the recurrent state-space model or its full training objective.'],
 'Time O(d), extra space O(1) for d latent coordinates.',
 'Confusing variance with standard deviation introduces a systematic factor-of-two error.',
 ['Write out the one-dimensional closed form first.','For d independent coordinates, sum the terms and multiply by 0.5.'],[
 ('Identical distributions',"assert abs(diagonal_gaussian_kl([0,1],[1,2],[0,1],[1,2]))<1e-12"),
 ('Shifted mean',"assert abs(diagonal_gaussian_kl([2],[1],[0],[1])-2)<1e-12"),
 ('Different variances',"import math; assert abs(diagonal_gaussian_kl([0],[1],[0],[2])-(.5*(math.log(2)+.5-1)))<1e-12"),
 ('Non-symmetry',"a=diagonal_gaussian_kl([0],[1],[0],[4]); b=diagonal_gaussian_kl([0],[4],[0],[1]); assert abs(a-b)>0.1"),
 ('Additivity over dimensions',"a=diagonal_gaussian_kl([0],[1],[1],[2]); b=diagonal_gaussian_kl([1],[2],[0],[1]); c=diagonal_gaussian_kl([0,1],[1,2],[1,0],[2,1]); assert abs(c-a-b)<1e-12"),
 ('Zero dimension',"assert diagonal_gaussian_kl([],[],[],[])==0.0"),
 ('Two squared means',"assert abs(diagonal_gaussian_kl([1,-1],[1,1],[0,0],[1,1])-1)<1e-12")],RSSM)

add('llm-mean-reciprocal-rank',LLM,'Easy','Implement Mean Reciprocal Rank for Retrieval',14,
 ['RAG','Ranking','Evaluation'],
 'Retrieval systems often need a ranking-sensitive metric. Calculate MRR from per-query ranked IDs and relevance sets.',
 ['ranked_lists is a list of document-ID lists; relevant_per_query is the corresponding list of relevant-ID collections.',
  'For each query, use 1/r where r is the 1-indexed rank of the FIRST relevant result; assign zero if none is retrieved.',
  'Return the arithmetic mean over queries. Return 0.0 for no queries.',
  'Do not count all relevant results: MRR is based only on the first relevant rank.'],
 'mean_reciprocal_rank(ranked_lists, relevant_per_query)',
 'def mean_reciprocal_rank(ranked_lists, relevant_per_query):\n    """Return retrieval MRR across queries."""\n    # TODO\n    pass',
 '''def mean_reciprocal_rank(ranked_lists, relevant_per_query):
    if not ranked_lists:
        return 0.0
    total = 0.0
    for ranked, relevant in zip(ranked_lists, relevant_per_query):
        gold = set(relevant)
        for rank, doc in enumerate(ranked, start=1):
            if doc in gold:
                total += 1.0 / rank
                break
    return total / len(ranked_lists)''',
 ['MRR rewards putting the first relevant document near the top of the ranked list.',
  'Missing relevant documents contribute zero; they remain in the denominator.',
  'Unlike Recall@K, MRR does not reward finding additional relevant documents after the first.'],
 'Time O(sum lengths of ranked lists plus relevance sets), additional space O(max relevance-set size).',
 'Dividing by only queries with at least one hit artificially inflates MRR.',
 ['Find the index of the first relevant document, if any.','Average reciprocal ranks over ALL queries, including misses.'],[
 ('One hit at rank two',"assert mean_reciprocal_rank([['x','a']], [['a']])==.5"),
 ('Mixed queries',"assert abs(mean_reciprocal_rank([['a'],['x','b'],['z']], [['a'],['b'],['c']])-.5)<1e-12"),
 ('First hit only',"assert mean_reciprocal_rank([['a','b']], [['a','b']])==1.0"),
 ('Empty query list',"assert mean_reciprocal_rank([],[])==0.0"),
 ('No hits',"assert mean_reciprocal_rank([['x']], [['a']])==0.0"),
 ('Two possible relevant',"assert mean_reciprocal_rank([['z','b','a']], [['a','b']])==.5"),
 ('Repeated result',"assert mean_reciprocal_rank([['x','x','a']], [['a']])==1/3")])

add('llm-topk-softmax',LLM,'Medium','Implement Stable Top-K Token Probabilities',21,
 ['Sampling','Numerical Stability','Inference'],
 'An LLM decoder restricts the candidate vocabulary to K logits before renormalizing their probabilities. Implement this deterministic probability transform without actually sampling a token.',
 ['logits is a nonempty list of finite floats; k is an integer between 1 and len(logits), inclusive.',
  'Retain the k indices with highest logit values; break equal-logit ties in favor of lower token indices.',
  'Apply softmax to only the retained logits, subtracting their maximum before exponentiation to avoid overflow.',
  'Return a probability list of the original vocabulary length, with 0.0 at excluded indices and total probability ~1.'],
 'top_k_probabilities(logits, k)',
 'def top_k_probabilities(logits, k):\n    """Return stable top-k softmax weights for token indices."""\n    # TODO\n    pass',
 '''import math

def top_k_probabilities(logits, k):
    selected = sorted(range(len(logits)), key=lambda i: (-logits[i], i))[:k]
    peak = max(logits[i] for i in selected)
    weights = [math.exp(logits[i] - peak) for i in selected]
    total = sum(weights)
    result = [0.0] * len(logits)
    for idx, weight in zip(selected, weights):
        result[idx] = weight / total
    return result''',
 ['Sorting by descending logit and then ascending index produces deterministic top-k membership.',
  'Excluded tokens must have exactly zero probability before renormalization.',
  'Subtracting the maximum logit avoids overflow; softmax ratios are unchanged by a common offset.'],
 'Time O(V log V), extra space O(V) for vocabulary size V.',
 'Running full-vocabulary softmax and then zeroing tail probabilities without renormalizing yields a distribution that sums to less than one.',
 ['Choose top-k indices first, not just top-k values.','Normalize exp(logit - max_selected_logit) only across chosen indices.'],[
 ('Top one is deterministic',"assert top_k_probabilities([1,3,2],1)==[0.0,1.0,0.0]"),
 ('Equal logits tie index',"assert top_k_probabilities([1,1,1],2)==[.5,.5,0.0]"),
 ('Full vocabulary softmax',"p=top_k_probabilities([0,0],2); assert p==[.5,.5]"),
 ('Large positive logits',"p=top_k_probabilities([1000,1001,999],2); assert p[2]==0.0 and abs(sum(p)-1)<1e-12 and p[1]>p[0]"),
 ('Large negative logits',"p=top_k_probabilities([-1001,-1000],1); assert p==[0.0,1.0]"),
 ('Selected weights normalized',"p=top_k_probabilities([3,2,1,0],3); assert abs(sum(p)-1)<1e-12 and p[-1]==0.0"),
 ('Ties at boundary',"assert top_k_probabilities([0,2,2,2],2)==[0.0,.5,.5,0.0]")])

add('llm-evidence-context-pack',LLM,'Easy','Pack Retrieved Evidence into a Token Budget',13,
 ['RAG','Context Budget','Retrieval'],
 'Retrieved passages arrive in relevance order. Write a deterministic context packer that preserves the longest consecutive prefix that fits the remaining prompt budget.',
 ['chunks is a list of distinct passage IDs; token_counts is a same-length list of nonnegative integers.',
  'Starting from the first passage, append a passage only when its token count fits the remaining budget.',
  'Stop immediately at the first passage that does not fit; do not skip ahead to later passages.',
  'Return a new list of accepted IDs, preserving order. budget is nonnegative.'],
 'pack_context(chunks, token_counts, budget)',
 'def pack_context(chunks, token_counts, budget):\n    """Pack the longest fitting consecutive prefix."""\n    # TODO\n    pass',
 '''def pack_context(chunks, token_counts, budget):
    accepted = []
    remaining = budget
    for chunk, count in zip(chunks, token_counts):
        if count > remaining:
            break
        accepted.append(chunk)
        remaining -= count
    return accepted''',
 ['A strict prefix policy preserves the retriever’s ranking and avoids dropping a higher-ranked passage for a lower-ranked one.',
  'The budget is decremented after each accepted passage; a passage that exactly fits should be included.',
  'This models the context-assembly algorithm only. Real systems must account for message formatting and tokenizer-specific costs.'],
 'Time O(n) in the number of inspected passages; additional space O(n) for accepted IDs.',
 'Skipping an oversized passage and adding a later smaller one breaks the strict-prefix requirement.',
 ['Iterate in the original retrieved order.','Use break rather than continue when a passage does not fit.'],[
 ('Prefix fits',"assert pack_context(['a','b','c'],[3,4,2],7)==['a','b']"),
 ('Do not skip',"assert pack_context(['a','b','c'],[3,8,1],5)==['a']"),
 ('Exact budget',"assert pack_context(['a'],[5],5)==['a']"),
 ('First too big',"assert pack_context(['a','b'],[6,1],5)==[]"),
 ('Empty',"assert pack_context([],[],10)==[]"),
 ('Zero-count passage',"assert pack_context(['a','b'],[0,1],0)==['a']"),
 ('Original input unchanged',"c=['x','y']; t=[1,2]; pack_context(c,t,1); assert c==['x','y'] and t==[1,2]")])

add('foundation-epsilon-greedy',FUND,'Easy','Choose an Epsilon-Greedy Action Deterministically',14,
 ['Reinforcement Learning','Exploration','Policy'],
 'Epsilon-greedy policies balance exploitation and exploration. Implement the action choice using supplied random draws, so every solution can be tested without nondeterminism.',
 ['q_values is a nonempty list of finite action values, epsilon is in [0,1], and uniform_draw is in [0,1).',
  'When uniform_draw < epsilon, return random_index (a valid action index supplied by the caller).',
  'Otherwise return the index with maximum Q-value. Break ties in favor of the lowest index.',
  'Do not call the random module; the random draw and random action index are already provided.'],
 'epsilon_greedy(q_values, epsilon, uniform_draw, random_index)',
 'def epsilon_greedy(q_values, epsilon, uniform_draw, random_index):\n    """Choose an action from supplied random values."""\n    # TODO\n    pass',
 '''def epsilon_greedy(q_values, epsilon, uniform_draw, random_index):
    if uniform_draw < epsilon:
        return random_index
    return max(range(len(q_values)), key=lambda i: q_values[i])''',
 ['Epsilon is the probability of exploring rather than following the current greedy action.',
  'Injecting the random draw into the function makes the policy testable with exact expectations.',
  'Python max returns the first maximum in an ordered sequence of action indices, giving deterministic tie-breaking.'],
 'Time O(A) in greedy mode, O(1) in exploration mode; additional space O(1).',
 'Exploration is uniform over ALL actions, including the greedy action; do not exclude the maximum-value action.',
 ['Compare uniform_draw against epsilon.','For greedy selection, iterate action indices in ascending order.'],[
 ('Pure greedy',"assert epsilon_greedy([1,5,3],0,0.1,0)==1"),
 ('Explore chosen action',"assert epsilon_greedy([1,5,3],1,.9,2)==2"),
 ('Boundary draw equality',"assert epsilon_greedy([1,5],.5,.5,0)==1"),
 ('Tie lowest index',"assert epsilon_greedy([4,4,1],0,.7,2)==0"),
 ('Explore greedy possible',"assert epsilon_greedy([1,5],1,.1,1)==1"),
 ('Negative values',"assert epsilon_greedy([-4,-1,-3],0,.2,0)==1"),
 ('Single action',"assert epsilon_greedy([1],.2,.9,0)==0")])

add('foundation-nstep-return',FUND,'Medium','Compute a Terminal-Aware Discounted Return',17,
 ['Reinforcement Learning','Returns','Bootstrapping'],
 'Reinforcement-learning targets combine observed rewards and a bootstrap estimate when the rollout has not terminated. Implement a discounted return that masks the bootstrap after terminal states.',
 ['rewards is a list of finite floats; terminals is a same-length list of booleans. gamma is between 0 and 1 inclusive.',
  'Sum gamma**t * rewards[t] in chronological order until the first terminal flag (including its reward).',
  'If any terminal flag is encountered, do not add a bootstrap estimate or include later rewards.',
  'If no terminal is encountered, add gamma**len(rewards) * bootstrap_value. With empty rewards, return bootstrap_value.'],
 'discounted_return(rewards, terminals, gamma, bootstrap_value)',
 'def discounted_return(rewards, terminals, gamma, bootstrap_value):\n    """Compute an n-step return with a terminal mask."""\n    # TODO\n    pass',
 '''def discounted_return(rewards, terminals, gamma, bootstrap_value):
    total = 0.0
    weight = 1.0
    for reward, terminal in zip(rewards, terminals):
        total += weight * reward
        if terminal:
            return total
        weight *= gamma
    return total + weight * bootstrap_value''',
 ['Accumulate immediate rewards first, scaling each successive reward by an additional factor of gamma.',
  'A terminal transition ends the trajectory, so the value function cannot be used to bootstrap beyond it.',
  'Without termination, the estimated continuation value contributes after all recorded steps at gamma**n.'],
 'Time O(n), additional space O(1).',
 'Always adding a bootstrapped value after a terminal transition gives inflated targets.',
 ['Track a running discount weight initialized to one.','Exit immediately after including a reward whose terminal flag is True.'],[
 ('No terminal',"assert discounted_return([1,2],[False,False],.5,4)==3.0"),
 ('Early terminal',"assert discounted_return([1,2,50],[False,True,False],.5,100)==2.0"),
 ('Terminal on first',"assert discounted_return([3,100],[True,False],.9,50)==3.0"),
 ('Empty rewards',"assert discounted_return([],[],.8,7)==7.0"),
 ('Zero gamma',"assert discounted_return([2,3],[False,False],0,100)==2.0"),
 ('Gamma one',"assert discounted_return([1,2],[False,False],1,5)==8.0"),
 ('Terminal last',"assert discounted_return([1,2],[False,True],.5,100)==2.0")])

out=BASE/'src'/'expansion-problems.mjs'
out.write_text('// FrontierCode v0.7 — 13 original, fully specified, independently tested exercises.\nexport const expansionProblems = '+json.dumps(problems,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
print('Authored',len(problems),'challenges with',sum(len(p['tests']) for p in problems),'assertions: ',out)
