import {siteRoot,siteBase} from './config.mjs';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
const port=Number(process.env.PORT || 4173);
const root=resolve(siteRoot);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.mjs':'application/javascript; charset=utf-8','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
createServer(async(req,res)=>{
  try{
    let path=new URL(req.url,'http://localhost').pathname;
    const base=siteBase();
    if(base!=='/') { if(path===base.slice(0,-1)){res.writeHead(301,{Location:base}).end();return;} if(!path.startsWith(base)){res.writeHead(404).end('Not found');return;} path='/'+path.slice(base.length); }
    let file=resolve(root,'.'+decodeURIComponent(path));
    if(file!==root && !file.startsWith(root+sep)){res.writeHead(403).end('Forbidden');return;}
    let s;try{s=await stat(file);}catch{res.writeHead(404).end('Not found');return;}
    if(s.isDirectory())file=join(file,'index.html');
    const data=await readFile(file);
    const ext=file.slice(file.lastIndexOf('.'));
    res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
  }catch(e){res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Open http://localhost:${port}${siteBase()}`));
