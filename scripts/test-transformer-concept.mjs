import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {concepts} from '../src/concepts.mjs';
import {problems} from '../src/problems.mjs';
import {practiceSets} from '../src/practice-sets.mjs';
import {transformerConcept as course,transformerIds,transformerChapters} from '../src/concept-transformer.mjs';
import {transformerSamples,transformerExample,renderTransformerExample} from '../src/concept-transformer-view.mjs';
import {transformerCurriculum} from './render-concept-transformer.mjs';
import {nextPractice,practiceContext} from '../src/practice.mjs';
import {loadChinese,localizeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
const chapters=transformerCurriculum(concepts,problems),dictionary=(await loadChinese()).dictionary,sets=practiceSets.map(s=>({...s,ids:s.segments.map(p=>p.id)})),cases=[];
assert.equal(chapters.length,7);assert.equal(new Set(transformerIds).size,15);assert.equal(chapters.flatMap(c=>c.own).length,15);assert.equal(chapters.flatMap(c=>c.shared).length,4);assert.equal(new Set(chapters.flatMap(c=>c.concept.ids)).size,15);
assert.throws(()=>transformerCurriculum(concepts,problems.filter(p=>p.id!==transformerIds[0])),/Unpublished/);
for(let i=0;i<transformerIds.length-1;i++)assert.equal(nextPractice(problems,sets,concepts,transformerIds[i],{},{concept:course.slug}).problem.id,transformerIds[i+1]);
for(const c of chapters)for(const id of c.concept.ids)assert.equal(practiceContext(id,sets,concepts,{concept:c.slug}).concept,c.slug,'Old bookmarked context stays valid');
for(const[kind,samples]of Object.entries(transformerSamples))for(const choice of Object.keys(samples)){
 const before=JSON.stringify(samples[choice]),result=transformerExample(kind,choice),en=renderTransformerExample(kind,choice),zh=renderTransformerExample(kind,choice,true);
 assert.equal(JSON.stringify(samples[choice]),before,'Immutable supplied inputs');assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary}),zh,kind+'/'+choice+' localization');
 assert.ok(!/NaN|undefined/.test(en));assert.equal(en.includes('data-ct-error'),Boolean(result.error));if(result.error)assert.ok(!en.includes('data-ct-output'));cases.push(result);
}
for(const args of [['absent'],['attention','absent']])assert.throws(()=>transformerExample(...args),RangeError);
const refIds={'attention':'attention-scaled-dot-product','heads':'attention-split-heads','block':'foundation-layer-normalization','mask':'attention-key-padding-mask','rope':'rope-rotate-pair','swiglu':'transformer-swiglu','vit':'vit-patchify'},refs=Object.values(refIds).map(id=>problems.find(p=>p.id===id).solution).join('\n');
const py=`import json,sys,math\nfrom decimal import Decimal,getcontext\ngetcontext().prec=60\n${refs}\ndef equal(a,b):\n if isinstance(a,list):\n  assert len(a)==len(b)\n  for x,y in zip(a,b): equal(x,y)\n elif a=='-inf': assert b==float('-inf')\n else: assert abs(a-b)<1e-11,(a,b)\nfor case in json.load(sys.stdin):\n if case.get('error'): continue\n kind=case['kind'];args=case['args'];actual=case['output']\n if kind=='attention':\n  q=args[0];k=[[1,0],[0,1]];v=[[2,0],[0,4]]\n  expected=scaled_attention(q,k,v)\n  logits=[Decimal(str(x))/Decimal(2).sqrt() for x in q]\n  exps=[x.exp() for x in logits];den=sum(exps)\n  oracle=[float(2*exps[0]/den),float(4*exps[1]/den)]\n  equal(actual,oracle)\n elif kind=='heads':\n  tokens=[[1,2,3,4],[5,6,7,8]];h=args[0];expected=split_heads(tokens,h)\n  oracle=[[[row[c] for c in range(i*(4//h),(i+1)*(4//h))] for row in tokens] for i in range(h)]\n  equal(actual,oracle)\n elif kind=='block':\n  expected=layer_norm(*args);x,eps=args;values=[Decimal(str(v)) for v in x];m=sum(values)/len(values);variance=sum((v-m)**2 for v in values)/len(values)\n  equal(actual,[float((v-m)/(variance+Decimal(str(eps))).sqrt()) for v in values])\n elif kind=='mask':\n  expected=mask_key_padding(*args);equal(actual,[score if valid else float('-inf') for score,valid in zip(*args)])\n  logits=[Decimal(str(score)) if valid else None for score,valid in zip(*args)];exps=[x.exp() if x is not None else Decimal(0) for x in logits];den=sum(exps)\n  equal(case['tr']['probabilities'],[float(x/den) for x in exps])\n elif kind=='rope':\n  expected=rope_pair(*args);angle=args[2];equal(actual,[round(math.cos(angle)),round(math.sin(angle))]);assert abs(sum(x*x for x in actual)-1)<1e-12\n elif kind=='swiglu':\n  expected=swiglu_gate(*args);equal(actual,[float(Decimal(str(x))*Decimal(str(g))/(1+(-Decimal(str(g))).exp())) for x,g in zip(*args)])\n elif kind=='vit':\n  image=[[r*4+c+1 for c in range(4)] for r in range(4)];p=args[0];expected=patchify(image,p)\n  oracle=[[1+(br*p+dr)*4+bc*p+dc for dr in range(p) for dc in range(p)] for br in range(4//p) for bc in range(4//p)]\n  equal(actual,oracle)\n equal(actual,expected)\nprint('PASS all chapter examples against original Python and independent Decimal/index/trigonometric oracles')`;
const result=spawnSync(pythonCommand,['-c',py],{input:JSON.stringify(cases,(_,v)=>v===-Infinity?'-inf':v),encoding:'utf8'});assert.equal(result.status,0,result.stdout+result.stderr);console.log(result.stdout.trim());
for(const locale of ['','zh/']){
 const root=await readFile(join(siteRoot,locale,'concepts',course.slug,'index.html'),'utf8');assert.equal((root.match(/<h1\b/g)||[]).length,1);assert.equal((root.match(/class="ct-chapter-card"/g)||[]).length,7);assert.equal((root.match(/class="ct-area"/g)||[]).length,3);assert.ok(root.includes('data-progress-ids="'+transformerIds.join(',')+'"'));
 const index=await readFile(join(siteRoot,locale,'concepts/index.html'),'utf8');assert.equal((index.match(/course-entry/g)||[]).length,1);assert.ok(index.includes(`href="${siteBase()+locale}concepts/${course.slug}/"`));
 for(const ch of chapters){
  assert.ok(!index.includes(`href="${siteBase()+locale}concepts/${ch.slug}/"`),'Chapter hidden from top-level cards');
  const html=await readFile(join(siteRoot,locale,'concepts',ch.slug,'index.html'),'utf8'),main=html.match(/<main[\s\S]*?<\/main>/)[0];assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.ok(html.includes('data-transformer-example="'+ch.kind+'"'));assert.ok(html.includes('<noscript>')&&html.includes('id="ct-example" disabled'));
  assert.equal((main.match(/data-solved=/g)||[]).length,ch.concept.ids.length);for(const id of ch.concept.ids)assert.ok(main.includes(`href="${siteBase()+locale}problems/${id}/?concept=${course.slug}"`));
  assert.ok(main.includes(transformerChapters.find(c=>c.slug===ch.slug).lead)||locale);assert.ok(!main.includes('adsbygoogle'));assert.ok(!main.includes('def scaled_attention'));
  if(process.env.SITE_ORIGIN)assert.ok(html.includes(`rel="canonical" href="${process.env.SITE_ORIGIN.replace(/\/$/,'')+siteBase()+locale}concepts/${ch.slug}/"`));
 }
 const collection=await readFile(join(siteRoot,locale,'practice-sets/attention-and-transformers/index.html'),'utf8');assert.ok(collection.includes(`href="${siteBase()+locale}concepts/${course.slug}/"`));
}
console.log(`PASS 15 distinct exercises, 7 retained chapter URLs, 3 areas, ${cases.length*2} bilingual example states, unique progress/navigation, old contexts and one top-level entry`);
