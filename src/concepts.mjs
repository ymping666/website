// v0.9 taxonomy: only links to existing, fully authored exercises.
export const concepts = [
  {
    "slug": "numerical-building-blocks",
    "title": "Numerical Building Blocks",
    "family": "Foundations",
    "summary": "Implement the arithmetic, normalization and activation functions underneath modern architectures.",
    "prerequisites": "Start here if you have not implemented neural network layers from scratch.",
    "ids": [
      "stable-softmax",
      "foundation-matmul",
      "foundation-layer-normalization",
      "foundation-gelu",
      "foundation-sinusoidal-positions"
    ],
    "reference": {
      "title": "Attention Is All You Need",
      "url": "https://arxiv.org/abs/1706.03762"
    }
  },
  {
    "slug": "attention-fundamentals",
    "title": "Attention & Causal Masking",
    "family": "Transformers",
    "summary": "Understand the attention score, normalization and information-flow constraints before assembling a Transformer.",
    "prerequisites": "Requires basic matrix and softmax intuition.",
    "ids": [
      "attention-scaled-dot-product",
      "attention-causal-mask",
      "transformer-cross-attention"
    ],
    "reference": {
      "title": "Attention Is All You Need",
      "url": "https://arxiv.org/abs/1706.03762"
    }
  },
  {
    "slug": "multi-head-attention",
    "title": "Multi-Head Attention Layout",
    "family": "Transformers",
    "summary": "Practice feature-axis head splitting and inverse concatenation; each head preserves its own channel block.",
    "prerequisites": "Requires understanding of tensor shapes and basic attention.",
    "ids": [
      "attention-split-heads",
      "attention-merge-heads"
    ],
    "reference": {
      "title": "Attention Is All You Need",
      "url": "https://arxiv.org/abs/1706.03762"
    }
  },
  {
    "slug": "transformer-blocks",
    "title": "Transformer Block Components",
    "family": "Transformers",
    "summary": "Implement normalization, position encodings, activation and pre-norm residual order as separate deterministic pieces.",
    "prerequisites": "Requires vector operations.",
    "ids": [
      "foundation-layer-normalization",
      "foundation-gelu",
      "foundation-sinusoidal-positions",
      "transformer-prenorm-residual"
    ],
    "reference": {
      "title": "Attention Is All You Need",
      "url": "https://arxiv.org/abs/1706.03762"
    }
  },
  {
    "slug": "vision-transformer",
    "title": "Vision Transformer (ViT)",
    "family": "Transformers",
    "summary": "Transform an image into patch tokens, add a class token and position embeddings, then reason about encoder input layout.",
    "prerequisites": "Requires understanding of tokens and Transformer inputs.",
    "ids": [
      "vit-patchify",
      "vit-class-token",
      "attention-split-heads",
      "transformer-prenorm-residual"
    ],
    "reference": {
      "title": "An Image is Worth 16x16 Words",
      "url": "https://arxiv.org/abs/2010.11929"
    }
  },
  {
    "slug": "gan-objectives",
    "title": "GAN & WGAN-GP Objectives",
    "family": "Generative Models",
    "summary": "Treat discriminator, generator and WGAN gradient-penalty terms as separate optimizable quantities.",
    "prerequisites": "Requires logistic losses and elementary vector norms.",
    "ids": [
      "gan-discriminator-bce",
      "gan-generator-nonsaturating",
      "gan-gradient-penalty"
    ],
    "reference": {
      "title": "Generative Adversarial Nets",
      "url": "https://arxiv.org/abs/1406.2661"
    }
  },
  {
    "slug": "diffusion-forward",
    "title": "Diffusion: Forward Process",
    "family": "Generative Models",
    "summary": "Connect beta schedules to cumulative signal retention, direct noisy sampling and epsilon regression.",
    "prerequisites": "Requires basic probability and vector arithmetic.",
    "ids": [
      "diffusion-linear-beta",
      "diffusion-alpha-bar",
      "diffusion-forward-sampling",
      "diffusion-noise-mse"
    ],
    "reference": {
      "title": "Denoising Diffusion Probabilistic Models",
      "url": "https://arxiv.org/abs/2006.11239"
    }
  },
  {
    "slug": "diffusion-reverse",
    "title": "Diffusion: Reverse Sampling",
    "family": "Generative Models",
    "summary": "Separate clean-sample reconstruction, DDPM posterior mean and deterministic DDIM transitions.",
    "prerequisites": "Requires the forward-process definitions of alpha and alpha-bar.",
    "ids": [
      "diffusion-reconstruct-x0",
      "diffusion-ddpm-posterior",
      "diffusion-ddim-deterministic"
    ],
    "reference": {
      "title": "Denoising Diffusion Implicit Models",
      "url": "https://arxiv.org/abs/2010.02502"
    }
  },
  {
    "slug": "diffusion-guidance",
    "title": "Diffusion: Guidance Methods",
    "family": "Generative Models",
    "summary": "Compare classifier-free conditional/unconditional output mixing with classifier-gradient reverse-mean shifts.",
    "prerequisites": "Requires diffusion denoising basics; CFG and classifier guidance are different algorithms.",
    "ids": [
      "diffusion-cfg-epsilon",
      "diffusion-classifier-guidance",
      "flow-cfg-velocity"
    ],
    "reference": {
      "title": "Classifier-Free Diffusion Guidance",
      "url": "https://arxiv.org/abs/2207.12598"
    }
  },
  {
    "slug": "dit-conditioning",
    "title": "DiT: AdaLN & AdaLN-Zero",
    "family": "Generative Models",
    "summary": "Understand how conditional shift/scale enters normalized transformer features and how zero gates preserve a residual identity.",
    "prerequisites": "Requires layer normalization and residual connections.",
    "ids": [
      "foundation-layer-normalization",
      "transformer-prenorm-residual",
      "dit-adaln-modulation",
      "dit-adaln-zero-gate"
    ],
    "reference": {
      "title": "Scalable Diffusion Models with Transformers",
      "url": "https://arxiv.org/abs/2212.09748"
    }
  },
  {
    "slug": "vae-vqvae",
    "title": "VAE & VQ-VAE Components",
    "family": "Generative Models",
    "summary": "Practice continuous latents, KL, discrete codebooks and reconstruction objectives as separate kernels.",
    "prerequisites": "Requires basic probability and squared-error losses.",
    "ids": [
      "vae-reparameterization",
      "vae-standard-normal-kl",
      "vae-beta-objective",
      "vqvae-nearest-code",
      "vqvae-codebook-perplexity",
      "vqvae-quantization-error"
    ],
    "reference": {
      "title": "Neural Discrete Representation Learning",
      "url": "https://arxiv.org/abs/1711.00937"
    }
  },
  {
    "slug": "flow-matching",
    "title": "Flow Matching Components",
    "family": "Generative Models",
    "summary": "Implement probability paths, target velocities, sampling solvers and guidance arithmetic before larger diffusion-Transformer systems.",
    "prerequisites": "Requires numerical ODE intuition.",
    "ids": [
      "flow-linear-interpolation",
      "flow-conditional-velocity",
      "flow-velocity-regression",
      "flow-euler-integration",
      "flow-heun-integration",
      "flow-cfg-velocity"
    ],
    "reference": {
      "title": "Flow Matching for Generative Modeling",
      "url": "https://arxiv.org/abs/2210.02747"
    }
  },
  {
    "slug": "agent-control",
    "title": "Agent Control & Reliability",
    "family": "Applied Systems",
    "summary": "Learn basic control rules, trace validity and tool boundaries before attempting multi-agent architectures.",
    "prerequisites": "Requires Python functions and structured data.",
    "ids": [
      "tool-call-parser",
      "agent-retry-guard",
      "react-trace-validator",
      "agent-reflection-controller"
    ],
    "reference": {
      "title": "ReAct",
      "url": "https://arxiv.org/abs/2210.03629"
    }
  },
  {
    "slug": "state-estimation",
    "title": "World Models: States & Beliefs",
    "family": "Applied Systems",
    "summary": "Start world modeling with state estimates, Markov transitions and Bayesian belief updates.",
    "prerequisites": "Requires probability and dynamical state definitions.",
    "ids": [
      "kalman-scalar-update",
      "linear-dynamics-rollout",
      "world-discrete-bayes-filter",
      "world-belief-propagation"
    ],
    "reference": {
      "title": "World Models & Spatial Intelligence",
      "url": "https://overdued.github.io/world-model-spatial-intelligence-course/"
    }
  }
,
{
  "slug": "cnn-convolutions",
  "title": "CNN: Convolution and Channel Mixing",
  "family": "Foundations",
  "summary": "Implement valid/same spatial kernels and 1×1 channel projection without external libraries.",
  "prerequisites": "Matrix multiplication and nested loops.",
  "ids": [
    "cnn-valid-convolution",
    "cnn-zero-padded-convolution",
    "cnn-pointwise-projection"
  ],
  "reference": {
    "title": "Gradient-Based Learning Applied to Document Recognition",
    "url": "https://ieeexplore.ieee.org/document/726791"
  }
},
{
  "slug": "cnn-pooling",
  "title": "CNN: Spatial Pooling",
  "family": "Foundations",
  "summary": "Compare stride-2 max and average pooling, including incomplete border handling.",
  "prerequisites": "2D array indexing and local kernels.",
  "ids": [
    "cnn-max-pooling",
    "cnn-average-pooling"
  ],
  "reference": {
    "title": "Gradient-Based Learning Applied to Document Recognition",
    "url": "https://ieeexplore.ieee.org/document/726791"
  }
},
{
  "slug": "batch-normalization",
  "title": "BatchNorm: Training vs Inference",
  "family": "Foundations",
  "summary": "Compare current-batch feature statistics with frozen running statistics.",
  "prerequisites": "Mean, variance and per-feature affine transformations.",
  "ids": [
    "norm-batch-training",
    "norm-batch-inference"
  ],
  "reference": {
    "title": "Batch Normalization",
    "url": "https://arxiv.org/abs/1502.03167"
  }
},
{
  "slug": "rms-normalization",
  "title": "RMSNorm: Core and Gain",
  "family": "Foundations",
  "summary": "Separate root-mean-square normalization from learned elementwise gain and from LayerNorm.",
  "prerequisites": "Featurewise normalization and epsilon stability.",
  "ids": [
    "foundation-layer-normalization",
    "norm-rmsnorm",
    "norm-rmsnorm-gain"
  ],
  "reference": {
    "title": "Root Mean Square Layer Normalization",
    "url": "https://arxiv.org/abs/1910.07467"
  }
},
{
  "slug": "gradient-backpropagation",
  "title": "Backpropagation and Gradient Checking",
  "family": "Foundations",
  "summary": "Derive gradients for activations, affine layers and MSE; verify derivatives numerically.",
  "prerequisites": "Single-variable calculus and basic matrices.",
  "ids": [
    "autograd-linear-forward",
    "autograd-mse-gradient",
    "autograd-relu-backward",
    "autograd-linear-backward",
    "autograd-central-difference"
  ],
  "reference": {
    "title": "Learning Representations by Back-propagating Errors",
    "url": "https://www.nature.com/articles/323533a0"
  }
},
{
  "slug": "sgd-and-gradient-clipping",
  "title": "SGD Momentum and Gradient Clipping",
  "family": "Foundations",
  "summary": "Control gradient scale and carry optimizer velocity between steps.",
  "prerequisites": "Derivatives and vector norms.",
  "ids": [
    "optimizer-sgd-momentum",
    "optimizer-global-norm-clipping"
  ],
  "reference": {
    "title": "Adam: A Method for Stochastic Optimization",
    "url": "https://arxiv.org/abs/1412.6980"
  }
},
{
  "slug": "adam-and-adamw",
  "title": "Adam and AdamW Optimizers",
  "family": "Foundations",
  "summary": "Isolate moment bias correction from parameter updates and decoupled weight decay.",
  "prerequisites": "SGD, moment estimates and square roots.",
  "ids": [
    "optimizer-sgd-momentum",
    "optimizer-adam-bias-correction",
    "optimizer-adamw-update"
  ],
  "reference": {
    "title": "Decoupled Weight Decay Regularization",
    "url": "https://arxiv.org/abs/1711.05101"
  }
},
{
  "slug": "rope-rotary-position",
  "title": "RoPE: Rotary Position Embeddings",
  "family": "Transformers",
  "summary": "Rotate a pair, then apply position and frequency-dependent rotations across tokens.",
  "prerequisites": "Radians, trigonometry and attention channel layouts.",
  "ids": [
    "rope-rotate-pair",
    "rope-position-encoding"
  ],
  "reference": {
    "title": "RoFormer",
    "url": "https://arxiv.org/abs/2104.09864"
  }
},
{
  "slug": "swiglu-gating",
  "title": "SwiGLU Gated Activations",
  "family": "Transformers",
  "summary": "Differentiate SiLU gating from ordinary sigmoid gating in a Transformer feedforward path.",
  "prerequisites": "Sigmoid, multiplication and numerically stable exponentials.",
  "ids": [
    "foundation-gelu",
    "transformer-swiglu"
  ],
  "reference": {
    "title": "GLU Variants Improve Transformer",
    "url": "https://arxiv.org/abs/2002.05202"
  }
},
{
  "slug": "attention-padding-masks",
  "title": "Attention Key Padding Masks",
  "family": "Transformers",
  "summary": "Practice padding-key filtering separately from causal masking.",
  "prerequisites": "Basic attention scores and masked softmax.",
  "ids": [
    "attention-causal-mask",
    "attention-key-padding-mask"
  ],
  "reference": {
    "title": "Attention Is All You Need",
    "url": "https://arxiv.org/abs/1706.03762"
  }
},
{
  "slug": "ddpm-reverse-sampling",
  "title": "DDPM Reverse Sampling",
  "family": "Generative Models",
  "summary": "Distinguish posterior mean calculation from variance-scaled reverse Gaussian sampling.",
  "prerequisites": "DDPM forward schedule and x0 reconstruction.",
  "ids": [
    "diffusion-alpha-bar",
    "diffusion-ddpm-posterior",
    "diffusion-ddpm-stochastic-step"
  ],
  "reference": {
    "title": "Denoising Diffusion Probabilistic Models",
    "url": "https://arxiv.org/abs/2006.11239"
  }
},
{
  "slug": "gan-loss-derivatives",
  "title": "GAN Discriminator Gradients",
  "family": "Generative Models",
  "summary": "Derive logistic-loss logit gradients separately from discriminator and generator scalar objectives.",
  "prerequisites": "Sigmoid and binary classification losses.",
  "ids": [
    "gan-discriminator-bce",
    "gan-discriminator-logit-gradients",
    "gan-generator-nonsaturating"
  ],
  "reference": {
    "title": "Generative Adversarial Nets",
    "url": "https://arxiv.org/abs/1406.2661"
  }
}
];
