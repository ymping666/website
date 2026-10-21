import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {concepts} from '../src/concepts.mjs';
import {problems} from '../src/problems.mjs';
import {practiceSets} from '../src/practice-sets.mjs';
import {generativeConcept as course,generativeChapters,generativeIds} from '../src/concept-generative.mjs';
import {generativeSamples,generativeExample,renderGenerativeExample} from '../src/concept-generative-view.mjs';
import {generativeCurriculum} from './render-concept-generative.mjs';
import {loadChinese,localizeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
import {nextPractice,practiceContext} from '../src/practice.mjs';
const chapters=generativeCurriculum(concepts,problems),dictionary=(await loadChinese()).dictionary,sets=practiceSets.map(s=>({...s,ids:s.segments.map(p=>p.id)}));
assert.deepEqual(chapters.flatMap(c=>c.own),generativeIds);assert.equal(chapters.length,9);assert.equal(new Set(generativeIds).size,30);assert.equal(chapters.flatMap(c=>c.own).length,30);assert.equal(new Set(chapters.map(c=>c.group)).size,4);
assert.throws(()=>generativeCurriculum(concepts,problems.filter(p=>p.id!==generativeIds[0])),/Unpublished/);
for(let i=0;i<generativeIds.length-1;i++)assert.equal(nextPractice(problems,sets,concepts,generativeIds[i],{},{concept:course.slug}).problem.id,generativeIds[i+1]);
for(const c of chapters)for(const id of c.concept.ids)assert.equal(practiceContext(id,sets,concepts,{concept:c.slug}).concept,c.slug);
const cases=[];
for(const [kind,presets]of Object.entries(generativeSamples))for(const choice of Object.keys(presets)){
 const before=JSON.stringify(presets[choice]),result=generativeExample(kind,choice),en=renderGenerativeExample(kind,choice),zh=renderGenerativeExample(kind,choice,true);
 assert.equal(JSON.stringify(presets[choice]),before);assert.equal(Boolean(result.error),choice==='invalid');assert.equal(en.includes('data-cg-error'),choice==='invalid');assert.equal(en.includes('data-cg-output'),choice!=='invalid');assert.ok(!/NaN|undefined|Infinity/.test(en));
 assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary}),zh,kind+'/'+choice+' translation');cases.push(result);
}
assert.throws(()=>generativeExample('unknown'),RangeError);assert.throws(()=>generativeExample('forward','unknown'),RangeError);
const referenceIds=['diffusion-forward-sampling','diffusion-reconstruct-x0','diffusion-ddpm-stochastic-step','diffusion-cfg-epsilon','vae-reparameterization','vqvae-nearest-code','gan-discriminator-bce','gan-generator-nonsaturating','gan-discriminator-logit-gradients','dit-adaln-modulation','dit-adaln-zero-gate'];
const python=`import json,sys,math
from decimal import Decimal,getcontext
getcontext().prec=70
${referenceIds.map(id=>problems.find(p=>p.id===id).solution).join('\n')}
D=lambda x:Decimal(str(x))
def equal(a,b):
 if isinstance(a,list):
  assert len(a)==len(b)
  for x,y in zip(a,b):equal(x,y)
 else: assert abs(a-float(b))<=1e-10+1e-11*abs(float(b)),(a,b)
sp=lambda x:(1+x.exp()).ln()
sig=lambda x:1/(1+(-x).exp())
for c in json.load(sys.stdin):
 if c.get('error'):continue
 k=c['kind'];a=c['args'];actual=c['output']
 if k=='forward':
  expected=q_sample([2],[-1],a[0]);oracle=[2*D(a[0]).sqrt()-(1-D(a[0])).sqrt()]
 elif k=='reconstruct':
  level,bias=a;expected=predict_x0_from_eps(q_sample([2],[-1],level),[-1+bias],level);oracle=[2-((1-D(level))/D(level)).sqrt()*D(bias)]
 elif k=='noise':
  expected=ddpm_reverse_step(*a);m,v,n,t=a;oracle=D(m) if t==0 else D(m)+D(v).sqrt()*D(n)
 elif k=='cfg':
  expected=cfg_epsilon(*a);u,v,s=a;oracle=[D(x)+D(s)*(D(y)-D(x)) for x,y in zip(u,v)]
 elif k=='vae':
  m,lv,eps=a;expected=vae_sample([m],[lv],[eps])[0];oracle=D(m)+(D(lv)/2).exp()*D(eps)
 elif k=='vq':
  x,book=a;expected=nearest_code_index(*a);oracle=min(range(len(book)),key=lambda i:sum((D(v)-D(y))**2 for v,y in zip(x,book[i])))
 elif k=='disc':
  r,f=a;expected=[discriminator_loss([r],[f]),generator_loss([f])];oracle=[sp(-D(r))+sp(D(f)),sp(-D(f))]
 elif k=='grads':
  expected=discriminator_logit_grads(*a);oracle=[sig(D(a[0]))-1,sig(D(a[1]))]
 elif k=='modulation':
  expected=adaptive_layer_norm(*a);x,shift,scale,eps=a;mu=sum(map(D,x))/len(x);v=sum((D(z)-mu)**2 for z in x)/len(x);oracle=[(D(z)-mu)/(v+D(eps)).sqrt()*(1+D(s))+D(b) for z,b,s in zip(x,shift,scale)]
 elif k=='gate':
  expected=gated_adaln_residual(*a);oracle=[D(x)+D(g)*D(b) for x,b,g in zip(*a)]
 equal(actual,expected);equal(actual,oracle)
print('PASS original Python references and independent high-precision oracles for every valid generative preset')`;
const py=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify(cases),encoding:'utf8'});assert.equal(py.status,0,py.stdout+py.stderr);console.log(py.stdout.trim());
for(const locale of ['','zh/']){
 const root=await readFile(join(siteRoot,locale,'concepts',course.slug,'index.html'),'utf8');assert.equal((root.match(/class="ct-chapter-card"/g)||[]).length,9);assert.equal((root.match(/class="ct-area"/g)||[]).length,4);assert.ok(root.includes('data-progress-ids="'+generativeIds.join(',')+'"'));
 const index=await readFile(join(siteRoot,locale,'concepts/index.html'),'utf8');assert.equal([...index.matchAll(/<a class="topic-card[^"]*course-entry" href="([^"]+)"/g)].filter(m=>m[1]===`${siteBase()+locale}concepts/${course.slug}/`).length,1);assert.ok(index.includes(`href="${siteBase()+locale}concepts/${course.slug}/"`));
 for(const ch of chapters){
  assert.ok(!index.includes(`href="${siteBase()+locale}concepts/${ch.slug}/"`));assert.ok(root.includes(`href="${siteBase()+locale}concepts/${ch.slug}/"`));
  const html=await readFile(join(siteRoot,locale,'concepts',ch.slug,'index.html'),'utf8'),main=html.match(/<main[\s\S]*?<\/main>/)[0];assert.equal((main.match(/<h1\b/g)||[]).length,1);assert.ok(!main.includes('adsbygoogle'));assert.ok(main.includes(`href="${siteBase()+locale}concepts/${course.slug}/"`));
  if(ch.standalone){assert.ok(main.includes('data-concept-flow'));assert.ok(main.includes('?set=flow-matching-ode-practice'));}else{for(const kind of ch.experiments)assert.ok(main.includes('data-generative-example="'+kind+'"'));for(const id of ch.concept.ids)assert.ok(main.includes(`href="${siteBase()+locale}problems/${id}/?concept=${course.slug}"`));assert.equal((main.match(/data-solved=/g)||[]).length,ch.concept.ids.length);}
  if(process.env.SITE_ORIGIN)assert.ok(html.includes(`rel="canonical" href="${process.env.SITE_ORIGIN.replace(/\/$/,'')+siteBase()+locale}concepts/${ch.slug}/"`));
 }
 const collection=await readFile(join(siteRoot,locale,'practice-sets/generative-models-and-flows/index.html'),'utf8');assert.ok(collection.includes(`href="${siteBase()+locale}concepts/${course.slug}/"`));
}
console.log(`PASS 30 distinct exercises, 9 retained chapter URLs, 4 directions, ${cases.length*2} bilingual example states, old contexts and original Flow Matching lesson`);
