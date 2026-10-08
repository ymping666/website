import { readFile, writeFile } from 'node:fs/promises';
const path=new URL('../src/problems.mjs',import.meta.url);
let s=await readFile(path,'utf8');
const pos=s.lastIndexOf('];\nexport const byId');
if(pos===-1)throw Error('Bad original module');
const extra=String.raw`,
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
    starter:0def kalman_update(mean, variance, observation, measurement_variance):
    """Return the posterior (mean, variance)."""
    # TODO: scalar measurement update
    pass0,
    solution:0def kalman_update(mean, variance, observation, measurement_variance):
    gain = variance / (variance + measurement_variance)
    updated_mean = mean + gain * (observation - mean)
    updated_variance = (1 - gain) * variance
    return updated_mean, updated_variance0,
    explanation:[
      'A Gaussian prior is summarized by mean and variance; the observation is corrupted by additive zero-mean measurement noise.',
      'The Kalman gain is the fraction of prior uncertainty in the total uncertainty. When sensor noise increases, the measurement has less influence.',
      'The posterior variance is no larger than the prior variance under the stated assumptions.'
    ],
    complexity:'Time O(1), extra space O(1).',
    pitfall:'Do not confuse measurement variance with measurement standard deviation or accidentally apply a prediction update.',
    hints:['The denominator is the sum of predicted and measurement variances.','Use the gain to correct the mean, then shrink the variance.'],
    tests:[
      {name:'Equal variances',code:0assert kalman_update(0,1,10,1)==(5.0,0.5)0},
      {name:'Noisy measurement',code:0m,v=kalman_update(0,1,10,9); assert abs(m-1)<1e-12 and abs(v-.9)<1e-120},
      {name:'Precise measurement',code:0m,v=kalman_update(0,9,10,1);assert abs(m-9)<1e-12 and abs(v-.9)<1e-120},
      {name:'Zero measurement variance',code:0assert kalman_update(4,5,11,0)==(11.0,0.0)0},
      {name:'Zero predicted variance',code:0assert kalman_update(2,0,11,4)==(2.0,0.0)0}
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
    starter:0def rollout_linear(x0, actions, a, b):
    """Predict states including the initial state."""
    # TODO: implement the action-conditioned transition
    pass0,
    solution:0def rollout_linear(x0, actions, a, b):
    states = [x0]
    state = x0
    for action in actions:
        state = a * state + b * action
        states.append(state)
    return states0,
    explanation:[
      'A transition function maps the current state and action to the next state. A rollout repeatedly applies that function.',
      'Including x0 makes the returned sequence a state trajectory, not merely a list of successor states.',
      'This deterministic toy model isolates a core operation used by model-based planning; it does not train a dynamics model.'
    ],
    complexity:'Time O(T), output space O(T) for T actions.',
    pitfall:'Do not return only T states. A trajectory over T transitions contains T+1 states including its initial state.',
    hints:['Start a result list with x0.','For each action, update state and append it to the result.'],
    tests:[
      {name:'Two actions',code:0assert rollout_linear(0,[2,3],1,1)==[0,2,5]0},
      {name:'No actions',code:0assert rollout_linear(7,[],.5,4)==[7]0},
      {name:'Decay',code:0assert rollout_linear(8,[0,0],.5,1)==[8,4,2]0},
      {name:'Action effects',code:0assert rollout_linear(1,[2,-1],2,3)==[1,8,13]0},
      {name:'State stays input',code:0a=[1,2];assert rollout_linear(3,a,1,0)==[3,3,3] and a==[1,2]0}
    ]
  },
  {
    id:'stable-softmax',number:9,track:'AI Foundations',difficulty:'Easy',
    title:'Implement Numerically Stable Softmax',duration:'12 min',
    tags:['Numerical Computing','Inference','Math'],
    description:'Convert logits to probabilities using softmax without overflowing on large logits. Implement the max-subtraction trick in pure Python.',
    requirements:[
      'Input logits is a nonempty list of finite real numbers; temperature is a finite positive real number.',
      'Compute scaled logits = [value / temperature for value in logits].',
      'Subtract the maximum scaled logit before exponentiation, then normalize weights to sum to one.',
      'Return a list of floating-point probabilities in the same order as logits.'
    ],
    signature:'stable_softmax(logits, temperature)',
    starter:0def stable_softmax(logits, temperature):
    """Return temperature-scaled softmax probabilities."""
    # TODO: use math.exp safely
    pass0,
    solution:0import math

def stable_softmax(logits, temperature):
    scaled = [x / temperature for x in logits]
    offset = max(scaled)
    weights = [math.exp(x - offset) for x in scaled]
    total = sum(weights)
    return [w / total for w in weights]0,
    explanation:[
      'Softmax is invariant to adding the same constant to every scaled logit. Subtracting the maximum makes exponentials no greater than one.',
      'Temperature changes the sharpness of the distribution: lower positive values generally concentrate mass on larger logits.',
      'The normalization makes probabilities sum to one.'
    ],
    complexity:'Time O(n), extra space O(n).',
    pitfall:'Directly evaluating math.exp(1000) will overflow even though the resulting softmax probabilities are well defined.',
    hints:['The probabilities do not change when the same number is subtracted from every logit.','Use max(scaled) as the common offset before applying math.exp.'],
    tests:[
      {name:'Equal logits',code:0p=stable_softmax([0,0],1); assert all(abs(x-.5)<1e-12 for x in p)0},
      {name:'Large logits',code:0p=stable_softmax([1000,1001],1); assert p[1]>p[0] and abs(sum(p)-1)<1e-120},
      {name:'Temperature',code:0p=stable_softmax([0,1],.5); q=stable_softmax([0,1],2); assert p[1]>q[1]0},
      {name:'Three logits',code:0p=stable_softmax([-5,0,5],1); assert len(p)==3 and abs(sum(p)-1)<1e-120},
      {name:'Large negative',code:0p=stable_softmax([-1001,-1000],1); assert p[1]>p[0]0}
    ]
  }
`;
s=s.slice(0,pos)+extra.replaceAll('\x16','`')+s.slice(pos);
await writeFile(path,s);
