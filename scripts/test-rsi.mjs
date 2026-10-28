import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {pythonCommand,siteRoot} from './config.mjs';
import {rsiProblems} from '../src/rsi-problems.mjs';
import {rsiChapters,rsiConcept,rsiSets,rsiTranslations} from '../src/rsi-curriculum.mjs';
import {examples,trace,softmax} from '../src/rsi-math.mjs';
import {routerTrace} from '../src/rsi-router.mjs';
import {renderTrace,formatReturn} from '../src/rsi-view.mjs';
import {loadChinese,decodeHtml} from './localize.mjs';
import {join} from 'node:path';
assert.equal(rsiProblems.length,10);assert.deepEqual(rsiChapters.map(c=>c.keys.length),[2,3,4,1,0]);
assert.equal(rsiSets.length,4);assert.equal(new Set(rsiConcept.ids).size,rsiConcept.ids.length);
assert.equal(formatReturn('filter',[[0,'r','4']]),'[(0, "r", "4")]');
assert.throws(()=>trace('select',{scores:[1],verified:[true],costs:[1000000001],budget:1}));
assert.throws(()=>trace('stop',{costs:[],passed:[],budget:1000000001,next_cost:0}));
const cases=[];
for(const p of rsiProblems){
 assert.ok(p.references.length>=2&&p.tests.length>=6);
 const k=p.id.slice(4);
 for(const [preset,input] of Object.entries(examples[k])){
  if(preset==='invalid'){assert.throws(()=>trace(k,input),`${k} invalid preset`);continue;}
  cases.push({key:k,input});
  const v=trace(k,input),before=JSON.stringify(input);assert.doesNotMatch(renderTrace(v),/undefined|NaN|Infinity/);assert.doesNotMatch(renderTrace(v,true),/undefined|NaN|Infinity/);assert.equal(JSON.stringify(input),before,'No input mutation');
 }
}
let state=1223;const random=()=>{state=(1664525*state+1013904223)>>>0;return state/2**32;};
for(let run=0;run<100;run++){
 const n=1+Math.floor(random()*7),values=Array.from({length:n},()=>Math.floor(random()*17)/8-1),costs=values.map(()=>Math.floor(random()*6)),verified=values.map(()=>random()>.4),budget=Math.floor(random()*6);
 const eligible=values.flatMap((x,i)=>verified[i]&&costs[i]<=budget?[i]:[]),ranked=eligible.sort((a,b)=>values[b]-values[a]||a-b);
 assert.equal(trace('select',{scores:values,verified,costs,budget}).output,ranked[0]??null);
 const front=trace('pareto',{quality:values,costs}).output;
 for(const i of front)assert.ok(!values.some((q,j)=>q>=values[i]&&costs[j]<=costs[i]&&(q>values[i]||costs[j]<costs[i])));
 for(const i of values.keys())if(!front.includes(i))assert.ok(front.some(j=>values[j]>=values[i]&&costs[j]<=costs[i]));
 cases.push({key:'select',input:{scores:values,verified,costs,budget}},{key:'pareto',input:{quality:values,costs}});
 const bias=values,target=Math.floor(random()*n),lr=.25,step=trace('update',{bias,target,lr}),h=1e-5;
 const loss=a=>{const m=Math.max(...a);return Math.log(a.reduce((s,x)=>s+Math.exp(x-m),0))+(m-a[target]);};
 for(let j=0;j<n;j++){const plus=[...bias],minus=[...bias];plus[j]+=h;minus[j]-=h;const numerical=(loss(plus)-loss(minus))/(2*h);assert.ok(Math.abs(numerical-step.rows[j][4])<1e-8,'Independent finite-difference gradient');}
 assert.ok(loss(step.output)<=loss(bias)+1e-12);assert.ok(Math.abs(softmax(bias).reduce((s,x)=>s+x,0)-1)<1e-12);
 cases.push({key:'update',input:{bias,target,lr}});
}
// Independent high-precision oracle: Decimal.exp/ln does not reuse the stable-logsumexp implementation.
const python=String.raw`import json,sys,math,decimal
decimal.getcontext().prec=60
data=json.load(sys.stdin)
by={p['id'][4:]:p for p in data['problems']}
answers=[]
for case in data['cases']:
 p=by[case['key']]; ns={}; exec(p['solution'],ns)
 f=ns[p['signature'].split('(')[0]]
 value=f(**case['input'])
 if case['key']=='loss':
  terms=[]
  for row,target,keep in zip(case['input']['logits'],case['input']['targets'],case['input']['mask']):
   if keep:
    a=[decimal.Decimal(str(x)) for x in row]
    terms.append(sum(x.exp() for x in a).ln()-a[target])
  expected=float(sum(terms)/len(terms)) if terms else 0.0
  assert abs(value-expected)<1e-12
 answers.append(value)
for p in data['problems']:
 for t in p['tests']:
  ns={}; exec(p['solution'],ns); exec(t['code'],ns)
print(json.dumps(answers))`;
const run=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({problems:rsiProblems,cases}),encoding:'utf8',maxBuffer:5_000_000});
assert.equal(run.status,0,run.stderr);
const near=(a,b)=>{if(typeof a==='number'&&typeof b==='number')assert.ok(Math.abs(a-b)<=1e-11*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);else if(Array.isArray(a)&&Array.isArray(b)){assert.equal(a.length,b.length);a.forEach((x,i)=>near(x,b[i]));}else assert.deepEqual(a,b);};
JSON.parse(run.stdout).forEach((expected,i)=>near(trace(cases[i].key,cases[i].input).output,expected));
assert.equal(routerTrace('aggressive').gate.output,false);assert.equal(routerTrace('balanced').gate.output,true);assert.equal(routerTrace('overfit').gate.output,true);assert.deepEqual(routerTrace('aggressive').retainedAudit,[.5,.75]);assert.deepEqual(routerTrace('overfit').retainedAudit,[.25,.5]);
const zh=await loadChinese();
// Unambiguous keys across new curricula and per-problem translations, including identical words such as Quality.
for(const [en,cn] of Object.entries(rsiTranslations))assert.equal(zh.translate(en),cn,`RSI translation collision: ${en}`);
for(const locale of ['', 'zh/']){
 const hub=decodeHtml(await readFile(join(siteRoot,locale,'concepts',rsiConcept.slug,'index.html'),'utf8'));
 for(let level=0;level<5;level++)assert.ok(hub.includes(`id="rsi-l${level}"`));
 assert.ok(hub.includes('data-rsi-source')&&hub.includes('Diving into Reliable Self-Evolving Agents: A Survey'));
 assert.ok(hub.indexOf('data-rsi-source')<hub.indexOf('data-rsi-router'),'Survey attribution is visible before the running example');
 assert.ok(hub.includes(locale?'本专题的分级依据':'The survey behind this learning path'));
 for(const p of rsiProblems){const html=decodeHtml(await readFile(join(siteRoot,locale,'editorials',p.id,'index.html'),'utf8'));
  assert.ok(html.includes(locale?zh.translate(p.title):p.title));assert.ok(html.includes('<noscript>'));assert.ok(html.indexOf('class="lesson-resources"')>html.indexOf('class="code-pre"'));
  assert.ok(html.includes('data-rsi-output'));assert.ok(html.includes(locale?'完整中间计算':'Every intermediate value'));
  for(const explanation of p.explanation)assert.ok(html.includes(locale?zh.translate(explanation):explanation));
 }
}
console.log(`PASS RSI: ${cases.length} Python/browser comparisons, 100 finite-difference oracles, bilingual static diagrams, boundaries and matched-router audit`);
