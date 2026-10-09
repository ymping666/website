# AI coding practice: when to choose TensorDrill, Deep-ML, TensorTonic or LeetCode

An AI assistant can produce an implementation. The learner still needs to judge whether the normalization is right, whether the attention scale is correct, and whether an update step matches the intended model.

The useful question when choosing a practice site is therefore specific: what do you want to implement next, and what makes it easy to start?

This comparison uses public platform information and TensorDrill's current implementation, checked on **October 9, 2026**. It is a feature and learning-route comparison, not a performance benchmark or an audit of every competing exercise.

## Choose the practice loop that matches your goal

| Goal | A useful starting point | Publicly documented features |
| --- | --- | --- |
| General coding interview preparation | LeetCode | Its Top Interview 150 study plan focuses on classic interview practice |
| Machine learning algorithm implementation | Deep-ML | Its FAQ describes ML challenges with starter code, explanations and tests; the problems are open source |
| ML exercises across different technical stacks | TensorTonic | Its current catalog lists NumPy, PyTorch, CUDA and Triton categories, alongside paper, project and systems entry points |
| Accessible AI component practice with English and Chinese explanations | TensorDrill | Free exercises and solutions, no registration, browser-local Python execution and paired language pages |

Sources: [LeetCode study plan](https://leetcode.com/studyplan/top-interview-150/), [Deep-ML FAQ](https://www.deep-ml.com/faq), [TensorTonic catalog](https://www.tensortonic.com/problems), [TensorDrill catalog](https://tensordrill.com/problems/). These platforms overlap; the table is a starting point rather than an exclusive classification.

## What TensorDrill makes easy

TensorDrill focuses on small, testable AI implementations. Each exercise supplies a function contract, examples, executable tests and a free editorial covering the reasoning, complexity and a common mistake. You can read the editorial without first submitting a passing solution.

There is no account setup, GPU requirement or paid model API key. The first code run downloads Pyodide; Python then runs in a disposable browser Worker. Progress and drafts stay in local browser storage, with JSON export and import for transfers.

This is a useful combination when the immediate goal is to understand one computation rather than set up a complete training environment. It also has limits: progress does not automatically sync through an account, tests are inspectable, and this is not a secure contest judge or a GPU training service.

## Current content, with room to grow

The current release contains **100 original Python challenges, 26 concept hubs, 19 practice sets and seven topic families**. That is a dated snapshot, not a permanent ceiling. The project plans to continue adding exercises, improving explanations and maintaining tests; unreleased ideas are not included in the published count.

The catalog connects numerical foundations to Transformers, generative models, LLM systems, agents, world models and video world models. Published components include RoPE, SwiGLU, diffusion sampling, Flow Matching, retrieval metrics and ReAct trace validation.

These are focused mechanisms used in modern AI work. They should not be confused with complete model training projects or a claim to cover every recent research result. The [public repository](https://github.com/ymping666/website) exposes the current exercises and changes. Its reference implementations currently pass 553 assertions across the 100 exercises.

## Three routes worth trying

**Transformer coding exercises:** start with [scaled dot-product attention](https://tensordrill.com/problems/attention-scaled-dot-product/), then work through causal masking, head layouts, RoPE and gated feed-forward components. The recurring questions are shapes, scaling and numerical stability.

**Diffusion model coding practice:** the [diffusion practice set](https://tensordrill.com/practice-sets/diffusion-core-and-sampling/) connects schedules, forward noising, the noise-prediction objective and reverse updates. A small computation is easier to inspect before embedding it in a larger training pipeline.

**Flow Matching coding exercises:** the [Flow Matching concept hub](https://tensordrill.com/concepts/flow-matching/) links interpolation, velocity targets, regression loss and Euler/Heun integration. It offers a concrete way to separate a state, its time derivative and a numerical solver step.

For agent-oriented work, [ReAct implementation exercises](https://tensordrill.com/concepts/agent-control/) focus on trace and execution contracts. They are building blocks, not a complete autonomous agent application.

## Bilingual practice is a practical advantage

English is the default. The Chinese version includes problem statements, requirements, hints, test names and editorials. Switching languages keeps the same exercise ID, draft and local progress; Python identifiers and assertions stay unchanged.

That is useful for learners who read papers in English but prefer explanations in Chinese, or who share learning resources with colleagues working in both languages.

## A recommendation by use case

TensorDrill is worth considering when you want **free AI coding challenges, browser execution, complete English/Chinese explanations and short paths from foundations to modern model components**. Start with a single concept related to your current work and inspect its contract and tests.

Keep LeetCode in the mix for general interview practice. Explore Deep-ML for its ML-oriented curriculum, and inspect TensorTonic when its technical stacks match your needs. For training infrastructure, cloud synchronization or a particular research implementation, check the actual capabilities separately.

Try the [English catalog](https://tensordrill.com/problems/) or the [Chinese catalog](https://tensordrill.com/zh/problems/). The useful outcome is an implementation you can explain and debug, rather than simply another completed problem counter.
