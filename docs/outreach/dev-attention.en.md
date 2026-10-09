---
title: "Implement scaled dot-product attention in Python, then test the mistakes"
published: false
tags: python, machinelearning, tutorial, testing
---

The compact attention formula hides several implementation decisions: which dimension supplies the scale, where to normalize, and how to keep exponentials numerically stable.

This tutorial implements **one query attending to a nonempty collection of keys and values**. It uses ordinary Python lists so the computations are visible. It is not a multi-head implementation or a performance-oriented training kernel.

## Define the contract first

Let the query and each key have the same positive dimension `d_k`. Each key has one corresponding value vector. All value vectors share a positive dimension, but that dimension can differ from `d_k`.

For each key, compute the query-key dot product divided by `sqrt(d_k)`. Apply Softmax across the keys, then form a weighted sum of the values. This is the scaled dot-product attention operation described in [Attention Is All You Need](https://arxiv.org/abs/1706.03762).

The implementation below assumes valid input shapes and finite numbers whose intermediate dot products remain finite. Validation and handling nonfinite inputs are separate concerns.

## Implement the operation

```python
import math

def scaled_attention(q, keys, values):
    scale = math.sqrt(len(q))
    scores = [sum(a * b for a, b in zip(q, key)) / scale
              for key in keys]
    maximum = max(scores)
    numerators = [math.exp(score - maximum) for score in scores]
    denominator = sum(numerators)
    weights = [value / denominator for value in numerators]
    return [sum(weight * value[j]
                for weight, value in zip(weights, values))
            for j in range(len(values[0]))]
```

Subtracting the maximum does not change the normalized probabilities: the same multiplicative factor would appear in every exponential and cancel between numerator and denominator. It makes the largest exponent zero, which avoids overflow from large finite scores. Extremely small relative contributions may still underflow, and this does not repair an already nonfinite dot product.

## Test equal scores

If all scores are equal, the values should be averaged:

```python
result = scaled_attention([0, 0], [[1, 0], [0, 1]], [[2, 4], [6, 8]])
assert all(abs(a - b) < 1e-9 for a, b in zip(result, [4, 6]))
```

This catches missing normalization and a sum where an average was intended. It cannot catch a missing scale: zero scores stay equal with or without scaling.

## Test the scale independently

Here `d_k=2`, the unscaled dot products are `2` and `0`, and the correct first score is `sqrt(2)`:

```python
expected = math.exp(math.sqrt(2)) / (math.exp(math.sqrt(2)) + 1)
actual = scaled_attention([1, 1], [[1, 1], [0, 0]], [[1], [0]])[0]
assert abs(actual - expected) < 1e-9
```

Dividing by `d_k`, using the value dimension, or omitting the scale produces a different answer. A dedicated case checks something the equal-score example cannot.

## Test stability and the value dimension

```python
dominant = scaled_attention([1000], [[1000], [999]], [[10], [0]])[0]
assert 9 < dominant <= 10
assert scaled_attention([0], [[1], [2]], [[1, 2, 3], [3, 4, 5]]) == [2., 3., 4.]
assert scaled_attention([99], [[7]], [[3, 5]]) == [3., 5.]
```

The first case checks large finite scores. The second checks that output dimensions follow the values, not the query. The third checks that a single key receives all the weight.

## A useful next exercise

Intentionally remove the scale and run the tests. Restore it, then remove maximum subtraction and run them again. Identify which assertion rejects each mistake.

After that, implement causal masking with an explicit contract for fully masked rows, or extend to multiple queries. Keep correctness tests separate from performance benchmarks: passing a tiny reference suite is not a claim about training throughput or full Transformer correctness.
