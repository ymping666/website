import {pythonCommand} from './config.mjs';
// One plausible but flawed implementation per new v0.8 challenge.
// A caught mutation indicates the published tests discriminate at least this failure mode.
import {videoProblems} from '../src/video-problems.mjs';
import {spawnSync} from 'node:child_process';
const wrong = {
 'video-frame-mse':`def video_reconstruction_mse(pred,target):
    return sum((a-b)**2 for f,g in zip(pred,target) for a,b in zip(f,g))/len(pred) if pred else 0.0`,
 'video-temporal-velocity':`def frame_deltas(frames):
    return [[abs(b-a) for a,b in zip(x,y)] for x,y in zip(frames,frames[1:])]`,
 'vae-reparameterization':`import math
def vae_sample(mean,logvar,epsilon):
    return [m+math.exp(lv)*e for m,lv,e in zip(mean,logvar,epsilon)]`,
 'vae-standard-normal-kl':`def vae_kl_standard_normal(mu,logvar):
    return 0.5*sum(lv+m*m-1-lv for m,lv in zip(mu,logvar))`,
 'vae-beta-objective':`def beta_vae_loss(reconstruction,kl_per_dim,beta):
    return (sum(reconstruction)/len(reconstruction) if reconstruction else 0)+beta*(sum(kl_per_dim)/len(kl_per_dim) if kl_per_dim else 0)`,
 'vqvae-nearest-code':`def nearest_code_index(vector,codebook):
    return max(range(len(codebook)),key=lambda i:sum((x-y)**2 for x,y in zip(vector,codebook[i])))`,
 'vqvae-codebook-perplexity':`import math
def codebook_perplexity(indices,n_codes):
    if not indices: return 0.0
    counts=[indices.count(i)/n_codes for i in range(n_codes)]
    return math.exp(-sum(p*math.log(p) for p in counts if p))`,
 'vqvae-quantization-error':`def quantization_mse(encoder,quantized):
    n=sum(len(v) for v in encoder)
    return sum(abs(a-b) for x,y in zip(encoder,quantized) for a,b in zip(x,y))/n if n else 0.0`,
 'video-latent-sequence':`def flatten_video_codes(codes):
    return sorted([x for frame in codes for row in frame for x in row])`,
 'video-temporal-patchify':`def temporal_patchify(frames,patch_size):
    return [[v for f in frames[t:t+patch_size] for v in f] for t in range(max(0,len(frames)-patch_size+1))]`,
 'flow-linear-interpolation':`def linear_flow_path(x0,x1,t):
    return [t*a+(1-t)*b for a,b in zip(x0,x1)]`,
 'flow-conditional-velocity':`def linear_flow_velocity(x0,x1):
    return [a-b for a,b in zip(x0,x1)]`,
 'flow-velocity-regression':`def flow_velocity_mse(prediction,x0,x1):
    return sum((p-b)**2 for p,b in zip(prediction,x1))/len(prediction)`,
 'flow-euler-integration':`def euler_flow(x0,velocity,steps):
    x=x0; dt=1/steps
    for i in range(steps): x+=dt*velocity(x,(i+1)*dt)
    return x`,
 'flow-heun-integration':`def heun_flow(x0,velocity,steps):
    x=x0; dt=1/steps
    for i in range(steps): x+=dt*velocity(x,i*dt)
    return x`,
 'flow-cfg-velocity':`def guided_velocity(unconditional,conditional,guidance_scale):
    return [guidance_scale*c for c in conditional]`,
 'video-action-conditioned-rollout':`def action_latent_rollout(initial_state,actions,transition):
    return [initial_state]+[transition(initial_state,a) for a in actions]`,
 'video-temporal-difference-loss':`def temporal_difference_mse(predicted,target):
    if len(predicted)<2:return 0.0
    return sum((a-b)**2 for x,y in zip(predicted,target) for a,b in zip(x,y))/(len(predicted)*len(predicted[0]))`,
 'video-causal-token-context':`def causal_token_contexts(tokens,context_size):
    return [tokens[max(0,i-context_size):i+1] for i in range(len(tokens))]`,
 'video-token-cross-entropy':`import math
def video_token_nll(probabilities,targets):
    if not targets:return 0.0
    return -sum(math.log(max(p)) for p in probabilities)/len(targets)`
};
if (videoProblems.some(p=>!wrong[p.id]) || Object.keys(wrong).length!==videoProblems.length) throw new Error('Missing video mutation');
const input=videoProblems.map(p=>({id:p.id,solution:wrong[p.id],tests:p.tests}));
const runner=`import json,sys
items=json.load(sys.stdin)
count=0
for p in items:
    caught=False
    for t in p['tests']:
        g={}
        try:
            exec(p['solution'],g,g)
            exec(t['code'],g,g)
        except Exception:
            caught=True
            break
    if not caught:
        print('SURVIVED MUTATION',p['id'])
        sys.exit(1)
    count+=1
print('PASS',count,'new v0.8 typical flawed solutions rejected')`;
const result=spawnSync(pythonCommand,['-c',runner],{input:JSON.stringify(input),encoding:'utf8'});
if(result.stdout)process.stdout.write(result.stdout);
if(result.stderr)process.stderr.write(result.stderr);
if(result.status!==0)process.exit(1);
