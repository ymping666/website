import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {agentControlConceptLesson as lesson} from '../src/concept-agent-lesson.mjs';
import {agentTracePresets,agentInspection,renderAgentTrace} from '../src/concept-agent-view.mjs';
import {agentLessonStages} from './render-concept-agent.mjs';
import {reactTrace} from '../src/lesson-frontier-math.mjs';
import {problems} from '../src/problems.mjs';
import {concepts} from '../src/concepts.mjs';
import {practiceSets} from '../src/practice-sets.mjs';
import {nextPractice} from '../src/practice.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
import {loadChinese,localizeHtml} from './localize.mjs';
const c=concepts.find(c=>c.slug===lesson.slug),stages=agentLessonStages(c,problems),ids=stages.map(s=>s.id),dictionary=(await loadChinese()).dictionary;
assert.deepEqual(ids,c.ids);assert.equal(stages.length,4);
assert.throws(()=>agentLessonStages({...c,ids:[...c.ids].reverse()},problems),/order/);
assert.throws(()=>agentLessonStages(c,problems.filter(p=>p.id!==ids[0])),/Unpublished/);
const sets=practiceSets.map(s=>({...s,ids:s.segments.map(p=>p.id)}));
for(let i=0;i<3;i++)assert.equal(nextPractice(problems,sets,concepts,ids[i],{},{concept:c.slug}).problem.id,ids[i+1]);
const cases=[],alphabet=['thought','action','observation','finish','wait'];
function enumerate(events,depth){const trace=reactTrace(events),oracle=/^thought(?: action observation thought)*(?: finish| action observation finish)$/.test(events.join(' '));assert.equal(trace.accepted,oracle,JSON.stringify(events));cases.push({events,valid:trace.accepted});if(depth)for(const ev of alphabet)enumerate([...events,ev],depth-1);}
enumerate([],6);
let renders=0;
for(const [key,preset]of Object.entries(agentTracePresets)){
 const before=JSON.stringify(preset.events);assert.equal(agentInspection(key).trace.accepted,['short','tool','cycle'].includes(key));
 for(let cursor=0;cursor<=preset.events.length;cursor++){
  const state=agentInspection(key,cursor),en=renderAgentTrace(key,cursor),zh=renderAgentTrace(key,cursor,true);
  assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary}),zh,`${key}/${cursor} translation parity`);
  assert.equal(state.failed,state.trace.error!==null&&state.trace.error<cursor);
  assert.ok(en.includes(`data-phase="${state.phase}"`));assert.ok(en.includes(`>${cursor} / ${preset.events.length}</output>`));renders+=2;
 }
 assert.equal(JSON.stringify(preset.events),before);
}
for(const args of [['absent'],['tool',-1],['tool',5],['tool',.5],['tool',NaN]])assert.throws(()=>agentInspection(...args),RangeError);
assert.equal(agentInspection('tool',2).phase,'waiting');assert.deepEqual(agentInspection('tool',2).allowed,['observation']);
assert.equal(agentInspection('missing',3).failed,true);assert.equal(agentInspection('early',1).failed,true);assert.equal(agentInspection('trailing',2).failed,true);
const core=ids.map(id=>problems.find(p=>p.id===id));
const py=`import json,sys,contextlib,io\n${core.map(p=>p.solution).join('\n')}\ndata=json.load(sys.stdin)\nnamespace={'payload':{},'history':[],'max_attempts':5,'scores':[.5,.75]}\nfor snippet in data['snippets']:\n exec(snippet,namespace)\nassert namespace['is_object'] is True\nassert namespace['budget_used'] is False\nassert namespace['next_after_action']=={'observation'}\nassert namespace['gain']==.25\nfor case in data['cases']:\n assert valid_react_trace(case['events']) == case['valid'],case\n${core.flatMap(p=>p.tests.map(t=>t.code)).join('\n')}\nfor value in [0,False,'',None,[],{}]:\n reply={'result':value}\n assert not bool(reply.get('result'))\n assert 'result' in reply\nassert should_stop([],0)\nassert not should_stop(['error','error'],5)\nassert should_stop(['error','error','error'],5)\nassert not should_stop(['error','ok','error'],5)\nassert reflection_decision([.5,.75],4,.9,.25)=='continue'\nassert reflection_decision([.4,.9],2,.9,.1)=='target_reached'\nassert parse_tool_call('{"tool":"forbidden","arguments":{}}') == {'tool':'forbidden','arguments':{}}\nprint('PASS original four Python solutions/tests, exhaustive trace oracle, falsy results, retry budget and reflection priority')`;
const result=spawnSync(pythonCommand,['-c',py],{input:JSON.stringify({cases,snippets:lesson.rules.map(r=>r.code)}),encoding:'utf8'});assert.equal(result.status,0,result.stdout+result.stderr);console.log(result.stdout.trim());
for(const locale of ['','zh/']){
 const html=await readFile(join(siteRoot,locale,'concepts',c.slug,'index.html'),'utf8'),main=html.match(/<main\b[\s\S]*?<\/main>/)[0];
 assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((main.match(/class="cf-section"/g)||[]).length,7);assert.equal((main.match(/class="cf-stage"/g)||[]).length,4);assert.equal((main.match(/data-solved=/g)||[]).length,4);
 for(const id of ids){assert.ok(main.includes(`href="${siteBase()+locale}problems/${id}/?concept=agent-control"`));for(const path of ['problems','editorials'])await readFile(join(siteRoot,locale,path,id,'index.html'));}
 assert.ok(main.includes(`href="${siteBase()+locale}review/"`));await readFile(join(siteRoot,locale,'review/index.html'));
 assert.match(main,/id="ca-preset" disabled/);assert.match(main,/id="ca-cursor"[^>]*disabled/);assert.ok(main.includes('<noscript>')&&main.includes('data-valid="true"')&&main.includes('class="ca-static"'));
 assert.ok(!main.includes('adsbygoogle'));assert.ok(!main.includes('def valid_react_trace')&&!main.includes('def reflection_decision'));
 for(const r of lesson.references)assert.ok(main.includes(r.url));
 for(const [en,zh]of Object.entries(dictionary).filter(([en])=>en.length>28&&main.includes(escape(en))))assert.ok(!locale||en===zh,'Untranslated '+en);
 if(process.env.SITE_ORIGIN){const url=process.env.SITE_ORIGIN.replace(/\/$/,'')+siteBase()+locale+'concepts/agent-control/';assert.ok(html.includes(`rel="canonical" href="${url}"`)&&html.includes('hreflang="en"')&&html.includes('hreflang="zh-CN"'));}
}
function escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
console.log(`PASS Agent Concept: ${cases.length} traces vs independent grammar/Python, ${renders} bilingual inspection states, static/no-JS content, four core links, context and references`);
