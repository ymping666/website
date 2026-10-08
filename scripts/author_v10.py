"""v1.0 problem authoring: explicit independent, CPU-only contracts and test cases."""
import json
from pathlib import Path
from textwrap import dedent
root=Path(__file__).resolve().parents[1]
items=[]
refs={
'cnn':('Gradient-Based Learning Applied to Document Recognition','https://ieeexplore.ieee.org/document/726791'),
'bn':('Batch Normalization (Ioffe & Szegedy, 2015)','https://arxiv.org/abs/1502.03167'),
'rms':('Root Mean Square Layer Normalization (Zhang & Sennrich, 2019)','https://arxiv.org/abs/1910.07467'),
'backprop':('Learning representations by back-propagating errors','https://www.nature.com/articles/323533a0'),
'adam':('Adam: A Method for Stochastic Optimization','https://arxiv.org/abs/1412.6980'),
'adamw':('Decoupled Weight Decay Regularization','https://arxiv.org/abs/1711.05101'),
'rope':('RoFormer: Enhanced Transformer with Rotary Position Embedding','https://arxiv.org/abs/2104.09864'),
'attn':('Attention Is All You Need','https://arxiv.org/abs/1706.03762'),
'swiglu':('GLU Variants Improve Transformer','https://arxiv.org/abs/2002.05202'),
'ddpm':('Denoising Diffusion Probabilistic Models','https://arxiv.org/abs/2006.11239'),
'gan':('Generative Adversarial Nets','https://arxiv.org/abs/1406.2661'),
}
def add(number,slug,track,title,level,signature,description,requirements,solution,checks,explanation,pitfall,complexity,source,tags=None,mins=15,wrong=None):
 assert len(requirements)>=3 and len(checks)>=4 and len(explanation)>=2 and wrong
 fn=signature.split('(')[0]
 starter=f'def {signature}:\n    """Implement this precisely specified AI building block."""\n    # TODO\n    pass'
 items.append(dict(id=slug,number=number,track=track,difficulty=level,title=title,duration=f'{mins} min',tags=tags or [fn,'From Scratch'],description=description,requirements=requirements,signature=signature,starter=starter,solution=dedent(solution).strip(),explanation=explanation,complexity=complexity,pitfall=pitfall,hints=[f'Use the contract for {fn} exactly; trace a tiny numeric example first.',pitfall.replace('Do not ','Check that you do not ').replace('Never ','Ensure you never ')],references=[dict(zip(['title','url'],refs[source]))],tests=[{'name':n,'code':c} for n,c in checks],mutation=dedent(wrong).strip()))

# --- convolution and pooling (5)
add(77,'cnn-valid-convolution','AI Foundations','Implement a Valid 2D Convolution (Cross-Correlation)','Easy','conv2d_valid(image, kernel)',
'Implement the spatial sliding-window kernel used by many CNN libraries. This exercise intentionally uses cross-correlation (no kernel flip), matching standard deep-learning conv2d semantics.',
['image is a nonempty rectangular H×W list; kernel is a nonempty rectangular Kh×Kw list with Kh<=H, Kw<=W.','Use stride 1 and no padding; return (H-Kh+1)×(W-Kw+1).','Each output is the sum of image[i+a][j+b]*kernel[a][b] over the kernel window.'],
'''def conv2d_valid(image, kernel):
    h,w=len(image),len(image[0]); kh,kw=len(kernel),len(kernel[0])
    return [[sum(image[i+a][j+b]*kernel[a][b] for a in range(kh) for b in range(kw)) for j in range(w-kw+1)] for i in range(h-kh+1)]''',
[('One by one',"assert conv2d_valid([[1,2],[3,4]],[[2]])==[[2,4],[6,8]]"),('Window sum',"assert conv2d_valid([[1,2,3],[4,5,6],[7,8,9]],[[1,1],[1,1]])==[[12,16],[24,28]]"),('Asymmetric kernel',"assert conv2d_valid([[1,2,3],[4,5,6]],[[1,2]])==[[5,8],[14,17]]"),('Negative weights',"assert conv2d_valid([[1,2],[3,4]],[[1,-1],[-1,1]])==[[0]]"),('Rectangular spatial sizes',"assert conv2d_valid([[1,2,3,4]],[[1,0,2]])==[[7,10]]")],
['In deep-learning APIs, convolution kernels are usually applied as cross-correlations.','The top-left output comes from the top-left image window; no padding means border windows are dropped.'],
'Do not reverse the spatial kernel indices unless explicitly asked for mathematical convolution.','O((H-Kh+1)(W-Kw+1)KhKw) time; output-sized space.','cnn',tags=['CNN','Convolution'],wrong='''def conv2d_valid(image,kernel):
    return [[image[0][0]]]''')
add(78,'cnn-zero-padded-convolution','AI Foundations','Implement Zero-Padded 2D Convolution','Medium','conv2d_same(image, kernel)',
'Apply an odd-sized spatial kernel with zero padding so the output resolution equals the input resolution.',
['image is nonempty H×W and kernel has odd positive Kh and Kw.','For output (i,j), center kernel at input (i,j); treat indices outside image bounds as zeros.','Use cross-correlation without flipping; return an H×W list.'],
'''def conv2d_same(image,kernel):
    h,w=len(image),len(image[0]); kh,kw=len(kernel),len(kernel[0]); ph,pw=kh//2,kw//2
    return [[sum(image[ni][nj]*kernel[a][b] for a in range(kh) for b in range(kw) for ni,nj in [(i+a-ph,j+b-pw)] if 0<=ni<h and 0<=nj<w) for j in range(w)] for i in range(h)]''',
[('Identity',"assert conv2d_same([[1,2],[3,4]],[[1]])==[[1,2],[3,4]]"),('Cross kernel',"assert conv2d_same([[1,2],[3,4]],[[0,1,0],[1,0,1],[0,1,0]])==[[5,5],[5,5]]"),('Zero outside',"assert conv2d_same([[2]],[[1,1,1],[1,1,1],[1,1,1]])==[[2]]"),('Horizontal stencil',"assert conv2d_same([[1,2,3]],[[1,0,1]])==[[2,4,2]]"),('Asymmetric edge',"assert conv2d_same([[1,2]],[[1,2,3]])==[[8,5]]")],
['The padding radius is floor(kernel_size/2) on each axis for odd kernels.','Skipping out-of-bounds image locations implements zero extension while preserving the output shape.'],
'Do not wrap the indices cyclically; padding values must be zeros.','O(H W Kh Kw) time and O(H W) output space.','cnn',wrong='''def conv2d_same(image,kernel):
    return image''')
add(79,'cnn-pointwise-projection','AI Foundations','Implement Multi-Channel 1×1 Convolution','Medium','pointwise_conv(channels, weights, biases)',
'Learn how a 1×1 convolution mixes channels at every pixel without aggregating neighbors.',
['channels is C_in×H×W; weights is C_out×C_in and biases is a list of C_out scalars.','Return C_out×H×W with out[o][i][j]=biases[o]+sum(weights[o][c]*channels[c][i][j]).','Spatial coordinates and input ordering are unchanged; do not modify inputs.'],
'''def pointwise_conv(channels, weights, biases):
    h,w=len(channels[0]),len(channels[0][0])
    return [[[biases[o]+sum(weights[o][c]*channels[c][i][j] for c in range(len(channels))) for j in range(w)] for i in range(h)] for o in range(len(weights))]''',
[('One in one out',"assert pointwise_conv([[[1,2]]],[[3]],[1])==[[[4,7]]]"),('Mix two channels',"assert pointwise_conv([[[1,2]],[[3,4]]],[[1,2]],[0])==[[[7,10]]]"),('Two output filters',"assert pointwise_conv([[[1]],[[2]]],[[1,1],[1,-1]],[0,3])==[[[3]],[[2]]]"),('Preserve spatial layout',"assert pointwise_conv([[[1,2],[3,4]]],[[2]],[0])==[[[2,4],[6,8]]]")],
['The 1×1 kernel performs a dense linear channel projection at each spatial position.','Unlike wider convolution kernels, no neighboring pixel contributes to a location.'],
'Do not mix the H/W dimensions into the channel dot product.','O(C_out C_in H W) time, O(C_out H W) output.','cnn',wrong='''def pointwise_conv(channels,weights,biases):
    return [[[biases[o]] for _ in range(len(channels[0]))] for o in range(len(weights))]''')
add(80,'cnn-max-pooling','AI Foundations','Implement 2×2 Max Pooling','Easy','max_pool2d(image)',
'Downsample an image using non-overlapping 2×2 maxima, as in a conventional stride-2 CNN pooling layer.',
['image is nonempty rectangular H×W with H,W>=2.','Return floor(H/2)×floor(W/2); ignore incomplete border windows.','Each output is the maximum over its corresponding 2×2 block.'],
'''def max_pool2d(image):
    return [[max(image[2*i+a][2*j+b] for a in (0,1) for b in (0,1)) for j in range(len(image[0])//2)] for i in range(len(image)//2)]''',
[('Two by two',"assert max_pool2d([[1,3],[2,4]])==[[4]]"),('Four patches',"assert max_pool2d([[1,2,9,1],[8,3,2,7],[4,9,0,5],[0,2,6,1]])==[[8,9],[9,6]]"),('Negative values',"assert max_pool2d([[-5,-2],[-7,-3]])==[[-2]]"),('Odd edge discarded',"assert max_pool2d([[1,2,100],[3,4,200],[300,400,500]])==[[4]]")],
['The stride equals the pooling window size, so windows do not overlap.','Max pooling retains the strongest scalar activation per block, with spatial dimensions rounded down.'],
'Do not pad incomplete trailing blocks or compare across channel boundaries.','O(HW) time, O(floor(H/2)floor(W/2)) output.','cnn',wrong='''def max_pool2d(image):
    return [[image[2*i][2*j] for j in range(len(image[0])//2)] for i in range(len(image)//2)]''')
add(81,'cnn-average-pooling','AI Foundations','Implement 2×2 Average Pooling','Easy','avg_pool2d(image)',
'Downsample a feature map by computing the arithmetic mean of each non-overlapping 2×2 window.',
['image is nonempty rectangular H×W with H,W>=2.','Use stride 2, without padding; discard incomplete border windows.','Return the average of exactly four input pixels for every output cell.'],
'''def avg_pool2d(image):
    return [[sum(image[2*i+a][2*j+b] for a in (0,1) for b in (0,1))/4 for j in range(len(image[0])//2)] for i in range(len(image)//2)]''',
[('Simple average',"assert avg_pool2d([[1,2],[3,4]])==[[2.5]]"),('Negative and positive',"assert avg_pool2d([[-2,2],[-4,4]])==[[0.0]]"),('Multiple windows',"assert avg_pool2d([[1,1,4,4],[1,1,4,4]])==[[1,4]]"),('Ignore border',"assert avg_pool2d([[1,1,999],[1,1,999],[999,999,999]])==[[1]]")],
['Stride-2 average pooling reduces the spatial resolution while retaining mean activation.','The divisor stays equal to four because partial border windows are ignored.'],
'Do not divide by two or include discarded trailing pixels.','O(HW) time; pooled output space.','cnn',wrong='''def avg_pool2d(image):
    return [[sum(image[2*i+a][2*j+b] for a in (0,1) for b in (0,1))/2 for j in range(len(image[0])//2)] for i in range(len(image)//2)]''')

# --- normalization (4)
add(82,'norm-batch-training','AI Foundations','Compute BatchNorm Training Outputs','Medium','batch_norm_train(batch, gamma, beta, eps)',
'Implement feature-wise batch normalization with statistics estimated from the current mini-batch. Running averages are outside this exercise.',
['batch is B×D with B>=1, gamma and beta have length D, and eps>0.','For each feature j, use population mean and variance across the B rows.','Return B×D values gamma[j]*(x-mean[j])/sqrt(var[j]+eps)+beta[j].'],
'''import math
def batch_norm_train(batch,gamma,beta,eps):
    b,d=len(batch),len(batch[0]); means=[sum(row[j] for row in batch)/b for j in range(d)]
    vars=[sum((row[j]-means[j])**2 for row in batch)/b for j in range(d)]
    return [[gamma[j]*(row[j]-means[j])/math.sqrt(vars[j]+eps)+beta[j] for j in range(d)] for row in batch]''',
[('Two examples',"r=batch_norm_train([[1],[3]],[1],[0],1e-12);assert abs(r[0][0]+1)<1e-9 and abs(r[1][0]-1)<1e-9"),('Affine offset',"assert batch_norm_train([[5,10]],[2,3],[7,8],1e-5)==[[7.,8.]]"),('Channelwise statistics',"r=batch_norm_train([[1,2],[3,6]],[1,2],[0,1],1e-12);assert all(abs(a-b)<1e-9 for a,b in zip(r[0],[-1,-1]))"),('Constant feature',"assert batch_norm_train([[7],[7]],[3],[2],1e-5)==[[2.],[2.]]"),('Translation invariance',"a=batch_norm_train([[1],[3]],[1],[0],1e-8);b=batch_norm_train([[11],[13]],[1],[0],1e-8);assert all(abs(x[0]-y[0])<1e-9 for x,y in zip(a,b))")],
['BatchNorm normalizes each feature across different examples in the current batch.','Learnable gamma and beta scale and shift the normalized activations afterward.'],
'Do not normalize each row separately; that is closer to LayerNorm.','O(BD) time and O(BD) output space; O(D) statistics.','bn',tags=['BatchNorm','Training Mode'],wrong='''import math
def batch_norm_train(batch,gamma,beta,eps):
    return [[gamma[j]*x+beta[j] for j,x in enumerate(row)] for row in batch]''')
add(83,'norm-batch-inference','AI Foundations','Apply BatchNorm Running Statistics at Inference','Easy','batch_norm_eval(batch, running_mean, running_var, gamma, beta, eps)',
'Use frozen running statistics to normalize a batch at inference, rather than recomputing mean or variance on the input mini-batch.',
['batch is B×D; running_mean, running_var, gamma and beta each have length D.','Apply y=gamma*(x-running_mean)/sqrt(running_var+eps)+beta feature-wise.','Do not recompute statistics from batch or update running estimates.'],
'''import math
def batch_norm_eval(batch,running_mean,running_var,gamma,beta,eps):
    return [[gamma[j]*(x-running_mean[j])/math.sqrt(running_var[j]+eps)+beta[j] for j,x in enumerate(row)] for row in batch]''',
[('Use running mean',"r=batch_norm_eval([[11]], [10],[1],[1],[0],1e-12);assert abs(r[0][0]-1)<1e-9"),('Different features',"r=batch_norm_eval([[2,8]],[0,4],[4,4],[2,3],[1,-1],1e-12);assert all(abs(a-b)<1e-9 for a,b in zip(r[0],[3,5]))"),('No batch dependence',"a=batch_norm_eval([[4]],[0],[4],[1],[0],1e-12);b=batch_norm_eval([[4],[500]],[0],[4],[1],[0],1e-12);assert abs(a[0][0]-b[0][0])<1e-12"),('Zero variance stable',"assert batch_norm_eval([[3]], [3],[0],[5],[2],1e-5)==[[2.]]")],
['Inference uses accumulated running statistics from training, not current batch statistics.','Evaluating the same example must return the same result regardless of what other examples share its inference batch.'],
'Do not recompute feature means from the current inference batch.','O(BD) time and O(BD) output space.','bn',wrong='''def batch_norm_eval(batch,running_mean,running_var,gamma,beta,eps):
    return [[x for x in row] for row in batch]''')
add(84,'norm-rmsnorm','AI Foundations','Implement RMSNorm Without Centering','Easy','rms_norm(x, eps)',
'Implement the root-mean-square normalization used in modern transformer variants. Unlike LayerNorm, RMSNorm does not subtract the feature mean.',
['x is a nonempty list of finite reals and eps>0.','Compute rms=sqrt(sum(v*v for v in x)/len(x)+eps).','Return each x[i]/rms; this exercise has no learned gain.'],
'''import math
def rms_norm(x,eps):
    rms=math.sqrt(sum(v*v for v in x)/len(x)+eps)
    return [v/rms for v in x]''',
[('Constant positive',"r=rms_norm([3,3],1e-12);assert all(abs(v-1)<1e-9 for v in r)"),('Signed vector',"r=rms_norm([3,-4],1e-12);assert abs(sum(v*v for v in r)/2-1)<1e-9"),('Zero vector',"assert rms_norm([0,0,0],1e-6)==[0,0,0]"),('No centering',"r=rms_norm([1,3],1e-12);assert all(v>0 for v in r)"),('Single element',"assert abs(rms_norm([-5],1e-12)[0]+1)<1e-9")],
['RMSNorm controls feature-vector scale but leaves its mean unchanged.','The denominator depends on mean squared magnitude, not the centered variance.'],
'Do not subtract the mean; this would turn the operation into a different normalization method.','O(d) time, O(d) output space.','rms',wrong='''import math
def rms_norm(x,eps):
    mean=sum(x)/len(x)
    rms=math.sqrt(sum((v-mean)**2 for v in x)/len(x)+eps)
    return [(v-mean)/rms for v in x]''')
add(85,'norm-rmsnorm-gain','AI Foundations','Apply RMSNorm with Learned Channel Gain','Easy','rms_norm_gain(x, gain, eps)',
'Take the RMS-normalized feature vector and apply a per-channel learned gain vector, with no bias term.',
['x and gain are equal-length nonempty vectors; eps>0.','Compute y[i]=gain[i]*x[i]/sqrt(mean(x**2)+eps).','Do not center input features or add an offset.'],
'''import math
def rms_norm_gain(x,gain,eps):
    inv=1/math.sqrt(sum(v*v for v in x)/len(x)+eps)
    return [v*g*inv for v,g in zip(x,gain)]''',
[('Zero gain',"assert rms_norm_gain([1,2],[0,0],1e-6)==[0,0]"),('Different gains',"r=rms_norm_gain([3,3],[2,-1],1e-12);assert abs(r[0]-2)<1e-9 and abs(r[1]+1)<1e-9"),('Gain broadcast',"r=rms_norm_gain([1,-1],[2,3],1e-12);assert abs(r[0]-2)<1e-9 and abs(r[1]+3)<1e-9"),('Zero input',"assert rms_norm_gain([0,0],[2,3],1e-8)==[0,0]")],
['A gain vector restores learnable per-feature scaling after normalization.','Unlike BatchNorm and LayerNorm with affine parameters, the specified RMSNorm variant has no bias or mean subtraction.'],
'Do not reduce gain to a single shared scalar or apply it before subtracting a mean.','O(d) time and O(d) output space.','rms',wrong='''def rms_norm_gain(x,gain,eps):
    return [a*b for a,b in zip(x,gain)]''')

# --- gradients and optimization (9)
add(86,'autograd-relu-backward','AI Foundations','Backpropagate Through ReLU','Easy','relu_backward(x, upstream)',
'Implement the Jacobian-vector product for elementwise ReLU with a specified convention at zero.',
['x and upstream are same-length vectors.','For x[i]>0, gradient equals upstream[i]; for x[i]<=0, gradient is 0.','Return a new vector and do not modify x or upstream.'],
'''def relu_backward(x,upstream):
    return [g if v>0 else 0 for v,g in zip(x,upstream)]''',
[('Mixed signs',"assert relu_backward([-1,0,2],[3,4,5])==[0,0,5]"),('Negative upstream',"assert relu_backward([1,3],[-7,2])==[-7,2]"),('All zero',"assert relu_backward([0,0],[10,-2])==[0,0]"),('Empty vectors',"assert relu_backward([],[])==[]")],
['ReLU has a diagonal Jacobian containing ones for positive inputs and zeros otherwise.','A subgradient convention at the nonsmooth origin must be stated explicitly; this exercise chooses zero.'],
'Do not use the sign of upstream gradient to decide the ReLU mask.','O(d) time and O(d) output space.','backprop',wrong='''def relu_backward(x,upstream):
    return [g if g>0 else 0 for g in upstream]''')
add(87,'autograd-linear-forward','AI Foundations','Implement a Linear Layer Forward Pass','Easy','linear_forward(x, weights, biases)',
'Implement a fully connected affine layer using lists: y=Wx+b.',
['x has length D_in; weights is D_out×D_in and biases has length D_out.','Return a length-D_out list where y[o]=sum(weights[o][i]*x[i])+biases[o].','The weights and biases are provided; do not initialize or update parameters.'],
'''def linear_forward(x,weights,biases):
    return [sum(w*v for w,v in zip(row,x))+bias for row,bias in zip(weights,biases)]''',
[('Identity',"assert linear_forward([2,3],[[1,0],[0,1]],[0,0])==[2,3]"),('Multiple outputs',"assert linear_forward([1,2],[[2,3],[1,-1]],[4,1])==[12,0]"),('Zero input',"assert linear_forward([0,0],[[1,2]],[-3])==[-3]"),('Single feature',"assert linear_forward([2],[[4],[-1]],[1,2])==[9,0]")],
['Every output feature has its own row of learned weights.','Bias is added after reducing over all input features.'],
'Do not transpose the weight matrix unless the contract says input-major weight storage.','O(D_in D_out) time, O(D_out) output.','backprop',wrong='''def linear_forward(x,weights,biases):
    return [sum(w*v for w,v in zip(row,x)) for row in weights]''')
add(88,'autograd-mse-gradient','AI Foundations','Differentiate Mean Squared Error','Easy','mse_gradient(predictions, targets)',
'Calculate the gradient of the mean squared error with respect to predictions for a nonempty vector.',
['predictions and targets are same-length nonempty vectors.','Loss is (1/n)*sum((pred-target)**2).','Return gradients 2*(predictions[i]-targets[i])/n.'],
'''def mse_gradient(predictions,targets):
    n=len(predictions)
    return [2*(p-t)/n for p,t in zip(predictions,targets)]''',
[('One element',"assert mse_gradient([3],[1])==[4.0]"),('Mean reduction',"assert mse_gradient([2,4],[1,2])==[1.,2.]"),('Zero error',"assert mse_gradient([1,2],[1,2])==[0,0]"),('Negative error',"assert mse_gradient([1,0],[3,4])==[-2.,-4.]")],
['The derivative of a squared residual is twice the residual.','Because the loss is averaged across n elements, every gradient contains a factor 1/n.'],
'Do not omit the reduction factor or differentiate with respect to targets instead.','O(n) time and O(n) output.','backprop',wrong='''def mse_gradient(predictions,targets):
    return [2*(p-t) for p,t in zip(predictions,targets)]''')
add(89,'autograd-linear-backward','AI Foundations','Backpropagate Through a Linear Layer','Medium','linear_backward(x, weights, upstream)',
'Compute gradients through the affine transform y=Wx+b for a single sample, given upstream dL/dy.',
['x length D_in, weights D_out×D_in, upstream length D_out.','Return (dx,dw,db), where dx[i]=sum(weights[o][i]*upstream[o]).','Return dw[o][i]=upstream[o]*x[i], db[o]=upstream[o].'],
'''def linear_backward(x,weights,upstream):
    din=len(x); dout=len(weights)
    dx=[sum(weights[o][i]*upstream[o] for o in range(dout)) for i in range(din)]
    dw=[[upstream[o]*x[i] for i in range(din)] for o in range(dout)]
    return dx,dw,list(upstream)''',
[('One output',"assert linear_backward([2,3],[[4,5]],[6])==([24,30],[[12,18]],[6])"),('Two outputs',"assert linear_backward([1,2],[[1,0],[0,3]],[4,5])==([4,15],[[4,8],[5,10]],[4,5])"),('Zero upstream',"assert linear_backward([2],[[4]], [0])==([0],[[0]],[0])"),('Negative upstream',"assert linear_backward([2],[[-3]],[-2])==([6],[[-4]],[-2])"),('Shape',"dx,dw,db=linear_backward([1,2,3],[[1,2,3],[4,5,6]],[1,1]);assert len(dx)==3 and len(dw)==2 and len(dw[0])==3 and len(db)==2")],
['Backpropagation uses the transposed weight action to propagate upstream gradients to inputs.','The weight gradient is an outer product of the upstream vector and the input vector.'],
'Do not confuse the weight-gradient shape D_out×D_in with the input-gradient shape D_in.','O(D_in D_out) time and O(D_in D_out) for returned weight gradients.','backprop',wrong='''def linear_backward(x,weights,upstream):
    return [sum(weights[o][i]*upstream[o] for o in range(len(weights))) for i in range(len(x))], weights, upstream''')
add(90,'autograd-central-difference','AI Foundations','Check a Gradient with Central Differences','Medium','central_difference(f, x, h)',
'Implement a numerical gradient estimate for a scalar-valued Python function, useful for verifying analytic backpropagation.',
['f is a pure scalar function of a scalar x; h is strictly positive.','Return (f(x+h)-f(x-h))/(2*h).','Call f only at x+h and x-h; do not mutate external state.'],
'''def central_difference(f,x,h):
    return (f(x+h)-f(x-h))/(2*h)''',
[('Quadratic',"assert abs(central_difference(lambda v:v*v,3,1e-4)-6)<1e-9"),('Linear',"assert abs(central_difference(lambda v:7*v+2,-4,0.1)-7)<1e-10"),('Cubic at zero',"assert abs(central_difference(lambda v:v**3,0,1e-3))<1e-5"),('Sinusoid',"import math;assert abs(central_difference(math.sin,0.5,1e-5)-math.cos(0.5))<1e-9"),('Negative slope',"assert abs(central_difference(lambda v:-4*v,10,1e-3)+4)<1e-10")],
['Central differences cancel the first-order Taylor truncation error of forward differences.','Numerical checks validate a gradient locally; they are not a substitute for backpropagation at training scale.'],
'Do not use the one-sided (f(x+h)-f(x))/h formula; it has a different truncation error.','O(1) scalar function evaluations and memory.','backprop',wrong='''def central_difference(f,x,h):
    return (f(x+h)-f(x))/h''')
add(91,'optimizer-sgd-momentum','AI Foundations','Implement One SGD Momentum Update','Medium','sgd_momentum(param, grad, velocity, lr, momentum)',
'Write one classical momentum SGD step on a scalar parameter (no dampening, no Nesterov acceleration).',
['param, grad and velocity are floats; lr>=0, 0<=momentum<1.','Compute new_velocity=momentum*velocity+grad.','Return (param-lr*new_velocity, new_velocity); no weight decay.'],
'''def sgd_momentum(param,grad,velocity,lr,momentum):
    v=momentum*velocity+grad
    return param-lr*v,v''',
[('First step',"assert sgd_momentum(3,2,0,0.1,0.9)==(2.8,2.0)"),('Accumulated momentum',"p,v=sgd_momentum(4,3,2,0.2,0.5);assert abs(p-3.2)<1e-12 and abs(v-4)<1e-12"),('Zero learning rate',"assert sgd_momentum(7,2,3,0,0.5)==(7.,3.5)"),('Negative gradient',"assert sgd_momentum(1,-2,0,0.25,0)==(1.5,-2)")],
['Momentum accumulates an exponentially weighted gradient direction across steps.','The velocity state is updated even if lr=0, because it belongs to the optimizer state.'],
'Do not apply momentum to the parameter value instead of the previous velocity.','O(1) time and space.','adam',wrong='''def sgd_momentum(param,grad,velocity,lr,momentum):
    return param-lr*grad,grad''')
add(92,'optimizer-adam-bias-correction','AI Foundations','Apply Adam First/Second-Moment Bias Correction','Medium','adam_bias_correction(m, v, beta1, beta2, step)',
'Correct the initialization bias of Adam exponential moving averages when the moment accumulators started at zero.',
['m and v are scalar moment estimates after step updates; 0<beta1,beta2<1 and step>=1.','Return m_hat=m/(1-beta1**step), v_hat=v/(1-beta2**step).','This exercise does not apply a parameter update.'],
'''def adam_bias_correction(m,v,beta1,beta2,step):
    return m/(1-beta1**step),v/(1-beta2**step)''',
[('Step one',"m,v=adam_bias_correction(0.2,0.03,0.8,0.7,1);assert abs(m-1)<1e-12 and abs(v-0.1)<1e-12"),('Step two',"m,v=adam_bias_correction(0.19,0.04,0.9,0.8,2);assert abs(m-1)<1e-12 and abs(v-0.04/0.36)<1e-12"),('Zero state',"assert adam_bias_correction(0,0,0.9,0.999,1)==(0,0)"),('Long horizon',"m,v=adam_bias_correction(0.8,0.5,0.5,0.5,12);assert abs(m-0.8/(1-0.5**12))<1e-12 and abs(v-0.5/(1-0.5**12))<1e-12")],
['Zero-initialized moment estimates are biased toward zero early in training.','First and second moments require separate beta powers and separate denominators.'],
'Do not use the same beta for both moment estimates or omit the step exponent.','O(1) time and space.','adam',wrong='''def adam_bias_correction(m,v,beta1,beta2,step):
    return m,v''')
add(93,'optimizer-adamw-update','AI Foundations','Implement One Decoupled AdamW Step','Hard','adamw_step(p, g, m, v, step, lr, beta1, beta2, eps, weight_decay)',
'Update one scalar parameter with Adam moments and decoupled weight decay. This is a functional step that returns new parameter and moment state.',
['step>=1 and m,v are previous moment estimates; beta1,beta2 in (0,1), eps>0.','First compute m_new=beta1*m+(1-beta1)*g and v_new=beta2*v+(1-beta2)*g*g; bias-correct both using step.','Set p_new=p*(1-lr*weight_decay)-lr*m_hat/(sqrt(v_hat)+eps); return (p_new,m_new,v_new).'],
'''import math
def adamw_step(p,g,m,v,step,lr,beta1,beta2,eps,weight_decay):
    m_new=beta1*m+(1-beta1)*g
    v_new=beta2*v+(1-beta2)*g*g
    mh=m_new/(1-beta1**step); vh=v_new/(1-beta2**step)
    return p*(1-lr*weight_decay)-lr*mh/(math.sqrt(vh)+eps),m_new,v_new''',
[('First step no decay',"p,m,v=adamw_step(1,2,0,0,1,0.1,0.9,0.999,1e-8,0);assert abs(p-0.9)<1e-8 and abs(m-0.2)<1e-12 and abs(v-0.004)<1e-12"),('Decay without gradient',"p,m,v=adamw_step(2,0,0,0,1,0.1,0.9,0.999,1e-8,0.5);assert abs(p-1.9)<1e-12 and m==0 and v==0"),('Different second moment',"p,m,v=adamw_step(1,3,1,4,2,0.01,0.5,0.5,1e-8,0);assert abs(m-2)<1e-12 and abs(v-6.5)<1e-12 and p<1"),('No learning',"p,m,v=adamw_step(3,4,0,0,1,0,0.9,0.99,1e-8,0.1);assert p==3 and m>0 and v>0"),('Negative gradient',"p,m,v=adamw_step(0,-1,0,0,1,0.1,0.9,0.999,1e-8,0);assert p>0 and m<0 and v>0")],
['The exponential moment updates are part of optimizer state and happen before bias correction.','AdamW weight decay is decoupled: multiply p by 1-lr*weight_decay, rather than adding decay to gradient moments.'],
'Do not add weight decay into the gradient before computing Adam moments; that changes the algorithm.','O(1) time and space for a scalar; elementwise O(d) for vectors.','adamw',wrong='''import math
def adamw_step(p,g,m,v,step,lr,beta1,beta2,eps,weight_decay):
    g=g+weight_decay*p
    m_new=beta1*m+(1-beta1)*g
    v_new=beta2*v+(1-beta2)*g*g
    mh=m_new/(1-beta1**step); vh=v_new/(1-beta2**step)
    return p-lr*mh/(math.sqrt(vh)+eps),m_new,v_new''')
add(94,'optimizer-global-norm-clipping','AI Foundations','Clip a Gradient Vector by Global L2 Norm','Medium','clip_global_norm(grad, max_norm)',
'Protect parameter updates from unusually large gradient magnitudes by clipping the entire gradient vector using one shared scaling factor.',
['grad is a list of reals, max_norm>0.','If L2 norm of grad is <= max_norm, return a copy unchanged; zero/empty gradients stay unchanged.','Otherwise multiply every component by max_norm/norm, preserving the direction.'],
'''import math
def clip_global_norm(grad,max_norm):
    norm=math.sqrt(sum(g*g for g in grad))
    scale=min(1.0,max_norm/norm) if norm>0 else 1.0
    return [g*scale for g in grad]''',
[('Clip 3-4-5',"assert all(abs(a-b)<1e-12 for a,b in zip(clip_global_norm([3,4],2.5),[1.5,2.0]))"),('No clipping',"assert clip_global_norm([1,2],4)==[1,2]"),('Negative sign',"assert clip_global_norm([-6,8],5)==[-3,4]"),('Zero grad',"assert clip_global_norm([0,0],2)==[0,0]"),('Empty grad',"assert clip_global_norm([],2)==[]"),('Equal norm',"assert clip_global_norm([3,4],5)==[3,4]")],
['Global norm clipping preserves the ratio among coordinates.','Componentwise clamping is a different operation that changes the gradient direction.'],
'Do not clamp each gradient component independently; use one vector-wide norm.','O(d) time and O(d) output space.','adam',wrong='''def clip_global_norm(grad,max_norm):
    return [max(-max_norm,min(max_norm,g)) for g in grad]''')

# --- transformer components (4)
add(95,'rope-rotate-pair','Transformer & Vision','Rotate One 2D Feature Pair with RoPE','Easy','rope_pair(x, y, angle)',
'Implement the 2D rotation applied to one pair of query or key channels in Rotary Position Embedding.',
['x,y,angle are finite real scalars; angle is in radians.','Return [x*cos(angle)-y*sin(angle), x*sin(angle)+y*cos(angle)].','Rotation preserves the pair L2 norm (up to floating-point error).'],
'''import math
def rope_pair(x,y,angle):
    c,s=math.cos(angle),math.sin(angle)
    return [x*c-y*s,x*s+y*c]''',
[('Zero angle',"assert rope_pair(3,4,0)==[3,4]"),('Quarter turn',"import math;r=rope_pair(1,0,math.pi/2);assert abs(r[0])<1e-12 and abs(r[1]-1)<1e-12"),('Negative quarter turn',"import math;r=rope_pair(0,1,-math.pi/2);assert abs(r[0]-1)<1e-12 and abs(r[1])<1e-12"),('Norm preserved',"import math;r=rope_pair(3,4,0.37);assert abs(sum(v*v for v in r)-25)<1e-10"),('Nonzero both',"import math;r=rope_pair(1,2,math.pi);assert all(abs(a-b)<1e-10 for a,b in zip(r,[-1,-2]))")],
['Each RoPE channel pair is multiplied by a proper 2D rotation matrix.','The same angle is applied to the two channels in a pair, giving position-dependent geometry while preserving norm.'],
'Do not rotate only one channel or mix degrees and radians.','O(1) time and space.','rope',wrong='''import math
def rope_pair(x,y,angle):
    return [x*math.cos(angle),y*math.sin(angle)]''')
add(96,'rope-position-encoding','Transformer & Vision','Apply RoPE to a Sequence of Token Vectors','Medium','apply_rope(tokens, base)',
'Encode absolute token positions by rotating adjacent channel pairs at position-dependent frequencies (interleaved pair convention).',
['tokens is a list of length-T even-dimensional vectors; all vectors have the same dimension D.','For token position p and channel pair i, angle = p/(base ** (2*i/D)); base>1.','Rotate channels (2*i,2*i+1) using the angle; preserve token and feature order.'],
'''import math
def apply_rope(tokens,base):
    if not tokens: return []
    d=len(tokens[0]);out=[]
    for p,tok in enumerate(tokens):
        row=[]
        for i in range(d//2):
            a=p/(base**(2*i/d));c,s=math.cos(a),math.sin(a)
            x,y=tok[2*i],tok[2*i+1]
            row.extend([x*c-y*s,x*s+y*c])
        out.append(row)
    return out''',
[('First position identity',"assert apply_rope([[3.,4.,5.,6.]],10000)==[[3.,4.,5.,6.]]"),('Position one first pair',"import math;r=apply_rope([[1,0],[1,0]],10000);assert abs(r[1][0]-math.cos(1))<1e-12 and abs(r[1][1]-math.sin(1))<1e-12"),('Different frequencies',"import math;r=apply_rope([[1,0,1,0],[1,0,1,0]],10000);assert abs(r[1][0]-math.cos(1))<1e-12 and abs(r[1][2]-math.cos(0.01))<1e-12"),('Norm each token',"r=apply_rope([[3,4,0,0],[1,2,3,4],[4,0,0,2]],10000);assert all(abs(sum(v*v for v in out)-sum(v*v for v in tok))<1e-10 for tok,out in zip([[3,4,0,0],[1,2,3,4],[4,0,0,2]],r))"),('Empty sequence',"assert apply_rope([],10000)==[]")],
['RoPE uses a rotation whose angle grows with position and decreases with pair index.','This exercise uses an explicitly interleaved pair convention; production models may use different channel permutations.'],
'Do not give every pair the same frequency or apply position index starting at one.','O(TD) time and O(TD) output space.','rope',wrong='''import math
def apply_rope(tokens,base):
    if not tokens:return []
    d=len(tokens[0]);out=[]
    for p,tok in enumerate(tokens):
        row=[]
        for i in range(d//2):
            a=p;c,s=math.cos(a),math.sin(a)
            x,y=tok[2*i],tok[2*i+1]
            row.extend([x*c-y*s,x*s+y*c])
        out.append(row)
    return out''')
add(97,'transformer-swiglu','Transformer & Vision','Implement a SwiGLU Activation Branch','Easy','swiglu_gate(x, gate)',
'Implement the elementwise SwiGLU nonlinearity applied before the final output projection of a gated Transformer MLP.',
['x and gate have equal lengths; all values finite.','Use SiLU(g)=g/(1+exp(-g)); return x[i]*SiLU(gate[i]).','Return a list without any output projection; empty lists are allowed.'],
'''import math
def swiglu_gate(x,gate):
    def silu(v):
        return v/(1+math.exp(-v)) if v>=0 else v*math.exp(v)/(1+math.exp(v))
    return [a*silu(b) for a,b in zip(x,gate)]''',
[('Zero gates',"assert swiglu_gate([1,3],[0,0])==[0,0]"),('Positive gate',"import math;r=swiglu_gate([2],[1]);assert abs(r[0]-2/(1+math.exp(-1)))<1e-12"),('Negative gate',"import math;r=swiglu_gate([3],[-1]);assert abs(r[0]-(-3/(1+math.e)))<1e-12"),('Negative x',"import math;r=swiglu_gate([-2],[2]);assert abs(r[0]+4/(1+math.exp(-2)))<1e-12"),('Empty',"assert swiglu_gate([],[])==[]"),('Stable large negative',"assert abs(swiglu_gate([1],[-1000])[0])<1e-100")],
['SwiGLU combines a linear path x with a SiLU-transformed gate.','A numerically stable form handles very negative gates without overflowing exp(-gate).'],
'Do not use sigmoid alone; SiLU(v)=v*sigmoid(v), so it can be negative.','O(d) time and O(d) output space.','swiglu',wrong='''import math
def swiglu_gate(x,gate):
    return [a/(1+math.exp(-b)) for a,b in zip(x,gate)]''')
add(98,'attention-key-padding-mask','Transformer & Vision','Apply a Key Padding Mask to Attention Scores','Easy','mask_key_padding(scores, valid_keys)',
'Mask invalid key positions from a single-query attention score vector before softmax.',
['scores and valid_keys have equal length, where valid_keys contains booleans.','Return score if valid_keys[i] else float("-inf") for each position.','Do not change score ordering or apply softmax; at least one key is valid.'],
'''def mask_key_padding(scores,valid_keys):
    return [s if valid else float('-inf') for s,valid in zip(scores,valid_keys)]''',
[('One pad',"assert mask_key_padding([1,2,3],[True,False,True])==[1,float('-inf'),3]"),('All valid',"assert mask_key_padding([-1,0],[True,True])==[-1,0]"),('First key masked',"assert mask_key_padding([4,9,2],[False,True,True])==[float('-inf'),9,2]"),('Large negative valid',"assert mask_key_padding([-1e9,0],[True,False])==[-1e9,float('-inf')]")],
['Key padding masks prevent attention from allocating probability to padding tokens.','This is different from a causal mask, which blocks future positions according to a query index.'],
'Do not assign a finite sentinel such as zero, because a valid negative score could be smaller than zero.','O(n) time and O(n) output space.','attn',wrong='''def mask_key_padding(scores,valid_keys):
    return [s if valid else 0 for s,valid in zip(scores,valid_keys)]''')

# --- diffusion/GAN fine-grained steps (2)
add(99,'diffusion-ddpm-stochastic-step','Generative Models','Sample One DDPM Reverse Gaussian Step','Medium','ddpm_reverse_step(mean, variance, noise, timestep)',
'Given a previously computed reverse-process Gaussian mean and variance, sample the next scalar DDPM state. Do not conflate this sampling kernel with the posterior-mean calculation.',
['mean is a scalar reverse mean; variance>=0; noise is a supplied standard-normal draw.','Return mean+sqrt(variance)*noise when timestep>0.','At timestep==0 return mean exactly, ignoring the noise. This adopts the common final-step no-noise convention.'],
'''import math
def ddpm_reverse_step(mean,variance,noise,timestep):
    return mean if timestep==0 else mean+math.sqrt(variance)*noise''',
[('Final step deterministic',"assert ddpm_reverse_step(3,9,20,0)==3"),('Nonfinal positive noise',"assert ddpm_reverse_step(2,4,0.5,3)==3"),('Negative noise',"assert ddpm_reverse_step(3,9,-1,5)==0"),('Zero variance',"assert ddpm_reverse_step(4,0,99,5)==4"),('Variance is not stdev',"assert ddpm_reverse_step(0,16,1,1)==4")],
['The DDPM sampling kernel draws from a Gaussian parameterized by variance, so the noise coefficient is the standard deviation sqrt(variance).','At the designated final step the exercise omits random noise to return the reverse mean exactly.'],
'Do not multiply noise by the variance itself or add random noise at timestep zero.','O(1) time and space.','ddpm',wrong='''def ddpm_reverse_step(mean,variance,noise,timestep):
    return mean+variance*noise''')
add(100,'gan-discriminator-logit-gradients','Generative Models','Differentiate the GAN Discriminator Logit Loss','Medium','discriminator_logit_grads(real_logit, fake_logit)',
'Implement derivatives of the standard logistic discriminator loss with respect to one real and one fake scalar logit.',
['Loss is softplus(-real_logit)+softplus(fake_logit) with no averaging.','Return (sigmoid(real_logit)-1, sigmoid(fake_logit)).','Use a numerically stable sigmoid for large-magnitude logits; gradients are with respect to logits, not model weights.'],
'''import math
def discriminator_logit_grads(real_logit,fake_logit):
    def sigmoid(x):
        if x>=0:return 1/(1+math.exp(-x))
        ex=math.exp(x);return ex/(1+ex)
    return sigmoid(real_logit)-1,sigmoid(fake_logit)''',
[('Both zero',"assert discriminator_logit_grads(0,0)==(-0.5,0.5)"),('Strong correct discrimination',"a,b=discriminator_logit_grads(10,-10);assert -0.001<a<0 and 0<b<0.001"),('Wrong real and fake',"a,b=discriminator_logit_grads(-3,3);assert a<-.9 and b>.9"),('Large logits finite',"import math;a,b=discriminator_logit_grads(-1000,1000);assert math.isfinite(a) and math.isfinite(b) and a==-1 and b==1"),('Asymmetric',"import math;a,b=discriminator_logit_grads(2,-1);assert abs(a-(1/(1+math.exp(-2))-1))<1e-12 and abs(b-1/(1+math.exp(1)))<1e-12")],
['The discriminator minimizes negative log sigmoid(real) plus negative log (1-sigmoid(fake)).','Differentiating each logit separately gives sigmoid(real)-1 and sigmoid(fake), with opposite desired gradient directions.'],
'Do not return sigmoid(-real) as a positive real-logit gradient; its sign should be negative.','O(1) time and space.','gan',wrong='''import math
def discriminator_logit_grads(real_logit,fake_logit):
    return 1/(1+math.exp(real_logit)),1/(1+math.exp(-fake_logit))''')

assert len(items)==24 and sorted(p['number'] for p in items)==list(range(77,101)),[p['number'] for p in items]
mutations={p['id']:p.pop('mutation') for p in items}
(root/'src'/'core-next-problems.mjs').write_text('// v1.0 independent fine-grained AI fundamentals challenges.\nexport const coreNextProblems = '+json.dumps(items,indent=2,ensure_ascii=False)+';\n')
(root/'scripts'/'v10-mutations.json').write_text(json.dumps(mutations,ensure_ascii=False,indent=2))
print('AUTHORED',len(items),'new problems; new assertions',sum(len(p['tests']) for p in items))
