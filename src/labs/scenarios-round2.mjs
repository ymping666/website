// Original bounded exercises. Sources describe a task or format, not these implementations.
const bi=(en,zh)=>[en,zh];
const f=(id,phase,en,zh,input,expected)=>({id,phase,name:bi(en,zh),input,expected});
const templateReference=`import re

def render_template(template, context):
    def substitute(match):
        key = match.group(1)
        if key not in context:
            return match.group(0)
        value = context[key]
        if value is None:
            return ""
        if isinstance(value, bool):
            return "true" if value else "false"
        return str(value)
    # A single pass over the original template; inserted text is not parsed.
    return re.sub(r"[$][{]([A-Za-z_][A-Za-z0-9_]*)[}]", substitute, template)
`;
const templateCode=templateReference;
const templatePartial=templateCode.replace('    return re.sub(', '    result = re.sub(')+'    return re.sub(r"[$][{]([A-Za-z_][A-Za-z0-9_]*)[}]", substitute, result)\n';
const templateStarter=templatePartial.replace('if key not in context:', 'if not context.get(key):');
const ti=(template,context={})=>({template,context});

const rulesReference=`def evaluate_rules(transactions, rules):
    def atom(text, tx):
        if text == "flagged":
            return tx["flagged"]
        if text.startswith("amount >= "):
            return tx["amount"] >= int(text[len("amount >= "):])
        return tx["country"] == text[len("country == "):]

    def matches(condition, tx):
        # AND binds more tightly than OR. Input has already been validated.
        return any(all(atom(term, tx) for term in group.split(" AND "))
                   for group in condition.split(" OR "))

    result = []
    for tx in transactions:
        action, index = "ALLOW", -1
        for i, rule in enumerate(rules):
            if matches(rule["condition"], tx):
                action, index = rule["action"], i
                break
        result.append({"id": tx["id"], "action": action, "rule_index": index})
    return result
`;
const rulesPartial=rulesReference.replace('                break\n','');
const rulesStarter=rulesPartial.replace('return any(all(atom(term, tx)', 'return all(all(atom(term, tx)');
const tx=(id='T',amount=100,country='US',flagged=false)=>({id,amount,country,flagged});
const rule=(condition,action='BLOCK')=>({condition,action});
const ri=(transactions,rules)=>({transactions,rules});
const ro=(id='T',action='ALLOW',rule_index=-1)=>({id,action,rule_index});

const invoiceReference=`def summarize_invoices(config, customers, pages):
    totals = {c["id"]: 0 for c in customers}
    invoice_ids = {c["id"]: [] for c in customers}
    seen = {c["id"]: set() for c in customers}
    for page in pages:
        customer = page["customer_id"]
        if customer not in totals:
            continue
        for invoice in page["invoices"]:
            ident = invoice["id"]
            if ident in seen[customer]:
                continue
            # First occurrence wins, even if it is paid or another currency.
            seen[customer].add(ident)
            if invoice["paid"] or invoice["currency"] != config["currency"]:
                continue
            totals[customer] += invoice["amount"]
            invoice_ids[customer].append(ident)
    return [{"customer_id": c["id"], "name": c["name"],
             "total": totals[c["id"]], "invoice_ids": invoice_ids[c["id"]]}
            for c in customers if totals[c["id"]] >= config["min_total"]]
`;
const invoicePartial=invoiceReference.replace('seen = {c["id"]: set() for c in customers}', 'seen = set()').replaceAll('seen[customer]', 'seen');
const invoiceStarter=invoiceReference.replace('    for page in pages:', '    for page in pages[:1]:');
const customer=(id='C',name='Ada')=>({id,name});
const invoice=(id='I',amount=100,currency='USD',paid=false)=>({id,amount,currency,paid});
const page=(customer_id='C',invoices=[])=>({customer_id,invoices});
const ii=(customers=[customer()],pages=[],currency='USD',min_total=0)=>({config:{currency,min_total},customers,pages});
const io=(customer_id='C',name='Ada',total=0,invoice_ids=[])=>({customer_id,name,total,invoice_ids});

export const round2Scenarios=[
  {
    id:'template-renderer-debugging',version:'template-v1',company:'Stripe',sourceChecked:'2026-10-13',mode:'debug',number:'04',
    title:bi('Debug a one-pass template renderer','调试单次解析的模板替换器'),
    subtitle:bi('A small library mishandles falsey values and parses inserted text again. Repair it without changing literal text.','一个小型模板库误处理假值，还会再次解析插入文本。请修复它，同时保留字面文本。'),
    category:bi('Library debugging','组件库排错'),duration:bi('20–30 min','20–30 分钟'),file:'template.py',signature:'render_template(template, context)',args:['template','context'],
    description:bi('Debug a Python template renderer: preserve falsey values, missing keys and one-pass substitution with visual inputs, regression tests and a solution.','调试 Python 模板替换器，修复假值处理与重复解析，保留未知占位符和字面文本。结合替换映射、分阶段测试、反例与完整参考实现验证修复。'),
    source:{url:'https://www.reddit.com/r/leetcode/comments/1mgcc99/stripe_integration_and_bug_bash_rounds_interview/',title:'Stripe Integration and Bug Bash rounds interview experience',summary:bi('A firsthand public account describes fixing failing tests in an unfamiliar library, mentioning Mako as an example. It explicitly says AI was prohibited in that interview. Our small template language, bugs, prepared suggestions and tests are original; this is neither Mako nor a reproduction of a Stripe question.','公开个人面经描述了在陌生组件库中修复失败测试，并以 Mako 为例。作者明确表示当次面试禁止使用 AI。本题的小型模板语法、缺陷、预设建议和测试均为原创；不是 Mako 实现，也不是 Stripe 原题复现。')},
    brief:bi('You inherit a plain-text substitution helper used in notifications. A suggested patch handles missing values by truthiness and runs substitution twice. Inspect which responsibilities that breaks, then keep the single-pass contract.','你接手一个用于通知消息的纯文本替换函数。候选方案按真假判断缺失值，并运行两次替换。请定位它破坏的行为，恢复单次解析契约。'),
    contract:[
      bi('The template has at most 600 characters. Only ${key} with an ASCII identifier [A-Za-z_][A-Za-z0-9_]* is a placeholder. Other text, including malformed placeholders, is preserved exactly.','template 最多 600 字符。只有 ${key} 是占位符，其中 key 为 ASCII 标识符 [A-Za-z_][A-Za-z0-9_]*。其他文本，包括格式不合法的占位符，原样保留。'),
      bi('context has up to 16 such keys. Values are strings (up to 160 characters), integers from -1000 to 1000, booleans or null. Integers use decimal text; booleans use true/false; null becomes an empty string.','context 最多 16 个同规则键；值可为最多 160 字符的字符串、-1000～1000 的整数、布尔值或 null。整数转十进制文本，布尔值转 true/false，null 转空字符串。'),
      bi('Replace every recognized placeholder whose key exists, even for 0, false, null or an empty string. A missing key leaves the entire placeholder unchanged.','替换所有键存在的合法占位符，0、false、null 和空字符串也算存在。键缺失时保留整个占位符。'),
      bi('Parse only the original template once. Replacement values are literal text, never reparsed or executed. This helper does not escape HTML; treat its result as plain text. Do not mutate inputs.','仅解析原模板一次。替换值是字面文本，不再次解析或执行。本函数不进行 HTML 转义，输出应作为纯文本处理。不得修改输入。')
    ],
    phases:[bi('1 · Literal text & keys','1 · 字面文本与键'),bi('2 · Falsey values','2 · 假值处理'),bi('3 · Single-pass boundary','3 · 单次解析边界')],
    starter:templateStarter,partial:templatePartial,reference:templateCode,initialInput:ti('Hello ${name}; count=${count}; ${missing}',{name:'Ada',count:0}),
    suggestion:bi('“Use context.get(key) to skip empty values; a second pass resolves nested placeholders for convenience.” Which promises does that silently change?','“用 context.get(key) 跳过空值；再解析一次，顺便支持嵌套占位符。”这悄悄改变了哪些契约？'),
    partialLabel:bi('B · Fix presence checks, still rescan','B · 修复键存在判断，仍重复解析'),
    hint:bi('Membership and truthiness differ. A regex callback can replace each match from the original input once, without interpreting backslashes or placeholders in a replacement string.','存在性与真假不同。正则回调可以对原输入的每个匹配替换一次，避免把替换字符串里的反斜杠或占位符再次解释。'),
    takeaway:bi('A missing key is not an empty value. A single-pass callback preserves literal replacement data and avoids order-dependent expansion. This is a deliberately small text language, not an HTML renderer or a general template engine.','缺失键不等于空值。单次扫描的回调可以保留替换数据的字面含义，避免由键顺序决定的递归展开。这是一种刻意简化的文本语法，不是 HTML 渲染器或通用模板引擎。'),
    transfer:{prompt:bi('With a="${b}" and b="done", what should rendering "${a}" return?','当 a="${b}"、b="done" 时，渲染 "${a}" 应返回什么？'),options:[bi('done','done'),bi('${b}, because inserted text stays literal','${b}，因为插入文本保留字面含义'),bi('An error for a cycle','报循环错误')],answer:1,explanation:bi('Only the original template is scanned. The occurrence of ${b} inside a value is not a new match.','只扫描原模板；替换值中的 ${b} 不会成为新的匹配。')},
    fixtures:[
      f('literal',0,'Plain literal text','纯字面文本',ti('plain $ text'), 'plain $ text'),
      f('basic',0,'Known key','已知键',ti('Hi ${name}',{name:'Ada'}),'Hi Ada'),
      f('missing',0,'Missing key stays intact','保留缺失键',ti('${absent}',{}),'${absent}'),
      f('repeated',0,'Adjacent and repeated placeholders','相邻与重复占位符',ti('${x}${x}!',{x:'A'}),'AA!'),
      f('zero',1,'Zero is present','零值存在',ti('n=${n}',{n:0}),'n=0'),
      f('false',1,'False is present','布尔假值存在',ti('${v}',{v:false}),'false'),
      f('null',1,'Null becomes empty text','null 转空文本',ti('a${v}b',{v:null}),'ab'),
      f('empty',1,'Empty string is present','空字符串存在',ti('${v}!',{v:''}),'!'),
      f('true-negative',1,'Boolean and signed integer','布尔值与负整数',ti('${yes}/${n}',{yes:true,n:-7}),'true/-7'),
      f('single-pass',2,'Inserted placeholder stays literal','插入的占位符保持字面值',ti('${a}',{a:'${b}',b:'done'}),'${b}'),
      f('self',2,'Self reference is literal data','自引用是字面数据',ti('${a}',{a:'${a}'}),'${a}'),
      f('malformed',2,'Invalid identifier is literal','非法标识符是字面文本',ti('${a-b}|${9}|${}|${open',{a:'X'}),'${a-b}|${9}|${}|${open'),
      f('slash',2,'Backslashes are not replacement syntax','反斜杠不作为替换语法',ti('${x}',{x:'\\1\\path'}),'\\1\\path'),
      f('unicode',2,'Unicode data and literal HTML','Unicode 数据与字面 HTML',ti('${_x2}',{_x2:'你好 <b>x</b>'}),'你好 <b>x</b>')
    ]
  },
  {
    id:'transaction-rules-review',version:'rules-v1',company:'Stripe',sourceChecked:'2026-10-13',mode:'review',number:'05',sourceLabel:bi('Community summary · unverified','社区整理 · 未核实'),
    title:bi('Review a transaction rule engine','审查交易规则引擎'),subtitle:bi('An AI simplification merges rule conditions and keeps searching after a match. Check precedence and rule order.','AI 的精简方案合并规则条件，并在匹配后继续搜索。请检查布尔优先级与规则顺序。'),
    category:bi('AI code review','AI 代码审查'),duration:bi('25–35 min','25–35 分钟'),file:'rules.py',signature:'evaluate_rules(transactions, rules)',args:['transactions','rules'],
    description:bi('Review a Python transaction rule engine: check AND/OR precedence and first-match decisions using visual rule lists, staged tests and a solution.','审查 Python 交易规则引擎，检查 AND/OR 优先级、规则顺序与默认放行行为。结合交易表、规则列表、分阶段测试和完整参考实现验证候选补丁。'),
    source:{url:'https://www.reddit.com/r/leetcode/comments/1u51q4w/stripes_new_ai_programming_exercise_interview/',title:'Stripe’s New AI Programming Exercise Interview — community summary',summary:bi('A community roundup, not a firsthand account or official statement, describes transaction accept/block rules expanded with AND/OR in a reported Stripe AI round. That claim is unverified. Our grammar, first-match policy, data, proposed patches and tests are original teaching choices.','社区整理帖描述了据称出现在 Stripe AI 面试中的交易放行/拦截规则及 AND/OR 迭代；它不是亲历者原帖或官方说明，该说法未核实。本题语法、首条匹配策略、数据、候选补丁与测试为原创教学设计。')},
    brief:bi('An existing transaction filter supports single conditions. You must review its extension to boolean expressions and an ordered rule list. A plausible cleanup mixes up two different kinds of order: expression precedence and rule priority.','已有交易过滤器支持单条件。你需要审查扩展后的布尔表达式与有序规则列表。一段看似合理的精简混淆了两种顺序：表达式优先级与规则优先级。'),
    contract:[
      bi('transactions has at most 20 records with unique id (1–24 ASCII letters/digits/_/-), amount (integer 0–1000), country (two uppercase ASCII letters), and flagged (boolean). Return one result per transaction in input order.','transactions 最多 20 条；id 唯一，由 1–24 个 ASCII 字母、数字、_ 或 - 组成；amount 为 0–1000 整数，country 为两个大写 ASCII 字母，flagged 为布尔值。按输入顺序输出每笔交易的结果。'),
      bi('rules has at most 12 {action, condition} records. action is ALLOW or BLOCK. Each atom is exactly flagged, amount >= N (N is a canonical integer 0–1000), or country == CC. Atoms are joined by exactly " AND " or " OR "; at most 6 atoms and 120 characters. No parentheses, arbitrary fields or executable expressions.','rules 最多 12 条 {action, condition}；action 为 ALLOW 或 BLOCK。原子条件恰为 flagged、amount >= N（N 为无前导零的 0–1000 整数）或 country == CC。条件仅用 " AND "、" OR " 连接，最多 6 个原子、120 字符；不支持括号、任意字段或可执行表达式。'),
      bi('AND binds more tightly than OR. Compare amounts inclusively. Matching the country is case-sensitive; all input countries are uppercase.','AND 优先于 OR。金额比较包含等号，国家代码区分大小写；输入国家代码均为大写。'),
      bi('The first matching rule wins. Output {id, action, rule_index}, where rule_index is zero-based. If no rule matches, use ALLOW and -1. Do not mutate either input list.','第一条匹配规则生效。输出 {id, action, rule_index}，规则下标从 0 开始。没有匹配规则时使用 ALLOW、-1。不得修改输入列表。')
    ],
    phases:[bi('1 · Atoms & default','1 · 原子条件与默认行为'),bi('2 · AND/OR precedence','2 · 布尔优先级'),bi('3 · First matching rule','3 · 首条匹配规则')],
    starter:rulesStarter,partial:rulesPartial,reference:rulesReference,initialInput:ri([tx('T1',20,'US',false),tx('T2',100,'GB',false)],[rule('flagged OR amount >= 100'),rule('country == GB','ALLOW')]),
    suggestion:bi('“Combine all groups with all(), then let the last matching rule overwrite the decision so newer rules win.” Does the spec permit either change?','“所有分组统一用 all()；最后匹配的规则覆盖前面的结果，让新规则生效。”契约允许这两处改动吗？'),
    partialLabel:bi('B · Fix OR, still overwrite decisions','B · 修复 OR，仍覆盖已有决策'),
    hint:bi('Split into OR groups containing AND terms. Then inspect whether a matching rule should end the rule scan. Never use eval for this tiny language.','把表达式分成 OR 组，每组内部是 AND 项。再判断匹配规则后是否应该终止扫描。这种小型语法不需要 eval。'),
    takeaway:bi('Expression precedence and rule priority are separate contracts. OR-of-AND groups implement this restricted grammar; stopping at the first match implements ordered policy. The model cannot decide those policies for you.','表达式优先级与规则优先级是独立契约。OR 连接的 AND 分组实现这里的受限语法；首个匹配后停止扫描实现有序策略。不能让模型替你决定这些业务规则。'),
    transfer:{prompt:bi('Rule 0 allows a transaction and rule 1 blocks it. Both conditions match. What is returned?','规则 0 放行，规则 1 拦截，两个条件都匹配，结果是什么？'),options:[bi('BLOCK, because blocking is safer','BLOCK，因为拦截更安全'),bi('ALLOW with rule_index 0','ALLOW，rule_index 为 0'),bi('ALLOW with rule_index -1','ALLOW，rule_index 为 -1')],answer:1,explanation:bi('The contract specifies first match, without an implicit block-overrides policy. A different business policy would require a different spec and tests.','契约指定首条匹配，没有隐含的拦截优先策略。不同业务规则需要不同说明与测试。')},
    fixtures:[
      f('empty',0,'No transactions','没有交易',ri([],[]),[]),
      f('default',0,'No matching rule','无匹配规则',ri([tx()],[rule('flagged')]),[ro()]),
      f('threshold',0,'Inclusive amount threshold','金额边界包含等号',ri([tx()],[rule('amount >= 100')]),[ro('T','BLOCK',0)]),
      f('flag',0,'Flag condition','标记条件',ri([tx('T',0,'CN',true)],[rule('flagged')]),[ro('T','BLOCK',0)]),
      f('country',0,'Country equality','国家相等条件',ri([tx()],[rule('country == US')]),[ro('T','BLOCK',0)]),
      f('or-right',1,'Only the right OR branch matches','仅 OR 右分支匹配',ri([tx()],[rule('flagged OR amount >= 100')]),[ro('T','BLOCK',0)]),
      f('or-left',1,'Only the left OR branch matches','仅 OR 左分支匹配',ri([tx('T',1,'US',true)],[rule('flagged OR amount >= 100')]),[ro('T','BLOCK',0)]),
      f('and-false',1,'Both AND terms are required','AND 两项均须匹配',ri([tx()],[rule('amount >= 100 AND flagged')]),[ro()]),
      f('precedence',1,'AND binds before OR','AND 优先于 OR',ri([tx('T',1,'GB',true)],[rule('flagged OR amount >= 100 AND country == US')]),[ro('T','BLOCK',0)]),
      f('mixed',1,'Two false groups stay false','两组均假',ri([tx('T',10,'US',false)],[rule('flagged AND country == US OR amount >= 100')]),[ro()]),
      f('first-allow',2,'First allow beats later block','先放行后拦截',ri([tx()],[rule('country == US','ALLOW'),rule('amount >= 0')]),[ro('T','ALLOW',0)]),
      f('first-block',2,'First block beats later allow','先拦截后放行',ri([tx()],[rule('amount >= 0'),rule('country == US','ALLOW')]),[ro('T','BLOCK',0)]),
      f('later-index',2,'Skip an unmatched earlier rule','跳过前面未匹配规则',ri([tx()],[rule('flagged'),rule('amount >= 100')]),[ro('T','BLOCK',1)]),
      f('order',2,'Transaction order and no state leakage','交易顺序与状态隔离',ri([tx('B',0),tx('A',100)],[rule('amount >= 100')]),[ro('B'),ro('A','BLOCK',0)]),
      f('no-rules',2,'Empty rule list','空规则列表',ri([tx()],[]),[ro()])
    ]
  },
  {
    id:'invoice-pagination',version:'invoices-v1',company:'Stripe',sourceChecked:'2026-10-13',mode:'extend',number:'06',
    title:bi('Extend a paginated invoice integration','迭代分页账单集成'),subtitle:bi('A single-page adapter needs to join customers and invoice responses, deduplicate pages and preserve output order.','单页适配器需要关联客户与账单响应、跨页去重，并保留输出顺序。'),
    category:bi('API integration iteration','API 集成迭代'),duration:bi('25–35 min','25–35 分钟'),file:'invoices.py',signature:'summarize_invoices(config, customers, pages)',args:['config','customers','pages'],
    description:bi('Extend a Python invoice integration: join customer data, deduplicate paginated responses and filter totals with visual inputs and regression tests.','迭代 Python 账单集成代码，关联客户数据、合并分页响应并去重，按币种和金额筛选。结合分页数据表、分阶段回归测试与完整题解验证修改，无需真实 API。'),
    source:{url:'https://www.reddit.com/r/leetcode/comments/1mgcc99/stripe_integration_and_bug_bash_rounds_interview/',title:'Stripe Integration and Bug Bash rounds interview experience',summary:bi('A firsthand public account describes reading configuration, parsing one API response and using it in later requests, with staged integration requirements. It says AI was prohibited. Invoice schemas, pagination, deduplication and all code/tests here are original extensions. Responses are supplied fixtures; there are no real Stripe APIs, credentials or network calls.','公开个人面经描述了读取配置、解析 API 响应，再用于后续请求的分阶段集成任务，且明确表示禁止 AI。本题账单结构、分页、去重、代码及测试为原创扩展；响应是给定样例，不涉及真实 Stripe API、密钥或网络请求。')},
    brief:bi('Your adapter already handles the first response page. Extend it to all supplied pages without double-counting retries or mixing customer identities. Keep amounts in integer minor units; do not add network calls.','当前适配器已处理首个响应页。请扩展到全部给定分页，避免重试导致重复计费，也不能混淆客户身份。金额保持整数最小货币单位；不需要新增网络请求。'),
    contract:[
      bi('config is {currency, min_total}. Currency is USD, CNY or GBP; min_total is an integer 0–10000. Amounts are integer minor units, with no exchange conversion.','config 为 {currency, min_total}。币种为 USD、CNY 或 GBP；min_total 为 0–10000 整数。金额使用整数最小货币单位，不做汇率转换。'),
      bi('customers has at most 8 {id, name} records with unique ids. IDs are 1–24 ASCII letters/digits/_/-; names have up to 40 characters. pages has at most 8 {customer_id, invoices} records; each has up to 8 invoices with {id, amount, currency, paid}, amount 0–1000 and paid boolean. Unknown customer pages are ignored.','customers 最多 8 条 {id, name}，id 唯一且由 1–24 个 ASCII 字母、数字、_ 或 - 组成，name 最多 40 字符。pages 最多 8 页 {customer_id, invoices}，每页最多 8 条 {id, amount, currency, paid}；amount 为 0–1000 整数，paid 为布尔值。忽略未知客户的页。'),
      bi('Traverse pages and invoices in input order. For each customer, the first occurrence of an invoice id wins, even if it is paid or another currency. The same invoice id for different customers is independent.','按输入顺序遍历页与账单。同一客户中，账单 id 第一次出现的记录生效，即使该记录已付款或币种不同。不同客户可独立使用相同账单 id。'),
      bi('Sum only unpaid, selected-currency invoices. Return {customer_id, name, total, invoice_ids} for totals >= min_total in customer input order; invoice_ids keep first-occurrence order of included invoices. With min_total 0, include zero-total customers. Do not mutate inputs.','仅累加未付款且符合所选币种的账单。按客户输入顺序输出 total >= min_total 的 {customer_id, name, total, invoice_ids}；invoice_ids 保留被计入账单的首次出现顺序。min_total 为 0 时包含零总额客户。不得修改输入。')
    ],
    phases:[bi('1 · Join & filter','1 · 关联与筛选'),bi('2 · Multiple pages','2 · 多页处理'),bi('3 · Deduplication scope','3 · 去重范围')],
    starter:invoiceStarter,partial:invoicePartial,reference:invoiceReference,initialInput:ii([customer('A','Ada'),customer('B','Bo')],[page('A',[invoice('I',100)]),page('A',[invoice('I',100),invoice('J',50)]),page('B',[invoice('I',80)])]),
    suggestion:bi('“Scan every page, but use one global set of invoice IDs so retry handling is simpler.” What happens when two customers share an ID?','“扫描所有页，但用一个全局账单 ID 集合简化重试去重。”两个客户使用同一个账单 ID 时会怎样？'),
    partialLabel:bi('B · All pages, global deduplication','B · 扫描全部页，仍全局去重'),
    hint:bi('Use customer IDs for the join, not response position. Deduplication belongs to (customer_id, invoice_id), and first occurrence must be recorded before the paid/currency filter.','按客户 ID 关联，不能按响应位置关联。去重作用域是 (customer_id, invoice_id)，且要在付款与币种筛选前记录首次出现。'),
    takeaway:bi('Pagination is not just concatenation. Preserve identity, order and a precise duplicate policy across pages. Per-customer seen sets and accumulators separate these responsibilities; supplied fixtures keep the exercise deterministic and cost-free.','分页不只是拼接列表，还需要保留身份、顺序与明确的重复策略。每个客户独立的已见集合和累加器可以分离这些职责；使用给定响应样例让练习可重复且没有接口成本。'),
    transfer:{prompt:bi('For one customer, invoice X first appears as paid, then as unpaid. Which record counts?','同一客户的账单 X 先以已付款记录出现，后以未付款记录出现，应该计入哪条？'),options:[bi('The unpaid version counts','计入未付款版本'),bi('Neither counts: first occurrence wins and it was paid','都不计入：首条生效，而它已付款'),bi('Both count as separate invoices','两条都是独立账单')],answer:1,explanation:bi('Deduplicate before filtering. This exercise uses first occurrence, not last-write-wins or reconciliation; real API policies may differ.','先去重再筛选。此题使用首条生效策略，不是最后写入生效或账单对账；真实 API 策略可能不同。')},
    fixtures:[
      f('empty',0,'No customers or pages','空客户与分页',ii([],[]),[]),
      f('one',0,'One unpaid invoice','单条未付款账单',ii(undefined,[page('C',[invoice()])]),[io('C','Ada',100,['I'])]),
      f('filters',0,'Paid and other currency excluded','排除已付与其他币种',ii(undefined,[page('C',[invoice('P',100,'USD',true),invoice('Y',80,'CNY'),invoice('U',40)])]),[io('C','Ada',40,['U'])]),
      f('threshold',0,'Inclusive minimum total','最低金额包含边界',ii(undefined,[page('C',[invoice()])],'USD',100),[io('C','Ada',100,['I'])]),
      f('zero',0,'Zero totals retained at zero minimum','零门槛保留零总额',ii(),[io()]),
      f('threshold-reject',0,'Below minimum excluded','低于门槛排除',ii(undefined,[],'USD',1),[]),
      f('multiple',1,'Accumulate all pages','累加所有页',ii(undefined,[page('C',[invoice('I',100)]),page('C',[invoice('J',50)])]),[io('C','Ada',150,['I','J'])]),
      f('empty-page',1,'Continue after an empty page','空页后继续处理',ii(undefined,[page(),page('C',[invoice()])]),[io('C','Ada',100,['I'])]),
      f('unknown',1,'Ignore unknown customers','忽略未知客户',ii(undefined,[page('X',[invoice()]),page('C',[invoice('J',70)])]),[io('C','Ada',70,['J'])]),
      f('customer-order',1,'Customer order differs from page order','客户顺序不同于页顺序',ii([customer('A','Ada'),customer('B','Bo')],[page('B',[invoice('B',20)]),page('A',[invoice('A',10)])]),[io('A','Ada',10,['A']),io('B','Bo',20,['B'])]),
      f('repeat',2,'Retry duplicates count once','重试重复只计一次',ii(undefined,[page('C',[invoice('I',100),invoice('I',900)]),page('C',[invoice('I',500),invoice('J',50)])]),[io('C','Ada',150,['I','J'])]),
      f('scoped',2,'Same ID in two customers','不同客户使用相同 ID',ii([customer('A','Ada'),customer('B','Bo')],[page('A',[invoice('I',100)]),page('B',[invoice('I',80)])]),[io('A','Ada',100,['I']),io('B','Bo',80,['I'])]),
      f('paid-first',2,'Paid first occurrence still reserves ID','首次已付款仍占用 ID',ii(undefined,[page('C',[invoice('I',100,'USD',true)]),page('C',[invoice('I',200)])]),[io()]),
      f('currency-first',2,'Other-currency first occurrence reserves ID','首次其他币种仍占用 ID',ii(undefined,[page('C',[invoice('I',100,'CNY'),invoice('I',200)])]),[io()]),
      f('zero-invoice',2,'Zero amount keeps included invoice ID','零金额仍保留计入的 ID',ii(undefined,[page('C',[invoice('Z',0),invoice('A',5)])]),[io('C','Ada',5,['Z','A'])])
    ]
  }
];

export function validateRound2Input(item,v) {
  const object=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
  const exact=(o,keys)=>object(o)&&Object.keys(o).sort().join(',')===[...keys].sort().join(',');
  const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
  const id=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{1,24}$/.test(s);
  const identifier=s=>/^[A-Za-z_][A-Za-z0-9_]*$/.test(s);
  const currency=s=>['USD','CNY','GBP'].includes(s);
  const list=(a,max,test)=>Array.isArray(a)&&a.length<=max&&a.every(test);
  if(item.id==='template-renderer-debugging')return typeof v.template==='string'&&v.template.length<=600&&object(v.context)&&Object.keys(v.context).length<=16&&Object.entries(v.context).every(([k,x])=>identifier(k)&&(x===null||typeof x==='boolean'||int(x,-1000,1000)||(typeof x==='string'&&x.length<=160)));
  if(item.id==='transaction-rules-review') {
    const condition=s=>typeof s==='string'&&s.length<=120&&s.split(/ AND | OR /).length<=6&&s.split(/ AND | OR /).every(a=>a==='flagged'||/^country == [A-Z]{2}$/.test(a)||(/^amount >= (0|[1-9]\d{0,3})$/.test(a)&&Number(a.slice(10))<=1000));
    return list(v.transactions,20,t=>exact(t,['id','amount','country','flagged'])&&id(t.id)&&int(t.amount,0,1000)&&typeof t.country==='string'&&/^[A-Z]{2}$/.test(t.country)&&typeof t.flagged==='boolean')&&new Set(v.transactions.map(t=>t.id)).size===v.transactions.length&&list(v.rules,12,r=>exact(r,['action','condition'])&&['ALLOW','BLOCK'].includes(r.action)&&condition(r.condition));
  }
  if(item.id==='invoice-pagination')return exact(v.config,['currency','min_total'])&&currency(v.config.currency)&&int(v.config.min_total,0,10000)&&list(v.customers,8,c=>exact(c,['id','name'])&&id(c.id)&&typeof c.name==='string'&&c.name.length<=40)&&new Set(v.customers.map(c=>c.id)).size===v.customers.length&&list(v.pages,8,p=>exact(p,['customer_id','invoices'])&&id(p.customer_id)&&list(p.invoices,8,i=>exact(i,['id','amount','currency','paid'])&&id(i.id)&&int(i.amount,0,1000)&&currency(i.currency)&&typeof i.paid==='boolean'));
  return false;
}
