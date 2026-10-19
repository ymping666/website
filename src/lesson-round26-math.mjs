const integer=x=>Number.isSafeInteger(x)&&x>=0;
const strings=a=>Array.isArray(a)&&a.every(x=>typeof x==='string');
const fail=()=>{throw new RangeError('Invalid supplied demonstration');};
export const ids={retry:'agent-retry-guard',memory:'agent-memory-window',recall:'rag-recall-k',mrr:'llm-mean-reciprocal-rank',pack:'llm-evidence-context-pack'};
export function retryTrace(p){
 const {history,budget}=p;if(!strings(history)||!integer(budget))fail();
 const hard=history.length>=budget,suffix=history.slice(-3),checked=!hard,streak=history.length>=3&&suffix.every(x=>x==='error');
 const rows=history.map((value,i)=>({i,value,inSuffix:i>=history.length-3}));
 return {kind:'retry',input:p,rows,count:history.length,hard,suffix,checked,streak,reason:hard?'limit':streak?'three':'continue',output:hard||streak};
}
export function memoryTrace(p){
 const {messages,budget}=p;if(!Array.isArray(messages)||!integer(budget)||messages.some(m=>!m||typeof m.role!=='string'||typeof m.content!=='string'||!integer(m.tokens)))fail();
 const systemIndex=messages.findIndex(m=>m.role==='system'),system=messages[systemIndex],systemFits=!system||system.tokens<=budget;
 let remaining=budget-(system&&systemFits?system.tokens:0),blocked=!systemFits,scan=0;
 const rows=messages.map((m,i)=>({...m,i,decision:m.role==='system'?(i===systemIndex?(systemFits?'system':'systemTooLarge'):'extraSystem'):'unvisited',before:null,after:null,scan:null}));
 const kept=[];
 if(systemFits)for(let i=messages.length-1;i>=0;i--){const r=rows[i];if(r.role==='system')continue;if(blocked){r.decision='older';continue;}r.before=remaining;r.scan=scan++;if(r.tokens>remaining){r.decision='blocked';r.after=remaining;blocked=true;}else{r.decision='kept';remaining-=r.tokens;r.after=remaining;kept.push(i);}}
 kept.reverse();const indices=systemFits?[...(system?[systemIndex]:[]),...kept]:[];
 return {kind:'memory',input:p,rows,systemIndex,systemFits,indices,remaining,used:systemFits?budget-remaining:0,output:indices.map(i=>messages[i])};
}
export function packTrace(p){
 const {chunks,costs,budget}=p;if(!strings(chunks)||new Set(chunks).size!==chunks.length||!Array.isArray(costs)||costs.length!==chunks.length||costs.some(x=>!integer(x))||!integer(budget))fail();
 let remaining=budget,stopped=false;const output=[];
 const rows=chunks.map((id,i)=>{const cost=costs[i];if(stopped)return {i,id,cost,decision:'later',before:null,after:null};const before=remaining;if(cost>remaining){stopped=true;return {i,id,cost,decision:'blocked',before,after:remaining};}remaining-=cost;output.push(id);return {i,id,cost,decision:'kept',before,after:remaining};});
 return {kind:'pack',input:p,rows,remaining,used:budget-remaining,output};
}
export function recallTrace(p){
 const {retrieved,relevant,k}=p;if(!strings(retrieved)||!strings(relevant)||!Number.isSafeInteger(k))fail();
 const gold=[...new Set(relevant)],hits=[],seen=new Set(),active=gold.length>0&&k>0;
 const rows=retrieved.map((id,i)=>{const isRelevant=gold.includes(id),inCut=i<Math.max(0,k);let decision=!active?'notEvaluated':!inCut?'outside':!isRelevant?'irrelevant':seen.has(id)?'repeat':'hit';if(decision==='hit'){seen.add(id);hits.push(id);}return {i,rank:i+1,id,isRelevant,inCut,decision};});
 return {kind:'recall',input:p,rows,gold,hits,missing:gold.filter(id=>!seen.has(id)),numerator:hits.length,denominator:gold.length,output:active?hits.length/gold.length:0};
}
export function mrrTrace(p){
 const {ranked,relevant}=p;if(!Array.isArray(ranked)||!Array.isArray(relevant)||ranked.length!==relevant.length||!ranked.every(strings)||!relevant.every(strings))fail();
 const queries=ranked.map((docs,q)=>{const gold=[...new Set(relevant[q])],first=docs.findIndex(id=>gold.includes(id));return {q,gold,firstRank:first<0?null:first+1,rr:first<0?0:1/(first+1),rows:docs.map((id,i)=>({i,rank:i+1,id,isRelevant:gold.includes(id),decision:i===first?'first':first>=0&&i>first?'afterFirst':'beforeFirst'}))};});
 const total=queries.reduce((sum,q)=>sum+q.rr,0);return {kind:'mrr',input:p,queries,rows:queries,total,denominator:queries.length,output:queries.length?total/queries.length:0};
}
const msg=(role,content,tokens)=>({role,content,tokens});
export const presets={
 retry:{basic:{history:['error','ok','error','error','error'],budget:10},limit:{history:['ok','ok','ok'],budget:3},recovery:{history:['error','error','ok','error'],budget:10},short:{history:['error','error'],budget:10},empty:{history:[],budget:5},zero:{history:[],budget:0},caseSensitive:{history:['error','Error','error'],budget:10}},
 memory:{basic:{messages:[msg('system','rules',2),msg('user','old',1),msg('assistant','large',8),msg('user','latest',2)],budget:6},all:{messages:[msg('user','question',1),msg('assistant','answer',2)],budget:3},oversized:{messages:[msg('system','rules',9),msg('user','latest',1)],budget:8},multiple:{messages:[msg('system','first rules',2),msg('user','question',1),msg('system','later rules',1),msg('assistant','answer',1)],budget:4},lateSystem:{messages:[msg('user','earlier',1),msg('system','rules',2),msg('assistant','latest',1)],budget:4},zero:{messages:[msg('system','rules',0),msg('user','free',0),msg('assistant','costly',1),msg('user','latest free',0)],budget:0},empty:{messages:[],budget:5}},
 recall:{basic:{retrieved:['a','a','x','b','c'],relevant:['a','b','c','c'],k:4},reordered:{retrieved:['b','a','a','x','c'],relevant:['a','b','c'],k:4},miss:{retrieved:['x','y'],relevant:['a','b'],k:2},emptyGold:{retrieved:['a'],relevant:[],k:1},empty:{retrieved:[],relevant:['a'],k:3},negative:{retrieved:['a'],relevant:['a'],k:-1}},
 mrr:{basic:{ranked:[['x','a','b'],['b','x'],['x','z']],relevant:[['a','b'],['b'],['c']]},duplicates:{ranked:[['x','x','a'],['a','a','b']],relevant:[['a'],['a','b']]},miss:{ranked:[['x'],[]],relevant:[['a'],['b']]},emptyGold:{ranked:[['a']],relevant:[[]]},empty:{ranked:[],relevant:[]}},
 pack:{basic:{chunks:['a','b','c'],costs:[3,8,1],budget:5},exact:{chunks:['a','b','c'],costs:[3,4,2],budget:7},first:{chunks:['a','b'],costs:[6,1],budget:5},zero:{chunks:['a','b','c'],costs:[0,1,0],budget:0},all:{chunks:['a','b','c'],costs:[2,1,2],budget:8},empty:{chunks:[],costs:[],budget:5}}
};
export const traces={retry:retryTrace,memory:memoryTrace,recall:recallTrace,mrr:mrrTrace,pack:packTrace};
export function fromPreset(kind,p,options={}){const input=structuredClone(p);if(kind==='retry'){const count=options.count??input.history.length;if(!integer(count)||count>input.history.length)fail();input.history=input.history.slice(0,count);input.budget=options.budget??input.budget;}if(kind==='memory'||kind==='pack')input.budget=options.budget??input.budget;if(kind==='recall')input.k=options.k??input.k;if(kind==='mrr'&&options.promote){const q=options.query??0;if(!integer(q)||q>=input.ranked.length)fail();const first=input.ranked[q].findIndex(id=>input.relevant[q].includes(id));if(first>0){const [doc]=input.ranked[q].splice(first,1);input.ranked[q].unshift(doc);}}return traces[kind](input);}
