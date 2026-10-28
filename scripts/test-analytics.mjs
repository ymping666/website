import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import vm from 'node:vm';
import {measurementId, siteAnalytics} from './analytics.mjs';
import {siteRoot, siteBase} from './config.mjs';
import {trackPractice} from '../src/practice-analytics.mjs';

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

const calls=[];
const target={gtag:(...args)=>calls.push(args)};
for(const name of ['practice_run','practice_submit','practice_pass','practice_next']) trackPractice(target,name,'stable-softmax','zh-CN');
assert.deepEqual(calls.map(call=>call[1]),['practice_run','practice_submit','practice_pass','practice_next']);
assert.deepEqual(calls[0][2],{problem_id:'stable-softmax',content_language:'zh',transport_type:'beacon'});
trackPractice(target,'practice_pass','user input with spaces','en');
trackPractice(target,'unknown','stable-softmax','en');
assert.equal(calls.length,4);
assert.doesNotThrow(()=>trackPractice({},'practice_run','stable-softmax','en'));
assert.doesNotThrow(()=>trackPractice({gtag(){throw Error('blocked')}},'practice_run','stable-softmax','en'));
assert.ok((await readFile(join(siteRoot,'assets/practice-analytics.mjs'),'utf8')).includes('trackPractice'));

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
  assert.ok(html.includes(locale ? '题目编号和页面语言' : 'exercise ID and page language'));
}
assert.ok(count>0);
console.log(`PASS GA4 production-only configuration, queue, bilingual disclosure and ${count} HTML heads (base ${siteBase()})`);
