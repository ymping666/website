import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {siteRoot,siteBase} from './config.mjs';

// An OS-assigned port avoids conflicts with local previews and parallel CI jobs.
const server=spawn(process.execPath,['scripts/serve.mjs'],{
 env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']
});
try{
 const origin=await new Promise((resolve,reject)=>{
  let output='';
  const timer=setTimeout(()=>reject(new Error('Favicon HTTP server startup timed out: '+output)),10_000);
  const fail=error=>{clearTimeout(timer);reject(error);};
  server.once('error',fail);
  server.once('exit',code=>fail(new Error(`Preview server exited early: ${code}; ${output}`)));
  server.stderr.on('data',chunk=>{output+=chunk;});
  server.stdout.on('data',chunk=>{
   output+=chunk;
   const match=output.match(/http:\/\/localhost:(\d+)/);
   if(match){clearTimeout(timer);resolve(`http://127.0.0.1:${match[1]}`);}
  });
 });
 const url=origin+siteBase()+'favicon.ico';
 const expected=await readFile(join(siteRoot,'favicon.ico'));
 for(const userAgent of ['Mozilla/5.0','Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)']){
  const response=await fetch(url,{headers:{'User-Agent':userAgent},signal:AbortSignal.timeout(5000)});
  assert.equal(response.status,200);
  assert.equal(response.headers.get('content-type'),'image/x-icon');
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),expected,'Real ICO bytes, not an HTML fallback');
 }
 const missing=await fetch(origin+siteBase()+'favicon-missing.ico',{signal:AbortSignal.timeout(5000)});
 assert.equal(missing.status,404,'Missing icons do not masquerade as a successful page');
 console.log('PASS favicon HTTP: browser and Bingbot User-Agent get 200, image/x-icon and exact ICO bytes');
}finally{
 server.kill();
}
