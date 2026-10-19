const finite=x=>typeof x==='number'&&Number.isFinite(x),int=x=>Number.isSafeInteger(x)&&x>=0;
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),strings=x=>Array.isArray(x)&&x.every(y=>typeof y==='string');
const fail=()=>{throw new RangeError('Input violates the supplied exercise contract');};
// Python compares strings by Unicode code point, not JavaScript UTF-16 units.
export function lex(a,b){const x=Array.from(a),y=Array.from(b);for(let i=0;i<Math.min(x.length,y.length);i++){const d=x[i].codePointAt(0)-y[i].codePointAt(0);if(d)return d;}return x.length-y.length;}
export const ids={action:'world-model-action',regret:'world-model-evaluation',ready:'agent-plan-ready',schedule:'agent-topological-schedule',reflection:'agent-reflection-controller',epsilon:'foundation-epsilon-greedy'};
export function actionTrace(p){
 const {predictions,gamma}=p;if(!object(predictions)||!finite(gamma)||gamma<0||gamma>1||Object.values(predictions).some(x=>!Array.isArray(x)||x.some(c=>!finite(c)||c<0)))fail();
 const rows=Object.keys(predictions).sort(lex).map(name=>{let total=0;const terms=predictions[name].map((cost,t)=>{const weight=gamma**t,part=weight*cost;total+=part;return {t,cost,weight,part,total};});return {name,terms,score:total};});
 const best=rows.length?Math.min(...rows.map(r=>r.score)):null,output=rows.find(r=>r.score===best)?.name??null;
 return {kind:'action',input:p,rows,best,output};
}
export function regretTrace(p){
 const {predicted,truth}=p;if(!object(predicted)||!object(truth)||!Object.keys(predicted).length||Object.keys(predicted).length!==Object.keys(truth).length||Object.keys(predicted).some(k=>!Object.hasOwn(truth,k))||![...Object.values(predicted),...Object.values(truth)].every(finite))fail();
 const names=Object.keys(predicted).sort(lex),minPrediction=Math.min(...Object.values(predicted)),action=names.find(k=>predicted[k]===minPrediction),bestTrue=Math.min(...Object.values(truth)),regret=truth[action]-bestTrue;
 const rows=names.map(name=>({name,predicted:predicted[name],truth:truth[name],chosen:name===action,oracle:truth[name]===bestTrue}));
 return {kind:'regret',input:p,rows,action,bestTrue,selectedTrue:truth[action],output:{action,regret}};
}
function graph(tasks){if(!object(tasks)||Object.values(tasks).some(deps=>!strings(deps)||deps.some(d=>!Object.hasOwn(tasks,d))))fail();return Object.keys(tasks).sort(lex);}
export function scheduleTrace(p){
 const {tasks}=p,names=graph(tasks),deps=new Map(names.map(n=>[n,[...new Set(tasks[n])]])),degree=new Map(names.map(n=>[n,deps.get(n).length])),order=[];
 let ready=names.filter(n=>degree.get(n)===0);const snapshot=(chosen=null)=>({chosen,order:[...order],ready:[...ready],remaining:names.filter(n=>!order.includes(n)).map(name=>({name,degree:degree.get(name)}))}),steps=[snapshot()];
 while(ready.length){const name=ready.shift();order.push(name);for(const child of names)if(deps.get(child).includes(name)){degree.set(child,degree.get(child)-1);if(degree.get(child)===0)ready.push(child);}ready.sort(lex);steps.push(snapshot(name));}
 return {kind:'schedule',input:p,names,rows:names.map(name=>({name,deps:deps.get(name)})),steps,blocked:names.filter(n=>!order.includes(n)),output:order.length===names.length?[...order]:null};
}
export function readyTrace(p){
 const {tasks,completed}=p,names=graph(tasks);if(!strings(completed)||completed.some(x=>!Object.hasOwn(tasks,x)))fail();if(scheduleTrace({tasks}).output===null)fail();
 const done=new Set(completed),rows=names.map(name=>{const deps=[...new Set(tasks[name])],missing=deps.filter(d=>!done.has(d));return {name,deps,missing,done:done.has(name),state:done.has(name)?'done':missing.length?'blocked':'ready'};});
 return {kind:'ready',input:p,rows,output:rows.filter(r=>r.state==='ready').map(r=>r.name)};
}
export function reflectionTrace(p){
 const {scores,budget,target,improvement}=p;if(!Array.isArray(scores)||scores.some(x=>!finite(x)||x<0||x>1)||!int(budget)||!finite(target)||target<0||target>1||!finite(improvement)||improvement<0)fail();
 const last=scores.length?scores.at(-1):null,delta=scores.length>1?scores.at(-1)-scores.at(-2):null,hit=last!==null&&last>=target,exhausted=scores.length>=budget,plateau=delta!==null&&delta<improvement;
 const output=hit?'target_reached':exhausted?'budget_exhausted':plateau?'plateau':'continue',gates=[{key:'target',tested:true,trigger:hit},{key:'budget',tested:!hit,trigger:exhausted},{key:'gain',tested:!hit&&!exhausted,trigger:plateau}];
 return {kind:'reflection',input:p,rows:scores.map((score,i)=>({i,score})),last,delta,gates,output};
}
export function epsilonTrace(p){
 const {q,epsilon,draw,randomIndex}=p;if(!Array.isArray(q)||!q.length||!q.every(finite)||![epsilon,draw].every(finite)||epsilon<0||epsilon>1||draw<0||draw>=1||!int(randomIndex)||randomIndex>=q.length)fail();
 const maximum=Math.max(...q),greedy=q.indexOf(maximum),explore=draw<epsilon,output=explore?randomIndex:greedy;
 return {kind:'epsilon',input:p,rows:q.map((value,i)=>({i,value,greedy:i===greedy,chosen:i===output})),maximum,greedy,explore,output};
}
export const presets={
 action:{basic:{predictions:{left:[1,10],right:[4,1]},gamma:.5},tie:{predictions:{z:[1,2],a:[1,2]},gamma:.5},empty:{predictions:{},gamma:1},emptyPaths:{predictions:{b:[],a:[]},gamma:.75},zero:{predictions:{a:[2,100],b:[4,0]},gamma:0},tiny:{predictions:{b:[1.0000000001],a:[1]},gamma:1},invalid:{predictions:{a:[-1]},gamma:.5}},
 regret:{basic:{predicted:{a:1,b:1.25},truth:{a:5,b:1}},correct:{predicted:{a:1,b:3},truth:{a:2,b:4}},tie:{predicted:{b:1,a:1},truth:{b:2,a:3}},negative:{predicted:{a:-1,b:0},truth:{a:1,b:-2}},trueTie:{predicted:{a:0,b:2},truth:{a:3,b:3}},tiny:{predicted:{a:1.0000000001,b:1},truth:{a:0,b:.0000000001}},invalid:{predicted:{a:1},truth:{b:2}}},
 ready:{basic:{tasks:{draft:[],research:[],publish:['draft','research']},completed:['draft']},initial:{tasks:{draft:[],research:[],publish:['draft','research']},completed:[]},unlock:{tasks:{a:[],b:[],c:['a','b']},completed:['b','a']},duplicates:{tasks:{a:[],b:['a','a']},completed:['a','a']},all:{tasks:{a:[],b:['a']},completed:['a','b']},empty:{tasks:{},completed:[]},invalid:{tasks:{a:['missing']},completed:[]}},
 schedule:{basic:{tasks:{z:[],b:['a'],a:[]}},chain:{tasks:{write:['research'],research:[]}},parallel:{tasks:{z:[],a:[],b:[]}},cycle:{tasks:{a:['b'],b:['a'],c:['b'],root:[]}},self:{tasks:{a:['a']}},duplicates:{tasks:{a:[],b:['a','a']}},empty:{tasks:{}},invalid:{tasks:{a:['missing']}}},
 reflection:{basic:{scores:[.25,.5,.5625],budget:5,target:.875,improvement:.125},target:{scores:[.5,.875],budget:2,target:.875,improvement:.5},budget:{scores:[.25,.5],budget:2,target:.875,improvement:.5},equal:{scores:[.5,.75],budget:4,target:.875,improvement:.25},negative:{scores:[.75,.5],budget:4,target:.875,improvement:0},floating:{scores:[.6,.7],budget:4,target:.9,improvement:.1},empty:{scores:[],budget:3,target:.875,improvement:.125},zero:{scores:[],budget:0,target:.875,improvement:.125},invalid:{scores:[.5],budget:-1,target:.875,improvement:.125}},
 epsilon:{basic:{q:[1,5,3],epsilon:.5,draw:.75,randomIndex:2},explore:{q:[1,5,3],epsilon:1,draw:.75,randomIndex:2},equal:{q:[1,5],epsilon:.5,draw:.5,randomIndex:0},tie:{q:[4,4,1],epsilon:0,draw:.75,randomIndex:2},same:{q:[1,5],epsilon:1,draw:.25,randomIndex:1},negative:{q:[-4,-1,-3],epsilon:0,draw:.25,randomIndex:0},single:{q:[1],epsilon:.25,draw:.75,randomIndex:0},invalid:{q:[],epsilon:.5,draw:.5,randomIndex:0}}
};
export const traces={action:actionTrace,regret:regretTrace,ready:readyTrace,schedule:scheduleTrace,reflection:reflectionTrace,epsilon:epsilonTrace};
export function fromPreset(kind,p,o={}){const x=structuredClone(p);if(kind==='action')x.gamma=o.gamma??x.gamma;if(kind==='regret'){const name=Object.keys(x.predicted).sort(lex)[o.index??0];if(name!==undefined)x.predicted[name]+=o.offset??0;}if(kind==='ready')x.completed=o.completed??x.completed;if(kind==='reflection'){if(x.scores.length&&o.last!==undefined)x.scores[x.scores.length-1]=o.last;x.budget=o.budget??x.budget;x.target=o.target??x.target;x.improvement=o.improvement??x.improvement;}if(kind==='epsilon'){x.epsilon=o.epsilon??x.epsilon;x.draw=o.draw??x.draw;x.randomIndex=o.randomIndex??x.randomIndex;}return traces[kind](x);}
