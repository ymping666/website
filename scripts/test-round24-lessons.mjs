import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import * as M from '../src/lesson-round24-math.mjs';
import * as V from '../src/lesson-round24-view.mjs';
import '../src/visual-lessons-round24.mjs';
import {decodeHtml,loadChinese,localizeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
const ids={train:'norm-batch-training',eval:'norm-batch-inference',adam:'optimizer-adamw-update',noise:'diffusion-ddpm-stochastic-step',return:'foundation-nstep-return'},names={train:'batch_norm_train',eval:'batch_norm_eval',adam:'adamw_step',noise:'ddpm_reverse_step',return:'discounted_return'};
const previous={};for(const name of ['extra','frontier',...Array.from({length:20},(_,i)=>'round'+(i+4))]){const mod=await import('../src/visual-lessons-'+name+'.mjs');for(const[k,v]of Object.entries(mod))if(k.endsWith('Translations'))Object.assign(previous,v);}for(const[k,v]of Object.entries(V.round24Translations))if(k in previous)assert.equal(v,previous[k],'Translation collision: '+k);
const cases=[],renders=[];
function add(kind,args,render=false){const before=JSON.stringify(args),trace=M.traces[kind](...args);assert.equal(JSON.stringify(args),before,'Mutated supplied input');const c={kind,args,trace};cases.push(c);if(render)renders.push(c);return trace;}
function args(kind,p,v,extra){if(kind==='train')return [p.batch,p.gamma,p.beta,v??p.eps];if(kind==='eval')return [p.batch.map((r,i)=>r.map(x=>x+(i===1?(v??0):0))),p.mean,p.variance,p.gamma,p.beta,p.eps];if(kind==='adam')return [p.p,p.g,p.m,p.v,p.step,p.lr,p.b1,p.b2,p.eps,v??p.decay];if(kind==='noise')return [p.mean,p.variance,v??p.noise,extra===undefined?p.timestep:extra?0:(p.timestep||1)];return [p.rewards,extra??p.terminals,v??p.gamma,p.bootstrap];}
for(const[kind,presets]of Object.entries(M.presets))for(const[name,p]of Object.entries(presets)){
 if(name==='invalid'){assert.throws(()=>M.fromPreset(kind,p),RangeError);continue;}
 if(kind==='train')for(const v of [1e-8,1e-5,.01,1])add(kind,args(kind,p,v),true);
 else if(kind==='eval')for(let v=-10;v<=10;v++)add(kind,args(kind,p,v),true);
 else if(kind==='adam')for(let v=0;v<=10;v++)add(kind,args(kind,p,v/10),true);
 else if(kind==='noise')for(let z=-20;z<=20;z+=.25)for(const final of [false,true])add(kind,args(kind,p,z,final),Number.isInteger(z/5));
 else for(let flags=0;flags<2**p.rewards.length;flags++)for(let g=0;g<=10;g++){const terminals=p.terminals.map((_,i)=>Boolean(flags&(1<<i)));add(kind,args(kind,p,g/10,terminals),true);}
}
let seed=241019;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),int=n=>Math.floor(rand()*n),vec=d=>Array.from({length:d},()=>(int(41)-20)/4);
for(let i=0;i<180;i++){const b=1+int(4),d=int(4),batch=Array.from({length:b},()=>vec(d));add('train',[batch,vec(d),vec(d),[1e-8,.01,1][int(3)]]);add('eval',[int(5)?batch:[],vec(d),vec(d).map(Math.abs),vec(d),vec(d),[1e-8,.01,1][int(3)]]);add('adam',[vec(1)[0],vec(1)[0],vec(1)[0],Math.abs(vec(1)[0]),1+int(8),int(6)/10,.1+int(8)/10,.1+int(8)/10,1e-8,int(11)/10]);add('noise',[vec(1)[0],int(101)/4,vec(1)[0],int(5)]);const count=int(6);add('return',[vec(count),Array.from({length:count},()=>int(4)===0),int(11)/10,vec(1)[0]]);}
const ps=Object.fromEntries(Object.entries(ids).map(([k,id])=>[k,problems.find(p=>p.id===id)])),refs=Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.solution]));
const python=String.raw`
import sys,json,math,copy,decimal
decimal.getcontext().prec=80;D=lambda x:decimal.Decimal(str(x));power=lambda g,i:D(1) if i==0 else D(g)**i;data=json.load(sys.stdin);functions={};tests=0
for k,code in data['refs'].items():
 ns={};exec(code,ns);functions[k]=ns[data['names'][k]]
 for test in data['tests'][k]:exec(test['code'],ns);tests+=1
def close(a,b):
 if isinstance(a,(list,tuple)):
  assert len(a)==len(b),(a,b)
  for x,y in zip(a,b):close(x,y)
 else:assert math.isclose(float(a),float(b),rel_tol=3e-11,abs_tol=7e-13),(a,b)
for c in data['cases']:
 k,a,tr=c['kind'],c['args'],c['trace'];before=copy.deepcopy(a);actual=functions[k](*a)
 if k in ['train','eval']:
  if k=='train':
   batch,gamma,beta,eps=a;b=len(batch);d=len(gamma);means=[sum(D(row[j]) for row in batch)/b for j in range(d)]
   # Independent pairwise-difference variance identity, not centered-squares code.
   vs=[sum((D(x[j])-D(y[j]))**2 for x in batch for y in batch)/(2*b*b) for j in range(d)]
  else:batch,means,vs,gamma,beta,eps=a;means=list(map(D,means));vs=list(map(D,vs));d=len(gamma)
  expected=[]
  for row in batch:
   values=[]
   for j,x in enumerate(row):
    den=(vs[j]+D(eps)).sqrt();slope=D(gamma[j])/den;intercept=D(beta[j])-slope*means[j]
    values.append(slope*D(x)+intercept)
   expected.append(values)
  for row in tr['rows']:
   i,j=row['i'],row['j'];den=(vs[j]+D(eps)).sqrt();close(row['mean'],means[j]);close(row['variance'],vs[j]);close(row['denominator'],den);close(row['centered'],D(batch[i][j])-means[j]);close(row['normalized'],(D(batch[i][j])-means[j])/den);close(row['scaled'],D(gamma[j])*(D(batch[i][j])-means[j])/den);close(row['value'],expected[i][j])
  if k=='eval':
   close(tr['alone'],expected[0] if batch else [])
   if batch:close(functions[k]([batch[0]],*a[1:])[0],actual[0])
 elif k=='adam':
  p,g,m,v,step,lr,b1,b2,eps,decay=map(D,a);step=int(step);mn=g+b1*(m-g);vn=g*g+b2*(v-g*g);mh=mn/(1-b1**step);vh=vn/(1-b2**step);adaptive=lr*mh/(vh.sqrt()+eps)
  expected=[p-lr*(decay*p+mh/(vh.sqrt()+eps)),mn,vn];row=tr['rows'][0]
  for key,value in [('nextM',mn),('nextV',vn),('mh',mh),('vh',vh),('denominator',vh.sqrt()+eps),('adaptive',adaptive),('decayAmount',lr*decay*p),('decayed',p-lr*decay*p)]:close(row[key],value)
 elif k=='noise':
  mean,variance,noise,timestep=map(D,a);row=tr['rows'][0];sigma=variance.sqrt();expected=mean if timestep==0 else mean+sigma*noise;close(row['sigma'],sigma);close(row['raw'],sigma*noise);close(D(row['raw'])**2,variance*noise*noise);close(row['applied'],0 if timestep==0 else sigma*noise)
 else:
  rewards,terminals,gamma,bootstrap=a;stop=next((i for i,x in enumerate(terminals) if x),None);count=len(rewards) if stop is None else stop+1
  # Backward Bellman recursion, independent of forward running-discount accumulation.
  expected=D(bootstrap) if stop is None else D(0)
  for reward in reversed(rewards[:count]):expected=D(reward)+D(gamma)*expected
  for i,row in enumerate(tr['rows']):
   assert row['used']==(i<count)
   if i<count:close(row['weight'],power(gamma,i));close(row['contribution'],D(rewards[i])*power(gamma,i))
   else:assert row['weight'] is None and row['contribution'] is None and row['total'] is None
  close(tr['bootstrapWeight'],power(gamma,len(rewards)) if stop is None else 0);assert tr['terminalIndex']==(-1 if stop is None else stop)
 close(actual,expected);close(actual,tr['output']);assert a==before
print('PASS',len(data['cases']),'traces against original Python and independent pairwise-variance/affine-map/Decimal-AdamW/Gaussian/backward-return oracles;',tests,'original tests')
`;
const run=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs,names,tests:Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.tests]))}),encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(run.status,0,run.stdout+'\n'+run.stderr);console.log(run.stdout.trim());
const chinese=await loadChinese();let states=0;
for(const c of renders)for(let index=0;index<Math.max(1,c.trace.rows.length);index++){const en=V.renders[c.kind](c.trace,index),zh=V.renders[c.kind](c.trace,index,true);for(const html of [en,zh]){assert.doesNotMatch(html,/NaN|undefined|Infinity/);assert.deepEqual(JSON.parse(decodeHtml(html.match(/data-trace-output="([^"]*)"/)[1])),c.trace.output);}assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary:chinese.dictionary}),zh,'Static/client translation parity: '+c.kind);states+=2;}
for(const[k,id]of Object.entries(ids))for(const locale of ['','zh/']){const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests',code),sources=html.indexOf('<section class="lesson-resources">');assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/<math /);assert.match(html,/data-reset-lesson[^>]*disabled/);assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[k]);if(locale)for(const en of Object.keys(V.round24Translations).filter(x=>x.length>25))assert.ok(!decodeHtml(html.slice(visual,code)).includes(en),'Untranslated: '+en);}
for(const bad of [()=>M.trainTrace([],[],[],.01),()=>M.trainTrace([[1]],[],[],.01),()=>M.trainTrace([[1]],[1],[0],0),()=>M.evalTrace([[1]],[0],[-1],[1],[0],.01),()=>M.adamTrace(1,1,0,0,0,.1,.9,.99,1e-8,.1),()=>M.adamTrace(1,1,0,-1,1,.1,.9,.99,1e-8,.1),()=>M.noiseTrace(0,-1,1,0),()=>M.noiseTrace(0,1,NaN,1),()=>M.returnTrace([1],[],.5,1),()=>M.returnTrace([1],[1],.5,1),()=>M.returnTrace([],[],2,1)])assert.throws(bad,RangeError);
for(const zh of [false,true]){assert.match(V.renderInvalid(zh),/role="alert"/);assert.doesNotMatch(V.renderInvalid(zh),/data-trace-output/);}
assert.deepEqual(M.trainTrace([[],[]],[],[],.01).output,[[],[]]);assert.deepEqual(M.evalTrace([],[0],[1],[1],[0],.01).output,[]);assert.deepEqual(M.evalTrace([[],[]],[],[],[],[],.01).output,[[],[]]);assert.equal(M.noiseTrace(3,9,20,0).output,3);assert.ok(M.noiseTrace(0,1e-16,.5,1).output>0);assert.equal(M.returnTrace([],[],0,7).output,7);assert.equal(M.returnTrace([1,2,500],[false,true,false],.5,100).output,2);assert.equal(M.returnTrace([1,2,500],[false,true,true],.5,-100).output,2);
const nearUnit=M.trainTrace([[1],[3]],[1],[0],1e-8);assert.notEqual(V.n(nearUnit.rows[0].normalized),'-1');assert.notEqual(V.n(nearUnit.rows[1].normalized),'1');
for(const wd of [0,.2,1]){const a=M.fromPreset('adam',M.adamPresets.basic,wd);assert.deepEqual(a.output.slice(1),M.fromPreset('adam',M.adamPresets.basic,0).output.slice(1));}
for(const name of ['lesson-ui-round24.js','lesson-round24-math.mjs','lesson-round24-view.mjs'])await readFile(join(siteRoot,'assets',name));console.log(`PASS ${states} bilingual rendered states; complete original solutions, bottom references, native formulas, translation parity, terminal prefixes and invalid/empty/zero-width/tiny states`);
