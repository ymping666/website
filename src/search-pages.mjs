// Search entry points reuse published routes and accurately describe their exercise scope.
export const searchPages = {
  '/': {
    title: ['Free AI Coding Challenges & Machine Learning Practice', 'AI 编程刷题：免费的机器学习与深度学习练习'],
    description: ['Practice AI with 100 free Python coding challenges: machine learning foundations, Transformers, Attention, Diffusion, Flow Matching and LLM engineering.', '100 道免费的 AI 编程刷题题目，涵盖机器学习编程练习、深度学习练习题、Transformer、Attention、Diffusion、Flow Matching 与 LLM 工程，支持浏览器运行和中文题解。'],
    heading: ['AI coding challenges.', 'AI 编程刷题。'],
    intro: ['Free machine learning and deep learning coding exercises in Python. Implement CNNs, Attention and Transformers, then practice Diffusion, Flow Matching and LLM engineering. Run tests in your browser and learn from worked solutions.', '免费的机器学习编程练习与深度学习练习题。从 CNN、Attention 和 Transformer 的代码实现开始，逐步练习 Diffusion、Flow Matching 与 LLM 工程。在浏览器运行测试，结合中文题解理解每个实现。']
  },
  '/problems/': {
    title: ['AI Coding Challenges — Python Practice Problems', 'AI 编程刷题题库：机器学习与深度学习练习题'],
    description: ['Browse 100 free AI coding challenges in Python. Filter machine learning and deep learning exercises by topic, difficulty and your practice progress.', '浏览 100 道免费的 AI 编程刷题题目，练习机器学习、深度学习、Transformer、扩散模型和智能体实现，按知识主题、难度及刷题进度筛选。'],
    heading: ['AI Coding Challenges', 'AI 编程刷题题库'],
    intro: ['Choose a machine learning or deep learning coding exercise, implement the Python function, run its tests and compare your reasoning with the free solution. Filter by topic, difficulty or solved status, or start with a focused practice path below.', '选择一道机器学习编程练习或深度学习练习题，实现 Python 函数、运行测试，再对照免费题解检查思路。可以按知识主题、难度和完成状态筛选，也可以从下方的专题路线开始。']
  },
  '/tracks/': {
    title: ['Machine Learning & Deep Learning Practice Topics', '机器学习与深度学习编程练习专题'],
    description: ['Find AI coding practice by topic: mathematical foundations, Transformers, generative models, LLM engineering, agents and world models.', '按专题选择机器学习与深度学习编程练习，涵盖数学基础、Transformer、生成模型、LLM 工程、智能体和世界模型。'],
    heading: ['AI Coding Practice by Topic', 'AI 编程练习专题'],
    intro: ['Choose a topic that matches what you want to implement. Each topic links to published Python exercises with browser tests and free explanations, from numerical foundations to LLM systems and world models.', '按你想实现的内容选择专题。每个专题都链接到已发布的 Python 练习、浏览器测试和免费题解，覆盖数值基础、LLM 系统与世界模型。']
  },
  '/tracks/ai-foundations/': {
    title: ['Machine Learning & Deep Learning Coding Exercises', '机器学习编程练习与深度学习练习题'],
    description: ['Implement machine learning and deep learning foundations in Python: matrix operations, CNNs, normalization, backpropagation, AdamW and gradient clipping.', '用 Python 完成机器学习编程练习与深度学习练习题：矩阵运算、CNN、归一化、反向传播、AdamW 与梯度裁剪，附测试和题解。'],
    heading: ['Machine Learning & Deep Learning Coding Exercises', '机器学习编程练习与深度学习练习题'],
    intro: ['Build the numerical foundations of AI by implementing small Python functions. Practice matrix operations, CNN convolution and pooling, normalization, manual gradients, optimizers and reinforcement learning basics before moving to larger architectures.', '通过实现小型 Python 函数掌握 AI 的数值基础。这组机器学习编程练习与深度学习练习题覆盖矩阵运算、CNN 卷积与池化、归一化、手写梯度、优化器和强化学习基础，为更复杂的模型打好基础。']
  },
  '/tracks/transformer-vision/': {
    title: ['Transformer Coding Exercises — Attention, RoPE & ViT', 'Transformer 编程练习题：Attention、RoPE 与 ViT'],
    description: ['Solve Transformer coding exercises in Python: scaled dot-product Attention, causal masks, multi-head layouts, RoPE, residual blocks and ViT patch tokens.', 'Transformer 编程练习题：用 Python 实现 Attention、因果掩码、多头布局、RoPE、残差模块和 ViT 图像分块，附浏览器测试与题解。'],
    heading: ['Transformer Coding Exercises', 'Transformer 编程练习题'],
    intro: ['Implement Transformer components one function at a time: Attention scores, causal and padding masks, head splitting and merging, RoPE, SwiGLU and pre-norm residual blocks. The vision exercises add patch tokens and class-token assembly for ViT.', '逐个函数完成 Transformer 编程练习题：实现 Attention 得分、因果与填充掩码、多头拆分和合并、RoPE、SwiGLU 及预归一化残差模块。视觉方向还包括 ViT 图像分块和类别 token 组装。'],
    related: ['/concepts/attention-fundamentals/', '/practice-sets/attention-from-scratch/', '/concepts/vision-transformer/']
  },
  '/tracks/llm-systems/': {
    title: ['LLM Engineering Practice — Retrieval & Decoding', 'LLM 工程编程练习：检索评估与解码'],
    description: ['LLM engineering practice in Python: Recall@K, MRR, evidence packing, stable softmax and top-k decoding weights. Free exercises with local tests.', 'LLM 工程编程练习：用 Python 实现 Recall@K、MRR、证据拼接、稳定 softmax 和 top-k 解码权重，附免费题解与本地测试。'],
    heading: ['LLM Engineering Practice', 'LLM 工程编程练习'],
    intro: ['Practice the retrieval and decoding mechanics around LLM applications. Implement ranking metrics, pack evidence within a context budget and compute stable sampling weights. These exercises run locally without a model API key.', '练习 LLM 应用中的检索与解码机制：实现排序指标、在上下文预算内组织证据，并计算稳定的采样权重。这些练习在本地运行，无需模型 API 密钥。'],
    related: ['/practice-sets/llm-retrieval-decoding/', '/concepts/agent-control/']
  },
  '/concepts/attention-fundamentals/': {
    title: ['Attention Mechanism Code Implementation — Python Exercises', 'Attention 机制代码实现：Python 编程练习'],
    description: ['Implement the Attention mechanism in Python with exercises on scaled dot-product Attention, causal masking and cross-attention, plus tests and solutions.', 'Attention 机制代码实现练习：用 Python 实现缩放点积注意力、因果掩码和交叉注意力，通过可运行测试和中文题解理解 Q、K、V 的计算。'],
    heading: ['Attention Mechanism Code Implementation', 'Attention 机制代码实现'],
    intro: ['Work through the Attention mechanism from scores to weighted values. Implement scaled dot-product Attention, enforce causal information flow and compute cross-attention with separate query and context sequences. Each exercise includes a precise function contract and inspectable tests.', '从得分到加权求和，逐步完成 Attention 机制代码实现：实现缩放点积注意力，限制因果信息流，再用不同的查询与上下文序列计算交叉注意力。每道题都给出明确的函数约定和可查看的测试。'],
    related: ['/concepts/multi-head-attention/', '/concepts/attention-padding-masks/', '/tracks/transformer-vision/']
  },
  '/concepts/flow-matching/': {
    title: ['Flow Matching Coding Exercises — Paths, Velocity & ODEs', 'Flow Matching 编程练习：概率路径、速度场与 ODE'],
    description: ['Flow Matching coding exercises in Python: linear interpolation, conditional velocity, regression loss, Euler and Heun solvers, and classifier-free guidance.', 'Flow Matching 编程练习：用 Python 实现线性插值、条件速度、回归损失、Euler 与 Heun 求解器，以及分类器无关引导。'],
    heading: ['Flow Matching Coding Exercises', 'Flow Matching 编程练习'],
    intro: ['Learn Flow Matching by implementing the arithmetic behind probability paths and velocity targets. Practice velocity regression, Euler and Heun integration, and classifier-free guidance for velocity predictions. These are deterministic components rather than a full model-training pipeline.', '通过实现概率路径和速度目标的计算学习 Flow Matching。练习速度回归、Euler 与 Heun 积分，以及速度预测的分类器无关引导。这些题聚焦确定性的模型组件，帮助你理解完整训练与采样流程中的具体步骤。'],
    related: ['/practice-sets/flow-matching-ode-practice/', '/practice-sets/diffusion-core-and-sampling/']
  },
  '/practice-sets/diffusion-core-and-sampling/': {
    title: ['Diffusion Model Coding Practice — DDPM & DDIM', 'Diffusion 扩散模型编程练习：DDPM 与 DDIM'],
    description: ['Diffusion model coding practice in Python: beta schedules, forward noising, noise loss, x0 reconstruction, DDPM posterior means and DDIM sampling.', 'Diffusion 扩散模型编程练习：实现 beta 调度、前向加噪、噪声损失、x0 重建、DDPM 后验均值和 DDIM 采样，附 Python 测试与题解。'],
    heading: ['Diffusion Model Coding Practice', 'Diffusion 扩散模型编程练习'],
    intro: ['Follow seven Python exercises from the Diffusion forward process to reverse sampling. Implement beta schedules, cumulative alphas, noisy samples, noise regression loss, clean-sample reconstruction, DDPM posterior means and deterministic DDIM steps.', '沿着七道 Python 练习，从 Diffusion 前向过程走到反向采样。逐步实现 beta 调度、累积 alpha、加噪样本、噪声回归损失、干净样本重建、DDPM 后验均值和确定性 DDIM 步骤。'],
    related: ['/concepts/diffusion-forward/', '/concepts/ddpm-reverse-sampling/', '/concepts/diffusion-guidance/', '/concepts/flow-matching/']
  },
  '/concepts/agent-control/': {
    title: ['ReAct Agent Implementation Exercises — Control & Tools', 'ReAct 智能体实现练习：控制流程与工具调用'],
    description: ['ReAct agent implementation exercises in Python: validate traces, parse tool calls, limit retries and control reflection loops, with tests and solutions.', 'ReAct 智能体实现练习：用 Python 验证推理与行动轨迹、解析工具调用、限制重试并控制反思循环，附测试和中文题解。'],
    heading: ['ReAct Agent Implementation Exercises', 'ReAct 智能体实现练习'],
    intro: ['Implement the control rules around a ReAct agent: tool-call parsing, retry limits, valid Thought–Action–Observation traces and bounded reflection. These exercises focus on local control logic; completing them does not assemble a full agent connected to an LLM.', '实现 ReAct 智能体周边的控制规则：工具调用解析、重试上限、有效的 Thought–Action–Observation 轨迹和有边界的反思。这些练习聚焦本地控制逻辑，帮助你理解连接 LLM 的完整智能体所需的基础组件。'],
    related: ['/practice-sets/agent-execution-reliability/', '/problems/react-trace-validator/', '/tracks/llm-systems/']
  }
};

export const featuredSearchPaths = ['/tracks/transformer-vision/', '/concepts/attention-fundamentals/', '/concepts/flow-matching/', '/practice-sets/diffusion-core-and-sampling/', '/concepts/agent-control/'];

export const searchTranslations = {
  'Understand by implementing.': '从理解到亲手实现。',
  'Choose a focused practice path': '选择一条专题练习路线',
  'Implement one component at a time, with executable tests and free solutions.': '逐个实现模型组件，结合可运行测试和免费题解学习。',
  'Related practice': '相关练习',
  'Explore the next component or follow a guided exercise sequence.': '继续练习下一个组件，或按题单循序实现。',
  'Transformer components, from Attention to ViT.': '从 Attention 到 ViT，逐步实现 Transformer 组件。',
  'Scores, causal masks and cross-attention in Python.': '用 Python 实现得分、因果掩码与交叉注意力。',
  'Probability paths, velocity targets and numerical solvers.': '实现概率路径、速度目标与数值求解器。',
  'Seven steps from forward noising to DDPM and DDIM.': '从前向加噪到 DDPM 与 DDIM 的七步练习。',
  'Trace validation, tool calls, retries and reflection limits.': '实现轨迹验证、工具调用、重试与反思边界。',
  ...Object.fromEntries(Object.values(searchPages).flatMap(page => ['title','description','heading','intro'].map(key => page[key])))
};

export const featuredSearchSummaries = [
  'Transformer components, from Attention to ViT.',
  'Scores, causal masks and cross-attention in Python.',
  'Probability paths, velocity targets and numerical solvers.',
  'Seven steps from forward noising to DDPM and DDIM.',
  'Trace validation, tool calls, retries and reflection limits.'
];
