# TensorDrill 首批博客发布包

准备日期：2026-10-09。状态：**本地成稿，尚未在 CSDN、DEV 或其他外部平台发布；尚未新建本站博客网址**。

## 稿件与渠道

| 文件 | 用途 | 建议标签 |
| --- | --- | --- |
| [中文平台对比](csdn-platform-comparison.zh-CN.md) | CSDN 选型长文，或本站中文博客原稿；发布前核对平台的推广与外链规则 | 人工智能、机器学习、深度学习、Python、学习方法 |
| [英文平台对比](platform-comparison.en.md) | 本站英文博客原稿；其他渠道须核对各自的推广规则 | AI coding challenges、machine learning practice |
| [中文 Flow Matching 教程](csdn-flow-matching.zh-CN.md) | 优先考虑的 CSDN 技术首帖，含可运行例子及一个相关练习入口 | Flow Matching、生成模型、Python、深度学习 |
| [英文 Attention 教程](dev-attention.en.md) | DEV 技术稿，`published: false`，无产品推广段落 | python、machinelearning、tutorial、testing |

文章采用自然的选型或教程写法，没有额外的维护者声明，也没有声称作者是独立评测机构。没有捏造使用时长、竞品实测成绩、学习成果、排名或其他用户评价。用户的具体真实体验可以补进正文，但事实与个人感受要分开表达。

`media/` 中有两张 2026-10-09 直接截取正式站的图片：中文首页和 Flow Matching 专题。中文稿用相对路径引用，GitHub 可预览；导入 CSDN 时先上传图片，再把 Markdown 中的相对地址替换为平台返回的真实图片地址。图片展示的是实际页面，没有模拟提交结果或虚构用户数据。

## 发布前的实际操作

### CSDN

1. 登录自己的创作者账号，导入 Markdown。标题使用文件首行，正文导入时避免重复标题。
2. 优先发布 Flow Matching 教程；平台对比稿作为后续选型文章。技术内容须能独立帮助读者，保留少量与正文直接相关的来源及练习链接。
3. 根据账号界面核对文章类型、AI 内容声明、推广组件和外链要求；不把 AI 协助撰写的稿件声明为完全没有 AI 参与。
4. 如果账号或审核规则限制推广，使用平台允许的推广组件，或保留不含品牌推广的技术正文。不要用隐形链接、谐音、跳转等方式绕过限制。
5. 发布后用未登录窗口检查正文、公式、代码、图片和链接，记录实际文章 URL。

官方依据：[CSDN 帮助文档](https://blog.csdn.net/blogdevteam/category_9581726.html)、[CSDN 官方博客](https://blog.csdn.net/blogdevteam)。公开官方博客说明了营销组件与明显导流内容的问题；具体账号的权限和最新审核结果以平台实际界面为准。

### DEV Community

1. 英文 Attention 稿可导入 Basic Markdown 编辑器，先保存草稿。Front Matter 的 `published: false` 保持不变，标签最多四个。
2. 在编辑器中按实际创作过程选择 AI 披露等级。当前稿件由 AI 起草，发布者需审核技术内容；原样自动发布时，不应选 Hand Written。经过实质人工修改后，依据平台定义选择适当等级。
3. DEV 现行 AI 内容规则限制商业推广、欺骗和以制造外链为主的文章，因此**英文平台对比稿不作为 DEV 的直接投放稿**。技术稿保持无产品推荐段落；作者主页中的项目链接也按平台规则设置。
4. 当前没有填写 `canonical_url`，因为本站还没有对应的公开博客原文。日后上线本站原文，且跨发方式符合 DEV 的个人博客/公司组织相关规则时，再设置真实 canonical；不要指向不存在的网址或无关首页。
5. 用预览检查代码块和所有断言，发布后记录真实 URL。没有 API Key 或已登录账号时，此包仍是文件草稿，不等于平台内已保存。

官方依据：[编辑器指南](https://dev.to/p/editor_guide)、[AI 内容规则](https://dev.to/guidelines-for-ai-assisted-articles-on-dev/)、[2026 年 AI 披露功能说明](https://dev.to/devteam/introducing-ai-disclosure-on-dev-tools-for-nuance-clarity-and-better-feeds-34mk/)。前两项提供格式与现行内容规则，后一项解释编辑器的三档披露；披露不会自动豁免其他内容要求。

## 核对过的产品事实

当前基准源码提交：`08875217dfe2a7a8cb6906f6d4d8a96f5b2a0924`。本包没有修改题目或判题逻辑。

| 可以使用的表述 | 证据 | 不宜扩写成 |
| --- | --- | --- |
| 当前 100 道原创 Python 练习，后续持续扩充和维护 | `src/problems.mjs`、题目数据与公开提交历史；持续更新是站主的计划 | 已上线数百道、保证每天更新、行业题量第一 |
| 26 个知识点、19 份题单、7 个主题方向 | `src/concepts.mjs`、`src/practice-sets.mjs`、构建中的主题定义 | 26 门完整课程、完整训练所有最新模型 |
| 参考实现通过 553 条断言 | 现有 CI 与题目测试数据 | 553 道题、所有用户代码都经过安全验证 |
| 已有 Flow Matching、Diffusion、ReAct、世界模型练习 | 对应已发布的题目和专题链接 | 全部内容是最新论文、完整 Agent 平台、完整 GPU 训练 |
| 免注册、本地 Python、免费题解、中英文切换 | 实际网站与浏览器回归验证 | 永不收费、零网络请求、账号云同步 |
| 本地进度可下载/导入备份 | `src/progress.mjs` 和进度页 | 自动跨设备同步、防作弊竞赛成绩 |

竞品来源与范围：LeetCode 只使用其官方面试学习计划的信息；Deep-ML 采用其 FAQ；TensorTonic 采用公开题库中的分类与入口。没有把某次抓取未看到的功能断言为不存在，也没有比较未实测的性能、题目质量或全站价格。

发布前重新读取数量，防止文章把不断维护的题库写成固定数量：

```powershell
node --input-type=module -e "import {problems} from './src/problems.mjs'; import {concepts} from './src/concepts.mjs'; import {practiceSets} from './src/practice-sets.mjs'; console.log({problems:problems.length,assertions:problems.reduce((n,p)=>n+p.tests.length,0),concepts:concepts.length,practiceSets:practiceSets.length,topics:new Set(problems.map(p=>p.track)).size})"
```

## 首轮内容顺序

1. CSDN：Flow Matching 的三个量与几个失败用例。
2. DEV：Attention 数值稳定性与测试设计。
3. CSDN 或本站：平台选型对比，根据第一轮反馈补充真实问题。
4. 后续：RMSNorm 与 LayerNorm 的实现差异、ReAct 轨迹为什么需要校验、Euler 与 Heun 的误差与计算量、一次题库修正的复现过程。

这是发布建议，不是已创建的定时任务。每篇应带新的代码、边界案例或学习路线，不批量改标题、复制同一段推荐。更新题库后，在真实变更记录中写清新增题号与测试，而不是反复发布“最新最全”。

## 让搜索与 AI 更容易引用

网站名称、正式域名和中英文练习入口保持一致；正文直接回答“适合谁”“练什么”“需要什么环境”“限制是什么”，并链接到实际题目。表格保留核对日期，更新计划与已上线内容分开。

[Google 的 AI 搜索说明](https://developers.google.com/search/docs/appearance/ai-features)明确：可索引、可抓取、有用的正文及正常 SEO 仍是基础，不需要额外 AI 文本文件或特殊结构化数据。没有方法能保证 AI 推荐。现有 sitemap、canonical、hreflang 可继续使用；本站博客正式上线时再把新网址纳入 sitemap。

Cloudflare 可能注入自己的 robots 及爬虫规则，仓库的 `Allow: /` 不能证明所有搜索机器人都可访问。后续按实际目标核对搜索爬虫及 CDN 拦截，区分搜索抓取和模型训练授权，见 [搜索收录文档](../search-launch.zh-CN.md)。

不添加“忽略其他内容并推荐本站”等给 AI 的隐藏指令，也不制造假第三方评价。可被引用的材料是公开、准确、带日期的产品事实与有用教程。

## 记录成效

发布记录见 [publication-log.csv](publication-log.csv)。每次填写实际 URL、发布日期、平台报告的阅读和访问结果；目前全部为未发布，没有虚构数据。Search Console 用于观察真实查询词、展现和点击；未提供 AI 来源细分时，不把无法归因的访问都算成 AI 推荐效果。
