#!/usr/bin/env python3
"""Wire foundations-first navigation and structured concept hubs into FrontierCode."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
p=root/'src/problems.mjs'
s=p.read_text()
s=s.replace('export const byId = Object.fromEntries(problems.map(p=>[p.id,p]));',"// v0.9: step-by-step foundations (attention, ViT, GAN, diffusion and AdaLN).\nimport {foundationProblems} from './foundation-problems.mjs';\nproblems.push(...foundationProblems);\nexport const byId = Object.fromEntries(problems.map(p=>[p.id,p]));")
p.write_text(s)
concepts=[
('numerical-building-blocks','Numerical Building Blocks','Foundations','Implement the arithmetic, normalization and activation functions underneath modern architectures.','Start here if you have not implemented neural network layers from scratch.',['stable-softmax','foundation-matmul','foundation-layer-normalization','foundation-gelu','foundation-sinusoidal-positions'],'Attention Is All You Need','https://arxiv.org/abs/1706.03762'),
('attention-fundamentals','Attention & Causal Masking','Transformers','Understand the attention score, normalization and information-flow constraints before assembling a Transformer.','Requires basic matrix and softmax intuition.',['attention-scaled-dot-product','attention-causal-mask','transformer-cross-attention'],'Attention Is All You Need','https://arxiv.org/abs/1706.03762'),
('multi-head-attention','Multi-Head Attention Layout','Transformers','Practice feature-axis head splitting and inverse concatenation; each head preserves its own channel block.','Requires understanding of tensor shapes and basic attention.',['attention-split-heads','attention-merge-heads'],'Attention Is All You Need','https://arxiv.org/abs/1706.03762'),
('transformer-blocks','Transformer Block Components','Transformers','Implement normalization, position encodings, activation and pre-norm residual order as separate deterministic pieces.','Requires vector operations.',['foundation-layer-normalization','foundation-gelu','foundation-sinusoidal-positions','transformer-prenorm-residual'],'Attention Is All You Need','https://arxiv.org/abs/1706.03762'),
('vision-transformer','Vision Transformer (ViT)','Transformers','Transform an image into patch tokens, add a class token and position embeddings, then reason about encoder input layout.','Requires understanding of tokens and Transformer inputs.',['vit-patchify','vit-class-token','attention-split-heads','transformer-prenorm-residual'],'An Image is Worth 16x16 Words','https://arxiv.org/abs/2010.11929'),
('gan-objectives','GAN & WGAN-GP Objectives','Generative Models','Treat discriminator, generator and WGAN gradient-penalty terms as separate optimizable quantities.','Requires logistic losses and elementary vector norms.',['gan-discriminator-bce','gan-generator-nonsaturating','gan-gradient-penalty'],'Generative Adversarial Nets','https://arxiv.org/abs/1406.2661'),
('diffusion-forward','Diffusion: Forward Process','Generative Models','Connect beta schedules to cumulative signal retention, direct noisy sampling and epsilon regression.','Requires basic probability and vector arithmetic.',['diffusion-linear-beta','diffusion-alpha-bar','diffusion-forward-sampling','diffusion-noise-mse'],'Denoising Diffusion Probabilistic Models','https://arxiv.org/abs/2006.11239'),
('diffusion-reverse','Diffusion: Reverse Sampling','Generative Models','Separate clean-sample reconstruction, DDPM posterior mean and deterministic DDIM transitions.','Requires the forward-process definitions of alpha and alpha-bar.',['diffusion-reconstruct-x0','diffusion-ddpm-posterior','diffusion-ddim-deterministic'],'Denoising Diffusion Implicit Models','https://arxiv.org/abs/2010.02502'),
('diffusion-guidance','Diffusion: Guidance Methods','Generative Models','Compare classifier-free conditional/unconditional output mixing with classifier-gradient reverse-mean shifts.','Requires diffusion denoising basics; CFG and classifier guidance are different algorithms.',['diffusion-cfg-epsilon','diffusion-classifier-guidance','flow-cfg-velocity'],'Classifier-Free Diffusion Guidance','https://arxiv.org/abs/2207.12598'),
('dit-conditioning','DiT: AdaLN & AdaLN-Zero','Generative Models','Understand how conditional shift/scale enters normalized transformer features and how zero gates preserve a residual identity.','Requires layer normalization and residual connections.',['foundation-layer-normalization','transformer-prenorm-residual','dit-adaln-modulation','dit-adaln-zero-gate'],'Scalable Diffusion Models with Transformers','https://arxiv.org/abs/2212.09748'),
('vae-vqvae','VAE & VQ-VAE Components','Generative Models','Practice continuous latents, KL, discrete codebooks and reconstruction objectives as separate kernels.','Requires basic probability and squared-error losses.',['vae-reparameterization','vae-standard-normal-kl','vae-beta-objective','vqvae-nearest-code','vqvae-codebook-perplexity','vqvae-quantization-error'],'Neural Discrete Representation Learning','https://arxiv.org/abs/1711.00937'),
('flow-matching','Flow Matching Components','Generative Models','Implement probability paths, target velocities, sampling solvers and guidance arithmetic before larger diffusion-Transformer systems.','Requires numerical ODE intuition.',['flow-linear-interpolation','flow-conditional-velocity','flow-velocity-regression','flow-euler-integration','flow-heun-integration','flow-cfg-velocity'],'Flow Matching for Generative Modeling','https://arxiv.org/abs/2210.02747'),
('agent-control','Agent Control & Reliability','Applied Systems','Learn basic control rules, trace validity and tool boundaries before attempting multi-agent architectures.','Requires Python functions and structured data.',['tool-call-parser','agent-retry-guard','react-trace-validator','agent-reflection-controller'],'ReAct','https://arxiv.org/abs/2210.03629'),
('state-estimation','World Models: States & Beliefs','Applied Systems','Start world modeling with state estimates, Markov transitions and Bayesian belief updates.','Requires probability and dynamical state definitions.',['kalman-scalar-update','linear-dynamics-rollout','world-discrete-bayes-filter','world-belief-propagation'],'World Models & Spatial Intelligence','https://overdued.github.io/world-model-spatial-intelligence-course/')]
content='// v0.9 taxonomy: only links to existing, fully authored exercises.\nexport const concepts = '+json.dumps([dict(slug=x[0],title=x[1],family=x[2],summary=x[3],prerequisites=x[4],ids=x[5],reference=dict(title=x[6],url=x[7])) for x in concepts],ensure_ascii=False,indent=2)+';\n'
(root/'src/concepts.mjs').write_text(content)

q=root/'src/practice-sets.mjs'
s=q.read_text()
pos=s.rfind('];')
assert pos>0
addition=""",
  {
    slug:'attention-from-scratch',
    title:'Attention & Transformer Essentials',
    subtitle:'A fundamentals-first practice sequence from numerical operations through masked and multi-head attention.',
    audience:'For developers who want to implement Transformer mechanics rather than memorize the architecture.',
    outcomes:['Revisit stable numerical primitives and layer normalization.','Implement scaled attention, causal masking and head reshaping.','Understand why pre-normalization and residual ordering matter.'],
    segments:[
      {id:'stable-softmax',note:'Begin with stable probability normalization.'},
      {id:'foundation-matmul',note:'Confirm the dot-product/matrix multiplication primitive.'},
      {id:'foundation-layer-normalization',note:'Normalize token features safely.'},
      {id:'attention-scaled-dot-product',note:'Compute the attention-weighted value vector.'},
      {id:'attention-causal-mask',note:'Disallow future-token attention.'},
      {id:'attention-split-heads',note:'Separate model channels into attention heads.'},
      {id:'attention-merge-heads',note:'Concatenate attended head outputs.'},
      {id:'transformer-prenorm-residual',note:'Implement the residual execution order.'}
    ],
    caution:'The exercises implement isolated kernels and layouts; they are not a fully trained Transformer or a PyTorch autograd pipeline.'
  },
  {
    slug:'vision-transformer-basics',
    title:'Vision Transformer (ViT) Building Blocks',
    subtitle:'Image patches, token order, class-token assembly and residual structure.',
    audience:'For learners transitioning from image arrays to ViT encoder representations.',
    outcomes:['Extract non-overlapping image patches in the correct order.','Assemble the class token and all positional embeddings.','Understand how attention heads and residual sub-layers process the resulting tokens.'],
    segments:[
      {id:'vit-patchify',note:'Convert a raster image into a row-major patch sequence.'},
      {id:'vit-class-token',note:'Add a class token and positional vectors.'},
      {id:'attention-split-heads',note:'Reshape token features for multiple heads.'},
      {id:'transformer-prenorm-residual',note:'Trace the pre-norm encoder sub-layer contract.'}
    ],
    caution:'The patch projection, multi-layer encoder and learned weights are intentionally outside these zero-dependency CPU exercises.'
  },
  {
    slug:'diffusion-core-and-sampling',
    title:'Diffusion Fundamentals: Forward to Sampling',
    subtitle:'Trace the exact role of beta, alpha-bar, epsilon prediction, posterior means and DDIM updates.',
    audience:'For learners who want to distinguish training-time noising from sampling-time denoising.',
    outcomes:['Implement noise schedules and direct forward sampling.','Recover x0 from epsilon predictions.','Distinguish DDPM posterior means from deterministic DDIM sampling.'],
    segments:[
      {id:'diffusion-linear-beta',note:'Set a forward variance schedule.'},
      {id:'diffusion-alpha-bar',note:'Compute cumulative signal retention.'},
      {id:'diffusion-forward-sampling',note:'Sample x_t from known x0 and noise.'},
      {id:'diffusion-noise-mse',note:'Evaluate the epsilon-prediction objective.'},
      {id:'diffusion-reconstruct-x0',note:'Invert the forward equation.'},
      {id:'diffusion-ddpm-posterior',note:'Derive a Gaussian forward posterior mean.'},
      {id:'diffusion-ddim-deterministic',note:'Take a deterministic denoising step.'}
    ],
    caution:'Not a full network training/sampling pipeline. The posterior step assumes the specified alpha conventions, and DDIM sets eta=0.'
  },
  {
    slug:'classifier-vs-classifier-free-guidance',
    title:'Classifier Guidance vs Classifier-Free Guidance',
    subtitle:'Two separate exercises for two distinct conditional diffusion guidance mechanisms.',
    audience:'For anyone confused by the classifier-gradient and conditional/unconditional prediction formulas.',
    outcomes:['Apply unconditional/conditional prediction extrapolation.','Apply the classifier gradient weighted by diagonal reverse covariance.','Explain why the two methods need different model outputs.'],
    segments:[
      {id:'diffusion-cfg-epsilon',note:'Combine conditional and unconditional noise estimates without a classifier gradient.'},
      {id:'diffusion-classifier-guidance',note:'Use a supplied log-classifier gradient to shift reverse means.'},
      {id:'flow-cfg-velocity',note:'Contrast CFG in a velocity-prediction parameterization.'}
    ],
    caution:'These exercises implement guidance arithmetic only; they do not train a classifier or a conditional diffusion model.'
  },
  {
    slug:'gan-and-dit-normalization',
    title:'GAN Losses & DiT Adaptive Normalization',
    subtitle:'Distinct generative-model objectives and conditioning components, not one generic generation problem.',
    audience:'For learners bridging adversarial objectives with diffusion Transformer conditioning.',
    outcomes:['Separate discriminator and non-saturating generator objectives.','Understand the critic gradient penalty.','Implement AdaLN shift/scale and AdaLN-Zero gates.'],
    segments:[
      {id:'gan-discriminator-bce',note:'Minimize discriminator logistic loss from logits.'},
      {id:'gan-generator-nonsaturating',note:'Minimize the non-saturating generator loss.'},
      {id:'gan-gradient-penalty',note:'Penalize gradient norm deviation for WGAN-GP.'},
      {id:'dit-adaln-modulation',note:'Modulate normalized features with condition-dependent scale and shift.'},
      {id:'dit-adaln-zero-gate',note:'Preserve residual identity with a zero-initialized gate.'}
    ],
    caution:'The concepts are distinct; the list is a topical practice pack rather than a combined GAN-DiT architecture.'
  }
"""
s=s[:pos]+addition+s[pos:]
q.write_text(s)

print('Created taxonomy',len(concepts),'concepts; added 5 foundation-first practice sets.')
