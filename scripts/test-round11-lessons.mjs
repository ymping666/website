import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import {layoutPresets,headChoices,splitTrace,mergeTrace,crossPresets,crossTrace} from '../src/lesson-round11-math.mjs';
import {renderLayout,renderCross,round11Translations} from '../src/lesson-round11-view.mjs';
import '../src/visual-lessons-round11.mjs';
import {originalMathText} from '../src/lesson-notation.mjs';
import {decodeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
const cases=[];
function layout(tokens,h){
 const before=JSON.stringify(tokens),split=splitTrace(tokens,h),merge=mergeTrace(split.output);assert.equal(JSON.stringify(tokens),before);assert.deepEqual(merge.output,tokens);
 assert.notEqual(merge.output,tokens);assert.notEqual(split.output[0],tokens);assert.equal(new Set(split.output).size,h);
 split.output.forEach(head=>head.forEach((row,t)=>assert.notEqual(row,tokens[t])));
 cases.push({kind:'split',args:[tokens,h],trace:split},{kind:'merge',args:[split.output],trace:merge});
}
function cross(args){const before=JSON.stringify(args),trace=crossTrace(...args);assert.equal(JSON.stringify(args),before);cases.push({kind:'cross',args,trace});}
for(const tokens of Object.values(layoutPresets))for(const h of headChoices(tokens))layout(tokens,h);
for(const p of Object.values(crossPresets))for(let s=-4;s<=4;s++)cross([p.queries.map(q=>q.map(v=>v*s/2)),p.keys,p.values]);
const controls=cases.length;
let seed=111015;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),int=n=>Math.floor(rand()*n),value=()=>Math.round((rand()*20-10)*100)/100;
for(let i=0;i<200;i++){
 const h=1+int(5),d=int(5),length=int(5);layout(Array.from({length},()=>Array.from({length:h*d},value)),h);
 const nq=1+int(4),nk=1+int(5),dk=1+int(4),dv=1+int(4);
 cross([Array.from({length:nq},()=>Array.from({length:dk},value)),Array.from({length:nk},()=>Array.from({length:dk},value)),Array.from({length:nk},()=>Array.from({length:dv},value))]);
}
const ids={split:'attention-split-heads',merge:'attention-merge-heads',cross:'transformer-cross-attention'};
const refs=Object.fromEntries(Object.entries(ids).map(([kind,id])=>[kind,problems.find(p=>p.id===id).solution]));
const python=String.raw`
import sys,json,math,copy,decimal
data=json.load(sys.stdin);funcs={};decimal.getcontext().prec=60
for kind,code in data['refs'].items():
 ns={};exec(code,ns);funcs[kind]=ns[{'split':'split_heads','merge':'merge_heads','cross':'cross_attention'}[kind]]
def close(a,b):
 if isinstance(a,list):
  assert len(a)==len(b),(len(a),len(b))
  for x,y in zip(a,b):close(x,y)
 else:assert math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-10),(a,b)
D=lambda x:decimal.Decimal(str(x))
for case in data['cases']:
 k,args,tr=case['kind'],case['args'],case['trace'];before=copy.deepcopy(args);actual=funcs[k](*args);close(tr['output'],actual)
 if k=='split':
  tokens,h=args;n=len(tokens);width=len(tokens[0]) if n else 0;d=width//h
  assert len(actual)==h
  for head in range(h):
   assert len(actual[head])==n
   for t in range(n):
    for j in range(d):assert actual[head][t][j]==tokens[t][head*d+j]
  close(funcs['merge'](actual),tokens)
 elif k=='merge':
  heads=args[0];n=len(heads[0]);h=len(heads);d=len(heads[0][0]) if n else 0
  for t in range(n):
   for c in range(h*d):assert actual[t][c]==heads[c//d][t][c%d]
  close(funcs['split'](actual,h),heads)
 else:
  q,keys,values=args;root=D(len(keys[0])).sqrt()
  for qi,row in enumerate(q):
   scores=[sum(D(x)*D(y) for x,y in zip(row,key))/root for key in keys];mx=max(scores)
   exps=[(s-mx).exp() for s in scores];z=sum(exps);weights=[e/z for e in exps]
   independent=[float(sum(weights[j]*D(values[j][c]) for j in range(len(keys)))) for c in range(len(values[0]))]
   r=tr['rows'][qi];close(r['scores'],[float(s) for s in scores]);close(r['maximum'],float(mx));close(r['weights'],[float(w) for w in weights]);close(r['output'],independent)
   close(sum(r['weights']),1);assert all(0<=w<=1 for w in r['weights'])
   for j,v in enumerate(values):close(r['contributions'][j],[x*r['weights'][j] for x in v])
   for c,out in enumerate(r['output']):assert min(v[c] for v in values)-1e-10<=out<=max(v[c] for v in values)+1e-10
  reverse=funcs[k](q,keys[::-1],values[::-1]);close(actual,reverse)
  assert len(actual)==len(q) and all(len(row)==len(values[0]) for row in actual)
 assert args==before
 assert actual is not args[0]
print('PASS',len(data['cases']),'head-layout and cross-attention traces: Python references, independent index equations and 60-digit Decimal attention')
`;
const result=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs}),encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);console.log(result.stdout.trim());
let rendered=0;
for(const c of cases.slice(0,controls))for(const zh of [false,true]){
 const count=c.kind==='cross'?c.trace.nq:Math.max(1,c.trace.mapping.length);
 for(let selected=0;selected<count;selected++){
  const html=c.kind==='cross'?renderCross(c.trace,selected,zh):renderLayout(c.trace,c.kind,selected,zh);assert.doesNotMatch(html,/NaN|Infinity|undefined/);
  if(c.kind==='cross'){assert.match(html,/id="cross-weight-sum">1</);assert.match(html,/id="cross-output"/);}
  else {assert.equal((html.match(/aria-pressed="true"/g)||[]).length,c.trace.mapping.length?2:0);assert.equal((html.match(/data-layout-cell=/g)||[]).length,c.trace.mapping.length*2);}
  if(zh)assert.doesNotMatch(html,/Function output|Trace the selected|Queries: the requesting|Normalize across source/);
  rendered++;
 }
}
assert.deepEqual(headChoices(layoutPresets.basic),[1,2,4]);assert.deepEqual(headChoices(layoutPresets.six),[1,2,3,6]);
for(const locale of ['','zh/'])for(const [kind,id]of Object.entries(ids)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),decoded=decodeHtml(originalMathText(html));
 const visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests'),sources=html.indexOf('<section class="lesson-resources">');
 assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/data-reset-lesson[^>]*disabled/);assert.match(html,/<math /);
 assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[kind]);assert.ok(html.includes(`src="${siteBase()}assets/lesson-ui.js"`));
 if(locale){
  const en=decodeHtml(originalMathText(await readFile(join(siteRoot,'editorials',id,'index.html'),'utf8')));
  for(const [original,translated]of Object.entries(round11Translations))if(en.includes('>'+original+'<'))assert.ok(decoded.includes(translated),original);
  assert.doesNotMatch(decoded.slice(visual,code),/Move an element|Input layout|Output layout|Inspect one query|Function output|Scale every query/);
 }
}
for(const name of ['lesson-ui-round11.js','lesson-round11-math.mjs','lesson-round11-view.mjs'])await readFile(join(siteRoot,'assets',name));
console.log(`PASS ${rendered} bilingual selection states, 6 built editorials, unchanged Python and bottom references`);
