import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import vm from 'node:vm';
import {measurementId, siteAnalytics} from './analytics.mjs';
import {siteRoot, siteBase} from './config.mjs';

const production = {origin:'https://tensordrill.com', base:'/', branch:'main'};
const tag = siteAnalytics(production);
assert.ok(tag.includes(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`));
for (const origin of ['', 'http://localhost:4195', 'https://ymping666.github.io', 'https://preview.pages.dev', 'https://tensordrill.com.example.org']) {
  assert.equal(siteAnalytics({...production, origin}), '');
}
assert.equal(siteAnalytics({...production, base:'/website/'}), '');
assert.equal(siteAnalytics({...production, branch:'preview'}), '');
const context = vm.createContext({});
vm.runInContext(`window = this; ${tag.match(/<script>([\s\S]*?)<\/script>/)[1]}`, context);
assert.equal(context.dataLayer.length, 2);
assert.equal(context.dataLayer[0][0], 'js');
assert.equal(context.dataLayer[1][0], 'config');
assert.equal(context.dataLayer[1][1], measurementId);

const expected = siteAnalytics();
let count=0;
async function walk(directory) {
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    const path=join(directory,entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith('.html')) {
      const html=await readFile(path,'utf8');
      const head=html.match(/<head>([\s\S]*?)<\/head>/)?.[1];
      const loaders=html.match(/<script\b[^>]*src="https:\/\/www\.googletagmanager\.com\/gtag\/js[^>]*><\/script>/g)||[];
      assert.equal(loaders.length, expected ? 1 : 0,path);
      if(expected) {
        assert.ok(head.startsWith(expected),path+': tag immediately after head');
        assert.equal((html.match(/gtag\('config', 'G-PRJS97CCNN'\)/g)||[]).length,1,path);
      } else assert.ok(!html.includes(measurementId),path+': preview has no production ID');
      count++;
    }
  }
}
await walk(siteRoot);
for(const locale of ['', 'zh/']) {
  const html=await readFile(join(siteRoot,locale,'privacy/index.html'),'utf8');
  assert.ok(html.includes('Google Analytics 4'));
  assert.ok(html.includes('_ga'));
  assert.ok(html.includes('https://tools.google.com/dlpage/gaoptout'));
}
assert.ok(count>0);
console.log(`PASS GA4 production-only configuration, queue, bilingual disclosure and ${count} HTML heads (base ${siteBase()})`);
