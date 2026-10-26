import {mkdir,writeFile,copyFile} from 'node:fs/promises';
import {join} from 'node:path';
import {renderHub,renderScenario} from '../src/labs/scenario-view.mjs';
import {render} from '../src/labs/view.mjs';
import {scenarios} from '../src/labs/scenarios.mjs';
import {decorate,escapeHtml} from './localize.mjs';

export const labPaths=['/labs/',...scenarios.map(s=>`/labs/${s.id}/`),'/review/'];
export const labAssets=['home-entry.css','lab.css','scenarios.css','lab.js','scenario-ui.js','case.mjs','scenarios.mjs','scenarios-round2.mjs'];
const descriptions={
  '/labs/':[
    'Practice AI-assisted coding interviews: read existing Python code, review suggestions, debug and extend projects with visual inputs and tests.',
    '练习 AI 辅助编程面试的新形式：从接手已有 Python 代码开始，理解行为、审查建议、修复问题与迭代功能，结合输入可视化、分阶段测试和完整讲解验证修改。'
  ],
  '/labs/maze-debugging/':[
    'Debug a Python maze solver: fix BFS traversal and boundary checks, then add directed portals with visual inputs, staged tests and a solution.',
    '调试 Python 迷宫最短路径实现，修复 BFS 遍历与边界检查，再支持单向传送门。结合网格可视化、分阶段测试、反例与完整参考题解验证修改。'
  ],
  '/labs/load-balancer-review/':[
    'Review a Python load balancer refactor: test release timing, simultaneous completions and server selection with visual inputs and regression tests.',
    '审查 Python 负载均衡器重构，检查请求到达与服务器释放时机、批量完成和最小 ID 分配规则，通过时间线可视化、分阶段回归测试与参考题解验证修复。'
  ],
  '/labs/canvas-history/':[
    'Extend a Python canvas editor with undo and redo. Preserve add, move and delete behavior using visual experiments, regression tests and a solution.',
    '为已有 Python 图形编辑器添加撤销与重做，保留添加、移动和删除行为。通过画布可视化、历史快照、分阶段回归测试与完整参考题解检查功能迭代。'
  ],
  '/review/':[
    'Review a Python agent tool adapter: find a JSON-RPC counterexample, repair falsey result handling and verify the change with regression tests.',
    '审查 Python Agent 工具响应适配器，针对 JSON-RPC 响应构造反例，修复假值结果判断并保留协议校验，通过回归测试与迁移检查验证修改。'
  ]
};

export function releaseLabHtml(html,path,locale,{base='/',origin='',verification=null}={}) {
  const zh=locale==='zh',prefix=base+(zh?'zh/':'');
  const description=descriptions[path]||scenarios.find(s=>path===`/labs/${s.id}/`)?.description;
  if(!description)throw new Error(`Missing lab description: ${path}`);
  html=html.replace(/<meta name="robots" content="noindex,nofollow">/,'')
    .replace(/ · TensorDrill · (?:Local preview|本地预览)<\/title>/,' | TensorDrill</title>')
    .replace(/>LOCAL PREVIEW</g,'>EXPERIMENTAL<').replace(/>本地预览</g,'>实验中<')
    .replace('Local preview only. No account or paid model API.','Experimental module. No account or paid model API.')
    .replace('仅本地预览，无需账户或付费模型 API。','实验模块，无需账户或付费模型 API。')
    .replace('Local only · Separate draft per exercise','Browser execution · Separate draft per exercise')
    .replace('仅本地 · 每题独立草稿','浏览器运行 · 每题独立草稿')
    .replace('Local prototype · No account or model API key needed','Experimental practice · No account or model API key needed')
    .replace('本地原型 · 无需账户或模型 API 密钥','实验练习 · 无需账户或模型 API 密钥');
  if(path==='/review/')html=html.replace('href="/" lang="en"','href="/review/" lang="en"').replace('href="/zh/" lang="zh-CN"','href="/zh/review/" lang="zh-CN"');
  html=html.replace(/(href|src)="\/([^"\s]*)"/g,(_,attr,target)=>{
    if(labAssets.includes(target))target='assets/labs/'+target;
    return `${attr}="${base}${target}"`;
  });
  const metadata=`<meta name="description" content="${escapeHtml(description[zh?1:0])}">${origin?`<link rel="canonical" href="${escapeHtml(origin+prefix+path.slice(1))}">`:''}${verification?.meta||''}${verification?.script||''}`;
  html=html.replace('</head>',metadata+'</head>');
  const links=[['Privacy policy','隐私政策','privacy'],['Terms of use','使用条款','terms'],['Cookie choices','Cookie 选择','cookies'],['Advertising policy','广告政策','advertising'],['Feedback','意见反馈','contact']];
  html=html.replace('</body>',`<footer class="site-footer"><div>TensorDrill · ${zh?'实验模块':'Experimental module'}</div><nav class="footer-links" aria-label="${zh?'网站政策':'Site policies'}">${links.map(([en,cn,route])=>`<a href="${prefix}${route}/">${zh?cn:en}</a>`).join('')}</nav></footer></body>`);
  return decorate(html,path,{base,origin,locale});
}

export async function buildLabs(out,options){
  await mkdir(join(out,'assets/labs'),{recursive:true});
  for(const name of labAssets)await copyFile(new URL('../src/labs/'+name,import.meta.url),join(out,'assets/labs',name));
  for(const locale of ['en','zh'])for(const path of labPaths){
    const item=scenarios.find(s=>path===`/labs/${s.id}/`);
    const html=path==='/labs/'?renderHub(locale):item?renderScenario(item,locale):render(locale);
    const directory=join(out,locale==='zh'?'zh':'',path.slice(1));
    await mkdir(directory,{recursive:true});
    await writeFile(join(directory,'index.html'),releaseLabHtml(html,path,locale,options));
  }
}
