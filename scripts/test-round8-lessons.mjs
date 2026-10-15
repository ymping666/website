import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import {codebooks,distortionPresets,nearestTrace,usageTrace,indicesFromCounts,distortionInputs,distortionTrace} from '../src/lesson-round8-math.mjs';
import {renderNearest,renderUsage,renderDistortion,round8Translations} from '../src/lesson-round8-view.mjs';
import '../src/visual-lessons-round8.mjs';
import {pythonCommand,siteRoot,siteBase} from './config.mjs';
import {decodeHtml} from './localize.mjs';
const cases=[],funcs={nearest:nearestTrace,usage:usageTrace,distortion:distortionTrace};
const renderers={nearest:renderNearest,usage:renderUsage,distortion:renderDistortion};
function add(kind,args){const before=JSON.stringify(args),trace=funcs[kind](...args);assert.equal(JSON.stringify(args),before);cases.push({kind,args,trace});return trace;}
for(const book of Object.values(codebooks))for(let x=-2;x<=6;x++)for(let y=-2;y<=6;y++)add('nearest',[book[0].length?[x/2,y/2]:[],book]);
for(let a=0;a<=8;a++)for(let b=0;b<=8;b++)for(let c=0;c<=8;c++)for(let d=0;d<=8;d++)for(const k of [4,8])for(const repeats of [1,2,3])add('usage',[indicesFromCounts([a,b,c,d],repeats),k]);
for(const [preset,p] of Object.entries(distortionPresets))for(let a=0;a<=8;a++)for(const rows of [1,2,3])for(const features of [1,2]){
 const before=JSON.stringify(p),pair=distortionInputs(p,a/4,rows,features);assert.equal(JSON.stringify(p),before);const tr=add('distortion',[pair.encoder,pair.quantized]);
 assert.ok(Math.abs(tr.output-({mixed:2.25,matched:0,single:9,empty:0}[preset])*(a/4)**2)<1e-10);
 assert.equal(pair.encoder.length,p.encoder.length*rows);
 if(pair.encoder.length)assert.equal(pair.encoder[0].length,p.encoder[0].length*features);
}
const controlCases=cases.length;
let seed=81015;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
for(let j=0;j<100;j++){
 const dim=Math.floor(rand()*5),k=1+Math.floor(rand()*6),v=Array.from({length:dim},()=>rand()*4-1),book=Array.from({length:k},()=>v.map(()=>rand()*4-1));
 add('nearest',[v,book]);
 const nCodes=1+Math.floor(rand()*8),indices=Array.from({length:Math.floor(rand()*30)},()=>Math.floor(rand()*nCodes));add('usage',[indices,nCodes]);
 const n=Math.floor(rand()*5),d=1+Math.floor(rand()*4),encoder=Array.from({length:n},()=>Array.from({length:d},()=>rand()*4-2)),quantized=encoder.map(r=>r.map(()=>rand()*4-2));add('distortion',[encoder,quantized]);
}
const ids={nearest:'vqvae-nearest-code',usage:'vqvae-codebook-perplexity',distortion:'vqvae-quantization-error'};
const refs=Object.fromEntries(Object.entries(ids).map(([kind,id])=>[kind,problems.find(p=>p.id===id).solution]));
const python=String.raw`
import sys,json,math,copy,collections
data=json.load(sys.stdin);funcs={}
for kind,code in data['refs'].items():
 ns={};exec(code,ns);funcs[kind]=ns[{'nearest':'nearest_code_index','usage':'codebook_perplexity','distortion':'quantization_mse'}[kind]]
def close(a,b):
 assert math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-10),(a,b)
for c in data['cases']:
 kind,args,tr=c['kind'],c['args'],c['trace'];before=copy.deepcopy(args)
 if kind=='nearest':
  v,book=args;expected=min(range(len(book)),key=lambda i:(math.dist(v,book[i]),i))
  assert tr['index']==funcs[kind](*args)==expected
  assert tr['selected']==book[expected]
  for i,r in enumerate(tr['rows']):
   differences=[x-y for x,y in zip(v,book[i])]
   assert r['differences']==differences
   for square,delta in zip(r['squares'],differences):close(square,delta**2)
   close(r['distance'],math.dist(v,book[i])**2)
  assert tr['ties']==[r['i'] for r in tr['rows'] if r['distance']==tr['rows'][tr['index']]['distance']]
 else:
  close(tr['output'],funcs[kind](*args))
  if kind=='usage':
   indices,k=args;counts=collections.Counter(indices);n=len(indices)
   assert tr['total']==n and tr['active']==len(counts)
   if not n:assert tr['output']==0 and tr['entropy'] is None
   else:
    # Independent count-space identity H = ln N - sum(c ln c)/N.
    h=math.log(n)-math.fsum(c*math.log(c) for c in counts.values())/n
    close(tr['entropy'],h);close(tr['output'],math.exp(h))
    assert 1-1e-10<=tr['output']<=len(counts)+1e-10
    close(funcs[kind](indices*2,k+3),tr['output'])
   for r in tr['rows']:
    assert r['count']==counts[r['k']]
    close(r['p'],counts[r['k']]/n if n else 0)
    close(r['term'],-r['p']*math.log(r['p']) if r['p'] else 0)
  else:
   encoder,quantized=args;n=len(encoder);count=sum(map(len,encoder))
   total=math.fsum(math.dist(a,b)**2 for a,b in zip(encoder,quantized))
   assert tr['count']==count;close(tr['total'],total);close(tr['output'],total/count if count else 0)
   close(funcs[kind](encoder*2,quantized*2),tr['output'])
   close(funcs[kind](quantized,encoder),tr['output'])
   for r in tr['rows']:
    a,b=encoder[r['n']][r['d']],quantized[r['n']][r['d']]
    close(r['encoder'],a);close(r['quantized'],b);close(r['difference'],a-b);close(r['square'],(a-b)**2)
 assert args==before
print('PASS',len(data['cases']),'VQ-VAE traces: existing Python solutions, independent distance/entropy identities, reductions and immutability')
`;
const result=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs}),encoding:'utf8',maxBuffer:16*1024*1024});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);console.log(result.stdout.trim());
// Every control state gets a renderer check; randomized high-dimensional inputs stay math-only.
for(const {kind,trace} of cases.slice(0,controlCases)){
 const html=renderers[kind](trace);assert.doesNotMatch(html,/NaN|Infinity|undefined/);
 for(const [,width] of html.matchAll(/<rect[^>]*width="([^"]+)"/g))assert.ok(Number(width)>=0);
}
assert.equal(nearestTrace([1,1],codebooks.square).index,0);
assert.deepEqual(nearestTrace([1,1],codebooks.square).ties,[0,1,2,3]);
assert.equal(nearestTrace([],codebooks.emptyDimensions).index,0);
assert.equal(usageTrace([],4).entropy,null);assert.equal(usageTrace([],4).output,0);
assert.equal(usageTrace([0,1,2,3],4).output,4);
assert.equal(distortionTrace([[0,2],[2,2]],[[1,0],[2,4]]).output,2.25);
for(const locale of ['','zh/'])for(const [kind,id] of Object.entries(ids)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),decoded=decodeHtml(html);
 const visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests'),sources=html.indexOf('<section class="lesson-resources">');
 assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/data-reset-lesson[^>]*disabled/);
 assert.ok(html.includes(`src="${siteBase()}assets/lesson-ui.js"`));assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[kind]);
 if(locale){const en=decodeHtml(await readFile(join(siteRoot,'editorials',id,'index.html'),'utf8'));
  for(const [original,translated] of Object.entries(round8Translations))if(en.includes('>'+original+'<'))assert.ok(decoded.includes(translated),original);
  assert.doesNotMatch(decoded.slice(visual,code),/Function output|Codebook preset|Squared error sum|Empirical code usage/);
 }
}
for(const file of ['lesson-ui-round8.js','lesson-round8-math.mjs','lesson-round8-view.mjs'])await readFile(join(siteRoot,'assets',file));
console.log(`PASS ${controlCases} reachable control states + 300 seeded examples; six bilingual pages, static fallbacks, local assets, bottom sources and unchanged Python`);
