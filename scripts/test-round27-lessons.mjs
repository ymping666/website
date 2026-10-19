import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import * as M from '../src/lesson-round27-math.mjs';
import * as V from '../src/lesson-round27-view.mjs';
import '../src/visual-lessons-round27.mjs';
import {loadChinese,localizeHtml,decodeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
const previous={};for(const name of ['extra','frontier',...Array.from({length:23},(_,i)=>'round'+(i+4))]){const mod=await import('../src/visual-lessons-'+name+'.mjs');for(const[k,v]of Object.entries(mod))if(k.endsWith('Translations'))Object.assign(previous,v);}for(const[k,v]of Object.entries(V.round27Translations))if(k in previous)assert.equal(v,previous[k],'Translation collision: '+k);
const cases=[];function add(kind,p,o={}){const before=JSON.stringify(p),trace=M.fromPreset(kind,p,o);assert.equal(JSON.stringify(p),before,'Mutated source');cases.push({kind,p:trace.input,trace});return trace;}
for(const[k,presets]of Object.entries(M.presets))for(const[name,p]of Object.entries(presets)){
 if(name==='invalid'){assert.throws(()=>M.fromPreset(k,p),RangeError);continue;}
 if(k==='action')for(let g=0;g<=16;g++)add(k,p,{gamma:g/16});
 else if(k==='regret')for(let index=0;index<Object.keys(p.predicted).length;index++)for(const offset of [-2,-.5,0,.5,2])add(k,p,{index,offset});
 else if(k==='ready'){const names=Object.keys(p.tasks);for(let mask=0;mask<2**names.length;mask++)add(k,p,{completed:names.filter((_,i)=>mask&(1<<i))});}
 else if(k==='reflection')for(const last of [0,.5,.75,.875,1])for(const budget of [0,2,5])for(const improvement of [0,.125,.25])add(k,p,{last,budget,improvement});
 else if(k==='epsilon')for(let e=0;e<=16;e++)for(const draw of [0,.25,.5,.75,.9375])for(let randomIndex=0;randomIndex<p.q.length;randomIndex++)add(k,p,{epsilon:e/16,draw,randomIndex});
 else add(k,p);
}
// Preserve the unedited floating-boundary preset as well as controlled scores.
add('reflection',M.presets.reflection.floating);
let seed=271019;const rand=n=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)%n);
for(let i=0;i<130;i++){
 const count=1+rand(4),names=Array.from({length:count},(_,j)=>String.fromCharCode(97+j)),predictions=Object.fromEntries(names.map(name=>[name,Array.from({length:rand(5)},()=>rand(21)/4)]));add('action',{predictions,gamma:rand(5)/4});
 const predicted=Object.fromEntries(names.map(name=>[name,(rand(25)-12)/4])),truth=Object.fromEntries(names.map(name=>[name,(rand(25)-12)/4]));add('regret',{predicted,truth});
 const tasks=Object.fromEntries(names.map((name,j)=>[name,names.slice(0,j).filter(()=>rand(3)===0)]));add('ready',{tasks,completed:names.filter(()=>rand(2)===0)});add('schedule',{tasks});
 const arbitrary=Object.fromEntries(names.map(name=>[name,names.filter(()=>rand(4)===0)]));add('schedule',{tasks:arbitrary});
 add('reflection',{scores:Array.from({length:rand(6)},()=>rand(17)/16),budget:rand(7),target:rand(17)/16,improvement:rand(9)/16});
 add('epsilon',{q:Array.from({length:count},()=>rand(21)-10),epsilon:rand(17)/16,draw:rand(16)/16,randomIndex:rand(count)});
}
const unicode=['\ue000','\u{10000}'];add('action',{predictions:Object.fromEntries(unicode.map(n=>[n,[1]])),gamma:1});add('regret',{predicted:Object.fromEntries(unicode.map(n=>[n,1])),truth:Object.fromEntries(unicode.map(n=>[n,2]))});add('ready',{tasks:Object.fromEntries(unicode.map(n=>[n,[]])),completed:[]});add('schedule',{tasks:Object.fromEntries(unicode.map(n=>[n,[]]))});
const ps=Object.fromEntries(Object.entries(M.ids).map(([k,id])=>[k,problems.find(p=>p.id===id)])),names={action:'choose_action',regret:'planning_regret',ready:'ready_tasks',schedule:'schedule_plan',reflection:'reflection_decision',epsilon:'epsilon_greedy'};
const python=String.raw`
import sys,json,copy,math,itertools,fractions,decimal
data=json.load(sys.stdin);fs={};tests=0;decimal.getcontext().prec=80;D=lambda x:decimal.Decimal(str(x));F=fractions.Fraction.from_float
for k,code in data['refs'].items():
 ns={};exec(code,ns);fs[k]=ns[data['names'][k]]
 for test in data['tests'][k]:exec(test['code'],ns);tests+=1
def close(a,b):assert math.isclose(float(a),float(b),rel_tol=2e-12,abs_tol=1e-14),(a,b)
for c in data['cases']:
 k,p,tr=c['kind'],c['p'],c['trace']
 args=[p['predictions'],p['gamma']] if k=='action' else [p['predicted'],p['truth']] if k=='regret' else [p['tasks'],p['completed']] if k=='ready' else [p['tasks']] if k=='schedule' else [p['scores'],p['budget'],p['target'],p['improvement']] if k=='reflection' else [p['q'],p['epsilon'],p['draw'],p['randomIndex']]
 before=copy.deepcopy(args);actual=fs[k](*args);assert args==before
 if k=='action':
  scores={name:sum((D(p['gamma'])**t if t else D(1))*D(cost) for t,cost in enumerate(path)) for name,path in p['predictions'].items()}
  expected=min(scores,key=lambda name:(scores[name],name)) if scores else None
  for row in tr['rows']:
   close(row['score'],scores[row['name']]);total=D(0)
   for term in row['terms']:
    w=D(1) if term['t']==0 else D(p['gamma'])**term['t'];part=w*D(term['cost']);total+=part;close(term['weight'],w);close(term['part'],part);close(term['total'],total)
 elif k=='regret':
  predicted,truth=args;name=sorted(predicted,key=lambda n:(predicted[n],n))[0];best=min(truth.values());expected={'action':name,'regret':float(F(float(truth[name]))-F(float(best)))}
  close(tr['selectedTrue'],truth[name]);close(tr['bestTrue'],best)
  for row in tr['rows']:assert row['chosen']==(row['name']==name) and row['oracle']==(truth[row['name']]==best)
 elif k=='ready':
  tasks,done=args;expected=sorted(set(tasks)-set(done)-{name for name,deps in tasks.items() if set(deps)-set(done)})
  for row in tr['rows']:
   missing=set(tasks[row['name']])-set(done);assert set(row['missing'])==missing
   assert row['state']==('done' if row['name'] in done else 'blocked' if missing else 'ready')
 elif k=='schedule':
  tasks=p['tasks'];vertices=sorted(tasks)
  # Brute-force valid permutations, independent of Kahn/in-degree updates.
  valid=[order for order in itertools.permutations(vertices) if all(order.index(dep)<order.index(name) for name,deps in tasks.items() for dep in set(deps))]
  expected=list(min(valid)) if valid else ([] if not vertices else None)
  prefix=[]
  for i,step in enumerate(tr['steps']):
   if i:prefix.append(step['chosen'])
   ready=sorted(name for name in tasks if name not in prefix and set(tasks[name])<=set(prefix));assert step['ready']==ready and step['order']==prefix
   for r in step['remaining']:assert r['degree']==len(set(tasks[r['name']])-set(prefix))
   if i+1<len(tr['steps']):assert tr['steps'][i+1]['chosen']==ready[0]
  assert tr['blocked']==sorted(set(tasks)-set(prefix))
 elif k=='reflection':
  scores,budget,target,minimum=args;hit=bool(scores) and scores[-1]>=target;exhausted=len(scores)>=budget
  delta=float(F(float(scores[-1]))-F(float(scores[-2]))) if len(scores)>1 else None
  plateau=delta is not None and F(delta)<F(float(minimum));expected='target_reached' if hit else 'budget_exhausted' if exhausted else 'plateau' if plateau else 'continue'
  assert [g['tested'] for g in tr['gates']]==[True,not hit,not hit and not exhausted]
  assert [g['trigger'] for g in tr['gates']]==[hit,exhausted,plateau]
  if delta is not None:close(tr['delta'],delta)
 else:
  q,e,u,r=args;greedy=sorted(range(len(q)),key=lambda i:(-q[i],i))[0];expected=r if u<e else greedy
  assert tr['greedy']==greedy and tr['explore']==(u<e)
 assert actual==expected==tr['output'],(k,p,actual,expected,tr['output'])
print('PASS',len(data['cases']),'traces against original Python plus independent Decimal rollouts, true-cost Fraction regret, set constraints, exhaustive topological permutations, exact-binary gain and ranked-Q oracles;',tests,'original tests')
`;
const run=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,names,refs:Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.solution])),tests:Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.tests]))}),encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(run.status,0,run.stdout+'\n'+run.stderr);console.log(run.stdout.trim());
const chinese=await loadChinese();let states=0;
for(const c of cases.filter((_,i)=>i<75||i%31===0)){const count=c.kind==='schedule'?c.trace.steps.length:c.kind==='reflection'?3:Math.max(1,c.trace.rows.length);for(let index=0;index<count;index++){
 const en=V.renders[c.kind](c.trace,index),zh=V.renders[c.kind](c.trace,index,true);for(const html of [en,zh]){assert.doesNotMatch(html,/NaN|undefined|Infinity/);assert.deepEqual(JSON.parse(decodeHtml(html.match(/data-trace-output="([^"]*)"/)[1])),c.trace.output);}assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary:chinese.dictionary}),zh,'Static/runtime translation mismatch: '+c.kind);states+=2;
}}
for(const[k,id]of Object.entries(M.ids))for(const locale of ['','zh/']){const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests',code),sources=html.indexOf('<section class="lesson-resources">');assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/data-reset-lesson[^>]*disabled/);assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),ps[k].solution);assert.match(html,/r27-figure/);if(locale)for(const en of Object.keys(V.round27Translations).filter(x=>x.length>35))assert.ok(!decodeHtml(html.slice(visual,code)).includes(en),'Untranslated: '+en);}
for(const[kind,presets]of Object.entries(M.presets))for(const zh of [false,true]){const html=V.renderInvalid(zh,presets.invalid);assert.match(html,/role="alert"/);assert.doesNotMatch(html,/data-trace-output/);}
assert.throws(()=>M.readyTrace({tasks:{a:['a']},completed:[]}),RangeError);assert.throws(()=>M.epsilonTrace({q:[1],epsilon:0,draw:1,randomIndex:0}),RangeError);assert.throws(()=>M.actionTrace({predictions:{a:[1]},gamma:-1}),RangeError);
assert.equal(M.fromPreset('schedule',M.presets.schedule.cycle).output,null);assert.deepEqual(M.fromPreset('schedule',M.presets.schedule.basic).output,['a','b','z']);assert.equal(M.fromPreset('reflection',M.presets.reflection.equal).output,'continue');assert.equal(M.fromPreset('epsilon',M.presets.epsilon.equal).explore,false);
assert.notEqual(V.number(1,[1,1.0000000001]),V.number(1.0000000001,[1,1.0000000001]));const float=M.fromPreset('reflection',M.presets.reflection.floating);assert.notEqual(V.number(float.delta,[float.delta,.1]),V.number(.1,[float.delta,.1]));
for(const name of ['lesson-ui-round27.js','lesson-round27-math.mjs','lesson-round27-view.mjs'])await readFile(join(siteRoot,'assets',name));console.log(`PASS ${states} bilingual rendered states; all six complete editorials, preserved Python, bottom sources, translation parity, cycles/empty/error and near-tie typography`);
