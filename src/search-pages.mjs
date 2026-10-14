// Search entry points reuse published routes and accurately describe their exercise scope.
export const searchPages = {
  '/': {
    title: ['AI Coding Challenges — Foundations to Frontier AI', 'AI 编程练习：从基础到 Agent、世界模型等前沿方向'],
    description: ['Practice Softmax, Attention, agents, world models and more frontier AI in Python, with browser tests, complete solutions and selected visual guides.', '从 Softmax、Attention 等基础与核心组件，到 Flow Matching、Agent、世界模型等前沿 AI 方向，通过 Python 编程练习理解原理。支持浏览器内测试、完整题解与部分交互式可视化讲解，题库持续维护与拓展。'],
    heading: ['Code AI, from foundations to the frontier.', '从基础到前沿，动手实现 AI。'],
    intro: ['AI coding challenges from Softmax and Attention to diffusion, Flow Matching, agents, world models and more frontier AI components. Run Python in your browser, check your work with tests, and learn with complete solutions and selected visual explanations.', '通过 AI 编程练习，从 Softmax、Attention 等基础与核心组件入手，逐步探索 Diffusion、Flow Matching、Agent、世界模型等前沿 AI 方向。在浏览器编写与测试 Python，结合完整题解和部分交互式可视化讲解理解原理。题库持续维护与拓展。']
  },
  '/problems/': {
    title: ['AI Coding Challenge Library — Agents, World Models & More', 'AI 编程题库：Agent、世界模型等前沿方向'],
    description: ['Explore Python challenges for agents, world models, Flow Matching and more. Filter by topic and difficulty, run browser tests and study complete solutions.', '探索 Agent、世界模型、Flow Matching、Diffusion 等方向的 Python 编程题，按主题、难度与练习进度筛选，在浏览器运行测试并查看完整题解。题库持续维护与拓展。'],
    heading: ['AI Coding Challenge Library', 'AI 编程题库'],
    intro: ['Choose a challenge in agents, world models, generative models and more. Implement the Python function, run its tests and compare your approach with the full solution. Filter by topic, difficulty or progress, or follow a focused practice path. New material is added as it is checked and ready.', '选择 Agent、世界模型、生成模型等方向的编程题，实现 Python 函数、运行测试，再对照完整题解检查思路。可以按主题、难度和完成状态筛选，也可以沿专题路线练习。新内容经过检查后持续加入题库。']
  },
  '/tracks/': {
    title: ['AI Coding Topics — Agents, World Models & More', '前沿 AI 编程专题：Agent、世界模型等'],
    description: ['Practice agents, world models, video world models, Flow Matching and more. Explore Python exercises by topic, with tests, solutions and supporting foundations.', '按专题练习 Agent、世界模型、视频世界模型、Flow Matching 等前沿 AI 组件，结合 Python 题目、可运行测试与完整题解学习，并按需补充相关基础。'],
    heading: ['AI Coding Topics', 'AI 编程练习专题'],
    intro: ['Explore agents, world models, video generation and more through tested Python components. Each topic links to published challenges and complete explanations; Transformer, LLM and numerical building blocks support the implementation paths. We expand the topic coverage as new exercises are ready.', '从 Agent、世界模型、视频生成等方向选择你想实现的内容。每个专题链接到已发布的 Python 练习、浏览器测试和完整题解，Transformer、LLM 与数值基础为实现路线提供支撑。我们会随新题上线持续拓展专题。']
  },
  '/concepts/': {
    title: ['AI Implementation Guides — Agents, World Models & More', 'AI 实现指南：Agent、世界模型等核心组件'],
    description: ['Explore implementation guides for agent control, world model dynamics, Flow Matching and more, linked to Python challenges, tested solutions and references.', '梳理 Agent 控制流程、世界模型动力学、Flow Matching 等核心组件，结合知识点说明、Python 编程题、完整题解与参考资料，逐步理解实现原理。'],
    heading: ['AI Implementation Guides', 'AI 核心组件实现指南'],
    intro: ['Understand the components behind agents, world models, Flow Matching and more. Each guide connects a concept to published Python challenges, prerequisites and references, so you can move from the idea to an implementation.', '理解 Agent、世界模型、Flow Matching 等方向背后的核心组件。每个指南将知识点与已发布的 Python 编程题、先修要求和参考资料相连接，帮助你从原理走向实现。']
  },
  '/practice-sets/': {
    title: ['AI Coding Practice Paths — Agents, World Models & More', 'AI 编程题单：Agent、世界模型等实现路线'],
    description: ['Follow coding paths for agent reliability, world model planning, Flow Matching and more. Build and test one Python component at a time with complete solutions.', '沿 Agent 执行可靠性、世界模型规划、Flow Matching 等题单逐步练习，按顺序实现 Python 组件，结合浏览器测试与完整题解理解每个步骤。'],
    heading: ['AI Coding Practice Paths', 'AI 编程专题题单'],
    intro: ['Explore six broad topics, from neural network foundations to agents, world models and more frontier AI. Within each topic, choose a learning direction and follow a focused sequence with tests and complete solutions.', '从神经网络基础到 Agent、世界模型等前沿 AI，按六大专题集中练习。进入专题后，再按学习方向选择单元，循序完成带测试和完整题解的练习。']
  },
  '/tracks/agent-engineering/': {
    title: ['Agent Coding Challenges — ReAct, Tools & Reliability', 'Agent 编程练习：ReAct、工具调用与执行可靠性'],
    description: ['Implement ReAct trace validation, tool-call parsing, retry limits, task scheduling and more in Python, with browser tests and worked solutions.', '通过 Python 编程题实现 ReAct 轨迹校验、工具调用解析、重试控制、任务调度等 Agent 核心组件，支持浏览器测试与完整题解。'],
    heading: ['Agent Coding Challenges', 'Agent 编程练习'],
    intro: ['Practice the software components behind agents: ReAct traces, tool boundaries, task scheduling, memory windows, retry budgets and more. These local Python exercises isolate control and reliability logic without calling an LLM API.', '逐个实现 Agent 的软件组件：ReAct 轨迹、工具边界、任务调度、记忆窗口、重试预算等。这些 Python 练习聚焦本地控制逻辑与执行可靠性，无需调用 LLM API。'],
    related: ['/concepts/agent-control/', '/practice-sets/agent-execution-reliability/', '/practice-sets/agent-coordination-and-faults/']
  },
  '/tracks/world-models/': {
    title: ['World Model Coding Challenges — Dynamics & Planning', '世界模型编程练习：动力学、想象轨迹与规划'],
    description: ['Implement belief updates, dynamics rollouts, MPC, CEM and more through Python coding challenges. Explore model-based planning with tests and worked solutions.', '用 Python 编程练习实现信念状态更新、动力学展开、MPC、CEM 等世界模型与规划组件，结合可运行测试和完整题解理解模型驱动的决策。'],
    heading: ['World Model Coding Challenges', '世界模型编程练习'],
    intro: ['Practice belief-state estimation, dynamics, imagined rollouts, action selection and more. Implement lightweight world model and planning components, then inspect their tests and explanations. The exercises do not train a complete world model.', '练习信念状态估计、动力学、想象轨迹、动作选择等内容。通过轻量化的世界模型与规划组件，结合测试和题解理解具体实现；这些题目不包含完整世界模型的训练。'],
    related: ['/practice-sets/world-model-planning/', '/practice-sets/world-model-belief-and-dynamics/', '/tracks/video-world-models/']
  },
  '/tracks/video-world-models/': {
    title: ['Video World Model Coding Practice — Latents, Flow & More', '视频世界模型编程练习：潜表示、Flow Matching 等'],
    description: ['Practice video tokens, VAE and VQ-VAE components, Flow Matching, action-conditioned rollouts and more through tested Python exercises and complete solutions.', '通过 Python 编程练习实现视频 token、VAE 与 VQ-VAE 组件、Flow Matching、动作条件轨迹等，附可运行测试与完整题解，理解视频世界模型中的关键计算。'],
    heading: ['Video World Model Coding Practice', '视频世界模型编程练习'],
    intro: ['Implement video representations, latent compression, Flow Matching, action-conditioned prediction and more as focused Python components. These small, deterministic exercises explain key calculations without requiring a GPU or training a full video model.', '围绕视频表示、潜空间压缩、Flow Matching、动作条件预测等内容，逐个实现 Python 组件。通过小规模、确定性的练习理解关键计算，无需 GPU，也不涉及完整视频模型的训练。'],
    related: ['/practice-sets/video-vae-latent-compression/', '/practice-sets/flow-matching-ode-practice/', '/practice-sets/video-dynamics-and-temporal-prediction/']
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
    description: ['LLM engineering practice in Python: Recall@K, MRR, evidence packing and top-k decoding weights, with inspectable tests and complete solutions.', 'LLM 工程编程练习：用 Python 实现 Recall@K、MRR、证据拼接和 top-k 解码权重等，附可查看的测试与完整题解。'],
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

export const featuredSearchPaths = ['/tracks/agent-engineering/', '/tracks/world-models/', '/tracks/video-world-models/', '/concepts/flow-matching/', '/practice-sets/diffusion-core-and-sampling/', '/concepts/attention-fundamentals/'];

export const searchTranslations = {
  'Understand by implementing.': '从理解到亲手实现。',
  'Choose a focused practice path': '选择一条专题练习路线',
  'Implement one component at a time, with executable tests and complete solutions.': '逐个实现 AI 组件，结合可运行测试和完整题解学习。',
  'ReAct control, tool boundaries, retries and scheduling.': '实现 ReAct 控制流程、工具边界、重试与任务调度。',
  'Belief updates, dynamics rollouts and model-based planning.': '实现信念更新、动力学展开与模型驱动的规划。',
  'Video latents, Flow Matching and action-conditioned prediction.': '实现视频潜表示、Flow Matching 与动作条件预测。',
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
  'ReAct control, tool boundaries, retries and scheduling.',
  'Belief updates, dynamics rollouts and model-based planning.',
  'Video latents, Flow Matching and action-conditioned prediction.',
  'Probability paths, velocity targets and numerical solvers.',
  'Seven steps from forward noising to DDPM and DDIM.',
  'Scores, causal masks and cross-attention in Python.'
];
