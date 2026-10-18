// Deterministic video-component traces. No encoder, generator or model is trained.
const framesValid=frames=>Array.isArray(frames)&&frames.every(row=>Array.isArray(row)&&row.length===(frames[0]?.length||0)&&row.every(Number.isFinite));
export const deltaPresets={basic:{frames:[[1,2],[4,0],[3,5]]},constant:{frames:[[2,2],[2,2],[2,2]]},negative:{frames:[[5],[-1],[-3]]},single:{frames:[[7,1]]},zero:{frames:[[],[],[]]},empty:{frames:[]}};
export function deltaTrace(frames){
 if(!framesValid(frames))throw new RangeError('Inconsistent frames');
 const rows=frames.slice(1).map((next,i)=>({t:i+1,old:frames[i],next,delta:next.map((v,d)=>v-frames[i][d])}));
 return {frames,rows,d:frames[0]?.length||0,output:rows.map(r=>r.delta)};
}
export const flattenPresets={basic:{codes:[[[9,1],[0,9]],[[4,2],[2,0]]]},wide:{codes:[[[1,2,3],[4,5,6]]]},repeat:{codes:[[[0,0]],[[0,0]]]},single:{codes:[[[7]]]},invalid:{codes:[]}};
export function flattenTrace(codes){
 if(!Array.isArray(codes)||!codes.length||!codes.every(framesValid)||!codes[0].length||!codes[0][0].length||codes.some(frame=>frame.length!==codes[0].length||frame[0].length!==codes[0][0].length)||codes.some(frame=>frame.some(row=>!row.every(Number.isInteger))))throw new RangeError('Invalid code grid');
 const h=codes[0].length,w=codes[0][0].length,rows=[];
 codes.forEach((frame,t)=>frame.forEach((row,y)=>row.forEach((token,x)=>rows.push({t,y,x,k:t*h*w+y*w+x,token}))));
 return {codes,h,w,rows,output:rows.map(r=>r.token)};
}
export const patchPresets={basic:{frames:[[1,2],[3,4],[5,6],[7,8],[99,100]],p:2},short:{frames:[[1,2]],p:2},zero:{frames:[[],[],[],[],[]],p:2},empty:{frames:[],p:2},invalid:{frames:[[1],[2,3]],p:2}};
export function patchTrace(frames,p){
 if(!framesValid(frames)||!Number.isInteger(p)||p<=0)throw new RangeError('Invalid temporal patch');
 const d=frames[0]?.length||0,count=Math.floor(frames.length/p),rows=[];
 for(let g=0;g<count;g++){const terms=[];for(let j=0;j<p;j++)for(let c=0;c<d;c++)terms.push({t:g*p+j,c,j:j*d+c,value:frames[g*p+j][c]});rows.push({g,start:g*p,end:(g+1)*p,terms,values:terms.map(t=>t.value)});}
 return {frames,p,d,count,used:count*p,dropped:frames.length-count*p,rows,output:rows.map(r=>r.values)};
}
export const contextPresets={basic:{tokens:[9,0,4,9,2],size:2},repeats:{tokens:[0,0,0],size:2},zero:{tokens:[1,2,3],size:0},wide:{tokens:[4,5,6],size:5},single:{tokens:[7],size:3},empty:{tokens:[],size:2},invalid:{tokens:[1,1.5],size:2}};
export function contextTrace(tokens,size){
 if(!Array.isArray(tokens)||!tokens.every(Number.isInteger)||!Number.isInteger(size)||size<0)throw new RangeError('Invalid context');
 const rows=tokens.map((token,i)=>{const start=Math.max(0,i-size);return {i,token,start,end:i,indices:Array.from({length:i-start},(_,j)=>start+j),context:tokens.slice(start,i)};});
 return {tokens,size,rows,output:rows.map(r=>r.context)};
}
export const nllPresets={basic:{probabilities:[[.1,.7,.2],[.5,.25,.25]],targets:[1,0]},wrong:{probabilities:[[.9,.1]],targets:[1]},certain:{probabilities:[[1,0],[0,1]],targets:[0,1]},uniform:{probabilities:[[.5,.5],[.5,.5]],targets:[0,1]},tiny:{probabilities:[[1e-12,1-1e-12]],targets:[0]},near:{probabilities:[[1-1e-8,1e-8]],targets:[0]},error:{probabilities:[[1,0]],targets:[1]},empty:{probabilities:[],targets:[]}};
export function adjustProbability(probabilities,targets,index,value){
 if(!Number.isFinite(value)||value<0||value>1)throw new RangeError('Invalid probability');
 return probabilities.map((row,t)=>{if(t!==index)return row.slice();const y=targets[t],other=row.reduce((sum,v,k)=>sum+(k===y?0:v),0);return row.map((v,k)=>k===y?value:other>0?(1-value)*(v/other):(1-value)/(row.length-1));});
}
export function nllTrace(probabilities,targets){
 if(!Array.isArray(probabilities)||!Array.isArray(targets)||probabilities.length!==targets.length||probabilities.some((row,t)=>!Array.isArray(row)||!row.length||!row.every(v=>Number.isFinite(v)&&v>=0&&v<=1)||Math.abs(row.reduce((a,b)=>a+b,0)-1)>1e-9||!Number.isInteger(targets[t])||targets[t]<0||targets[t]>=row.length))throw new RangeError('Invalid probability shapes');
 const rows=probabilities.map((distribution,t)=>{const target=targets[t],probability=distribution[target];if(probability<=0)throw new RangeError('zero probability for target token');return {t,target,distribution,probability,loss:-Math.log(probability)};});
 const sum=rows.reduce((a,r)=>a+r.loss,0);return {probabilities,targets,rows,sum,output:rows.length?sum/rows.length:0};
}
