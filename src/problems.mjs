// Every challenge has hand-written, inspectable tests. Nothing calls a paid model API.
// Starter/solution code must implement the named function exactly.
export const problems = [
  {
    id:'agent-retry-guard', number:1, track:'Agent Engineering', difficulty:'Easy',
    title:'Stop an Infinite Tool Retry Loop', duration:'10 min',
    tags:['Tool Calling','Reliability','Control Flow'],
    description:'An agent calls tools repeatedly. A faulty tool response can trap the agent in an endless retry cycle. Implement a deterministic stop rule that limits attempts and detects repeated failures.',
    requirements:[
      'Return True when the attempt count is greater than or equal to max_attempts.',
      'Return True when the last three recorded outcomes are all the exact string "error".',
      'Otherwise return False. An empty history does not imply failure.'
    ],
    signature:'should_stop(history, max_attempts)',
    starter:`def should_stop(history, max_attempts):\n    """history: list[str] of 'ok' / 'error'; return bool."""\n    # TODO: prevent infinite retries\n    pass`,
    solution:`def should_stop(history, max_attempts):\n    if len(history) >= max_attempts:\n        return True\n    return len(history) >= 3 and history[-3:] == ['error', 'error', 'error']`,
    explanation:[
      'The step budget is a hard safety boundary: stop when completed attempts reach max_attempts.',
      'The repeated-failure detector looks only at the most recent three outcomes. Older failures should not trigger the rule if the agent has recovered.',
      'Check the length before slicing to make the behavior clear for short traces.'
    ],
    complexity:'Time: O(1) for the fixed-size suffix check. Additional space: O(1).',
    pitfall:'Do not count all historical errors; three non-consecutive errors are not three consecutive failures.',
    hints:['The most recent observations are at the end of the list.','Use len(history) and the last three elements.'],
    tests:[
      {name:'Hard attempt limit',code:`assert should_stop(['ok','ok','ok'], 3) is True`},
      {name:'Three consecutive failures',code:`assert should_stop(['ok','error','error','error'], 10) is True`},
      {name:'Recovery resets streak',code:`assert should_stop(['error','error','ok','error'], 10) is False`},
      {name:'Short history',code:`assert should_stop(['error','error'], 10) is False`},
      {name:'Empty history',code:`assert should_stop([], 5) is False`}
    ]
  },
  {
    id:'tool-call-parser', number:2, track:'Agent Engineering', difficulty:'Medium',
    title:'Parse a Tool Call Safely', duration:'15 min',
    tags:['Tool Calling','JSON','Error Handling'],
    description:'LLM agents often emit JSON tool calls. Build a defensive parser that rejects malformed or incomplete tool requests before any tool is executed.',
    requirements:[
      'Accept a JSON string containing a nonempty string field "tool" and a dictionary field "arguments".',
      'Return a dict containing exactly the keys "tool" and "arguments" for valid requests.',
      'Return None for malformed JSON, missing fields, wrong types or blank tool names.',
      'Do not execute the named tool.'
    ],
    signature:'parse_tool_call(raw)',
    starter:`def parse_tool_call(raw):\n    """Parse a JSON tool request; return dict or None."""\n    # TODO: avoid unsafe assumptions about model output\n    pass`,
    solution:`import json\n\ndef parse_tool_call(raw):\n    try:\n        payload = json.loads(raw)\n    except (TypeError, ValueError):\n        return None\n    if not isinstance(payload, dict):\n        return None\n    tool = payload.get('tool')\n    args = payload.get('arguments')\n    if not isinstance(tool, str) or not tool.strip():\n        return None\n    if not isinstance(args, dict):\n        return None\n    return {'tool': tool, 'arguments': args}`,
    explanation:[
      'JSON parsing and schema validation are separate steps: valid JSON can still have an unusable shape.',
      'Fail closed: None means the surrounding agent must not dispatch a tool call.',
      'Return only the validated fields, so unexpected keys are not implicitly trusted.'
    ],
    complexity:'Time: O(n) for parsing a JSON string of length n. Space: O(n).',
    pitfall:'Checking only whether json.loads succeeds will accept an array, a number or a dict with missing arguments.',
    hints:['Use json.loads in try/except.','The parsed value must be a dictionary, and both fields need type checks.'],
    tests:[
      {name:'Valid tool call',code:`assert parse_tool_call('{"tool":"search","arguments":{"q":"world model"}}') == {'tool':'search','arguments':{'q':'world model'}}`},
      {name:'Invalid JSON',code:`assert parse_tool_call('{oops') is None`},
      {name:'Missing arguments',code:`assert parse_tool_call('{"tool":"search"}') is None`},
      {name:'Wrong top-level type',code:`assert parse_tool_call('[]') is None`},
      {name:'Empty tool name',code:`assert parse_tool_call('{"tool":"  ","arguments":{}}') is None`},
      {name:'Strip unexpected fields',code:`assert parse_tool_call('{"tool":"run","arguments":{},"admin":true}') == {'tool':'run','arguments':{}}`}
    ]
  },
  {
    id:'rag-recall-k', number:3, track:'LLM Systems', difficulty:'Easy',
    title:'Implement Recall@K for RAG', duration:'12 min',
    tags:['RAG','Evaluation','Retrieval'],
    description:'A retrieval-augmented generation system is only as good as its retrieved evidence. Implement Recall@K to measure how many relevant documents appear among the top K retrieved IDs.',
    requirements:[
      'Return (# unique relevant IDs retrieved in the first k positions) / (# unique relevant IDs).',
      'If relevant_ids is empty or k is zero or negative, return 0.0.',
      'Do not count repeated retrieved IDs more than once.'
    ],
    signature:'recall_at_k(retrieved_ids, relevant_ids, k)',
    starter:`def recall_at_k(retrieved_ids, relevant_ids, k):\n    """Return retrieval recall as a float from 0 to 1."""\n    # TODO\n    pass`,
    solution:`def recall_at_k(retrieved_ids, relevant_ids, k):\n    relevant = set(relevant_ids)\n    if not relevant or k <= 0:\n        return 0.0\n    found = set(retrieved_ids[:k]) & relevant\n    return len(found) / len(relevant)`,
    explanation:[
      'The denominator is the total set of relevant IDs, not the number of retrieved documents.',
      'Set intersection counts only distinct relevant IDs. Duplicate retrievals never inflate the score.',
      'The metric reflects retrieval coverage; it does not directly measure whether the generated answer is correct.'
    ],
    complexity:'Time: O(r + k) where r is the number of relevant IDs. Space: O(r + k).',
    pitfall:'Recall@K is not Precision@K: the denominator must be the count of relevant documents.',
    hints:['Start by converting relevant_ids to a set.','Intersect it with the first k retrieved IDs.'],
    tests:[
      {name:'Two of three found',code:`assert abs(recall_at_k(['a','b','x'], ['a','b','c'], 3) - 2/3) < 1e-9`},
      {name:'Only first K',code:`assert recall_at_k(['x','a','b'], ['a','b'], 1) == 0.0`},
      {name:'No relevant set',code:`assert recall_at_k(['a'], [], 3) == 0.0`},
      {name:'Deduplicate results',code:`assert recall_at_k(['a','a','b'], ['a','b'], 3) == 1.0`},
      {name:'Zero K',code:`assert recall_at_k(['a'], ['a'], 0) == 0.0`}
    ]
  },
  {
    id:'world-model-action', number:4, track:'World Models', difficulty:'Medium',
    title:'Choose Actions from Predicted Futures', duration:'20 min',
    tags:['Planning','Rollouts','Cost Evaluation'],
    description:'A world model predicts a future cost trajectory for each candidate action. Build the simplest planning rule: choose the action with the lowest discounted cumulative cost.',
    requirements:[
      'Input: a dict mapping action strings to lists of nonnegative predicted costs, and a discount gamma between 0 and 1.',
      'Score an action as sum(gamma ** t * cost[t]) for t starting at zero.',
      'Return the action string with the smallest score.',
      'If scores tie, return the lexicographically smallest action name. Return None for an empty dictionary.'
    ],
    signature:'choose_action(predictions, gamma)',
    starter:`def choose_action(predictions, gamma):\n    """Choose an action from predicted cost rollouts."""\n    # TODO\n    pass`,
    solution:`def choose_action(predictions, gamma):\n    if not predictions:\n        return None\n    def cost_of(action):\n        trajectory = predictions[action]\n        return sum((gamma ** t) * cost for t, cost in enumerate(trajectory))\n    return min(sorted(predictions), key=cost_of)`,
    explanation:[
      'A predicted trajectory matters because it changes decisions, not merely because it matches observations.',
      'Discounted cumulative cost evaluates the full imagined rollout instead of only its first step.',
      'Sorting action names before minimization creates a deterministic alphabetical tie break.'
    ],
    complexity:'For a actions with at most h predicted steps: O(a·h + a log a) time, O(a) space for sorting.',
    pitfall:'Choosing the smallest immediate cost can be wrong when another action has a much lower future cost.',
    hints:['Enumerate each predicted cost list to get its time index.','Use a deterministic tie break by sorting action names first.'],
    tests:[
      {name:'Look beyond first step',code:`assert choose_action({'left':[1,100],'right':[5,1]}, 1.0) == 'right'`},
      {name:'Discount future costs',code:`assert choose_action({'a':[2,10],'b':[5,0]}, 0.1) == 'a'`},
      {name:'Alphabetical tie',code:`assert choose_action({'z':[1,2],'a':[1,2]}, 0.5) == 'a'`},
      {name:'Empty dictionary',code:`assert choose_action({}, 1.0) is None`},
      {name:'Empty trajectories',code:`assert choose_action({'b':[],'a':[]}, 0.9) == 'a'`}
    ]
  },
  {
    id:'agent-memory-window', number:5, track:'Agent Engineering', difficulty:'Medium',
    title:'Build an Agent Memory Window', duration:'18 min',
    tags:['Memory','Context Budget','Agents'],
    description:'An agent has a limited context window. Preserve a required system message, then include as many recent messages as possible without exceeding a token budget.',
    requirements:[
      'Each message is a dict with "role", "content" and "tokens" fields.',
      'The first system message is mandatory if it fits; if it does not fit, return [].',
      'After reserving its tokens, select the most recent non-system messages going backwards; stop at the first message that cannot fit.',
      'Return selected messages in original chronological order. If no system message exists, use the full budget for recent messages.'
    ],
    signature:'memory_window(messages, budget)',
    starter:`def memory_window(messages, budget):\n    """Select recent messages within a token budget."""\n    # TODO\n    pass`,
    solution:`def memory_window(messages, budget):\n    system = next((m for m in messages if m['role'] == 'system'), None)\n    if system is not None and system['tokens'] > budget:\n        return []\n    remaining = budget - (system['tokens'] if system else 0)\n    other = [m for m in messages if m['role'] != 'system']\n    selected = []\n    for msg in reversed(other):\n        if msg['tokens'] > remaining:\n            break\n        selected.append(msg)\n        remaining -= msg['tokens']\n    selected.reverse()\n    return ([system] if system else []) + selected`,
    explanation:[
      'Reserve the mandatory instruction first; otherwise recent chat can evict it.',
      'Walk backward from the newest message to preserve the latest contiguous context.',
      'Stop on a too-large message rather than skipping it, keeping conversational continuity.'
    ],
    complexity:'Time: O(n), space: O(n) for up to n messages.',
    pitfall:'Do not silently discard an oversized recent message and then include older messages. That changes the intended contiguous window.',
    hints:['Find the first system message and subtract its token cost.','Walk through non-system messages in reverse order and reverse the accepted suffix back.'],
    tests:[
      {name:'Keep system and latest',code:`m=[{'role':'system','content':'rules','tokens':2},{'role':'user','content':'old','tokens':5},{'role':'assistant','content':'new','tokens':2}]; assert [x['content'] for x in memory_window(m,4)] == ['rules','new']`},
      {name:'All fit',code:`m=[{'role':'user','content':'a','tokens':1},{'role':'assistant','content':'b','tokens':2}]; assert memory_window(m,3) == m`},
      {name:'System too large',code:`assert memory_window([{'role':'system','content':'s','tokens':9}],8) == []`},
      {name:'Stop at first oversized message',code:`m=[{'role':'user','content':'old','tokens':1},{'role':'user','content':'big','tokens':10},{'role':'user','content':'latest','tokens':1}]; assert [x['content'] for x in memory_window(m,3)] == ['latest']`},
      {name:'Empty',code:`assert memory_window([], 10) == []`}
    ]
  },
  {
    id:'world-model-evaluation', number:6, track:'World Models', difficulty:'Hard',
    title:'Compute Planning Regret from Predicted Costs', duration:'25 min',
    tags:['Planning','Evaluation','Decision Quality'],
    description:'A world model can have low average prediction error but still make poor decisions. Implement a decision-aware evaluator that measures regret from using predicted costs instead of the true costs.',
    requirements:[
      'Input: predicted and true dictionaries mapping actions to scalar costs, with identical nonempty action keys.',
      'Pick the action with the smallest predicted cost; break ties alphabetically.',
      'Regret = true cost of selected action − minimum true cost across all actions.',
      'Return a dict {"action": selected_action, "regret": float_value}.'
    ],
    signature:'planning_regret(predicted, true_costs)',
    starter:`def planning_regret(predicted, true_costs):\n    """Return chosen action and regret under true costs."""\n    # TODO\n    pass`,
    solution:`def planning_regret(predicted, true_costs):\n    action = min(sorted(predicted), key=lambda a: predicted[a])\n    best_true = min(true_costs.values())\n    regret = true_costs[action] - best_true\n    return {'action': action, 'regret': float(regret)}`,
    explanation:[
      'Prediction error averages differences across actions, but a planner cares about which action ranks first.',
      'We evaluate the decision induced by the model using the true costs, then compare it to the oracle best possible cost.',
      'This reveals cases where small errors around an action boundary reverse a high-stakes decision.'
    ],
    complexity:'Time: O(a log a) for sorting and O(a) for true cost minimization; O(a) auxiliary space.',
    pitfall:'Do not compute mean squared prediction error; this challenge evaluates downstream decision regret.',
    hints:['Choose based only on predicted costs.','Measure the chosen action using true costs, then subtract the best true cost.'],
    tests:[
      {name:'Zero regret',code:`assert planning_regret({'a':1,'b':3},{'a':2,'b':4}) == {'action':'a','regret':0.0}`},
      {name:'Wrong action incurs regret',code:`assert planning_regret({'a':1,'b':2},{'a':100,'b':0}) == {'action':'a','regret':100.0}`},
      {name:'Tie is alphabetical',code:`assert planning_regret({'b':1,'a':1},{'b':2,'a':3}) == {'action':'a','regret':1.0}`},
      {name:'Negative costs supported',code:`assert planning_regret({'a':-1,'b':0},{'a':1,'b':-2}) == {'action':'a','regret':3.0}`}
    ]
  }
,
  {
    id:'kalman-scalar-update',number:7,track:'World Models',difficulty:'Medium',
    title:'Implement a Scalar Kalman Measurement Update',duration:'18 min',
    tags:['State Estimation','Kalman Filter','Uncertainty'],
    description:'Given a predicted scalar Gaussian state estimate and a noisy measurement, implement the standard Kalman measurement update. This is the correction step, not the prediction step.',
    requirements:[
      'Inputs mean, variance, observation, measurement_variance are real numbers. variance >= 0 and measurement_variance >= 0; their sum is strictly positive.',
      'Compute K = variance / (variance + measurement_variance).',
      'Return (updated_mean, updated_variance), where updated_mean = mean + K * (observation - mean) and updated_variance = (1 - K) * variance.',
      'This problem is scalar: do not use a matrix or a library.'
    ],
    signature:'kalman_update(mean, variance, observation, measurement_variance)',
    starter:`def kalman_update(mean, variance, observation, measurement_variance):
    """Return the posterior (mean, variance)."""
    # TODO: scalar measurement update
    pass`,
    solution:`def kalman_update(mean, variance, observation, measurement_variance):
    gain = variance / (variance + measurement_variance)
    updated_mean = mean + gain * (observation - mean)
    updated_variance = (1 - gain) * variance
    return updated_mean, updated_variance`,
    explanation:[
      'A Gaussian prior is summarized by mean and variance; the observation is corrupted by additive zero-mean measurement noise.',
      'The Kalman gain is the fraction of prior uncertainty in the total uncertainty. When sensor noise increases, the measurement has less influence.',
      'The posterior variance is no larger than the prior variance under the stated assumptions.'
    ],
    complexity:'Time O(1), extra space O(1).',
    pitfall:'Do not confuse measurement variance with measurement standard deviation or accidentally apply a prediction update.',
    hints:['The denominator is the sum of predicted and measurement variances.','Use the gain to correct the mean, then shrink the variance.'],
    tests:[
      {name:'Equal variances',code:`assert kalman_update(0,1,10,1)==(5.0,0.5)`},
      {name:'Noisy measurement',code:`m,v=kalman_update(0,1,10,9); assert abs(m-1)<1e-12 and abs(v-.9)<1e-12`},
      {name:'Precise measurement',code:`m,v=kalman_update(0,9,10,1);assert abs(m-9)<1e-12 and abs(v-.9)<1e-12`},
      {name:'Zero measurement variance',code:`assert kalman_update(4,5,11,0)==(11.0,0.0)`},
      {name:'Zero predicted variance',code:`assert kalman_update(2,0,11,4)==(2.0,0.0)`}
    ]
  },
  {
    id:'linear-dynamics-rollout',number:8,track:'World Models',difficulty:'Easy',
    title:'Roll Out a Linear State Transition Model',duration:'15 min',
    tags:['Transition Function','Dynamics','Rollout'],
    description:'A basic action-conditioned world model uses the transition x_(t+1) = a*x_t + b*u_t. Simulate the predicted state trajectory for a known list of actions.',
    requirements:[
      'x0, a, b and every action are finite real numbers. actions is a list and may be empty.',
      'Return the list [x0, x1, ..., xT] with exactly len(actions) + 1 entries.',
      'At each step compute x_next = a * x_current + b * action; do not update the initial x0 in place.'
    ],
    signature:'rollout_linear(x0, actions, a, b)',
    starter:`def rollout_linear(x0, actions, a, b):
    """Predict states including the initial state."""
    # TODO: implement the action-conditioned transition
    pass`,
    solution:`def rollout_linear(x0, actions, a, b):
    states = [x0]
    state = x0
    for action in actions:
        state = a * state + b * action
        states.append(state)
    return states`,
    explanation:[
      'A transition function maps the current state and action to the next state. A rollout repeatedly applies that function.',
      'Including x0 makes the returned sequence a state trajectory, not merely a list of successor states.',
      'This deterministic toy model isolates a core operation used by model-based planning; it does not train a dynamics model.'
    ],
    complexity:'Time O(T), output space O(T) for T actions.',
    pitfall:'Do not return only T states. A trajectory over T transitions contains T+1 states including its initial state.',
    hints:['Start a result list with x0.','For each action, update state and append it to the result.'],
    tests:[
      {name:'Two actions',code:`assert rollout_linear(0,[2,3],1,1)==[0,2,5]`},
      {name:'No actions',code:`assert rollout_linear(7,[],.5,4)==[7]`},
      {name:'Decay',code:`assert rollout_linear(8,[0,0],.5,1)==[8,4,2]`},
      {name:'Action effects',code:`assert rollout_linear(1,[2,-1],2,3)==[1,8,13]`},
      {name:'State stays input',code:`a=[1,2];assert rollout_linear(3,a,1,0)==[3,3,3] and a==[1,2]`}
    ]
  },
  {
    id:'stable-softmax',number:9,track:'AI Foundations',difficulty:'Easy',
    title:'Implement Numerically Stable Softmax',duration:'12 min',
    tags:['Numerical Computing','Inference','Math'],
    description:'Convert logits to probabilities using softmax without overflowing on large logits. Implement the max-subtraction trick in pure Python.',
    requirements:[
      'Input logits is a nonempty list of finite real numbers whose magnitudes are <= 10000; temperature is a finite real number in [0.001, 1000].',
      'Compute scaled logits = [value / temperature for value in logits].',
      'Subtract the maximum scaled logit before exponentiation, then normalize weights to sum to one.',
      'Return a list of floating-point probabilities in the same order as logits.'
    ],
    signature:'stable_softmax(logits, temperature)',
    starter:`def stable_softmax(logits, temperature):
    """Return temperature-scaled softmax probabilities."""
    # TODO: use math.exp safely
    pass`,
    solution:`import math

def stable_softmax(logits, temperature):
    scaled = [x / temperature for x in logits]
    offset = max(scaled)
    weights = [math.exp(x - offset) for x in scaled]
    total = sum(weights)
    return [w / total for w in weights]`,
    explanation:[
      'Softmax is invariant to adding the same constant to every scaled logit. Subtracting the maximum makes exponentials no greater than one.',
      'Temperature changes the sharpness of the distribution: lower positive values generally concentrate mass on larger logits.',
      'The normalization makes probabilities sum to one.'
    ],
    complexity:'Time O(n), extra space O(n).',
    pitfall:'Directly evaluating math.exp(1000) will overflow even though the resulting softmax probabilities are well defined.',
    hints:['The probabilities do not change when the same number is subtracted from every logit.','Use max(scaled) as the common offset before applying math.exp.'],
    tests:[
      {name:'Equal logits',code:`p=stable_softmax([0,0],1); assert all(abs(x-.5)<1e-12 for x in p)`},
      {name:'Large logits',code:`p=stable_softmax([1000,1001],1); assert p[1]>p[0] and abs(sum(p)-1)<1e-12`},
      {name:'Temperature',code:`p=stable_softmax([0,1],.5); q=stable_softmax([0,1],2); assert p[1]>q[1]`},
      {name:'Three logits',code:`p=stable_softmax([-5,0,5],1); assert len(p)==3 and abs(sum(p)-1)<1e-12`},
      {name:'Large negative',code:`p=stable_softmax([-1001,-1000],1); assert p[1]>p[0]`}
    ]
  }
];
const sequence=['stable-softmax','tool-call-parser','agent-retry-guard','agent-memory-window','rag-recall-k','kalman-scalar-update','linear-dynamics-rollout','world-model-action','world-model-evaluation'];
problems.sort((a,b)=>sequence.indexOf(a.id)-sequence.indexOf(b.id));
problems.forEach((p,i)=>{p.number=i+1;});

// v0.5: reproducible Agent and World Model challenges, appended to the verified v0.4 catalog.
import {newProblems} from './new-problems.mjs';
problems.push(...newProblems);

// v0.7: deterministic Agent orchestration, probabilistic World Models, LLM ranking/sampling, and RL foundations.
import {expansionProblems} from './expansion-problems.mjs';
problems.push(...expansionProblems);
// v0.8: self-contained video generation and predictive-video modeling components.
import {videoProblems} from './video-problems.mjs';
problems.push(...videoProblems);
// v0.9: step-by-step foundations (attention, ViT, GAN, diffusion and AdaLN).
import {foundationProblems} from './foundation-problems.mjs';
problems.push(...foundationProblems);
export const byId = Object.fromEntries(problems.map(p=>[p.id,p]));

import {coreNextProblems} from './core-next-problems.mjs';
problems.push(...coreNextProblems);
