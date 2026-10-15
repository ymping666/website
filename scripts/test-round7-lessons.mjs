import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import {latentPresets,klPresets,pixelPresets,contributionPresets,sampleTrace,klTrace,betaTrace} from '../src/lesson-round7-math.mjs';
import {renderSample,renderKL,renderBeta,round7Translations} from '../src/lesson-round7-view.mjs';
import '../src/visual-lessons-round7.mjs';
import {pythonCommand,siteRoot,siteBase} from './config.mjs';
import {decodeHtml} from './localize.mjs';
const funcs={sample:sampleTrace,kl:klTrace,beta:betaTrace},renderers={sample:renderSample,kl:renderKL,beta:renderBeta};
const cases=[];
function add(kind,args){const before=JSON.stringify(args),trace=funcs[kind](...args);assert.equal(JSON.stringify(args),before);cases.push({kind,args,trace});}
for(const p of Object.values(latentPresets))for(let j=-4;j<=4;j++)add('sample',[p.mu,p.logvar,p.epsilon.map(e=>e*j/2)]);
for(const p of Object.values(klPresets))for(let j=-4;j<=4;j++)for(const scale of [1,4,.25])add('kl',[p.mu.map(m=>m+j/2),p.logvar.map(lv=>lv+Math.log(scale))]);
for(const p of Object.values(pixelPresets))for(const k of Object.values(contributionPresets))for(let j=0;j<=16;j++)add('beta',[p,k,j/4]);
const controlCases=cases.length;
let seed=71015;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
for(let j=0;j<100;j++){
 const n=Math.floor(rand()*7),mu=Array.from({length:n},()=>rand()*6-3),lv=mu.map(()=>rand()*6-3),eps=mu.map(()=>rand()*4-2);
 add('sample',[mu,lv,eps]);add('kl',[mu,lv]);add('beta',[mu.map(x=>x*x),eps.map(x=>x*x),rand()*4]);
}
const ids={sample:'vae-reparameterization',kl:'vae-standard-normal-kl',beta:'vae-beta-objective'};
const refs=Object.fromEntries(Object.entries(ids).map(([kind,id])=>[kind,problems.find(p=>p.id===id).solution]));
const python=String.raw`
import sys,json,math,copy
data=json.load(sys.stdin);funcs={}
for kind,code in data['refs'].items():
 ns={};exec(code,ns);funcs[kind]=ns[{'sample':'vae_sample','kl':'vae_kl_standard_normal','beta':'beta_vae_loss'}[kind]]
def close(a,b):
 if isinstance(a,list):
  assert len(a)==len(b)
  for x,y in zip(a,b):close(x,y)
 else:assert math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-10),(a,b)
for c in data['cases']:
 kind,args,tr=c['kind'],c['args'],c['trace'];before=copy.deepcopy(args)
 close(tr['output'],funcs[kind](*args))
 if kind=='sample':
  mu,lv,eps=args
  for i,r in enumerate(tr['rows']):
   sigma=math.sqrt(math.exp(lv[i]));close(r['sigma'],sigma);close(r['variance'],sigma*sigma)
   close(r['noise'],sigma*eps[i]);close(r['z'],mu[i]+sigma*eps[i])
   # Independent numerical check of the derivative discussed in the explanation.
   h=1e-5;derivative=(mu[i]+math.exp((lv[i]+h)/2)*eps[i]-(mu[i]+math.exp((lv[i]-h)/2)*eps[i]))/(2*h)
   assert math.isclose(derivative,.5*sigma*eps[i],rel_tol=1e-7,abs_tol=1e-8)
 else:
  if kind=='kl':
   mu,lv=args;total=0
   for i,r in enumerate(tr['rows']):
    v=math.exp(lv[i]);sigma=math.sqrt(v)
    # E_q[log q - log p], derived from the two Gaussian log densities.
    eq_logq=-.5*math.log(2*math.pi)-math.log(sigma)-.5
    eq_logp=-.5*math.log(2*math.pi)-.5*(v+mu[i]**2)
    close(r['kl'],eq_logq-eq_logp);close(r['meanPart'],mu[i]**2/2)
    close(r['variancePart'],(v-1-math.log(v))/2);close(r['meanPart']+r['variancePart'],r['kl'])
    assert r['variancePart']>=-1e-12 and r['kl']>=-1e-12
    total+=eq_logq-eq_logp
   close(tr['output'],total);close(funcs[kind](mu+mu,lv+lv),2*tr['output'])
  else:
   errors,k,beta=args;r=math.fsum(errors)/len(errors) if errors else 0;ksum=math.fsum(k)
   close(tr['reconstruction'],r);close(tr['kl'],ksum);close(tr['weighted'],beta*ksum)
   close(tr['output'],r+beta*ksum)
   close(funcs[kind](errors+errors,k,beta),tr['output'])
   close(funcs[kind](errors,k+k,beta),r+2*beta*ksum)
   close(funcs[kind](errors,k,beta+1)-tr['output'],ksum)
 assert args==before
print('PASS',len(data['cases']),'round-7 traces against Python references and independent identities')
`;
const result=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs}),encoding:'utf8',maxBuffer:16*1024*1024});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);console.log(result.stdout.trim());
for(const {kind,trace} of cases){
 const html=renderers[kind](trace);assert.doesNotMatch(html,/NaN|Infinity|undefined/);
 for(const [,width] of html.matchAll(/<rect[^>]*width="([^"]+)"/g))assert.ok(Number(width)>=-1e-10);
}
assert.deepEqual(sampleTrace([1,-1],[Math.log(4),Math.log(.25)],[1,-2]).output,[3,-2]);
assert.equal(klTrace([0,0],[0,0]).output,0);assert.equal(betaTrace([1,3],[.5,.25],2).output,3.5);
for(const locale of ['','zh/'])for(const [kind,id] of Object.entries(ids)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),decoded=decodeHtml(html);
 const visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests'),sources=html.indexOf('<section class="lesson-resources">');
 assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/data-reset-lesson[^>]*disabled/);
 assert.ok(html.includes(`src="${siteBase()}assets/lesson-ui.js"`));
 assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[kind]);
 if(locale){
  const en=decodeHtml(await readFile(join(siteRoot,'editorials',id,'index.html'),'utf8'));
  for(const [original,translated] of Object.entries(round7Translations))if(en.includes('>'+original+'<'))assert.ok(decoded.includes(translated),original);
  assert.doesNotMatch(decoded.slice(visual,code),/Function output|Reconstruction mean|Posterior parameters|Keep the sample explicit/);
 }
}
for(const file of ['lesson-ui-round7.js','lesson-round7-math.mjs','lesson-round7-view.mjs'])await readFile(join(siteRoot,'assets',file));
console.log(`PASS ${controlCases} reachable control states, 300 seeded traces, six bilingual pages, static fallback and unchanged Python code`);
