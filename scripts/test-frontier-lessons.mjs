import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { problems } from '../src/problems.mjs';
import { reactTrace, reactPresets, mpcTrace, mpcPresets, bayesTrace, bayesTransitions } from '../src/lesson-frontier-math.mjs';
import { siteRoot, pythonCommand } from './config.mjs';
import { decodeHtml } from './localize.mjs';

const cases = [];
const alphabet = ['thought','action','observation','finish','wait'];
function enumerate(events, depth) {
  cases.push({ kind:'react', args:[events], actual:reactTrace(events).accepted });
  if (depth) for (const event of alphabet) enumerate([...events,event],depth-1);
}
enumerate([],6);
for (const [key,events] of Object.entries(reactPresets)) {
  const trace = reactTrace(events);
  assert.equal(trace.accepted,['valid','short'].includes(key));
  assert.equal(trace.error,({ missing:2, trailing:1, unknown:1 })[key] ?? null);
}
for (const candidates of Object.values(mpcPresets)) for (const horizon of [1,2]) {
  for (let state=-2;state<=2;state+=0.5) for (let target=-2;target<=2;target+=0.5) {
    const actions=candidates.map(a=>a.slice(0,horizon));
    const before=JSON.stringify(actions), trace=mpcTrace(state,actions,target);
    assert.equal(JSON.stringify(actions),before,'Candidate arrays remain unchanged');
    cases.push({ kind:'mpc', args:[state,actions,target], actual:trace });
  }
}
assert.equal(mpcTrace(0,mpcPresets.lookahead.map(a=>a.slice(0,1))).action,1);
assert.equal(mpcTrace().action,2);
assert.deepEqual(mpcTrace().plans.map(p=>p.total),[37,8]);
assert.equal(mpcTrace(0,mpcPresets.tie).action,1);
for (const transition of Object.values(bayesTransitions)) {
  for (let p=0;p<=20;p++) for (let a=0;a<=20;a++) for (let b=0;b<=20;b++) {
    const belief=[p/20,1-p/20], likelihood=[a/20,b/20];
    const before=JSON.stringify([belief,transition,likelihood]);
    const trace=bayesTrace(belief,transition,likelihood);
    assert.equal(JSON.stringify([belief,transition,likelihood]),before);
    assert.ok(Math.abs(trace.predicted.reduce((x,y)=>x+y,0)-1)<1e-12);
    if (trace.posterior) {
      assert.ok(trace.posterior.every(v=>v>=0&&v<=1));
      assert.ok(Math.abs(trace.posterior.reduce((x,y)=>x+y,0)-1)<1e-12);
      if(a===b&&a>0) trace.posterior.forEach((v,j)=>assert.ok(Math.abs(v-trace.predicted[j])<1e-12));
    }
    cases.push({kind:'bayes',args:[belief,transition,likelihood],actual:trace});
  }
}
const refs = Object.fromEntries([
  ['react','react-trace-validator','valid_react_trace'],
  ['mpc','mpc-first-action','mpc_first_action'],
  ['bayes','world-discrete-bayes-filter','belief_update']
].map(([kind,id,name])=>[kind,{solution:problems.find(p=>p.id===id).solution,name}]));
const source=`import json,sys,math
p=json.load(sys.stdin)
funcs={}
for kind,r in p['refs'].items():
    scope={};exec(r['solution'],scope);funcs[kind]=scope[r['name']]
def close(a,b):
    assert math.isclose(a,b,rel_tol=1e-12,abs_tol=1e-12),(a,b)
for case in p['cases']:
    kind=case['kind'];args=case['args'];actual=case['actual']
    if kind=='react':
        assert funcs[kind](*args)==actual,case
    elif kind=='mpc':
        state,candidates,target=args
        expected=funcs[kind](state,candidates,lambda s,a:s+a,lambda s:(s-target)**2)
        assert expected==actual['action'],case
        for actions,plan in zip(candidates,actual['plans']):
            s=state;total=0;close(plan['states'][0],state)
            for a,step in zip(actions,plan['steps']):
                s+=a;c=(s-target)**2;total+=c
                close(step['state'],s);close(step['cost'],c);close(step['total'],total)
            close(plan['total'],total)
    else:
        try: expected=funcs[kind](*args)
        except ValueError:
            assert actual['posterior'] is None and actual['evidence']==0;continue
        assert actual['posterior'] is not None
        for a,b in zip(actual['posterior'],expected):close(a,b)
        belief,T,L=args
        for j in range(len(belief)):
            pred=sum(T[i][j]*belief[i] for i in range(len(belief)))
            close(actual['predicted'][j],pred)
            close(actual['weighted'][j],pred*L[j])
        close(actual['evidence'],sum(actual['weighted']))
print('PASS',len(p['cases']),'frontier traces and every reachable numerical control state match independent Python references')
`;
const result=spawnSync(pythonCommand,['-c',source],{input:JSON.stringify({refs,cases}),encoding:'utf8',maxBuffer:8*1024*1024});
if(result.stdout) process.stdout.write(result.stdout);
assert.equal(result.status,0,result.stderr);
for (const language of ['','zh/']) for (const id of ['react-trace-validator','mpc-first-action','world-discrete-bayes-filter']) {
  const html=await readFile(join(siteRoot,language,'editorials',id,'index.html'),'utf8');
  const code=html.indexOf('<pre class="code-pre">'),visual=html.indexOf('<section class="visual-lesson"'),resources=html.indexOf('<section class="lesson-resources">');
  assert.ok(visual>0&&code>visual&&resources>code);
  assert.equal(decodeHtml(html.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]),problems.find(p=>p.id===id).solution);
  const tests=html.indexOf(language?'代表性测试':'Representative tests');
  assert.ok(tests>code&&resources>tests,'Sources follow code and tests');
  const fragment=html.slice(visual,code);
  assert.match(fragment,/<noscript>/);
  assert.match(fragment,/<(?:select|input)[^>]*disabled/);
  assert.doesNotMatch(fragment,/href="https?:|<iframe/);
  if(language) assert.doesNotMatch(fragment,/Start: expect thought|Complete and valid|Prior belief|Total cost|First action eligible|State before event/);
}
console.log('PASS six bilingual frontier editorials, unmodified Python, local interactive assets and complete static fallbacks');
