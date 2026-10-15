import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {problems} from '../src/problems.mjs';
import {topkPresets,topkTrace,cfgPresets,cfgTrace,clipPresets,clipTrace} from '../src/lesson-round5-math.mjs';
import {renderCfg,renderClip} from '../src/lesson-round5-view.mjs';
import {round5Translations} from '../src/visual-lessons-round5.mjs';
import {pythonCommand,siteRoot,siteBase} from './config.mjs';
import {decodeHtml} from './localize.mjs';
const cases=[];
function add(kind,args,fn){
 const before=JSON.stringify(args),trace=fn(...args);assert.equal(JSON.stringify(args),before);
 assert.notEqual(trace.output,args[0]);cases.push({kind,args,trace});return trace;
}
// Every reachable numeric control state, including slider endpoints.
for(const x of Object.values(topkPresets))for(let k=1;k<=x.length;k++)add('topk',[x,k],topkTrace);
for(const p of Object.values(cfgPresets))for(let step=0;step<=16;step++){
 const trace=add('cfg',[p.u,p.c,-1+step/4],cfgTrace),html=renderCfg(trace);
 assert.equal(html.includes('<svg'),p.u.length>0);assert.doesNotMatch(html,/NaN|Infinity/);
}
for(const grad of Object.values(clipPresets))for(let step=1;step<=20;step++){
 const trace=add('clip',[grad,step/2],clipTrace),html=renderClip(trace);
 assert.equal(html.includes('<svg'),grad.length>0);assert.doesNotMatch(html,/NaN|Infinity/);
 if(grad.length){
  const radius=Number(/<circle cx="260" cy="240" r="([^"]+)"/.exec(html)[1]);
  const bound=Number(/data-axis-bound="([^"]+)"/.exec(html)[1]);
  assert.ok(Math.abs(radius/200-trace.maxNorm/bound)<1e-12,'Threshold radius uses equal x/y units');
  assert.ok(trace.maxNorm<bound&&trace.grad.every(v=>Math.abs(v)<bound),'Circle and gradient fit inside both axes');
 }
}
let seed=82013;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
for(let i=0;i<300;i++){
 const n=1+Math.floor(rand()*8),x=Array.from({length:n},()=>Math.floor(rand()*11)-5);
 const k=1+Math.floor(rand()*n),a=add('topk',[x,k],topkTrace),b=topkTrace(x.map(v=>v+1000),k);assert.deepEqual(a.output,b.output);
 const u=Array.from({length:Math.floor(rand()*8)},()=>rand()*20-10),c=u.map(()=>rand()*20-10);
 add('cfg',[u,c,rand()*8-3],cfgTrace);
 const g=Array.from({length:Math.floor(rand()*8)},()=>rand()*20-10);add('clip',[g,0.1+rand()*12],clipTrace);
}
const ids={topk:'llm-topk-softmax',cfg:'diffusion-cfg-epsilon',clip:'optimizer-global-norm-clipping'};
const refs=Object.fromEntries(Object.entries(ids).map(([kind,id])=>[kind,problems.find(p=>p.id===id).solution]));
const python=String.raw`
import sys,json,math,copy
data=json.load(sys.stdin);functions={}
for kind,code in data['refs'].items():
 scope={};exec(code,scope);functions[kind]=scope[{'topk':'top_k_probabilities','cfg':'cfg_epsilon','clip':'clip_global_norm'}[kind]]
def close(a,b):
 if isinstance(a,list):
  assert len(a)==len(b),(a,b)
  for x,y in zip(a,b):close(x,y)
 else:assert math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-10),(a,b)
for case in data['cases']:
 kind,args,tr=case['kind'],case['args'],case['trace'];before=copy.deepcopy(args)
 result=functions[kind](*args);assert args==before;assert result is not args[0];close(tr['output'],result)
 if kind=='topk':
  x,k=args;chosen=sorted(range(len(x)),key=lambda i:(-x[i],i))[:k];assert tr['selected']==chosen
  peak=max(x);z=math.fsum(math.exp(v-peak) for v in x);full=[math.exp(v-peak)/z for v in x]
  mass=math.fsum(full[i] for i in chosen);expected=[v/mass if i in chosen else 0 for i,v in enumerate(full)]
  close(tr['output'],expected);close(tr['full'],full);close(tr['retainedMass'],mass)
  close(tr['unrenormalized'],[v if i in chosen else 0 for i,v in enumerate(full)])
  m=max(x[i] for i in chosen);close(tr['peak'],m);close(tr['weights'],[math.exp(v-m) if i in chosen else 0 for i,v in enumerate(x)])
  close(tr['total'],math.fsum(tr['weights']));close(math.fsum(result),1)
  assert all(result[i]==0 for i in range(len(x)) if i not in chosen)
  if k==len(x):close(result,full)
 elif kind=='cfg':
  u,c,s=args;close(tr['output'],[(1-s)*a+s*b for a,b in zip(u,c)])
  close(tr['delta'],[b-a for a,b in zip(u,c)]);close(tr['scaled'],[s*(b-a) for a,b in zip(u,c)])
  if s==0:close(result,u)
  if s==1:close(result,c)
  if u==c:close(result,u)
 else:
  g,m=args;n=math.hypot(*g);a=1 if n<=m else m/n
  close(tr['norm'],n);close(tr['scale'],a);close(result,[v*a for v in g]);close(tr['squares'],[v*v for v in g])
  close(tr['outputNorm'],math.hypot(*result));assert tr['outputNorm']<=m+1e-10
  clamp=[min(m,max(-m,v)) for v in g];close(tr['clamped'],clamp);close(tr['clampedNorm'],math.hypot(*clamp))
  if n<=m:close(result,g)
  if n>m:close(math.hypot(*result),m)
  for i in range(len(g)):
   for j in range(len(g)):close(result[i]*g[j],result[j]*g[i])
print('PASS',len(data['cases']),'round-5 numerical traces: independent formulas, reference solutions, all controls, invariants and input immutability')
`;
const result=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs}),encoding:'utf8',maxBuffer:12*1024*1024});
assert.equal(result.status,0,result.stdout+'\n'+result.stderr);console.log(result.stdout.trim());
assert.deepEqual(topkTrace([0,2,2,2],2).output,[0,.5,.5,0]);assert.deepEqual(cfgTrace([-1,0],[1,1],1.5).output,[2,1.5]);
assert.deepEqual(clipTrace([3,4],2.5).output,[1.5,2]);assert.ok(clipTrace([3,4],2.5).clampedNorm>2.5);
for(const locale of ['','zh/'])for(const id of Object.values(ids)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8');
 const visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests'),sources=html.indexOf('<section class="lesson-resources">');
 assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/data-reset-lesson disabled/);
 const lesson=decodeHtml(html.slice(visual,code));assert.doesNotMatch(lesson,/<iframe|href="https?:|NaN/);
 assert.ok(html.includes(`src="${siteBase()}assets/lesson-ui.js"`));
 if(locale)assert.doesNotMatch(lesson,/Retained token indices|Output probability|Guided prediction|Shared scaling factor|Input L2 norm/);
 if(id==='optimizer-global-norm-clipping')assert.match(html,/<msqrt><mrow><munder><mo>∑<\/mo><mi>i<\/mi><\/munder><msup><msub><mi>g<\/mi><mi>i<\/mi><\/msub><mn>2<\/mn>/);
 const en=decodeHtml(await readFile(join(siteRoot,'editorials',id,'index.html'),'utf8'));
 if(locale)for(const [original,translated] of Object.entries(round5Translations))if(en.includes('>'+original+'<'))assert.ok(decodeHtml(html).includes(translated),original);
}
for(const file of ['lesson-ui-round5.js','lesson-round5-math.mjs','lesson-round5-view.mjs'])await readFile(join(siteRoot,'assets',file));
console.log('PASS six bilingual round-5 editorials, static worked examples, native radical, bottom source links and portable runtime assets');
