import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import {revisionPresets,revisionTrace,preferenceInputs,preferenceTrace,preferenceLossTrace,pairLoss,lossCurve} from '../src/lesson-round14-math.mjs';
import {renderRevision,renderPreference,renderPreferenceLoss,round14Translations} from '../src/lesson-round14-view.mjs';
import '../src/visual-lessons-round14.mjs';
import {decodeHtml,loadChinese,localizeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
const previous={};
for(const name of ['extra','frontier',...Array.from({length:10},(_,i)=>'round'+(i+4))]){
 const module=await import('../src/visual-lessons-'+name+'.mjs');
 for(const[key,value]of Object.entries(module))if(key.endsWith('Translations'))Object.assign(previous,value);
}
for(const[key,value]of Object.entries(round14Translations))if(key in previous)assert.equal(value,previous[key],'Translation collision: '+key);
const cases=[],funcs={revision:revisionTrace,labels:preferenceTrace,loss:preferenceLossTrace};
function add(kind,args){const before=JSON.stringify(args),trace=funcs[kind](...args);assert.equal(JSON.stringify(args),before);cases.push({kind,args,trace});return trace;}
for(const p of Object.values(revisionPresets))add('revision',[p.prompt,p.initial,p.principles,p.rounds]);
for(let gap=-12;gap<=12;gap++)for(let offset=-1000;offset<=0;offset+=250)for(const clamp of [false,true])add('labels',[...preferenceInputs(gap,offset),clamp]);
const labelEnd=cases.length;
for(let x=-16;x<=16;x++)for(const scale of [1,125])for(let target=0;target<=10;target++)for(let shift=-10;shift<=10;shift++)for(const copies of [1,4]){
 const d=x/2*scale;add('loss',[Array(copies).fill(shift+d/2),Array(copies).fill(shift-d/2),Array(copies).fill(target/10)]);
}
let seed=141017;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),int=n=>Math.floor(rand()*n);
for(let i=0;i<250;i++){
 add('labels',[-int(100000)/10,-int(100000)/10,Boolean(int(2))]);
 const n=1+int(6);add('loss',[Array.from({length:n},()=>int(2001)-1000),Array.from({length:n},()=>int(2001)-1000),Array.from({length:n},()=>int(11)/10)]);
 const nRounds=int(6),rounds=[];let source=' 起点 <script> ';
 for(let j=0;j<nRounds;j++){const revision=['',' x ','中文 & <img>','same'][int(4)];rounds.push({source,principle:int(6)?'p':'unknown',critique:'not a target',revision});source=revision;}
 if(rounds.length&&int(3)===0)rounds[int(rounds.length)].source='broken';
 add('revision',[' Q ', ' 起点 <script> ',['p'],rounds]);
}
const ids={revision:'constitutional-revision-dataset',labels:'constitutional-soft-preference',loss:'constitutional-preference-loss'},names={revision:'revision_training_pairs',labels:'ai_preference_label',loss:'soft_preference_loss'};
const refs=Object.fromEntries(Object.entries(ids).map(([kind,id])=>[kind,problems.find(p=>p.id===id).solution]));
const python=String.raw`
import sys,json,math,decimal,copy,functools
data=json.load(sys.stdin);decimal.getcontext().prec=80;D=lambda x:decimal.Decimal(str(x));funcs={}
for kind,code in data['refs'].items():
 ns={};exec(code,ns);funcs[kind]=ns[data['names'][kind]]
def close(a,b):
 if isinstance(a,(list,tuple)):
  assert len(a)==len(b)
  for x,y in zip(a,b):close(x,y)
 else:assert math.isclose(a,b,rel_tol=1e-11,abs_tol=1e-11),(a,b)
@functools.lru_cache(None)
def oracle_loss(d,q):
 # Independent log-sum-exp form, evaluated with Decimal, never logs rounded probabilities.
 d,q=D(d),D(q)
 return float(q*(1+(-d).exp()).ln()+(1-q)*(1+d.exp()).ln())
for c in data['cases']:
 k,args,tr=c['kind'],c['args'],c['trace'];before=copy.deepcopy(args)
 if k=='revision':
  prompt,initial,allowed,rounds=args;invalid=next((i for i,r in enumerate(rounds) if r['source']!=(initial if i==0 else rounds[i-1]['revision']) or r['principle'] not in allowed),None)
  assert tr['error']==invalid
  if invalid is not None:
   try:funcs[k](*args)
   except ValueError:pass
   else:raise AssertionError('bad chain accepted')
   assert tr['output'] is None
   assert all(not r['checked'] for r in tr['rows'][invalid+1:])
  else:
   expected=[[prompt,r['revision']] for r in rounds]
   assert [list(x) for x in funcs[k](*args)]==tr['output']==expected
 else:
  actual=funcs[k](*args);close(actual,tr['output'])
  if k=='labels':
   a,b,clamp=args;d=D(a)-D(b);p=1/(1+(-d).exp())
   if clamp:p=max(D('.4'),min(D('.6'),p))
   close(tr['output'],[float(p),float(1-p)]);close(sum(actual),1)
   close(actual,list(reversed(funcs[k](b,a,clamp))))
   close(actual,funcs[k](a-10000,b-10000,clamp))
  else:
   a,b,q=args;expected=[oracle_loss(x-y,z) for x,y,z in zip(a,b,q)]
   close(actual,math.fsum(expected)/len(expected));close([r['loss'] for r in tr['rows']],expected)
   close(actual,funcs[k](b,a,[1-z for z in q]));close(actual,funcs[k](a*2,b*2,q*2))
   for r in tr['rows']:
    assert 0<=r['p']<=1 and r['linear']>=-1e-10 and r['correction']>=0
 assert args==before
print('PASS',len(data['cases']),'Constitutional AI traces: all slider combinations, Python references, 80-digit Decimal oracle, batch/swap/shift invariants and immutable input')
`;
const result=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs,names}),encoding:'utf8',maxBuffer:30*1024*1024});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);console.log(result.stdout.trim());
// Distinguish a soft target's entropy minimum from zero loss at hard endpoints.
for(const q of [.1,.2,.4,.6,.8,.9]){
 const d=Math.log(q/(1-q)),entropy=-q*Math.log(q)-(1-q)*Math.log1p(-q);
 assert.ok(Math.abs(pairLoss(d,q)-entropy)<1e-12);
 assert.ok(pairLoss(d-.01,q)>entropy&&pairLoss(d+.01,q)>entropy);
 const h=1e-5,derivative=(pairLoss(d+.5+h,q)-pairLoss(d+.5-h,q))/(2*h);
 assert.ok(Math.abs(derivative-preferenceLossTrace([d+.5],[0],[q]).rows[0].slope)<1e-9);
}
assert.equal(pairLoss(1000,.6),400);assert.equal(pairLoss(1000,1),0);assert.equal(pairLoss(-1000,1),1000);
let rendered=0;const chinese=await loadChinese();
function checkRender(kind,tr){for(const zh of [false,true]){
 const html=kind==='revision'?renderRevision(tr,zh):kind==='labels'?renderPreference(tr,zh):renderPreferenceLoss(tr,zh);
 assert.doesNotMatch(html,/NaN|Infinity|undefined|<script>|<img>/);
 assert.match(html,new RegExp('id="'+({revision:'revision-output',labels:'preference-output',loss:'preference-loss-output'}[kind])+'"'));
 if(zh)assert.doesNotMatch(html,/Revision round|Component output|Current pair|Supplied soft target|Check the source/);
 if(kind==='loss'){
  const curve=lossCurve(tr.rows[0].d,tr.rows[0].q);
  assert.ok(curve.points.every(([x,y])=>Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x)<=curve.span&&y>=0&&y<=curve.maximum));
  assert.ok(curve.points.some(([x])=>x===tr.rows[0].d));
  if(curve.optimum!==null)assert.ok(curve.points.some(([x])=>x===curve.optimum));
 }
 rendered++;
}}
for(const c of cases.slice(0,labelEnd))checkRender(c.kind,c.trace);
for(let x=-16;x<=16;x++)for(const scale of [1,125])for(let q=0;q<=10;q++)for(const copies of [1,4])checkRender('loss',preferenceLossTrace(Array(copies).fill(x/2*scale),Array(copies).fill(0),Array(copies).fill(q/10)));
for(const c of cases.filter(c=>c.kind==='revision').slice(-250))checkRender(c.kind,c.trace);
for(const locale of ['','zh/'])for(const[kind,id]of Object.entries(ids)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8');
 const visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests'),sources=html.indexOf('<section class="lesson-resources">');
 assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/data-reset-lesson[^>]*disabled/);
 if(kind!=='revision')assert.match(html,/<math /);
 assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[kind]);assert.ok(html.includes(`src="${siteBase()}assets/lesson-ui.js"`));
 if(locale)for(const key of Object.keys(round14Translations).filter(key=>key.length>25))assert.ok(!decodeHtml(html.slice(visual,code)).includes(key),'Untranslated lesson text: '+key);
 if(locale)assert.doesNotMatch(decodeHtml(html.slice(visual,code)),/Revision round|Component output|Current pair|Mean loss, not sum|Check the source link|Original prompt|Initial response: not a target/);
}
// The no-JS Chinese snapshot must carry the same labels as the live renderer.
for(const c of cases.slice(0,6)){
 const en=renderRevision(c.trace),localized=localizeHtml(en,'editorials/constitutional-revision-dataset/',{base:siteBase(),origin:'https://tensordrill.com',dictionary:chinese.dictionary});
 assert.equal(localized,renderRevision(c.trace,true),'Static/live revision translation parity');
}
for(const name of ['lesson-ui-round14.js','lesson-round14-math.mjs','lesson-round14-view.mjs'])await readFile(join(siteRoot,'assets',name));
console.log(`PASS ${rendered} bilingual render states, valid loss curves, 6 built editorials, unchanged Python and bottom reference links`);
