import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {stateEstimationLesson as lesson,stateLessonTranslations} from '../src/concept-state-lesson.mjs';
import {statePresets,stateCorrection,renderStateCorrection,stateViewTranslations} from '../src/concept-state-view.mjs';
import {stateLessonStages} from './render-concept-state.mjs';
import {linearTrace,beliefTrace} from '../src/lesson-round18-math.mjs';
import {bayesTrace,bayesTransitions} from '../src/lesson-frontier-math.mjs';
import {problems} from '../src/problems.mjs';
import {concepts} from '../src/concepts.mjs';
import {practiceSets} from '../src/practice-sets.mjs';
import {nextPractice} from '../src/practice.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
import {loadChinese,localizeHtml} from './localize.mjs';
const concept=concepts.find(c=>c.slug===lesson.slug),stages=stateLessonStages(concept,problems),ids=stages.map(s=>s.id),dictionary=(await loadChinese()).dictionary;
assert.equal(ids.length,4);assert.deepEqual(ids,concept.ids);
// New labels must not silently rename existing exercises or their test cases.
const localeDir=new URL('../src/locales/',import.meta.url),translated=(await Promise.all((await readdir(localeDir)).filter(n=>/^zh-content-.*\.json$/.test(n)).map(async n=>JSON.parse(await readFile(new URL(n,localeDir),'utf8'))))).flat(),byId=new Map(translated.map(p=>[p.id||p.slug,p])),contentDictionary={};
for(const item of [...problems,...concepts,...practiceSets]){
 const zh=byId.get(item.id||item.slug);
 for(const field of ['title','description','requirements','explanation','pitfall','hints','complexity','summary','prerequisites','subtitle','audience','outcomes','caution']){
  if(typeof item[field]==='string')contentDictionary[item[field]]=zh[field];
  else if(Array.isArray(item[field]))item[field].forEach((s,i)=>contentDictionary[s]=zh[field][i]);
 }
 item.tests?.forEach((test,i)=>contentDictionary[test.name]=zh.testNames[i]);item.segments?.forEach((segment,i)=>contentDictionary[segment.note]=zh.notes[i]);
}
for(const [en,zh]of Object.entries({...stateLessonTranslations,...stateViewTranslations}))if(en in contentDictionary)assert.equal(zh,contentDictionary[en],'Content translation collision: '+en);
assert.throws(()=>stateLessonStages({...concept,ids:[...ids].reverse()},problems),/order/);
assert.throws(()=>stateLessonStages(concept,problems.filter(p=>p.id!==ids[0])),/Unpublished/);
const cases=[];
for(let p=0;p<=16;p++)for(let r=0;r<=16;r++)for(let z=6;z<=14;z++){
 const state=stateCorrection(p,r,z),en=renderStateCorrection(p,r,z),zh=renderStateCorrection(p,r,z,true);
 assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary}),zh,`translation ${p}/${r}/${z}`);
 assert.ok(!/NaN|Infinity|undefined/.test(en));cases.push(state);
 if(state.error){assert.equal(state.trace,null);assert.ok(en.includes('data-cs-error'));assert.ok(!en.includes('id="cs-mean"'));}
 else{const tr=state.trace;assert.ok(tr.gain>=0&&tr.gain<=1);assert.ok(tr.updatedMean>=Math.min(10,z)-1e-12&&tr.updatedMean<=Math.max(10,z)+1e-12);assert.ok(tr.updatedVariance>=-1e-12&&tr.updatedVariance<=p+1e-12);if(p>0&&r<16)assert.ok(stateCorrection(p,r+1,z).trace.gain<=tr.gain);}
}
for(const args of [[-1,4,14],[4,-1,14],[17,4,14],[4,17,14],[4,4,5],[4,4,15],[NaN,4,14],[4,Infinity,14],['4',4,14],[4,4,null]])assert.throws(()=>stateCorrection(...args),RangeError);
for(const preset of Object.values(statePresets))assert.equal(stateCorrection(preset.p,preset.r,preset.z).error,preset.p+preset.r===0);
assert.deepEqual(stateCorrection().trace.output,[12,2]);assert.deepEqual(stateCorrection(4,4,6).trace.output,[8,2]);assert.deepEqual(stateCorrection(0,4,14).trace.output,[10,0]);assert.deepEqual(stateCorrection(4,0,14).trace.output,[14,0]);
const worked={linear:linearTrace(1,[2],2,3),belief:beliefTrace(0,1,1,.5,[2,3]),contract:beliefTrace(0,4,.5,.25,[0]),bayes:bayesTrace([.8,.2],bayesTransitions.drift,[.25,.75])};
assert.deepEqual(worked.linear.output,[1,8]);assert.deepEqual(worked.belief.output,[[2,1.5],[5,2]]);assert.equal(worked.contract.output[0][1],1.25);
const core=ids.map(id=>problems.find(p=>p.id===id));
const py=`import json,sys,math\nfrom fractions import Fraction as F\n${core.map(p=>p.solution).join('\n')}\ndata=json.load(sys.stdin)\nfor case in data['cases']:\n p,r,z=case['p'],case['r'],case['z']\n if p+r==0:\n  assert case['error'] and case['trace'] is None\n  continue\n tr=case['trace'];expected=[float((F(r)*10+F(p)*z)/(p+r)),float(F(p*r,p+r))]\n assert all(abs(a-b)<1e-12 for a,b in zip(kalman_update(10,p,z,r),expected))\n assert all(abs(a-b)<1e-12 for a,b in zip(tr['output'],expected))\n assert abs(tr['gain']-float(F(p,p+r)))<1e-12\n assert abs(tr['innovation']-(z-10))<1e-12\n assert abs(tr['correction']-float(F(p,p+r)*(z-10)))<1e-12\n${core.flatMap(p=>p.tests.map(t=>t.code)).join('\n')}\nassert rollout_linear(1,[2],2,3)==data['worked']['linear']['output']\nassert [list(pair) for pair in propagate_belief(0,1,1,.5,[2,3])]==data['worked']['belief']['output']\nassert propagate_belief(0,4,.5,.25,[0])[0][1]==float(F(5,4))\nexpected=[float(F(19,37)),float(F(18,37))]\nactual=belief_update([.8,.2],[[.9,.1],[.2,.8]],[.25,.75])\nassert all(abs(a-b)<1e-12 for a,b in zip(actual,expected))\nassert all(abs(a-b)<1e-12 for a,b in zip(data['worked']['bayes']['posterior'],expected))\nnamespace={'variance':4,'measurement_variance':4}\nexec(data['snippet'],namespace)\nassert namespace['gain']==.5\nprint('PASS 2601 correction states vs Python and independent Fraction oracle; four original solution suites; all static numerical examples and gain snippet')`;
const result=spawnSync(pythonCommand,['-c',py],{input:JSON.stringify({cases,worked,snippet:lesson.code}),encoding:'utf8'});assert.equal(result.status,0,result.stdout+result.stderr);console.log(result.stdout.trim());
const sets=practiceSets.map(s=>({...s,ids:s.segments.map(p=>p.id)}));for(let i=0;i<3;i++)assert.equal(nextPractice(problems,sets,concepts,ids[i],{},{concept:concept.slug}).problem.id,ids[i+1]);
for(const locale of ['','zh/']){
 const html=await readFile(join(siteRoot,locale,'concepts',lesson.slug,'index.html'),'utf8'),main=html.match(/<main\b[\s\S]*?<\/main>/)[0];
 assert.equal((main.match(/<h1\b/g)||[]).length,1);assert.equal((main.match(/class="cf-section"/g)||[]).length,7);assert.equal((main.match(/class="cf-stage"/g)||[]).length,4);assert.equal((main.match(/data-solved=/g)||[]).length,4);
 for(const id of ids){assert.ok(main.includes(`href="${siteBase()+locale}problems/${id}/?concept=${lesson.slug}"`));for(const kind of ['problems','editorials'])await readFile(join(siteRoot,locale,kind,id,'index.html'));}
 assert.ok(main.includes(`href="${siteBase()+locale}practice-sets/world-model-planning/"`));
 for(const id of ['p','r','z'])assert.match(main,new RegExp(`id="cs-${id}"[^>]*disabled`));assert.match(main,/id="cs-preset" disabled/);
 assert.ok(main.includes('<noscript>')&&main.includes('id="cs-mean">12</output>'));
 assert.ok(main.includes('id="cs-variance">2</output>')&&main.includes('id="cs-gain">0.5</output>'));assert.ok(main.includes('data-notation="K = P/(P+R)"'));
 assert.ok(!main.includes('adsbygoogle')&&!main.includes('def kalman_update')&&!main.includes('def belief_update'));
 for(const r of lesson.references)assert.ok(main.includes(r.url));
 for(const [en,zh]of Object.entries(dictionary).filter(([en])=>en.length>28&&main.includes(escape(en))))assert.ok(!locale||en===zh,'Untranslated '+en);
 if(process.env.SITE_ORIGIN){const url=process.env.SITE_ORIGIN.replace(/\/$/,'')+siteBase()+locale+'concepts/state-estimation/';assert.ok(html.includes(`rel="canonical" href="${url}"`)&&html.includes('hreflang="en"')&&html.includes('hreflang="zh-CN"'));}
}
function escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
console.log('PASS 5202 localized renders, zero-total error/no fake result, static/no-JS teaching, four-problem context, references and localized math');
