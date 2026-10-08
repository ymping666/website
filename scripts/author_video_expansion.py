"""Original, deterministic, CPU-only coding exercises for video-world-model building blocks.
Each challenge tests a *component*; none claims to train a full generative video model.
"""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
items=[]
VAE=[{'title':'Auto-Encoding Variational Bayes (Kingma & Welling)','url':'https://arxiv.org/abs/1312.6114'}]
VQVAE=[{'title':'Neural Discrete Representation Learning (VQ-VAE)','url':'https://arxiv.org/abs/1711.00937'}]
FM=[{'title':'Flow Matching for Generative Modeling (Lipman et al.)','url':'https://arxiv.org/abs/2210.02747'}]
VIDEO=[{'title':'VideoGPT: Video Generation using VQ-VAE and Transformers','url':'https://arxiv.org/abs/2104.10157'}]
WORLD=[{'title':'World Models & Spatial Intelligence — Video World Models map','url':'https://overdued.github.io/world-model-spatial-intelligence-course/'}]
def add(id,title,level,minutes,tags,desc,req,signature,solution,tests,why,pitfall,complexity,hints,refs=WORLD):
    assert len(req)>=3 and len(tests)>=5 and len(why)>=3, id
    fn=signature.split('(')[0]
    items.append(dict(id=id,number=31+len(items),track='Video World Models',difficulty=level,title=title,duration=f'{minutes} min',tags=tags,
      description=desc,requirements=req,signature=signature,
      starter=f'def {signature}:\n    """Implement the specified component; no external dependencies."""\n    # TODO\n    pass',
      solution=solution.strip(),explanation=why,complexity=complexity,pitfall=pitfall,hints=hints,
      references=refs,tests=[{'name':name,'code':code} for name,code in tests]))

def approx_call(function_expr,expected,tol='1e-9'):
    return f'assert abs({function_expr} - ({expected})) < {tol}'

add('video-frame-mse','Compute Pixel Reconstruction MSE','Easy',12,['Video','Reconstruction','Loss'],
 'A video decoder reconstructs a sequence of flat, equally sized frames. Implement the mean squared error over all pixels in all frames.',
 ['pred and target are equal-shape lists of frames; each frame is a nonempty list of finite floats. The outer lists may both be empty.',
  'Return the sum of squared pixel differences divided by the TOTAL number of pixels across all frames.',
  'Return 0.0 for two empty videos. Do not modify either video.'],
 'video_reconstruction_mse(pred, target)',
 '''def video_reconstruction_mse(pred, target):
    total = sum((a-b)**2 for pa,ta in zip(pred,target) for a,b in zip(pa,ta))
    count = sum(len(frame) for frame in pred)
    return total / count if count else 0.0''',
 [('Two frames',approx_call('video_reconstruction_mse([[0,1],[2,3]],[[0,0],[2,5]])','1.25')),
  ('Single pixel',approx_call('video_reconstruction_mse([[5]],[[2]])','9')),
  ('All equal',approx_call('video_reconstruction_mse([[0,0],[1,2]],[[0,0],[1,2]])','0')),
  ('Empty sequence',approx_call('video_reconstruction_mse([],[])','0')),
  ('Different frame widths',approx_call('video_reconstruction_mse([[0],[1,2]],[[2],[1,4]])','8/3')),
  ('Input preserved',"p=[[0,1]]; t=[[2,3]]; video_reconstruction_mse(p,t); assert p==[[0,1]] and t==[[2,3]]")],
 ['Flattening the video into pixels gives a transparent reconstruction objective independent of tensor library.',
  'Normalize by the number of scalar pixel values; treating each frame equally can differ if widths vary.',
  'This objective measures pointwise fidelity, not perceptual or temporal quality.'],
 'Dividing by the number of frames instead of pixels changes the loss scale.',
 'O(P) time over P pixels and O(1) additional space.',
 ['Accumulate squared differences across both nesting levels.','Count scalar pixels, not frames.'],VAE+VIDEO)

add('video-temporal-velocity','Compute Frame-to-Frame Difference Vectors','Easy',12,['Video','Temporal Dynamics','Features'],
 'For a sequence of latent frame feature vectors, estimate discrete temporal changes between adjacent observations.',
 ['frames is a list of equal-length lists of finite floats; vectors may be empty.',
  'Return vectors frames[t+1] - frames[t] for every adjacent frame pair, preserving coordinate order.',
  'If fewer than two frames exist, return []. Do not mutate the input.'],
 'frame_deltas(frames)',
 '''def frame_deltas(frames):
    return [[b-a for a,b in zip(old,new)] for old,new in zip(frames,frames[1:])]''',
 [('Two frames',"assert frame_deltas([[1,2],[4,0]]) == [[3,-2]]"),
  ('Three frames',"assert frame_deltas([[1],[3],[8]]) == [[2],[5]]"),
  ('Single frame',"assert frame_deltas([[1,2]]) == []"),
  ('Empty frames',"assert frame_deltas([]) == []"),
  ('Zero dimensional',"assert frame_deltas([[],[]]) == [[]]"),
  ('Input preserved',"x=[[1],[2]]; frame_deltas(x); assert x==[[1],[2]]")],
 ['Finite differences approximate temporal motion in latent features.',
  'Adjacent changes retain the time order and can be used as simple velocity-like features.',
  'This is NOT optical flow between image pixels and does not encode geometry by itself.'],
 'Subtracting the last frame from the first gives displacement, not every local transition.',
 'O(TD) time and O(TD) output for T frames of dimension D.',
 ['Use zip(frames, frames[1:]).','Subtract each coordinate old from new.'],VIDEO+WORLD)

add('vae-reparameterization','Apply the Gaussian VAE Reparameterization','Medium',16,['VAE','Latent Variables','Gaussian'],
 'Implement the deterministic arithmetic inside the VAE reparameterization trick using a provided epsilon sample, without random draws.',
 ['mean, logvar and epsilon are equal-length lists of finite floats; empty lists are allowed.',
  'For each dimension return mean[i] + exp(0.5 * logvar[i]) * epsilon[i].',
  'Use the supplied epsilon exactly; never sample randomness or modify inputs.'],
 'vae_sample(mean, logvar, epsilon)',
 '''import math

def vae_sample(mean, logvar, epsilon):
    return [m + math.exp(0.5*lv)*e for m,lv,e in zip(mean,logvar,epsilon)]''',
 [('Unit variance',"assert vae_sample([1,2],[0,0],[3,-2]) == [4.0,0.0]"),
  ('Variance four',approx_call('vae_sample([0],[math.log(4)],[1])[0]','2')),
  ('Zero epsilon',"assert vae_sample([3],[20],[0]) == [3.0]"),
  ('Two dimensions',"r=vae_sample([0,1],[0,math.log(9)],[-2,2]); assert abs(r[0]+2)<1e-9 and abs(r[1]-7)<1e-9"),
  ('Empty',"assert vae_sample([],[],[]) == []"),
  ('No input mutation',"m=[1.]; lv=[0.]; z=[2.]; vae_sample(m,lv,z); assert m==[1.] and lv==[0.] and z==[2.]")],
 ['A VAE encoder returns distribution parameters rather than directly sampling an independent latent.',
  'Standard deviation equals exp(logvar / 2), not exp(logvar).',
  'Keeping epsilon fixed makes the arithmetic deterministic and testable in a browser-only judge.'],
 'Multiplying by exp(logvar) uses variance, not standard deviation.',
 'O(D) time and O(D) output for D latent dimensions.',
 ['Compute standard deviation from log-variance.','Multiply by epsilon, then add the mean.'],VAE)

add('vae-standard-normal-kl','Compute VAE KL to a Standard Normal','Medium',17,['VAE','KL Divergence','Regularization'],
 'Compute the diagonal-Gaussian KL divergence between q(z|x)=N(mu,diag(exp(logvar))) and a standard-normal prior.',
 ['mu and logvar are equal-length lists of finite floats, representing independent latent dimensions.',
  'Return 0.5 * sum(exp(logvar[i]) + mu[i]**2 - 1 - logvar[i]).',
  'Return 0.0 for empty vectors. Do not clamp intermediate values or alter the input.'],
 'vae_kl_standard_normal(mu, logvar)',
 '''import math

def vae_kl_standard_normal(mu, logvar):
    return 0.5 * sum(math.exp(lv) + m*m - 1 - lv for m,lv in zip(mu,logvar))''',
 [('Matching prior',approx_call('vae_kl_standard_normal([0,0],[0,0])','0')),
  ('Nonzero mean',approx_call('vae_kl_standard_normal([2],[0])','2')),
  ('Nonunit variance',approx_call('vae_kl_standard_normal([0],[math.log(4)])','0.5*(4-1-math.log(4))')),
  ('Two dims',approx_call('vae_kl_standard_normal([1,2],[0,0])','2.5')),
  ('Empty',approx_call('vae_kl_standard_normal([],[])','0')),
  ('Positive example',"assert vae_kl_standard_normal([0],[-1]) > 0")],
 ['The closed-form Gaussian KL is the regularization term of a conventional VAE ELBO.',
  'Use a SUM across latent dimensions for each sample here; batch averaging is outside this exercise.',
  'A zero value indicates the approximate posterior matches the unit Gaussian prior.'],
 'Replacing exp(logvar) with logvar confuses variance and its logarithm.',
 'O(D) time and O(1) additional space.',
 ['Variance is exp(logvar).','Add variance, squared mean, minus one, minus log-variance.'],VAE)

add('vae-beta-objective','Combine Reconstruction and Beta-VAE KL Loss','Easy',14,['VAE','ELBO','Loss'],
 'A simplified beta-VAE training loss balances reconstruction and latent KL regularization for one sample.',
 ['reconstruction is a list of nonnegative finite PER-PIXEL squared errors, possibly empty.',
  'kl_per_dim is a list of nonnegative per-latent KL contributions; beta is a finite nonnegative float.',
  'Return mean(reconstruction), or 0.0 if empty, PLUS beta * sum(kl_per_dim).'],
 'beta_vae_loss(reconstruction, kl_per_dim, beta)',
 '''def beta_vae_loss(reconstruction, kl_per_dim, beta):
    recon = sum(reconstruction)/len(reconstruction) if reconstruction else 0.0
    return recon + beta*sum(kl_per_dim)''',
 [('Typical loss',approx_call('beta_vae_loss([1,3],[0.5,0.25],2)','3.5')),
  ('Zero beta',approx_call('beta_vae_loss([4,0],[7],0)','2')),
  ('Empty reconstruction',approx_call('beta_vae_loss([],[1,2],0.5)','1.5')),
  ('Empty KL',approx_call('beta_vae_loss([2,4],[],10)','3')),
  ('Both empty',approx_call('beta_vae_loss([],[],1)','0')),
  ('Pixel average',approx_call('beta_vae_loss([1,1,10],[],1)','4'))],
 ['The reconstruction term here uses a mean over scalar pixel losses by design.',
  'The KL term is a sum across latent dimensions, then weighted by beta.',
  'Actual VAEs may use Bernoulli NLL, Gaussian NLL and differing reduction conventions; keep the contract explicit.'],
 'Taking a mean over KL dimensions changes the specified weighting when latent dimension changes.',
 'O(P+D) time and O(1) additional space.',
 ['Compute reconstruction mean separately.','Add beta times the KL sum.'],VAE)

add('vqvae-nearest-code','Find the Nearest VQ-VAE Codebook Entry','Medium',19,['VQ-VAE','Quantization','Discrete Latents'],
 'Map a continuous encoder latent vector to the index of its nearest discrete codebook embedding by squared Euclidean distance.',
 ['vector is a list of D floats; codebook is a nonempty list of D-dimensional float lists. Dimension D may be zero.',
  'Return the zero-based codebook index with the smallest sum((vector[d]-code[d])**2).',
  'On exact ties return the SMALLEST index. Do not mutate the vectors.'],
 'nearest_code_index(vector, codebook)',
 '''def nearest_code_index(vector, codebook):
    return min(range(len(codebook)), key=lambda i: sum((x-y)**2 for x,y in zip(vector,codebook[i])))''',
 [('Basic nearest',"assert nearest_code_index([2,0],[[0,0],[3,1],[10,0]]) == 1"),
  ('Single code',"assert nearest_code_index([-2],[[1]]) == 0"),
  ('Tie picks smallest',"assert nearest_code_index([1],[[0],[2],[1.5]]) == 2"),
  ('Exact tie',"assert nearest_code_index([1],[[0],[2]]) == 0"),
  ('Zero-dimensional vector',"assert nearest_code_index([],[[],[]]) == 0"),
  ('Input unchanged',"x=[1]; c=[[0],[2]]; nearest_code_index(x,c); assert x==[1] and c==[[0],[2]]")],
 ['The VQ encoder replaces a continuous latent with the closest learned embedding.',
  'Squared Euclidean distance avoids square roots and preserves nearest-neighbor ranking.',
  'Explicit tie breaking ensures stable code indices across runs.'],
 'Selecting by vector norm or by coordinate-wise distance independently is not the same as total squared distance.',
 'O(KD) time and O(1) auxiliary space for K codebook entries of dimension D.',
 ['Compute one sum of squared differences per code vector.','Use min(range(len(codebook)), key=...) for stable ties.'],VQVAE+VIDEO)

add('vqvae-codebook-perplexity','Compute VQ-VAE Codebook Usage Perplexity','Medium',17,['VQ-VAE','Entropy','Codebook Usage'],
 'Measure how evenly a finite VQ codebook is used across encoded video patches using exp(entropy).',
 ['indices is a list of integer codebook IDs in [0, n_codes), with n_codes a positive integer.',
  'For nonempty indices, p[k] = occurrences(k)/len(indices), and perplexity = exp(-sum(p[k]*log(p[k]) for p[k]>0)).',
  'For empty indices return 0.0. Never evaluate log(0).'],
 'codebook_perplexity(indices, n_codes)',
 '''import math

def codebook_perplexity(indices, n_codes):
    if not indices:
        return 0.0
    counts = [0]*n_codes
    for index in indices:
        counts[index] += 1
    n = len(indices)
    return math.exp(-sum((c/n)*math.log(c/n) for c in counts if c))''',
 [('Uniform two codes',approx_call('codebook_perplexity([0,1,0,1],2)','2')),
  ('Collapsed codebook',approx_call('codebook_perplexity([1,1,1],4)','1')),
  ('Uniform four codes',approx_call('codebook_perplexity([0,1,2,3],4)','4')),
  ('One sample',approx_call('codebook_perplexity([3],5)','1')),
  ('Empty assignment',approx_call('codebook_perplexity([],4)','0')),
  ('Unused code',approx_call('codebook_perplexity([0,1,0,1],10)','2'))],
 ['Usage perplexity is the exponentiated entropy of discrete code assignments.',
  'Uniform use of K codes has perplexity K, whereas collapse to one code has perplexity one.',
  'Unused codes contribute zero to entropy and must not cause a logarithm-of-zero error.'],
 'Normalizing by the total configured codebook size instead of assignment count produces the wrong distribution.',
 'O(N+K) time and O(K) extra space.',
 ['Build a count for each possible code ID.','Ignore zero-probability terms in the entropy sum.'],VQVAE+VIDEO)

add('vqvae-quantization-error','Measure VQ Codebook Distortion','Easy',15,['VQ-VAE','Distortion','Loss'],
 'Given quantized codebook vectors and encoder outputs, compute the mean squared quantization distortion over all scalar latent coordinates.',
 ['encoder and quantized are equal-shape lists of vectors, where every vector has identical positive dimension D.',
  'Return sum of squared coordinate differences divided by total coordinates N*D.',
  'If both lists are empty return 0.0. Treat both inputs as fixed arrays; this exercise does not implement stop-gradient.'],
 'quantization_mse(encoder, quantized)',
 '''def quantization_mse(encoder, quantized):
    count=sum(len(v) for v in encoder)
    if count==0:
        return 0.0
    return sum((a-b)**2 for u,v in zip(encoder,quantized) for a,b in zip(u,v))/count''',
 [('Two vectors',approx_call('quantization_mse([[0,2],[2,2]],[[1,0],[2,4]])','9/4')),
  ('Perfect codes',approx_call('quantization_mse([[1,2]],[[1,2]])','0')),
  ('Single coordinate',approx_call('quantization_mse([[2]],[[5]])','9')),
  ('Empty',approx_call('quantization_mse([],[])','0')),
  ('Mean over elements',approx_call('quantization_mse([[0],[0],[0]],[[1],[2],[3]])','14/3'))],
 ['Quantization distortion measures the distance between continuous and selected discrete latents.',
  'The squared distance is related to codebook and commitment losses in VQ-VAE, but their gradient paths differ.',
  'This deterministic loss helper has no backpropagation and makes no claim to implement straight-through gradients.'],
 'Replacing squared error with absolute error changes the quantization objective.',
 'O(ND) time and O(1) extra space.',
 ['Sum squared differences over all latent coordinates.','Divide by the total number of scalar coordinates.'],VQVAE)

add('video-latent-sequence','Flatten Spatiotemporal Video Tokens','Medium',17,['Video Tokens','Spatiotemporal','Representation'],
 'A quantized video has a discrete latent grid indexed by time, row and column. Flatten it in time-major, row-major order for an autoregressive prior.',
 ['codes is a nonempty list of T frames; each frame contains H rows of W integer code IDs. T,H,W are positive and consistent.',
  'Return the sequence codes[t][y][x] with t outermost, y next, and x innermost.',
  'Keep repeats and zero IDs; do not sort the resulting tokens.'],
 'flatten_video_codes(codes)',
 '''def flatten_video_codes(codes):
    return [token for frame in codes for row in frame for token in row]''',
 [('Two frames',"assert flatten_video_codes([[[1,2],[3,4]],[[5,6],[7,8]]]) == [1,2,3,4,5,6,7,8]"),
  ('One pixel',"assert flatten_video_codes([[[7]]]) == [7]"),
  ('Do not sort tokens',"assert flatten_video_codes([[[9,1]],[[4,2]]]) == [9,1,4,2]"),
  ('Three frames',"assert flatten_video_codes([[[1]],[[2]],[[3]]]) == [1,2,3]"),
  ('Same code repeats',"assert flatten_video_codes([[[0,0]]]) == [0,0]"),
  ('Rectangular',"assert flatten_video_codes([[[1,2,3],[4,5,6]]]) == [1,2,3,4,5,6]")],
 ['VideoGPT-like models may predict sequences of quantized spatiotemporal tokens.',
  'Token ordering is part of the data contract and determines which tokens count as earlier context.',
  'Flattening preserves discrete code identities; it does not train a transformer.'],
 'Flattening spatial columns before time would change the autoregressive order.',
 'O(THW) time and output space.',
 ['Iterate over frames, then rows, then tokens.','Do not sort the indices.'],VIDEO)

add('video-temporal-patchify','Patch a Temporal Latent Sequence','Medium',17,['Video','Temporal Patches','Tokenization'],
 'Group frames of fixed-width latent features into nonoverlapping temporal patches without losing chronological order.',
 ['frames is a list of T equally sized feature vectors, and patch_size is a strictly positive integer.',
  'Return a list of flattened temporal patches, each formed by concatenating patch_size consecutive frames.',
  'DROP any incomplete trailing group; return [] when fewer than patch_size frames exist.'],
 'temporal_patchify(frames, patch_size)',
 '''def temporal_patchify(frames, patch_size):
    out=[]
    for t in range(0,len(frames)-patch_size+1,patch_size):
        out.append([v for frame in frames[t:t+patch_size] for v in frame])
    return out''',
 [('Two-frame patches',"assert temporal_patchify([[1,2],[3,4],[5,6],[7,8]],2) == [[1,2,3,4],[5,6,7,8]]"),
  ('Incomplete tail dropped',"assert temporal_patchify([[1],[2],[3]],2) == [[1,2]]"),
  ('Patch size one',"assert temporal_patchify([[1,2],[3,4]],1) == [[1,2],[3,4]]"),
  ('Not enough frames',"assert temporal_patchify([[1]],2) == []"),
  ('Empty',"assert temporal_patchify([],3) == []"),
  ('No mutation',"x=[[1],[2]]; temporal_patchify(x,2); assert x==[[1],[2]]")],
 ['Temporal patching reduces sequence length at the cost of coarser token resolution.',
  'Concatenation must preserve time and feature order within each patch.',
  'This toy operator models temporal grouping, not the spatial 3D convolutions used by production video VAEs.'],
 'Using a stride of one creates overlapping windows rather than the specified nonoverlapping patches.',
 'O(TD) time and output space for T frames of width D.',
 ['Advance t by patch_size.','Ignore the final partial patch by bounding the range.'],VIDEO+WORLD)

# Flow Matching tasks and video dynamics follow in the second section.

add('flow-linear-interpolation','Interpolate Noise and Data for Flow Matching','Easy',14,['Flow Matching','Probability Paths','Interpolation'],
 'Form the conditional straight-line path between a noise vector x0 and a data vector x1 used by a basic rectified-flow-style construction.',
 ['x0 and x1 are same-length finite float lists; t is a finite scalar in [0,1].',
  'Return a vector xt with each coordinate xt[d] = (1-t)*x0[d] + t*x1[d].',
  'At t=0 output x0, at t=1 output x1. Do not mutate the inputs.'],
 'linear_flow_path(x0, x1, t)',
 '''def linear_flow_path(x0, x1, t):
    return [(1-t)*a+t*b for a,b in zip(x0,x1)]''',
 [('Midpoint',"assert linear_flow_path([0,2],[2,4],0.5)==[1.0,3.0]"),
  ('At noise endpoint',"assert linear_flow_path([1,-2],[3,5],0)==[1, -2]"),
  ('At data endpoint',"assert linear_flow_path([1,-2],[3,5],1)==[3,5]"),
  ('Asymmetric time',"assert linear_flow_path([0],[10],0.2)==[2.0]"),
  ('Empty vectors',"assert linear_flow_path([],[],.5)==[]"),
  ('Inputs unchanged',"a=[1.];b=[2.];linear_flow_path(a,b,.2);assert a==[1.] and b==[2.]")],
 ['The displacement interpolation path is a simple valid conditional path for flow matching.',
  'It keeps noise and data at opposite endpoints and changes continuously as t increases.',
  'A production flow-matching model regresses a time-dependent vector field on many sampled pairs, which this helper does not train.'],
 'Reversing x0 and x1 reverses the intended generation direction.',
 'O(D) time and O(D) output for D coordinates.',
 ['Multiply the noise vector by (1-t).','Multiply the data vector by t, then add elementwise.'],FM)

add('flow-conditional-velocity','Derive the Target Velocity of a Linear Flow','Easy',12,['Flow Matching','Vector Fields','Supervision'],
 'For x_t = (1-t)*x0 + t*x1, calculate the conditional displacement velocity used as a supervised target.',
 ['x0 and x1 are equal-length float vectors (possibly empty).',
  'Return the t-independent derivative dx_t/dt = x1 - x0 coordinatewise.',
  'Return a fresh list without modifying either endpoint.'],
 'linear_flow_velocity(x0, x1)',
 '''def linear_flow_velocity(x0, x1):
    return [b-a for a,b in zip(x0,x1)]''',
 [('Positive displacement',"assert linear_flow_velocity([1,2],[5,5])==[4,3]"),
  ('Negative displacement',"assert linear_flow_velocity([3,1],[1,-2])==[-2,-3]"),
  ('Identical endpoints',"assert linear_flow_velocity([7],[7])==[0]"),
  ('Empty',"assert linear_flow_velocity([],[])==[]"),
  ('Multiple dimensions',"assert linear_flow_velocity([0,1,2],[2,1,-2])==[2,0,-4]"),
  ('No mutation',"a=[3];b=[2];linear_flow_velocity(a,b);assert a==[3] and b==[2]")],
 ['Differentiate the straight-line interpolation analytically: the derivative of (1-t)x0+t x1 is x1-x0.',
  'The target is a conditional velocity for each paired sample, not necessarily the marginal velocity at arbitrary x.',
  'Flow matching fits a network to these velocity targets over many sampled times and examples.'],
 'Returning x0-x1 reverses the integration direction from noise to data.',
 'O(D) time and O(D) output.',
 ['Differentiate each weighted endpoint with respect to t.','The derivative does not depend on t for a straight-line path.'],FM)

add('flow-velocity-regression','Compute a Flow-Matching Velocity MSE','Easy',12,['Flow Matching','Training Objective','MSE'],
 'Evaluate one supervised velocity prediction against its conditional flow-matching target.',
 ['prediction, x0 and x1 are equal-length, nonempty lists of finite floats.',
  'Use target velocity x1-x0 and return the mean of (prediction[d] - target[d])**2.',
  'Do not calculate a reconstruction or endpoint-distance loss in place of velocity loss.'],
 'flow_velocity_mse(prediction, x0, x1)',
 '''def flow_velocity_mse(prediction, x0, x1):
    return sum((p-(b-a))**2 for p,a,b in zip(prediction,x0,x1))/len(prediction)''',
 [('Perfect target',approx_call('flow_velocity_mse([2,-1],[1,4],[3,3])','0')),
  ('Incorrect zero velocity',approx_call('flow_velocity_mse([0,0],[0,0],[2,4])','10')),
  ('One coordinate',approx_call('flow_velocity_mse([1],[0],[4])','9')),
  ('Negative target',approx_call('flow_velocity_mse([1],[3],[1])','9')),
  ('Mean not sum',approx_call('flow_velocity_mse([0,0,0],[0,0,0],[1,1,1])','1'))],
 ['The matching target is the derivative of the chosen conditional probability path.',
  'The model output is judged in velocity space at one sampled time.',
  'The reduction is a mean over vector dimensions; batch and time expectations are outside the scope of this exercise.'],
 'Comparing the predicted velocity directly with x1 instead of x1-x0 gives an incorrect objective.',
 'O(D) time and O(1) extra space.',
 ['First compute target = data - noise.','Average squared velocity residuals.'],FM)

add('flow-euler-integration','Integrate a Scalar Flow ODE With Euler Steps','Medium',19,['Flow Matching','ODE Solver','Sampling'],
 'Sample a scalar state from t=0 to t=1 through dx/dt = velocity(x,t) using explicit Euler integration.',
 ['x0 is a finite scalar; steps is a strictly positive integer; velocity is a deterministic callable (x,t) -> float.',
  'Use fixed dt=1/steps. At step i, evaluate v(x, i*dt) and update x <- x + dt*v.',
  'Return the final scalar at t=1. Do not call velocity after the last step.'],
 'euler_flow(x0, velocity, steps)',
 '''def euler_flow(x0, velocity, steps):
    dt=1.0/steps
    x=x0
    for i in range(steps):
        x+=dt*velocity(x,i*dt)
    return x''',
 [('Constant field',approx_call('euler_flow(2,lambda x,t:3,4)','5')),
  ('Linear time field',approx_call('euler_flow(0,lambda x,t:t,4)','0.375')),
  ('Growth field',approx_call('euler_flow(1,lambda x,t:x,2)','2.25')),
  ('Zero field',approx_call('euler_flow(-3,lambda x,t:0,10)','-3')),
  ('One step',approx_call('euler_flow(2,lambda x,t:2*x,1)','6')),
  ('Nonlinear state field',approx_call('euler_flow(1,lambda x,t:-x,2)','0.25'))],
 ['Numerical integration turns a learned vector field into generated samples.',
  'Explicit Euler evaluates velocity at the BEGINNING of each integration interval.',
  'Step count controls discretization error; comparing to Heun reveals the effect of solver choice.'],
 'Evaluating velocity at the updated endpoint implements a different discretization, not explicit Euler.',
 'O(S) velocity calls and O(1) extra space for S steps.',
 ['dt = 1 / steps.','At time i*dt compute velocity before updating x.'],FM)

add('flow-heun-integration','Integrate a Scalar Flow ODE With Heun’s Method','Medium',22,['Flow Matching','ODE Solver','Heun'],
 'Implement a two-evaluation predictor-corrector ODE solver for dx/dt = velocity(x,t) across the unit interval.',
 ['x0 is a finite float; steps is strictly positive; velocity is a pure deterministic callable (x,t).',
  'For step i set k1=v(x,t), x_pred=x+dt*k1, k2=v(x_pred,t+dt).',
  'Update x <- x + dt*(k1+k2)/2. Return the final state; dt=1/steps.'],
 'heun_flow(x0, velocity, steps)',
 '''def heun_flow(x0, velocity, steps):
    dt=1.0/steps
    x=x0
    for i in range(steps):
        t=i*dt
        k1=velocity(x,t)
        k2=velocity(x+dt*k1,t+dt)
        x+=dt*(k1+k2)/2
    return x''',
 [('Constant field',approx_call('heun_flow(1,lambda x,t:4,5)','5')),
  ('Time-linear field',approx_call('heun_flow(0,lambda x,t:t,4)','0.5')),
  ('State growth',approx_call('heun_flow(1,lambda x,t:x,2)','2.640625')),
  ('One step t field',approx_call('heun_flow(0,lambda x,t:t,1)','0.5')),
  ('Zero field',approx_call('heun_flow(-2,lambda x,t:0,3)','-2')),
  ('Negative constant',approx_call('heun_flow(5,lambda x,t:-2,2)','3'))],
 ['Heun (explicit trapezoidal method) averages a slope at the start and a predicted slope at the end of each interval.',
  'For a velocity that depends linearly on time only, it integrates the interval exactly.',
  'It requires two field evaluations per step and may have lower local error than Euler under smooth dynamics.'],
 'Using k2 computed at (x,t) instead of the predicted end state/time reduces the solver to Euler.',
 'O(S) time with 2S field evaluations, O(1) extra space.',
 ['Predict x + dt*k1 before evaluating k2.','Use t+dt for the second slope.'],FM)

add('flow-cfg-velocity','Mix Conditional and Unconditional Flow Velocities','Easy',15,['Flow Matching','Guidance','Conditioning'],
 'Implement the arithmetic used in a simple classifier-free-guidance-style combination of two velocity predictions.',
 ['unconditional and conditional are same-length float lists (possibly empty); guidance_scale is a finite float.',
  'Return u + guidance_scale*(c-u) coordinatewise.',
  'scale=0 must give unconditional; scale=1 must give conditional. This helper has no neural inference.'],
 'guided_velocity(unconditional, conditional, guidance_scale)',
 '''def guided_velocity(unconditional, conditional, guidance_scale):
    return [u + guidance_scale*(c-u) for u,c in zip(unconditional,conditional)]''',
 [('Scale zero',"assert guided_velocity([1,2],[4,8],0)==[1,2]"),
  ('Scale one',"assert guided_velocity([1,2],[4,8],1)==[4,8]"),
  ('Scale two',"assert guided_velocity([1,2],[4,8],2)==[7,14]"),
  ('Fractional scale',"assert guided_velocity([0],[10],.25)==[2.5]"),
  ('Negative values',"assert guided_velocity([-1],[1],1.5)==[2.0]"),
  ('Empty',"assert guided_velocity([],[],3)==[]")],
 ['A guidance rule interpolates or extrapolates between unconditional and conditional predictions.',
  'A strength greater than one extrapolates beyond the conditional velocity.',
  'This deterministic interpolation does not include text encoders, conditioning dropout or learned flow models.'],
 'Multiplying only the conditional prediction by scale does not preserve the required scale=0 or 1 behavior.',
 'O(D) time and output space.',
 ['Start with unconditional velocity.','Add scale times the difference between conditional and unconditional.'],FM)

add('video-action-conditioned-rollout','Roll Out Action-Conditioned Latent Dynamics','Medium',20,['Video World Models','Actions','Rollouts'],
 'Given an initial latent state and action sequence, apply a deterministic learned-dynamics surrogate and keep every predicted latent state.',
 ['initial_state is a finite float; actions is a list of scalar actions; transition(state, action) returns the next float state.',
  'Return a list of length len(actions)+1, INCLUDING initial_state at index zero.',
  'Each predicted next state must use the previous predicted state, not reset to initial_state. Do not change the action list.'],
 'action_latent_rollout(initial_state, actions, transition)',
 '''def action_latent_rollout(initial_state, actions, transition):
    states=[initial_state]
    for action in actions:
        states.append(transition(states[-1],action))
    return states''',
 [('Accumulated motion',"assert action_latent_rollout(0,[1,2,3],lambda s,a:s+a)==[0,1,3,6]"),
  ('State-dependent dynamics',"assert action_latent_rollout(1,[0,0],lambda s,a:2*s+a)==[1,2,4]"),
  ('No actions',"assert action_latent_rollout(7,[],lambda s,a:s)==[7]"),
  ('Negative actions',"assert action_latent_rollout(3,[-1,-2],lambda s,a:s+a)==[3,2,0]"),
  ('Action multiplicative',"assert action_latent_rollout(2,[3,2],lambda s,a:s*a)==[2,6,12]"),
  ('No mutation',"a=[1,2];action_latent_rollout(0,a,lambda s,x:s+x);assert a==[1,2]")],
 ['Action-conditioned world models predict future latent states as a function of actions and current state.',
  'Rolling forward on predicted states exposes compounding model error over long horizons.',
  'The scalar transition function stands in for a learned latent-dynamics module; it does not generate video frames.'],
 'Applying every action to initial_state produces independent one-step predictions rather than a multi-step rollout.',
 'O(T) transition evaluations, O(T) output space.',
 ['Initialize output with the starting state.','Feed the last predicted state into the next transition.'],WORLD)

add('video-temporal-difference-loss','Measure Temporal-Difference Reconstruction Loss','Medium',16,['Video','Temporal Consistency','Video Loss'],
 'Compare temporal CHANGES in predicted frame features with corresponding changes in a target clip, rather than comparing static pixel values.',
 ['predicted and target are equal-shape sequences of T frame vectors of width D>0, with finite coordinates.',
  'For each t>=1 and coordinate d, compare (pred[t][d]-pred[t-1][d]) against (target[t][d]-target[t-1][d]).',
  'Return the mean squared difference over (T-1)*D elements. For T<2 return 0.0.'],
 'temporal_difference_mse(predicted, target)',
 '''def temporal_difference_mse(predicted, target):
    if len(predicted)<2:
        return 0.0
    error=sum(((new[d]-old[d])-(gnew[d]-gold[d]))**2
              for old,new,gold,gnew in zip(predicted,predicted[1:],target,target[1:])
              for d in range(len(new)))
    return error/((len(predicted)-1)*len(predicted[0]))''',
 [('Matching motion',approx_call('temporal_difference_mse([[0],[2]],[[10],[12]])','0')),
  ('Different motion',approx_call('temporal_difference_mse([[0],[4]],[[0],[2]])','4')),
  ('Two dimensions',approx_call('temporal_difference_mse([[0,0],[1,2]],[[0,0],[2,4]])','2.5')),
  ('Three frames',approx_call('temporal_difference_mse([[0],[2],[5]],[[0],[1],[2]])','2.5')),
  ('One frame',approx_call('temporal_difference_mse([[1]],[[9]])','0')),
  ('Empty',approx_call('temporal_difference_mse([],[])','0'))],
 ['Framewise reconstruction quality does not fully characterize whether motion evolves correctly.',
  'Temporal differences are invariant to a fixed offset applied to all frames of a sequence.',
  'This is a simple finite-difference objective, not a perceptual motion metric or an optical-flow estimator.'],
 'Comparing raw predicted and target frames instead of differences confuses appearance mismatch with temporal mismatch.',
 'O(TD) time and O(1) extra space.',
 ['Subtract consecutive frames in each sequence first.','Then compare the two temporal deltas with MSE.'],VIDEO)

add('video-causal-token-context','Build Causal Context Windows for Video Tokens','Easy',15,['VideoGPT','Autoregressive','Context'],
 'For each discrete video token position, construct its bounded past context while preventing future-token leakage.',
 ['tokens is a list of integer IDs (may be empty) and context_size is a nonnegative integer.',
  'For position i return tokens[max(0,i-context_size):i], which excludes tokens[i] itself.',
  'Return a list of contexts for EVERY position including position zero; do not pad or reorder.'],
 'causal_token_contexts(tokens, context_size)',
 '''def causal_token_contexts(tokens, context_size):
    return [tokens[max(0,i-context_size):i] for i in range(len(tokens))]''',
 [('Window two',"assert causal_token_contexts([1,2,3,4],2)==[[],[1],[1,2],[2,3]]"),
  ('Zero window',"assert causal_token_contexts([1,2],0)==[[],[]]"),
  ('Huge window',"assert causal_token_contexts([4,5,6],10)==[[],[4],[4,5]]"),
  ('One token',"assert causal_token_contexts([7],3)==[[]]"),
  ('Empty',"assert causal_token_contexts([],2)==[]"),
  ('Input preserved',"t=[1,2,3];causal_token_contexts(t,2);assert t==[1,2,3]")],
 ['An autoregressive video-token prior must never condition a token on its own value or future tokens.',
  'Fixed context windows make the conditioning scope explicit.',
  'This task constructs data contexts, not causal transformer attention weights.'],
 'Using tokens[:i+1] leaks the current target token into its own context.',
 'O(T*K) output time/space for T tokens and window size K.',
 ['For prediction at i, slice only indices strictly less than i.','Limit the left boundary by max(0,i-context_size).'],VIDEO)

add('video-token-cross-entropy','Compute Video Token Prior Negative Log Likelihood','Medium',19,['VideoGPT','Token Likelihood','Autoregressive'],
 'Evaluate a discrete next-token video prior using ground-truth code indices and predicted probability distributions.',
 ['probabilities is a list of nonempty probability vectors; targets has one valid integer index per vector.',
  'Return the MEAN -log(probabilities[t][targets[t]]) over time steps.',
  'For an empty sequence return 0.0. If a target has exactly zero predicted probability, raise ValueError. Inputs are not modified.'],
 'video_token_nll(probabilities, targets)',
 '''import math

def video_token_nll(probabilities, targets):
    if not targets:
        return 0.0
    loss=0.0
    for distribution,target in zip(probabilities,targets):
        prob=distribution[target]
        if prob<=0.0:
            raise ValueError('zero probability for target token')
        loss-=math.log(prob)
    return loss/len(targets)''',
 [('Certain predictions',approx_call('video_token_nll([[1,0],[0,1]],[0,1])','0')),
  ('Uniform binary',approx_call('video_token_nll([[.5,.5],[.5,.5]],[0,1])','math.log(2)')),
  ('Mixed confidence',approx_call('video_token_nll([[.25,.75],[.5,.5]],[1,0])','(-math.log(.75)-math.log(.5))/2')),
  ('One token',approx_call('video_token_nll([[.1,.9]],[0])','-math.log(.1)')),
  ('Empty',approx_call('video_token_nll([],[])','0')),
  ('Zero target probability',"try:\n    video_token_nll([[1,0]],[1]); assert False\nexcept ValueError:\n    pass")],
 ['A discrete autoregressive video prior is trained to assign high probability to the next observed code.',
  'The negative log-likelihood penalizes low predicted probability for the ground-truth target.',
  'Evaluation here assumes probabilities are already normalized and ground-truth codes are provided.'],
 'Taking log of the maximum probability instead of the ground-truth index measures confidence, not likelihood.',
 'O(T) time and O(1) extra space for T tokens.',
 ['Read distribution[target] at each time step.','Average negative natural logarithms; handle zero explicitly.'],VIDEO)

if len(items)!=20:
    raise AssertionError(f'expected 20 original tasks, got {len(items)}')
# Produce JS data module; JSON is a valid Javascript literal, no runtime imports required.
(ROOT/'src'/'video-problems.mjs').write_text('// v0.8 original CPU-only component problems; not complete model-training tasks.\nexport const videoProblems = '+json.dumps(items,indent=2,ensure_ascii=False)+';\n',encoding='utf8')
print('Generated',len(items),'video-world-model exercises with',sum(len(p['tests']) for p in items),'deterministic assertions.')
