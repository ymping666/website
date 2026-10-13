import {createServer} from 'node:http';
import {readFile,stat,realpath} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {siteRoot} from '../../scripts/config.mjs';
import {withLabEntry} from '../../src/labs/home-entry.mjs';
import {render} from '../../src/labs/view.mjs';
import {renderHub,renderScenario} from '../../src/labs/scenario-view.mjs';
import {getScenario} from '../../src/labs/scenarios.mjs';
const root = new URL('../../src/labs/', import.meta.url);
const sources = new Map([
  ['/assets/labs/scenarios-round2.mjs',new URL('scenarios-round2.mjs',root)],
  ['/assets/labs/lab.js',new URL('lab.js',root)],['/assets/labs/lab.css',new URL('lab.css',root)],['/assets/labs/case.mjs',new URL('case.mjs',root)],
  ['/assets/labs/scenarios.mjs',new URL('scenarios.mjs',root)],['/assets/labs/scenario-ui.js',new URL('scenario-ui.js',root)],['/assets/labs/scenarios.css',new URL('scenarios.css',root)],
  ['/assets/labs/home-entry.css',new URL('home-entry.css',root)],
  ['/assets/styles.css',new URL('../styles.css',root)],
  ['/assets/editor.js',new URL('../editor.js',root)],
  ['/assets/runner.worker.js',new URL('../runner.worker.js',root)],
  ['/assets/icon.svg',new URL('../brand/icon.svg',root)],
]);
const mime = file => ({'.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png','.ico':'image/x-icon','.txt':'text/plain','.xml':'application/xml','.woff2':'font/woff2'}[extname(file)]||'application/octet-stream');
export const server = createServer(async(req,res)=>{
  const path = new URL(req.url,'http://localhost').pathname;
  const headers = {'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'};
  try {
    const html=body=>res.writeHead(200,{...headers,'Content-Type':'text/html; charset=utf-8'}).end(body.replace(/(href|src)="\/(lab\.css|scenarios\.css|home-entry\.css|scenario-ui\.js|lab\.js)"/g,'$1="/assets/labs/$2"'));
    if(path==='/labs/' || path==='/zh/labs/') return html(renderHub(path.startsWith('/zh/')?'zh':'en'));
    if(path==='/review/' || path==='/zh/review/') return html(render(path.startsWith('/zh/')?'zh':'en').replace('href="/" lang="en"','href="/review/" lang="en"').replace('href="/zh/" lang="zh-CN"','href="/zh/review/" lang="zh-CN"'));
    const match=path.match(/^\/(zh\/)?labs\/([a-z-]+)\/$/);
    if(match && getScenario(match[2])) return html(renderScenario(getScenario(match[2]),match[1]?'zh':'en'));
    if(sources.has(path)) return res.writeHead(200,{...headers,'Content-Type':mime(path)+'; charset=utf-8'}).end(await readFile(sources.get(path)));
    // Only expose build output; source files and repository metadata are inaccessible.
    const buildRoot=resolve(siteRoot);
    let file=resolve(buildRoot,'.'+decodeURIComponent(path));
    if(file!==buildRoot && !file.startsWith(buildRoot+sep)) return res.writeHead(404,headers).end('Not found');
    if((await stat(file)).isDirectory()) file=resolve(file,'index.html');
    file=await realpath(file);
    if(!file.startsWith(buildRoot+sep)) return res.writeHead(404,headers).end('Not found');
    let contents=await readFile(file);
    if((path==='/' || path==='/zh/') && !contents.toString('utf8').includes('class="home-lab-entry"')) contents=withLabEntry(contents.toString('utf8'),path.startsWith('/zh/')?'zh':'en');
    res.writeHead(200,{...headers,'Content-Type':mime(file)}).end(contents);
  } catch(error) { res.writeHead(error.code==='ENOENT'||error.code==='ENOTDIR'?404:500,headers).end(error.code==='ENOENT'||error.code==='ENOTDIR'?'Not found':'Local preview error'); }
});
if(process.argv[1] && new URL('file:///'+process.argv[1].replaceAll('\\','/')).pathname.endsWith('/serve.mjs')) {
  server.listen(Number(process.env.LAB_PORT || 4191),'127.0.0.1',()=>console.log('Review lab: http://127.0.0.1:'+(process.env.LAB_PORT || 4191)+'/zh/'));
}
