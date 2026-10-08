// Purpose-built practice sequences; each set links only to already published, tested exercises.
export const practiceSets = [
  {
    slug:'agent-execution-reliability',
    title:'Agent Execution & Reliability',
    subtitle:'A practical sequence for building deterministic control and tool boundaries around an AI agent.',
    audience:'For developers building tool-using assistants and workflow agents.',
    outcomes:['Validate the shape of tool requests before dispatch.','Enforce sound event transitions and an explicit retry budget.','Recognize when tasks have unmet dependencies and when iterative feedback should stop.'],
    segments:[
      {id:'tool-call-parser',note:'Start at the trust boundary: malformed model output must not become an executed tool request.'},
      {id:'tool-schema-enforcer',note:'Validate known tool names, exact argument keys and Python types.'},
      {id:'agent-retry-guard',note:'Prevent unbounded tool retries even when the upstream model keeps proposing the same action.'},
      {id:'react-trace-validator',note:'Model the reasoning/action/observation trace as an explicit state machine.'},
      {id:'agent-plan-ready',note:'Find independent tasks ready to execute under prerequisite constraints.'},
      {id:'agent-reflection-controller',note:'Decide when another feedback-guided iteration is worth the cost.'}
    ],
    caution:'These problems target the deterministic software layer of agents. They do not run a language model or claim to reproduce the full ReAct or Reflexion training methods.'
  },
  {
    slug:'world-model-planning',
    title:'World Model Planning & Control',
    subtitle:'Progress from predicting states to selecting actions under a dynamics model.',
    audience:'For model-based RL, robotics and spatial-intelligence learners.',
    outcomes:['Estimate state under noisy observations.','Distinguish open-loop predictions from receding-horizon control.','Implement a categorical CEM update and an uncertainty-aware action rule.'],
    segments:[
      {id:'kalman-scalar-update',note:'Start with a transparent analytical estimate of an uncertain state.'},
      {id:'linear-dynamics-rollout',note:'Apply sequential transitions to imagine a candidate future.'},
      {id:'world-model-action',note:'Evaluate action alternatives using entire predicted cost sequences.'},
      {id:'mpc-first-action',note:'Roll out full candidate plans but commit only to the first action.'},
      {id:'cem-categorical-update',note:'Fit per-time-step action distributions to elite trajectories.'},
      {id:'risk-sensitive-planner',note:'Change decisions when model uncertainty becomes costly.'}
    ],
    caution:'This is lightweight model-based planning with known dynamics and deterministic tests; not a full learned RSSM, video world model or GPU training environment.'
  },
  {
    slug:'ai-evaluation-and-failures',
    title:'AI Evaluation: Beyond a Single Accuracy Number',
    subtitle:'Understand why success depends on downstream behavior, not only local proxy scores.',
    audience:'For researchers benchmarking retrieval, planning or agent execution.',
    outcomes:['Separate retrieval metrics from generated-answer quality.','Score planning decisions with regret under ground-truth costs.','Construct model comparisons where better prediction error does not imply better decisions.'],
    segments:[
      {id:'rag-recall-k',note:'See how a retrieval metric focuses on relevant evidence coverage.'},
      {id:'world-model-evaluation',note:'Measure regret of an action selected with predicted costs.'},
      {id:'prediction-vs-decision',note:'Compare two models by both MSE and downstream planning regret.'},
      {id:'agent-reflection-controller',note:'Use explicit feedback and stopping rules instead of textual assertions of success.'}
    ],
    caution:'Toy metrics do not replace held-out real-environment evaluation. Report task-level outcomes and uncertainty when moving from exercises to scientific claims.'
  },
  {
    slug:'agent-coordination-and-faults',
    title:'Agent Orchestration & Fault Tolerance',
    subtitle:'Practice task scheduling, out-of-order tool replies, retry backoff and RPC envelopes without depending on an LLM API.',
    audience:'For builders working with concurrent tool-using agents.',
    outcomes:['Schedule dependent tasks deterministically while detecting cycles.','Merge parallel tool results by correlation ID.','Implement bounded retry delays and distinguish remote errors from malformed envelopes.'],
    segments:[
      {id:'agent-topological-schedule',note:'Resolve dependencies with a deterministic topological scheduler.'},
      {id:'agent-merge-tool-results',note:'Keep tool responses in dispatch order even when execution finishes out of order.'},
      {id:'agent-exponential-backoff',note:'Plan retry delays without performing sleep or remote calls.'},
      {id:'agent-jsonrpc-response',note:'Validate a simplified JSON-RPC 2.0 response envelope.'}
    ],
    caution:'The JSON-RPC exercise covers a minimal envelope, not the entire Model Context Protocol specification or its lifecycle.'
  },
  {
    slug:'world-model-belief-and-dynamics',
    title:'World Model Beliefs & Latent Dynamics',
    subtitle:'Build foundations for belief state updates, stochastic dynamics, open-loop errors and Gaussian latent distributions.',
    audience:'For model-based RL and robotics developers who want reproducible numerical exercises.',
    outcomes:['Perform Bayesian prediction and observation updates.','Propagate moments through uncertain transitions.','Measure how rollout errors accumulate with horizon.','Calculate diagonal-Gaussian KL divergence for a probabilistic latent state.'],
    segments:[
      {id:'kalman-scalar-update',note:'Review the simplest closed-form Gaussian observation update.'},
      {id:'world-discrete-bayes-filter',note:'Update discrete belief states under a transition matrix and an observation likelihood.'},
      {id:'world-belief-propagation',note:'Propagate a Gaussian mean and variance over actions.'},
      {id:'world-rollout-error-curve',note:'Inspect multi-step rollout error across horizons.'},
      {id:'world-diagonal-gaussian-kl',note:'Compute the core KL term used in probabilistic latent modeling.'}
    ],
    caution:'These small numerical components do not claim to implement a full RSSM, Dreamer or interactive visual World Model.'
  },
  {
    slug:'llm-retrieval-decoding',
    title:'LLM Retrieval & Decoding Mechanics',
    subtitle:'Learn ranking-sensitive retrieval metrics, evidence packing and stable token probability transforms.',
    audience:'For retrieval and LLM inference engineers.',
    outcomes:['Compare Recall@K with MRR.','Assemble evidence under a token budget.','Use stable softmax after deterministic top-k token filtering.'],
    segments:[
      {id:'rag-recall-k',note:'Measure the fraction of relevant evidence recovered by top-K retrieval.'},
      {id:'llm-mean-reciprocal-rank',note:'Score the rank of the first relevant result.'},
      {id:'llm-evidence-context-pack',note:'Pack a strict prefix of ranked evidence under a budget.'},
      {id:'stable-softmax',note:'Avoid exponential overflow in a full softmax.'},
      {id:'llm-topk-softmax',note:'Renormalize probabilities after top-k vocabulary filtering.'}
    ],
    caution:'These exercises do not call real LLM endpoints or measure deployed systems against a benchmark.'
  },
  {
    slug:'rl-control-basics',
    title:'RL Policy & Return Essentials',
    subtitle:'Two fully tested reinforcement-learning primitives used before model-based planning.',
    audience:'For beginners preparing to work with learned world models and policy evaluation.',
    outcomes:['Implement reproducible exploration versus exploitation.','Handle episode termination while computing discounted bootstrapped returns.'],
    segments:[
      {id:'foundation-epsilon-greedy',note:'Inject random draws into an epsilon-greedy action chooser for deterministic testing.'},
      {id:'foundation-nstep-return',note:'Compute n-step returns without bootstrapping beyond a terminal state.'}
    ],
    caution:'These are isolated RL components, not full policy optimization or environment training tasks.'
  }

  ,{
    slug:'video-vae-latent-compression',
    title:'Video Representation: VAE and VQ-VAE',
    subtitle:'Implement reconstruction losses, Gaussian VAE sampling, and vector-quantized video latent components.',
    audience:'For learners preparing to implement a small video tokenizer or variational autoencoder.',
    outcomes:['Compute reconstruction and latent regularization objectives with explicit reductions.', 'Map continuous latents into a discrete VQ codebook and diagnose usage.', 'Flatten and temporal-patch a sequence of visual latent tokens.'],
    segments:[
      {id:'video-frame-mse',note:'Define an exact reconstruction loss across video pixels.'},
      {id:'vae-reparameterization',note:'Draw a latent using fixed epsilon and log variance.'},
      {id:'vae-standard-normal-kl',note:'Calculate KL regularization without conflating variance and log variance.'},
      {id:'vae-beta-objective',note:'Combine differently reduced reconstruction and KL losses.'},
      {id:'vqvae-nearest-code',note:'Assign each latent to a codebook vector by squared Euclidean distance.'},
      {id:'vqvae-quantization-error',note:'Measure quantization distortion; gradients remain out of scope.'},
      {id:'vqvae-codebook-perplexity',note:'Detect collapsed code usage using exponential entropy.'},
      {id:'video-latent-sequence',note:'Create a sequence for a discrete latent-video prior.'},
      {id:'video-temporal-patchify',note:'Compress time into nonoverlapping temporal feature patches.'}
    ],
    caution:'These exercises implement component arithmetic, not neural training, backpropagation, encoder-decoder networks, or complete VideoGPT.'
  },{
    slug:'flow-matching-ode-practice',
    title:'Flow Matching: Paths, Velocities & ODE Solvers',
    subtitle:'Practice conditional interpolation, vector-field training targets and numerical sampling.',
    audience:'For students implementing flow-matching and rectified-flow model internals.',
    outcomes:['Differentiate a straight-line conditional probability path.', 'Compute a supervised velocity loss.', 'Compare explicit Euler and Heun integration and apply guidance.'],
    segments:[
      {id:'flow-linear-interpolation',note:'Construct noise-to-data interpolated inputs.'},
      {id:'flow-conditional-velocity',note:'Derive the target conditional velocity for straight-line paths.'},
      {id:'flow-velocity-regression',note:'Regress a velocity prediction rather than output pixels.'},
      {id:'flow-euler-integration',note:'Implement explicit Euler ODE sampling on the unit interval.'},
      {id:'flow-heun-integration',note:'Use a two-slope numerical integrator for improved accuracy.'},
      {id:'flow-cfg-velocity',note:'Combine unconditional and conditional vector-field predictions.'}
    ],
    caution:'Scalar ODE examples and supplied velocity functions are educational kernels, not full-scale DiT video training or GPU inference.'
  },{
    slug:'video-dynamics-and-temporal-prediction',
    title:'Video World Models: Time, Actions & Prediction',
    subtitle:'Connect frame-to-frame signals, action-conditioned futures and discrete video-token priors.',
    audience:'For developers studying action-conditioned video generation and latent predictive world models.',
    outcomes:['Compute frame and motion reconstruction metrics.', 'Roll out action-conditioned latent dynamics.', 'Build causal contexts and token negative log-likelihood for video priors.'],
    segments:[
      {id:'video-temporal-velocity',note:'Extract local temporal changes from observed frame features.'},
      {id:'video-temporal-difference-loss',note:'Compare predicted motion with ground-truth motion.'},
      {id:'video-action-conditioned-rollout',note:'Propagate a surrogate latent state conditioned on actions.'},
      {id:'video-causal-token-context',note:'Prevent leakage when forming autoregressive token contexts.'},
      {id:'video-token-cross-entropy',note:'Evaluate next-token likelihood from discrete code probabilities.'},
      {id:'world-rollout-error-curve',note:'Connect video-related components to long-horizon prediction drift.'}
    ],
    caution:'These are deterministic building blocks; perceptual FVD, 3D video VAE training, DiT-based sampling and interactive closed-loop video environments require more compute and separate benchmarks.'
  }
,
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
,
{
  "slug": "cnn-and-pooling",
  "title": "CNN Convolution and Pooling From Scratch",
  "subtitle": "Build a small stack of spatial kernels and downsampling operations.",
  "audience": "For developers moving from matrix operations to convolutional image models.",
  "outcomes": [
    "Implement valid/same padding convolution correctly.",
    "Project channels with 1×1 kernels.",
    "Differentiate max and average pooling."
  ],
  "segments": [
    {
      "id": "foundation-matmul",
      "note": "Review the structure of a dimension-reducing sum."
    },
    {
      "id": "cnn-valid-convolution",
      "note": "Slide a kernel without padding."
    },
    {
      "id": "cnn-zero-padded-convolution",
      "note": "Add explicit zero-padding semantics."
    },
    {
      "id": "cnn-pointwise-projection",
      "note": "Mix channels but preserve spatial resolution."
    },
    {
      "id": "cnn-max-pooling",
      "note": "Choose the maximum in each window."
    },
    {
      "id": "cnn-average-pooling",
      "note": "Average each non-overlapping local window."
    }
  ],
  "caution": "These are CPU list-based kernels, not a GPU library or trained CNN."
},
{
  "slug": "normalization-and-gradients",
  "title": "BatchNorm, RMSNorm and Manual Backprop",
  "subtitle": "Work through normalization modes and manual derivatives with deterministic numeric tests.",
  "audience": "For learners who want to understand what autograd frameworks compute.",
  "outcomes": [
    "Differentiate BatchNorm training and inference.",
    "Compare centered and uncentered normalization.",
    "Backpropagate through a linear map and validate numerical derivatives."
  ],
  "segments": [
    {
      "id": "foundation-layer-normalization",
      "note": "Start from mean/variance across features."
    },
    {
      "id": "norm-batch-training",
      "note": "Normalize features across the mini-batch."
    },
    {
      "id": "norm-batch-inference",
      "note": "Use stored running statistics."
    },
    {
      "id": "norm-rmsnorm",
      "note": "Normalize without mean subtraction."
    },
    {
      "id": "norm-rmsnorm-gain",
      "note": "Apply a learned per-feature gain."
    },
    {
      "id": "autograd-linear-forward",
      "note": "Implement Wx+b."
    },
    {
      "id": "autograd-mse-gradient",
      "note": "Differentiate mean squared error."
    },
    {
      "id": "autograd-relu-backward",
      "note": "Apply an activation Jacobian."
    },
    {
      "id": "autograd-linear-backward",
      "note": "Compute all affine gradients."
    },
    {
      "id": "autograd-central-difference",
      "note": "Numerically validate one derivative."
    }
  ],
  "caution": "Exercises work at scalar/list scale and do not replace vectorized training or framework autograd."
},
{
  "slug": "sgd-adam-optimization",
  "title": "Optimization: Momentum, Adam and AdamW",
  "subtitle": "Trace gradient scaling, moment estimators and decoupled decay one step at a time.",
  "audience": "For learners implementing optimizers rather than copying a library call.",
  "outcomes": [
    "Clip gradients by global L2 norm.",
    "Apply classical momentum SGD.",
    "Separate Adam moment bias correction from a full AdamW update."
  ],
  "segments": [
    {
      "id": "autograd-mse-gradient",
      "note": "Compute a loss gradient."
    },
    {
      "id": "optimizer-global-norm-clipping",
      "note": "Bound the norm without altering direction."
    },
    {
      "id": "optimizer-sgd-momentum",
      "note": "Maintain velocity between steps."
    },
    {
      "id": "optimizer-adam-bias-correction",
      "note": "Correct zero-initialized first/second moments."
    },
    {
      "id": "optimizer-adamw-update",
      "note": "Apply a full decoupled AdamW scalar parameter step."
    }
  ],
  "caution": "Update rules are explicit variants; AdamW task is scalar to make test expectations transparent."
},
{
  "slug": "rope-swiglu-transformer-details",
  "title": "Transformer Details: RoPE, SwiGLU and Padding Masks",
  "subtitle": "Practice overlooked building blocks between attention mathematics and deployed Transformer architectures.",
  "audience": "For learners with introductory Attention and ViT experience.",
  "outcomes": [
    "Apply per-pair and per-position rotary embeddings.",
    "Use stable SwiGLU gating.",
    "Differentiate key padding and causal masking."
  ],
  "segments": [
    {
      "id": "attention-scaled-dot-product",
      "note": "Understand attention scores."
    },
    {
      "id": "attention-causal-mask",
      "note": "Block future token positions."
    },
    {
      "id": "attention-key-padding-mask",
      "note": "Block padded key positions."
    },
    {
      "id": "rope-rotate-pair",
      "note": "Rotate one 2D pair."
    },
    {
      "id": "rope-position-encoding",
      "note": "Apply interleaved rotary frequencies across tokens."
    },
    {
      "id": "transformer-swiglu",
      "note": "Implement the gated MLP activation branch."
    }
  ],
  "caution": "These kernels use one explicitly stated RoPE convention and do not form a pretrained attention model."
}
];
