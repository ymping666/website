// v0.8 original CPU-only component problems; not complete model-training tasks.
export const videoProblems = [
  {
    "id": "video-frame-mse",
    "number": 31,
    "track": "Video World Models",
    "difficulty": "Easy",
    "title": "Compute Pixel Reconstruction MSE",
    "duration": "12 min",
    "tags": [
      "Video",
      "Reconstruction",
      "Loss"
    ],
    "description": "A video decoder reconstructs a sequence of flat, equally sized frames. Implement the mean squared error over all pixels in all frames.",
    "requirements": [
      "pred and target are equal-shape lists of frames; each frame is a nonempty list of finite floats. The outer lists may both be empty.",
      "Return the sum of squared pixel differences divided by the TOTAL number of pixels across all frames.",
      "Return 0.0 for two empty videos. Do not modify either video."
    ],
    "signature": "video_reconstruction_mse(pred, target)",
    "starter": "def video_reconstruction_mse(pred, target):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "def video_reconstruction_mse(pred, target):\n    total = sum((a-b)**2 for pa,ta in zip(pred,target) for a,b in zip(pa,ta))\n    count = sum(len(frame) for frame in pred)\n    return total / count if count else 0.0",
    "explanation": [
      "Flattening the video into pixels gives a transparent reconstruction objective independent of tensor library.",
      "Normalize by the number of scalar pixel values; treating each frame equally can differ if widths vary.",
      "This objective measures pointwise fidelity, not perceptual or temporal quality."
    ],
    "complexity": "O(P) time over P pixels and O(1) additional space.",
    "pitfall": "Dividing by the number of frames instead of pixels changes the loss scale.",
    "hints": [
      "Accumulate squared differences across both nesting levels.",
      "Count scalar pixels, not frames."
    ],
    "references": [
      {
        "title": "Auto-Encoding Variational Bayes (Kingma & Welling)",
        "url": "https://arxiv.org/abs/1312.6114"
      },
      {
        "title": "VideoGPT: Video Generation using VQ-VAE and Transformers",
        "url": "https://arxiv.org/abs/2104.10157"
      }
    ],
    "tests": [
      {
        "name": "Two frames",
        "code": "assert abs(video_reconstruction_mse([[0,1],[2,3]],[[0,0],[2,5]]) - (1.25)) < 1e-9"
      },
      {
        "name": "Single pixel",
        "code": "assert abs(video_reconstruction_mse([[5]],[[2]]) - (9)) < 1e-9"
      },
      {
        "name": "All equal",
        "code": "assert abs(video_reconstruction_mse([[0,0],[1,2]],[[0,0],[1,2]]) - (0)) < 1e-9"
      },
      {
        "name": "Empty sequence",
        "code": "assert abs(video_reconstruction_mse([],[]) - (0)) < 1e-9"
      },
      {
        "name": "Different frame widths",
        "code": "assert abs(video_reconstruction_mse([[0],[1,2]],[[2],[1,4]]) - (8/3)) < 1e-9"
      },
      {
        "name": "Input preserved",
        "code": "p=[[0,1]]; t=[[2,3]]; video_reconstruction_mse(p,t); assert p==[[0,1]] and t==[[2,3]]"
      }
    ]
  },
  {
    "id": "video-temporal-velocity",
    "number": 32,
    "track": "Video World Models",
    "difficulty": "Easy",
    "title": "Compute Frame-to-Frame Difference Vectors",
    "duration": "12 min",
    "tags": [
      "Video",
      "Temporal Dynamics",
      "Features"
    ],
    "description": "For a sequence of latent frame feature vectors, estimate discrete temporal changes between adjacent observations.",
    "requirements": [
      "frames is a list of equal-length lists of finite floats; vectors may be empty.",
      "Return vectors frames[t+1] - frames[t] for every adjacent frame pair, preserving coordinate order.",
      "If fewer than two frames exist, return []. Do not mutate the input."
    ],
    "signature": "frame_deltas(frames)",
    "starter": "def frame_deltas(frames):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "def frame_deltas(frames):\n    return [[b-a for a,b in zip(old,new)] for old,new in zip(frames,frames[1:])]",
    "explanation": [
      "Finite differences approximate temporal motion in latent features.",
      "Adjacent changes retain the time order and can be used as simple velocity-like features.",
      "This is NOT optical flow between image pixels and does not encode geometry by itself."
    ],
    "complexity": "O(TD) time and O(TD) output for T frames of dimension D.",
    "pitfall": "Subtracting the last frame from the first gives displacement, not every local transition.",
    "hints": [
      "Use zip(frames, frames[1:]).",
      "Subtract each coordinate old from new."
    ],
    "references": [
      {
        "title": "VideoGPT: Video Generation using VQ-VAE and Transformers",
        "url": "https://arxiv.org/abs/2104.10157"
      },
      {
        "title": "World Models & Spatial Intelligence — Video World Models map",
        "url": "https://overdued.github.io/world-model-spatial-intelligence-course/"
      }
    ],
    "tests": [
      {
        "name": "Two frames",
        "code": "assert frame_deltas([[1,2],[4,0]]) == [[3,-2]]"
      },
      {
        "name": "Three frames",
        "code": "assert frame_deltas([[1],[3],[8]]) == [[2],[5]]"
      },
      {
        "name": "Single frame",
        "code": "assert frame_deltas([[1,2]]) == []"
      },
      {
        "name": "Empty frames",
        "code": "assert frame_deltas([]) == []"
      },
      {
        "name": "Zero dimensional",
        "code": "assert frame_deltas([[],[]]) == [[]]"
      },
      {
        "name": "Input preserved",
        "code": "x=[[1],[2]]; frame_deltas(x); assert x==[[1],[2]]"
      }
    ]
  },
  {
    "id": "vae-reparameterization",
    "number": 33,
    "track": "Video World Models",
    "difficulty": "Medium",
    "title": "Apply the Gaussian VAE Reparameterization",
    "duration": "16 min",
    "tags": [
      "VAE",
      "Latent Variables",
      "Gaussian"
    ],
    "description": "Implement the deterministic arithmetic inside the VAE reparameterization trick using a provided epsilon sample, without random draws.",
    "requirements": [
      "mean, logvar and epsilon are equal-length lists of finite floats; empty lists are allowed.",
      "For each dimension return mean[i] + exp(0.5 * logvar[i]) * epsilon[i].",
      "Use the supplied epsilon exactly; never sample randomness or modify inputs."
    ],
    "signature": "vae_sample(mean, logvar, epsilon)",
    "starter": "def vae_sample(mean, logvar, epsilon):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\n\ndef vae_sample(mean, logvar, epsilon):\n    return [m + math.exp(0.5*lv)*e for m,lv,e in zip(mean,logvar,epsilon)]",
    "explanation": [
      "A VAE encoder returns distribution parameters rather than directly sampling an independent latent.",
      "Standard deviation equals exp(logvar / 2), not exp(logvar).",
      "Keeping epsilon fixed makes the arithmetic deterministic and testable in a browser-only judge."
    ],
    "complexity": "O(D) time and O(D) output for D latent dimensions.",
    "pitfall": "Multiplying by exp(logvar) uses variance, not standard deviation.",
    "hints": [
      "Compute standard deviation from log-variance.",
      "Multiply by epsilon, then add the mean."
    ],
    "references": [
      {
        "title": "Auto-Encoding Variational Bayes (Kingma & Welling)",
        "url": "https://arxiv.org/abs/1312.6114"
      }
    ],
    "tests": [
      {
        "name": "Unit variance",
        "code": "assert vae_sample([1,2],[0,0],[3,-2]) == [4.0,0.0]"
      },
      {
        "name": "Variance four",
        "code": "assert abs(vae_sample([0],[math.log(4)],[1])[0] - (2)) < 1e-9"
      },
      {
        "name": "Zero epsilon",
        "code": "assert vae_sample([3],[20],[0]) == [3.0]"
      },
      {
        "name": "Two dimensions",
        "code": "r=vae_sample([0,1],[0,math.log(9)],[-2,2]); assert abs(r[0]+2)<1e-9 and abs(r[1]-7)<1e-9"
      },
      {
        "name": "Empty",
        "code": "assert vae_sample([],[],[]) == []"
      },
      {
        "name": "No input mutation",
        "code": "m=[1.]; lv=[0.]; z=[2.]; vae_sample(m,lv,z); assert m==[1.] and lv==[0.] and z==[2.]"
      }
    ]
  },
  {
    "id": "vae-standard-normal-kl",
    "number": 34,
    "track": "Video World Models",
    "difficulty": "Medium",
    "title": "Compute VAE KL to a Standard Normal",
    "duration": "17 min",
    "tags": [
      "VAE",
      "KL Divergence",
      "Regularization"
    ],
    "description": "Compute the diagonal-Gaussian KL divergence between q(z|x)=N(mu,diag(exp(logvar))) and a standard-normal prior.",
    "requirements": [
      "mu and logvar are equal-length lists of finite floats, representing independent latent dimensions.",
      "Return 0.5 * sum(exp(logvar[i]) + mu[i]**2 - 1 - logvar[i]).",
      "Return 0.0 for empty vectors. Do not clamp intermediate values or alter the input."
    ],
    "signature": "vae_kl_standard_normal(mu, logvar)",
    "starter": "def vae_kl_standard_normal(mu, logvar):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\n\ndef vae_kl_standard_normal(mu, logvar):\n    return 0.5 * sum(math.exp(lv) + m*m - 1 - lv for m,lv in zip(mu,logvar))",
    "explanation": [
      "The closed-form Gaussian KL is the regularization term of a conventional VAE ELBO.",
      "Use a SUM across latent dimensions for each sample here; batch averaging is outside this exercise.",
      "A zero value indicates the approximate posterior matches the unit Gaussian prior."
    ],
    "complexity": "O(D) time and O(1) additional space.",
    "pitfall": "Replacing exp(logvar) with logvar confuses variance and its logarithm.",
    "hints": [
      "Variance is exp(logvar).",
      "Add variance, squared mean, minus one, minus log-variance."
    ],
    "references": [
      {
        "title": "Auto-Encoding Variational Bayes (Kingma & Welling)",
        "url": "https://arxiv.org/abs/1312.6114"
      }
    ],
    "tests": [
      {
        "name": "Matching prior",
        "code": "assert abs(vae_kl_standard_normal([0,0],[0,0]) - (0)) < 1e-9"
      },
      {
        "name": "Nonzero mean",
        "code": "assert abs(vae_kl_standard_normal([2],[0]) - (2)) < 1e-9"
      },
      {
        "name": "Nonunit variance",
        "code": "assert abs(vae_kl_standard_normal([0],[math.log(4)]) - (0.5*(4-1-math.log(4)))) < 1e-9"
      },
      {
        "name": "Two dims",
        "code": "assert abs(vae_kl_standard_normal([1,2],[0,0]) - (2.5)) < 1e-9"
      },
      {
        "name": "Empty",
        "code": "assert abs(vae_kl_standard_normal([],[]) - (0)) < 1e-9"
      },
      {
        "name": "Positive example",
        "code": "assert vae_kl_standard_normal([0],[-1]) > 0"
      }
    ]
  },
  {
    "id": "vae-beta-objective",
    "number": 35,
    "track": "Video World Models",
    "difficulty": "Easy",
    "title": "Combine Reconstruction and Beta-VAE KL Loss",
    "duration": "14 min",
    "tags": [
      "VAE",
      "ELBO",
      "Loss"
    ],
    "description": "A simplified beta-VAE training loss balances reconstruction and latent KL regularization for one sample.",
    "requirements": [
      "reconstruction is a list of nonnegative finite PER-PIXEL squared errors, possibly empty.",
      "kl_per_dim is a list of nonnegative per-latent KL contributions; beta is a finite nonnegative float.",
      "Return mean(reconstruction), or 0.0 if empty, PLUS beta * sum(kl_per_dim)."
    ],
    "signature": "beta_vae_loss(reconstruction, kl_per_dim, beta)",
    "starter": "def beta_vae_loss(reconstruction, kl_per_dim, beta):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "def beta_vae_loss(reconstruction, kl_per_dim, beta):\n    recon = sum(reconstruction)/len(reconstruction) if reconstruction else 0.0\n    return recon + beta*sum(kl_per_dim)",
    "explanation": [
      "The reconstruction term here uses a mean over scalar pixel losses by design.",
      "The KL term is a sum across latent dimensions, then weighted by beta.",
      "Actual VAEs may use Bernoulli NLL, Gaussian NLL and differing reduction conventions; keep the contract explicit."
    ],
    "complexity": "O(P+D) time and O(1) additional space.",
    "pitfall": "Taking a mean over KL dimensions changes the specified weighting when latent dimension changes.",
    "hints": [
      "Compute reconstruction mean separately.",
      "Add beta times the KL sum."
    ],
    "references": [
      {
        "title": "Auto-Encoding Variational Bayes (Kingma & Welling)",
        "url": "https://arxiv.org/abs/1312.6114"
      }
    ],
    "tests": [
      {
        "name": "Typical loss",
        "code": "assert abs(beta_vae_loss([1,3],[0.5,0.25],2) - (3.5)) < 1e-9"
      },
      {
        "name": "Zero beta",
        "code": "assert abs(beta_vae_loss([4,0],[7],0) - (2)) < 1e-9"
      },
      {
        "name": "Empty reconstruction",
        "code": "assert abs(beta_vae_loss([],[1,2],0.5) - (1.5)) < 1e-9"
      },
      {
        "name": "Empty KL",
        "code": "assert abs(beta_vae_loss([2,4],[],10) - (3)) < 1e-9"
      },
      {
        "name": "Both empty",
        "code": "assert abs(beta_vae_loss([],[],1) - (0)) < 1e-9"
      },
      {
        "name": "Pixel average",
        "code": "assert abs(beta_vae_loss([1,1,10],[],1) - (4)) < 1e-9"
      }
    ]
  },
  {
    "id": "vqvae-nearest-code",
    "number": 36,
    "track": "Video World Models",
    "difficulty": "Medium",
    "title": "Find the Nearest VQ-VAE Codebook Entry",
    "duration": "19 min",
    "tags": [
      "VQ-VAE",
      "Quantization",
      "Discrete Latents"
    ],
    "description": "Map a continuous encoder latent vector to the index of its nearest discrete codebook embedding by squared Euclidean distance.",
    "requirements": [
      "vector is a list of D floats; codebook is a nonempty list of D-dimensional float lists. Dimension D may be zero.",
      "Return the zero-based codebook index with the smallest sum((vector[d]-code[d])**2).",
      "On exact ties return the SMALLEST index. Do not mutate the vectors."
    ],
    "signature": "nearest_code_index(vector, codebook)",
    "starter": "def nearest_code_index(vector, codebook):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "def nearest_code_index(vector, codebook):\n    return min(range(len(codebook)), key=lambda i: sum((x-y)**2 for x,y in zip(vector,codebook[i])))",
    "explanation": [
      "The VQ encoder replaces a continuous latent with the closest learned embedding.",
      "Squared Euclidean distance avoids square roots and preserves nearest-neighbor ranking.",
      "Explicit tie breaking ensures stable code indices across runs."
    ],
    "complexity": "O(KD) time and O(1) auxiliary space for K codebook entries of dimension D.",
    "pitfall": "Selecting by vector norm or by coordinate-wise distance independently is not the same as total squared distance.",
    "hints": [
      "Compute one sum of squared differences per code vector.",
      "Use min(range(len(codebook)), key=...) for stable ties."
    ],
    "references": [
      {
        "title": "Neural Discrete Representation Learning (VQ-VAE)",
        "url": "https://arxiv.org/abs/1711.00937"
      },
      {
        "title": "VideoGPT: Video Generation using VQ-VAE and Transformers",
        "url": "https://arxiv.org/abs/2104.10157"
      }
    ],
    "tests": [
      {
        "name": "Basic nearest",
        "code": "assert nearest_code_index([2,0],[[0,0],[3,1],[10,0]]) == 1"
      },
      {
        "name": "Single code",
        "code": "assert nearest_code_index([-2],[[1]]) == 0"
      },
      {
        "name": "Tie picks smallest",
        "code": "assert nearest_code_index([1],[[0],[2],[1.5]]) == 2"
      },
      {
        "name": "Exact tie",
        "code": "assert nearest_code_index([1],[[0],[2]]) == 0"
      },
      {
        "name": "Zero-dimensional vector",
        "code": "assert nearest_code_index([],[[],[]]) == 0"
      },
      {
        "name": "Input unchanged",
        "code": "x=[1]; c=[[0],[2]]; nearest_code_index(x,c); assert x==[1] and c==[[0],[2]]"
      }
    ]
  },
  {
    "id": "vqvae-codebook-perplexity",
    "number": 37,
    "track": "Video World Models",
    "difficulty": "Medium",
    "title": "Compute VQ-VAE Codebook Usage Perplexity",
    "duration": "17 min",
    "tags": [
      "VQ-VAE",
      "Entropy",
      "Codebook Usage"
    ],
    "description": "Measure how evenly a finite VQ codebook is used across encoded video patches using exp(entropy).",
    "requirements": [
      "indices is a list of integer codebook IDs in [0, n_codes), with n_codes a positive integer.",
      "For nonempty indices, p[k] = occurrences(k)/len(indices), and perplexity = exp(-sum(p[k]*log(p[k]) for p[k]>0)).",
      "For empty indices return 0.0. Never evaluate log(0)."
    ],
    "signature": "codebook_perplexity(indices, n_codes)",
    "starter": "def codebook_perplexity(indices, n_codes):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\n\ndef codebook_perplexity(indices, n_codes):\n    if not indices:\n        return 0.0\n    counts = [0]*n_codes\n    for index in indices:\n        counts[index] += 1\n    n = len(indices)\n    return math.exp(-sum((c/n)*math.log(c/n) for c in counts if c))",
    "explanation": [
      "Usage perplexity is the exponentiated entropy of discrete code assignments.",
      "Uniform use of K codes has perplexity K, whereas collapse to one code has perplexity one.",
      "Unused codes contribute zero to entropy and must not cause a logarithm-of-zero error."
    ],
    "complexity": "O(N+K) time and O(K) extra space.",
    "pitfall": "Normalizing by the total configured codebook size instead of assignment count produces the wrong distribution.",
    "hints": [
      "Build a count for each possible code ID.",
      "Ignore zero-probability terms in the entropy sum."
    ],
    "references": [
      {
        "title": "Neural Discrete Representation Learning (VQ-VAE)",
        "url": "https://arxiv.org/abs/1711.00937"
      },
      {
        "title": "VideoGPT: Video Generation using VQ-VAE and Transformers",
        "url": "https://arxiv.org/abs/2104.10157"
      }
    ],
    "tests": [
      {
        "name": "Uniform two codes",
        "code": "assert abs(codebook_perplexity([0,1,0,1],2) - (2)) < 1e-9"
      },
      {
        "name": "Collapsed codebook",
        "code": "assert abs(codebook_perplexity([1,1,1],4) - (1)) < 1e-9"
      },
      {
        "name": "Uniform four codes",
        "code": "assert abs(codebook_perplexity([0,1,2,3],4) - (4)) < 1e-9"
      },
      {
        "name": "One sample",
        "code": "assert abs(codebook_perplexity([3],5) - (1)) < 1e-9"
      },
      {
        "name": "Empty assignment",
        "code": "assert abs(codebook_perplexity([],4) - (0)) < 1e-9"
      },
      {
        "name": "Unused code",
        "code": "assert abs(codebook_perplexity([0,1,0,1],10) - (2)) < 1e-9"
      }
    ]
  },
  {
    "id": "vqvae-quantization-error",
    "number": 38,
    "track": "Video World Models",
    "difficulty": "Easy",
    "title": "Measure VQ Codebook Distortion",
    "duration": "15 min",
    "tags": [
      "VQ-VAE",
      "Distortion",
      "Loss"
    ],
    "description": "Given quantized codebook vectors and encoder outputs, compute the mean squared quantization distortion over all scalar latent coordinates.",
    "requirements": [
      "encoder and quantized are equal-shape lists of vectors, where every vector has identical positive dimension D.",
      "Return sum of squared coordinate differences divided by total coordinates N*D.",
      "If both lists are empty return 0.0. Treat both inputs as fixed arrays; this exercise does not implement stop-gradient."
    ],
    "signature": "quantization_mse(encoder, quantized)",
    "starter": "def quantization_mse(encoder, quantized):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "def quantization_mse(encoder, quantized):\n    count=sum(len(v) for v in encoder)\n    if count==0:\n        return 0.0\n    return sum((a-b)**2 for u,v in zip(encoder,quantized) for a,b in zip(u,v))/count",
    "explanation": [
      "Quantization distortion measures the distance between continuous and selected discrete latents.",
      "The squared distance is related to codebook and commitment losses in VQ-VAE, but their gradient paths differ.",
      "This deterministic loss helper has no backpropagation and makes no claim to implement straight-through gradients."
    ],
    "complexity": "O(ND) time and O(1) extra space.",
    "pitfall": "Replacing squared error with absolute error changes the quantization objective.",
    "hints": [
      "Sum squared differences over all latent coordinates.",
      "Divide by the total number of scalar coordinates."
    ],
    "references": [
      {
        "title": "Neural Discrete Representation Learning (VQ-VAE)",
        "url": "https://arxiv.org/abs/1711.00937"
      }
    ],
    "tests": [
      {
        "name": "Two vectors",
        "code": "assert abs(quantization_mse([[0,2],[2,2]],[[1,0],[2,4]]) - (9/4)) < 1e-9"
      },
      {
        "name": "Perfect codes",
        "code": "assert abs(quantization_mse([[1,2]],[[1,2]]) - (0)) < 1e-9"
      },
      {
        "name": "Single coordinate",
        "code": "assert abs(quantization_mse([[2]],[[5]]) - (9)) < 1e-9"
      },
      {
        "name": "Empty",
        "code": "assert abs(quantization_mse([],[]) - (0)) < 1e-9"
      },
      {
        "name": "Mean over elements",
        "code": "assert abs(quantization_mse([[0],[0],[0]],[[1],[2],[3]]) - (14/3)) < 1e-9"
      }
    ]
  },
  {
    "id": "video-latent-sequence",
    "number": 39,
    "track": "Video World Models",
    "difficulty": "Medium",
    "title": "Flatten Spatiotemporal Video Tokens",
    "duration": "17 min",
    "tags": [
      "Video Tokens",
      "Spatiotemporal",
      "Representation"
    ],
    "description": "A quantized video has a discrete latent grid indexed by time, row and column. Flatten it in time-major, row-major order for an autoregressive prior.",
    "requirements": [
      "codes is a nonempty list of T frames; each frame contains H rows of W integer code IDs. T,H,W are positive and consistent.",
      "Return the sequence codes[t][y][x] with t outermost, y next, and x innermost.",
      "Keep repeats and zero IDs; do not sort the resulting tokens."
    ],
    "signature": "flatten_video_codes(codes)",
    "starter": "def flatten_video_codes(codes):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "def flatten_video_codes(codes):\n    return [token for frame in codes for row in frame for token in row]",
    "explanation": [
      "VideoGPT-like models may predict sequences of quantized spatiotemporal tokens.",
      "Token ordering is part of the data contract and determines which tokens count as earlier context.",
      "Flattening preserves discrete code identities; it does not train a transformer."
    ],
    "complexity": "O(THW) time and output space.",
    "pitfall": "Flattening spatial columns before time would change the autoregressive order.",
    "hints": [
      "Iterate over frames, then rows, then tokens.",
      "Do not sort the indices."
    ],
    "references": [
      {
        "title": "VideoGPT: Video Generation using VQ-VAE and Transformers",
        "url": "https://arxiv.org/abs/2104.10157"
      }
    ],
    "tests": [
      {
        "name": "Two frames",
        "code": "assert flatten_video_codes([[[1,2],[3,4]],[[5,6],[7,8]]]) == [1,2,3,4,5,6,7,8]"
      },
      {
        "name": "One pixel",
        "code": "assert flatten_video_codes([[[7]]]) == [7]"
      },
      {
        "name": "Do not sort tokens",
        "code": "assert flatten_video_codes([[[9,1]],[[4,2]]]) == [9,1,4,2]"
      },
      {
        "name": "Three frames",
        "code": "assert flatten_video_codes([[[1]],[[2]],[[3]]]) == [1,2,3]"
      },
      {
        "name": "Same code repeats",
        "code": "assert flatten_video_codes([[[0,0]]]) == [0,0]"
      },
      {
        "name": "Rectangular",
        "code": "assert flatten_video_codes([[[1,2,3],[4,5,6]]]) == [1,2,3,4,5,6]"
      }
    ]
  },
  {
    "id": "video-temporal-patchify",
    "number": 40,
    "track": "Video World Models",
    "difficulty": "Medium",
    "title": "Patch a Temporal Latent Sequence",
    "duration": "17 min",
    "tags": [
      "Video",
      "Temporal Patches",
      "Tokenization"
    ],
    "description": "Group frames of fixed-width latent features into nonoverlapping temporal patches without losing chronological order.",
    "requirements": [
      "frames is a list of T equally sized feature vectors, and patch_size is a strictly positive integer.",
      "Return a list of flattened temporal patches, each formed by concatenating patch_size consecutive frames.",
      "DROP any incomplete trailing group; return [] when fewer than patch_size frames exist."
    ],
    "signature": "temporal_patchify(frames, patch_size)",
    "starter": "def temporal_patchify(frames, patch_size):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "def temporal_patchify(frames, patch_size):\n    out=[]\n    for t in range(0,len(frames)-patch_size+1,patch_size):\n        out.append([v for frame in frames[t:t+patch_size] for v in frame])\n    return out",
    "explanation": [
      "Temporal patching reduces sequence length at the cost of coarser token resolution.",
      "Concatenation must preserve time and feature order within each patch.",
      "This toy operator models temporal grouping, not the spatial 3D convolutions used by production video VAEs."
    ],
    "complexity": "O(TD) time and output space for T frames of width D.",
    "pitfall": "Using a stride of one creates overlapping windows rather than the specified nonoverlapping patches.",
    "hints": [
      "Advance t by patch_size.",
      "Ignore the final partial patch by bounding the range."
    ],
    "references": [
      {
        "title": "VideoGPT: Video Generation using VQ-VAE and Transformers",
        "url": "https://arxiv.org/abs/2104.10157"
      },
      {
        "title": "World Models & Spatial Intelligence — Video World Models map",
        "url": "https://overdued.github.io/world-model-spatial-intelligence-course/"
      }
    ],
    "tests": [
      {
        "name": "Two-frame patches",
        "code": "assert temporal_patchify([[1,2],[3,4],[5,6],[7,8]],2) == [[1,2,3,4],[5,6,7,8]]"
      },
      {
        "name": "Incomplete tail dropped",
        "code": "assert temporal_patchify([[1],[2],[3]],2) == [[1,2]]"
      },
      {
        "name": "Patch size one",
        "code": "assert temporal_patchify([[1,2],[3,4]],1) == [[1,2],[3,4]]"
      },
      {
        "name": "Not enough frames",
        "code": "assert temporal_patchify([[1]],2) == []"
      },
      {
        "name": "Empty",
        "code": "assert temporal_patchify([],3) == []"
      },
      {
        "name": "No mutation",
        "code": "x=[[1],[2]]; temporal_patchify(x,2); assert x==[[1],[2]]"
      }
    ]
  },
  {
    "id": "flow-linear-interpolation",
    "number": 41,
    "track": "Video World Models",
    "difficulty": "Easy",
    "title": "Interpolate Noise and Data for Flow Matching",
    "duration": "14 min",
    "tags": [
      "Flow Matching",
      "Probability Paths",
      "Interpolation"
    ],
    "description": "Form the conditional straight-line path between a noise vector x0 and a data vector x1 used by a basic rectified-flow-style construction.",
    "requirements": [
      "x0 and x1 are same-length finite float lists; t is a finite scalar in [0,1].",
      "Return a vector xt with each coordinate xt[d] = (1-t)*x0[d] + t*x1[d].",
      "At t=0 output x0, at t=1 output x1. Do not mutate the inputs."
    ],
    "signature": "linear_flow_path(x0, x1, t)",
    "starter": "def linear_flow_path(x0, x1, t):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "def linear_flow_path(x0, x1, t):\n    return [(1-t)*a+t*b for a,b in zip(x0,x1)]",
    "explanation": [
      "The displacement interpolation path is a simple valid conditional path for flow matching.",
      "It keeps noise and data at opposite endpoints and changes continuously as t increases.",
      "A production flow-matching model regresses a time-dependent vector field on many sampled pairs, which this helper does not train."
    ],
    "complexity": "O(D) time and O(D) output for D coordinates.",
    "pitfall": "Reversing x0 and x1 reverses the intended generation direction.",
    "hints": [
      "Multiply the noise vector by (1-t).",
      "Multiply the data vector by t, then add elementwise."
    ],
    "references": [
      {
        "title": "Flow Matching for Generative Modeling (Lipman et al.)",
        "url": "https://arxiv.org/abs/2210.02747"
      }
    ],
    "tests": [
      {
        "name": "Midpoint",
        "code": "assert linear_flow_path([0,2],[2,4],0.5)==[1.0,3.0]"
      },
      {
        "name": "At noise endpoint",
        "code": "assert linear_flow_path([1,-2],[3,5],0)==[1, -2]"
      },
      {
        "name": "At data endpoint",
        "code": "assert linear_flow_path([1,-2],[3,5],1)==[3,5]"
      },
      {
        "name": "Asymmetric time",
        "code": "assert linear_flow_path([0],[10],0.2)==[2.0]"
      },
      {
        "name": "Empty vectors",
        "code": "assert linear_flow_path([],[],.5)==[]"
      },
      {
        "name": "Inputs unchanged",
        "code": "a=[1.];b=[2.];linear_flow_path(a,b,.2);assert a==[1.] and b==[2.]"
      }
    ]
  },
  {
    "id": "flow-conditional-velocity",
    "number": 42,
    "track": "Video World Models",
    "difficulty": "Easy",
    "title": "Derive the Target Velocity of a Linear Flow",
    "duration": "12 min",
    "tags": [
      "Flow Matching",
      "Vector Fields",
      "Supervision"
    ],
    "description": "For x_t = (1-t)*x0 + t*x1, calculate the conditional displacement velocity used as a supervised target.",
    "requirements": [
      "x0 and x1 are equal-length float vectors (possibly empty).",
      "Return the t-independent derivative dx_t/dt = x1 - x0 coordinatewise.",
      "Return a fresh list without modifying either endpoint."
    ],
    "signature": "linear_flow_velocity(x0, x1)",
    "starter": "def linear_flow_velocity(x0, x1):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "def linear_flow_velocity(x0, x1):\n    return [b-a for a,b in zip(x0,x1)]",
    "explanation": [
      "Differentiate the straight-line interpolation analytically: the derivative of (1-t)x0+t x1 is x1-x0.",
      "The target is a conditional velocity for each paired sample, not necessarily the marginal velocity at arbitrary x.",
      "Flow matching fits a network to these velocity targets over many sampled times and examples."
    ],
    "complexity": "O(D) time and O(D) output.",
    "pitfall": "Returning x0-x1 reverses the integration direction from noise to data.",
    "hints": [
      "Differentiate each weighted endpoint with respect to t.",
      "The derivative does not depend on t for a straight-line path."
    ],
    "references": [
      {
        "title": "Flow Matching for Generative Modeling (Lipman et al.)",
        "url": "https://arxiv.org/abs/2210.02747"
      }
    ],
    "tests": [
      {
        "name": "Positive displacement",
        "code": "assert linear_flow_velocity([1,2],[5,5])==[4,3]"
      },
      {
        "name": "Negative displacement",
        "code": "assert linear_flow_velocity([3,1],[1,-2])==[-2,-3]"
      },
      {
        "name": "Identical endpoints",
        "code": "assert linear_flow_velocity([7],[7])==[0]"
      },
      {
        "name": "Empty",
        "code": "assert linear_flow_velocity([],[])==[]"
      },
      {
        "name": "Multiple dimensions",
        "code": "assert linear_flow_velocity([0,1,2],[2,1,-2])==[2,0,-4]"
      },
      {
        "name": "No mutation",
        "code": "a=[3];b=[2];linear_flow_velocity(a,b);assert a==[3] and b==[2]"
      }
    ]
  },
  {
    "id": "flow-velocity-regression",
    "number": 43,
    "track": "Video World Models",
    "difficulty": "Easy",
    "title": "Compute a Flow-Matching Velocity MSE",
    "duration": "12 min",
    "tags": [
      "Flow Matching",
      "Training Objective",
      "MSE"
    ],
    "description": "Evaluate one supervised velocity prediction against its conditional flow-matching target.",
    "requirements": [
      "prediction, x0 and x1 are equal-length, nonempty lists of finite floats.",
      "Use target velocity x1-x0 and return the mean of (prediction[d] - target[d])**2.",
      "Do not calculate a reconstruction or endpoint-distance loss in place of velocity loss."
    ],
    "signature": "flow_velocity_mse(prediction, x0, x1)",
    "starter": "def flow_velocity_mse(prediction, x0, x1):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "def flow_velocity_mse(prediction, x0, x1):\n    return sum((p-(b-a))**2 for p,a,b in zip(prediction,x0,x1))/len(prediction)",
    "explanation": [
      "The matching target is the derivative of the chosen conditional probability path.",
      "The model output is judged in velocity space at one sampled time.",
      "The reduction is a mean over vector dimensions; batch and time expectations are outside the scope of this exercise."
    ],
    "complexity": "O(D) time and O(1) extra space.",
    "pitfall": "Comparing the predicted velocity directly with x1 instead of x1-x0 gives an incorrect objective.",
    "hints": [
      "First compute target = data - noise.",
      "Average squared velocity residuals."
    ],
    "references": [
      {
        "title": "Flow Matching for Generative Modeling (Lipman et al.)",
        "url": "https://arxiv.org/abs/2210.02747"
      }
    ],
    "tests": [
      {
        "name": "Perfect target",
        "code": "assert abs(flow_velocity_mse([2,-1],[1,4],[3,3]) - (0)) < 1e-9"
      },
      {
        "name": "Incorrect zero velocity",
        "code": "assert abs(flow_velocity_mse([0,0],[0,0],[2,4]) - (10)) < 1e-9"
      },
      {
        "name": "One coordinate",
        "code": "assert abs(flow_velocity_mse([1],[0],[4]) - (9)) < 1e-9"
      },
      {
        "name": "Negative target",
        "code": "assert abs(flow_velocity_mse([1],[3],[1]) - (9)) < 1e-9"
      },
      {
        "name": "Mean not sum",
        "code": "assert abs(flow_velocity_mse([0,0,0],[0,0,0],[1,1,1]) - (1)) < 1e-9"
      }
    ]
  },
  {
    "id": "flow-euler-integration",
    "number": 44,
    "track": "Video World Models",
    "difficulty": "Medium",
    "title": "Integrate a Scalar Flow ODE With Euler Steps",
    "duration": "19 min",
    "tags": [
      "Flow Matching",
      "ODE Solver",
      "Sampling"
    ],
    "description": "Sample a scalar state from t=0 to t=1 through dx/dt = velocity(x,t) using explicit Euler integration.",
    "requirements": [
      "x0 is a finite scalar; steps is a strictly positive integer; velocity is a deterministic callable (x,t) -> float.",
      "Use fixed dt=1/steps. At step i, evaluate v(x, i*dt) and update x <- x + dt*v.",
      "Return the final scalar at t=1. Do not call velocity after the last step."
    ],
    "signature": "euler_flow(x0, velocity, steps)",
    "starter": "def euler_flow(x0, velocity, steps):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "def euler_flow(x0, velocity, steps):\n    dt=1.0/steps\n    x=x0\n    for i in range(steps):\n        x+=dt*velocity(x,i*dt)\n    return x",
    "explanation": [
      "Numerical integration turns a learned vector field into generated samples.",
      "Explicit Euler evaluates velocity at the BEGINNING of each integration interval.",
      "Step count controls discretization error; comparing to Heun reveals the effect of solver choice."
    ],
    "complexity": "O(S) velocity calls and O(1) extra space for S steps.",
    "pitfall": "Evaluating velocity at the updated endpoint implements a different discretization, not explicit Euler.",
    "hints": [
      "dt = 1 / steps.",
      "At time i*dt compute velocity before updating x."
    ],
    "references": [
      {
        "title": "Flow Matching for Generative Modeling (Lipman et al.)",
        "url": "https://arxiv.org/abs/2210.02747"
      }
    ],
    "tests": [
      {
        "name": "Constant field",
        "code": "assert abs(euler_flow(2,lambda x,t:3,4) - (5)) < 1e-9"
      },
      {
        "name": "Linear time field",
        "code": "assert abs(euler_flow(0,lambda x,t:t,4) - (0.375)) < 1e-9"
      },
      {
        "name": "Growth field",
        "code": "assert abs(euler_flow(1,lambda x,t:x,2) - (2.25)) < 1e-9"
      },
      {
        "name": "Zero field",
        "code": "assert abs(euler_flow(-3,lambda x,t:0,10) - (-3)) < 1e-9"
      },
      {
        "name": "One step",
        "code": "assert abs(euler_flow(2,lambda x,t:2*x,1) - (6)) < 1e-9"
      },
      {
        "name": "Nonlinear state field",
        "code": "assert abs(euler_flow(1,lambda x,t:-x,2) - (0.25)) < 1e-9"
      }
    ]
  },
  {
    "id": "flow-heun-integration",
    "number": 45,
    "track": "Video World Models",
    "difficulty": "Medium",
    "title": "Integrate a Scalar Flow ODE With Heun’s Method",
    "duration": "22 min",
    "tags": [
      "Flow Matching",
      "ODE Solver",
      "Heun"
    ],
    "description": "Implement a two-evaluation predictor-corrector ODE solver for dx/dt = velocity(x,t) across the unit interval.",
    "requirements": [
      "x0 is a finite float; steps is strictly positive; velocity is a pure deterministic callable (x,t).",
      "For step i set k1=v(x,t), x_pred=x+dt*k1, k2=v(x_pred,t+dt).",
      "Update x <- x + dt*(k1+k2)/2. Return the final state; dt=1/steps."
    ],
    "signature": "heun_flow(x0, velocity, steps)",
    "starter": "def heun_flow(x0, velocity, steps):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "def heun_flow(x0, velocity, steps):\n    dt=1.0/steps\n    x=x0\n    for i in range(steps):\n        t=i*dt\n        k1=velocity(x,t)\n        k2=velocity(x+dt*k1,t+dt)\n        x+=dt*(k1+k2)/2\n    return x",
    "explanation": [
      "Heun (explicit trapezoidal method) averages a slope at the start and a predicted slope at the end of each interval.",
      "For a velocity that depends linearly on time only, it integrates the interval exactly.",
      "It requires two field evaluations per step and may have lower local error than Euler under smooth dynamics."
    ],
    "complexity": "O(S) time with 2S field evaluations, O(1) extra space.",
    "pitfall": "Using k2 computed at (x,t) instead of the predicted end state/time reduces the solver to Euler.",
    "hints": [
      "Predict x + dt*k1 before evaluating k2.",
      "Use t+dt for the second slope."
    ],
    "references": [
      {
        "title": "Flow Matching for Generative Modeling (Lipman et al.)",
        "url": "https://arxiv.org/abs/2210.02747"
      }
    ],
    "tests": [
      {
        "name": "Constant field",
        "code": "assert abs(heun_flow(1,lambda x,t:4,5) - (5)) < 1e-9"
      },
      {
        "name": "Time-linear field",
        "code": "assert abs(heun_flow(0,lambda x,t:t,4) - (0.5)) < 1e-9"
      },
      {
        "name": "State growth",
        "code": "assert abs(heun_flow(1,lambda x,t:x,2) - (2.640625)) < 1e-9"
      },
      {
        "name": "One step t field",
        "code": "assert abs(heun_flow(0,lambda x,t:t,1) - (0.5)) < 1e-9"
      },
      {
        "name": "Zero field",
        "code": "assert abs(heun_flow(-2,lambda x,t:0,3) - (-2)) < 1e-9"
      },
      {
        "name": "Negative constant",
        "code": "assert abs(heun_flow(5,lambda x,t:-2,2) - (3)) < 1e-9"
      }
    ]
  },
  {
    "id": "flow-cfg-velocity",
    "number": 46,
    "track": "Video World Models",
    "difficulty": "Easy",
    "title": "Mix Conditional and Unconditional Flow Velocities",
    "duration": "15 min",
    "tags": [
      "Flow Matching",
      "Guidance",
      "Conditioning"
    ],
    "description": "Implement the arithmetic used in a simple classifier-free-guidance-style combination of two velocity predictions.",
    "requirements": [
      "unconditional and conditional are same-length float lists (possibly empty); guidance_scale is a finite float.",
      "Return u + guidance_scale*(c-u) coordinatewise.",
      "scale=0 must give unconditional; scale=1 must give conditional. This helper has no neural inference."
    ],
    "signature": "guided_velocity(unconditional, conditional, guidance_scale)",
    "starter": "def guided_velocity(unconditional, conditional, guidance_scale):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "def guided_velocity(unconditional, conditional, guidance_scale):\n    return [u + guidance_scale*(c-u) for u,c in zip(unconditional,conditional)]",
    "explanation": [
      "A guidance rule interpolates or extrapolates between unconditional and conditional predictions.",
      "A strength greater than one extrapolates beyond the conditional velocity.",
      "This deterministic interpolation does not include text encoders, conditioning dropout or learned flow models."
    ],
    "complexity": "O(D) time and output space.",
    "pitfall": "Multiplying only the conditional prediction by scale does not preserve the required scale=0 or 1 behavior.",
    "hints": [
      "Start with unconditional velocity.",
      "Add scale times the difference between conditional and unconditional."
    ],
    "references": [
      {
        "title": "Flow Matching for Generative Modeling (Lipman et al.)",
        "url": "https://arxiv.org/abs/2210.02747"
      }
    ],
    "tests": [
      {
        "name": "Scale zero",
        "code": "assert guided_velocity([1,2],[4,8],0)==[1,2]"
      },
      {
        "name": "Scale one",
        "code": "assert guided_velocity([1,2],[4,8],1)==[4,8]"
      },
      {
        "name": "Scale two",
        "code": "assert guided_velocity([1,2],[4,8],2)==[7,14]"
      },
      {
        "name": "Fractional scale",
        "code": "assert guided_velocity([0],[10],.25)==[2.5]"
      },
      {
        "name": "Negative values",
        "code": "assert guided_velocity([-1],[1],1.5)==[2.0]"
      },
      {
        "name": "Empty",
        "code": "assert guided_velocity([],[],3)==[]"
      }
    ]
  },
  {
    "id": "video-action-conditioned-rollout",
    "number": 47,
    "track": "Video World Models",
    "difficulty": "Medium",
    "title": "Roll Out Action-Conditioned Latent Dynamics",
    "duration": "20 min",
    "tags": [
      "Video World Models",
      "Actions",
      "Rollouts"
    ],
    "description": "Given an initial latent state and action sequence, apply a deterministic learned-dynamics surrogate and keep every predicted latent state.",
    "requirements": [
      "initial_state is a finite float; actions is a list of scalar actions; transition(state, action) returns the next float state.",
      "Return a list of length len(actions)+1, INCLUDING initial_state at index zero.",
      "Each predicted next state must use the previous predicted state, not reset to initial_state. Do not change the action list."
    ],
    "signature": "action_latent_rollout(initial_state, actions, transition)",
    "starter": "def action_latent_rollout(initial_state, actions, transition):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "def action_latent_rollout(initial_state, actions, transition):\n    states=[initial_state]\n    for action in actions:\n        states.append(transition(states[-1],action))\n    return states",
    "explanation": [
      "Action-conditioned world models predict future latent states as a function of actions and current state.",
      "Rolling forward on predicted states exposes compounding model error over long horizons.",
      "The scalar transition function stands in for a learned latent-dynamics module; it does not generate video frames."
    ],
    "complexity": "O(T) transition evaluations, O(T) output space.",
    "pitfall": "Applying every action to initial_state produces independent one-step predictions rather than a multi-step rollout.",
    "hints": [
      "Initialize output with the starting state.",
      "Feed the last predicted state into the next transition."
    ],
    "references": [
      {
        "title": "World Models & Spatial Intelligence — Video World Models map",
        "url": "https://overdued.github.io/world-model-spatial-intelligence-course/"
      }
    ],
    "tests": [
      {
        "name": "Accumulated motion",
        "code": "assert action_latent_rollout(0,[1,2,3],lambda s,a:s+a)==[0,1,3,6]"
      },
      {
        "name": "State-dependent dynamics",
        "code": "assert action_latent_rollout(1,[0,0],lambda s,a:2*s+a)==[1,2,4]"
      },
      {
        "name": "No actions",
        "code": "assert action_latent_rollout(7,[],lambda s,a:s)==[7]"
      },
      {
        "name": "Negative actions",
        "code": "assert action_latent_rollout(3,[-1,-2],lambda s,a:s+a)==[3,2,0]"
      },
      {
        "name": "Action multiplicative",
        "code": "assert action_latent_rollout(2,[3,2],lambda s,a:s*a)==[2,6,12]"
      },
      {
        "name": "No mutation",
        "code": "a=[1,2];action_latent_rollout(0,a,lambda s,x:s+x);assert a==[1,2]"
      }
    ]
  },
  {
    "id": "video-temporal-difference-loss",
    "number": 48,
    "track": "Video World Models",
    "difficulty": "Medium",
    "title": "Measure Temporal-Difference Reconstruction Loss",
    "duration": "16 min",
    "tags": [
      "Video",
      "Temporal Consistency",
      "Video Loss"
    ],
    "description": "Compare temporal CHANGES in predicted frame features with corresponding changes in a target clip, rather than comparing static pixel values.",
    "requirements": [
      "predicted and target are equal-shape sequences of T frame vectors of width D>0, with finite coordinates.",
      "For each t>=1 and coordinate d, compare (pred[t][d]-pred[t-1][d]) against (target[t][d]-target[t-1][d]).",
      "Return the mean squared difference over (T-1)*D elements. For T<2 return 0.0."
    ],
    "signature": "temporal_difference_mse(predicted, target)",
    "starter": "def temporal_difference_mse(predicted, target):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "def temporal_difference_mse(predicted, target):\n    if len(predicted)<2:\n        return 0.0\n    error=sum(((new[d]-old[d])-(gnew[d]-gold[d]))**2\n              for old,new,gold,gnew in zip(predicted,predicted[1:],target,target[1:])\n              for d in range(len(new)))\n    return error/((len(predicted)-1)*len(predicted[0]))",
    "explanation": [
      "Framewise reconstruction quality does not fully characterize whether motion evolves correctly.",
      "Temporal differences are invariant to a fixed offset applied to all frames of a sequence.",
      "This is a simple finite-difference objective, not a perceptual motion metric or an optical-flow estimator."
    ],
    "complexity": "O(TD) time and O(1) extra space.",
    "pitfall": "Comparing raw predicted and target frames instead of differences confuses appearance mismatch with temporal mismatch.",
    "hints": [
      "Subtract consecutive frames in each sequence first.",
      "Then compare the two temporal deltas with MSE."
    ],
    "references": [
      {
        "title": "VideoGPT: Video Generation using VQ-VAE and Transformers",
        "url": "https://arxiv.org/abs/2104.10157"
      }
    ],
    "tests": [
      {
        "name": "Matching motion",
        "code": "assert abs(temporal_difference_mse([[0],[2]],[[10],[12]]) - (0)) < 1e-9"
      },
      {
        "name": "Different motion",
        "code": "assert abs(temporal_difference_mse([[0],[4]],[[0],[2]]) - (4)) < 1e-9"
      },
      {
        "name": "Two dimensions",
        "code": "assert abs(temporal_difference_mse([[0,0],[1,2]],[[0,0],[2,4]]) - (2.5)) < 1e-9"
      },
      {
        "name": "Three frames",
        "code": "assert abs(temporal_difference_mse([[0],[2],[5]],[[0],[1],[2]]) - (2.5)) < 1e-9"
      },
      {
        "name": "One frame",
        "code": "assert abs(temporal_difference_mse([[1]],[[9]]) - (0)) < 1e-9"
      },
      {
        "name": "Empty",
        "code": "assert abs(temporal_difference_mse([],[]) - (0)) < 1e-9"
      }
    ]
  },
  {
    "id": "video-causal-token-context",
    "number": 49,
    "track": "Video World Models",
    "difficulty": "Easy",
    "title": "Build Causal Context Windows for Video Tokens",
    "duration": "15 min",
    "tags": [
      "VideoGPT",
      "Autoregressive",
      "Context"
    ],
    "description": "For each discrete video token position, construct its bounded past context while preventing future-token leakage.",
    "requirements": [
      "tokens is a list of integer IDs (may be empty) and context_size is a nonnegative integer.",
      "For position i return tokens[max(0,i-context_size):i], which excludes tokens[i] itself.",
      "Return a list of contexts for EVERY position including position zero; do not pad or reorder."
    ],
    "signature": "causal_token_contexts(tokens, context_size)",
    "starter": "def causal_token_contexts(tokens, context_size):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "def causal_token_contexts(tokens, context_size):\n    return [tokens[max(0,i-context_size):i] for i in range(len(tokens))]",
    "explanation": [
      "An autoregressive video-token prior must never condition a token on its own value or future tokens.",
      "Fixed context windows make the conditioning scope explicit.",
      "This task constructs data contexts, not causal transformer attention weights."
    ],
    "complexity": "O(T*K) output time/space for T tokens and window size K.",
    "pitfall": "Using tokens[:i+1] leaks the current target token into its own context.",
    "hints": [
      "For prediction at i, slice only indices strictly less than i.",
      "Limit the left boundary by max(0,i-context_size)."
    ],
    "references": [
      {
        "title": "VideoGPT: Video Generation using VQ-VAE and Transformers",
        "url": "https://arxiv.org/abs/2104.10157"
      }
    ],
    "tests": [
      {
        "name": "Window two",
        "code": "assert causal_token_contexts([1,2,3,4],2)==[[],[1],[1,2],[2,3]]"
      },
      {
        "name": "Zero window",
        "code": "assert causal_token_contexts([1,2],0)==[[],[]]"
      },
      {
        "name": "Huge window",
        "code": "assert causal_token_contexts([4,5,6],10)==[[],[4],[4,5]]"
      },
      {
        "name": "One token",
        "code": "assert causal_token_contexts([7],3)==[[]]"
      },
      {
        "name": "Empty",
        "code": "assert causal_token_contexts([],2)==[]"
      },
      {
        "name": "Input preserved",
        "code": "t=[1,2,3];causal_token_contexts(t,2);assert t==[1,2,3]"
      }
    ]
  },
  {
    "id": "video-token-cross-entropy",
    "number": 50,
    "track": "Video World Models",
    "difficulty": "Medium",
    "title": "Compute Video Token Prior Negative Log Likelihood",
    "duration": "19 min",
    "tags": [
      "VideoGPT",
      "Token Likelihood",
      "Autoregressive"
    ],
    "description": "Evaluate a discrete next-token video prior using ground-truth code indices and predicted probability distributions.",
    "requirements": [
      "probabilities is a list of nonempty probability vectors; targets has one valid integer index per vector.",
      "Return the MEAN -log(probabilities[t][targets[t]]) over time steps.",
      "For an empty sequence return 0.0. If a target has exactly zero predicted probability, raise ValueError. Inputs are not modified."
    ],
    "signature": "video_token_nll(probabilities, targets)",
    "starter": "def video_token_nll(probabilities, targets):\n    \"\"\"Implement the specified component; no external dependencies.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\n\ndef video_token_nll(probabilities, targets):\n    if not targets:\n        return 0.0\n    loss=0.0\n    for distribution,target in zip(probabilities,targets):\n        prob=distribution[target]\n        if prob<=0.0:\n            raise ValueError('zero probability for target token')\n        loss-=math.log(prob)\n    return loss/len(targets)",
    "explanation": [
      "A discrete autoregressive video prior is trained to assign high probability to the next observed code.",
      "The negative log-likelihood penalizes low predicted probability for the ground-truth target.",
      "Evaluation here assumes probabilities are already normalized and ground-truth codes are provided."
    ],
    "complexity": "O(T) time and O(1) extra space for T tokens.",
    "pitfall": "Taking log of the maximum probability instead of the ground-truth index measures confidence, not likelihood.",
    "hints": [
      "Read distribution[target] at each time step.",
      "Average negative natural logarithms; handle zero explicitly."
    ],
    "references": [
      {
        "title": "VideoGPT: Video Generation using VQ-VAE and Transformers",
        "url": "https://arxiv.org/abs/2104.10157"
      }
    ],
    "tests": [
      {
        "name": "Certain predictions",
        "code": "assert abs(video_token_nll([[1,0],[0,1]],[0,1]) - (0)) < 1e-9"
      },
      {
        "name": "Uniform binary",
        "code": "assert abs(video_token_nll([[.5,.5],[.5,.5]],[0,1]) - (math.log(2))) < 1e-9"
      },
      {
        "name": "Mixed confidence",
        "code": "assert abs(video_token_nll([[.25,.75],[.5,.5]],[1,0]) - ((-math.log(.75)-math.log(.5))/2)) < 1e-9"
      },
      {
        "name": "One token",
        "code": "assert abs(video_token_nll([[.1,.9]],[0]) - (-math.log(.1))) < 1e-9"
      },
      {
        "name": "Empty",
        "code": "assert abs(video_token_nll([],[]) - (0)) < 1e-9"
      },
      {
        "name": "Zero target probability",
        "code": "try:\n    video_token_nll([[1,0]],[1]); assert False\nexcept ValueError:\n    pass"
      }
    ]
  }
];
