const own=(o,k)=>Object.hasOwn(o,k);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const nonblank=s=>typeof s==='string'&&s.replace(/^[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+|[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+$/g,'').length>0;
export const pyType=(x,forced)=>forced||(x===null?'NoneType':Array.isArray(x)?'list':object(x)?'dict':typeof x==='boolean'?'bool':typeof x==='number'?(Number.isInteger(x)?'int':'float'):'str');
const gate=(key,pass,detail)=>({key,pass,detail});
// These traces use supplied, finite JSON examples. Type hints preserve Python's
// float/int distinction where JavaScript represents both with one number type.
export function parseTrace(p){
 let payload;const gates=[];try{payload=JSON.parse(p.raw);gates.push(gate('decode',true,payload));}catch{gates.push(gate('decode',false,p.raw));return {kind:'parse',input:p,gates,output:null};}
 const top=object(payload);gates.push(gate('object',top,pyType(payload)));
 if(!top)return {kind:'parse',input:p,gates,output:null};
 const name=nonblank(payload.tool);gates.push(gate('name',name,own(payload,'tool')?payload.tool:null));
 if(!name)return {kind:'parse',input:p,gates,output:null};
 const args=object(payload.arguments);gates.push(gate('arguments',args,own(payload,'arguments')?payload.arguments:null));
 const output=args?{tool:payload.tool,arguments:payload.arguments}:null;
 return {kind:'parse',input:p,payload,gates,dropped:args?Object.keys(payload).filter(k=>!['tool','arguments'].includes(k)):[],output};
}
export function schemaTrace(p){
 const {request,registry}=p,gates=[],name=request.tool,known=own(registry,name);
 gates.push(gate('known',known,name));if(!known)return {kind:'schema',input:p,gates,rows:[],output:'unknown_tool'};
 const schema=registry[name],args=request.arguments,isObject=object(args);gates.push(gate('arguments',isObject,pyType(args)));
 if(!isObject)return {kind:'schema',input:p,gates,rows:[],schema,output:'invalid_arguments'};
 const missing=Object.keys(schema).filter(k=>!own(args,k)),extra=Object.keys(args).filter(k=>!own(schema,k)),keys=missing.length===0&&extra.length===0;
 gates.push(gate('keys',keys,{missing,extra}));
 const rows=Object.entries(schema).map(([key,expected])=>({key,expected,present:own(args,key),value:args[key],actual:own(args,key)?pyType(args[key],p.floatKeys?.includes(key)?'float':undefined):null,checked:false}));
 if(keys){let active=true;for(const r of rows){r.checked=active;r.pass=r.actual===r.expected;if(active&&!r.pass)active=false;}gates.push(gate('types',rows.every(r=>r.pass),rows.filter(r=>r.checked).map(r=>r.key)));}
 return {kind:'schema',input:p,gates,rows,schema,missing,extra,output:keys&&rows.every(r=>r.pass)?'ok':'invalid_arguments'};
}
export function rpcTrace(p){
 const {message:m,expected}=p,gates=[],valid=()=>({kind:'rpc',input:p,gates,output:'invalid'});
 const envelope=object(m)&&m.jsonrpc==='2.0';gates.push(gate('version',envelope,object(m)?m.jsonrpc:null));if(!envelope)return valid();
 const a=pyType(m.id,p.idType),e=pyType(expected,p.expectedType),id=own(m,'id')&&['int','str'].includes(e)&&a===e&&m.id===expected;
 gates.push(gate('id',id,{actual:m.id,actualType:a,expected,expectedType:e}));if(!id)return valid();
 const result=own(m,'result'),error=own(m,'error');gates.push(gate('exclusive',result!==error,{result,error}));if(result===error)return valid();
 if(result)return {kind:'rpc',input:p,gates,output:'success'};
 const err=m.error,ok=object(err)&&pyType(err.code,p.codeType)==='int'&&nonblank(err.message);
 gates.push(gate('error',ok,err));return {kind:'rpc',input:p,gates,output:ok?'remote_error':'invalid'};
}
export function mergeTrace(p,count=p.responses.length){
 if(!Array.isArray(p.callIds)||new Set(p.callIds).size!==p.callIds.length||p.callIds.some(x=>typeof x!=='string')||!Array.isArray(p.responses)||p.responses.some(x=>!Array.isArray(x)||x.length!==2||typeof x[0]!=='string')||!Number.isInteger(count)||count<0||count>p.responses.length)throw new RangeError('Invalid merge demonstration');
 const allowed=new Set(p.callIds),first=new Map(),rows=[];
 p.responses.forEach(([id,value],i)=>{let decision='pending';if(i<count){decision=!allowed.has(id)?'unknown':first.has(id)?'duplicate':'accepted';if(decision==='accepted')first.set(id,{value,arrival:i});}rows.push({i,id,value,decision});});
 const slots=p.callIds.map(id=>({id,received:first.has(id),value:first.has(id)?first.get(id).value:null,arrival:first.has(id)?first.get(id).arrival:null}));
 return {kind:'merge',input:p,count,rows,slots,output:slots.map(s=>[s.id,s.value])};
}
export function backoffTrace(p){
 const {outcomes,base,cap}=p;if(!Array.isArray(outcomes)||outcomes.some(x=>typeof x!=='boolean')||![base,cap].every(Number.isFinite)||base<=0||cap<base)throw new RangeError('Invalid backoff demonstration');
 let previous=0,streak=0;const rows=outcomes.map((success,i)=>{const before=previous;streak=success?0:streak+1;const candidate=success?0:before===0?base:2*before;previous=success?0:Math.min(cap,candidate);return {i,success,streak,before,candidate,delay:previous,capped:!success&&candidate>=cap};});
 return {kind:'backoff',input:p,rows,output:rows.map(r=>r.delay)};
}
export const presets={
 parse:{basic:{raw:'{"tool":"search","arguments":{"q":"world model"},"admin":true}'},spaces:{raw:'{"tool":" search ","arguments":{}}'},broken:{raw:'{"tool":'},array:{raw:'[]'},blank:{raw:'{"tool":"  ","arguments":{}}'},missing:{raw:'{"tool":"search"}'},wrongArgs:{raw:'{"tool":"search","arguments":[]}'},empty:{raw:'{"tool":"ping","arguments":{}}'}},
 schema:{basic:{request:{tool:'search',arguments:{query:'ai',limit:true}},registry:{search:{query:'str',limit:'int'}}},valid:{request:{tool:'search',arguments:{query:'ai',limit:3}},registry:{search:{query:'str',limit:'int'}}},float:{request:{tool:'search',arguments:{query:'ai',limit:3}},registry:{search:{query:'str',limit:'int'}},floatKeys:['limit']},unknown:{request:{tool:'shell',arguments:[]},registry:{search:{}}},missing:{request:{tool:'search',arguments:{query:'ai'}},registry:{search:{query:'str',limit:'int'}}},extra:{request:{tool:'search',arguments:{query:'ai',limit:3,admin:true}},registry:{search:{query:'str',limit:'int'}}},array:{request:{tool:'ping',arguments:[]},registry:{ping:{}}},empty:{request:{tool:'ping',arguments:{}},registry:{ping:{}}},boolean:{request:{tool:'flag',arguments:{enabled:false}},registry:{flag:{enabled:'bool'}}}},
 rpc:{basic:{message:{jsonrpc:'2.0',id:1,result:null},expected:1},remote:{message:{jsonrpc:'2.0',id:1,error:{code:-32602,message:'Bad args'}},expected:1},both:{message:{jsonrpc:'2.0',id:1,result:3,error:{code:-1,message:'bad'}},expected:1},neither:{message:{jsonrpc:'2.0',id:1},expected:1},boolean:{message:{jsonrpc:'2.0',id:true,result:1},expected:1},string:{message:{jsonrpc:'2.0',id:'1',result:1},expected:1},float:{message:{jsonrpc:'2.0',id:1,result:1},idType:'float',expected:1},badCode:{message:{jsonrpc:'2.0',id:1,error:{code:true,message:'bad'}},expected:1},blank:{message:{jsonrpc:'2.0',id:1,error:{code:3,message:'  '}},expected:1},version:{message:{jsonrpc:'1.0',id:1,result:1},expected:1},empty:{message:[],expected:1}},
 merge:{basic:{callIds:['a','b','c'],responses:[['b',null],['x',99],['a',7],['b','late'],['c',3]]},missing:{callIds:['a','b','c'],responses:[['c',3],['a',null],['a',99]]},reordered:{callIds:['c','a','b'],responses:[['b',2],['a',1],['c',3]]},empty:{callIds:[],responses:[['x',9]]},silent:{callIds:['a','b'],responses:[]},nested:{callIds:['a'],responses:[['a',{items:[1,2]}],['a',false]]}},
 backoff:{basic:{outcomes:[false,false,false,false,true,false],base:1,cap:5},fraction:{outcomes:[false,false,false,false],base:.5,cap:1.5},success:{outcomes:[true,true,true],base:1,cap:5},empty:{outcomes:[],base:1,cap:5},equal:{outcomes:[false,false,true,false],base:2,cap:2},long:{outcomes:Array(12).fill(false),base:.5,cap:3}}
};
export const traces={parse:parseTrace,schema:schemaTrace,rpc:rpcTrace,merge:mergeTrace,backoff:backoffTrace};
export const fromPreset=(kind,p,value)=>traces[kind](p,value);
export const ids={parse:'tool-call-parser',schema:'tool-schema-enforcer',rpc:'agent-jsonrpc-response',merge:'agent-merge-tool-results',backoff:'agent-exponential-backoff'};
