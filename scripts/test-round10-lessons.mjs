import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import {diffusionPairs,reconstructionTrace,posteriorTrace,ddimTrace} from '../src/lesson-round10-math.mjs';
import {renderReconstruction,renderPosterior,renderDDIM,round10Translations} from '../src/lesson-round10-view.mjs';
import '../src/visual-lessons-round10.mjs';
import {pythonCommand,siteRoot,siteBase} from './config.mjs';
import {decodeHtml} from './localize.mjs';
const cases=[];
function add(kind,args){const before=JSON.stringify(args),trace=({reconstruction:reconstructionTrace,posterior:posteriorTrace,ddim:ddimTrace}[kind])(...args);assert.equal(JSON.stringify(args),before);cases.push({kind,args,trace});return trace;}
for(const pair of Object.values(diffusionPairs))for(let ai=1;ai<=20;ai++)for(let bi=-4;bi<=4;bi++)add('reconstruction',[pair.x0,pair.eps,ai/20,bi/4]);
for(let ai=1;ai<20;ai++)for(let pi=1;pi<20;pi++)add('posterior',[[1,2],[2,-1],ai/20,pi/20]);
for(const pair of Object.values(diffusionPairs))for(const current of [.1,.25,.5,.9,1])for(let pi=Math.round(current*100);pi<=100;pi++)for(const bias of [-1,0,1]){
 const f=reconstructionTrace(pair.x0,pair.eps,current,bias);add('ddim',[f.rows.map(r=>r.xt),f.rows.map(r=>r.hat),current,pi/100]);
}
const controls=cases.length;
let seed=10015;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
for(let i=0;i<100;i++){
 const x=Array.from({length:i%5},()=>rand()*10-5),e=x.map(()=>rand()*6-3),a=.001+.998*rand(),b=a+(1-a)*rand();
 add('reconstruction',[x,e,a,rand()*2-1]);add('posterior',[e,x,a,.001+.998*rand()]);add('ddim',[x,e,a,b]);
}
const ids={reconstruction:'diffusion-reconstruct-x0',posterior:'diffusion-ddpm-posterior',ddim:'diffusion-ddim-deterministic'};
const refs=Object.fromEntries(Object.entries(ids).map(([k,id])=>[k,problems.find(p=>p.id===id).solution]));
const python=String.raw`
import sys,json,math,copy
data=json.load(sys.stdin);funcs={}
for kind,code in data['refs'].items():
 ns={};exec(code,ns);funcs[kind]=ns[{'reconstruction':'predict_x0_from_eps','posterior':'ddpm_posterior_mean','ddim':'ddim_step'}[kind]]
def close(a,b):
 if isinstance(a,list):
  assert len(a)==len(b)
  for x,y in zip(a,b):close(x,y)
 else:assert math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-10),(a,b)
for c in data['cases']:
 k,args,tr=c['kind'],c['args'],c['trace'];before=copy.deepcopy(args)
 if k=='reconstruction':
  x,e,a,bias=args;xt=[math.sqrt(a)*v+math.sqrt(1-a)*z for v,z in zip(x,e)];hat=[z+bias for z in e]
  actual=funcs[k](xt,hat,a);gain=math.sqrt(1/a-1)
  close(tr['gain'],gain);close(tr['output'],actual);close(tr['output'],[v-gain*bias for v in x])
  close(funcs[k](xt,e,a),x)
  for i,r in enumerate(tr['rows']):
   close(r['xt'],xt[i]);close(r['hat'],hat[i]);close(r['removed'],math.sqrt(1-a)*hat[i]);close(r['residual'],math.sqrt(a)*actual[i]);close(r['error'],-gain*bias)
 elif k=='posterior':
  xt,x0,a,p=args;beta=1-a
  # Independent Gaussian Bayes calculation from prior and likelihood precisions.
  var=1/(1/(1-p)+a/beta)
  independent=[var*(math.sqrt(p)*x/(1-p)+math.sqrt(a)*y/beta) for x,y in zip(x0,xt)]
  actual=funcs[k](xt,x0,a,p);close(actual,independent);close(tr['output'],independent)
  close(tr['variance'],var);close(tr['sd']**2,var);close(tr['current'],a*p)
  assert tr['c0']>0 and tr['ct']>0 and tr['variance']>0
  for i,r in enumerate(tr['rows']):
   close(r['clean'],var*math.sqrt(p)*x0[i]/(1-p));close(r['noisy'],var*math.sqrt(a)*xt[i]/beta);close(r['mean'],independent[i])
 else:
  x,e,a,p=args;scale=math.sqrt(p/a)
  independent=[scale*v+(math.sqrt(1-p)-scale*math.sqrt(1-a))*z for v,z in zip(x,e)]
  actual=funcs[k](*args);close(tr['output'],actual);close(actual,independent)
  for i,r in enumerate(tr['rows']):
   close(r['estimate'],funcs['reconstruction']([x[i]],[e[i]],a)[0]);close(r['clean'],math.sqrt(p)*r['estimate']);close(r['noise'],math.sqrt(1-p)*e[i]);close(r['after'],independent[i])
  close(funcs[k](x,e,a,a),x)
  close(funcs[k](x,e,a,1),funcs['reconstruction'](x,e,a))
 assert args==before
 assert actual is not args[0]
print('PASS',len(data['cases']),'diffusion traces: Python reference, independent Gaussian precision and DDIM expansion, endpoints, errors and immutability')
`;
const result=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs}),encoding:'utf8',maxBuffer:24*1024*1024});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);console.log(result.stdout.trim());
const renderers={reconstruction:renderReconstruction,posterior:renderPosterior,ddim:renderDDIM};let rendered=0;
for(const c of cases.slice(0,controls))for(const zh of [false,true]){
 const html=renderers[c.kind](c.trace,zh);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/id="diffusion-output"/);
 if(c.kind==='reconstruction'){
  assert.doesNotMatch(html,/<svg/,'Reconstruction uses the full calculation flow rather than ambiguous signed bars');
  assert.equal((html.match(/class="r10-process-card /g)||[]).length,c.trace.rows.length*4);
  assert.equal((html.match(/data-reconstruction-result=/g)||[]).length,c.trace.rows.length);
  assert.equal((html.match(/data-reconstruction-residual=/g)||[]).length,c.trace.rows.length);
  assert.match(html,/<details class="r10-numerical-details">/);
 }
 for(const n of [...html.matchAll(/(?:x1|x2|y1|y2|cx|cy)="([^"]+)"/g)])assert.ok(Number.isFinite(Number(n[1])));
 if(zh)assert.doesNotMatch(html,/Function output|Signed contributions|Posterior variance|relative density/);
 rendered++;
}
for(const locale of ['','zh/'])for(const[k,id]of Object.entries(ids)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),decoded=decodeHtml(html);
 const visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests'),sources=html.indexOf('<section class="lesson-resources">');
 assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/data-reset-lesson[^>]*disabled/);assert.match(html,/<math /);
 assert.ok(html.includes(`src="${siteBase()}assets/lesson-ui.js"`));assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[k]);
 assert.doesNotMatch(html.slice(visual,code),/<div class="lesson-formula[^>]*>\s*<code>/);
 if(locale){const en=decodeHtml(await readFile(join(siteRoot,'editorials',id,'index.html'),'utf8'));
  for(const [original,translated]of Object.entries(round10Translations))if(en.includes('>'+original+'<'))assert.ok(decoded.includes(translated),original);
  assert.doesNotMatch(decoded.slice(visual,code),/Prediction error|Teaching vector|Function output|Reset example|Noisy input|Negative predicted|Clean contribution|Noise contribution/);
 }
}
for(const file of ['lesson-ui-round10.js','lesson-round10-math.mjs','lesson-round10-view.mjs'])await readFile(join(siteRoot,'assets',file));
console.log(`PASS ${rendered} bilingual render states; 6 built editorials; unchanged Python, static fallback, native formulas and references after full solutions`);
