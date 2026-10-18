import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import * as M from '../src/lesson-round23-math.mjs';
import * as V from '../src/lesson-round23-view.mjs';
import '../src/visual-lessons-round23.mjs';
import {decodeHtml,loadChinese,localizeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
const ids={disc:'gan-discriminator-bce',gen:'gan-generator-nonsaturating',penalty:'gan-gradient-penalty',grads:'gan-discriminator-logit-gradients',guidance:'diffusion-classifier-guidance'},names={disc:'discriminator_loss',gen:'generator_loss',penalty:'gradient_penalty',grads:'discriminator_logit_grads',guidance:'classifier_guided_mean'};
const previous={};for(const name of ['extra','frontier',...Array.from({length:19},(_,i)=>'round'+(i+4))]){const mod=await import('../src/visual-lessons-'+name+'.mjs');for(const[k,v]of Object.entries(mod))if(k.endsWith('Translations'))Object.assign(previous,v);}for(const[k,v]of Object.entries(V.round23Translations))if(k in previous)assert.equal(v,previous[k],'Translation collision: '+k);
const cases=[],renders=[];
function add(kind,args,render=false){const before=JSON.stringify(args),trace=M.traces[kind](...args);assert.equal(JSON.stringify(args),before);const c={kind,args,trace};cases.push(c);if(render)renders.push(c);return trace;}
function args(kind,p,v,index=0){if(kind==='disc'||kind==='gen'){const f=p.fake.map((x,i)=>x+(i===index?(v??0):0));return kind==='disc'?[p.real,f]:[f];}return kind==='penalty'?[p.gradients,v??p.weight]:kind==='grads'?[p.real,p.fake,v??.5]:[p.mean,p.variance,p.gradient,v??p.scale];}
for(const[kind,presets]of Object.entries(M.presets))for(const[name,p]of Object.entries(presets)){if(name==='invalid'){assert.throws(()=>M.fromPreset(kind,p),RangeError);continue;}if(kind==='disc'||kind==='gen')for(let i=0;i<p.fake.length;i++)for(let v=-2;v<=2;v+=.5)add(kind,args(kind,p,v,i),true);else if(kind==='penalty')for(const v of [0,1,10,20])add(kind,args(kind,p,v),true);else if(kind==='grads')for(let v=0;v<=10;v++)add(kind,args(kind,p,v/10),true);else for(let v=-1;v<=3;v+=.25)add(kind,args(kind,p,v),true);}
let seed=231018;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),int=n=>Math.floor(rand()*n),vec=d=>Array.from({length:d},()=>(int(81)-40)/4);
for(let i=0;i<180;i++){const b=1+int(4),d=1+int(4);add('disc',[vec(b),vec(b)]);add('gen',[vec(b)]);add('penalty',[Array.from({length:b},()=>vec(d)),int(41)/2]);add('grads',[vec(1)[0],vec(1)[0],int(11)/10]);add('guidance',[vec(d),vec(d).map(Math.abs),vec(d),(int(17)-4)/4]);}
const ps=Object.fromEntries(Object.entries(ids).map(([k,id])=>[k,problems.find(p=>p.id===id)])),refs=Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.solution]));
const python=String.raw`
import sys,json,math,copy,decimal
decimal.getcontext().prec=80;D=lambda x:decimal.Decimal(str(x));data=json.load(sys.stdin);functions={};tests=0
for k,code in data['refs'].items():
 ns={};exec(code,ns);functions[k]=ns[data['names'][k]]
 for test in data['tests'][k]:exec(test['code'],ns);tests+=1
def close(a,b):
 if isinstance(a,(list,tuple)):
  assert len(a)==len(b),(a,b)
  for x,y in zip(a,b):close(x,y)
 else:assert math.isclose(float(a),float(b),rel_tol=3e-11,abs_tol=7e-13),(a,b)
def loss(r,f):return (1+(-r).exp()).ln()+(1+f.exp()).ln()
for c in data['cases']:
 k,a,tr=c['kind'],c['args'],c['trace'];before=copy.deepcopy(a);actual=functions[k](*(a[:2] if k=='grads' else a))
 if k=='disc':
  expected=sum((loss(D(r),D(f)) for r,f in zip(*a)),D(0))/len(a[0])
  for row in tr['rows']:
   close(row['realLoss'],(1+(-D(row['r'])).exp()).ln());close(row['fakeLoss'],(1+D(row['f']).exp()).ln());close(row['sum'],D(row['realLoss'])+D(row['fakeLoss']))
 elif k=='gen':
  expected=sum(((1+(-D(z)).exp()).ln() for z in a[0]),D(0))/len(a[0])
  for row in tr['rows']:close(row['loss'],(1+(-D(row['z'])).exp()).ln());close(row['discriminatorFake'],(1+D(row['z']).exp()).ln())
 elif k=='penalty':
  # Expanded identity, independently from the trace's (norm-1)^2 computation.
  norms2=[sum((D(x)**2 for x in row),D(0)) for row in a[0]]
  expected=D(a[1])*(sum(norms2)/len(norms2)+1-2*sum(x.sqrt() for x in norms2)/len(norms2))
  for row,q in zip(tr['rows'],norms2):close(row['norm2'],q);close(row['norm'],q.sqrt());close(row['deviation'],q.sqrt()-1);close(row['square'],(q.sqrt()-1)**2)
 elif k=='grads':
  # High-precision finite differences of the pair objective, not sigmoid identities.
  r,f,rate=map(D,a);h=D('1e-12');expected=[(loss(r+h,f)-loss(r-h,f))/(2*h),(loss(r,f+h)-loss(r,f-h))/(2*h)]
  row=tr['rows'][0];close(row['nextReal'],r-rate*D(row['realGrad']));close(row['nextFake'],f-rate*D(row['fakeGrad']));close(row['before'],loss(r,f));close(row['after'],loss(D(row['nextReal']),D(row['nextFake'])));assert row['after']<=row['before']+1e-12;assert row['nextReal']>=float(r);assert row['nextFake']<=float(f)
 else:
  means,vs,gs,scale=a;d=len(means);matrix=[[D(vs[i]) if i==j else D(0) for j in range(d)] for i in range(d)]
  expected=[D(means[i])+D(scale)*sum((matrix[i][j]*D(gs[j]) for j in range(d)),D(0)) for i in range(d)]
  for row,e in zip(tr['rows'],expected):close(row['value'],e);close(row['shift'],e-D(row['m']))
 close(actual,expected);close(actual,tr['output']);assert a==before
print('PASS',len(data['cases']),'traces against original Python and independent Decimal-log/expanded-norm/finite-difference/diagonal-matrix oracles;',tests,'original tests')
`;
const run=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs,names,tests:Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.tests]))}),encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(run.status,0,run.stdout+'\n'+run.stderr);console.log(run.stdout.trim());
const chinese=await loadChinese();let states=0;
for(const c of renders)for(let index=0;index<Math.max(1,c.trace.rows.length);index++){const en=V.renders[c.kind](c.trace,index),zh=V.renders[c.kind](c.trace,index,true);for(const html of [en,zh]){assert.doesNotMatch(html,/NaN|undefined|Infinity/);assert.deepEqual(JSON.parse(decodeHtml(html.match(/data-trace-output="([^"]*)"/)[1])),c.trace.output);}assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary:chinese.dictionary}),zh,'Static/client translation parity: '+c.kind);states+=2;}
for(const[k,id]of Object.entries(ids))for(const locale of ['','zh/']){const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests',code),sources=html.indexOf('<section class="lesson-resources">');assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/<math /);assert.match(html,/data-reset-lesson[^>]*disabled/);assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[k]);if(locale)for(const en of Object.keys(V.round23Translations).filter(x=>x.length>25))assert.ok(!decodeHtml(html.slice(visual,code)).includes(en),'Untranslated: '+en);}
for(const bad of [()=>M.discTrace([],[]),()=>M.discTrace([1],[]),()=>M.genTrace([]),()=>M.genTrace([NaN]),()=>M.penaltyTrace([],1),()=>M.penaltyTrace([[1],[1,2]],1),()=>M.penaltyTrace([[1]],-1),()=>M.gradsTrace(Infinity,0),()=>M.gradsTrace(0,0,-1),()=>M.guidanceTrace([1],[1],[],1),()=>M.guidanceTrace([1],[-1],[1],1)])assert.throws(bad,RangeError);
for(const zh of [false,true]){assert.match(V.renderInvalid(zh),/role="alert"/);assert.doesNotMatch(V.renderInvalid(zh),/data-trace-output/);}
assert.deepEqual(M.guidanceTrace([],[],[],1).output,[]);assert.equal(M.discTrace([0,0],[0,0]).output,2*Math.log(2));assert.equal(M.penaltyTrace([[0,0]],10).output,10);assert.equal(M.penaltyTrace([[.6,.8]],10).output,0);assert.ok(M.genTrace([20]).output>0);assert.ok(M.genTrace([-2]).output>M.genTrace([2]).output);const tiny=M.gradsTrace(20,-20);assert.ok(tiny.output[0]<0&&tiny.output[1]>0);assert.notEqual(V.n(tiny.output[0]),'0');assert.equal(M.fromPreset('gen',M.genPresets.basic,2,1).fake[0],-2);assert.deepEqual(M.guidanceTrace([1],[0],[100],2).output,[1]);
assert.match(V.renderGuidance(M.fromPreset('guidance',M.guidancePresets.basic)),/marker-end=/);assert.match(V.renderGuidance(M.fromPreset('guidance',M.guidancePresets.zeroScale)),/Δ=0/);assert.match(V.renderPenalty(M.fromPreset('penalty',M.penaltyPresets.basic)),/r23-unit-tick/);
for(const name of ['lesson-ui-round23.js','lesson-round23-math.mjs','lesson-round23-view.mjs'])await readFile(join(siteRoot,'assets',name));console.log(`PASS ${states} bilingual rendered states; original solutions, bottom references, native math, translation parity, invalid/empty and signed small-value states`);
