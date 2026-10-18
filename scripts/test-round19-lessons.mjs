import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import * as M from '../src/lesson-round19-math.mjs';
import * as V from '../src/lesson-round19-view.mjs';
import '../src/visual-lessons-round19.mjs';
import {decodeHtml,loadChinese,localizeHtml} from './localize.mjs';
import {siteRoot,siteBase,pythonCommand} from './config.mjs';
const ids={conv:'cnn-zero-padded-convolution',point:'cnn-pointwise-projection',max:'cnn-max-pooling',avg:'cnn-average-pooling',patch:'vit-patchify'};
const names={conv:'conv2d_same',point:'pointwise_conv',max:'max_pool2d',avg:'avg_pool2d',patch:'patchify'};
const previous={};
for(const name of ['extra','frontier',...Array.from({length:15},(_,i)=>'round'+(i+4))]){const module=await import('../src/visual-lessons-'+name+'.mjs');for(const[k,v]of Object.entries(module))if(k.endsWith('Translations'))Object.assign(previous,v);}
for(const[k,v]of Object.entries(V.round19Translations))if(k in previous)assert.equal(v,previous[k],'Translation collision: '+k);
const cases=[],renders=[];
function add(kind,args,render=false){const before=JSON.stringify(args),fn=kind==='max'||kind==='avg'?a=>M.poolTrace(a,kind):M[kind+'Trace'],trace=fn(...args);assert.equal(JSON.stringify(args),before,'Trace must not mutate inputs');const c={kind,args,trace};cases.push(c);if(render)renders.push(c);return trace;}
for(const p of Object.values(M.convPresets))if(p.image.length)add('conv',[p.image,p.kernel],true);
for(const p of Object.values(M.pointPresets))if(p.channels.length)for(let w=-2;w<=2;w+=.5){const weights=p.weights.map(r=>r.slice());weights[0][0]=w;add('point',[p.channels,weights,p.biases],true);}
for(const kind of ['max','avg'])for(const p of Object.values(M.poolPresets))if(p.image.length>=2)add(kind,[p.image],true);
for(const p of Object.values(M.patchPresets))if(p.image[0].length%p.p===0)add('patch',[p.image,p.p],true);
let seed=191018;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),int=n=>Math.floor(rand()*n),mat=(h,w)=>Array.from({length:h},()=>Array.from({length:w},()=>(int(33)-16)/4));
for(let k=0;k<180;k++){
 const h=1+int(5),w=1+int(5),ci=1+int(3),co=1+int(3),p=1+int(3);
 add('conv',[mat(h,w),mat(1+2*int(3),1+2*int(3))]);
 add('point',[Array.from({length:ci},()=>mat(h,w)),mat(co,ci),Array.from({length:co},()=>int(7)-3)]);
 const image=mat(2+int(5),2+int(5));add('max',[image]);add('avg',[image]);
 add('patch',[mat(p*(1+int(3)),p*(1+int(3))),p]);
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
 else:assert math.isclose(float(a),float(b),rel_tol=1e-12,abs_tol=1e-12),(a,b)
for c in data['cases']:
 k,args,tr=c['kind'],c['args'],c['trace'];before=copy.deepcopy(args);actual=functions[k](*args);close(tr['output'],actual)
 if k=='conv':
  im,ker=args;h,w=len(im),len(im[0]);ph,pw=len(ker)//2,len(ker[0])//2
  # Scatter each original pixel's weighted contributions onto output centers.
  expected=[[D(0) for _ in range(w)] for _ in range(h)]
  for r in range(h):
   for col in range(w):
    for a in range(len(ker)):
     for b in range(len(ker[0])):
      i,j=r-a+ph,col-b+pw
      if 0<=i<h and 0<=j<w:expected[i][j]+=D(im[r][col])*D(ker[a][b])
  close(actual,expected)
  for row in tr['rows']:
   for term in row['terms']:
    r,col=term['r'],term['c'];valid=0<=r<h and 0<=col<w
    assert term['padded']==(not valid)
    close(term['pixel'],im[r][col] if valid else 0);close(term['product'],D(term['pixel'])*D(term['weight']))
 elif k=='point':
  channels,weights,biases=args;h,w=len(channels[0]),len(channels[0][0]);pixels=list(zip(*[sum(ch,[]) for ch in channels]));expected=[]
  for ws,bias in zip(weights,biases):
   flat=[D(bias)+sum((D(x)*D(y) for x,y in zip(pixel,ws)),D(0)) for pixel in pixels];expected.append([flat[i*w:(i+1)*w] for i in range(h)])
  close(actual,expected)
  for row in tr['rows']:
   close(row['value'],D(row['bias'])+sum((D(t['product']) for t in row['terms']),D(0)))
   for t in row['terms']:close(t['pixel'],channels[t['c']][row['i']][row['j']]);close(t['product'],D(t['pixel'])*D(t['weight']))
 elif k in ('max','avg'):
  im=args[0];expected=[]
  # Slice pairs of rows, then zip matching complete two-column chunks.
  for r in range(0,len(im)-1,2):
   top=[im[r][j:j+2] for j in range(0,len(im[0])-1,2)];bottom=[im[r+1][j:j+2] for j in range(0,len(im[0])-1,2)]
   blocks=[a+b for a,b in zip(top,bottom)];expected.append([max(v) if k=='max' else sum(map(D,v))/4 for v in blocks])
  close(actual,expected)
  for row in tr['rows']:
   assert len(row['values'])==4;close(row['sum'],sum(map(D,row['values'])));assert min(row['values'])<=row['value']<=max(row['values'])
 else:
  im,p=args;gw=len(im[0])//p;rebuilt=[[None]*len(im[0]) for _ in im];seen=set()
  for i,row in enumerate(im):
   for j,value in enumerate(row):
    patch=(i//p)*gw+j//p;offset=(i%p)*p+j%p
    assert (patch,offset) not in seen;seen.add((patch,offset));rebuilt[i][j]=actual[patch][offset]
  close(rebuilt,im);assert len(seen)==len(im)*len(im[0]);assert len(actual)==len(im)*len(im[0])//(p*p)
  for row in tr['rows']:
   for term in row['terms']:assert term['j']==term['dr']*p+term['dc'];close(term['value'],im[term['r']][term['c']])
 assert args==before
print('PASS',len(data['cases']),'spatial traces against original Python and independent scatter/matrix/slice/inverse-index oracles;',tests,'original tests')
`;
const run=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,refs,names,tests:Object.fromEntries(Object.entries(ps).map(([k,p])=>[k,p.tests]))}),encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(run.status,0,run.stdout+'\n'+run.stderr);console.log(run.stdout.trim());
const chinese=await loadChinese();let states=0;
for(const c of renders)for(let i=0;i<c.trace.rows.length;i++){
 const fn=c.kind==='max'||c.kind==='avg'?V.renderPool:V['render'+c.kind[0].toUpperCase()+c.kind.slice(1)],en=fn(c.trace,i),zh=fn(c.trace,i,true);
 for(const html of [en,zh]){assert.doesNotMatch(html,/NaN|undefined|Infinity/);assert.deepEqual(JSON.parse(decodeHtml(html.match(/data-trace-output="([^"]*)"/)[1])),c.trace.output);assert.match(html,/<figure/);if(c.kind!=='point')assert.ok(html.includes('<math '),'Numeric formula missing: '+c.kind);assert.match(html,/aria-label=/);}
 assert.equal(localizeHtml(en,'',{base:siteBase(),origin:'https://tensordrill.com',dictionary:chinese.dictionary}),zh,'Static/client translation parity '+c.kind);states+=2;
}
const invalids=[()=>M.convTrace([],[[1]]),()=>M.convTrace([[1]],[[1,2]]),()=>M.convTrace([[1],[2,3]],[[1]]),()=>M.pointTrace([],[[1]],[0]),()=>M.pointTrace([[[1]]],[[1,2]],[0]),()=>M.poolTrace([[1]],'max'),()=>M.poolTrace([],'avg'),()=>M.patchTrace([[1,2,3],[4,5,6]],2),()=>M.patchTrace([[1]],0),()=>M.patchTrace([],1)];
for(const fn of invalids)assert.throws(fn,RangeError);
for(const k of Object.keys(ids))for(const zh of [false,true]){const html=V.renderInvalid(k,zh);assert.match(html,/role="alert"/);assert.doesNotMatch(html,/data-trace-output/);assert.match(html,zh?/请切换/:/Choose|choose/);}
assert.deepEqual(M.convTrace([[1,2]],[[1,2,3]]).output,[[8,5]]);
assert.deepEqual(M.poolTrace([[-5,-2],[-7,-3]],'max').output,[[-2]]);
assert.deepEqual(M.poolTrace(M.poolPresets.odd.image,'avg').output,[[3.5,5.5]]);
assert.deepEqual(M.patchTrace(M.patchPresets.basic.image,2).output[0],[1,2,5,6]);
for(const locale of ['','zh/'])for(const[k,id]of Object.entries(ids)){
 const html=await readFile(join(siteRoot,locale,'editorials',id,'index.html'),'utf8'),visual=html.indexOf('<section class="visual-lesson"'),code=html.indexOf('<pre class="code-pre">'),tests=html.indexOf(locale?'代表性测试':'Representative tests'),sources=html.indexOf('<section class="lesson-resources">');assert.ok(visual>0&&code>visual&&tests>code&&sources>tests);assert.match(html,/<noscript>/);assert.match(html,/<math /);assert.match(html,/data-reset-lesson[^>]*disabled/);assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),refs[k]);
 if(locale)for(const en of Object.keys(V.round19Translations).filter(x=>x.length>25))assert.ok(!decodeHtml(html.slice(visual,code)).includes(en),'Untranslated: '+en);
}
for(const name of ['lesson-ui-round19.js','lesson-round19-math.mjs','lesson-round19-view.mjs'])await readFile(join(siteRoot,'assets',name));
console.log(`PASS ${states} bilingual rendered states, 10 complete pages, original solutions/tests, localized formulas, bottom references and invalid/empty-input guards`);
