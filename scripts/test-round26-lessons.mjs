import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import * as M from '../src/lesson-round26-math.mjs';
import * as V from '../src/lesson-round26-view.mjs';
import '../src/visual-lessons-round26.mjs';
import {loadChinese,localizeHtml,decodeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
const previous={};for(const name of ['extra','frontier',...Array.from({length:22},(_,i)=>'round'+(i+4))]){const mod=await import('../src/visual-lessons-'+name+'.mjs');for(const[k,v]of Object.entries(mod))if(k.endsWith('Translations'))Object.assign(previous,v);}for(const[k,v]of Object.entries(V.round26Translations))if(k in previous)assert.equal(v,previous[k],'Translation collision: '+k);
const cases=[];function add(kind,p,options={}){const before=JSON.stringify(p),trace=M.fromPreset(kind,p,options);assert.equal(JSON.stringify(p),before,'Mutated input');cases.push({kind,p:trace.input,trace});return trace;}
for(const[kind,presets]of Object.entries(M.presets))for(const p of Object.values(presets)){
 if(kind==='retry')for(let budget=0;budget<=12;budget++)for(let count=0;count<=p.history.length;count++)add(kind,p,{budget,count});
 else if(kind==='memory'||kind==='pack')for(let budget=0;budget<=20;budget++)add(kind,p,{budget});
 else if(kind==='recall')for(let k=-2;k<=p.retrieved.length+2;k++)add(kind,p,{k});
 else{add(kind,p);for(let q=0;q<p.ranked.length;q++)add(kind,p,{query:q,promote:true});}
}
let seed=261019;const rand=n=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)%n),ids=n=>Array.from({length:n},()=>String.fromCharCode(97+rand(5)));
for(let i=0;i<220;i++){
 add('retry',{history:Array.from({length:rand(10)},()=>['ok','error','Error'][rand(3)]),budget:rand(12)});
 const messages=Array.from({length:rand(7)},(_,j)=>({role:['system','user','assistant'][rand(3)],content:'m'+j,tokens:rand(7)}));add('memory',{messages,budget:rand(21)});
 const n=rand(7);add('pack',{chunks:Array.from({length:n},(_,j)=>'c'+j),costs:Array.from({length:n},()=>rand(8)),budget:rand(21)});
 add('recall',{retrieved:ids(rand(9)),relevant:ids(rand(6)),k:rand(12)-2});
 const q=rand(5);add('mrr',{ranked:Array.from({length:q},()=>ids(rand(8))),relevant:Array.from({length:q},()=>ids(rand(5)))});
}
add('memory',{messages:[{role:'user',content:'extra metadata',tokens:1,i:99,scan:88}],budget:1});
const ps=Object.fromEntries(Object.entries(M.ids).map(([k,id])=>[k,problems.find(p=>p.id===id)])),names={retry:'should_stop',memory:'memory_window',pack:'pack_context',recall:'recall_at_k',mrr:'mean_reciprocal_rank'};
const python=String.raw`
import sys,json,copy,math,itertools,fractions
data=json.load(sys.stdin);fs={};tests=0
for k,code in data['refs'].items():
 ns={};exec(code,ns);fs[k]=ns[data['names'][k]]
 for test in data['tests'][k]:exec(test['code'],ns);tests+=1
for c in data['cases']:
 k,p,tr=c['kind'],c['p'],c['trace']
 args=[p['history'],p['budget']] if k=='retry' else [p['messages'],p['budget']] if k=='memory' else [p['chunks'],p['costs'],p['budget']] if k=='pack' else [p['retrieved'],p['relevant'],p['k']] if k=='recall' else [p['ranked'],p['relevant']]
 before=copy.deepcopy(args);actual=fs[k](*args);assert args==before
 if k=='retry':
  h,b=args;last_nonerror=max([i for i,x in enumerate(h) if x!='error']+[-1]);streak=len(h)-last_nonerror-1
  expected=len(h)>=b or streak>=3
  assert tr['count']==len(h) and tr['hard']==(len(h)>=b) and tr['checked']==(len(h)<b)
  assert tr['streak']==(streak>=3) and tr['reason']==('limit' if len(h)>=b else 'three' if streak>=3 else 'continue')
 elif k=='memory':
  ms,b=args;si=next((i for i,m in enumerate(ms) if m['role']=='system'),-1);system=ms[si] if si>=0 else None
  fits=system is None or system['tokens']<=b;other=[i for i,m in enumerate(ms) if m['role']!='system'];kept=[]
  if fits:
   available=b-(system['tokens'] if system else 0)
   # Enumerate whole chronological suffixes; no reverse greedy loop in the oracle.
   valid=[other[start:] for start in range(len(other)+1) if sum(ms[i]['tokens'] for i in other[start:])<=available]
   kept=max(valid,key=len)
  indices=([si] if system and fits else [])+kept;expected=[ms[i] for i in indices]
  assert tr['indices']==indices and tr['systemFits']==fits
  assert tr['used']==sum(m['tokens'] for m in expected) and tr['remaining']==b-tr['used']
  blocked=max([i for i in other if i not in kept],default=None) if fits else None
  for row in tr['rows']:
   i=row['i'];assert i==tr['rows'].index(row);decision=('system' if fits else 'systemTooLarge') if i==si else 'extraSystem' if ms[i]['role']=='system' else 'unvisited' if not fits else 'kept' if i in kept else 'blocked' if i==blocked else 'older'
   assert row['decision']==decision,(row,decision)
   if decision in ['kept','blocked']:
    remaining=b-(system['tokens'] if system else 0)-sum(ms[j]['tokens'] for j in kept if j>i)
    assert row['before']==remaining and row['after']==remaining-(ms[i]['tokens'] if decision=='kept' else 0)
 elif k=='pack':
  chunks,costs,b=args;sums=[0]+list(itertools.accumulate(costs));n=max(i for i,s in enumerate(sums) if s<=b);expected=chunks[:n]
  assert tr['used']==sums[n] and tr['remaining']==b-sums[n]
  for row in tr['rows']:
   i=row['i'];assert row['decision']==('kept' if i<n else 'blocked' if i==n else 'later')
   if i<=n:assert row['before']==b-sums[i] and row['after']==b-sums[i]-(costs[i] if i<n else 0)
 elif k=='recall':
  retrieved,gold,cut=args;unique=list(dict.fromkeys(gold));hits=[id for id in unique if cut>0 and any(x==id for x in retrieved[:cut])]
  expected=len(hits)/len(unique) if unique else 0
  assert tr['numerator']==len(hits) and tr['denominator']==len(unique) and set(tr['hits'])==set(hits)
  for row in tr['rows']:
   i=row['i'];id=row['id'];decision='notEvaluated' if not unique or cut<=0 else 'outside' if i>=cut else 'irrelevant' if id not in unique else 'repeat' if id in retrieved[:i] else 'hit'
   assert row['decision']==decision
 else:
  ranked,gold=args;rr=[]
  for qi,(docs,g) in enumerate(zip(ranked,gold)):
   # Minimum of all relevant positions, independent of an early-break scan.
   rank=min((i+1 for i,id in enumerate(docs) if id in g),default=None);score=fractions.Fraction(1,rank) if rank else fractions.Fraction(0)
   rr.append(score);q=tr['queries'][qi];assert q['firstRank']==rank and math.isclose(q['rr'],float(score),rel_tol=1e-12)
  expected=float(sum(rr)/len(rr)) if rr else 0
  assert tr['denominator']==len(rr) and math.isclose(tr['total'],float(sum(rr)),rel_tol=1e-12,abs_tol=1e-14)
 if k in ['recall','mrr']:assert math.isclose(actual,expected,rel_tol=1e-12,abs_tol=1e-14) and math.isclose(tr['output'],expected,rel_tol=1e-12,abs_tol=1e-14),(k,p,actual,expected,tr)
 else:assert actual==expected==tr['output'],(k,p,actual,expected,tr)
print('PASS',len(data['cases']),'traces against original Python and independent streak/suffix-enumeration/prefix-sum/membership/Fraction-rank oracles;',tests,'original tests')
`;
const run=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,names,refs:Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.solution])),tests:Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.tests]))}),encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(run.status,0,run.stdout+'\n'+run.stderr);console.log(run.stdout.trim());
const chinese=await loadChinese();let states=0;
for(const c of cases.filter((_,i)=>i<80||i%17===0))for(let index=0;index<Math.max(1,c.trace.rows.length);index++){
 const en=V.renders[c.kind](c.trace,index),zh=V.renders[c.kind](c.trace,index,true);for(const html of [en,zh]){assert.doesNotMatch(html,/NaN|undefined|Infinity/);assert.deepEqual(JSON.parse(decodeHtml(html.match(/data-trace-output="([^"]*)"/)[1])),c.trace.output);}assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary:chinese.dictionary}),zh,'Static/runtime translation mismatch: '+c.kind);states+=2;
}
for(const[k,id]of Object.entries(M.ids))for(const locale of ['','zh/']){const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests',code),sources=html.indexOf('<section class="lesson-resources">');assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/data-reset-lesson[^>]*disabled/);assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),ps[k].solution);assert.match(html,/r26-figure/);if(locale)for(const en of Object.keys(V.round26Translations).filter(x=>x.length>35))assert.ok(!decodeHtml(html.slice(visual,code)).includes(en),'Untranslated: '+en);}
for(const f of [()=>M.retryTrace({history:[],budget:-1}),()=>M.memoryTrace({messages:[{role:'user',content:'x',tokens:-1}],budget:1}),()=>M.packTrace({chunks:['a'],costs:[],budget:1}),()=>M.recallTrace({retrieved:[],relevant:[],k:.5}),()=>M.mrrTrace({ranked:[[]],relevant:[]}),()=>M.fromPreset('retry',M.presets.retry.basic,{count:-1})])assert.throws(f,RangeError);
for(const zh of [false,true])assert.match(V.renderInvalid(zh),/role="alert"/);
assert.deepEqual(M.fromPreset('memory',M.presets.memory.basic).indices,[0,3]);assert.deepEqual(M.fromPreset('pack',M.presets.pack.zero).output,['a']);assert.equal(M.fromPreset('recall',M.presets.recall.basic).output,2/3);assert.equal(M.fromPreset('mrr',M.presets.mrr.basic).output,.5);
const before=JSON.stringify(M.presets.mrr.basic);assert.equal(M.fromPreset('mrr',M.presets.mrr.basic,{query:0,promote:true}).output,2/3);assert.equal(JSON.stringify(M.presets.mrr.basic),before);
for(const name of ['lesson-ui-round26.js','lesson-round26-math.mjs','lesson-round26-view.mjs'])await readFile(join(siteRoot,'assets',name));console.log(`PASS ${states} EN/ZH rendered states; original Python preserved, bottom references, translation parity, early returns, duplicate ranks, zero costs and invalid states`);
