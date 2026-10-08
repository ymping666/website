#!/usr/bin/env python3
"""Author independent, deterministic, dependency-light AI foundation exercises."""
import json
from pathlib import Path
P=[]
REF={
 'transformer':('Attention Is All You Need','https://arxiv.org/abs/1706.03762'),
 'vit':('An Image is Worth 16x16 Words','https://arxiv.org/abs/2010.11929'),
 'gan':('Generative Adversarial Nets','https://arxiv.org/abs/1406.2661'),
 'wgan':('Improved Training of Wasserstein GANs','https://arxiv.org/abs/1704.00028'),
 'ddpm':('Denoising Diffusion Probabilistic Models','https://arxiv.org/abs/2006.11239'),
 'ddim':('Denoising Diffusion Implicit Models','https://arxiv.org/abs/2010.02502'),
 'cg':('Diffusion Models Beat GANs on Image Synthesis','https://arxiv.org/abs/2105.05233'),
 'cfg':('Classifier-Free Diffusion Guidance','https://arxiv.org/abs/2207.12598'),
 'dit':('Scalable Diffusion Models with Transformers','https://arxiv.org/abs/2212.09748')
}
def add(key,track,title,sig,desc,req,sol,tests,exp,complexity,pitfall,ref,tags,diff='Easy',hint=None):
    assert len(req)>=3 and len(tests)>=4 and len(exp)>=2
    func=sig.split('(')[0]
    P.append(dict(id=key,number=51+len(P),track=track,difficulty=diff,title=title,duration=('20 min' if diff=='Medium' else '12 min'),tags=tags,description=desc,requirements=req,signature=sig,starter=f'def {sig}:\n    """Implement the specified AI building block."""\n    # TODO: replace pass with your implementation\n    pass',solution=sol.strip(),explanation=exp,complexity=complexity,pitfall=pitfall,hints=hint or ['Start from the exact mathematical definition in the problem statement.','Check dimensions, normalization and the supplied corner-case tests before submitting.'],references=[dict(title=REF[ref][0],url=REF[ref][1])],tests=[dict(name=n,code=c) for n,c in tests]))

add('foundation-matmul','AI Foundations','Multiply Two Matrices from Scratch','matmul(a, b)',
'Implement basic rectangular matrix multiplication without NumPy. This operation underlies attention projections and patch embeddings.',
['a is m×k and b is k×n; both matrices are nonempty, rectangular, and contain numbers.','Return an m×n list of lists where output[i][j] = sum(a[i][t]*b[t][j] for t in range(k)).','Do not mutate either input; preserve natural row and column order.'],
'''def matmul(a, b):
    m, k, n = len(a), len(b), len(b[0])
    return [[sum(a[i][t] * b[t][j] for t in range(k)) for j in range(n)] for i in range(m)]''',
[('Two by two',"assert matmul([[1,2],[3,4]], [[5,6],[7,8]]) == [[19,22],[43,50]]"),('Non-square',"assert matmul([[1,2,3]], [[1],[2],[3]]) == [[14]]"),('Negative and zero',"assert matmul([[0,-1]], [[2,3],[-4,5]]) == [[4,-5]]"),('Identity',"assert matmul([[2,3],[5,7]], [[1,0],[0,1]]) == [[2,3],[5,7]]"),('Inputs unchanged',"a=[[1,2]];b=[[3],[4]];matmul(a,b);assert a==[[1,2]] and b==[[3],[4]]")],
['The shared inner dimension k determines the reduction axis.','The output has one row for each row of a and one column for each column of b.'], 'O(mkn) time and O(mn) returned matrix space.','Do not multiply elements elementwise; matrix multiplication sums across the shared dimension.','transformer',['Linear Algebra','Matrix Multiplication'])

add('foundation-layer-normalization','AI Foundations','Implement Layer Normalization','layer_norm(x, eps)',
'Normalize a single feature vector using its population mean and variance (no learnable affine parameters).',
['x is a nonempty list of finite floats, and eps is a positive scalar.','Use mean=sum(x)/len(x) and variance=sum((v-mean)**2)/len(x), not the sample variance.','Return [(v-mean)/sqrt(variance+eps) for v in x] without modifying x.'],
'''import math

def layer_norm(x, eps):
    mean = sum(x) / len(x)
    var = sum((v-mean)**2 for v in x) / len(x)
    denom = math.sqrt(var + eps)
    return [(v-mean)/denom for v in x]''',
[('Symmetric vector',"assert all(abs(a-b)<1e-9 for a,b in zip(layer_norm([1.,3.],1e-12),[-1.,1.]))"),('Constant input',"assert layer_norm([5.,5.,5.],1e-5)==[0.0,0.0,0.0]"),('Single value',"assert layer_norm([42.],1e-5)==[0.0]"),('Translation invariant',"a=layer_norm([1.,3.,5.],1e-5);b=layer_norm([101.,103.,105.],1e-5);assert all(abs(x-y)<1e-9 for x,y in zip(a,b))"),('Population variance scaling',"import math; r=layer_norm([1.,2.,3.],1e-12);assert abs(r[0]+math.sqrt(1.5))<1e-8 and abs(sum(r))<1e-9")],
['LayerNorm normalizes across feature positions in one token, not across a batch.','A positive epsilon prevents division by zero for constant vectors.'], 'O(d) time and O(d) output space.','Do not divide by d-1 or omit epsilon; both break small and constant inputs.','transformer',['LayerNorm','Numerical Stability'])

add('foundation-gelu','AI Foundations','Implement Exact GELU Activation','gelu(x)',
'Implement the exact Gaussian Error Linear Unit on a scalar using erf, rather than the optional tanh approximation.',
['x is any finite real scalar.','Return x * 0.5 * (1 + erf(x/sqrt(2))).','Use math.erf and math.sqrt; this problem intentionally tests exact, not tanh-approximated GELU.'],
'''import math

def gelu(x):
    return 0.5 * x * (1 + math.erf(x / math.sqrt(2.0)))''',
[('Origin',"assert abs(gelu(0.))<1e-12"),('Positive one',"assert abs(gelu(1.) - 0.8413447460685429)<1e-12"),('Negative one',"assert abs(gelu(-1.) - (-0.15865525393145707))<1e-12"),('Odd relation',"assert abs((gelu(2)-gelu(-2))-2)<1e-12"),('Large negative',"assert abs(gelu(-6.))<1e-7")],
['GELU is x times the standard normal cumulative distribution function Φ(x).','The tanh approximation is common, but intentionally a different computational contract.'], 'O(1) time and space.','ReLU is not GELU: GELU can return small negative values for negative inputs.','vit',['Activation','GELU'])

add('foundation-sinusoidal-positions','AI Foundations','Compute Sinusoidal Position Encodings','position_encoding(position, d_model)',
'Implement the absolute sinusoidal encoding from the original Transformer for a single nonnegative token position.',
['d_model is a positive even integer and position is a nonnegative integer.','For i=0...d_model/2-1, use angle=position / (10000 ** (2*i/d_model)).','Return [sin(angle0),cos(angle0),sin(angle1),cos(angle1),...] as floats.'],
'''import math

def position_encoding(position, d_model):
    out=[]
    for i in range(d_model//2):
        angle=position / (10000**(2*i/d_model))
        out.extend([math.sin(angle),math.cos(angle)])
    return out''',
[('Zero position',"assert position_encoding(0,4)==[0.0,1.0,0.0,1.0]"),('Two channels',"import math; p=position_encoding(1,2); assert abs(p[0]-math.sin(1))<1e-12 and abs(p[1]-math.cos(1))<1e-12"),('Different frequencies',"import math; p=position_encoding(1,4); assert abs(p[2]-math.sin(0.01))<1e-12"),('Dimension',"assert len(position_encoding(13,8))==8"),('Position matters',"assert position_encoding(2,6)!=position_encoding(3,6)")],
['Even and odd channels form sine/cosine pairs with geometric wavelength scaling.','Different channel frequencies make relative positions distinguishable without learned tables.'],'O(d_model) time and output space.','Do not use i/d_model in the exponent in place of 2*i/d_model.','transformer',['Position Encoding','Transformer'])

add('attention-scaled-dot-product','Transformer & Vision','Implement Scaled Dot-Product Attention','scaled_attention(q, keys, values)',
'For one query vector and multiple key/value vectors, compute softmax(QKᵀ/√dₖ)V with a numerically stable softmax.',
['q and each key are vectors of dₖ>0 elements; values are equally sized vectors of any common positive dimension.','Compute scores = dot(q,key)/sqrt(dₖ); subtract max(scores) before exponentiation.','Return the weighted sum of value vectors. At least one key/value pair is provided.'],
'''import math

def scaled_attention(q, keys, values):
    scale=math.sqrt(len(q))
    logits=[sum(a*b for a,b in zip(q,k))/scale for k in keys]
    top=max(logits)
    weights=[math.exp(s-top) for s in logits]
    total=sum(weights)
    return [sum(weights[i]*v[j] for i,v in enumerate(values))/total for j in range(len(values[0]))]''',
[('Equal scores average',"r=scaled_attention([0,0],[[1,0],[0,1]],[[2,4],[6,8]]); assert all(abs(a-b)<1e-9 for a,b in zip(r,[4,6]))"),('Single key',"assert scaled_attention([99],[[7]],[[3,5]])==[3.0,5.0]"),('High scores stable',"r=scaled_attention([1000],[[1000],[999]],[[10],[0]]);assert 9<r[0]<=10"),('Values different dimension',"r=scaled_attention([0],[[1],[2]],[[1,2,3],[3,4,5]]);assert r==[2.,3.,4.]"),('Correct scaling',"import math; r=scaled_attention([1,1],[[1,1],[0,0]],[[1],[0]])[0]; e=math.exp(math.sqrt(2));assert abs(r-e/(e+1))<1e-9")],
['Attention is a soft weighted average of values; query/key similarity determines the weights.','The square-root scaling uses the key dimension, not the value dimension.','Subtracting the largest logit avoids overflow when scores are large.'], 'O(n·dₖ + n·dᵥ) time and O(n+dᵥ) additional space.','Omitting √dₖ changes probability sharpness; omitting stable softmax causes overflow.','transformer',['Attention','Softmax'],'Medium')

add('attention-causal-mask','Transformer & Vision','Build a Causal Attention Mask','causal_mask(logits)',
'Convert a square matrix of attention logits into autoregressive logits that cannot attend to future token positions.',
['logits is an n×n numeric list of lists; n may be zero.','For each row i and column j>i, replace the value with float("-inf").','Preserve j<=i logits exactly; return a new matrix without changing logits.'],
'''def causal_mask(logits):
    return [[v if j<=i else float('-inf') for j,v in enumerate(row)] for i,row in enumerate(logits)]''',
[('Three tokens',"a=causal_mask([[1,2,3],[4,5,6],[7,8,9]]);assert a[0][0]==1 and a[0][1]==float('-inf') and a[1][1]==5 and a[1][2]==float('-inf') and a[2]==[7,8,9]"),('Single token',"assert causal_mask([[3]])==[[3]]"),('Empty',"assert causal_mask([])==[]"),('Input immutable',"m=[[1,2],[3,4]];causal_mask(m);assert m==[[1,2],[3,4]]"),('Diagonal not masked',"assert [causal_mask([[9,8],[7,6]])[i][i] for i in range(2)]==[9,6]")],
['Causal self-attention allows token i to read only positions 0...i.','-∞ logits become zero probability after softmax, provided each row has at least one valid position.'],'O(n²) time and output space.','Mask j>i, not j>=i; each token must be allowed to attend to itself.','transformer',['Attention Mask','Autoregressive'])

add('attention-split-heads','Transformer & Vision','Split Token Embeddings into Attention Heads','split_heads(tokens, n_heads)',
'Split a sequence of token embeddings along their feature axis into the layout [head][token][feature].',
['tokens has shape [seq_len][d_model] with d_model divisible by positive n_heads; sequence may be empty.','For each token, split features into contiguous chunks of size d_model/n_heads.','Return a new nested list shaped [n_heads][seq_len][d_head]. For empty sequence, return n_heads empty lists.'],
'''def split_heads(tokens, n_heads):
    if not tokens:
        return [[] for _ in range(n_heads)]
    d=len(tokens[0])//n_heads
    return [[row[h*d:(h+1)*d] for row in tokens] for h in range(n_heads)]''',
[('Two heads',"assert split_heads([[1,2,3,4],[5,6,7,8]],2)==[[[1,2],[5,6]],[[3,4],[7,8]]]"),('One head',"assert split_heads([[1,2]],1)==[[[1,2]]]"),('Empty',"assert split_heads([],3)==[[],[],[]]"),('Feature length one',"assert split_heads([[1,2,3]],3)==[[[1]],[[2]],[[3]]]"),('Input unchanged',"x=[[1,2,3,4]];split_heads(x,2);assert x==[[1,2,3,4]]")],
['Multi-head attention partitions the embedding channels into independent heads.','This operation only reshapes representation; the learned Q/K/V projections happen elsewhere.'], 'O(sequence_length × d_model) time and output space.','Do not interleave features across heads or swap the token order.','transformer',['Multi-Head Attention','Tensor Shape'])

add('attention-merge-heads','Transformer & Vision','Merge Attention Heads Back into Token Embeddings','merge_heads(heads)',
'Invert a split into [head][token][feature], concatenating each token’s head vectors in head order.',
['heads has shape [n_heads][seq_len][d_head], with n_heads>=1 and equal token counts.','Return [seq_len][n_heads*d_head]; heads are concatenated, not averaged.','Return [] if each head has zero tokens.'],
'''def merge_heads(heads):
    n=len(heads[0])
    return [[v for head in heads for v in head[t]] for t in range(n)]''',
[('Two heads',"assert merge_heads([[[1,2],[5,6]],[[3,4],[7,8]]])==[[1,2,3,4],[5,6,7,8]]"),('One head',"assert merge_heads([[[3,4]]])==[[3,4]]"),('Empty tokens',"assert merge_heads([[],[]])==[]"),('Three heads',"assert merge_heads([[[1]],[[2]],[[3]]])==[[1,2,3]]"),('Input unchanged',"a=[[[1]],[[2]]];merge_heads(a);assert a==[[[1]],[[2]]]")],
['Attention heads normally operate in parallel and their outputs are concatenated before the output projection.','Concatenation is an inverse data-layout operation of splitting.'],'O(sequence_length × d_model) time and output space.','Averaging heads loses independent feature channels; concatenation preserves them.','transformer',['Multi-Head Attention','Tensor Shape'])

add('transformer-cross-attention','Transformer & Vision','Implement Multi-Query Cross-Attention','cross_attention(queries, keys, values)',
'Implement cross-attention where query tokens come from one sequence and key/value tokens from another (all projections already supplied).',
['queries is [n_q][d_k], keys is [n_k][d_k] and values is [n_k][d_v], with n_q,n_k,d_k,d_v>0.','For each query, softmax its dot-product key scores scaled by sqrt(d_k), subtracting the score maximum before exp.','Return [n_q][d_v] of value-weighted outputs, without modifying inputs.'],
'''import math

def cross_attention(queries, keys, values):
    d=len(keys[0]); outputs=[]
    for q in queries:
        scores=[sum(x*y for x,y in zip(q,k))/math.sqrt(d) for k in keys]
        shift=max(scores); weights=[math.exp(s-shift) for s in scores]
        z=sum(weights)
        outputs.append([sum(weights[i]*v[j] for i,v in enumerate(values))/z for j in range(len(values[0]))])
    return outputs''',
[('Uniform query',"assert cross_attention([[0]],[[1],[2]],[[1,3],[5,7]])==[[3.,5.]]"),('Two distinct queries',"r=cross_attention([[1],[-1]],[[1],[-1]],[[10],[0]]);assert r[0][0]>5 and r[1][0]<5"),('Single source token',"assert cross_attention([[1],[2]],[[9]],[[3,4]])==[[3.,4.],[3.,4.]]"),('Many queries',"assert len(cross_attention([[0],[1],[2]],[[1]],[[5]]))==3"),('Numerical stability',"r=cross_attention([[1000]],[[1000],[999]],[[1],[0]]);assert 0.7<r[0][0]<=1")],
['Cross-attention differs from self-attention by allowing the queries and keys/values to originate from different sequences.','The output has one row per query even if the number of keys differs.'], 'O(n_q n_k (d_k+d_v)) time and O(n_q d_v+n_k) auxiliary space.','Do not assume the query count equals the key count.','transformer',['Cross-Attention','Encoder-Decoder'],'Medium')

add('vit-patchify','Transformer & Vision','Patchify a Grayscale Image for ViT','patchify(image, patch_size)',
'Split a 2D grayscale image into non-overlapping, flattened patches using row-major patch-grid order.',
['image is H×W (rectangular) with positive H,W divisible by positive patch_size.','Visit patches left-to-right across each patch-grid row, then top-to-bottom.','Flatten pixels within a patch row-by-row and return a list of patches; do not modify image.'],
'''def patchify(image, patch_size):
    h,w=len(image),len(image[0]);p=patch_size
    return [[image[r+dr][c+dc] for dr in range(p) for dc in range(p)] for r in range(0,h,p) for c in range(0,w,p)]''',
[('Four patches',"assert patchify([[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]],2)==[[1,2,5,6],[3,4,7,8],[9,10,13,14],[11,12,15,16]]"),('Non-square image',"assert patchify([[1,2,3,4],[5,6,7,8]],2)==[[1,2,5,6],[3,4,7,8]]"),('Pixel patches',"assert patchify([[1,2],[3,4]],1)==[[1],[2],[3],[4]]"),('One patch',"assert patchify([[1,2],[3,4]],2)==[[1,2,3,4]]"),('Input unchanged',"im=[[1,2],[3,4]];patchify(im,1);assert im==[[1,2],[3,4]]")],
['ViT turns an image into a sequence of local patches, then projects each patch to a token embedding.','This task covers extraction and flattening only: it deliberately does not silently add a learned patch projection.'],'O(HW) time and output space.','Do not flatten whole-image rows before grouping each spatial patch.','vit',['ViT','Patch Embedding'],'Easy')

add('vit-class-token','Transformer & Vision','Prepend a ViT Class Token and Add Position Embeddings','prepare_vit_tokens(patches, cls_token, positions)',
'Construct the ViT encoder input by prepending a class embedding and adding position embeddings to every token.',
['patches contains n projected patch vectors of dimension d; cls_token has dimension d.','positions contains n+1 positional vectors of dimension d, including one for the class token.','Return [n+1][d] where row0=cls_token+positions[0] and row i+1=patches[i]+positions[i+1].'],
'''def prepare_vit_tokens(patches, cls_token, positions):
    tokens=[cls_token]+patches
    return [[x+p for x,p in zip(t,pos)] for t,pos in zip(tokens,positions)]''',
[('One patch',"assert prepare_vit_tokens([[3,4]],[1,2],[[10,20],[30,40]])==[[11,22],[33,44]]"),('No patches',"assert prepare_vit_tokens([],[1,2],[[3,4]])==[[4,6]]"),('Two patches',"assert prepare_vit_tokens([[1],[2]],[0],[[1],[10],[20]])==[[1],[11],[22]]"),('All zero positions',"assert prepare_vit_tokens([[3,4]],[1,2],[[0,0],[0,0]])==[[1,2],[3,4]]"),('Does not mutate',"p=[[1]];c=[2];pos=[[3],[4]];prepare_vit_tokens(p,c,pos);assert p==[[1]] and c==[2] and pos==[[3],[4]]")],
['The class token occupies sequence index 0 and receives its own positional embedding.','The patch projection output is already supplied, so this isolates sequence assembly.'],'O((n+1)d) time and output space.','Do not forget to add positional embeddings to the class token itself.','vit',['ViT','Class Token'],'Easy')

add('transformer-prenorm-residual','Transformer & Vision','Implement a Pre-LayerNorm Residual Sub-Layer','pre_norm_residual(x, normalize, sublayer)',
'Apply the pre-normalization residual rule used by modern Transformers: y = x + sublayer(normalize(x)).',
['x is a numeric vector; normalize and sublayer are deterministic callables returning same-length vectors.','Call normalize on x, then call sublayer exactly once on the normalized result.','Return x + sublayer(normalize(x)) elementwise without mutating the input.'],
'''def pre_norm_residual(x, normalize, sublayer):
    z=normalize(x)
    out=sublayer(z)
    return [a+b for a,b in zip(x,out)]''',
[('Identity functions',"assert pre_norm_residual([1,2],lambda z:z,lambda z:z)==[2,4]"),('Normalize first',"assert pre_norm_residual([1,3],lambda z:[v-2 for v in z],lambda z:[2*v for v in z])==[-1,5]"),('Empty vectors',"assert pre_norm_residual([],lambda z:z,lambda z:z)==[]"),('No mutation',"x=[2,4];pre_norm_residual(x,lambda z:[0,0],lambda z:z);assert x==[2,4]"),('Call ordering',"calls=[];norm=lambda z:(calls.append('norm') or z);f=lambda z:(calls.append('block') or z);pre_norm_residual([1],norm,f);assert calls==['norm','block']")],
['Pre-norm means normalization happens before the attention/MLP sub-layer.','The residual bypass adds the original unnormalized x to the sub-layer output.'],'O(d) arithmetic work excluding callable cost, O(d) output.','Post-norm computes normalize(x + sublayer(x)) and is not equivalent.','vit',['Residual Connection','Pre-LayerNorm'],'Medium')

add('gan-discriminator-bce','Generative Models','Compute GAN Discriminator Logistic Loss','discriminator_loss(real_logits, fake_logits)',
'Implement the standard logistic discriminator BCE objective directly from logits using numerically stable softplus.',
['real_logits and fake_logits are nonempty equally sized lists of finite real-valued logits.','Per paired real/fake sample compute softplus(-real_logit) + softplus(fake_logit).','Return the mean of that SUM across pairs (do not divide by two again).'],
'''import math

def discriminator_loss(real_logits, fake_logits):
    sp=lambda x: max(0.0,x)+math.log1p(math.exp(-abs(x)))
    return sum(sp(-r)+sp(f) for r,f in zip(real_logits,fake_logits))/len(real_logits)''',
[('Zero logits',"import math; assert abs(discriminator_loss([0],[0])-2*math.log(2))<1e-12"),('Perfect classifier',"assert discriminator_loss([10],[-10])<0.001"),('Wrong classifier',"assert discriminator_loss([-10],[10])>19"),('Averaging pairs',"import math; x=discriminator_loss([0,0],[0,0]); assert abs(x-2*math.log(2))<1e-12"),('Large stable',"assert 1999.9<discriminator_loss([-1000],[1000])<2000.1")],
['BCEWithLogits can be computed without ever applying sigmoid explicitly.','D minimizes negative log probability of real being real and fake being fake.'], 'O(n) time, O(1) extra space.','Do not average over both terms again unless your objective explicitly defines that convention.','gan',['GAN','Discriminator'],'Easy')

add('gan-generator-nonsaturating','Generative Models','Compute Non-Saturating GAN Generator Loss','generator_loss(fake_logits)',
'Implement the common non-saturating generator objective: make generated samples receive high discriminator real logits.',
['fake_logits is a nonempty list of finite numbers.','For each generated sample use softplus(-fake_logit), equivalent to -log(sigmoid(fake_logit)).','Return the mean across generated samples and use a numerically stable implementation.'],
'''import math

def generator_loss(fake_logits):
    return sum(max(0.0,-x)+math.log1p(math.exp(-abs(x))) for x in fake_logits)/len(fake_logits)''',
[('Zero logit',"import math; assert abs(generator_loss([0])-math.log(2))<1e-12"),('Strong fake realism',"assert generator_loss([10])<0.001"),('Bad fake realism',"assert 999<generator_loss([-1000])<1001"),('Batch mean',"import math; assert abs(generator_loss([0,0])-math.log(2))<1e-12"),('Monotonic',"assert generator_loss([-2])>generator_loss([2])")],
['The generator tries to increase D(fake) instead of directly minimizing log(1-D(fake)).','The non-saturating loss produces more useful gradients when the discriminator is confident early on.'], 'O(n) time and O(1) extra space.','Do not reuse the discriminator fake loss softplus(fake_logit); its sign points in the wrong direction.','gan',['GAN','Generator'],'Easy')

add('gan-gradient-penalty','Generative Models','Implement the WGAN-GP Gradient Penalty','gradient_penalty(gradients, penalty_weight)',
'Compute the WGAN-GP norm penalty for supplied critic gradients on interpolated data samples (no autodiff required).',
['gradients is a nonempty list of equally sized nonempty gradient vectors; penalty_weight is nonnegative.','For each gradient g compute (sqrt(sum(g_i*g_i)) - 1)**2.','Return penalty_weight times the mean squared norm deviation. This excludes the Wasserstein critic loss itself.'],
'''import math

def gradient_penalty(gradients, penalty_weight):
    return penalty_weight * sum((math.sqrt(sum(x*x for x in g))-1)**2 for g in gradients)/len(gradients)''',
[('Unit norm',"assert gradient_penalty([[3/5,4/5]],10)==0.0"),('Zero norm',"assert gradient_penalty([[0,0]],10)==10.0"),('Norm two',"assert gradient_penalty([[2,0]],5)==5.0"),('Batch mean',"assert gradient_penalty([[0,0],[1,0]],2)==1.0"),('Zero weight',"assert gradient_penalty([[2]],0)==0.0")],
['The interpolated sample gradient is computed upstream; here we implement only the scalar norm penalty.','WGAN-GP encourages the critic gradient norm near one, not zero.'], 'O(batch_size × feature_dim) time and O(1) additional space.','Squared L2 norm is not the same as (L2 norm minus one) squared.','wgan',['GAN','Regularization'],'Medium')

add('diffusion-linear-beta','Generative Models','Build a Linear DDPM Beta Schedule','linear_beta_schedule(steps, beta_start, beta_end)',
'Create the per-step forward-noise variance schedule βₜ in a simple DDPM configuration.',
['steps is a positive integer; 0<beta_start<=beta_end<1.','For steps>1, beta[t]=beta_start+(beta_end-beta_start)*t/(steps-1) for t=0..steps-1.','For steps==1 return [beta_start]; do not return cumulative products in this task.'],
'''def linear_beta_schedule(steps, beta_start, beta_end):
    if steps==1:
        return [beta_start]
    return [beta_start+(beta_end-beta_start)*t/(steps-1) for t in range(steps)]''',
[('Five steps',"x=linear_beta_schedule(5,0.1,0.5);assert all(abs(a-b)<1e-12 for a,b in zip(x,[0.1,0.2,0.3,0.4,0.5]))"),('One step',"assert linear_beta_schedule(1,0.01,0.1)==[0.01]"),('Constant beta',"assert linear_beta_schedule(4,0.05,0.05)==[0.05]*4"),('Endpoints',"a=linear_beta_schedule(7,0.001,0.02);assert a[0]==0.001 and abs(a[-1]-0.02)<1e-12"),('Increasing',"a=linear_beta_schedule(10,0.0001,0.02);assert all(b>a for a,b in zip(a,a[1:]))")],
['Beta controls noise added by each forward transition.','A beta schedule is not the same object as alpha_bar; alpha_bar is the cumulative product of 1-beta.'], 'O(steps) time and space.','Do not confuse βₜ and cumulative \u0305αₜ.','ddpm',['Diffusion','Noise Schedule'],'Easy')

add('diffusion-alpha-bar','Generative Models','Compute Cumulative Diffusion Alphas','cumulative_alphas(betas)',
'Given a forward diffusion variance schedule, compute \u0305αₜ = ∏ₛ₌₁ᵗ(1-βₛ).',
['betas is a list (possibly empty) whose entries satisfy 0<beta<1.','Set alpha_t=1-beta_t and multiply alphas cumulatively in input order.','Return every cumulative product as a new list; empty input returns [].'],
'''def cumulative_alphas(betas):
    out=[];prod=1.0
    for beta in betas:
        prod*=1-beta
        out.append(prod)
    return out''',
[('Two transitions',"x=cumulative_alphas([0.1,0.2]); assert abs(x[0]-0.9)<1e-12 and abs(x[1]-0.72)<1e-12"),('Empty',"assert cumulative_alphas([])==[]"),('One',"assert abs(cumulative_alphas([0.25])[0]-0.75)<1e-12"),('Three',"x=cumulative_alphas([0.5]*3);assert x==[0.5,0.25,0.125]"),('Decreasing',"x=cumulative_alphas([0.1]*4);assert all(b<a for a,b in zip(x,x[1:]))")],
['Products accumulate the signal retention of all preceding noise steps.','This cumulative quantity appears in the closed-form q(x_t | x_0) forward distribution.'], 'O(T) time and output space.','Do not sum betas or multiply betas together.','ddpm',['Diffusion','Alpha Bar'],'Easy')

add('diffusion-forward-sampling','Generative Models','Sample the DDPM Forward Process','q_sample(x0, noise, alpha_bar)',
'Implement the closed-form forward noising equation xₜ = √ᾱₜ x₀ + √(1−ᾱₜ) ε using supplied noise.',
['x0 and noise are numeric lists of equal length; alpha_bar is a scalar in [0,1].','Return the elementwise mixture sqrt(alpha_bar)*x0[i] + sqrt(1-alpha_bar)*noise[i].','Do not draw random noise; the noise vector is supplied for deterministic testing.'],
'''import math

def q_sample(x0, noise, alpha_bar):
    a=math.sqrt(alpha_bar); b=math.sqrt(1-alpha_bar)
    return [a*x+b*y for x,y in zip(x0,noise)]''',
[('Pure data',"assert q_sample([1,2],[9,8],1)==[1.0,2.0]"),('Pure noise',"assert q_sample([1,2],[9,8],0)==[9.0,8.0]"),('Equal mixture explicit',"import math; a=q_sample([2,0],[0,2],0.5); assert all(abs(v-math.sqrt(2))<1e-12 for v in a)"),('Empty',"assert q_sample([],[],0.3)==[]"),('No mutation',"a=[1];b=[2];q_sample(a,b,0.7);assert a==[1] and b==[2]")],
['The closed form samples x_t directly from x0 without simulating all previous t steps.','alpha_bar, not the single-step alpha, controls the coefficient at timestep t.'], 'O(d) time and returned space.','Do not mix alpha_bar and sqrt(alpha_bar): both coefficients have square roots.','ddpm',['Diffusion','Forward Process'],'Easy')

add('diffusion-noise-mse','Generative Models','Compute the DDPM Noise Prediction Loss','epsilon_prediction_mse(predicted, target)',
'Train an epsilon-prediction diffusion model by measuring MSE between estimated and sampled Gaussian noise vectors.',
['predicted and target are equal-length numeric lists; either may be empty only when both are empty.','Return the mean over all elements of (predicted[i]-target[i])**2.','Return 0.0 on an empty vector. The network and its timestep conditioning are outside this task.'],
'''def epsilon_prediction_mse(predicted, target):
    return sum((x-y)**2 for x,y in zip(predicted,target))/len(predicted) if predicted else 0.0''',
[('Two values',"assert epsilon_prediction_mse([0,2],[1,0])==2.5"),('Matching',"assert epsilon_prediction_mse([1,2],[1,2])==0.0"),('Single',"assert epsilon_prediction_mse([3],[1])==4.0"),('Empty',"assert epsilon_prediction_mse([],[])==0.0"),('Negative targets',"assert epsilon_prediction_mse([-1,1],[1,-1])==4.0")],
['The simplified DDPM epsilon objective regresses the noise ε used to create noisy inputs.','It is a loss component, not a complete DDPM model or training optimizer.'], 'O(d) time, O(1) additional space.','Dividing by batch size only, rather than total scalar elements, changes the defined mean.','ddpm',['Diffusion','Training Objective'],'Easy')

add('diffusion-reconstruct-x0','Generative Models','Reconstruct Clean Data from Predicted Noise','predict_x0_from_eps(xt, eps, alpha_bar)',
'Invert the DDPM forward mixing equation to obtain an x0 estimate from xt and a predicted noise vector.',
['xt and eps have equal length; alpha_bar is in (0,1].','Use x0_hat=(xt - sqrt(1-alpha_bar)*eps)/sqrt(alpha_bar) elementwise.','When alpha_bar=1, simply return a copy of xt. No clipping is performed.'],
'''import math

def predict_x0_from_eps(xt, eps, alpha_bar):
    return [(x-math.sqrt(1-alpha_bar)*e)/math.sqrt(alpha_bar) for x,e in zip(xt,eps)]''',
[('Recover x0',"import math; x=math.sqrt(0.25)*2+math.sqrt(0.75)*4;assert abs(predict_x0_from_eps([x],[4],0.25)[0]-2)<1e-12"),('No noise',"assert predict_x0_from_eps([2,3],[1,9],1)==[2.0,3.0]"),('Alpha quarter',"assert predict_x0_from_eps([2],[0],0.25)==[4.0]"),('Empty',"assert predict_x0_from_eps([],[],0.5)==[]"),('Vector',"import math;r=predict_x0_from_eps([1,2],[0,0],0.25);assert r==[2.0,4.0]")],
['The inverse follows directly from rearranging the forward diffusion equation.','Clipping or dynamic thresholding are separate modeling choices and not part of this algebraic component.'], 'O(d) time and returned space.','Do not divide by alpha_bar rather than its square root.','ddpm',['Diffusion','Denoising'],'Easy')

add('diffusion-ddpm-posterior','Generative Models','Compute the DDPM Posterior Mean','ddpm_posterior_mean(xt, x0, alpha_t, alpha_bar_prev)',
'Compute the exact forward posterior mean of q(x_{t-1} | x_t, x0) for a single diffusion step.',
['xt and x0 are equal-length numeric vectors; alpha_t and alpha_bar_prev are in (0,1), so alpha_bar_t=alpha_t*alpha_bar_prev.','Let beta_t=1-alpha_t and denom=1-alpha_t*alpha_bar_prev.','Return coeff_x0*x0 + coeff_xt*xt, with coeff_x0=beta_t*sqrt(alpha_bar_prev)/denom and coeff_xt=sqrt(alpha_t)*(1-alpha_bar_prev)/denom.'],
'''import math

def ddpm_posterior_mean(xt, x0, alpha_t, alpha_bar_prev):
    beta=1-alpha_t
    denom=1-alpha_t*alpha_bar_prev
    c0=beta*math.sqrt(alpha_bar_prev)/denom
    ct=math.sqrt(alpha_t)*(1-alpha_bar_prev)/denom
    return [c0*x+ct*y for x,y in zip(x0,xt)]''',
[('Zero vectors',"assert ddpm_posterior_mean([0],[0],0.9,0.8)==[0.0]"),('Scalar checked',"import math; r=ddpm_posterior_mean([2],[4],0.9,0.8)[0];a=(0.1*math.sqrt(0.8)*4+math.sqrt(0.9)*0.2*2)/(1-0.72);assert abs(r-a)<1e-12"),('Vector linearity',"r=ddpm_posterior_mean([1,2],[0,0],0.8,0.75);assert abs(r[1]-2*r[0])<1e-12"),('No mutation',"x=[1];y=[2];ddpm_posterior_mean(x,y,0.8,0.8);assert x==[1] and y==[2]"),('x0 only',"import math;r=ddpm_posterior_mean([0],[1],0.5,0.5)[0];assert abs(r-(0.5*math.sqrt(0.5)/0.75))<1e-12")],
['The forward diffusion chain admits an analytical Gaussian posterior conditioned on x0.','Reverse samplers often plug an estimated x0 into this posterior mean; this function does not sample noise.'], 'O(d) time and output space.','Do not replace alpha_bar_prev with alpha_t; they refer to different statistics.','ddpm',['DDPM','Posterior'],'Medium')

add('diffusion-cfg-epsilon','Generative Models','Implement Classifier-Free Guidance for Noise Prediction','cfg_epsilon(eps_uncond, eps_cond, guidance_scale)',
'Combine separate unconditional and conditional epsilon predictions into a guided diffusion noise estimate.',
['eps_uncond and eps_cond are numeric vectors of equal length; guidance_scale is any finite scalar.','Return eps_uncond + guidance_scale * (eps_cond-eps_uncond) elementwise.','Scale 0 gives unconditional output; scale 1 gives conditional output; scale >1 extrapolates beyond the conditional prediction.'],
'''def cfg_epsilon(eps_uncond, eps_cond, guidance_scale):
    return [u+guidance_scale*(c-u) for u,c in zip(eps_uncond,eps_cond)]''',
[('Unconditional at zero',"assert cfg_epsilon([1,2],[3,4],0)==[1,2]"),('Conditional at one',"assert cfg_epsilon([1,2],[3,4],1)==[3,4]"),('Extrapolate',"assert cfg_epsilon([1,2],[3,4],2)==[5,6]"),('Negative scale',"assert cfg_epsilon([1],[3],-1)==[-1]"),('Empty',"assert cfg_epsilon([],[],5)==[]"),('No mutation',"u=[1];c=[2];cfg_epsilon(u,c,3);assert u==[1] and c==[2]")],
['Classifier-free guidance needs conditional and unconditional model outputs, not a separately trained classifier gradient.','Different papers use different guidance-scale parameterizations; this exercise explicitly uses u+s(c-u).'],'O(d) time and output space.','Do not confuse the scalar interpolation/extrapolation with classifier guidance based on ∇log p(y|x_t).','cfg',['Diffusion','Classifier-Free Guidance'],'Easy')

add('diffusion-classifier-guidance','Generative Models','Apply Classifier Gradient Guidance to a Reverse Mean','classifier_guided_mean(mean, variance, log_prob_gradient, scale)',
'Implement a simplified classifier-guided Gaussian reverse-step mean shift μ_guided = μ + scale Σ∇log p(y|x_t).',
['mean, variance and log_prob_gradient are equally sized vectors; variance[i]>=0 represents a diagonal reverse covariance element.','For coordinate i return mean[i] + scale*variance[i]*log_prob_gradient[i].','This is a reverse-Gaussian mean-shift component: the classifier gradient is supplied, not learned or calculated here.'],
'''def classifier_guided_mean(mean, variance, log_prob_gradient, scale):
    return [m+scale*v*g for m,v,g in zip(mean,variance,log_prob_gradient)]''',
[('Scale zero',"assert classifier_guided_mean([1,2],[2,3],[3,4],0)==[1,2]"),('Positive gradient',"assert classifier_guided_mean([1,2],[2,3],[3,4],1)==[7,14]"),('Negative gradient',"assert classifier_guided_mean([0],[2],[-3],0.5)==[-3]"),('Zero variance',"assert classifier_guided_mean([1],[0],[100],2)==[1]"),('Different coordinates',"assert classifier_guided_mean([1,1],[1,10],[2,2],1)==[3,21]"),('No mutation',"a=[1];b=[2];c=[3];classifier_guided_mean(a,b,c,1);assert a==[1] and b==[2] and c==[3]")],
['Classifier guidance uses the gradient of a classifier log-likelihood to steer the sampling distribution.','For a diagonal covariance, multiply each gradient coordinate by its corresponding variance before adding it to the reverse mean.','This simplified step is not a classifier network and not classifier-free guidance.'], 'O(d) time and output space.','Do not mix this variance-weighted classifier-gradient update with the CFG conditional/unconditional blend.','cg',['Diffusion','Classifier Guidance'],'Medium')

add('diffusion-ddim-deterministic','Generative Models','Implement One Deterministic DDIM Step','ddim_step(xt, eps_hat, alpha_bar_t, alpha_bar_prev)',
'Use epsilon prediction to compute a deterministic eta=0 DDIM update between two noise levels.',
['xt and eps_hat are equal-length vectors; 0<alpha_bar_t<=alpha_bar_prev<=1.','Compute x0_hat = (xt-sqrt(1-alpha_bar_t)*eps_hat)/sqrt(alpha_bar_t).','Return sqrt(alpha_bar_prev)*x0_hat + sqrt(1-alpha_bar_prev)*eps_hat. Do not inject fresh noise.'],
'''import math

def ddim_step(xt, eps_hat, alpha_bar_t, alpha_bar_prev):
    x0=[(x-math.sqrt(1-alpha_bar_t)*e)/math.sqrt(alpha_bar_t) for x,e in zip(xt,eps_hat)]
    return [math.sqrt(alpha_bar_prev)*z+math.sqrt(1-alpha_bar_prev)*e for z,e in zip(x0,eps_hat)]''',
[('Final clean endpoint',"import math;xt=[math.sqrt(.25)*2+math.sqrt(.75)*4];assert abs(ddim_step(xt,[4],.25,1)[0]-2)<1e-12"),('Same step identity',"r=ddim_step([1,2],[0,3],0.5,0.5);assert all(abs(x-y)<1e-12 for x,y in zip(r,[1,2]))"),('Zero noise',"assert ddim_step([1],[0],.25,1)==[2.0]"),('Empty',"assert ddim_step([],[],.25,.5)==[]"),('Vector',"import math;a=ddim_step([2,4],[0,0],.25,1);assert a==[4.0,8.0]")],
['DDIM can traverse noise levels deterministically when eta=0.','The predicted clean sample is reconstructed first, then re-mixed at the previous noise level.'], 'O(d) time and output space.','Do not add stochastic noise or confuse alpha_bar_prev with the per-step alpha.','ddim',['Diffusion','DDIM'],'Medium')

add('dit-adaln-modulation','Generative Models','Implement Adaptive Layer Normalization (AdaLN)','adaptive_layer_norm(x, shift, scale, eps)',
'Apply a conditional feature-wise affine modulation to a LayerNorm-normalized token using y=LN(x)*(1+scale)+shift.',
['x, shift and scale are equal-length nonempty vectors; eps is a positive scalar.','Compute population mean/variance of x over its feature axis, then normalize with sqrt(var+eps).','Return normalized_x[i]*(1+scale[i])+shift[i] for every feature.'],
'''import math

def adaptive_layer_norm(x, shift, scale, eps):
    mu=sum(x)/len(x)
    var=sum((v-mu)**2 for v in x)/len(x)
    den=math.sqrt(var+eps)
    return [((v-mu)/den)*(1+s)+b for v,s,b in zip(x,scale,shift)]''',
[('Constant input uses shift',"assert adaptive_layer_norm([2,2],[3,4],[8,9],1e-5)==[3.0,4.0]"),('Zero conditioning',"r=adaptive_layer_norm([1,3],[0,0],[0,0],1e-12);assert abs(r[0]+1)<1e-9 and abs(r[1]-1)<1e-9"),('Scale negative one',"assert adaptive_layer_norm([1,3],[5,6],[-1,-1],1e-5)==[5.0,6.0]"),('Per-feature shift',"r=adaptive_layer_norm([1,3],[1,2],[0,0],1e-12);assert abs(r[0]-0)<1e-9 and abs(r[1]-3)<1e-9"),('Input unchanged',"x=[1,3];b=[0,0];s=[1,1];adaptive_layer_norm(x,b,s,1e-5);assert x==[1,3] and s==[1,1]")],
['AdaLN conditions normalized feature vectors through per-feature shift and scale.','DiT commonly uses modulations with the (1+scale) parameterization.','The conditioning network that predicts shift/scale is not part of this isolated kernel.'], 'O(d) time and output space.','Do not multiply raw x by scale; normalize first and use 1+scale.','dit',['DiT','AdaLN'],'Medium')

add('dit-adaln-zero-gate','Generative Models','Implement an AdaLN-Zero Residual Gate','gated_adaln_residual(x, block_output, gate)',
'Implement the residual gate used with AdaLN-Zero after a conditioning-modulated Transformer sub-layer has produced its block output.',
['x, block_output and gate are equal-length numeric vectors.','Return y[i] = x[i] + gate[i]*block_output[i] elementwise.','Zero gate must be an exact identity: all output entries equal x. This task isolates gating, not the normalization calculation.'],
'''def gated_adaln_residual(x, block_output, gate):
    return [a+g*b for a,b,g in zip(x,block_output,gate)]''',
[('Zero gate identity',"assert gated_adaln_residual([1,2],[100,100],[0,0])==[1,2]"),('One gate',"assert gated_adaln_residual([1,2],[3,4],[1,1])==[4,6]"),('Fractional gates',"assert gated_adaln_residual([1,2],[4,4],[0.5,-0.5])==[3.0,0.0]"),('Different channels',"assert gated_adaln_residual([0,0,0],[1,2,3],[1,0,2])==[1,0,6]"),('Empty',"assert gated_adaln_residual([],[],[])==[]")],
['The zero-initialized gate ensures the conditioned block starts as an identity residual connection.','AdaLN shift and scale transform the block input, whereas the gate multiplies its output.','This task is one component, not the complete DiT transformer block.'], 'O(d) time and output space.','Applying gate to x rather than to the sub-layer output destroys identity behavior at initialization.','dit',['DiT','AdaLN-Zero'],'Easy')

out=Path(__file__).resolve().parents[1]/'src'/'foundation-problems.mjs'
out.write_text('// v0.9: independently specified AI foundations, Transformer/ViT, and fine-grained generative-model challenges.\nexport const foundationProblems = '+json.dumps(P,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
print('AUTHORED',len(P),'new fundamental challenges ->',out)
from collections import Counter
print('TRACK COUNTS',dict(Counter(p['track'] for p in P)))
