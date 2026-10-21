import {transformerConcept,transformerChapterFor} from '../src/concept-transformer.mjs';
import {generativeConcept,generativeChapterFor} from '../src/concept-generative.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {problems} from '../src/problems.mjs';
import {concepts} from '../src/concepts.mjs';
import {practiceSets} from '../src/practice-sets.mjs';
import {flowMatchingConceptLesson as lesson,conceptLessonStages,conceptLessonTranslations} from '../src/concept-lessons.mjs';
import {conceptFlowTrace,renderConceptFlow,flowConceptTranslations} from '../src/concept-flow-view.mjs';
import {renderConceptLesson} from './render-concept-lesson.mjs';
import {lessonTranslations} from '../src/visual-lessons.mjs';
import {zhUI} from '../src/locales/zh-ui.mjs';
import {searchTranslations} from '../src/search-pages.mjs';
import {policyTranslations} from '../src/policy-pages.mjs';
import {collectionTranslations} from '../src/practice-collections.mjs';
import {gateStatementTranslations} from '../src/gate-statement.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
import {loadChinese,localizeHtml,decodeHtml} from './localize.mjs';
import {practicePath,nextPractice} from '../src/practice.mjs';
const c=concepts.find(c=>c.slug===lesson.slug),set=practiceSets.find(s=>s.slug===lesson.set),stages=conceptLessonStages(c,set,problems),ids=stages.flatMap(s=>s.problems.map(p=>p.id));
assert.deepEqual(ids,c.ids);assert.deepEqual(stages.map(s=>s.problems.length),[2,1,2,1]);assert.equal(new Set(ids).size,6);
assert.throws(()=>conceptLessonStages(c,{...set,segments:set.segments.slice(1)},problems),/order/);
assert.throws(()=>conceptLessonStages(c,set,problems.filter(p=>p.id!==ids[0])),/Unpublished/);
const dictionary=(await loadChinese()).dictionary,existing={...zhUI,...JSON.parse(await readFile(new URL('../src/locales/zh-static.json',import.meta.url),'utf8')),...lessonTranslations,...searchTranslations,...policyTranslations,...collectionTranslations,...gateStatementTranslations};
for(const[k,v]of Object.entries(conceptLessonTranslations)){assert.ok(v.trim());if(k in existing)assert.equal(v,existing[k],'Translation collision '+k);}
const cases=Array.from({length:101},(_,i)=>conceptFlowTrace(i/100));
for(const tr of cases){assert.ok(Math.abs(tr.output[0]-10*tr.t)<1e-12);assert.deepEqual(tr.velocity,[10]);assert.equal(tr.sourcePart[0],0);const en=renderConceptFlow(tr.t),zh=renderConceptFlow(tr.t,true);assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary}),zh);}
for(const time of [-.1,1.1,NaN,Infinity,'0.3',null])assert.throws(()=>conceptFlowTrace(time),RangeError);
const scalar=`def interpolate(x0, x1, t):\n    return (1 - t) * x0 + t * x1`;
const ref=problems.find(p=>p.id===ids[0]).solution;
const python=`import json,sys\nfrom decimal import Decimal,getcontext\ngetcontext().prec=40\n${scalar}\n${ref}\nfor tr in json.load(sys.stdin):\n t=tr['t'];d=Decimal(str(t))*10\n assert abs(interpolate(0,10,t)-float(d))<1e-12\n assert abs(linear_flow_path([0],[10],t)[0]-float(d))<1e-12\n assert abs(tr['output'][0]-float(d))<1e-12\nassert interpolate(4,4,.3)==4\nassert linear_flow_path([],[],.3)==[]\nprint('PASS 101 times: shared trace, scalar code, Python reference and Decimal oracle')`;
const out=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify(cases),encoding:'utf8'});assert.equal(out.status,0,out.stdout+out.stderr);console.log(out.stdout.trim());
const sets=practiceSets.map(s=>({...s,ids:s.segments.map(p=>p.id)}));for(let i=0;i<ids.length-1;i++){assert.equal(nextPractice(problems,sets,concepts,ids[i],{}, {set:set.slug}).problem.id,ids[i+1]);assert.match(practicePath(ids[i],{set:set.slug}),/\?set=flow-matching-ode-practice$/);}
for(const locale of ['','zh/']){
 const html=await readFile(join(siteRoot,locale,'concepts/flow-matching/index.html'),'utf8');
 assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/class="cf-section"/g)||[]).length,6);assert.equal((html.match(/class="cf-stage"/g)||[]).length,4);assert.equal((html.match(/data-solved=/g)||[]).length,6);
 for(const id of ids){assert.ok(html.includes(`href="${siteBase()+locale}problems/${id}/?set=${set.slug}"`));assert.ok(html.includes(`data-solved="${id}"`));for(const route of ['problems','editorials'])await readFile(join(siteRoot,locale,route,id,'index.html'));}
 assert.ok(html.includes('<noscript>')&&html.includes('id="cf-position">3</output>')&&html.includes('id="cf-velocity">10</output>'));
 assert.match(html,/id="cf-time"[^>]*disabled/);assert.match(html,/data-notation="x_t = \(1-t\)\*x0\+t\*x1"/);assert.ok(html.includes('assets/concept-lesson-ui.js'));
 const main=html.match(/<main\b[\s\S]*?<\/main>/)[0];assert.ok(!main.includes('adsbygoogle'));assert.ok(!main.includes('def linear_flow_path'));
 for(const [en,zh]of Object.entries(conceptLessonTranslations).filter(([en])=>en.length>25&&!en.includes('→'))){if(html.includes(e(en)))assert.ok(!locale,'Untranslated '+en);}
 for(const r of lesson.references)assert.ok(html.includes(r.url));
 if(process.env.SITE_ORIGIN){const url=process.env.SITE_ORIGIN.replace(/\/$/,'')+siteBase()+locale+'concepts/flow-matching/';assert.ok(html.includes(`rel="canonical" href="${url}"`)&&html.includes('hreflang="en"')&&html.includes('hreflang="zh-CN"'));}
 assert.ok(main.includes(locale?'轨迹不必':'need not follow'));assert.ok(main.includes(locale?'条件均值':'conditional average'));
 const firstStage=main.slice(main.indexOf('id="cf-stage-paths"'),main.indexOf('id="cf-stage-learning"'));assert.ok(firstStage.includes(locale?'不需要 ODE':'No ODE'));
}
function e(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
for(const other of concepts.filter(c=>![lesson.slug,'agent-control','state-estimation',transformerConcept.slug,generativeConcept.slug].includes(c.slug)&&!transformerChapterFor(c.slug)&&!generativeChapterFor(c.slug)))for(const locale of ['','zh/']){assert.equal(renderConceptLesson({concept:other}),null);const h=await readFile(join(siteRoot,locale,'concepts',other.slug,'index.html'),'utf8');assert.ok(!h.includes('data-concept-flow')&&!h.includes('assets/concept-lesson'));}
console.log('PASS bilingual Flow Matching pilot: six real exercises, staged prerequisites, set navigation, static MathML, no-JS fallback, translation parity and unchanged other Concept layouts');
