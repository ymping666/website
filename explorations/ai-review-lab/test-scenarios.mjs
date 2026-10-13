import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {scenarios,parseScenarioInput,scenarioTest,scenarioComparison} from '../../src/labs/scenarios.mjs';
import {renderHub,renderScenario,scenarioURL} from '../../src/labs/scenario-view.mjs';
import {server} from './serve.mjs';
const runner=readFileSync(new URL('../../src/runner.worker.js',import.meta.url),'utf8').match(/const PYTHON_CASE_RUNNER = String\.raw`([\s\S]*?)`;/)[1];
for(const item of scenarios){
  assert.equal(new Set(item.fixtures.map(f=>f.id)).size,item.fixtures.length);
  for(const f of item.fixtures)assert.deepEqual(parseScenarioInput(item,JSON.stringify(f.input)),f.input,f.id);
  assert.throws(()=>parseScenarioInput(item,'{'),/json/);
  assert.throws(()=>parseScenarioInput(item,'{}'),/shape/);
  assert.throws(()=>parseScenarioInput(item,' '.repeat(8001)),/size/);
}
const [maze,balance,canvas]=scenarios;
for(const input of [ {...maze.initialInput,grid:[]},{...maze.initialInput,grid:['..','.']},{...maze.initialInput,goal:[10,0]},{...maze.initialInput,portals:[[[0,0],[1,1]]]},{...maze.initialInput,grid:['ax']},{...maze.initialInput,start:[false,0]} ])assert.throws(()=>parseScenarioInput(maze,JSON.stringify(input)),/contract/);
for(const input of [{k:0,requests:[]},{k:1,requests:[[2,1],[1,1]]},{k:1,requests:[[0,0]]},{k:1,requests:[[1.5,1]]},{k:1,requests:[[0,1,2]]}])assert.throws(()=>parseScenarioInput(balance,JSON.stringify(input)),/contract/);
for(const input of [{initial:[...canvas.initialInput.initial,...canvas.initialInput.initial],commands:[]},{initial:[],commands:[{op:'zoom'}]},{initial:[],commands:[{op:'undo',extra:true}]},{initial:[],commands:[{op:'move',id:'A',x:Infinity,y:0}]}])assert.throws(()=>parseScenarioInput(canvas,JSON.stringify(input)),/contract/);

const payload=[maze,balance,canvas].map(item=>({id:item.id,mode:item.mode,fn:item.signature.split('(')[0],args:item.args,reference:item.reference,starter:item.starter,partial:item.partial,fixtures:item.fixtures,tests:item.fixtures.map(f=>scenarioTest(item,f)),comparisons:item.fixtures.map(f=>scenarioComparison(item,f.input))}));
const python=`import json, sys, random, copy
${runner}
data=json.load(sys.stdin)
rng=random.Random(20261012)
def maze_oracle(case):
    grid=case['grid']; cells=[(r,c) for r in range(len(grid)) for c in range(len(grid[0])) if grid[r][c]=='.']
    start,goal=tuple(case['start']),tuple(case['goal'])
    if start not in cells or goal not in cells: return -1
    # Independent all-pairs shortest paths; not BFS.
    dist={(a,b):(0 if a==b else 999) for a in cells for b in cells}
    for a in cells:
        for b in cells:
            if abs(a[0]-b[0])+abs(a[1]-b[1])==1: dist[a,b]=1
    for a,b in case['portals']: dist[tuple(a),tuple(b)]=min(dist[tuple(a),tuple(b)],1)
    for k in cells:
        for a in cells:
            for b in cells: dist[a,b]=min(dist[a,b],dist[a,k]+dist[k,b])
    return dist[start,goal] if dist[start,goal]<999 else -1
def balance_oracle(case):
    end=[0]*case['k']; result=[]
    for at,duration in case['requests']:
        free=[i for i,e in enumerate(end) if e<=at]
        chosen=min(free) if free else -1
        result.append(chosen)
        if chosen>=0: end[chosen]=at+duration
    return result
def canvas_oracle(case):
    # A linear state history and cursor, independent of the implementation's two stacks.
    history=[copy.deepcopy(case['initial'])]; pos=0
    for c in case['commands']:
        op=c['op']
        if op=='undo': pos=max(0,pos-1); continue
        if op=='redo': pos=min(len(history)-1,pos+1); continue
        next_state=copy.deepcopy(history[pos])
        index=next((i for i,s in enumerate(next_state) if s['id']==c.get('id',c.get('shape',{}).get('id'))),None)
        if op=='add' and index is None: next_state.append(copy.deepcopy(c['shape']))
        if op=='move' and index is not None: next_state[index].update(x=c['x'],y=c['y'])
        if op=='delete' and index is not None: next_state.pop(index)
        if next_state!=history[pos]: history=history[:pos+1]+[next_state]; pos+=1
    return dict(shapes=history[pos],undo_depth=pos,redo_depth=len(history)-pos-1)
oracles=[maze_oracle,balance_oracle,canvas_oracle]
for case,oracle in zip(data,oracles):
    scope={};exec(case['reference'],scope,scope); fn=scope[case['fn']]
    def invoke(input):
        local=copy.deepcopy(input); actual=fn(*[local[k] for k in case['args']])
        assert local==input,'mutated input'
        return actual
    for f,t,c in zip(case['fixtures'],case['tests'],case['comparisons']):
        assert oracle(f['input'])==f['expected'],(case['id'],f['id'],'incorrect golden expectation')
        result=json.loads(fc_run_one(case['reference'],t['code'])); assert result['pass'],result
        result=json.loads(fc_run_one(case['reference'],c['code']+'\\nassert observation["different"] is False')); assert result['pass'],result
    for label in ['starter','partial']:
        outcomes=[json.loads(fc_run_one(case[label],t['code']))['pass'] for t in case['tests']]
        assert not all(outcomes),(case['id'],label,'must expose a regression')
        print(case['id']+' '+label+': '+str(sum(outcomes))+'/'+str(len(outcomes)))
    for iteration in range(200):
        if case['mode']=='debug':
            rows,cols=rng.randint(1,4),rng.randint(1,4)
            grid=[''.join(rng.choice('...#') for _ in range(cols)) for _ in range(rows)]
            cells=[(r,c) for r in range(rows) for c in range(cols) if grid[r][c]=='.']
            portals=[[rng.choice(cells),rng.choice(cells)] for _ in range(rng.randint(0,5))] if cells else []
            input=dict(grid=grid,start=[rng.randrange(rows),rng.randrange(cols)],goal=[rng.randrange(rows),rng.randrange(cols)],portals=portals)
        elif case['mode']=='review':
            input=dict(k=rng.randint(1,5),requests=sorted([[rng.randint(0,20),rng.randint(1,10)] for _ in range(rng.randint(0,20))],key=lambda r:r[0]))
        else:
            initial=[dict(id='A',x=10,y=10,width=20,height=15)]
            commands=[]
            for _ in range(rng.randint(0,25)):
                op=rng.choice(['add','move','delete','undo','redo']); ident=rng.choice(['A','B','C'])
                c=dict(op=op)
                if op=='add': c['shape']=dict(id=ident,x=rng.randrange(5)*10,y=rng.randrange(5)*10,width=20,height=15)
                elif op=='move': c.update(id=ident,x=rng.randrange(5)*10,y=rng.randrange(5)*10)
                elif op=='delete': c['id']=ident
                commands.append(c)
            input=dict(initial=initial,commands=commands)
        assert invoke(input)==oracle(input),(case['id'],input,invoke(input),oracle(input))
    print('PASS '+case['id']+': golden cases, comparisons, 200 independent-oracle cases, input immutability')
# Mutation checks ensure individual responsibilities are actually exercised.
mutations=[
  (0, data[0]['reference'].replace('pending.popleft()', 'pending.pop()')),
  (0, data[0]['reference'].replace('0 <= nr < rows and 0 <= nc < cols','0 < nr < rows and 0 < nc < cols')),
  (0, data[0]['partial']),
  (1, data[1]['reference'].replace('<= arrival','< arrival')),
  (1, data[1]['partial']),
  (2, data[2]['partial']),
  (2, data[2]['reference'].replace('if shapes != before:', 'if True:')),
  (2, data[2]['reference'].replace('            redo.clear()', '            pass')),
]
for i,code in mutations:
    assert not all(json.loads(fc_run_one(code,t['code']))['pass'] for t in data[i]['tests']),(i,'undetected mutation')
print('PASS 8 targeted mutations')
`;
const result=spawnSync(process.env.PYTHON||'python',['-c',python],{input:JSON.stringify(payload),encoding:'utf8',env:{...process.env,PYTHONIOENCODING:'utf-8',PYTHONUTF8:'1'},maxBuffer:3*1024*1024});
process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');assert.equal(result.status,0,'Python scenario checks failed');
for(const locale of ['en','zh']){
  const hub=renderHub(locale);
  for(const item of scenarios){
    assert.ok(hub.includes(scenarioURL(item.id,locale)));
    const html=renderScenario(item,locale);
    assert.ok(html.includes(item.source.url)&&html.includes(item.company));
    assert.ok(html.includes(locale==='zh'?'原创改编':'Original adaptation'));
    assert.ok(html.includes('noindex,nofollow'));
    for(const id of ['pane-0','pane-1','pane-2','scenario-code','input-visual','experiment-input','run-all','test-results','checklist','stop'])assert.equal(html.split(`id="${id}"`).length,2,id);
    assert.ok(!/ymping666|adsbygoogle|github\.com\/ymping666/.test(html));
  }
}
if(!process.env.LAB_LOGIC_ONLY){
server.listen(0,'127.0.0.1');await once(server,'listening');
try{
  const base='http://127.0.0.1:'+server.address().port;
  for(const path of ['/','/zh/','/labs/','/zh/labs/','/review/','/zh/review/','/assets/labs/scenarios.mjs','/assets/labs/scenario-ui.js','/assets/labs/scenarios.css',...scenarios.flatMap(s=>['en','zh'].map(l=>scenarioURL(s.id,l)))]){const r=await fetch(base+path);assert.equal(r.status,200,path);assert.equal(r.headers.get('x-robots-tag'),'noindex, nofollow');}
  for(const path of ['/labs/unknown/','/zh/labs/unknown/','/.git/config','/scenario-view.mjs'])assert.equal((await fetch(base+path)).status,404,path);
}finally{server.close();await once(server,'close');}
}
console.log('PASS bilingual hub, source disclosures, isolated routes and input validation');
