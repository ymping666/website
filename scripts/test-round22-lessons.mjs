import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import * as M from '../src/lesson-round22-math.mjs';
import * as V from '../src/lesson-round22-view.mjs';
import '../src/visual-lessons-round22.mjs';
import {decodeHtml,loadChinese,localizeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
const ids={matmul:'foundation-matmul',sinusoid:'foundation-sinusoidal-positions',vit:'vit-class-token',rope:'rope-position-encoding',gelu:'foundation-gelu'},names={matmul:'matmul',sinusoid:'position_encoding',vit:'prepare_vit_tokens',rope:'apply_rope',gelu:'gelu'};
const previous={};for(const name of ['extra','frontier',...Array.from({length:18},(_,i)=>'round'+(i+4))]){const module=await import('../src/visual-lessons-'+name+'.mjs');for(const[k,v]of Object.entries(module))if(k.endsWith('Translations'))Object.assign(previous,v);}for(const[k,v]of Object.entries(V.round22Translations))if(k in previous)assert.equal(v,previous[k],'Translation collision: '+k);
const cases=[],renders=[];
function add(kind,args,render=false){const before=JSON.stringify(args),trace=M.traces[kind](...args);assert.equal(JSON.stringify(args),before,'Trace must preserve inputs');const c={kind,args,trace};cases.push(c);if(render)renders.push(c);return trace;}
function args(kind,p,value){return kind==='matmul'?[p.a,p.b]:kind==='sinusoid'?[value??p.position,p.dim]:kind==='vit'?[p.patches,p.cls,p.positions]:kind==='rope'?[p.tokens,value??p.base]:[value??p.x];}
for(const[kind,presets]of Object.entries(M.presets))for(const[name,p]of Object.entries(presets)){if(name==='invalid'){assert.throws(()=>M.fromPreset(kind,p),RangeError);continue;}if(kind==='sinusoid')for(let pos=0;pos<=32;pos++)add(kind,args(kind,p,pos),true);else if(kind==='gelu')for(let x=-6;x<=6;x+=.25)add(kind,args(kind,p,x),true);else if(kind==='rope')for(const base of [100,10000])add(kind,args(kind,p,base),true);else add(kind,args(kind,p),true);}
let seed=221018;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),int=n=>Math.floor(rand()*n),vec=d=>Array.from({length:d},()=>(int(41)-20)/4);
for(let k=0;k<180;k++){const m=1+int(3),inner=1+int(4),n=1+int(3);add('matmul',[Array.from({length:m},()=>vec(inner)),Array.from({length:inner},()=>vec(n))]);add('sinusoid',[int(200),2+2*int(5)]);const count=int(4),d=int(5);add('vit',[Array.from({length:count},()=>vec(d)),vec(d),Array.from({length:count+1},()=>vec(d))]);const even=2*int(5);add('rope',[Array.from({length:count},()=>vec(even)),[10,100,10000][int(3)]]);add('gelu',[(int(1601)-800)/100]);}
const ps=Object.fromEntries(Object.entries(ids).map(([k,id])=>[k,problems.find(p=>p.id===id)])),refs=Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.solution]));
const python=String.raw`
import sys,json,math,copy,decimal
decimal.getcontext().prec=80;D=lambda x:decimal.Decimal(str(x));PI=D('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899');data=json.load(sys.stdin);functions={};tests=0
for k,code in data['refs'].items():
 ns={};exec(code,ns);functions[k]=ns[data['names'][k]]
 for test in data['tests'][k]:exec(test['code'],ns);tests+=1
def close(a,b):
 if isinstance(a,(list,tuple)):
  assert len(a)==len(b),(a,b)
  for x,y in zip(a,b):close(x,y)
 else:assert math.isclose(float(a),float(b),rel_tol=3e-11,abs_tol=7e-13),(a,b)
def trig(angle):
 a=(angle+PI)%(2*PI)-PI;s=a;c=D(1);ts=a;tc=D(1)
 for k in range(1,180):
  ts*= -a*a/D((2*k)*(2*k+1));tc*= -a*a/D((2*k-1)*(2*k));s+=ts;c+=tc
  if abs(ts)+abs(tc)<D('1e-74'):break
 return s,c
def phi(x):
 # Independent high-precision power series for the Gaussian integral,
 # rather than the JavaScript Simpson integration of the upper tail.
 term=x;total=x
 for k in range(1,500):
  term*= -x*x*D(2*k-1)/D(2*k*(2*k+1));total+=term
  if abs(term)<D('1e-74'):break
 return D('.5')+total/(2*PI).sqrt()
for c in data['cases']:
 kind,args,tr=c['kind'],c['args'],c['trace'];before=copy.deepcopy(args);actual=functions[kind](*args)
 if kind=='matmul':
  a,b=args;m,k,n=len(a),len(b),len(b[0]);expected=[[D(0) for _ in range(n)] for _ in range(m)]
  # Sum outer products of column q of A and row q of B.
  for q in range(k):
   for i in range(m):
    for j in range(n):expected[i][j]+=D(a[i][q])*D(b[q][j])
  close(actual,expected)
  for row in tr['rows']:
   assert len(row['terms'])==k
   for term in row['terms']:close(term['product'],D(a[row['i']][term['q']])*D(b[term['q']][row['j']]))
 elif kind=='sinusoid':
  position,dim=args;expected=[]
  for i in range(dim//2):
   angle=D(position)/(D(10000)**(D(2*i)/D(dim)));s,co=trig(angle);expected.extend([s,co]);close(tr['rows'][i]['angle'],angle)
  close(actual,expected)
 elif kind=='vit':
  patches,cls,positions=args;count=len(patches)+1;dim=len(cls)
  expected=[[D(positions[i][d])+(D(cls[d]) if i==0 else D(patches[i-1][d])) for d in range(dim)] for i in range(count)];close(actual,expected);assert len(actual)==count
  for i,row in enumerate(actual):
   for d,value in enumerate(row):close(D(value)-D(positions[i][d]),cls[d] if i==0 else patches[i-1][d])
 elif kind=='rope':
  tokens,base=args;dim=len(tokens[0]) if tokens else 0;expected=[]
  for p,token in enumerate(tokens):
   result=[]
   for i in range(dim//2):
    angle=D(p)/(D(base)**(D(2*i)/D(dim)));s,co=trig(angle);x,y=map(D,token[2*i:2*i+2]);z=complex(float(co),float(s))*complex(float(x),float(y));result.extend([z.real,z.imag])
   expected.append(result)
  close(actual,expected)
  for r in tr['rows']:close(r['norm'],r['nextNorm']);close(r['next'],actual[r['p']][2*r['i']:2*r['i']+2])
 else:
  x=D(args[0]);expected=x*phi(x);close(actual,expected);assert 0<=tr['rows'][0]['cdf']<=1
  close(tr['rows'][0]['cdf'],phi(x));close(actual,tr['rows'][0]['value'])
 close(actual,tr['output']);assert args==before
print('PASS',len(data['cases']),'traces against original Python and independent outer-product/Decimal-trig/token-offset/complex-rotation/Gaussian-series oracles;',tests,'original tests')
`;
const run=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs,names,tests:Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.tests]))}),encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(run.status,0,run.stdout+'\n'+run.stderr);console.log(run.stdout.trim());
const chinese=await loadChinese();let states=0;
for(const c of renders)for(let index=0;index<Math.max(1,c.trace.rows.length);index++){const en=V.renders[c.kind](c.trace,index),zh=V.renders[c.kind](c.trace,index,true);for(const html of [en,zh]){assert.doesNotMatch(html,/NaN|undefined|Infinity/);assert.deepEqual(JSON.parse(decodeHtml(html.match(/data-trace-output="([^"]*)"/)[1])),c.trace.output);}assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary:chinese.dictionary}),zh,'Static/client translation parity: '+c.kind);states+=2;}
for(const[k,id]of Object.entries(ids))for(const locale of ['','zh/']){const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests',code),sources=html.indexOf('<section class="lesson-resources">');assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/<math /);assert.match(html,/data-reset-lesson[^>]*disabled/);assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[k]);if(locale)for(const en of Object.keys(V.round22Translations).filter(x=>x.length>25))assert.ok(!decodeHtml(html.slice(visual,code)).includes(en),'Untranslated: '+en);}
for(const bad of [()=>M.matmulTrace([],[]),()=>M.matmulTrace([[1,2]],[[1,2]]),()=>M.sinusoidTrace(-1,4),()=>M.sinusoidTrace(1,3),()=>M.sinusoidTrace(1.5,4),()=>M.vitTrace([],[],[]),()=>M.ropeTrace([[1]],10000),()=>M.ropeTrace([[1,2]],1),()=>M.geluTrace(NaN)])assert.throws(bad,RangeError);
for(const zh of [false,true]){assert.match(V.renderInvalid(zh),/role="alert"/);assert.doesNotMatch(V.renderInvalid(zh),/data-trace-output/);}
assert.deepEqual(M.sinusoidTrace(0,4).output,[0,1,0,1]);assert.deepEqual(M.vitTrace([], [1,2],[[3,4]]).output,[[4,6]]);assert.deepEqual(M.vitTrace([[],[]],[],[[],[],[]]).output,[[],[],[]]);assert.deepEqual(M.ropeTrace([[],[]],10000).output,[[],[]]);assert.deepEqual(M.ropeTrace([[3,4]],10000).output,[[3,4]]);assert.ok(M.geluTrace(-6).output<0);assert.match(V.renderGelu(M.geluTrace(-6)),/-5\.919/);assert.notEqual(V.n(Math.cos(.001)),'1');
for(const name of ['lesson-ui-round22.js','lesson-round22-math.mjs','lesson-round22-view.mjs'])await readFile(join(siteRoot,'assets',name));console.log(`PASS ${states} bilingual rendered states; original solutions, bottom references, native math, translation parity, invalid/empty/zero-width and small-negative states`);
