// Optional asset-authoring step. Normal builds copy the checked-in PNG files.
// Run with sharp installed from the official npm registry: node scripts/generate-share-covers.mjs
import {writeFile,readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const sharp=createRequire(import.meta.url)('sharp');
const icon=(await readFile(new URL('../src/brand/icon.svg',import.meta.url),'utf8')).replace(/<\/?svg[^>]*>|<title>.*?<\/title>/g,'').trim();
const labels={
 en:{font:'Segoe UI',headline:'Build AI. Understand the code.',sub:'From foundations to frontier AI.',left:['AI CODING','Implement the core ideas','Attention · Flow Matching','Agents · World models &amp; more frontier AI'],right:['AI-ASSISTED INTERVIEWS','Read. Review. Debug.','Existing code · Preset AI suggestions','Test fixes and extend features'],footer:'Browser tests   ·   Worked solutions   ·   EN / ZH'},
 zh:{font:'Microsoft YaHei',headline:'理解 AI，从亲手实现开始。',sub:'从基础到前沿：练原理，也练工程判断。',left:['AI 编程练习','从零实现核心组件','Attention · Flow Matching','Agent · 世界模型等前沿方向'],right:['AI 辅助编程面试','读懂代码，验证修改','接手代码 · 审查预设 AI 建议','修复问题与扩展功能，用测试验证'],footer:'浏览器运行   ·   完整题解   ·   中英双语'}
};
for(const [locale,c] of Object.entries(labels)){
 const text=(x,y,size,value,color='#1b2931',weight=400)=>`<text x="${x}" y="${y}" fill="${color}" font-family="${c.font}, sans-serif" font-size="${size}" font-weight="${weight}">${value}</text>`;
 const panel=(x,items,purple)=>`<rect x="${x}" y="330" width="526" height="216" rx="20" fill="${purple?'#f1edfb':'#ffffff'}" stroke="${purple?'#d6c9ef':'#cfe2da'}" stroke-width="2"/>${text(x+28,370,17,items[0],purple?'#6641a4':'#147d64',700)}${text(x+28,416,30,items[1], '#1b2931',700)}${text(x+28,467,22,items[2],'#53636c')}${text(x+28,504,22,items[3],'#53636c')}`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f6faf8"/><path d="M0 0H1200" stroke="#147d64" stroke-width="12"/><g transform="translate(60 48)">${icon}</g>${text(142,94,42,'TensorDrill','#1b2931',700)}${text(1140,88,24,'tensordrill.com','#53636c').replace('<text ','<text text-anchor="end" ')}${text(60,218,locale==='zh'?59:57,c.headline,'#1b2931',700)}${text(62,271,29,c.sub,'#53636c')}${panel(60,c.left,false)}${panel(614,c.right,true)}${text(60,596,22,c.footer,'#53636c')}</svg>`;
 const stem=new URL(`../src/brand/share-cover-${locale}-v1`,import.meta.url);
 await writeFile(new URL(stem.href+'.svg'),svg+'\n');
 await sharp(Buffer.from(svg)).png().toFile(fileURLToPath(new URL(stem.href+'.png')));
 console.log(`Generated share-cover-${locale}-v1.png (1200 × 630)`);
}
