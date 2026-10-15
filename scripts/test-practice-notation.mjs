import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {problems} from '../src/problems.mjs';
import {mathExpression,mathMarkup,parseMath} from '../src/math-expression.mjs';
import {practiceExpressions,typesetPracticePage} from '../src/practice-notation.mjs';
import {originalMathText} from '../src/lesson-notation.mjs';
import {loadChinese,decodeHtml} from './localize.mjs';
import {pythonCommand,siteRoot} from './config.mjs';
const chinese=await loadChinese(),fragments=[];let changed=0,cards=0;
for(const locale of ['', 'zh/'])for(const p of problems)for(const kind of ['problems','editorials']){
 const html=await readFile(join(siteRoot,locale,kind,p.id,'index.html'),'utf8'),restored=decodeHtml(originalMathText(html)),t=locale?chinese.translate:s=>s;
 assert.ok(restored.includes(t(p.description)),`${p.id}: reversible description`);
 for(const req of p.requirements)assert.ok(restored.includes(t(req)),`${p.id}: reversible ${req}`);
 assert.doesNotMatch(html,/<math\b(?:(?!<\/math>)[\s\S])*?<math\b/,'MathML must never nest');
 const math=[...html.matchAll(/<math\b[\s\S]*?<\/math>/g)].map(m=>m[0]);fragments.push(...math);
 if(math.length)changed++;
 if(kind==='editorials'){
  assert.ok(html.includes('editorial-body practice-readable'));
  assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),p.solution);
  for(const card of html.matchAll(/<div class="lesson-formula[^\"]*">([\s\S]*?)<\/div>/g)){cards++;assert.doesNotMatch(card[1],/<code>/,'No remaining code-style mathematical formula cards');}
 }else{
  const data=JSON.parse(html.match(/id="challenge-json">([\s\S]*?)<\/script>/)[1]);assert.equal(data.starter,p.starter);assert.deepEqual(data.tests.map(t=>t.code),p.tests.map(t=>t.code));
 }
 assert.equal(typesetPracticePage(html,`/${kind}/${p.id}/`),html,'Idempotent formatting');
}
for(const[id,expressions]of Object.entries(practiceExpressions)){
 const p=problems.find(p=>p.id===id),text=[p.description,...p.requirements,...p.explanation,p.pitfall].join(' ').replace(/\s/g,'');
 for(const exp of expressions)assert.ok(text.includes(exp.replace(/\s/g,'')),`${id}: notation must come from actual authored content`);
}
const untouched='<main><p>JSON x0 scores[-1] - scores[-2] code</p><pre>x0</pre><script>x0</script></main>';
assert.equal(typesetPracticePage(untouched,'/zh/labs/'),untouched);
for(const invalid of ['x +','sum(v*v for v in x)','scores[-1:]','x;y','x @ y'])assert.throws(()=>parseMath(invalid));
const expressions=['x+y*z','(x+y)*z','x/(1+y**2)','-x**2','(-x)**2','2**3**2','2**-2','sqrt(x**2+eps)','exp(x/2)','max(x,min(y,z))','(f(x+h)-f(x-h))/(2*h)','m/(1-beta**step)','x*(1-lr*decay)-lr*m/(sqrt(v)+eps)','a[i][j]*b[j]','x>=y'];
const cases=[];
for(let j=0;j<20;j++)for(const source of expressions){const variables={x:(j-10)/5,y:(j-8)/4,z:(j-6)/3,eps:.001,h:.01,m:.3,v:.4,beta:.9,step:1+j,lr:.01,decay:.1,a:[[1,2],[3,4]],b:[.5,-.5],i:j%2,j:(j+1)%2};cases.push({source,variables,math:mathMarkup(mathExpression(source))});}
const python=String.raw`
import json,sys,math,xml.etree.ElementTree as ET
data=json.load(sys.stdin)
for fragment in data['fragments']:ET.fromstring(fragment)
def local(e):return e.tag.split('}')[-1]
def expr(e,env):
 tag=local(e);children=list(e)
 if tag in ('mi','mn'):return e.text or ''
 if tag=='mo':return {'−':'-','·':'*','≤':'<=','≥':'>=','≠':'!=','=':'=='}.get(e.text,e.text or '')
 if tag in ('math','mstyle','mrow'):return ''.join(expr(c,env) for c in children)
 if tag=='mfrac':return '('+expr(children[0],env)+')/('+expr(children[1],env)+')'
 if tag=='msup':return '('+expr(children[0],env)+')**('+expr(children[1],env)+')'
 if tag=='msqrt':return 'sqrt('+expr(children[0],env)+')'
 if tag=='msub':
  base=expr(children[0],env);index=expr(children[1],env);name=base+'_'+index
  if name in env:return name
  return base+''.join('['+v+']' for v in index.split(','))
 raise AssertionError(tag)
for case in data['cases']:
 env=dict(case['variables'],sqrt=math.sqrt,exp=math.exp,min=min,max=max,f=lambda x:x*x*x)
 for code,symbol in {'beta':'β','eps':'ε'}.items():env[symbol]=env[code]
 original=eval(case['source'],{'__builtins__':{}},env)
 rendered=eval(expr(ET.fromstring(case['math']),env),{'__builtins__':{}},env)
 assert math.isclose(original,rendered,rel_tol=1e-12,abs_tol=1e-12),(case['source'],original,rendered)
print('PASS',len(data['cases']),'rendered arithmetic cases against Python; valid XML for',len(data['fragments']),'MathML fragments')
`;
const result=spawnSync(pythonCommand,['-c',python],{input:JSON.stringify({cases,fragments}),encoding:'utf8',maxBuffer:12*1024*1024});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);console.log(result.stdout.trim());
console.log(`PASS ${problems.length*4} bilingual challenge/editorial pages; ${changed} pages contain native math; ${cards} equation cards; original contracts, Python, judge payloads and reversible notation`);
