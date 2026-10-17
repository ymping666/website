export const episodePresets={start:[],repair:[false],success:[false,true],exhausted:[false,false,false],afterSuccess:[true,false],overBudget:[false,false,false,false]};
export function episodeTrace(history,limit){
 const exceeded=history.length>limit,afterSuccess=history.slice(0,-1).some(Boolean);
 const error=exceeded||afterSuccess,passed=history.some(Boolean),exhausted=history.length>=limit;
 return {history:[...history],limit,exceeded,afterSuccess,error,passed,exhausted,output:error?null:passed||exhausted?'private_eval':'retry'};
}
export const rewardStates={intermediate:[true,false,false],invalid:[false,false,false],success:[true,true,true],failure:[true,true,false],finalInvalid:[false,true,false]};
export const tokenPresets={positive:{policy:[-1,-3],reference:[-2,-4]},negative:{policy:[-4,-2],reference:[-2,-1]},mixed:{policy:[-1,-3,-1],reference:[-2,-2,-3]},cancel:{policy:[0,0,-1e16],reference:[-1e16,-1,0]}};
// Neumaier compensation keeps the unit residual in [1e16, 1, -1e16].
export function compensatedSum(values){let total=0,correction=0;for(const x of values){const next=total+x;correction+=Math.abs(total)>=Math.abs(x)?(total-next)+x:(x-next)+total;total=next;}return total+correction;}
export function rewardTrace(valid,terminal,allPass,policy,reference,beta){
 const base=terminal?(allPass?1:-1):(valid?0:-0.2),ratios=policy.map((p,i)=>p-reference[i]);
 const sum=compensatedSum(ratios),mean=sum/ratios.length,penalty=beta*mean;
 return {valid,terminal,allPass,policy,reference,beta,base,ratios,sum,mean,penalty,output:base-penalty};
}
export const advantagePresets={penalties:{rewards:[-0.2,-0.1,1],values:[0.1,0.2,0.3]},sparse:{rewards:[0,0,1],values:[0,0,0]},failure:{rewards:[0,-1],values:[0,0]},negative:{rewards:[1],values:[2]},own:{rewards:[1,2],values:[10,20]},empty:{rewards:[],values:[]}};
export function advantageTrace(rewards,values){
 let remaining=0;const returns=Array(rewards.length).fill(0),output=Array(rewards.length).fill(0);
 for(let t=rewards.length-1;t>=0;t--){remaining+=rewards[t];returns[t]=remaining;output[t]=remaining-values[t];}
 return {rewards,values,returns,output};
}
