// Original deterministic exercises based on cited research; not full training reproductions.
export const feedbackProblems = [
  {
    "id": "rlef-public-test-controller",
    "number": 101,
    "track": "Agent Engineering",
    "difficulty": "Easy",
    "title": "Control a RLEF Public-Test Repair Episode",
    "duration": "20 min",
    "tags": [
      "RLEF",
      "Execution Feedback",
      "Control Flow"
    ],
    "description": "Implement a RLEF repair controller in Python. Stop on public-test success or a turn limit, then request private evaluation without claiming correctness.",
    "requirements": [
      "public_passes is a list of booleans for completed attempts; max_turns is an integer >= 1. An empty list means no attempt yet.",
      "Return \"retry\" if no public success has occurred and len(public_passes) < max_turns; otherwise return \"private_eval\".",
      "Raise ValueError if the history exceeds max_turns or contains any attempt after an earlier True. A terminal success may appear only at the end.",
      "Do not read private tests, assign a correctness reward, execute code or mutate the input. The two returned strings are this exercise’s interface."
    ],
    "signature": "rlef_episode_action(public_passes, max_turns)",
    "starter": "def rlef_episode_action(public_passes, max_turns):\n    \"\"\"Implement the deterministic component described in the contract.\"\"\"\n    # TODO\n    pass",
    "solution": "def rlef_episode_action(public_passes, max_turns):\n    if len(public_passes) > max_turns or any(public_passes[:-1]):\n        raise ValueError(\"attempts after episode termination\")\n    if len(public_passes) == max_turns or (public_passes and public_passes[-1]):\n        return \"private_eval\"\n    return \"retry\"",
    "explanation": [
      "A completed attempt yields a public-test observation. Failure permits another attempt only while budget remains. Passing public tests ends repair, not correctness evaluation.",
      "Both termination reasons lead to private evaluation of the final candidate. A budget-exhausted candidate can still fail; returning private_eval is not returning success.",
      "Validate the chronological history before applying the stopping rule. This controller abstracts §2.1 and is not the existing ReAct event protocol or a full code-execution environment."
    ],
    "complexity": "O(n) time for n attempts, O(n) temporary space for the slice.",
    "pitfall": "Treating True as final correctness leaks the distinction between public feedback and private evaluation.",
    "hints": [
      "Check both the turn count and whether success has already terminated the episode.",
      "A successful earlier attempt makes all later attempts invalid."
    ],
    "references": [
      {
        "title": "Gehring et al. · RLEF · §2.1–2.2",
        "url": "https://arxiv.org/html/2410.02089v2#S2"
      }
    ],
    "tests": [
      {
        "name": "Start an episode",
        "code": "assert rlef_episode_action([],3)=='retry'"
      },
      {
        "name": "Public success",
        "code": "assert rlef_episode_action([False,True],3)=='private_eval'"
      },
      {
        "name": "Budget exhausted",
        "code": "assert rlef_episode_action([False,False],2)=='private_eval'"
      },
      {
        "name": "Still room to repair",
        "code": "assert rlef_episode_action([False],3)=='retry'"
      },
      {
        "name": "One-turn budget",
        "code": "assert rlef_episode_action([False],1)=='private_eval'"
      },
      {
        "name": "Reject post-success attempts",
        "code": "try:\n    rlef_episode_action([True,False],3)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError('post-success attempt accepted')"
      },
      {
        "name": "Reject over-budget attempts",
        "code": "try:\n    rlef_episode_action([False,False],1)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError('over-budget history accepted')"
      },
      {
        "name": "Preserve history",
        "code": "x=[False,False]; rlef_episode_action(x,3); assert x==[False,False]"
      }
    ]
  },
  {
    "id": "rlef-shaped-turn-reward",
    "number": 102,
    "track": "Agent Engineering",
    "difficulty": "Medium",
    "title": "Compute a RLEF Execution and KL-Shaped Turn Reward",
    "duration": "20 min",
    "tags": [
      "RLEF",
      "KL Regularization",
      "Reward Shaping"
    ],
    "description": "Compute a RLEF turn reward in Python. Combine terminal test outcomes or invalid-code penalties with a mean token log-ratio penalty to a reference policy.",
    "requirements": [
      "valid_code, terminal and all_tests_pass are booleans. all_tests_pass describes all public AND private tests and can be True only for a valid terminal response.",
      "Terminal base reward is +1 if all_tests_pass else -1. For nonterminal turns it is 0 for valid code or -0.2 for invalid code. Terminal branches take priority.",
      "policy_logps and reference_logps are nonempty equal-length lists of finite natural log probabilities <=0 for the SAME sampled response tokens. beta is finite and >=0.",
      "Return base - beta * mean(policy_logps[i] - reference_logps[i]). Use the mean, not the sum; do not clamp the signed log ratio. Inputs and arithmetic are finite and must not be mutated."
    ],
    "signature": "rlef_turn_reward(valid_code, terminal, all_tests_pass, policy_logps, reference_logps, beta)",
    "starter": "def rlef_turn_reward(valid_code, terminal, all_tests_pass, policy_logps, reference_logps, beta):\n    \"\"\"Implement the deterministic component described in the contract.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\n\ndef rlef_turn_reward(valid_code, terminal, all_tests_pass, policy_logps, reference_logps, beta):\n    if terminal:\n        base = 1.0 if all_tests_pass else -1.0\n    else:\n        base = 0.0 if valid_code else -0.2\n    log_ratio = math.fsum(p-r for p,r in zip(policy_logps,reference_logps)) / len(policy_logps)\n    return base - beta * log_ratio",
    "explanation": [
      "Start with the task reward for this turn. A final failed response receives -1 even if it also lacks valid code; the smaller invalid-code penalty is for nonterminal responses.",
      "RLEF uses geometric-mean response probabilities for its log-ratio term: log geometric mean equals mean token log probability. Summing token log probabilities introduces a length-dependent scale.",
      "The reference policy is fixed to the initial model, rather than the changing old policy in PPO. This sampled log ratio can be negative. It is not the exact nonnegative KL divergence over the entire policy distribution. beta=0 removes the reference-policy term.",
      "The exercise receives test outcomes and log probabilities; it does not run tests, infer validity, reveal private tests to the repair prompt, or implement PPO."
    ],
    "complexity": "O(L) time for L tokens and O(1) auxiliary space.",
    "pitfall": "Using passed-test fraction or reward 0 for terminal failure changes the paper’s reward rule.",
    "hints": [
      "Choose the base reward before the log-ratio penalty.",
      "Repeated copies of the same token log-ratio should leave its mean unchanged."
    ],
    "references": [
      {
        "title": "Gehring et al. · RLEF · §2.1–2.2",
        "url": "https://arxiv.org/html/2410.02089v2#S2"
      }
    ],
    "tests": [
      {
        "name": "Terminal success",
        "code": "assert rlef_turn_reward(True,True,True,[-1],[-1],.5)==1"
      },
      {
        "name": "Terminal failure",
        "code": "assert rlef_turn_reward(True,True,False,[-1],[-1],.5)==-1"
      },
      {
        "name": "Invalid intermediate response",
        "code": "assert rlef_turn_reward(False,False,False,[-1],[-1],.5)==-.2"
      },
      {
        "name": "Final invalid response priority",
        "code": "assert rlef_turn_reward(False,True,False,[-1],[-1],0)==-1"
      },
      {
        "name": "Geometric mean not product",
        "code": "r=rlef_turn_reward(True,False,False,[-1,-3],[-2,-4],.5); assert abs(r+.5)<1e-12"
      },
      {
        "name": "Signed sample log ratio",
        "code": "assert rlef_turn_reward(True,False,False,[-4],[-2],.5)==1"
      },
      {
        "name": "Zero beta",
        "code": "assert rlef_turn_reward(True,True,True,[-1],[-4],0)==1"
      },
      {
        "name": "No length scaling or mutation",
        "code": "a=[-1,-3];b=[-2,-4];x=rlef_turn_reward(True,False,False,a,b,.5); y=rlef_turn_reward(True,False,False,a*2,b*2,.5);assert abs(x-y)<1e-12 and a==[-1,-3] and b==[-2,-4]"
      }
    ]
  },
  {
    "id": "rlef-undiscounted-advantages",
    "number": 103,
    "track": "Agent Engineering",
    "difficulty": "Medium",
    "title": "Compute RLEF Undiscounted Turn Advantages",
    "duration": "20 min",
    "tags": [
      "RLEF",
      "Policy Gradient",
      "Credit Assignment"
    ],
    "description": "Compute RLEF turn advantages in Python. Sum remaining shaped rewards with gamma equal to one, then subtract each pre-response value baseline.",
    "requirements": [
      "rewards and values are equal-length lists of finite floats for one completed episode; empty lists are allowed. All sums are finite.",
      "values[t] is the baseline before generating response t; rewards already include execution rewards and any reference-policy penalty.",
      "Return advantages[t] = sum(rewards[t:]) - values[t]. gamma is exactly 1; do not normalize, bootstrap or apply generalized advantage estimation.",
      "Return a new list in original turn order without mutating either input. The return is an advantage vector, not a parameter update."
    ],
    "signature": "rlef_advantages(rewards, values)",
    "starter": "def rlef_advantages(rewards, values):\n    \"\"\"Implement the deterministic component described in the contract.\"\"\"\n    # TODO\n    pass",
    "solution": "def rlef_advantages(rewards, values):\n    advantages = [0.0] * len(rewards)\n    remaining = 0.0\n    for t in range(len(rewards)-1,-1,-1):\n        remaining += rewards[t]\n        advantages[t] = remaining - values[t]\n    return advantages",
    "explanation": [
      "Work backwards so the running sum includes this turn and every later shaped reward. Subtract values[t] after forming that suffix, not before adding the reward.",
      "A nonterminal response can receive negative execution or reference-policy reward even if the final solution succeeds. Earlier advantages include those costs.",
      "RLEF uses a turn-level value baseline with token-level policy actions. This function only computes the supplied turn-level targets; it is neither PPO’s clipped objective nor a complete training loop."
    ],
    "complexity": "O(T) time and O(T) output space for T turns.",
    "pitfall": "Do not use only the immediate reward or subtract the value baseline of the next turn.",
    "hints": [
      "Maintain one reverse cumulative sum.",
      "A negative advantage is valid; do not clamp it to zero."
    ],
    "references": [
      {
        "title": "Gehring et al. · RLEF · §2.1–2.2",
        "url": "https://arxiv.org/html/2410.02089v2#S2"
      }
    ],
    "tests": [
      {
        "name": "Shared terminal reward",
        "code": "assert rlef_advantages([0,0,1],[0,0,0])==[1,1,1]"
      },
      {
        "name": "Baseline subtraction",
        "code": "r=rlef_advantages([0,0,1],[.1,.2,.3]); assert len(r)==3 and all(abs(a-b)<1e-12 for a,b in zip(r,[.9,.8,.7]))"
      },
      {
        "name": "Intermediate penalties",
        "code": "r=rlef_advantages([-.2,-.1,1],[0,0,0]);assert len(r)==3 and all(abs(a-b)<1e-12 for a,b in zip(r,[.7,.9,1]))"
      },
      {
        "name": "Final failure",
        "code": "assert rlef_advantages([0,-1],[0,0])==[-1,-1]"
      },
      {
        "name": "Negative advantages",
        "code": "assert rlef_advantages([1],[2])==[-1]"
      },
      {
        "name": "Empty episode representation",
        "code": "assert rlef_advantages([],[])==[]"
      },
      {
        "name": "Own turn baseline",
        "code": "assert rlef_advantages([1,2],[10,20])==[-7,-18]"
      },
      {
        "name": "Preserve input",
        "code": "a=[0,1];b=[0,0];r=rlef_advantages(a,b);assert a==[0,1] and b==[0,0] and r is not a"
      }
    ]
  },
  {
    "id": "constitutional-revision-dataset",
    "number": 104,
    "track": "LLM Systems",
    "difficulty": "Medium",
    "title": "Build Constitutional Critique–Revision Training Pairs",
    "duration": "20 min",
    "tags": [
      "Constitutional AI",
      "Supervised Learning",
      "Revision"
    ],
    "description": "Build Constitutional AI training pairs in Python. Validate a principle-guided revision chain and retain every revised response as a supervised target.",
    "requirements": [
      "prompt and initial are strings. principles is a collection of allowed string IDs. rounds is a list of dicts with string source, principle, critique and revision fields.",
      "The first source must equal initial exactly; each later source must equal the previous revision exactly. The principle must be in principles. Otherwise raise ValueError.",
      "Return one (prompt, revision) tuple for EVERY round, preserving order, duplicate revisions, empty strings and whitespace. Empty rounds returns [].",
      "Do not include initial or critique as targets, mutate inputs, generate text, or judge whether revisions satisfy the principles. This is a bounded data-preparation task."
    ],
    "signature": "revision_training_pairs(prompt, initial, principles, rounds)",
    "starter": "def revision_training_pairs(prompt, initial, principles, rounds):\n    \"\"\"Implement the deterministic component described in the contract.\"\"\"\n    # TODO\n    pass",
    "solution": "def revision_training_pairs(prompt, initial, principles, rounds):\n    allowed = set(principles)\n    current = initial\n    pairs = []\n    for item in rounds:\n        if item['source'] != current or item['principle'] not in allowed:\n            raise ValueError(\"broken revision chain or unknown principle\")\n        current = item['revision']\n        pairs.append((prompt, current))\n    return pairs",
    "explanation": [
      "The supervised stage uses revised responses as training targets. The original Constitutional AI experiment includes revisions from all revision steps, rather than only the final answer.",
      "A critique explains a proposed change; it is not the revised assistant answer. Keep the original prompt paired with each revision, while source links check the chain locally.",
      "The source-link and principle-ID checks are this exercise’s data contract. Passing them proves structural consistency, not harmlessness, helpfulness or factual correctness."
    ],
    "complexity": "O(P+R) structural operations for P principle IDs and R rounds, plus string comparison cost; O(P+R) auxiliary/output space.",
    "pitfall": "Taking only rounds[-1] discards intermediate revision targets used in the paper.",
    "hints": [
      "Track the current response and append one target per valid round.",
      "Do not trim strings or use the critique field as the response."
    ],
    "references": [
      {
        "title": "Bai et al. · Constitutional AI · §3–4",
        "url": "https://arxiv.org/pdf/2212.08073"
      }
    ],
    "tests": [
      {
        "name": "One revision",
        "code": "r=[dict(source='draft',principle='clear',critique='clarify',revision='answer')]; assert revision_training_pairs('Q','draft',['clear'],r)==[('Q','answer')]"
      },
      {
        "name": "Keep every revision",
        "code": "r=[dict(source='d0',principle='p',critique='c1',revision='d1'),dict(source='d1',principle='p',critique='c2',revision='d2')];assert revision_training_pairs('Q','d0',['p'],r)==[('Q','d1'),('Q','d2')]"
      },
      {
        "name": "Empty rounds",
        "code": "assert revision_training_pairs('Q','draft',[],[])==[]"
      },
      {
        "name": "Preserve blank and Unicode answers",
        "code": "r=[dict(source='初稿',principle='p',critique='c',revision='')];assert revision_training_pairs('问题','初稿',['p'],r)==[('问题','')]"
      },
      {
        "name": "Keep duplicate revisions",
        "code": "r=[dict(source='x',principle='p',critique='c',revision='x')]*2;assert revision_training_pairs('Q','x',['p'],r)==[('Q','x'),('Q','x')]"
      },
      {
        "name": "Unknown principle rejected",
        "code": "try:\n    revision_training_pairs('Q','x',[],[dict(source='x',principle='p',critique='c',revision='y')])\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError('unknown principle accepted')"
      },
      {
        "name": "Broken source rejected",
        "code": "try:\n    revision_training_pairs('Q','x',['p'],[dict(source='other',principle='p',critique='c',revision='y')])\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError('broken chain accepted')"
      },
      {
        "name": "No mutation or whitespace cleanup",
        "code": "import copy;r=[dict(source=' x ',principle='p',critique='not a target',revision=' y ')];before=copy.deepcopy(r);out=revision_training_pairs(' Q ',' x ',['p'],r);assert out==[(' Q ',' y ')] and r==before"
      }
    ]
  },
  {
    "id": "constitutional-soft-preference",
    "number": 105,
    "track": "LLM Systems",
    "difficulty": "Medium",
    "title": "Normalize and Clamp AI Feedback Preference Labels",
    "duration": "20 min",
    "tags": [
      "Constitutional AI",
      "RLAIF",
      "Soft Labels"
    ],
    "description": "Compute Constitutional AI soft preference labels in Python. Normalize two judge log probabilities and optionally clamp the first probability to 0.4–0.6.",
    "requirements": [
      "logp_a and logp_b are finite natural log probabilities <=0 for the two answer options from the same judge prompt. clamp is a boolean.",
      "Normalize ONLY over these two options: p_a=exp(logp_a)/(exp(logp_a)+exp(logp_b)). Use a stable computation even for large negative inputs.",
      "If clamp is True, set p_a=min(0.6,max(0.4,p_a)); otherwise leave it unchanged. Return (p_a,1-p_a).",
      "Do not sample a winner or call a model. The optional 0.4–0.6 clamp illustrates the paper’s CoT-feedback setting, not a universal calibration guarantee."
    ],
    "signature": "ai_preference_label(logp_a, logp_b, clamp)",
    "starter": "def ai_preference_label(logp_a, logp_b, clamp):\n    \"\"\"Implement the deterministic component described in the contract.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\n\ndef ai_preference_label(logp_a, logp_b, clamp):\n    peak = max(logp_a, logp_b)\n    a = math.exp(logp_a-peak)\n    b = math.exp(logp_b-peak)\n    p = a/(a+b)\n    if clamp:\n        p = min(0.6,max(0.4,p))\n    return p,1-p",
    "explanation": [
      "Subtract the larger log probability before exponentiating. The larger option then has weight 1, avoiding the zero-over-zero failure of exp(-1000) plus exp(-1001).",
      "The paper forms soft preference targets from normalized answer probabilities. In its CoT setting it also investigates clamping overly confident labels, with 40–60 percent used for the main results.",
      "Keeping p_b=1-p_a preserves the pair sum after clamping. A soft target retains uncertainty; converting it to argmax changes the learning objective.",
      "The helper transforms supplied judgments. It neither decides which response is harmless nor guarantees that the feedback model is correct or unbiased."
    ],
    "complexity": "O(1) time and space.",
    "pitfall": "Log probabilities must be exponentiated before normalization; dividing the two negative logs is not a probability transformation.",
    "hints": [
      "Use the two-option stable Softmax.",
      "Apply clamping before constructing the complementary probability."
    ],
    "references": [
      {
        "title": "Bai et al. · Constitutional AI · §3–4",
        "url": "https://arxiv.org/pdf/2212.08073"
      }
    ],
    "tests": [
      {
        "name": "Equal options",
        "code": "assert ai_preference_label(-2,-2,False)==(.5,.5)"
      },
      {
        "name": "Soft label retained",
        "code": "import math;p,q=ai_preference_label(math.log(.8),math.log(.2),False);assert abs(p-.8)<1e-12 and abs(q-.2)<1e-12"
      },
      {
        "name": "Upper clamp",
        "code": "p,q=ai_preference_label(0,-1000,True);assert p==.6 and q==.4"
      },
      {
        "name": "Lower clamp",
        "code": "p,q=ai_preference_label(-1000,0,True);assert p==.4 and q==.6"
      },
      {
        "name": "Stable underflow inputs",
        "code": "p,q=ai_preference_label(-1000,-1001,False);assert abs(p-.7310585786300049)<1e-12 and abs(p+q-1)<1e-12"
      },
      {
        "name": "Keep interior probability",
        "code": "import math;p,q=ai_preference_label(math.log(.55),math.log(.45),True);assert abs(p-.55)<1e-12"
      },
      {
        "name": "No clamp at extreme",
        "code": "assert ai_preference_label(0,-1000,False)==(1.,0.)"
      },
      {
        "name": "Swap symmetry",
        "code": "a,b=ai_preference_label(-1,-3,True);c,d=ai_preference_label(-3,-1,True);assert abs(a-d)<1e-12 and abs(b-c)<1e-12"
      }
    ]
  },
  {
    "id": "constitutional-preference-loss",
    "number": 106,
    "track": "LLM Systems",
    "difficulty": "Medium",
    "title": "Compute a Soft-Label Preference Model Loss",
    "duration": "20 min",
    "tags": [
      "Constitutional AI",
      "Preference Model",
      "Cross Entropy"
    ],
    "description": "Implement a soft-label preference loss in Python. Compare two response scores with stable logistic cross-entropy and average across preference pairs.",
    "requirements": [
      "scores_a, scores_b and targets are nonempty equal-length float lists. Scores are finite with absolute value <=1e6; each target is in [0,1].",
      "For each pair let d=scores_a[i]-scores_b[i] and p=sigmoid(d). The target is the probability of preferring A, not a class index.",
      "Return the mean of -target*log(p)-(1-target)*log(1-p), using an algebraically equivalent stable expression. Natural logarithms give loss in nats.",
      "Support target endpoints and large positive/negative score differences without overflow or log(0). Do not mutate inputs or perform an optimizer step."
    ],
    "signature": "soft_preference_loss(scores_a, scores_b, targets)",
    "starter": "def soft_preference_loss(scores_a, scores_b, targets):\n    \"\"\"Implement the deterministic component described in the contract.\"\"\"\n    # TODO\n    pass",
    "solution": "import math\n\ndef soft_preference_loss(scores_a, scores_b, targets):\n    losses = []\n    for a,b,p in zip(scores_a,scores_b,targets):\n        d = a-b\n        losses.append(max(d,0.0)-p*d+math.log1p(math.exp(-abs(d))))\n    return math.fsum(losses)/len(losses)",
    "explanation": [
      "Two response scores define a Bernoulli preference model through their difference. Equal scores predict 0.5 and produce log(2) loss for every target.",
      "The stable identity softplus(d)-target*d avoids evaluating log(sigmoid(d)) at probabilities rounded to zero or one. exp(-abs(d)) never overflows.",
      "This is a standard pairwise logistic objective for supplied soft labels, used here to expose the preference-model stage. The paper’s full pipeline also includes principle-conditioned judging, helpfulness data and reinforcement learning.",
      "A low loss measures agreement with the supplied labels, not independently verified harmlessness. A target of 0.6 must not be silently converted into a hard label of 1."
    ],
    "complexity": "O(N) time and O(N) temporary space for N pairs.",
    "pitfall": "Subtracting targets from scores or rounding targets into winners does not implement cross-entropy.",
    "hints": [
      "Rewrite binary cross-entropy in terms of the score difference.",
      "Use max(d,0)+log1p(exp(-abs(d))) for softplus(d)."
    ],
    "references": [
      {
        "title": "Bai et al. · Constitutional AI · §3–4",
        "url": "https://arxiv.org/pdf/2212.08073"
      }
    ],
    "tests": [
      {
        "name": "Equal scores",
        "code": "import math;assert abs(soft_preference_loss([0],[0],[.6])-math.log(2))<1e-12"
      },
      {
        "name": "Soft target at its optimum",
        "code": "import math;d=math.log(.8/.2);r=soft_preference_loss([d],[0],[.8]);assert abs(r-(-.8*math.log(.8)-.2*math.log(.2)))<1e-12"
      },
      {
        "name": "Correct confident endpoint",
        "code": "assert soft_preference_loss([1000],[0],[1])==0"
      },
      {
        "name": "Wrong confident endpoint",
        "code": "assert soft_preference_loss([1000],[0],[0])==1000"
      },
      {
        "name": "Negative extreme",
        "code": "assert soft_preference_loss([-1000],[0],[1])==1000"
      },
      {
        "name": "Soft labels stay soft",
        "code": "assert soft_preference_loss([1000],[0],[.6])==400"
      },
      {
        "name": "Mean not sum",
        "code": "import math;r=soft_preference_loss([0,1000],[0,0],[.5,0]);assert abs(r-(math.log(2)+1000)/2)<1e-12"
      },
      {
        "name": "Swap and common-score shift",
        "code": "a=[2,-1];b=[0,3];p=[.7,.2];x=soft_preference_loss(a,b,p);y=soft_preference_loss(b,a,[1-v for v in p]);z=soft_preference_loss([v+5 for v in a],[v+5 for v in b],p);assert abs(x-y)<1e-12 and abs(x-z)<1e-12 and a==[2,-1] and b==[0,3] and p==[.7,.2]"
      }
    ]
  }
];
