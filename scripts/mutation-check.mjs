import {pythonCommand} from './config.mjs';
// A simple fault-detection smoke test: each new challenge must reject a plausible incorrect algorithm.
// Not a substitute for independent editorial review or property-based testing.
import {problems} from '../src/problems.mjs';
import {spawnSync} from 'node:child_process';
const incorrect = {
 'agent-topological-schedule': `def schedule_plan(tasks):\n    return sorted(tasks)`,
 'agent-merge-tool-results': `def merge_results(call_ids, responses):\n    lookup=dict(responses)\n    return [(x,lookup.get(x)) for x in call_ids]`,
 'agent-exponential-backoff': `def retry_delays(outcomes, base_delay, max_delay):\n    n=0; out=[]\n    for success in outcomes:\n        if not success: n+=1\n        out.append(0.0 if success else min(max_delay, base_delay*2**(n-1)))\n    return out`,
 'agent-jsonrpc-response': `def classify_rpc_response(message, expected_id):\n    if not isinstance(message,dict) or message.get('jsonrpc')!='2.0' or message.get('id')!=expected_id: return 'invalid'\n    return 'success' if message.get('result') else ('remote_error' if message.get('error') else 'invalid')`,
 'world-discrete-bayes-filter': `def belief_update(belief, transition, likelihood):\n    z=sum(likelihood)\n    return [x/z for x in likelihood]`,
 'world-belief-propagation': `def propagate_belief(mean, variance, a, process_var, controls):\n    out=[]\n    for u in controls:\n        mean=a*mean+u; variance=a*variance+process_var; out.append((mean,variance))\n    return out`,
 'world-rollout-error-curve': `def rollout_mse_curve(predicted, target):\n    if not predicted: return []\n    d=len(predicted[0]); accum=0; out=[]\n    for a,b in zip(predicted,target):\n        accum+=sum((x-y)**2 for x,y in zip(a,b))\n        out.append(accum/d)\n    return out`,
 'world-diagonal-gaussian-kl': `def diagonal_gaussian_kl(q_mean,q_var,p_mean,p_var):\n    return 0.5*sum((x-y)**2/v for x,y,v in zip(q_mean,p_mean,p_var))`,
 'llm-mean-reciprocal-rank': `def mean_reciprocal_rank(ranked_lists,relevant_per_query):\n    if not ranked_lists: return 0.0\n    return sum(any(x in set(gold) for x in rank) for rank,gold in zip(ranked_lists,relevant_per_query))/len(ranked_lists)`,
 'llm-topk-softmax': `import math\ndef top_k_probabilities(logits,k):\n    mx=max(logits); exp=[math.exp(x-mx) for x in logits]; z=sum(exp)\n    return [x/z for x in exp]`,
 'llm-evidence-context-pack': `def pack_context(chunks,token_counts,budget):\n    out=[]\n    for c,n in zip(chunks,token_counts):\n        if n<=budget: out.append(c); budget-=n\n    return out`,
 'foundation-epsilon-greedy': `def epsilon_greedy(q_values,epsilon,uniform_draw,random_index):\n    if uniform_draw<epsilon: return random_index\n    return max(range(len(q_values)),key=lambda i:(q_values[i],i))`,
 'foundation-nstep-return': `def discounted_return(rewards,terminals,gamma,bootstrap_value):\n    total=0; discount=1\n    for r in rewards:\n        total+=discount*r; discount*=gamma\n    return total+discount*bootstrap_value`,

 'react-trace-validator': `def valid_react_trace(events):\n    return bool(events) and events[0]=='thought' and events[-1]=='finish'`,
 'agent-plan-ready': `def ready_tasks(tasks, completed):\n    done=set(completed)\n    return sorted(t for t, deps in tasks.items() if t not in done and any(d in done for d in deps))`,
 'agent-reflection-controller': `def reflection_decision(scores, max_rounds, target, min_improvement):\n    if scores and scores[-1]>=target: return 'target_reached'\n    return 'budget_exhausted' if len(scores)>=max_rounds else 'continue'`,
 'tool-schema-enforcer': `def validate_tool_request(request, registry):\n    name=request.get('tool')\n    if name not in registry: return 'unknown_tool'\n    schema=registry[name]; args=request.get('arguments')\n    if not isinstance(args,dict) or set(args)!=set(schema): return 'invalid_arguments'\n    tags={'str':str,'int':int,'bool':bool}\n    return 'ok' if all(isinstance(args[k],tags[t]) for k,t in schema.items()) else 'invalid_arguments'`,
 'mpc-first-action': `def mpc_first_action(state, candidates, transition, cost):\n    return min(candidates,key=lambda a: cost(transition(state,a[0])))[0] if candidates else None`,
 'cem-categorical-update': `def cem_elite_frequencies(candidates, costs, elite_count, n_actions):\n    h=len(candidates[0]); out=[[0.0]*n_actions for _ in range(h)]\n    for candidate in candidates:\n        for t,a in enumerate(candidate): out[t][a]+=1/len(candidates)\n    return out`,
 'prediction-vs-decision': `def compare_forecasts(pred_a, pred_b, true_costs):\n    actions=list(true_costs)\n    ma=sum((pred_a[a]-true_costs[a])**2 for a in actions)/len(actions)\n    mb=sum((pred_b[a]-true_costs[a])**2 for a in actions)/len(actions)\n    winner='A' if ma<mb else ('B' if mb<ma else 'tie')\n    return {'mse_a':ma,'mse_b':mb,'regret_a':0.0,'regret_b':0.0,'lower_mse':winner,'lower_regret':'tie'}`,
 'risk-sensitive-planner': `def risk_sensitive_action(means, variances, risk_weight):\n    return min(sorted(means),key=lambda a: means[a]+risk_weight*variances[a]) if means else None`
};
const cases=problems.filter(x=>incorrect[x.id]).map(p=>({id:p.id,solution:incorrect[p.id],tests:p.tests}));
if(cases.length!==Object.keys(incorrect).length)throw Error('Mutation exercise count mismatch');
const runner=`import json,sys\nitems=json.load(sys.stdin)\nfor p in items:\n  killed=False\n  for t in p['tests']:\n    ns={}\n    try:\n      exec(p['solution'],ns,ns)\n      exec(t['code'],ns,ns)\n    except Exception:\n      killed=True\n      break\n  if not killed:\n    print('SURVIVED',p['id'])\n    sys.exit(1)\n  print('CAUGHT INCORRECT IMPLEMENTATION:',p['id'])`;
const r=spawnSync(pythonCommand,['-c',runner],{input:JSON.stringify(cases),encoding:'utf8'});
if(r.stdout)process.stdout.write(r.stdout);
if(r.stderr)process.stderr.write(r.stderr);
if(r.status!==0)process.exit(1);
console.log('PASS',cases.length,'deliberately incorrect algorithms rejected by published tests');
