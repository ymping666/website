import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {inspectDescriptions,attributes} from './meta-descriptions.mjs';
import {siteRoot,siteBase} from './config.mjs';
import {decorate} from './localize.mjs';

const origin=(process.env.SITE_ORIGIN || 'https://tensordrill.com').replace(/\/$/,'');
const base=siteBase();
const metaTags=html=>[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>attributes(m[0]));
function one(tags,key){
 const matches=tags.filter(tag=>(tag.name||tag.property)===key);
 assert.equal(matches.length,1,`Exactly one ${key}`);
 return matches[0].content;
}
for(const locale of ['en','zh']){
 const png=await readFile(join(siteRoot,`assets/share-cover-${locale}-v1.png`));
 assert.ok(png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Share image is a real PNG');
 assert.equal(png.toString('ascii',12,16),'IHDR');
 assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
 assert.ok(png.length<5_000_000,'Share image stays below 5 MB');
}
const pages=await inspectDescriptions();
for(const page of pages){
 const locale=page.language==='zh-CN'?'zh':'en';
 const tags=metaTags(await readFile(join(siteRoot,page.path),'utf8'));
 const image=one(tags,'og:image');
 assert.equal(image,`${origin}${base}assets/share-cover-${locale}-v1.png`,page.path);
 assert.equal(new URL(image).protocol,'https:');
 assert.equal(one(tags,'twitter:image'),image);
 assert.equal(one(tags,'twitter:card'),'summary_large_image');
 assert.equal(one(tags,'og:image:type'),'image/png');
 assert.equal(one(tags,'og:image:width'),'1200');assert.equal(one(tags,'og:image:height'),'630');
 const alt=one(tags,'og:image:alt');
 assert.equal(one(tags,'twitter:image:alt'),alt);
 assert.ok(alt.includes('TensorDrill'));
 assert.equal(/\p{Script=Han}/u.test(alt),locale==='zh',`Localized image description: ${page.path}`);
}
// Even an origin-less local build emits an absolute, public image URL.
const fixture='<html lang="en"><head><title>TensorDrill</title><meta name="description" content="Practice AI components with Python code and tests."></head><body></body></html>';
const localTags=metaTags(decorate(fixture,'/',{base:'/',origin:''}));
assert.equal(one(localTags,'twitter:image'),'https://tensordrill.com/assets/share-cover-en-v1.png');
console.log(`PASS ${pages.length} HTML share cards: absolute PNG URLs, matching EN/ZH images, dimensions, alt text and large-image cards`);
