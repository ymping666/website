import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import {rmsPresets,rmsGainTrace,residualPresets,normalizers,sublayers,preNormTrace,modulationPresets,modulationTrace,gatePresets,gatedResidualTrace} from '../src/lesson-round16-math.mjs';
import {renderRmsGain,renderPreNorm,renderModulation,renderGatedResidual,round16Translations,n} from '../src/lesson-round16-view.mjs';
import '../src/visual-lessons-round16.mjs';
import {decodeHtml,loadChinese,localizeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
const previous={};
for(const name of ['extra','frontier',...Array.from({length:12},(_,i)=>'round'+(i+4))]){const module=await import('../src/visual-lessons-'+name+'.mjs');for(const[k,v]of Object.entries(module))if(k.endsWith('Translations'))Object.assign(previous,v);}
for(const[k,v]of Object.entries(round16Translations))if(k in previous)assert.equal(v,previous[k],'Translation collision: '+k);
const cases=[],functions={rms:rmsGainTrace,modulation:modulationTrace,gate:gatedResidualTrace};
function add(kind,args){const before=JSON.stringify(args);let trace;
 if(kind==='prenorm'){
  const[x,n,f]=args,calls=[];trace=preNormTrace(x,v=>{calls.push(['N',[...v]]);return normalizers[n](v);},v=>{calls.push(['F',[...v]]);return sublayers[f](v);});
  assert.deepEqual(calls,[['N',x],['F',trace.z]]);assert.deepEqual(trace.calls,[{fn:'normalize',input:x},{fn:'sublayer',input:trace.z}]);
 }else trace=functions[kind](...args);
 assert.equal(JSON.stringify(args),before,'Inputs must not mutate');cases.push({kind,args,trace});return trace;
}
for(const p of Object.values(rmsPresets))for(let shift=-3;shift<=3;shift++)for(let d=-4;d<=4;d++)for(const eps of [.01,.000001,1])for(let i=0;i<p.x.length;i++)add('rms',[p.x.map(v=>v+shift),p.gain.map((v,j)=>v+(i===j?d/2:0)),eps]);
for(const x of Object.values(residualPresets))for(const n of Object.keys(normalizers))for(const f of Object.keys(sublayers))add('prenorm',[x,n,f]);
for(const p of Object.values(modulationPresets))for(let s=-4;s<=4;s++)for(let b=-2;b<=2;b++)for(const eps of [.01,.000001,1])for(let i=0;i<p.x.length;i++)add('modulation',[p.x,p.shift.map((v,j)=>v+(j===i?b:0)),p.scale.map((v,j)=>v+(j===i?s/2:0)),eps]);
for(const p of Object.values(gatePresets))for(let d=-2;d<=2;d++)for(let i=0;i<Math.max(1,p.x.length);i++)add('gate',[p.x,p.block,p.gate.map((v,j)=>v+(i===j?d/2:0))]);
const controls=cases.length;
let seed=161018;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),int=n=>Math.floor(rand()*n),vec=n=>Array.from({length:n},()=>(int(33)-16)/4);
for(let k=0;k<200;k++){const n=1+int(6),x=vec(n);add('rms',[x,vec(n),.01]);add('modulation',[x,vec(n),vec(n),.000001]);add('gate',[x,vec(n),vec(n)]);add('prenorm',[x,Object.keys(normalizers)[int(3)],Object.keys(sublayers)[int(4)]]);}
const ids={rms:'norm-rmsnorm-gain',prenorm:'transformer-prenorm-residual',modulation:'dit-adaln-modulation',gate:'dit-adaln-zero-gate'},names={rms:'rms_norm_gain',prenorm:'pre_norm_residual',modulation:'adaptive_layer_norm',gate:'gated_adaln_residual'};
const refs=Object.fromEntries(Object.entries(ids).map(([kind,id])=>[kind,problems.find(p=>p.id===id).solution]));
const python=String.raw`
import sys,json,math,copy,decimal
data=json.load(sys.stdin);decimal.getcontext().prec=65;D=lambda x:decimal.Decimal(str(x));funcs={}
for k,code in data['refs'].items():
 ns={};exec(code,ns);funcs[k]=ns[data['names'][k]]
def close(a,b):
 if isinstance(a,(list,tuple)):
  assert len(a)==len(b),(a,b)
  for x,y in zip(a,b):close(x,y)
 else:assert math.isclose(float(a),float(b),rel_tol=2e-11,abs_tol=2e-11),(a,b)
def normalized(x,eps):
 m=sum(x)/D(len(x));c=[v-m for v in x];v=sum(w*w for w in c)/D(len(x));return [w/(v+eps).sqrt() for w in c]
for c in data['cases']:
 k,args,tr=c['kind'],c['args'],c['trace'];before=copy.deepcopy(args)
 if k=='rms':
  x,g,e=args;actual=funcs[k](*args);xx=list(map(D,x));den=(sum(v*v for v in xx)/D(len(xx))+D(e)).sqrt();expected=[v*D(w)/den for v,w in zip(xx,g)]
  close(tr['den'],den);close(tr['z'],[v/den for v in xx]);close(actual,tr['output']);close(expected,tr['output'])
  if all(v==0 for v in x) or all(v==0 for v in g):assert all(v==0 for v in actual)
 elif k=='modulation':
  x,b,s,e=args;actual=funcs[k](*args);z=normalized(list(map(D,x)),D(e));expected=[v*(1+D(w))+D(a) for v,w,a in zip(z,s,b)]
  close(tr['z'],z);close(actual,tr['output']);close(expected,tr['output'])
  if len(set(x))==1 or all(v==-1 for v in s):close(actual,b)
  close(funcs[k]([v+7 for v in x],b,s,e),actual)
 elif k=='gate':
  x,b,g=args;actual=funcs[k](*args);expected=[D(v)+D(w)*D(a) for v,w,a in zip(x,b,g)];close(actual,tr['output']);close(expected,tr['output'])
  if all(v==0 for v in g):assert actual==x
 else:
  x,n,f=args;calls=[]
  def N(v):
   calls.append(('N',list(v)))
   if not v:return []
   if n=='center':return [w-sum(v)/len(v) for w in v]
   if n=='layer':
    m=sum(v)/len(v);den=math.sqrt(sum((w-m)**2 for w in v)/len(v)+.01);return [(w-m)/den for w in v]
   return list(v)
  def F(v):
   calls.append(('F',list(v)));return [2*w if f=='double' else -w if f=='negative' else 0 if f=='zero' else w*w for w in v]
  actual=funcs[k](x,N,F);assert len(calls)==2 and calls[0]==('N',x) and calls[1][0]=='F'
  close(calls[1][1],tr['z']);xx=list(map(D,x))
  z=[] if not x else [v-sum(xx)/D(len(xx)) for v in xx] if n=='center' else normalized(xx,D('.01')) if n=='layer' else xx
  branch=[2*v if f=='double' else -v if f=='negative' else D(0) if f=='zero' else v*v for v in z];expected=[v+w for v,w in zip(xx,branch)]
  close(actual,tr['output']);close(expected,tr['output']);close(z,tr['z']);close(branch,tr['branch'])
 assert args==before
print('PASS',len(data['cases']),'normalization/residual traces: original Python references, 65-digit independent oracles, call order, shape and input immutability')
`;
const result=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs,names}),encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);console.log(result.stdout.trim());
const renders={rms:renderRmsGain,prenorm:renderPreNorm,modulation:renderModulation,gate:renderGatedResidual};
let rendered=0;
for(const c of cases.slice(0,controls))for(const zh of [false,true])for(let i=0;i<Math.max(1,c.trace.x.length);i++){
 const html=renders[c.kind](c.trace,i,zh);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/id="(?:rms-gain|prenorm|modulation|residual-gate)-output"/);if(zh)assert.doesNotMatch(html,/Component output|Shared positive|Selected channel|Unchanged residual/);rendered++;
 if(c.kind==='gate'){
  if(!c.trace.x.length)assert.doesNotMatch(html,/r16-gate-story/);
  else{
   assert.equal([...html.matchAll(/data-gate-node=/g)].length,6,'Two arithmetic steps have three labeled values each');
   const value=key=>Number(html.match(new RegExp('data-gate-node="'+key+'"[^>]*>[\\s\\S]*?data-gate-value="([^"]+)"'))[1]);
   assert.ok(value('block')===c.trace.block[i]);assert.ok(value('coefficient')===c.trace.gate[i]);assert.ok(value('input')===c.trace.x[i]);
   assert.ok(value('update')===c.trace.update[i]);assert.equal(value('carried'),value('update'),'Carry exactly the same update into addition');
   assert.ok(html.includes('id="residual-gate-number">'+n(c.trace.output[i])),'Reachable gate controls display the correct final channel');
   const meaning=c.trace.gate[i]===0?'This channel’s gate is zero: its update is zero and its original input is preserved.':c.trace.gate[i]<0?'The negative gate reverses the branch contribution. The original input is still added unchanged.':'The gate scales only the branch contribution. Add that update to the unchanged original input.';
   assert.ok(html.includes(zh?round16Translations[meaning]:meaning),'Explain the selected channel, not all channels');
  }
 }
}
const defaults={rms:rmsGainTrace(rmsPresets.constant.x,rmsPresets.constant.gain,.01),prenorm:preNormTrace(residualPresets.basic,normalizers.center,sublayers.double),modulation:modulationTrace(modulationPresets.basic.x,modulationPresets.basic.shift,modulationPresets.basic.scale,.01),gate:gatedResidualTrace(gatePresets.zero.x,gatePresets.zero.block,gatePresets.zero.gate)};
const chinese=await loadChinese();
for(const[kind,tr]of Object.entries(defaults)){
 const i=kind==='modulation'?1:0,localized=localizeHtml(renders[kind](tr,i,false),'',{base:siteBase(),origin:'https://tensordrill.com',dictionary:chinese.dictionary});assert.equal(localized,renders[kind](tr,i,true),'Static/live translation parity '+kind);
}
for(const locale of ['','zh/'])for(const[kind,id]of Object.entries(ids)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests'),sources=html.indexOf('<section class="lesson-resources">');
 assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/<math /);assert.match(html,/data-reset-lesson[^>]*disabled/);
 assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[kind]);assert.ok(html.includes(`src="${siteBase()}assets/lesson-ui.js"`));assert.ok(html.includes(`href="${siteBase()}${locale}editorials/${id}/" aria-current="page"`));
 if(locale)for(const key of Object.keys(round16Translations).filter(k=>k.length>25))assert.ok(!decodeHtml(html.slice(visual,code)).includes(key),'Untranslated label: '+key);
}
assert.notDeepEqual(defaults.modulation.output,modulationPresets.basic.x);assert.ok(defaults.rms.output[0]>1.9);
assert.deepEqual(modulationTrace([1,3],[0,0],[-1,-1],.01).output,[0,0]);assert.deepEqual(preNormTrace([1,3],normalizers.center,sublayers.zero).output,[1,3]);
const roundedGate=renderGatedResidual(gatedResidualTrace([1],[1/3],[1]),0);assert.match(roundedGate,/r16-gate-operator[^>]*[^<]*>≈/,'Rounded arithmetic uses approximation signs');
for(const name of ['lesson-ui-round16.js','lesson-round16-math.mjs','lesson-round16-view.mjs'])await readFile(join(siteRoot,'assets',name));
console.log(`PASS ${rendered} bilingual inspector states, 8 built editorials, unchanged Python solutions, native math, localized navigation and bottom references`);
