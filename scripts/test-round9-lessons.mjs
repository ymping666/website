import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import {flowPairs,fields,stepCounts,velocityTrace,odeTrace,solverComparison} from '../src/lesson-round9-math.mjs';
import {renderVelocity,renderSolver,round9Translations} from '../src/lesson-round9-view.mjs';
import '../src/visual-lessons-round9.mjs';
import {pythonCommand,siteRoot,siteBase} from './config.mjs';
import {decodeHtml} from './localize.mjs';
const cases=[];
function velocity(args){const before=JSON.stringify(args),trace=velocityTrace(...args);assert.equal(JSON.stringify(args),before);cases.push({kind:'velocity',args,trace});}
function ode(args){cases.push({kind:'ode',args,trace:odeTrace(...args)});}
for(const p of Object.values(flowPairs))for(let i=0;i<=10;i++)velocity([p.x0,p.x1,i/10]);
for(const method of ['euler','heun'])for(const field of Object.keys(fields))for(let x=-4;x<=4;x++)for(const n of stepCounts)ode([method,x/2,field,n]);
const controls=cases.length;
let seed=91015;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
for(let j=0;j<100;j++){
 const a=Array.from({length:Math.floor(rand()*7)},()=>rand()*6-3),b=a.map(()=>rand()*6-3);velocity([a,b,rand()]);
 for(const method of ['euler','heun'])ode([method,rand()*4-2,Object.keys(fields)[Math.floor(rand()*7)],1+Math.floor(rand()*20)]);
}
const ids={velocity:'flow-conditional-velocity',euler:'flow-euler-integration',heun:'flow-heun-integration'};
const refs=Object.fromEntries(Object.entries(ids).map(([kind,id])=>[kind,problems.find(p=>p.id===id).solution]));
const python=String.raw`
import sys,json,math,copy
data=json.load(sys.stdin);funcs={}
for kind,code in data['refs'].items():
 ns={};exec(code,ns);funcs[kind]=ns[{'velocity':'linear_flow_velocity','euler':'euler_flow','heun':'heun_flow'}[kind]]
def close(a,b):
 if isinstance(a,list):
  assert len(a)==len(b)
  for x,y in zip(a,b):close(x,y)
 else:assert math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-10),(a,b)
def field(k,x,t):
 return {'growth':lambda:x,'time':lambda:t,'constant':lambda:2,'decay':lambda:-x,'fast':lambda:-4*x,'affine':lambda:x+t,'zero':lambda:0}[k]()
def exact(k,x0,t):
 return {'growth':lambda:x0*math.exp(t),'time':lambda:x0+.5*t*t,'constant':lambda:x0+2*t,'decay':lambda:x0*math.exp(-t),'fast':lambda:x0*math.exp(-4*t),'affine':lambda:(x0+1)*math.exp(t)-t-1,'zero':lambda:x0}[k]()
def discrete(k,method,x0,h,j):
 if k=='constant':return x0+2*j*h
 if k=='zero':return x0
 if k=='time':return x0+h*h*j*(j-1 if method=='euler' else j)/2
 lam={'growth':1,'decay':-1,'fast':-4,'affine':1}[k]
 factor=1+lam*h+(0 if method=='euler' else (lam*h)**2/2)
 return (x0+1)*factor**j-j*h-1 if k=='affine' else x0*factor**j
for c in data['cases']:
 kind,args,tr=c['kind'],c['args'],c['trace'];before=copy.deepcopy(args)
 if kind=='velocity':
  a,b,t=args;close(tr['output'],funcs[kind](a,b));assert len(tr['rows'])==len(a)
  for i,r in enumerate(tr['rows']):
   close(r['position'],a[i]+t*(b[i]-a[i]));close(r['startPart'],(1-t)*a[i]);close(r['endPart'],t*b[i]);close(r['velocity'],b[i]-a[i])
   eps=1e-5;finite_difference=((a[i]+(t+eps)*(b[i]-a[i]))-(a[i]+(t-eps)*(b[i]-a[i])))/(2*eps)
   assert math.isclose(finite_difference,r['velocity'],rel_tol=1e-7,abs_tol=1e-8)
  close(funcs[kind](b,a),[-v for v in tr['output']])
  out=funcs[kind](a,b);assert out is not a and out is not b
 else:
  method,x0,k,n=args;h=1/n;calls=[]
  def v(x,t):
   calls.append((x,t));return field(k,x,t)
  close(tr['output'],funcs[method](x0,v,n));assert len(tr['rows'])==n
  assert len(calls)==len(tr['calls'])==n*(2 if method=='heun' else 1)
  for py,js in zip(calls,tr['calls']):close(py[0],js['x']);close(py[1],js['t'])
  for r in tr['rows']:
   j=r['step'];close(r['t'],(j-1)*h);close(r['x'],discrete(k,method,x0,h,j-1))
   close(r['k1'],field(k,r['x'],r['t']));close(r['predicted'],r['x']+h*r['k1'])
   if method=='heun':close(r['k2'],field(k,r['predicted'],r['t']+h));close(r['slope'],(r['k1']+r['k2'])/2)
   else:assert r['k2'] is None;close(r['slope'],r['k1'])
   close(r['after'],discrete(k,method,x0,h,j));close(r['exact'],exact(k,x0,r['endTime']))
  close(tr['exact'],exact(k,x0,1));close(tr['error'],abs(tr['output']-exact(k,x0,1)))
  if method=='euler':assert all(t<1 for x,t in calls)
  else:close(calls[-1][1],1)
 assert args==before
print('PASS',len(data['cases']),'Flow traces: Python references, independent discrete closed forms, call order/count, derivatives and immutability')
`;
const result=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs}),encoding:'utf8',maxBuffer:16*1024*1024});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);console.log(result.stdout.trim());
let inspected=0;
for(const c of cases.slice(0,controls)){
 if(c.kind==='velocity'){assert.doesNotMatch(renderVelocity(c.trace),/NaN|Infinity|undefined/);inspected++;}
 else for(let selected=1;selected<=c.trace.steps;selected++){
  const html=renderSolver(c.trace,selected);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/class="r9-selected"/g)||[]).length,1);inspected++;
 }
}
for(const field of Object.keys(fields))for(const row of solverComparison(1,field)){
 assert.equal(row.eulerCalls,row.steps);assert.equal(row.heunCalls,2*row.steps);
 assert.equal(row.euler,odeTrace('euler',1,field,row.steps).output);assert.equal(row.heun,odeTrace('heun',1,field,row.steps).output);
}
assert.equal(odeTrace('euler',1,'growth',2).output,2.25);
assert.equal(odeTrace('heun',1,'growth',2).output,2.640625);
assert.equal(odeTrace('euler',0,'time',4).output,.375);assert.equal(odeTrace('heun',0,'time',4).output,.5);
assert.equal(odeTrace('euler',1,'fast',1).output,-3);assert.equal(odeTrace('heun',1,'fast',1).output,5);
for(const locale of ['','zh/'])for(const [kind,id] of Object.entries(ids)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),decoded=decodeHtml(html);
 const visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests'),sources=html.indexOf('<section class="lesson-resources">');
 assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/data-reset-lesson[^>]*disabled/);
 assert.ok(html.includes(`src="${siteBase()}assets/lesson-ui.js"`));assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[kind]);
 if(locale){const en=decodeHtml(await readFile(join(siteRoot,'editorials',id,'index.html'),'utf8'));
  for(const [original,translated] of Object.entries(round9Translations))if(en.includes('>'+original+'<'))assert.ok(decoded.includes(translated),original);
  assert.doesNotMatch(decoded.slice(visual,code),/Function output|Velocity calls|Endpoint pair|Inspect one update|Numerical trajectory/);
 }
}
for(const file of ['lesson-ui-round9.js','lesson-round9-math.mjs','lesson-round9-view.mjs'])await readFile(join(siteRoot,'assets',file));
console.log(`PASS ${controls} numerical control states + 300 seeded cases; ${inspected} rendered control/inspection states, six bilingual pages, unchanged code and bottom references`);
