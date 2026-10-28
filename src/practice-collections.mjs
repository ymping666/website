import { practiceSets } from './practice-sets.mjs';

// Learning units keep stable URLs and sequence IDs. Collections are the primary
// entry points; every unit belongs to exactly one collection and one section.
const translations = {};
const text = (en, zh) => { translations[en] = zh; return en; };
const section = (slug, en, zh, sets) => ({ slug, title:text(en,zh), sets });
export const practiceCollections = [
 {slug:'agents-and-execution', title:text('Agents & Execution Feedback','Agent 与执行反馈'),
  subtitle:text('Build reliable tool loops, coordinate tasks, then learn how execution feedback shapes code-agent training.','从可靠工具循环、任务编排，到执行反馈如何影响代码 Agent 的训练。'),
  description:text('Practice agent engineering in Python: tool validation, ReAct control, fault tolerance and RLEF execution feedback, with tests and worked solutions.','通过 Python 练习工具校验、ReAct 控制、任务容错与 RLEF 执行反馈，按方向选择学习单元，配有浏览器测试和完整题解。'),
  groups:[section('execution','Tools & execution','工具与执行',['agent-execution-reliability','agent-coordination-and-faults']),section('feedback','Learning from execution feedback','从执行反馈学习',['rlef-from-feedback-to-advantage'])]},
 {slug:'world-models-and-rl',title:text('World Models & Reinforcement Learning','世界模型与强化学习'),
  subtitle:text('Connect state estimation and predictive dynamics with policies, planning and action-conditioned video.','把状态估计、动态预测，与策略、规划及动作条件视频联系起来。'),
  description:text('Practice world models and RL in Python: belief updates, predictive dynamics, returns, MPC and uncertainty-aware planning, with tested solutions.','通过 Python 练习信念状态更新、动态预测、回报、MPC 与不确定性规划，按状态建模和决策控制分类，附测试与完整题解。'),
  groups:[section('dynamics','State & predictive dynamics','状态与预测动态',['world-model-belief-and-dynamics','video-dynamics-and-temporal-prediction']),section('control','Policies & planning','策略与规划',['rl-control-basics','world-model-planning'])]},
 {slug:'attention-and-transformers',title:text('Attention & Transformers','Attention 与 Transformer'),
  subtitle:text('Start with stable attention, continue through modern Transformer details, then apply the structure to vision.','从稳定的注意力计算出发，深入现代 Transformer 组件，再延伸到视觉。'),
  description:text('Implement Attention and Transformer components in Python, from stable numerical kernels to RoPE, SwiGLU and ViT, with tests and complete solutions.','用 Python 实现 Attention 与 Transformer 组件，从稳定数值运算到 RoPE、SwiGLU 及 ViT，按基础结构和视觉应用分类练习。'),
  groups:[section('attention','Attention & model structure','注意力与模型结构',['attention-from-scratch','rope-swiglu-transformer-details']),section('vision','Vision Transformers','视觉 Transformer',['vision-transformer-basics'])]},
 {slug:'generative-models-and-flows',title:text('Generative Models & Flow Matching','生成模型与 Flow Matching'),
  subtitle:text('Study diffusion and flow sampling alongside latent representations, adversarial objectives and conditioning.','围绕扩散与流采样，学习潜变量表征、对抗目标和条件控制。'),
  description:text('Practice generative AI in Python: diffusion, guidance, Flow Matching, VAE, VQ-VAE, GAN and DiT conditioning, with tests and complete worked solutions.','通过 Python 练习扩散模型、引导采样、Flow Matching、VAE、VQ-VAE、GAN 与 DiT 条件组件，按方向分类，附完整代码题解。'),
  groups:[section('sampling','Diffusion, guidance & flows','扩散、引导与流',['diffusion-core-and-sampling','classifier-vs-classifier-free-guidance','flow-matching-ode-practice']),section('representation','Latents, objectives & conditioning','潜变量、目标与条件控制',['video-vae-latent-compression','gan-and-dit-normalization'])]},
 {slug:'llm-systems-and-feedback',title:text('LLM Systems & AI Feedback','LLM 系统与 AI 反馈'),
  subtitle:text('Work through retrieval and decoding, evaluate downstream behavior, then explore principle-guided AI feedback.','从检索与解码、下游效果评测，到原则引导的 AI 反馈与偏好学习。'),
  description:text('Practice LLM systems in Python: retrieval, decoding, task-level evaluation and Constitutional AI feedback components, with tests and worked solutions.','通过 Python 练习检索、解码、任务级评测及 Constitutional AI 反馈组件，分为系统评测和原则反馈方向，附测试与完整题解。'),
  groups:[section('systems','Retrieval, decoding & evaluation','检索、解码与评测',['llm-retrieval-decoding','ai-evaluation-and-failures']),section('preferences','Principles & preference learning','原则与偏好学习',['constitutional-ai-from-revision-to-preference'])]},
 {slug:'neural-network-training',title:text('Neural Networks & Optimization','神经网络与优化'),
  subtitle:text('Build spatial kernels, understand normalization and gradients, then implement optimizer updates.','实现空间运算，理解归一化与梯度，再动手编写优化器更新。'),
  description:text('Build neural network components in Python: convolutions, pooling, normalization, manual gradients and optimizer updates, with tests and solutions.','通过 Python 练习卷积、池化、归一化、手动梯度与优化器更新，分空间运算和训练原理两条方向，结合测试与完整题解理解核心计算。'),
  groups:[section('spatial','Convolution & pooling','卷积与池化',['cnn-and-pooling']),section('training','Gradients & optimization','梯度与优化',['normalization-and-gradients','sgd-adam-optimization'])]}
];
practiceCollections[0].groups.push(section('self-improvement','Self-improvement: L0–L3','自我改进：L0–L3',['rsi-l0-practice','rsi-l1-practice','rsi-l2-practice','rsi-l3-practice']));
export const collectionTranslations = {
 ...translations,
 'Choose a topic, then a learning unit.':'先选专题，再选学习单元。',
 'Related exercises stay together; follow a short sequence within each unit.':'相近练习集中在同一专题内，每个学习单元都有明确的练习顺序。',
 'Explore topic →':'进入专题 →',
 'Learning directions':'学习方向',
 'Open learning unit →':'进入学习单元 →',
 'Start this unit →':'开始本单元 →',
 'Learning unit':'学习单元',
 'GUIDED PRACTICE':'专题练习',
 'Browse this topic →':'查看所属专题 →',
 'Other units in this topic':'本专题的其他学习单元',
 'Examples:':'例题：',
 'Some units share prerequisite exercises. Exercise totals count each problem once within this topic.':'部分单元共享先修练习；专题题目数已按题目去重。'
};
export const collectionUnits = collection => collection.groups.flatMap(g=>g.sets.map(slug=>practiceSets.find(s=>s.slug===slug)));
export const collectionProblemIds = collection => [...new Set(collectionUnits(collection).flatMap(s=>s.segments.map(p=>p.id)))];
export const collectionForSet = slug => practiceCollections.find(c=>c.groups.some(g=>g.sets.includes(slug)));
