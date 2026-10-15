import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import {typesetFlowPage} from '../src/flow-notation.mjs';
import {originalMathText} from '../src/lesson-notation.mjs';
import {decodeHtml,loadChinese} from './localize.mjs';
import {siteRoot} from './config.mjs';
const ids=['flow-conditional-velocity','flow-euler-integration','flow-heun-integration'];
const chinese=await loadChinese();
for(const locale of ['', 'zh/'])for(const id of ids)for(const kind of ['editorials','problems']){
  const p=problems.find(p=>p.id===id),html=await readFile(join(siteRoot,locale,kind,id,'index.html'),'utf8');
  const restored=decodeHtml(originalMathText(html)),translate=locale?chinese.translate:s=>s;
  assert.ok(restored.includes(translate(p.description)),`${locale}${kind}/${id}: original description`);
  for(const req of p.requirements)assert.ok(restored.includes(translate(req)),`${id}: unchanged requirement ${req}`);
  assert.ok(html.includes('req-list flow-contract'));
  const contract=html.match(/<ul class="req-list flow-contract">([\s\S]*?)<\/ul>/)[1];
  const visible=decodeHtml(contract.replace(/<math\b[\s\S]*?<\/math>/g,'').replace(/<[^>]*>/g,''));
  assert.doesNotMatch(visible,/x_pred|k1=v|x\s*<-|dt\*|dx_t\/dt/);
  assert.match(contract,/<msub>/);
  if(kind==='editorials'){
    assert.match(html,/<div class="lesson-formula flow-equations"><math/);
    assert.match(html,/<mtable/);
    assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),p.solution);
  }else{
    const data=JSON.parse(html.match(/id="challenge-json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(data.starter,p.starter);assert.deepEqual(data.tests.map(t=>t.code),p.tests.map(t=>t.code));
  }
  if(id==='flow-heun-integration'){
    assert.match(contract,/<mover accent="true">/);
    assert.match(contract,/<mfrac><mi>h<\/mi><mn>2<\/mn><\/mfrac>/);
    assert.ok(html.includes(locale?'临时预测值':'temporary predictor'));
  }
  // Rendering again must neither nest MathML nor add another symbol legend.
  assert.equal(typesetFlowPage(html,`/${kind}/${id}/`),html);
}
const untouched='<main><p>x0 and x &lt;- x + dt*v</p></main>';
assert.equal(typesetFlowPage(untouched,'/editorials/attention-scaled-dot-product/'),untouched);
const protectedHtml='<html lang="en"><main class="workbench"><pre>x0 x_pred k1=v(x,t)</pre><code>x0</code><script>x0</script><textarea>x0</textarea><svg><text>x0</text></svg><math><mi>x0</mi></math></main>';
assert.equal(typesetFlowPage(protectedHtml,'/problems/flow-heun-integration/'),protectedHtml);
console.log('PASS 12 bilingual Flow pages: readable MathML, reversible contracts, unchanged Python and judge payloads, isolated and idempotent typography');
