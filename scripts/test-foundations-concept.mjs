import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {concepts} from '../src/concepts.mjs';
import {problems} from '../src/problems.mjs';
import {practiceSets} from '../src/practice-sets.mjs';
import {foundationsConcept as course,foundationsChapters,foundationsIds} from '../src/concept-foundations.mjs';
import {foundationsSamples,foundationsExample,renderFoundationsExample} from '../src/concept-foundations-view.mjs';
import {foundationsCurriculum} from './render-concept-foundations.mjs';
import {loadChinese,localizeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
import {nextPractice,practiceContext} from '../src/practice.mjs';
const chapters=foundationsCurriculum(concepts,problems),dictionary=(await loadChinese()).dictionary,sets=practiceSets.map(s=>({...s,ids:s.segments.map(p=>p.id)}));
assert.deepEqual(chapters.flatMap(c=>c.own),foundationsIds);assert.equal(chapters.length,8);assert.equal(new Set(foundationsIds).size,23);assert.equal(chapters.flatMap(c=>c.own).length,23);assert.equal(new Set(chapters.map(c=>c.group)).size,5);
assert.throws(()=>foundationsCurriculum(concepts,problems.filter(p=>p.id!==foundationsIds[0])),/Unpublished/);
for(let i=0;i<foundationsIds.length-1;i++)assert.equal(nextPractice(problems,sets,concepts,foundationsIds[i],{},{concept:course.slug}).problem.id,foundationsIds[i+1]);
for(const c of chapters)for(const id of c.concept.ids)assert.equal(practiceContext(id,sets,concepts,{concept:c.slug}).concept,c.slug);
const cases=[];
for(const [kind,presets]of Object.entries(foundationsSamples))for(const choice of Object.keys(presets)){
 const before=JSON.stringify(presets[choice]),result=foundationsExample(kind,choice),en=renderFoundationsExample(kind,choice),zh=renderFoundationsExample(kind,choice,true);
 assert.equal(JSON.stringify(presets[choice]),before);assert.equal(Boolean(result.error),(choice==='invalid'||(kind==='softmax'&&choice==='empty')));assert.equal(en.includes('data-cn-error'),(choice==='invalid'||(kind==='softmax'&&choice==='empty')));assert.equal(en.includes('data-cn-output'),!result.error);assert.ok(!/NaN|undefined|Infinity/.test(en));
 assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary}),zh,kind+'/'+choice+' translation');cases.push(result);
}
assert.throws(()=>foundationsExample('unknown'),RangeError);assert.throws(()=>foundationsExample('softmax','unknown'),RangeError);
const referenceIds=foundationsIds.filter(id=>!['foundation-gelu','foundation-sinusoidal-positions','autograd-relu-backward','autograd-central-difference'].includes(id));
const python=`import json,sys,math
from decimal import Decimal,getcontext
getcontext().prec=65
${referenceIds.map(id=>problems.find(p=>p.id===id).solution).join('\n')}
D=lambda x:Decimal(str(x))
def eq(a,b):
 if isinstance(a,(list,tuple)):
  assert len(a)==len(b),(a,b)
  for x,y in zip(a,b):eq(x,y)
 else: assert abs(a-float(b))<1e-9+1e-10*abs(float(b)),(a,b)
def oracle_norm(batch,gain,bias,eps,means=None,variances=None):
 n=len(batch);d=len(gain)
 if means is None:means=[sum(D(row[j]) for row in batch)/n for j in range(d)]
 if variances is None:variances=[sum((D(row[j])-D(means[j]))**2 for row in batch)/n for j in range(d)]
 return [[D(gain[j])*(D(x)-D(means[j]))/(D(variances[j])+D(eps)).sqrt()+D(bias[j]) for j,x in enumerate(row)] for row in batch]
def spatial(image,kernel,same):
 h=len(image);w=len(image[0]);kh=len(kernel);kw=len(kernel[0]);ph=kh//2 if same else 0;pw=kw//2 if same else 0
 out=[]
 for i in range(h if same else h-kh+1):
  row=[]
  for j in range(w if same else w-kw+1):
   total=D(0)
   for y in range(kh):
    for x in range(kw):
     r=i+y-ph;c=j+x-pw
     if 0<=r<h and 0<=c<w:total+=D(image[r][c])*D(kernel[y][x])
   row.append(total)
  out.append(row)
 return out
for c in json.load(sys.stdin):
 if c.get('error'):continue
 k=c['kind'];a=c['args'];actual=c['output']
 if k=='softmax':
  expected=stable_softmax(*a);scores=[D(v)/D(a[1]) for v in a[0]];weights=[(v-max(scores)).exp() for v in scores];oracle=[v/sum(weights) for v in weights]
 elif k=='matmul':
  expected=matmul(*a);A,B=a;oracle=[[sum(D(x)*D(y) for x,y in zip(row,col)) for col in zip(*B)] for row in A]
 elif k=='conv':
  im,ke,mode=a;expected=(conv2d_same if mode=='same' else conv2d_valid)(im,ke);oracle=spatial(im,ke,mode=='same')
 elif k=='point':
  expected=pointwise_conv(*a);channels,W,b=a;oracle=[[[D(b[o])+sum(D(weights[c])*D(channels[c][i][j]) for c in range(len(channels))) for j in range(len(channels[0][0]))] for i in range(len(channels[0]))] for o,weights in enumerate(W)]
 elif k=='pool':
  im=a[0];expected=[max_pool2d(im),avg_pool2d(im)];windows=[[[im[2*i+y][2*j+x] for y in range(2) for x in range(2)] for j in range(len(im[0])//2)] for i in range(len(im)//2)];oracle=[[[max(v) for v in row] for row in windows],[[sum(map(D,v))/4 for v in row] for row in windows]]
 elif k=='batch':
  batch,g,b,eps,mu,var=a;expected=[batch_norm_train(batch,g,b,eps),batch_norm_eval(batch,mu,var,g,b,eps)];oracle=[oracle_norm(batch,g,b,eps),oracle_norm(batch,g,b,eps,mu,var)]
 elif k=='rms':
  x,g,eps=a;expected=[layer_norm(x,eps),rms_norm(x,eps),rms_norm_gain(x,g,eps)];d=len(x);mu=sum(map(D,x))/d;var=sum((D(v)-mu)**2 for v in x)/d;r=(sum(D(v)**2 for v in x)/d+D(eps)).sqrt();oracle=[[(D(v)-mu)/(var+D(eps)).sqrt() for v in x],[D(v)/r for v in x],[D(v)*D(gain)/r for v,gain in zip(x,g)]]
 elif k=='backward':
  x,W,b,target=a;p=linear_forward(x,W,b);g=mse_gradient(p,target);expected=[p,g,*linear_backward(x,W,g)]
  # Finite-difference every input, weight and bias of the composed scalar loss.
  def loss(x,W,b):return sum((sum(w*v for w,v in zip(row,x))+bias-y)**2 for row,bias,y in zip(W,b,target))/len(target)
  def derivative(f,value):
   h=1e-4;return (f(value+h)-f(value-h))/(2*h)
  dx=[derivative(lambda v:loss(x[:i]+[v]+x[i+1:],W,b),old) for i,old in enumerate(x)]
  dw=[[derivative(lambda v:loss(x,W[:o]+[row[:i]+[v]+row[i+1:]]+W[o+1:],b),old) for i,old in enumerate(row)] for o,row in enumerate(W)]
  db=[derivative(lambda v:loss(x,W,b[:i]+[v]+b[i+1:]),old) for i,old in enumerate(b)]
  oracle=[p,g,dx,dw,db]
 elif k=='clip':
  expected=clip_global_norm(*a);g,b=a;norm=sum((D(v)**2 for v in g),D(0)).sqrt();scale=min(D(1),D(b)/norm) if norm else D(1);oracle=[D(v)*scale for v in g]
 elif k=='momentum':
  grads,lr,mu,steps,vel=a;p=3;op=D(3);ov=D(vel)
  for g in grads[:steps]:p,vel=sgd_momentum(p,g,vel,lr,mu);ov=D(mu)*ov+D(g);op-=D(lr)*ov
  expected=[p,vel];oracle=[op,ov]
 elif k=='adam':
  expected=adamw_step(*a);p,g,m,v,step,lr,b1,b2,eps,wd=a;m1=D(b1)*D(m)+(1-D(b1))*D(g);v1=D(b2)*D(v)+(1-D(b2))*D(g)**2;mh=m1/(1-D(b1)**step);vh=v1/(1-D(b2)**step);oracle=[D(p)*(1-D(lr)*D(wd))-D(lr)*mh/(vh.sqrt()+D(eps)),m1,v1]
  eq(c['tr']['rows'][0]['mh'],adam_bias_correction(float(m1),float(v1),b1,b2,step)[0]);eq(c['tr']['rows'][0]['vh'],vh)
 eq(actual,expected);eq(actual,oracle)
print('PASS original Python references, Decimal/index-based oracles, and independent finite differences')`;
const py=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify(cases),encoding:'utf8'});assert.equal(py.status,0,py.stdout+py.stderr);console.log(py.stdout.trim());
for(const locale of ['','zh/']){
 const root=await readFile(join(siteRoot,locale,'concepts',course.slug,'index.html'),'utf8');assert.equal((root.match(/class="ct-chapter-card"/g)||[]).length,8);assert.equal((root.match(/class="ct-area"/g)||[]).length,5);assert.ok(root.includes('data-progress-ids="'+foundationsIds.join(',')+'"'));
 const index=await readFile(join(siteRoot,locale,'concepts/index.html'),'utf8');assert.equal([...index.matchAll(/<a class="topic-card[^"]*course-entry" href="([^"]+)"/g)].filter(m=>m[1]===`${siteBase()+locale}concepts/${course.slug}/`).length,1);assert.ok(index.includes(`href="${siteBase()+locale}concepts/${course.slug}/"`));
 for(const ch of chapters){
  assert.ok(!index.includes(`href="${siteBase()+locale}concepts/${ch.slug}/"`));assert.ok(root.includes(`href="${siteBase()+locale}concepts/${ch.slug}/"`));
  const html=await readFile(join(siteRoot,locale,'concepts',ch.slug,'index.html'),'utf8'),main=html.match(/<main[\s\S]*?<\/main>/)[0];assert.equal((main.match(/<h1\b/g)||[]).length,1);assert.ok(!main.includes('adsbygoogle'));assert.ok(main.includes(`href="${siteBase()+locale}concepts/${course.slug}/"`));
  {for(const kind of ch.experiments)assert.ok(main.includes('data-foundations-example="'+kind+'"'));for(const id of ch.concept.ids)assert.ok(main.includes(`href="${siteBase()+locale}problems/${id}/?concept=${course.slug}"`));assert.equal((main.match(/data-solved=/g)||[]).length,ch.concept.ids.length);}
  if(process.env.SITE_ORIGIN)assert.ok(html.includes(`rel="canonical" href="${process.env.SITE_ORIGIN.replace(/\/$/,'')+siteBase()+locale}concepts/${ch.slug}/"`));
 }
 const collection=await readFile(join(siteRoot,locale,'practice-sets/neural-network-training/index.html'),'utf8');assert.ok(collection.includes(`href="${siteBase()+locale}concepts/${course.slug}/"`));
}
console.log(`PASS 23 distinct exercises, 8 retained chapter URLs, 5 directions, ${cases.length*2} bilingual example states, old contexts and shared completion contexts`);
