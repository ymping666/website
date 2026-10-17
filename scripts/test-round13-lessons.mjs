import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import {episodePresets,episodeTrace,rewardStates,tokenPresets,rewardTrace,advantagePresets,advantageTrace} from '../src/lesson-round13-math.mjs';
import {renderEpisode,renderReward,renderAdvantages,round13Translations} from '../src/lesson-round13-view.mjs';
import '../src/visual-lessons-round13.mjs';
import {decodeHtml,loadChinese} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
const previous={};
for(const name of ['extra','frontier',...Array.from({length:9},(_,i)=>'round'+(i+4))]){
 const module=await import('../src/visual-lessons-'+name+'.mjs');
 for(const[key,value]of Object.entries(module))if(key.endsWith('Translations'))Object.assign(previous,value);
}
for(const[key,value]of Object.entries(round13Translations))if(key in previous)assert.equal(value,previous[key],'Translation collision: '+key);
const cases=[],funcs={episode:episodeTrace,reward:rewardTrace,advantages:advantageTrace};
function add(kind,args){const before=JSON.stringify(args),trace=funcs[kind](...args);assert.equal(JSON.stringify(args),before);cases.push({kind,args,trace});}
// Exhaust every boolean history through 6 turns, including unreachable histories.
for(let limit=1;limit<=5;limit++)for(let length=0;length<=6;length++)for(let mask=0;mask<2**length;mask++)add('episode',[Array.from({length},(_,i)=>Boolean(mask&(1<<i))),limit]);
for(const state of Object.values(rewardStates))for(const p of Object.values(tokenPresets))for(const repeat of [1,2,4])for(let b=0;b<=4;b++){
 const repeatTokens=xs=>Array.from({length:repeat},()=>xs).flat();add('reward',[...state,repeatTokens(p.policy),repeatTokens(p.reference),b/4]);
}
for(const p of Object.values(advantagePresets))for(let shift=-4;shift<=4;shift++)add('advantages',[p.rewards,p.values.map(v=>v+shift/4)]);
const controls=cases.length;
let seed=131017;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),int=n=>Math.floor(rand()*n),value=()=>(int(81)-40)/4;
for(let i=0;i<250;i++){
 const state=Object.values(rewardStates)[int(5)],length=1+int(8);add('reward',[...state,Array.from({length},()=>-int(81)/4),Array.from({length},()=>-int(81)/4),int(5)/4]);
 const turns=int(7);add('advantages',[Array.from({length:turns},value),Array.from({length:turns},value)]);
}
const ids={episode:'rlef-public-test-controller',reward:'rlef-shaped-turn-reward',advantages:'rlef-undiscounted-advantages'},names={episode:'rlef_episode_action',reward:'rlef_turn_reward',advantages:'rlef_advantages'};
const refs=Object.fromEntries(Object.entries(ids).map(([kind,id])=>[kind,problems.find(p=>p.id===id).solution]));
const python=String.raw`
import sys,json,math,copy,decimal
data=json.load(sys.stdin);decimal.getcontext().prec=65;funcs={}
for kind,code in data['refs'].items():
 ns={};exec(code,ns);funcs[kind]=ns[data['names'][kind]]
def close(a,b):
 if isinstance(a,list):
  assert len(a)==len(b)
  for x,y in zip(a,b):close(x,y)
 elif isinstance(a,str):assert a==b,(a,b)
 else:assert math.isclose(a,b,rel_tol=1e-12,abs_tol=1e-12),(a,b)
D=lambda x:decimal.Decimal(str(x))
for c in data['cases']:
 k,args,tr=c['kind'],c['args'],c['trace'];before=copy.deepcopy(args)
 if k=='episode':
  history,limit=args;invalid=len(history)>limit or any(flag and i<len(history)-1 for i,flag in enumerate(history))
  assert tr['error']==invalid
  if invalid:
   try:funcs[k](*args)
   except ValueError:pass
   else:raise AssertionError('invalid history accepted')
   assert tr['output'] is None
  else:
   expected='private_eval' if any(history) or len(history)==limit else 'retry'
   assert funcs[k](*args)==tr['output']==expected
 else:
  actual=funcs[k](*args);close(tr['output'],actual)
  if k=='reward':
   valid,terminal,all_pass,policy,reference,beta=args
   base=(1 if all_pass else -1) if terminal else (0 if valid else -0.2)
   ratios=[D(p)-D(r) for p,r in zip(policy,reference)];mean=sum(ratios)/D(len(ratios))
   close(tr['ratios'],[float(x) for x in ratios]);close(tr['sum'],float(sum(ratios)));close(tr['mean'],float(mean));close(tr['base'],base)
   close(actual,float(D(base)-D(beta)*mean))
   close(funcs[k](valid,terminal,all_pass,policy*2,reference*2,beta),actual)
   close(funcs[k](valid,terminal,all_pass,policy,reference,0),base)
  else:
   rewards,values=args
   independent=[float(sum(D(x) for x in rewards[t:])-D(values[t])) for t in range(len(rewards))]
   close(actual,independent);close(tr['returns'],[float(sum(D(x) for x in rewards[t:])) for t in range(len(rewards))])
   close(funcs[k](rewards,[v+0.25 for v in values]),[x-0.25 for x in actual]);assert actual is not rewards and actual is not values
 assert args==before
print('PASS',len(data['cases']),'RLEF traces: exhaustive histories, Python references, 65-digit Decimal rewards/returns and input immutability')
`;
const result=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs,names}),encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);console.log(result.stdout.trim());
let rendered=0;
for(const c of cases.slice(0,controls))for(const zh of [false,true]){
 for(let step=0;step<(c.kind==='advantages'?Math.max(1,c.trace.rewards.length):1);step++){
  const html=c.kind==='episode'?renderEpisode(c.trace,zh):c.kind==='reward'?renderReward(c.trace,zh):renderAdvantages(c.trace,step,zh);
  assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/id="(?:episode|reward|advantages)-output"/);
  if(zh)assert.doesNotMatch(html,/Completed public-test|Nonterminal|Component output|Signed log ratio|Pre-response baseline|Earlier: excluded/);
  if(c.kind==='advantages')assert.equal((html.match(/r13-inspected/g)||[]).length,c.trace.rewards.length?1:0);
  if(c.kind==='episode'&&c.trace.error)assert.match(html,/raises ValueError/);
  rendered++;
 }
}
const chinese=await loadChinese();assert.equal(chinese.translate('Selected'),'选中');
for(const locale of ['','zh/'])for(const[kind,id]of Object.entries(ids)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8');
 const visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests'),sources=html.indexOf('<section class="lesson-resources">');
 assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/<math /);assert.match(html,/data-reset-lesson[^>]*disabled/);
 assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[kind]);assert.ok(html.includes(`src="${siteBase()}assets/lesson-ui.js"`));
 if(locale){
  const tokens=html.slice(visual,code).split(/(<[^>]+>)/g);let skip=null;
  for(const token of tokens){
   if(token.startsWith('<')){const tag=/^<\/?([a-z0-9]+)/i.exec(token)?.[1];if(/^<\//.test(token)&&tag===skip)skip=null;else if(['pre','math','script','code','samp'].includes(tag)&&!/^<\//.test(token))skip=tag;continue;}
   if(!skip){const text=decodeHtml(token).trim();assert.equal(chinese.translate(text),text,'Untranslated static label: '+text);}
  }
  assert.doesNotMatch(decodeHtml(html.slice(visual,code)),/Completed public-test|Component output|Work through the inspected|Turn [1-6]/);
 }
}
for(const name of ['lesson-ui-round13.js','lesson-round13-math.mjs','lesson-round13-view.mjs'])await readFile(join(siteRoot,'assets',name));
console.log(`PASS ${rendered} bilingual RLEF states, 6 static editorials, unchanged Python, bottom references and translation isolation`);
