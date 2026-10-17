import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import {forecastPresets,forecastTrace,riskPresets,riskTrace,cemPresets,cemTrace} from '../src/lesson-round12-math.mjs';
import {renderForecast,renderRisk,renderCem,round12Translations} from '../src/lesson-round12-view.mjs';
import '../src/visual-lessons-round12.mjs';
import {originalMathText} from '../src/lesson-notation.mjs';
import {decodeHtml,loadChinese} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
// The build merges translation dictionaries globally. New lessons must not
// change existing labels while their browser modules retain older wording.
const previousTranslations={};
for(const name of ['extra','frontier',...Array.from({length:8},(_,i)=>'round'+(i+4))]){
 const module=await import('../src/visual-lessons-'+name+'.mjs');
 for(const[key,value]of Object.entries(module))if(key.endsWith('Translations'))Object.assign(previousTranslations,value);
}
for(const[key,value]of Object.entries(round12Translations))if(key in previousTranslations)assert.equal(value,previousTranslations[key],'Translation collision: '+key);
const cases=[],traces={forecast:forecastTrace,risk:riskTrace,cem:cemTrace};
function add(kind,args){const before=JSON.stringify(args),trace=traces[kind](...args);assert.equal(JSON.stringify(args),before);cases.push({kind,args,trace});}
for(const p of Object.values(forecastPresets))for(let a=-8;a<=8;a++)add('forecast',[{...p.a,a:p.a.a+a/4},p.b,p.truth]);
for(const p of Object.values(riskPresets))for(let w=0;w<=12;w++)add('risk',[p.means,p.variances,w/4]);
for(const p of Object.values(cemPresets))for(let e=1;e<=p.candidates.length;e++)add('cem',[p.candidates,p.costs,e,p.n]);
const controls=cases.length;
let seed=121017;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),int=n=>Math.floor(rand()*n),value=()=>(int(81)-40)/4;
for(let i=0;i<250;i++){
 const keys=['z','risky','a','b','safe'].slice(0,1+int(5));const dict=()=>Object.fromEntries(keys.map(k=>[k,value()]));
 add('forecast',[dict(),dict(),dict()]);
 add('risk',[dict(),Object.fromEntries(keys.map(k=>[k,int(50)/4])),int(13)/4]);
 const n=1+int(4),h=int(5),population=1+int(7),candidates=Array.from({length:population},()=>Array.from({length:h},()=>int(n)));
 add('cem',[candidates,Array.from({length:population},value),1+int(population),n]);
}
// Deliberate ties, equal true optima, empty sets and all-elite fractions.
add('forecast',[{b:0,a:0},{a:1,b:0},{a:5,b:0}]);
add('forecast',[{b:0,a:1},{a:0,b:1},{a:0,b:0}]);
add('risk',[{risky:0,safe:2},{risky:16,safe:0},0.5]);
const ids={forecast:'prediction-vs-decision',risk:'risk-sensitive-planner',cem:'cem-categorical-update'};
const names={forecast:'compare_forecasts',risk:'risk_sensitive_action',cem:'cem_elite_frequencies'};
const refs=Object.fromEntries(Object.entries(ids).map(([kind,id])=>[kind,problems.find(p=>p.id===id).solution]));
const python=String.raw`
import sys,json,math,copy,decimal
data=json.load(sys.stdin);functions={};decimal.getcontext().prec=50
for kind,code in data['refs'].items():
 ns={};exec(code,ns);functions[kind]=ns[data['names'][kind]]
def close(a,b):
 if isinstance(a,dict):
  assert a.keys()==b.keys()
  for k in a:close(a[k],b[k])
 elif isinstance(a,list):
  assert len(a)==len(b)
  for x,y in zip(a,b):close(x,y)
 elif isinstance(a,(str,type(None))):assert a==b,(a,b)
 else:assert math.isclose(a,b,rel_tol=1e-12,abs_tol=1e-12),(a,b)
D=lambda x:decimal.Decimal(str(x))
for case in data['cases']:
 k,args,tr=case['kind'],case['args'],case['trace'];before=copy.deepcopy(args)
 result=functions[k](*args);close(tr['output'],result)
 if k=='forecast':
  a,b,truth=args;keys=sorted(truth);opt=min(truth.values());assert tr['actions']==keys
  for name,pred in [('a',a),('b',b)]:
   row=tr[name];chosen=min(keys,key=lambda x:(pred[x],x));errors=[(D(pred[x])-D(truth[x]))**2 for x in keys]
   assert row['chosen']==chosen;close(row['errors'],[float(e) for e in errors]);close(row['sum'],float(sum(errors)))
   close(row['mse'],float(sum(errors)/D(len(keys))));close(row['regret'],truth[chosen]-opt)
   assert row['regret']>=0
  # Shifting both models and the true costs preserves errors and decisions.
  shifted=functions[k](*[{x:y+8 for x,y in table.items()} for table in args]);close(result,shifted)
 elif k=='risk':
  means,variances,w=args;rows={r['action']:r for r in tr['rows']}
  for action in means:
   std=D(variances[action]).sqrt();close(rows[action]['std'],float(std));close(rows[action]['penalty'],float(D(w)*std));close(rows[action]['score'],float(D(means[action])+D(w)*std))
  if means:
   expected=min(means,key=lambda x:(D(means[x])+D(w)*D(variances[x]).sqrt(),x));assert result==expected
   assert functions[k](means,variances,0)==min(means,key=lambda x:(means[x],x))
  else:assert result is None
 else:
  candidates,costs,e,n=args;h=len(candidates[0]);elite=sorted(range(len(candidates)),key=lambda i:(costs[i],i))[:e]
  assert tr['elites']==elite;assert len(result)==h
  for t in range(h):
   counts=[sum(candidates[i][t]==a for i in elite) for a in range(n)]
   assert counts==tr['counts'][t];close(tr['output'][t],[count/e for count in counts]);close(sum(tr['output'][t]),1)
   assert all(0<=p<=1 for p in tr['output'][t]);assert sum(counts)==e
  assert len({id(row) for row in result})==h
 assert args==before
print('PASS',len(data['cases']),'planning traces: Python references, independent Decimal cost calculations, stable elites and categorical counts')
`;
const result=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs,names}),encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);console.log(result.stdout.trim());
let rendered=0;
for(const c of cases.slice(0,controls))for(const zh of [false,true]){
 const steps=c.kind==='cem'?Math.max(1,c.trace.counts.length):1;
 for(let step=0;step<steps;step++){
  const html=c.kind==='forecast'?renderForecast(c.trace,zh):c.kind==='risk'?renderRisk(c.trace,zh):renderCem(c.trace,step,zh);
  assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/id="(?:forecast|risk|cem)-output"/);
  if(zh)assert.doesNotMatch(html,/Function output|Mean cost|True cost|Squared error|Model A|Model B|Probabilities by time step/);
  if(c.kind==='cem')assert.equal((html.match(/class="r12-column"/g)||[]).length,c.trace.counts.length?c.trace.candidates.length:0);
  rendered++;
 }
}
const chinese=await loadChinese();
assert.equal(chinese.translate('Selected'),'选中','Existing MPC static label must still match its browser module');
for(const locale of ['','zh/'])for(const [kind,id]of Object.entries(ids)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8');
 const visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests'),sources=html.indexOf('<section class="lesson-resources">');
 assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/data-reset-lesson[^>]*disabled/);assert.match(html,/<math /);
 assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[kind]);assert.ok(html.includes(`src="${siteBase()}assets/lesson-ui.js"`));
 if(locale){
  // Extract all visible/accessible static labels so no-JS Chinese is checked too.
  const part=html.slice(visual,code),tokens=part.split(/(<[^>]+>)/g);let skip=null;
  for(const token of tokens){
   if(token.startsWith('<')){const tag=/^<\/?([a-z0-9]+)/i.exec(token)?.[1];if(/^<\//.test(token)&&tag===skip)skip=null;else if(['pre','math','script','code','samp'].includes(tag)&&!/^<\//.test(token))skip=tag;continue;}
   if(skip)continue;
   const text=decodeHtml(token).trim();assert.equal(chinese.translate(text),text,'Untranslated static Chinese text: '+text);
  }
  const decoded=decodeHtml(originalMathText(part));assert.doesNotMatch(decoded,/Average over all|Rank whole|Selected marks|Enable JavaScript|Function output|Inputs and standard deviations/);
 }
}
for(const name of ['lesson-ui-round12.js','lesson-round12-math.mjs','lesson-round12-view.mjs'])await readFile(join(siteRoot,'assets',name));
console.log(`PASS ${rendered} bilingual control/inspection states, 6 built editorials, unchanged Python, native math and bottom references`);
