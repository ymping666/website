// v1.0 independent fine-grained AI fundamentals challenges.
export const coreNextProblems = [
  {
    "id": "cnn-valid-convolution",
    "number": 77,
    "track": "AI Foundations",
    "difficulty": "Easy",
    "title": "Implement a Valid 2D Convolution (Cross-Correlation)",
    "duration": "15 min",
    "tags": [
      "CNN",
      "Convolution"
    ],
    "description": "Implement the spatial sliding-window kernel used by many CNN libraries. This exercise intentionally uses cross-correlation (no kernel flip), matching standard deep-learning conv2d semantics.",
    "requirements": [
      "image is a nonempty rectangular H×W list; kernel is a nonempty rectangular Kh×Kw list with Kh<=H, Kw<=W.",
      "Use stride 1 and no padding; return (H-Kh+1)×(W-Kw+1).",
      "Each output is the sum of image[i+a][j+b]*kernel[a][b] over the kernel window."
    ],
    "signature": "conv2d_valid(image, kernel)",
    "starter": "def conv2d_valid(image, kernel):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "def conv2d_valid(image, kernel):\n    h,w=len(image),len(image[0]); kh,kw=len(kernel),len(kernel[0])\n    return [[sum(image[i+a][j+b]*kernel[a][b] for a in range(kh) for b in range(kw)) for j in range(w-kw+1)] for i in range(h-kh+1)]",
    "explanation": [
      "In deep-learning APIs, convolution kernels are usually applied as cross-correlations.",
      "The top-left output comes from the top-left image window; no padding means border windows are dropped."
    ],
    "complexity": "O((H-Kh+1)(W-Kw+1)KhKw) time; output-sized space.",
    "pitfall": "Do not reverse the spatial kernel indices unless explicitly asked for mathematical convolution.",
    "hints": [
      "Use the contract for conv2d_valid exactly; trace a tiny numeric example first.",
      "Check that you do not reverse the spatial kernel indices unless explicitly asked for mathematical convolution."
    ],
    "references": [
      {
        "title": "Gradient-Based Learning Applied to Document Recognition",
        "url": "https://ieeexplore.ieee.org/document/726791"
      }
    ],
    "tests": [
      {
        "name": "One by one",
        "code": "assert conv2d_valid([[1,2],[3,4]],[[2]])==[[2,4],[6,8]]"
      },
      {
        "name": "Window sum",
        "code": "assert conv2d_valid([[1,2,3],[4,5,6],[7,8,9]],[[1,1],[1,1]])==[[12,16],[24,28]]"
      },
      {
        "name": "Asymmetric kernel",
        "code": "assert conv2d_valid([[1,2,3],[4,5,6]],[[1,2]])==[[5,8],[14,17]]"
      },
      {
        "name": "Negative weights",
        "code": "assert conv2d_valid([[1,2],[3,4]],[[1,-1],[-1,1]])==[[0]]"
      },
      {
        "name": "Rectangular spatial sizes",
        "code": "assert conv2d_valid([[1,2,3,4]],[[1,0,2]])==[[7,10]]"
      }
    ]
  },
  {
    "id": "cnn-zero-padded-convolution",
    "number": 78,
    "track": "AI Foundations",
    "difficulty": "Medium",
    "title": "Implement Zero-Padded 2D Convolution",
    "duration": "15 min",
    "tags": [
      "conv2d_same",
      "From Scratch"
    ],
    "description": "Apply an odd-sized spatial kernel with zero padding so the output resolution equals the input resolution.",
    "requirements": [
      "image is nonempty H×W and kernel has odd positive Kh and Kw.",
      "For output (i,j), center kernel at input (i,j); treat indices outside image bounds as zeros.",
      "Use cross-correlation without flipping; return an H×W list."
    ],
    "signature": "conv2d_same(image, kernel)",
    "starter": "def conv2d_same(image, kernel):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "def conv2d_same(image,kernel):\n    h,w=len(image),len(image[0]); kh,kw=len(kernel),len(kernel[0]); ph,pw=kh//2,kw//2\n    return [[sum(image[ni][nj]*kernel[a][b] for a in range(kh) for b in range(kw) for ni,nj in [(i+a-ph,j+b-pw)] if 0<=ni<h and 0<=nj<w) for j in range(w)] for i in range(h)]",
    "explanation": [
      "The padding radius is floor(kernel_size/2) on each axis for odd kernels.",
      "Skipping out-of-bounds image locations implements zero extension while preserving the output shape."
    ],
    "complexity": "O(H W Kh Kw) time and O(H W) output space.",
    "pitfall": "Do not wrap the indices cyclically; padding values must be zeros.",
    "hints": [
      "Use the contract for conv2d_same exactly; trace a tiny numeric example first.",
      "Check that you do not wrap the indices cyclically; padding values must be zeros."
    ],
    "references": [
      {
        "title": "Gradient-Based Learning Applied to Document Recognition",
        "url": "https://ieeexplore.ieee.org/document/726791"
      }
    ],
    "tests": [
      {
        "name": "Identity",
        "code": "assert conv2d_same([[1,2],[3,4]],[[1]])==[[1,2],[3,4]]"
      },
      {
        "name": "Cross kernel",
        "code": "assert conv2d_same([[1,2],[3,4]],[[0,1,0],[1,0,1],[0,1,0]])==[[5,5],[5,5]]"
      },
      {
        "name": "Zero outside",
        "code": "assert conv2d_same([[2]],[[1,1,1],[1,1,1],[1,1,1]])==[[2]]"
      },
      {
        "name": "Horizontal stencil",
        "code": "assert conv2d_same([[1,2,3]],[[1,0,1]])==[[2,4,2]]"
      },
      {
        "name": "Asymmetric edge",
        "code": "assert conv2d_same([[1,2]],[[1,2,3]])==[[8,5]]"
      }
    ]
  },
  {
    "id": "cnn-pointwise-projection",
    "number": 79,
    "track": "AI Foundations",
    "difficulty": "Medium",
    "title": "Implement Multi-Channel 1×1 Convolution",
    "duration": "15 min",
    "tags": [
      "pointwise_conv",
      "From Scratch"
    ],
    "description": "Learn how a 1×1 convolution mixes channels at every pixel without aggregating neighbors.",
    "requirements": [
      "channels is C_in×H×W; weights is C_out×C_in and biases is a list of C_out scalars.",
      "Return C_out×H×W with out[o][i][j]=biases[o]+sum(weights[o][c]*channels[c][i][j]).",
      "Spatial coordinates and input ordering are unchanged; do not modify inputs."
    ],
    "signature": "pointwise_conv(channels, weights, biases)",
    "starter": "def pointwise_conv(channels, weights, biases):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "def pointwise_conv(channels, weights, biases):\n    h,w=len(channels[0]),len(channels[0][0])\n    return [[[biases[o]+sum(weights[o][c]*channels[c][i][j] for c in range(len(channels))) for j in range(w)] for i in range(h)] for o in range(len(weights))]",
    "explanation": [
      "The 1×1 kernel performs a dense linear channel projection at each spatial position.",
      "Unlike wider convolution kernels, no neighboring pixel contributes to a location."
    ],
    "complexity": "O(C_out C_in H W) time, O(C_out H W) output.",
    "pitfall": "Do not mix the H/W dimensions into the channel dot product.",
    "hints": [
      "Use the contract for pointwise_conv exactly; trace a tiny numeric example first.",
      "Check that you do not mix the H/W dimensions into the channel dot product."
    ],
    "references": [
      {
        "title": "Gradient-Based Learning Applied to Document Recognition",
        "url": "https://ieeexplore.ieee.org/document/726791"
      }
    ],
    "tests": [
      {
        "name": "One in one out",
        "code": "assert pointwise_conv([[[1,2]]],[[3]],[1])==[[[4,7]]]"
      },
      {
        "name": "Mix two channels",
        "code": "assert pointwise_conv([[[1,2]],[[3,4]]],[[1,2]],[0])==[[[7,10]]]"
      },
      {
        "name": "Two output filters",
        "code": "assert pointwise_conv([[[1]],[[2]]],[[1,1],[1,-1]],[0,3])==[[[3]],[[2]]]"
      },
      {
        "name": "Preserve spatial layout",
        "code": "assert pointwise_conv([[[1,2],[3,4]]],[[2]],[0])==[[[2,4],[6,8]]]"
      }
    ]
  },
  {
    "id": "cnn-max-pooling",
    "number": 80,
    "track": "AI Foundations",
    "difficulty": "Easy",
    "title": "Implement 2×2 Max Pooling",
    "duration": "15 min",
    "tags": [
      "max_pool2d",
      "From Scratch"
    ],
    "description": "Downsample an image using non-overlapping 2×2 maxima, as in a conventional stride-2 CNN pooling layer.",
    "requirements": [
      "image is nonempty rectangular H×W with H,W>=2.",
      "Return floor(H/2)×floor(W/2); ignore incomplete border windows.",
      "Each output is the maximum over its corresponding 2×2 block."
    ],
    "signature": "max_pool2d(image)",
    "starter": "def max_pool2d(image):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "def max_pool2d(image):\n    return [[max(image[2*i+a][2*j+b] for a in (0,1) for b in (0,1)) for j in range(len(image[0])//2)] for i in range(len(image)//2)]",
    "explanation": [
      "The stride equals the pooling window size, so windows do not overlap.",
      "Max pooling retains the strongest scalar activation per block, with spatial dimensions rounded down."
    ],
    "complexity": "O(HW) time, O(floor(H/2)floor(W/2)) output.",
    "pitfall": "Do not pad incomplete trailing blocks or compare across channel boundaries.",
    "hints": [
      "Use the contract for max_pool2d exactly; trace a tiny numeric example first.",
      "Check that you do not pad incomplete trailing blocks or compare across channel boundaries."
    ],
    "references": [
      {
        "title": "Gradient-Based Learning Applied to Document Recognition",
        "url": "https://ieeexplore.ieee.org/document/726791"
      }
    ],
    "tests": [
      {
        "name": "Two by two",
        "code": "assert max_pool2d([[1,3],[2,4]])==[[4]]"
      },
      {
        "name": "Four patches",
        "code": "assert max_pool2d([[1,2,9,1],[8,3,2,7],[4,9,0,5],[0,2,6,1]])==[[8,9],[9,6]]"
      },
      {
        "name": "Negative values",
        "code": "assert max_pool2d([[-5,-2],[-7,-3]])==[[-2]]"
      },
      {
        "name": "Odd edge discarded",
        "code": "assert max_pool2d([[1,2,100],[3,4,200],[300,400,500]])==[[4]]"
      }
    ]
  },
  {
    "id": "cnn-average-pooling",
    "number": 81,
    "track": "AI Foundations",
    "difficulty": "Easy",
    "title": "Implement 2×2 Average Pooling",
    "duration": "15 min",
    "tags": [
      "avg_pool2d",
      "From Scratch"
    ],
    "description": "Downsample a feature map by computing the arithmetic mean of each non-overlapping 2×2 window.",
    "requirements": [
      "image is nonempty rectangular H×W with H,W>=2.",
      "Use stride 2, without padding; discard incomplete border windows.",
      "Return the average of exactly four input pixels for every output cell."
    ],
    "signature": "avg_pool2d(image)",
    "starter": "def avg_pool2d(image):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "def avg_pool2d(image):\n    return [[sum(image[2*i+a][2*j+b] for a in (0,1) for b in (0,1))/4 for j in range(len(image[0])//2)] for i in range(len(image)//2)]",
    "explanation": [
      "Stride-2 average pooling reduces the spatial resolution while retaining mean activation.",
      "The divisor stays equal to four because partial border windows are ignored."
    ],
    "complexity": "O(HW) time; pooled output space.",
    "pitfall": "Do not divide by two or include discarded trailing pixels.",
    "hints": [
      "Use the contract for avg_pool2d exactly; trace a tiny numeric example first.",
      "Check that you do not divide by two or include discarded trailing pixels."
    ],
    "references": [
      {
        "title": "Gradient-Based Learning Applied to Document Recognition",
        "url": "https://ieeexplore.ieee.org/document/726791"
      }
    ],
    "tests": [
      {
        "name": "Simple average",
        "code": "assert avg_pool2d([[1,2],[3,4]])==[[2.5]]"
      },
      {
        "name": "Negative and positive",
        "code": "assert avg_pool2d([[-2,2],[-4,4]])==[[0.0]]"
      },
      {
        "name": "Multiple windows",
        "code": "assert avg_pool2d([[1,1,4,4],[1,1,4,4]])==[[1,4]]"
      },
      {
        "name": "Ignore border",
        "code": "assert avg_pool2d([[1,1,999],[1,1,999],[999,999,999]])==[[1]]"
      }
    ]
  },
  {
    "id": "norm-batch-training",
    "number": 82,
    "track": "AI Foundations",
    "difficulty": "Medium",
    "title": "Compute BatchNorm Training Outputs",
    "duration": "15 min",
    "tags": [
      "BatchNorm",
      "Training Mode"
    ],
    "description": "Implement feature-wise batch normalization with statistics estimated from the current mini-batch. Running averages are outside this exercise.",
    "requirements": [
      "batch is B×D with B>=1, gamma and beta have length D, and eps>0.",
      "For each feature j, use population mean and variance across the B rows.",
      "Return B×D values gamma[j]*(x-mean[j])/sqrt(var[j]+eps)+beta[j]."
    ],
    "signature": "batch_norm_train(batch, gamma, beta, eps)",
    "starter": "def batch_norm_train(batch, gamma, beta, eps):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\ndef batch_norm_train(batch,gamma,beta,eps):\n    b,d=len(batch),len(batch[0]); means=[sum(row[j] for row in batch)/b for j in range(d)]\n    vars=[sum((row[j]-means[j])**2 for row in batch)/b for j in range(d)]\n    return [[gamma[j]*(row[j]-means[j])/math.sqrt(vars[j]+eps)+beta[j] for j in range(d)] for row in batch]",
    "explanation": [
      "BatchNorm normalizes each feature across different examples in the current batch.",
      "Learnable gamma and beta scale and shift the normalized activations afterward."
    ],
    "complexity": "O(BD) time and O(BD) output space; O(D) statistics.",
    "pitfall": "Do not normalize each row separately; that is closer to LayerNorm.",
    "hints": [
      "Use the contract for batch_norm_train exactly; trace a tiny numeric example first.",
      "Check that you do not normalize each row separately; that is closer to LayerNorm."
    ],
    "references": [
      {
        "title": "Batch Normalization (Ioffe & Szegedy, 2015)",
        "url": "https://arxiv.org/abs/1502.03167"
      }
    ],
    "tests": [
      {
        "name": "Two examples",
        "code": "r=batch_norm_train([[1],[3]],[1],[0],1e-12);assert abs(r[0][0]+1)<1e-9 and abs(r[1][0]-1)<1e-9"
      },
      {
        "name": "Affine offset",
        "code": "assert batch_norm_train([[5,10]],[2,3],[7,8],1e-5)==[[7.,8.]]"
      },
      {
        "name": "Channelwise statistics",
        "code": "r=batch_norm_train([[1,2],[3,6]],[1,2],[0,1],1e-12);assert all(abs(a-b)<1e-9 for a,b in zip(r[0],[-1,-1]))"
      },
      {
        "name": "Constant feature",
        "code": "assert batch_norm_train([[7],[7]],[3],[2],1e-5)==[[2.],[2.]]"
      },
      {
        "name": "Translation invariance",
        "code": "a=batch_norm_train([[1],[3]],[1],[0],1e-8);b=batch_norm_train([[11],[13]],[1],[0],1e-8);assert all(abs(x[0]-y[0])<1e-9 for x,y in zip(a,b))"
      }
    ]
  },
  {
    "id": "norm-batch-inference",
    "number": 83,
    "track": "AI Foundations",
    "difficulty": "Easy",
    "title": "Apply BatchNorm Running Statistics at Inference",
    "duration": "15 min",
    "tags": [
      "batch_norm_eval",
      "From Scratch"
    ],
    "description": "Use frozen running statistics to normalize a batch at inference, rather than recomputing mean or variance on the input mini-batch.",
    "requirements": [
      "batch is B×D; running_mean, running_var, gamma and beta each have length D.",
      "Apply y=gamma*(x-running_mean)/sqrt(running_var+eps)+beta feature-wise.",
      "Do not recompute statistics from batch or update running estimates."
    ],
    "signature": "batch_norm_eval(batch, running_mean, running_var, gamma, beta, eps)",
    "starter": "def batch_norm_eval(batch, running_mean, running_var, gamma, beta, eps):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\ndef batch_norm_eval(batch,running_mean,running_var,gamma,beta,eps):\n    return [[gamma[j]*(x-running_mean[j])/math.sqrt(running_var[j]+eps)+beta[j] for j,x in enumerate(row)] for row in batch]",
    "explanation": [
      "Inference uses accumulated running statistics from training, not current batch statistics.",
      "Evaluating the same example must return the same result regardless of what other examples share its inference batch."
    ],
    "complexity": "O(BD) time and O(BD) output space.",
    "pitfall": "Do not recompute feature means from the current inference batch.",
    "hints": [
      "Use the contract for batch_norm_eval exactly; trace a tiny numeric example first.",
      "Check that you do not recompute feature means from the current inference batch."
    ],
    "references": [
      {
        "title": "Batch Normalization (Ioffe & Szegedy, 2015)",
        "url": "https://arxiv.org/abs/1502.03167"
      }
    ],
    "tests": [
      {
        "name": "Use running mean",
        "code": "r=batch_norm_eval([[11]], [10],[1],[1],[0],1e-12);assert abs(r[0][0]-1)<1e-9"
      },
      {
        "name": "Different features",
        "code": "r=batch_norm_eval([[2,8]],[0,4],[4,4],[2,3],[1,-1],1e-12);assert all(abs(a-b)<1e-9 for a,b in zip(r[0],[3,5]))"
      },
      {
        "name": "No batch dependence",
        "code": "a=batch_norm_eval([[4]],[0],[4],[1],[0],1e-12);b=batch_norm_eval([[4],[500]],[0],[4],[1],[0],1e-12);assert abs(a[0][0]-b[0][0])<1e-12"
      },
      {
        "name": "Zero variance stable",
        "code": "assert batch_norm_eval([[3]], [3],[0],[5],[2],1e-5)==[[2.]]"
      }
    ]
  },
  {
    "id": "norm-rmsnorm",
    "number": 84,
    "track": "AI Foundations",
    "difficulty": "Easy",
    "title": "Implement RMSNorm Without Centering",
    "duration": "15 min",
    "tags": [
      "rms_norm",
      "From Scratch"
    ],
    "description": "Implement the root-mean-square normalization used in modern transformer variants. Unlike LayerNorm, RMSNorm does not subtract the feature mean.",
    "requirements": [
      "x is a nonempty list of finite reals and eps>0.",
      "Compute rms=sqrt(sum(v*v for v in x)/len(x)+eps).",
      "Return each x[i]/rms; this exercise has no learned gain."
    ],
    "signature": "rms_norm(x, eps)",
    "starter": "def rms_norm(x, eps):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\ndef rms_norm(x,eps):\n    rms=math.sqrt(sum(v*v for v in x)/len(x)+eps)\n    return [v/rms for v in x]",
    "explanation": [
      "RMSNorm controls feature-vector scale but leaves its mean unchanged.",
      "The denominator depends on mean squared magnitude, not the centered variance."
    ],
    "complexity": "O(d) time, O(d) output space.",
    "pitfall": "Do not subtract the mean; this would turn the operation into a different normalization method.",
    "hints": [
      "Use the contract for rms_norm exactly; trace a tiny numeric example first.",
      "Check that you do not subtract the mean; this would turn the operation into a different normalization method."
    ],
    "references": [
      {
        "title": "Root Mean Square Layer Normalization (Zhang & Sennrich, 2019)",
        "url": "https://arxiv.org/abs/1910.07467"
      }
    ],
    "tests": [
      {
        "name": "Constant positive",
        "code": "r=rms_norm([3,3],1e-12);assert all(abs(v-1)<1e-9 for v in r)"
      },
      {
        "name": "Signed vector",
        "code": "r=rms_norm([3,-4],1e-12);assert abs(sum(v*v for v in r)/2-1)<1e-9"
      },
      {
        "name": "Zero vector",
        "code": "assert rms_norm([0,0,0],1e-6)==[0,0,0]"
      },
      {
        "name": "No centering",
        "code": "r=rms_norm([1,3],1e-12);assert all(v>0 for v in r)"
      },
      {
        "name": "Single element",
        "code": "assert abs(rms_norm([-5],1e-12)[0]+1)<1e-9"
      }
    ]
  },
  {
    "id": "norm-rmsnorm-gain",
    "number": 85,
    "track": "AI Foundations",
    "difficulty": "Easy",
    "title": "Apply RMSNorm with Learned Channel Gain",
    "duration": "15 min",
    "tags": [
      "rms_norm_gain",
      "From Scratch"
    ],
    "description": "Take the RMS-normalized feature vector and apply a per-channel learned gain vector, with no bias term.",
    "requirements": [
      "x and gain are equal-length nonempty vectors; eps>0.",
      "Compute y[i]=gain[i]*x[i]/sqrt(mean(x**2)+eps).",
      "Do not center input features or add an offset."
    ],
    "signature": "rms_norm_gain(x, gain, eps)",
    "starter": "def rms_norm_gain(x, gain, eps):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\ndef rms_norm_gain(x,gain,eps):\n    inv=1/math.sqrt(sum(v*v for v in x)/len(x)+eps)\n    return [v*g*inv for v,g in zip(x,gain)]",
    "explanation": [
      "A gain vector restores learnable per-feature scaling after normalization.",
      "Unlike BatchNorm and LayerNorm with affine parameters, the specified RMSNorm variant has no bias or mean subtraction."
    ],
    "complexity": "O(d) time and O(d) output space.",
    "pitfall": "Do not reduce gain to a single shared scalar or apply it before subtracting a mean.",
    "hints": [
      "Use the contract for rms_norm_gain exactly; trace a tiny numeric example first.",
      "Check that you do not reduce gain to a single shared scalar or apply it before subtracting a mean."
    ],
    "references": [
      {
        "title": "Root Mean Square Layer Normalization (Zhang & Sennrich, 2019)",
        "url": "https://arxiv.org/abs/1910.07467"
      }
    ],
    "tests": [
      {
        "name": "Zero gain",
        "code": "assert rms_norm_gain([1,2],[0,0],1e-6)==[0,0]"
      },
      {
        "name": "Different gains",
        "code": "r=rms_norm_gain([3,3],[2,-1],1e-12);assert abs(r[0]-2)<1e-9 and abs(r[1]+1)<1e-9"
      },
      {
        "name": "Gain broadcast",
        "code": "r=rms_norm_gain([1,-1],[2,3],1e-12);assert abs(r[0]-2)<1e-9 and abs(r[1]+3)<1e-9"
      },
      {
        "name": "Zero input",
        "code": "assert rms_norm_gain([0,0],[2,3],1e-8)==[0,0]"
      }
    ]
  },
  {
    "id": "autograd-relu-backward",
    "number": 86,
    "track": "AI Foundations",
    "difficulty": "Easy",
    "title": "Backpropagate Through ReLU",
    "duration": "15 min",
    "tags": [
      "relu_backward",
      "From Scratch"
    ],
    "description": "Implement the Jacobian-vector product for elementwise ReLU with a specified convention at zero.",
    "requirements": [
      "x and upstream are same-length vectors.",
      "For x[i]>0, gradient equals upstream[i]; for x[i]<=0, gradient is 0.",
      "Return a new vector and do not modify x or upstream."
    ],
    "signature": "relu_backward(x, upstream)",
    "starter": "def relu_backward(x, upstream):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "def relu_backward(x,upstream):\n    return [g if v>0 else 0 for v,g in zip(x,upstream)]",
    "explanation": [
      "ReLU has a diagonal Jacobian containing ones for positive inputs and zeros otherwise.",
      "A subgradient convention at the nonsmooth origin must be stated explicitly; this exercise chooses zero."
    ],
    "complexity": "O(d) time and O(d) output space.",
    "pitfall": "Do not use the sign of upstream gradient to decide the ReLU mask.",
    "hints": [
      "Use the contract for relu_backward exactly; trace a tiny numeric example first.",
      "Check that you do not use the sign of upstream gradient to decide the ReLU mask."
    ],
    "references": [
      {
        "title": "Learning representations by back-propagating errors",
        "url": "https://www.nature.com/articles/323533a0"
      }
    ],
    "tests": [
      {
        "name": "Mixed signs",
        "code": "assert relu_backward([-1,0,2],[3,4,5])==[0,0,5]"
      },
      {
        "name": "Negative upstream",
        "code": "assert relu_backward([1,3],[-7,2])==[-7,2]"
      },
      {
        "name": "All zero",
        "code": "assert relu_backward([0,0],[10,-2])==[0,0]"
      },
      {
        "name": "Empty vectors",
        "code": "assert relu_backward([],[])==[]"
      }
    ]
  },
  {
    "id": "autograd-linear-forward",
    "number": 87,
    "track": "AI Foundations",
    "difficulty": "Easy",
    "title": "Implement a Linear Layer Forward Pass",
    "duration": "15 min",
    "tags": [
      "linear_forward",
      "From Scratch"
    ],
    "description": "Implement a fully connected affine layer using lists: y=Wx+b.",
    "requirements": [
      "x has length D_in; weights is D_out×D_in and biases has length D_out.",
      "Return a length-D_out list where y[o]=sum(weights[o][i]*x[i])+biases[o].",
      "The weights and biases are provided; do not initialize or update parameters."
    ],
    "signature": "linear_forward(x, weights, biases)",
    "starter": "def linear_forward(x, weights, biases):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "def linear_forward(x,weights,biases):\n    return [sum(w*v for w,v in zip(row,x))+bias for row,bias in zip(weights,biases)]",
    "explanation": [
      "Every output feature has its own row of learned weights.",
      "Bias is added after reducing over all input features."
    ],
    "complexity": "O(D_in D_out) time, O(D_out) output.",
    "pitfall": "Do not transpose the weight matrix unless the contract says input-major weight storage.",
    "hints": [
      "Use the contract for linear_forward exactly; trace a tiny numeric example first.",
      "Check that you do not transpose the weight matrix unless the contract says input-major weight storage."
    ],
    "references": [
      {
        "title": "Learning representations by back-propagating errors",
        "url": "https://www.nature.com/articles/323533a0"
      }
    ],
    "tests": [
      {
        "name": "Identity",
        "code": "assert linear_forward([2,3],[[1,0],[0,1]],[0,0])==[2,3]"
      },
      {
        "name": "Multiple outputs",
        "code": "assert linear_forward([1,2],[[2,3],[1,-1]],[4,1])==[12,0]"
      },
      {
        "name": "Zero input",
        "code": "assert linear_forward([0,0],[[1,2]],[-3])==[-3]"
      },
      {
        "name": "Single feature",
        "code": "assert linear_forward([2],[[4],[-1]],[1,2])==[9,0]"
      }
    ]
  },
  {
    "id": "autograd-mse-gradient",
    "number": 88,
    "track": "AI Foundations",
    "difficulty": "Easy",
    "title": "Differentiate Mean Squared Error",
    "duration": "15 min",
    "tags": [
      "mse_gradient",
      "From Scratch"
    ],
    "description": "Calculate the gradient of the mean squared error with respect to predictions for a nonempty vector.",
    "requirements": [
      "predictions and targets are same-length nonempty vectors.",
      "Loss is (1/n)*sum((pred-target)**2).",
      "Return gradients 2*(predictions[i]-targets[i])/n."
    ],
    "signature": "mse_gradient(predictions, targets)",
    "starter": "def mse_gradient(predictions, targets):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "def mse_gradient(predictions,targets):\n    n=len(predictions)\n    return [2*(p-t)/n for p,t in zip(predictions,targets)]",
    "explanation": [
      "The derivative of a squared residual is twice the residual.",
      "Because the loss is averaged across n elements, every gradient contains a factor 1/n."
    ],
    "complexity": "O(n) time and O(n) output.",
    "pitfall": "Do not omit the reduction factor or differentiate with respect to targets instead.",
    "hints": [
      "Use the contract for mse_gradient exactly; trace a tiny numeric example first.",
      "Check that you do not omit the reduction factor or differentiate with respect to targets instead."
    ],
    "references": [
      {
        "title": "Learning representations by back-propagating errors",
        "url": "https://www.nature.com/articles/323533a0"
      }
    ],
    "tests": [
      {
        "name": "One element",
        "code": "assert mse_gradient([3],[1])==[4.0]"
      },
      {
        "name": "Mean reduction",
        "code": "assert mse_gradient([2,4],[1,2])==[1.,2.]"
      },
      {
        "name": "Zero error",
        "code": "assert mse_gradient([1,2],[1,2])==[0,0]"
      },
      {
        "name": "Negative error",
        "code": "assert mse_gradient([1,0],[3,4])==[-2.,-4.]"
      }
    ]
  },
  {
    "id": "autograd-linear-backward",
    "number": 89,
    "track": "AI Foundations",
    "difficulty": "Medium",
    "title": "Backpropagate Through a Linear Layer",
    "duration": "15 min",
    "tags": [
      "linear_backward",
      "From Scratch"
    ],
    "description": "Compute gradients through the affine transform y=Wx+b for a single sample, given upstream dL/dy.",
    "requirements": [
      "x length D_in, weights D_out×D_in, upstream length D_out.",
      "Return (dx,dw,db), where dx[i]=sum(weights[o][i]*upstream[o]).",
      "Return dw[o][i]=upstream[o]*x[i], db[o]=upstream[o]."
    ],
    "signature": "linear_backward(x, weights, upstream)",
    "starter": "def linear_backward(x, weights, upstream):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "def linear_backward(x,weights,upstream):\n    din=len(x); dout=len(weights)\n    dx=[sum(weights[o][i]*upstream[o] for o in range(dout)) for i in range(din)]\n    dw=[[upstream[o]*x[i] for i in range(din)] for o in range(dout)]\n    return dx,dw,list(upstream)",
    "explanation": [
      "Backpropagation uses the transposed weight action to propagate upstream gradients to inputs.",
      "The weight gradient is an outer product of the upstream vector and the input vector."
    ],
    "complexity": "O(D_in D_out) time and O(D_in D_out) for returned weight gradients.",
    "pitfall": "Do not confuse the weight-gradient shape D_out×D_in with the input-gradient shape D_in.",
    "hints": [
      "Use the contract for linear_backward exactly; trace a tiny numeric example first.",
      "Check that you do not confuse the weight-gradient shape D_out×D_in with the input-gradient shape D_in."
    ],
    "references": [
      {
        "title": "Learning representations by back-propagating errors",
        "url": "https://www.nature.com/articles/323533a0"
      }
    ],
    "tests": [
      {
        "name": "One output",
        "code": "assert linear_backward([2,3],[[4,5]],[6])==([24,30],[[12,18]],[6])"
      },
      {
        "name": "Two outputs",
        "code": "assert linear_backward([1,2],[[1,0],[0,3]],[4,5])==([4,15],[[4,8],[5,10]],[4,5])"
      },
      {
        "name": "Zero upstream",
        "code": "assert linear_backward([2],[[4]], [0])==([0],[[0]],[0])"
      },
      {
        "name": "Negative upstream",
        "code": "assert linear_backward([2],[[-3]],[-2])==([6],[[-4]],[-2])"
      },
      {
        "name": "Shape",
        "code": "dx,dw,db=linear_backward([1,2,3],[[1,2,3],[4,5,6]],[1,1]);assert len(dx)==3 and len(dw)==2 and len(dw[0])==3 and len(db)==2"
      }
    ]
  },
  {
    "id": "autograd-central-difference",
    "number": 90,
    "track": "AI Foundations",
    "difficulty": "Medium",
    "title": "Check a Gradient with Central Differences",
    "duration": "15 min",
    "tags": [
      "central_difference",
      "From Scratch"
    ],
    "description": "Implement a numerical gradient estimate for a scalar-valued Python function, useful for verifying analytic backpropagation.",
    "requirements": [
      "f is a pure scalar function of a scalar x; h is strictly positive.",
      "Return (f(x+h)-f(x-h))/(2*h).",
      "Call f only at x+h and x-h; do not mutate external state."
    ],
    "signature": "central_difference(f, x, h)",
    "starter": "def central_difference(f, x, h):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "def central_difference(f,x,h):\n    return (f(x+h)-f(x-h))/(2*h)",
    "explanation": [
      "Central differences cancel the first-order Taylor truncation error of forward differences.",
      "Numerical checks validate a gradient locally; they are not a substitute for backpropagation at training scale."
    ],
    "complexity": "O(1) scalar function evaluations and memory.",
    "pitfall": "Do not use the one-sided (f(x+h)-f(x))/h formula; it has a different truncation error.",
    "hints": [
      "Use the contract for central_difference exactly; trace a tiny numeric example first.",
      "Check that you do not use the one-sided (f(x+h)-f(x))/h formula; it has a different truncation error."
    ],
    "references": [
      {
        "title": "Learning representations by back-propagating errors",
        "url": "https://www.nature.com/articles/323533a0"
      }
    ],
    "tests": [
      {
        "name": "Quadratic",
        "code": "assert abs(central_difference(lambda v:v*v,3,1e-4)-6)<1e-9"
      },
      {
        "name": "Linear",
        "code": "assert abs(central_difference(lambda v:7*v+2,-4,0.1)-7)<1e-10"
      },
      {
        "name": "Cubic at zero",
        "code": "assert abs(central_difference(lambda v:v**3,0,1e-3))<1e-5"
      },
      {
        "name": "Sinusoid",
        "code": "import math;assert abs(central_difference(math.sin,0.5,1e-5)-math.cos(0.5))<1e-9"
      },
      {
        "name": "Negative slope",
        "code": "assert abs(central_difference(lambda v:-4*v,10,1e-3)+4)<1e-10"
      }
    ]
  },
  {
    "id": "optimizer-sgd-momentum",
    "number": 91,
    "track": "AI Foundations",
    "difficulty": "Medium",
    "title": "Implement One SGD Momentum Update",
    "duration": "15 min",
    "tags": [
      "sgd_momentum",
      "From Scratch"
    ],
    "description": "Write one classical momentum SGD step on a scalar parameter (no dampening, no Nesterov acceleration).",
    "requirements": [
      "param, grad and velocity are floats; lr>=0, 0<=momentum<1.",
      "Compute new_velocity=momentum*velocity+grad.",
      "Return (param-lr*new_velocity, new_velocity); no weight decay."
    ],
    "signature": "sgd_momentum(param, grad, velocity, lr, momentum)",
    "starter": "def sgd_momentum(param, grad, velocity, lr, momentum):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "def sgd_momentum(param,grad,velocity,lr,momentum):\n    v=momentum*velocity+grad\n    return param-lr*v,v",
    "explanation": [
      "Momentum accumulates an exponentially weighted gradient direction across steps.",
      "The velocity state is updated even if lr=0, because it belongs to the optimizer state."
    ],
    "complexity": "O(1) time and space.",
    "pitfall": "Do not apply momentum to the parameter value instead of the previous velocity.",
    "hints": [
      "Use the contract for sgd_momentum exactly; trace a tiny numeric example first.",
      "Check that you do not apply momentum to the parameter value instead of the previous velocity."
    ],
    "references": [
      {
        "title": "Adam: A Method for Stochastic Optimization",
        "url": "https://arxiv.org/abs/1412.6980"
      }
    ],
    "tests": [
      {
        "name": "First step",
        "code": "assert sgd_momentum(3,2,0,0.1,0.9)==(2.8,2.0)"
      },
      {
        "name": "Accumulated momentum",
        "code": "p,v=sgd_momentum(4,3,2,0.2,0.5);assert abs(p-3.2)<1e-12 and abs(v-4)<1e-12"
      },
      {
        "name": "Zero learning rate",
        "code": "assert sgd_momentum(7,2,3,0,0.5)==(7.,3.5)"
      },
      {
        "name": "Negative gradient",
        "code": "assert sgd_momentum(1,-2,0,0.25,0)==(1.5,-2)"
      }
    ]
  },
  {
    "id": "optimizer-adam-bias-correction",
    "number": 92,
    "track": "AI Foundations",
    "difficulty": "Medium",
    "title": "Apply Adam First/Second-Moment Bias Correction",
    "duration": "15 min",
    "tags": [
      "adam_bias_correction",
      "From Scratch"
    ],
    "description": "Correct the initialization bias of Adam exponential moving averages when the moment accumulators started at zero.",
    "requirements": [
      "m and v are scalar moment estimates after step updates; 0<beta1,beta2<1 and step>=1.",
      "Return m_hat=m/(1-beta1**step), v_hat=v/(1-beta2**step).",
      "This exercise does not apply a parameter update."
    ],
    "signature": "adam_bias_correction(m, v, beta1, beta2, step)",
    "starter": "def adam_bias_correction(m, v, beta1, beta2, step):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "def adam_bias_correction(m,v,beta1,beta2,step):\n    return m/(1-beta1**step),v/(1-beta2**step)",
    "explanation": [
      "Zero-initialized moment estimates are biased toward zero early in training.",
      "First and second moments require separate beta powers and separate denominators."
    ],
    "complexity": "O(1) time and space.",
    "pitfall": "Do not use the same beta for both moment estimates or omit the step exponent.",
    "hints": [
      "Use the contract for adam_bias_correction exactly; trace a tiny numeric example first.",
      "Check that you do not use the same beta for both moment estimates or omit the step exponent."
    ],
    "references": [
      {
        "title": "Adam: A Method for Stochastic Optimization",
        "url": "https://arxiv.org/abs/1412.6980"
      }
    ],
    "tests": [
      {
        "name": "Step one",
        "code": "m,v=adam_bias_correction(0.2,0.03,0.8,0.7,1);assert abs(m-1)<1e-12 and abs(v-0.1)<1e-12"
      },
      {
        "name": "Step two",
        "code": "m,v=adam_bias_correction(0.19,0.04,0.9,0.8,2);assert abs(m-1)<1e-12 and abs(v-0.04/0.36)<1e-12"
      },
      {
        "name": "Zero state",
        "code": "assert adam_bias_correction(0,0,0.9,0.999,1)==(0,0)"
      },
      {
        "name": "Long horizon",
        "code": "m,v=adam_bias_correction(0.8,0.5,0.5,0.5,12);assert abs(m-0.8/(1-0.5**12))<1e-12 and abs(v-0.5/(1-0.5**12))<1e-12"
      }
    ]
  },
  {
    "id": "optimizer-adamw-update",
    "number": 93,
    "track": "AI Foundations",
    "difficulty": "Hard",
    "title": "Implement One Decoupled AdamW Step",
    "duration": "15 min",
    "tags": [
      "adamw_step",
      "From Scratch"
    ],
    "description": "Update one scalar parameter with Adam moments and decoupled weight decay. This is a functional step that returns new parameter and moment state.",
    "requirements": [
      "step>=1 and m,v are previous moment estimates; beta1,beta2 in (0,1), eps>0.",
      "First compute m_new=beta1*m+(1-beta1)*g and v_new=beta2*v+(1-beta2)*g*g; bias-correct both using step.",
      "Set p_new=p*(1-lr*weight_decay)-lr*m_hat/(sqrt(v_hat)+eps); return (p_new,m_new,v_new)."
    ],
    "signature": "adamw_step(p, g, m, v, step, lr, beta1, beta2, eps, weight_decay)",
    "starter": "def adamw_step(p, g, m, v, step, lr, beta1, beta2, eps, weight_decay):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\ndef adamw_step(p,g,m,v,step,lr,beta1,beta2,eps,weight_decay):\n    m_new=beta1*m+(1-beta1)*g\n    v_new=beta2*v+(1-beta2)*g*g\n    mh=m_new/(1-beta1**step); vh=v_new/(1-beta2**step)\n    return p*(1-lr*weight_decay)-lr*mh/(math.sqrt(vh)+eps),m_new,v_new",
    "explanation": [
      "The exponential moment updates are part of optimizer state and happen before bias correction.",
      "AdamW weight decay is decoupled: multiply p by 1-lr*weight_decay, rather than adding decay to gradient moments."
    ],
    "complexity": "O(1) time and space for a scalar; elementwise O(d) for vectors.",
    "pitfall": "Do not add weight decay into the gradient before computing Adam moments; that changes the algorithm.",
    "hints": [
      "Use the contract for adamw_step exactly; trace a tiny numeric example first.",
      "Check that you do not add weight decay into the gradient before computing Adam moments; that changes the algorithm."
    ],
    "references": [
      {
        "title": "Decoupled Weight Decay Regularization",
        "url": "https://arxiv.org/abs/1711.05101"
      }
    ],
    "tests": [
      {
        "name": "First step no decay",
        "code": "p,m,v=adamw_step(1,2,0,0,1,0.1,0.9,0.999,1e-8,0);assert abs(p-0.9)<1e-8 and abs(m-0.2)<1e-12 and abs(v-0.004)<1e-12"
      },
      {
        "name": "Decay without gradient",
        "code": "p,m,v=adamw_step(2,0,0,0,1,0.1,0.9,0.999,1e-8,0.5);assert abs(p-1.9)<1e-12 and m==0 and v==0"
      },
      {
        "name": "Different second moment",
        "code": "p,m,v=adamw_step(1,3,1,4,2,0.01,0.5,0.5,1e-8,0);assert abs(m-2)<1e-12 and abs(v-6.5)<1e-12 and p<1"
      },
      {
        "name": "No learning",
        "code": "p,m,v=adamw_step(3,4,0,0,1,0,0.9,0.99,1e-8,0.1);assert p==3 and m>0 and v>0"
      },
      {
        "name": "Negative gradient",
        "code": "p,m,v=adamw_step(0,-1,0,0,1,0.1,0.9,0.999,1e-8,0);assert p>0 and m<0 and v>0"
      }
    ]
  },
  {
    "id": "optimizer-global-norm-clipping",
    "number": 94,
    "track": "AI Foundations",
    "difficulty": "Medium",
    "title": "Clip a Gradient Vector by Global L2 Norm",
    "duration": "15 min",
    "tags": [
      "clip_global_norm",
      "From Scratch"
    ],
    "description": "Protect parameter updates from unusually large gradient magnitudes by clipping the entire gradient vector using one shared scaling factor.",
    "requirements": [
      "grad is a list of reals, max_norm>0.",
      "If L2 norm of grad is <= max_norm, return a copy unchanged; zero/empty gradients stay unchanged.",
      "Otherwise multiply every component by max_norm/norm, preserving the direction."
    ],
    "signature": "clip_global_norm(grad, max_norm)",
    "starter": "def clip_global_norm(grad, max_norm):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\ndef clip_global_norm(grad,max_norm):\n    norm=math.sqrt(sum(g*g for g in grad))\n    scale=min(1.0,max_norm/norm) if norm>0 else 1.0\n    return [g*scale for g in grad]",
    "explanation": [
      "Global norm clipping preserves the ratio among coordinates.",
      "Componentwise clamping is a different operation that changes the gradient direction."
    ],
    "complexity": "O(d) time and O(d) output space.",
    "pitfall": "Do not clamp each gradient component independently; use one vector-wide norm.",
    "hints": [
      "Use the contract for clip_global_norm exactly; trace a tiny numeric example first.",
      "Check that you do not clamp each gradient component independently; use one vector-wide norm."
    ],
    "references": [
      {
        "title": "Adam: A Method for Stochastic Optimization",
        "url": "https://arxiv.org/abs/1412.6980"
      }
    ],
    "tests": [
      {
        "name": "Clip 3-4-5",
        "code": "assert all(abs(a-b)<1e-12 for a,b in zip(clip_global_norm([3,4],2.5),[1.5,2.0]))"
      },
      {
        "name": "No clipping",
        "code": "assert clip_global_norm([1,2],4)==[1,2]"
      },
      {
        "name": "Negative sign",
        "code": "assert clip_global_norm([-6,8],5)==[-3,4]"
      },
      {
        "name": "Zero grad",
        "code": "assert clip_global_norm([0,0],2)==[0,0]"
      },
      {
        "name": "Empty grad",
        "code": "assert clip_global_norm([],2)==[]"
      },
      {
        "name": "Equal norm",
        "code": "assert clip_global_norm([3,4],5)==[3,4]"
      }
    ]
  },
  {
    "id": "rope-rotate-pair",
    "number": 95,
    "track": "Transformer & Vision",
    "difficulty": "Easy",
    "title": "Rotate One 2D Feature Pair with RoPE",
    "duration": "15 min",
    "tags": [
      "rope_pair",
      "From Scratch"
    ],
    "description": "Implement the 2D rotation applied to one pair of query or key channels in Rotary Position Embedding.",
    "requirements": [
      "x,y,angle are finite real scalars; angle is in radians.",
      "Return [x*cos(angle)-y*sin(angle), x*sin(angle)+y*cos(angle)].",
      "Rotation preserves the pair L2 norm (up to floating-point error)."
    ],
    "signature": "rope_pair(x, y, angle)",
    "starter": "def rope_pair(x, y, angle):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\ndef rope_pair(x,y,angle):\n    c,s=math.cos(angle),math.sin(angle)\n    return [x*c-y*s,x*s+y*c]",
    "explanation": [
      "Each RoPE channel pair is multiplied by a proper 2D rotation matrix.",
      "The same angle is applied to the two channels in a pair, giving position-dependent geometry while preserving norm."
    ],
    "complexity": "O(1) time and space.",
    "pitfall": "Do not rotate only one channel or mix degrees and radians.",
    "hints": [
      "Use the contract for rope_pair exactly; trace a tiny numeric example first.",
      "Check that you do not rotate only one channel or mix degrees and radians."
    ],
    "references": [
      {
        "title": "RoFormer: Enhanced Transformer with Rotary Position Embedding",
        "url": "https://arxiv.org/abs/2104.09864"
      }
    ],
    "tests": [
      {
        "name": "Zero angle",
        "code": "assert rope_pair(3,4,0)==[3,4]"
      },
      {
        "name": "Quarter turn",
        "code": "import math;r=rope_pair(1,0,math.pi/2);assert abs(r[0])<1e-12 and abs(r[1]-1)<1e-12"
      },
      {
        "name": "Negative quarter turn",
        "code": "import math;r=rope_pair(0,1,-math.pi/2);assert abs(r[0]-1)<1e-12 and abs(r[1])<1e-12"
      },
      {
        "name": "Norm preserved",
        "code": "import math;r=rope_pair(3,4,0.37);assert abs(sum(v*v for v in r)-25)<1e-10"
      },
      {
        "name": "Nonzero both",
        "code": "import math;r=rope_pair(1,2,math.pi);assert all(abs(a-b)<1e-10 for a,b in zip(r,[-1,-2]))"
      }
    ]
  },
  {
    "id": "rope-position-encoding",
    "number": 96,
    "track": "Transformer & Vision",
    "difficulty": "Medium",
    "title": "Apply RoPE to a Sequence of Token Vectors",
    "duration": "15 min",
    "tags": [
      "apply_rope",
      "From Scratch"
    ],
    "description": "Encode absolute token positions by rotating adjacent channel pairs at position-dependent frequencies (interleaved pair convention).",
    "requirements": [
      "tokens is a list of length-T even-dimensional vectors; all vectors have the same dimension D.",
      "For token position p and channel pair i, angle = p/(base ** (2*i/D)); base>1.",
      "Rotate channels (2*i,2*i+1) using the angle; preserve token and feature order."
    ],
    "signature": "apply_rope(tokens, base)",
    "starter": "def apply_rope(tokens, base):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\ndef apply_rope(tokens,base):\n    if not tokens: return []\n    d=len(tokens[0]);out=[]\n    for p,tok in enumerate(tokens):\n        row=[]\n        for i in range(d//2):\n            a=p/(base**(2*i/d));c,s=math.cos(a),math.sin(a)\n            x,y=tok[2*i],tok[2*i+1]\n            row.extend([x*c-y*s,x*s+y*c])\n        out.append(row)\n    return out",
    "explanation": [
      "RoPE uses a rotation whose angle grows with position and decreases with pair index.",
      "This exercise uses an explicitly interleaved pair convention; production models may use different channel permutations."
    ],
    "complexity": "O(TD) time and O(TD) output space.",
    "pitfall": "Do not give every pair the same frequency or apply position index starting at one.",
    "hints": [
      "Use the contract for apply_rope exactly; trace a tiny numeric example first.",
      "Check that you do not give every pair the same frequency or apply position index starting at one."
    ],
    "references": [
      {
        "title": "RoFormer: Enhanced Transformer with Rotary Position Embedding",
        "url": "https://arxiv.org/abs/2104.09864"
      }
    ],
    "tests": [
      {
        "name": "First position identity",
        "code": "assert apply_rope([[3.,4.,5.,6.]],10000)==[[3.,4.,5.,6.]]"
      },
      {
        "name": "Position one first pair",
        "code": "import math;r=apply_rope([[1,0],[1,0]],10000);assert abs(r[1][0]-math.cos(1))<1e-12 and abs(r[1][1]-math.sin(1))<1e-12"
      },
      {
        "name": "Different frequencies",
        "code": "import math;r=apply_rope([[1,0,1,0],[1,0,1,0]],10000);assert abs(r[1][0]-math.cos(1))<1e-12 and abs(r[1][2]-math.cos(0.01))<1e-12"
      },
      {
        "name": "Norm each token",
        "code": "r=apply_rope([[3,4,0,0],[1,2,3,4],[4,0,0,2]],10000);assert all(abs(sum(v*v for v in out)-sum(v*v for v in tok))<1e-10 for tok,out in zip([[3,4,0,0],[1,2,3,4],[4,0,0,2]],r))"
      },
      {
        "name": "Empty sequence",
        "code": "assert apply_rope([],10000)==[]"
      }
    ]
  },
  {
    "id": "transformer-swiglu",
    "number": 97,
    "track": "Transformer & Vision",
    "difficulty": "Easy",
    "title": "Implement a SwiGLU Activation Branch",
    "duration": "15 min",
    "tags": [
      "swiglu_gate",
      "From Scratch"
    ],
    "description": "Implement the elementwise SwiGLU nonlinearity applied before the final output projection of a gated Transformer MLP.",
    "requirements": [
      "x and gate have equal lengths; all values finite.",
      "Use SiLU(g)=g/(1+exp(-g)); return x[i]*SiLU(gate[i]).",
      "Return a list without any output projection; empty lists are allowed."
    ],
    "signature": "swiglu_gate(x, gate)",
    "starter": "def swiglu_gate(x, gate):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\ndef swiglu_gate(x,gate):\n    def silu(v):\n        return v/(1+math.exp(-v)) if v>=0 else v*math.exp(v)/(1+math.exp(v))\n    return [a*silu(b) for a,b in zip(x,gate)]",
    "explanation": [
      "SwiGLU combines a linear path x with a SiLU-transformed gate.",
      "A numerically stable form handles very negative gates without overflowing exp(-gate)."
    ],
    "complexity": "O(d) time and O(d) output space.",
    "pitfall": "Do not use sigmoid alone; SiLU(v)=v*sigmoid(v), so it can be negative.",
    "hints": [
      "Use the contract for swiglu_gate exactly; trace a tiny numeric example first.",
      "Check that you do not use sigmoid alone; SiLU(v)=v*sigmoid(v), so it can be negative."
    ],
    "references": [
      {
        "title": "GLU Variants Improve Transformer",
        "url": "https://arxiv.org/abs/2002.05202"
      }
    ],
    "tests": [
      {
        "name": "Zero gates",
        "code": "assert swiglu_gate([1,3],[0,0])==[0,0]"
      },
      {
        "name": "Positive gate",
        "code": "import math;r=swiglu_gate([2],[1]);assert abs(r[0]-2/(1+math.exp(-1)))<1e-12"
      },
      {
        "name": "Negative gate",
        "code": "import math;r=swiglu_gate([3],[-1]);assert abs(r[0]-(-3/(1+math.e)))<1e-12"
      },
      {
        "name": "Negative x",
        "code": "import math;r=swiglu_gate([-2],[2]);assert abs(r[0]+4/(1+math.exp(-2)))<1e-12"
      },
      {
        "name": "Empty",
        "code": "assert swiglu_gate([],[])==[]"
      },
      {
        "name": "Stable large negative",
        "code": "assert abs(swiglu_gate([1],[-1000])[0])<1e-100"
      }
    ]
  },
  {
    "id": "attention-key-padding-mask",
    "number": 98,
    "track": "Transformer & Vision",
    "difficulty": "Easy",
    "title": "Apply a Key Padding Mask to Attention Scores",
    "duration": "15 min",
    "tags": [
      "mask_key_padding",
      "From Scratch"
    ],
    "description": "Mask invalid key positions from a single-query attention score vector before softmax.",
    "requirements": [
      "scores and valid_keys have equal length, where valid_keys contains booleans.",
      "Return score if valid_keys[i] else float(\"-inf\") for each position.",
      "Do not change score ordering or apply softmax; at least one key is valid."
    ],
    "signature": "mask_key_padding(scores, valid_keys)",
    "starter": "def mask_key_padding(scores, valid_keys):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "def mask_key_padding(scores,valid_keys):\n    return [s if valid else float('-inf') for s,valid in zip(scores,valid_keys)]",
    "explanation": [
      "Key padding masks prevent attention from allocating probability to padding tokens.",
      "This is different from a causal mask, which blocks future positions according to a query index."
    ],
    "complexity": "O(n) time and O(n) output space.",
    "pitfall": "Do not assign a finite sentinel such as zero, because a valid negative score could be smaller than zero.",
    "hints": [
      "Use the contract for mask_key_padding exactly; trace a tiny numeric example first.",
      "Check that you do not assign a finite sentinel such as zero, because a valid negative score could be smaller than zero."
    ],
    "references": [
      {
        "title": "Attention Is All You Need",
        "url": "https://arxiv.org/abs/1706.03762"
      }
    ],
    "tests": [
      {
        "name": "One pad",
        "code": "assert mask_key_padding([1,2,3],[True,False,True])==[1,float('-inf'),3]"
      },
      {
        "name": "All valid",
        "code": "assert mask_key_padding([-1,0],[True,True])==[-1,0]"
      },
      {
        "name": "First key masked",
        "code": "assert mask_key_padding([4,9,2],[False,True,True])==[float('-inf'),9,2]"
      },
      {
        "name": "Large negative valid",
        "code": "assert mask_key_padding([-1e9,0],[True,False])==[-1e9,float('-inf')]"
      }
    ]
  },
  {
    "id": "diffusion-ddpm-stochastic-step",
    "number": 99,
    "track": "Generative Models",
    "difficulty": "Medium",
    "title": "Sample One DDPM Reverse Gaussian Step",
    "duration": "15 min",
    "tags": [
      "ddpm_reverse_step",
      "From Scratch"
    ],
    "description": "Given a previously computed reverse-process Gaussian mean and variance, sample the next scalar DDPM state. Do not conflate this sampling kernel with the posterior-mean calculation.",
    "requirements": [
      "mean is a scalar reverse mean; variance>=0; noise is a supplied standard-normal draw.",
      "Return mean+sqrt(variance)*noise when timestep>0.",
      "At timestep==0 return mean exactly, ignoring the noise. This adopts the common final-step no-noise convention."
    ],
    "signature": "ddpm_reverse_step(mean, variance, noise, timestep)",
    "starter": "def ddpm_reverse_step(mean, variance, noise, timestep):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\ndef ddpm_reverse_step(mean,variance,noise,timestep):\n    return mean if timestep==0 else mean+math.sqrt(variance)*noise",
    "explanation": [
      "The DDPM sampling kernel draws from a Gaussian parameterized by variance, so the noise coefficient is the standard deviation sqrt(variance).",
      "At the designated final step the exercise omits random noise to return the reverse mean exactly."
    ],
    "complexity": "O(1) time and space.",
    "pitfall": "Do not multiply noise by the variance itself or add random noise at timestep zero.",
    "hints": [
      "Use the contract for ddpm_reverse_step exactly; trace a tiny numeric example first.",
      "Check that you do not multiply noise by the variance itself or add random noise at timestep zero."
    ],
    "references": [
      {
        "title": "Denoising Diffusion Probabilistic Models",
        "url": "https://arxiv.org/abs/2006.11239"
      }
    ],
    "tests": [
      {
        "name": "Final step deterministic",
        "code": "assert ddpm_reverse_step(3,9,20,0)==3"
      },
      {
        "name": "Nonfinal positive noise",
        "code": "assert ddpm_reverse_step(2,4,0.5,3)==3"
      },
      {
        "name": "Negative noise",
        "code": "assert ddpm_reverse_step(3,9,-1,5)==0"
      },
      {
        "name": "Zero variance",
        "code": "assert ddpm_reverse_step(4,0,99,5)==4"
      },
      {
        "name": "Variance is not stdev",
        "code": "assert ddpm_reverse_step(0,16,1,1)==4"
      }
    ]
  },
  {
    "id": "gan-discriminator-logit-gradients",
    "number": 100,
    "track": "Generative Models",
    "difficulty": "Medium",
    "title": "Differentiate the GAN Discriminator Logit Loss",
    "duration": "15 min",
    "tags": [
      "discriminator_logit_grads",
      "From Scratch"
    ],
    "description": "Implement derivatives of the standard logistic discriminator loss with respect to one real and one fake scalar logit.",
    "requirements": [
      "Loss is softplus(-real_logit)+softplus(fake_logit) with no averaging.",
      "Return (sigmoid(real_logit)-1, sigmoid(fake_logit)).",
      "Use a numerically stable sigmoid for large-magnitude logits; gradients are with respect to logits, not model weights."
    ],
    "signature": "discriminator_logit_grads(real_logit, fake_logit)",
    "starter": "def discriminator_logit_grads(real_logit, fake_logit):\n    \"\"\"Implement this precisely specified AI building block.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\ndef discriminator_logit_grads(real_logit,fake_logit):\n    def sigmoid(x):\n        if x>=0:return 1/(1+math.exp(-x))\n        ex=math.exp(x);return ex/(1+ex)\n    return sigmoid(real_logit)-1,sigmoid(fake_logit)",
    "explanation": [
      "The discriminator minimizes negative log sigmoid(real) plus negative log (1-sigmoid(fake)).",
      "Differentiating each logit separately gives sigmoid(real)-1 and sigmoid(fake), with opposite desired gradient directions."
    ],
    "complexity": "O(1) time and space.",
    "pitfall": "Do not return sigmoid(-real) as a positive real-logit gradient; its sign should be negative.",
    "hints": [
      "Use the contract for discriminator_logit_grads exactly; trace a tiny numeric example first.",
      "Check that you do not return sigmoid(-real) as a positive real-logit gradient; its sign should be negative."
    ],
    "references": [
      {
        "title": "Generative Adversarial Nets",
        "url": "https://arxiv.org/abs/1406.2661"
      }
    ],
    "tests": [
      {
        "name": "Both zero",
        "code": "assert discriminator_logit_grads(0,0)==(-0.5,0.5)"
      },
      {
        "name": "Strong correct discrimination",
        "code": "a,b=discriminator_logit_grads(10,-10);assert -0.001<a<0 and 0<b<0.001"
      },
      {
        "name": "Wrong real and fake",
        "code": "a,b=discriminator_logit_grads(-3,3);assert a<-.9 and b>.9"
      },
      {
        "name": "Large logits finite",
        "code": "import math;a,b=discriminator_logit_grads(-1000,1000);assert math.isfinite(a) and math.isfinite(b) and a==-1 and b==1"
      },
      {
        "name": "Asymmetric",
        "code": "import math;a,b=discriminator_logit_grads(2,-1);assert abs(a-(1/(1+math.exp(-2))-1))<1e-12 and abs(b-1/(1+math.exp(1)))<1e-12"
      }
    ]
  }
];
