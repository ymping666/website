import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import * as M from '../src/lesson-round21-math.mjs';
import * as V from '../src/lesson-round21-view.mjs';
import '../src/visual-lessons-round21.mjs';
import {decodeHtml,loadChinese,localizeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
const ids={pixel:'video-frame-mse',temporal:'video-temporal-difference-loss',velocity:'flow-velocity-regression',cfg:'flow-cfg-velocity',rollout:'video-action-conditioned-rollout'};
const names={pixel:'video_reconstruction_mse',temporal:'temporal_difference_mse',velocity:'flow_velocity_mse',cfg:'guided_velocity',rollout:'action_latent_rollout'};
const previous={};for(const name of ['extra','frontier',...Array.from({length:17},(_,i)=>'round'+(i+4))]){const module=await import('../src/visual-lessons-'+name+'.mjs');for(const[k,v]of Object.entries(module))if(k.endsWith('Translations'))Object.assign(previous,v);}
for(const[k,v]of Object.entries(V.round21Translations))if(k in previous)assert.equal(v,previous[k],'Translation collision: '+k);
const cases=[],renders=[];
function add(kind,args,render=false){const before=JSON.stringify(args),trace=M.traces[kind](...args);assert.equal(JSON.stringify(args),before,'Inputs must remain unchanged');const c={kind,args,trace};cases.push(c);if(render)renders.push(c);return trace;}
function args(kind,p,value){return kind==='pixel'||kind==='temporal'?[p.pred,p.target]:kind==='velocity'?[p.prediction,p.x0,p.x1]:kind==='cfg'?[p.u,p.c,value??p.scale]:[p.initial,p.actions,p.mode,value??p.gain];}
for(const[kind,presets]of Object.entries(M.presets))for(const[name,p]of Object.entries(presets)){if(name==='invalid'){assert.throws(()=>M.fromPreset(kind,p),RangeError);continue;}if(kind==='cfg')for(let s=-1;s<=3;s+=.25)add(kind,args(kind,p,s),true);else if(kind==='rollout'&&p.mode==='affine')for(let a=.5;a<=2;a+=.5)add(kind,args(kind,p,a),true);else add(kind,args(kind,p),true);}
let seed=211018;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),int=n=>Math.floor(rand()*n),vec=d=>Array.from({length:d},()=>(int(41)-20)/4);
for(let k=0;k<200;k++){
 const count=int(6),d=1+int(4),pred=Array.from({length:count},()=>vec(d)),target=Array.from({length:count},()=>vec(d));add('pixel',[pred,target]);add('temporal',[pred,target]);
 add('velocity',[vec(d),vec(d),vec(d)]);const u=vec(int(5));add('cfg',[u,vec(u.length),(int(17)-4)/4]);add('rollout',[(int(17)-8)/2,vec(count),['affine','add','multiply'][int(3)],(int(7)-3)/2]);
 const shifted=pred.map(row=>row.map(v=>v+7));assert.equal(M.temporalTrace(shifted,pred).output,0,'Constant offsets cancel');
}
const ps=Object.fromEntries(Object.entries(ids).map(([k,id])=>[k,problems.find(p=>p.id===id)])),refs=Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.solution]));
const python=String.raw`
import sys,json,math,copy,decimal
decimal.getcontext().prec=65;D=lambda x:decimal.Decimal(str(x));data=json.load(sys.stdin);functions={};tests=0
for k,code in data['refs'].items():
 ns={};exec(code,ns);functions[k]=ns[data['names'][k]]
 for test in data['tests'][k]:exec(test['code'],ns);tests+=1
def close(a,b):
 if isinstance(a,(list,tuple)):
  assert len(a)==len(b),(a,b)
  for x,y in zip(a,b):close(x,y)
 else:assert math.isclose(float(a),float(b),rel_tol=3e-11,abs_tol=1e-11),(a,b)
for c in data['cases']:
 kind,args,tr=c['kind'],c['args'],c['trace'];before=copy.deepcopy(args)
 if kind=='rollout':
  initial,actions,mode,gain=args
  transition=lambda s,a:s*a if mode=='multiply' else s+a if mode=='add' else gain*s+a
  actual=functions[kind](initial,actions,transition)
  # Independent closed forms: affine weighted powers, additive prefixes, multiplicative products.
  expected=[D(initial)]
  for length in range(1,len(actions)+1):
   if mode=='multiply':expected.append(D(initial)*math.prod(D(a) for a in actions[:length]))
   else:
    a=D(1) if mode=='add' else D(gain)
    # Explicit exponent-zero branch also handles 0**0 in Decimal.
    power=lambda n:D(1) if n==0 else a**n
    expected.append(power(length)*D(initial)+sum((power(length-1-j)*D(v) for j,v in enumerate(actions[:length])),D(0)))
  close(actual,expected);assert len(actual)==len(actions)+1
  for r in tr['rows']:close(r['old'],actual[r['t']]);close(r['next'],actual[r['t']+1]);close(r['reset'],transition(initial,r['action']))
 elif kind=='cfg':
  actual=functions[kind](*args);u,v,scale=args;s=D(scale);expected=[(1-s)*D(a)+s*D(b) for a,b in zip(u,v)];close(actual,expected)
 elif kind=='pixel':
  actual=functions[kind](*args);a,b=args;res=[D(x)-D(y) for fa,fb in zip(a,b) for x,y in zip(fa,fb)];expected=sum((x*x for x in res),D(0))/len(res) if res else D(0);close(actual,expected);assert tr['count']==len(res)
 elif kind=='temporal':
  actual=functions[kind](*args);a,b=args
  # Difference of the framewise reconstruction residual, not two separately computed velocity lists.
  residual=[[D(x)-D(y) for x,y in zip(fa,fb)] for fa,fb in zip(a,b)]
  terms=[(row[d]-old[d])**2 for old,row in zip(residual,residual[1:]) for d in range(len(row))]
  expected=sum(terms,D(0))/len(terms) if terms else D(0);close(actual,expected);assert tr['count']==max(0,len(a)-1)*(len(a[0]) if a else 0)
 else:
  actual=functions[kind](*args);prediction,x0,x1=args
  # Unit-time endpoint error of x0+prediction versus x1.
  terms=[(D(a)+D(p)-D(b))**2 for p,a,b in zip(prediction,x0,x1)];expected=sum(terms,D(0))/len(terms);close(actual,expected)
 close(actual,tr['output']);assert args==before
 if kind in ['pixel','temporal','velocity']:
  close(tr['sum'],sum((D(r['residual'])**2 for r in tr['rows']),D(0)))
  for r in tr['rows']:close(r['square'],D(r['residual'])**2)
print('PASS',len(data['cases']),'traces against original Python and independent Decimal/closed-form oracles;',tests,'original representative tests')
`;
const run=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs,names,tests:Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.tests]))}),encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(run.status,0,run.stdout+'\n'+run.stderr);console.log(run.stdout.trim());
const chinese=await loadChinese();let states=0;
for(const c of renders)for(let index=0;index<Math.max(1,c.trace.rows.length);index++){
 const en=V.renders[c.kind](c.trace,index),zh=V.renders[c.kind](c.trace,index,true);for(const html of [en,zh]){assert.doesNotMatch(html,/NaN|undefined|Infinity/);assert.deepEqual(JSON.parse(decodeHtml(html.match(/data-trace-output="([^"]*)"/)[1])),c.trace.output);}
 assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary:chinese.dictionary}),zh,'Static/client translation parity: '+c.kind);states+=2;
}
for(const[k,id]of Object.entries(ids))for(const locale of ['','zh/']){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests',code),sources=html.indexOf('<section class="lesson-resources">');assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/<math /);assert.match(html,/data-reset-lesson[^>]*disabled/);assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[k]);if(locale)for(const en of Object.keys(V.round21Translations).filter(x=>x.length>25))assert.ok(!decodeHtml(html.slice(visual,code)).includes(en),'Untranslated: '+en);
}
for(const bad of [()=>M.pixelTrace([[1]],[]),()=>M.pixelTrace([[]],[[]]),()=>M.temporalTrace([[1],[2,3]],[[1],[2,3]]),()=>M.velocityTrace([],[],[]),()=>M.velocityTrace([1],[0],[Infinity]),()=>M.cfgTrace([1],[2,3],1),()=>M.cfgTrace([1],[2],NaN),()=>M.rolloutTrace(1,[2],'unknown')])assert.throws(bad,RangeError);
for(const zh of [false,true]){assert.match(V.renderInvalid(zh),/role="alert"/);assert.doesNotMatch(V.renderInvalid(zh),/data-trace-output/);}
assert.equal(M.pixelTrace([[0],[1,2]],[[2],[1,4]]).output,8/3);assert.equal(M.temporalTrace([[10],[12],[15]],[[0],[2],[5]]).output,0);assert.deepEqual(M.rolloutTrace(1,[0,0],'affine',2).output,[1,2,4]);assert.deepEqual(M.cfgTrace([1,2],[4,8],0).output,[1,2]);assert.deepEqual(M.cfgTrace([1,2],[4,8],1).output,[4,8]);
for(const kind of ['pixel','velocity'])assert.match(V.renders[kind](M.fromPreset(kind,M.presets[kind].tiny)),/e-10/);
for(const name of ['lesson-ui-round21.js','lesson-round21-math.mjs','lesson-round21-view.mjs'])await readFile(join(siteRoot,'assets',name));
console.log(`PASS ${states} bilingual render states; original solutions preserved; references last; native math; translation collision/parity; empty/error and tiny-error states`);
