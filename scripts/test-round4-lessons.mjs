import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {problems} from '../src/problems.mjs';
import {causalPresets,causalTrace,rmsPresets,rmsTrace,flowPresets,flowTrace} from '../src/lesson-round4-math.mjs';
import {round4Translations} from '../src/visual-lessons-round4.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
import {decodeHtml} from './localize.mjs';
const cases=[];
const encode=value=>Array.isArray(value)?value.map(encode):value===-Infinity?'-inf':value;
const causal=logits=>{const before=JSON.stringify(logits),trace=causalTrace(logits);assert.equal(JSON.stringify(logits),before);assert.notEqual(trace.logits,logits);cases.push({kind:'causal',args:[logits],actual:{masked:encode(trace.masked),weights:trace.weights}});};
for(const logits of Object.values(causalPresets))causal(logits);
causal([[1000,2000],[-1000,-1000]]);
for(const x of Object.values(rmsPresets))for(let scale=0;scale<=16;scale++)for(const eps of [0.000001,0.01,1]){
 const input=x.map(v=>v*scale/4),trace=rmsTrace(input,eps);
 assert.deepEqual(trace.x,input);assert.notEqual(trace.x,input);
 cases.push({kind:'rms',args:[input,eps],actual:trace});
}
for(const pair of Object.values(flowPresets))for(let step=0;step<=20;step++){
 const before=JSON.stringify(pair),trace=flowTrace(pair.x0,pair.x1,step/20);assert.equal(JSON.stringify(pair),before);
 cases.push({kind:'flow',args:[pair.x0,pair.x1,step/20],actual:trace});
}
let seed=72013;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
for(let i=0;i<250;i++){
 const n=Math.floor(rand()*8);causal(Array.from({length:n},()=>Array.from({length:n},()=>Math.floor(rand()*13)-6)));
 const x=Array.from({length:1+Math.floor(rand()*8)},()=>rand()*10-5),eps=10**(-1-Math.floor(rand()*8));
 cases.push({kind:'rms',args:[x,eps],actual:rmsTrace(x,eps)});
 const a=Array.from({length:n},()=>rand()*10-5),b=a.map(()=>rand()*10-5),t=rand();
 cases.push({kind:'flow',args:[a,b,t],actual:flowTrace(a,b,t)});
}
const ids={causal:'attention-causal-mask',rms:'norm-rmsnorm',flow:'flow-linear-interpolation'};
const solutions=Object.fromEntries(Object.entries(ids).map(([k,id])=>[k,problems.find(p=>p.id===id).solution]));
const python=String.raw`
import sys,json,math,copy
data=json.load(sys.stdin)
functions={}
for kind,code in data['solutions'].items():
 scope={};exec(code,scope);functions[kind]=scope[{'causal':'causal_mask','rms':'rms_norm','flow':'linear_flow_path'}[kind]]
def close(a,b):
 if isinstance(a,list):
  assert len(a)==len(b),(a,b)
  for x,y in zip(a,b):close(x,y)
 elif isinstance(a,str):assert a==b,(a,b)
 else:assert math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-10),(a,b)
for case in data['cases']:
 kind,args,trace=case['kind'],case['args'],case['actual'];before=copy.deepcopy(args)
 result=functions[kind](*args);assert args==before
 if kind=='causal':
  encoded=[[('-inf' if x==-math.inf else x) for x in row] for row in result];close(trace['masked'],encoded)
  for i,row in enumerate(args[0]):
   close(trace['masked'][i][:i+1],row[:i+1]);assert all(x=='-inf' for x in trace['masked'][i][i+1:])
   valid=row[:i+1];m=max(valid);e=[math.exp(v-m) for v in valid];z=math.fsum(e)
   expected=[v/z for v in e]+[0.0]*(len(row)-i-1);close(trace['weights'][i],expected)
   assert math.isclose(math.fsum(trace['weights'][i]),1.0);assert all(x==0 for x in trace['weights'][i][i+1:])
  assert result is not args[0] and all(out is not inp for out,inp in zip(result,args[0]))
 elif kind=='rms':
  x,eps=args;q=math.fsum(v*v for v in x)/len(x);denom=math.sqrt(q+eps);mu=math.fsum(x)/len(x)
  close(trace['output'],result);close(trace['output'],[v/denom for v in x]);close(trace['meanSquare'],q);close(trace['denominator'],denom)
  close(trace['squares'],[v*v for v in x]);close(trace['mean'],mu);close(trace['outputMean'],math.fsum(result)/len(x));close(trace['outputMeanSquare'],math.fsum(v*v for v in result)/len(x))
  std=math.sqrt(math.fsum((v-mu)**2 for v in x)/len(x)+eps);close(trace['layerNorm'],[(v-mu)/std for v in x])
  assert trace['outputMeanSquare']<=1+1e-12
 else:
  x0,x1,t=args;close(trace['output'],result);close(trace['output'],[a+t*(b-a) for a,b in zip(x0,x1)])
  close(trace['sourcePart'],[(1-t)*v for v in x0]);close(trace['targetPart'],[t*v for v in x1]);close(trace['velocity'],[b-a for a,b in zip(x0,x1)])
  if t==0:close(result,x0)
  if t==1:close(result,x1)
print('PASS',len(data['cases']),'round-4 traces: all reachable control settings + seeded cases, independent Python formulas, references and immutability')
`;
const result=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,solutions}),encoding:'utf8',maxBuffer:12*1024*1024});
assert.equal(result.status,0,result.stdout+'\n'+result.stderr);console.log(result.stdout.trim());
assert.deepEqual(causalTrace(causalPresets.uniform).weights,[[1,0,0],[0.5,0.5,0],[1/3,1/3,1/3]]);
assert.ok(rmsTrace([1,3],1).outputMean<1);assert.deepEqual(rmsTrace([3,3]).layerNorm,[0,0]);assert.deepEqual(rmsTrace([0,0]).output,[0,0]);
assert.deepEqual(flowTrace([-2,-1],[2,3],0.25).output,[-1,0]);assert.deepEqual(flowTrace([],[],0.5).output,[]);
const scripts=['lesson-ui.js','lesson-ui-round4.js','lesson-round4-math.mjs','lesson-round4-view.mjs','lesson-math.mjs'];
for(const locale of ['','zh/'])for(const id of Object.values(ids)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8');const code=html.indexOf('<pre class="code-pre">'),visual=html.indexOf('<section class="visual-lesson"'),sources=html.indexOf('<section class="lesson-resources">');
 assert.ok(visual>0&&code>visual&&sources>code);assert.ok(sources>html.indexOf(locale?'代表性测试':'Representative tests'));
 assert.ok(html.includes(`src="${siteBase()}assets/lesson-ui.js"`));assert.match(html,/<noscript>/);assert.match(html,/data-reset-lesson disabled/);assert.doesNotMatch(html.slice(visual,code),/href="https?:|<iframe/);
 const lesson=decodeHtml(html.slice(visual,code));
 if(locale)assert.doesNotMatch(lesson,/Selected query row|Allowed keys|Output mean|Interpolated point|Coordinate|Conditional path derivative/);
 if(id==='norm-rmsnorm'){assert.match(html,/<msqrt><mrow><mi>q<\/mi><mo>\+<\/mo><mi>ε<\/mi><\/mrow><\/msqrt>/);assert.doesNotMatch(html,/leaves its mean unchanged/);}
 const source={ 'attention-causal-mask':'d2l.ai/chapter_attention-mechanisms-and-transformers/transformer.html','norm-rmsnorm':'docs.pytorch.org/docs/stable/generated/torch.nn.RMSNorm.html','flow-linear-interpolation':'facebookresearch.github.io/flow_matching/_modules/flow_matching/path/affine.html'}[id];assert.ok(html.includes(source));
}
for(const name of scripts)await readFile(join(siteRoot,'assets',name));
// Every registered text token that is visible verbatim in English must be localized.
for(const id of Object.values(ids)){
 const en=decodeHtml(await readFile(join(siteRoot,'editorials',id,'index.html'),'utf8')),zh=decodeHtml(await readFile(join(siteRoot,'zh/editorials',id,'index.html'),'utf8'));
 for(const [original,translated] of Object.entries(round4Translations))if(en.includes('>'+original+'<'))assert.ok(zh.includes(translated),`Translation: ${original}`);
}
console.log('PASS six round-4 editorials: complete static examples, localized labels, native radical, bottom sources and runtime assets');
