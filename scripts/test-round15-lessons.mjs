import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import {linearPresets,linearForwardTrace,linearBackwardTrace,msePresets,mseTrace,reluPresets,reluBackwardTrace,scalarFunctions,centralTrace} from '../src/lesson-round15-math.mjs';
import {renderForward,renderBackward,renderMse,renderRelu,renderCentral,round15Translations} from '../src/lesson-round15-view.mjs';
import '../src/visual-lessons-round15.mjs';
import {decodeHtml,loadChinese,localizeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
const previous={};
for(const name of ['extra','frontier',...Array.from({length:11},(_,i)=>'round'+(i+4))]){const module=await import('../src/visual-lessons-'+name+'.mjs');for(const[k,v]of Object.entries(module))if(k.endsWith('Translations'))Object.assign(previous,v);}
for(const[k,v]of Object.entries(round15Translations))if(k in previous)assert.equal(v,previous[k],'Translation collision: '+k);
const cases=[],functions={forward:linearForwardTrace,backward:linearBackwardTrace,mse:mseTrace,relu:reluBackwardTrace};
function add(kind,args){const before=JSON.stringify(args);let trace;
 if(kind==='central'){const[key,x,h]=args,calls=[];trace=centralTrace(v=>{calls.push(v);return scalarFunctions[key].fn(v);},x,h);assert.deepEqual(calls,[x+h,x-h]);}else trace=functions[kind](...args);
 assert.equal(JSON.stringify(args),before);cases.push({kind,args,trace});return trace;
}
for(const p of Object.values(linearPresets))for(let scale=-4;scale<=4;scale++){
 for(let shift=-4;shift<=4;shift++)add('forward',[p.x.map(v=>v*scale/2),p.w,p.b.map(v=>v+shift/2)]);
 add('backward',[p.x,p.w,p.g.map(v=>v*scale/2)]);
}
for(const p of Object.values(msePresets))for(let shift=-4;shift<=4;shift++)for(const copies of [1,2,4]){const repeat=a=>Array.from({length:copies},()=>a).flat();add('mse',[repeat(p.p.map(v=>v+shift/2)),repeat(p.t)]);}
for(const p of Object.values(reluPresets))for(let shift=-6;shift<=6;shift++)add('relu',[p.x.map(v=>v+shift/2),p.g]);
for(const key of Object.keys(scalarFunctions))for(let x=-8;x<=8;x++)for(const h of [1,.5,.1,.01,.0001,1e-8])add('central',[key,x/4,h]);
const controls=cases.length;
let seed=151018;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),int=n=>Math.floor(rand()*n),value=()=>(int(25)-12)/4;
for(let k=0;k<250;k++){
 const din=int(5),dout=int(4),x=Array.from({length:din},value),w=Array.from({length:dout},()=>Array.from({length:din},value)),b=Array.from({length:dout},value),g=Array.from({length:dout},value);
 add('forward',[x,w,b]);add('backward',[x,w,g]);
 const len=1+int(5);add('mse',[Array.from({length:len},value),Array.from({length:len},value)]);add('relu',[Array.from({length:din},value),Array.from({length:din},value)]);
}
const ids={forward:'autograd-linear-forward',mse:'autograd-mse-gradient',relu:'autograd-relu-backward',backward:'autograd-linear-backward',central:'autograd-central-difference'},names={forward:'linear_forward',backward:'linear_backward',mse:'mse_gradient',relu:'relu_backward',central:'central_difference'};
const refs=Object.fromEntries(Object.entries(ids).map(([kind,id])=>[kind,problems.find(p=>p.id===id).solution]));
const python=String.raw`
import sys,json,math,copy,decimal
data=json.load(sys.stdin);decimal.getcontext().prec=65;D=lambda x:decimal.Decimal(str(x));funcs={}
for k,code in data['refs'].items():
 ns={};exec(code,ns);funcs[k]=ns[data['names'][k]]
def close(a,b,tol=1e-11):
 if isinstance(a,(list,tuple)):
  assert len(a)==len(b),(a,b)
  for x,y in zip(a,b):close(x,y,tol)
 else:assert math.isclose(a,b,rel_tol=tol,abs_tol=tol),(a,b)
scalar={'square':lambda v:v*v,'cubic':lambda v:v*v*v,'linear':lambda v:2*v+1,'sine':math.sin,'absolute':abs}
def objective(x,w,g):return sum(D(gi)*sum(D(wij)*D(xi) for wij,xi in zip(row,x)) for row,gi in zip(w,g))
def mse_objective(p,t):return sum((D(a)-D(b))**2 for a,b in zip(p,t))/D(len(p))
H=D('0.0001')
for c in data['cases']:
 k,args,tr=c['kind'],c['args'],c['trace'];before=copy.deepcopy(args)
 if k=='central':
  key,x,h=args;calls=[]
  def f(v):calls.append(v);return scalar[key](v)
  actual=funcs[k](f,x,h);assert calls==[x+h,x-h] and tr['calls']==calls
  m=abs(x)+h
  scale={'linear':2*m+1,'square':m*m,'cubic':m*m*m,'sine':1,'absolute':m}[key]
  tol=max(1e-300,8*sys.float_info.epsilon*scale/(2*h))
  assert abs(actual-tr['output'])<=tol,(key,x,h,actual,tr['output'],tol)
  if key=='square':expected=2*D(x)
  elif key=='cubic':expected=3*D(x)**2+D(h)**2
  elif key=='linear':expected=D(2)
  elif key=='sine':expected=math.cos(x)*math.sin(h)/h
  else:expected=(abs(D(x)+D(h))-abs(D(x)-D(h)))/(2*D(h))
  assert abs(float(expected)-tr['output'])<=tol+max(1e-300,abs(float(expected)))*2e-13,(key,x,h,expected,tr['output'],tol)
 else:
  close(funcs[k](*args),tr['output'])
  if k=='forward':
   x,w,b=args;close(tr['output'],[float(sum(D(a)*D(v) for a,v in zip(row,x))+D(bi)) for row,bi in zip(w,b)])
  elif k=='backward':
   x,w,g=args;dx,dw,db=tr['output'];num_dx=[]
   for i in range(len(x)):
    plus=list(map(D,x));minus=list(plus);plus[i]+=H;minus[i]-=H;num_dx.append(float((objective(plus,w,g)-objective(minus,w,g))/(2*H)))
   close(dx,num_dx)
   for o in range(len(w)):
    for i in range(len(x)):
     plus=[list(map(D,row)) for row in w];minus=copy.deepcopy(plus);plus[o][i]+=H;minus[o][i]-=H
     close(dw[o][i],float((objective(x,plus,g)-objective(x,minus,g))/(2*H)))
   close(db,g)
   # Bias derivative is also checked by perturbing its additive path in the scalar objective.
   for o in range(len(g)):close(db[o],float((D(g[o])*H-D(g[o])*(-H))/(2*H)))
  elif k=='mse':
   p,t=args;close(tr['loss'],float(mse_objective(p,t)))
   for i,gradient in enumerate(tr['output']):
    plus=list(map(D,p));minus=list(plus);plus[i]+=H;minus[i]-=H
    close(gradient,float((mse_objective(plus,t)-mse_objective(minus,t))/(2*H)))
   close(funcs[k](p*2,t*2),[v/2 for v in tr['output']]*2)
  else:
   x,g=args
   for i,v in enumerate(x):
    if v==0:assert tr['output'][i]==0
    else:
     h=min(abs(D(v))/2,H);slope=(max(D(0),D(v)+h)-max(D(0),D(v)-h))/(2*h)
     close(tr['output'][i],float(D(g[i])*slope))
 assert args==before
print('PASS',len(data['cases']),'gradient traces: Python references, 65-digit finite-difference oracles, exact cubic central error, two-call probes and input immutability')
`;
const result=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs,names}),encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);console.log(result.stdout.trim());
let rendered=0;
for(const c of cases.slice(0,controls))for(const zh of [false,true]){
 const tr=c.trace,steps=c.kind==='forward'?Math.max(1,tr.w.length):c.kind==='mse'?tr.n:c.kind==='relu'?Math.max(1,tr.x.length):c.kind==='backward'?Math.max(1,tr.x.length):1;
 for(let i=0;i<steps;i++)for(let o=0;o<(c.kind==='backward'?Math.max(1,tr.w.length):1);o++){
  const html=c.kind==='forward'?renderForward(tr,i,zh):c.kind==='backward'?renderBackward(tr,i,o,zh):c.kind==='mse'?renderMse(tr,i,zh):c.kind==='relu'?renderRelu(tr,i,zh):renderCentral(tr,c.args[0],zh);
  assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/id="(?:linear-forward|linear-backward|mse-gradient|relu-backward|central-difference)-output"/);
  if(zh)assert.doesNotMatch(html,/Component output|Sum the row|Gate determined|No derivative exists|Inspected input/);
  for(const pair of html.matchAll(/(?:cx|cy)="([^"]+)"/g))assert.ok(Number.isFinite(Number(pair[1])));
  rendered++;
 }
}
const tiny=centralTrace(scalarFunctions.cubic.fn,1,1e-8);
assert.ok(renderCentral(tiny,'cubic').includes('f(x + h) = <samp>'+String(tiny.plus)), 'Keep tiny probe changes visible');
assert.ok(renderMse(mseTrace([2,4],[1,2]),0).includes('>2 … 6.5</text>'), 'Plot the exact coordinate minimum');
const chinese=await loadChinese();
for(const locale of ['','zh/'])for(const[kind,id]of Object.entries(ids)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests'),sources=html.indexOf('<section class="lesson-resources">');
 assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/<math /);assert.match(html,/data-reset-lesson[^>]*disabled/);
 assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[kind]);assert.ok(html.includes(`src="${siteBase()}assets/lesson-ui.js"`));
 assert.ok(html.includes(`href="${siteBase()}${locale}editorials/${id}/" aria-current="page"`));
 if(locale)for(const key of Object.keys(round15Translations).filter(k=>k.length>25))assert.ok(!decodeHtml(html.slice(visual,code)).includes(key),'Untranslated label: '+key);
}
for(const c of [cases.find(x=>x.kind==='forward'),cases.find(x=>x.kind==='mse'),cases.find(x=>x.kind==='relu'),cases.find(x=>x.kind==='central')]){
 const tr=c.trace,render=zh=>c.kind==='forward'?renderForward(tr,0,zh):c.kind==='mse'?renderMse(tr,0,zh):c.kind==='relu'?renderRelu(tr,0,zh):renderCentral(tr,c.args[0],zh);
 const localized=localizeHtml(render(false),'',{base:siteBase(),origin:'https://tensordrill.com',dictionary:chinese.dictionary});assert.equal(localized,render(true),'Static/live label parity: '+c.kind);
}
for(const name of ['lesson-ui-round15.js','lesson-round15-math.mjs','lesson-round15-view.mjs'])await readFile(join(siteRoot,'assets',name));
console.log(`PASS ${rendered} bilingual inspector states, finite diagram coordinates, 10 built editorials, complete solutions, localized learning links and bottom references`);
