import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import * as M from '../src/lesson-round25-math.mjs';
import * as V from '../src/lesson-round25-view.mjs';
import '../src/visual-lessons-round25.mjs';
import {decodeHtml,loadChinese,localizeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
const previous={};for(const name of ['extra','frontier',...Array.from({length:21},(_,i)=>'round'+(i+4))]){const mod=await import('../src/visual-lessons-'+name+'.mjs');for(const[k,v]of Object.entries(mod))if(k.endsWith('Translations'))Object.assign(previous,v);}for(const[k,v]of Object.entries(V.round25Translations))if(k in previous)assert.equal(v,previous[k],'Translation collision: '+k);
const cases=[];function add(kind,p,count){const before=JSON.stringify(p),trace=M.fromPreset(kind,p,count);assert.equal(JSON.stringify(p),before);cases.push({kind,p:structuredClone(p),count,trace:structuredClone(trace)});return trace;}
for(const[k,presets]of Object.entries(M.presets))for(const p of Object.values(presets)){if(k==='merge')for(let i=0;i<=p.responses.length;i++)add(k,p,i);else add(k,p);}
const values=[null,false,true,0,1,-2,1.5,'','1',[],{},[1],{a:1}];
for(const tool of ['search','  ',' ping ','\u0085','\u001c','\ufeff',0,null,false])for(const args of values)add('parse',{raw:JSON.stringify({tool,arguments:args,extra:true})});
for(const x of values)add('parse',{raw:JSON.stringify(x)});for(const raw of ['', '{', '{"tool":}', 'nullx','[1,]'])add('parse',{raw});
for(const tag of ['str','int','bool'])for(const v of values)for(const mismatch of ['none','missing','extra']){const p={request:{tool:'x',arguments:mismatch==='missing'?{}:{v,...(mismatch==='extra'?{extra:1}:{})}},registry:{x:{v:tag}}};add('schema',p);if(Number.isInteger(v)&&typeof v==='number'){p.floatKeys=['v'];add('schema',p);}}
for(const id of [null,true,false,0,1,'1'])for(const expected of [true,1,'1'])for(const shape of ['result','error','both','neither'])for(const error of [null,[],{code:0,message:'ok'},{code:true,message:'bad'},{code:-1,message:'\u0085'},{code:-1,message:'\ufeff'}]){const m={jsonrpc:'2.0',id};if(shape==='result'||shape==='both')m.result=null;if(shape==='error'||shape==='both')m.error=error;add('rpc',{message:m,expected});}
for(const field of ['idType','codeType','expectedType'])add('rpc',{message:{jsonrpc:'2.0',id:1,error:{code:1,message:'error'}},expected:1,[field]:'float'});
let seed=251019;const rand=n=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)%n);
for(let i=0;i<180;i++){const n=rand(5),callIds=Array.from({length:n},(_,j)=>String.fromCharCode(97+j)),responses=Array.from({length:rand(9)},()=>[String.fromCharCode(97+rand(6)),structuredClone(values[rand(values.length)])]);const p={callIds,responses};for(let j=0;j<=responses.length;j++)add('merge',p,j);const base=[.125,.5,1,2][rand(4)],cap=base+[0,.25,1,5][rand(4)];add('backoff',{outcomes:Array.from({length:rand(25)},()=>rand(3)===0),base,cap});}
add('backoff',{outcomes:Array(300).fill(false),base:1,cap:3});
const ps=Object.fromEntries(Object.entries(M.ids).map(([k,id])=>[k,problems.find(p=>p.id===id)])),names={parse:'parse_tool_call',schema:'validate_tool_request',rpc:'classify_rpc_response',merge:'merge_results',backoff:'retry_delays'};
const python=String.raw`
import sys,json,copy,math,decimal
data=json.load(sys.stdin);fs={};tests=0;decimal.getcontext().prec=80
for k,code in data['refs'].items():
 ns={};exec(code,ns);fs[k]=ns[data['names'][k]]
 for test in data['tests'][k]:exec(test['code'],ns);tests+=1
def oracle(k,p,count):
 if k=='parse':
  try:o=json.loads(p['raw'])
  except (ValueError,TypeError):return None
  return {key:o[key] for key in ['tool','arguments']} if type(o)==dict and type(o.get('tool'))==str and any(not c.isspace() for c in o['tool']) and type(o.get('arguments'))==dict else None
 if k=='schema':
  r,s=p['request'],p['registry'];name=r.get('tool')
  if name not in s:return 'unknown_tool'
  a=r.get('arguments');schema=s[name]
  if type(a)!=dict or sorted(a)!=sorted(schema):return 'invalid_arguments'
  return 'ok' if all(type(a[key]).__name__==tag for key,tag in schema.items()) else 'invalid_arguments'
 if k=='rpc':
  m,e=p['message'],p['expected']
  if type(m)!=dict or m.get('jsonrpc')!='2.0' or type(e) not in [str,int] or 'id' not in m or type(m['id'])!=type(e) or m['id']!=e:return 'invalid'
  fields=[key for key in ['result','error'] if key in m]
  if len(fields)!=1:return 'invalid'
  if fields[0]=='result':return 'success'
  err=m['error']
  return 'remote_error' if type(err)==dict and type(err.get('code'))==int and type(err.get('message'))==str and any(not c.isspace() for c in err['message']) else 'invalid'
 if k=='merge':
  # Independently scan the processed prefix once per dispatch ID.
  return [(id,next((v for key,v in p['responses'][:count] if key==id),None)) for id in p['callIds']]
 # Direct Decimal exponent from streak, independent of bounded-delay doubling.
 out=[];streak=0
 for ok in p['outcomes']:
  streak=0 if ok else streak+1
  out.append(0.0 if ok else float(min(decimal.Decimal(str(p['cap'])),decimal.Decimal(str(p['base']))*(decimal.Decimal(2)**(streak-1)))))
 return out
for c in data['cases']:
 k,p,tr=c['kind'],copy.deepcopy(c['p']),c['trace'];count=c.get('count',len(p.get('responses',[])))
 if k=='schema':
  for key in p.get('floatKeys',[]):
   if key in p['request']['arguments']:p['request']['arguments'][key]=float(p['request']['arguments'][key])
 if k=='rpc':
  for hint,obj,key in [('idType',p['message'],'id'),('codeType',p['message'].get('error',{}) if isinstance(p['message'],dict) else {},'code'),('expectedType',p,'expected')]:
   if p.get(hint)=='float' and isinstance(obj,dict) and key in obj:obj[key]=float(obj[key])
 args=[p['raw']] if k=='parse' else [p['request'],p['registry']] if k=='schema' else [p['message'],p['expected']] if k=='rpc' else [p['callIds'],p['responses'][:count]] if k=='merge' else [p['outcomes'],p['base'],p['cap']]
 before=copy.deepcopy(args);actual=fs[k](*args);expected=oracle(k,p,count)
 # JSON normalizes the Python tuple results from merge into arrays.
 assert json.loads(json.dumps(actual))==json.loads(json.dumps(expected))==tr['output'],(k,p,actual,expected,tr['output'])
 assert args==before
 if k=='parse' and actual is not None:
  assert tr['dropped']==[key for key in json.loads(p['raw']) if key not in ['tool','arguments']]
 if k=='schema' and tr.get('rows'):
  a=p['request']['arguments'];active=not tr['missing'] and not tr['extra']
  for row in tr['rows']:
   assert row['actual']==(type(a[row['key']]).__name__ if row['key'] in a else None)
   assert row['checked']==active
   if active and type(a[row['key']]).__name__!=row['expected']:active=False
 if k=='merge':
  for s in tr['slots']:
   hits=[(i,v) for i,(id,v) in enumerate(p['responses'][:count]) if id==s['id']]
   assert s['received']==bool(hits);assert s['arrival']==(hits[0][0] if hits else None)
  for row in tr['rows']:
   i=row['i'];id=row['id'];prior=[key for key,v in p['responses'][:i]]
   decision='pending' if i>=count else 'unknown' if id not in p['callIds'] else 'duplicate' if id in prior else 'accepted'
   assert row['decision']==decision
 if k=='backoff':
  for i,row in enumerate(tr['rows']):
   last_success=max([j for j in range(i+1) if p['outcomes'][j]]+[-1]);streak=i-last_success
   prev=actual[i-1] if i else 0
   assert row['before']==prev and row['streak']==streak
   assert row['candidate']==(0 if row['success'] else p['base'] if prev==0 else 2*prev)
   assert row['delay']==actual[i] and row['delay']<=p['cap'] and (not row['success'] or row['streak']==0)
 if 'gates' in tr:
  fails=[i for i,g in enumerate(tr['gates']) if not g['pass']];assert not fails or fails==[len(tr['gates'])-1]
print('PASS',len(data['cases']),'traces against original Python and independent gate/first-match/Decimal-exponent oracles;',tests,'original tests; float/int, Unicode whitespace, first-None and empty/reset boundaries')
`;
const run=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,names,refs:Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.solution])),tests:Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.tests]))}),encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(run.status,0,run.stdout+'\n'+run.stderr);console.log(run.stdout.trim());
const chinese=await loadChinese();let states=0;
for(const c of cases.filter((_,i)=>i<80||i%37===0))for(let index=0;index<Math.max(1,(c.trace.gates||c.trace.rows).length);index++){
 const en=V.renders[c.kind](c.trace,index),zh=V.renders[c.kind](c.trace,index,true);for(const html of [en,zh]){assert.doesNotMatch(html,/NaN|undefined|Infinity/);assert.deepEqual(JSON.parse(decodeHtml(html.match(/data-trace-output="([^"]*)"/)[1])),c.trace.output);}assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary:chinese.dictionary}),zh,'Static/runtime translation mismatch: '+c.kind);states+=2;
}
for(const[k,id]of Object.entries(M.ids))for(const locale of ['','zh/']){const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests',code),sources=html.indexOf('<section class="lesson-resources">');assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/data-reset-lesson[^>]*disabled/);assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),ps[k].solution);assert.match(html,/r25-figure/);if(locale)for(const en of Object.keys(V.round25Translations).filter(x=>x.length>35))assert.ok(!decodeHtml(html.slice(visual,code)).includes(en),'Untranslated: '+en);}
for(const p of [{outcomes:[false],base:0,cap:1},{outcomes:[false],base:2,cap:1},{outcomes:[1],base:1,cap:2}])assert.throws(()=>M.backoffTrace(p),RangeError);assert.throws(()=>M.mergeTrace({callIds:['a','a'],responses:[]}),RangeError);assert.throws(()=>M.mergeTrace(M.presets.merge.basic,-1),RangeError);
for(const zh of [false,true])assert.match(V.renderInvalid(zh),/role="alert"/);
assert.equal(M.fromPreset('schema',M.presets.schema.float).output,'invalid_arguments');assert.equal(M.fromPreset('rpc',M.presets.rpc.basic).output,'success');assert.deepEqual(M.mergeTrace(M.presets.merge.basic,1).slots[1],{id:'b',received:true,value:null,arrival:0});assert.equal(M.mergeTrace(M.presets.merge.basic).output[1][1],null);
for(const name of ['lesson-ui-round25.js','lesson-round25-math.mjs','lesson-round25-view.mjs'])await readFile(join(siteRoot,'assets',name));console.log(`PASS ${states} EN/ZH rendered states; original Python preserved, references last, gate stop states, processed prefixes, translation parity and no-JS fallbacks`);
