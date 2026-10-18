import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import * as M from '../src/lesson-round17-math.mjs';
import * as V from '../src/lesson-round17-view.mjs';
import '../src/visual-lessons-round17.mjs';
import {decodeHtml,loadChinese,localizeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
import {calcNumber} from '../src/lesson-calculation-view.mjs';
const previous={};
for(const name of ['extra','frontier',...Array.from({length:13},(_,i)=>'round'+(i+4))]){
 const module=await import('../src/visual-lessons-'+name+'.mjs');for(const[k,v]of Object.entries(module))if(k.endsWith('Translations'))Object.assign(previous,v);
}
for(const[k,v]of Object.entries(V.round17Translations))if(k in previous)assert.equal(v,previous[k],'Translation collision: '+k);
const ids={beta:'diffusion-linear-beta',alpha:'diffusion-alpha-bar',noise:'diffusion-noise-mse',swiglu:'transformer-swiglu',mask:'attention-key-padding-mask'};
const names={beta:'linear_beta_schedule',alpha:'cumulative_alphas',noise:'epsilon_prediction_mse',swiglu:'swiglu_gate',mask:'mask_key_padding'};
const cases=[];
function add(kind,args){const before=JSON.stringify(args),trace=M[kind+'Trace'](...args);assert.equal(JSON.stringify(args),before);cases.push({kind,args,trace});return trace;}
for(const p of Object.values(M.betaPresets))for(let steps=1;steps<=8;steps++)add('beta',[steps,...p]);
for(const p of Object.values(M.alphaPresets))add('alpha',[p]);
for(const kind of ['noise','swiglu'])for(const p of Object.values(M[kind+'Presets'])){
 const x=kind==='noise'?p.predicted:p.x,g=kind==='noise'?p.target:p.gate;
 for(let i=0;i<Math.max(1,x.length);i++)for(let delta=-2;delta<=2;delta+=.5)add(kind,kind==='noise'?[x.map((v,j)=>v+(i===j?delta:0)),g]:[x,g.map((v,j)=>v+(i===j?delta:0))]);
}
for(const p of Object.values(M.maskPresets))for(let delta=-4;delta<=8;delta++)add('mask',[p.scores.map((v,i)=>v+(!p.valid[i]?delta:0)),p.valid]);
const controlCount=cases.length;
let seed=171018;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),int=n=>Math.floor(rand()*n),vec=n=>Array.from({length:n},()=>(int(41)-20)/4);
for(let k=0;k<120;k++){
 const size=1+int(7),x=vec(size),a=(1+int(10))/1000,b=a+int(80)/100;
 add('beta',[1+int(30),a,b]);add('alpha',[Array.from({length:int(8)},()=>.001+int(998)/1000)]);add('noise',[x,vec(size)]);add('swiglu',[x,vec(size)]);
 const valid=Array.from({length:size},()=>rand()>.5);valid[int(size)]=true;add('mask',[x,valid]);
}
const refs=Object.fromEntries(Object.entries(ids).map(([kind,id])=>[kind,problems.find(p=>p.id===id).solution]));
const python=String.raw`
import sys,json,math,copy,decimal
data=json.load(sys.stdin);decimal.getcontext().prec=65;D=lambda v:decimal.Decimal(str(v));functions={}
for kind,code in data['refs'].items():
 ns={};exec(code,ns);functions[kind]=ns[data['names'][kind]]
def close(a,b):
 if isinstance(a,list):
  assert len(a)==len(b),(a,b)
  for x,y in zip(a,b):close(x,y)
 elif isinstance(a,str):assert a=='-inf' and b==float('-inf'),(a,b)
 else:assert math.isclose(float(a),float(b),rel_tol=3e-12,abs_tol=3e-12),(a,b)
def softmax(xs):
 m=max(xs);e=[D(0) if x==float('-inf') else (D(x)-D(m)).exp() for x in xs];z=sum(e);return [v/z for v in e]
for c in data['cases']:
 k,args,tr=c['kind'],c['args'],c['trace'];before=copy.deepcopy(args);actual=functions[k](*args);close(tr['output'],actual)
 if k=='beta':
  steps,a,b=args;expected=[D(a)] if steps==1 else [(D(a)*D(steps-1-i)+D(b)*D(i))/D(steps-1) for i in range(steps)]
  close(tr['output'],expected);assert len(actual)==steps and actual[0]==a
  if steps>1:close(actual[-1],b)
 elif k=='alpha':
  p=D(1);expected=[];prev=[]
  for b in args[0]:prev.append(p);p*=1-D(b);expected.append(p)
  close(tr['previous'],prev);close(tr['output'],expected)
  assert all(0<v<1 for v in actual) and all(a>b for a,b in zip(actual,actual[1:]))
 elif k=='noise':
  x,y=args;errors=[D(a)-D(b) for a,b in zip(x,y)];squares=[v*v for v in errors];expected=sum(squares)/D(len(x)) if x else D(0)
  close(tr['errors'],errors);close(tr['squares'],squares);close(tr['output'],expected);assert actual>=0
 elif k=='swiglu':
  x,g=args;sig=[1/(1+(-D(v)).exp()) for v in g];silu=[D(v)*s for v,s in zip(g,sig)];expected=[D(a)*b for a,b in zip(x,silu)]
  close(tr['sig'],sig);close(tr['silu'],silu);close(tr['output'],expected)
 else:
  x,valid=args;assert any(valid);masked=[v if ok else float('-inf') for v,ok in zip(x,valid)];wrong=[v if ok else 0 for v,ok in zip(x,valid)]
  close(tr['probabilities'],softmax(masked));close(tr['zeroProbabilities'],softmax(wrong));assert all(p==0 for p,ok in zip(tr['probabilities'],valid) if not ok)
  assert math.isclose(sum(tr['probabilities']),1)
 assert args==before
print('PASS',len(data['cases']),'traces: unchanged original Python references plus independent 65-digit oracles, intermediate values, probabilities and immutability')
`;
const result=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs,names},(_,v)=>v===-Infinity?'-inf':v),encoding:'utf8',maxBuffer:12*1024*1024});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);console.log(result.stdout.trim());
const chinese=await loadChinese();let states=0;
for(const c of cases.slice(0,controlCount)){
 const length=c.kind==='beta'?c.trace.steps:c.kind==='alpha'?c.trace.betas.length:c.kind==='noise'?c.trace.predicted.length:c.kind==='swiglu'?c.trace.x.length:c.trace.scores.length;
 for(let i=0;i<Math.max(1,length);i++){
  const en=V['render'+c.kind[0].toUpperCase()+c.kind.slice(1)](c.trace,i,false),zh=V['render'+c.kind[0].toUpperCase()+c.kind.slice(1)](c.trace,i,true);
  for(const html of [en,zh]){
   assert.doesNotMatch(html,/NaN|undefined|Infinity/);assert.ok(html.includes('id="r17-'+c.kind+'-output"'));
   assert.deepEqual(JSON.parse(decodeHtml(html.match(/data-trace-output="([^"]*)"/)[1])),JSON.parse(M.serial(c.trace.output)),'Output retains the full computed trace');
   if(length&&c.kind!=='mask'&&!(c.kind==='beta'&&c.trace.steps===1)){
    const expected=c.kind==='noise'?c.trace.output:c.trace.output[i];assert.ok(html.includes('id="r17-'+c.kind+'-number">'+calcNumber(expected)),'Expanded arithmetic ends at the computed result');
   }
  }
  assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary:chinese.dictionary}),zh,'Static/client localization parity '+c.kind);
  // Numeric operands in shared diagrams must encode actual values; rounding is display-only.
  for(const match of en.matchAll(/data-calc-value="([^"]+)"/g)){const v=JSON.parse(decodeHtml(match[1]));assert.ok((Array.isArray(v)?v:[v]).every(Number.isFinite));}
  states+=2;
 }
}
for(const locale of ['','zh/'])for(const[kind,id]of Object.entries(ids)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests'),sources=html.indexOf('<section class="lesson-resources">');
 assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/<math /);assert.match(html,/data-reset-lesson[^>]*disabled/);
 assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[kind]);assert.ok(html.includes(`src="${siteBase()}assets/lesson-ui.js"`));
 if(locale)for(const key of Object.keys(V.round17Translations).filter(k=>k.length>25))assert.ok(!decodeHtml(html.slice(visual,code)).includes(key),'Untranslated: '+key);
}
assert.deepEqual(M.betaTrace(1,.1,.5).output,[.1]);assert.deepEqual(M.alphaTrace([]).output,[]);assert.equal(M.noiseTrace([],[]).output,0);assert.deepEqual(M.swigluTrace([],[]).output,[]);
const mask=M.maskTrace([-2,4,-1],[true,false,true]);assert.equal(mask.probabilities[1],0);assert.ok(mask.zeroProbabilities[1]>.66);assert.deepEqual(M.maskTrace([-1e9,0],[true,false]).probabilities,[1,0]);
assert.ok(M.swigluTrace([3],[-1]).output[0]<0);assert.ok(M.noiseTrace([-1,1],[1,-1]).output===4);
for(const name of ['lesson-ui-round17.js','lesson-round17-math.mjs','lesson-round17-view.mjs'])await readFile(join(siteRoot,'assets',name));
console.log(`PASS ${states} bilingual rendered states, 10 complete built pages, localized text, native math, unchanged Python, bottom sources and static/client parity`);
