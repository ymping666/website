// Reproducible bilingual authoring source. The tasks are original bounded teaching components.
import {writeFile} from 'node:fs/promises';
import {rsiLocalized} from '../src/rsi-curriculum.mjs';
const catalog=[],zh=[];
const shortDescriptions={
 select:'Select a task-local revision using external verification, quality scores and a cost budget. A bounded acceptance component for feedback-driven repair.',
 filter:'Filter generated reasoning trajectories by exact final-answer agreement with external targets. Implement the answer filter of STaR without rationalization.',
 update:'Update a tiny categorical model with one supervised gradient step. Inspect retained bias parameters without treating the component as LLM fine-tuning.',
 admit:'Build a persistent skill-ID list using supplied execution checks. Practice verified skill admission inspired by Voyager, without running an environment.',
 pareto:'Keep prompt candidates that are not dominated on quality and cost. Practice a bounded quality–cost adaptation of GEPA’s Pareto-search idea.',
 promote:'Accept a scaffold version only when paired development scores satisfy a gain threshold and per-task regression guard. Keep final audit data separate.',
 compare:'Compare the gains produced by two improvers from matched starting systems, seeds and budgets. A bounded evaluation component inspired by HyperAgents.'
};
const testLabels={select:[['Verification and cost gates','验证与成本关卡'],['Earliest score tie','分数并列取最早'],['Empty candidate list','空候选列表'],['No verified candidate','没有通过验证的候选'],['Negative quality scores','负质量分数'],['Inputs remain unchanged','输入保持不变']],stop:[['Exact budget fit','预算刚好足够'],['Success at the budget limit','预算边界上验证成功'],['No budget for the first attempt','没有首次尝试预算'],['Zero-cost next attempt','下一次尝试成本为零'],['Insufficient remaining budget','剩余预算不足'],['Reject post-success history','拒绝成功后继续尝试'],['Reject overspent history','拒绝超支历史']],filter:[['Keep aligned correct trajectories','保留对齐的正确轨迹'],['Whitespace is significant','空白字符参与比较'],['Empty training collection','空训练集合'],['Preserve duplicate examples','保留重复样本'],['Empty strings are allowed','允许空字符串'],['Wrong answer and immutability','错误答案与不可变输入']],loss:[['Ignore masked prompt tokens','忽略被屏蔽的提示词元'],['Uniform vocabulary distribution','均匀词表分布'],['Empty batch convention','空批次约定'],['No selected target tokens','没有选中目标词元'],['Extreme logits stay stable','极端 logit 保持稳定'],['Common logit shift invariance','logit 共同平移不变']],update:[['Increase the target bias','提高目标类别偏置'],['Switch the target class','切换目标类别'],['Zero learning rate','零学习率'],['Stable extreme probabilities','稳定计算极端概率'],['Single-class model','单类别模型'],['Return a separate parameter list','返回独立参数列表'],['Zero-sum categorical gradient','类别梯度之和为零']],admit:[['Admit only checked skills','只接受检查通过的技能'],['Empty evidence is insufficient','空证据不足以入库'],['Retry a previously failed ID','重试曾失败的编号'],['Do not duplicate existing skills','不重复已有技能'],['Empty library and proposals','空技能库与空提案'],['Copy existing state','复制已有状态']],retrieve:[['Positive zero and negative similarities','正、零与负相似度'],['Zero query uses index order','零查询按下标排序'],['No stored embeddings','没有已存向量'],['Retrieve zero items','检索零项'],['Scaling and exact similarity ties','缩放与精确相似度并列'],['Zero outranks negative alignment','零分优于负相关']],pareto:[['Quality and cost trade-offs','质量与成本权衡'],['Keep exact duplicates','保留完全重复项'],['Empty prompt archive','空提示档案'],['Equal quality lower cost wins','质量相等时低成本更优'],['Negative quality at zero cost','零成本下的负质量'],['Keep a meaningful tiny gain','保留有意义的微小增益']],promote:[['Mean gain hides a regression','平均增益掩盖单项退步'],['Inclusive gain and drop boundaries','增益与退步边界含等号'],['Identical versions with zero thresholds','零阈值下的相同版本'],['No required improvement','未达到所需增益'],['Mean over paired tasks','对配对任务求均值'],['Do not overwrite old scores','不覆盖旧分数']],compare:[['Positive paired improver gain','正配对改进器增益'],['Pair by keys not list order','按键配对而非列表顺序'],['Empty experiment is invalid','空实验无效'],['Reject unequal budgets','拒绝不等预算'],['Reject duplicate trial identities','拒绝重复试验编号'],['Reject unequal starting scores','拒绝不等初始分数']]};
const refs={refine:['Madaan et al. · Self-Refine','https://arxiv.org/abs/2303.17651'],star:['Zelikman et al. · STaR · Algorithm 2','https://arxiv.org/html/2203.14465v2'],voyager:['Wang et al. · Voyager · Skill library','https://voyager.minedojo.org/'],gepa:['Agrawal et al. · GEPA','https://arxiv.org/abs/2507.19457'],hyper:['HyperAgents · Improving the ability to improve','https://arxiv.org/html/2603.19461v1'],survey:['Wang et al. · Diving into Reliable Self-Evolving Agents · L0–L4','https://www.preprints.org/manuscript/202609.0913']};
function add(key,level,title,description,requirements,signature,solution,explanation,pitfall,complexity,reference,tests){
 if(shortDescriptions[key])description=[shortDescriptions[key],description[1]];
 if(['select','stop','compare'].includes(key)){
  requirements[0]=[requirements[0][0]+' Integer costs, budgets and seeds, when present, are at most 1000000000.',requirements[0][1]+' 成本、预算与种子等整数（如有）均不超过 1000000000。'];
 }
 const pair=x=>x[0],testNames=testLabels[key].map(x=>`RSI ${key} · ${x[0]}`);
 catalog.push({id:`rsi-${key}`,number:107+catalog.length,track:'Agent Engineering',difficulty:['select','stop','filter','admit'].includes(key)?'Easy':'Medium',title:pair(title),duration:'20 min',tags:['Self-Improvement',`L${level}`,refs[reference][0].split(' · ')[1]||'RSI'],description:pair(description),requirements:requirements.map(pair),signature,starter:`def ${signature}:\n    # Implement the stated deterministic component.\n    pass`,solution,explanation:explanation.map(pair),pitfall:pair(pitfall),complexity:pair(complexity),hints:[pair(explanation[0]),pair(pitfall)],references:[{title:refs[reference][0],url:refs[reference][1]},{title:refs.survey[0],url:refs.survey[1]}],tests:tests.map((code,i)=>({name:testNames[i],code}))});
 zh.push({id:`rsi-${key}`,title:title[1],description:description[1],requirements:requirements.map(x=>x[1]),explanation:explanation.map(x=>x[1]),pitfall:pitfall[1],complexity:complexity[1],hints:[explanation[0][1],pitfall[1]],testNames:testLabels[key].map(x=>`RSI ${key} · ${x[1]}`)});
}
add('select',0,['Select a Verified Revision Candidate','选择通过验证的修订候选'],['Choose a task-local revision using supplied verification, quality and cost observations. This isolates candidate acceptance around a Self-Refine-style loop; it does not generate or verify an answer.','依据给定的验证、质量与成本记录选择当前任务的修订候选。本题拆解 Self-Refine 式循环周围的候选接受环节，不生成答案，也不执行验证。'],[
 ['scores, verified and costs are equal-length lists; scores are finite numbers with absolute value <= 10000, verified contains booleans, and costs and budget are nonnegative integers.','scores、verified、costs 等长；分数有限且绝对值不超过 10000，verified 为布尔值，成本与 budget 为非负整数。'],
 ['Only candidates with verified[i] equal to True and costs[i] <= budget are eligible. Costs are alternative per-candidate totals, not a cumulative history.','仅 verified[i] 为 True 且 costs[i] <= budget 的候选可选。成本是各备选候选的独立总成本，不是累计历史。'],
 ['Return the index with the largest eligible score; use the smallest original index for ties. Return None if none qualify, including empty inputs.','返回合格候选中分数最大的下标，并列取原始下标最小者。没有合格候选（含空输入）时返回 None。'],
 ['Do not mutate inputs. Verification is supplied external evidence, not the candidate’s own confidence. No state is retained for another task.','不得修改输入。验证标志代表给定的外部证据，不是候选自信度。本题不为其他任务保存状态。']
 ],'verified_revision(scores, verified, costs, budget)',`def verified_revision(scores, verified, costs, budget):
    best = None
    for i in range(len(scores)):
        if verified[i] and costs[i] <= budget:
            if best is None or scores[i] > scores[best]:
                best = i
    return best`,[
 ['Filter by evidence and budget before comparing quality. A high-scoring unverified candidate is excluded.','先检查验证与预算，再比较质量。未经验证的高分候选也要排除。'],
 ['Scan in original order and replace only on a strict improvement. This preserves the earliest tie.','按原顺序遍历，只在严格更高时替换，便能保留最早的并列项。'],
 ['Self-Refine supplies the feedback/revision motivation. This exercise’s external gate, score and budget policy are original teaching choices, not its official algorithm.','Self-Refine 提供反馈与修订的背景。本题的外部关卡、分数和预算规则是原创教学设计，不是论文官方算法。']
 ],['Never rank all candidates before checking eligibility.','不能先对全部候选排名而忽略资格。'],['O(n) time and O(1) auxiliary space.','时间 O(n)，辅助空间 O(1)。'],'refine',[
 'assert verified_revision([.9,.7,.8],[False,True,True],[1,2,4],3)==1','assert verified_revision([.5,.5],[True,True],[1,1],1)==0','assert verified_revision([],[],[],0) is None','assert verified_revision([1],[False],[0],0) is None','assert verified_revision([-2,-1],[True,True],[0,0],0)==1','s=[1,2]; v=[True,True]; c=[1,2]; assert verified_revision(s,v,c,2)==1 and s==[1,2] and c==[1,2]']);
add('stop',0,['Budget a Feedback-Refinement Loop','控制反馈修订循环的预算'],['Decide whether a task-local feedback loop can make one more revision. Costs include generation and checking; a successful check ends the loop.','判断当前任务的反馈循环能否再修订一次。成本包含生成与检查；验证成功就结束循环。'],[
 ['costs lists completed nonnegative integer call costs; passed lists equally many booleans. budget and next_cost are nonnegative integers.','costs 为已完成调用的非负整数成本，passed 为等长布尔列表；budget 与 next_cost 为非负整数。'],
 ['Raise ValueError if total spent exceeds budget or any attempt appears after an earlier successful check.','累计花费超过 budget，或成功验证后还出现后续尝试时，抛出 ValueError。'],
 ['Return "accept" if the latest check passed. Otherwise return "revise" when spent + next_cost <= budget; return "stop" otherwise.','最新验证通过则返回 "accept"；否则，spent + next_cost <= budget 时返回 "revise"，其余返回 "stop"。'],
 ['Empty history is allowed. next_cost is the complete cost of one proposed next attempt. Do not mutate inputs or treat budget exhaustion as correctness.','允许空历史。next_cost 是下一次完整尝试的总成本。不得修改输入，也不能把预算耗尽当作答案正确。']
 ],'refinement_action(costs, passed, budget, next_cost)',`def refinement_action(costs, passed, budget, next_cost):
    spent = sum(costs)
    if spent > budget or any(passed[:-1]):
        raise ValueError("invalid completed history")
    if passed and passed[-1]:
        return "accept"
    return "revise" if spent + next_cost <= budget else "stop"`,[
 ['Validate completed history first; after success, no later attempt is legal.','先验证历史；一旦成功，不允许出现后续尝试。'],
 ['Success takes priority over the next-attempt budget test. Without success, reserve the full next cost rather than only checking whether some budget remains.','成功优先于下一轮预算检查。尚未成功时必须预留完整下一轮成本，而不是只看余额是否大于零。'],
 ['This original resource controller makes the stopping boundary explicit; it is not a reproduction of Self-Refine’s task-specific feedback criterion.','这个原创资源控制器将停止边界明确化，不复现 Self-Refine 针对具体任务的反馈判据。']
 ],['An exact budget fit permits revision; an exhausted failed attempt is not accepted.','刚好够预算仍可修订；预算耗尽但验证失败不能接受。'],['O(n) time and O(n) auxiliary space for the history slice.','时间 O(n)，历史切片的辅助空间 O(n)。'],'refine',[
 'assert refinement_action([2,2],[False,False],6,2)=="revise"','assert refinement_action([3],[True],3,2)=="accept"','assert refinement_action([],[],0,1)=="stop"','assert refinement_action([],[],0,0)=="revise"','assert refinement_action([3],[False],4,2)=="stop"','try:\n    refinement_action([1,1],[True,False],3,1)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError("post-success")','try:\n    refinement_action([5],[False],4,0)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError("overspent")']);
add('filter',1,['Filter STaR-Style Self-Training Trajectories','筛选 STaR 式自训练轨迹'],['Select generated reasoning trajectories whose final answers match supplied ground truth, before any model update. This is the filtering component of STaR without rationalization.','在模型更新前，筛选最终答案与给定真值一致的生成推理轨迹。本题对应不含答案提示重生成的 STaR 筛选组件。'],[
 ['answers, targets and rationales are equal-length lists of strings. Each position is one separate training example; duplicate examples remain separate.','answers、targets、rationales 为等长字符串列表。每个位置是独立训练样本，重复样本也分别保留。'],
 ['Return [(i, rationales[i], targets[i]), ...] for exactly those i with answers[i] == targets[i], in original order.','仅对 answers[i] == targets[i] 的位置，按原顺序返回 (i, rationales[i], targets[i]) 列表。'],
 ['Use exact string equality: do not trim, lowercase, deduplicate or infer mathematical equivalence. An empty rationale is allowed.','使用精确字符串相等，不去空格、不转小写、不去重，也不推断数学等价。允许空推理文本。'],
 ['Return [] for empty input. Do not mutate inputs. Answer matching does not establish that the reasoning itself is valid.','空输入返回 []。不得修改输入。答案一致不证明推理过程本身正确。']
 ],'star_training_rows(answers, targets, rationales)',`def star_training_rows(answers, targets, rationales):
    return [(i, rationales[i], targets[i])
            for i in range(len(answers)) if answers[i] == targets[i]]`,[
 ['Compare each generated final answer with the corresponding external target. The generator does not grade itself here.','逐个比较生成答案与对应的外部真值，这里不由生成器给自己评分。'],
 ['Keep the rationale and target aligned with their original example ID; filtering one list independently corrupts training pairs.','让推理、目标与原始样本编号保持对齐；分别过滤不同列表会破坏训练配对。'],
 ['STaR also studies rationalization and repeated fine-tuning. This exercise isolates Algorithm 2’s answer filter, with a positional interface for inspection.','STaR 还研究答案提示重生成与反复微调。本题只拆出算法 2 的答案筛选，并用位置编号方便检查。']
 ],['A persuasive rationale with a wrong answer must be excluded.','推理再有说服力，最终答案不符也必须排除。'],['O(n) comparisons plus output space.','O(n) 次比较及输出空间。'],'star',[
 'assert star_training_rows(["4","5","6"],["4","4","6"],["2+2","guess","3+3"])==[(0,"2+2","4"),(2,"3+3","6")]','assert star_training_rows(["4 "],["4"],["proof"])==[]','assert star_training_rows([],[],[])==[]','assert star_training_rows(["A","A"],["A","A"],["r","r"])==[(0,"r","A"),(1,"r","A")]','assert star_training_rows([""],[""],[""])==[(0,"","")]','a=["x"]; assert star_training_rows(a,["y"],["r"])==[] and a==["x"]']);
add('loss',1,['Compute a Masked Self-Training Token Loss','计算带掩码的自训练词元损失'],['Turn selected self-training targets into a stable token-average negative log likelihood. Supplied masks distinguish target tokens from prompt tokens.','将筛选后的自训练目标转为稳定的词元平均负对数似然。给定掩码区分训练目标词元与提示词元。'],[
 ['logits contains T nonempty rows of the same vocabulary size V; entries are finite with absolute value <= 10000. targets contains T integer indices in [0,V); mask contains T booleans.','logits 含 T 个非空行，词表大小 V 相同；元素有限且绝对值不超过 10000。targets 含 T 个 [0,V) 整数下标，mask 含 T 个布尔值。'],
 ['For each True mask position compute logsumexp(logits[t]) - logits[t][targets[t]]. Return their arithmetic mean.','对每个 mask 为 True 的位置计算 logsumexp(logits[t]) - logits[t][targets[t]]，返回这些项的算术平均。'],
 ['Use max subtraction for logsumexp. Return 0.0 when no token is selected, including T=0; this is this exercise’s explicit empty-batch convention.','计算 logsumexp 时先减最大值。无选中词元（含 T=0）时返回 0.0，这是本题明确的空批次约定。'],
 ['Do not include prompt positions, average by sequences or mutate inputs. This is an illustrative supervised objective after STaR-style filtering, not the complete paper training recipe.','不得包含提示位置、按序列数求平均或修改输入。本题是 STaR 式筛选后的监督目标示例，不是论文完整训练配置。']
 ],'masked_token_nll(logits, targets, mask)',`import math

def masked_token_nll(logits, targets, mask):
    terms = []
    for row, target, keep in zip(logits, targets, mask):
        if keep:
            m = max(row)
            terms.append(math.log(math.fsum(math.exp(x-m) for x in row)) + (m-row[target]))
    return math.fsum(terms)/len(terms) if terms else 0.0`,[
 ['Ignore unselected positions before accumulating losses. In the worked example, even a very wrong prompt prediction contributes nothing.','先排除未选中位置。演算示例中，即使提示位置的预测很差，也不贡献损失。'],
 ['Compute the normalizer in shifted coordinates. Adding a constant to every logit leaves both probabilities and loss unchanged.','在平移后的坐标中计算归一化项。给全部 logit 加同一常数不会改变概率或损失。'],
 ['Divide by the number of selected tokens, not the number of rows. Low loss on synthetic targets is not evidence of held-out improvement.','除以选中词元数，而不是全部行数。合成目标上的低损失不代表独立测试能力提升。']
 ],['Do not exponentiate large raw logits or include masked prompt losses.','不要对很大的原始 logit 直接求指数，也不要计入被屏蔽的提示损失。'],['O(TV) time and O(T) auxiliary space.','时间 O(TV)，辅助空间 O(T)。'],'star',[
 'import math\nassert abs(masked_token_nll([[1000,1000],[0,1000],[0,0]],[0,0,1],[True,False,True])-math.log(2))<1e-12','import math\nassert abs(masked_token_nll([[0,0]],[1],[True])-math.log(2))<1e-12','assert masked_token_nll([],[],[])==0.0','assert masked_token_nll([[1,2]],[0],[False])==0.0','assert masked_token_nll([[1000,-1000]],[0],[True])==0.0','a=masked_token_nll([[1,2,3]],[0],[True]); b=masked_token_nll([[1001,1002,1003]],[0],[True]); assert abs(a-b)<1e-12']);
add('update',1,['Update a Trainable Categorical Bias Model','更新可训练的类别偏置模型'],['Perform one supervised gradient step on a tiny model whose only parameters are categorical biases. This makes a retained model update visible without pretending to fine-tune an LLM.','对仅含类别偏置参数的微型模型做一次监督梯度更新，让持久参数变化可见；本题不假装完成大模型微调。'],[
 ['bias is a nonempty list of finite parameters with absolute value <= 10000. target is an integer in [0,len(bias)); lr is finite and in [0,1].','bias 是非空有限参数列表，绝对值不超过 10000。target 位于 [0,len(bias))，lr 有限且位于 [0,1]。'],
 ['The model predicts softmax(bias). For target negative log likelihood, gradient[j] = probability[j] - (1 if j == target else 0).','模型预测 softmax(bias)。目标负对数似然的梯度为 probability[j] - (1 if j == target else 0)。'],
 ['Return a new parameter list bias[j] - lr * gradient[j], using all probabilities from the original bias. Use max subtraction.','返回新参数列表 bias[j] - lr * gradient[j]，所有概率均由原始 bias 计算。使用减最大值技巧。'],
 ['Do not mutate bias, sample a category or clip gradients. The caller may retain the returned parameters for a later task; no actual language model is trained.','不得修改 bias、采样类别或裁剪梯度。调用方可为后续任务保留返回参数；本题不训练实际语言模型。']
 ],'categorical_bias_step(bias, target, lr)',`import math

def categorical_bias_step(bias, target, lr):
    m = max(bias)
    weights = [math.exp(x-m) for x in bias]
    total = math.fsum(weights)
    return [x-lr*(weights[j]/total-int(j==target)) for j,x in enumerate(bias)]`,[
 ['Normalize the old biases once. For [0,0] the probabilities are [0.5,0.5].','只对旧参数归一化一次。[0,0] 对应概率 [0.5,0.5]。'],
 ['Subtract the one-hot target from probabilities, then subtract lr times that gradient. For target 1 and lr=0.2, the return is [-0.1,0.1].','概率减去独热目标，再减去学习率乘梯度。当 target=1、lr=0.2 时返回 [-0.1,0.1]。'],
 ['This is a transparent bias-only surrogate for the supervised update after trajectory filtering. It does not reproduce STaR’s language-model architecture, optimizer or training schedule.','这是轨迹筛选后监督更新的透明偏置模型示例，不复现 STaR 的语言模型结构、优化器或训练日程。']
 ],['Updating one bias before computing another probability changes the gradient and is incorrect.','若先改一个参数再计算另一个概率，梯度就变了。'],['O(V) time and O(V) auxiliary/output space.','时间 O(V)，辅助及输出空间 O(V)。'],'star',[
 'assert categorical_bias_step([0,0],1,.2)==[-.1,.1]','assert categorical_bias_step([0,0],0,.2)==[.1,-.1]','assert categorical_bias_step([1,2],0,0)==[1,2]','assert categorical_bias_step([1000,-1000],0,1)==[1000,-1000]','assert categorical_bias_step([5],0,1)==[5]','x=[0,0]; y=categorical_bias_step(x,1,.2); assert x==[0,0] and y is not x','x=[1,2,3]; y=categorical_bias_step(x,0,.1); assert abs(sum(x)-sum(y))<1e-12']);
add('admit',2,['Admit Verified Skills into Persistent Memory','将验证过的技能写入持久库'],['Build a new skill-ID list from supplied execution checks. Inspired by Voyager’s executable skill library, this exercise uses an explicit fixed admission contract.','依据给定执行检查构建新的技能编号列表。参考 Voyager 的可执行技能库，本题采用明确、固定的准入约定。'],[
 ['existing contains unique nonempty skill-ID strings. candidates contains dictionaries with id (nonempty string) and checks (a list of booleans). Duplicate candidate IDs are allowed.','existing 含唯一非空技能编号。candidates 中每项含非空字符串 id 与布尔列表 checks，允许候选编号重复。'],
 ['Start with existing in its original order. Append a new ID only if checks is nonempty and every check is True.','先保留 existing 原顺序。仅当 checks 非空且全部为 True 时，才追加新编号。'],
 ['Never duplicate or replace an existing ID. A failed early candidate does not prevent a later successful candidate with that ID from admission.','不得重复或覆盖已有编号。较早候选失败，不阻止后续同编号候选通过验证后入库。'],
 ['Return a new list without changing inputs. Empty checks are insufficient evidence, not success. Supplied checks are not proof of universal skill correctness.','返回新列表，不改输入。空检查意味着证据不足，而不是成功。给定检查不证明技能在所有场景都正确。']
 ],'admit_verified_skills(existing, candidates)',`def admit_verified_skills(existing, candidates):
    result = list(existing)
    seen = set(existing)
    for item in candidates:
        if item['checks'] and all(item['checks']) and item['id'] not in seen:
            result.append(item['id'])
            seen.add(item['id'])
    return result`,[
 ['Copy the current library so old skills survive and the caller’s state remains untouched.','复制当前技能库，既保留旧技能，也不修改调用方状态。'],
 ['Require positive evidence before insertion. Add the ID to seen only after admission, so a failed attempt cannot reserve it.','插入前要求有效证据；只有成功入库才加入 seen，避免失败尝试提前占用编号。'],
 ['Voyager motivates verified reusable code skills. IDs, duplicate handling and the nonempty-check rule are original interface choices; no Minecraft environment or code execution is reproduced.','Voyager 提供可验证、可复用代码技能的背景。编号、重复处理与非空检查规则为原创接口设计，不复现 Minecraft 环境或代码执行。']
 ],['all([]) is True in Python, so test nonemptiness separately.','Python 中 all([]) 为 True，因此必须单独检查非空。'],['O(n+c+q) time and O(n+c) space for n existing IDs, c candidates and q checks.','n 个已有编号、c 个候选、q 个检查时，时间 O(n+c+q)，空间 O(n+c)。'],'voyager',[
 'assert admit_verified_skills(["parse"],[{"id":"route","checks":[True,True]},{"id":"unsafe","checks":[True,False]}])==["parse","route"]','assert admit_verified_skills([],[{"id":"x","checks":[]}])==[]','assert admit_verified_skills([],[{"id":"x","checks":[False]},{"id":"x","checks":[True]}])==["x"]','assert admit_verified_skills(["x"],[{"id":"x","checks":[True]}])==["x"]','assert admit_verified_skills([],[])==[]','x=["a"]; y=admit_verified_skills(x,[]); assert x==["a"] and y==["a"] and y is not x']);
add('retrieve',2,['Retrieve Skills by Cosine Similarity','按余弦相似度检索技能'],['Retrieve relevant skills from supplied description embeddings. This isolates the similarity-search component of a Voyager-style skill library, after admission.','在技能入库后，使用给定描述向量检索相关技能。本题拆解 Voyager 式技能库的相似度检索组件。'],[
 ['query is a nonempty finite numeric vector. embeddings is a list of vectors with the same dimension. Every entry has absolute value <= 1000. k is a nonnegative integer.','query 为非空有限数值向量。embeddings 中向量维度相同，元素绝对值不超过 1000；k 为非负整数。'],
 ['Score each vector by dot(query, vector)/(norm(query)*norm(vector)). If either norm is zero, define that score as 0.0.','每项分数为 dot(query, vector)/(norm(query)*norm(vector))。任一范数为零时，约定该项分数为 0.0。'],
 ['Return up to k original indices sorted by descending score, then ascending index. Return [] for no embeddings or k=0.','按分数降序、原始下标升序返回最多 k 个下标。无向量或 k=0 时返回 []。'],
 ['Do not mutate inputs or generate embeddings. Zero-vector handling and tie-breaking are explicit teaching conventions. Relevance does not establish executability.','不得修改输入或生成向量。零向量与并列处理为明确的教学约定。相关性不保证技能可执行。']
 ],'retrieve_skill_indices(query, embeddings, k)',`import math

def retrieve_skill_indices(query, embeddings, k):
    qn = math.sqrt(math.fsum(x*x for x in query))
    scored = []
    for i, row in enumerate(embeddings):
        rn = math.sqrt(math.fsum(x*x for x in row))
        score = math.fsum(a*b for a,b in zip(query,row))/(qn*rn) if qn and rn else 0.0
        scored.append((i,score))
    return [i for i,s in sorted(scored,key=lambda pair:(-pair[1],pair[0]))[:k]]`,[
 ['Compute dot products and both norms; raw dot product would favor large-magnitude embeddings.','计算点积与两边范数；只用原始点积会偏爱模长较大的向量。'],
 ['A zero vector receives the specified neutral score zero; it can outrank a negatively aligned vector.','零向量按约定得零分，因此可能排在负相关向量之前。'],
 ['Retrieve only from admitted skills and keep the original ID mapping. The supplied embedding search is a component, not Voyager’s complete planning or curriculum.','只从已入库技能中检索，并保持原始编号映射。给定向量的检索只是组件，不是 Voyager 的完整规划或课程系统。']
 ],['Sorting ascending by cosine retrieves the least aligned skills.','按余弦分数升序会检索到最不相似的技能。'],['O(nd+n log n) time and O(n) auxiliary space.','时间 O(nd+n log n)，辅助空间 O(n)。'],'voyager',[
 'assert retrieve_skill_indices([1,0],[[1,0],[1,1],[-1,0],[0,0]],3)==[0,1,3]','assert retrieve_skill_indices([0,0],[[1,0],[0,1]],2)==[0,1]','assert retrieve_skill_indices([1],[],2)==[]','assert retrieve_skill_indices([1],[[1]],0)==[]','assert retrieve_skill_indices([1],[[1],[2],[-1]],10)==[0,1,2]','assert retrieve_skill_indices([1],[[0],[-1]],2)==[0,1]']);
add('pareto',2,['Keep a Quality–Cost Prompt Frontier','保留质量与成本的提示候选前沿'],['Maintain nondominated prompt candidates instead of collapsing quality and cost into an arbitrary scalar. This is a quality–cost teaching adaptation of GEPA’s Pareto-search idea.','保留非支配提示候选，避免用任意权重将质量与成本压成单分数。这是借鉴 GEPA 帕累托搜索思想的质量—成本教学改编。'],[
 ['quality and costs are equally long finite numeric lists; quality has absolute value <= 10000 and costs are nonnegative. Higher quality and lower cost are preferred.','quality 与 costs 等长、元素有限，quality 绝对值不超过 10000，成本非负。质量越高越好，成本越低越好。'],
 ['Candidate j dominates i when quality[j] >= quality[i] and costs[j] <= costs[i], with at least one strict inequality.','若 quality[j] >= quality[i] 且 costs[j] <= costs[i]，并且至少一项严格不等，则 j 支配 i。'],
 ['Return the nondominated original indices in ascending order. Identical candidates do not dominate each other and are all retained. Empty input returns [].','按原始下标升序返回非支配候选。完全相同的候选互不支配，全部保留。空输入返回 []。'],
 ['Do not mutate inputs. GEPA’s original frontier uses per-instance performance; this exercise explicitly substitutes quality and cost objectives, and does not implement prompt mutation.','不得修改输入。GEPA 原始前沿使用逐样本表现；本题明确替换成质量与成本目标，不实现提示变异。']
 ],'prompt_pareto_front(quality, costs)',`def prompt_pareto_front(quality, costs):
    result = []
    for i in range(len(quality)):
        dominated = any(quality[j] >= quality[i] and costs[j] <= costs[i]
                        and (quality[j] > quality[i] or costs[j] < costs[i])
                        for j in range(len(quality)))
        if not dominated:
            result.append(i)
    return result`,[
 ['Compare candidate pairs in both directions: one objective cannot compensate for losing the other under Pareto dominance.','在两个目标上同时比较候选；帕累托支配不允许一项优势抵消另一项劣势。'],
 ['Require one strict improvement, so exact duplicates survive. A cheaper weaker candidate and an expensive stronger candidate may both remain.','必须至少一项严格更优，因此完全重复项保留。便宜但弱、昂贵但强的候选可能同时留下。'],
 ['The archive supplies choices; deployment still needs an explicit budget or selection policy. Taking the best candidate separately for each test is not one deployable agent.','档案提供备选；部署仍需明确预算或选择规则。对每道测试分别选最优候选，不等于部署一个 Agent。']
 ],['Using strict comparisons on both axes incorrectly retains candidates tied on one axis and worse on the other.','要求两轴都严格更优，会错误保留一轴相等而另一轴更差的候选。'],['O(n²) time and O(n) output space.','时间 O(n²)，输出空间 O(n)。'],'gepa',[
 'assert prompt_pareto_front([.6,.8,.7,.9],[1,2,3,4])==[0,1,3]','assert prompt_pareto_front([1,1],[2,2])==[0,1]','assert prompt_pareto_front([],[])==[]','assert prompt_pareto_front([1,1],[2,1])==[1]','assert prompt_pareto_front([0,-1],[0,0])==[0]','assert prompt_pareto_front([.5,.5000000001],[1,1])==[1]']);
add('promote',2,['Promote a Version Without Forgetting Old Tasks','在保留旧能力的约束下接受新版本'],['Decide whether to retain a new scaffold version using paired development results and a fixed regression guard. Independent final audit results must remain outside this gate.','依据配对开发结果与固定回归约束，决定是否保留新的系统结构版本。独立最终审计结果不得进入这个选择关卡。'],[
 ['before and after are nonempty equally long finite score lists on the same development tasks, with absolute values <= 10000. Higher is better. min_gain and max_drop are finite and nonnegative.','before 与 after 为同一组开发任务上的非空等长有限分数列表，分数绝对值不超过 10000，越高越好。min_gain 与 max_drop 有限且非负。'],
 ['Compute paired differences d[i]=after[i]-before[i]. Accept only if mean(d) >= min_gain AND every d[i] >= -max_drop.','计算配对差 d[i]=after[i]-before[i]。仅当 mean(d) >= min_gain 且全部 d[i] >= -max_drop 时接受。'],
 ['Return a bool. Both thresholds are inclusive; compare raw Python floats without rounding or tolerance.','返回布尔值。两阈值均含等号，按原始 Python 浮点数比较，不舍入、不添加容差。'],
 ['Do not mutate inputs or claim statistical significance. This is an original fixed development gate motivated by retention concerns, not GEPA’s official acceptance rule.','不得修改输入或宣称统计显著。本题是受能力保留问题启发的原创固定开发关卡，不是 GEPA 官方接受规则。']
 ],'promote_scaffold(before, after, min_gain, max_drop)',`import math

def promote_scaffold(before, after, min_gain, max_drop):
    differences = [a-b for b,a in zip(before,after)]
    return math.fsum(differences)/len(differences) >= min_gain and all(d >= -max_drop for d in differences)`,[
 ['Pair the same tasks before averaging. In the example [0.5,0.75] → [0.875,0.5], the mean gain is positive but the second task regresses.','先按相同任务配对再求平均。示例 [0.5,0.75] → [0.875,0.5] 的平均增益为正，但第二项退步。'],
 ['Use the conjunction of average gain and every-task guard. Rejecting the update keeps the old version; it does not erase the failed experiment record.','同时满足平均增益与逐任务保护才接受。拒绝更新意味着保留旧版本，不意味着删除失败实验记录。'],
 ['This check uses development data. Only separate, unexposed audit tasks can support a final generalization claim; repeated tuning against the audit would make it development data too.','本检查使用开发数据。最终泛化结论需要独立且未暴露的审计任务；若反复依据审计调参，它也参与了开发选择。']
 ],['A positive average can hide severe forgetting on one task.','正平均增益可能掩盖某个任务的严重遗忘。'],['O(n) time and O(n) auxiliary space.','时间 O(n)，辅助空间 O(n)。'],'gepa',[
 'assert promote_scaffold([.5,.75],[.875,.5],0,.125) is False','assert promote_scaffold([.5,.75],[.875,.5],.0625,.25) is True','assert promote_scaffold([1],[1],0,0) is True','assert promote_scaffold([1],[1],.1,0) is False','assert promote_scaffold([0,0],[.5,.25],.375,0) is True','x=[0,1]; assert promote_scaffold(x,[1,1],.5,0) and x==[0,1]']);
add('compare',3,['Compare Improvers from Matched Starting Systems','从相同起点对照新旧改进器'],['Measure paired improvement gains from two supplied improvers under matched starts, seeds and budgets. This isolates evidence about improvement ability, motivated by HyperAgents.','在匹配起点、种子与预算的条件下，计算两个给定改进器的配对增益。参考 HyperAgents，本题拆解关于改进能力的证据。'],[
 ['old_runs and new_runs are lists of dictionaries with exactly start, seed, budget, initial, final fields. start is a string; seed and budget are nonnegative integers; scores are finite with absolute value <= 10000.','old_runs 与 new_runs 为字典列表，每项恰含 start、seed、budget、initial、final。start 是字符串，seed 与 budget 是非负整数，分数有限且绝对值不超过 10000。'],
 ['Match runs by (start,seed,budget), regardless of list order. Raise ValueError for empty lists, duplicate keys, unmatched keys or unequal initial scores within a pair.','按 (start,seed,budget) 配对，不依赖列表顺序。空列表、重复键、键不匹配或同一配对初始分数不同时抛出 ValueError。'],
 ['For each pair compute (new_final-new_initial) - (old_final-old_initial). Return the arithmetic mean over pairs. Higher scores are better.','逐对计算 (new_final-new_initial) - (old_final-old_initial)，返回配对项的算术平均。分数越高越好。'],
 ['Do not mutate inputs. Equal budget labels are a required contract, not a measurement of real resource use. A positive sample mean alone is not proof of general or accelerating RSI.','不得修改输入。相等预算标签是接口前提，不能替代真实资源计量。样本均值为正也不证明通用或加速的 RSI。']
 ],'paired_improver_gain(old_runs, new_runs)',`import math

def paired_improver_gain(old_runs, new_runs):
    def index(runs):
        result = {}
        for r in runs:
            key = (r['start'], r['seed'], r['budget'])
            if key in result:
                raise ValueError("duplicate run")
            result[key] = r
        return result
    old, new = index(old_runs), index(new_runs)
    if not old or old.keys() != new.keys():
        raise ValueError("unmatched runs")
    differences = []
    for key, a in old.items():
        b = new[key]
        if a['initial'] != b['initial']:
            raise ValueError("different starting score")
        differences.append((b['final']-b['initial'])-(a['final']-a['initial']))
    return math.fsum(differences)/len(differences)`,[
 ['Build keys from starting-system identity, seed and total improvement budget. Matching only the seed can silently compare different starting points.','使用起始系统编号、种子与完整改进预算组成键。只按种子配对可能悄悄比较不同起点。'],
 ['Subtract each starting score first, then compare gains. Because starts match, the paired difference also equals new final minus old final; keeping both gains visible explains the experiment.','先减各自初始分数，再比较增益。因起点相同，配对差也等于新旧最终分数之差；显式展示两边增益更能解释实验。'],
 ['HyperAgents motivates studying the meta-agent. The pairing API and checks here are original evaluation components, not its published estimator or a reproduction of its benchmark. Repeated runs and untouched transfer tasks remain necessary.','HyperAgents 提供研究元 Agent 的动机。本题配对接口与校验为原创评估组件，不是论文公开估计器或基准复现。仍需重复实验与未参与选择的迁移任务。']
 ],['A stronger final agent from a stronger starting point does not isolate a stronger improver.','从更强起点得到更强终点，不能单独证明改进器更强。'],['O(n) expected time and O(n) space.','期望时间 O(n)，空间 O(n)。'],'hyper',[
 'a=[dict(start="s",seed=0,budget=10,initial=.25,final=.5)]; b=[dict(start="s",seed=0,budget=10,initial=.25,final=.75)]; assert paired_improver_gain(a,b)==.25',
 'a=[dict(start="s",seed=i,budget=1,initial=0,final=f) for i,f in enumerate([.5,.25])]; b=[dict(start="s",seed=i,budget=1,initial=0,final=f) for i,f in enumerate([.25,.5])]; assert paired_improver_gain(a,b[::-1])==0',
 'try:\n    paired_improver_gain([],[])\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError("empty")',
 'a=[dict(start="s",seed=0,budget=1,initial=0,final=1)]; b=[dict(start="s",seed=0,budget=2,initial=0,final=1)]\ntry:\n    paired_improver_gain(a,b)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError("budget")',
 'a=[dict(start="s",seed=0,budget=1,initial=0,final=1)]\ntry:\n    paired_improver_gain(a+a,a)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError("duplicate")',
 'a=[dict(start="s",seed=0,budget=1,initial=0,final=1)]; b=[dict(start="s",seed=0,budget=1,initial=.5,final=1)]\ntry:\n    paired_improver_gain(a,b)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError("initial")']);
await writeFile(new URL('../src/rsi-problems.mjs',import.meta.url),'// Generated by scripts/author-rsi.mjs; edit the bilingual authoring source.\nexport const rsiProblems = '+JSON.stringify(catalog,null,2)+';\n');
await writeFile(new URL('../src/locales/zh-content-rsi.json',import.meta.url),JSON.stringify(zh,null,2)+'\n');
console.log(`Authored ${catalog.length} bilingual RSI components`);
await writeFile(new URL('../src/locales/zh-content-rsi-curriculum.json',import.meta.url),JSON.stringify(rsiLocalized,null,2)+'\n');
