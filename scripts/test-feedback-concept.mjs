import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {concepts} from '../src/concepts.mjs';
import {problems} from '../src/problems.mjs';
import {practiceSets} from '../src/practice-sets.mjs';
import {feedbackConcept as course,feedbackIds} from '../src/concept-feedback.mjs';
import {feedbackSamples,feedbackExample,renderFeedbackExample} from '../src/concept-feedback-view.mjs';
import {feedbackCurriculum} from './render-concept-feedback.mjs';
import {loadChinese,localizeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
import {nextPractice,practiceContext} from '../src/practice.mjs';
const chapters=feedbackCurriculum(concepts,problems),dictionary=(await loadChinese()).dictionary,sets=practiceSets.map(s=>({...s,ids:s.segments.map(p=>p.id)}));
assert.deepEqual(chapters.flatMap(c=>c.own),feedbackIds);assert.equal(chapters.length,2);assert.equal(new Set(feedbackIds).size,6);assert.equal(new Set(chapters.map(c=>c.group)).size,2);
assert.throws(()=>feedbackCurriculum(concepts,problems.filter(p=>p.id!==feedbackIds[0])),/Unpublished/);
for(let i=0;i<feedbackIds.length-1;i++)assert.equal(nextPractice(problems,sets,concepts,feedbackIds[i],{},{concept:course.slug}).problem.id,feedbackIds[i+1]);
for(const c of chapters)for(const id of c.concept.ids)assert.equal(practiceContext(id,sets,concepts,{concept:c.slug}).concept,c.slug);
const cases=[];
for(const [kind,presets]of Object.entries(feedbackSamples))for(const choice of Object.keys(presets)){
 const before=JSON.stringify(presets[choice]),result=feedbackExample(kind,choice),en=renderFeedbackExample(kind,choice),zh=renderFeedbackExample(kind,choice,true),error=['invalid','over','unknown'].includes(choice);
 assert.equal(JSON.stringify(presets[choice]),before);assert.equal(result.error,error,kind+'/'+choice);assert.equal(en.includes('data-cf-error'),error);assert.equal(en.includes('data-cf-output'),!error);assert.ok(!/NaN|undefined|Infinity/.test(en));
 assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary}),zh,kind+'/'+choice+' translation');cases.push(result);
}
assert.throws(()=>feedbackExample('unknown'),RangeError);assert.throws(()=>feedbackExample('episode','unknown'),RangeError);
assert.equal(feedbackExample('revision','unknown').tr.error,0,'An invalid first revision must not look like success');
assert.equal(feedbackExample('episode','success').output,'private_eval');
assert.equal(feedbackExample('reward','negative').output,1,'Signed shaping can increase an intermediate reward without establishing correctness');
assert.equal(feedbackExample('reward','success').output,feedbackExample('reward','repeat').output);
assert.ok(feedbackExample('loss','matched').output>0);assert.ok(feedbackExample('loss','matched').output<feedbackExample('loss','uncertain').output);assert.ok(feedbackExample('loss','confident').output>feedbackExample('loss','uncertain').output);
const python=`import json,sys,math,itertools
from decimal import Decimal,getcontext
getcontext().prec=75
${feedbackIds.map(id=>problems.find(p=>p.id===id).solution).join('\n')}
D=lambda x:Decimal(str(x))
def eq(a,b):
 if isinstance(a,(list,tuple)):
  assert len(a)==len(b),(a,b)
  for x,y in zip(a,b):eq(x,y)
 elif isinstance(a,str):assert a==b,(a,b)
 else:assert abs(a-float(b))<=1e-10+1e-11*abs(float(b)),(a,b)
for c in json.load(sys.stdin):
 k=c['kind'];a=c['args'];actual=c['output']
 if c['error']:
  assert actual is None
  if k in ['episode','revision']:
   try:(rlef_episode_action if k=='episode' else revision_training_pairs)(*a)
   except ValueError:pass
   else:raise AssertionError('reference accepted invalid state')
  continue
 if k=='episode':
  h,limit=a;expected=rlef_episode_action(*a);first_success=next((i+1 for i,v in enumerate(h) if v),None);oracle='private_eval' if first_success is not None or len(h)==limit else 'retry'
 elif k=='reward':
  v,t,p,pi,ref,beta=a;expected=rlef_turn_reward(*a);base=(D(1) if p else D(-1)) if t else (D(0) if v else D('-.2'));oracle=base-D(beta)*sum((D(x)-D(y) for x,y in zip(pi,ref)),D(0))/len(pi)
 elif k=='advantage':
  rewards,values=a;expected=rlef_advantages(*a);oracle=[sum(map(D,rewards[i:]),D(0))-D(value) for i,value in enumerate(values)];eq(c['tr']['returns'],[sum(map(D,rewards[i:]),D(0)) for i in range(len(rewards))])
 elif k=='revision':
  prompt,initial,allowed,rounds=a;expected=revision_training_pairs(*a);sources=[initial]+[r['revision'] for r in rounds[:-1]];assert all(row['source']==source and row['principle'] in allowed for row,source in zip(rounds,sources));oracle=[(prompt,r['revision']) for r in rounds]
 elif k=='preference':
  x,y,clamp=a;expected=ai_preference_label(*a);weight_x=D(x).exp();weight_y=D(y).exp();q=weight_x/(weight_x+weight_y);q=min(D('.6'),max(D('.4'),q)) if clamp else q;oracle=[q,1-q]
 elif k=='loss':
  d,q=a;expected=soft_preference_loss([d],[0],[q]);d=D(d);q=D(q);oracle=q*(1+(-d).exp()).ln()+(1-q)*(1+d.exp()).ln()
 eq(actual,expected);eq(actual,oracle)
# Independent stopping-index grammar for every small public-test history.
count=0
for budget in range(1,6):
 for n in range(budget+2):
  for bits in itertools.product([False,True],repeat=n):
   first=next((i+1 for i,v in enumerate(bits) if v),budget);valid=n<=min(budget,first)
   try:out=rlef_episode_action(list(bits),budget)
   except ValueError:assert not valid
   else:assert valid and out==('private_eval' if n==budget or any(bits) else 'retry')
   count+=1
print('PASS all feedback presets vs original Python, Decimal/lineage/suffix-sum oracles, and',count,'stopping histories')`;
const py=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify(cases),encoding:'utf8'});assert.equal(py.status,0,py.stdout+py.stderr);console.log(py.stdout.trim());
for(const locale of ['','zh/']){
 const root=await readFile(join(siteRoot,locale,'concepts',course.slug,'index.html'),'utf8');assert.equal((root.match(/class="ct-chapter-card"/g)||[]).length,2);assert.equal((root.match(/class="ct-area"/g)||[]).length,2);assert.ok(root.includes('data-progress-ids="'+feedbackIds.join(',')+'"'));
 const index=await readFile(join(siteRoot,locale,'concepts/index.html'),'utf8');assert.equal([...index.matchAll(/<a class="topic-card[^"]*course-entry" href="([^"]+)"/g)].filter(m=>m[1]===`${siteBase()+locale}concepts/${course.slug}/`).length,1);
 for(const ch of chapters){
  assert.ok(!index.includes(`href="${siteBase()+locale}concepts/${ch.slug}/"`));assert.ok(root.includes(`href="${siteBase()+locale}concepts/${ch.slug}/"`));
  const html=await readFile(join(siteRoot,locale,'concepts',ch.slug,'index.html'),'utf8'),main=html.match(/<main[\s\S]*?<\/main>/)[0];assert.equal((main.match(/<h1\b/g)||[]).length,1);assert.ok(!main.includes('adsbygoogle'));assert.ok(main.includes(`href="${siteBase()+locale}concepts/${course.slug}/"`));
  for(const kind of ch.experiments)assert.ok(main.includes('data-feedback-example="'+kind+'"'));for(const id of ch.concept.ids)assert.ok(main.includes(`href="${siteBase()+locale}problems/${id}/?concept=${course.slug}"`));assert.equal((main.match(/data-solved=/g)||[]).length,3);
  if(process.env.SITE_ORIGIN)assert.ok(html.includes(`rel="canonical" href="${process.env.SITE_ORIGIN.replace(/\/$/,'')+siteBase()+locale}concepts/${ch.slug}/"`));
 }
 for(const collection of ['agents-and-execution','llm-systems-and-feedback'])assert.ok((await readFile(join(siteRoot,locale,'practice-sets',collection,'index.html'),'utf8')).includes(`href="${siteBase()+locale}concepts/${course.slug}/"`));
}
console.log(`PASS 6 existing exercises, 2 independent paths and retained chapter URLs; ${cases.length*2} bilingual example states; old practice contexts preserved`);
