// Each research topic is split into deterministic, independently tested components.
export const feedbackConcepts=[
 {slug:'rlef-execution-feedback',title:'RLEF: Execution Feedback & Reinforcement Learning',family:'Applied Systems',
  summary:'Practice RLEF coding components in Python: public-test repair control, execution and reference-policy rewards, and undiscounted turn advantages.',
  prerequisites:'Understand Python control flow, natural log probabilities and a value baseline. Begin with the existing ReAct trace exercise if agent loops are new to you.',
  ids:['rlef-public-test-controller','rlef-shaped-turn-reward','rlef-undiscounted-advantages'],
  reference:{title:'Gehring et al. · RLEF · §2',url:'https://arxiv.org/html/2410.02089v2#S2'}},
 {slug:'constitutional-ai-feedback',title:'Constitutional AI: Critique, Revision & AI Feedback',family:'Applied Systems',
  summary:'Practice Constitutional AI components in Python: revision training pairs, normalized AI preference labels and a stable soft-label preference loss.',
  prerequisites:'Understand lists, dictionaries, stable Softmax and binary cross-entropy. These exercises transform supplied feedback; they do not judge whether an answer is harmless.',
  ids:['constitutional-revision-dataset','constitutional-soft-preference','constitutional-preference-loss'],
  reference:{title:'Bai et al. · Constitutional AI · §3–4',url:'https://arxiv.org/pdf/2212.08073'}}
];
export const feedbackSets=[
 {slug:'rlef-from-feedback-to-advantage',title:'RLEF: From Execution Feedback to Advantages',
  subtitle:'Implement the RLEF feedback loop in three steps: stop repair, shape execution rewards and assign credit across a completed multi-turn episode.',
  audience:'For learners studying code agents and reinforcement learning from execution feedback.',
  outcomes:['Separate public feedback from final public-and-private test evaluation.','Apply valid-code penalties and a mean token log-ratio reference-policy term.','Compute undiscounted turn advantages using the correct pre-response baseline.'],
  segments:[{id:'rlef-public-test-controller',note:'Control whether another repair is allowed; private evaluation happens after repair stops.'},{id:'rlef-shaped-turn-reward',note:'Use the final test outcome or intermediate code-validity result, then include the reference-policy term.'},{id:'rlef-undiscounted-advantages',note:'Accumulate shaped rewards backwards and subtract each turn’s value baseline.'}],
  caution:'These are original bounded components based on RLEF §2. They do not execute generated code, expose private tests, train a model or reproduce PPO and the paper’s benchmark results.'},
 {slug:'constitutional-ai-from-revision-to-preference',title:'Constitutional AI: From Revisions to Preference Learning',
  subtitle:'Implement Constitutional AI data and loss components: retain revision targets, transform supplied AI judgments and train a pairwise objective.',
  audience:'For learners studying principle-guided self-revision and reinforcement learning from AI feedback (RLAIF).',
  outcomes:['Keep all revision targets while validating the supplied principle and source chain.','Preserve uncertainty with stable soft labels and the optional CoT-label clamp.','Compute pairwise cross-entropy without numerical overflow or hardening soft targets.'],
  segments:[{id:'constitutional-revision-dataset',note:'First understand the supervised stage: revisions become targets, while critiques and original answers stay separate.'},{id:'constitutional-soft-preference',note:'Then transform a judge’s two option log probabilities into a soft preference pair.'},{id:'constitutional-preference-loss',note:'Finally compare response scores against those soft targets with a stable preference-model loss.'}],
  caution:'No model is called and no harmlessness decision is made. Data-shape checks and low loss cannot guarantee safe behavior. The full paper also includes helpfulness data and reinforcement learning.'}
];
