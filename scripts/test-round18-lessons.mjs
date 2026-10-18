import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import * as M from '../src/lesson-round18-math.mjs';
import * as V from '../src/lesson-round18-view.mjs';
import '../src/visual-lessons-round18.mjs';
import {decodeHtml,loadChinese,localizeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
const previous={};
for(const name of ['extra','frontier',...Array.from({length:14},(_,i)=>'round'+(i+4))]){const module=await import('../src/visual-lessons-'+name+'.mjs');for(const[k,v]of Object.entries(module))if(k.endsWith('Translations'))Object.assign(previous,v);}
for(const[k,v]of Object.entries(V.round18Translations))if(k in previous)assert.equal(v,previous[k],'Translation collision: '+k);
const ids={linear:'linear-dynamics-rollout',belief:'world-belief-propagation',kalman:'kalman-scalar-update',curve:'world-rollout-error-curve',kl:'world-diagonal-gaussian-kl'};
const names={linear:'rollout_linear',belief:'propagate_belief',kalman:'kalman_update',curve:'rollout_mse_curve',kl:'diagonal_gaussian_kl'};
const cases=[],renders=[];
function add(kind,args,render=false){const before=JSON.stringify(args),trace=M[kind+'Trace'](...args);assert.equal(JSON.stringify(args),before,'Trace must not mutate inputs');const c={kind,args,trace};cases.push(c);if(render)renders.push(c);return trace;}
for(const p of Object.values(M.linearPresets))for(let a=-2;a<=2;a+=.5)add('linear',[p.x0,p.actions,a,p.b],true);
for(const p of Object.values(M.beliefPresets))for(let a=-2;a<=2;a+=.5)for(let q=0;q<=2;q+=.25)add('belief',[p.mean,p.variance,a,q,p.controls],q===p.q);
for(const p of Object.values(M.kalmanPresets))for(let v=0;v<=9;v+=.5)for(let r=0;r<=9;r+=.5)if(v+r>0)add('kalman',[p.mean,v,p.observation,r],v===p.variance||r===p.r);
for(let z=-4;z<=10;z+=.5)add('kalman',[0,1,z,1],true);
for(const p of Object.values(M.curvePresets))for(let i=0;i<Math.max(1,p.predicted.length);i++)for(let delta=-2;delta<=2;delta+=.5)add('curve',[p.predicted.map((row,j)=>row.map((v,k)=>v+(i===j&&k===0?delta:0))),p.target],true);
for(const p of Object.values(M.klPresets))for(let i=0;i<Math.max(1,p.qm.length);i++)for(let delta=-2;delta<=2;delta+=.5)add('kl',[p.qm.map((v,j)=>v+(i===j?delta:0)),p.qv,p.pm,p.pv],true);
let seed=181018;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),int=n=>Math.floor(rand()*n),vec=n=>Array.from({length:n},()=>(int(41)-20)/4);
for(let k=0;k<120;k++){const size=int(6),a=(int(9)-4)/2,d=1+int(4);add('linear',[(int(21)-10)/2,vec(size),a,(int(9)-4)/2]);add('belief',[int(10),int(10)/2,a,int(9)/4,vec(size)]);add('kalman',[int(10),int(10)/2,int(20)-10,(1+int(20))/4]);add('curve',[Array.from({length:size},()=>vec(d)),Array.from({length:size},()=>vec(d))]);add('kl',[vec(size),Array.from({length:size},()=>.25+int(10)/2),vec(size),Array.from({length:size},()=>.25+int(10)/2)]);}
const ps=Object.fromEntries(Object.entries(ids).map(([kind,id])=>[kind,problems.find(p=>p.id===id)])),refs=Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.solution]));
const python=String.raw`
import sys,json,math,copy,decimal
data=json.load(sys.stdin);decimal.getcontext().prec=65;D=lambda x:decimal.Decimal(str(x));functions={};tests=0
for k,code in data['refs'].items():
 ns={};exec(code,ns);functions[k]=ns[data['names'][k]]
 for test in data['tests'][k]:exec(test['code'],ns);tests+=1
def close(a,b):
 if isinstance(a,(list,tuple)):
  assert len(a)==len(b),(a,b)
  for x,y in zip(a,b):close(x,y)
 else:assert math.isclose(float(a),float(b),rel_tol=4e-12,abs_tol=4e-12),(a,b)
def pow(a,k):return D(1) if k==0 else a**k
for c in data['cases']:
 k,args,tr=c['kind'],c['args'],c['trace'];before=copy.deepcopy(args);actual=functions[k](*args);close(tr['output'],actual)
 if k=='linear':
  x0,us,a,b=args;a,b,x0=D(a),D(b),D(x0)
  expected=[pow(a,t)*x0+b*sum((pow(a,t-1-j)*D(us[j]) for j in range(t)),D(0)) for t in range(len(us)+1)]
  close(tr['output'],expected);assert len(actual)==len(us)+1
  for row in tr['rows']:close(row['carried'],a*D(row['before']));close(row['control'],b*D(row['u']))
 elif k=='belief':
  m,p,a,q,us=args;m,p,a,q=map(D,[m,p,a,q]);expected=[]
  for t in range(1,len(us)+1):
   mu=pow(a,t)*m+sum((pow(a,t-1-j)*D(us[j]) for j in range(t)),D(0))
   var=pow(a,2*t)*p+q*sum((pow(a,2*j) for j in range(t)),D(0));expected.append([mu,var])
  close(tr['output'],expected)
  for r in tr['rows']:close(r['carriedVariance'],a*a*D(r['priorVariance']));assert r['variance']>=0
 elif k=='kalman':
  m,p,z,r=map(D,args);gain=p/(p+r);mu=(r*m+p*z)/(p+r);var=p*r/(p+r)
  close(tr['output'],[mu,var]);close(tr['gain'],gain);close(tr['innovation'],z-m);close(tr['correction'],gain*(z-m))
  close(var,(1-gain)**2*p+gain**2*r);assert 0<=tr['gain']<=1 and tr['updatedVariance']<=float(p)+1e-12
 elif k=='curve':
  pred,target=args;d=len(pred[0]) if pred else 0;expected=[]
  for h in range(1,len(pred)+1):
   total=sum(((D(pred[j][i])-D(target[j][i]))**2 for j in range(h) for i in range(d)),D(0));expected.append(total/D(h*d));close(tr['rows'][h-1]['sum'],total)
  close(tr['output'],expected)
 else:
  qm,qv,pm,pv=args;total=D(0)
  for i,(mq,vq,mp,vp) in enumerate(zip(qm,qv,pm,pv)):
   mq,vq,mp,vp=map(D,[mq,vq,mp,vp]);cross_minus_entropy=(vp.ln()-vq.ln()+(vq+(mq-mp)**2)/vp-1)/2;total+=cross_minus_entropy
   close(tr['rows'][i]['coordinate'],cross_minus_entropy);close(tr['rows'][i]['meanPart'],(mq-mp)**2/(2*vp));assert tr['rows'][i]['variancePart']>=-1e-14
  close(tr['output'],total);assert actual>=-1e-14
 assert args==before
# Independent integration of E_q[log q - log p], using a standardized quadrature variable.
for mq,vq,mp,vp in [(0,1,0,4),(0,4,0,1),(2,1,0,1),(0,1.001,0,1)]:
 N=10000;dz=20/N
 def f(z):
  x=mq+math.sqrt(vq)*z
  return math.exp(-z*z/2)/math.sqrt(2*math.pi)*(.5*math.log(vp/vq)+(x-mp)**2/(2*vp)-z*z/2)
 integral=dz/3*(f(-10)+f(10)+sum((4 if j%2 else 2)*f(-10+j*dz) for j in range(1,N)))
 assert math.isclose(integral,functions['kl']([mq],[vq],[mp],[vp]),rel_tol=1e-9,abs_tol=1e-10)
print('PASS',len(data['cases']),'traces against original Python and independent 65-digit oracles;',tests,'original tests; 4 density-integral checks')
`;
const run=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs,names,tests:Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.tests]))}),encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(run.status,0,run.stdout+'\n'+run.stderr);console.log(run.stdout.trim());
const chinese=await loadChinese();let states=0;
for(const c of renders){const length=c.kind==='kalman'?1:c.trace.rows.length;for(let i=0;i<Math.max(1,length);i++){
 const fn=V['render'+c.kind[0].toUpperCase()+c.kind.slice(1)],en=fn(c.trace,i,false),zh=fn(c.trace,i,true);
 for(const html of [en,zh]){assert.doesNotMatch(html,/NaN|undefined|Infinity/);assert.deepEqual(JSON.parse(decodeHtml(html.match(/data-trace-output="([^"]*)"/)[1])),c.trace.output);for(const m of html.matchAll(/data-calc-value="([^"]*)"/g)){const value=JSON.parse(decodeHtml(m[1]));assert.ok((Array.isArray(value)?value:[value]).every(Number.isFinite));}}
 assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary:chinese.dictionary}),zh,'Static/client translation parity '+c.kind);states+=2;
}}
for(const locale of ['','zh/'])for(const[k,id]of Object.entries(ids)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests'),sources=html.indexOf('<section class="lesson-resources">');assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/<math /);assert.match(html,/data-reset-lesson[^>]*disabled/);assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[k]);
 if(locale)for(const en of Object.keys(V.round18Translations).filter(x=>x.length>25))assert.ok(!decodeHtml(html.slice(visual,code)).includes(en),'Untranslated: '+en);
}
assert.throws(()=>M.kalmanTrace(0,0,1,0),RangeError);assert.match(V.renderInvalidKalman(true),/role="alert"/);assert.match(V.renderInvalidKalman(true),/必须为正/);assert.doesNotMatch(V.renderInvalidKalman(true),/data-trace-output/);
assert.deepEqual(M.linearTrace(7,[],.5,4).output,[7]);assert.deepEqual(M.beliefTrace(0,1,1,.5,[]).output,[]);assert.deepEqual(M.curveTrace([],[]).output,[]);assert.equal(M.klTrace([],[],[],[]).output,0);
assert.ok(M.beliefTrace(4,4,.5,.25,[0]).output[0][1]<4);assert.deepEqual(M.curveTrace([[2],[0],[0]],[[0],[0],[0]]).output,[4,2,4/3]);assert.ok(M.klTrace([0],[1.001],[0],[1]).output>0);assert.match(V.renderKl(M.klTrace([0],[1.001],[0],[1])),/e-7/);assert.match(V.renderKl(M.klTrace([0],[1.001],[0],[1])),/-0\.0009995003331/,'Near-canceling intermediate remains distinguishable');
for(const name of ['lesson-ui-round18.js','lesson-round18-math.mjs','lesson-round18-view.mjs','math-expression.mjs'])await readFile(join(siteRoot,'assets',name));
console.log(`PASS ${states} bilingual rendered states; 10 complete pages; original solutions, localized explanations, native formulas, bottom references, empty/error cases`);
