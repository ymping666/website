import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {problems} from '../src/problems.mjs';
import {layerPresets,layerTrace,gradientPresets,momentumTrace,adamTrace} from '../src/lesson-round6-math.mjs';
import {renderLayer,renderMomentum,renderAdam} from '../src/lesson-round6-view.mjs';
import {round6Translations} from '../src/visual-lessons-round6.mjs';
import {pythonCommand,siteRoot,siteBase} from './config.mjs';
import {decodeHtml} from './localize.mjs';
const cases=[],functions={layer:layerTrace,momentum:momentumTrace,adam:adamTrace};
function add(kind,args){const before=JSON.stringify(args),trace=functions[kind](...args);assert.equal(JSON.stringify(args),before);cases.push({kind,args,trace});return trace;}
for(const x of Object.values(layerPresets))for(let s=-6;s<=6;s++)for(const eps of [.01,.000001,1])add('layer',[x.map(v=>v+s/2),eps]);
for(const g of Object.values(gradientPresets))for(let l=0;l<=10;l++)for(const mu of [.9,.5,0])for(let n=1;n<=8;n++)for(const v of [0,2,-2])add('momentum',[g,l/20,mu,n,v]);
for(const g of Object.values(gradientPresets))for(const b1 of [.9,.5])for(const b2 of [.999,.99,.9])for(let n=1;n<=8;n++)add('adam',[g,b1,b2,n]);
let seed=914;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
for(let i=0;i<100;i++){
 const x=Array.from({length:1+Math.floor(rand()*7)},()=>rand()*20-10);add('layer',[x,.000001+rand()]);
 const g=Array.from({length:8},()=>rand()*10-5);add('momentum',[g,rand()/2,rand()*.99,1+Math.floor(rand()*8),rand()*6-3]);add('adam',[g,.1+rand()*.89,.1+rand()*.89,1+Math.floor(rand()*8)]);
}
const ids={layer:'foundation-layer-normalization',momentum:'optimizer-sgd-momentum',adam:'optimizer-adam-bias-correction'};
const refs=Object.fromEntries(Object.entries(ids).map(([k,id])=>[k,problems.find(p=>p.id===id).solution]));
const python=String.raw`
import sys,json,math,copy
data=json.load(sys.stdin);funcs={}
for kind,code in data['refs'].items():
 scope={};exec(code,scope);funcs[kind]=scope[{'layer':'layer_norm','momentum':'sgd_momentum','adam':'adam_bias_correction'}[kind]]
def close(a,b):
 if isinstance(a,(list,tuple)):
  assert len(a)==len(b),(a,b)
  for x,y in zip(a,b):close(x,y)
 else:assert math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-10),(a,b)
for case in data['cases']:
 kind,args,tr=case['kind'],case['args'],case['trace'];before=copy.deepcopy(args)
 if kind=='layer':
  x,eps=args;n=len(x);mean=math.fsum(x)/n;var=math.fsum((v-mean)**2 for v in x)/n
  close(tr['output'],funcs[kind](*args));close(tr['mean'],mean);close(tr['variance'],var)
  close(tr['centered'],[v-mean for v in x]);close(tr['squares'],[(v-mean)**2 for v in x]);close(tr['denominator'],math.sqrt(var+eps))
  close(math.fsum(tr['output'])/n,0);close(tr['outputMean'],0);close(tr['outputVariance'],var/(var+eps))
  close(math.fsum(v*v for v in tr['output'])/n,tr['outputVariance'])
  close(tr['output'],funcs[kind]([v+10 for v in x],eps))
 else:
  if kind=='momentum':
   g,lr,mu,n,initial=args;p=3;v=initial;plain=3
   for i,r in enumerate(tr['rows']):
    close(r['previousParam'],p);close(r['previousVelocity'],v);close(r['retained'],mu*v)
    p,v=funcs[kind](p,g[i],v,lr,mu);plain-=lr*g[i]
    closed=mu**(i+1)*initial+math.fsum(mu**(i-j)*g[j] for j in range(i+1))
    close(v,closed);close(r['velocity'],v);close(r['param'],p);close(r['plain'],plain);close(r['change'],-lr*v)
    if lr==0:close(p,3)
   close(tr['output'],[p,v])
  else:
   g,b1,b2,n=args
   for i,r in enumerate(tr['rows']):
    step=i+1;m=(1-b1)*math.fsum(b1**(i-j)*g[j] for j in range(step));v=(1-b2)*math.fsum(b2**(i-j)*g[j]**2 for j in range(step))
    close(r['m'],m);close(r['v'],v);close(r['d1'],1-b1**step);close(r['d2'],1-b2**step)
    hats=funcs[kind](m,v,b1,b2,step);close([r['mHat'],r['vHat']],hats)
    if len(set(g[:step]))==1:close(hats,[g[0],g[0]**2])
   close(tr['output'],hats)
 assert args==before
print('PASS',len(data['cases']),'round-6 traces: all control states, seeded examples, independent closed forms and existing Python solutions')
`;
const result=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs}),encoding:'utf8',maxBuffer:16*1024*1024});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);console.log(result.stdout.trim());
const renderers={layer:renderLayer,momentum:renderMomentum,adam:renderAdam};
for(const {kind,trace} of cases){const html=renderers[kind](trace);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/<svg/);}
for(const locale of ['','zh/'])for(const [kind,id] of Object.entries(ids)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8');
 const visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests'),sources=html.indexOf('<section class="lesson-resources">');
 assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/data-reset-lesson disabled/);
 assert.ok(html.includes(`src="${siteBase()}assets/lesson-ui.js"`));
 const lesson=decodeHtml(html.slice(visual,code));assert.doesNotMatch(lesson,/<iframe|href="https?:|NaN/);
 if(locale)assert.doesNotMatch(lesson,/Input features|Population variance|Previous velocity|Function output|Supplied gradient sequence/);
 const en=decodeHtml(await readFile(join(siteRoot,'editorials',id,'index.html'),'utf8'));
 if(locale)for(const [original,translated] of Object.entries(round6Translations))if(en.includes('>'+original+'<'))assert.ok(decodeHtml(html).includes(translated),original);
 assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[kind]);
 if(kind==='layer')assert.match(html,/<msqrt><mrow><mi mathvariant="normal">variance<\/mi><mo>\+<\/mo><mi>ε<\/mi><\/mrow><\/msqrt>/);
}
for(const file of ['lesson-ui-round6.js','lesson-round6-math.mjs','lesson-round6-view.mjs'])await readFile(join(siteRoot,'assets',file));
console.log('PASS six bilingual pages, static fallback, code before references, translation and unchanged reference code');
