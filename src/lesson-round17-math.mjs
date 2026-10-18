// Deliberately small supplied-data examples; no model training is simulated.
export const betaPresets={teaching:[.1,.5],paper:[.0001,.02],constant:[.05,.05]};
export function betaTrace(steps,start,end){
 const increment=steps===1?0:(end-start)/(steps-1),output=Array.from({length:steps},(_,i)=>steps===1?start:start+(end-start)*i/(steps-1));
 return {steps,start,end,increment,output};
}
export const alphaPresets={basic:[.1,.2,.3],constant:[.5,.5,.5],small:[.0001,.001,.02],strong:[.9,.9,.9],empty:[]};
export function alphaTrace(betas){let p=1;const previous=[],alphas=betas.map(b=>1-b),output=alphas.map(a=>{previous.push(p);return p*=a;});return {betas,alphas,previous,output};}
export const noisePresets={basic:{predicted:[0,2],target:[1,0]},match:{predicted:[1,-1],target:[1,-1]},signed:{predicted:[-1,1],target:[1,-1]},single:{predicted:[3],target:[1]},empty:{predicted:[],target:[]}};
export function noiseTrace(predicted,target){const errors=predicted.map((v,i)=>v-target[i]),squares=errors.map(v=>v*v),sum=squares.reduce((a,b)=>a+b,0);return {predicted,target,errors,squares,sum,output:predicted.length?sum/predicted.length:0};}
export const swigluPresets={basic:{x:[3,2],gate:[-1,1]},zero:{x:[1,3],gate:[0,0]},negativeX:{x:[-2,2],gate:[2,-2]},extreme:{x:[1,1],gate:[-1000,1000]},empty:{x:[],gate:[]}};
export const sigmoid=g=>g>=0?1/(1+Math.exp(-g)):Math.exp(g)/(1+Math.exp(g));
export function swigluTrace(x,gate){const sig=gate.map(sigmoid),silu=gate.map((g,i)=>g*sig[i]);return {x,gate,sig,silu,output:x.map((v,i)=>v*silu[i])};}
export const maskPresets={negative:{scores:[-2,4,-1],valid:[true,false,true]},trailing:{scores:[1,2,9],valid:[true,true,false]},all:{scores:[-1,0,1],valid:[true,true,true]},large:{scores:[-1e9,0],valid:[true,false]}};
export function stableSoftmax(scores){const m=Math.max(...scores),exp=scores.map(v=>v===-Infinity?0:Math.exp(v-m)),sum=exp.reduce((a,b)=>a+b,0);return exp.map(v=>v/sum);}
export function maskTrace(scores,valid){const masked=scores.map((v,i)=>valid[i]?v:-Infinity),wrong=scores.map((v,i)=>valid[i]?v:0);return {scores,valid,output:masked,probabilities:stableSoftmax(masked),zeroProbabilities:stableSoftmax(wrong)};}
// JSON cannot encode infinities. The displayed result keeps the Python sentinel explicit.
export const serial=value=>JSON.stringify(value,(_,v)=>v===-Infinity?'-inf':v);
