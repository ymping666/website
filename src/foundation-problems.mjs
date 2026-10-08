// v0.9: independently specified AI foundations, Transformer/ViT, and fine-grained generative-model challenges.
export const foundationProblems = [
  {
    "id": "foundation-matmul",
    "number": 51,
    "track": "AI Foundations",
    "difficulty": "Easy",
    "title": "Multiply Two Matrices from Scratch",
    "duration": "12 min",
    "tags": [
      "Linear Algebra",
      "Matrix Multiplication"
    ],
    "description": "Implement basic rectangular matrix multiplication without NumPy. This operation underlies attention projections and patch embeddings.",
    "requirements": [
      "a is m×k and b is k×n; both matrices are nonempty, rectangular, and contain numbers.",
      "Return an m×n list of lists where output[i][j] = sum(a[i][t]*b[t][j] for t in range(k)).",
      "Do not mutate either input; preserve natural row and column order."
    ],
    "signature": "matmul(a, b)",
    "starter": "def matmul(a, b):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "def matmul(a, b):\n    m, k, n = len(a), len(b), len(b[0])\n    return [[sum(a[i][t] * b[t][j] for t in range(k)) for j in range(n)] for i in range(m)]",
    "explanation": [
      "The shared inner dimension k determines the reduction axis.",
      "The output has one row for each row of a and one column for each column of b."
    ],
    "complexity": "O(mkn) time and O(mn) returned matrix space.",
    "pitfall": "Do not multiply elements elementwise; matrix multiplication sums across the shared dimension.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Attention Is All You Need",
        "url": "https://arxiv.org/abs/1706.03762"
      }
    ],
    "tests": [
      {
        "name": "Two by two",
        "code": "assert matmul([[1,2],[3,4]], [[5,6],[7,8]]) == [[19,22],[43,50]]"
      },
      {
        "name": "Non-square",
        "code": "assert matmul([[1,2,3]], [[1],[2],[3]]) == [[14]]"
      },
      {
        "name": "Negative and zero",
        "code": "assert matmul([[0,-1]], [[2,3],[-4,5]]) == [[4,-5]]"
      },
      {
        "name": "Identity",
        "code": "assert matmul([[2,3],[5,7]], [[1,0],[0,1]]) == [[2,3],[5,7]]"
      },
      {
        "name": "Inputs unchanged",
        "code": "a=[[1,2]];b=[[3],[4]];matmul(a,b);assert a==[[1,2]] and b==[[3],[4]]"
      }
    ]
  },
  {
    "id": "foundation-layer-normalization",
    "number": 52,
    "track": "AI Foundations",
    "difficulty": "Easy",
    "title": "Implement Layer Normalization",
    "duration": "12 min",
    "tags": [
      "LayerNorm",
      "Numerical Stability"
    ],
    "description": "Normalize a single feature vector using its population mean and variance (no learnable affine parameters).",
    "requirements": [
      "x is a nonempty list of finite floats, and eps is a positive scalar.",
      "Use mean=sum(x)/len(x) and variance=sum((v-mean)**2)/len(x), not the sample variance.",
      "Return [(v-mean)/sqrt(variance+eps) for v in x] without modifying x."
    ],
    "signature": "layer_norm(x, eps)",
    "starter": "def layer_norm(x, eps):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "import math\n\ndef layer_norm(x, eps):\n    mean = sum(x) / len(x)\n    var = sum((v-mean)**2 for v in x) / len(x)\n    denom = math.sqrt(var + eps)\n    return [(v-mean)/denom for v in x]",
    "explanation": [
      "LayerNorm normalizes across feature positions in one token, not across a batch.",
      "A positive epsilon prevents division by zero for constant vectors."
    ],
    "complexity": "O(d) time and O(d) output space.",
    "pitfall": "Do not divide by d-1 or omit epsilon; both break small and constant inputs.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Attention Is All You Need",
        "url": "https://arxiv.org/abs/1706.03762"
      }
    ],
    "tests": [
      {
        "name": "Symmetric vector",
        "code": "assert all(abs(a-b)<1e-9 for a,b in zip(layer_norm([1.,3.],1e-12),[-1.,1.]))"
      },
      {
        "name": "Constant input",
        "code": "assert layer_norm([5.,5.,5.],1e-5)==[0.0,0.0,0.0]"
      },
      {
        "name": "Single value",
        "code": "assert layer_norm([42.],1e-5)==[0.0]"
      },
      {
        "name": "Translation invariant",
        "code": "a=layer_norm([1.,3.,5.],1e-5);b=layer_norm([101.,103.,105.],1e-5);assert all(abs(x-y)<1e-9 for x,y in zip(a,b))"
      },
      {
        "name": "Population variance scaling",
        "code": "import math; r=layer_norm([1.,2.,3.],1e-12);assert abs(r[0]+math.sqrt(1.5))<1e-8 and abs(sum(r))<1e-9"
      }
    ]
  },
  {
    "id": "foundation-gelu",
    "number": 53,
    "track": "AI Foundations",
    "difficulty": "Easy",
    "title": "Implement Exact GELU Activation",
    "duration": "12 min",
    "tags": [
      "Activation",
      "GELU"
    ],
    "description": "Implement the exact Gaussian Error Linear Unit on a scalar using erf, rather than the optional tanh approximation.",
    "requirements": [
      "x is any finite real scalar.",
      "Return x * 0.5 * (1 + erf(x/sqrt(2))).",
      "Use math.erf and math.sqrt; this problem intentionally tests exact, not tanh-approximated GELU."
    ],
    "signature": "gelu(x)",
    "starter": "def gelu(x):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "import math\n\ndef gelu(x):\n    return 0.5 * x * (1 + math.erf(x / math.sqrt(2.0)))",
    "explanation": [
      "GELU is x times the standard normal cumulative distribution function Φ(x).",
      "The tanh approximation is common, but intentionally a different computational contract."
    ],
    "complexity": "O(1) time and space.",
    "pitfall": "ReLU is not GELU: GELU can return small negative values for negative inputs.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "An Image is Worth 16x16 Words",
        "url": "https://arxiv.org/abs/2010.11929"
      }
    ],
    "tests": [
      {
        "name": "Origin",
        "code": "assert abs(gelu(0.))<1e-12"
      },
      {
        "name": "Positive one",
        "code": "assert abs(gelu(1.) - 0.8413447460685429)<1e-12"
      },
      {
        "name": "Negative one",
        "code": "assert abs(gelu(-1.) - (-0.15865525393145707))<1e-12"
      },
      {
        "name": "Odd relation",
        "code": "assert abs((gelu(2)-gelu(-2))-2)<1e-12"
      },
      {
        "name": "Large negative",
        "code": "assert abs(gelu(-6.))<1e-7"
      }
    ]
  },
  {
    "id": "foundation-sinusoidal-positions",
    "number": 54,
    "track": "AI Foundations",
    "difficulty": "Easy",
    "title": "Compute Sinusoidal Position Encodings",
    "duration": "12 min",
    "tags": [
      "Position Encoding",
      "Transformer"
    ],
    "description": "Implement the absolute sinusoidal encoding from the original Transformer for a single nonnegative token position.",
    "requirements": [
      "d_model is a positive even integer and position is a nonnegative integer.",
      "For i=0...d_model/2-1, use angle=position / (10000 ** (2*i/d_model)).",
      "Return [sin(angle0),cos(angle0),sin(angle1),cos(angle1),...] as floats."
    ],
    "signature": "position_encoding(position, d_model)",
    "starter": "def position_encoding(position, d_model):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "import math\n\ndef position_encoding(position, d_model):\n    out=[]\n    for i in range(d_model//2):\n        angle=position / (10000**(2*i/d_model))\n        out.extend([math.sin(angle),math.cos(angle)])\n    return out",
    "explanation": [
      "Even and odd channels form sine/cosine pairs with geometric wavelength scaling.",
      "Different channel frequencies make relative positions distinguishable without learned tables."
    ],
    "complexity": "O(d_model) time and output space.",
    "pitfall": "Do not use i/d_model in the exponent in place of 2*i/d_model.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Attention Is All You Need",
        "url": "https://arxiv.org/abs/1706.03762"
      }
    ],
    "tests": [
      {
        "name": "Zero position",
        "code": "assert position_encoding(0,4)==[0.0,1.0,0.0,1.0]"
      },
      {
        "name": "Two channels",
        "code": "import math; p=position_encoding(1,2); assert abs(p[0]-math.sin(1))<1e-12 and abs(p[1]-math.cos(1))<1e-12"
      },
      {
        "name": "Different frequencies",
        "code": "import math; p=position_encoding(1,4); assert abs(p[2]-math.sin(0.01))<1e-12"
      },
      {
        "name": "Dimension",
        "code": "assert len(position_encoding(13,8))==8"
      },
      {
        "name": "Position matters",
        "code": "assert position_encoding(2,6)!=position_encoding(3,6)"
      }
    ]
  },
  {
    "id": "attention-scaled-dot-product",
    "number": 55,
    "track": "Transformer & Vision",
    "difficulty": "Medium",
    "title": "Implement Scaled Dot-Product Attention",
    "duration": "20 min",
    "tags": [
      "Attention",
      "Softmax"
    ],
    "description": "For one query vector and multiple key/value vectors, compute softmax(QKᵀ/√dₖ)V with a numerically stable softmax.",
    "requirements": [
      "q and each key are vectors of dₖ>0 elements; values are equally sized vectors of any common positive dimension.",
      "Compute scores = dot(q,key)/sqrt(dₖ); subtract max(scores) before exponentiation.",
      "Return the weighted sum of value vectors. At least one key/value pair is provided."
    ],
    "signature": "scaled_attention(q, keys, values)",
    "starter": "def scaled_attention(q, keys, values):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "import math\n\ndef scaled_attention(q, keys, values):\n    scale=math.sqrt(len(q))\n    logits=[sum(a*b for a,b in zip(q,k))/scale for k in keys]\n    top=max(logits)\n    weights=[math.exp(s-top) for s in logits]\n    total=sum(weights)\n    return [sum(weights[i]*v[j] for i,v in enumerate(values))/total for j in range(len(values[0]))]",
    "explanation": [
      "Attention is a soft weighted average of values; query/key similarity determines the weights.",
      "The square-root scaling uses the key dimension, not the value dimension.",
      "Subtracting the largest logit avoids overflow when scores are large."
    ],
    "complexity": "O(n·dₖ + n·dᵥ) time and O(n+dᵥ) additional space.",
    "pitfall": "Omitting √dₖ changes probability sharpness; omitting stable softmax causes overflow.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Attention Is All You Need",
        "url": "https://arxiv.org/abs/1706.03762"
      }
    ],
    "tests": [
      {
        "name": "Equal scores average",
        "code": "r=scaled_attention([0,0],[[1,0],[0,1]],[[2,4],[6,8]]); assert all(abs(a-b)<1e-9 for a,b in zip(r,[4,6]))"
      },
      {
        "name": "Single key",
        "code": "assert scaled_attention([99],[[7]],[[3,5]])==[3.0,5.0]"
      },
      {
        "name": "High scores stable",
        "code": "r=scaled_attention([1000],[[1000],[999]],[[10],[0]]);assert 9<r[0]<=10"
      },
      {
        "name": "Values different dimension",
        "code": "r=scaled_attention([0],[[1],[2]],[[1,2,3],[3,4,5]]);assert r==[2.,3.,4.]"
      },
      {
        "name": "Correct scaling",
        "code": "import math; r=scaled_attention([1,1],[[1,1],[0,0]],[[1],[0]])[0]; e=math.exp(math.sqrt(2));assert abs(r-e/(e+1))<1e-9"
      }
    ]
  },
  {
    "id": "attention-causal-mask",
    "number": 56,
    "track": "Transformer & Vision",
    "difficulty": "Easy",
    "title": "Build a Causal Attention Mask",
    "duration": "12 min",
    "tags": [
      "Attention Mask",
      "Autoregressive"
    ],
    "description": "Convert a square matrix of attention logits into autoregressive logits that cannot attend to future token positions.",
    "requirements": [
      "logits is an n×n numeric list of lists; n may be zero.",
      "For each row i and column j>i, replace the value with float(\"-inf\").",
      "Preserve j<=i logits exactly; return a new matrix without changing logits."
    ],
    "signature": "causal_mask(logits)",
    "starter": "def causal_mask(logits):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "def causal_mask(logits):\n    return [[v if j<=i else float('-inf') for j,v in enumerate(row)] for i,row in enumerate(logits)]",
    "explanation": [
      "Causal self-attention allows token i to read only positions 0...i.",
      "-∞ logits become zero probability after softmax, provided each row has at least one valid position."
    ],
    "complexity": "O(n²) time and output space.",
    "pitfall": "Mask j>i, not j>=i; each token must be allowed to attend to itself.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Attention Is All You Need",
        "url": "https://arxiv.org/abs/1706.03762"
      }
    ],
    "tests": [
      {
        "name": "Three tokens",
        "code": "a=causal_mask([[1,2,3],[4,5,6],[7,8,9]]);assert a[0][0]==1 and a[0][1]==float('-inf') and a[1][1]==5 and a[1][2]==float('-inf') and a[2]==[7,8,9]"
      },
      {
        "name": "Single token",
        "code": "assert causal_mask([[3]])==[[3]]"
      },
      {
        "name": "Empty",
        "code": "assert causal_mask([])==[]"
      },
      {
        "name": "Input immutable",
        "code": "m=[[1,2],[3,4]];causal_mask(m);assert m==[[1,2],[3,4]]"
      },
      {
        "name": "Diagonal not masked",
        "code": "assert [causal_mask([[9,8],[7,6]])[i][i] for i in range(2)]==[9,6]"
      }
    ]
  },
  {
    "id": "attention-split-heads",
    "number": 57,
    "track": "Transformer & Vision",
    "difficulty": "Easy",
    "title": "Split Token Embeddings into Attention Heads",
    "duration": "12 min",
    "tags": [
      "Multi-Head Attention",
      "Tensor Shape"
    ],
    "description": "Split a sequence of token embeddings along their feature axis into the layout [head][token][feature].",
    "requirements": [
      "tokens has shape [seq_len][d_model] with d_model divisible by positive n_heads; sequence may be empty.",
      "For each token, split features into contiguous chunks of size d_model/n_heads.",
      "Return a new nested list shaped [n_heads][seq_len][d_head]. For empty sequence, return n_heads empty lists."
    ],
    "signature": "split_heads(tokens, n_heads)",
    "starter": "def split_heads(tokens, n_heads):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "def split_heads(tokens, n_heads):\n    if not tokens:\n        return [[] for _ in range(n_heads)]\n    d=len(tokens[0])//n_heads\n    return [[row[h*d:(h+1)*d] for row in tokens] for h in range(n_heads)]",
    "explanation": [
      "Multi-head attention partitions the embedding channels into independent heads.",
      "This operation only reshapes representation; the learned Q/K/V projections happen elsewhere."
    ],
    "complexity": "O(sequence_length × d_model) time and output space.",
    "pitfall": "Do not interleave features across heads or swap the token order.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Attention Is All You Need",
        "url": "https://arxiv.org/abs/1706.03762"
      }
    ],
    "tests": [
      {
        "name": "Two heads",
        "code": "assert split_heads([[1,2,3,4],[5,6,7,8]],2)==[[[1,2],[5,6]],[[3,4],[7,8]]]"
      },
      {
        "name": "One head",
        "code": "assert split_heads([[1,2]],1)==[[[1,2]]]"
      },
      {
        "name": "Empty",
        "code": "assert split_heads([],3)==[[],[],[]]"
      },
      {
        "name": "Feature length one",
        "code": "assert split_heads([[1,2,3]],3)==[[[1]],[[2]],[[3]]]"
      },
      {
        "name": "Input unchanged",
        "code": "x=[[1,2,3,4]];split_heads(x,2);assert x==[[1,2,3,4]]"
      }
    ]
  },
  {
    "id": "attention-merge-heads",
    "number": 58,
    "track": "Transformer & Vision",
    "difficulty": "Easy",
    "title": "Merge Attention Heads Back into Token Embeddings",
    "duration": "12 min",
    "tags": [
      "Multi-Head Attention",
      "Tensor Shape"
    ],
    "description": "Invert a split into [head][token][feature], concatenating each token’s head vectors in head order.",
    "requirements": [
      "heads has shape [n_heads][seq_len][d_head], with n_heads>=1 and equal token counts.",
      "Return [seq_len][n_heads*d_head]; heads are concatenated, not averaged.",
      "Return [] if each head has zero tokens."
    ],
    "signature": "merge_heads(heads)",
    "starter": "def merge_heads(heads):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "def merge_heads(heads):\n    n=len(heads[0])\n    return [[v for head in heads for v in head[t]] for t in range(n)]",
    "explanation": [
      "Attention heads normally operate in parallel and their outputs are concatenated before the output projection.",
      "Concatenation is an inverse data-layout operation of splitting."
    ],
    "complexity": "O(sequence_length × d_model) time and output space.",
    "pitfall": "Averaging heads loses independent feature channels; concatenation preserves them.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Attention Is All You Need",
        "url": "https://arxiv.org/abs/1706.03762"
      }
    ],
    "tests": [
      {
        "name": "Two heads",
        "code": "assert merge_heads([[[1,2],[5,6]],[[3,4],[7,8]]])==[[1,2,3,4],[5,6,7,8]]"
      },
      {
        "name": "One head",
        "code": "assert merge_heads([[[3,4]]])==[[3,4]]"
      },
      {
        "name": "Empty tokens",
        "code": "assert merge_heads([[],[]])==[]"
      },
      {
        "name": "Three heads",
        "code": "assert merge_heads([[[1]],[[2]],[[3]]])==[[1,2,3]]"
      },
      {
        "name": "Input unchanged",
        "code": "a=[[[1]],[[2]]];merge_heads(a);assert a==[[[1]],[[2]]]"
      }
    ]
  },
  {
    "id": "transformer-cross-attention",
    "number": 59,
    "track": "Transformer & Vision",
    "difficulty": "Medium",
    "title": "Implement Multi-Query Cross-Attention",
    "duration": "20 min",
    "tags": [
      "Cross-Attention",
      "Encoder-Decoder"
    ],
    "description": "Implement cross-attention where query tokens come from one sequence and key/value tokens from another (all projections already supplied).",
    "requirements": [
      "queries is [n_q][d_k], keys is [n_k][d_k] and values is [n_k][d_v], with n_q,n_k,d_k,d_v>0.",
      "For each query, softmax its dot-product key scores scaled by sqrt(d_k), subtracting the score maximum before exp.",
      "Return [n_q][d_v] of value-weighted outputs, without modifying inputs."
    ],
    "signature": "cross_attention(queries, keys, values)",
    "starter": "def cross_attention(queries, keys, values):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "import math\n\ndef cross_attention(queries, keys, values):\n    d=len(keys[0]); outputs=[]\n    for q in queries:\n        scores=[sum(x*y for x,y in zip(q,k))/math.sqrt(d) for k in keys]\n        shift=max(scores); weights=[math.exp(s-shift) for s in scores]\n        z=sum(weights)\n        outputs.append([sum(weights[i]*v[j] for i,v in enumerate(values))/z for j in range(len(values[0]))])\n    return outputs",
    "explanation": [
      "Cross-attention differs from self-attention by allowing the queries and keys/values to originate from different sequences.",
      "The output has one row per query even if the number of keys differs."
    ],
    "complexity": "O(n_q n_k (d_k+d_v)) time and O(n_q d_v+n_k) auxiliary space.",
    "pitfall": "Do not assume the query count equals the key count.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Attention Is All You Need",
        "url": "https://arxiv.org/abs/1706.03762"
      }
    ],
    "tests": [
      {
        "name": "Uniform query",
        "code": "assert cross_attention([[0]],[[1],[2]],[[1,3],[5,7]])==[[3.,5.]]"
      },
      {
        "name": "Two distinct queries",
        "code": "r=cross_attention([[1],[-1]],[[1],[-1]],[[10],[0]]);assert r[0][0]>5 and r[1][0]<5"
      },
      {
        "name": "Single source token",
        "code": "assert cross_attention([[1],[2]],[[9]],[[3,4]])==[[3.,4.],[3.,4.]]"
      },
      {
        "name": "Many queries",
        "code": "assert len(cross_attention([[0],[1],[2]],[[1]],[[5]]))==3"
      },
      {
        "name": "Numerical stability",
        "code": "r=cross_attention([[1000]],[[1000],[999]],[[1],[0]]);assert 0.7<r[0][0]<=1"
      }
    ]
  },
  {
    "id": "vit-patchify",
    "number": 60,
    "track": "Transformer & Vision",
    "difficulty": "Easy",
    "title": "Patchify a Grayscale Image for ViT",
    "duration": "12 min",
    "tags": [
      "ViT",
      "Patch Embedding"
    ],
    "description": "Split a 2D grayscale image into non-overlapping, flattened patches using row-major patch-grid order.",
    "requirements": [
      "image is H×W (rectangular) with positive H,W divisible by positive patch_size.",
      "Visit patches left-to-right across each patch-grid row, then top-to-bottom.",
      "Flatten pixels within a patch row-by-row and return a list of patches; do not modify image."
    ],
    "signature": "patchify(image, patch_size)",
    "starter": "def patchify(image, patch_size):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "def patchify(image, patch_size):\n    h,w=len(image),len(image[0]);p=patch_size\n    return [[image[r+dr][c+dc] for dr in range(p) for dc in range(p)] for r in range(0,h,p) for c in range(0,w,p)]",
    "explanation": [
      "ViT turns an image into a sequence of local patches, then projects each patch to a token embedding.",
      "This task covers extraction and flattening only: it deliberately does not silently add a learned patch projection."
    ],
    "complexity": "O(HW) time and output space.",
    "pitfall": "Do not flatten whole-image rows before grouping each spatial patch.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "An Image is Worth 16x16 Words",
        "url": "https://arxiv.org/abs/2010.11929"
      }
    ],
    "tests": [
      {
        "name": "Four patches",
        "code": "assert patchify([[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]],2)==[[1,2,5,6],[3,4,7,8],[9,10,13,14],[11,12,15,16]]"
      },
      {
        "name": "Non-square image",
        "code": "assert patchify([[1,2,3,4],[5,6,7,8]],2)==[[1,2,5,6],[3,4,7,8]]"
      },
      {
        "name": "Pixel patches",
        "code": "assert patchify([[1,2],[3,4]],1)==[[1],[2],[3],[4]]"
      },
      {
        "name": "One patch",
        "code": "assert patchify([[1,2],[3,4]],2)==[[1,2,3,4]]"
      },
      {
        "name": "Input unchanged",
        "code": "im=[[1,2],[3,4]];patchify(im,1);assert im==[[1,2],[3,4]]"
      }
    ]
  },
  {
    "id": "vit-class-token",
    "number": 61,
    "track": "Transformer & Vision",
    "difficulty": "Easy",
    "title": "Prepend a ViT Class Token and Add Position Embeddings",
    "duration": "12 min",
    "tags": [
      "ViT",
      "Class Token"
    ],
    "description": "Construct the ViT encoder input by prepending a class embedding and adding position embeddings to every token.",
    "requirements": [
      "patches contains n projected patch vectors of dimension d; cls_token has dimension d.",
      "positions contains n+1 positional vectors of dimension d, including one for the class token.",
      "Return [n+1][d] where row0=cls_token+positions[0] and row i+1=patches[i]+positions[i+1]."
    ],
    "signature": "prepare_vit_tokens(patches, cls_token, positions)",
    "starter": "def prepare_vit_tokens(patches, cls_token, positions):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "def prepare_vit_tokens(patches, cls_token, positions):\n    tokens=[cls_token]+patches\n    return [[x+p for x,p in zip(t,pos)] for t,pos in zip(tokens,positions)]",
    "explanation": [
      "The class token occupies sequence index 0 and receives its own positional embedding.",
      "The patch projection output is already supplied, so this isolates sequence assembly."
    ],
    "complexity": "O((n+1)d) time and output space.",
    "pitfall": "Do not forget to add positional embeddings to the class token itself.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "An Image is Worth 16x16 Words",
        "url": "https://arxiv.org/abs/2010.11929"
      }
    ],
    "tests": [
      {
        "name": "One patch",
        "code": "assert prepare_vit_tokens([[3,4]],[1,2],[[10,20],[30,40]])==[[11,22],[33,44]]"
      },
      {
        "name": "No patches",
        "code": "assert prepare_vit_tokens([],[1,2],[[3,4]])==[[4,6]]"
      },
      {
        "name": "Two patches",
        "code": "assert prepare_vit_tokens([[1],[2]],[0],[[1],[10],[20]])==[[1],[11],[22]]"
      },
      {
        "name": "All zero positions",
        "code": "assert prepare_vit_tokens([[3,4]],[1,2],[[0,0],[0,0]])==[[1,2],[3,4]]"
      },
      {
        "name": "Does not mutate",
        "code": "p=[[1]];c=[2];pos=[[3],[4]];prepare_vit_tokens(p,c,pos);assert p==[[1]] and c==[2] and pos==[[3],[4]]"
      }
    ]
  },
  {
    "id": "transformer-prenorm-residual",
    "number": 62,
    "track": "Transformer & Vision",
    "difficulty": "Medium",
    "title": "Implement a Pre-LayerNorm Residual Sub-Layer",
    "duration": "20 min",
    "tags": [
      "Residual Connection",
      "Pre-LayerNorm"
    ],
    "description": "Apply the pre-normalization residual rule used by modern Transformers: y = x + sublayer(normalize(x)).",
    "requirements": [
      "x is a numeric vector; normalize and sublayer are deterministic callables returning same-length vectors.",
      "Call normalize on x, then call sublayer exactly once on the normalized result.",
      "Return x + sublayer(normalize(x)) elementwise without mutating the input."
    ],
    "signature": "pre_norm_residual(x, normalize, sublayer)",
    "starter": "def pre_norm_residual(x, normalize, sublayer):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "def pre_norm_residual(x, normalize, sublayer):\n    z=normalize(x)\n    out=sublayer(z)\n    return [a+b for a,b in zip(x,out)]",
    "explanation": [
      "Pre-norm means normalization happens before the attention/MLP sub-layer.",
      "The residual bypass adds the original unnormalized x to the sub-layer output."
    ],
    "complexity": "O(d) arithmetic work excluding callable cost, O(d) output.",
    "pitfall": "Post-norm computes normalize(x + sublayer(x)) and is not equivalent.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "An Image is Worth 16x16 Words",
        "url": "https://arxiv.org/abs/2010.11929"
      }
    ],
    "tests": [
      {
        "name": "Identity functions",
        "code": "assert pre_norm_residual([1,2],lambda z:z,lambda z:z)==[2,4]"
      },
      {
        "name": "Normalize first",
        "code": "assert pre_norm_residual([1,3],lambda z:[v-2 for v in z],lambda z:[2*v for v in z])==[-1,5]"
      },
      {
        "name": "Empty vectors",
        "code": "assert pre_norm_residual([],lambda z:z,lambda z:z)==[]"
      },
      {
        "name": "No mutation",
        "code": "x=[2,4];pre_norm_residual(x,lambda z:[0,0],lambda z:z);assert x==[2,4]"
      },
      {
        "name": "Call ordering",
        "code": "calls=[];norm=lambda z:(calls.append('norm') or z);f=lambda z:(calls.append('block') or z);pre_norm_residual([1],norm,f);assert calls==['norm','block']"
      }
    ]
  },
  {
    "id": "gan-discriminator-bce",
    "number": 63,
    "track": "Generative Models",
    "difficulty": "Easy",
    "title": "Compute GAN Discriminator Logistic Loss",
    "duration": "12 min",
    "tags": [
      "GAN",
      "Discriminator"
    ],
    "description": "Implement the standard logistic discriminator BCE objective directly from logits using numerically stable softplus.",
    "requirements": [
      "real_logits and fake_logits are nonempty equally sized lists of finite real-valued logits.",
      "Per paired real/fake sample compute softplus(-real_logit) + softplus(fake_logit).",
      "Return the mean of that SUM across pairs (do not divide by two again)."
    ],
    "signature": "discriminator_loss(real_logits, fake_logits)",
    "starter": "def discriminator_loss(real_logits, fake_logits):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "import math\n\ndef discriminator_loss(real_logits, fake_logits):\n    sp=lambda x: max(0.0,x)+math.log1p(math.exp(-abs(x)))\n    return sum(sp(-r)+sp(f) for r,f in zip(real_logits,fake_logits))/len(real_logits)",
    "explanation": [
      "BCEWithLogits can be computed without ever applying sigmoid explicitly.",
      "D minimizes negative log probability of real being real and fake being fake."
    ],
    "complexity": "O(n) time, O(1) extra space.",
    "pitfall": "Do not average over both terms again unless your objective explicitly defines that convention.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Generative Adversarial Nets",
        "url": "https://arxiv.org/abs/1406.2661"
      }
    ],
    "tests": [
      {
        "name": "Zero logits",
        "code": "import math; assert abs(discriminator_loss([0],[0])-2*math.log(2))<1e-12"
      },
      {
        "name": "Perfect classifier",
        "code": "assert discriminator_loss([10],[-10])<0.001"
      },
      {
        "name": "Wrong classifier",
        "code": "assert discriminator_loss([-10],[10])>19"
      },
      {
        "name": "Averaging pairs",
        "code": "import math; x=discriminator_loss([0,0],[0,0]); assert abs(x-2*math.log(2))<1e-12"
      },
      {
        "name": "Large stable",
        "code": "assert 1999.9<discriminator_loss([-1000],[1000])<2000.1"
      }
    ]
  },
  {
    "id": "gan-generator-nonsaturating",
    "number": 64,
    "track": "Generative Models",
    "difficulty": "Easy",
    "title": "Compute Non-Saturating GAN Generator Loss",
    "duration": "12 min",
    "tags": [
      "GAN",
      "Generator"
    ],
    "description": "Implement the common non-saturating generator objective: make generated samples receive high discriminator real logits.",
    "requirements": [
      "fake_logits is a nonempty list of finite numbers.",
      "For each generated sample use softplus(-fake_logit), equivalent to -log(sigmoid(fake_logit)).",
      "Return the mean across generated samples and use a numerically stable implementation."
    ],
    "signature": "generator_loss(fake_logits)",
    "starter": "def generator_loss(fake_logits):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "import math\n\ndef generator_loss(fake_logits):\n    return sum(max(0.0,-x)+math.log1p(math.exp(-abs(x))) for x in fake_logits)/len(fake_logits)",
    "explanation": [
      "The generator tries to increase D(fake) instead of directly minimizing log(1-D(fake)).",
      "The non-saturating loss produces more useful gradients when the discriminator is confident early on."
    ],
    "complexity": "O(n) time and O(1) extra space.",
    "pitfall": "Do not reuse the discriminator fake loss softplus(fake_logit); its sign points in the wrong direction.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Generative Adversarial Nets",
        "url": "https://arxiv.org/abs/1406.2661"
      }
    ],
    "tests": [
      {
        "name": "Zero logit",
        "code": "import math; assert abs(generator_loss([0])-math.log(2))<1e-12"
      },
      {
        "name": "Strong fake realism",
        "code": "assert generator_loss([10])<0.001"
      },
      {
        "name": "Bad fake realism",
        "code": "assert 999<generator_loss([-1000])<1001"
      },
      {
        "name": "Batch mean",
        "code": "import math; assert abs(generator_loss([0,0])-math.log(2))<1e-12"
      },
      {
        "name": "Monotonic",
        "code": "assert generator_loss([-2])>generator_loss([2])"
      }
    ]
  },
  {
    "id": "gan-gradient-penalty",
    "number": 65,
    "track": "Generative Models",
    "difficulty": "Medium",
    "title": "Implement the WGAN-GP Gradient Penalty",
    "duration": "20 min",
    "tags": [
      "GAN",
      "Regularization"
    ],
    "description": "Compute the WGAN-GP norm penalty for supplied critic gradients on interpolated data samples (no autodiff required).",
    "requirements": [
      "gradients is a nonempty list of equally sized nonempty gradient vectors; penalty_weight is nonnegative.",
      "For each gradient g compute (sqrt(sum(g_i*g_i)) - 1)**2.",
      "Return penalty_weight times the mean squared norm deviation. This excludes the Wasserstein critic loss itself."
    ],
    "signature": "gradient_penalty(gradients, penalty_weight)",
    "starter": "def gradient_penalty(gradients, penalty_weight):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "import math\n\ndef gradient_penalty(gradients, penalty_weight):\n    return penalty_weight * sum((math.sqrt(sum(x*x for x in g))-1)**2 for g in gradients)/len(gradients)",
    "explanation": [
      "The interpolated sample gradient is computed upstream; here we implement only the scalar norm penalty.",
      "WGAN-GP encourages the critic gradient norm near one, not zero."
    ],
    "complexity": "O(batch_size × feature_dim) time and O(1) additional space.",
    "pitfall": "Squared L2 norm is not the same as (L2 norm minus one) squared.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Improved Training of Wasserstein GANs",
        "url": "https://arxiv.org/abs/1704.00028"
      }
    ],
    "tests": [
      {
        "name": "Unit norm",
        "code": "assert gradient_penalty([[3/5,4/5]],10)==0.0"
      },
      {
        "name": "Zero norm",
        "code": "assert gradient_penalty([[0,0]],10)==10.0"
      },
      {
        "name": "Norm two",
        "code": "assert gradient_penalty([[2,0]],5)==5.0"
      },
      {
        "name": "Batch mean",
        "code": "assert gradient_penalty([[0,0],[1,0]],2)==1.0"
      },
      {
        "name": "Zero weight",
        "code": "assert gradient_penalty([[2]],0)==0.0"
      }
    ]
  },
  {
    "id": "diffusion-linear-beta",
    "number": 66,
    "track": "Generative Models",
    "difficulty": "Easy",
    "title": "Build a Linear DDPM Beta Schedule",
    "duration": "12 min",
    "tags": [
      "Diffusion",
      "Noise Schedule"
    ],
    "description": "Create the per-step forward-noise variance schedule βₜ in a simple DDPM configuration.",
    "requirements": [
      "steps is a positive integer; 0<beta_start<=beta_end<1.",
      "For steps>1, beta[t]=beta_start+(beta_end-beta_start)*t/(steps-1) for t=0..steps-1.",
      "For steps==1 return [beta_start]; do not return cumulative products in this task."
    ],
    "signature": "linear_beta_schedule(steps, beta_start, beta_end)",
    "starter": "def linear_beta_schedule(steps, beta_start, beta_end):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "def linear_beta_schedule(steps, beta_start, beta_end):\n    if steps==1:\n        return [beta_start]\n    return [beta_start+(beta_end-beta_start)*t/(steps-1) for t in range(steps)]",
    "explanation": [
      "Beta controls noise added by each forward transition.",
      "A beta schedule is not the same object as alpha_bar; alpha_bar is the cumulative product of 1-beta."
    ],
    "complexity": "O(steps) time and space.",
    "pitfall": "Do not confuse βₜ and cumulative ̅αₜ.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Denoising Diffusion Probabilistic Models",
        "url": "https://arxiv.org/abs/2006.11239"
      }
    ],
    "tests": [
      {
        "name": "Five steps",
        "code": "x=linear_beta_schedule(5,0.1,0.5);assert all(abs(a-b)<1e-12 for a,b in zip(x,[0.1,0.2,0.3,0.4,0.5]))"
      },
      {
        "name": "One step",
        "code": "assert linear_beta_schedule(1,0.01,0.1)==[0.01]"
      },
      {
        "name": "Constant beta",
        "code": "assert linear_beta_schedule(4,0.05,0.05)==[0.05]*4"
      },
      {
        "name": "Endpoints",
        "code": "a=linear_beta_schedule(7,0.001,0.02);assert a[0]==0.001 and abs(a[-1]-0.02)<1e-12"
      },
      {
        "name": "Increasing",
        "code": "a=linear_beta_schedule(10,0.0001,0.02);assert all(b>a for a,b in zip(a,a[1:]))"
      }
    ]
  },
  {
    "id": "diffusion-alpha-bar",
    "number": 67,
    "track": "Generative Models",
    "difficulty": "Easy",
    "title": "Compute Cumulative Diffusion Alphas",
    "duration": "12 min",
    "tags": [
      "Diffusion",
      "Alpha Bar"
    ],
    "description": "Given a forward diffusion variance schedule, compute ̅αₜ = ∏ₛ₌₁ᵗ(1-βₛ).",
    "requirements": [
      "betas is a list (possibly empty) whose entries satisfy 0<beta<1.",
      "Set alpha_t=1-beta_t and multiply alphas cumulatively in input order.",
      "Return every cumulative product as a new list; empty input returns []."
    ],
    "signature": "cumulative_alphas(betas)",
    "starter": "def cumulative_alphas(betas):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "def cumulative_alphas(betas):\n    out=[];prod=1.0\n    for beta in betas:\n        prod*=1-beta\n        out.append(prod)\n    return out",
    "explanation": [
      "Products accumulate the signal retention of all preceding noise steps.",
      "This cumulative quantity appears in the closed-form q(x_t | x_0) forward distribution."
    ],
    "complexity": "O(T) time and output space.",
    "pitfall": "Do not sum betas or multiply betas together.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Denoising Diffusion Probabilistic Models",
        "url": "https://arxiv.org/abs/2006.11239"
      }
    ],
    "tests": [
      {
        "name": "Two transitions",
        "code": "x=cumulative_alphas([0.1,0.2]); assert abs(x[0]-0.9)<1e-12 and abs(x[1]-0.72)<1e-12"
      },
      {
        "name": "Empty",
        "code": "assert cumulative_alphas([])==[]"
      },
      {
        "name": "One",
        "code": "assert abs(cumulative_alphas([0.25])[0]-0.75)<1e-12"
      },
      {
        "name": "Three",
        "code": "x=cumulative_alphas([0.5]*3);assert x==[0.5,0.25,0.125]"
      },
      {
        "name": "Decreasing",
        "code": "x=cumulative_alphas([0.1]*4);assert all(b<a for a,b in zip(x,x[1:]))"
      }
    ]
  },
  {
    "id": "diffusion-forward-sampling",
    "number": 68,
    "track": "Generative Models",
    "difficulty": "Easy",
    "title": "Sample the DDPM Forward Process",
    "duration": "12 min",
    "tags": [
      "Diffusion",
      "Forward Process"
    ],
    "description": "Implement the closed-form forward noising equation xₜ = √ᾱₜ x₀ + √(1−ᾱₜ) ε using supplied noise.",
    "requirements": [
      "x0 and noise are numeric lists of equal length; alpha_bar is a scalar in [0,1].",
      "Return the elementwise mixture sqrt(alpha_bar)*x0[i] + sqrt(1-alpha_bar)*noise[i].",
      "Do not draw random noise; the noise vector is supplied for deterministic testing."
    ],
    "signature": "q_sample(x0, noise, alpha_bar)",
    "starter": "def q_sample(x0, noise, alpha_bar):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "import math\n\ndef q_sample(x0, noise, alpha_bar):\n    a=math.sqrt(alpha_bar); b=math.sqrt(1-alpha_bar)\n    return [a*x+b*y for x,y in zip(x0,noise)]",
    "explanation": [
      "The closed form samples x_t directly from x0 without simulating all previous t steps.",
      "alpha_bar, not the single-step alpha, controls the coefficient at timestep t."
    ],
    "complexity": "O(d) time and returned space.",
    "pitfall": "Do not mix alpha_bar and sqrt(alpha_bar): both coefficients have square roots.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Denoising Diffusion Probabilistic Models",
        "url": "https://arxiv.org/abs/2006.11239"
      }
    ],
    "tests": [
      {
        "name": "Pure data",
        "code": "assert q_sample([1,2],[9,8],1)==[1.0,2.0]"
      },
      {
        "name": "Pure noise",
        "code": "assert q_sample([1,2],[9,8],0)==[9.0,8.0]"
      },
      {
        "name": "Equal mixture explicit",
        "code": "import math; a=q_sample([2,0],[0,2],0.5); assert all(abs(v-math.sqrt(2))<1e-12 for v in a)"
      },
      {
        "name": "Empty",
        "code": "assert q_sample([],[],0.3)==[]"
      },
      {
        "name": "No mutation",
        "code": "a=[1];b=[2];q_sample(a,b,0.7);assert a==[1] and b==[2]"
      }
    ]
  },
  {
    "id": "diffusion-noise-mse",
    "number": 69,
    "track": "Generative Models",
    "difficulty": "Easy",
    "title": "Compute the DDPM Noise Prediction Loss",
    "duration": "12 min",
    "tags": [
      "Diffusion",
      "Training Objective"
    ],
    "description": "Train an epsilon-prediction diffusion model by measuring MSE between estimated and sampled Gaussian noise vectors.",
    "requirements": [
      "predicted and target are equal-length numeric lists; either may be empty only when both are empty.",
      "Return the mean over all elements of (predicted[i]-target[i])**2.",
      "Return 0.0 on an empty vector. The network and its timestep conditioning are outside this task."
    ],
    "signature": "epsilon_prediction_mse(predicted, target)",
    "starter": "def epsilon_prediction_mse(predicted, target):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "def epsilon_prediction_mse(predicted, target):\n    return sum((x-y)**2 for x,y in zip(predicted,target))/len(predicted) if predicted else 0.0",
    "explanation": [
      "The simplified DDPM epsilon objective regresses the noise ε used to create noisy inputs.",
      "It is a loss component, not a complete DDPM model or training optimizer."
    ],
    "complexity": "O(d) time, O(1) additional space.",
    "pitfall": "Dividing by batch size only, rather than total scalar elements, changes the defined mean.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Denoising Diffusion Probabilistic Models",
        "url": "https://arxiv.org/abs/2006.11239"
      }
    ],
    "tests": [
      {
        "name": "Two values",
        "code": "assert epsilon_prediction_mse([0,2],[1,0])==2.5"
      },
      {
        "name": "Matching",
        "code": "assert epsilon_prediction_mse([1,2],[1,2])==0.0"
      },
      {
        "name": "Single",
        "code": "assert epsilon_prediction_mse([3],[1])==4.0"
      },
      {
        "name": "Empty",
        "code": "assert epsilon_prediction_mse([],[])==0.0"
      },
      {
        "name": "Negative targets",
        "code": "assert epsilon_prediction_mse([-1,1],[1,-1])==4.0"
      }
    ]
  },
  {
    "id": "diffusion-reconstruct-x0",
    "number": 70,
    "track": "Generative Models",
    "difficulty": "Easy",
    "title": "Reconstruct Clean Data from Predicted Noise",
    "duration": "12 min",
    "tags": [
      "Diffusion",
      "Denoising"
    ],
    "description": "Invert the DDPM forward mixing equation to obtain an x0 estimate from xt and a predicted noise vector.",
    "requirements": [
      "xt and eps have equal length; alpha_bar is in (0,1].",
      "Use x0_hat=(xt - sqrt(1-alpha_bar)*eps)/sqrt(alpha_bar) elementwise.",
      "When alpha_bar=1, simply return a copy of xt. No clipping is performed."
    ],
    "signature": "predict_x0_from_eps(xt, eps, alpha_bar)",
    "starter": "def predict_x0_from_eps(xt, eps, alpha_bar):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "import math\n\ndef predict_x0_from_eps(xt, eps, alpha_bar):\n    return [(x-math.sqrt(1-alpha_bar)*e)/math.sqrt(alpha_bar) for x,e in zip(xt,eps)]",
    "explanation": [
      "The inverse follows directly from rearranging the forward diffusion equation.",
      "Clipping or dynamic thresholding are separate modeling choices and not part of this algebraic component."
    ],
    "complexity": "O(d) time and returned space.",
    "pitfall": "Do not divide by alpha_bar rather than its square root.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Denoising Diffusion Probabilistic Models",
        "url": "https://arxiv.org/abs/2006.11239"
      }
    ],
    "tests": [
      {
        "name": "Recover x0",
        "code": "import math; x=math.sqrt(0.25)*2+math.sqrt(0.75)*4;assert abs(predict_x0_from_eps([x],[4],0.25)[0]-2)<1e-12"
      },
      {
        "name": "No noise",
        "code": "assert predict_x0_from_eps([2,3],[1,9],1)==[2.0,3.0]"
      },
      {
        "name": "Alpha quarter",
        "code": "assert predict_x0_from_eps([2],[0],0.25)==[4.0]"
      },
      {
        "name": "Empty",
        "code": "assert predict_x0_from_eps([],[],0.5)==[]"
      },
      {
        "name": "Vector",
        "code": "import math;r=predict_x0_from_eps([1,2],[0,0],0.25);assert r==[2.0,4.0]"
      }
    ]
  },
  {
    "id": "diffusion-ddpm-posterior",
    "number": 71,
    "track": "Generative Models",
    "difficulty": "Medium",
    "title": "Compute the DDPM Posterior Mean",
    "duration": "20 min",
    "tags": [
      "DDPM",
      "Posterior"
    ],
    "description": "Compute the exact forward posterior mean of q(x_{t-1} | x_t, x0) for a single diffusion step.",
    "requirements": [
      "xt and x0 are equal-length numeric vectors; alpha_t and alpha_bar_prev are in (0,1), so alpha_bar_t=alpha_t*alpha_bar_prev.",
      "Let beta_t=1-alpha_t and denom=1-alpha_t*alpha_bar_prev.",
      "Return coeff_x0*x0 + coeff_xt*xt, with coeff_x0=beta_t*sqrt(alpha_bar_prev)/denom and coeff_xt=sqrt(alpha_t)*(1-alpha_bar_prev)/denom."
    ],
    "signature": "ddpm_posterior_mean(xt, x0, alpha_t, alpha_bar_prev)",
    "starter": "def ddpm_posterior_mean(xt, x0, alpha_t, alpha_bar_prev):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "import math\n\ndef ddpm_posterior_mean(xt, x0, alpha_t, alpha_bar_prev):\n    beta=1-alpha_t\n    denom=1-alpha_t*alpha_bar_prev\n    c0=beta*math.sqrt(alpha_bar_prev)/denom\n    ct=math.sqrt(alpha_t)*(1-alpha_bar_prev)/denom\n    return [c0*x+ct*y for x,y in zip(x0,xt)]",
    "explanation": [
      "The forward diffusion chain admits an analytical Gaussian posterior conditioned on x0.",
      "Reverse samplers often plug an estimated x0 into this posterior mean; this function does not sample noise."
    ],
    "complexity": "O(d) time and output space.",
    "pitfall": "Do not replace alpha_bar_prev with alpha_t; they refer to different statistics.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Denoising Diffusion Probabilistic Models",
        "url": "https://arxiv.org/abs/2006.11239"
      }
    ],
    "tests": [
      {
        "name": "Zero vectors",
        "code": "assert ddpm_posterior_mean([0],[0],0.9,0.8)==[0.0]"
      },
      {
        "name": "Scalar checked",
        "code": "import math; r=ddpm_posterior_mean([2],[4],0.9,0.8)[0];a=(0.1*math.sqrt(0.8)*4+math.sqrt(0.9)*0.2*2)/(1-0.72);assert abs(r-a)<1e-12"
      },
      {
        "name": "Vector linearity",
        "code": "r=ddpm_posterior_mean([1,2],[0,0],0.8,0.75);assert abs(r[1]-2*r[0])<1e-12"
      },
      {
        "name": "No mutation",
        "code": "x=[1];y=[2];ddpm_posterior_mean(x,y,0.8,0.8);assert x==[1] and y==[2]"
      },
      {
        "name": "x0 only",
        "code": "import math;r=ddpm_posterior_mean([0],[1],0.5,0.5)[0];assert abs(r-(0.5*math.sqrt(0.5)/0.75))<1e-12"
      }
    ]
  },
  {
    "id": "diffusion-cfg-epsilon",
    "number": 72,
    "track": "Generative Models",
    "difficulty": "Easy",
    "title": "Implement Classifier-Free Guidance for Noise Prediction",
    "duration": "12 min",
    "tags": [
      "Diffusion",
      "Classifier-Free Guidance"
    ],
    "description": "Combine separate unconditional and conditional epsilon predictions into a guided diffusion noise estimate.",
    "requirements": [
      "eps_uncond and eps_cond are numeric vectors of equal length; guidance_scale is any finite scalar.",
      "Return eps_uncond + guidance_scale * (eps_cond-eps_uncond) elementwise.",
      "Scale 0 gives unconditional output; scale 1 gives conditional output; scale >1 extrapolates beyond the conditional prediction."
    ],
    "signature": "cfg_epsilon(eps_uncond, eps_cond, guidance_scale)",
    "starter": "def cfg_epsilon(eps_uncond, eps_cond, guidance_scale):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "def cfg_epsilon(eps_uncond, eps_cond, guidance_scale):\n    return [u+guidance_scale*(c-u) for u,c in zip(eps_uncond,eps_cond)]",
    "explanation": [
      "Classifier-free guidance needs conditional and unconditional model outputs, not a separately trained classifier gradient.",
      "Different papers use different guidance-scale parameterizations; this exercise explicitly uses u+s(c-u)."
    ],
    "complexity": "O(d) time and output space.",
    "pitfall": "Do not confuse the scalar interpolation/extrapolation with classifier guidance based on ∇log p(y|x_t).",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Classifier-Free Diffusion Guidance",
        "url": "https://arxiv.org/abs/2207.12598"
      }
    ],
    "tests": [
      {
        "name": "Unconditional at zero",
        "code": "assert cfg_epsilon([1,2],[3,4],0)==[1,2]"
      },
      {
        "name": "Conditional at one",
        "code": "assert cfg_epsilon([1,2],[3,4],1)==[3,4]"
      },
      {
        "name": "Extrapolate",
        "code": "assert cfg_epsilon([1,2],[3,4],2)==[5,6]"
      },
      {
        "name": "Negative scale",
        "code": "assert cfg_epsilon([1],[3],-1)==[-1]"
      },
      {
        "name": "Empty",
        "code": "assert cfg_epsilon([],[],5)==[]"
      },
      {
        "name": "No mutation",
        "code": "u=[1];c=[2];cfg_epsilon(u,c,3);assert u==[1] and c==[2]"
      }
    ]
  },
  {
    "id": "diffusion-classifier-guidance",
    "number": 73,
    "track": "Generative Models",
    "difficulty": "Medium",
    "title": "Apply Classifier Gradient Guidance to a Reverse Mean",
    "duration": "20 min",
    "tags": [
      "Diffusion",
      "Classifier Guidance"
    ],
    "description": "Implement a simplified classifier-guided Gaussian reverse-step mean shift μ_guided = μ + scale Σ∇log p(y|x_t).",
    "requirements": [
      "mean, variance and log_prob_gradient are equally sized vectors; variance[i]>=0 represents a diagonal reverse covariance element.",
      "For coordinate i return mean[i] + scale*variance[i]*log_prob_gradient[i].",
      "This is a reverse-Gaussian mean-shift component: the classifier gradient is supplied, not learned or calculated here."
    ],
    "signature": "classifier_guided_mean(mean, variance, log_prob_gradient, scale)",
    "starter": "def classifier_guided_mean(mean, variance, log_prob_gradient, scale):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "def classifier_guided_mean(mean, variance, log_prob_gradient, scale):\n    return [m+scale*v*g for m,v,g in zip(mean,variance,log_prob_gradient)]",
    "explanation": [
      "Classifier guidance uses the gradient of a classifier log-likelihood to steer the sampling distribution.",
      "For a diagonal covariance, multiply each gradient coordinate by its corresponding variance before adding it to the reverse mean.",
      "This simplified step is not a classifier network and not classifier-free guidance."
    ],
    "complexity": "O(d) time and output space.",
    "pitfall": "Do not mix this variance-weighted classifier-gradient update with the CFG conditional/unconditional blend.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Diffusion Models Beat GANs on Image Synthesis",
        "url": "https://arxiv.org/abs/2105.05233"
      }
    ],
    "tests": [
      {
        "name": "Scale zero",
        "code": "assert classifier_guided_mean([1,2],[2,3],[3,4],0)==[1,2]"
      },
      {
        "name": "Positive gradient",
        "code": "assert classifier_guided_mean([1,2],[2,3],[3,4],1)==[7,14]"
      },
      {
        "name": "Negative gradient",
        "code": "assert classifier_guided_mean([0],[2],[-3],0.5)==[-3]"
      },
      {
        "name": "Zero variance",
        "code": "assert classifier_guided_mean([1],[0],[100],2)==[1]"
      },
      {
        "name": "Different coordinates",
        "code": "assert classifier_guided_mean([1,1],[1,10],[2,2],1)==[3,21]"
      },
      {
        "name": "No mutation",
        "code": "a=[1];b=[2];c=[3];classifier_guided_mean(a,b,c,1);assert a==[1] and b==[2] and c==[3]"
      }
    ]
  },
  {
    "id": "diffusion-ddim-deterministic",
    "number": 74,
    "track": "Generative Models",
    "difficulty": "Medium",
    "title": "Implement One Deterministic DDIM Step",
    "duration": "20 min",
    "tags": [
      "Diffusion",
      "DDIM"
    ],
    "description": "Use epsilon prediction to compute a deterministic eta=0 DDIM update between two noise levels.",
    "requirements": [
      "xt and eps_hat are equal-length vectors; 0<alpha_bar_t<=alpha_bar_prev<=1.",
      "Compute x0_hat = (xt-sqrt(1-alpha_bar_t)*eps_hat)/sqrt(alpha_bar_t).",
      "Return sqrt(alpha_bar_prev)*x0_hat + sqrt(1-alpha_bar_prev)*eps_hat. Do not inject fresh noise."
    ],
    "signature": "ddim_step(xt, eps_hat, alpha_bar_t, alpha_bar_prev)",
    "starter": "def ddim_step(xt, eps_hat, alpha_bar_t, alpha_bar_prev):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "import math\n\ndef ddim_step(xt, eps_hat, alpha_bar_t, alpha_bar_prev):\n    x0=[(x-math.sqrt(1-alpha_bar_t)*e)/math.sqrt(alpha_bar_t) for x,e in zip(xt,eps_hat)]\n    return [math.sqrt(alpha_bar_prev)*z+math.sqrt(1-alpha_bar_prev)*e for z,e in zip(x0,eps_hat)]",
    "explanation": [
      "DDIM can traverse noise levels deterministically when eta=0.",
      "The predicted clean sample is reconstructed first, then re-mixed at the previous noise level."
    ],
    "complexity": "O(d) time and output space.",
    "pitfall": "Do not add stochastic noise or confuse alpha_bar_prev with the per-step alpha.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Denoising Diffusion Implicit Models",
        "url": "https://arxiv.org/abs/2010.02502"
      }
    ],
    "tests": [
      {
        "name": "Final clean endpoint",
        "code": "import math;xt=[math.sqrt(.25)*2+math.sqrt(.75)*4];assert abs(ddim_step(xt,[4],.25,1)[0]-2)<1e-12"
      },
      {
        "name": "Same step identity",
        "code": "r=ddim_step([1,2],[0,3],0.5,0.5);assert all(abs(x-y)<1e-12 for x,y in zip(r,[1,2]))"
      },
      {
        "name": "Zero noise",
        "code": "assert ddim_step([1],[0],.25,1)==[2.0]"
      },
      {
        "name": "Empty",
        "code": "assert ddim_step([],[],.25,.5)==[]"
      },
      {
        "name": "Vector",
        "code": "import math;a=ddim_step([2,4],[0,0],.25,1);assert a==[4.0,8.0]"
      }
    ]
  },
  {
    "id": "dit-adaln-modulation",
    "number": 75,
    "track": "Generative Models",
    "difficulty": "Medium",
    "title": "Implement Adaptive Layer Normalization (AdaLN)",
    "duration": "20 min",
    "tags": [
      "DiT",
      "AdaLN"
    ],
    "description": "Apply a conditional feature-wise affine modulation to a LayerNorm-normalized token using y=LN(x)*(1+scale)+shift.",
    "requirements": [
      "x, shift and scale are equal-length nonempty vectors; eps is a positive scalar.",
      "Compute population mean/variance of x over its feature axis, then normalize with sqrt(var+eps).",
      "Return normalized_x[i]*(1+scale[i])+shift[i] for every feature."
    ],
    "signature": "adaptive_layer_norm(x, shift, scale, eps)",
    "starter": "def adaptive_layer_norm(x, shift, scale, eps):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "import math\n\ndef adaptive_layer_norm(x, shift, scale, eps):\n    mu=sum(x)/len(x)\n    var=sum((v-mu)**2 for v in x)/len(x)\n    den=math.sqrt(var+eps)\n    return [((v-mu)/den)*(1+s)+b for v,s,b in zip(x,scale,shift)]",
    "explanation": [
      "AdaLN conditions normalized feature vectors through per-feature shift and scale.",
      "DiT commonly uses modulations with the (1+scale) parameterization.",
      "The conditioning network that predicts shift/scale is not part of this isolated kernel."
    ],
    "complexity": "O(d) time and output space.",
    "pitfall": "Do not multiply raw x by scale; normalize first and use 1+scale.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Scalable Diffusion Models with Transformers",
        "url": "https://arxiv.org/abs/2212.09748"
      }
    ],
    "tests": [
      {
        "name": "Constant input uses shift",
        "code": "assert adaptive_layer_norm([2,2],[3,4],[8,9],1e-5)==[3.0,4.0]"
      },
      {
        "name": "Zero conditioning",
        "code": "r=adaptive_layer_norm([1,3],[0,0],[0,0],1e-12);assert abs(r[0]+1)<1e-9 and abs(r[1]-1)<1e-9"
      },
      {
        "name": "Scale negative one",
        "code": "assert adaptive_layer_norm([1,3],[5,6],[-1,-1],1e-5)==[5.0,6.0]"
      },
      {
        "name": "Per-feature shift",
        "code": "r=adaptive_layer_norm([1,3],[1,2],[0,0],1e-12);assert abs(r[0]-0)<1e-9 and abs(r[1]-3)<1e-9"
      },
      {
        "name": "Input unchanged",
        "code": "x=[1,3];b=[0,0];s=[1,1];adaptive_layer_norm(x,b,s,1e-5);assert x==[1,3] and s==[1,1]"
      }
    ]
  },
  {
    "id": "dit-adaln-zero-gate",
    "number": 76,
    "track": "Generative Models",
    "difficulty": "Easy",
    "title": "Implement an AdaLN-Zero Residual Gate",
    "duration": "12 min",
    "tags": [
      "DiT",
      "AdaLN-Zero"
    ],
    "description": "Implement the residual gate used with AdaLN-Zero after a conditioning-modulated Transformer sub-layer has produced its block output.",
    "requirements": [
      "x, block_output and gate are equal-length numeric vectors.",
      "Return y[i] = x[i] + gate[i]*block_output[i] elementwise.",
      "Zero gate must be an exact identity: all output entries equal x. This task isolates gating, not the normalization calculation."
    ],
    "signature": "gated_adaln_residual(x, block_output, gate)",
    "starter": "def gated_adaln_residual(x, block_output, gate):\n    \"\"\"Implement the specified AI building block.\"\"\"\n    # TODO: replace pass with your implementation\n    pass",
    "solution": "def gated_adaln_residual(x, block_output, gate):\n    return [a+g*b for a,b,g in zip(x,block_output,gate)]",
    "explanation": [
      "The zero-initialized gate ensures the conditioned block starts as an identity residual connection.",
      "AdaLN shift and scale transform the block input, whereas the gate multiplies its output.",
      "This task is one component, not the complete DiT transformer block."
    ],
    "complexity": "O(d) time and output space.",
    "pitfall": "Applying gate to x rather than to the sub-layer output destroys identity behavior at initialization.",
    "hints": [
      "Start from the exact mathematical definition in the problem statement.",
      "Check dimensions, normalization and the supplied corner-case tests before submitting."
    ],
    "references": [
      {
        "title": "Scalable Diffusion Models with Transformers",
        "url": "https://arxiv.org/abs/2212.09748"
      }
    ],
    "tests": [
      {
        "name": "Zero gate identity",
        "code": "assert gated_adaln_residual([1,2],[100,100],[0,0])==[1,2]"
      },
      {
        "name": "One gate",
        "code": "assert gated_adaln_residual([1,2],[3,4],[1,1])==[4,6]"
      },
      {
        "name": "Fractional gates",
        "code": "assert gated_adaln_residual([1,2],[4,4],[0.5,-0.5])==[3.0,0.0]"
      },
      {
        "name": "Different channels",
        "code": "assert gated_adaln_residual([0,0,0],[1,2,3],[1,0,2])==[1,0,6]"
      },
      {
        "name": "Empty",
        "code": "assert gated_adaln_residual([],[],[])==[]"
      }
    ]
  }
];
