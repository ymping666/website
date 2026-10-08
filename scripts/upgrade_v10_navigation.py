from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
ref={
'cnn':('Gradient-Based Learning Applied to Document Recognition','https://ieeexplore.ieee.org/document/726791'),
'bn':('Batch Normalization','https://arxiv.org/abs/1502.03167'),
'rms':('Root Mean Square Layer Normalization','https://arxiv.org/abs/1910.07467'),
'backprop':('Learning Representations by Back-propagating Errors','https://www.nature.com/articles/323533a0'),
'adam':('Adam: A Method for Stochastic Optimization','https://arxiv.org/abs/1412.6980'),
'adamw':('Decoupled Weight Decay Regularization','https://arxiv.org/abs/1711.05101'),
'rope':('RoFormer','https://arxiv.org/abs/2104.09864'),
'swiglu':('GLU Variants Improve Transformer','https://arxiv.org/abs/2002.05202'),
'attn':('Attention Is All You Need','https://arxiv.org/abs/1706.03762'),
'ddpm':('Denoising Diffusion Probabilistic Models','https://arxiv.org/abs/2006.11239'),
'gan':('Generative Adversarial Nets','https://arxiv.org/abs/1406.2661')}
concepts=[
('cnn-convolutions','CNN: Convolution and Channel Mixing','Foundations','Implement valid/same spatial kernels and 1×1 channel projection without external libraries.','Matrix multiplication and nested loops.',['cnn-valid-convolution','cnn-zero-padded-convolution','cnn-pointwise-projection'],'cnn'),
('cnn-pooling','CNN: Spatial Pooling','Foundations','Compare stride-2 max and average pooling, including incomplete border handling.','2D array indexing and local kernels.',['cnn-max-pooling','cnn-average-pooling'],'cnn'),
('batch-normalization','BatchNorm: Training vs Inference','Foundations','Compare current-batch feature statistics with frozen running statistics.','Mean, variance and per-feature affine transformations.',['norm-batch-training','norm-batch-inference'],'bn'),
('rms-normalization','RMSNorm: Core and Gain','Foundations','Separate root-mean-square normalization from learned elementwise gain and from LayerNorm.','Featurewise normalization and epsilon stability.',['foundation-layer-normalization','norm-rmsnorm','norm-rmsnorm-gain'],'rms'),
('gradient-backpropagation','Backpropagation and Gradient Checking','Foundations','Derive gradients for activations, affine layers and MSE; verify derivatives numerically.','Single-variable calculus and basic matrices.',['autograd-linear-forward','autograd-mse-gradient','autograd-relu-backward','autograd-linear-backward','autograd-central-difference'],'backprop'),
('sgd-and-gradient-clipping','SGD Momentum and Gradient Clipping','Foundations','Control gradient scale and carry optimizer velocity between steps.','Derivatives and vector norms.',['optimizer-sgd-momentum','optimizer-global-norm-clipping'],'adam'),
('adam-and-adamw','Adam and AdamW Optimizers','Foundations','Isolate moment bias correction from parameter updates and decoupled weight decay.','SGD, moment estimates and square roots.',['optimizer-sgd-momentum','optimizer-adam-bias-correction','optimizer-adamw-update'],'adamw'),
('rope-rotary-position','RoPE: Rotary Position Embeddings','Transformers','Rotate a pair, then apply position and frequency-dependent rotations across tokens.','Radians, trigonometry and attention channel layouts.',['rope-rotate-pair','rope-position-encoding'],'rope'),
('swiglu-gating','SwiGLU Gated Activations','Transformers','Differentiate SiLU gating from ordinary sigmoid gating in a Transformer feedforward path.','Sigmoid, multiplication and numerically stable exponentials.',['foundation-gelu','transformer-swiglu'],'swiglu'),
('attention-padding-masks','Attention Key Padding Masks','Transformers','Practice padding-key filtering separately from causal masking.','Basic attention scores and masked softmax.',['attention-causal-mask','attention-key-padding-mask'],'attn'),
('ddpm-reverse-sampling','DDPM Reverse Sampling','Generative Models','Distinguish posterior mean calculation from variance-scaled reverse Gaussian sampling.','DDPM forward schedule and x0 reconstruction.',['diffusion-alpha-bar','diffusion-ddpm-posterior','diffusion-ddpm-stochastic-step'],'ddpm'),
('gan-loss-derivatives','GAN Discriminator Gradients','Generative Models','Derive logistic-loss logit gradients separately from discriminator and generator scalar objectives.','Sigmoid and binary classification losses.',['gan-discriminator-bce','gan-discriminator-logit-gradients','gan-generator-nonsaturating'],'gan')]
entries=[dict(slug=slug,title=title,family=family,summary=summary,prerequisites=pre,ids=ids,reference=dict(zip(('title','url'),ref[source]))) for slug,title,family,summary,pre,ids,source in concepts]
file=root/'src/concepts.mjs'; txt=file.read_text().rstrip()
assert txt.endswith('];')
file.write_text(txt[:-2]+',\n'+',\n'.join(json.dumps(c,indent=2,ensure_ascii=False) for c in entries)+'\n];\n')

sets=[
('cnn-and-pooling','CNN Convolution and Pooling From Scratch','Build a small stack of spatial kernels and downsampling operations.','For developers moving from matrix operations to convolutional image models.',
 ['Implement valid/same padding convolution correctly.','Project channels with 1×1 kernels.','Differentiate max and average pooling.'],
 [('foundation-matmul','Review the structure of a dimension-reducing sum.'),('cnn-valid-convolution','Slide a kernel without padding.'),('cnn-zero-padded-convolution','Add explicit zero-padding semantics.'),('cnn-pointwise-projection','Mix channels but preserve spatial resolution.'),('cnn-max-pooling','Choose the maximum in each window.'),('cnn-average-pooling','Average each non-overlapping local window.')],
 'These are CPU list-based kernels, not a GPU library or trained CNN.'),
('normalization-and-gradients','BatchNorm, RMSNorm and Manual Backprop','Work through normalization modes and manual derivatives with deterministic numeric tests.','For learners who want to understand what autograd frameworks compute.',
 ['Differentiate BatchNorm training and inference.','Compare centered and uncentered normalization.','Backpropagate through a linear map and validate numerical derivatives.'],
 [('foundation-layer-normalization','Start from mean/variance across features.'),('norm-batch-training','Normalize features across the mini-batch.'),('norm-batch-inference','Use stored running statistics.'),('norm-rmsnorm','Normalize without mean subtraction.'),('norm-rmsnorm-gain','Apply a learned per-feature gain.'),('autograd-linear-forward','Implement Wx+b.'),('autograd-mse-gradient','Differentiate mean squared error.'),('autograd-relu-backward','Apply an activation Jacobian.'),('autograd-linear-backward','Compute all affine gradients.'),('autograd-central-difference','Numerically validate one derivative.')],
 'Exercises work at scalar/list scale and do not replace vectorized training or framework autograd.'),
('sgd-adam-optimization','Optimization: Momentum, Adam and AdamW','Trace gradient scaling, moment estimators and decoupled decay one step at a time.','For learners implementing optimizers rather than copying a library call.',
 ['Clip gradients by global L2 norm.','Apply classical momentum SGD.','Separate Adam moment bias correction from a full AdamW update.'],
 [('autograd-mse-gradient','Compute a loss gradient.'),('optimizer-global-norm-clipping','Bound the norm without altering direction.'),('optimizer-sgd-momentum','Maintain velocity between steps.'),('optimizer-adam-bias-correction','Correct zero-initialized first/second moments.'),('optimizer-adamw-update','Apply a full decoupled AdamW scalar parameter step.')],
 'Update rules are explicit variants; AdamW task is scalar to make test expectations transparent.'),
('rope-swiglu-transformer-details','Transformer Details: RoPE, SwiGLU and Padding Masks','Practice overlooked building blocks between attention mathematics and deployed Transformer architectures.','For learners with introductory Attention and ViT experience.',
 ['Apply per-pair and per-position rotary embeddings.','Use stable SwiGLU gating.','Differentiate key padding and causal masking.'],
 [('attention-scaled-dot-product','Understand attention scores.'),('attention-causal-mask','Block future token positions.'),('attention-key-padding-mask','Block padded key positions.'),('rope-rotate-pair','Rotate one 2D pair.'),('rope-position-encoding','Apply interleaved rotary frequencies across tokens.'),('transformer-swiglu','Implement the gated MLP activation branch.')],
 'These kernels use one explicitly stated RoPE convention and do not form a pretrained attention model.')]
entries2=[dict(slug=slug,title=title,subtitle=subtitle,audience=audience,outcomes=outcomes,segments=[dict(id=id,note=note) for id,note in steps],caution=caution) for slug,title,subtitle,audience,outcomes,steps,caution in sets]
p=root/'src/practice-sets.mjs';t=p.read_text().rstrip();assert t.endswith('];')
p.write_text(t[:-2]+',\n'+',\n'.join(json.dumps(x,indent=2,ensure_ascii=False) for x in entries2)+'\n];\n')

p=root/'scripts/build.mjs';t=p.read_text();t=t.replace("['01 · Mathematical kernels','Matrix multiply, softmax, LayerNorm, GELU']","['01 · Mathematical kernels','Matrix multiply, CNN convolution and pooling, linear layers']").replace("['02 · Positions & representations','Sinusoidal position encodings']","['02 · Norms & differentiation','BatchNorm train/eval, RMSNorm, backward gradients, finite differences']").replace("['03 · Decision basics','Epsilon-greedy policy, discounted returns']","['03 · Optimization & policies','SGD momentum, Adam/AdamW, gradient clipping, RL basics']")
t=t.replace("['02 · Head shapes & context','Head split/merge and cross-attention']","['02 · Head shapes & context','Head split/merge, cross-attention, padding masks and RoPE']").replace("['04 · Encoder building blocks','Pre-LayerNorm residual ordering']","['04 · Encoder building blocks','Pre-LayerNorm residual ordering, SwiGLU gating']")
t=t.replace("['03 · Reverse steps','Predict x0, DDPM posterior mean, DDIM step']","['03 · Reverse steps','Predict x0, DDPM posterior mean, stochastic reverse sampling, DDIM']").replace("['01 · GAN objectives','Discriminator BCE, non-saturating generator loss, WGAN-GP']","['01 · GAN objectives','Discriminator BCE, logit gradients, generator loss, WGAN-GP']")
t=t.replace("['foundation-matmul','attention-scaled-dot-product','vit-patchify','diffusion-forward-sampling']","['cnn-valid-convolution','norm-rmsnorm','rope-position-encoding','diffusion-ddpm-stochastic-step']")
t=t.replace('Attention, ViT and Diffusion','CNN, Attention, ViT and Diffusion')
t=t.replace('from linear algebra and Attention to ViT, GAN, Diffusion, AdaLN, agents and world models.','from CNN, BatchNorm, RMSNorm, AdamW and RoPE to ViT, GAN, Diffusion, agents and world models.')
t=t.replace('Start with AI fundamentals, implement Attention and ViT, then practice GAN, diffusion and conditional guidance before advanced agents and world models.','Start with CNNs, normalization and backpropagation, implement Attention, RoPE and ViT, then practice GAN and diffusion before agents and world models.')
p.write_text(t)
print('NAV ADDED',len(entries),'concept hubs and',len(entries2),'practice lists')
