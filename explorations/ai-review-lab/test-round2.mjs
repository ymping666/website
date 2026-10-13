import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {round2Scenarios} from '../../src/labs/scenarios-round2.mjs';
import {parseScenarioInput,scenarioTest,scenarioComparison} from '../../src/labs/scenarios.mjs';

const [template,rules,invoices]=round2Scenarios;
const bad=(item,cases)=>cases.forEach(input=>assert.throws(()=>parseScenarioInput(item,JSON.stringify(input)),/contract/));
bad(template,[{template:'x',context:[]},{template:'x'.repeat(601),context:{}},{template:'x',context:{x:1001}},{template:'x',context:{'bad-key':'x'}},{template:'x',context:{x:[]}}]);
bad(rules,[{transactions:[{id:'T',amount:true,country:'US',flagged:false}],rules:[]},...['flagged OR','flagged AND  flagged','amount >= 01','amount >= 1001','country == us','__import__("os")','flagged\n'].map(condition=>({transactions:[],rules:[{action:'BLOCK',condition}]})),{transactions:[],rules:[{action:'DENY',condition:'flagged'}]}]);
bad(invoices,[{...invoices.initialInput,config:{currency:'EUR',min_total:0}},{...invoices.initialInput,customers:[{id:'C',name:'a'},{id:'C',name:'b'}]},{...invoices.initialInput,pages:[{customer_id:'C',invoices:[{id:'I',amount:1,currency:'USD',paid:0}]}]}]);
const runner=readFileSync(new URL('../../src/runner.worker.js',import.meta.url),'utf8').match(/const PYTHON_CASE_RUNNER = String\.raw`([\s\S]*?)`;/)[1];
const payload=round2Scenarios.map(item=>({id:item.id,fn:item.signature.split('(')[0],args:item.args,reference:item.reference,starter:item.starter,partial:item.partial,fixtures:item.fixtures,tests:item.fixtures.map(f=>scenarioTest(item,f)),comparisons:item.fixtures.map(f=>scenarioComparison(item,f.input))}));
const python=`import sys, json, copy, random, itertools
${runner}
data=json.load(sys.stdin)
rng=random.Random(20261013)
def template_oracle(c):
    # Manual left-to-right scanner, independent of the regex implementation.
    text=c['template']; out=[]; i=0
    while i<len(text):
        if text[i:i+2]=='\u0024{':
            end=text.find('}',i+2)
            if end>=0:
                key=text[i+2:end]
                valid=bool(key) and (key[0].isascii() and (key[0].isalpha() or key[0]=='_')) and all(x.isascii() and (x.isalnum() or x=='_') for x in key)
                if valid:
                    if key not in c['context']: out.append(text[i:end+1])
                    else:
                        value=c['context'][key]
                        out.append('' if value is None else ('true' if value else 'false') if isinstance(value,bool) else str(value))
                    i=end+1; continue
        out.append(text[i]); i+=1
    return ''.join(out)
def rules_oracle(c):
    # Evaluate a token stream by collapsing AND, then OR; no eval and no split-into-groups.
    def matches(condition,tx):
        tokens=condition.split(' '); values=[]; ops=[]; i=0
        while i<len(tokens):
            if tokens[i]=='flagged': value=tx['flagged']; i+=1
            else:
                field,op,rhs=tokens[i:i+3]; i+=3
                value=tx['amount']>=int(rhs) if field=='amount' else tx['country']==rhs
            if ops and ops[-1]=='AND': values[-1]=values[-1] and value; ops.pop()
            else: values.append(value)
            if i<len(tokens): ops.append(tokens[i]); i+=1
        return any(values)
    out=[]
    for tx in c['transactions']:
        indexes=[i for i,r in enumerate(c['rules']) if matches(r['condition'],tx)]
        i=min(indexes) if indexes else -1
        out.append(dict(id=tx['id'],action=c['rules'][i]['action'] if i>=0 else 'ALLOW',rule_index=i))
    return out
def invoice_oracle(c):
    # For each customer, flatten pages then locate first records by prior positions.
    out=[]
    for customer in c['customers']:
        records=[inv for page in c['pages'] if page['customer_id']==customer['id'] for inv in page['invoices']]
        first=[inv for pos,inv in enumerate(records) if not any(old['id']==inv['id'] for old in records[:pos])]
        kept=[inv for inv in first if inv['currency']==c['config']['currency'] and not inv['paid']]
        total=sum(inv['amount'] for inv in kept)
        if total>=c['config']['min_total']: out.append(dict(customer_id=customer['id'],name=customer['name'],total=total,invoice_ids=[inv['id'] for inv in kept]))
    return out
def gen_template():
    values=['',0,False,True,None,-3,'word','\u0024{b}','\\\\1','你好']
    context={k:rng.choice(values) for k in ['a','b','_c'] if rng.choice([True,False])}
    text=''.join(rng.choice(['plain','\u0024{a}','\u0024{b}','\u0024{_c}','\u0024{missing}','\u0024{a-b}','\u0024{9}','\u0024{','}']) for _ in range(rng.randrange(10)))
    return dict(template=text,context=context)
def gen_rules():
    ts=[dict(id=str(i),amount=rng.randrange(4)*50,country=rng.choice(['US','CN','GB']),flagged=rng.choice([False,True])) for i in range(rng.randrange(6))]
    rs=[]
    for _ in range(rng.randrange(8)):
        terms=[rng.choice(['flagged','amount >= 0','amount >= 100','country == US','country == CN']) for _ in range(rng.randint(1,5))]
        condition=terms[0]
        for term in terms[1:]: condition+=rng.choice([' AND ',' OR '])+term
        rs.append(dict(action=rng.choice(['ALLOW','BLOCK']),condition=condition))
    return dict(transactions=ts,rules=rs)
def gen_invoices():
    customers=[dict(id=x,name=x) for x in rng.sample(['A','B','C'],rng.randrange(4))]
    pages=[]
    for _ in range(rng.randrange(8)):
        invs=[dict(id=rng.choice(['I','J','K']),amount=rng.randrange(4)*50,currency=rng.choice(['USD','CNY','GBP']),paid=rng.choice([True,False])) for _ in range(rng.randrange(5))]
        pages.append(dict(customer_id=rng.choice(['A','B','C','UNKNOWN']),invoices=invs))
    return dict(config=dict(currency=rng.choice(['USD','CNY','GBP']),min_total=rng.choice([0,50,100,500])),customers=customers,pages=pages)
for item,oracle,generate in zip(data,[template_oracle,rules_oracle,invoice_oracle],[gen_template,gen_rules,gen_invoices]):
    scope={}; exec(item['reference'],scope,scope)
    def invoke(c):
        local=copy.deepcopy(c); actual=scope[item['fn']](*[local[k] for k in item['args']])
        assert local==c,'input mutation'
        return actual
    for fixture,test,comparison in zip(item['fixtures'],item['tests'],item['comparisons']):
        assert oracle(fixture['input'])==fixture['expected'],(item['id'],fixture['id'],'bad golden')
        for code in [test['code'],comparison['code']+'\\nassert observation["different"] is False']:
            result=json.loads(fc_run_one(item['reference'],code)); assert result['pass'],result
    for label in ['starter','partial']:
        results=[json.loads(fc_run_one(item[label],t['code'])) for t in item['tests']]
        assert all(r['pass'] or r.get('error_type') in ['AssertionError','FCAssertionError'] for r in results),(item['id'],label,'candidate must run, failing only contract assertions',results)
        outcomes=[r['pass'] for r in results]
        assert not all(outcomes),(item['id'],label,'no failing regression')
        print(item['id']+' '+label+': '+str(sum(outcomes))+'/'+str(len(outcomes)))
    for _ in range(200):
        c=generate(); assert invoke(c)==oracle(c),(item['id'],c,invoke(c),oracle(c))
    print('PASS '+item['id']+': fixtures, comparison, 200 independent-oracle cases, immutability')
mutations=[
    (0,data[0]['reference'].replace('if key not in context:','if not context.get(key):')),
    (0,data[0]['partial']),
    (0,data[0]['reference'].replace('return match.group(0)','return ""')),
    (0,data[0]['reference'].replace('return "true" if value else "false"','return str(value)')),
    (1,data[1]['reference'].replace('return any(all(', 'return all(all(')),
    (1,data[1]['partial']),
    (1,data[1]['reference'].replace('>= int','> int')),
    (2,data[2]['starter']),
    (2,data[2]['partial']),
    (2,data[2]['reference'].replace('            seen[customer].add(ident)\\n','').replace('            totals[customer] +=', '            seen[customer].add(ident)\\n            totals[customer] +=')),
    (2,data[2]['reference'].replace('>= config["min_total"]','> config["min_total"]')),
    (2,data[2]['reference'].replace('if invoice["paid"] or','if not invoice["paid"] or')),
]
for i,code in mutations:
    assert code!=data[i]['reference'],'mutation did not modify code'
    assert not all(json.loads(fc_run_one(code,t['code']))['pass'] for t in data[i]['tests']),(i,'undetected mutation')
print('PASS 12 targeted round-2 mutations')
`;
const result=spawnSync(process.env.PYTHON||'python',['-c',python],{input:JSON.stringify(payload),encoding:'utf8',env:{...process.env,PYTHONIOENCODING:'utf-8',PYTHONUTF8:'1'},maxBuffer:3*1024*1024});
process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');assert.equal(result.status,0,'Round-2 independent checks failed');
console.log('PASS round-2 strict input validation');
