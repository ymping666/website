// Small deterministic examples; all coordinates are zero-based.
const matrix = x => Array.isArray(x) && x.length > 0 && Array.isArray(x[0]) && x[0].length > 0 && x.every(r => Array.isArray(r) && r.length === x[0].length && r.every(Number.isFinite));
export const convPresets = {
 basic:{image:[[1,2,3],[4,5,6],[7,8,9]],kernel:[[1,2,0],[0,-1,1],[0,1,0]]},
 asymmetric:{image:[[1,2]],kernel:[[1,2,3]]},
 identity:{image:[[1,-2],[3,4]],kernel:[[1]]},
 tall:{image:[[1,2],[3,4]],kernel:[[1],[0],[-1],[2],[1]]},
 zero:{image:[[2]],kernel:[[1,1,1],[1,1,1],[1,1,1]]},
 invalid:{image:[],kernel:[[1]]}
};
export function convTrace(image,kernel){
 if(!matrix(image)||!matrix(kernel)||kernel.length%2!==1||kernel[0].length%2!==1)throw new RangeError('Invalid image or kernel');
 const h=image.length,w=image[0].length,kh=kernel.length,kw=kernel[0].length,ph=(kh-1)/2,pw=(kw-1)/2,rows=[];
 const output=Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>{const terms=[];let value=0;for(let a=0;a<kh;a++)for(let b=0;b<kw;b++){const r=i+a-ph,c=j+b-pw,padded=r<0||r>=h||c<0||c>=w,pixel=padded?0:image[r][c],weight=kernel[a][b],product=pixel*weight;terms.push({a,b,r,c,padded,pixel,weight,product});value+=product;}rows.push({i,j,terms,value});return value;}));
 const padded=Array.from({length:h+2*ph},(_,i)=>Array.from({length:w+2*pw},(_,j)=>i<ph||i>=ph+h||j<pw||j>=pw+w?0:image[i-ph][j-pw]));
 return {image,kernel,h,w,kh,kw,ph,pw,padded,rows,output};
}
export const pointPresets={basic:{channels:[[[1,2],[3,4]],[[5,6],[7,8]]],weights:[[1,2],[-1,1]],biases:[1,-2]},negative:{channels:[[[-2,-1]],[[3,4]]],weights:[[-1,2]],biases:[-3]},bias:{channels:[[[1,2],[3,4]]],weights:[[0],[0]],biases:[2,-1]},invalid:{channels:[],weights:[[1]],biases:[0]}};
export function pointTrace(channels,weights,biases){
 if(!Array.isArray(channels)||!channels.length||!channels.every(matrix)||channels.some(c=>c.length!==channels[0].length||c[0].length!==channels[0][0].length)||!matrix(weights)||weights[0].length!==channels.length||biases.length!==weights.length||!biases.every(Number.isFinite))throw new RangeError('Invalid channel shapes');
 const h=channels[0].length,w=channels[0][0].length,rows=[];
 const output=weights.map((ws,o)=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>{const terms=ws.map((weight,c)=>({c,pixel:channels[c][i][j],weight,product:channels[c][i][j]*weight})),sum=terms.reduce((s,t)=>s+t.product,0),value=biases[o]+sum;rows.push({o,i,j,terms,sum,bias:biases[o],value});return value;})));
 return {channels,weights,biases,h,w,rows,output};
}
export const poolPresets={basic:{image:[[1,2,9,1],[8,3,2,7],[4,9,0,5],[0,2,6,1]]},negative:{image:[[-5,-2],[-7,-3]]},odd:{image:[[1,2,3,4,999],[5,6,7,8,999],[999,999,999,999,999]]},ties:{image:[[4,4],[4,4]]},invalid:{image:[[1]]}};
export function poolTrace(image,mode){
 if(!matrix(image)||image.length<2||image[0].length<2||!['max','avg'].includes(mode))throw new RangeError('Invalid pooling input');
 const h=image.length,w=image[0].length,oh=Math.floor(h/2),ow=Math.floor(w/2),rows=[];
 const output=Array.from({length:oh},(_,i)=>Array.from({length:ow},(_,j)=>{const terms=[0,1].flatMap(a=>[0,1].map(b=>({r:2*i+a,c:2*j+b,value:image[2*i+a][2*j+b]}))),values=terms.map(t=>t.value),sum=values.reduce((a,b)=>a+b,0),value=mode==='max'?Math.max(...values):sum/4;rows.push({i,j,terms,values,sum,value});return value;}));
 return {image,mode,h,w,oh,ow,rows,output};
}
export const patchPresets={basic:{image:[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]],p:2},wide:{image:[[1,2,3,4],[5,6,7,8]],p:2},pixels:{image:[[1,2],[3,4]],p:1},one:{image:[[1,2],[3,4]],p:2},invalid:{image:[[1,2,3],[4,5,6]],p:2}};
export function patchTrace(image,p){
 if(!matrix(image)||!Number.isInteger(p)||p<=0||image.length%p||image[0].length%p)throw new RangeError('Image must be divisible by patch size');
 const h=image.length,w=image[0].length,gh=h/p,gw=w/p,rows=[];
 for(let pr=0;pr<gh;pr++)for(let pc=0;pc<gw;pc++){const k=pr*gw+pc,terms=[];for(let dr=0;dr<p;dr++)for(let dc=0;dc<p;dc++){const r=pr*p+dr,c=pc*p+dc;terms.push({r,c,dr,dc,j:dr*p+dc,value:image[r][c]});}rows.push({pr,pc,k,terms,values:terms.map(t=>t.value)});}
 return {image,p,h,w,gh,gw,rows,output:rows.map(r=>r.values)};
}
