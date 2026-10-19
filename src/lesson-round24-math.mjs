const finite=x=>typeof x==='number'&&Number.isFinite(x);
const vector=x=>Array.isArray(x)&&x.every(finite);
const matrix=(a,d)=>Array.isArray(a)&&a.every(row=>vector(row)&&row.length===d);
const fail=()=>{throw new RangeError('Input violates the exercise contract');};
const stats=(batch,d)=>Array.from({length:d},(_,j)=>{const mean=batch.reduce((s,r)=>s+r[j],0)/batch.length,variance=batch.reduce((s,r)=>s+(r[j]-mean)**2,0)/batch.length;return {j,mean,variance};});
export const trainPresets={
 basic:{batch:[[1,10],[3,14],[5,18]],gamma:[1,2],beta:[0,1],eps:.01},
 constant:{batch:[[7,2],[7,6]],gamma:[3,-2],beta:[2,1],eps:.01},
 single:{batch:[[5,10]],gamma:[2,3],beta:[7,8],eps:.01},
 zeroGain:{batch:[[1,2],[3,6]],gamma:[0,2],beta:[7,1],eps:.01},
 emptyWidth:{batch:[[],[]],gamma:[],beta:[],eps:.01},
 invalid:{batch:[],gamma:[1],beta:[0],eps:.01}
};
export function trainTrace(batch,gamma,beta,eps){
 if(!vector(gamma)||!vector(beta)||gamma.length!==beta.length||!matrix(batch,gamma.length)||!batch.length||!finite(eps)||eps<=0)fail();
 const b=batch.length,d=gamma.length,channels=stats(batch,d).map(r=>({...r,denominator:Math.sqrt(r.variance+eps)}));
 const rows=batch.flatMap((row,i)=>row.map((x,j)=>{const c=channels[j],centered=x-c.mean,normalized=centered/c.denominator,scaled=gamma[j]*centered/c.denominator,value=scaled+beta[j];return {i,j,x,mean:c.mean,variance:c.variance,denominator:c.denominator,centered,normalized,scaled,gamma:gamma[j],beta:beta[j],value};}));
 const output=batch.map((row,i)=>row.map((_,j)=>rows[i*d+j].value));return {kind:'train',batch,gamma,beta,eps,b,d,channels,rows,output};
}
export const evalPresets={
 basic:{batch:[[4,6],[10,2]],mean:[0,4],variance:[4,1],gamma:[1,2],beta:[0,1],eps:.01},
 single:{batch:[[11]],mean:[10],variance:[1],gamma:[1],beta:[0],eps:.01},
 zeroVariance:{batch:[[3],[4]],mean:[3],variance:[0],gamma:[5],beta:[2],eps:.01},
 zeroGain:{batch:[[3],[4]],mean:[0],variance:[4],gamma:[0],beta:[2],eps:.01},
 empty:{batch:[],mean:[0],variance:[1],gamma:[1],beta:[0],eps:.01},
 emptyWidth:{batch:[[],[]],mean:[],variance:[],gamma:[],beta:[],eps:.01},
 invalid:{batch:[[1]],mean:[0],variance:[-1],gamma:[1],beta:[0],eps:.01}
};
export function evalTrace(batch,mean,variance,gamma,beta,eps){
 const d=gamma?.length;if(![mean,variance,gamma,beta].every(vector)||[mean,variance,beta].some(a=>a.length!==d)||variance.some(x=>x<0)||!matrix(batch,d)||!finite(eps)||eps<=0)fail();
 const b=batch.length,channels=mean.map((m,j)=>({j,mean:m,variance:variance[j],denominator:Math.sqrt(variance[j]+eps)}));
 const rows=batch.flatMap((row,i)=>row.map((x,j)=>{const c=channels[j],centered=x-c.mean,normalized=centered/c.denominator,scaled=gamma[j]*centered/c.denominator,value=scaled+beta[j];return {i,j,x,mean:c.mean,variance:c.variance,denominator:c.denominator,centered,normalized,scaled,gamma:gamma[j],beta:beta[j],value};}));
 const output=batch.map((row,i)=>row.map((_,j)=>rows[i*d+j].value)),alone=batch.length?batch[0].map((x,j)=>gamma[j]*(x-mean[j])/Math.sqrt(variance[j]+eps)+beta[j]):[];
 return {kind:'eval',batch,mean,variance,gamma,beta,eps,b,d,channels,rows,output,alone};
}
export const adamPresets={
 basic:{p:2,g:1,m:0,v:0,step:1,lr:.1,b1:.9,b2:.99,eps:1e-8,decay:.5},
 history:{p:1,g:-3,m:1,v:4,step:2,lr:.1,b1:.5,b2:.5,eps:.01,decay:.2},
 zeroGradient:{p:2,g:0,m:0,v:0,step:1,lr:.1,b1:.9,b2:.99,eps:1e-8,decay:.5},
 momentum:{p:2,g:0,m:1,v:2,step:3,lr:.1,b1:.9,b2:.99,eps:1e-8,decay:.2},
 zeroLr:{p:3,g:4,m:0,v:0,step:1,lr:0,b1:.9,b2:.99,eps:1e-8,decay:.1},
 invalid:{p:1,g:1,m:0,v:0,step:0,lr:.1,b1:.9,b2:.99,eps:1e-8,decay:.5}
};
export function adamTrace(p,g,m,v,step,lr,b1,b2,eps,decay){
 if(![p,g,m,v,lr,b1,b2,eps,decay].every(finite)||!Number.isInteger(step)||step<1||v<0||b1<=0||b1>=1||b2<=0||b2>=1||eps<=0)fail();
 const nextM=b1*m+(1-b1)*g,nextV=b2*v+(1-b2)*g*g,c1=1-b1**step,c2=1-b2**step,mh=nextM/c1,vh=nextV/c2,denominator=Math.sqrt(vh)+eps,adaptive=lr*mh/denominator,decayAmount=lr*decay*p,decayed=p*(1-lr*decay),value=decayed-adaptive;
 return {kind:'adam',p,g,m,v,step,lr,b1,b2,eps,decay,rows:[{nextM,nextV,c1,c2,mh,vh,denominator,adaptive,decayAmount,decayed,value}],output:[value,nextM,nextV]};
}
export const noisePresets={
 basic:{mean:2,variance:4,noise:.5,timestep:3},negative:{mean:3,variance:9,noise:-1,timestep:5},
 final:{mean:3,variance:9,noise:20,timestep:0},variance:{mean:0,variance:16,noise:1,timestep:1},
 zeroVariance:{mean:4,variance:0,noise:5,timestep:5},tiny:{mean:0,variance:1e-16,noise:.5,timestep:3},
 invalid:{mean:0,variance:-1,noise:1,timestep:3}
};
export function noiseTrace(mean,variance,noise,timestep){
 if(![mean,variance,noise].every(finite)||variance<0||!Number.isInteger(timestep)||timestep<0)fail();
 const sigma=Math.sqrt(variance),raw=sigma*noise,final=timestep===0,applied=final?0:raw,value=final?mean:mean+applied;
 return {kind:'noise',mean,variance,noise,timestep,rows:[{sigma,raw,final,applied,value}],output:value};
}
export const returnPresets={
 basic:{rewards:[1,2,50],terminals:[false,true,false],gamma:.5,bootstrap:100},
 continuing:{rewards:[1,2,3],terminals:[false,false,false],gamma:.5,bootstrap:4},
 first:{rewards:[3,100],terminals:[true,false],gamma:.9,bootstrap:50},
 signed:{rewards:[2,-4,3],terminals:[false,false,false],gamma:.5,bootstrap:-2},
 empty:{rewards:[],terminals:[],gamma:.8,bootstrap:7},
 invalid:{rewards:[1,2],terminals:[true],gamma:.5,bootstrap:4}
};
export function returnTrace(rewards,terminals,gamma,bootstrap){
 if(!vector(rewards)||!Array.isArray(terminals)||terminals.some(x=>typeof x!=='boolean')||terminals.length!==rewards.length||!finite(gamma)||gamma<0||gamma>1||!finite(bootstrap))fail();
 let rewardSum=0,weight=1,stopped=false,terminalIndex=-1,usedCount=0;
 const rows=rewards.map((reward,i)=>{if(stopped)return {i,reward,terminal:terminals[i],used:false,weight:null,contribution:null,total:null};const contribution=weight*reward;rewardSum+=contribution;usedCount++;const row={i,reward,terminal:terminals[i],used:true,weight,contribution,total:rewardSum};if(terminals[i]){stopped=true;terminalIndex=i;}else weight*=gamma;return row;});
 const bootstrapWeight=stopped?0:weight,bootstrapContribution=stopped?0:weight*bootstrap,output=rewardSum+bootstrapContribution;
 return {kind:'return',rewards,terminals,gamma,bootstrap,rows,usedCount,terminalIndex,rewardSum,bootstrapWeight,bootstrapContribution,output};
}
export const presets={train:trainPresets,eval:evalPresets,adam:adamPresets,noise:noisePresets,return:returnPresets};
export const traces={train:trainTrace,eval:evalTrace,adam:adamTrace,noise:noiseTrace,return:returnTrace};
export function fromPreset(kind,p,value,extra){
 if(kind==='train')return trainTrace(p.batch,p.gamma,p.beta,value??p.eps);
 if(kind==='eval'){const batch=p.batch.map((r,i)=>r.map(x=>x+(i===1?(value??0):0)));return evalTrace(batch,p.mean,p.variance,p.gamma,p.beta,p.eps);}
 if(kind==='adam')return adamTrace(p.p,p.g,p.m,p.v,p.step,p.lr,p.b1,p.b2,p.eps,value??p.decay);
 if(kind==='noise')return noiseTrace(p.mean,p.variance,value??p.noise,extra===undefined?p.timestep:extra?0:(p.timestep||1));
 return returnTrace(p.rewards,extra??p.terminals,value??p.gamma,p.bootstrap);
}
export const initialIndex=(kind,tr)=>(kind==='train'||kind==='eval')&&tr.d>1?1:0;
