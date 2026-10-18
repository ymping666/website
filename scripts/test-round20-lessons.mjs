import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import * as M from '../src/lesson-round20-math.mjs';
import * as V from '../src/lesson-round20-view.mjs';
import '../src/visual-lessons-round20.mjs';
import {decodeHtml,loadChinese,localizeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
const ids={delta:'video-temporal-velocity',flatten:'video-latent-sequence',patch:'video-temporal-patchify',context:'video-causal-token-context',nll:'video-token-cross-entropy'};
const names={delta:'frame_deltas',flatten:'flatten_video_codes',patch:'temporal_patchify',context:'causal_token_contexts',nll:'video_token_nll'};
const previous={};
for(const name of ['extra','frontier',...Array.from({length:16},(_,i)=>'round'+(i+4))]){const module=await import('../src/visual-lessons-'+name+'.mjs');for(const[k,v]of Object.entries(module))if(k.endsWith('Translations'))Object.assign(previous,v);}
for(const[k,v]of Object.entries(V.round20Translations))if(k in previous)assert.equal(v,previous[k],'Translation collision: '+k);
const cases=[],renders=[],errors=[];
function add(kind,args,render=false){const before=JSON.stringify(args),trace=M[kind+'Trace'](...args);assert.equal(JSON.stringify(args),before,'Trace must not mutate inputs');const c={kind,args,trace};cases.push(c);if(render)renders.push(c);return trace;}
for(const p of Object.values(M.deltaPresets))for(let i=0;i<Math.max(1,p.frames.length-1);i++)for(let bump=-2;bump<=2;bump+=.5)add('delta',[p.frames.map((row,t)=>row.map((v,d)=>v+(t===i+1&&d===0?bump:0)))],true);
for(const [name,p]of Object.entries(M.flattenPresets))if(name!=='invalid')add('flatten',[p.codes],true);
for(const[name,p]of Object.entries(M.patchPresets))if(name!=='invalid')for(let size=1;size<=4;size++)add('patch',[p.frames,size],true);
for(const[name,p]of Object.entries(M.contextPresets))if(name!=='invalid')for(let size=0;size<=5;size++)add('context',[p.tokens,size],true);
for(const[name,p]of Object.entries(M.nllPresets)){
 if(name==='error'){assert.throws(()=>M.nllTrace(p.probabilities,p.targets),/zero probability/);errors.push([p.probabilities,p.targets]);continue;}
 add('nll',[p.probabilities,p.targets],true);
 for(let i=0;i<p.targets.length;i++)for(let k=0;k<=20;k++){
  const before=JSON.stringify(p),probabilities=M.adjustProbability(p.probabilities,p.targets,i,k/20);assert.equal(JSON.stringify(p),before);assert.ok(probabilities.every(row=>Math.abs(row.reduce((a,b)=>a+b,0)-1)<1e-12));
  for(let j=0;j<p.targets.length;j++)if(j!==i)assert.deepEqual(probabilities[j],p.probabilities[j],'Editing a target must not change other time steps');
  if(k===0){assert.throws(()=>M.nllTrace(probabilities,p.targets),/zero probability/);errors.push([probabilities,p.targets]);}else add('nll',[probabilities,p.targets],true);
 }
}
let seed=201018;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),int=n=>Math.floor(rand()*n),vec=d=>Array.from({length:d},()=>(int(41)-20)/4);
for(let k=0;k<200;k++){
 const count=int(8),d=int(5),frames=Array.from({length:count},()=>vec(d));add('delta',[frames]);add('patch',[frames,1+int(5)]);add('context',[Array.from({length:count},()=>int(5)),int(10)]);
 const h=1+int(3),w=1+int(4);add('flatten',[Array.from({length:1+int(3)},()=>Array.from({length:h},()=>Array.from({length:w},()=>int(7))))]);
 const distributions=[],targets=[];for(let t=0;t<count;t++){const raw=Array.from({length:2+int(4)},()=>1+int(19)),sum=raw.reduce((a,b)=>a+b,0);distributions.push(raw.map(x=>x/sum));targets.push(int(raw.length));}add('nll',[distributions,targets]);
}
const ps=Object.fromEntries(Object.entries(ids).map(([kind,id])=>[kind,problems.find(p=>p.id===id)])),refs=Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.solution]));
const python=String.raw`
import sys,json,math,copy,decimal
decimal.getcontext().prec=65;D=lambda x:decimal.Decimal(str(x));data=json.load(sys.stdin);functions={};tests=0
for k,code in data['refs'].items():
 ns={};exec(code,ns);functions[k]=ns[data['names'][k]]
 for test in data['tests'][k]:exec(test['code'],ns);tests+=1
def close(a,b):
 if isinstance(a,(list,tuple)):
  assert len(a)==len(b),(a,b)
  for x,y in zip(a,b):close(x,y)
 else:assert math.isclose(float(a),float(b),rel_tol=3e-11,abs_tol=1e-11),(a,b)
for c in data['cases']:
 kind,args,tr=c['kind'],c['args'],c['trace'];before=copy.deepcopy(args);actual=functions[kind](*args);close(actual,tr['output'])
 if kind=='delta':
  frames=args[0];T=len(frames);d=len(frames[0]) if T else 0
  # Independent multiplication by a first-difference matrix.
  matrix=[[(-1 if j==i else 1 if j==i+1 else 0) for j in range(T)] for i in range(max(0,T-1))]
  expected=[[sum((D(row[j])*D(frames[j][c]) for j in range(T)),D(0)) for c in range(d)] for row in matrix];close(actual,expected)
  if T>=2:
   for c in range(d):close(sum(D(v[c]) for v in actual),D(frames[-1][c])-D(frames[0][c]))
 elif kind=='flatten':
  codes=args[0];T,H,W=len(codes),len(codes[0]),len(codes[0][0]);expected=[]
  for k in range(T*H*W):
   t,rem=divmod(k,H*W);y,x=divmod(rem,W);expected.append(codes[t][y][x]);r=tr['rows'][k];assert (r['t'],r['y'],r['x'],r['k'])==(t,y,x,k)
  close(actual,expected)
 elif kind=='patch':
  frames,p=args;count=len(frames)//p;d=len(frames[0]) if frames else 0;flat=[x for f in frames[:count*p] for x in f]
  expected=[flat[g*p*d:(g+1)*p*d] for g in range(count)];close(actual,expected);assert len(actual)==count and tr['used']==count*p and tr['dropped']==len(frames)-count*p
  for row in tr['rows']:
   assert row['end']-row['start']==p
   for term in row['terms']:
    assert term['j']==(term['t']-row['start'])*d+term['c'];close(term['value'],frames[term['t']][term['c']]);assert term['t']<count*p
 elif kind=='context':
  tokens,K=args;expected=[[token for j,token in enumerate(tokens) if 0<=i-j-1<K] for i in range(len(tokens))];close(actual,expected)
  for r in tr['rows']:assert r['indices']==[j for j in range(len(tokens)) if 0<=r['i']-j-1<K];assert all(j<r['i'] for j in r['indices'])
 else:
  probabilities,targets=args;product=D(1)
  for i,(row,y) in enumerate(zip(probabilities,targets)):
   prob=D(row[y]);product*=prob;close(tr['rows'][i]['probability'],prob);close(tr['rows'][i]['loss'],-prob.ln())
  # -log(product of true probabilities)/T rather than the JS sum of logs.
  expected=-product.ln()/len(targets) if targets else D(0);close(actual,expected);assert actual>=0
 assert args==before
for args in data['errors']:
 try:functions['nll'](*args);raise AssertionError('zero target probability accepted')
 except ValueError:pass
print('PASS',len(data['cases']),'video traces against original Python and independent matrix/inverse-index/retained-prefix/context-predicate/geometric-likelihood oracles;',tests,'original tests;',len(data['errors']),'zero-target errors')
`;
const run=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs,names,errors,tests:Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.tests]))}),encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(run.status,0,run.stdout+'\n'+run.stderr);console.log(run.stdout.trim());
const chinese=await loadChinese();let states=0;
for(const c of renders)for(let i=0;i<Math.max(1,c.trace.rows.length);i++){
 const fn=V['render'+c.kind[0].toUpperCase()+c.kind.slice(1)],en=fn(c.trace,i),zh=fn(c.trace,i,true);
 for(const html of [en,zh]){assert.doesNotMatch(html,/NaN|undefined|Infinity/);assert.deepEqual(JSON.parse(decodeHtml(html.match(/data-trace-output="([^"]*)"/)[1])),c.trace.output);}
 const localized=localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary:chinese.dictionary});assert.ok(localized===zh,'Static/client translation mismatch: '+c.kind);states+=2;
}
for(const[k,id]of Object.entries(ids))for(const locale of ['','zh/']){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests'),sources=html.indexOf('<section class="lesson-resources">');assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/<math /);assert.match(html,/data-reset-lesson[^>]*disabled/);assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[k]);
 if(locale)for(const en of Object.keys(V.round20Translations).filter(x=>x.length>25))assert.ok(!decodeHtml(html.slice(visual,code)).includes(en),'Untranslated: '+en);
}
for(const fn of [()=>M.deltaTrace([[1],[2,3]]),()=>M.flattenTrace([]),()=>M.flattenTrace([[[1]],[[2,3]]]),()=>M.patchTrace([[1]],0),()=>M.patchTrace([[1],[2,3]],2),()=>M.contextTrace([1],-1),()=>M.contextTrace([1.5],2),()=>M.nllTrace([[.2,.2]],[0])])assert.throws(fn,RangeError);
for(const zh of [false,true]){assert.match(V.renderInvalid(zh),/role="alert"/);assert.doesNotMatch(V.renderInvalid(zh),/data-trace-output/);for(const[ps,ts]of errors){const html=V.renderNllError(ps,ts,0,zh);assert.match(html,/role="alert"/);assert.doesNotMatch(html,/data-trace-output/);assert.match(html,/ValueError/);}}
assert.deepEqual(M.deltaTrace([[],[],[]]).output,[[],[]]);assert.deepEqual(M.patchTrace([[],[],[]],2).output,[[]]);assert.deepEqual(M.contextTrace([1,2],0).output,[[],[]]);assert.equal(M.nllTrace([],[]).output,0);
assert.match(V.renderNll(M.nllTrace(M.nllPresets.near.probabilities,[0])),/0\.99999999/);assert.match(V.renderNll(M.nllTrace(M.nllPresets.near.probabilities,[0])),/e-8/);assert.notEqual(V.probabilityText(1-1e-12),'1');assert.match(V.equation('-log(1e-12)'),/<msup><mn>10<\/mn><mn>−12<\/mn>/);
for(const name of ['lesson-ui-round20.js','lesson-round20-math.mjs','lesson-round20-view.mjs'])await readFile(join(siteRoot,'assets',name));
console.log(`PASS ${states} bilingual render states; 10 complete editorial pages; original solutions, native math, bottom sources, translation collisions, empty/zero-dimensional/error states and near-one probability precision`);
