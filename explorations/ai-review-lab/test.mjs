import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {proposal,partial,reference,fixtures,regressionTests,comparisonTest,parseExperiment,inputFor} from '../../src/labs/case.mjs';
import {render} from '../../src/labs/view.mjs';
import {server} from './serve.mjs';

assert.equal(fixtures.length,18);
assert.deepEqual(parseExperiment(JSON.stringify(inputFor(false))),inputFor(false));
assert.deepEqual(parseExperiment(JSON.stringify({reply:[],expected_id:'a'})),{reply:[],expected_id:'a'});
for(const bad of ['{', '{}', '{"reply":0,"expected_id":7}', '{"reply":0,"expected_id":""}', '{"reply":0,"expected_id":"a","extra":1}', '{"reply":1e309,"expected_id":"a"}', '{"reply":9007199254740993,"expected_id":"a"}']) assert.throws(()=>parseExperiment(bad));
assert.throws(()=>parseExperiment(JSON.stringify(inputFor('中'.repeat(3000)))),/size/);
assert.throws(()=>parseExperiment(JSON.stringify(inputFor(Array.from({length:13}).reduce(v=>[v],0)))),/depth/);
const source=readFileSync(new URL('../../src/runner.worker.js',import.meta.url),'utf8');
const runner=source.match(/const PYTHON_CASE_RUNNER = String\.raw`([\s\S]*?)`;/)[1];
const payload={proposal,partial,reference,tests:regressionTests(),comparisons:[3,0,false,'',[],{},null,{items:[0,false,null]},'"\\\n中文'].map(value=>comparisonTest(inputFor(value)))};
const script=`import json,sys
${runner}
data=json.load(sys.stdin)
def verdicts(code):
    return [json.loads(fc_run_one(code,t['code'])) for t in data['tests']]
good=verdicts(data['reference'])
assert all(t['pass'] for t in good),good
original=verdicts(data['proposal'])
assert sum(t['pass'] for t in original)==12,original
partial=verdicts(data['partial'])
assert sum(t['pass'] for t in partial)==17,partial
assert not partial[7]['pass'],partial[7]
assert all(t['pass'] for t in original[:2])
for index,test in enumerate(data['comparisons']):
    result=json.loads(fc_run_one(data['proposal'],test['code']))
    assert result['pass'],result
    observation=json.loads(result['stdout'].split('TD_REVIEW_RESULT=')[1])
    assert observation['different']==(index in (1,2,3,4,5,6)),(index,observation)
    fixed=json.loads(fc_run_one(data['reference'],test['code']+'\\nassert observation["different"] is False'))
    assert fixed['pass'],fixed
# Dropping validation is not an acceptable fix.
weak='def interpret_tool_reply(reply, expected_id):\\n    if "result" in reply: return {"status":"ok","value":reply["result"]}\\n    return {"status":"invalid"}'
assert not all(t['pass'] for t in verdicts(weak))
# Python equality accepts False == 0. The JSON comparison must not.
coerced=data['reference'].replace('"value": reply["result"]','"value": 0 if reply["result"] is False else reply["result"]')
assert not verdicts(coerced)[3]['pass']
# Separate copies prevent a mutating proposal from contaminating the reference.
mutating='def interpret_tool_reply(reply, expected_id):\\n    reply["result"] = 777\\n    return {"status":"ok","value":777}'
result=json.loads(fc_run_one(mutating,data['comparisons'][0]['code']))
assert result['pass'] and json.loads(result['stdout'].split('TD_REVIEW_RESULT=')[1])['different']
syntax=json.loads(fc_run_one('def invalid(:',data['tests'][0]['code']))
assert not syntax['pass'] and syntax['error_type']=='SyntaxError'
print('PASS 18 golden cases; proposal 12/18, partial 17/18, reference 18/18')
print('PASS 9 counterexample comparisons + repaired regressions, type fidelity, independent inputs, missing validation and syntax errors')
`;
const result=spawnSync(process.env.PYTHON || 'python',['-c',script],{input:JSON.stringify(payload),encoding:'utf8',env:{...process.env,PYTHONIOENCODING:'utf-8',PYTHONUTF8:'1'}});
if(result.stdout)process.stdout.write(result.stdout);
if(result.stderr)process.stderr.write(result.stderr);
assert.equal(result.status,0,'Python checks failed');
for(const locale of ['en','zh']) {
  const html=render(locale);
  assert.ok(html.includes(locale==='en'?'lang="en"':'lang="zh-CN"'));
  assert.ok(html.includes('noindex,nofollow'));
  for(const id of ['stage-0','stage-1','stage-2','stage-3','code-editor','counterexample','compare','run-regression','completion-list','stop']) assert.equal(html.split(`id="${id}"`).length,2,id);
  assert.ok(!html.includes('adsbygoogle') && !html.includes('ymping666') && !html.includes('github.com/ymping666'));
}
if(!process.env.LAB_LOGIC_ONLY){
server.listen(0,'127.0.0.1');await once(server,'listening');
try {
  const base='http://127.0.0.1:'+server.address().port;
  for(const path of ['/','/zh/','/assets/labs/lab.js','/assets/labs/lab.css','/assets/labs/case.mjs','/assets/editor.js','/assets/runner.worker.js','/assets/icon.svg']) {
    const response=await fetch(base+path);assert.equal(response.status,200,path);assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
  }
  for(const path of ['/package.json','/src/probelms.mjs','/assets/nope.js','/.git/config']) assert.equal((await fetch(base+path)).status,404,path);
} finally {server.close();await once(server,'close');}
}
console.log('PASS bilingual page structure, local asset routes, no repository details or ads, and input validation');
